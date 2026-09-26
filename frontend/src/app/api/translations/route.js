import { NextResponse } from "next/server";

const FREE_TRANSLATION_URL = "https://api.mymemory.translated.net/get";

export async function POST(request) {
  try {
    const { source, target = "tl" } = await request.json();

    if (!source || typeof source !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing source object for translation." },
        { status: 400 }
      );
    }

    const entries = Object.entries(source);
    if (!entries.length) {
      return NextResponse.json({ success: true, translations: {} });
    }

    const translations = {};

    await Promise.all(
      entries.map(async ([key, text]) => {
        if (!text || typeof text !== "string") {
          translations[key] = text;
          return;
        }
        try {
          const res = await fetch(
            `${FREE_TRANSLATION_URL}?q=${encodeURIComponent(text)}&langpair=en|${target}`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.responseData?.translatedText && data?.responseStatus === 200) {
              translations[key] = data.responseData.translatedText;
              return;
            }
          }
        } catch (e) {
          // Fallback to original text on individual failure
        }
        translations[key] = text;
      })
    );

    return NextResponse.json({
      success: true,
      translations,
      provider: "mymemory-translated",
    });
  } catch (err) {
    console.error("Translation API Route error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal translation error." },
      { status: 500 }
    );
  }
}
