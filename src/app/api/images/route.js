export async function POST(req) {
  try {
    const { nameCN } = await req.json();
    
    // 策略：组合搜索。不仅搜菜名，还搜“菜名 美食”以获取更精确的页面
    const searchQueries = [nameCN, `${nameCN} 美食`];
    let imageUrls = [];

    for (const query of searchQueries) {
      if (imageUrls.length >= 3) break;

      const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages|images&pithumbsize=1000`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (data.query?.pages) {
        const pages = Object.values(data.query.pages);
        
        for (const page of pages) {
          // 1. 抓取页面的主图
          if (page.thumbnail?.source && !imageUrls.includes(page.thumbnail.source)) {
            imageUrls.push(page.thumbnail.source);
          }

          // 2. 深入抓取页面内的其他图片 (限制数量)
          if (imageUrls.length < 3 && page.images) {
            const imageTitles = page.images
              .map(img => img.title)
              .filter(title => /\.(jpg|jpeg|png)$/i.test(title) && !/(icon|logo|stub|map|flag)/i.test(title))
              .slice(0, 3);

            if (imageTitles.length > 0) {
              const detailUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(imageTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=1000`;
              const detailRes = await fetch(detailUrl);
              const detailData = await detailRes.json();
              
              if (detailData.query?.pages) {
                Object.values(detailData.query.pages).forEach(p => {
                  if (p.imageinfo?.[0]?.url && !imageUrls.includes(p.imageinfo[0].url) && imageUrls.length < 3) {
                    imageUrls.push(p.imageinfo[0].url);
                  }
                });
              }
            }
          }
          if (imageUrls.length >= 3) break;
        }
      }
    }

    // 最后保底：如果图片还是不足 3 张，尝试英文维基的主图作为补充
    if (imageUrls.length < 3) {
      const enRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameCN)}`);
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData.originalimage?.source && !imageUrls.includes(enData.originalimage.source)) {
          imageUrls.push(enData.originalimage.source);
        }
      }
    }

    return new Response(JSON.stringify({ images: imageUrls.slice(0, 3) }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 500 });
  }
}
