'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Settings, X, Globe } from 'lucide-react';

const LANGUAGES = [
  { label: 'English', value: 'English' },
  { label: 'Bahasa Indonesia', value: 'Indonesian' },
  { label: 'Filipino', value: 'Filipino' },
  { label: 'Español', value: 'Spanish' },
  { label: 'Français', value: 'French' },
  { label: 'Русский', value: 'Russian' },
  { label: 'العربية', value: 'Arabic' },
  { label: 'Deutsch', value: 'German' },
  { label: '日本語', value: 'Japanese' },
  { label: '한국어', value: 'Korean' }
];

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ items: [] });
  const [error, setError] = useState(null);
  const [userPrefs, setUserPrefs] = useState({ allergens: [], dislikes: [] });
  const [selectedDish, setSelectedDish] = useState(null);
  const [targetLang, setTargetLang] = useState('English');

  useEffect(() => {
    const saved = localStorage.getItem('dishdecode_prefs');
    if (saved) setUserPrefs(JSON.parse(saved));
    const savedLang = localStorage.getItem('dishdecode_lang');
    if (savedLang) setTargetLang(savedLang);
  }, []);

  const handleLangChange = (e) => {
    setTargetLang(e.target.value);
    localStorage.setItem('dishdecode_lang', e.target.value);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setResults({ items: [] });
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setImage(base64);
      setLoading(true);

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, prefs: userPrefs, targetLang }),
        });
        
        if (!response.ok) throw new Error("Server Error");

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
      } catch (err) {
        console.error("Upload error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setResults({ items: [] });
    setError(null);
  };

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <h1 className="brand-text">DishDecode</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <div className="lang-select-wrapper">
            <Globe size={16} />
            <select value={targetLang} onChange={handleLangChange} className="lang-select">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <Link href="/preferences" className="settings-link"><Settings size={20} /></Link>
        </div>
      </header>

      {error && <div className="error-bar">Error: {error}</div>}

      <main className="hero-section">
        {!image ? (
          <label className="scan-placeholder">
            <div className="camera-circle"><Camera size={40} color="white" /></div>
            <h2>Scan Your Menu</h2>
            <p>Snap a photo to decode in {targetLang}.</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={onFileChange} 
              className="hidden-input"
            />
          </label>
        ) : (
          <div className="preview-view">
            <div className="preview-container">
              <img src={image} alt="Preview" />
              {loading && (
                <div className="scan-loader">
                  <div className="line"></div>
                  <span>Decoding into {targetLang}...</span>
                </div>
              )}
            </div>
            {results.items.length > 0 && (
              <ResultsList 
                results={results} 
                onReset={reset} 
                onDishClick={(dish) => setSelectedDish(dish)}
              />
            )}
          </div>
        )}
      </main>

      {selectedDish && (
        <DishDetail 
          dish={selectedDish} 
          targetLang={targetLang}
          onClose={() => setSelectedDish(null)} 
        />
      )}

      <style jsx global>{`
        .lang-select-wrapper { display: flex; align-items: center; gap: 6px; background: white; padding: 4px 10px; border-radius: 20px; border: 1px solid #ddd; }
        .lang-select { border: none; background: transparent; font-size: 13px; font-weight: 600; cursor: pointer; outline: none; }
        .scan-loader { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 10; }
        .scan-loader .line { width: 100%; height: 2px; background: #c83c23; position: absolute; top: 0; animation: scanAnim 2s linear infinite; }
        @keyframes scanAnim { 0% { top: 0%; } 100% { top: 100%; } }
        .preview-container { position: relative; border-radius: 12px; overflow: hidden; margin: 0 20px 20px; max-height: 180px; }
        .preview-container img { width: 100%; height: auto; display: block; filter: brightness(0.7); }
      `}</style>
    </div>
  );
}

function ResultsList({ results, onReset, onDishClick }) {
  return (
    <div className="results-container">
      <div className="results-header">
        <h3>Menu Analysis ({results.items?.length || 0})</h3>
        <button onClick={onReset} className="reset-btn"><X size={20} /></button>
      </div>
      <div className="dish-grid">
        {results.items?.map((dish, i) => {
          const rawPrice = parseFloat(String(dish.price).replace(/[^0-9.]/g, ''));
          const finalPrice = isNaN(rawPrice) ? 0 : rawPrice;
          const priceUSD = (finalPrice * 0.14).toFixed(2);
          
          return (
            <div key={i} className={`dish-card ${dish.status}`} onClick={() => onDishClick(dish)} style={{cursor: 'pointer'}}>
              <div className="dish-top">
                <span className="dish-name-cn">{dish.nameCN}</span>
                <div className="dish-price">¥{finalPrice} <span style={{fontSize: '11px', opacity: 0.6, fontWeight: 'normal'}}>(approx. ${priceUSD})</span></div>
              </div>
              <h4 style={{marginTop: '4px'}}>{dish.nameEN}</h4>
              <div className="ingredients-box">
                <span className="label">Ingredients</span>
                <div className="ingredients">
                  {dish.ingredients?.map((ing, idx) => {
                    const parts = typeof ing === 'string' ? ing.split('|') : [];
                    const langPart = parts[0] || '';
                    const cnPart = parts[1] || '';
                    return (
                      <span key={idx} className="ing-item">
                        {langPart} <span style={{opacity: 0.5, fontSize: '0.9em', marginLeft: '2px'}}>{cnPart}</span>
                        {idx < dish.ingredients.length - 1 ? ', ' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="dish-meta">
                <span className="tag">{dish.flavor}</span>
                <span className="tag">Spiciness: {dish.spiciness}/5</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DishDetail({ dish, targetLang, onClose }) {
  const [details, setDetails] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    async function fetchInfo() {
      // 1. 获取 AI 文字内容和搜索词
      let searchTerms = [dish.nameEN, dish.nameCN];
      try {
        const detailRes = await fetch('/api/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nameCN: dish.nameCN, nameEN: dish.nameEN, targetLang })
        });
        const detailData = await detailRes.json();
        setDetails(detailData.text);
        
        // 解析 SEARCH_TERMS
        const match = detailData.text.match(/SEARCH_TERMS:\s*(.*)/i);
        if (match?.[1]) {
          const aiTerms = match[1].split(',').map(t => t.trim());
          searchTerms = [...new Set([...aiTerms, ...searchTerms])];
        }
      } catch (e) {
        console.error("Detail AI fetch failed", e);
      }

      // 2. 深度搜索图片 (三源策略：zh.wiki -> en.wiki -> Wikimedia Commons)
      try {
        let foundImg = null;
        
        // 尝试维基百科 (中/英)
        for (const lang of ['zh', 'en']) {
          if (foundImg) break;
          for (const term of searchTerms) {
            try {
              const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/ /g, '_'))}`);
              if (res.ok) {
                const data = await res.json();
                if (data.originalimage?.source) {
                  foundImg = data.originalimage.source;
                  break;
                }
              }
            } catch (innerE) {}
          }
        }

        // 如果还没图，尝试维基媒体共享库直接搜索 (Wikimedia Commons Search)
        if (!foundImg) {
          for (const term of searchTerms) {
            try {
              const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url`);
              if (res.ok) {
                const data = await res.json();
                if (data.query?.pages) {
                  const pages = data.query.pages;
                  const firstPageId = Object.keys(pages)[0];
                  foundImg = pages[firstPageId].imageinfo[0].url;
                  break;
                }
              }
            } catch (innerE) {}
          }
        }
        setImgUrl(foundImg);
      } catch (e) {
        console.error("Total img fetch failed", e);
      }
    }
    fetchInfo();
  }, [dish, targetLang]);

  const parseDetails = (text) => {
    if (!text) return null;
    const parts = text.split(/(STORY:|METHOD:|TASTE:|SEARCH_TERMS:)/i).map(p => p.trim());
    const res = {};
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i].replace(':', '').toLowerCase();
      res[key] = parts[i+1];
    }
    return res;
  };

  const parsed = parseDetails(details);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <button className="close-sheet" onClick={onClose}><X size={24} /></button>
        
        <div className="detail-img-container">
          {imgUrl ? (
            <img 
              src={imgUrl} 
              alt={dish.nameEN} 
              onError={() => setImgUrl(null)}
            />
          ) : (
            <div className="placeholder-img">
              <Camera size={40} color="rgba(200,60,35,0.15)" />
              <span>Seeking visual imagery...</span>
            </div>
          )}
        </div>

        <div className="detail-content">
          <div className="detail-header">
            <span className="detail-cn">{dish.nameCN}</span>
            <h2>{dish.nameEN}</h2>
          </div>
          
          <div className="detail-body">
            {parsed ? (
              <>
                {parsed.story && <div className="info-block"><strong>The Story</strong> <p>{parsed.story}</p></div>}
                {parsed.method && <div className="info-block"><strong>Culinary Method</strong> <p>{parsed.method}</p></div>}
                {parsed.taste && <div className="info-block"><strong>Palate & Texture</strong> <p>{parsed.taste}</p></div>}
              </>
            ) : (
              <p className="loading-text">Decoding culinary secrets into {targetLang}...</p>
            )}
            
            <div className="detail-tags">
              <span className="tag">{dish.flavor}</span>
              <span className="tag">Spiciness: {dish.spiciness}/5</span>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; backdrop-filter: blur(4px); }
        .detail-sheet { 
          background: #fcfaf2; width: 100%; border-radius: 24px 24px 0 0; 
          padding: 24px; position: relative; max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.3); animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: -8px auto 20px; }
        .close-sheet { position: absolute; right: 20px; top: 20px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: none; z-index: 10; cursor: pointer; }
        .detail-img-container { width: calc(100% + 48px); margin: -24px -24px 24px; height: 280px; overflow: hidden; background: #f0f0f0; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .detail-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder-img { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #ccc; font-size: 14px; font-weight: 500; }
        .detail-header { margin-bottom: 24px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 16px; }
        .detail-cn { font-family: "Noto Serif SC", serif; color: #c83c23; font-weight: bold; font-size: 20px; }
        .detail-header h2 { font-size: 32px; line-height: 1.1; margin-top: 4px; color: #1a1a1b; letter-spacing: -0.5px; }
        .info-block { margin-bottom: 24px; }
        .info-block strong { display: block; font-size: 11px; text-transform: uppercase; color: #c83c23; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 800; }
        .info-block p { color: #333; line-height: 1.7; font-size: 16px; white-space: pre-wrap; }
        .loading-text { color: #999; font-style: italic; text-align: center; margin: 60px 0; }
        .detail-tags { display: flex; gap: 8px; margin-top: 32px; }
        .tag { background: white; border: 1px solid #eee; padding: 6px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; color: #666; }
      `}</style>
    </div>
  );
}
