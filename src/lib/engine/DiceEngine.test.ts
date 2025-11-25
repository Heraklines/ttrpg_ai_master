// =============================================================================
// ARCANE GAMEMASTER - Dice Engine Tests
// Comprehensive test coverage for all dice mechanics
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DiceEngine,
  parseDiceNotation,
  rollDie,
  randomInt,
} from './DiceEngine';
import { Character } from '../models/types';

// =============================================================================
// HELPER: Create mock character for testing
// =============================================================================

function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-123',
    campaignId: 'camp-456',
    name: 'Test Hero',
    race: 'Human',
    characterClass: 'Fighter',
    level: 5,
    abilityScores: {
      strength: 16, // +3
      dexterity: 14, // +2
      constitution: 14, // +2
      intelligence: 10, // +0
      wisdom: 12, // +1
      charisma: 8, // -1
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
      skills: ['athletics', 'perception', 'intimidation'],
      expertise: ['athletics'], // Double proficiency
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

// =============================================================================
// DICE NOTATION PARSER TESTS
// =============================================================================

describe('parseDiceNotation', () => {
  it('should parse basic notation like "1d20"', () => {
    const result = parseDiceNotation('1d20');
    expect(result).toEqual({
      count: 1,
      sides: 20,
      modifier: 0,
      keepHighest: undefined,
      keepLowest: undefined,
    });
  });

  it('should parse notation with positive modifier "2d6+3"', () => {
    const result = parseDiceNotation('2d6+3');
    expect(result).toEqual({
      count: 2,
      sides: 6,
      modifier: 3,
      keepHighest: undefined,
      keepLowest: undefined,
    });
  });

  it('should parse notation with negative modifier "1d8-2"', () => {
    const result = parseDiceNotation('1d8-2');
    expect(result).toEqual({
      count: 1,
      sides: 8,
      modifier: -2,
      keepHighest: undefined,
      keepLowest: undefined,
    });
  });

  it('should parse "d20" as "1d20"', () => {
    const result = parseDiceNotation('d20');
    expect(result.count).toBe(1);
    expect(result.sides).toBe(20);
  });

  it('should parse keep highest notation "4d6kh3"', () => {
    const result = parseDiceNotation('4d6kh3');
    expect(result).toEqual({
      count: 4,
      sides: 6,
      modifier: 0,
      keepHighest: 3,
      keepLowest: undefined,
    });
  });

  it('should parse keep lowest notation "2d20kl1"', () => {
    const result = parseDiceNotation('2d20kl1');
    expect(result).toEqual({
      count: 2,
      sides: 20,
      modifier: 0,
      keepHighest: undefined,
      keepLowest: 1,
    });
  });

  it('should handle case insensitivity', () => {
    const result = parseDiceNotation('2D6+3');
    expect(result.count).toBe(2);
    expect(result.sides).toBe(6);
    expect(result.modifier).toBe(3);
  });

  it('should handle whitespace', () => {
    const result = parseDiceNotation(' 2d6 + 3 ');
    expect(result.count).toBe(2);
    expect(result.modifier).toBe(3);
  });

  it('should throw on invalid notation', () => {
    expect(() => parseDiceNotation('invalid')).toThrow('Invalid dice notation');
    expect(() => parseDiceNotation('2d')).toThrow('Invalid dice notation');
    expect(() => parseDiceNotation('d')).toThrow('Invalid dice notation');
  });

  it('should throw on excessive dice count', () => {
    expect(() => parseDiceNotation('1000d6')).toThrow('Invalid dice count');
  });

  it('should throw on excessive dice sides', () => {
    expect(() => parseDiceNotation('1d1000')).toThrow('Invalid dice sides');
  });
});

// =============================================================================
// BASIC ROLL TESTS
// =============================================================================

describe('DiceEngine.roll', () => {
  it('should roll dice and return valid result', () => {
    const result = DiceEngine.roll('2d6+3', 'Test roll');

    expect(result.notation).toBe('2d6+3');
    expect(result.rolls).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.reason).toBe('Test roll');

    // Each die should be 1-6
    result.rolls.forEach((roll) => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    });

    // Total should be sum of rolls + modifier
    const expectedTotal = result.rolls.reduce((a, b) => a + b, 0) + 3;
    expect(result.total).toBe(expectedTotal);
  });

  it('should handle d20 rolls', () => {
    const result = DiceEngine.roll('1d20');
    expect(result.rolls).toHaveLength(1);
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(20);
  });

  it('should handle keep highest (4d6kh3)', () => {
    // Run multiple times to verify behavior
    for (let i = 0; i < 10; i++) {
      const result = DiceEngine.roll('4d6kh3');
      expect(result.rolls).toHaveLength(3); // Only keeps 3

      // Verify they're sorted descending (kept highest)
      for (let j = 0; j < result.rolls.length - 1; j++) {
        expect(result.rolls[j]).toBeGreaterThanOrEqual(result.rolls[j + 1]);
      }
    }
  });

  it('should handle negative modifiers', () => {
    const result = DiceEngine.roll('1d6-2');
    expect(result.modifier).toBe(-2);
  });
});

// =============================================================================
// D20 WITH ADVANTAGE/DISADVANTAGE TESTS
// =============================================================================

describe('DiceEngine.rollD20', () => {
  it('should roll single die for normal roll', () => {
    const result = DiceEngine.rollD20('normal');
    expect(result.rolls).toHaveLength(1);
    expect(result.hadAdvantage).toBe(false);
    expect(result.hadDisadvantage).toBe(false);
    expect(result.roll).toBe(result.rolls[0]);
  });

  it('should roll two dice for advantage', () => {
    const result = DiceEngine.rollD20('advantage');
    expect(result.rolls).toHaveLength(2);
    expect(result.hadAdvantage).toBe(true);
    expect(result.hadDisadvantage).toBe(false);
    expect(result.roll).toBe(Math.max(...result.rolls));
  });

  it('should roll two dice for disadvantage', () => {
    const result = DiceEngine.rollD20('disadvantage');
    expect(result.rolls).toHaveLength(2);
    expect(result.hadAdvantage).toBe(false);
    expect(result.hadDisadvantage).toBe(true);
    expect(result.roll).toBe(Math.min(...result.rolls));
  });
});

// =============================================================================
// ABILITY CHECK TESTS
// =============================================================================

describe('DiceEngine.rollAbilityCheck', () => {
  const character = createMockCharacter();

  it('should calculate modifier correctly', () => {
    // Strength is 16, modifier should be +3
    // With level 5, proficiency bonus is +3
    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15);

    expect(result.characterId).toBe('char-123');
    expect(result.characterName).toBe('Test Hero');
    expect(result.ability).toBe('strength');
    expect(result.modifier).toBe(3); // (16-10)/2 = 3
    expect(result.dc).toBe(15);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
  });

  it('should add proficiency for proficient skills', () => {
    // Athletics is a proficient skill, and character has expertise
    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15, {
      skill: 'athletics',
    });

    expect(result.skill).toBe('athletics');
    // Level 5 proficiency = +3, expertise = +6
    expect(result.proficiencyBonus).toBe(6);
  });

  it('should add normal proficiency for non-expertise skills', () => {
    const result = DiceEngine.rollAbilityCheck(character, 'wisdom', 15, {
      skill: 'perception',
    });

    // Perception is proficient but not expertise
    expect(result.proficiencyBonus).toBe(3);
  });

  it('should not add proficiency for non-proficient skills', () => {
    const result = DiceEngine.rollAbilityCheck(character, 'intelligence', 15, {
      skill: 'arcana',
    });

    expect(result.proficiencyBonus).toBe(0);
  });

  it('should detect critical success (nat 20)', () => {
    // Run many times until we get a nat 20, or mock it
    let foundCrit = false;
    for (let i = 0; i < 1000 && !foundCrit; i++) {
      const result = DiceEngine.rollAbilityCheck(character, 'strength', 30);
      if (result.roll === 20) {
        foundCrit = true;
        expect(result.isCriticalSuccess).toBe(true);
        expect(result.success).toBe(true); // Auto-success on nat 20
      }
    }
    // This test may occasionally fail due to randomness, but is extremely unlikely
    expect(foundCrit).toBe(true);
  });

  it('should detect critical failure (nat 1)', () => {
    let foundCritFail = false;
    for (let i = 0; i < 1000 && !foundCritFail; i++) {
      const result = DiceEngine.rollAbilityCheck(character, 'strength', 1);
      if (result.roll === 1) {
        foundCritFail = true;
        expect(result.isCriticalFailure).toBe(true);
        expect(result.success).toBe(false); // Auto-fail on nat 1
      }
    }
    expect(foundCritFail).toBe(true);
  });

  it('should handle advantage', () => {
    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15, {
      advantageStatus: 'advantage',
    });
    expect(result.hadAdvantage).toBe(true);
  });
});

// =============================================================================
// SAVING THROW TESTS
// =============================================================================

describe('DiceEngine.rollSavingThrow', () => {
  const character = createMockCharacter();

  it('should add proficiency for proficient saves', () => {
    // Character is proficient in STR and CON saves
    const result = DiceEngine.rollSavingThrow(character, 'strength', 15);

    expect(result.ability).toBe('strength');
    expect(result.modifier).toBe(3); // STR mod
    expect(result.proficiencyBonus).toBe(3); // Level 5 proficiency
  });

  it('should not add proficiency for non-proficient saves', () => {
    const result = DiceEngine.rollSavingThrow(character, 'wisdom', 15);

    expect(result.modifier).toBe(1); // WIS mod
    expect(result.proficiencyBonus).toBe(0);
  });

  it('should calculate total correctly', () => {
    const result = DiceEngine.rollSavingThrow(character, 'constitution', 15);

    const expectedTotal = result.roll + result.modifier + result.proficiencyBonus;
    expect(result.total).toBe(expectedTotal);
  });
});

// =============================================================================
// ATTACK ROLL TESTS
// =============================================================================

describe('DiceEngine.rollAttack', () => {
  it('should determine hit correctly', () => {
    const result = DiceEngine.rollAttack(
      'attacker-1',
      'Fighter',
      'target-1',
      'Goblin',
      13, // Target AC
      5, // Attack bonus
      'Longsword'
    );

    expect(result.attackerId).toBe('attacker-1');
    expect(result.targetId).toBe('target-1');
    expect(result.weapon).toBe('Longsword');
    expect(result.targetAC).toBe(13);
    expect(result.attackBonus).toBe(5);

    // Verify hit calculation
    if (result.roll === 20) {
      expect(result.hits).toBe(true);
      expect(result.isCriticalHit).toBe(true);
    } else if (result.roll === 1) {
      expect(result.hits).toBe(false);
      expect(result.isCriticalMiss).toBe(true);
    } else {
      expect(result.hits).toBe(result.total >= result.targetAC);
    }
  });

  it('should handle critical hits', () => {
    let foundCrit = false;
    for (let i = 0; i < 1000 && !foundCrit; i++) {
      const result = DiceEngine.rollAttack(
        'a', 'A', 't', 'T', 25, 0, 'Sword'
      );
      if (result.roll === 20) {
        foundCrit = true;
        expect(result.isCriticalHit).toBe(true);
        expect(result.hits).toBe(true); // Always hits on nat 20
      }
    }
    expect(foundCrit).toBe(true);
  });

  it('should handle critical misses', () => {
    let foundMiss = false;
    for (let i = 0; i < 1000 && !foundMiss; i++) {
      const result = DiceEngine.rollAttack(
        'a', 'A', 't', 'T', 1, 20, 'Sword' // Even with +20, nat 1 misses
      );
      if (result.roll === 1) {
        foundMiss = true;
        expect(result.isCriticalMiss).toBe(true);
        expect(result.hits).toBe(false);
      }
    }
    expect(foundMiss).toBe(true);
  });
});

// =============================================================================
// DAMAGE ROLL TESTS
// =============================================================================

describe('DiceEngine.rollDamage', () => {
  it('should roll base damage correctly', () => {
    const result = DiceEngine.rollDamage('2d6', 'slashing', 3, false);

    expect(result.rolls).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.damageType).toBe('slashing');
    expect(result.isCritical).toBe(false);

    result.rolls.forEach((roll) => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    });

    const expectedBase = result.rolls.reduce((a, b) => a + b, 0) + 3;
    expect(result.baseDamage).toBe(expectedBase);
  });

  it('should double dice on critical hit', () => {
    const result = DiceEngine.rollDamage('1d8', 'piercing', 2, true);

    // Critical doubles dice count
    expect(result.rolls).toHaveLength(2);
    expect(result.isCritical).toBe(true);
  });

  it('should handle additional damage sources', () => {
    const result = DiceEngine.rollDamage('1d8', 'slashing', 3, false, [
      { dice: '1d6', type: 'fire', source: 'Flame Tongue' },
    ]);

    expect(result.additionalDamage).toHaveLength(1);
    expect(result.additionalDamage[0].type).toBe('fire');
    expect(result.additionalDamage[0].source).toBe('Flame Tongue');
  });

  it('should never return negative damage', () => {
    // Even with negative modifier, minimum is 0
    const result = DiceEngine.rollDamage('1d4', 'bludgeoning', -10, false);
    expect(result.totalDamage).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// INITIATIVE TESTS
// =============================================================================

describe('DiceEngine.rollInitiative', () => {
  it('should roll and sort initiative correctly', () => {
    const combatants = [
      { id: '1', name: 'Fighter', dexterityModifier: 2 },
      { id: '2', name: 'Wizard', dexterityModifier: 1 },
      { id: '3', name: 'Goblin', dexterityModifier: 2 },
    ];

    const results = DiceEngine.rollInitiative(combatants);

    expect(results).toHaveLength(3);

    // Should be sorted by total descending
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].total).toBeGreaterThanOrEqual(results[i + 1].total);
    }

    // Each result should have correct structure
    results.forEach((r) => {
      expect(r.roll).toBeGreaterThanOrEqual(1);
      expect(r.roll).toBeLessThanOrEqual(20);
      expect(r.total).toBe(r.roll + r.modifier);
    });
  });
});

// =============================================================================
// DEATH SAVE TESTS
// =============================================================================

describe('DiceEngine.rollDeathSave', () => {
  it('should handle natural 20 (instant stabilize)', () => {
    let foundNat20 = false;
    for (let i = 0; i < 1000 && !foundNat20; i++) {
      const result = DiceEngine.rollDeathSave(0, 0);
      if (result.roll === 20) {
        foundNat20 = true;
        expect(result.success).toBe(true);
        expect(result.stable).toBe(true);
        expect(result.dead).toBe(false);
        expect(result.newSuccesses).toBe(3);
      }
    }
    expect(foundNat20).toBe(true);
  });

  it('should handle natural 1 (two failures)', () => {
    let foundNat1 = false;
    for (let i = 0; i < 1000 && !foundNat1; i++) {
      const result = DiceEngine.rollDeathSave(0, 0);
      if (result.roll === 1) {
        foundNat1 = true;
        expect(result.success).toBe(false);
        expect(result.newFailures).toBe(2);
      }
    }
    expect(foundNat1).toBe(true);
  });

  it('should stabilize at 3 successes', () => {
    let found = false;
    for (let i = 0; i < 1000 && !found; i++) {
      const result = DiceEngine.rollDeathSave(2, 0);
      if (result.roll >= 10 && result.roll < 20) {
        found = true;
        expect(result.stable).toBe(true);
        expect(result.newSuccesses).toBe(3);
      }
    }
  });

  it('should die at 3 failures', () => {
    let found = false;
    for (let i = 0; i < 1000 && !found; i++) {
      const result = DiceEngine.rollDeathSave(0, 2);
      if (result.roll < 10 && result.roll > 1) {
        found = true;
        expect(result.dead).toBe(true);
        expect(result.newFailures).toBe(3);
      }
    }
  });

  it('should die at 3 failures with nat 1 from 1 failure', () => {
    let found = false;
    for (let i = 0; i < 1000 && !found; i++) {
      const result = DiceEngine.rollDeathSave(0, 1);
      if (result.roll === 1) {
        found = true;
        expect(result.dead).toBe(true);
        expect(result.newFailures).toBe(3);
      }
    }
  });
});

// =============================================================================
// ABILITY SCORE GENERATION TESTS
// =============================================================================

describe('DiceEngine.rollAbilityScore', () => {
  it('should roll 4d6 and drop lowest', () => {
    const result = DiceEngine.rollAbilityScore();

    expect(result.rolls).toHaveLength(4);
    result.rolls.forEach((roll) => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    });

    // Should be sorted descending
    for (let i = 0; i < 3; i++) {
      expect(result.rolls[i]).toBeGreaterThanOrEqual(result.rolls[i + 1]);
    }

    // Dropped should be lowest
    expect(result.dropped).toBe(result.rolls[3]);

    // Total should be sum of top 3
    expect(result.total).toBe(result.rolls[0] + result.rolls[1] + result.rolls[2]);
  });

  it('should produce scores between 3 and 18', () => {
    for (let i = 0; i < 100; i++) {
      const result = DiceEngine.rollAbilityScore();
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
    }
  });
});

describe('DiceEngine.rollAbilityScoreSet', () => {
  it('should generate 6 ability scores', () => {
    const result = DiceEngine.rollAbilityScoreSet();

    expect(result.scores).toHaveLength(6);
    expect(result.details).toHaveLength(6);

    result.scores.forEach((score, i) => {
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
      expect(score).toBe(result.details[i].total);
    });
  });
});

// =============================================================================
// FORMATTING TESTS
// =============================================================================

describe('DiceEngine.formatRollResult', () => {
  it('should format basic roll', () => {
    const result = {
      notation: '2d6+3',
      rolls: [4, 5],
      modifier: 3,
      total: 12,
    };
    const formatted = DiceEngine.formatRollResult(result);
    expect(formatted).toContain('4 + 5');
    expect(formatted).toContain('+ 3');
    expect(formatted).toContain('12');
    expect(formatted).toContain('🎲');
  });

  it('should format roll with negative modifier', () => {
    const result = {
      notation: '1d8-2',
      rolls: [6],
      modifier: -2,
      total: 4,
    };
    const formatted = DiceEngine.formatRollResult(result);
    expect(formatted).toContain('- 2');
  });

  it('should include reason if provided', () => {
    const result = {
      notation: '1d20',
      rolls: [15],
      modifier: 0,
      total: 15,
      reason: 'Initiative',
    };
    const formatted = DiceEngine.formatRollResult(result);
    expect(formatted).toContain('(Initiative)');
  });
});

describe('DiceEngine.formatAttackResult', () => {
  it('should format hit correctly', () => {
    const result = {
      attackerId: 'a',
      attackerName: 'Fighter',
      targetId: 't',
      targetName: 'Goblin',
      weapon: 'Sword',
      roll: 15,
      attackBonus: 5,
      total: 20,
      targetAC: 13,
      hits: true,
      isCriticalHit: false,
      isCriticalMiss: false,
      hadAdvantage: false,
      hadDisadvantage: false,
    };
    const formatted = DiceEngine.formatAttackResult(result);
    expect(formatted).toContain('Hit!');
    expect(formatted).toContain('15 + 5 = 20');
    expect(formatted).toContain('AC 13');
  });

  it('should format critical hit', () => {
    const result = {
      attackerId: 'a',
      attackerName: 'Fighter',
      targetId: 't',
      targetName: 'Goblin',
      weapon: 'Sword',
      roll: 20,
      attackBonus: 5,
      total: 25,
      targetAC: 13,
      hits: true,
      isCriticalHit: true,
      isCriticalMiss: false,
      hadAdvantage: false,
      hadDisadvantage: false,
    };
    const formatted = DiceEngine.formatAttackResult(result);
    expect(formatted).toContain('CRITICAL HIT');
  });

  it('should show advantage status', () => {
    const result = {
      attackerId: 'a',
      attackerName: 'Fighter',
      targetId: 't',
      targetName: 'Goblin',
      weapon: 'Sword',
      roll: 15,
      attackBonus: 5,
      total: 20,
      targetAC: 13,
      hits: true,
      isCriticalHit: false,
      isCriticalMiss: false,
      hadAdvantage: true,
      hadDisadvantage: false,
    };
    const formatted = DiceEngine.formatAttackResult(result);
    expect(formatted).toContain('(advantage)');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle very low ability scores', () => {
    const character = createMockCharacter({
      abilityScores: {
        strength: 1, // -5 modifier
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
      },
    });

    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15);
    expect(result.modifier).toBe(-5);
  });

  it('should handle very high ability scores', () => {
    const character = createMockCharacter({
      abilityScores: {
        strength: 30, // +10 modifier (theoretical max)
        dexterity: 20,
        constitution: 20,
        intelligence: 20,
        wisdom: 20,
        charisma: 20,
      },
    });

    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15);
    expect(result.modifier).toBe(10);
  });

  it('should handle level 20 proficiency bonus', () => {
    const character = createMockCharacter({ level: 20 });
    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15, {
      skill: 'athletics',
    });
    // Level 20 proficiency = +6, expertise = +12
    expect(result.proficiencyBonus).toBe(12);
  });

  it('should handle level 1 proficiency bonus', () => {
    const character = createMockCharacter({ level: 1 });
    const result = DiceEngine.rollAbilityCheck(character, 'strength', 15, {
      skill: 'athletics',
    });
    // Level 1 proficiency = +2, expertise = +4
    expect(result.proficiencyBonus).toBe(4);
  });
});

// =============================================================================
// PERCENTILE AND ENCOUNTER TESTS
// =============================================================================

describe('DiceEngine.rollPercentile', () => {
  it('should roll between 1 and 100', () => {
    for (let i = 0; i < 100; i++) {
      const result = DiceEngine.rollPercentile();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});

describe('DiceEngine.rollEncounterCheck', () => {
  it('should return roll and trigger status', () => {
    const result = DiceEngine.rollEncounterCheck(15);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
    expect(result.encounterTriggered).toBe(result.roll >= 15);
  });
});
