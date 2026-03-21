'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, X, Globe, ChevronDown, Loader2, Sparkles, ArrowRight, Maximize2 } from 'lucide-react';

const LANGUAGES = [
  { label: 'English', value: 'English', currency: 'USD', symbol: '$', rate: 0.14 },
  { label: 'Bahasa Indonesia', value: 'Indonesian', currency: 'IDR', symbol: 'Rp', rate: 2200 },
  { label: 'Filipino', value: 'Filipino', currency: 'PHP', symbol: '₱', rate: 7.8 },
  { label: 'Español', value: 'Spanish', currency: 'EUR', symbol: '€', rate: 0.13 },
  { label: 'Français', value: 'French', currency: 'EUR', symbol: '€', rate: 0.13 },
  { label: 'Русский', value: 'Russian', currency: 'RUB', symbol: '₽', rate: 12.5 },
  { label: 'العربية', value: 'Arabic', currency: 'AED', symbol: 'د.إ', rate: 0.51 },
  { label: 'Deutsch', value: 'German', currency: 'EUR', symbol: '€', rate: 0.13 },
  { label: '日本語', value: 'Japanese', currency: 'JPY', symbol: '¥', rate: 21 },
  { label: '한국어', value: 'Korean', currency: 'KRW', symbol: '₩', rate: 185 }
];

const DEMO_CASES = [
  { id: 1, menuUrl: '/demo/menu1.png', resultUrl: '/demo/result1.png', rotation: '-3deg' },
  { id: 2, menuUrl: '/demo/menu2.png', resultUrl: '/demo/result2.png', rotation: '2deg' }
];

const compressImage = (base64Str, maxWidth = 1600) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ items: [] });
  const [error, setError] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailData, setDishDetailData] = useState({ text: null, images: [], loading: false });
  const [targetLang, setTargetLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const currentLangObj = useMemo(() => LANGUAGES.find(l => l.value === targetLang) || LANGUAGES[0], [targetLang]);

  useEffect(() => {
    const savedLang = localStorage.getItem('dishdecode_lang');
    if (savedLang) setTargetLang(savedLang);
  }, []);

  const selectLang = (val) => {
    setTargetLang(val);
    localStorage.setItem('dishdecode_lang', val);
    setShowLangMenu(false);
  };

  const handleDishClick = async (dish) => {
    setSelectedDish(dish);
    const cacheKey = `detail_vRefined_${dish.nameCN}_${targetLang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached);
      setDishDetailData({ text: p.text, images: p.images || [], loading: false });
      return;
    }
    setDishDetailData({ text: null, images: [], loading: true });
    try {
      const [dRes, iRes] = await Promise.all([
        fetch('/api/details', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ nameCN: dish.nameCN, nameEN: dish.nameEN, targetLang }) }),
        fetch('/api/images', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ nameCN: dish.nameCN }) })
      ]);
      const dData = await dRes.json();
      const iData = await iRes.json();
      const proxiedImages = (iData.images || []).map(url => `/api/images/proxy?url=${encodeURIComponent(url)}`);
      localStorage.setItem(cacheKey, JSON.stringify({ text: dData.text, images: proxiedImages }));
      setDishDetailData({ text: dData.text, images: proxiedImages, loading: false });
    } catch (e) { setDishDetailData(prev => ({ ...prev, loading: false })); }
  };

  const startAnalysis = async (imgUrl) => {
    setError(null);
    setResults({ items: [] });
    setImage(imgUrl);
    setLoading(true);
    
    const cleanImg = await compressImage(imgUrl);
    try {
      const response = await fetch('/api/analyze', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ image: cleanImg, targetLang }) 
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        if (buffer.includes('"error": "NOT_A_MENU"')) {
          setError("Oops! This doesn't look like a menu. Please snap a photo of a real menu.");
          setLoading(false);
          setImage(null);
          return;
        }

        // 【关键修复】更健壮的解析逻辑：寻找每一个独立的菜品对象
        // 匹配模式：寻找以 {"nameCN" 开始，到最近的 } 结束的块
        const dishMatches = [...buffer.matchAll(/\{\s*"nameCN"[\s\S]*?\}/g)];
        const items = [];
        
        dishMatches.forEach(match => {
          try {
            const obj = JSON.parse(match[0]);
            if (obj.nameCN) {
              items.push(obj);
            }
          } catch (e) {
            // 忽略尚未完全接收到的 JSON 块
          }
        });

        if (items.length > 0) {
          setResults({ items });
        }
      }
    } catch (err) { 
      setError("Analysis failed. Please try a different photo."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <h1 className="brand-text">DishDecode</h1>
        <div className="custom-lang-selector">
          <button className="lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
            <Globe size={16} /><span>{currentLangObj.label}</span><ChevronDown size={14} className={showLangMenu ? 'rotate' : ''} />
          </button>
          {showLangMenu && <div className="lang-dropdown">{LANGUAGES.map(l => <div key={l.value} className="lang-option" onClick={() => selectLang(l.value)}>{l.label}</div>)}</div>}
        </div>
      </header>

      {error && <div className="error-bar">{error}</div>}

      <main className="hero-section">
        {!image ? (
          <>
            <label className="scan-placeholder">
              <div className="camera-circle"><Camera size={40} color="white" /></div>
              <h2>Scan Menu</h2>
              <p>Decode names, ingredients, and stories in {targetLang}.</p>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onload = (ev) => startAnalysis(r.result); r.readAsDataURL(f); }}} className="hidden-input" />
            </label>

            <div className="demo-section">
              <div className="demo-label"><Sparkles size={14} /><span>See how it works (Tap to zoom)</span></div>
              <div className="demo-stack-vertical">
                {DEMO_CASES.map(item => (
                  <div key={item.id} className="demo-pair">
                    <div className="demo-card before" style={{ transform: `rotate(${item.rotation})` }} onClick={() => setZoomImage(item.menuUrl)}>
                      <img src={item.menuUrl} alt="Menu" />
                      <div className="zoom-hint"><Maximize2 size={12} /></div>
                      <span className="badge">Menu</span>
                    </div>
                    <div className="demo-arrow"><ArrowRight size={16} color="#c83c23" /></div>
                    <div className="demo-card after" style={{ transform: `rotate(calc(${item.rotation} * -0.5))` }} onClick={() => setZoomImage(item.resultUrl)}>
                      <img src={item.resultUrl} alt="Result" />
                      <div className="zoom-hint"><Maximize2 size={12} /></div>
                      <span className="badge">Decoded</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="preview-view">
            <div className="preview-container">
              <img src={image} alt="Preview" />
              {loading && <div className="scan-loader"><div className="line"></div><span>Decoding...</span></div>}
            </div>
            {results.items.length > 0 && <ResultsList results={results} currency={currentLangObj} onReset={() => { setImage(null); setResults({items:[]}); }} onDishClick={handleDishClick} />}
          </div>
        )}
      </main>

      {selectedDish && <DishDetail dish={selectedDish} data={dishDetailData} onClose={() => setSelectedDish(null)} />}
      
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <button className="close-zoom"><X size={30} color="white" /></button>
          <img src={zoomImage} alt="Zoomed" />
        </div>
      )}

      <style jsx global>{`
        .demo-section { margin-top: 48px; padding: 0 20px 80px; }
        .demo-label { display: flex; align-items: center; gap: 6px; color: #949495; font-size: 14px; font-weight: 600; margin-bottom: 40px; justify-content: center; }
        .demo-stack-vertical { display: flex; flex-direction: column; gap: 64px; align-items: center; }
        .demo-pair { display: flex; align-items: center; gap: 20px; }
        .demo-arrow { background: #fff; width: 36px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .demo-card { width: 150px; height: 200px; background: white; padding: 7px; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); position: relative; cursor: pointer; }
        .demo-card img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
        .zoom-hint { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); padding: 4px; border-radius: 50%; opacity: 0.6; }
        .demo-card .badge { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: #1a1a1b; color: white; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; white-space: nowrap; }
        .demo-card.after .badge { background: #c83c23; }

        .zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .zoom-overlay img { max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 0 40px rgba(0,0,0,0.5); }
        .close-zoom { position: absolute; top: 30px; right: 20px; background: none; border: none; cursor: pointer; }

        .custom-lang-selector { position: relative; z-index: 50; }
        .lang-btn { background: #f0f0f0; border: none; padding: 8px 14px; border-radius: 20px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .lang-dropdown { position: absolute; right: 0; top: 40px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #eee; min-width: 160px; overflow: hidden; }
        .lang-option { padding: 12px 16px; font-size: 14px; cursor: pointer; border-bottom: 1px solid #f5f5f5; }
        .lang-option:hover { background: #fcfaf2; color: #c83c23; }
        .error-bar { background: #fff5f5; color: #c53030; padding: 12px 20px; margin: 0 20px 20px; border-radius: 12px; border: 1px solid #feb2b2; font-size: 14px; text-align: center; font-weight: 600; }
        .scan-loader { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 10; }
        .scan-loader .line { width: 100%; height: 2px; background: #c83c23; position: absolute; top: 0; animation: scanAnim 2s linear infinite; }
        @keyframes scanAnim { 0% { top: 0%; } 100% { top: 100%; } }
        .preview-container { position: relative; border-radius: 12px; overflow: hidden; margin: 0 20px 20px; max-height: 180px; }
        .preview-container img { width: 100%; height: auto; display: block; filter: brightness(0.7); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function ResultsList({ results, currency, onReset, onDishClick }) {
  return (
    <div className="results-container">
      <div className="results-header"><h3>Menu ({results.items.length})</h3><button onClick={onReset} className="reset-btn"><X size={20} /></button></div>
      <div className="dish-grid">
        {results.items.map((dish, i) => {
          const rawPrice = parseFloat(String(dish.price).replace(/[^0-9.]/g, ''));
          const finalPrice = isNaN(rawPrice) ? 0 : rawPrice;
          const converted = (finalPrice * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          return (
            <div key={i} className="dish-card safe" onClick={() => onDishClick(dish)}>
              <div className="dish-top"><span className="dish-name-cn">{dish.nameCN}</span><div className="dish-price"><span className="cny">¥{finalPrice}</span><span className="converted">{currency.symbol}{converted}</span></div></div>
              <h4 style={{ marginBottom: '8px' }}>{dish.nameEN}</h4>
              <div className="ingredients-box" style={{ padding: '8px', marginBottom: '10px', background: '#f9f9f9' }}>
                <div className="ingredients" style={{ fontSize: '12px' }}>
                  {dish.ingredients?.map((ing, idx) => {
                    const [en, cn] = typeof ing === 'string' ? ing.split('|') : [];
                    return <span key={idx} className="ing-item">{en} <small style={{opacity: 0.5}}>{cn}</small>{idx < dish.ingredients.length - 1 ? ', ' : ''}</span>
                  })}
                </div>
              </div>
              <div className="dish-meta"><span className="tag">{dish.flavor}</span><span className="tag">Spiciness: {dish.spiciness}/5</span></div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .dish-price { display: flex; flex-direction: column; align-items: flex-end; }
        .cny { font-size: 15px; font-weight: 800; color: #1a1a1b; }
        .converted { font-size: 11px; color: #c83c23; font-weight: bold; }
      `}</style>
    </div>
  );
}

function DishDetail({ dish, data, onClose }) {
  const parsed = useMemo(() => {
    if (!data.text) return null;
    const res = {};
    const parts = data.text.split(/(STORY:|METHOD:|TASTE:)/i);
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i].toLowerCase().replace(':', '');
      res[key] = parts[i+1]?.split(/(STORY:|METHOD:|TASTE:)/i)[0].trim();
    }
    return (res.story || res.method || res.taste) ? res : { story: data.text };
  }, [data.text]);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <button className="close-sheet" onClick={onClose}><X size={24} /></button>
        <div className="detail-gallery-container">
          {data.loading ? ( <div className="skeleton-gallery"><Loader2 className="spin" size={30} /></div>
          ) : data.images.length > 0 ? (
            <div className="image-carousel">{data.images.map((url, idx) => ( <div key={url + idx} className="carousel-item"><img src={url} alt="Dish" loading="eager" onError={(e) => e.target.style.display='none'} /></div> ))}</div>
          ) : ( <div className="placeholder-img"><Camera size={40} color="#ddd" /></div> )}
        </div>
        <div className="detail-content">
          <div className="detail-header"><span className="detail-cn">{dish.nameCN}</span><h2>{dish.nameEN}</h2></div>
          <div className="detail-body">
            {data.loading ? (
              <div className="skeleton-text"><div className="s-line" style={{width: '90%'}}></div><div className="s-line" style={{width: '100%'}}></div><div className="s-line" style={{width: '70%'}}></div></div>
            ) : (
              <div className="slim-details">
                {parsed?.story && <div className="slim-block"><strong>Heritage</strong><p>{parsed.story}</p></div>}
                {parsed?.method && <div className="slim-block"><strong>Creation</strong><p>{parsed.method}</p></div>}
                {parsed?.taste && <div className="slim-block"><strong>Flavor</strong><p>{parsed.taste}</p></div>}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; backdrop-filter: blur(4px); }
        .detail-sheet { background: #fcfaf2; width: 100%; border-radius: 24px 24px 0 0; padding: 24px; position: relative; max-height: 92vh; overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.3); animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: -8px auto 20px; }
        .close-sheet { position: absolute; right: 20px; top: 20px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: none; z-index: 10; cursor: pointer; }
        .detail-gallery-container { width: calc(100% + 48px); margin: -24px -24px 24px; height: 260px; background: #eee; position: relative; overflow: hidden; }
        .image-carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; height: 100%; scrollbar-width: none; }
        .image-carousel::-webkit-scrollbar { display: none; }
        .carousel-item { flex: 0 0 100%; scroll-snap-align: start; height: 100%; }
        .carousel-item img { width: 100%; height: 100%; object-fit: cover; }
        .skeleton-gallery { height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
        .skeleton-text { margin-top: 10px; }
        .s-line { height: 14px; background: #eee; margin-bottom: 12px; border-radius: 4px; }
        .detail-header h2 { font-size: 28px; line-height: 1.1; margin-top: 4px; color: #1a1a1b; }
        .slim-block { margin-bottom: 18px; }
        .slim-block strong { font-size: 11px; text-transform: uppercase; color: #c83c23; letter-spacing: 1px; }
        .slim-block p { color: #444; font-size: 15px; margin-top: 2px; line-height: 1.6; }
        .tag { background: white; border: 1px solid #eee; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #666; }
      `}</style>
    </div>
  );
}
