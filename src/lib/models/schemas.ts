// =============================================================================
// ARCANE GAMEMASTER - Zod Validation Schemas
// Runtime validation for game state and API payloads
// =============================================================================

import { z } from 'zod';
import {
  ABILITIES,
  SKILLS,
  CONDITIONS,
  DAMAGE_TYPES,
  GAME_MODES,
  COMBAT_OUTCOMES,
  REST_TYPES,
} from './types';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const AbilitySchema = z.enum(ABILITIES);
export const SkillSchema = z.enum(Object.keys(SKILLS) as [string, ...string[]]);
export const ConditionTypeSchema = z.enum(CONDITIONS);
export const DamageTypeSchema = z.enum(DAMAGE_TYPES);
export const GameModeSchema = z.enum(GAME_MODES);
export const CombatOutcomeSchema = z.enum(COMBAT_OUTCOMES);
export const RestTypeSchema = z.enum(REST_TYPES);
export const AdvantageStatusSchema = z.enum([
  'advantage',
  'disadvantage',
  'normal',
]);

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const DurationTypeSchema = z.object({
  type: z.enum(['rounds', 'untilSave', 'untilDispelled', 'untilRest']),
  value: z.number().optional(),
  ability: AbilitySchema.optional(),
  restType: RestTypeSchema.optional(),
});

// =============================================================================
// CHARACTER SCHEMAS
// =============================================================================

export const AbilityScoresSchema = z.object({
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
});

export const SpellSlotSchema = z.object({
  max: z.number().min(0),
  remaining: z.number().min(0),
});

export const SpellSlotsSchema = z.record(z.string(), SpellSlotSchema);

export const ClassResourceSchema = z.object({
  name: z.string(),
  max: z.number().min(0),
  current: z.number().min(0),
  rechargesOn: RestTypeSchema,
});

export const InventoryItemSchema = z.object({
  name: z.string(),
  quantity: z.number().min(0),
  weight: z.number().optional(),
  description: z.string().optional(),
  isEquippable: z.boolean().optional(),
  category: z
    .enum(['weapon', 'armor', 'potion', 'tool', 'treasure', 'other'])
    .optional(),
});

export const EquippedItemsSchema = z.record(z.string(), z.string().optional());

export const ActiveConditionSchema = z.object({
  name: ConditionTypeSchema,
  source: z.string(),
  duration: DurationTypeSchema,
});

export const CharacterFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string().optional(),
  usesPerRest: z
    .object({
      max: z.number().min(0),
      remaining: z.number().min(0),
      restType: RestTypeSchema,
    })
    .optional(),
});

export const SpellcastingSchema = z.object({
  ability: AbilitySchema,
  spellSlots: SpellSlotsSchema,
  knownSpells: z.array(z.string()),
  preparedSpells: z.array(z.string()),
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),

  // Core Identity
  name: z.string().min(1),
  race: z.string().min(1),
  characterClass: z.string().min(1),
  subclass: z.string().optional(),
  level: z.number().min(1).max(20),
  background: z.string().optional(),
  alignment: z.string().optional(),

  // Ability Scores
  abilityScores: AbilityScoresSchema,

  // Combat Stats
  maxHp: z.number().min(1),
  currentHp: z.number(),
  tempHp: z.number().min(0),
  armorClass: z.number().min(1),
  speed: z.number().min(0),

  // Hit Dice
  hitDice: z.object({
    type: z.number(),
    total: z.number().min(1),
    remaining: z.number().min(0),
  }),

  // Death Saves
  deathSaves: z.object({
    successes: z.number().min(0).max(3),
    failures: z.number().min(0).max(3),
  }),

  // Proficiencies
  proficiencies: z.object({
    savingThrows: z.array(AbilitySchema),
    skills: z.array(SkillSchema),
    expertise: z.array(SkillSchema),
  }),

  // Spellcasting
  spellcasting: SpellcastingSchema.optional(),

  // Resources
  classResources: z.array(ClassResourceSchema),

  // Inventory
  inventory: z.array(InventoryItemSchema),
  equippedItems: EquippedItemsSchema,
  gold: z.number().min(0),

  // Conditions
  conditions: z.array(ActiveConditionSchema),

  // Features
  features: z.array(CharacterFeatureSchema),

  // Notes
  backstory: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// COMBAT SCHEMAS
// =============================================================================

export const CombatantTypeSchema = z.enum([
  'player_character',
  'enemy',
  'ally',
  'neutral',
]);
export const CombatantStatusSchema = z.enum(['active', 'defeated', 'fled']);

export const TurnResourcesSchema = z.object({
  hasAction: z.boolean(),
  hasBonusAction: z.boolean(),
  hasReaction: z.boolean(),
  movementRemaining: z.number().min(0),
});

export const InitiativeSchema = z.object({
  roll: z.number().min(1).max(20),
  modifier: z.number(),
  total: z.number(),
});

export const CombatantSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CombatantTypeSchema,
  initiative: InitiativeSchema,
  currentHp: z.number(),
  maxHp: z.number().min(1),
  tempHp: z.number().min(0),
  armorClass: z.number().min(1),
  speed: z.number().min(0),
  conditions: z.array(ActiveConditionSchema),
  status: CombatantStatusSchema,
  position: PositionSchema.optional(),
  turnResources: TurnResourcesSchema,
  sourceId: z.string().optional(),
  isPlayer: z.boolean(),
});

export const CombatSchema = z.object({
  id: z.string().uuid(),
  round: z.number().min(1),
  initiativeOrder: z.array(CombatantSchema),
  currentTurnIndex: z.number().min(0),
  surprisedCombatantIds: z.array(z.string()),
  environmentalEffects: z.array(z.string()),
  isActive: z.boolean(),
});

// =============================================================================
// MONSTER SCHEMAS
// =============================================================================

export const MonsterSpeedSchema = z.object({
  walk: z.number().min(0),
  fly: z.number().min(0).optional(),
  swim: z.number().min(0).optional(),
  burrow: z.number().min(0).optional(),
  climb: z.number().min(0).optional(),
});

export const MonsterActionSchema = z.object({
  name: z.string(),
  description: z.string(),
  attackBonus: z.number().optional(),
  damage: z.string().optional(),
  damageType: DamageTypeSchema.optional(),
  reach: z.number().optional(),
  range: z.string().optional(),
});

export const MonsterTraitSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const MonsterStatBlockSchema = z.object({
  name: z.string(),
  size: z.enum(['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']),
  type: z.string(),
  alignment: z.string(),
  armorClass: z.number().min(1),
  hitPoints: z.number().min(1),
  hitDice: z.string(),
  speed: MonsterSpeedSchema,
  abilityScores: AbilityScoresSchema,
  savingThrows: z.record(AbilitySchema, z.number()).optional(),
  skills: z.record(z.string(), z.number()).optional(),
  damageResistances: z.array(DamageTypeSchema).optional(),
  damageImmunities: z.array(DamageTypeSchema).optional(),
  damageVulnerabilities: z.array(DamageTypeSchema).optional(),
  conditionImmunities: z.array(ConditionTypeSchema).optional(),
  senses: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  challengeRating: z.union([z.number(), z.string()]),
  xp: z.number().min(0),
  traits: z.array(MonsterTraitSchema).optional(),
  actions: z.array(MonsterActionSchema),
  legendaryActions: z.array(MonsterActionSchema).optional(),
  reactions: z.array(MonsterActionSchema).optional(),
});

// =============================================================================
// DICE ROLL RESULT SCHEMAS
// =============================================================================

export const BasicRollResultSchema = z.object({
  notation: z.string(),
  rolls: z.array(z.number()),
  modifier: z.number(),
  total: z.number(),
  reason: z.string().optional(),
});

export const AbilityCheckResultSchema = z.object({
  characterId: z.string(),
  characterName: z.string(),
  ability: AbilitySchema,
  skill: SkillSchema.optional(),
  roll: z.number().min(1).max(20),
  modifier: z.number(),
  proficiencyBonus: z.number(),
  total: z.number(),
  dc: z.number(),
  success: z.boolean(),
  isCriticalSuccess: z.boolean(),
  isCriticalFailure: z.boolean(),
  hadAdvantage: z.boolean(),
  hadDisadvantage: z.boolean(),
});

export const AttackRollResultSchema = z.object({
  attackerId: z.string(),
  attackerName: z.string(),
  targetId: z.string(),
  targetName: z.string(),
  weapon: z.string(),
  roll: z.number().min(1).max(20),
  attackBonus: z.number(),
  total: z.number(),
  targetAC: z.number(),
  hits: z.boolean(),
  isCriticalHit: z.boolean(),
  isCriticalMiss: z.boolean(),
  hadAdvantage: z.boolean(),
  hadDisadvantage: z.boolean(),
});

export const DamageSourceSchema = z.object({
  dice: z.string(),
  type: DamageTypeSchema,
  source: z.string(),
});

export const DamageRollResultSchema = z.object({
  rolls: z.array(z.number()),
  modifier: z.number(),
  baseDamage: z.number(),
  damageType: DamageTypeSchema,
  additionalDamage: z.array(DamageSourceSchema),
  totalDamage: z.number(),
  isCritical: z.boolean(),
});

export const SavingThrowResultSchema = z.object({
  characterId: z.string(),
  characterName: z.string(),
  ability: AbilitySchema,
  roll: z.number().min(1).max(20),
  modifier: z.number(),
  proficiencyBonus: z.number(),
  total: z.number(),
  dc: z.number(),
  success: z.boolean(),
  isCriticalSuccess: z.boolean(),
  isCriticalFailure: z.boolean(),
  hadAdvantage: z.boolean(),
  hadDisadvantage: z.boolean(),
});

export const InitiativeResultSchema = z.object({
  combatantId: z.string(),
  combatantName: z.string(),
  roll: z.number().min(1).max(20),
  modifier: z.number(),
  total: z.number(),
});

// =============================================================================
// GAME STATE SCHEMAS
// =============================================================================

export const GameTimeSchema = z.object({
  day: z.number().min(1),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

export const QuestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  rewards: z.array(z.string()).optional(),
});

export const KnownNpcSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  disposition: z.enum(['friendly', 'neutral', 'hostile']).optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'function']),
  content: z.string(),
  timestamp: z.number(),
  functionName: z.string().optional(),
  functionResult: z.unknown().optional(),
});

export const GameStateSchema = z.object({
  campaignId: z.string().uuid(),
  mode: GameModeSchema,
  currentLocationId: z.string().optional(),
  exploredLocations: z.array(z.string()),
  time: GameTimeSchema,
  activeCombat: CombatSchema.optional(),
  flags: z.record(z.string(), z.unknown()),
  activeQuests: z.array(QuestSchema),
  completedQuests: z.array(QuestSchema),
  knownNpcs: z.array(KnownNpcSchema),
  recentMessages: z.array(MessageSchema),
});

// =============================================================================
// API REQUEST SCHEMAS
// =============================================================================

export const CreateCampaignRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

export const CreateCharacterRequestSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(50),
  race: z.string().min(1),
  characterClass: z.string().min(1),
  level: z.number().min(1).max(20).default(1),
  background: z.string().optional(),
  abilityScores: AbilityScoresSchema,
});

export const AdventureActionRequestSchema = z.object({
  campaignId: z.string().uuid(),
  playerInput: z.string().min(1).max(2000),
});

export const DiceRollRequestSchema = z.object({
  notation: z.string().min(1),
  reason: z.string().optional(),
});

export const StartCombatRequestSchema = z.object({
  campaignId: z.string().uuid(),
  enemyIds: z.array(z.string()),
  allyIds: z.array(z.string()).optional(),
  surprisedIds: z.array(z.string()).optional(),
});

export const EndCombatRequestSchema = z.object({
  campaignId: z.string().uuid(),
  outcome: CombatOutcomeSchema,
});

// =============================================================================
// TYPE EXPORTS FROM SCHEMAS
// =============================================================================

export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;
export type CreateCharacterRequest = z.infer<
  typeof CreateCharacterRequestSchema
>;
export type AdventureActionRequest = z.infer<
  typeof AdventureActionRequestSchema
>;
export type DiceRollRequest = z.infer<typeof DiceRollRequestSchema>;
export type StartCombatRequest = z.infer<typeof StartCombatRequestSchema>;
export type EndCombatRequest = z.infer<typeof EndCombatRequestSchema>;
