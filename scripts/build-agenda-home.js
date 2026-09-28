#!/usr/bin/env node
/**
 * Sélection « Cette semaine autour du logement » pour la page d'accueil.
 *
 * Le fichier complet de l'agenda pèse ~440 Ko : trop lourd pour l'accueil. On en extrait
 * chaque nuit un petit fichier (quelques Ko) avec :
 *  - le nombre d'événements ponctuels des 7 prochains jours (les expositions de plusieurs
 *    semaines restent sur la page Agenda, rubrique « En ce moment ») ;
 *  - 4 événements choisis : les plus proches du logement, une seule fois par catégorie
 *    pour varier (un concert, un marché, une fête…), titres dans les 7 langues.
 *
 * Usage : node scripts/build-agenda-home.js data/agenda.json data/agenda-home.json
 */
const fs = require('fs');

const src = process.argv[2] || 'data/agenda.json';
const out = process.argv[3] || 'data/agenda-home.json';
const JOURS = 7, CHOIX = 4, DUREE_MAX = 3; // jours

const agenda = JSON.parse(fs.readFileSync(src, 'utf8'));
const jour = (s) => (s || '').slice(0, 10);
// Date du jour à Paris (le cron tourne vers 00:30 UTC)
const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const fin = new Date(today + 'T12:00:00Z'); fin.setUTCDate(fin.getUTCDate() + JOURS - 1);
const last = fin.toISOString().slice(0, 10);
const duree = (e) => (Date.parse(jour(e.end || e.start)) - Date.parse(jour(e.start))) / 864e5;

const candidats = (agenda.events || [])
  .map(e => ({ e, date: jour(e.next || e.start) }))
  .filter(({ e, date }) => date >= today && date <= last && duree(e) <= DUREE_MAX);

const pris = new Set(), picks = [];
for (const { e, date } of [...candidats].sort((a, b) => a.e.dist - b.e.dist || a.date.localeCompare(b.date))) {
  if (picks.length >= CHOIX) break;
  if (pris.has(e.cat)) continue;
  pris.add(e.cat);
  picks.push({ id: e.id, date, title: e.title, city: e.city, dist: e.dist, cat: e.cat });
}
picks.sort((a, b) => a.date.localeCompare(b.date) || a.dist - b.dist);

fs.writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), from: today, to: last, count: candidats.length, picks }));
console.log(`Accueil : ${candidats.length} événement(s) du ${today} au ${last}, ${picks.length} retenu(s) -> ${out}`);
