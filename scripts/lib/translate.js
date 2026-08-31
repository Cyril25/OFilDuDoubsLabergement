'use strict';
/**
 * Traduction FR → langues du site, avec deux fournisseurs interchangeables.
 *
 * Pourquoi deux : en juillet 2026 DeepL a retiré son offre gratuite mensuelle. Le plan
 * d'entrée « Developer » donne 1 000 000 de caractères **à vie**, non renouvelés — épuisé
 * chez nous le 25/08/2026, ce qui a bloqué le cron agenda pendant sept jours. Azure AI
 * Translator (palier F0) offre 2 000 000 de caractères **par mois**, renouvelés.
 *
 * Choix du fournisseur, par ordre de priorité :
 *   1. AZURE_TRANSLATOR_KEY (+ AZURE_TRANSLATOR_REGION si la ressource est régionale)
 *   2. DEEPL_API_KEY
 *   3. aucun → l'appelant applique son cache et laisse le reste en français.
 *
 * L'appelant garde la main sur les erreurs : on lève, il décide (les deux crons
 * poursuivent la publication avec le cache partiel plutôt que d'échouer).
 */

// Azure distingue pt (Brésil) et pt-pt (Portugal) ; DeepL utilise ses propres codes.
const CODES = {
  azure: { de: 'de', en: 'en', es: 'es', it: 'it', nl: 'nl', pt: 'pt-pt' },
  deepl: { de: 'DE', en: 'EN-GB', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT-PT' },
};

/** Nom du fournisseur actif, ou null si aucune clé n'est configurée. */
function providerName() {
  if (process.env.AZURE_TRANSLATOR_KEY) return 'azure';
  if (process.env.DEEPL_API_KEY) return 'deepl';
  return null;
}

async function azureTranslate(texts, lang) {
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const endpoint = (process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com').replace(/\/+$/, '');
  const to = CODES.azure[lang];
  if (!to) throw new Error('Langue non gérée : ' + lang);

  const headers = {
    'Ocp-Apim-Subscription-Key': key,
    'Content-Type': 'application/json; charset=UTF-8',
  };
  // Une ressource créée dans une région précise exige cet en-tête ; une ressource
  // globale l'ignore. On ne l'envoie que s'il est renseigné.
  if (process.env.AZURE_TRANSLATOR_REGION) {
    headers['Ocp-Apim-Subscription-Region'] = process.env.AZURE_TRANSLATOR_REGION;
  }

  const url = endpoint + '/translate?api-version=3.0&from=fr&to=' + encodeURIComponent(to);
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(texts.map(t => ({ Text: t }))),
  });
  if (!resp.ok) throw new Error('Azure ' + resp.status + ' : ' + (await resp.text()).slice(0, 200));
  const json = await resp.json();
  if (!Array.isArray(json) || json.length !== texts.length) {
    throw new Error('Azure : réponse de taille inattendue (' + (Array.isArray(json) ? json.length : typeof json) + ' pour ' + texts.length + ' textes)');
  }
  return json.map(r => {
    const t = r && r.translations && r.translations[0];
    if (!t || typeof t.text !== 'string') throw new Error('Azure : traduction absente dans la réponse');
    return t.text;
  });
}

async function deeplTranslate(texts, lang) {
  const key = process.env.DEEPL_API_KEY;
  const base = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const target = CODES.deepl[lang];
  if (!target) throw new Error('Langue non gérée : ' + lang);

  const body = new URLSearchParams();
  body.append('source_lang', 'FR');
  body.append('target_lang', target);
  for (const t of texts) body.append('text', t);

  const resp = await fetch(base + '/v2/translate', {
    method: 'POST',
    headers: { 'Authorization': 'DeepL-Auth-Key ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) throw new Error('DeepL ' + resp.status + ' : ' + (await resp.text()).slice(0, 200));
  const json = await resp.json();
  if (!json.translations || json.translations.length !== texts.length) {
    throw new Error('DeepL : réponse de taille inattendue');
  }
  return json.translations.map(t => t.text);
}

/**
 * Traduit `texts` (français) vers `lang`. Renvoie les traductions dans le même ordre.
 * Lève si aucun fournisseur n'est configuré ou si l'appel échoue.
 */
async function translate(texts, lang) {
  const p = providerName();
  if (!p) throw new Error('Aucune clé de traduction configurée (AZURE_TRANSLATOR_KEY ou DEEPL_API_KEY)');
  return p === 'azure' ? azureTranslate(texts, lang) : deeplTranslate(texts, lang);
}

module.exports = { translate, providerName, CODES };
