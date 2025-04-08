// Objet contenant les traductions
const translations = {
    fr: {
        title: "O'Fil du Doubs",
        subtitle: "Un hébergement confortable au bord de l'eau",
        welcome: "Bienvenue chez Alisson et Cyril - O'Fil du Doubs",
        description: "Situé à Labergement-Sainte-Marie, notre logement vous offre un cadre idéal pour un séjour relaxant au cœur du Doubs.",
        menu: {
            accueil: "Accueil",
            infos: "Infos pratiques",
            checkin: "Check-in / Check-out",
            equipements:"Confort & Équipements",
            activites: "Activités & Commerces",
            contact: "Contact"
        },
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
        welcome: "Welcome to Alisson et Cyril's - O'Fil du Doubs",
        description: "Located in Labergement-Sainte-Marie, our accommodation offers an ideal setting for a relaxing stay in the heart of the Doubs.",
        menu: {
            accueil: "Home",
            infos: "Practical Info",
            checkin: "Check-in / Check-out",
            equipements:"Confort & Équipements",
            activites: "Activities & Shops",
            contact: "Contact"
        },
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
        welcome: "Willkommen bei Alisson und Cyril - O'Fil du Doubs",
        description: "In Labergement-Sainte-Marie gelegen, bietet unsere Unterkunft den idealen Rahmen für einen entspannten Aufenthalt im Herzen des Doubs.",
        menu: {
            accueil: "Startseite",
            infos: "Praktische Infos",
            checkin: "Check-in / Check-out",
            equipements:"Confort & Équipements",
            activites: "Aktivitäten & Geschäfte",
            contact: "Kontakt"
        },
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

function changeLanguage(lang) {
    const translation = translations[lang];
    if (!translation) {
        console.error(`La langue "${lang}" n'est pas disponible.`);
        return;
    }

    // Traductions communes (présentes sur toutes les pages)
    const titleElement = document.getElementById('title');
    const subtitleElement = document.getElementById('subtitle');
    const welcomeElement = document.getElementById('welcome');
    const descriptionElement = document.getElementById('description');

    if (titleElement) titleElement.textContent = translation.title;
    if (subtitleElement) subtitleElement.textContent = translation.subtitle;
    if (welcomeElement) welcomeElement.textContent = translation.welcome;
    if (descriptionElement) descriptionElement.textContent = translation.description;

    // Traductions du menu
    const menuItems = document.querySelectorAll("#menu-items li a");
    if (menuItems.length > 0) {
        menuItems[0].textContent = translation.menu.accueil;
        menuItems[1].textContent = translation.menu.infos;
        menuItems[2].textContent = translation.menu.checkin;
        menuItems[3].textContent = translation.menu.equipements;
        menuItems[4].textContent = translation.menu.activites;
        menuItems[5].textContent = translation.menu.contact;
    }
    
    // Traductions spécifiques à la page "infos.html"
    if (translation.infos) {
        const adresseElement = document.getElementById('adresse');
        const stationnementElement = document.getElementById('stationnement');
        const localPoubellesElement = document.getElementById('local-poubelles');
        const adresseTitleElement = document.getElementById('adresse-title');
        const stationnementTitleElement = document.getElementById('stationnement-title');
        const localPoubellesTitleElement = document.getElementById('local-poubelles-title');
        const numerosUtilesTitleElement = document.getElementById('numeros-utiles-title');
        const numerosUtilesList = document.getElementById('numeros-utiles');

        if (adresseElement) adresseElement.textContent = translation.infos.adresse;
        if (stationnementElement) stationnementElement.textContent = translation.infos.stationnement;
        if (localPoubellesElement) localPoubellesElement.textContent = translation.infos.localPoubelles;

        if (adresseTitleElement) adresseTitleElement.textContent = "Adresse";
        if (stationnementTitleElement) stationnementTitleElement.textContent = "Places de stationnement";
        if (localPoubellesTitleElement) localPoubellesTitleElement.textContent = "Local poubelles";
        if (numerosUtilesTitleElement) numerosUtilesTitleElement.textContent = "Numéros utiles";

        if (numerosUtilesList) {
            numerosUtilesList.innerHTML = ""; // Vider la liste existante
            translation.infos.numerosUtiles.forEach(item => {
                const li = document.createElement("li");
                li.textContent = `${item.label} - ${item.description}`;
                numerosUtilesList.appendChild(li);
            });
        }
    }

    // Traductions spécifiques à la page "equipements.html"
if (translation.infos && translation.infos.equipementDetails) {
    const equipementsTitleElement = document.getElementById('equipements-title');
    const wifiTitleElement = document.getElementById('wifi-title');
    const wifiDescriptionElement = document.getElementById('wifi-description');
    const multimediaTitleElement = document.getElementById('multimedia-title');
    const multimediaDescriptionElement = document.getElementById('multimedia-description');
    const babyTitleElement = document.getElementById('baby-title');
    const babyDescriptionElement = document.getElementById('baby-description');
    const kitchenAppliancesTitleElement = document.getElementById('kitchen-appliances-title');
    const kitchenAppliancesDescriptionElement = document.getElementById('kitchen-appliances-description');
    const kitchenTitleElement = document.getElementById('kitchen-title');
    const kitchenDescriptionElement = document.getElementById('kitchen-description');
    const consumablesTitleElement = document.getElementById('consumables-title');
    const consumablesDescriptionElement = document.getElementById('consumables-description');
    const recyclingTitleElement = document.getElementById('recycling-title');
    const recyclingDescriptionElement = document.getElementById('recycling-description');

    if (equipementsTitleElement) equipementsTitleElement.textContent = translation.menu.equipements;
    if (wifiTitleElement) wifiTitleElement.textContent = "Wifi";
    if (wifiDescriptionElement) wifiDescriptionElement.textContent = translation.infos.equipementDetails.wifi;
    if (multimediaTitleElement) multimediaTitleElement.textContent = "Multimédia";
    if (multimediaDescriptionElement) multimediaDescriptionElement.textContent = translation.infos.equipementDetails.multimedia;
    if (babyTitleElement) babyTitleElement.textContent = "Pour bébé";
    if (babyDescriptionElement) babyDescriptionElement.textContent = translation.infos.equipementDetails.baby;
    if (kitchenAppliancesTitleElement) kitchenAppliancesTitleElement.textContent = "Appareils de cuisine";
    if (kitchenAppliancesDescriptionElement) kitchenAppliancesDescriptionElement.textContent = translation.infos.equipementDetails.kitchenAppliances;
    if (kitchenTitleElement) kitchenTitleElement.textContent = "A la cuisine";
    if (kitchenDescriptionElement) kitchenDescriptionElement.textContent = translation.infos.equipementDetails.kitchen;
    if (consumablesTitleElement) consumablesTitleElement.textContent = "Consommables";
    if (consumablesDescriptionElement) consumablesDescriptionElement.textContent = translation.infos.equipementDetails.consumables;
    if (recyclingTitleElement) recyclingTitleElement.textContent = "Tri sélectif";
    if (recyclingDescriptionElement) recyclingDescriptionElement.textContent = translation.infos.equipementDetails.recycling;
}

    // Stocker la langue sélectionnée dans localStorage
    localStorage.setItem('language', lang);
}