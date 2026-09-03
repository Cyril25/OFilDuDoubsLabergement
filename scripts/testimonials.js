// === Carrousel de témoignages (page d'accueil) ===
//
// Le défilement lui-même est natif : la piste est une zone scrollable avec
// scroll-snap (voir styles.css). Ce fichier ne fait qu'ajouter par-dessus le
// défilement automatique, les flèches et les pastilles. Sans JS, la piste reste
// utilisable au doigt et au clavier.
//
// Les libellés vivent ici, comme pour le bandeau RGPD : ce sont des attributs
// aria, or build-i18n ne traduit que le contenu des éléments portant un id.
(function () {
    'use strict';

    var I18N = {
        fr: { prev: "Témoignages précédents", next: "Témoignages suivants", page: "Témoignages, page", group: "Témoignages de voyageurs", dots: "Pages de témoignages" },
        en: { prev: "Previous reviews", next: "Next reviews", page: "Reviews, page", group: "Guest reviews", dots: "Review pages" },
        de: { prev: "Vorherige Bewertungen", next: "Nächste Bewertungen", page: "Bewertungen, Seite", group: "Gästebewertungen", dots: "Bewertungsseiten" },
        nl: { prev: "Vorige beoordelingen", next: "Volgende beoordelingen", page: "Beoordelingen, pagina", group: "Beoordelingen van gasten", dots: "Beoordelingspagina's" },
        es: { prev: "Opiniones anteriores", next: "Opiniones siguientes", page: "Opiniones, página", group: "Opiniones de los viajeros", dots: "Páginas de opiniones" },
        it: { prev: "Recensioni precedenti", next: "Recensioni successive", page: "Recensioni, pagina", group: "Recensioni dei viaggiatori", dots: "Pagine di recensioni" },
        pt: { prev: "Avaliações anteriores", next: "Avaliações seguintes", page: "Avaliações, página", group: "Avaliações dos viajantes", dots: "Páginas de avaliações" }
    };

    function init() {
        var root = document.querySelector('[data-testimonials]');
        if (!root) return;

        var track = root.querySelector('.testimonials-track');
        var cards = Array.prototype.slice.call(root.querySelectorAll('.testimonial-card'));
        if (!track || cards.length < 2) return;

        var prevBtn = root.querySelector('.carousel-prev');
        var nextBtn = root.querySelector('.carousel-next');
        var dotsBox = root.querySelector('.carousel-dots');

        var lang = (document.documentElement.getAttribute('lang') || 'fr').slice(0, 2).toLowerCase();
        var t = I18N[lang] || I18N.fr;
        if (prevBtn) prevBtn.setAttribute('aria-label', t.prev);
        if (nextBtn) nextBtn.setAttribute('aria-label', t.next);
        if (dotsBox) {
            dotsBox.setAttribute('role', 'group');   // sans rôle, un aria-label sur un <div> est ignoré
            dotsBox.setAttribute('aria-label', t.dots);
        }
        track.setAttribute('aria-label', t.group);

        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        var DELAY = parseInt(root.getAttribute('data-autoplay'), 10) || 6000;

        // --- Géométrie : tout est déduit du rendu, jamais codé en dur, pour que
        //     les points de rupture CSS restent la seule source de vérité. ---
        function gap() {
            var g = parseFloat(getComputedStyle(track).columnGap);
            return isNaN(g) ? 0 : g;
        }
        function viewWidth() {
            var cs = getComputedStyle(track);
            return track.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        }
        function perView() {
            var step = cards[0].getBoundingClientRect().width + gap();
            if (step <= 0) return 1;
            return Math.max(1, Math.round((viewWidth() + gap()) / step));
        }
        function pageCount() {
            return Math.ceil(cards.length / perView());
        }
        // offsetLeft se mesure depuis le bord de la piste (position: relative en CSS),
        // marge intérieure comprise : c'est exactement la valeur de scrollLeft sur
        // laquelle scroll-snap cale la carte. S'en écarter provoquerait un ressaut
        // du navigateur juste après chaque défilement.
        function offsetOf(i) {
            return cards[i].offsetLeft;
        }
        // Carte la plus proche de la position courante : robuste même après un
        // glissement libre au doigt, où on peut s'arrêter n'importe où.
        function currentPage() {
            var x = track.scrollLeft, best = 0, bestD = Infinity;
            for (var i = 0; i < cards.length; i++) {
                var d = Math.abs(offsetOf(i) - x);
                if (d < bestD) { bestD = d; best = i; }
            }
            return Math.floor(best / perView());
        }

        function goTo(page) {
            var n = pageCount();
            var p = ((page % n) + n) % n;                       // boucle dans les deux sens
            var i = Math.min(p * perView(), cards.length - 1);
            var left = offsetOf(i);
            var behavior = reduced.matches ? 'auto' : 'smooth';
            if (track.scrollTo) track.scrollTo({ left: left, behavior: behavior });
            else track.scrollLeft = left;
        }

        // --- Pastilles ---
        function syncDots() {
            if (!dotsBox) return;
            var p = currentPage();
            for (var i = 0; i < dotsBox.children.length; i++) {
                if (i === p) dotsBox.children[i].setAttribute('aria-current', 'true');
                else dotsBox.children[i].removeAttribute('aria-current');
            }
        }
        function buildDots() {
            var n = pageCount();
            var single = n < 2;                                 // tout tient déjà à l'écran
            if (prevBtn) prevBtn.hidden = single;
            if (nextBtn) nextBtn.hidden = single;
            if (!dotsBox) return;
            dotsBox.innerHTML = '';
            if (single) return;
            for (var i = 0; i < n; i++) {
                var b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', t.page + ' ' + (i + 1));
                b.addEventListener('click', (function (k) {
                    return function () { goTo(k); restart(); };
                })(i));
                dotsBox.appendChild(b);
            }
            syncDots();
        }

        // --- Défilement automatique ---
        // Trois raisons indépendantes de mettre en pause : on les suit séparément,
        // sinon relâcher la souris après un clic sur une flèche relancerait le
        // défilement alors que le curseur est toujours sur le carrousel.
        var timer = null, onScreen = true;
        var hovering = false, dragging = false, focused = false;

        function held() { return hovering || dragging || focused; }

        function start() {
            if (timer || reduced.matches || pageCount() < 2) return;
            timer = setInterval(function () {
                if (held() || !onScreen || document.hidden) return;
                goTo(currentPage() + 1);
            }, DELAY);
        }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function restart() { stop(); start(); }                 // remet le compte à rebours à zéro
        function release() { if (!held()) restart(); }          // reprise : on repart d'un cycle entier

        root.addEventListener('mouseenter', function () { hovering = true; });
        root.addEventListener('mouseleave', function () { hovering = false; release(); });
        root.addEventListener('focusin', function () { focused = true; });
        root.addEventListener('focusout', function () { focused = false; release(); });
        track.addEventListener('pointerdown', function () { dragging = true; });
        window.addEventListener('pointerup', function () { dragging = false; release(); });
        window.addEventListener('pointercancel', function () { dragging = false; release(); });

        if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentPage() - 1); restart(); });
        if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentPage() + 1); restart(); });

        var scrollRaf = null;
        track.addEventListener('scroll', function () {
            if (scrollRaf) return;
            scrollRaf = requestAnimationFrame(function () { scrollRaf = null; syncDots(); });
        }, { passive: true });

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(buildDots, 200);
        });

        // Inutile de faire tourner le minuteur quand la section est hors écran.
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                onScreen = entries[0].isIntersecting;
            }, { threshold: 0.2 }).observe(root);
        }

        if (reduced.addEventListener) {
            reduced.addEventListener('change', function () { if (reduced.matches) { stop(); } else { start(); } });
        }

        buildDots();
        start();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
