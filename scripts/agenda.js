// === Page Agenda : rendu des événements depuis data/agenda.json (flux DATAtourisme) ===
(function () {
    const lang = localStorage.getItem('language') || 'fr';
    const T = (typeof dataTranslations !== 'undefined' && dataTranslations[lang])
        ? dataTranslations[lang]
        : (typeof dataTranslations !== 'undefined' ? dataTranslations.fr : {});
    const LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', nl: 'nl-NL', es: 'es-ES', it: 'it-IT', pt: 'pt-PT' };
    const locale = LOCALES[lang] || 'fr-FR';

    const BATCH = 30;
    let data = null, limit = BATCH;

    const D = (s) => new Date(s + 'T00:00:00');
    const pickLang = (obj) => obj ? (obj[lang] || obj.fr || obj.en || Object.values(obj)[0] || '') : '';
    const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const monthKey = (s) => s.slice(0, 7);
    const monthLabel = (s) => { const t = D(s).toLocaleDateString(locale, { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); };
    const today = new Date().toISOString().slice(0, 10);

    // Si une image ne charge pas, on bascule la carte sur le bandeau coloré + date
    window.__agFallback = function (img) {
        const m = img.parentNode;
        m.classList.add('ag-media--noimg');
        m.innerHTML = '<i class="far fa-calendar-alt"></i><span class="ag-bigdate">' + (m.getAttribute('data-date') || '') + '</span>';
    };

    // Date courte pour le bandeau (ex. "20 JUIN" ou "Aujourd'hui")
    function bigDate(e) {
        if (e.next === today) return T.ag_today;
        return D(e.next).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase();
    }
    // Ligne de date détaillée dans le corps de la carte
    function whenLine(e) {
        if (e.start === e.end) {
            const base = D(e.next).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
            return (e.next === today ? T.ag_today + ' · ' : '') + base;
        }
        const a = D(e.start).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        const b = D(e.end).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        return a + ' → ' + b;
    }

    function card(e) {
        const titre = esc(pickLang(e.title));
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(titre + ' ' + (e.city || ''));
        const big = esc(bigDate(e));
        const media = e.img
            ? '<div class="ag-media" data-date="' + big + '"><img src="' + esc(e.img) + '" alt="" loading="lazy" onerror="window.__agFallback&&window.__agFallback(this)"><span class="ag-datechip">' + big + '</span></div>'
            : '<div class="ag-media ag-media--noimg"><i class="far fa-calendar-alt"></i><span class="ag-bigdate">' + big + '</span></div>';
        const descTxt = e.desc ? esc(pickLang(e.desc)) : '';
        const desc = descTxt ? '<p class="ag-desc">' + descTxt + '</p>' : '';
        let actions = '';
        if (e.url) actions += '<a class="btn-activity btn-website" href="' + esc(e.url) + '" target="_blank" rel="noopener"><i class="fas fa-globe"></i> ' + T.ag_info + '</a>';
        actions += '<a class="btn-activity btn-maps" href="' + mapsUrl + '" target="_blank" rel="noopener"><i class="fas fa-location-arrow"></i> ' + T.ag_maps + '</a>';

        return '' +
            '<article class="ag-card">' +
                media +
                '<div class="ag-body">' +
                    '<p class="ag-when"><i class="far fa-calendar-alt"></i> ' + esc(whenLine(e)) + '</p>' +
                    '<h3 class="ag-title">' + titre + '</h3>' +
                    '<p class="ag-loc"><i class="fas fa-map-marker-alt"></i> ' + esc(e.city) +
                        ' <span class="ag-dist">· ' + e.dist + ' ' + T.ag_km + '</span></p>' +
                    desc +
                    '<div class="ag-actions">' + actions + '</div>' +
                '</div>' +
            '</article>';
    }

    function render() {
        const list = document.getElementById('agenda-list');
        if (!data || !data.events || !data.events.length) {
            list.innerHTML = '<p class="ag-empty">' + T.ag_empty + '</p>';
            return;
        }
        // Répartition : "À venir" (ponctuels/récurrents) vs "En ce moment" (en cours, multi-semaines)
        const up = [], on = [];
        for (const e of data.events) {
            const dur = (Date.parse(e.end) - Date.parse(e.start)) / 86400000;
            if (!e.recurring && dur > 210) continue;                       // permanent (filet de sécurité)
            const isOngoing = !e.recurring && e.next === today && dur > 2;  // commencé, dure encore
            (isOngoing ? on : up).push(e);
        }
        up.sort((a, b) => a.next < b.next ? -1 : a.next > b.next ? 1 : a.dist - b.dist);
        on.sort((a, b) => a.end < b.end ? -1 : a.end > b.end ? 1 : a.dist - b.dist);

        // Section "À venir" : triée par date, groupée par mois, paginée
        const slice = up.slice(0, limit);
        let html = '', currentMonth = '', openGrid = false;
        slice.forEach(e => {
            const mk = monthKey(e.next);
            if (mk !== currentMonth) {
                if (openGrid) html += '</div>';
                currentMonth = mk;
                html += '<h2 class="ag-month">' + monthLabel(e.next) + '</h2><div class="ag-grid">';
                openGrid = true;
            }
            html += card(e);
        });
        if (openGrid) html += '</div>';
        list.innerHTML = html || '<p class="ag-empty">' + T.ag_empty + '</p>';

        const moreWrap = document.getElementById('agenda-more-wrap');
        if (limit < up.length) {
            moreWrap.style.display = '';
            document.getElementById('agenda-more').textContent = T.ag_more + ' (' + (up.length - limit) + ')';
        } else {
            moreWrap.style.display = 'none';
        }

        // Section "En ce moment / toute la saison" : événements en cours
        const onWrap = document.getElementById('agenda-ongoing');
        const onList = document.getElementById('agenda-ongoing-list');
        if (onWrap && onList) {
            if (on.length) { onList.innerHTML = on.map(card).join(''); onWrap.style.display = ''; }
            else { onWrap.style.display = 'none'; }
        }
    }

    function init() {
        // Bandeau "mis à jour le"
        fetch('data/agenda.json', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(json => {
                data = json;
                const upd = document.getElementById('agenda-updated');
                if (upd && json.generated) {
                    upd.textContent = T.ag_updated + ' ' +
                        new Date(json.generated).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
                }
                render();
            })
            .catch(() => {
                document.getElementById('agenda-list').innerHTML = '<p class="ag-empty">' + T.ag_empty + '</p>';
            });

        const moreBtn = document.getElementById('agenda-more');
        if (moreBtn) moreBtn.addEventListener('click', () => { limit += BATCH; render(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
