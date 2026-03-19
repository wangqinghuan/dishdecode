import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 45;

export async function POST(req) {
  try {
    const { image, prefs } = await req.json();
    const base64Data = image.split(',')[1];
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      
      RULES:
      1. INCLUDE EVERY ITEM. DO NOT SUMMARIZE. DO NOT SKIP.
      2. If price is missing or unclear, use 0.
      3. For "status": "danger" if it contains ${prefs.allergens.join(',')}, "warning" if it contains ${prefs.dislikes.join(',')}, else "safe".

      OUTPUT FORMAT:
      {"items": [
        {
          "nameCN": "...",
          "nameEN": "...",
          "price": 28.0,
          "ingredients": ["EN|CN"],
          "flavor": "...",
          "spiciness": 0,
          "status": "safe|warning|danger"
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
