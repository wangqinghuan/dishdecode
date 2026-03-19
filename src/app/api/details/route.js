import { GoogleGenerativeAI } from "@google/generative-ai";
const PRODUCTION_MODEL = "gemini-1.5-flash";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    const prompt = `
      You are a Chinese culinary expert. Provide detailed info for "${nameCN}" (${nameEN}) in BILINGUAL format (${targetLang} and Chinese).
      STORY: ... METHOD: ... TASTE: ... SEARCH_TERMS: ...
    `;

    let lastError = null;
    for (const key of shuffledKeys) {
      const genAI = new GoogleGenerativeAI(key);
      try {
        const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL });
        const result = await model.generateContent(prompt);
...
          const response = await result.response;
          return new Response(JSON.stringify({ text: response.text() }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          lastError = e;
          continue;
        }
      }
    }

    return new Response(JSON.stringify({ error: "Quota exhausted", detail: lastError?.message }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
