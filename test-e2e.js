const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

// 模拟前端解析逻辑
function parseDetails(text) {
  if (!text) return null;
  // 更加鲁棒的正则：匹配 1. STORY 或 STORY: 等各种变体
  const parts = text.split(/(STORY:|METHOD:|TASTE:|1\.\s*STORY:|2\.\s*METHOD:|3\.\s*TASTE:)/i).map(p => p.trim());
  const res = {};
  for (let i = 1; i < parts.length; i += 2) {
    let key = parts[i].toLowerCase();
    if (key.includes('story')) key = 'story';
    if (key.includes('method')) key = 'method';
    if (key.includes('taste')) key = 'taste';
    res[key] = parts[i+1];
  }
  return res;
}

async function testEndToEnd(nameCN, nameEN) {
  console.log(`\n--- [TEST] Starting E2E Simulation for: ${nameCN} ---`);
  
  try {
    // 1. 测试 AI 文本生成与解析
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `You are a Chinese culinary expert. Provide info for "${nameCN}" (${nameEN}) in BILINGUAL (English & Chinese). 
    Format: STORY: [Text] METHOD: [Text] TASTE: [Text]`;
    
    console.log("-> Fetching AI Details...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("-> Raw AI Text received:", text.substring(0, 100) + "...");
    
    const parsed = parseDetails(text);
    console.log("-> Parsed Result keys:", Object.keys(parsed));
    
    if (!parsed.story || !parsed.method || !parsed.taste) {
      throw new Error(`Parsing failed! Missing keys. Found: ${Object.keys(parsed)}`);
    }
    console.log("✅ Text Parsing: SUCCESS");

    // 2. 测试图片抓取
    console.log("-> Fetching Images from Baidu Sniffer...");
    const baiduUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=${encodeURIComponent(nameCN + " 菜谱实拍")}&rn=10`;
    const imgRes = await fetch(baiduUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const imgData = await imgRes.json();
    const images = (imgData.data || []).filter(i => i.thumbURL || i.middleURL).map(i => i.middleURL || i.thumbURL).slice(0, 3);
    
    console.log(`-> Found ${images.length} images.`);
    if (images.length === 0) throw new Error("No images found!");
    
    // 验证图片是否可访问
    for (let url of images) {
      const check = await fetch(url, { method: 'HEAD' });
      console.log(`   - [${check.ok ? 'OK' : 'FAIL'}] ${url.substring(0, 50)}...`);
    }
    console.log("✅ Image Retrieval: SUCCESS");

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

testEndToEnd("椒麻水煮鱼", "Spicy Fish");
