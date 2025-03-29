// Objet contenant les traductions
const translations = {
    fr: {
        title: "O'Fil du Doubs",
        subtitle: "Un hébergement confortable au bord de l'eau",
        welcome: "Bienvenue à O'Fil du Doubs",
        description: "Situé à Labergement-Sainte-Marie, notre logement vous offre un cadre idéal pour un séjour relaxant au cœur du Doubs."
    },
    en: {
        title: "O'Fil du Doubs",
        subtitle: "A comfortable accommodation by the water",
        welcome: "Welcome to O'Fil du Doubs",
        description: "Located in Labergement-Sainte-Marie, our accommodation offers an ideal setting for a relaxing stay in the heart of the Doubs."
    },
    de: {
        title: "O'Fil du Doubs",
        subtitle: "Eine komfortable Unterkunft am Wasser",
        welcome: "Willkommen bei O'Fil du Doubs",
        description: "In Labergement-Sainte-Marie gelegen, bietet unsere Unterkunft den idealen Rahmen für einen entspannten Aufenthalt im Herzen des Doubs."
    }
};

// Fonction pour récupérer la langue depuis localStorage ou définir une langue par défaut
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'fr'; // Langue par défaut : français
}

// Fonction pour changer la langue
function changeLanguage(lang) {
    if (!translations[lang]) {
        console.error(`La langue "${lang}" n'est pas disponible.`);
        return;
    }

    // Mettre à jour le contenu de la page
    document.getElementById('title').textContent = translations[lang].title;
    document.getElementById('subtitle').textContent = translations[lang].subtitle;
    document.getElementById('welcome').textContent = translations[lang].welcome;
    document.getElementById('description').textContent = translations[lang].description;

    // Stocker la langue sélectionnée dans localStorage
    localStorage.setItem('language', lang);
}

// Fonction pour changer la langue
function changeLanguage(lang) {
    document.getElementById('title').textContent = translations[lang].title;
    document.getElementById('subtitle').textContent = translations[lang].subtitle;
    document.getElementById('welcome').textContent = translations[lang].welcome;
    document.getElementById('description').textContent = translations[lang].description;

    // Stocker la langue sélectionnée dans localStorage
    localStorage.setItem('language', lang);
}

// Fonction pour charger la langue au démarrage
function loadLanguage() {
    const lang = getCurrentLanguage();
    changeLanguage(lang);
}