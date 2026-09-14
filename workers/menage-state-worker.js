/**
 * Cloudflare Worker `menage-state` — état du ménage (D1) et données annexes (KV)
 *
 * DÉPLOIEMENT : voir workers/wrangler.menage-state.toml
 *   - binding KV `MENAGE_KV`, binding D1 `DB` (base `menage`, schéma workers/menage-schema.sql)
 *   - secrets ICAL_AIRBNB et ICAL_BOOKING (URL iCal complètes, avec leur token)
 *
 * Ménages (D1, une ligne par date d'arrivée — voir menage-schema.sql) :
 *   GET    /menages                     → { menages: [...], dernierDepart }
 *   POST   /menages/synchro             → enregistre les créneaux calculés par la page
 *   POST   /menages/<arrivée>/fait      → ménage fait ({ par, debut } ; `le` réservé à l'admin)
 *   DELETE /menages/<arrivée>/fait      → annule la validation (le paiement est conservé)
 *   PUT    /menages/<arrivée>/paiement  → admin
 *   DELETE /menages/<arrivée>/paiement  → admin
 *   PUT    /menages/<arrivée>/infos     → admin (personnes, langue, consigne, prénom)
 *
 * Compatibilité :
 *   GET  /       → { _lastCheckout, info_<arrivée>: {...} }, lu par le notifieur Telegram
 *   PUT  /       → ancienne page : seules les validations récentes sont reprises (temporaire)
 *
 * Autres :
 *   GET/PUT /dates, /messages, /agenda-images, /rando-overrides, /evolution (KV)
 *   GET  /ical   → flux iCal Airbnb + Booking fusionnés
 *                  (et mémorise les départs dans D1, voir updateCheckoutsFromFeed)
 *
 * La clé KV `menage_state` (ancien objet JSON unique) n'est plus écrite depuis
 * le 14/09/2026 : elle sert d'archive.
 */

// Ancien état ménage (un seul objet JSON) : archive figée le 14/09/2026, plus lue ni écrite.
// const KV_KEY = 'menage_state';
const KV_KEY_DATES = 'menage_dates';
const KV_KEY_MESSAGES = 'menage_messages';
const KV_KEY_EVOLUTION = 'evolution_state';
const KV_KEY_AGENDA_IMAGES = 'agenda_images';
const KV_KEY_RANDO_OVERRIDES = 'rando_overrides';
const FIREBASE_PROJECT_ID = 'asso-billet-site';
const ADMIN_EMAILS = ['cyril.samson41@gmail.com', 'alisson.pasquier@gmail.com'];

// Flux iCal à fusionner — les URLs (qui contiennent des tokens secrets) sont
// injectées via les secrets du worker : ICAL_AIRBNB et ICAL_BOOKING.
// (Dashboard → worker → Settings → Variables and Secrets, type « Secret ».)
function getIcalFeeds(env) {
    return [env.ICAL_AIRBNB, env.ICAL_BOOKING].filter(Boolean);
}

// Origines autorisées (à ajuster selon tes domaines)
const ALLOWED_ORIGINS = [
    'https://ofildudoubs.fr',
    'https://www.ofildudoubs.fr',
    'http://localhost',
    'http://127.0.0.1',
];

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

// Vérifie un ID token Firebase (RS256 JWT) via les clés publiques Google
async function verifyFirebaseToken(idToken) {
    // 1. Décoder le header pour obtenir le kid
    const [headerB64, payloadB64, sigB64] = idToken.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) throw new Error('Token malformé');

    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (!header.kid) throw new Error('Pas de kid dans le header');

    // 2. Récupérer les clés publiques Google (JWKS)
    const jwksResp = await fetch(
        'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    );
    const jwks = await jwksResp.json();
    const jwk = jwks.keys.find(k => k.kid === header.kid);
    if (!jwk) throw new Error('Clé publique introuvable');

    // 3. Importer la clé publique
    const key = await crypto.subtle.importKey(
        'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );

    // 4. Vérifier la signature
    const data = new TextEncoder().encode(headerB64 + '.' + payloadB64);
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
    if (!valid) throw new Error('Signature invalide');

    // 5. Valider les claims
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) throw new Error('Token expiré');
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('Issuer invalide');
    if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error('Audience invalide');
    if (!ADMIN_EMAILS.includes(payload.email)) throw new Error('Email non autorisé');

    return payload;
}

function aujourdhuiParis() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

// Mémorise les départs vus dans les flux iCal, dans D1 (table `parametres`) :
//   - departs_a_venir : dates de fin (DTEND) encore à venir, remplacées
//     à chaque lecture (une résa annulée disparaît donc de la liste) ;
//   - dernier_depart  : dernier départ passé, au format 'YYYY-MM-DDT11:00:00'.
// Airbnb purge les séjours terminés de son flux parfois dès le matin du départ,
// avant toute visite de la page : en notant les départs à l'avance puis en les
// promouvant une fois passés, le worker garde un dernier départ fiable même si
// personne n'ouvre la page au bon moment.
//
// Depuis la refonte D1, ce dernier départ ne sert plus qu'à AFFICHER le début
// du créneau : un ménage est rangé sous sa date d'arrivée, une erreur ici ne
// peut plus faire perdre une validation.
//
// ⚠ UN BLOCAGE « Not available » D'UN JOUR N'EST PAS UN DÉPART.
// Quand le logement est vide, Airbnb exporte la journée en cours comme un
// blocage d'un jour (J → J+1). Pris pour un départ, son DTEND devenait le
// lendemain un _lastCheckout, qui avançait ainsi d'un jour chaque jour
// jusqu'à la prochaine arrivée : le créneau ménage changeait de clé et ses
// validations « sautaient » (11, 12, 13 septembre 2026). Même règle que
// parseICS dans menage.html et que le notifieur Telegram. Booking exporte
// aussi des `CLOSED - Not available` d'un jour, écartés par la même règle.
//
// L'horizon de 6 mois (celui de la page) écarte les bornes glissantes des
// plateformes, qui réécrivaient l'état chaque jour sans rien apporter.
const HORIZON_DEPARTS_JOURS = 183;

function isOneDayBlock(event, start, end) {
    const summary = (event.match(/SUMMARY:(.*)/) || [])[1] || '';
    return summary.includes('Not available') && (Date.parse(end) - Date.parse(start)) <= 86400000;
}

async function updateCheckoutsFromFeed(env, allEvents) {
    const todayParis = aujourdhuiParis();
    const horizon = new Date(Date.parse(todayParis) + HORIZON_DEPARTS_JOURS * 86400000).toISOString().slice(0, 10);
    const iso = d => `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;

    const feedCheckouts = new Set();
    for (const event of allEvents) {
        const s = event.match(/DTSTART;VALUE=DATE:(\d{8})/);
        const m = event.match(/DTEND;VALUE=DATE:(\d{8})/);
        if (!s || !m) continue;
        const start = iso(s[1]);
        const end = iso(m[1]);
        if (isOneDayBlock(event, start, end)) continue;
        if (end > horizon) continue;
        feedCheckouts.add(end);
    }

    const params = await lireParametres(env);
    const knownFuture = params.departsAVenir;

    // Candidats "départ passé" : DTEND passés encore dans le flux + départs
    // notés à l'avance qui sont devenus passés (même si purgés du flux depuis)
    const pastCandidates = [...feedCheckouts, ...knownFuture].filter(d => d <= todayParis);
    const newFuture = [...feedCheckouts].filter(d => d > todayParis).sort();

    const writes = [];
    if (pastCandidates.length > 0) {
        const lastCheckout = pastCandidates.sort().pop() + 'T11:00:00';
        if (!params.dernierDepart || lastCheckout > params.dernierDepart) {
            // Le WHERE garde la règle « ne recule jamais » même entre deux lectures concurrentes
            writes.push(env.DB.prepare(
                `INSERT INTO parametres (cle, valeur) VALUES ('dernier_depart', ?1)
                 ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur
                 WHERE excluded.valeur > parametres.valeur`
            ).bind(lastCheckout));
        }
    }
    if (JSON.stringify(newFuture) !== JSON.stringify(knownFuture)) {
        writes.push(env.DB.prepare(
            `INSERT INTO parametres (cle, valeur) VALUES ('departs_a_venir', ?1)
             ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur`
        ).bind(JSON.stringify(newFuture)));
    }

    if (writes.length) await env.DB.batch(writes);
}

async function lireParametres(env) {
    const { results } = await env.DB.prepare(
        `SELECT cle, valeur FROM parametres WHERE cle IN ('dernier_depart', 'departs_a_venir')`
    ).all();
    const brut = Object.fromEntries(results.map(r => [r.cle, r.valeur]));
    let departsAVenir = [];
    try {
        const liste = JSON.parse(brut.departs_a_venir || '[]');
        if (Array.isArray(liste)) departsAVenir = liste;
    } catch (ignore) { /* valeur illisible : on repart d'une liste vide */ }
    return { dernierDepart: brut.dernier_depart || null, departsAVenir };
}

function jsonResponse(body, status, corsHeaders) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// =====================================================================
// MÉNAGES (D1)
// =====================================================================
// Toutes les écritures ciblent des colonnes précises d'une ligne précise :
// aucune ne renvoie « l'état entier ». C'est ce qui empêche une page ouverte
// depuis trois jours, ou deux personnes qui cliquent en même temps, d'effacer
// ce que l'autre vient d'écrire.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LANGUES = ['fr', 'en', 'de'];

class ErreurRequete extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function texte(valeur, max) {
    if (valeur === null || valeur === undefined) return null;
    const t = String(valeur).trim().slice(0, max);
    return t === '' ? null : t;
}

function dateValide(valeur) {
    return typeof valeur === 'string' && DATE_RE.test(valeur) && !isNaN(Date.parse(valeur));
}

function horodatage(valeur) {
    if (typeof valeur !== 'string' || isNaN(Date.parse(valeur))) {
        throw new ErreurRequete(400, 'Date invalide');
    }
    return new Date(valeur).toISOString();
}

async function lireCorps(request) {
    try {
        const corps = await request.json();
        return corps && typeof corps === 'object' ? corps : {};
    } catch (e) {
        throw new ErreurRequete(400, 'JSON invalide');
    }
}

async function exigerAdmin(request) {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) throw new ErreurRequete(401, 'Connexion admin requise');
    try {
        return await verifyFirebaseToken(authHeader.slice(7));
    } catch (e) {
        throw new ErreurRequete(e.message.includes('non autorisé') ? 403 : 401, e.message);
    }
}

function journal(env, arrivee, action, detail) {
    return env.DB.prepare('INSERT INTO journal (le, arrivee, action, detail) VALUES (?1, ?2, ?3, ?4)')
        .bind(new Date().toISOString(), arrivee, action, detail ? JSON.stringify(detail) : null);
}

function lireMenage(env, arrivee) {
    return env.DB.prepare('SELECT * FROM menages WHERE arrivee = ?1').bind(arrivee).first();
}

// Écrit « ménage fait ». Une ligne déjà validée n'est pas réécrite (une page
// restée ouverte ne change pas la date ni l'auteur d'un ménage déjà noté),
// sauf correction explicite par un admin.
function ecrireFait(env, { arrivee, debut, le, par, forcer }) {
    const maintenant = new Date().toISOString();
    return env.DB.prepare(
        `INSERT INTO menages (arrivee, debut, fait_le, fait_par, cree_le, maj_le)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)
         ON CONFLICT (arrivee) DO UPDATE SET
             fait_le  = excluded.fait_le,
             fait_par = excluded.fait_par,
             debut    = COALESCE(menages.debut, excluded.debut),
             maj_le   = excluded.maj_le
         WHERE menages.fait_le IS NULL OR ?6 = 1`
    ).bind(arrivee, debut, le, par, maintenant, forcer ? 1 : 0);
}

async function routeMenages(request, env, segments) {
    const methode = request.method;
    const maintenant = new Date().toISOString();

    // GET /menages
    if (segments.length === 0) {
        if (methode !== 'GET') throw new ErreurRequete(405, 'Méthode non autorisée');
        const [{ results }, params] = await Promise.all([
            env.DB.prepare('SELECT * FROM menages ORDER BY arrivee').all(),
            lireParametres(env),
        ]);
        return { menages: results, dernierDepart: params.dernierDepart };
    }

    // POST /menages/synchro — la page déclare les créneaux qu'elle calcule.
    // N'écrit que `debut` et crée les lignes manquantes : jamais une donnée saisie.
    if (segments.length === 1 && segments[0] === 'synchro') {
        if (methode !== 'POST') throw new ErreurRequete(405, 'Méthode non autorisée');
        const corps = await lireCorps(request);
        const creneaux = (Array.isArray(corps.creneaux) ? corps.creneaux : [])
            .filter(c => c && dateValide(c.arrivee) && dateValide(c.debut) && c.debut <= c.arrivee)
            .slice(0, 200);
        if (creneaux.length === 0) return { ok: true, ajoutes: 0, supprimes: 0 };

        const today = aujourdhuiParis();
        const ecritures = creneaux.map(c => env.DB.prepare(
            // Le début d'une arrivée à venir et non encore faite suit le calendrier
            // (une résa insérée avant elle le déplace) ; celui d'une ligne passée
            // ou validée est figé, c'est de l'historique.
            `INSERT INTO menages (arrivee, debut, cree_le, maj_le) VALUES (?1, ?2, ?3, ?3)
             ON CONFLICT (arrivee) DO UPDATE SET debut = excluded.debut, maj_le = excluded.maj_le
             WHERE menages.fait_le IS NULL AND menages.arrivee >= ?4
               AND (menages.debut IS NULL OR menages.debut <> excluded.debut)`
        ).bind(c.arrivee, c.debut, maintenant, today));
        // Une arrivée future qui n'est plus dans le calendrier (résa annulée) et
        // qui ne porte AUCUNE saisie disparaît. Une ligne qui porte quelque chose
        // reste, quoi qu'il arrive.
        ecritures.push(env.DB.prepare(
            `DELETE FROM menages
             WHERE arrivee > ?1
               AND fait_le IS NULL AND paye_le IS NULL AND montant IS NULL AND commentaire_paiement IS NULL
               AND nb_personnes IS NULL AND langue IS NULL AND consigne IS NULL AND voyageurs IS NULL
               AND arrivee NOT IN (SELECT value FROM json_each(?2))`
        ).bind(today, JSON.stringify(creneaux.map(c => c.arrivee))));

        const resultats = await env.DB.batch(ecritures);
        const supprimes = resultats[resultats.length - 1].meta.changes;
        if (supprimes > 0) await journal(env, null, 'synchro: arrivées annulées retirées', { supprimes }).run();
        return { ok: true, supprimes };
    }

    // /menages/<arrivée>/<action>
    const [arrivee, action] = segments;
    if (segments.length !== 2 || !dateValide(arrivee)) throw new ErreurRequete(404, 'Route inconnue');

    if (action === 'fait' && methode === 'POST') {
        const corps = await lireCorps(request);
        const par = texte(corps.par, 60);
        const debut = dateValide(corps.debut) ? corps.debut : null;
        // Une date choisie (validation après coup) est réservée à l'admin ;
        // sinon c'est l'heure du clic, fixée par le serveur.
        let le = maintenant;
        let forcer = false;
        if (corps.le !== undefined && corps.le !== null) {
            await exigerAdmin(request);
            le = horodatage(corps.le);
            forcer = true;
        }
        await env.DB.batch([
            ecrireFait(env, { arrivee, debut, le, par, forcer }),
            journal(env, arrivee, 'fait', { par, le, debut, admin: forcer }),
        ]);
    } else if (action === 'fait' && methode === 'DELETE') {
        await env.DB.batch([
            env.DB.prepare('UPDATE menages SET fait_le = NULL, fait_par = NULL, maj_le = ?1 WHERE arrivee = ?2')
                .bind(maintenant, arrivee),
            journal(env, arrivee, 'fait annulé', null),
        ]);
    } else if (action === 'paiement' && methode === 'PUT') {
        const admin = await exigerAdmin(request);
        const corps = await lireCorps(request);
        const payeLe = horodatage(corps.le);
        const montant = Number(corps.montant);
        const montantValide = Number.isFinite(montant) && montant > 0 ? montant : null;
        const commentaire = texte(corps.commentaire, 300);
        await env.DB.batch([
            env.DB.prepare(
                `INSERT INTO menages (arrivee, paye_le, montant, commentaire_paiement, cree_le, maj_le)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?5)
                 ON CONFLICT (arrivee) DO UPDATE SET
                     paye_le = excluded.paye_le, montant = excluded.montant,
                     commentaire_paiement = excluded.commentaire_paiement, maj_le = excluded.maj_le`
            ).bind(arrivee, payeLe, montantValide, commentaire, maintenant),
            journal(env, arrivee, 'paiement', { le: payeLe, montant: montantValide, commentaire, par: admin.email }),
        ]);
    } else if (action === 'paiement' && methode === 'DELETE') {
        const admin = await exigerAdmin(request);
        await env.DB.batch([
            env.DB.prepare(
                `UPDATE menages SET paye_le = NULL, montant = NULL, commentaire_paiement = NULL, maj_le = ?1
                 WHERE arrivee = ?2`
            ).bind(maintenant, arrivee),
            journal(env, arrivee, 'paiement annulé', { par: admin.email }),
        ]);
    } else if (action === 'infos' && methode === 'PUT') {
        const admin = await exigerAdmin(request);
        const corps = await lireCorps(request);
        const nb = parseInt(corps.nbPersonnes, 10);
        const infos = {
            nbPersonnes: Number.isInteger(nb) && nb >= 1 && nb <= 20 ? nb : null,
            langue: LANGUES.includes(corps.langue) ? corps.langue : 'fr',
            consigne: texte(corps.consigne, 500),
            voyageurs: texte(corps.voyageurs, 100),
        };
        await env.DB.batch([
            env.DB.prepare(
                `INSERT INTO menages (arrivee, nb_personnes, langue, consigne, voyageurs, cree_le, maj_le)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
                 ON CONFLICT (arrivee) DO UPDATE SET
                     nb_personnes = excluded.nb_personnes, langue = excluded.langue,
                     consigne = excluded.consigne, voyageurs = excluded.voyageurs, maj_le = excluded.maj_le`
            ).bind(arrivee, infos.nbPersonnes, infos.langue, infos.consigne, infos.voyageurs, maintenant),
            journal(env, arrivee, 'infos', { ...infos, par: admin.email }),
        ]);
    } else {
        throw new ErreurRequete(405, 'Méthode non autorisée');
    }

    return { ok: true, menage: await lireMenage(env, arrivee) };
}

// GET / : le notifieur Telegram (dépôt Admin) lit `info_<date d'arrivée>` et
// `_lastCheckout` dans l'ancien format. On le reconstruit depuis D1 plutôt que
// de toucher au notifieur.
async function etatCompatible(env) {
    const [{ results }, params] = await Promise.all([
        env.DB.prepare(
            `SELECT arrivee, nb_personnes, langue, consigne, voyageurs FROM menages
             WHERE nb_personnes IS NOT NULL OR langue IS NOT NULL OR consigne IS NOT NULL OR voyageurs IS NOT NULL`
        ).all(),
        lireParametres(env),
    ]);
    const etat = {};
    if (params.dernierDepart) etat._lastCheckout = params.dernierDepart;
    for (const r of results) {
        etat['info_' + r.arrivee] = {
            nbPersons: r.nb_personnes,
            comment: r.consigne || '',
            lang: r.langue || 'fr',
            voyageurs: r.voyageurs || '',
        };
    }
    return etat;
}

// ⚠ TEMPORAIRE — à retirer après le 30/09/2026.
// PUT / venait de l'ancienne page, qui renvoyait l'état entier. Un téléphone
// resté sur un onglet ouvert avant la bascule peut encore l'envoyer : on en
// reprend UNIQUEMENT les validations « fait » des 14 derniers jours, sur des
// lignes pas encore validées. Rien d'autre n'est lu, rien n'est jamais effacé.
async function repriseAnciennePage(env, corps) {
    const limite = new Date(Date.parse(aujourdhuiParis()) - 14 * 86400000).toISOString().slice(0, 10);
    let reprises = 0;
    for (const [cle, entree] of Object.entries(corps || {})) {
        if (!cle.startsWith('slot_') || !entree || entree.status !== 'done') continue;
        if (!dateValide(entree.endDate) || entree.endDate < limite) continue;
        const le = typeof entree.updatedAt === 'string' && !isNaN(Date.parse(entree.updatedAt))
            ? new Date(entree.updatedAt).toISOString() : new Date().toISOString();
        const resultat = await ecrireFait(env, {
            arrivee: entree.endDate,
            debut: dateValide(entree.startDate) ? entree.startDate : null,
            le,
            par: texte(entree.doneBy, 60),
            forcer: false,
        }).run();
        if (resultat.meta.changes > 0) {
            reprises++;
            await journal(env, entree.endDate, 'fait (ancienne page)', { cle, par: entree.doneBy, le }).run();
        }
    }
    return reprises;
}

export default {
    async fetch(request, env, ctx) {
        const corsHeaders = getCorsHeaders(request);
        const url = new URL(request.url);
        const path = url.pathname;

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // ============ Route /dates ============
        if (path === '/dates') {
            // GET /dates : lecture publique
            if (request.method === 'GET') {
                const dates = await env.MENAGE_KV.get(KV_KEY_DATES);
                return new Response(dates || '{"manual":[],"excluded":[]}', {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // PUT /dates : écriture protégée par Firebase Auth
            if (request.method === 'PUT') {
                try {
                    const authHeader = request.headers.get('Authorization') || '';
                    if (!authHeader.startsWith('Bearer ')) {
                        return jsonResponse({ error: 'Token manquant' }, 401, corsHeaders);
                    }
                    await verifyFirebaseToken(authHeader.slice(7));

                    const body = await request.text();
                    JSON.parse(body); // Valide le JSON
                    await env.MENAGE_KV.put(KV_KEY_DATES, body);
                    return jsonResponse({ ok: true }, 200, corsHeaders);
                } catch (e) {
                    const status = e.message.includes('non autorisé') ? 403 : 401;
                    return jsonResponse({ error: e.message }, status, corsHeaders);
                }
            }

            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Route /messages (modèles de messages) ============
        if (path === '/messages') {
            // Lecture et écriture protégées par Firebase Auth
            try {
                const authHeader = request.headers.get('Authorization') || '';
                if (!authHeader.startsWith('Bearer ')) {
                    return jsonResponse({ error: 'Token manquant' }, 401, corsHeaders);
                }
                await verifyFirebaseToken(authHeader.slice(7));
            } catch (e) {
                const status = e.message.includes('non autorisé') ? 403 : 401;
                return jsonResponse({ error: e.message }, status, corsHeaders);
            }

            if (request.method === 'GET') {
                const messages = await env.MENAGE_KV.get(KV_KEY_MESSAGES);
                return new Response(messages || '[]', {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (request.method === 'PUT') {
                try {
                    const body = await request.text();
                    const parsed = JSON.parse(body);
                    if (!Array.isArray(parsed)) {
                        return jsonResponse({ error: 'Tableau attendu' }, 400, corsHeaders);
                    }
                    await env.MENAGE_KV.put(KV_KEY_MESSAGES, body);
                    return jsonResponse({ ok: true }, 200, corsHeaders);
                } catch (e) {
                    return jsonResponse({ error: 'JSON invalide' }, 400, corsHeaders);
                }
            }

            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Route /agenda-images (images d'événements ajoutées par l'admin) ============
        // GET : lecture publique. PUT : écriture protégée par Firebase Auth (comme /dates).
        if (path === '/agenda-images') {
            if (request.method === 'GET') {
                const data = await env.MENAGE_KV.get(KV_KEY_AGENDA_IMAGES);
                return new Response(data || '{}', {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
            if (request.method === 'PUT') {
                try {
                    const authHeader = request.headers.get('Authorization') || '';
                    if (!authHeader.startsWith('Bearer ')) {
                        return jsonResponse({ error: 'Token manquant' }, 401, corsHeaders);
                    }
                    await verifyFirebaseToken(authHeader.slice(7));
                    const body = await request.text();
                    const parsed = JSON.parse(body);
                    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                        return jsonResponse({ error: 'Objet attendu' }, 400, corsHeaders);
                    }
                    await env.MENAGE_KV.put(KV_KEY_AGENDA_IMAGES, body);
                    return jsonResponse({ ok: true }, 200, corsHeaders);
                } catch (e) {
                    const status = e.message.includes('non autorisé') ? 403 : 401;
                    return jsonResponse({ error: e.message }, status, corsHeaders);
                }
            }
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Route /rando-overrides (affichage/masquage des randos par l'admin) ============
        // GET : lecture publique. PUT : écriture protégée par Firebase Auth.
        if (path === '/rando-overrides') {
            if (request.method === 'GET') {
                const data = await env.MENAGE_KV.get(KV_KEY_RANDO_OVERRIDES);
                return new Response(data || '{}', {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
            if (request.method === 'PUT') {
                try {
                    const authHeader = request.headers.get('Authorization') || '';
                    if (!authHeader.startsWith('Bearer ')) {
                        return jsonResponse({ error: 'Token manquant' }, 401, corsHeaders);
                    }
                    await verifyFirebaseToken(authHeader.slice(7));
                    const body = await request.text();
                    const parsed = JSON.parse(body);
                    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                        return jsonResponse({ error: 'Objet attendu' }, 400, corsHeaders);
                    }
                    await env.MENAGE_KV.put(KV_KEY_RANDO_OVERRIDES, body);
                    return jsonResponse({ ok: true }, 200, corsHeaders);
                } catch (e) {
                    const status = e.message.includes('non autorisé') ? 403 : 401;
                    return jsonResponse({ error: e.message }, status, corsHeaders);
                }
            }
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Route /evolution (page technique évolution du contenu) ============
        // Lecture et écriture publiques (page interne non indexée, faible enjeu).
        if (path === '/evolution') {
            if (request.method === 'GET') {
                const state = await env.MENAGE_KV.get(KV_KEY_EVOLUTION);
                return new Response(state || '{}', {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
            if (request.method === 'PUT') {
                try {
                    const body = await request.text();
                    JSON.parse(body); // valide le JSON
                    await env.MENAGE_KV.put(KV_KEY_EVOLUTION, body);
                    return jsonResponse({ ok: true }, 200, corsHeaders);
                } catch (e) {
                    return jsonResponse({ error: 'JSON invalide' }, 400, corsHeaders);
                }
            }
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Route /ical (flux fusionnés) ============
        if (path === '/ical') {
            if (request.method === 'GET') {
                try {
                    const results = await Promise.all(
                        getIcalFeeds(env).map(url => fetch(url).then(r => r.text()))
                    );
                    // Extraire tous les VEVENT de chaque flux
                    const allEvents = results
                        .flatMap(ics => ics.match(/BEGIN:VEVENT[\s\S]+?END:VEVENT/g) || []);
                    // Mémoriser les départs sans retarder la réponse
                    ctx.waitUntil(updateCheckoutsFromFeed(env, allEvents)
                        .catch(e => console.error('updateCheckoutsFromFeed', e)));
                    // Reconstruire un iCal unique
                    const merged = [
                        'BEGIN:VCALENDAR',
                        'VERSION:2.0',
                        'PRODID:-//Menage Proxy//Merged//EN',
                        'CALSCALE:GREGORIAN',
                        ...allEvents,
                        'END:VCALENDAR',
                    ].join('\r\n');
                    return new Response(merged, {
                        headers: { ...corsHeaders, 'Content-Type': 'text/calendar; charset=utf-8' },
                    });
                } catch (e) {
                    return jsonResponse({ error: 'Erreur fetch iCal: ' + e.message }, 502, corsHeaders);
                }
            }
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // ============ Routes /menages (D1) ============
        if (path === '/menages' || path.startsWith('/menages/')) {
            try {
                const segments = path.split('/').filter(Boolean).slice(1);
                return jsonResponse(await routeMenages(request, env, segments), 200, corsHeaders);
            } catch (e) {
                if (e instanceof ErreurRequete) return jsonResponse({ error: e.message }, e.status, corsHeaders);
                console.error('menages', e);
                return jsonResponse({ error: 'Erreur serveur' }, 500, corsHeaders);
            }
        }

        if (path !== '/') {
            return new Response('Not found', { status: 404, headers: corsHeaders });
        }

        // ============ Route / (compatibilité) ============
        // GET : ancien format, reconstruit depuis D1 (lu par le notifieur Telegram)
        if (request.method === 'GET') {
            return jsonResponse(await etatCompatible(env), 200, corsHeaders);
        }

        // PUT : ancienne page ménage restée ouverte (voir repriseAnciennePage).
        // La clé KV `menage_state` n'est plus jamais écrite : c'est l'archive.
        if (request.method === 'PUT') {
            try {
                const reprises = await repriseAnciennePage(env, JSON.parse(await request.text()));
                return jsonResponse({ ok: true, reprises, avertissement: 'Page ménage périmée : recharger la page.' }, 200, corsHeaders);
            } catch (e) {
                return jsonResponse({ error: 'JSON invalide' }, 400, corsHeaders);
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    },
};
