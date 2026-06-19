#!/usr/bin/env node
/**
 * Génère data/agenda.json à partir d'un dossier d'objets DATAtourisme extraits.
 * Usage : node scripts/build-agenda.js <dossier_extrait> <fichier_sortie> [rayon_km]
 *
 * Le téléchargement + décompression (gzip→zip) est fait en amont par le workflow :
 *   curl -sSL "$DATATOURISME_URL" -o flux.bin
 *   gzip -dc flux.bin > flux.zip && unzip -q -o flux.zip -d extracted
 *   node scripts/build-agenda.js extracted data/agenda.json
 */
const fs = require('fs'), path = require('path');

const LAT = 46.7689, LON = 6.2807;            // Labergement-Sainte-Marie
const RADIUS = parseFloat(process.argv[4] || '20');
const extractedDir = process.argv[2];
const outFile = process.argv[3];
const today = new Date().toISOString().slice(0, 10);

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}
const haversine = (la, lo) => {
  const R = 6371, r = Math.PI / 180;
  const dla = (la - LAT) * r, dlo = (lo - LON) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(LAT * r) * Math.cos(la * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
// rdfs:label / desc -> { lang: "texte" } (1re valeur par langue, tronquée)
const langMap = (obj, max) => {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  for (const lg of Object.keys(obj)) {
    let v = obj[lg]; if (Array.isArray(v)) v = v[0];
    if (typeof v === 'string' && v.trim()) { out[lg] = max ? v.trim().slice(0, max) : v.trim(); }
  }
  return Object.keys(out).length ? out : null;
};
const asArray = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);

let total = 0, kept = 0;
const events = [];

for (const f of walk(path.join(extractedDir, 'objects'))) {
  total++;
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }

  const loc = asArray(o['isLocatedAt'])[0]; if (!loc) continue;
  const geo = loc['schema:geo']; if (!geo) continue;
  const lat = parseFloat(geo['schema:latitude']), lon = parseFloat(geo['schema:longitude']);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const dist = haversine(lat, lon);
  if (dist > RADIUS) continue;

  // Périodes : prochaine occurrence à venir
  const periods = asArray(o['takesPlaceAt']).filter(p => p && p.startDate);
  let starts = periods.map(p => p.startDate).filter(Boolean);
  let ends = periods.map(p => p.endDate || p.startDate).filter(Boolean);
  // fallback top-level
  if (!starts.length) starts = asArray(o['schema:startDate']).flatMap(s => String(s).split(','));
  if (!ends.length) ends = asArray(o['schema:endDate']).flatMap(s => String(s).split(','));
  starts = starts.map(s => s.trim()).filter(Boolean).sort();
  ends = ends.map(s => s.trim()).filter(Boolean).sort();
  const lastEnd = ends[ends.length - 1];
  if (!lastEnd || lastEnd < today) continue;                 // terminé → on ignore
  // prochaine date de début >= aujourd'hui, sinon en cours
  const next = starts.find(s => s >= today) || (starts[0] <= today ? today : starts[0]);

  const title = langMap(o['rdfs:label']); if (!title) continue;
  const addr = asArray(loc['schema:address'])[0] || {};
  const city = addr['schema:addressLocality'] || '';

  // image (optionnelle)
  const rep = asArray(o['hasMainRepresentation'])[0];
  const res = rep && asArray(rep['ebucore:hasRelatedResource'])[0];
  const img = res && asArray(res['ebucore:locator'])[0] || null;

  // site web (optionnel) via hasContact
  let url = null;
  for (const c of asArray(o['hasContact'])) {
    const hp = c && (c['foaf:homepage'] || c['schema:url']);
    if (hp) { url = asArray(hp)[0]; break; }
  }

  // description courte (toutes langues fournies par le flux), pour tous les événements
  const descObj = asArray(o['hasDescription'])[0];
  const desc = descObj ? (langMap(descObj['dc:description'], 300) || langMap(descObj['shortDescription'], 300)) : null;

  events.push({
    id: o['dc:identifier'] || o['@id'],
    title, city, dist: Math.round(dist * 10) / 10,
    start: starts[0], end: lastEnd, next,
    img, url, desc: desc || undefined,
  });
  kept++;
}

events.sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : a.dist - b.dist));
const payload = { generated: new Date().toISOString(), radiusKm: RADIUS, count: events.length, events };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload));
console.error(`Objets lus: ${total} | retenus (<=${RADIUS}km & à venir): ${kept} | ${outFile} (${fs.statSync(outFile).size} octets)`);
