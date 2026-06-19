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

    function dateLine(e) {
        const opt = { day: 'numeric', month: 'long' };
        if (e.start === e.end) {
            if (e.next === today) return '<i class="far fa-clock"></i> ' + T.ag_today;
            return '<i class="far fa-calendar"></i> ' + D(e.next).toLocaleDateString(locale, opt);
        }
        // plage de dates
        const a = D(e.start).toLocaleDateString(locale, opt);
        const b = D(e.end).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        return '<i class="far fa-calendar"></i> ' + a + ' → ' + b;
    }

    function card(e) {
        const titre = esc(pickLang(e.title));
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(titre + ' ' + (e.city || ''));
        const img = e.img
            ? '<div class="ag-img"><img src="' + esc(e.img) + '" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>'
            : '';
        const descTxt = e.desc ? esc(pickLang(e.desc)) : '';
        const desc = descTxt ? '<p class="ag-desc">' + descTxt + '</p>' : '';
        let actions = '';
        if (e.url) actions += '<a class="btn-activity btn-website" href="' + esc(e.url) + '" target="_blank" rel="noopener"><i class="fas fa-globe"></i> ' + T.ag_info + '</a>';
        actions += '<a class="btn-activity btn-maps" href="' + mapsUrl + '" target="_blank" rel="noopener"><i class="fas fa-location-arrow"></i> ' + T.ag_maps + '</a>';

        return '' +
            '<article class="ag-card">' +
                img +
                '<div class="ag-body">' +
                    '<p class="ag-date">' + dateLine(e) + '</p>' +
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
        const slice = data.events.slice(0, limit);
        let html = '', currentMonth = '';
        slice.forEach(e => {
            const mk = monthKey(e.next);
            if (mk !== currentMonth) { currentMonth = mk; html += '<h2 class="ag-month">' + monthLabel(e.next) + '</h2>'; }
            html += card(e);
        });
        list.innerHTML = html;

        const moreWrap = document.getElementById('agenda-more-wrap');
        if (limit < data.events.length) {
            moreWrap.style.display = '';
            document.getElementById('agenda-more').textContent =
                T.ag_more + ' (' + (data.events.length - limit) + ')';
        } else {
            moreWrap.style.display = 'none';
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
