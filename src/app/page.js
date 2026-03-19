'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Settings, X, AlertTriangle, CheckCircle2, Info, Languages, MessageCircle } from 'lucide-react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ items: [] });
  const [error, setError] = useState(null);
  const [userPrefs, setUserPrefs] = useState({ allergens: [], dislikes: [] });
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('dishdecode_prefs');
    if (saved) setUserPrefs(JSON.parse(saved));
  }, []);

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
          body: JSON.stringify({ image: base64, prefs: userPrefs }),
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
              if (obj.nameCN && obj.nameEN) {
                newItems.push(obj);
              }
            } catch (e) {}
          });

          if (newItems.length > 0) {
            setResults({ items: newItems });
          }
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
        <Link href="/preferences" className="settings-link"><Settings size={20} /></Link>
      </header>

      {error && <div className="error-bar">Error: {error}</div>}

      <main className="hero-section">
        {!image ? (
          <label className="scan-placeholder">
            <div className="camera-circle"><Camera size={40} color="white" /></div>
            <h2>Scan Your Menu</h2>
            <p>Snap a photo to see what's inside.</p>
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
                  <span>Analyzing Menu...</span>
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
          onClose={() => setSelectedDish(null)} 
        />
      )}

      <style jsx global>{`
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
                    const en = parts[0] || '';
                    const cn = parts[1] || '';
                    return (
                      <span key={idx} className="ing-item">
                        {en} <span style={{opacity: 0.5, fontSize: '0.9em', marginLeft: '2px'}}>{cn}</span>
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

function DishDetail({ dish, onClose }) {
  const [wikiData, setWikiData] = useState({ img: null, desc: 'Searching for culinary secrets...' });

  useEffect(() => {
    async function fetchInfo() {
      try {
        const title = dish.nameEN.replace(/ /g, '_');
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        const data = await res.json();
        
        setWikiData({
          img: data.originalimage?.source || null,
          desc: data.extract || `A delicious Chinese dish: ${dish.nameCN}. It features a ${dish.flavor} flavor profile.`
        });
      } catch (e) {
        setWikiData({ img: null, desc: `A delicious Chinese dish: ${dish.nameCN}.` });
      }
    }
    fetchInfo();
  }, [dish]);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <button className="close-sheet" onClick={onClose}><X size={24} /></button>
        
        {wikiData.img && (
          <div className="detail-img-container">
            <img src={wikiData.img} alt={dish.nameEN} />
          </div>
        )}

        <div className="detail-content">
          <div className="detail-header">
            <span className="detail-cn">{dish.nameCN}</span>
            <h2>{dish.nameEN}</h2>
          </div>
          
          <div className="detail-body">
            <p>{wikiData.desc}</p>
            <div className="detail-tags">
              <span className="tag">{dish.flavor}</span>
              <span className="tag">Spiciness: {dish.spiciness}/5</span>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; backdrop-filter: blur(2px); }
        .detail-sheet { 
          background: #fcfaf2; width: 100%; border-radius: 24px 24px 0 0; 
          padding: 24px; position: relative; max-height: 85vh; overflow-y: auto;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.2); animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: -8px auto 20px; }
        .close-sheet { position: absolute; right: 20px; top: 20px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: none; z-index: 10; cursor: pointer; }
        .detail-img-container { width: calc(100% + 48px); margin: -24px -24px 24px; height: 280px; overflow: hidden; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .detail-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .detail-header { margin-bottom: 16px; }
        .detail-cn { font-family: "Noto Serif SC", serif; color: #c83c23; font-weight: bold; font-size: 18px; }
        .detail-header h2 { font-size: 28px; line-height: 1.2; margin-top: 4px; color: #1a1a1b; }
        .detail-body p { color: #444; line-height: 1.7; font-size: 16px; margin-bottom: 24px; }
        .detail-tags { display: flex; gap: 8px; }
        .tag { background: #eee; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #666; }
      `}</style>
    </div>
  );
}
