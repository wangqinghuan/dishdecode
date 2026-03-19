import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 45;

const CANDIDATE_MODELS = [
  "gemini-2.5-flash-lite", 
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite-preview"
];

export async function POST(req) {
  try {
    const { image, prefs, targetLang = 'English' } = await req.json();
    const base64Data = image.split(',')[1];
    
    // 获取所有可用的 Key 并随机打乱顺序
    const allKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    const shuffledKeys = allKeys.sort(() => Math.random() - 0.5);

    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      TARGET LANGUAGE: ${targetLang}
      OUTPUT FORMAT: {"items": [{"nameCN": "...", "nameEN": "...", "price": 0, "ingredients": ["${targetLang}|中文"], "flavor": "...", "spiciness": 0, "status": "..."}]}
      Return ONLY the JSON. Start immediately with {"items": [
    `;

    let lastError = null;

    // 第一层循环：尝试每一个 Key
    for (const key of shuffledKeys) {
      const genAI = new GoogleGenerativeAI(key);

      // 第二层循环：尝试每一个模型
      for (const modelId of CANDIDATE_MODELS) {
        try {
          console.log(`>>> Trying Key [${key.substring(0,6)}...] with Model [${modelId}]`);
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
          console.error(`Key/Model failed:`, e.message);
          // 如果报 429 或权限问题，继续试下一个模型或 Key
          continue;
        }
      }
    }

    return new Response(JSON.stringify({ 
      error: "ALL KEYS EXHAUSTED", 
      message: "Please add more API Keys to your pool.",
      detail: lastError?.message 
    }), { status: 429 });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
