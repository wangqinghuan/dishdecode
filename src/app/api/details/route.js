import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { nameCN, nameEN, targetLang = 'English' } = await req.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
      You are a Chinese culinary expert. Provide detailed info for "${nameCN}" (${nameEN}) in BILINGUAL format (${targetLang} and Chinese).
      
      1. STORY: Cultural origin/naming story. (Both ${targetLang} and Chinese).
      2. METHOD: Cooking steps and key ingredients. (Both ${targetLang} and Chinese).
      3. TASTE: Flavor and texture profile. (Both ${targetLang} and Chinese).

      Keep it engaging but concise (under 200 words total).
      Format: STORY: [Bilingual Text] METHOD: [Bilingual Text] TASTE: [Bilingual Text]
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
