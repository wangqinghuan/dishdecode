import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 45;

// 2026 性价比之王，适合大规模低成本运营
const PRODUCTION_MODEL = "gemini-2.5-flash-lite";

export async function POST(req) {
  try {
    const { image, prefs, targetLang = 'English' } = await req.json();
    const base64Data = image.split(',')[1];

    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      TARGET LANGUAGE: ${targetLang}
      OUTPUT FORMAT: {"items": [{"nameCN": "Dish Name", "nameEN": "Translated Name", "price": 0, "ingredients": ["${targetLang}|中文"], "flavor": "Spicy", "spiciness": 0, "status": "safe"}]}
      Return ONLY the JSON. Start immediately with {"items": [
    `;

    let lastError = null;

    for (const key of shuffledKeys) {
      const genAI = new GoogleGenerativeAI(key);
      try {
        const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL });
        const result = await model.generateContentStream([
          prompt,
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]);

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of result.stream) {
                controller.enqueue(encoder.encode(chunk.text()));
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          },
        });

        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      } catch (e) {
        lastError = e;
        console.error(`Key ${key.substring(0, 6)} failed:`, e.message);
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      error: "ALL KEYS EXHAUSTED", 
      detail: lastError?.message 
    }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
