#!/usr/bin/env node
// Migration unique (14/09/2026) : ancien état ménage (objet JSON du KV) → base D1 `menage`.
//
//   node scripts/menage-migration-d1.js <etat.json> <sortie.sql>
//
// Écrit un fichier SQL (à appliquer avec `wrangler d1 execute menage --remote --file`)
// et affiche, arrivée par arrivée, ce qui sera écrit ET ce qui est écarté, pour relecture.
// Rien n'est effacé côté KV : la clé `menage_state` reste telle quelle, en archive.
//
// Règles :
//   - un ménage = une date d'arrivée (= endDate de l'ancien `slot_<début>_<fin>`) ;
//   - les créneaux déclarés faux par Cyril sont écartés (ECARTES) ;
//   - les arrivées tranchées par Cyril sont écrites telles qu'il les a décrites (ARBITRAGES) ;
//   - ailleurs, s'il reste plusieurs entrées pour une même arrivée : « fait » l'emporte, et le
//     paiement vient de l'entrée qui en dit le plus (montant, puis date) ;
//   - les `info_<arrivée>` deviennent les colonnes nb_personnes / langue / consigne / voyageurs.

const fs = require('fs');

const [, , fichierEtat, fichierSql] = process.argv;
if (!fichierEtat || !fichierSql) {
    console.error('Usage : node scripts/menage-migration-d1.js <etat.json> <sortie.sql>');
    process.exit(1);
}
const etat = JSON.parse(fs.readFileSync(fichierEtat, 'utf8'));

// Créneaux faux, confirmés par Cyril le 14/09/2026
const ECARTES = {
    'slot_2026-07-06_2026-07-13': 'faux (validé « pour être tranquille »)',
    'slot_2026-07-06_2026-07-15': 'faux (bug de juillet) ; le vrai est 15→15, même paiement',
    'slot_2026-07-24_2026-07-28': 'faux ; le vrai est 24→25',
    'slot_2026-07-29_2026-08-01': 'faux ; le vrai est celui de Nathalie le 01/08',
    'slot_2026-05-10_2026-05-14': 'faux',
    'slot_2026-05-10_2026-05-22': 'faux',
};

const FL = 'Fanny & Lolita';
// Arrivées tranchées par Cyril le 14/09/2026. Une valeur absente = reprise de l'ancien état.
const ARBITRAGES = {
    // « un seul ménage le vendredi et un seul paiement » (paiement validé le samedi)
    '2026-09-14': { debut: '2026-09-10', fait_le: '2026-09-11T12:22:27.365Z', fait_par: FL,
                    paye_le: '2026-09-12T10:00:00.000Z', montant: 40, commentaire_paiement: null },
    // « fait le 4/09 par Fanny & Lolita, payé 40 € » — date de paiement non précisée
    '2026-09-04': { debut: '2026-09-03', fait_le: '2026-09-04T10:00:00.000Z', fait_par: FL,
                    paye_le: '2026-09-04T10:00:00.000Z', montant: 40, commentaire_paiement: null },
    // « le vrai créneau est 24/07 → 25/07, Fanny & Lolita, payé 40 € » — dates non précisées
    '2026-07-25': { debut: '2026-07-24', fait_le: '2026-07-25T10:00:00.000Z', fait_par: FL,
                    paye_le: '2026-07-25T10:00:00.000Z', montant: 40, commentaire_paiement: null },
};

// Début réel des arrivées à entrées multiples (les autres gardent le leur)
const DEBUTS = {
    '2026-06-08': '2026-06-07',
    '2026-08-31': '2026-08-30',
    '2026-09-07': '2026-09-06',
};

const sql = v => v === null || v === undefined ? 'NULL'
    : typeof v === 'number' ? String(v)
    : `'${String(v).replace(/'/g, "''")}'`;
const vide = v => v === undefined || v === null || v === '' ? null : v;

const lignes = {};
const ligne = arrivee => lignes[arrivee] || (lignes[arrivee] = { arrivee, sources: [], ecartes: [] });

for (const [cle, entree] of Object.entries(etat)) {
    if (!cle.startsWith('slot_')) continue;
    const l = ligne(entree.endDate);
    if (ECARTES[cle]) l.ecartes.push(`${cle} — ${ECARTES[cle]}`);
    else l.sources.push({ cle, ...entree });
}
for (const [cle, info] of Object.entries(etat)) {
    if (!cle.startsWith('info_')) continue;
    const l = ligne(cle.slice(5));
    const nb = parseInt(info.nbPersons, 10);
    l.nb_personnes = Number.isInteger(nb) && nb > 0 ? nb : null;
    l.langue = vide(info.lang);
    l.consigne = vide(info.comment);
    l.voyageurs = vide(info.voyageurs);
}

for (const l of Object.values(lignes)) {
    const faits = l.sources.filter(s => s.status === 'done');
    const payes = l.sources.filter(s => s.paidAt)
        .sort((a, b) => (b.paidAmount ? 1 : 0) - (a.paidAmount ? 1 : 0));
    const reference = faits.find(s => s.paidAmount) || faits[0] || l.sources[0];
    l.debut = reference ? reference.startDate : null;
    if (faits.length) {
        l.fait_le = reference.updatedAt;
        l.fait_par = vide(reference.doneBy);
    }
    if (payes.length) {
        l.paye_le = payes[0].paidAt;
        l.montant = payes[0].paidAmount || null;
        l.commentaire_paiement = vide(payes[0].paidComment);
    }
    if (DEBUTS[l.arrivee]) l.debut = DEBUTS[l.arrivee];
    if (ARBITRAGES[l.arrivee]) Object.assign(l, ARBITRAGES[l.arrivee]);
}

const COLONNES = ['arrivee', 'debut', 'fait_le', 'fait_par', 'paye_le', 'montant', 'commentaire_paiement',
    'nb_personnes', 'langue', 'consigne', 'voyageurs', 'cree_le', 'maj_le'];
const maintenant = new Date().toISOString();
const ordre = Object.values(lignes)
    .filter(l => l.sources.length || l.nb_personnes || l.langue || l.consigne || l.voyageurs || ARBITRAGES[l.arrivee])
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee));

const instructions = [
    '-- Généré par scripts/menage-migration-d1.js le ' + maintenant,
    'DELETE FROM menages;',
];
for (const l of ordre) {
    l.cree_le = maintenant;
    l.maj_le = maintenant;
    instructions.push(`INSERT INTO menages (${COLONNES.join(', ')}) VALUES (${COLONNES.map(c => sql(l[c])).join(', ')});`);
    instructions.push(`INSERT INTO journal (le, arrivee, action, detail) VALUES (${sql(maintenant)}, ${sql(l.arrivee)}, 'migration depuis KV', ${sql(JSON.stringify({ sources: l.sources.map(s => s.cle), ecartes: l.ecartes, arbitrage: !!ARBITRAGES[l.arrivee] }))});`);
}

// Dernier départ : le KV porte 2026-09-14, fruit du bug (blocage du jour même). Le vrai
// dernier départ avant l'arrivée de Julien est le 10/09. Le worker corrigé le fera avancer.
const HORIZON = new Date(Date.now() + 183 * 86400000).toISOString().slice(0, 10);
const aujourdhui = new Date().toISOString().slice(0, 10);
const departsAVenir = (etat._futureCheckouts || []).filter(d => d > aujourdhui && d <= HORIZON);
instructions.push(`INSERT INTO parametres (cle, valeur) VALUES ('dernier_depart', '2026-09-10T11:00:00') ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur;`);
instructions.push(`INSERT INTO parametres (cle, valeur) VALUES ('departs_a_venir', ${sql(JSON.stringify(departsAVenir))}) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur;`);

fs.writeFileSync(fichierSql, instructions.join('\n') + '\n');

// Relecture
const jour = s => s ? s.slice(0, 10) : '—';
for (const l of ordre) {
    const fait = l.fait_le ? `FAIT ${jour(l.fait_le)} ${l.fait_par || ''}` : 'non renseigné';
    const paye = l.paye_le ? ` | payé ${jour(l.paye_le)}${l.montant ? ' ' + l.montant + '€' : ''}${l.commentaire_paiement ? ' « ' + l.commentaire_paiement + ' »' : ''}` : '';
    const infos = [l.nb_personnes && l.nb_personnes + ' pers.', l.langue, l.voyageurs, l.consigne && '« ' + l.consigne + ' »'].filter(Boolean).join(', ');
    console.log(`${l.arrivee}  ${l.debut || '(infos seules)'} → ${l.arrivee}  ${l.sources.length || ARBITRAGES[l.arrivee] ? fait + paye : ''}${infos ? '  [' + infos + ']' : ''}${ARBITRAGES[l.arrivee] ? '  ← arbitrage' : ''}`);
    for (const e of l.ecartes) console.log(`      écarté : ${e}`);
    if (l.sources.length > 1) console.log(`      fusion de : ${l.sources.map(s => s.cle).join(', ')}`);
}
console.log(`\n${ordre.length} lignes, dernier_depart = 2026-09-10T11:00:00, departs_a_venir = ${JSON.stringify(departsAVenir)}`);
