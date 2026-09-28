// Accueil : bloc « Cette semaine autour du logement ».
// Lit data/agenda-home.json (quelques Ko, régénéré chaque nuit par le cron agenda,
// voir scripts/build-agenda-home.js) plutôt que l'agenda complet (~440 Ko).
document.addEventListener('DOMContentLoaded', function () {
    var bloc = document.getElementById('home-agenda');
    if (!bloc) return;
    var lang = document.documentElement.getAttribute('lang') || 'fr';
    var tr = (typeof dataTranslations !== 'undefined' && (dataTranslations[lang] || dataTranslations.fr)) || {};
    var LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', nl: 'nl-NL', es: 'es-ES', it: 'it-IT', pt: 'pt-PT' };
    var agendaUrl = (lang === 'fr' ? '/' : '/' + lang + '/') + 'agenda.html';
    var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    fetch('/data/agenda-home.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (!d || !d.picks || !d.picks.length) { bloc.hidden = true; return; }
            var count = document.getElementById('aghome-count');
            if (count && tr.aghome_count) count.textContent = tr.aghome_count.replace('{n}', d.count);
            var loc = LOCALES[lang] || 'fr-FR';
            var fmt = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long' });
            var km = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
            var maj = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); }; // « mardi » → « Mardi », mois inchangés
            document.getElementById('aghome-grid').innerHTML = d.picks.map(function (p) {
                var titre = (p.title && (p.title[lang] || p.title.fr)) || '';
                var date = maj(fmt.format(new Date(p.date + 'T12:00:00')));
                return '<a class="aghome-card" href="' + agendaUrl + '">' +
                    '<span class="aghome-date"><i class="far fa-calendar" aria-hidden="true"></i> ' + esc(date) + '</span>' +
                    '<strong class="aghome-title">' + esc(titre) + '</strong>' +
                    '<span class="aghome-place"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ' + esc(p.city) + ' · <span class="aghome-km">' + esc(km.format(p.dist)) + '\u00a0km</span></span>' +
                    '</a>';
            }).join('');
        })
        .catch(function () { /* sans données, le bloc garde son titre et son bouton vers l'agenda */ });
});
