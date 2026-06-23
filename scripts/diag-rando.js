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

// Dump ciblé des champs utiles sur 3 randonnées (WalkingTour)
let shown = 0;
for (const f of walk(root)) {
  if (shown >= 3) break;
  let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  if (!asArray(o['@type']).includes('WalkingTour')) continue;
  shown++;
  const pick = (k) => o[k] !== undefined ? JSON.stringify(o[k]) : '(absent)';
  console.error('\n===== RANDO ' + shown + ' : ' + JSON.stringify(o['rdfs:label']) + ' =====');
  console.error('tourDistance         : ' + pick('tourDistance'));
  console.error('positiveCumulDiff    : ' + pick('positiveCumulDifference'));
  console.error('hasTourType          : ' + pick('hasTourType'));
  console.error('hasPracticeCondition : ' + pick('hasPracticeCondition').slice(0, 600));
  console.error('hasTheme             : ' + pick('hasTheme').slice(0, 400));
  console.error('isLocatedAt          : ' + pick('isLocatedAt').slice(0, 700));
  console.error('hasMainRepresentation: ' + pick('hasMainRepresentation').slice(0, 700));
  console.error('hasContact           : ' + pick('hasContact').slice(0, 500));
}
