# Arcane Gamemaster

## Project Overview
- **Name**: Arcane Gamemaster
- **Goal**: AI-Powered D&D 5e Companion Application that handles all mechanical aspects of D&D, allowing the AI to focus purely on storytelling, roleplay, and improvisation.
- **Features**: 
  - Complete dice rolling mechanics with D&D 5e support
  - Combat engine with initiative tracking, turn management, HP/damage
  - State Guardian system for AI validation (Phase 2)
  - Fantasy-themed UI with medieval aesthetic

## Current Phase: Phase 1 - Foundation

### Completed Features
- [x] Next.js 14 project with TypeScript (strict mode)
- [x] Tailwind CSS with complete fantasy theme (gold, burgundy, mystic blue palette)
- [x] Prisma ORM with SQLite database schema
- [x] Complete TypeScript type definitions for D&D 5e
- [x] **DiceEngine** with full test coverage (56 tests)
  - Dice notation parsing (2d6+3, 4d6kh3, etc.)
  - Ability checks with proficiency/expertise
  - Attack rolls with advantage/disadvantage
  - Damage rolls with critical hit doubling
  - Saving throws
  - Initiative rolling and sorting
  - Death saving throws
  - Ability score generation (4d6 drop lowest)
- [x] **CombatEngine** with full test coverage (50 tests)
  - Combat initialization with mixed combatants
  - Turn management with round tracking
  - Damage/healing application
  - Condition management
  - Resource tracking (actions, bonus actions, reactions, movement)
  - Combat end detection
  - Environmental effects
- [x] Basic page layouts (Home, Campaigns, Settings)

### Data Architecture
- **Data Models**: Character, Combat, Combatant, Monster StatBlock, GameState
- **Storage Services**: SQLite (dev) / PostgreSQL (prod) via Prisma
- **Data Flow**: 
  1. User action → API route
  2. State Guardian injects context
  3. AI Orchestrator processes with Gemini
  4. Function Executor runs game engine methods
  5. State Guardian validates response
  6. Updated state persisted to database

## Project Structure

```
arcane-gamemaster/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── campaigns/          # Campaign management
│   │   ├── settings/           # User settings
│   │   ├── globals.css         # Fantasy theme styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components (Phase 3)
│   │   ├── ui/                 # Base UI components
│   │   ├── game/               # Game-specific components
│   │   └── character/          # Character sheet components
│   ├── lib/
│   │   ├── engine/             # Game engines (portable, no framework deps)
│   │   │   ├── DiceEngine.ts   # All dice rolling mechanics
│   │   │   ├── CombatEngine.ts # Combat state management
│   │   │   └── *.test.ts       # Test files
│   │   ├── models/             # TypeScript types and Zod schemas
│   │   │   ├── types.ts        # Core type definitions
│   │   │   └── schemas.ts      # Zod validation schemas
│   │   ├── ai/                 # AI orchestration (Phase 2)
│   │   └── db/                 # Database utilities
│   ├── stores/                 # Zustand stores (Phase 3)
│   └── test/                   # Test setup
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
└── package.json
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage

# Database
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Create migration
npm run db:studio     # Open Prisma Studio
```

## User Guide

### Getting Started
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run db:push` to set up the database
4. Run `npm run dev` to start the development server
5. Open `http://localhost:3000` in your browser

### Current UI (Phase 1)
- **Home Page**: Introduction and navigation
- **Campaigns Page**: Placeholder for campaign list
- **Settings Page**: Placeholder for configuration

## Upcoming Phases

### Phase 2: AI Integration (Week 3-4)
- Gemini API integration
- Function calling system
- State Guardian (context injection + validation)
- AI Orchestrator
- `/api/adventure/action` endpoint

### Phase 3: Core UI (Week 5-6)
- Adventure screen with narrative display
- Combat overlay with initiative tracker
- Character sheet components
- Action input system

### Phase 4: Polish & Features (Week 7-8)
- Character creation wizard
- Full character management
- Session logging
- Responsive design

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ | App Router, API routes |
| Language | TypeScript | Type safety |
| AI | Gemini API | Language model |
| Database | SQLite/PostgreSQL | Data persistence |
| ORM | Prisma | Type-safe queries |
| State | Zustand | Client state |
| Styling | Tailwind CSS | Utility-first CSS |
| Validation | Zod | Runtime validation |
| Testing | Vitest | Unit/integration tests |

## Key Innovation: State Guardian

The State Guardian is a bidirectional validation system that ensures mechanical consistency:

1. **PRE-RESPONSE (Context Injection)**: Before every AI response, inject structured game state so the AI always knows the current truth.

2. **POST-RESPONSE (Validation)**: After every AI response, scan for mechanical claims and verify appropriate functions were called.

This creates a feedback loop that ensures mechanical consistency while preserving narrative freedom.

## License

Private - All rights reserved

## Last Updated

2025-01-25 - Phase 1 Foundation Complete
