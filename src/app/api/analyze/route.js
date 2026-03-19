import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 45;

export async function POST(req) {
  try {
    const { image, prefs, targetLang = 'English' } = await req.json();
    const base64Data = image.split(',')[1];
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      TARGET LANGUAGE: ${targetLang}
      
      RULES:
      1. INCLUDE EVERY ITEM. DO NOT SKIP.
      2. nameCN: Original Chinese name.
      3. nameEN: Concise translation in ${targetLang}.
      4. price: Numeric value (e.g. 28.5).
      5. ingredients: ["${targetLang}|中文"] (Top 3 only).
      6. flavor: 1 word in ${targetLang}.
      7. status: "danger" if contains ${prefs.allergens.join(',')}, "warning" if contains ${prefs.dislikes.join(',')}, else "safe".

      OUTPUT FORMAT:
      {"items": [
        {
          "nameCN": "...",
          "nameEN": "...",
          "price": 0,
          "ingredients": [],
          "flavor": "...",
          "spiciness": 0,
          "status": "..."
        }
      ]}
      
      Return ONLY the JSON. Start immediately with {"items": [
    `;

    // 使用流式生成
    const result = await model.generateContentStream([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: base64Data } }
    ]);

    // 创建一个可读流返回给前端
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(chunkText));
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
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
