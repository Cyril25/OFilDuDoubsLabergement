/**
 * Cloudflare Worker - Proxy billets touristiques
 *
 * Route unique :
 *   GET  /billets-touristiques  → Retourne le JSON des billets (auth Firebase requise)
 */

const GOOGLE_DRIVE_JSON_URL =
  'https://drive.google.com/uc?export=download&id=1BTGJyOAOj8kFgrpDcBSol6g3v24qkSWr';

async function verifyFirebaseToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) return null;
        if (payload.iss !== 'https://securetoken.google.com/asso-billet-site') return null;
        if (payload.aud !== 'asso-billet-site') return null;

        const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
        const keysRes = await fetch('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com');
        const { keys } = await keysRes.json();
        const key = keys.find(k => k.kid === header.kid);
        if (!key) return null;

        const cryptoKey = await crypto.subtle.importKey(
            'jwk', key,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false, ['verify']
        );

        const encoder = new TextEncoder();
        const data = encoder.encode(parts[0] + '.' + parts[1]);
        const sig = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

        const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sig, data);
        return isValid ? payload : null;

    } catch (e) {
        console.error('Erreur vérification token:', e);
        return null;
    }
}

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }

        // Billets touristiques (JSON) — protégé par Firebase Auth
        if (url.pathname === '/billets-touristiques') {
            const authHeader = request.headers.get('Authorization') || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

            if (!token) {
                return new Response(JSON.stringify({ error: 'Token manquant' }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const firebaseUser = await verifyFirebaseToken(token);
            if (!firebaseUser) {
                return new Response(JSON.stringify({ error: 'Token invalide ou expiré' }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const response = await fetch(GOOGLE_DRIVE_JSON_URL);
            return new Response(await response.text(), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Cache-Control': 'no-store'
                }
            });
        }

        return new Response('Not found', { status: 404 });
    }
};
