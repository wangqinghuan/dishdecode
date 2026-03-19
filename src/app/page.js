'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

      <main className="hero-section">
        {!image ? (
          <label className="scan-placeholder">
            <div className="camera-circle"><Camera size={40} color="white" /></div>
            <h2>Scan Your Menu</h2>
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden-input" />
          </label>
        ) : (
          <div className="preview-view">
            <div className="preview-container">
              <img src={image} alt="Preview" />
              {loading && <div className="scan-loader"><div className="line"></div><span>Decoding...</span></div>}
            </div>
            {results.items.length > 0 && <ResultsList results={results} onReset={reset} onDishClick={setSelectedDish} />}
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
        <h3>Menu Analysis ({results.items.length})</h3>
        <button onClick={onReset} className="reset-btn"><X size={20} /></button>
      </div>
      <div className="dish-grid">
        {results.items.map((dish, i) => (
          <div key={i} className={`dish-card ${dish.status}`} onClick={() => onDishClick(dish)}>
            <div className="dish-top">
              <span className="dish-name-cn">{dish.nameCN}</span>
              <div className="dish-price">¥{dish.price}</div>
            </div>
            <h4>{dish.nameEN}</h4>
            <div className="dish-meta">
              <span className="tag">{dish.flavor}</span>
              <span className="tag">Heat: {dish.spiciness}/5</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DishDetail({ dish, targetLang, onClose }) {
  const [state, setState] = useState({ details: null, images: [], loading: true, error: false });

  useEffect(() => {
    let active = true;
    const cacheKey = `detail_vPROXY_${dish.nameCN}_${targetLang}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const p = JSON.parse(cached);
      setState({ details: p.text, images: p.images || [], loading: false, error: false });
      return;
    }

    async function fetchData() {
      try {
        const [dRes, iRes] = await Promise.all([
          fetch('/api/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nameCN: dish.nameCN, nameEN: dish.nameEN, targetLang })
          }),
          fetch('/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nameCN: dish.nameCN })
          })
        ]);

        const dData = await dRes.json();
        const iData = await iRes.json();
        
        // 关键修复：图片链接通过我们的后端 Proxy 转发，绕过防盗链
        const proxiedImages = (iData.images || []).map(url => `/api/images/proxy?url=${encodeURIComponent(url)}`);
        
        localStorage.setItem(cacheKey, JSON.stringify({ text: dData.text, images: proxiedImages }));
        
        if (active) {
          setState({ details: dData.text, images: proxiedImages, loading: false, error: false });
        }
      } catch (e) {
        if (active) setState(s => ({ ...s, loading: false, error: true }));
      }
    }
    fetchData();
    return () => { active = false; };
  }, [dish.nameCN, targetLang]);

  const parsedText = useMemo(() => {
    if (!state.details) return null;
    const res = {};
    const parts = state.details.split(/(STORY:|METHOD:|TASTE:)/i);
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i].toLowerCase().replace(':', '');
      res[key] = parts[i+1]?.split(/(STORY:|METHOD:|TASTE:)/i)[0].trim();
    }
    return (res.story || res.method || res.taste) ? res : { story: state.details };
  }, [state.details]);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <button className="close-sheet" onClick={onClose}><X size={24} /></button>
        
        <div className="detail-gallery-container">
          {state.images.length > 0 ? (
            <div className="image-carousel">
              {state.images.map((url, idx) => (
                <div key={idx} className="carousel-item">
                  <img src={url} alt="Dish" loading="eager" />
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder-img">
              <Camera size={40} color="#ccc" />
              <span>{state.loading ? 'Fetching authentic photos...' : 'No imagery found'}</span>
            </div>
          )}
        </div>

        <div className="detail-content">
          <div className="detail-header">
            <span className="detail-cn">{dish.nameCN}</span>
            <h2>{dish.nameEN}</h2>
          </div>
          <div className="detail-body">
            {state.loading ? (
              <p className="loading-text">Decoding culinary secrets...</p>
            ) : (
              <>
                {parsedText?.story && <div className="info-block"><strong>Heritage</strong><p>{parsedText.story}</p></div>}
                {parsedText?.method && <div className="info-block"><strong>Creation</strong><p>{parsedText.method}</p></div>}
                {parsedText?.taste && <div className="info-block"><strong>Essence</strong><p>{parsedText.taste}</p></div>}
              </>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; backdrop-filter: blur(4px); }
        .detail-sheet { background: #fcfaf2; width: 100%; border-radius: 24px 24px 0 0; padding: 24px; position: relative; max-height: 92vh; overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.3); animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: -8px auto 20px; }
        .close-sheet { position: absolute; right: 20px; top: 20px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: none; z-index: 10; cursor: pointer; }
        .detail-gallery-container { width: calc(100% + 48px); margin: -24px -24px 24px; height: 300px; background: #f0f0f0; position: relative; }
        .image-carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; height: 100%; scrollbar-width: none; }
        .image-carousel::-webkit-scrollbar { display: none; }
        .carousel-item { flex: 0 0 100%; scroll-snap-align: start; height: 100%; }
        .carousel-item img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder-img { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #bbb; font-size: 14px; font-weight: 500; }
        .detail-cn { color: #c83c23; font-weight: bold; font-size: 20px; }
        .detail-header h2 { font-size: 32px; line-height: 1.1; margin-top: 4px; color: #1a1a1b; letter-spacing: -0.5px; }
        .info-block { margin-bottom: 24px; }
        .info-block strong { display: block; font-size: 11px; text-transform: uppercase; color: #c83c23; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 800; }
        .info-block p { color: #333; line-height: 1.7; font-size: 16px; white-space: pre-wrap; }
        .loading-text { color: #999; font-style: italic; text-align: center; margin: 40px 0; }
        .tag { background: white; border: 1px solid #eee; padding: 6px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; color: #666; }
      `}</style>
    </div>
  );
}
