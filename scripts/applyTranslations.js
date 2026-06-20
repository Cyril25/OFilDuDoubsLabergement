document.addEventListener("DOMContentLoaded", function () {
    const lang = localStorage.getItem('language') || 'fr';

    // 0. MISE À JOUR DE L'ANNÉE DU COPYRIGHT
    document.querySelectorAll('.copyright-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // 1. MISE À JOUR VISUELLE DU DRAPEAU ACTUEL
    const currentFlagIcon = document.getElementById("current-flag-icon");
    if (currentFlagIcon) {
        currentFlagIcon.src = `images/${lang}.png`;
        currentFlagIcon.alt = lang;
    }

    // 2. GESTION DU MENU BURGER
    const menuToggle = document.querySelector(".menu-toggle");
    const menuItemsContainer = document.querySelector("#menu-items");

    if (menuToggle && menuItemsContainer) {
        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);
        
        newToggle.addEventListener("click", function () {
            menuItemsContainer.classList.toggle("active");
        });
    }

    // 2bis. SOUS-MENUS DÉROULANTS (accordéon sur mobile, survol géré en CSS sur desktop)
    document.querySelectorAll("#menu-items .sub-toggle").forEach(function (t) {
        t.addEventListener("click", function (e) {
            const burger = document.querySelector(".menu-toggle");
            const isMobile = burger && getComputedStyle(burger).display !== "none";
            if (isMobile) {
                e.preventDefault();
                this.parentNode.classList.toggle("open");
            } else if (this.getAttribute("href") === "#") {
                e.preventDefault();
            }
        });
    });

    // 3. GESTION DU MENU DÉROULANT LANGUES
    const langLinks = document.querySelectorAll("a[data-lang]");
    langLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const selectedLang = this.getAttribute("data-lang");
            localStorage.setItem("language", selectedLang);
            location.reload(); 
        });
    });

    // 4. APPLIQUER LES TRADUCTIONS
    if (typeof dataTranslations !== 'undefined') {
        applyTranslations(lang, dataTranslations[lang]);
    } else {
        applyTranslations(lang, null);
    }
});

function applyTranslations(lang, pageTranslations) {
    // A. Traduction du Menu (mapping par lien : robuste quel que soit le nombre/ordre d'items)
    if (typeof menuTranslations !== 'undefined' && menuTranslations[lang]) {
        const menuTranslation = menuTranslations[lang];
        const hrefKeyMap = {
            'index.html': 'accueil',
            'logement.html': 'logement',
            'equipements.html': 'equipements',
            'dispo.html': 'dispo',
            'activites.html': 'activites',
            'commerces.html': 'commerces',
            'ou-manger.html': 'oumanger',
            'agenda.html': 'agenda',
            'contact.html': 'contact'
        };
        document.querySelectorAll("#menu-items li a").forEach(link => {
            const file = (link.getAttribute('href') || '').split('/').pop();
            const key = hrefKeyMap[file];
            if (key && menuTranslation[key]) {
                link.textContent = menuTranslation[key];
            }
        });
        // Libellés de groupe (toggles déroulants sans page propre, ex. « Autour de vous »)
        document.querySelectorAll("#menu-items [data-mkey]").forEach(el => {
            const k = el.getAttribute('data-mkey');
            if (menuTranslation[k]) el.textContent = menuTranslation[k];
        });
    }

    // B. Traduction du contenu par ID (Texte standard)
    if (pageTranslations) {
        Object.keys(pageTranslations).forEach(id => {
            // On ignore les clés spéciales qui servent aux classes (voir section C)
            if (['btn_website', 'btn_maps', 'info_min', 'info_km'].includes(id)) return;

            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                    element.placeholder = pageTranslations[id];
                } else {
                    element.innerHTML = pageTranslations[id];
                }
            }
        });

        // C. TRADUCTION DES CLASSES (Pour les éléments répétés comme les boutons)
        
        // 1. Boutons "Site officiel"
        if (pageTranslations.btn_website) {
            document.querySelectorAll('.lbl-website').forEach(el => {
                el.textContent = pageTranslations.btn_website;
            });
        }

        // 2. Boutons "Y aller" (Maps)
        if (pageTranslations.btn_maps) {
            document.querySelectorAll('.lbl-maps').forEach(el => {
                el.textContent = pageTranslations.btn_maps;
            });
        }

        // 3. Badges de transport (Remplacement intelligent du texte "min")
        if (pageTranslations.info_min) {
            document.querySelectorAll('.t-badge').forEach(badge => {
                // On remplace " min" par la version traduite (ex: " Min.") en gardant l'icône
                // On utilise innerHTML pour ne pas supprimer la balise <i>
                if (badge.innerHTML.includes(' min')) {
                    badge.innerHTML = badge.innerHTML.replace(' min', ' ' + pageTranslations.info_min);
                }
            });
        }
    }
}