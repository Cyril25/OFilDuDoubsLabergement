#!/usr/bin/env node
/**
 * Génère data/rando.json à partir du flux « Itinéraire touristique » DATAtourisme extrait.
 * Garde les itinéraires (pédestre/vélo/route) dans un rayon autour de Labergement,
 * PLUS une liste curatée d'« incontournables » (inclus même au-delà du rayon).
 *
 * Usage : node scripts/build-rando.js <dossier_extrait> <fichier_sortie> [rayon_km]
 */
const fs = require('fs'), path = require('path');

const LAT = 46.7689, LON = 6.2807;                 // Labergement-Sainte-Marie
const RADIUS = parseFloat(process.argv[4] || '20');
const extractedDir = process.argv[2];
const outFile = process.argv[3];

// Incontournables : inclus quelle que soit la distance (match sur le nom FR).
const MUST_SEE = [/h[ée]risson/i, /cascades?\s+des\s+tufs/i];

const asArray = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);
const langMap = (obj, max) => {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  for (const lg of Object.keys(obj)) {
    let v = obj[lg]; if (Array.isArray(v)) v = v[0];
    if (typeof v === 'string' && v.trim()) out[lg] = max ? v.trim().slice(0, max) : v.trim();
  }
  return Object.keys(out).length ? out : null;
};
const haversine = (la, lo) => {
  const R = 6371, r = Math.PI / 180;
  const dla = (la - LAT) * r, dlo = (lo - LON) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(LAT * r) * Math.cos(la * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}

const MODE = { WalkingTour: 'foot', CyclingTour: 'bike', RoadTour: 'road' };
const DIFF = {
  'kb:EasyTour': 'easy', 'kb:MediumDifficultyTour': 'medium',
  'kb:DifficultTour': 'hard', 'kb:VeryDifficultTour': 'very_hard',
};
const TYPE = { 'kb:Loop': 'loop', 'kb:OpenJaw': 'roaming', 'kb:RoundTrip': 'roundtrip', 'kb:OneWay': 'oneway' };
const TYPE_PRIORITY = ['kb:Loop', 'kb:OpenJaw', 'kb:RoundTrip', 'kb:OneWay'];

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;
// Première URL d'IMAGE (pas un PDF/topoguide) parmi toutes les représentations.
const firstImage = (reps) => {
  for (const rep of reps) {
    for (const res of asArray(rep && rep['ebucore:hasRelatedResource'])) {
      for (const loc of asArray(res && res['ebucore:locator'])) {
        if (typeof loc === 'string' && IMG_EXT.test(loc)) return loc;
      }
    }
  }
  return null;
};

const items = [];
const debugLocators = []; // TEMP : inspection des URLs de représentation
let total = 0, kept = 0;
const objectsDir = path.join(extractedDir, 'objects');
const root = fs.existsSync(objectsDir) ? objectsDir : extractedDir;

for (const f of walk(root)) {
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  const types = asArray(o['@type']);
  const modeType = Object.keys(MODE).find(t => types.includes(t));
  if (!modeType) continue;                              // pas un itinéraire pédestre/vélo/route
  const mode = MODE[modeType];                          // 'foot' | 'bike' | 'road'
  total++;

  const name = (langMap(o['rdfs:label']) || {});
  const nameFr = name.fr || name.en || Object.values(name)[0] || '';
  if (!nameFr) continue;

  const loc = asArray(o['isLocatedAt'])[0];
  const geo = loc && loc['schema:geo'];
  const lat = geo && parseFloat(geo['schema:latitude']);
  const lon = geo && parseFloat(geo['schema:longitude']);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const dist = haversine(lat, lon);

  const must = MUST_SEE.some(re => re.test(nameFr));
  if (dist > RADIUS && !must) continue;                 // hors rayon et non incontournable

  // Description multilingue (hasDescription.dc:description, sinon rdfs:comment)
  const descObj = asArray(o['hasDescription'])[0];
  const desc = (descObj && langMap(descObj['dc:description'], 500))
    || langMap(o['rdfs:comment'], 500) || undefined;

  // Difficulté + type
  const pc = asArray(o['hasPracticeCondition'])[0];
  const diffId = pc && asArray(pc['hasDifficultyLevel'])[0] && asArray(pc['hasDifficultyLevel'])[0]['@id'];
  const difficulty = DIFF[diffId] || undefined;
  const tourTypeIds = asArray(o['hasTourType']).map(t => t && t['@id']);
  const typeId = TYPE_PRIORITY.find(id => tourTypeIds.includes(id));
  const type = TYPE[typeId] || undefined;

  // Distance / dénivelé
  const km = parseFloat(o['tourDistance']);
  const denivele = parseFloat(o['positiveCumulDifference']);

  // Ville
  const addr = loc && asArray(loc['schema:address'])[0];
  const city = addr && addr['schema:addressLocality'] || '';

  // Image : 1re vraie image (jpg/png/webp…) parmi les représentations (on ignore les PDF/topoguides)
  const img = firstImage([...asArray(o['hasMainRepresentation']), ...asArray(o['hasRepresentation'])]) || undefined;

  // TEMP : capture de toutes les URLs de représentation (diagnostic photos)
  if (debugLocators.length < 12) {
    const locs = [];
    for (const rep of [...asArray(o['hasMainRepresentation']), ...asArray(o['hasRepresentation'])])
      for (const res of asArray(rep && rep['ebucore:hasRelatedResource']))
        for (const l of asArray(res && res['ebucore:locator'])) locs.push(l);
    debugLocators.push({ name: nameFr, n: locs.length, locs: locs.slice(0, 4) });
  }

  // Lien fiche source (carte / GPX chez l'éditeur)
  let url = null;
  for (const c of asArray(o['hasContact'])) {
    const hp = c && (c['foaf:homepage'] || c['schema:url']);
    if (hp) { url = asArray(hp)[0]; break; }
  }

  items.push({
    id: o['dc:identifier'] || o['@id'],
    name: nameFr,
    desc,
    mode,
    type,
    difficulty,
    km: Number.isFinite(km) ? Math.round(km / 100) / 10 : undefined,   // m -> km, 1 décimale
    denivele: Number.isFinite(denivele) ? Math.round(denivele) : undefined,
    city,
    dist: Math.round(dist * 10) / 10,
    img,
    url: url || undefined,
    must: must || undefined,
  });
  kept++;
}

// Déduplication : même sentier publié par plusieurs sources (nom normalisé + distance km)
const seen = new Set();
const deduped = [];
for (const it of items) {
  const k = it.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim() + '|' + (it.km || '?');
  if (seen.has(k)) { if (it.must) { const ex = deduped.find(d => d._k === k); if (ex) ex.must = true; } continue; }
  seen.add(k); it._k = k; deduped.push(it);
}
deduped.forEach(it => delete it._k);
items.length = 0; items.push(...deduped);

// Tri : incontournables d'abord, puis par distance croissante
items.sort((a, b) => (!!b.must - !!a.must) || (a.dist - b.dist));

const payload = { generated: new Date().toISOString(), radiusKm: RADIUS, count: items.length, items };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload));

// Mini-diagnostic (logs CI)
const byMode = {}; items.forEach(i => byMode[i.mode] = (byMode[i.mode] || 0) + 1);
const byDiff = {}; items.forEach(i => byDiff[i.difficulty || '—'] = (byDiff[i.difficulty || '—'] || 0) + 1);
console.error(`Itinéraires retenus : ${items.length} (après dédup) / ${total} analysés (rayon ${RADIUS}km + incontournables)`);
console.error('Avec image : ' + items.filter(i => i.img).length + ' | avec lien : ' + items.filter(i => i.url).length + ' | avec desc : ' + items.filter(i => i.desc).length);
console.error('Par mode : ' + JSON.stringify(byMode));
console.error('Par difficulté : ' + JSON.stringify(byDiff));
console.error('Incontournables : ' + items.filter(i => i.must).map(i => i.name + ' (' + i.dist + 'km)').join(' | '));
console.error('\n--- DIAGNOSTIC REPRESENTATIONS (12 premieres) ---');
debugLocators.forEach(d => console.error(`[${d.n}] ${d.name}\n   ${d.locs.join('\n   ')}`));
