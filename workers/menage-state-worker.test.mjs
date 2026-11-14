// Tests de la mémoire des blocs « Not available » du worker menage-state
// (restituerBlocsRognes) et de la prise en compte des départs restitués.
//
// Lancer depuis la racine du dépôt : node --test workers/menage-state-worker.test.mjs
// (workers/package.json déclare "type": "module" pour que Node importe le worker.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restituerBlocsRognes, isOneDayBlock, updateCheckoutsFromFeed } from './menage-state-worker.js';

const EOL = '\r\n';

function vevent({ debut, fin, resume, uid }) {
    return [
        'BEGIN:VEVENT',
        'DTSTAMP:20261114T130632Z',
        `DTSTART;VALUE=DATE:${debut.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${fin.replace(/-/g, '')}`,
        `SUMMARY:${resume}`,
        `UID:${uid}`,
        'END:VEVENT',
    ].join(EOL);
}

function calendrier(...events) {
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join(EOL) + EOL;
}

const booking = (debut, fin) => vevent({ debut, fin, resume: 'CLOSED - Not available', uid: 'abc@booking.com' });
const blocAirbnb = (debut, fin) => vevent({ debut, fin, resume: 'Airbnb (Not available)', uid: 'x-1@airbnb.com' });
const resaAirbnb = (debut, fin) => vevent({ debut, fin, resume: 'Reserved', uid: 'x-2@airbnb.com' });

const fluxBooking = (...events) => ({ plateforme: 'booking', texte: calendrier(...events) });
const fluxAirbnb = (...events) => ({ plateforme: 'airbnb', texte: calendrier(...events) });

const debutDe = event => event.match(/DTSTART;VALUE=DATE:(\d{8})/)[1];
const finDe = event => event.match(/DTEND;VALUE=DATE:(\d{8})/)[1];
const debutFluxDe = event => (event.match(/X-MENAGE-DEBUT-FLUX:(\d{8})/) || [])[1];

test('séjour Booking 9→13 livré à partir du jour courant : le début vu plus tôt est restitué', () => {
    // 8/11 : le bloc est à venir, entier → mémorisé tel quel
    let r = restituerBlocsRognes([fluxBooking(booking('2026-11-09', '2026-11-13'))], {}, '2026-11-08');
    assert.deepEqual(r.memoire, { 'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' } });
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(debutFluxDe(r.evenements[0]), undefined);
    assert.equal(r.journaux.length, 0);

    // 9/11 : jour d'arrivée, bloc entier → rien ne change
    r = restituerBlocsRognes([fluxBooking(booking('2026-11-09', '2026-11-13'))], r.memoire, '2026-11-09');
    assert.deepEqual(r.memoire, { 'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' } });
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(r.journaux.length, 0);

    // 10/11 : Booking livre 10→13 → début restitué, une ligne de journal
    r = restituerBlocsRognes([fluxBooking(booking('2026-11-10', '2026-11-13'))], r.memoire, '2026-11-10');
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(finDe(r.evenements[0]), '20261113');
    assert.equal(debutFluxDe(r.evenements[0]), '20261110');
    assert.deepEqual(r.journaux, [{ plateforme: 'booking', debut: '2026-11-09', fin: '2026-11-13', debut_flux: '2026-11-10' }]);
    assert.equal(r.memoire['booking|2026-11-13'].rogne, '2026-11-10');

    // 11/11 : 11→13 → restitué, plus de journal
    r = restituerBlocsRognes([fluxBooking(booking('2026-11-11', '2026-11-13'))], r.memoire, '2026-11-11');
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(r.journaux.length, 0);

    // 12/11, dernière nuit : 12→13, un bloc d'un jour → restitué, et ce n'est
    // plus un bloc d'un jour pour updateCheckoutsFromFeed
    r = restituerBlocsRognes([fluxBooking(booking('2026-11-12', '2026-11-13'))], r.memoire, '2026-11-12');
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(debutFluxDe(r.evenements[0]), '20261112');
    assert.equal(isOneDayBlock(r.evenements[0], '2026-11-09', '2026-11-13'), false);
    assert.equal(r.journaux.length, 0);

    // 13/11 : le bloc a disparu du flux → oublié
    r = restituerBlocsRognes([fluxBooking()], r.memoire, '2026-11-13');
    assert.deepEqual(r.memoire, {});
    assert.equal(r.evenements.length, 0);
});

test('le VEVENT restitué garde ses autres lignes et ses fins de ligne', () => {
    const memoire = { 'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' } };
    const r = restituerBlocsRognes([fluxBooking(booking('2026-11-12', '2026-11-13'))], memoire, '2026-11-12');
    const lignes = r.evenements[0].split(EOL);
    assert.deepEqual(lignes, [
        'BEGIN:VEVENT',
        'DTSTAMP:20261114T130632Z',
        'DTSTART;VALUE=DATE:20261109',
        'X-MENAGE-DEBUT-FLUX:20261112',
        'DTEND;VALUE=DATE:20261113',
        'SUMMARY:CLOSED - Not available',
        'UID:abc@booking.com',
        'END:VEVENT',
    ]);
});

test('la mémoire passée en entrée n est jamais modifiée', () => {
    const memoire = { 'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' } };
    const copie = JSON.parse(JSON.stringify(memoire));
    restituerBlocsRognes([fluxBooking(booking('2026-11-11', '2026-11-13'))], memoire, '2026-11-11');
    restituerBlocsRognes([fluxBooking()], memoire, '2026-11-13');
    assert.deepEqual(memoire, copie);
});

test('un bloc d un jour jamais vu plus long n est ni mémorisé ni touché', () => {
    const r = restituerBlocsRognes([
        fluxAirbnb(blocAirbnb('2026-11-14', '2026-11-15'), blocAirbnb('2027-11-14', '2027-11-15')),
        fluxBooking(booking('2027-08-26', '2027-08-27')),
    ], {}, '2026-11-14');
    assert.deepEqual(r.memoire, {});
    assert.equal(r.evenements.length, 3);
    assert.equal(debutDe(r.evenements[0]), '20261114');
    assert.equal(isOneDayBlock(r.evenements[0], '2026-11-14', '2026-11-15'), true);
    assert.equal(r.journaux.length, 0);
});

test('les réservations « Reserved » Airbnb ne sont ni mémorisées ni modifiées', () => {
    const r = restituerBlocsRognes([fluxAirbnb(resaAirbnb('2026-11-10', '2026-11-13'))],
        { 'airbnb|2026-11-13': { debut: '2026-11-05', vu: '2026-11-01' } }, '2026-11-12');
    assert.equal(debutDe(r.evenements[0]), '20261110');
    // la mémoire ne portait pas sur ce bloc : la clé, absente du flux, disparaît
    assert.deepEqual(r.memoire, {});
});

test('un bloc à venir déplacé par l hôte : la mémoire suit le flux', () => {
    let r = restituerBlocsRognes([fluxAirbnb(blocAirbnb('2026-12-19', '2026-12-27'))], {}, '2026-11-14');
    assert.equal(r.memoire['airbnb|2026-12-27'].debut, '2026-12-19');

    r = restituerBlocsRognes([fluxAirbnb(blocAirbnb('2026-12-21', '2026-12-27'))], r.memoire, '2026-11-15');
    assert.equal(r.memoire['airbnb|2026-12-27'].debut, '2026-12-21');
    assert.equal(r.memoire['airbnb|2026-12-27'].vu, '2026-11-14');
    assert.equal(debutDe(r.evenements[0]), '20261221');
    assert.equal(r.journaux.length, 0);

    // réduit à un jour avant d'avoir commencé : plus rien à retenir
    r = restituerBlocsRognes([fluxAirbnb(blocAirbnb('2026-12-26', '2026-12-27'))], r.memoire, '2026-11-16');
    assert.deepEqual(r.memoire, {});
    assert.equal(debutDe(r.evenements[0]), '20261226');
});

test('un bloc en cours dont le flux montre un début plus ancien : le flux fait foi', () => {
    const memoire = { 'airbnb|2026-11-13': { debut: '2026-11-11', vu: '2026-11-11' } };
    const r = restituerBlocsRognes([fluxAirbnb(blocAirbnb('2026-11-09', '2026-11-13'))], memoire, '2026-11-12');
    assert.equal(r.memoire['airbnb|2026-11-13'].debut, '2026-11-09');
    assert.equal(debutDe(r.evenements[0]), '20261109');
    assert.equal(debutFluxDe(r.evenements[0]), undefined);
});

test('les deux plateformes sont mémorisées séparément', () => {
    const memoire = {
        'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' },
        'airbnb|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' },
    };
    const r = restituerBlocsRognes([
        fluxAirbnb(blocAirbnb('2026-11-12', '2026-11-13'), blocAirbnb('2026-12-19', '2026-12-27')),
        fluxBooking(booking('2026-11-12', '2026-11-13')),
    ], memoire, '2026-11-12');
    assert.deepEqual(r.evenements.map(debutDe), ['20261109', '20261219', '20261109']);
    assert.equal(r.journaux.length, 2);
    assert.deepEqual(Object.keys(r.memoire).sort(), ['airbnb|2026-11-13', 'airbnb|2026-12-27', 'booking|2026-11-13']);
});

test('un flux sans VCALENDAR (page d erreur) ne vide pas la mémoire de sa plateforme', () => {
    const memoire = {
        'booking|2026-11-13': { debut: '2026-11-09', vu: '2026-11-08' },
        'airbnb|2026-12-27': { debut: '2026-12-19', vu: '2026-11-01' },
    };
    const r = restituerBlocsRognes([
        { plateforme: 'booking', texte: '<html>Service indisponible</html>' },
        fluxAirbnb(blocAirbnb('2026-12-19', '2026-12-27')),
    ], memoire, '2026-11-12');
    assert.deepEqual(r.memoire, memoire);
    assert.equal(r.evenements.length, 1);
});

test('une mémoire illisible est traitée comme vide', () => {
    const r = restituerBlocsRognes([fluxBooking(booking('2026-11-12', '2026-11-13'))], null, '2026-11-12');
    assert.deepEqual(r.memoire, {});
    assert.equal(debutDe(r.evenements[0]), '20261112');
});

// --- updateCheckoutsFromFeed : le départ du bloc restitué est bien noté ---

function fauxD1(parametres) {
    const ecrits = [];
    const db = {
        prepare(sql) {
            const stmt = {
                sql,
                args: [],
                bind(...args) { stmt.args = args; return stmt; },
                async all() { return { results: parametres }; },
                async first() { return null; },
                async run() { ecrits.push(stmt); return { meta: { changes: 1 } }; },
            };
            return stmt;
        },
        async batch(stmts) { ecrits.push(...stmts); return stmts.map(() => ({ meta: { changes: 1 } })); },
    };
    return { db, ecrits };
}

const todayParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const jour = decalage => new Date(Date.parse(todayParis) + decalage * 86400000).toISOString().slice(0, 10);

test('dernière nuit d un séjour Booking : sans restitution le départ est perdu, avec il est noté', async () => {
    const flux = [fluxBooking(booking(jour(0), jour(1)))];

    // Sans mémoire : le bloc d'un jour est écarté, aucun départ à venir
    const brut = restituerBlocsRognes(flux, {}, todayParis);
    const sans = fauxD1([{ cle: 'departs_a_venir', valeur: '[]' }]);
    await updateCheckoutsFromFeed({ DB: sans.db }, brut.evenements);
    assert.equal(sans.ecrits.length, 0);

    // Avec le début vu trois jours plus tôt : le départ de demain est noté
    const restitue = restituerBlocsRognes(flux, { [`booking|${jour(1)}`]: { debut: jour(-3), vu: jour(-4) } }, todayParis);
    const avec = fauxD1([{ cle: 'departs_a_venir', valeur: '[]' }]);
    await updateCheckoutsFromFeed({ DB: avec.db }, restitue.evenements);
    const departs = avec.ecrits.find(s => s.sql.includes('departs_a_venir'));
    assert.ok(departs, 'une écriture de departs_a_venir attendue');
    assert.equal(departs.args[0], JSON.stringify([jour(1)]));
});
