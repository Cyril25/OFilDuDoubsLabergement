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

// === Catégorisation ===
// DATAtourisme : déduite des @type (priorité du plus spécifique au plus générique).
const CAT_RULES = [
  ['brocante',  ['GarageSale', 'BricABrac', 'Market', 'FairOrShow', 'SaleEvent']],
  ['musique',   ['Concert', 'MusicEvent', 'Recital', 'Festival']],
  ['spectacle', ['TheaterEvent', 'ShowEvent', 'ScreeningEvent', 'Cirque', 'CircusPlace']],
  ['expo',      ['Exhibition', 'VisualArtsEvent']],
  ['sport',     ['SportsEvent', 'SportsCompetition', 'SportsDemonstration', 'Rally', 'Game']],
  ['nature',    ['Rambling', 'WalkingTour', 'Tour', 'Visit']],
  ['enfants',   ['ChildrensEvent']],
  ['fete',      ['TraditionalCelebration', 'LocalAnimation']],
  ['atelier',   ['TrainingWorkshop', 'Conference']],
];
const catFromTypes = (types) => {
  const set = new Set(asArray(types).map(t => String(t).replace(/^schema:/, '')));
  for (const [cat, keys] of CAT_RULES) if (keys.some(k => set.has(k))) return cat;
  return 'autre';
};
// Tourinsoft : pas de @type → déduite des mots-clés du titre.
const KW_RULES = [
  ['brocante',  /vide.?grenier|brocante|puces|déball|march[ée]|foire|salon/i],
  ['musique',   /concert|musique|chorale|fanfare|festival|jazz|\brock\b|chant|harmonie/i],
  ['spectacle', /th[ée][âa]tre|spectacle|cirque|cin[ée]ma|projection|\bfilm\b|humour|one.?man|caf[ée].?th[ée][âa]tre/i],
  ['expo',      /expo|exposition|vernissage/i],
  ['sport',     /tournoi|comp[ée]tition|\bcourse\b|trail|\brun\b|\bmatch\b|cyclo|\bv[ée]lo\b|natation|p[ée]tanque/i],
  ['nature',    /rando|balade|sortie nature|visite|d[ée]couverte|sentier|champignon|nature/i],
  ['enfants',   /enfant|jeune public|famille|conte|\bkids\b/i],
  ['fete',      /f[êe]te|feu d.artifice|carnaval|\bbal\b|kermesse|repas|\bloto\b|m[ée]choui|guinguette/i],
  ['atelier',   /atelier|stage|conf[ée]rence|formation|initiation/i],
];
const catFromTitle = (t) => {
  const s = t || '';
  for (const [cat, re] of KW_RULES) if (re.test(s)) return cat;
  return 'autre';
};

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

  // Nature de l'événement : récurrent (plusieurs dates distinctes) ? durée totale ?
  const recurring = new Set(starts).size > 1;
  const durationDays = (Date.parse(lastEnd) - Date.parse(starts[0])) / 86400000;
  // Permanent (non récurrent et > ~7 mois) → ce n'est pas un événement, on l'exclut de l'agenda
  if (!recurring && durationDays > 210) continue;

  const title = langMap(o['rdfs:label']); if (!title) continue;
  const addr = asArray(loc['schema:address'])[0] || {};
  const city = addr['schema:addressLocality'] || '';

  // image (optionnelle) : représentation principale, sinon secondaire
  const rep = asArray(o['hasMainRepresentation'])[0] || asArray(o['hasRepresentation'])[0];
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
    recurring: recurring || undefined,
    cat: catFromTypes(o['@type']),
    img, url, desc: desc || undefined,
  });
  kept++;
}

// === Fusion hybride avec Tourinsoft (même donnée que le widget de l'OT) ===
// 1) Enrichit nos événements DATAtourisme avec les photos (jointure par id en minuscules).
// 2) Ajoute les événements présents UNIQUEMENT chez Tourinsoft (non publiés en open data),
//    avec leur description en français (les titres seront traduits ensuite par DeepL).
// En cas d'échec réseau, on garde l'agenda DATAtourisme tel quel.
const photosUrls = (s) => (Array.isArray(s.photos) ? s.photos : []).map(p => p && p.url).filter(Boolean);
const photoCredit = (s) => { const p = (Array.isArray(s.photos) ? s.photos : [])[0]; return (p && p.credit) || undefined; };
const stripHtml = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const titleCase = (s) => (s || '').toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());

async function mergeTourinsoft() {
  const URL = 'https://es.tourinsoft.com/tis_v5_bourgogne/fetes_evenements/_search';
  const body = {
    size: 600,
    _source: ['nom', 'commune', 'position', 'dates', 'photos', 'web', 'descom'],
    query: { filtered: { filter: { and: [
      { geo_distance: { distance: RADIUS + 'km', position: { lat: LAT, lon: LON } } },
      { nested: { path: 'dates', filter: { range: { 'dates.datefin': { gte: today } } } } }
    ] } } }
  };
  let docs;
  try {
    const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { console.error('Tourinsoft : HTTP ' + r.status + ' — agenda DATAtourisme seul.'); return; }
    const j = await r.json();
    docs = (j.hits && j.hits.hits) || [];
  } catch (err) { console.error('Tourinsoft : échec (' + err.message + ') — agenda DATAtourisme seul.'); return; }

  const ourIds = new Set(events.map(e => String(e.id).toLowerCase()));
  const byId = {};
  docs.forEach(d => { byId[d._id] = d._source; });

  // 1) Enrichir nos événements avec les photos
  let enriched = 0;
  for (const e of events) {
    const s = byId[String(e.id).toLowerCase()];
    if (!s) continue;
    const urls = photosUrls(s);
    if (!urls.length) continue;
    e.img = urls[0];
    if (urls.length > 1) e.gallery = urls.slice(1, 4);
    const c = photoCredit(s); if (c) e.credit = c;
    enriched++;
  }

  // 2) Ajouter les événements présents uniquement chez Tourinsoft
  let added = 0;
  for (const d of docs) {
    if (ourIds.has(d._id)) continue;
    const s = d._source;
    const nom = s.nom; if (!nom) continue;
    const geo = s.position;                       // [lon, lat]
    if (!Array.isArray(geo) || geo.length < 2) continue;
    const lon = parseFloat(geo[0]), lat = parseFloat(geo[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const periods = Array.isArray(s.dates) ? s.dates : [];
    const starts = periods.map(p => p && p.datedebut).filter(Boolean).sort();
    const ends = periods.map(p => p && (p.datefin || p.datedebut)).filter(Boolean).sort();
    if (!starts.length) continue;
    const lastEnd = ends[ends.length - 1];
    if (!lastEnd || lastEnd < today) continue;
    const recurring = new Set(starts).size > 1;
    const durationDays = (Date.parse(lastEnd) - Date.parse(starts[0])) / 86400000;
    if (!recurring && durationDays > 210) continue;   // permanent → exclu
    const next = starts.find(x => x >= today) || (starts[0] <= today ? today : starts[0]);
    const urls = photosUrls(s);
    const descTxt = stripHtml(s.descom).slice(0, 300);
    let web = Array.isArray(s.web) ? s.web.find(Boolean) : s.web;
    if (web && !/^https?:/i.test(web)) web = 'http://' + web;
    events.push({
      id: d._id,
      title: { fr: nom },
      city: titleCase(s.commune),
      dist: Math.round(haversine(lat, lon) * 10) / 10,
      start: starts[0], end: lastEnd, next,
      recurring: recurring || undefined,
      cat: catFromTitle(nom),
      img: urls[0] || undefined,
      gallery: urls.length > 1 ? urls.slice(1, 4) : undefined,
      credit: photoCredit(s),
      url: web || undefined,
      desc: descTxt ? { fr: descTxt } : undefined,
      src: 'tis'
    });
    added++;
  }
  console.error('Tourinsoft : photos sur ' + enriched + ' events, + ' + added + ' événements complétés');
}

(async function () {
  await mergeTourinsoft();
  events.sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : a.dist - b.dist));
  const payload = { generated: new Date().toISOString(), radiusKm: RADIUS, count: events.length, events };
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload));
  console.error(`DATAtourisme: ${kept} | total après fusion: ${events.length} | ${outFile} (${fs.statSync(outFile).size} octets)`);
})();
