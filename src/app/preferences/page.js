'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';

const ALLERGENS = ['Peanuts', 'Seafood', 'Gluten', 'Dairy', 'Soy', 'Eggs', 'Nuts', 'Sesame'];
const DISLIKES = ['Coriander', 'Pork', 'Beef', 'Spicy', 'Mutton', 'Sugar'];

export default function Preferences() {
  const [prefs, setPrefs] = useState({ allergens: [], dislikes: [] });

  useEffect(() => {
    const saved = localStorage.getItem('dishdecode_prefs');
    if (saved) setPrefs(JSON.parse(saved));
  }, []);

  const toggle = (category, item) => {
    const updated = { ...prefs };
    if (updated[category].includes(item)) {
      updated[category] = updated[category].filter(i => i !== item);
    } else {
      updated[category].push(item);
    }
    setPrefs(updated);
    localStorage.setItem('dishdecode_prefs', JSON.stringify(updated));
  };

  return (
    <div className="pref-wrapper">
      <header className="pref-header">
        <Link href="/" className="back-link"><ChevronLeft size={24} /></Link>
        <h2>Your Profile</h2>
      </header>

      <div className="pref-content">
        <section className="pref-section">
          <h3>Allergies</h3>
          <p>We'll red-flag dishes containing these.</p>
          <div className="tag-cloud">
            {ALLERGENS.map(item => (
              <button 
                key={item} 
                onClick={() => toggle('allergens', item)}
                className={`tag-btn ${prefs.allergens.includes(item) ? 'active' : ''}`}
              >
                {item} {prefs.allergens.includes(item) && <Check size={14} />}
              </button>
            ))}
          </div>
        </section>

        <section className="pref-section">
          <h3>Dietary Preferences</h3>
          <p>We'll warn you if dishes match these.</p>
          <div className="tag-cloud">
            {DISLIKES.map(item => (
              <button 
                key={item} 
                onClick={() => toggle('dislikes', item)}
                className={`tag-btn ${prefs.dislikes.includes(item) ? 'active' : ''}`}
              >
                {item} {prefs.dislikes.includes(item) && <Check size={14} />}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
