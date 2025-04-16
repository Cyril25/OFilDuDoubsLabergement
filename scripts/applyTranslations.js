document.addEventListener("DOMContentLoaded", function () {
    const lang = localStorage.getItem('language') || 'fr'; // Langue par défaut : français

    // Charger le menu
    fetch("menu.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("menu-container").innerHTML = data;

            // Activer le menu burger
            const menuToggle = document.querySelector(".menu-toggle");
            const menuItems = document.querySelector("#menu-items");

            if (menuToggle && menuItems) {
                menuToggle.addEventListener("click", function () {
                    menuItems.classList.toggle("active");
                });
            } else {
                console.error("Le menu burger ne peut pas être activé.");
            }

            // Gérer le changement de langue
            const languageSelector = document.querySelector(".language-selector");
            if (languageSelector) {
                languageSelector.addEventListener("click", function (event) {
                    const target = event.target.closest("a[data-lang]");
                    if (target) {
                        const selectedLang = target.getAttribute("data-lang");
                        localStorage.setItem("language", selectedLang); // Sauvegarde la langue sélectionnée
                        location.reload(); // Recharge la page pour appliquer la langue
                    }
                });
            }

            // Appliquer les traductions
            applyTranslations(lang, dataTranslations[lang]);
        })
        .catch(error => console.error("Erreur lors du chargement du menu :", error));
});

function applyTranslations(lang, pageTranslations) {
    // Appliquer les traductions du menu
    const menuTranslation = menuTranslations[lang];
    if (menuTranslation) {
        const menuItems = document.querySelectorAll("#menu-items li a");
        if (menuItems.length > 0) {
            menuItems[0].textContent = menuTranslation.accueil;
            menuItems[1].textContent = menuTranslation.logement;
            menuItems[2].textContent = menuTranslation.equipements;
            menuItems[3].textContent = menuTranslation.infos;
            menuItems[4].textContent = menuTranslation.activites;
            menuItems[5].textContent = menuTranslation.contact;
        }
    }

    // Appliquer les traductions spécifiques à la page
    if (pageTranslations) {
        Object.keys(pageTranslations).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = pageTranslations[id];
            }
        });
    }
}