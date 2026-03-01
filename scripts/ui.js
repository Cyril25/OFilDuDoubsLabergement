// === RGPD Banner ===
(function () {
    if (localStorage.getItem('rgpd_accepted')) return;

    var banner = document.createElement('div');
    banner.id = 'rgpd-banner';
    banner.innerHTML =
        '<p>Ce site utilise des ressources externes (Google Fonts, bibliothèques CDN, tuiles de carte OpenStreetMap) ' +
        'susceptibles de traiter votre adresse IP. Aucune donnée personnelle n\'est collectée par nos soins. ' +
        '<a href="mentions.html">En savoir plus</a></p>' +
        '<button id="rgpd-accept">J\'ai compris</button>';
    document.body.appendChild(banner);

    document.getElementById('rgpd-accept').addEventListener('click', function () {
        localStorage.setItem('rgpd_accepted', '1');
        banner.remove();
    });
})();

// === Bouton WhatsApp flottant ===
(function () {
    var btn = document.createElement('a');
    btn.id = 'whatsapp-btn';
    btn.href = 'https://wa.me/33683016151';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.title = 'Nous contacter sur WhatsApp';
    btn.setAttribute('aria-label', 'Contacter sur WhatsApp');
    btn.innerHTML = '<i class="fab fa-whatsapp"></i>';
    document.body.appendChild(btn);
})();
