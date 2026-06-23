#!/usr/bin/env node
/**
 * Diagnostic TEMPORAIRE du flux « Itinéraire touristique » DATAtourisme.
 * Énumère : nb d'objets, répartition des @type, fréquence des propriétés
 * (pour repérer où se trouvent distance / durée / difficulté / trace GPX),
 * et affiche 2 exemples complets (tronqués).
 * Usage : node scripts/diag-rando.js <dossier_extrait>
 */
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const asArray = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}

const objectsDir = path.join(dir, 'objects');
const root = fs.existsSync(objectsDir) ? objectsDir : dir;

const typeStats = {}, keyStats = {};
let total = 0;
const samples = [];
const bump = (m, k) => { if (k) m[k] = (m[k] || 0) + 1; };

for (const f of walk(root)) {
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  total++;
  asArray(o['@type']).forEach(t => bump(typeStats, String(t)));
  Object.keys(o).forEach(k => bump(keyStats, k));
  if (samples.length < 2) samples.push(o);
}

const dump = (label, m) => {
  console.error('\n=== ' + label + ' (' + Object.keys(m).length + ' valeurs) ===');
  Object.entries(m).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.error(String(n).padStart(5) + '  ' + k));
};

console.error('TOTAL objets dans le flux : ' + total);
dump('@type', typeStats);
dump('Propriétés (clés de 1er niveau)', keyStats);

// Géo + volume par rayon autour de Labergement-Sainte-Marie
const LAT = 46.7689, LON = 6.2807;
const haversine = (la, lo) => {
  const R = 6371, r = Math.PI / 180;
  const dla = (la - LAT) * r, dlo = (lo - LON) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(LAT * r) * Math.cos(la * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const TOUR_TYPES = ['WalkingTour', 'CyclingTour', 'RoadTour'];
let withGeo = 0, geoSample = null;
const within = { 15: 0, 20: 0, 30: 0, 40: 0 };
const byMode = {};
for (const f of walk(root)) {
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  const types = asArray(o['@type']);
  if (!TOUR_TYPES.some(t => types.includes(t))) continue;
  const loc = asArray(o['isLocatedAt'])[0];
  const geo = loc && loc['schema:geo'];
  if (!geo) continue;
  const lat = parseFloat(geo['schema:latitude']), lon = parseFloat(geo['schema:longitude']);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  withGeo++;
  if (!geoSample) geoSample = JSON.stringify(geo);
  const d = haversine(lat, lon);
  for (const km of [15, 20, 30, 40]) if (d <= km) within[km]++;
  if (d <= 30) { const tt = types.find(t => TOUR_TYPES.includes(t)); byMode[tt] = (byMode[tt] || 0) + 1; }
}
console.error('\n=== Itinéraires (Walking/Cycling/Road) avec géo : ' + withGeo + ' ===');
console.error('Exemple schema:geo : ' + geoSample);
console.error('Dans le rayon : 15km=' + within[15] + ' | 20km=' + within[20] + ' | 30km=' + within[30] + ' | 40km=' + within[40]);
console.error('Répartition (≤30km) par type : ' + JSON.stringify(byMode));
