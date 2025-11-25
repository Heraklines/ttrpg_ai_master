// =============================================================================
// ARCANE GAMEMASTER - Combat Engine Tests
// Comprehensive test coverage for combat mechanics
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CombatEngine,
  createCombatantFromCharacter,
  createCombatantFromMonster,
} from './CombatEngine';
import {
  Character,
  MonsterStatBlock,
  Combat,
  ActiveCondition,
} from '../models/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockCharacter(
  overrides: Partial<Character> = {}
): Character {
  return {
    id: 'char-' + Math.random().toString(36).slice(2, 10),
    campaignId: 'camp-456',
    name: 'Test Hero',
    race: 'Human',
    characterClass: 'Fighter',
    level: 5,
    abilityScores: {
      strength: 16,
      dexterity: 14, // +2 initiative
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    maxHp: 45,
    currentHp: 45,
    tempHp: 0,
    armorClass: 18,
    speed: 30,
    hitDice: { type: 10, total: 5, remaining: 5 },
    deathSaves: { successes: 0, failures: 0 },
    proficiencies: {
      savingThrows: ['strength', 'constitution'],
      skills: ['athletics', 'perception'],
      expertise: [],
    },
    classResources: [],
    inventory: [],
    equippedItems: {},
    gold: 100,
    conditions: [],
    features: [],
    ...overrides,
  };
}

function createMockMonster(
  overrides: Partial<MonsterStatBlock> = {}
): MonsterStatBlock {
  return {
    name: 'Goblin',
    size: 'Small',
    type: 'humanoid',
    alignment: 'neutral evil',
    armorClass: 15,
    hitPoints: 7,
    hitDice: '2d6',
    speed: { walk: 30 },
    abilityScores: {
      strength: 8,
      dexterity: 14, // +2
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8,
    },
    challengeRating: '1/4',
    xp: 50,
    actions: [
      {
        name: 'Scimitar',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target.',
        attackBonus: 4,
        damage: '1d6+2',
        damageType: 'slashing',
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// COMBAT INITIALIZATION TESTS
// =============================================================================

describe('CombatEngine.startCombat', () => {
  it('should create combat with all combatants', () => {
    const characters = [
      createMockCharacter({ id: 'char-1', name: 'Fighter' }),
      createMockCharacter({ id: 'char-2', name: 'Wizard' }),
    ];
    const monsters = [createMockMonster(), createMockMonster()];

    const combat = CombatEngine.startCombat(characters, monsters);

    expect(combat.id).toBeDefined();
    expect(combat.round).toBe(1);
    expect(combat.isActive).toBe(true);
    expect(combat.initiativeOrder).toHaveLength(4);
    expect(combat.currentTurnIndex).toBe(0);
  });

  it('should sort by initiative (highest first)', () => {
    const characters = [createMockCharacter({ name: 'Hero' })];
    const monsters = [createMockMonster()];

    const combat = CombatEngine.startCombat(characters, monsters);

    // Verify sorted by total descending
    for (let i = 0; i < combat.initiativeOrder.length - 1; i++) {
      expect(combat.initiativeOrder[i].initiative.total).toBeGreaterThanOrEqual(
        combat.initiativeOrder[i + 1].initiative.total
      );
    }
  });

  it('should mark player characters correctly', () => {
    const characters = [createMockCharacter()];
    const monsters = [createMockMonster()];

    const combat = CombatEngine.startCombat(characters, monsters);

    const playerCombatant = combat.initiativeOrder.find((c) => c.isPlayer);
    const enemyCombatant = combat.initiativeOrder.find(
      (c) => c.type === 'enemy'
    );

    expect(playerCombatant).toBeDefined();
    expect(playerCombatant?.type).toBe('player_character');
    expect(enemyCombatant).toBeDefined();
    expect(enemyCombatant?.isPlayer).toBe(false);
  });

  it('should handle surprise correctly', () => {
    const characters = [createMockCharacter({ id: 'hero-1' })];
    const monsters = [createMockMonster()];

    const combat = CombatEngine.startCombat(characters, monsters, {
      surprisedIds: ['hero-1'],
    });

    expect(combat.surprisedCombatantIds).toContain('hero-1');
  });

  it('should include ally monsters', () => {
    const characters = [createMockCharacter()];
    const enemies = [createMockMonster({ name: 'Enemy Goblin' })];
    const allies = [createMockMonster({ name: 'Friendly Wolf' })];

    const combat = CombatEngine.startCombat(characters, enemies, {
      allyMonsters: allies,
    });

    const allyCombatant = combat.initiativeOrder.find((c) => c.type === 'ally');
    expect(allyCombatant).toBeDefined();
    expect(allyCombatant?.name).toContain('Friendly Wolf');
  });

  it('should number duplicate monsters', () => {
    const characters = [createMockCharacter()];
    const monsters = [
      createMockMonster({ name: 'Goblin' }),
      createMockMonster({ name: 'Goblin' }),
      createMockMonster({ name: 'Goblin' }),
    ];

    const combat = CombatEngine.startCombat(characters, monsters);

    const goblins = combat.initiativeOrder.filter(
      (c) => c.name.includes('Goblin') && c.type === 'enemy'
    );
    expect(goblins).toHaveLength(3);
  });
});

// =============================================================================
// TURN MANAGEMENT TESTS
// =============================================================================

describe('CombatEngine.nextTurn', () => {
  let combat: Combat;

  beforeEach(() => {
    const characters = [
      createMockCharacter({ id: 'hero-1', name: 'Hero 1' }),
      createMockCharacter({ id: 'hero-2', name: 'Hero 2' }),
    ];
    const monsters = [createMockMonster({ name: 'Goblin' })];
    combat = CombatEngine.startCombat(characters, monsters);
  });

  it('should advance to next combatant', () => {
    const initialIndex = combat.currentTurnIndex;
    const updatedCombat = CombatEngine.nextTurn(combat);

    expect(updatedCombat.currentTurnIndex).not.toBe(initialIndex);
  });

  it('should reset turn resources for new combatant', () => {
    // Use action on current combatant
    combat = CombatEngine.useAction(
      combat,
      combat.initiativeOrder[combat.currentTurnIndex].id
    );

    // Move to next turn
    const updatedCombat = CombatEngine.nextTurn(combat);

    // New combatant should have fresh resources
    const currentCombatant =
      updatedCombat.initiativeOrder[updatedCombat.currentTurnIndex];
    expect(currentCombatant.turnResources.hasAction).toBe(true);
  });

  it('should skip defeated combatants', () => {
    // Defeat first combatant
    const firstId = combat.initiativeOrder[0].id;
    const { combat: damagedCombat } = CombatEngine.applyDamage(
      combat,
      firstId,
      1000, // Massive damage
      'slashing',
      'test'
    );

    // If first combatant was enemy and is now defeated, nextTurn should skip them
    if (damagedCombat.initiativeOrder[0].type === 'enemy') {
      const updatedCombat = CombatEngine.nextTurn(damagedCombat);
      const current = CombatEngine.getCurrentCombatant(updatedCombat);
      expect(current?.status).toBe('active');
    }
  });

  it('should increment round when wrapping around', () => {
    let testCombat = combat;
    const combatantCount = combat.initiativeOrder.length;

    // First call advances from index 0 to 1
    // After (combatantCount) calls, we should wrap back to start
    // Round increments when we go from last combatant back to first
    for (let i = 0; i < combatantCount; i++) {
      testCombat = CombatEngine.nextTurn(testCombat);
    }

    // After going through all combatants, we should be back at index 0
    // and round should have incremented
    expect(testCombat.currentTurnIndex).toBe(0);
    expect(testCombat.round).toBe(2);
  });

  it('should skip surprised combatants in round 1', () => {
    const characters = [createMockCharacter({ id: 'surprised-hero' })];
    const monsters = [createMockMonster()];

    let surprisedCombat = CombatEngine.startCombat(characters, monsters, {
      surprisedIds: ['surprised-hero'],
    });

    // If the surprised hero is first, they should be skipped
    const firstCombatant = surprisedCombat.initiativeOrder[0];
    if (firstCombatant.id === 'surprised-hero') {
      surprisedCombat = CombatEngine.nextTurn(surprisedCombat);
      const current = CombatEngine.getCurrentCombatant(surprisedCombat);
      expect(current?.id).not.toBe('surprised-hero');
    }
  });
});

describe('CombatEngine.getCurrentCombatant', () => {
  it('should return current combatant', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );

    const current = CombatEngine.getCurrentCombatant(combat);

    expect(current).toBeDefined();
    expect(current).toBe(combat.initiativeOrder[combat.currentTurnIndex]);
  });

  it('should return null for inactive combat', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );
    combat = { ...combat, isActive: false };

    const current = CombatEngine.getCurrentCombatant(combat);

    expect(current).toBeNull();
  });
});

// =============================================================================
// DAMAGE AND HEALING TESTS
// =============================================================================

describe('CombatEngine.applyDamage', () => {
  let combat: Combat;
  let targetId: string;

  beforeEach(() => {
    combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero', currentHp: 45, maxHp: 45 })],
      [createMockMonster()]
    );
    targetId = 'hero';
  });

  it('should reduce HP correctly', () => {
    const { combat: updatedCombat, actualDamage } = CombatEngine.applyDamage(
      combat,
      targetId,
      10,
      'slashing',
      'sword'
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.currentHp).toBe(35);
    expect(actualDamage).toBe(10);
  });

  it('should not reduce HP below 0', () => {
    const { combat: updatedCombat } = CombatEngine.applyDamage(
      combat,
      targetId,
      1000,
      'slashing',
      'massive hit'
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.currentHp).toBe(0);
  });

  it('should deplete temp HP first', () => {
    // Add temp HP
    combat = CombatEngine.addTempHp(combat, targetId, 10);

    const { combat: updatedCombat, actualDamage } = CombatEngine.applyDamage(
      combat,
      targetId,
      15,
      'slashing',
      'hit'
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.tempHp).toBe(0);
    expect(target?.currentHp).toBe(40); // 45 - (15 - 10)
    expect(actualDamage).toBe(15);
  });

  it('should mark players as downed at 0 HP', () => {
    const { combat: updatedCombat, wasDowned } = CombatEngine.applyDamage(
      combat,
      targetId,
      45,
      'slashing',
      'knockout'
    );

    expect(wasDowned).toBe(true);
    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.conditions.some((c) => c.name === 'unconscious')).toBe(true);
  });

  it('should mark monsters as defeated at 0 HP', () => {
    const enemyId = combat.initiativeOrder.find((c) => c.type === 'enemy')?.id!;

    const { combat: updatedCombat } = CombatEngine.applyDamage(
      combat,
      enemyId,
      1000,
      'slashing',
      'fatal hit'
    );

    const target = CombatEngine.getCombatant(updatedCombat, enemyId);
    expect(target?.status).toBe('defeated');
  });

  it('should throw for invalid target', () => {
    expect(() =>
      CombatEngine.applyDamage(combat, 'invalid-id', 10, 'slashing', 'test')
    ).toThrow('Combatant not found');
  });
});

describe('CombatEngine.applyHealing', () => {
  let combat: Combat;
  let targetId: string;

  beforeEach(() => {
    combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero', currentHp: 20, maxHp: 45 })],
      [createMockMonster()]
    );
    targetId = 'hero';
  });

  it('should increase HP correctly', () => {
    const { combat: updatedCombat, actualHealing } = CombatEngine.applyHealing(
      combat,
      targetId,
      10,
      'potion'
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.currentHp).toBe(30);
    expect(actualHealing).toBe(10);
  });

  it('should not exceed max HP', () => {
    const { combat: updatedCombat, actualHealing } = CombatEngine.applyHealing(
      combat,
      targetId,
      100,
      'mega heal'
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.currentHp).toBe(45);
    expect(actualHealing).toBe(25); // 45 - 20
  });

  it('should revive unconscious characters', () => {
    // First knock them out
    const { combat: downedCombat } = CombatEngine.applyDamage(
      combat,
      targetId,
      20,
      'slashing',
      'knockout'
    );

    // Then heal
    const { combat: healedCombat, wasRevived } = CombatEngine.applyHealing(
      downedCombat,
      targetId,
      5,
      'cure wounds'
    );

    expect(wasRevived).toBe(true);
    const target = CombatEngine.getCombatant(healedCombat, targetId);
    expect(target?.conditions.some((c) => c.name === 'unconscious')).toBe(false);
    expect(target?.status).toBe('active');
  });
});

// =============================================================================
// CONDITION MANAGEMENT TESTS
// =============================================================================

describe('CombatEngine.addCondition', () => {
  let combat: Combat;
  let targetId: string;

  beforeEach(() => {
    combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );
    targetId = 'hero';
  });

  it('should add a condition', () => {
    const condition: ActiveCondition = {
      name: 'poisoned',
      source: 'spider bite',
      duration: { type: 'rounds', value: 3 },
    };

    const updatedCombat = CombatEngine.addCondition(
      combat,
      targetId,
      condition
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.conditions).toHaveLength(1);
    expect(target?.conditions[0].name).toBe('poisoned');
  });

  it('should not stack duplicate conditions', () => {
    const condition: ActiveCondition = {
      name: 'poisoned',
      source: 'spider bite',
      duration: { type: 'rounds', value: 3 },
    };

    let updatedCombat = CombatEngine.addCondition(combat, targetId, condition);
    updatedCombat = CombatEngine.addCondition(
      updatedCombat,
      targetId,
      condition
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(
      target?.conditions.filter((c) => c.name === 'poisoned')
    ).toHaveLength(1);
  });

  it('should update duration if new is longer', () => {
    const shortCondition: ActiveCondition = {
      name: 'frightened',
      source: 'spell',
      duration: { type: 'rounds', value: 1 },
    };
    const longCondition: ActiveCondition = {
      name: 'frightened',
      source: 'spell',
      duration: { type: 'rounds', value: 5 },
    };

    let updatedCombat = CombatEngine.addCondition(
      combat,
      targetId,
      shortCondition
    );
    updatedCombat = CombatEngine.addCondition(
      updatedCombat,
      targetId,
      longCondition
    );

    const target = CombatEngine.getCombatant(updatedCombat, targetId);
    expect(target?.conditions[0].duration.value).toBe(5);
  });
});

describe('CombatEngine.removeCondition', () => {
  it('should remove a condition', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    // Add condition
    combat = CombatEngine.addCondition(combat, 'hero', {
      name: 'poisoned',
      source: 'test',
      duration: { type: 'rounds', value: 3 },
    });

    // Remove it
    combat = CombatEngine.removeCondition(combat, 'hero', 'poisoned');

    const target = CombatEngine.getCombatant(combat, 'hero');
    expect(target?.conditions.some((c) => c.name === 'poisoned')).toBe(false);
  });
});

describe('CombatEngine.hasCondition', () => {
  it('should detect existing condition', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    combat = CombatEngine.addCondition(combat, 'hero', {
      name: 'blinded',
      source: 'test',
      duration: { type: 'rounds', value: 1 },
    });

    expect(CombatEngine.hasCondition(combat, 'hero', 'blinded')).toBe(true);
    expect(CombatEngine.hasCondition(combat, 'hero', 'deafened')).toBe(false);
  });
});

// =============================================================================
// RESOURCE MANAGEMENT TESTS
// =============================================================================

describe('Resource management', () => {
  let combat: Combat;
  let combatantId: string;

  beforeEach(() => {
    combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero', speed: 30 })],
      [createMockMonster()]
    );
    combatantId = 'hero';
  });

  it('should use action', () => {
    const updated = CombatEngine.useAction(combat, combatantId);
    const combatant = CombatEngine.getCombatant(updated, combatantId);
    expect(combatant?.turnResources.hasAction).toBe(false);
  });

  it('should use bonus action', () => {
    const updated = CombatEngine.useBonusAction(combat, combatantId);
    const combatant = CombatEngine.getCombatant(updated, combatantId);
    expect(combatant?.turnResources.hasBonusAction).toBe(false);
  });

  it('should use reaction', () => {
    const updated = CombatEngine.useReaction(combat, combatantId);
    const combatant = CombatEngine.getCombatant(updated, combatantId);
    expect(combatant?.turnResources.hasReaction).toBe(false);
  });

  it('should track movement', () => {
    const updated = CombatEngine.useMovement(combat, combatantId, 15);
    const combatant = CombatEngine.getCombatant(updated, combatantId);
    expect(combatant?.turnResources.movementRemaining).toBe(15);
  });

  it('should not allow negative movement', () => {
    const updated = CombatEngine.useMovement(combat, combatantId, 100);
    const combatant = CombatEngine.getCombatant(updated, combatantId);
    expect(combatant?.turnResources.movementRemaining).toBe(0);
  });
});

// =============================================================================
// COMBAT END TESTS
// =============================================================================

describe('CombatEngine.checkCombatEnd', () => {
  it('should suggest victory when all enemies defeated', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    // Defeat enemy
    const enemyId = combat.initiativeOrder.find((c) => c.type === 'enemy')?.id!;
    const { combat: updatedCombat } = CombatEngine.applyDamage(
      combat,
      enemyId,
      100,
      'slashing',
      'kill'
    );

    const result = CombatEngine.checkCombatEnd(updatedCombat);
    expect(result.shouldEnd).toBe(true);
    expect(result.suggestedOutcome).toBe('victory');
  });

  it('should suggest defeat when all players down', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero', currentHp: 5 })],
      [createMockMonster()]
    );

    // Down the player
    const { combat: updatedCombat } = CombatEngine.applyDamage(
      combat,
      'hero',
      100,
      'slashing',
      'knockout'
    );

    const result = CombatEngine.checkCombatEnd(updatedCombat);
    expect(result.shouldEnd).toBe(true);
    expect(result.suggestedOutcome).toBe('defeat');
  });

  it('should not end while both sides active', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );

    const result = CombatEngine.checkCombatEnd(combat);
    expect(result.shouldEnd).toBe(false);
  });
});

describe('CombatEngine.endCombat', () => {
  it('should mark combat as inactive', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    const { combat: endedCombat } = CombatEngine.endCombat(combat, 'victory');

    expect(endedCombat.isActive).toBe(false);
  });

  it('should calculate XP from defeated enemies', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster(), createMockMonster()]
    );

    // Defeat all enemies
    const enemies = combat.initiativeOrder.filter((c) => c.type === 'enemy');
    for (const enemy of enemies) {
      const result = CombatEngine.applyDamage(
        combat,
        enemy.id,
        100,
        'slashing',
        'kill'
      );
      combat = result.combat;
    }

    const { xpEarned } = CombatEngine.endCombat(combat, 'victory');

    expect(xpEarned).toBeGreaterThan(0);
  });

  it('should return surviving players', () => {
    const combat = CombatEngine.startCombat(
      [
        createMockCharacter({ id: 'hero-1' }),
        createMockCharacter({ id: 'hero-2' }),
      ],
      [createMockMonster()]
    );

    const { survivingPlayers } = CombatEngine.endCombat(combat, 'victory');

    expect(survivingPlayers).toContain('hero-1');
    expect(survivingPlayers).toContain('hero-2');
  });
});

describe('CombatEngine.flee', () => {
  it('should mark combatant as fled', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'coward' })],
      [createMockMonster()]
    );

    const updated = CombatEngine.flee(combat, 'coward');
    const combatant = CombatEngine.getCombatant(updated, 'coward');

    expect(combatant?.status).toBe('fled');
  });
});

// =============================================================================
// TEMPORARY HP TESTS
// =============================================================================

describe('CombatEngine.addTempHp', () => {
  it('should add temp HP', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    const updated = CombatEngine.addTempHp(combat, 'hero', 10);
    const combatant = CombatEngine.getCombatant(updated, 'hero');

    expect(combatant?.tempHp).toBe(10);
  });

  it('should not stack temp HP - take higher', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    combat = CombatEngine.addTempHp(combat, 'hero', 10);
    combat = CombatEngine.addTempHp(combat, 'hero', 5); // Lower, should be ignored

    const combatant = CombatEngine.getCombatant(combat, 'hero');
    expect(combatant?.tempHp).toBe(10);

    combat = CombatEngine.addTempHp(combat, 'hero', 15); // Higher, should replace
    const updated = CombatEngine.getCombatant(combat, 'hero');
    expect(updated?.tempHp).toBe(15);
  });
});

// =============================================================================
// ENVIRONMENTAL EFFECTS TESTS
// =============================================================================

describe('Environmental Effects', () => {
  it('should add environmental effect', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );

    combat = CombatEngine.addEnvironmentalEffect(combat, 'Darkness (10ft radius)');

    expect(combat.environmentalEffects).toContain('Darkness (10ft radius)');
  });

  it('should remove environmental effect', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );

    combat = CombatEngine.addEnvironmentalEffect(combat, 'Fog Cloud');
    combat = CombatEngine.removeEnvironmentalEffect(combat, 'Fog Cloud');

    expect(combat.environmentalEffects).not.toContain('Fog Cloud');
  });
});

// =============================================================================
// COMBAT SUMMARY TESTS
// =============================================================================

describe('CombatEngine.getCombatSummary', () => {
  it('should produce readable summary', () => {
    const combat = CombatEngine.startCombat(
      [createMockCharacter({ name: 'Thorin' })],
      [createMockMonster({ name: 'Goblin' })]
    );

    const summary = CombatEngine.getCombatSummary(combat);

    expect(summary).toContain('COMBAT STATUS');
    expect(summary).toContain('Round 1');
    expect(summary).toContain('INITIATIVE ORDER');
    expect(summary).toContain('Thorin');
    expect(summary).toContain('Goblin');
  });

  it('should show bloodied status', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero', name: 'Thorin', currentHp: 20, maxHp: 45 })],
      [createMockMonster()]
    );

    // Damage to bloodied
    const { combat: bloodiedCombat } = CombatEngine.applyDamage(
      combat,
      'hero',
      10,
      'slashing',
      'hit'
    );

    const summary = CombatEngine.getCombatSummary(bloodiedCombat);
    expect(summary).toContain('Bloodied');
  });

  it('should indicate inactive combat', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter()],
      [createMockMonster()]
    );
    combat = { ...combat, isActive: false };

    const summary = CombatEngine.getCombatSummary(combat);
    expect(summary).toContain('Combat has ended');
  });
});

// =============================================================================
// ROUND PROCESSING TESTS
// =============================================================================

describe('CombatEngine.processEndOfRound', () => {
  it('should decrement round-based condition durations', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    // Add condition with 3 rounds duration
    combat = CombatEngine.addCondition(combat, 'hero', {
      name: 'poisoned',
      source: 'test',
      duration: { type: 'rounds', value: 3 },
    });

    // Process end of round
    combat = CombatEngine.processEndOfRound(combat);

    const target = CombatEngine.getCombatant(combat, 'hero');
    expect(target?.conditions[0].duration.value).toBe(2);
  });

  it('should remove expired conditions', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    // Add condition with 1 round duration
    combat = CombatEngine.addCondition(combat, 'hero', {
      name: 'prone',
      source: 'test',
      duration: { type: 'rounds', value: 1 },
    });

    // Process end of round
    combat = CombatEngine.processEndOfRound(combat);

    const target = CombatEngine.getCombatant(combat, 'hero');
    expect(target?.conditions.some((c) => c.name === 'prone')).toBe(false);
  });

  it('should not affect non-round conditions', () => {
    let combat = CombatEngine.startCombat(
      [createMockCharacter({ id: 'hero' })],
      [createMockMonster()]
    );

    // Add permanent condition
    combat = CombatEngine.addCondition(combat, 'hero', {
      name: 'charmed',
      source: 'test',
      duration: { type: 'untilDispelled' },
    });

    // Process end of round
    combat = CombatEngine.processEndOfRound(combat);

    const target = CombatEngine.getCombatant(combat, 'hero');
    expect(target?.conditions.some((c) => c.name === 'charmed')).toBe(true);
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('CombatEngine.getActiveCombatantsByType', () => {
  it('should return only active combatants of specified type', () => {
    let combat = CombatEngine.startCombat(
      [
        createMockCharacter({ id: 'hero-1' }),
        createMockCharacter({ id: 'hero-2' }),
      ],
      [createMockMonster(), createMockMonster()]
    );

    // Defeat one enemy
    const enemyId = combat.initiativeOrder.find((c) => c.type === 'enemy')?.id!;
    const result = CombatEngine.applyDamage(
      combat,
      enemyId,
      100,
      'slashing',
      'kill'
    );
    combat = result.combat;

    const activeEnemies = CombatEngine.getActiveCombatantsByType(
      combat,
      'enemy'
    );
    const activePlayers = CombatEngine.getActiveCombatantsByType(
      combat,
      'player_character'
    );

    expect(activeEnemies).toHaveLength(1);
    expect(activePlayers).toHaveLength(2);
  });
});
