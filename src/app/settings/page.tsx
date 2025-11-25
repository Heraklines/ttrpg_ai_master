'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [diceAnimation, setDiceAnimation] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleSave = () => {
    // Placeholder - will connect to API in Phase 2
    console.log('Settings saved:', { theme, fontSize, diceAnimation, soundEnabled });
    alert('Settings saved! (This is a placeholder - actual saving will be implemented in Phase 2)');
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-parchment-muted hover:text-gold transition-colors text-sm mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-heading text-gold">Settings</h1>
          <p className="text-parchment-muted mt-2">Configure your Arcane Gamemaster experience</p>
        </div>

        {/* API Key Section */}
        <section className="parchment-card p-6 mb-6">
          <h2 className="text-xl font-heading text-gold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Gemini API Key
          </h2>
          <p className="text-parchment-muted text-sm mb-4">
            Enter your Google Gemini API key to enable AI-powered storytelling. 
            Your key is stored securely and never shared.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="input-fantasy pr-10"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-muted hover:text-gold"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-parchment-muted mt-2">
            Get your API key from{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </section>

        {/* Display Settings */}
        <section className="parchment-card p-6 mb-6">
          <h2 className="text-xl font-heading text-gold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Display
          </h2>
          
          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block text-sm text-parchment mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="input-fantasy"
              >
                <option value="dark">Dark (Default)</option>
                <option value="darker">Darker</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm text-parchment mb-2">Font Size</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="input-fantasy"
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </section>

        {/* Gameplay Settings */}
        <section className="parchment-card p-6 mb-6">
          <h2 className="text-xl font-heading text-gold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gameplay
          </h2>
          
          <div className="space-y-4">
            {/* Dice Animation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-parchment">Dice Animations</p>
                <p className="text-xs text-parchment-muted">Show rolling animations for dice</p>
              </div>
              <button
                onClick={() => setDiceAnimation(!diceAnimation)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  diceAnimation ? 'bg-gold' : 'bg-surface'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    diceAnimation ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-parchment">Sound Effects</p>
                <p className="text-xs text-parchment-muted">Enable dice rolling and combat sounds</p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-gold' : 'bg-surface'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/" className="btn-mystic">
            Cancel
          </Link>
          <button onClick={handleSave} className="btn-fantasy">
            Save Settings
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-mystic-dark/20 border border-mystic/30 rounded-lg">
          <p className="text-sm text-parchment-muted">
            <strong className="text-mystic-light">Phase 1 Status:</strong> Settings are not yet 
            persisted to the database. This will be implemented in Phase 2.
          </p>
        </div>
      </div>
    </main>
  );
}
