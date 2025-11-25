'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto animate-fade-in">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-heading text-gold mb-4 tracking-wide">
            Arcane Gamemaster
          </h1>
          <div className="ornate-divider">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
            </svg>
          </div>
          <p className="text-xl text-parchment-muted font-body italic">
            AI-Powered D&D 5e Companion
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-parchment mb-12 font-body leading-relaxed">
          Your intelligent dungeon master assistant that handles all the mechanical 
          complexity of D&D 5e—dice rolling, combat tracking, and state management—so 
          the AI can focus on what it does best: <em>storytelling</em>.
        </p>

        {/* Main CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link 
            href="/campaigns" 
            className="btn-fantasy text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Begin Your Adventure
          </Link>
          <Link 
            href="/settings" 
            className="btn-mystic text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="parchment-card p-6">
            <div className="text-gold text-2xl mb-3">🎲</div>
            <h3 className="text-lg font-heading text-gold mb-2">Mechanical Precision</h3>
            <p className="text-parchment-muted text-sm font-body">
              All dice rolls handled with true randomness. No AI hallucinations—every 
              attack, check, and save is mechanically accurate.
            </p>
          </div>
          
          <div className="parchment-card p-6">
            <div className="text-gold text-2xl mb-3">⚔️</div>
            <h3 className="text-lg font-heading text-gold mb-2">Combat Tracking</h3>
            <p className="text-parchment-muted text-sm font-body">
              Automatic initiative ordering, HP tracking, condition management, and 
              turn advancement. Focus on the action, not the bookkeeping.
            </p>
          </div>
          
          <div className="parchment-card p-6">
            <div className="text-gold text-2xl mb-3">📜</div>
            <h3 className="text-lg font-heading text-gold mb-2">State Guardian</h3>
            <p className="text-parchment-muted text-sm font-body">
              AI validation ensures the narrative matches the mechanics. The story 
              adapts to the dice, not the other way around.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-parchment-muted text-sm">
        <p>Phase 1 Foundation • Built with Next.js + TypeScript</p>
      </footer>
    </main>
  );
}
