export const maxDuration = 45;

export async function POST(req) {
  try {
    const { image, prefs } = await req.json();
    const base64Data = image.split(',')[1];
    
    console.log(">>> Initiating ROBUST Analysis with JSON validation");

    const prompt = `
      ACT AS A RAW DATA EXTRACTOR. 
      TASK: Convert EVERY visible dish in this image into a JSON list.
      
      RULES:
      1. INCLUDE EVERY ITEM. DO NOT SUMMARIZE. DO NOT SKIP.
      2. If price is missing or unclear, use 0.
      3. If ingredients are unclear, use [].
      4. For "status": "danger" if it contains ${prefs.allergens.join(',')}, "warning" if it contains ${prefs.dislikes.join(',')}, else "safe".

      OUTPUT FORMAT (STRICT JSON ONLY):
      {
        "items": [
          {
            "nameCN": "...",
            "nameEN": "...",
            "price": 28.0,
            "ingredients": ["EN|CN"],
            "flavor": "...",
            "spiciness": 0,
            "status": "safe|warning|danger"
          }
        ]
      }
      
      SCANNING ORDER: Top-to-bottom, Left-to-right.
      IF THERE ARE 50 DISHES, LIST 50 DISHES.
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          max_output_tokens: 8192,
          temperature: 0.1
        }
      })
    });

    const result = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: result.error?.message }), { status: response.status });

    let content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 核心修复逻辑：尝试处理可能的 JSON 截断
    try {
      // 如果字符串不是以 } 结尾，尝试补齐它
      let sanitizedContent = content.trim();
      if (!sanitizedContent.endsWith('}')) {
        console.warn("JSON seems truncated, attempting fix...");
        // 寻找最后一个完整的对象闭合
        const lastObjectEnd = sanitizedContent.lastIndexOf('}');
        if (lastObjectEnd !== -1) {
          sanitizedContent = sanitizedContent.substring(0, lastObjectEnd + 1);
          // 如果没有闭合外层的 items 数组和对象，补齐它们
          if (sanitizedContent.includes('"items": [')) {
             if (!sanitizedContent.endsWith(']}')) sanitizedContent += ']}';
          }
        }
      }
      
      // 验证 JSON 合法性
      JSON.parse(sanitizedContent);
      return new Response(sanitizedContent, { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error("Critical JSON Error:", e.message);
      // 如果实在修不好，返回一个友好的错误，而不是让前端崩溃
      return new Response(JSON.stringify({ 
        error: "Menu too long to process at once. Please try scanning a smaller section.",
        partial: content.substring(0, 100) 
      }), { status: 500 });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
