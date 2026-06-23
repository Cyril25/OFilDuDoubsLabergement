#!/usr/bin/env node
/**
 * Génère data/poi.json — points d'intérêt autour de Labergement (flux DATAtourisme généraliste).
 * Usage : node scripts/build-poi.js <dossier_datatourisme_extrait> <fichier_sortie> [rayon_km]
 */
const fs = require('fs'), path = require('path');

const LAT = 46.7689, LON = 6.2807; // Labergement-Sainte-Marie
const RADIUS = parseFloat(process.argv[4] || '30');
const extractedDir = process.argv[2];
const outFile = process.argv[3];

if (!extractedDir || !outFile) {
  console.error('Usage: node scripts/build-poi.js <dossier_extrait> <fichier_sortie> [rayon_km]');
  process.exit(1);
}

const asArray = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);

const haversine = (la, lo) => {
  const R = 6371, r = Math.PI / 180;
  const dla = (la - LAT) * r, dlo = (lo - LON) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(LAT * r) * Math.cos(la * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const getLang = (obj, lang = 'fr') => {
  if (!obj) return null;
  const v = obj[lang] || obj['fr'] || obj['en'];
  if (Array.isArray(v)) return v[0] || null;
  return v || null;
};

// Catégories simplifiées basées sur les @type DATAtourisme
const categorize = (types) => {
  const t = types.join(' ');
  if (t.includes('Accommodation') || t.includes('Hotel') || t.includes('Camping') || t.includes('Gite') || t.includes('BedAndBreakfast')) return 'Hébergement';
  if (t.includes('Restaurant') || t.includes('FoodEstablishment') || t.includes('Bakery') || t.includes('FarmhouseInn')) return 'Restauration';
  if (t.includes('Event') || t.includes('Concert') || t.includes('Festival')) return 'Événement';
  if (t.includes('Tour') || t.includes('Walk') || t.includes('CyclingTour') || t.includes('SportsTrail')) return 'Randonnée / Circuit';
  if (t.includes('SportsAndLeisurePlace') || t.includes('ActivityProvider') || t.includes('SkiResort') || t.includes('ClimbingWall') || t.includes('Practice')) return 'Sport & Loisir';
  if (t.includes('NaturalHeritage') || t.includes('Landform') || t.includes('Bog') || t.includes('Cliff') || t.includes('NaturalCuriosity')) return 'Patrimoine naturel';
  if (t.includes('CulturalSite') || t.includes('Museum') || t.includes('Monument') || t.includes('ReligiousSite') || t.includes('TechnicalHeritage')) return 'Patrimoine culturel';
  if (t.includes('Store') || t.includes('Shop') || t.includes('LocalProductsShop') || t.includes('CraftsmanShop')) return 'Commerce & Artisanat';
  if (t.includes('Marina') || t.includes('Park') || t.includes('Garden')) return 'Nature & Détente';
  return 'Autre';
};

// Extraire la photo principale
// Structure : hasRepresentation[] → ebucore:hasRelatedResource[] → ebucore:locator[]
const getPhoto = (obj) => {
  for (const rep of asArray(obj['hasRepresentation'])) {
    for (const res of asArray(rep['ebucore:hasRelatedResource'])) {
      const loc = res['ebucore:locator'];
      const url = Array.isArray(loc) ? loc[0] : loc;
      if (url && typeof url === 'string') return url;
    }
  }
  return null;
};

const indexPath = path.join(extractedDir, 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const items = [];
let processed = 0;

for (const entry of index) {
  const filePath = path.join(extractedDir, 'objects', entry.file);
  let obj;
  try { obj = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { continue; }

  // Coordonnées
  const place = asArray(obj['isLocatedAt'])[0];
  if (!place) continue;
  const geo = place['schema:geo'];
  if (!geo) continue;
  const lat = parseFloat(geo['schema:latitude']);
  const lon = parseFloat(geo['schema:longitude']);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

  const dist = haversine(lat, lon);
  if (dist > RADIUS) continue;

  // Nom
  const name = getLang(obj['rdfs:label']) || entry.label || 'Sans nom';

  // Description courte
  const desc = getLang(obj['rdfs:comment']);

  // Types
  const types = asArray(obj['@type']).filter(t => !t.startsWith('schema:') && !t.startsWith('olo:') && t !== 'PlaceOfInterest' && t !== 'PointOfInterest');
  const category = categorize(asArray(obj['@type']));

  // Adresse
  const address = asArray(place['schema:address'])[0];
  const city = address?.['schema:addressLocality'] || '';
  const zip = address?.['schema:postalCode'] || '';

  // Contact
  const contact = asArray(obj['hasContact'])[0] || {};
  const phone = asArray(contact['schema:telephone'])[0] || null;
  const website = asArray(contact['foaf:homepage'])[0] || null;
  const email = asArray(contact['schema:email'])[0] || null;

  // Photo
  const photo = getPhoto(obj);

  // URL DATAtourisme
  const dtUrl = obj['@id'] || null;

  items.push({
    id: obj['dc:identifier'] || entry.file,
    name,
    desc,
    category,
    types,
    dist: Math.round(dist * 10) / 10,
    lat,
    lon,
    city,
    zip,
    phone,
    website,
    email,
    photo,
    dtUrl,
  });

  processed++;
}

items.sort((a, b) => a.dist - b.dist);

const payload = {
  generated: new Date().toISOString(),
  radiusKm: RADIUS,
  count: items.length,
  items,
};

fs.writeFileSync(outFile, JSON.stringify(payload));
console.error(`POI : ${items.length} résultats dans ${RADIUS}km (sur ${index.length} objets traités)`);

// Stats par catégorie
const stats = {};
for (const it of items) stats[it.category] = (stats[it.category] || 0) + 1;
for (const [cat, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.error(`  ${cat} : ${n}`);
}
