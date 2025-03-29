// Objet contenant les traductions
const translations = {
    fr: {
        title: "O'Fil du Doubs",
        subtitle: "Un hébergement confortable au bord de l'eau",
        welcome: "Bienvenue à O'Fil du Doubs",
        description: "Situé à Labergement-Sainte-Marie, notre logement vous offre un cadre idéal pour un séjour relaxant au cœur du Doubs.",
        infos: {
            adresse: "2 Impasse Cotti, 25160 Labergement-Sainte-Marie (France)",
            stationnement: "Les places marquées \"Réservée\" au sol sont privatives, merci de ne pas vous y garer. Vous pouvez stationner sur l’ensemble des autres places de parking de la résidence.",
            localPoubelles: "Un local poubelles se trouve au niveau des garages au -1. Vous pouvez y déposer vos déchets dans les poubelles vertes et jaunes pour le tri.",
            numerosUtiles: [
                { label: "112", description: "Numéro d’urgence européen" },
                { label: "15", description: "Samu" },
                { label: "17", description: "Police secours" },
                { label: "18", description: "Sapeurs-pompiers" },
                { label: "Centre Hospitalier de Pontarlier", description: "03 81 38 54 54" },
                { label: "Pharmacie de garde", description: "32 37" }
            ]
        }
    },
    en: {
        title: "O'Fil du Doubs",
        subtitle: "A comfortable accommodation by the water",
        welcome: "Welcome to O'Fil du Doubs",
        description: "Located in Labergement-Sainte-Marie, our accommodation offers an ideal setting for a relaxing stay in the heart of the Doubs.",
        infos: {
            adresse: "2 Impasse Cotti, 25160 Labergement-Sainte-Marie (France)",
            stationnement: "The spaces marked \"Reserved\" on the ground are private, please do not park there. You can park in all other parking spaces of the residence.",
            localPoubelles: "A garbage room is located at the garage level (-1). You can dispose of your waste in the green and yellow bins for recycling.",
            numerosUtiles: [
                { label: "112", description: "European emergency number" },
                { label: "15", description: "Emergency medical services" },
                { label: "17", description: "Police emergency" },
                { label: "18", description: "Firefighters" },
                { label: "Pontarlier Hospital Center", description: "03 81 38 54 54" },
                { label: "On-call pharmacy", description: "32 37" }
            ]
        }
    },
    de: {
        title: "O'Fil du Doubs",
        subtitle: "Eine komfortable Unterkunft am Wasser",
        welcome: "Willkommen bei O'Fil du Doubs",
        description: "In Labergement-Sainte-Marie gelegen, bietet unsere Unterkunft den idealen Rahmen für einen entspannten Aufenthalt im Herzen des Doubs.",
        infos: {
            adresse: "2 Impasse Cotti, 25160 Labergement-Sainte-Marie (Frankreich)",
            stationnement: "Die mit \"Reserviert\" markierten Plätze sind privat, bitte parken Sie dort nicht. Sie können auf allen anderen Parkplätzen der Residenz parken.",
            localPoubelles: "Ein Müllraum befindet sich auf der Garagenebene (-1). Sie können Ihren Abfall in den grünen und gelben Tonnen für das Recycling entsorgen.",
            numerosUtiles: [
                { label: "112", description: "Europäische Notrufnummer" },
                { label: "15", description: "Rettungsdienst" },
                { label: "17", description: "Polizeinotruf" },
                { label: "18", description: "Feuerwehr" },
                { label: "Krankenhaus Pontarlier", description: "03 81 38 54 54" },
                { label: "Notdienstapotheke", description: "32 37" }
            ]
        }
    }
};

// Fonction pour récupérer la langue depuis localStorage ou définir une langue par défaut
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'fr'; // Langue par défaut : français
}

function changeLanguage(lang) {
    const content = translations[lang].infos;

    // Update text content for sections
    document.getElementById("adresse").textContent = content.adresse;
    document.getElementById("stationnement").textContent = content.stationnement;
    document.getElementById("local-poubelles").textContent = content.localPoubelles;

    // Update headings
    document.getElementById("adresse-title").textContent = "Adresse";
    document.getElementById("stationnement-title").textContent = "Places de stationnement";
    document.getElementById("local-poubelles-title").textContent = "Local poubelles";
    document.getElementById("numeros-utiles-title").textContent = "Numéros utiles";

    // Update useful numbers list
    const ul = document.getElementById("numeros-utiles");
    ul.innerHTML = "";
    content.numerosUtiles.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.label} - ${item.description}`;
        ul.appendChild(li);
    });

    // Stocker la langue sélectionnée dans localStorage
    localStorage.setItem('language', lang);
}

// Charger la langue au démarrage
document.addEventListener("DOMContentLoaded", () => {
    const lang = getCurrentLanguage();
    changeLanguage(lang);
});

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