document.addEventListener("DOMContentLoaded", function () {
    // Chargement du menu
    fetch("menu.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("menu-container").innerHTML = data;

            let menuToggle = document.querySelector(".menu-toggle");
            let menuItems = document.querySelector("#menu-items");

            if (menuToggle && menuItems) {
                menuToggle.addEventListener("click", function () {
                    menuItems.classList.toggle("active");
                });
            }
        })
        .catch(error => console.error("Erreur lors du chargement du menu :", error));
});

// Traductions
const translations = {
    fr: {
        welcome: "Bienvenue à O'Fil du Doubs",
        description: "Situé à Labergement-Sainte-Marie, notre logement vous offre un cadre idéal pour un séjour relaxant au cœur du Jura."
    },
    en: {
        welcome: "Welcome to O'Fil du Doubs",
        description: "Located in Labergement-Sainte-Marie, our accommodation offers an ideal setting for a relaxing stay in the heart of the Jura."
    },
    de: {
        welcome: "Willkommen bei O'Fil du Doubs",
        description: "In Labergement-Sainte-Marie gelegen, bietet unsere Unterkunft den idealen Rahmen für einen entspannten Aufenthalt im Herzen des Jura."
    }
};

function changeLanguage(lang) {
    document.getElementById('welcome').textContent = translations[lang].welcome;
    document.getElementById('description').textContent = translations[lang].description;
}