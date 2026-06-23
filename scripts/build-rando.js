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

const firstLocator = (rep) => {
  const res = rep && asArray(rep['ebucore:hasRelatedResource'])[0];
  return res && asArray(res['ebucore:locator'])[0] || null;
};

const items = [];
let total = 0, kept = 0;
const objectsDir = path.join(extractedDir, 'objects');
const root = fs.existsSync(objectsDir) ? objectsDir : extractedDir;

for (const f of walk(root)) {
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  const types = asArray(o['@type']);
  const mode = Object.keys(MODE).find(t => types.includes(t));
  if (!mode) continue;                                  // pas un itinéraire pédestre/vélo/route
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

  // Image (principale, sinon une représentation)
  const img = firstLocator(asArray(o['hasMainRepresentation'])[0])
    || firstLocator(asArray(o['hasRepresentation'])[0]) || undefined;

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

// Tri : incontournables d'abord, puis par distance croissante
items.sort((a, b) => (!!b.must - !!a.must) || (a.dist - b.dist));

const payload = { generated: new Date().toISOString(), radiusKm: RADIUS, count: items.length, items };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload));

// Mini-diagnostic (logs CI)
const byMode = {}; items.forEach(i => byMode[i.mode] = (byMode[i.mode] || 0) + 1);
const byDiff = {}; items.forEach(i => byDiff[i.difficulty || '—'] = (byDiff[i.difficulty || '—'] || 0) + 1);
console.error(`Itinéraires retenus : ${kept} / ${total} (rayon ${RADIUS}km + incontournables)`);
console.error('Par mode : ' + JSON.stringify(byMode));
console.error('Par difficulté : ' + JSON.stringify(byDiff));
console.error('Incontournables : ' + items.filter(i => i.must).map(i => i.name + ' (' + i.dist + 'km)').join(' | '));
console.error('\n--- 3 exemples ---');
items.slice(0, 3).forEach(i => console.error(JSON.stringify({ ...i, desc: i.desc && Object.keys(i.desc) }, null, 1)));
