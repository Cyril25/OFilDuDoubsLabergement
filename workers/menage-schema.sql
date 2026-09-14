-- Base D1 `menage` du worker menage-state.
--
-- ⚠ UNE LIGNE PAR ARRIVÉE, PAS PAR CRÉNEAU.
-- Jusqu'au 14/09/2026, un ménage était rangé sous `slot_<début>_<fin>` dans un
-- seul objet JSON du KV. Le début est CALCULÉ (dernier départ connu) et bougeait
-- pour des raisons hors de notre contrôle : purge des séjours par Airbnb
-- (juillet), blocage du jour même pris pour un départ (septembre). À chaque
-- mouvement, la clé changeait et la validation « sautait ». La date d'arrivée,
-- elle, ne bouge pas : c'était déjà la clé des `info_`, qui n'ont jamais rien
-- perdu. Le début n'est plus qu'un affichage.
--
-- Chaque écriture ne touche que ses colonnes : une validation et un paiement
-- faits au même moment ne peuvent plus s'écraser (ce que permettait l'objet
-- JSON réécrit en entier par la page ET par le worker).
--
-- Appliquer : npx wrangler d1 execute menage --remote --file workers/menage-schema.sql

CREATE TABLE IF NOT EXISTS menages (
    arrivee              TEXT PRIMARY KEY,  -- AAAA-MM-JJ : l'arrivée que le ménage prépare (= fin du créneau)
    debut                TEXT,              -- AAAA-MM-JJ : début du créneau, pour l'historique seulement
    fait_le              TEXT,              -- ISO 8601 ; NULL = pas fait
    fait_par             TEXT,
    paye_le              TEXT,              -- ISO 8601 ; NULL = pas payé
    montant              REAL,
    commentaire_paiement TEXT,
    nb_personnes         INTEGER,
    langue               TEXT,
    consigne             TEXT,              -- pour les personnes du ménage, visible de tous
    voyageurs            TEXT,              -- prénom des occupants : notifications Telegram seulement
    cree_le              TEXT NOT NULL,
    maj_le               TEXT NOT NULL
);

-- dernier_depart  : 'AAAA-MM-JJT11:00:00', ne recule jamais
-- departs_a_venir : tableau JSON de dates AAAA-MM-JJ
CREATE TABLE IF NOT EXISTS parametres (
    cle    TEXT PRIMARY KEY,
    valeur TEXT NOT NULL
);

-- Toute action humaine laisse une trace. Si une validation disparaît encore un
-- jour, on saura qui a écrit quoi et quand, au lieu de le reconstituer.
CREATE TABLE IF NOT EXISTS journal (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    le      TEXT NOT NULL,
    arrivee TEXT,
    action  TEXT NOT NULL,
    detail  TEXT
);
CREATE INDEX IF NOT EXISTS journal_par_arrivee ON journal (arrivee);
