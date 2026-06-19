// === Page Agenda : rendu des événements (flux DATAtourisme) + images admin + zoom ===
(function () {
    const lang = localStorage.getItem('language') || 'fr';
    const T = (typeof dataTranslations !== 'undefined' && dataTranslations[lang])
        ? dataTranslations[lang]
        : (typeof dataTranslations !== 'undefined' ? dataTranslations.fr : {});
    const LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', nl: 'nl-NL', es: 'es-ES', it: 'it-IT', pt: 'pt-PT' };
    const locale = LOCALES[lang] || 'fr-FR';

    // --- Persistance des images (worker + KV, route /agenda-images) ---
    const IMAGES_URL = 'https://menage-state.cyril-samson41.workers.dev/agenda-images';
    const FB_CONFIG = {
        apiKey: "AIzaSyCZ_uO-eolAZJs6As82aicoSuZYmT-DeaY",
        authDomain: "asso-billet-site.firebaseapp.com",
        projectId: "asso-billet-site",
        storageBucket: "asso-billet-site.appspot.com",
        messagingSenderId: "644448143950",
        appId: "1:644448143950:web:f64ccc8f62883507ea111f"
    };
    const ADMIN_EMAILS = ['cyril.samson41@gmail.com', 'alisson.pasquier@gmail.com'];

    const BATCH = 30;
    let data = null, overrides = {}, limit = BATCH;
    let adminMode = false, auth = null, fbLoading = null, glb = null, currentEditId = null;

    const D = (s) => new Date(s + 'T00:00:00');
    const pickLang = (obj) => obj ? (obj[lang] || obj.fr || obj.en || Object.values(obj)[0] || '') : '';
    const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const monthKey = (s) => s.slice(0, 7);
    const monthLabel = (s) => { const t = D(s).toLocaleDateString(locale, { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); };
    const today = new Date().toISOString().slice(0, 10);

    // Si une image ne charge pas, on bascule la carte sur le bandeau coloré + date
    window.__agFallback = function (img) {
        const m = img.closest('.ag-media'); if (!m) return;
        m.classList.add('ag-media--noimg');
        m.innerHTML = '<i class="far fa-calendar-alt"></i><span class="ag-bigdate">' + (m.getAttribute('data-date') || '') + '</span>';
    };

    function isOngoing(e) {
        const dur = (Date.parse(e.end) - Date.parse(e.start)) / 86400000;
        return !e.recurring && e.next === today && dur > 2;
    }
    function bigDate(e) {
        if (isOngoing(e)) return T.ag_now;
        if (e.next === today) return T.ag_today;
        return D(e.next).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase();
    }
    function whenLine(e) {
        const dayFmt = { weekday: 'long', day: 'numeric', month: 'long' };
        if (e.recurring) {
            const base = (e.next === today ? T.ag_today + ' · ' : '') + D(e.next).toLocaleDateString(locale, dayFmt);
            const until = D(e.end).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
            return base + ' · ' + T.ag_recurring + ' ' + until;
        }
        if (e.start === e.end) {
            return (e.next === today ? T.ag_today + ' · ' : '') + D(e.next).toLocaleDateString(locale, dayFmt);
        }
        const a = D(e.start).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        const b = D(e.end).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        return a + ' → ' + b;
    }

    function card(e) {
        const titre = esc(pickLang(e.title));
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(titre + ' ' + (e.city || ''));
        const big = esc(bigDate(e));
        const ov = overrides[e.id] || {};
        const banner = ov.banner || e.img || null;
        const extras = (ov.gallery && ov.gallery.length) ? ov.gallery : (e.gallery || []);
        // Vignettes = bannière + images en plus, dédupliquées (max 4)
        const thumbs = [];
        [banner].concat(extras).forEach(u => { if (u && thumbs.indexOf(u) < 0) thumbs.push(u); });
        const thumbsList = thumbs.slice(0, 4);
        const gid = 'evt' + String(e.id).replace(/[^a-zA-Z0-9]/g, '');
        const caption = esc(titre + (e.credit && !ov.banner ? ' — © ' + e.credit : ''));
        const editBtn = adminMode ? '<button class="ag-edit" data-id="' + esc(String(e.id)) + '" title="Éditer les images / masquer"><i class="fas fa-image"></i></button>' : '';
        const hiddenBadge = (ov.hidden && adminMode) ? '<span class="ag-hidden-badge"><i class="fas fa-eye-slash"></i> Masqué</span>' : '';
        const cardClass = (ov.hidden && adminMode) ? 'ag-card ag-card--hidden' : 'ag-card';

        const media = banner
            ? '<div class="ag-media" data-date="' + big + '" data-clickable="1">' +
                  '<img src="' + esc(banner) + '" alt="" loading="lazy" onerror="window.__agFallback&&window.__agFallback(this)">' +
                  '<span class="ag-datechip">' + big + '</span>' +
                  '<span class="ag-zoom"><i class="fas fa-search-plus"></i></span>' + hiddenBadge + editBtn +
              '</div>'
            : '<div class="ag-media ag-media--noimg"><i class="far fa-calendar-alt"></i><span class="ag-bigdate">' + big + '</span>' + hiddenBadge + editBtn + '</div>';

        const galleryHtml = thumbsList.length
            ? '<div class="ag-gallery">' + thumbsList.map(u =>
                  '<a class="glightbox" data-gallery="' + gid + '" data-title="' + caption + '" href="' + esc(u) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></a>'
              ).join('') + '</div>'
            : '';

        const descTxt = e.desc ? esc(pickLang(e.desc)) : '';
        const desc = descTxt ? '<p class="ag-desc">' + descTxt + '</p>' : '';
        let actions = '';
        if (e.url) actions += '<a class="btn-activity btn-website" href="' + esc(e.url) + '" target="_blank" rel="noopener"><i class="fas fa-globe"></i> ' + T.ag_info + '</a>';
        actions += '<a class="btn-activity btn-maps" href="' + mapsUrl + '" target="_blank" rel="noopener"><i class="fas fa-location-arrow"></i> ' + T.ag_maps + '</a>';

        return '' +
            '<article class="' + cardClass + '">' +
                media +
                '<div class="ag-body">' +
                    '<p class="ag-when"><i class="far fa-calendar-alt"></i> ' + esc(whenLine(e)) + '</p>' +
                    '<h3 class="ag-title">' + titre + '</h3>' +
                    '<p class="ag-loc"><i class="fas fa-map-marker-alt"></i> ' + esc(e.city) +
                        ' <span class="ag-dist">· ' + e.dist + ' ' + T.ag_km + '</span></p>' +
                    desc + galleryHtml +
                    '<div class="ag-actions">' + actions + '</div>' +
                '</div>' +
            '</article>';
    }

    function refreshLightbox() {
        if (!window.GLightbox) return;
        if (glb) { try { glb.destroy(); } catch (e) {} }
        glb = window.GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });
    }

    function render() {
        const list = document.getElementById('agenda-list');
        if (!data || !data.events || !data.events.length) {
            list.innerHTML = '<p class="ag-empty">' + T.ag_empty + '</p>';
            return;
        }
        const up = [], on = [];
        for (const e of data.events) {
            const dur = (Date.parse(e.end) - Date.parse(e.start)) / 86400000;
            if (!e.recurring && dur > 210) continue;                       // permanent (filet de sécurité)
            const ov = overrides[e.id] || {};
            if (ov.hidden && !adminMode) continue;                          // masqué : caché aux visiteurs
            (isOngoing(e) ? on : up).push(e);
        }
        up.sort((a, b) => a.next < b.next ? -1 : a.next > b.next ? 1 : a.dist - b.dist);
        on.sort((a, b) => a.end < b.end ? -1 : a.end > b.end ? 1 : a.dist - b.dist);

        // Section "À venir"
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

        // Section "En ce moment / toute la saison"
        const onWrap = document.getElementById('agenda-ongoing');
        const onList = document.getElementById('agenda-ongoing-list');
        if (onWrap && onList) {
            if (on.length) { onList.innerHTML = on.map(card).join(''); onWrap.style.display = ''; }
            else { onWrap.style.display = 'none'; }
        }

        refreshLightbox();
    }

    // ---------- Administration (édition des images) ----------
    function isAdmin(user) { return !!(user && ADMIN_EMAILS.includes(user.email)); }

    function loadFirebase() {
        if (auth) return Promise.resolve(auth);
        if (fbLoading) return fbLoading;
        const inject = (src) => new Promise((res, rej) => {
            const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
        fbLoading = inject('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
            .then(() => inject('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js'))
            .then(() => { firebase.initializeApp(FB_CONFIG); auth = firebase.auth(); return auth; });
        return fbLoading;
    }

    async function saveOverrides() {
        const token = await auth.currentUser.getIdToken();
        const r = await fetch(IMAGES_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(overrides)
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
    }

    function openEditor(id) {
        currentEditId = id;
        const e = (data.events || []).find(x => String(x.id) === String(id));
        document.getElementById('ag-modal-event').textContent = e ? pickLang(e.title) : '';
        const ov = overrides[id] || {}; const g = ov.gallery || [];
        document.getElementById('ag-modal-banner').value = ov.banner || '';
        document.getElementById('ag-modal-g1').value = g[0] || '';
        document.getElementById('ag-modal-g2').value = g[1] || '';
        document.getElementById('ag-modal-g3').value = g[2] || '';
        document.getElementById('ag-modal-hidden').checked = !!ov.hidden;
        document.getElementById('ag-modal').classList.add('open');
    }
    function closeModal() { document.getElementById('ag-modal').classList.remove('open'); currentEditId = null; }

    function setupAdmin() {
        const adminBtn = document.getElementById('agenda-admin-btn');
        if (adminBtn) adminBtn.addEventListener('click', async () => {
            try {
                await loadFirebase();
                let user = auth.currentUser;
                if (!isAdmin(user)) {
                    const res = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
                    user = res.user;
                    if (!isAdmin(user)) { await auth.signOut(); alert('Accès non autorisé.'); return; }
                }
                adminMode = true;
                adminBtn.classList.add('on');
                adminBtn.innerHTML = '<i class="fas fa-check"></i> Admin';
                render();
            } catch (e) {
                if (e && e.code !== 'auth/popup-closed-by-user') alert('Erreur de connexion : ' + (e.message || e));
            }
        });

        // Ouvre l'éditeur au clic sur le bouton image d'une carte
        document.addEventListener('click', (ev) => {
            const b = ev.target.closest('.ag-edit');
            if (b) { ev.preventDefault(); openEditor(b.getAttribute('data-id')); }
        });

        const save = document.getElementById('ag-modal-save');
        const cancel = document.getElementById('ag-modal-cancel');
        const modal = document.getElementById('ag-modal');
        if (cancel) cancel.addEventListener('click', closeModal);
        if (modal) modal.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });
        if (save) save.addEventListener('click', async () => {
            const v = (id) => document.getElementById(id).value.trim();
            const banner = v('ag-modal-banner');
            const gallery = [v('ag-modal-g1'), v('ag-modal-g2'), v('ag-modal-g3')].filter(Boolean);
            const hidden = document.getElementById('ag-modal-hidden').checked;
            if (banner || gallery.length || hidden) {
                overrides[currentEditId] = Object.assign({}, banner ? { banner } : {}, gallery.length ? { gallery } : {}, hidden ? { hidden: true } : {});
            } else {
                delete overrides[currentEditId];
            }
            save.disabled = true; save.textContent = '…';
            try { await saveOverrides(); closeModal(); render(); }
            catch (e) { alert('Échec de l\'enregistrement : ' + (e.message || e)); }
            finally { save.disabled = false; save.textContent = 'Enregistrer'; }
        });
    }

    // ---------- Démarrage ----------
    function init() {
        // Images admin (lecture publique) en parallèle de l'agenda
        fetch(IMAGES_URL, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : {})
            .then(o => {
                // Ne garder que les entrées au bon format {banner|gallery} :
                // protège si la route /agenda-images n'est pas encore déployée (fallback = état ménage).
                if (o && typeof o === 'object' && !Array.isArray(o)) {
                    const clean = {};
                    for (const k in o) { const v = o[k]; if (v && typeof v === 'object' && (v.banner || v.gallery || v.hidden)) clean[k] = v; }
                    overrides = clean;
                }
            })
            .catch(() => {})
            .finally(() => {
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
            });

        const moreBtn = document.getElementById('agenda-more');
        if (moreBtn) moreBtn.addEventListener('click', () => { limit += BATCH; render(); });

        // Clic sur la bannière → ouvre le zoom (via la 1re vignette), sans doublon dans la visionneuse
        document.addEventListener('click', (ev) => {
            if (ev.target.closest('.ag-edit')) return;
            const media = ev.target.closest('.ag-media[data-clickable="1"]');
            if (!media) return;
            const card = media.closest('.ag-card');
            const t = card && card.querySelector('.ag-gallery a.glightbox');
            if (t) t.click();
        });

        setupAdmin();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
