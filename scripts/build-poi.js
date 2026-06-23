#!/usr/bin/env node
/**
 * Génère data/poi.json — points d'intérêt autour de Labergement.
 * Source : API Elasticsearch Tourinsoft / Decibelles BFC (mêmes données que doubs.travel),
 * types : hebergement, restaurant_degustation, activites_visites, infos_utiles.
 * Avantage vs flux DATAtourisme : photos natives + interrogation géo en direct.
 *
 * Usage : node scripts/build-poi.js <fichier_sortie> [rayon_km]
 */
const fs = require('fs');

const LAT = 46.7689, LON = 6.2807; // Labergement-Sainte-Marie
const outFile = process.argv[2];
const RADIUS = parseFloat(process.argv[3] || '30');
const ES_BASE = 'https://es.tourinsoft.com/tis_v5_bourgogne';

if (!outFile) {
  console.error('Usage: node scripts/build-poi.js <fichier_sortie> [rayon_km]');
  process.exit(1);
}

const asArray = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);
const stripHtml = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const titleCase = (s) => (s || '').toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());

const haversine = (la, lo) => {
  const R = 6371, r = Math.PI / 180;
  const dla = (la - LAT) * r, dlo = (lo - LON) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(LAT * r) * Math.cos(la * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Sous-type d'hébergement (code Tourinsoft → libellé)
const HEB_TYPE = {
  MEUBL: 'Meublé / Gîte', HOT: 'Hôtel', HPA: 'Camping', VIL: 'Village vacances',
  AUHLO: 'Auberge', CHOTE: "Chambre d'hôtes", CHA: "Chambre d'hôtes", RES: 'Résidence',
};

// oi_nom Tourinsoft → catégorie d'affichage
const OINOM_CAT = {
  'Restauration': 'Restauration',
  'Produits du terroir': 'Produits du terroir',
  'Vin': 'Produits du terroir',
  'Activités sportives, culturelles et formules itinérantes': 'Activité & Sport',
  'Sites et lieux de visites': 'Site & Visite',
  'Artisanat': 'Artisanat',
  'Commerces et Services': 'Commerce & Service',
  'Organismes et entreprises': 'Service & Organisme',
  'Prestations Affaires': 'Service & Organisme',
  'Programmes pédagogiques': 'Service & Organisme',
  'Accessibilité - Stationnement - Itinérance': 'Service & Organisme',
};

// Type de contenu ES → fonction de catégorisation
function categorize(esType, src) {
  if (esType === 'hebergement') return 'Hébergement';
  return OINOM_CAT[src.oi_nom] || 'Autre';
}

const SOURCE_FIELDS = ['nom', 'descom', 'position', 'commune', 'cp', 'web', 'mail', 'tel', 'telcellulaire', 'photos', 'type', 'oi_nom', 'categorie'];

async function fetchType(esType) {
  const body = {
    size: 5000,
    _source: SOURCE_FIELDS,
    query: { filtered: { filter: { geo_distance: { distance: RADIUS + 'km', position: { lat: LAT, lon: LON } } } } },
  };
  const r = await fetch(`${ES_BASE}/${esType}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${esType} HTTP ${r.status}`);
  const j = await r.json();
  return (j.hits && j.hits.hits) || [];
}

(async function () {
  const ES_TYPES = ['hebergement', 'restaurant_degustation', 'activites_visites', 'infos_utiles'];
  const items = [];

  for (const esType of ES_TYPES) {
    const hits = await fetchType(esType);
    for (const h of hits) {
      const s = h._source || {};
      const geo = s.position; // [lon, lat]
      if (!Array.isArray(geo) || geo.length < 2) continue;
      const lon = parseFloat(geo[0]), lat = parseFloat(geo[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const name = (s.nom || '').trim();
      if (!name) continue;

      const dist = haversine(lat, lon);
      if (dist > RADIUS) continue;

      const photos = Array.isArray(s.photos) ? s.photos.map(p => p && p.url).filter(Boolean) : [];
      let web = Array.isArray(s.web) ? s.web.find(Boolean) : s.web;
      if (web && !/^https?:/i.test(web)) web = 'http://' + web;
      const phone = (s.tel && s.tel.trim()) || (s.telcellulaire && s.telcellulaire.trim()) || null;

      const category = categorize(esType, s);
      const subtype = esType === 'hebergement' ? (HEB_TYPE[s.type] || null) : null;

      items.push({
        id: String(h._id).toLowerCase(),
        name,
        desc: stripHtml(s.descom).slice(0, 400) || null,
        category,
        subtype,
        esType,
        dist: Math.round(dist * 10) / 10,
        lat, lon,
        city: titleCase(s.commune),
        zip: s.cp || '',
        phone,
        website: web || null,
        email: (s.mail && s.mail.trim()) || null,
        photo: photos[0] || null,
        photos,
      });
    }
  }

  // Déduplication (nom normalisé + commune)
  const seen = new Set(), deduped = [];
  for (const it of items) {
    const k = it.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim() + '|' + it.city.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); deduped.push(it);
  }

  deduped.sort((a, b) => a.dist - b.dist);

  const payload = {
    generated: new Date().toISOString(),
    radiusKm: RADIUS,
    count: deduped.length,
    items: deduped,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload));

  const withPhoto = deduped.filter(i => i.photo).length;
  console.error(`POI : ${deduped.length} résultats dans ${RADIUS}km | avec photo : ${withPhoto} (${Math.round(withPhoto / deduped.length * 100)}%)`);
  const stats = {};
  for (const it of deduped) stats[it.category] = (stats[it.category] || 0) + 1;
  for (const [cat, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.error(`  ${cat} : ${n}`);
  }
})().catch(e => { console.error('Erreur :', e.message); process.exit(1); });
