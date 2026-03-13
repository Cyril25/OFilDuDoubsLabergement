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
 *   GET  /  → Retourne l'état JSON
 *   PUT  /  → Sauvegarde l'état JSON (body = JSON)
 */

const KV_KEY = 'menage_state';

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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

export default {
    async fetch(request, env) {
        const corsHeaders = getCorsHeaders(request);

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

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
                // Valide que c'est du JSON
                JSON.parse(body);
                await env.MENAGE_KV.put(KV_KEY, body);
                return new Response(JSON.stringify({ ok: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'JSON invalide' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    },
};
