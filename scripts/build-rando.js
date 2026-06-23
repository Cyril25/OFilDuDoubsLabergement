#!/usr/bin/env node
/**
 * Génère data/rando.json — itinéraires de randonnée/vélo autour de Labergement.
 * HYBRIDE :
 *  - BASE : Tourinsoft/Decibelles BFC, type "randonnees" (riche en vélo + photos + catégories).
 *  - ENRICHISSEMENT : flux DATAtourisme extrait (difficulté, dénivelé, trace GPX,
 *    descriptions multilingues), joint par identifiant (Tourinsoft _id == dc:identifier DATAtourisme, en minuscules).
 *
 * Usage : node scripts/build-rando.js <dossier_datatourisme_extrait> <fichier_sortie> [rayon_km]
 */
const fs = require('fs'), path = require('path');

const LAT = 46.7689, LON = 6.2807;                       // Labergement-Sainte-Marie
const RADIUS = parseFloat(process.argv[4] || '80');
const extractedDir = process.argv[2];                    // DATAtourisme (enrichissement)
const outFile = process.argv[3];
const TOURINSOFT_URL = 'https://es.tourinsoft.com/tis_v5_bourgogne/randonnees/_search';

// --- Traduction DeepL des descriptions manquantes (frugal : seulement les itinéraires ≤30 km) ---
const DEEPL_KEY = process.env.DEEPL_API_KEY || '';
const DEEPL_LANG = { de: 'DE', en: 'EN-GB', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT-PT' };
const TARGET_LANGS = ['en', 'de', 'nl', 'es', 'it', 'pt'];
const NEAR_KM = 30;                                      // on ne traduit que les itinéraires proches (visibles par défaut)
const cachePath = path.join(path.dirname(outFile), 'rando-i18n-cache.json');
let cache = {};
try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) {}
const ckey = (lang, t) => lang + '' + t;
async function deeplBatch(lang, batch) {                 // batch: [{key, text}]
  const base = DEEPL_KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const body = new URLSearchParams();
  body.append('source_lang', 'FR');
  body.append('target_lang', DEEPL_LANG[lang]);
  for (const it of batch) body.append('text', it.text);
  const resp = await fetch(base + '/v2/translate', {
    method: 'POST',
    headers: { 'Authorization': 'DeepL-Auth-Key ' + DEEPL_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) throw new Error('DeepL ' + resp.status + ' : ' + (await resp.text()).slice(0, 140));
  const j = await resp.json();
  j.translations.forEach((t, i) => { cache[batch[i].key] = t.text; });
}

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
const stripHtml = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const titleCase = (s) => (s || '').toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}

// Catégorie Tourinsoft (key) -> mode. (ski/moto -> non retenus)
const CAT_MODE = {
  ITIVTT: 'bike', ITICYCLO: 'bike', ITIGRAVEL: 'bike',
  ITIROUTE: 'road',
  ITIPEDES: 'foot', ITITRAIL: 'foot', ITIRAQUET: 'foot', ITIGEOCA: 'foot',
  ITIEQUES: 'horse',
};
const MODE_PRIORITY = ['bike', 'foot', 'horse', 'road'];
const modeFromCats = (cats) => {
  const set = new Set(asArray(cats).map(c => c && CAT_MODE[c.key]).filter(Boolean));
  for (const m of MODE_PRIORITY) if (set.has(m)) return m;
  return null;
};

// ===== Enrichissement DATAtourisme (par identifiant en minuscules) =====
const DIFF = { 'kb:EasyTour': 'easy', 'kb:MediumDifficultyTour': 'medium', 'kb:DifficultTour': 'hard', 'kb:VeryDifficultTour': 'very_hard' };
const TYPE = { 'kb:Loop': 'loop', 'kb:OpenJaw': 'roaming', 'kb:RoundTrip': 'roundtrip', 'kb:OneWay': 'oneway' };
const TYPE_PRIORITY = ['kb:Loop', 'kb:OpenJaw', 'kb:RoundTrip', 'kb:OneWay'];
function buildEnrichMap(dir) {
  const map = {};
  const objectsDir = path.join(dir, 'objects');
  const root = fs.existsSync(objectsDir) ? objectsDir : dir;
  if (!fs.existsSync(root)) return map;
  for (const f of walk(root)) {
    let o; try { o = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    const id = (o['dc:identifier'] || '').toString().toLowerCase();
    if (!id) continue;
    const pc = asArray(o['hasPracticeCondition'])[0];
    const diffId = pc && asArray(pc['hasDifficultyLevel'])[0] && asArray(pc['hasDifficultyLevel'])[0]['@id'];
    const tourTypeIds = asArray(o['hasTourType']).map(t => t && t['@id']);
    const typeId = TYPE_PRIORITY.find(idd => tourTypeIds.includes(idd));
    const denivele = parseFloat(o['positiveCumulDifference']);
    // GPX + topoguide PDF parmi les représentations
    let gpx, pdf;
    for (const rep of [...asArray(o['hasMainRepresentation']), ...asArray(o['hasRepresentation'])]) {
      for (const res of asArray(rep && rep['ebucore:hasRelatedResource'])) {
        for (const loc of asArray(res && res['ebucore:locator'])) {
          if (typeof loc !== 'string') continue;
          if (!gpx && /\.gpx(\?|$)/i.test(loc)) gpx = loc;
          if (!pdf && /\.pdf(\?|$)/i.test(loc)) pdf = loc;
        }
      }
    }
    const descObj = asArray(o['hasDescription'])[0];
    const descML = (descObj && langMap(descObj['dc:description'], 500)) || langMap(o['rdfs:comment'], 500) || null;
    map[id] = {
      difficulty: DIFF[diffId] || undefined,
      denivele: Number.isFinite(denivele) ? Math.round(denivele) : undefined,
      type: TYPE[typeId] || undefined,
      gpx,
      pdf,
      descML,
    };
  }
  return map;
}

async function fetchTourinsoft() {
  const body = {
    size: 3000,
    _source: ['nom', 'categorie', 'distance', 'duree', 'descom', 'photos', 'position', 'web', 'commune'],
    query: { filtered: { filter: { geo_distance: { distance: RADIUS + 'km', position: { lat: LAT, lon: LON } } } } },
  };
  const r = await fetch(TOURINSOFT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Tourinsoft HTTP ' + r.status);
  const j = await r.json();
  return (j.hits && j.hits.hits) || [];
}

(async function () {
  const enrich = extractedDir && fs.existsSync(extractedDir) ? buildEnrichMap(extractedDir) : {};
  const docs = await fetchTourinsoft();

  const items = [];
  let enriched = 0;
  for (const d of docs) {
    const s = d._source || {};
    const mode = modeFromCats(s.categorie);
    if (!mode) continue;                                  // ski / moto / sans catégorie connue
    const geo = s.position;                               // [lon, lat]
    if (!Array.isArray(geo) || geo.length < 2) continue;
    const lon = parseFloat(geo[0]), lat = parseFloat(geo[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name = (s.nom || '').trim(); if (!name) continue;

    const id = String(d._id).toLowerCase();
    const en = enrich[id] || {};
    if (enrich[id]) enriched++;

    const km = parseFloat(s.distance);
    const descTxt = stripHtml(s.descom).slice(0, 500);
    const photos = Array.isArray(s.photos) ? s.photos.map(p => p && p.url).filter(Boolean) : [];
    let web = Array.isArray(s.web) ? s.web.find(Boolean) : s.web;
    if (web && !/^https?:/i.test(web)) web = 'http://' + web;

    items.push({
      id,
      name,
      desc: en.descML || (descTxt ? { fr: descTxt } : undefined),
      mode,
      type: en.type,
      difficulty: en.difficulty,
      km: Number.isFinite(km) && km > 0 ? Math.round(km * 10) / 10 : undefined,
      denivele: en.denivele,
      city: titleCase(s.commune),
      dist: Math.round(haversine(lat, lon) * 10) / 10,
      img: photos[0] || undefined,
      gpx: en.gpx,
      pdf: en.pdf,
      url: web || undefined,
    });
  }

  // Déduplication (nom normalisé + distance km)
  const seen = new Set(), deduped = [];
  for (const it of items) {
    const k = it.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim() + '|' + (it.km || '?');
    if (seen.has(k)) continue;
    seen.add(k); deduped.push(it);
  }
  deduped.sort((a, b) => a.dist - b.dist);

  // === Traduction DeepL des descriptions manquantes (itinéraires ≤30 km uniquement) ===
  const missing = new Map();
  for (const it of deduped) {
    if (it.dist == null || it.dist > NEAR_KM) continue;
    const fr = it.desc && it.desc.fr; if (!fr) continue;
    for (const lang of TARGET_LANGS) {
      if (it.desc[lang]) continue;
      const k = ckey(lang, fr);
      if (cache[k] !== undefined) continue;
      missing.set(k, { lang, key: k, text: fr });
    }
  }
  console.error('Descriptions à traduire (≤' + NEAR_KM + 'km, hors cache) : ' + missing.size + (DEEPL_KEY ? '' : ' — DEEPL_API_KEY absente, on applique seulement le cache'));
  if (missing.size && DEEPL_KEY) {
    const byLang = {};
    for (const m of missing.values()) (byLang[m.lang] = byLang[m.lang] || []).push(m);
    try {
      for (const lang of Object.keys(byLang)) {
        const arr = byLang[lang];
        for (let i = 0; i < arr.length; i += 40) {
          await deeplBatch(lang, arr.slice(i, i + 40));
          console.error('  ' + lang + ' : ' + Math.min(i + 40, arr.length) + '/' + arr.length);
        }
      }
    } catch (e) {
      console.error('DeepL interrompu (quota atteint ?) : ' + e.message + ' — cache partiel appliqué, build poursuivi.');
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 0));
  }
  // Application du cache aux descriptions
  let filled = 0;
  for (const it of deduped) {
    const fr = it.desc && it.desc.fr; if (!fr) continue;
    for (const lang of TARGET_LANGS) {
      if (it.desc[lang]) continue;
      const v = cache[ckey(lang, fr)];
      if (v !== undefined) { it.desc[lang] = v; filled++; }
    }
  }
  console.error('Descriptions complétées via cache/DeepL : ' + filled);

  const payload = { generated: new Date().toISOString(), radiusKm: RADIUS, count: deduped.length, items: deduped };
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload));

  const byMode = {}; deduped.forEach(i => byMode[i.mode] = (byMode[i.mode] || 0) + 1);
  console.error(`Itinéraires : ${deduped.length} (rayon ${RADIUS}km) | enrichis DATAtourisme : ${enriched}`);
  console.error('Par mode : ' + JSON.stringify(byMode));
  console.error('Photo : ' + deduped.filter(i => i.img).length + ' | difficulté : ' + deduped.filter(i => i.difficulty).length + ' | dénivelé : ' + deduped.filter(i => i.denivele).length + ' | GPX : ' + deduped.filter(i => i.gpx).length + ' | topoguide : ' + deduped.filter(i => i.pdf).length + ' | lien : ' + deduped.filter(i => i.url).length);
  const vis = deduped.filter(i => i.dist <= 30).length;
  console.error('Visibles ≤30km : ' + vis + ' | repliés 30-' + RADIUS + 'km : ' + (deduped.length - vis));
})().catch(e => { console.error('Erreur build-rando :', e.message); process.exit(1); });
