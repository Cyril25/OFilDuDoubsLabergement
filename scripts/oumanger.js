// === Page "Où manger" : génération du planning des food trucks ===
// S'exécute après oumanger-translations.js (dataTranslations) et avant applyTranslations.js.
(function () {
    // En mode statique (pages pré-générées /xx/), la langue vient de <html lang>.
    // Sinon (pages dynamiques) on retombe sur le choix mémorisé dans localStorage.
    const staticMode = document.documentElement.hasAttribute('data-i18n-static');
    const lang = staticMode
        ? (document.documentElement.getAttribute('lang') || 'fr')
        : (localStorage.getItem('language') || 'fr');
    const T = (typeof dataTranslations !== 'undefined' && dataTranslations[lang])
        ? dataTranslations[lang]
        : (typeof dataTranslations !== 'undefined' ? dataTranslations.fr : {});

    // --- Données des food trucks ---
    const trucks = {
        montedoro:  { name: "Monte d'Oro Pizza", phone: "0611727122", desc: "ft_desc_montedoro", website: "https://www.montedoro.fr/" },
        maxbiga:    { name: "Max & Biga",        phone: "0766395466", desc: "ft_desc_maxbiga", facebook: "https://www.facebook.com/p/Maxbiga-61561687439893/" },
        lenomade:   { name: "Le Nomade",         phone: "0788776994", desc: "ft_desc_lenomade", facebook: "https://www.facebook.com/burgertraiteurpaella/?locale=fr_FR" },
        elpirata:   { name: "El Pirata",         phone: "0750656591", desc: "ft_desc_elpirata", facebook: "https://www.facebook.com/ElPirataFoodTruck/?locale=fr_FR" },
        kebabsa:    { name: "Kebab",             phone: "0622922267", desc: "ft_desc_kebabsa" },
        krckebab:   { name: "KRC Kebab",         phone: "0783262818", desc: "ft_desc_krckebab", facebook: "https://www.facebook.com/p/Krc-snack-100063982365163/?locale=fr_FR" },
        obardak:    { name: "AL'Barak à Frites", phone: "0626719904", desc: "ft_desc_obardak", facebook: "https://www.facebook.com/p/ALbarak-A-Frites-61579330163380/" },
        pizzpopotte:{ name: "Pizz Popotte",      phone: "0686008508", desc: "ft_desc_pizzpopotte", facebook: "https://www.facebook.com/pizzapopotte/?locale=fr_FR" }
    };

    // --- Planning : index 0 = lundi ... 6 = dimanche ---
    const schedule = [
        // Lundi
        [ { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ],
        // Mardi
        [ { t: 'maxbiga', loc: 'Labergement – Parking Fromagerie' } ],
        // Mercredi
        [ { t: 'lenomade', loc: 'Les Hôpitaux-Neufs' },
          { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ],
        // Jeudi
        [ { t: 'elpirata', loc: 'La Planée' },
          { t: 'lenomade', loc: 'Labergement – Parking Fromagerie' },
          { t: 'kebabsa', loc: 'Saint-Antoine' },
          { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ],
        // Vendredi
        [ { t: 'krckebab', loc: "Labergement – près d'Obertino" },
          { t: 'obardak', loc: 'Labergement – Parking Fromagerie' },
          { t: 'pizzpopotte', loc: 'Vaux-et-Chantegrue' },
          { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ],
        // Samedi
        [ { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ],
        // Dimanche
        [ { t: 'montedoro', loc: 'Labergement – Parking CocciMarket' } ]
    ];

    const dayKeys = ['ft_day_mon', 'ft_day_tue', 'ft_day_wed', 'ft_day_thu', 'ft_day_fri', 'ft_day_sat', 'ft_day_sun'];
    const dayFallback = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const dayName = (i) => T[dayKeys[i]] || dayFallback[i];

    // JS : 0 = dimanche ... 6 = samedi  ->  0 = lundi ... 6 = dimanche
    const todayIdx = (new Date().getDay() + 6) % 7;

    const fmtPhone = (p) => p.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    const telHref = (p) => 'tel:+33' + p.substring(1);

    function linksHtml(tr) {
        let html = '';
        if (tr.website)   html += '<a class="ft-link" href="' + tr.website + '" target="_blank" rel="noopener" aria-label="Site web"><i class="fas fa-globe"></i></a>';
        if (tr.facebook)  html += '<a class="ft-link" href="' + tr.facebook + '" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>';
        if (tr.instagram) html += '<a class="ft-link" href="' + tr.instagram + '" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>';
        return html;
    }

    function truckCard(entry) {
        const tr = trucks[entry.t];
        if (!tr) return '';
        const isLab = /^Labergement/i.test(entry.loc);
        const villageBadge = isLab
            ? '<span class="ft-badge-village"><i class="fas fa-walking"></i> ' + (T.ft_at_village || 'Au village') + '</span>'
            : '';
        return ''
            + '<div class="ft-card">'
            +   '<div class="ft-card-head"><h4 class="ft-name">' + tr.name + '</h4>' + villageBadge + '</div>'
            +   '<p class="ft-desc">' + (T[tr.desc] || '') + '</p>'
            +   '<p class="ft-loc"><i class="fas fa-map-marker-alt"></i> ' + entry.loc + '</p>'
            +   '<div class="ft-actions">'
            +     '<a class="btn-activity btn-maps" href="' + telHref(tr.phone) + '"><i class="fas fa-phone"></i> ' + (T.ft_call || 'Appeler') + ' ' + fmtPhone(tr.phone) + '</a>'
            +     linksHtml(tr)
            +   '</div>'
            + '</div>';
    }

    function directoryCard(key) {
        const tr = trucks[key];
        return ''
            + '<div class="ft-card">'
            +   '<div class="ft-card-head"><h4 class="ft-name">' + tr.name + '</h4></div>'
            +   '<p class="ft-desc">' + (T[tr.desc] || '') + '</p>'
            +   '<div class="ft-actions">'
            +     '<a class="btn-activity btn-maps" href="' + telHref(tr.phone) + '"><i class="fas fa-phone"></i> ' + fmtPhone(tr.phone) + '</a>'
            +     linksHtml(tr)
            +   '</div>'
            + '</div>';
    }

    const selector = document.getElementById('ft-day-selector');
    const content = document.getElementById('ft-day-content');
    const directory = document.getElementById('ft-directory');
    if (!selector || !content || !directory) return;

    function renderDay(i) {
        const tag = (i === todayIdx)
            ? ' <span class="ft-today-tag">' + (T.ft_today_label || "Aujourd'hui") + '</span>'
            : '';
        content.innerHTML =
            '<h3 class="ft-day-title">' + dayName(i) + tag + '</h3>'
            + '<div class="ft-cards-grid">' + schedule[i].map(truckCard).join('') + '</div>';
        Array.from(selector.children).forEach((btn, idx) => btn.classList.toggle('active', idx === i));
    }

    for (let i = 0; i < 7; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ft-day-btn' + (i === todayIdx ? ' today' : '');
        btn.textContent = dayName(i);
        btn.addEventListener('click', () => renderDay(i));
        selector.appendChild(btn);
    }
    renderDay(todayIdx);

    directory.innerHTML = Object.keys(trucks)
        .sort((a, b) => trucks[a].name.localeCompare(trucks[b].name, 'fr'))
        .map(directoryCard)
        .join('');

    // --- Restaurants ---
    const restaurants = [
        { id: 'bistrot',   name: 'Bistrot de Laberge',     loc: 'Labergement-Sainte-Marie', phone: '0381697931', website: 'https://le-bistrot-de-laberge.com', dist: '0–2 min', walk: true },
        { id: 'escale',    name: "L'escale",               loc: 'Saint-Point-Lac',          phone: '0381696173', website: 'https://restaurant-l-escale.fr',  dist: '~9,5 km / 10 min' },
        { id: 'royal',     name: 'Royal Pizza',            loc: 'Malbuisson',               phone: '0381697403', website: 'https://royal-pizza.fr',          dist: '~4,5 km / 5 min' },
        { id: 'gaulois',   name: 'Le Gaulois',             loc: 'Métabief',                 phone: '0381892129', website: 'https://destination-haut-doubs.com', dist: '~7,5 km / 8 min' },
        { id: 'reflet',    name: 'Le Reflet',              loc: 'Montperreux',              phone: '0381693021', website: 'https://montagnes-du-jura.fr',    dist: '~11 km / 12 min' },
        { id: 'ferme',     name: 'Restaurant à la Ferme',  loc: 'Malbuisson',               phone: '0381693480', website: 'https://complexe-le-lac.fr',      dist: '~4,5 km / 5 min' },
        { id: 'fromage',   name: 'Restaurant du Fromage',  loc: 'Malbuisson',               phone: '0381693480', website: 'https://complexe-le-lac.fr',      dist: '~4,5 km / 5 min' },
        { id: 'remise',    name: 'La Remise',              loc: 'Les Villedieu',            phone: '0381692557', website: null,                              dist: '~7,5 km / 8 min' },
        { id: 'boissaude', name: 'La Boissaude',           loc: 'Rochejean',                phone: '0381499072', website: 'https://la-boissaude.fr',        dist: '~10 km / 15 min' },
        { id: 'lelac',     name: 'Le Lac',                 loc: 'Malbuisson',               phone: '0381693480', website: 'https://complexe-le-lac.fr',      dist: '~4,5 km / 5 min' },
        { id: 'flambee',   name: 'La Flambée',             loc: 'Malbuisson',               phone: '0602098820', website: null,                            dist: '~4,5 km / 5 min' },
        { id: 'petiteechelle', name: 'La Petite Échelle', loc: "Rochejean (Mont d'Or)",    phone: '0642558887', website: 'https://lapetiteechellejura.site', dist: '~16 km / 30 min' },
        { id: 'maisondescimes', name: 'La Maison des Cimes', loc: 'Malbuisson',            phone: null,         website: null,                            dist: '~4,5 km / 5 min' }
    ];

    // Bannières (photos Tourinsoft/Decibelles). Restos sans photo fiable → placeholder décoratif.
    const BASE_IMG = 'https://decibelles-data.media.tourinsoft.eu/upload/';
    const restoImg = {
        bistrot: BASE_IMG + '314025513-11.jpg',
        escale: BASE_IMG + '336000474-11.jpg',
        gaulois: BASE_IMG + 'Gaulois.jpg',
        reflet: BASE_IMG + 'Le-Reflet.jpg',
        remise: BASE_IMG + '315001759-11.jpg',
        ferme: BASE_IMG + 'Restaurant-A-la-Ferme--salle-en-piere-II--Pat.Sch.-.jpg',
        fromage: BASE_IMG + 'resto31.jpg',
        boissaude: BASE_IMG + '314020385-8.jpg',
        petiteechelle: BASE_IMG + 'P1087749-4-.JPG',
        lelac: BASE_IMG + 'H--tel-Le-Lac-en-hiver-3-78dae172b47341d187e26065cf2b7a1d.JPG'
    };

    const restoList = document.getElementById('resto-list');
    const mapsUrl = (r) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.name + ' ' + r.loc);

    function restoCard(r) {
        const cuisine = T['resto_' + r.id + '_cuisine'] || '';
        const hours = T['resto_' + r.id + '_hours'] || '';
        const note = T['resto_' + r.id + '_notes'] || '';
        const warn = note.trim().charAt(0) === '⚠';
        const distIcon = r.walk ? 'fa-walking' : 'fa-car';

        let actions = '';
        if (r.phone) actions += '<a class="btn-activity btn-maps" href="' + telHref(r.phone) + '"><i class="fas fa-phone"></i> ' + fmtPhone(r.phone) + '</a>';
        if (r.website) {
            actions += '<a class="btn-activity btn-website" href="' + r.website + '" target="_blank" rel="noopener"><i class="fas fa-globe"></i> ' + (T.resto_website || 'Site web') + '</a>';
        }
        actions += '<a class="btn-activity btn-maps" href="' + mapsUrl(r) + '" target="_blank" rel="noopener"><i class="fas fa-location-arrow"></i> ' + (T.resto_maps || 'Y aller') + '</a>';

        const img = restoImg[r.id];
        const banner = '<div class="resto-banner">'
            + (img ? '<img src="' + img + '" alt="' + r.name + '" loading="lazy" onerror="this.remove()">' : '')
            + '<i class="fas fa-utensils resto-banner-ico"></i></div>';

        return ''
            + '<div class="resto-card">'
            +   banner
            +   '<div class="resto-card-head"><h3 class="resto-name">' + r.name + '</h3>'
            +     '<span class="resto-locality"><i class="fas fa-map-marker-alt"></i> ' + r.loc + '</span></div>'
            +   '<p class="resto-cuisine">' + cuisine + '</p>'
            +   '<div class="resto-meta">'
            +     '<span class="t-badge"><i class="fas ' + distIcon + '"></i> ' + r.dist + '</span>'
            +     '<span class="resto-hours"><i class="far fa-clock"></i> ' + hours + '</span>'
            +   '</div>'
            +   (note ? '<p class="resto-note' + (warn ? ' resto-note--warning' : '') + '">' + note + '</p>' : '')
            +   '<div class="resto-actions">' + actions + '</div>'
            + '</div>';
    }

    if (restoList) restoList.innerHTML = restaurants.map(restoCard).join('');

    // Données structurées (SEO) : liste des restaurants + food trucks
    (function injectFoodSchema() {
        const items = [];
        let pos = 1;
        const tel = (p) => '+33' + p.substring(1);
        restaurants.forEach(r => {
            const it = {
                "@type": "Restaurant",
                "name": r.name,
                "address": { "@type": "PostalAddress", "addressLocality": r.loc, "addressRegion": "Bourgogne-Franche-Comté", "addressCountry": "FR" }
            };
            if (r.phone) it.telephone = tel(r.phone);
            if (r.website) it.url = r.website;
            const cuisine = T['resto_' + r.id + '_cuisine']; if (cuisine) it.description = cuisine;
            items.push({ "@type": "ListItem", "position": pos++, "item": it });
        });
        Object.keys(trucks).forEach(k => {
            const tr = trucks[k];
            const it = { "@type": "FoodEstablishment", "name": tr.name, "servesCuisine": "Street food", "areaServed": "Labergement-Sainte-Marie" };
            if (tr.phone) it.telephone = tel(tr.phone);
            if (tr.website) it.url = tr.website; else if (tr.facebook) it.sameAs = tr.facebook;
            items.push({ "@type": "ListItem", "position": pos++, "item": it });
        });
        const graph = {
            "@context": "https://schema.org", "@type": "ItemList",
            "name": "Restaurants et food trucks autour de Labergement-Sainte-Marie",
            "itemListElement": items
        };
        const el = document.createElement('script');
        el.type = 'application/ld+json';
        el.textContent = JSON.stringify(graph);
        document.head.appendChild(el);
    })();
})();
