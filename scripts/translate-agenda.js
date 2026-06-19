#!/usr/bin/env node
/**
 * Complète les traductions manquantes de data/agenda.json via l'API DeepL.
 * - Titres : le flux fournit de/en/fr → on complète es, it, nl, pt.
 * - Descriptions : le flux fournit de/en/es/fr/it/nl → on complète pt.
 *
 * Un cache (data/agenda-i18n-cache.json) évite de retraduire deux fois le même texte.
 * Sans la variable d'environnement DEEPL_API_KEY, le script applique uniquement le
 * cache existant et n'échoue pas (la page reste fonctionnelle, juste avec des manques).
 *
 * Usage : node scripts/translate-agenda.js data/agenda.json data/agenda-i18n-cache.json
 */
const fs = require('fs');

const agendaPath = process.argv[2] || 'data/agenda.json';
const cachePath = process.argv[3] || 'data/agenda-i18n-cache.json';
const KEY = process.env.DEEPL_API_KEY || '';

// Langues à compléter (code site -> code DeepL)
const DEEPL_LANG = { de: 'DE', en: 'EN-GB', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT-PT' };
// Titres : on complète toutes les langues manquantes (les events DATAtourisme ont déjà de/en/fr ;
// les compléments Tourinsoft n'ont que fr → de/en/es/it/nl/pt à traduire).
const TITLE_TARGETS = ['de', 'en', 'es', 'it', 'nl', 'pt'];
// Descriptions : DATAtourisme fournit déjà de/en/es/fr/it/nl → on ne complète que pt.
// (Les compléments Tourinsoft gardent leur description en français pour les autres langues.)
const DESC_TARGETS = ['pt'];
const SEP = '';

const agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf8'));
let cache = {};
try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) {}

const src = (obj) => obj && (obj.fr || obj.en || Object.values(obj)[0]) || '';
const cacheKey = (lang, text) => lang + SEP + text;

// 1. Recense les traductions manquantes (texte source + langue cible) non présentes en cache
const missing = new Map(); // key -> { lang, text }
function need(obj, targets) {
    if (!obj) return;
    const s = src(obj);
    if (!s) return;
    for (const lang of targets) {
        if (obj[lang]) continue;                 // déjà fourni par le flux
        const k = cacheKey(lang, s);
        if (cache[k] !== undefined) continue;     // déjà en cache
        missing.set(k, { lang, text: s });
    }
}
for (const e of agenda.events) {
    need(e.title, TITLE_TARGETS);
    need(e.desc, DESC_TARGETS);
}

console.error(`À traduire (hors cache) : ${missing.size} segment(s).`);

async function deeplBatch(lang, items) {
    // items: [{key, text}]
    const base = KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
    const body = new URLSearchParams();
    body.append('source_lang', 'FR');
    body.append('target_lang', DEEPL_LANG[lang]);
    for (const it of items) body.append('text', it.text);
    const resp = await fetch(base + '/v2/translate', {
        method: 'POST',
        headers: { 'Authorization': 'DeepL-Auth-Key ' + KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!resp.ok) throw new Error('DeepL ' + resp.status + ' : ' + (await resp.text()).slice(0, 200));
    const json = await resp.json();
    json.translations.forEach((t, i) => { cache[items[i].key] = t.text; });
}

async function run() {
    if (missing.size && KEY) {
        // Regroupe par langue cible, puis lots de 45 textes
        const byLang = {};
        for (const [key, { lang, text }] of missing) (byLang[lang] = byLang[lang] || []).push({ key, text });
        for (const lang of Object.keys(byLang)) {
            const arr = byLang[lang];
            for (let i = 0; i < arr.length; i += 45) {
                await deeplBatch(lang, arr.slice(i, i + 45));
                console.error(`  ${lang}: ${Math.min(i + 45, arr.length)}/${arr.length}`);
            }
        }
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 0));
    } else if (missing.size && !KEY) {
        console.error('DEEPL_API_KEY absente : on applique seulement le cache existant (manques laissés en français).');
    }

    // 2. Applique le cache aux événements
    let filled = 0;
    const apply = (obj, targets) => {
        if (!obj) return;
        const s = src(obj);
        for (const lang of targets) {
            if (obj[lang]) continue;
            const v = cache[cacheKey(lang, s)];
            if (v !== undefined) { obj[lang] = v; filled++; }
        }
    };
    for (const e of agenda.events) { apply(e.title, TITLE_TARGETS); apply(e.desc, DESC_TARGETS); }

    fs.writeFileSync(agendaPath, JSON.stringify(agenda));
    console.error(`Traductions appliquées : ${filled} champ(s). Cache : ${Object.keys(cache).length} entrées. -> ${agendaPath}`);
}

run().catch(e => { console.error('Erreur DeepL :', e.message); process.exit(1); });
