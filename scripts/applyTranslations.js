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