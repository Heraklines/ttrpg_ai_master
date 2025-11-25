'use client';

import Link from 'next/link';

// Placeholder data for demonstration
const placeholderCampaigns = [
  {
    id: '1',
    name: 'Lost Mine of Phandelver',
    description: 'A classic adventure in the Sword Coast',
    lastPlayed: '2024-01-15',
    characters: ['Thorin Ironforge', 'Elena Starweaver'],
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    description: 'Gothic horror in the mists of Barovia',
    lastPlayed: '2024-01-10',
    characters: ['Varis Shadowmend', 'Mira Dawnbringer'],
  },
];

export default function CampaignsPage() {
  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/" 
              className="text-parchment-muted hover:text-gold transition-colors text-sm mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-heading text-gold">Your Campaigns</h1>
          </div>
          <button className="btn-fantasy inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </button>
        </div>

        {/* Campaign List */}
        <div className="space-y-4">
          {placeholderCampaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="parchment-card p-6 hover:glow-gold transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-heading text-gold mb-1">
                    {campaign.name}
                  </h2>
                  <p className="text-parchment-muted text-sm mb-3">
                    {campaign.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-parchment-muted">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {campaign.characters.length} characters
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last played: {campaign.lastPlayed}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="btn-fantasy px-4 py-2 text-sm">
                    Continue
                  </button>
                  <button className="btn-mystic px-4 py-2 text-sm">
                    Manage
                  </button>
                </div>
              </div>
              
              {/* Character Preview */}
              <div className="mt-4 pt-4 border-t border-gold-dark/30">
                <p className="text-xs text-parchment-muted mb-2">Party Members:</p>
                <div className="flex gap-2 flex-wrap">
                  {campaign.characters.map((char) => (
                    <span 
                      key={char}
                      className="px-3 py-1 bg-surface rounded-full text-sm text-parchment"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (shown when no campaigns) */}
        {placeholderCampaigns.length === 0 && (
          <div className="parchment-card p-12 text-center">
            <div className="text-gold text-4xl mb-4">📖</div>
            <h2 className="text-xl font-heading text-gold mb-2">No Campaigns Yet</h2>
            <p className="text-parchment-muted mb-6">
              Begin your journey by creating your first campaign.
            </p>
            <button className="btn-fantasy">
              Create Your First Campaign
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-mystic-dark/20 border border-mystic/30 rounded-lg">
          <p className="text-sm text-parchment-muted">
            <strong className="text-mystic-light">Phase 1 Status:</strong> This is a placeholder page. 
            Campaign creation and management will be implemented in Phase 3.
          </p>
        </div>
      </div>
    </main>
  );
}
