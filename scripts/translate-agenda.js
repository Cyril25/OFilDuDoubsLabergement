#!/usr/bin/env node
/**
 * Complète les traductions manquantes de data/agenda.json.
 * - Titres : le flux fournit de/en/fr → on complète es, it, nl, pt.
 * - Descriptions : le flux fournit de/en/es/fr/it/nl → on complète pt.
 *   (les événements venus du seul export data.gouv arrivent en français : tout est à traduire)
 *
 * Le fournisseur est choisi par scripts/lib/translate.js (Azure, sinon DeepL). Un cache
 * (data/agenda-i18n-cache.json) évite de retraduire deux fois le même texte — c'est lui
 * qui porte l'essentiel de la valeur, d'où son versionnement dans le dépôt.
 * Sans clé, ou si le fournisseur refuse, le script applique le cache existant et sort en
 * succès : la publication de l'agenda ne doit jamais dépendre de la traduction.
 *
 * Usage : node scripts/translate-agenda.js data/agenda.json data/agenda-i18n-cache.json
 */
const fs = require('fs');

const agendaPath = process.argv[2] || 'data/agenda.json';
const cachePath = process.argv[3] || 'data/agenda-i18n-cache.json';
const { translate, providerName } = require('./lib/translate.js');
const TRADUCTEUR = providerName();   // 'azure', 'deepl', ou null si aucune clé

// Langues à compléter (code site -> code DeepL)
// Titres : on complète toutes les langues manquantes (les events DATAtourisme ont déjà de/en/fr ;
// les compléments Tourinsoft n'ont que fr → de/en/es/it/nl/pt à traduire).
const TITLE_TARGETS = ['de', 'en', 'es', 'it', 'nl', 'pt'];
// Descriptions : DATAtourisme fournit de/en/es/it/nl ; les compléments Tourinsoft n'ont que fr.
// On complète donc toutes les langues manquantes (DeepL + cache) pour la cohérence multilingue.
const DESC_TARGETS = ['de', 'en', 'es', 'it', 'nl', 'pt'];
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

async function traduireLot(lang, items) {                // items: [{key, text}]
    const out = await translate(items.map(it => it.text), lang);
    out.forEach((texte, i) => { cache[items[i].key] = texte; });
}

async function run() {
    if (missing.size && TRADUCTEUR) {
        // Regroupe par langue cible, puis lots de 45 textes
        const byLang = {};
        for (const [key, { lang, text }] of missing) (byLang[lang] = byLang[lang] || []).push({ key, text });
        console.error('::notice::Traduction via ' + TRADUCTEUR + ' : ' + missing.size + ' segment(s) à traiter.');
        // Une panne DeepL (quota épuisé, clé refusée, réseau) ne doit pas empêcher la
        // publication de l'agenda : on garde ce qui a été traduit, le reste sort en
        // français. Même parti pris que build-rando.js, qui lui survivait déjà.
        try {
            for (const lang of Object.keys(byLang)) {
                const arr = byLang[lang];
                for (let i = 0; i < arr.length; i += 45) {
                    await traduireLot(lang, arr.slice(i, i + 45));
                    console.error(`  ${lang}: ${Math.min(i + 45, arr.length)}/${arr.length}`);
                }
            }
        } catch (e) {
            console.error('::warning::Traduction interrompue (' + e.message + ') — cache partiel appliqué, manques laissés en français.');
        }
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 0));
    } else if (missing.size && !TRADUCTEUR) {
        console.error('::warning::Aucune clé de traduction configurée : seul le cache existant est appliqué, les manques restent en français.');
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

run().catch(e => { console.error('Erreur de traduction :', e.message); process.exit(1); });
