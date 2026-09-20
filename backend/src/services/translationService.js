const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";
const MYMEMORY_TRANSLATE_URL = "https://api.mymemory.translated.net/get";
const LIBRE_TRANSLATE_URL = "http://localhost:5001/translate";

function flattenDictionary(dictionary) {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((text, index) => ({ key: `${key}.${index}`, text }));
    }
    return typeof value === "string" ? [{ key, text: value }] : [];
  });
}

function unflattenDictionary(entries) {
  return entries.reduce((dictionary, { key, text }) => {
    const [rootKey, index] = key.split(".");
    if (index !== undefined) {
      if (!Array.isArray(dictionary[rootKey])) dictionary[rootKey] = [];
      dictionary[rootKey][Number(index)] = text;
    } else {
      dictionary[rootKey] = text;
    }
    return dictionary;
  }, {});
}

async function translateWithGoogle(entries, target) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: entries.map(({ text }) => text),
      source: "en",
      target,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Translation API returned ${response.status}.`);
  }

  const payload = await response.json();
  const translated = payload?.data?.translations;
  if (!Array.isArray(translated) || translated.length !== entries.length) {
    throw new Error("Google Translation API returned an incomplete response.");
  }

  return entries.map(({ key }, index) => ({
    key,
    text: translated[index].translatedText,
  }));
}

async function translateWithLibreTranslate(entries, target) {
  const endpoint = process.env.TRANSLATION_API_URL || LIBRE_TRANSLATE_URL;

  const headers = { "Content-Type": "application/json" };
  if (process.env.TRANSLATION_API_KEY) {
    headers.Authorization = `Bearer ${process.env.TRANSLATION_API_KEY}`;
  }

  const translated = [];
  for (const entry of entries) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: entry.text,
        source: "en",
        target,
        format: "text",
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API returned ${response.status}.`);
    }

    const payload = await response.json();
    if (!payload?.translatedText) {
      throw new Error("Translation API returned an empty translation.");
    }

    translated.push({ key: entry.key, text: payload.translatedText });
  }

  return translated;
}

async function translateWithMyMemory(entries, target) {
  const endpoint = process.env.MYMEMORY_API_URL || MYMEMORY_TRANSLATE_URL;
  const translated = [];

  const batches = [];
  let currentBatch = [];
  let currentLength = 0;
  const separator = "\n---MCPA_TRANSLATION_BREAK---\n";

  const requestSingleTranslation = async (entry) => {
    const singleUrl = `${endpoint}?q=${encodeURIComponent(entry.text)}&langpair=en|${encodeURIComponent(target)}`;
    const singleResponse = await fetch(singleUrl);
    if (!singleResponse.ok) {
      throw new Error(`MyMemory Translation API returned ${singleResponse.status}.`);
    }
    const singlePayload = await singleResponse.json();
    const singleText = singlePayload?.responseData?.translatedText;
    if (!singleText || singlePayload?.responseStatus !== 200) {
      throw new Error("MyMemory Translation API returned an empty translation.");
    }
    return { key: entry.key, text: singleText };
  };

  for (const entry of entries) {
    const nextLength = currentLength + entry.text.length + separator.length;
    if (currentBatch.length && nextLength > 450) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }
    currentBatch.push(entry);
    currentLength += entry.text.length + separator.length;
  }
  if (currentBatch.length) batches.push(currentBatch);

  for (const batch of batches) {
    const combinedText = batch.map(({ text }) => text).join(separator);
    const url = `${endpoint}?q=${encodeURIComponent(combinedText)}&langpair=en|${encodeURIComponent(target)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MyMemory Translation API returned ${response.status}.`);
    }

    const payload = await response.json();
    const translatedText = payload?.responseData?.translatedText;
    if (!translatedText || payload?.responseStatus !== 200) {
      throw new Error("MyMemory Translation API returned an empty translation.");
    }

    const translatedBatch = translatedText.split(/\s*---MCPA_TRANSLATION_BREAK---\s*/);
    if (translatedBatch.length !== batch.length) {
      for (const entry of batch) {
        translated.push(await requestSingleTranslation(entry));
      }
      continue;
    }
    batch.forEach(({ key }, index) => {
      translated.push({ key, text: translatedBatch[index].trim() });
    });
  }

  return translated;
}

async function translateDictionary(dictionary, target = "tl") {
  const entries = flattenDictionary(dictionary);
  if (!entries.length) return { translations: {}, provider: "none" };

  const googleTranslations = await translateWithGoogle(entries, target);
  if (googleTranslations) {
    return {
      translations: unflattenDictionary(googleTranslations),
      provider: "google-cloud-translation",
    };
  }

  const libreTranslations = await translateWithLibreTranslate(entries, target);
  if (libreTranslations) {
    return {
      translations: unflattenDictionary(libreTranslations),
      provider: "libretranslate",
    };
  }

  const myMemoryTranslations = await translateWithMyMemory(entries, target);
  return {
    translations: unflattenDictionary(myMemoryTranslations),
    provider: "mymemory-free",
  };
}

module.exports = { translateDictionary };
