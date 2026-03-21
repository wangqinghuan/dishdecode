'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, X, Globe, ChevronDown, Loader2, Sparkles } from 'lucide-react';

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

const DEMO_MENUS = [
  { id: 1, name: 'Sichuan Bistro', url: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?q=80&w=800', rotation: '-4deg' },
  { id: 2, name: 'Dim Sum Palace', url: 'https://images.unsplash.com/photo-1582450871972-ed5ca607972c?q=80&w=800', rotation: '2deg' },
  { id: 3, name: 'Local Noodle Shop', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800', rotation: '-2deg' }
];

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ items: [] });
  const [error, setError] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishDetailData, setDishDetailData] = useState({ text: null, images: [], loading: false });
  const [targetLang, setTargetLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = useMemo(() => 
    LANGUAGES.find(l => l.value === targetLang) || LANGUAGES[0]
  , [targetLang]);

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
    const cacheKey = `detail_vFinal_${dish.nameCN}_${targetLang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached);
      setDishDetailData({ text: p.text, images: p.images || [], loading: false });
      return;
    }
    setDishDetailData({ text: null, images: [], loading: true });
    try {
      const [dRes, iRes] = await Promise.all([
        fetch('/api/details', { method: 'POST', body: JSON.stringify({ nameCN: dish.nameCN, nameEN: dish.nameEN, targetLang }) }),
        fetch('/api/images', { method: 'POST', body: JSON.stringify({ nameCN: dish.nameCN }) })
      ]);
      const dData = await dRes.json();
      const iData = await iRes.json();
      const proxiedImages = (iData.images || []).map(url => `/api/images/proxy?url=${encodeURIComponent(url)}`);
      localStorage.setItem(cacheKey, JSON.stringify({ text: dData.text, images: proxiedImages }));
      setDishDetailData({ text: dData.text, images: proxiedImages, loading: false });
    } catch (e) { setDishDetailData(prev => ({ ...prev, loading: false })); }
  };

  const startAnalysis = async (imgUrl, isBase64 = true) => {
    setImage(imgUrl);
    setLoading(true);
    setResults({ items: [] });
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgUrl, targetLang }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const matches = [...buffer.matchAll(/\{[\s\S]*?\}/g)];
        const newItems = [];
        matches.forEach(match => {
          try {
            const obj = JSON.parse(match[0]);
            if (obj.nameCN && obj.nameEN) newItems.push(obj);
          } catch (e) {}
        });
        if (newItems.length > 0) setResults({ items: newItems });
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => startAnalysis(event.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <h1 className="brand-text">DishDecode</h1>
        <div className="custom-lang-selector">
          <button className="lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
            <Globe size={16} />
            <span>{currentLangObj.label}</span>
            <ChevronDown size={14} className={showLangMenu ? 'rotate' : ''} />
          </button>
          {showLangMenu && (
            <div className="lang-dropdown">
              {LANGUAGES.map(l => <div key={l.value} className="lang-option" onClick={() => selectLang(l.value)}>{l.label}</div>)}
            </div>
          )}
        </div>
      </header>

      <main className="hero-section">
        {!image ? (
          <>
            <label className="scan-placeholder">
              <div className="camera-circle"><Camera size={40} color="white" /></div>
              <h2>Scan Menu</h2>
              <p>Instantly decode names, ingredients, flavors, and the stories behind every dish in {targetLang}.</p>
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden-input" />
            </label>

            <div className="demo-section">
              <div className="demo-label">
                <Sparkles size={14} />
                <span>No menu? Try a sample</span>
              </div>
              <div className="demo-scroll">
                <div className="demo-stack">
                  {DEMO_MENUS.map(menu => (
                    <div 
                      key={menu.id} 
                      className="demo-card" 
                      style={{ transform: `rotate(${menu.rotation})` }}
                      onClick={() => startAnalysis(menu.url, false)}
                    >
                      <img src={menu.url} alt="Sample Menu" />
                      <div className="demo-overlay"><Camera size={20} color="white" /></div>
                    </div>
                  ))}
                </div>
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

      <style jsx global>{`
        .demo-section { margin-top: 40px; padding: 0 20px; }
        .demo-label { display: flex; align-items: center; gap: 6px; color: #949495; font-size: 13px; font-weight: 600; margin-bottom: 20px; justify-content: center; }
        .demo-scroll { overflow-x: auto; padding: 20px 0 40px; scrollbar-width: none; }
        .demo-scroll::-webkit-scrollbar { display: none; }
        .demo-stack { display: flex; gap: 20px; padding-left: 20px; width: max-content; }
        .demo-card { width: 140px; height: 180px; background: white; padding: 6px; border-radius: 4px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); cursor: pointer; transition: all 0.3s; flex-shrink: 0; position: relative; }
        .demo-card:hover { transform: translateY(-10px) rotate(0deg) !important; z-index: 10; }
        .demo-card img { width: 100%; height: 100%; object-fit: cover; border-radius: 2px; filter: sepia(0.2) contrast(0.9); }
        .demo-overlay { position: absolute; inset: 0; background: rgba(200,60,35,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; border-radius: 4px; }
        .demo-card:hover .demo-overlay { opacity: 1; }

        .custom-lang-selector { position: relative; z-index: 50; }
        .lang-btn { background: #f0f0f0; border: none; padding: 8px 14px; border-radius: 20px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; cursor: pointer; color: #1a1a1b; transition: all 0.2s; }
        .lang-btn .rotate { transform: rotate(180deg); }
        .lang-dropdown { position: absolute; right: 0; top: 40px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #eee; min-width: 160px; overflow: hidden; animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .lang-option { padding: 12px 16px; font-size: 14px; cursor: pointer; border-bottom: 1px solid #f5f5f5; }
        .lang-option:hover { background: #fcfaf2; color: #c83c23; }
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
      <div className="results-header">
        <h3>Menu ({results.items.length})</h3>
        <button onClick={onReset} className="reset-btn"><X size={20} /></button>
      </div>
      <div className="dish-grid">
        {results.items.map((dish, i) => {
          const rawPrice = parseFloat(String(dish.price).replace(/[^0-9.]/g, ''));
          const finalPrice = isNaN(rawPrice) ? 0 : rawPrice;
          const converted = (finalPrice * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          return (
            <div key={i} className="dish-card safe" onClick={() => onDishClick(dish)}>
              <div className="dish-top">
                <span className="dish-name-cn">{dish.nameCN}</span>
                <div className="dish-price">
                  <span className="cny">¥{finalPrice}</span>
                  <span className="converted">{currency.symbol}{converted}</span>
                </div>
              </div>
              <h4 style={{ marginBottom: '8px' }}>{dish.nameEN}</h4>
              <div className="ingredients-box" style={{ padding: '8px', marginBottom: '10px', background: '#f9f9f9' }}>
                <div className="ingredients" style={{ fontSize: '12px' }}>
                  {dish.ingredients?.map((ing, idx) => {
                    const [en, cn] = typeof ing === 'string' ? ing.split('|') : [];
                    return <span key={idx} className="ing-item">{en} <small style={{opacity: 0.5}}>{cn}</small>{idx < dish.ingredients.length - 1 ? ', ' : ''}</span>
                  })}
                </div>
              </div>
              <div className="dish-meta"><span className="tag">{dish.flavor}</span></div>
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
          {data.loading ? (
            <div className="skeleton-gallery"><Loader2 className="spin" size={30} /></div>
          ) : data.images.length > 0 ? (
            <div className="image-carousel">
              {data.images.map((url, idx) => (
                <div key={url + idx} className="carousel-item"><img src={url} alt="Dish" loading="eager" /></div>
              ))}
            </div>
          ) : (
            <div className="placeholder-img"><Camera size={40} color="#ddd" /></div>
          )}
        </div>
        <div className="detail-content">
          <div className="detail-header"><span className="detail-cn">{dish.nameCN}</span><h2>{dish.nameEN}</h2></div>
          <div className="detail-body">
            {data.loading ? (
              <div className="skeleton-text"><div className="s-line" style={{width: '90%'}}></div><div className="s-line" style={{width: '100%'}}></div><div className="s-line" style={{width: '70%'}}></div></div>
            ) : (
              <div className="slim-details">
                {parsed?.story && <div className="slim-block"><strong>Background</strong><p>{parsed.story}</p></div>}
                {parsed?.method && <div className="slim-block"><strong>Method</strong><p>{parsed.method}</p></div>}
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
