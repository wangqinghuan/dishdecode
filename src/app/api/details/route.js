import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { nameCN, nameEN } = await req.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
      You are a Chinese culinary expert and cultural ambassador. 
      For the dish "${nameCN}" (English: ${nameEN}), please provide:
      
      1. STORY: The history, cultural background, or the interesting story behind its name.
      2. METHOD: A clear explanation of the cooking method and key ingredients.
      3. TASTE: A brief description of the flavor and texture.

      Please use vivid, engaging English. Keep it within 100-150 words total.
      Format: Return raw text with "STORY:", "METHOD:", "TASTE:" headings.
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
