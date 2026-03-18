'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Settings, X, AlertTriangle, CheckCircle2, Info, Languages, MessageCircle } from 'lucide-react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [userPrefs, setUserPrefs] = useState({ allergens: [], dislikes: [] });

  useEffect(() => {
    const saved = localStorage.getItem('dishdecode_prefs');
    if (saved) setUserPrefs(JSON.parse(saved));
  }, []);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setResults(null);
    
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
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || data.error || "Server Error");

        if (data.items) {
          setResults(data);
        } else {
          throw new Error("Analysis failed to produce results.");
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
    setResults(null);
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
            {results && <ResultsList results={results} onReset={reset} />}
          </div>
        )}
      </main>

      <style jsx global>{`
        .scan-loader { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; }
        .scan-loader .line { width: 100%; height: 2px; background: #c83c23; position: absolute; top: 0; animation: scanAnim 2s linear infinite; }
        @keyframes scanAnim { 0% { top: 0%; } 100% { top: 100%; } }
        .preview-container { position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 20px; max-height: 250px; }
        .preview-container img { width: 100%; height: auto; display: block; }
      `}</style>
    </div>
  );
}

function ResultsList({ results, onReset }) {
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
            <div key={i} className={`dish-card ${dish.status}`}>
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
