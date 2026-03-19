import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 45;

// 定义一个候选模型列表，按优先级排序
const CANDIDATE_MODELS = [
  "gemini-2.0-flash-lite", 
  "gemini-flash-lite-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite"
];

export async function POST(req) {
  try {
    const { image, prefs, targetLang = 'English' } = await req.json();
    const base64Data = image.split(',')[1];
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      TARGET LANGUAGE: ${targetLang}
      RULES: INCLUDE EVERY ITEM. DO NOT SKIP.
      OUTPUT FORMAT: {"items": [{"nameCN": "...", "nameEN": "...", "price": 0, "ingredients": ["${targetLang}|中文"], "flavor": "...", "spiciness": 0, "status": "..."}]}
      Return ONLY the JSON. Start immediately with {"items": [
    `;

    // 尝试模型轮换逻辑
    let lastError = null;
    for (const modelId of CANDIDATE_MODELS) {
      try {
        console.log(`>>> Trying model: ${modelId}`);
        const model = genAI.getGenerativeModel({ model: modelId });
        
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
        console.error(`Model ${modelId} failed:`, e.message);
        // 如果是权限或配额问题，继续试下一个
        continue;
      }
    }

    // 如果所有模型都试过了还是不行
    return new Response(JSON.stringify({ error: "All AI models are exhausted today. Please try tomorrow.", detail: lastError?.message }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
