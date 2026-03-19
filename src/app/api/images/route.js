export async function POST(req) {
  try {
    const { nameCN } = await req.json();
    
    // 由于 DuckDuckGo 对 Vercel 等服务器端环境有较强的反爬限制，容易报 HTML 错误导致 JSON 解析失败
    // 我们改用 Wikipedia 的官方搜索接口，这在生产环境下极其稳定且完全免费
    const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(nameCN)}&gsrlimit=1&prop=images|pageimages&pithumbsize=1000`;
    
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    let imageUrls = [];

    if (data.query?.pages) {
      const page = Object.values(data.query.pages)[0];
      
      // 1. 获取主图 (Page Image)
      if (page.thumbnail?.source) {
        imageUrls.push(page.thumbnail.source);
      }

      // 2. 尝试从该页面的其他图片列表中获取更多图 (过滤掉小图标和非食物图)
      if (page.images) {
        // 取前 5 个图片文件名进行深度查询
        const imageTitles = page.images
          .map(img => img.title)
          .filter(title => /\.(jpg|jpeg|png)$/i.test(title) && !title.includes('Icon') && !title.includes('Logo'))
          .slice(0, 5);

        if (imageTitles.length > 0) {
          const detailUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(imageTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=1000`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          
          if (detailData.query?.pages) {
            Object.values(detailData.query.pages).forEach(p => {
              if (p.imageinfo?.[0]?.url && !imageUrls.includes(p.imageinfo[0].url)) {
                imageUrls.push(p.imageinfo[0].url);
              }
            });
          }
        }
      }
    }

    // 如果中文维基没图，最后用英文维基保底一次 (简单主图)
    if (imageUrls.length === 0) {
      const enRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameCN)}`);
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData.originalimage?.source) imageUrls.push(enData.originalimage.source);
      }
    }

    return new Response(JSON.stringify({ images: imageUrls.slice(0, 3) }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Image API Error:", error.message);
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 500 });
  }
}
