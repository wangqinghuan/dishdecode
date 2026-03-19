async function testBaiduSniffer(nameCN) {
  console.log(`\n>>> Testing Baidu Sniffer for: ${nameCN}`);
  const baiduUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=${encodeURIComponent(nameCN + " 菜谱实拍")}&rn=30`;

  try {
    const res = await fetch(baiduUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://image.baidu.com/'
      }
    });

    const data = await res.json();
    console.log(`Found ${data.data?.length || 0} items in data array.`);

    const images = (data.data || [])
      .filter(item => item.thumbURL || item.middleURL)
      .map(item => item.middleURL || item.thumbURL)
      .filter(url => url && !url.includes('logo') && !url.includes('icon'))
      .slice(0, 3);

    console.log(`Extracted ${images.length} valid images.`);
    images.forEach((url, i) => console.log(`${i+1}. ${url.substring(0, 80)}...`));

  } catch (error) {
    console.error("Baidu Sniffer Test Failed:", error.message);
  }
}

async function run() {
  await testBaiduSniffer("椒麻水煮鱼");
  await testBaiduSniffer("脆皮乳鸽");
  await testBaiduSniffer("红烧肉");
}

run();
