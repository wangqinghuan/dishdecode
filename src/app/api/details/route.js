import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

    const prompt = `
      You are a Chinese culinary expert. Provide info for "${nameCN}" (${nameEN}) in BILINGUAL (${targetLang} & Chinese).
      
      1. STORY: Cultural origin/naming story. (Both ${targetLang} and Chinese).
      2. METHOD: Cooking steps and key ingredients. (Both ${targetLang} and Chinese).
      3. TASTE: Flavor and texture profile. (Both ${targetLang} and Chinese).
      4. SEARCH_TERMS: Provide one highly specific CHINESE search phrase that will return ONLY professional food/dish photos (e.g., "脆皮玻璃乳鸽 菜谱图"). Avoid generic biological terms.

      Format: STORY: [Text] METHOD: [Text] TASTE: [Text] SEARCH_TERMS: [Phrase]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return new Response(JSON.stringify({ text: response.text() }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
