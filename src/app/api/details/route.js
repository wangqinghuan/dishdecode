import { GoogleGenerativeAI } from "@google/generative-ai";

const PRODUCTION_MODEL = "gemini-2.5-flash-lite";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    // 极简提示词，追求速度和直观
    const prompt = `
      Dish: "${nameCN}" (${nameEN}). Provide info in ${targetLang} & Chinese.
      1. STORY: 1 short sentence origin.
      2. METHOD: 1 short sentence how it's cooked.
      3. TASTE: 1-3 descriptive words.
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
