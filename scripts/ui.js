// === Consentement (RGPD) et mesure d'audience ===
//
// Bandeau affiché tant que la personne n'a pas répondu. Deux boutons de poids
// visuel identique : la CNIL demande que refuser soit aussi simple qu'accepter.
//
// Les libellés vivent ici, et pas dans un fichier *-translations.js, parce que
// ceux-ci sont appliqués par id APRÈS le rendu, page par page. Le bandeau, lui,
// n'existe dans aucun HTML : il est injecté sur les 81 pages. La langue est lue
// sur <html lang>, que build-i18n renseigne sur chaque page générée.
(function () {
    'use strict';

    // ---- Réglage : identifiant du projet Microsoft Clarity ----
    // Tant que cette chaîne est VIDE, aucun traceur n'est chargé, même si la
    // personne accepte. Le bandeau est en place, la mesure d'audience non.
    // Pour activer : coller ici l'identifiant donné par clarity.microsoft.com.
    var CLARITY_ID = 'yc3c3ftyd2';

    var KEY = 'consent.audience';        // 'granted' | 'denied'
    var KEY_DATE = 'consent.audience.date';
    var REASK_DAYS = 182;                // ~6 mois : délai avant de redemander à qui a refusé

    var I18N = {
        fr: {
            title: "Consentement aux cookies",
            text: "Ce site utilise des cookies pour mesurer sa fréquentation et améliorer votre visite.",
            accept: "J'accepte", decline: "Je refuse", more: "En savoir plus", manage: "Gérer mes cookies"
        },
        en: {
            title: "Cookie consent",
            text: "This site uses cookies to measure its audience and improve your visit.",
            accept: "Accept", decline: "Decline", more: "Learn more", manage: "Manage cookies"
        },
        de: {
            title: "Cookie-Einwilligung",
            text: "Diese Website verwendet Cookies, um ihre Reichweite zu messen und Ihren Besuch zu verbessern.",
            accept: "Akzeptieren", decline: "Ablehnen", more: "Mehr erfahren", manage: "Cookies verwalten"
        },
        nl: {
            title: "Cookietoestemming",
            text: "Deze site gebruikt cookies om het bezoek te meten en uw ervaring te verbeteren.",
            accept: "Accepteren", decline: "Weigeren", more: "Meer informatie", manage: "Cookies beheren"
        },
        es: {
            title: "Consentimiento de cookies",
            text: "Este sitio utiliza cookies para medir su audiencia y mejorar su visita.",
            accept: "Aceptar", decline: "Rechazar", more: "Saber más", manage: "Gestionar cookies"
        },
        it: {
            title: "Consenso ai cookie",
            text: "Questo sito utilizza cookie per misurare l'audience e migliorare la sua visita.",
            accept: "Accetta", decline: "Rifiuta", more: "Maggiori informazioni", manage: "Gestisci i cookie"
        },
        pt: {
            title: "Consentimento de cookies",
            text: "Este site utiliza cookies para medir a audiência e melhorar a sua visita.",
            accept: "Aceitar", decline: "Recusar", more: "Saber mais", manage: "Gerir cookies"
        }
    };

    function strings() {
        var l = (document.documentElement.getAttribute('lang') || 'fr').slice(0, 2).toLowerCase();
        return I18N[l] || I18N.fr;
    }

    // localStorage peut jeter (navigation privée, cookies bloqués) : on ne casse rien.
    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    // Renvoie 'granted', 'denied', ou null s'il faut (re)poser la question.
    function decision() {
        var v = read(KEY);
        if (v !== 'granted' && v !== 'denied') return null;
        if (v === 'denied') {
            var when = parseInt(read(KEY_DATE) || '0', 10);
            if (when && (Date.now() - when) > REASK_DAYS * 86400000) return null;
        }
        return v;
    }

    // Le relais ci-dessous n'est PAS décoratif. Dès sa première ligne, le tag de
    // Clarity appelle window.clarity(...) et lit window.clarity.q — il ne les crée
    // pas. Sans ce relais, la toute première instruction jette une TypeError et
    // rien ne démarre : dashboard vide, sans le moindre message d'erreur visible.
    function loadClarity() {
        if (!CLARITY_ID || window.clarity) return;
        window.clarity = function () {
            (window.clarity.q = window.clarity.q || []).push(arguments);
        };
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
        document.head.appendChild(s);

        // Consent Mode : actif d'office pour les visiteurs de l'EEE, du Royaume-Uni
        // et de Suisse depuis le 31/10/2025. Sans ce signal, Clarity tourne en mode
        // « sans consentement », ne pose aucun cookie et ne relie pas les pages
        // entre elles. On ne l'envoie que sur un « Accepter » explicite.
        //
        // ad_Storage reste refusé : le bandeau demande la mesure d'audience, pas
        // la publicité. Accorder ad_Storage déclencherait la synchronisation de
        // l'identifiant publicitaire Microsoft (c.clarity.ms/c.gif), que personne
        // n'a acceptée ici.
        window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    }

    // Refus : on efface les cookies de mesure. Si le traceur tournait déjà dans
    // cette visite (changement d'avis en cours de route), seul un rechargement
    // garantit qu'il s'arrête vraiment.
    function forgetClarity() {
        // Si le traceur tournait déjà (changement d'avis en cours de visite), on le
        // prévient : Clarity supprime alors ses cookies et clôt la session.
        if (window.clarity) {
            try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); } catch (e) {}
        }
        var names = ['_clck', '_clsk'];
        for (var i = 0; i < names.length; i++) {
            document.cookie = names[i] + '=; Max-Age=0; path=/';
        }
        // Puis on recharge : c'est le seul moyen sûr que plus rien ne tourne.
        if (window.clarity) { try { location.reload(); } catch (e) {} }
    }

    function decide(value) {
        write(KEY, value);
        write(KEY_DATE, String(Date.now()));
        var banner = document.getElementById('rgpd-banner');
        if (banner) banner.remove();
        if (value === 'granted') loadClarity();
        else forgetClarity();
    }

    function show() {
        if (document.getElementById('rgpd-banner')) return;
        var t = strings();
        var banner = document.createElement('div');
        banner.id = 'rgpd-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', t.title);
        banner.innerHTML =
            '<p>' + t.text + ' <a href="mentions.html">' + t.more + '</a></p>' +
            '<div id="rgpd-actions">' +
            '<button type="button" id="rgpd-decline">' + t.decline + '</button>' +
            '<button type="button" id="rgpd-accept">' + t.accept + '</button>' +
            '</div>';
        document.body.appendChild(banner);
        document.getElementById('rgpd-accept').addEventListener('click', function () { decide('granted'); });
        document.getElementById('rgpd-decline').addEventListener('click', function () { decide('denied'); });
    }

    // Lien « Gérer mes cookies » ajouté au pied de page, à la suite des mentions
    // légales. Injecté plutôt qu'écrit dans le HTML : une seule source pour les
    // 81 pages, et rien à régénérer.
    function injectManageLink() {
        var legal = document.getElementById('footer_link_legal');
        if (!legal || document.getElementById('footer_link_cookies')) return;
        var a = document.createElement('a');
        a.id = 'footer_link_cookies';
        a.href = '#';
        a.textContent = strings().manage;
        a.addEventListener('click', function (e) {
            e.preventDefault();
            window.ofdConsent.reset();
        });
        legal.parentNode.insertBefore(a, legal.nextSibling);
    }

    // Permet de revenir sur son choix.
    window.ofdConsent = {
        status: function () { return read(KEY) || 'unset'; },
        reset: function () { write(KEY, ''); write(KEY_DATE, ''); show(); }
    };

    var state = decision();
    if (state === 'granted') loadClarity();
    else if (state === null) show();

    injectManageLink();
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
