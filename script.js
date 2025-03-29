document.addEventListener("DOMContentLoaded", function () {
    console.log("Le script est chargé !");
    loadLanguage("fr");
});

function loadLanguage(lang) {
    fetch("lang.json")
        .then(response => response.json())
        .then(data => {
            document.getElementById("title").innerText = data[lang]["title"];
            document.getElementById("intro-text").innerText = data[lang]["intro-text"];
            document.getElementById("btn-gallery").innerText = data[lang]["btn-gallery"];
            document.getElementById("info-title").innerText = data[lang]["info-title"];
            document.getElementById("info-address").innerText = data[lang]["info-address"];
            document.getElementById("info-checkin").innerText = data[lang]["info-checkin"];
            document.getElementById("info-amenities").innerText = data[lang]["info-amenities"];
            document.getElementById("footer-text").innerText = data[lang]["footer-text"];
        })
        .catch(error => console.error("Erreur lors du chargement des traductions:", error));
}

function changeLanguage(lang) {
    loadLanguage(lang);
}