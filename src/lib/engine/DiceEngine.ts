// =============================================================================
// ARCANE GAMEMASTER - Dice Engine
// Handles all dice rolling mechanics with full D&D 5e support
// Pure TypeScript - no framework dependencies
// =============================================================================

import {
  BasicRollResult,
  AdvantageStatus,
  AbilityCheckResult,
  AttackRollResult,
  DamageRollResult,
  SavingThrowResult,
  InitiativeResult,
  Character,
  Combatant,
  Ability,
  Skill,
  DamageType,
  DamageSource,
  SKILLS,
  getAbilityModifier,
  getProficiencyBonus,
} from '../models/types';

// =============================================================================
// DICE NOTATION PARSER
// =============================================================================

interface ParsedDice {
  count: number;
  sides: number;
  modifier: number;
  keepHighest?: number;
  keepLowest?: number;
}

/**
 * Parse dice notation like "2d6+3", "1d20", "4d6kh3" (keep highest 3)
 */
export function parseDiceNotation(notation: string): ParsedDice {
  const normalized = notation.toLowerCase().replace(/\s/g, '');

  // Match patterns like "2d6+3", "1d20-2", "4d6kh3", "2d20kl1"
  const match = normalized.match(
    /^(\d*)d(\d+)(kh(\d+)|kl(\d+))?([+-]\d+)?$/
  );

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const [, countStr, sidesStr, , keepHighStr, keepLowStr, modifierStr] = match;

  const count = countStr ? parseInt(countStr, 10) : 1;
  const sides = parseInt(sidesStr, 10);
  const modifier = modifierStr ? parseInt(modifierStr, 10) : 0;
  const keepHighest = keepHighStr ? parseInt(keepHighStr, 10) : undefined;
  const keepLowest = keepLowStr ? parseInt(keepLowStr, 10) : undefined;

  if (count < 1 || count > 100) {
    throw new Error(`Invalid dice count: ${count}`);
  }
  if (sides < 1 || sides > 100) {
    throw new Error(`Invalid dice sides: ${sides}`);
  }

  return { count, sides, modifier, keepHighest, keepLowest };
}

// =============================================================================
// RANDOM NUMBER GENERATION
// =============================================================================

/**
 * Generate a cryptographically strong random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
  // Fallback for testing environments
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Roll a single die
 */
export function rollDie(sides: number): number {
  return randomInt(1, sides);
}

// =============================================================================
// DICE ENGINE CLASS
// =============================================================================

export class DiceEngine {
  /**
   * Roll dice using standard notation (e.g., "2d6+3")
   */
  static roll(notation: string, reason?: string): BasicRollResult {
    const parsed = parseDiceNotation(notation);
    let rolls: number[] = [];

    // Roll all dice
    for (let i = 0; i < parsed.count; i++) {
      rolls.push(rollDie(parsed.sides));
    }

    // Handle keep highest/lowest
    if (parsed.keepHighest !== undefined) {
      rolls.sort((a, b) => b - a);
      rolls = rolls.slice(0, parsed.keepHighest);
    } else if (parsed.keepLowest !== undefined) {
      rolls.sort((a, b) => a - b);
      rolls = rolls.slice(0, parsed.keepLowest);
    }

    const sum = rolls.reduce((acc, val) => acc + val, 0);
    const total = sum + parsed.modifier;

    return {
      notation,
      rolls,
      modifier: parsed.modifier,
      total,
      reason,
    };
  }

  /**
   * Roll a d20 with advantage or disadvantage
   */
  static rollD20(advantageStatus: AdvantageStatus = 'normal'): {
    roll: number;
    rolls: number[];
    hadAdvantage: boolean;
    hadDisadvantage: boolean;
  } {
    const roll1 = rollDie(20);

    if (advantageStatus === 'normal') {
      return {
        roll: roll1,
        rolls: [roll1],
        hadAdvantage: false,
        hadDisadvantage: false,
      };
    }

    const roll2 = rollDie(20);
    const rolls = [roll1, roll2];

    if (advantageStatus === 'advantage') {
      return {
        roll: Math.max(roll1, roll2),
        rolls,
        hadAdvantage: true,
        hadDisadvantage: false,
      };
    }

    // Disadvantage
    return {
      roll: Math.min(roll1, roll2),
      rolls,
      hadAdvantage: false,
      hadDisadvantage: true,
    };
  }

  /**
   * Roll an ability check
   */
  static rollAbilityCheck(
    character: Character,
    ability: Ability,
    dc: number,
    options: {
      skill?: Skill;
      advantageStatus?: AdvantageStatus;
    } = {}
  ): AbilityCheckResult {
    const { skill, advantageStatus = 'normal' } = options;

    const d20Result = this.rollD20(advantageStatus);
    const abilityMod = getAbilityModifier(character.abilityScores[ability]);
    const profBonus = getProficiencyBonus(character.level);

    let skillModifier = abilityMod;
    let proficiencyBonus = 0;

    // Check for skill proficiency
    if (skill) {
      const skillAbility = SKILLS[skill];
      // Use the skill's associated ability if different
      if (skillAbility !== ability) {
        skillModifier = getAbilityModifier(
          character.abilityScores[skillAbility]
        );
      }

      if (character.proficiencies.expertise.includes(skill)) {
        proficiencyBonus = profBonus * 2;
      } else if (character.proficiencies.skills.includes(skill)) {
        proficiencyBonus = profBonus;
      }
    }

    const total = d20Result.roll + skillModifier + proficiencyBonus;
    const isCriticalSuccess = d20Result.roll === 20;
    const isCriticalFailure = d20Result.roll === 1;

    // Determine success - critical success always succeeds, critical failure always fails
    let success = total >= dc;
    if (isCriticalSuccess) success = true;
    if (isCriticalFailure) success = false;

    return {
      characterId: character.id,
      characterName: character.name,
      ability,
      skill,
      roll: d20Result.roll,
      modifier: skillModifier,
      proficiencyBonus,
      total,
      dc,
      success,
      isCriticalSuccess,
      isCriticalFailure,
      hadAdvantage: d20Result.hadAdvantage,
      hadDisadvantage: d20Result.hadDisadvantage,
    };
  }

  /**
   * Roll a saving throw
   */
  static rollSavingThrow(
    character: Character,
    ability: Ability,
    dc: number,
    advantageStatus: AdvantageStatus = 'normal'
  ): SavingThrowResult {
    const d20Result = this.rollD20(advantageStatus);
    const abilityMod = getAbilityModifier(character.abilityScores[ability]);
    const profBonus = getProficiencyBonus(character.level);

    let proficiencyBonus = 0;
    if (character.proficiencies.savingThrows.includes(ability)) {
      proficiencyBonus = profBonus;
    }

    const total = d20Result.roll + abilityMod + proficiencyBonus;
    const isCriticalSuccess = d20Result.roll === 20;
    const isCriticalFailure = d20Result.roll === 1;

    let success = total >= dc;
    if (isCriticalSuccess) success = true;
    if (isCriticalFailure) success = false;

    return {
      characterId: character.id,
      characterName: character.name,
      ability,
      roll: d20Result.roll,
      modifier: abilityMod,
      proficiencyBonus,
      total,
      dc,
      success,
      isCriticalSuccess,
      isCriticalFailure,
      hadAdvantage: d20Result.hadAdvantage,
      hadDisadvantage: d20Result.hadDisadvantage,
    };
  }

  /**
   * Roll an attack
   */
  static rollAttack(
    attackerId: string,
    attackerName: string,
    targetId: string,
    targetName: string,
    targetAC: number,
    attackBonus: number,
    weapon: string,
    advantageStatus: AdvantageStatus = 'normal'
  ): AttackRollResult {
    const d20Result = this.rollD20(advantageStatus);
    const total = d20Result.roll + attackBonus;

    const isCriticalHit = d20Result.roll === 20;
    const isCriticalMiss = d20Result.roll === 1;

    // Determine if hit - crits always hit, nat 1s always miss
    let hits = total >= targetAC;
    if (isCriticalHit) hits = true;
    if (isCriticalMiss) hits = false;

    return {
      attackerId,
      attackerName,
      targetId,
      targetName,
      weapon,
      roll: d20Result.roll,
      attackBonus,
      total,
      targetAC,
      hits,
      isCriticalHit,
      isCriticalMiss,
      hadAdvantage: d20Result.hadAdvantage,
      hadDisadvantage: d20Result.hadDisadvantage,
    };
  }

  /**
   * Roll damage
   */
  static rollDamage(
    damageDice: string,
    damageType: DamageType,
    modifier: number = 0,
    isCritical: boolean = false,
    additionalDamage: DamageSource[] = []
  ): DamageRollResult {
    // Parse base damage dice
    const parsed = parseDiceNotation(damageDice);
    const diceCount = isCritical ? parsed.count * 2 : parsed.count;

    // Roll base damage
    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      rolls.push(rollDie(parsed.sides));
    }

    const baseDamage = rolls.reduce((acc, val) => acc + val, 0) + modifier;

    // Roll additional damage sources
    const processedAdditional: DamageSource[] = [];
    let additionalTotal = 0;

    for (const source of additionalDamage) {
      const additionalParsed = parseDiceNotation(source.dice);
      const additionalCount = isCritical
        ? additionalParsed.count * 2
        : additionalParsed.count;

      let additionalSum = 0;
      for (let i = 0; i < additionalCount; i++) {
        additionalSum += rollDie(additionalParsed.sides);
      }
      additionalSum += additionalParsed.modifier;

      processedAdditional.push({
        dice: source.dice,
        type: source.type,
        source: source.source,
      });
      additionalTotal += additionalSum;
    }

    const totalDamage = Math.max(0, baseDamage + additionalTotal);

    return {
      rolls,
      modifier,
      baseDamage,
      damageType,
      additionalDamage: processedAdditional,
      totalDamage,
      isCritical,
    };
  }

  /**
   * Roll initiative for multiple combatants
   */
  static rollInitiative(
    combatants: Array<{
      id: string;
      name: string;
      dexterityModifier: number;
    }>
  ): InitiativeResult[] {
    const results: InitiativeResult[] = combatants.map((c) => {
      const roll = rollDie(20);
      return {
        combatantId: c.id,
        combatantName: c.name,
        roll,
        modifier: c.dexterityModifier,
        total: roll + c.dexterityModifier,
      };
    });

    // Sort by total (descending), then by modifier (descending) for ties
    results.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return b.modifier - a.modifier;
    });

    return results;
  }

  /**
   * Roll a death saving throw
   * Returns: { roll, stable, dead, success }
   */
  static rollDeathSave(currentSuccesses: number, currentFailures: number): {
    roll: number;
    success: boolean;
    stable: boolean;
    dead: boolean;
    newSuccesses: number;
    newFailures: number;
  } {
    const roll = rollDie(20);

    // Natural 20: regain 1 HP and become conscious
    if (roll === 20) {
      return {
        roll,
        success: true,
        stable: true,
        dead: false,
        newSuccesses: 3, // Technically stabilized
        newFailures: currentFailures,
      };
    }

    // Natural 1: two failures
    if (roll === 1) {
      const newFailures = currentFailures + 2;
      return {
        roll,
        success: false,
        stable: false,
        dead: newFailures >= 3,
        newSuccesses: currentSuccesses,
        newFailures: Math.min(newFailures, 3),
      };
    }

    // 10 or higher: success
    if (roll >= 10) {
      const newSuccesses = currentSuccesses + 1;
      return {
        roll,
        success: true,
        stable: newSuccesses >= 3,
        dead: false,
        newSuccesses: Math.min(newSuccesses, 3),
        newFailures: currentFailures,
      };
    }

    // Below 10: failure
    const newFailures = currentFailures + 1;
    return {
      roll,
      success: false,
      stable: false,
      dead: newFailures >= 3,
      newSuccesses: currentSuccesses,
      newFailures: Math.min(newFailures, 3),
    };
  }

  /**
   * Roll for random encounter chance
   */
  static rollEncounterCheck(dc: number = 18): {
    roll: number;
    encounterTriggered: boolean;
  } {
    const roll = rollDie(20);
    return {
      roll,
      encounterTriggered: roll >= dc,
    };
  }

  /**
   * Roll percentile dice (d100)
   */
  static rollPercentile(): number {
    return rollDie(100);
  }

  /**
   * Roll for ability scores (4d6 drop lowest)
   */
  static rollAbilityScore(): {
    rolls: number[];
    dropped: number;
    total: number;
  } {
    const rolls: number[] = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(rollDie(6));
    }

    // Sort descending
    rolls.sort((a, b) => b - a);

    const dropped = rolls[3];
    const total = rolls[0] + rolls[1] + rolls[2];

    return { rolls, dropped, total };
  }

  /**
   * Roll a full set of ability scores
   */
  static rollAbilityScoreSet(): {
    scores: number[];
    details: Array<{ rolls: number[]; dropped: number; total: number }>;
  } {
    const details: Array<{ rolls: number[]; dropped: number; total: number }> =
      [];
    const scores: number[] = [];

    for (let i = 0; i < 6; i++) {
      const result = this.rollAbilityScore();
      details.push(result);
      scores.push(result.total);
    }

    return { scores, details };
  }

  /**
   * Format a roll result for display
   */
  static formatRollResult(result: BasicRollResult): string {
    const rollsStr = result.rolls.join(' + ');
    const modStr =
      result.modifier >= 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`;
    const reasonStr = result.reason ? ` (${result.reason})` : '';

    if (result.modifier === 0) {
      return `🎲 [${rollsStr}] = ${result.total}${reasonStr}`;
    }
    return `🎲 [${rollsStr}] ${modStr} = ${result.total}${reasonStr}`;
  }

  /**
   * Format an attack roll for display
   */
  static formatAttackResult(result: AttackRollResult): string {
    const critText = result.isCriticalHit
      ? ' 💥 CRITICAL HIT!'
      : result.isCriticalMiss
        ? ' 💀 CRITICAL MISS!'
        : '';
    const hitText = result.hits ? '✅ Hit!' : '❌ Miss!';
    const advText = result.hadAdvantage
      ? ' (advantage)'
      : result.hadDisadvantage
        ? ' (disadvantage)'
        : '';

    return `🎲 ${result.roll} + ${result.attackBonus} = ${result.total} vs AC ${result.targetAC} - ${hitText}${critText}${advText}`;
  }

  /**
   * Format a damage roll for display
   */
  static formatDamageResult(result: DamageRollResult): string {
    const critText = result.isCritical ? ' (CRITICAL)' : '';
    const typeText = result.damageType;

    let additionalText = '';
    if (result.additionalDamage.length > 0) {
      const sources = result.additionalDamage
        .map((d) => `${d.source}: ${d.type}`)
        .join(', ');
      additionalText = ` [+${sources}]`;
    }

    return `⚔️ ${result.totalDamage} ${typeText} damage${critText}${additionalText}`;
  }

  /**
   * Format an ability check for display
   */
  static formatAbilityCheckResult(result: AbilityCheckResult): string {
    const critText = result.isCriticalSuccess
      ? ' 🌟 NAT 20!'
      : result.isCriticalFailure
        ? ' 💀 NAT 1!'
        : '';
    const successText = result.success ? '✅ Success!' : '❌ Failure!';
    const skillText = result.skill ? ` (${result.skill})` : '';
    const advText = result.hadAdvantage
      ? ' (advantage)'
      : result.hadDisadvantage
        ? ' (disadvantage)'
        : '';

    return `🎲 ${result.ability}${skillText}: ${result.roll} + ${result.modifier + result.proficiencyBonus} = ${result.total} vs DC ${result.dc} - ${successText}${critText}${advText}`;
  }

  /**
   * Format a saving throw for display
   */
  static formatSavingThrowResult(result: SavingThrowResult): string {
    const critText = result.isCriticalSuccess
      ? ' 🌟 NAT 20!'
      : result.isCriticalFailure
        ? ' 💀 NAT 1!'
        : '';
    const successText = result.success ? '✅ Success!' : '❌ Failure!';
    const advText = result.hadAdvantage
      ? ' (advantage)'
      : result.hadDisadvantage
        ? ' (disadvantage)'
        : '';

    return `🎲 ${result.ability.toUpperCase()} Save: ${result.roll} + ${result.modifier + result.proficiencyBonus} = ${result.total} vs DC ${result.dc} - ${successText}${critText}${advText}`;
  }
}

export default DiceEngine;
