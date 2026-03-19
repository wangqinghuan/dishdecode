import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { nameCN, nameEN } = await req.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
      You are a Chinese culinary expert. For the dish "${nameCN}" (${nameEN}):
      1. STORY: Brief history or naming origin.
      2. METHOD: Key cooking steps and ingredients.
      3. TASTE: Flavor profile.
      4. WIKI_TITLE: The exact English Wikipedia page title for this dish (e.g., "Kung Pao chicken" or "Mapo tofu"). If no specific page exists, give the closest category.

      Keep descriptions concise (100 words total).
      Format: STORY: ... METHOD: ... TASTE: ... WIKI_TITLE: [Title Only]
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
