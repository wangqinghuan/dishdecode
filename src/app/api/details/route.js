import { GoogleGenerativeAI } from "@google/generative-ai";

const PRODUCTION_MODEL = "gemini-2.5-flash-lite";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    // 平衡深度与速度的提示词
    const prompt = `
      Dish: "${nameCN}" (${nameEN}). Provide info in BILINGUAL (${targetLang} & Chinese).
      1. STORY: 2 sentences about origin/naming.
      2. METHOD: 2 sentences on how it's cooked.
      3. TASTE: Key flavor notes.
      
      Format: STORY: [Bilingual] | METHOD: [Bilingual] | TASTE: [Bilingual]
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
        continue;
      }
    }
    return new Response(JSON.stringify({ error: "Exhausted" }), { status: 429 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
