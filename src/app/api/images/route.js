export async function POST(req) {
  try {
    const { nameCN } = await req.json();
    const searchQuery = `site:meituan.com ${nameCN}`;
    
    // 1. 获取 DuckDuckGo 的 vqd token
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const searchHtml = await searchRes.text();
    
    const vqdMatch = searchHtml.match(/vqd="([^"]+)"/);
    if (!vqdMatch) throw new Error("Could not obtain VQD token");
    const vqd = vqdMatch[1];

    // 2. 调用图片搜索接口
    const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQuery)}&o=json&vqd=${vqd}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const data = await apiRes.json();

    // 3. 提取高质量图片并处理美团缩略图转大图
    const images = (data.results || [])
      .map(r => {
        let url = r.image;
        // 如果是美团的图，尝试通过替换路径参数获取高清大图
        if (url.includes('meituan.net')) {
          url = url.replace(/\/\d+\.\d+\//, '/0.0/'); // 尝试获取原图
        }
        return url;
      })
      .filter(url => url && !url.includes('logo') && !url.includes('icon'))
      .slice(0, 3);

    return new Response(JSON.stringify({ images }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Image Search Proxy Error:", error.message);
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 500 });
  }
}
