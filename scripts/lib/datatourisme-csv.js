'use strict';
/**
 * Lecture de l'export régional DATAtourisme publié sur data.gouv.fr
 * (datatourisme-reg-bfc.csv, régénéré chaque nuit).
 *
 * Pourquoi cette source : le 19/08/2026 le flux du diffuseur s'est mis à renvoyer
 * une archive vide, sans erreur ni préavis, pour tous ses abonnés. Le même jour,
 * l'export national issu de la même base était normal. On lit donc l'export, qui
 * ne dépend ni d'une clé d'application ni d'une sélection à maintenir.
 *
 * Ce que l'export n'a pas, contrairement au flux : les libellés multilingues (DeepL
 * les régénère), les photos (Tourinsoft les fournit) et l'identifiant SIT — seul
 * l'UUID DATAtourisme est exposé, d'où la jointure par nom côté appelant.
 *
 * Colonnes : Nom_du_POI, Categories_de_POI, Latitude, Longitude, Adresse_postale,
 * Code_postal_et_commune, Periodes_regroupees, Covid19_mesures_specifiques,
 * Createur_de_la_donnee, SIT_diffuseur, Date_de_mise_a_jour, Contacts_du_POI,
 * Classements_du_POI, Description, URI_ID_du_POI
 */

/** CSV RFC 4180 : guillemets doublés, virgules et retours ligne dans les champs. */
function parseCsv(text) {
  const rows = [];
  let field = '', row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** "39400#Morbier" → "Morbier" */
const communeOf = (s) => String(s || '').split('#').pop().trim();

/** "#https://a<>https://b" → "https://a" (les contacts précèdent le #) */
const siteOf = (s) => {
  const after = String(s || '').split('#').slice(1).join('#');
  const first = after.split('<>').map(x => x.trim()).find(x => /^https?:\/\//i.test(x));
  return first || undefined;
};

/** "2026-09-02<->2026-09-02|2026-09-09<->2026-09-09" → { starts, ends } triés, dédoublonnés */
function periodsOf(s) {
  const starts = new Set(), ends = new Set();
  for (const p of String(s || '').split('|')) {
    const m = p.trim().match(/^(\d{4}-\d{2}-\d{2})(?:<->(\d{4}-\d{2}-\d{2}))?$/);
    if (!m) continue;
    starts.add(m[1]);
    ends.add(m[2] || m[1]);
  }
  return { starts: [...starts].sort(), ends: [...ends].sort() };
}

/**
 * "https://www.datatourisme.fr/ontology/core#Concert|http://schema.org/Event"
 * → ["Concert", "Event"] pour réutiliser les règles de catégorisation du flux.
 */
const typesOf = (s) => String(s || '').split('|')
  .map(u => u.trim().split(/[#/]/).pop())
  .filter(Boolean);

const isEvent = (s) => String(s || '').includes('#EntertainmentAndEvent');

/**
 * @param {string} text            contenu du CSV
 * @param {object} o
 * @param {number} o.radius        rayon en km
 * @param {string} o.today         'YYYY-MM-DD'
 * @param {(la:number,lo:number)=>number} o.haversine
 * @param {(types:string[])=>string} o.catFromTypes
 * @param {number} [o.maxDesc=300]
 * @returns {{events:object[], scanned:number}}
 */
function eventsFromCsv(text, o) {
  const rows = parseCsv(text);
  const head = rows[0] || [];
  const col = {};
  head.forEach((h, i) => { col[h] = i; });
  const maxDesc = o.maxDesc || 300;
  const events = [];
  let scanned = 0;

  for (const r of rows.slice(1)) {
    if (r.length !== head.length) continue;          // ligne tronquée
    if (!isEvent(r[col.Categories_de_POI])) continue;
    scanned++;

    const lat = parseFloat(r[col.Latitude]), lon = parseFloat(r[col.Longitude]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const dist = o.haversine(lat, lon);
    if (dist > o.radius) continue;

    const { starts, ends } = periodsOf(r[col.Periodes_regroupees]);
    if (!starts.length) continue;
    const lastEnd = ends[ends.length - 1];
    if (!lastEnd || lastEnd < o.today) continue;     // terminé

    const recurring = starts.length > 1;
    const durationDays = (Date.parse(lastEnd) - Date.parse(starts[0])) / 86400000;
    if (!recurring && durationDays > 210) continue;  // permanent → pas un événement

    const nom = String(r[col.Nom_du_POI] || '').trim();
    if (!nom) continue;

    const desc = String(r[col.Description] || '').replace(/\s+/g, ' ').trim().slice(0, maxDesc);
    const next = starts.find(s => s >= o.today) || (starts[0] <= o.today ? o.today : starts[0]);

    events.push({
      id: String(r[col.URI_ID_du_POI] || nom).split('/').pop(),
      title: { fr: nom },
      city: communeOf(r[col.Code_postal_et_commune]),
      dist: Math.round(dist * 10) / 10,
      start: starts[0], end: lastEnd, next,
      recurring: recurring || undefined,
      cat: o.catFromTypes(typesOf(r[col.Categories_de_POI])),
      url: siteOf(r[col.Contacts_du_POI]),
      desc: desc ? { fr: desc } : undefined,
      src: 'dg',
    });
  }
  return { events, scanned };
}

/** Clé de rapprochement entre sources : accents, casse et ponctuation neutralisés. */
const normName = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

module.exports = { parseCsv, eventsFromCsv, normName, typesOf };
