async function verifyImage(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function runRealTest(nameCN) {
  console.log(`\n--- REAL WORLD TEST: ${nameCN} ---`);
  const query = `${nameCN} 菜谱实拍`;
  
  try {
    // 1. 获取 VQD
    const vqdRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' }
    });
    const text = await vqdRes.text();
    const vqd = (text.match(/vqd="([^"]+)"/) || text.match(/vqd=([^&]+)/))?.[1];
    
    if (!vqd) throw new Error("Blocked by DDG Anti-bot");

    // 2. 获取图片 JSON
    const apiRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' }
    });
    const data = await apiRes.json();
    
    const results = data.results || [];
    console.log(`Found ${results.length} total raw results.`);

    // 3. 验证前 3 张图是否真的能显示
    let validCount = 0;
    for (let i = 0; i < results.length && validCount < 3; i++) {
      const url = results[i].image;
      const ok = await verifyImage(url);
      console.log(`[${i+1}] ${ok ? 'VALID' : 'INVALID'}: ${url.substring(0, 60)}...`);
      if (ok) validCount++;
    }

    console.log(`\nSummary: Verified ${validCount} high-quality images for ${nameCN}.`);
    return validCount >= 1;

  } catch (error) {
    console.error(`TEST FAILED: ${error.message}`);
    return false;
  }
}

// 串行测试多个经典案例
async function start() {
  await runRealTest("椒麻水煮鱼");
  await runRealTest("脆皮乳鸽");
  await runRealTest("东坡肉");
}

start();
