import { GoogleGenerativeAI } from "@google/generative-ai";

const PRODUCTION_MODEL = "gemini-2.5-flash-lite";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    const prompt = `
      You are a Chinese culinary expert. Provide detailed info for "${nameCN}" (${nameEN}) in BILINGUAL format (${targetLang} and Chinese).
      
      1. STORY: Cultural origin or naming story.
      2. METHOD: Cooking method and key ingredients.
      3. TASTE: Flavor and texture profile.

      Format: STORY: [Bilingual Text] METHOD: [Bilingual Text] TASTE: [Bilingual Text]
    `;

    let lastError = null;
    for (const key of shuffledKeys) {
      const genAI = new GoogleGenerativeAI(key);
      try {
        const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return new Response(JSON.stringify({ text: response.text() }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        lastError = e;
        console.error(`Key ${key.substring(0, 6)} failed:`, e.message);
        continue;
      }
    }

    return new Response(JSON.stringify({ error: "Quota exhausted", detail: lastError?.message }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
