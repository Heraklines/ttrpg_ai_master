// =============================================================================
// ARCANE GAMEMASTER - Core Type Definitions
// Pure TypeScript types with no framework dependencies (portable)
// =============================================================================

// =============================================================================
// D&D 5e CONSTANTS
// =============================================================================

export const ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

export type Ability = (typeof ABILITIES)[number];

export const SKILLS: Record<string, Ability> = {
  acrobatics: 'dexterity',
  'animal handling': 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  'sleight of hand': 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
} as const;

export type Skill = keyof typeof SKILLS;

export const CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'concentrating',
] as const;

export type ConditionType = (typeof CONDITIONS)[number];

export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

export const GAME_MODES = ['exploration', 'combat', 'social', 'rest'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const COMBAT_OUTCOMES = [
  'victory',
  'defeat',
  'fled',
  'negotiated',
] as const;
export type CombatOutcome = (typeof COMBAT_OUTCOMES)[number];

export const REST_TYPES = ['short', 'long'] as const;
export type RestType = (typeof REST_TYPES)[number];

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface DurationType {
  type: 'rounds' | 'untilSave' | 'untilDispelled' | 'untilRest';
  value?: number; // Rounds remaining or save DC
  ability?: Ability; // For saves
  restType?: RestType; // For untilRest
}

// =============================================================================
// CHARACTER TYPES
// =============================================================================

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SpellSlot {
  max: number;
  remaining: number;
}

export interface SpellSlots {
  [level: string]: SpellSlot; // "1", "2", etc.
}

export interface ClassResource {
  name: string;
  max: number;
  current: number;
  rechargesOn: RestType;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  isEquippable?: boolean;
  category?: 'weapon' | 'armor' | 'potion' | 'tool' | 'treasure' | 'other';
}

export interface EquippedItems {
  weapon?: string;
  offhand?: string;
  armor?: string;
  shield?: string;
  [slot: string]: string | undefined;
}

export interface ActiveCondition {
  name: ConditionType;
  source: string;
  duration: DurationType;
}

export interface CharacterFeature {
  name: string;
  description: string;
  source?: string; // e.g., "Fighter 2", "Human"
  usesPerRest?: {
    max: number;
    remaining: number;
    restType: RestType;
  };
}

export interface Character {
  id: string;
  campaignId: string;

  // Core Identity
  name: string;
  race: string;
  characterClass: string;
  subclass?: string;
  level: number;
  background?: string;
  alignment?: string;

  // Ability Scores
  abilityScores: AbilityScores;

  // Combat Stats
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;

  // Hit Dice
  hitDice: {
    type: number; // d6, d8, d10, d12
    total: number;
    remaining: number;
  };

  // Death Saves
  deathSaves: {
    successes: number;
    failures: number;
  };

  // Proficiencies
  proficiencies: {
    savingThrows: Ability[];
    skills: Skill[];
    expertise: Skill[];
  };

  // Spellcasting
  spellcasting?: {
    ability: Ability;
    spellSlots: SpellSlots;
    knownSpells: string[];
    preparedSpells: string[];
  };

  // Resources
  classResources: ClassResource[];

  // Inventory
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  gold: number;

  // Conditions
  conditions: ActiveCondition[];

  // Features
  features: CharacterFeature[];

  // Notes
  backstory?: string;
  notes?: string;
}

// =============================================================================
// COMBAT TYPES
// =============================================================================

export type CombatantType = 'player_character' | 'enemy' | 'ally' | 'neutral';
export type CombatantStatus = 'active' | 'defeated' | 'fled';

export interface TurnResources {
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  movementRemaining: number;
}

export interface Combatant {
  id: string;
  name: string;
  type: CombatantType;

  // Initiative
  initiative: {
    roll: number;
    modifier: number;
    total: number;
  };

  // Combat Stats
  currentHp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;

  // Conditions
  conditions: ActiveCondition[];

  // Status
  status: CombatantStatus;

  // Position (optional, for mini-map)
  position?: Position;

  // Turn Resources
  turnResources: TurnResources;

  // Reference
  sourceId?: string; // Character ID or monster stat block reference
  isPlayer: boolean;
}

export interface Combat {
  id: string;
  round: number;
  initiativeOrder: Combatant[];
  currentTurnIndex: number;
  surprisedCombatantIds: string[];
  environmentalEffects: string[];
  isActive: boolean;
}

// =============================================================================
// MONSTER STAT BLOCK
// =============================================================================

export interface MonsterSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  burrow?: number;
  climb?: number;
}

export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string; // e.g., "2d6+3"
  damageType?: DamageType;
  reach?: number;
  range?: string; // e.g., "30/120"
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterStatBlock {
  name: string;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  type: string;
  alignment: string;

  armorClass: number;
  hitPoints: number;
  hitDice: string; // e.g., "2d8+2"
  speed: MonsterSpeed;

  abilityScores: AbilityScores;

  // Overrides for calculated values
  savingThrows?: Partial<Record<Ability, number>>;
  skills?: Record<string, number>;

  // Resistances and Immunities
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  damageVulnerabilities?: DamageType[];
  conditionImmunities?: ConditionType[];

  // Senses and Languages
  senses?: string[];
  languages?: string[];

  // Challenge Rating
  challengeRating: number | string; // Can be "1/4", "1/2", etc.
  xp: number;

  // Abilities
  traits?: MonsterTrait[];
  actions: MonsterAction[];
  legendaryActions?: MonsterAction[];
  reactions?: MonsterAction[];
}

// =============================================================================
// DICE ROLL RESULT TYPES
// =============================================================================

export interface BasicRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason?: string;
}

export interface AbilityCheckResult {
  characterId: string;
  characterName: string;
  ability: Ability;
  skill?: Skill;
  roll: number;
  modifier: number;
  proficiencyBonus: number;
  total: number;
  dc: number;
  success: boolean;
  isCriticalSuccess: boolean; // Natural 20
  isCriticalFailure: boolean; // Natural 1
  hadAdvantage: boolean;
  hadDisadvantage: boolean;
}

export interface AttackRollResult {
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  weapon: string;
  roll: number;
  attackBonus: number;
  total: number;
  targetAC: number;
  hits: boolean;
  isCriticalHit: boolean;
  isCriticalMiss: boolean;
  hadAdvantage: boolean;
  hadDisadvantage: boolean;
}

export interface DamageSource {
  dice: string;
  type: DamageType;
  source: string;
}

export interface DamageRollResult {
  rolls: number[];
  modifier: number;
  baseDamage: number;
  damageType: DamageType;
  additionalDamage: DamageSource[];
  totalDamage: number;
  isCritical: boolean;
}

export interface SavingThrowResult {
  characterId: string;
  characterName: string;
  ability: Ability;
  roll: number;
  modifier: number;
  proficiencyBonus: number;
  total: number;
  dc: number;
  success: boolean;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  hadAdvantage: boolean;
  hadDisadvantage: boolean;
}

export interface InitiativeResult {
  combatantId: string;
  combatantName: string;
  roll: number;
  modifier: number;
  total: number;
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

export interface GameTime {
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
}

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  objectives?: string[];
  rewards?: string[];
}

export interface KnownNpc {
  id: string;
  name: string;
  description?: string;
  location?: string;
  disposition?: 'friendly' | 'neutral' | 'hostile';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: number;
  functionName?: string;
  functionResult?: unknown;
}

export interface GameState {
  campaignId: string;
  mode: GameMode;

  // Location
  currentLocationId?: string;
  exploredLocations: string[];

  // Time
  time: GameTime;

  // Combat
  activeCombat?: Combat;

  // Progress
  flags: Record<string, unknown>;
  activeQuests: Quest[];
  completedQuests: Quest[];
  knownNpcs: KnownNpc[];

  // Context
  recentMessages: Message[];
}

// =============================================================================
// FUNCTION EXECUTION TYPES
// =============================================================================

export type StateUpdateType =
  | 'combat_started'
  | 'combat_updated'
  | 'combat_ended'
  | 'mode_changed'
  | 'location_changed'
  | 'flag_updated'
  | 'time_advanced';

export interface StateUpdate {
  type: StateUpdateType;
  data: unknown;
}

export interface CharacterUpdate {
  characterId: string;
  updates: Partial<Character>;
}

export interface FunctionResult<T = unknown> {
  success: boolean;
  data?: T;
  displayText: string;
  stateUpdate?: StateUpdate;
  characterUpdate?: CharacterUpdate;
  error?: string;
}

// =============================================================================
// ADVANTAGE STATUS
// =============================================================================

export type AdvantageStatus = 'advantage' | 'disadvantage' | 'normal';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate ability modifier from score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus from level
 */
export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/**
 * Get time period from hour
 */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

/**
 * Format time as string
 */
export function formatGameTime(time: GameTime): string {
  const hourStr = time.hour.toString().padStart(2, '0');
  const minuteStr = time.minute.toString().padStart(2, '0');
  return `Day ${time.day}, ${hourStr}:${minuteStr}`;
}

/**
 * Check if character is bloodied (at or below 50% HP)
 */
export function isBloodied(currentHp: number, maxHp: number): boolean {
  return currentHp <= maxHp / 2;
}

/**
 * Check if character is at death's door (unconscious at 0 HP)
 */
export function isAtDeathsDoor(currentHp: number): boolean {
  return currentHp <= 0;
}

/**
 * Get HP percentage for display
 */
export function getHpPercentage(currentHp: number, maxHp: number): number {
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
}

/**
 * Get HP status category
 */
export function getHpStatus(
  currentHp: number,
  maxHp: number
): 'high' | 'medium' | 'low' {
  const percentage = getHpPercentage(currentHp, maxHp);
  if (percentage > 50) return 'high';
  if (percentage > 25) return 'medium';
  return 'low';
}
