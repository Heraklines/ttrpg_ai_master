// =============================================================================
// ARCANE GAMEMASTER - Combat Engine
// Handles all combat mechanics: initiative, turns, damage, conditions
// Pure TypeScript - no framework dependencies
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  Combat,
  Combatant,
  CombatantType,
  CombatantStatus,
  Character,
  MonsterStatBlock,
  ActiveCondition,
  ConditionType,
  DamageType,
  TurnResources,
  CombatOutcome,
  InitiativeResult,
  getAbilityModifier,
  isBloodied,
  isAtDeathsDoor,
} from '../models/types';
import { DiceEngine } from './DiceEngine';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create default turn resources
 */
function createDefaultTurnResources(speed: number): TurnResources {
  return {
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    movementRemaining: speed,
  };
}

/**
 * Create a combatant from a character
 */
export function createCombatantFromCharacter(
  character: Character,
  initiative: InitiativeResult
): Combatant {
  return {
    id: character.id,
    name: character.name,
    type: 'player_character',
    initiative: {
      roll: initiative.roll,
      modifier: initiative.modifier,
      total: initiative.total,
    },
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    tempHp: character.tempHp,
    armorClass: character.armorClass,
    speed: character.speed,
    conditions: [...character.conditions],
    status: character.currentHp > 0 ? 'active' : 'defeated',
    turnResources: createDefaultTurnResources(character.speed),
    sourceId: character.id,
    isPlayer: true,
  };
}

/**
 * Create a combatant from a monster stat block
 */
export function createCombatantFromMonster(
  monster: MonsterStatBlock,
  initiative: InitiativeResult,
  type: CombatantType = 'enemy',
  instanceId?: string
): Combatant {
  const id = instanceId || `${monster.name.toLowerCase().replace(/\s+/g, '_')}_${uuidv4().slice(0, 8)}`;
  const dexMod = getAbilityModifier(monster.abilityScores.dexterity);

  return {
    id,
    name: monster.name,
    type,
    initiative: {
      roll: initiative.roll,
      modifier: dexMod,
      total: initiative.total,
    },
    currentHp: monster.hitPoints,
    maxHp: monster.hitPoints,
    tempHp: 0,
    armorClass: monster.armorClass,
    speed: monster.speed.walk,
    conditions: [],
    status: 'active',
    turnResources: createDefaultTurnResources(monster.speed.walk),
    sourceId: monster.name,
    isPlayer: false,
  };
}

// =============================================================================
// COMBAT ENGINE CLASS
// =============================================================================

export class CombatEngine {
  /**
   * Start a new combat encounter
   */
  static startCombat(
    characters: Character[],
    monsters: MonsterStatBlock[],
    options: {
      allyMonsters?: MonsterStatBlock[];
      surprisedIds?: string[];
    } = {}
  ): Combat {
    const { allyMonsters = [], surprisedIds = [] } = options;

    // Prepare all combatants for initiative
    const initiativeCombatants: Array<{
      id: string;
      name: string;
      dexterityModifier: number;
      source: Character | MonsterStatBlock;
      type: CombatantType;
    }> = [];

    // Add player characters
    for (const character of characters) {
      initiativeCombatants.push({
        id: character.id,
        name: character.name,
        dexterityModifier: getAbilityModifier(character.abilityScores.dexterity),
        source: character,
        type: 'player_character',
      });
    }

    // Add enemy monsters
    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i];
      const id = `${monster.name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`;
      initiativeCombatants.push({
        id,
        name: monsters.length > 1 && monsters.filter(m => m.name === monster.name).length > 1
          ? `${monster.name} ${i + 1}`
          : monster.name,
        dexterityModifier: getAbilityModifier(monster.abilityScores.dexterity),
        source: monster,
        type: 'enemy',
      });
    }

    // Add ally monsters
    for (let i = 0; i < allyMonsters.length; i++) {
      const monster = allyMonsters[i];
      const id = `ally_${monster.name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`;
      initiativeCombatants.push({
        id,
        name: `${monster.name} (Ally)`,
        dexterityModifier: getAbilityModifier(monster.abilityScores.dexterity),
        source: monster,
        type: 'ally',
      });
    }

    // Roll initiative for all
    const initiativeResults = DiceEngine.rollInitiative(
      initiativeCombatants.map((c) => ({
        id: c.id,
        name: c.name,
        dexterityModifier: c.dexterityModifier,
      }))
    );

    // Create combatants in initiative order
    const combatants: Combatant[] = initiativeResults.map((result) => {
      const source = initiativeCombatants.find((c) => c.id === result.combatantId)!;
      
      if ('characterClass' in source.source) {
        // It's a character
        return createCombatantFromCharacter(source.source as Character, result);
      } else {
        // It's a monster
        const combatant = createCombatantFromMonster(
          source.source as MonsterStatBlock,
          result,
          source.type,
          source.id
        );
        combatant.name = source.name; // Use the potentially numbered name
        return combatant;
      }
    });

    return {
      id: uuidv4(),
      round: 1,
      initiativeOrder: combatants,
      currentTurnIndex: 0,
      surprisedCombatantIds: surprisedIds,
      environmentalEffects: [],
      isActive: true,
    };
  }

  /**
   * Get the current combatant whose turn it is
   */
  static getCurrentCombatant(combat: Combat): Combatant | null {
    if (!combat.isActive || combat.initiativeOrder.length === 0) {
      return null;
    }
    return combat.initiativeOrder[combat.currentTurnIndex];
  }

  /**
   * Advance to the next turn
   */
  static nextTurn(combat: Combat): Combat {
    if (!combat.isActive) {
      return combat;
    }

    const activeCombatants = combat.initiativeOrder.filter(
      (c) => c.status === 'active'
    );

    if (activeCombatants.length === 0) {
      return { ...combat, isActive: false };
    }

    // Find next active combatant
    let nextIndex = combat.currentTurnIndex;
    let iterations = 0;
    const maxIterations = combat.initiativeOrder.length;
    let newRound = combat.round;
    let updatedCombat = combat;

    do {
      nextIndex = (nextIndex + 1) % combat.initiativeOrder.length;
      iterations++;

      // Check if we've wrapped around to the beginning (new round)
      if (nextIndex === 0) {
        // Process end-of-round effects and increment round
        updatedCombat = this.processEndOfRound(updatedCombat);
        newRound = updatedCombat.round;
      }
    } while (
      updatedCombat.initiativeOrder[nextIndex].status !== 'active' &&
      iterations < maxIterations
    );

    // Reset turn resources for the new combatant
    const updatedOrder = [...updatedCombat.initiativeOrder];
    const currentCombatant = updatedOrder[nextIndex];
    updatedOrder[nextIndex] = {
      ...currentCombatant,
      turnResources: createDefaultTurnResources(currentCombatant.speed),
    };

    // Check if surprised (can't act in round 1)
    const isSurprised =
      newRound === 1 &&
      updatedCombat.surprisedCombatantIds.includes(currentCombatant.id);

    if (isSurprised) {
      // Skip their turn by recursing
      return this.nextTurn({
        ...updatedCombat,
        round: newRound,
        currentTurnIndex: nextIndex,
        initiativeOrder: updatedOrder,
      });
    }

    return {
      ...updatedCombat,
      round: newRound,
      currentTurnIndex: nextIndex,
      initiativeOrder: updatedOrder,
    };
  }

  /**
   * Process end of round effects
   */
  static processEndOfRound(combat: Combat): Combat {
    const updatedOrder = combat.initiativeOrder.map((combatant) => {
      // Process condition durations
      const updatedConditions = combatant.conditions
        .map((condition) => {
          if (condition.duration.type === 'rounds' && condition.duration.value) {
            return {
              ...condition,
              duration: {
                ...condition.duration,
                value: condition.duration.value - 1,
              },
            };
          }
          return condition;
        })
        .filter(
          (condition) =>
            condition.duration.type !== 'rounds' ||
            (condition.duration.value && condition.duration.value > 0)
        );

      return {
        ...combatant,
        conditions: updatedConditions,
      };
    });

    return {
      ...combat,
      round: combat.round + 1,
      initiativeOrder: updatedOrder,
    };
  }

  /**
   * Apply damage to a combatant
   */
  static applyDamage(
    combat: Combat,
    targetId: string,
    amount: number,
    damageType: DamageType,
    source: string
  ): {
    combat: Combat;
    actualDamage: number;
    wasKnockedOut: boolean;
    wasDowned: boolean;
  } {
    const targetIndex = combat.initiativeOrder.findIndex(
      (c) => c.id === targetId
    );

    if (targetIndex === -1) {
      throw new Error(`Combatant not found: ${targetId}`);
    }

    const target = combat.initiativeOrder[targetIndex];
    let remainingDamage = Math.max(0, amount);
    let actualDamage = 0;

    // First, deplete temporary HP
    let newTempHp = target.tempHp;
    if (newTempHp > 0) {
      if (remainingDamage >= newTempHp) {
        remainingDamage -= newTempHp;
        actualDamage += newTempHp;
        newTempHp = 0;
      } else {
        newTempHp -= remainingDamage;
        actualDamage += remainingDamage;
        remainingDamage = 0;
      }
    }

    // Then apply to regular HP
    let newCurrentHp = target.currentHp - remainingDamage;
    actualDamage += remainingDamage;

    // Clamp HP
    newCurrentHp = Math.max(0, newCurrentHp);

    // Determine status changes
    const wasKnockedOut = target.currentHp > 0 && newCurrentHp === 0;
    const wasDowned = wasKnockedOut && target.isPlayer;

    // Update status
    let newStatus: CombatantStatus = target.status;
    if (newCurrentHp === 0) {
      newStatus = target.isPlayer ? 'active' : 'defeated'; // Players go unconscious, monsters are defeated
    }

    // Add unconscious condition for players at 0 HP
    let newConditions = [...target.conditions];
    if (wasDowned) {
      newConditions.push({
        name: 'unconscious' as ConditionType,
        source: 'damage',
        duration: { type: 'untilDispelled' },
      });
    }

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[targetIndex] = {
      ...target,
      currentHp: newCurrentHp,
      tempHp: newTempHp,
      status: newStatus,
      conditions: newConditions,
    };

    return {
      combat: { ...combat, initiativeOrder: updatedOrder },
      actualDamage,
      wasKnockedOut,
      wasDowned,
    };
  }

  /**
   * Apply healing to a combatant
   */
  static applyHealing(
    combat: Combat,
    targetId: string,
    amount: number,
    source: string
  ): {
    combat: Combat;
    actualHealing: number;
    wasRevived: boolean;
  } {
    const targetIndex = combat.initiativeOrder.findIndex(
      (c) => c.id === targetId
    );

    if (targetIndex === -1) {
      throw new Error(`Combatant not found: ${targetId}`);
    }

    const target = combat.initiativeOrder[targetIndex];
    const wasAtZero = target.currentHp === 0;

    // Apply healing, cap at max HP
    const newCurrentHp = Math.min(target.maxHp, target.currentHp + amount);
    const actualHealing = newCurrentHp - target.currentHp;

    // Remove unconscious condition if revived
    let newConditions = [...target.conditions];
    if (wasAtZero && newCurrentHp > 0) {
      newConditions = newConditions.filter((c) => c.name !== 'unconscious');
    }

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[targetIndex] = {
      ...target,
      currentHp: newCurrentHp,
      conditions: newConditions,
      status: newCurrentHp > 0 ? 'active' : target.status,
    };

    return {
      combat: { ...combat, initiativeOrder: updatedOrder },
      actualHealing,
      wasRevived: wasAtZero && newCurrentHp > 0,
    };
  }

  /**
   * Add a condition to a combatant
   */
  static addCondition(
    combat: Combat,
    targetId: string,
    condition: ActiveCondition
  ): Combat {
    const targetIndex = combat.initiativeOrder.findIndex(
      (c) => c.id === targetId
    );

    if (targetIndex === -1) {
      throw new Error(`Combatant not found: ${targetId}`);
    }

    const target = combat.initiativeOrder[targetIndex];

    // Check if already has this condition (don't stack most conditions)
    const hasCondition = target.conditions.some(
      (c) => c.name === condition.name
    );
    if (hasCondition) {
      // Update duration if new duration is longer
      const existingIndex = target.conditions.findIndex(
        (c) => c.name === condition.name
      );
      const existing = target.conditions[existingIndex];

      if (
        condition.duration.type === 'rounds' &&
        existing.duration.type === 'rounds' &&
        condition.duration.value! > (existing.duration.value || 0)
      ) {
        const updatedConditions = [...target.conditions];
        updatedConditions[existingIndex] = condition;

        const updatedOrder = [...combat.initiativeOrder];
        updatedOrder[targetIndex] = {
          ...target,
          conditions: updatedConditions,
        };

        return { ...combat, initiativeOrder: updatedOrder };
      }

      return combat; // No change
    }

    const updatedConditions = [...target.conditions, condition];
    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[targetIndex] = {
      ...target,
      conditions: updatedConditions,
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Remove a condition from a combatant
   */
  static removeCondition(
    combat: Combat,
    targetId: string,
    conditionName: ConditionType
  ): Combat {
    const targetIndex = combat.initiativeOrder.findIndex(
      (c) => c.id === targetId
    );

    if (targetIndex === -1) {
      throw new Error(`Combatant not found: ${targetId}`);
    }

    const target = combat.initiativeOrder[targetIndex];
    const updatedConditions = target.conditions.filter(
      (c) => c.name !== conditionName
    );

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[targetIndex] = {
      ...target,
      conditions: updatedConditions,
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Use an action (marks action as used)
   */
  static useAction(combat: Combat, combatantId: string): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === combatantId);
    if (index === -1) return combat;

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      turnResources: {
        ...updatedOrder[index].turnResources,
        hasAction: false,
      },
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Use a bonus action
   */
  static useBonusAction(combat: Combat, combatantId: string): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === combatantId);
    if (index === -1) return combat;

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      turnResources: {
        ...updatedOrder[index].turnResources,
        hasBonusAction: false,
      },
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Use a reaction
   */
  static useReaction(combat: Combat, combatantId: string): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === combatantId);
    if (index === -1) return combat;

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      turnResources: {
        ...updatedOrder[index].turnResources,
        hasReaction: false,
      },
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Use movement
   */
  static useMovement(
    combat: Combat,
    combatantId: string,
    amount: number
  ): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === combatantId);
    if (index === -1) return combat;

    const combatant = combat.initiativeOrder[index];
    const newRemaining = Math.max(
      0,
      combatant.turnResources.movementRemaining - amount
    );

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...combatant,
      turnResources: {
        ...combatant.turnResources,
        movementRemaining: newRemaining,
      },
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * Mark a combatant as fled
   */
  static flee(combat: Combat, combatantId: string): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === combatantId);
    if (index === -1) return combat;

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      status: 'fled',
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }

  /**
   * End combat
   */
  static endCombat(
    combat: Combat,
    outcome: CombatOutcome
  ): {
    combat: Combat;
    xpEarned: number;
    survivingPlayers: string[];
  } {
    // Calculate XP from defeated enemies (in a real implementation,
    // this would use the actual XP values from monster stat blocks)
    const defeatedEnemies = combat.initiativeOrder.filter(
      (c) => c.type === 'enemy' && c.status === 'defeated'
    );

    // Placeholder XP calculation
    const xpEarned = defeatedEnemies.length * 50; // Would use real XP values

    const survivingPlayers = combat.initiativeOrder
      .filter((c) => c.isPlayer && c.status === 'active')
      .map((c) => c.id);

    return {
      combat: { ...combat, isActive: false },
      xpEarned,
      survivingPlayers,
    };
  }

  /**
   * Check if combat should end automatically
   */
  static checkCombatEnd(combat: Combat): {
    shouldEnd: boolean;
    suggestedOutcome?: CombatOutcome;
  } {
    const activePlayers = combat.initiativeOrder.filter(
      (c) => c.isPlayer && c.status === 'active' && c.currentHp > 0
    );
    const activeEnemies = combat.initiativeOrder.filter(
      (c) => c.type === 'enemy' && c.status === 'active'
    );

    if (activeEnemies.length === 0 && activePlayers.length > 0) {
      return { shouldEnd: true, suggestedOutcome: 'victory' };
    }

    if (activePlayers.length === 0 && activeEnemies.length > 0) {
      return { shouldEnd: true, suggestedOutcome: 'defeat' };
    }

    if (activePlayers.length === 0 && activeEnemies.length === 0) {
      // Everyone down - stalemate
      return { shouldEnd: true, suggestedOutcome: 'defeat' };
    }

    return { shouldEnd: false };
  }

  /**
   * Get a summary of the current combat state
   */
  static getCombatSummary(combat: Combat): string {
    if (!combat.isActive) {
      return 'Combat has ended.';
    }

    const current = this.getCurrentCombatant(combat);
    const lines: string[] = [];

    lines.push(`═══════════════════════════════════════════════`);
    lines.push(`⚔️ COMBAT STATUS - Round ${combat.round}`);
    lines.push(`═══════════════════════════════════════════════`);
    lines.push('');

    if (current) {
      lines.push(`CURRENT TURN: ${current.name}`);
      lines.push(`  HP: ${current.currentHp}/${current.maxHp}${current.tempHp > 0 ? ` (+${current.tempHp} temp)` : ''}`);
      lines.push(
        `  Actions: ${current.turnResources.hasAction ? '✓ Action' : '✗ Action'} | ${current.turnResources.hasBonusAction ? '✓ Bonus' : '✗ Bonus'} | Movement: ${current.turnResources.movementRemaining}ft`
      );
      if (current.conditions.length > 0) {
        lines.push(
          `  Conditions: ${current.conditions.map((c) => c.name).join(', ')}`
        );
      }
      lines.push('');
    }

    lines.push('INITIATIVE ORDER:');
    combat.initiativeOrder.forEach((c, index) => {
      const marker = index === combat.currentTurnIndex ? '▶' : ' ';
      const hpStatus =
        c.status === 'defeated'
          ? '[Defeated]'
          : c.status === 'fled'
            ? '[Fled]'
            : isBloodied(c.currentHp, c.maxHp)
              ? '[Bloodied]'
              : '';
      lines.push(
        `${marker} ${c.initiative.total.toString().padStart(2)} | ${c.name} (${c.currentHp}/${c.maxHp} HP) ${hpStatus}`
      );
    });

    if (combat.environmentalEffects.length > 0) {
      lines.push('');
      lines.push('ENVIRONMENTAL EFFECTS:');
      combat.environmentalEffects.forEach((e) => {
        lines.push(`  • ${e}`);
      });
    }

    lines.push(`═══════════════════════════════════════════════`);

    return lines.join('\n');
  }

  /**
   * Get combatant by ID
   */
  static getCombatant(combat: Combat, id: string): Combatant | undefined {
    return combat.initiativeOrder.find((c) => c.id === id);
  }

  /**
   * Get all active combatants of a specific type
   */
  static getActiveCombatantsByType(
    combat: Combat,
    type: CombatantType
  ): Combatant[] {
    return combat.initiativeOrder.filter(
      (c) => c.type === type && c.status === 'active'
    );
  }

  /**
   * Check if a combatant has a specific condition
   */
  static hasCondition(
    combat: Combat,
    combatantId: string,
    conditionName: ConditionType
  ): boolean {
    const combatant = this.getCombatant(combat, combatantId);
    if (!combatant) return false;
    return combatant.conditions.some((c) => c.name === conditionName);
  }

  /**
   * Add an environmental effect
   */
  static addEnvironmentalEffect(combat: Combat, effect: string): Combat {
    return {
      ...combat,
      environmentalEffects: [...combat.environmentalEffects, effect],
    };
  }

  /**
   * Remove an environmental effect
   */
  static removeEnvironmentalEffect(combat: Combat, effect: string): Combat {
    return {
      ...combat,
      environmentalEffects: combat.environmentalEffects.filter(
        (e) => e !== effect
      ),
    };
  }

  /**
   * Add temporary HP to a combatant
   */
  static addTempHp(combat: Combat, targetId: string, amount: number): Combat {
    const index = combat.initiativeOrder.findIndex((c) => c.id === targetId);
    if (index === -1) return combat;

    const combatant = combat.initiativeOrder[index];
    // Temp HP doesn't stack - take the higher value
    const newTempHp = Math.max(combatant.tempHp, amount);

    const updatedOrder = [...combat.initiativeOrder];
    updatedOrder[index] = {
      ...combatant,
      tempHp: newTempHp,
    };

    return { ...combat, initiativeOrder: updatedOrder };
  }
}

export default CombatEngine;
