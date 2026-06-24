#!/usr/bin/env node
/**
 * Génère data/site-index.json : la liste des contenus DÉJÀ présents sur le site,
 * par page (activites, ou-manger, commerces). Sert à la page evolution pour
 * afficher un badge « déjà sur le site » sur les POI correspondants.
 *
 * Usage : node scripts/build-site-index.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Normalisation tolérante (minuscules, sans accents/ponctuation, retrait d'un mot
// de catégorie ou article en tête, singulier). DOIT rester identique à celle
// d'evolution.html pour que le matching « déjà sur le site » fonctionne.
const LEAD_WORDS = new Set(['hotel', 'restaurant', 'pizzeria', 'snack', 'bar', 'brasserie', 'auberge', 'creperie', 'le', 'la', 'les', 'l']);
function norm(s) {
  const t = (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // accents
    .replace(/\([^)]*\)/g, ' ')                          // (Malbuisson), (Adam's)…
    .replace(/['’`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let w = t.split(' ');
  while (w.length > 1 && LEAD_WORDS.has(w[0])) w.shift();   // retire « Restaurant », « La »…
  w = w.map(x => x.length > 3 && x.endsWith('s') ? x.slice(0, -1) : x);  // singulier grossier
  return w.join(' ');
}

// --- Activités : labels des marqueurs addTaggedMarker(lat, lng, "Label", ...) ---
function activitesNames() {
  const html = read('activites.html');
  const names = [];
  const re = /addTaggedMarker\([^,]+,[^,]+,\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    let label = m[1];
    if (/vous êtes ici/i.test(label) || label.includes('<br>')) continue;
    names.push(label.trim());
  }
  return names;
}

// --- Où manger : noms des food trucks + restaurants (oumanger.js) ---
function ouMangerNames() {
  const js = read('scripts/oumanger.js');
  const names = [];
  // Capture le type de quote ouvrant puis lit jusqu'au même quote (gère les apostrophes internes).
  const re = /name:\s*(["'])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(js))) names.push(m[2].trim());
  return [...new Set(names)];
}

// --- Commerces : <h2 id="...">Nom</h2> dans les sections (hors sous-titre) ---
function commercesNames() {
  const html = read('commerces.html');
  const names = [];
  const re = /<h2\s+id="([^"]+)"[^>]*>([^<]+)<\/h2>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] === 'subtitle') continue;
    names.push(m[2].trim());
  }
  return names;
}

const pages = {
  'activites': activitesNames(),
  'ou-manger': ouMangerNames(),
  'commerces': commercesNames(),
};

// Ajoute une forme normalisée pour la comparaison côté page
const normalized = {};
for (const k of Object.keys(pages)) normalized[k] = pages[k].map(norm);

const payload = { generated: new Date().toISOString(), pages, normalized };
fs.writeFileSync(path.join(ROOT, 'data', 'site-index.json'), JSON.stringify(payload));

console.error('site-index.json généré :');
for (const k of Object.keys(pages)) console.error(`  ${k} : ${pages[k].length} éléments`);
