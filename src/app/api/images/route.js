export async function POST(req) {
  try {
    const { nameCN } = await req.json();
    
    // 使用百度图片搜索 API (acjson 接口是目前最稳定且返回 JSON 的接口)
    // tn=resultjson_com: 返回 JSON 格式
    // ipn=rj: 手机端/网页端标志
    // rn=30: 请求 30 条结果，方便我们筛选
    const baiduUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=${encodeURIComponent(nameCN + " 菜谱实拍")}&rn=30`;

    const res = await fetch(baiduUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://image.baidu.com/'
      }
    });

    const data = await res.json();
    
    // 百度返回的图片字段通常是 thumbURL (缩略图) 或 middleURL (中图)
    // hoverURL 通常更清晰
    const images = (data.data || [])
      .filter(item => item.thumbURL || item.middleURL)
      .map(item => item.middleURL || item.thumbURL)
      .filter(url => url && !url.includes('logo') && !url.includes('icon'))
      .slice(0, 3);

    return new Response(JSON.stringify({ images }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Baidu Sniffer Error:", error.message);
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 500 });
  }
}
