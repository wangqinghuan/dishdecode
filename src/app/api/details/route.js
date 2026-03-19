import { GoogleGenerativeAI } from "@google/generative-ai";

const CANDIDATE_MODELS = [
  "gemini-2.0-flash-lite", 
  "gemini-flash-lite-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite"
];

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `
      You are a Chinese culinary expert. Provide info for "${nameCN}" (${nameEN}) in BILINGUAL (${targetLang} & Chinese).
      1. STORY: Cultural origin/naming story. (Both languages).
      2. METHOD: Cooking steps and key ingredients. (Both languages).
      3. TASTE: Flavor and texture profile. (Both languages).
      4. SEARCH_TERMS: One specific CHINESE search phrase for a professional food photo (e.g., "脆皮玻璃乳鸽 菜谱图").
      Format: STORY: [Text] METHOD: [Text] TASTE: [Text] SEARCH_TERMS: [Phrase]
    `;

    let lastError = null;
    for (const modelId of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
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

    return new Response(JSON.stringify({ error: "Quota exceeded", detail: lastError?.message }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
