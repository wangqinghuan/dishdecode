export async function POST(req) {
  try {
    const { nameCN } = await req.json();
    // 强制加入“美食、菜谱”后缀，确保搜到的是食物
    const query = `${nameCN} 菜谱实拍`;
    
    // 1. 获取 vqd (DuckDuckGo 的搜索会话令牌)
    // 加入更真实的 User-Agent 和 Referer
    const vqdRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    
    const text = await vqdRes.text();
    const vqdMatch = text.match(/vqd="([^"]+)"/) || text.match(/vqd=([^&]+)/);
    
    if (!vqdMatch) {
      console.error("VQD not found, possible bot detection");
      return new Response(JSON.stringify({ images: [], error: "Search throttled" }), { status: 200 });
    }
    
    const vqd = vqdMatch[1];

    // 2. 调用 DDG 的 JSON 接口获取图片
    const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://duckduckgo.com/'
      }
    });

    const data = await apiRes.json();
    
    // 3. 提取并过滤图片
    const images = (data.results || [])
      .filter(r => {
        const url = r.image.toLowerCase();
        // 排除掉明显的非食物干扰项
        return !url.includes('logo') && !url.includes('icon') && !url.includes('wiki');
      })
      .slice(0, 3)
      .map(r => r.image);

    return new Response(JSON.stringify({ images }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("DDG Error:", error.message);
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 200 });
  }
}
