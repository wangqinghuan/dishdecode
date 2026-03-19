async function testDDGSearch(nameCN) {
  console.log(`>>> Testing DDG Search for: ${nameCN}`);
  const query = `${nameCN} 菜谱实拍`;
  try {
    const vqdRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    
    const text = await vqdRes.text();
    const vqdMatch = text.match(/vqd="([^"]+)"/) || text.match(/vqd=([^&]+)/);
    
    if (!vqdMatch) {
      console.log("Failed to get VQD token. DDG might be blocking the request.");
      return;
    }
    
    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`;
    
    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://duckduckgo.com/'
      }
    });

    const data = await apiRes.json();
    const images = (data.results || []).slice(0, 3).map(r => r.image);

    console.log(`\nRESULTS (${images.length} images):`);
    images.forEach((url, i) => console.log(`${i+1}. ${url}`));

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testDDGSearch("椒麻水煮鱼");
