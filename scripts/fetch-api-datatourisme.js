#!/usr/bin/env node
/**
 * Télécharge une sélection de l'API DATAtourisme autour de Labergement et l'écrit
 * comme le faisait le flux du diffuseur : un fichier JSON par objet dans <sortie>/objects/.
 * build-rando.js et build-agenda.js lisent donc indifféremment l'une ou l'autre source.
 *
 * Remplace le flux du diffuseur, dont la plateforme ferme en octobre 2027.
 * Doc : https://api.datatourisme.fr/v1/docs — quota 1000 requêtes/heure, 100 objets/page.
 *
 * Usage : DATATOURISME_API_KEY=… node scripts/fetch-api-datatourisme.js <tour|entertainmentAndEvent> <rayon_km> <sortie>
 */
const fs = require('fs'), path = require('path');

const LAT = 46.7689, LON = 6.2807;                       // Labergement-Sainte-Marie
const BASE = 'https://api.datatourisme.fr/v1';
const [endpoint, radius, outDir] = process.argv.slice(2);
const KEY = (process.env.DATATOURISME_API_KEY || '').trim();

// `fields` remplace toute la sélection par défaut : on liste ce que lisent les scripts de
// build. Sans lui, la liste omet identifier, hasRepresentation (GPX/PDF), difficulté, dénivelé.
const FIELDS = {
  tour: 'uuid,identifier,label,hasDescription,comment,positiveCumulDifference,tourDistance,hasTourType,' +
        'hasPracticeCondition,hasRepresentation,hasMainRepresentation,isLocatedAt',
  entertainmentAndEvent: 'uuid,identifier,type,label,hasDescription,takesPlaceAt,isLocatedAt,' +
        'hasMainRepresentation,hasRepresentation,hasContact',
};
// Filet de sécurité, comme pour le flux : une réponse quasi vide ne doit pas passer pour bonne.
const MIN_OBJECTS = { tour: 500, entertainmentAndEvent: 20 };

if (!FIELDS[endpoint] || !radius || !outDir) {
  console.error('usage: fetch-api-datatourisme.js <tour|entertainmentAndEvent> <rayon_km> <sortie>');
  process.exit(2);
}
if (!KEY) {
  console.error("::error::Le secret DATATOURISME_API_KEY n'est pas défini.");
  process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 429 et 5xx : on réessaie ; 401/403 : clé refusée, inutile d'insister.
async function getJson(url) {
  for (let i = 1; i <= 5; i++) {
    let r;
    try {
      r = await fetch(url, { headers: { 'X-API-Key': KEY, Accept: 'application/json' } });
    } catch (e) {
      console.error(`  tentative ${i}/5 : ${e.message}`);
      await sleep(i * 10000);
      continue;
    }
    if (r.ok) return r.json();
    const body = (await r.text()).slice(0, 300);
    if (r.status === 401 || r.status === 403) {
      console.error(`::error::L'API DATAtourisme refuse la clé (HTTP ${r.status}) : ${body}`);
      process.exit(1);
    }
    console.error(`  tentative ${i}/5 : HTTP ${r.status} ${body}`);
    await sleep(i * 10000);
  }
  console.error(`::error::API DATAtourisme indisponible après 5 tentatives (${endpoint}).`);
  process.exit(1);
}

(async () => {
  const params = new URLSearchParams({
    geo_distance: `${LAT},${LON},${radius}km`,
    lang: '*',
    page_size: '100',
    fields: FIELDS[endpoint],
  });
  let url = `${BASE}/${endpoint}?${params}`;
  const objects = [];
  let pages = 0, total;
  // Pagination par le lien `next` : `page` plafonne à 10 000 résultats.
  while (url) {
    const j = await getJson(url);
    pages++;
    if (total == null) total = j.meta && j.meta.total;
    objects.push(...(j.objects || []));
    url = j.meta && j.meta.next;
  }
  console.error(`API ${endpoint} (${radius} km) : ${objects.length}/${total} objets en ${pages} appels.`);

  if (objects.length < MIN_OBJECTS[endpoint]) {
    console.error(`::error::L'API ne renvoie que ${objects.length} objets pour ${endpoint} (seuil ${MIN_OBJECTS[endpoint]}).`);
    process.exit(1);
  }
  // On n'écrit qu'une fois tout reçu : un échec en cours de route laisse <sortie> vide,
  // et le repli sur le flux du diffuseur n'y trouve pas de restes mélangés.
  const dir = path.join(outDir, 'objects');
  fs.mkdirSync(dir, { recursive: true });
  for (const o of objects) fs.writeFileSync(path.join(dir, o.uuid + '.json'), JSON.stringify(o));
  console.error(`::notice::Source DATAtourisme : API (${objects.length} objets ${endpoint}).`);
})().catch(e => { console.error('::error::fetch-api-datatourisme : ' + e.message); process.exit(1); });
