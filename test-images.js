async function testImageFetch(nameCN) {
  console.log(`>>> Testing image fetch for: ${nameCN}`);
  try {
    const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(nameCN)}&gsrlimit=1&prop=images|pageimages&pithumbsize=1000`;
    
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    let imageUrls = [];

    if (data.query?.pages) {
      const page = Object.values(data.query.pages)[0];
      console.log(`Found Wikipedia page: ${page.title}`);
      
      if (page.thumbnail?.source) {
        imageUrls.push(page.thumbnail.source);
        console.log(`- Main image found: ${page.thumbnail.source}`);
      }

      if (page.images) {
        const imageTitles = page.images
          .map(img => img.title)
          .filter(title => /\.(jpg|jpeg|png)$/i.test(title) && !title.includes('Icon') && !title.includes('Logo'))
          .slice(0, 5);

        console.log(`- Other candidate images in page: ${imageTitles.length}`);

        if (imageTitles.length > 0) {
          const detailUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(imageTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=1000`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          
          if (detailData.query?.pages) {
            Object.values(detailData.query.pages).forEach(p => {
              if (p.imageinfo?.[0]?.url && !imageUrls.includes(p.imageinfo[0].url)) {
                imageUrls.push(p.imageinfo[0].url);
                console.log(`  - Extra image added: ${p.imageinfo[0].url}`);
              }
            });
          }
        }
      }
    }

    if (imageUrls.length === 0) {
      console.log("No images found in ZH Wiki, trying EN Wiki fallback...");
      const enRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameCN)}`);
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData.originalimage?.source) {
          imageUrls.push(enData.originalimage.source);
          console.log(`- EN Wiki image found: ${enData.originalimage.source}`);
        }
      }
    }

    console.log(`\nFINAL RESULTS (${imageUrls.length} images):`);
    imageUrls.slice(0, 3).forEach((url, i) => console.log(`${i+1}. ${url}`));

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testImageFetch("宫保鸡丁");
