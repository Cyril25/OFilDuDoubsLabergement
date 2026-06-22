#!/usr/bin/env node
/**
 * Génère les versions multilingues des pages STATIQUES (SEO multilingue, Phase 1).
 * - FR reste à la racine (édité chirurgicalement : marqueur + hreflang + sélecteur).
 * - en/de/nl/es/it/pt générées dans des sous-dossiers, texte traduit pré-rendu.
 * Réutilise les traductions existantes (scripts/*-translations.js + menu).
 *
 * Usage : node scripts/build-i18n.js
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://ofildudoubs.fr';
const LANGS = ['en', 'de', 'nl', 'es', 'it', 'pt'];
const ALL = ['fr', ...LANGS];

// page (nom de fichier sans .html) -> fichier de traductions (basename sans .js)
const PAGES = {
  'index': 'index', 'logement': 'logement', 'equipements': 'equipements',
  'commerces': 'commerces', 'activites': 'activites', 'ou-manger': 'oumanger',
  'contact': 'contact', 'mentions': 'mentions',
};
const STATIC = Object.keys(PAGES);
const SKIP_KEYS = new Set(['btn_website', 'btn_maps', 'btn_hours', 'info_min']);
const hrefKeyMap = {
  'index.html': 'accueil', 'logement.html': 'logement', 'equipements.html': 'equipements',
  'dispo.html': 'dispo', 'activites.html': 'activites', 'commerces.html': 'commerces',
  'ou-manger.html': 'oumanger', 'agenda.html': 'agenda', 'contact.html': 'contact',
};

// Charge une variable globale définie dans un fichier JS (const X = {...})
function loadVar(file, name) {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', file), 'utf8');
  return new Function(src + '\nreturn typeof ' + name + ' !== "undefined" ? ' + name + ' : null;')();
}
const menuTr = loadVar('menu-translations.js', 'menuTranslations');

const urlFor = (p, lang) => {
  if (lang === 'fr') return p === 'index' ? BASE + '/' : `${BASE}/${p}.html`;
  return p === 'index' ? `${BASE}/${lang}/` : `${BASE}/${lang}/${p}.html`;
};
const pathFor = (p, lang) => urlFor(p, lang).replace(BASE, '');

function rewriteUrl(val, lang) {
  if (!val) return val;
  if (/^(https?:|mailto:|tel:|data:|#|\/\/|\/)/i.test(val)) return val;     // absolu / spécial
  if (/^(images\/|scripts\/)/.test(val) || val === 'styles.css') return '/' + val; // assets -> racine
  const m = val.match(/^([a-z0-9-]+)\.html(#.*)?$/i);                        // lien interne
  if (m) {
    const pg = m[1], frag = m[2] || '';
    return STATIC.includes(pg) ? `/${lang}/${pg}.html${frag}` : `/${pg}.html${frag}`;
  }
  return val;
}

function hreflangTags(p) {
  const lines = ALL.map(L => `    <link rel="alternate" hreflang="${L}" href="${urlFor(p, L)}">`);
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${urlFor(p, 'fr')}">`);
  return lines.join('\n');
}

// ---------- Génération d'une page traduite (langue != fr) ----------
function buildLang(page, lang) {
  const html = fs.readFileSync(path.join(ROOT, page + '.html'), 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  // Si on part d'une page FR déjà patchée (re-run), on retire ses marqueurs hreflang.
  $('head').contents().each((i, el) => {
    if (el.type === 'comment' && /i18n:(start|end)/.test(el.data || '')) $(el).remove();
  });
  const tr = (loadVar(PAGES[page] + '-translations.js', 'dataTranslations') || {})[lang] || {};
  const menu = menuTr[lang] || {};

  $('html').attr('lang', lang).attr('data-i18n-static', '');

  // Réécriture des chemins (assets + liens internes)
  $('[src]').each((i, el) => { const v = $(el).attr('src'); const n = rewriteUrl(v, lang); if (n !== v) $(el).attr('src', n); });
  $('[href]').each((i, el) => { const v = $(el).attr('href'); const n = rewriteUrl(v, lang); if (n !== v) $(el).attr('href', n); });

  // Traduction du contenu par id
  for (const id of Object.keys(tr)) {
    if (SKIP_KEYS.has(id)) continue;
    const el = $('#' + id);
    if (el.length) el.html(tr[id]);
  }
  // Menu (par lien) + libellés de groupe
  $('#menu-items li a').each((i, el) => {
    const file = ($(el).attr('href') || '').split('/').pop();
    const key = hrefKeyMap[file];
    if (key && menu[key]) $(el).text(menu[key]);
  });
  $('#menu-items [data-mkey]').each((i, el) => {
    const k = $(el).attr('data-mkey'); if (menu[k]) $(el).text(menu[k]);
  });
  // Libellés de classe (boutons répétés)
  if (tr.btn_website) $('.lbl-website').text(tr.btn_website);
  if (tr.btn_maps) $('.lbl-maps').text(tr.btn_maps);
  if (tr.btn_hours) $('.lbl-hours').text(tr.btn_hours);
  if (tr.info_min) $('.t-badge').each((i, el) => {
    const h = $(el).html(); if (h && h.includes(' min')) $(el).html(h.replace(' min', ' ' + tr.info_min));
  });

  // Canonical + og:url + hreflang
  $('link[rel="canonical"]').attr('href', urlFor(page, lang));
  $('meta[property="og:url"]').attr('content', urlFor(page, lang));
  $('link[rel="alternate"][hreflang]').remove();
  $('head').append('\n' + hreflangTags(page) + '\n');

  // Sélecteur de langue : liens réels
  $('.language-dropdown a[data-lang]').each((i, el) => {
    const L = $(el).attr('data-lang'); $(el).attr('href', pathFor(page, L));
  });

  const out = $.html();
  const dir = path.join(ROOT, lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, page + '.html'), out);
}

// ---------- Édition chirurgicale de la page FR (marqueur + hreflang + sélecteur) ----------
function patchFr(page) {
  const file = path.join(ROOT, page + '.html');
  let s = fs.readFileSync(file, 'utf8');

  // 1) marqueur sur <html lang="fr">
  s = s.replace(/<html lang="fr"(?! data-i18n-static)>/, '<html lang="fr" data-i18n-static>');

  // 2) bloc hreflang (idempotent via marqueurs)
  const block = '<!-- i18n:start -->\n' + hreflangTags(page) + '\n    <!-- i18n:end -->';
  if (/<!-- i18n:start -->[\s\S]*?<!-- i18n:end -->/.test(s)) {
    s = s.replace(/<!-- i18n:start -->[\s\S]*?<!-- i18n:end -->/, block);
  } else {
    s = s.replace(/(<link rel="canonical"[^>]*>)/, '$1\n    ' + block);
  }

  // 3) sélecteur de langue -> liens réels (idempotent)
  s = s.replace(/href="[^"]*"(\s+)data-lang="(\w+)"/g, (m, sp, L) => `href="${pathFor(page, L)}"${sp}data-lang="${L}"`);

  fs.writeFileSync(file, s);
}

// ---------- Sitemap (FR + versions traduites des pages statiques) ----------
// Priorités des pages FR (les pages dynamiques dispo/agenda restent FR en Phase 1).
const FR_PAGES = {
  index: 1.0, logement: 0.8, equipements: 0.7, dispo: 0.9, activites: 0.8,
  commerces: 0.7, 'ou-manger': 0.8, agenda: 0.8, contact: 0.6, mentions: 0.2,
};
function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  const add = (loc, prio, daily) => urls.push(
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>` +
    (daily ? '\n    <changefreq>daily</changefreq>' : '') +
    `\n    <priority>${prio.toFixed(1)}</priority>\n  </url>`);
  for (const [p, prio] of Object.entries(FR_PAGES)) add(urlFor(p, 'fr'), prio, p === 'agenda');
  for (const p of STATIC) for (const L of LANGS) add(urlFor(p, L), FR_PAGES[p] || 0.6, false);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

let n = 0;
for (const page of STATIC) {
  patchFr(page);
  for (const lang of LANGS) { buildLang(page, lang); n++; }
}
writeSitemap();
console.log(`OK : ${STATIC.length} pages FR patchées, ${n} pages traduites générées (${LANGS.join(', ')}), sitemap régénéré.`);
