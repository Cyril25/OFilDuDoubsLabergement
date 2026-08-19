#!/usr/bin/env bash
# Télécharge un flux DATAtourisme et le décompresse dans <dossier-de-sortie>.
#
# Le diffuseur renvoie un .gz contenant un .zip de fichiers JSON (dossier objects/).
# Trois cas d'échec, qui ne se traitent pas pareil :
#   - petit JSON  -> flux en cours de régénération : on réessaie ;
#   - HTTP 401/403 -> clé d'application refusée : inutile d'insister ;
#   - gzip valide mais quasi vide -> flux vide côté source : on le dit précisément.
#
# Usage : fetch-flux-datatourisme.sh <url> <dossier-de-sortie>
set -uo pipefail

URL="${1:?usage: fetch-flux-datatourisme.sh <url> <dossier-de-sortie>}"
OUT="${2:?usage: fetch-flux-datatourisme.sh <url> <dossier-de-sortie>}"
ATTEMPTS="${FLUX_ATTEMPTS:-5}"
DELAY="${FLUX_RETRY_DELAY:-60}"
MIN_FILES="${FLUX_MIN_FILES:-10}"

est_gzip() { [ "$(head -c 2 "$1" 2>/dev/null | od -An -tx1 | tr -d ' \n')" = "1f8b" ]; }

for i in $(seq 1 "$ATTEMPTS"); do
  code=$(curl -sSL -o flux.bin -w '%{http_code}' "$URL" || echo 000)
  size=$(stat -c%s flux.bin 2>/dev/null || echo 0)
  echo "Tentative $i/$ATTEMPTS : HTTP $code, $size octets, type $(file -b flux.bin 2>/dev/null || echo '?')"

  if [ "$code" = "401" ] || [ "$code" = "403" ]; then
    head -c 500 flux.bin; echo
    echo "::error::DATAtourisme refuse la clé d'application (HTTP $code) — flux ou application désactivé. Regénérer l'URL sur diffuseur.datatourisme.fr puis mettre à jour le secret DATATOURISME_URL."
    exit 1
  fi

  # Une archive gzip, même petite, est une vraie réponse : inutile de réessayer,
  # c'est le contenu décompressé qui tranchera.
  if [ "$code" = "200" ] && est_gzip flux.bin; then
    break
  fi

  echo "  réponse non exploitable, début du corps :"
  head -c 500 flux.bin | tr -d '\000' | sed 's/^/    /'; echo
  if [ "$i" -ge "$ATTEMPTS" ]; then
    echo "::error::Flux DATAtourisme indisponible après $ATTEMPTS tentatives (dernier essai : HTTP $code, $size octets)."
    exit 1
  fi
  echo "  nouvelle tentative dans $DELAY s…"
  sleep "$DELAY"
done

if ! gzip -dc flux.bin > flux.zip; then
  echo "::error::flux.bin n'est pas décompressable (HTTP $code, $size octets)."
  exit 1
fi

echo "Contenu de l'archive :"
unzip -l flux.zip | tail -n 20

mkdir -p "$OUT"
if ! unzip -q -o flux.zip -d "$OUT"; then
  echo "::error::L'archive du flux est illisible (zip corrompu ou tronqué)."
  exit 1
fi

n=$(find "$OUT" -name '*.json' | wc -l)
echo "$n fichiers JSON extraits dans $OUT/."
if [ -f "$OUT/index.json" ]; then
  echo "index.json :"
  head -c 800 "$OUT/index.json"; echo
fi

if [ "$n" -lt "$MIN_FILES" ]; then
  echo "::error::Le flux ne contient que $n fichiers JSON (seuil : $MIN_FILES). L'archive est valide mais vide : le flux est à regénérer côté diffuseur.datatourisme.fr (vérifier que l'application est active et que la sélection du flux n'est pas vide)."
  exit 1
fi
