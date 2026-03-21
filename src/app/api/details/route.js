import { GoogleGenerativeAI } from "@google/generative-ai";

const PRODUCTION_MODEL = "gemini-2.5-flash-lite";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    // 极其严厉的格式要求，确保双语输出
    const prompt = `
      Dish: "${nameCN}" (${nameEN}).
      You MUST provide information in BOTH ${targetLang} AND Chinese.
      
      Format your response EXACTLY like this:
      STORY: [${targetLang} description] / [中文描述]
      METHOD: [${targetLang} description] / [中文描述]
      TASTE: [${targetLang} description] / [中文描述]

      Rules:
      - 2 short sentences per language for STORY and METHOD.
      - Use "/" to separate ${targetLang} and Chinese clearly.
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
