/**
 * Cloudflare Worker - Persistance état ménage via KV
 *
 * DÉPLOIEMENT :
 * 1. Aller sur https://dash.cloudflare.com → Workers & Pages → Create
 * 2. Nommer le worker (ex: "menage-state")
 * 3. Coller ce code dans l'éditeur
 * 4. Dans Settings → Variables → KV Namespace Bindings :
 *    - Variable name : MENAGE_KV
 *    - Sélectionner (ou créer) un namespace KV (ex: "menage-state-kv")
 * 5. Déployer
 * 6. Mettre à jour l'URL dans menage.html (variable STATE_API_URL)
 *
 * Le Worker expose :
 *   GET  /       → Retourne l'état JSON
 *   PUT  /       → Sauvegarde l'état JSON (body = JSON)
 *   GET  /dates  → Retourne les dates manuelles/exclues (public)
 *   PUT  /dates  → Sauvegarde les dates (auth Firebase requise)
 */

const KV_KEY = 'menage_state';
const KV_KEY_DATES = 'menage_dates';
const FIREBASE_PROJECT_ID = 'asso-billet-site';
const ADMIN_EMAIL = 'cyril.samson41@gmail.com';

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
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
    if (payload.email !== ADMIN_EMAIL) throw new Error('Email non autorisé');

    return payload;
}

function jsonResponse(body, status, corsHeaders) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

export default {
    async fetch(request, env) {
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

        // ============ Route / (état ménage) ============
        // GET : lire l'état
        if (request.method === 'GET') {
            const state = await env.MENAGE_KV.get(KV_KEY);
            return new Response(state || '{}', {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PUT : sauvegarder l'état
        if (request.method === 'PUT') {
            try {
                const body = await request.text();
                JSON.parse(body);
                await env.MENAGE_KV.put(KV_KEY, body);
                return jsonResponse({ ok: true }, 200, corsHeaders);
            } catch (e) {
                return jsonResponse({ error: 'JSON invalide' }, 400, corsHeaders);
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    },
};
