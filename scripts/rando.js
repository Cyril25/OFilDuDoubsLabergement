// === Page Randonnées : rendu des itinéraires (flux DATAtourisme) + filtres + admin show/hide ===
(function () {
    const staticMode = document.documentElement.hasAttribute('data-i18n-static');
    const lang = (staticMode ? document.documentElement.getAttribute('lang') : localStorage.getItem('language')) || 'fr';
    const T = (typeof dataTranslations !== 'undefined' && dataTranslations[lang]) ? dataTranslations[lang]
        : (typeof dataTranslations !== 'undefined' ? dataTranslations.fr : {});
    const LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', nl: 'nl-NL', es: 'es-ES', it: 'it-IT', pt: 'pt-PT' };
    const locale = LOCALES[lang] || 'fr-FR';

    const OVERRIDES_URL = 'https://menage-state.cyril-samson41.workers.dev/rando-overrides';
    const FB_CONFIG = {
        apiKey: "AIzaSyCZ_uO-eolAZJs6As82aicoSuZYmT-DeaY",
        authDomain: "asso-billet-site.firebaseapp.com",
        projectId: "asso-billet-site",
        storageBucket: "asso-billet-site.appspot.com",
        messagingSenderId: "644448143950",
        appId: "1:644448143950:web:f64ccc8f62883507ea111f"
    };
    const ADMIN_EMAILS = ['cyril.samson41@gmail.com', 'alisson.pasquier@gmail.com'];
    const MODES = ['foot', 'bike', 'road', 'horse'];
    const DIFFS = ['easy', 'medium', 'hard', 'very_hard'];
    const MODE_ICON = { foot: 'fa-hiking', bike: 'fa-bicycle', road: 'fa-road', horse: 'fa-horse' };

    let data = null, overrides = {}, adminMode = false, auth = null, fbLoading = null;
    const activeModes = new Set(), activeDiffs = new Set();
    let searchTerm = '';

    const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const pickLang = (obj) => obj ? (obj[lang] || obj.fr || obj.en || Object.values(obj)[0] || '') : '';

    function matchFilters(it) {
        if (activeModes.size && !activeModes.has(it.mode)) return false;
        if (activeDiffs.size && !activeDiffs.has(it.difficulty)) return false;
        if (searchTerm) {
            const hay = norm(it.name + ' ' + (it.city || '') + ' ' + pickLang(it.desc));
            if (hay.indexOf(searchTerm) < 0) return false;
        }
        return true;
    }

    function card(it) {
        const ov = overrides[it.id] || {};
        const titre = esc(it.name);
        const loc = esc(it.city || '') + (it.dist != null ? ' · ' + it.dist + ' km' : '');
        const badges = [];
        if (it.mode && T.modes && T.modes[it.mode])
            badges.push('<span class="rd-badge"><i class="fas ' + (MODE_ICON[it.mode] || 'fa-shoe-prints') + '"></i> ' + esc(T.modes[it.mode]) + '</span>');
        if (it.km) badges.push('<span class="rd-badge"><i class="fas fa-ruler-horizontal"></i> ' + esc(String(it.km).replace('.', ',')) + ' km</span>');
        if (it.denivele) badges.push('<span class="rd-badge" title="' + esc(T.r_unit_elev || '') + '"><i class="fas fa-mountain"></i> +' + it.denivele + ' m</span>');
        if (it.type && T.types && T.types[it.type]) badges.push('<span class="rd-badge">' + esc(T.types[it.type]) + '</span>');
        if (it.difficulty && T.diff && T.diff[it.difficulty])
            badges.push('<span class="rd-badge ' + it.difficulty + '">' + esc(T.diff[it.difficulty]) + '</span>');

        const descTxt = it.desc ? esc(pickLang(it.desc)) : '';
        const actions = [];
        if (it.url) actions.push('<a class="rd-btn rd-btn--main" href="' + esc(it.url) + '" target="_blank" rel="noopener"><i class="fas fa-map-signs"></i> ' + T.r_btn_route + '</a>');
        if (it.gpx) actions.push('<a class="rd-btn" href="' + esc(it.gpx) + '" target="_blank" rel="noopener"><i class="fas fa-route"></i> ' + T.r_btn_gpx + '</a>');
        if (it.pdf) actions.push('<a class="rd-btn" href="' + esc(it.pdf) + '" target="_blank" rel="noopener"><i class="fas fa-file-pdf"></i> ' + T.r_btn_pdf + '</a>');

        const eid = esc(String(it.id));
        const adminCtrls = adminMode
            ? '<div class="rd-admin-btns">' +
                '<button class="rd-hide" data-id="' + eid + '" title="' + (ov.hidden ? 'Réafficher' : 'Masquer') + '"><i class="fas ' + (ov.hidden ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
                '<button class="rd-pin" data-id="' + eid + '" title="' + (ov.shown ? 'Ne plus épingler en haut' : 'Épingler dans la liste principale') + '"><i class="fas ' + (ov.shown ? 'fa-thumbtack' : 'fa-thumbtack') + '" style="' + (ov.shown ? 'color:#ffd54f' : '') + '"></i></button>' +
              '</div>'
            : '';
        const hiddenBadge = (ov.hidden && adminMode) ? '<span class="rd-hidden-badge"><i class="fas fa-eye-slash"></i> Masqué</span>' : '';
        const must = it.must ? '<span class="rd-must"><i class="fas fa-star"></i> ' + T.r_must + '</span>' : '';
        const img = it.img ? '<img class="rd-img" src="' + esc(it.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '';

        return '<article class="rd-card' + (ov.hidden && adminMode ? ' rd-card--hidden' : '') + '">' +
            hiddenBadge + adminCtrls + img +
            '<div class="rd-body">' + must +
                '<h3 class="rd-title">' + titre + '</h3>' +
                '<p class="rd-loc"><i class="fas fa-map-marker-alt"></i> ' + loc + '</p>' +
                '<div class="rd-badges">' + badges.join('') + '</div>' +
                (descTxt ? '<p class="rd-desc">' + descTxt + '</p>' : '') +
                '<div class="rd-actions">' + actions.join('') + '</div>' +
            '</div>' +
        '</article>';
    }

    function renderFilters(base) {
        const wrap = document.getElementById('rando-filters');
        if (!wrap) return;
        const cm = {}, cd = {};
        base.forEach(it => { cm[it.mode] = (cm[it.mode] || 0) + 1; if (it.difficulty) cd[it.difficulty] = (cd[it.difficulty] || 0) + 1; });
        let html = '<button type="button" class="rd-chip' + (activeModes.size || activeDiffs.size ? '' : ' is-active') + '" data-f="__all">' + (T.r_all || 'Tous') + '</button>';
        MODES.forEach(m => { if (!cm[m]) return; html += '<button type="button" class="rd-chip' + (activeModes.has(m) ? ' is-active' : '') + '" data-f="mode:' + m + '"><i class="fas ' + (MODE_ICON[m] || 'fa-shoe-prints') + '"></i> ' + esc(T.modes[m]) + ' <span class="rd-chip-n">' + cm[m] + '</span></button>'; });
        DIFFS.forEach(d => { if (!cd[d]) return; html += '<button type="button" class="rd-chip' + (activeDiffs.has(d) ? ' is-active' : '') + '" data-f="diff:' + d + '">' + esc(T.diff[d]) + ' <span class="rd-chip-n">' + cd[d] + '</span></button>'; });
        wrap.innerHTML = html;
    }

    function render() {
        const list = document.getElementById('rando-list');
        const farWrap = document.getElementById('rando-far-wrap');
        const far = document.getElementById('rando-far');
        if (!data || !data.items) { list.innerHTML = '<p class="rd-empty">' + (T.r_empty || '') + '</p>'; return; }

        // base = items visibles aux visiteurs (hors masqués), pour les compteurs
        const base = data.items.filter(it => adminMode || !(overrides[it.id] || {}).hidden);
        renderFilters(base);

        const near = [], farItems = [];
        for (const it of base) {
            if (!matchFilters(it)) continue;
            const ov = overrides[it.id] || {};
            const isNear = ov.shown || it.must || (it.dist != null && it.dist <= 30);
            (isNear ? near : farItems).push(it);
        }
        list.innerHTML = near.map(card).join('') ?
            '<div class="rd-grid">' + near.map(card).join('') + '</div>' :
            '<p class="rd-empty">' + ((activeModes.size || activeDiffs.size || searchTerm) ? T.r_no_match : T.r_empty) + '</p>';

        if (farItems.length) {
            farWrap.style.display = '';
            far.innerHTML = '<div class="rd-grid">' + farItems.map(card).join('') + '</div>';
            if (far.classList.contains('open')) { /* reste ouvert */ } else far.classList.remove('open');
        } else {
            farWrap.style.display = 'none';
            far.innerHTML = '';
        }
    }

    // ---------- Admin ----------
    function isAdmin(u) { return !!(u && ADMIN_EMAILS.includes(u.email)); }
    function loadFirebase() {
        if (auth) return Promise.resolve(auth);
        if (fbLoading) return fbLoading;
        const inject = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        fbLoading = inject('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
            .then(() => inject('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js'))
            .then(() => { firebase.initializeApp(FB_CONFIG); auth = firebase.auth(); return auth; });
        return fbLoading;
    }
    async function saveOverrides() {
        const token = await auth.currentUser.getIdToken();
        const r = await fetch(OVERRIDES_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(overrides) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
    }
    function setOverride(id, patch) {
        const ov = Object.assign({}, overrides[id], patch);
        Object.keys(ov).forEach(k => { if (!ov[k]) delete ov[k]; });
        if (Object.keys(ov).length) overrides[id] = ov; else delete overrides[id];
    }
    function setupAdmin() {
        const btn = document.getElementById('rando-admin-btn');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            try {
                await loadFirebase();
                let user = auth.currentUser;
                if (!isAdmin(user)) {
                    const res = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
                    user = res.user;
                    if (!isAdmin(user)) { await auth.signOut(); alert('Accès non autorisé.'); return; }
                }
                adminMode = true;
                btn.classList.add('on');
                render();
            } catch (e) {
                if (e && e.code !== 'auth/popup-closed-by-user') alert('Erreur de connexion : ' + (e.message || e));
            }
        });
        document.addEventListener('click', async (ev) => {
            if (!adminMode) return;
            const hideBtn = ev.target.closest('.rd-hide');
            const pinBtn = ev.target.closest('.rd-pin');
            const t = hideBtn || pinBtn; if (!t) return;
            const id = t.getAttribute('data-id');
            if (hideBtn) setOverride(id, { hidden: !(overrides[id] || {}).hidden });
            if (pinBtn) setOverride(id, { shown: !(overrides[id] || {}).shown });
            render();
            try { await saveOverrides(); } catch (e) { alert('Échec enregistrement : ' + (e.message || e)); }
        });
    }

    function init() {
        const search = document.getElementById('rando-search');
        if (search) { if (T.r_search_ph) search.placeholder = T.r_search_ph; search.addEventListener('input', () => { searchTerm = norm(search.value.trim()); render(); }); }
        const filters = document.getElementById('rando-filters');
        if (filters) filters.addEventListener('click', (ev) => {
            const b = ev.target.closest('.rd-chip'); if (!b) return;
            const f = b.getAttribute('data-f');
            if (f === '__all') { activeModes.clear(); activeDiffs.clear(); }
            else if (f.startsWith('mode:')) { const m = f.slice(5); activeModes.has(m) ? activeModes.delete(m) : activeModes.add(m); }
            else if (f.startsWith('diff:')) { const d = f.slice(5); activeDiffs.has(d) ? activeDiffs.delete(d) : activeDiffs.add(d); }
            render();
        });
        const farBtn = document.getElementById('rando-far-btn');
        const far = document.getElementById('rando-far');
        if (farBtn && far) {
            if (T.r_far_btn) farBtn.textContent = T.r_far_btn;
            farBtn.addEventListener('click', () => { far.classList.toggle('open'); farBtn.style.display = far.classList.contains('open') ? 'none' : ''; });
        }

        // Overrides (lecture publique) puis données
        fetch(OVERRIDES_URL, { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).then(o => { if (o && typeof o === 'object' && !Array.isArray(o)) overrides = o; }).catch(() => {})
            .finally(() => {
                fetch('/data/rando.json', { cache: 'no-store' })
                    .then(r => r.ok ? r.json() : Promise.reject(r.status))
                    .then(json => {
                        data = json;
                        const upd = document.getElementById('rando-updated');
                        if (upd && json.generated) upd.textContent = T.r_updated + ' ' + new Date(json.generated).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
                        render();
                    })
                    .catch(() => { document.getElementById('rando-list').innerHTML = '<p class="rd-empty">' + (T.r_empty || '') + '</p>'; });
            });

        setupAdmin();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
