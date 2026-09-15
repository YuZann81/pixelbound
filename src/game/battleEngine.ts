import { BattleUnit, CombatLogEntry, FloatingText, FormationGrid, HeroDefinition, HeroStats, Projectile, StatusEffect } from '../types';
import { HERO_ROSTER, ENEMY_ROSTER_TEMPLATES } from '../data/heroes';
import { slotToBattleCoords } from './formationEngine';

export interface BattleTargetEffect {
  targetUid: string;
  damage?: number;
  heal?: number;
  shield?: number;
  isCrit?: boolean;
  isMiss?: boolean;
  statusApplied?: StatusEffect;
  targetDied?: boolean;
  hpAfter: number;
  maxHp: number;
}

export interface BattleAction {
  id: string;
  roundNumber: number;
  turnIndex: number;
  actorUid: string;
  isPlayer: boolean;
  isUltimate: boolean;
  skillName: string;
  actionType: 'melee' | 'ranged' | 'aoe' | 'heal' | 'shield';
  targetUids: string[];
  effects: BattleTargetEffect[];
  actorEnergyAfter: number;
  logMessage: string;
  skippedReason?: 'dead' | 'stunned';
}

export interface BattleSnapshot {
  units: BattleUnit[];
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  combatLogs: CombatLogEntry[];
  battleTime: number; // in seconds
  roundNumber: number;
  state: 'countdown' | 'fighting' | 'victory' | 'defeat';
  countdownValue: number;
  speedMultiplier: number;
}

export class BattleEngine {
  private units: BattleUnit[] = [];
  private combatLogs: CombatLogEntry[] = [];
  private battleTime: number = 0;
  private roundNumber: number = 1;
  private turnQueue: string[] = []; // UIDs of living units scheduled for current round
  private state: 'countdown' | 'fighting' | 'victory' | 'defeat' = 'countdown';
  private countdownTimer: number = 2.0; // 2 seconds
  private speedMultiplier: number = 1.0;
  private playerPower: number = 0;
  private enemyPower: number = 0;
  private actionCounter: number = 1;

  constructor() {}

  // Initialize a 5v5 battle with formation anchor positions
  public initBattle(
    playerFormation: FormationGrid,
    enemySetup: { heroId: string; level: number; row: number; col: number }[],
    playerLevels: Record<string, number>,
    playerStars: Record<string, number> = {}
  ) {
    this.units = [];
    this.combatLogs = [];
    this.battleTime = 0;
    this.roundNumber = 1;
    this.turnQueue = [];
    this.state = 'countdown';
    this.countdownTimer = 2.0;
    this.playerPower = 0;
    this.enemyPower = 0;
    this.actionCounter = 1;

    // 1. Setup Player Units (Left side: C1=Back col 0, C2=Mid col 1, C3=Front col 2)
    playerFormation.forEach((slot) => {
      if (!slot.heroId) return;
      const fallbackDef = HERO_ROSTER['ashen_knight'] || Object.values(HERO_ROSTER)[0];
      const def = HERO_ROSTER[slot.heroId] || fallbackDef;
      if (!def) return;

      const level = playerLevels[slot.heroId] || 1;
      const stars = playerStars[slot.heroId] || 1;
      const stats = this.scaleStats(def.baseStats, level, stars);
      const coords = slotToBattleCoords(slot.row, slot.col, true);

      this.playerPower += Math.round(stats.hp * 0.2 + stats.atk * 1.5 + stats.def * 1.0 + stats.spd * 0.5);

      const unit: BattleUnit = {
        uid: `p_${slot.heroId}_${slot.row}_${slot.col}`,
        heroId: slot.heroId,
        name: def.name,
        isPlayer: true,
        role: def.role,
        element: def.element,
        rarity: def.rarity,
        level,
        stars,
        stats,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        energy: 20, // initial starting energy
        maxEnergy: 100,
        x: coords.x,
        y: coords.y,
        originX: coords.x,
        originY: coords.y,
        anchorX: coords.x,
        anchorY: coords.y,
        slotRow: slot.row,
        slotCol: slot.col,
        targetUid: null,
        state: 'idle',
        actionProgress: 0,
        animTimer: 0,
        lastActionTime: 0,
        isUltimateReady: false,
        definition: def,
        attackPhase: 'none',
        attackTimer: 0,
        lungeTargetX: coords.x,
        lungeTargetY: coords.y,
        hurtTimer: 0,
        statusEffects: [],
      };

      this.units.push(unit);
    });

    // 2. Setup Enemy Units (Right side: Col 0 Front, Col 1 Mid, Col 2 Back)
    const fallbackDef = HERO_ROSTER['decayed_vanguard'] || HERO_ROSTER['aegis_knight'];
    enemySetup.forEach((enemy, idx) => {
      const def = ENEMY_ROSTER_TEMPLATES[enemy.heroId] || HERO_ROSTER[enemy.heroId] || fallbackDef;
      if (!def) return;

      const stats = this.scaleStats(def.baseStats, enemy.level);
      const coords = slotToBattleCoords(enemy.row, enemy.col, false);

      this.enemyPower += Math.round(stats.hp * 0.2 + stats.atk * 1.5 + stats.def * 1.0 + stats.spd * 0.5);

      const unit: BattleUnit = {
        uid: `e_${enemy.heroId}_${idx}_${enemy.row}_${enemy.col}`,
        heroId: enemy.heroId,
        name: def.name,
        isPlayer: false,
        role: def.role,
        element: def.element,
        rarity: def.rarity,
        level: enemy.level,
        stars: 1,
        stats,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        energy: 15,
        maxEnergy: 100,
        x: coords.x,
        y: coords.y,
        originX: coords.x,
        originY: coords.y,
        anchorX: coords.x,
        anchorY: coords.y,
        slotRow: enemy.row,
        slotCol: enemy.col,
        targetUid: null,
        state: 'idle',
        actionProgress: 0,
        animTimer: 0,
        lastActionTime: 0,
        isUltimateReady: false,
        definition: def,
        attackPhase: 'none',
        attackTimer: 0,
        lungeTargetX: coords.x,
        lungeTargetY: coords.y,
        hurtTimer: 0,
        statusEffects: [],
      };

      this.units.push(unit);
    });

    this.addLog(`Battle engaged. Formations locked. (Power: ${this.playerPower} vs ${this.enemyPower})`, 'attack');
    this.buildRoundQueue();
  }

  private scaleStats(base: HeroStats, level: number, stars: number = 1): HeroStats {
    const starMult = 1 + (Math.max(1, stars) - 1) * 0.15;
    const scaleFactor = (1 + (level - 1) * 0.12) * starMult;
    return {
      hp: Math.round(base.hp * scaleFactor),
      maxHp: Math.round(base.maxHp * scaleFactor),
      atk: Math.round(base.atk * scaleFactor),
      def: Math.round(base.def * scaleFactor),
      spd: base.spd,
      critRate: base.critRate,
      critDmg: base.critDmg,
      range: base.range,
    };
  }

  // Column priority:
  // Player: C3 (col 2 = Front) is Priority 1, C2 (col 1 = Mid) is Priority 2, C1 (col 0 = Back) is Priority 3
  // Enemy: Col 0 (Front) is Priority 1, Col 1 (Mid) is Priority 2, Col 2 (Back) is Priority 3
  private getColumnPriority(unit: BattleUnit): number {
    if (unit.isPlayer) {
      if (unit.slotCol === 2) return 1; // C3 Front
      if (unit.slotCol === 1) return 2; // C2 Mid
      return 3; // C1 Back
    } else {
      if (unit.slotCol === 0) return 1; // Front
      if (unit.slotCol === 1) return 2; // Mid
      return 3; // Back
    }
  }

  // Turn Order Rule:
  // Priority: FRONT -> MID -> BACK.
  // Within the same column line: higher SPD acts first.
  // Tiebreak: Player before Enemy, then lower row index.
  private buildRoundQueue() {
    const livingUnits = this.units.filter((u) => u.state !== 'dead' && u.currentHp > 0);

    livingUnits.sort((a, b) => {
      const prioA = this.getColumnPriority(a);
      const prioB = this.getColumnPriority(b);

      if (prioA !== prioB) {
        return prioA - prioB; // 1 (Front) before 2 (Mid) before 3 (Back)
      }

      // Same column line: Higher SPD acts first!
      if (b.stats.spd !== a.stats.spd) {
        return b.stats.spd - a.stats.spd;
      }

      // Tiebreaker: Player acts first
      if (a.isPlayer !== b.isPlayer) {
        return a.isPlayer ? -1 : 1;
      }

      // Tiebreaker: Lower row index
      return a.slotRow - b.slotRow;
    });

    this.turnQueue = livingUnits.map((u) => u.uid);
  }

  // Target Priority Rule:
  // Normal attacks: FRONT -> MID -> BACK.
  // If no valid target in front -> target mid. If no valid in mid -> target back.
  // Within column: closest row to attacker, then lowest row index.
  private selectNormalTarget(attacker: BattleUnit): BattleUnit | null {
    const opponents = this.units.filter((u) => u.isPlayer !== attacker.isPlayer && u.state !== 'dead' && u.currentHp > 0);
    if (opponents.length === 0) return null;

    // Check line by line in order: Front -> Mid -> Back
    const linesToSearch = attacker.isPlayer
      ? [0, 1, 2] // Enemy lines: 0=Front, 1=Mid, 2=Back
      : [2, 1, 0]; // Player lines: 2=C3 Front, 1=C2 Mid, 0=C1 Back

    for (const col of linesToSearch) {
      const inLine = opponents.filter((u) => u.slotCol === col);
      if (inLine.length > 0) {
        // Sort by closest row to attacker, then lower row
        inLine.sort((a, b) => {
          const distA = Math.abs(a.slotRow - attacker.slotRow);
          const distB = Math.abs(b.slotRow - attacker.slotRow);
          if (distA !== distB) return distA - distB;
          return a.slotRow - b.slotRow;
        });
        return inLine[0];
      }
    }

    return opponents[0] || null;
  }

  // Assassin Ultimate Target Priority Rule:
  // Assassin Ultimate can bypass normal priority to strike the BACKLINE first.
  private selectAssassinUltimateTarget(attacker: BattleUnit): BattleUnit | null {
    const opponents = this.units.filter((u) => u.isPlayer !== attacker.isPlayer && u.state !== 'dead' && u.currentHp > 0);
    if (opponents.length === 0) return null;

    // Search in reverse order: Back -> Mid -> Front
    const linesToSearch = attacker.isPlayer
      ? [2, 1, 0] // Enemy: 2=Back, 1=Mid, 0=Front
      : [0, 1, 2]; // Player: 0=C1 Back, 1=C2 Mid, 2=C3 Front

    for (const col of linesToSearch) {
      const inLine = opponents.filter((u) => u.slotCol === col);
      if (inLine.length > 0) {
        // In the target line, focus lowest HP percentage opponent
        inLine.sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp);
        return inLine[0];
      }
    }

    return opponents[0] || null;
  }

  // Step the simulation by ONE atomic action.
  // Returns the action executed, or null if the battle has concluded.
  public stepTurn(): BattleAction | null {
    // Check if battle already concluded
    if (this.state === 'victory' || this.state === 'defeat') {
      return null;
    }

    // Advance round if queue is exhausted
    if (this.turnQueue.length === 0) {
      this.roundNumber++;
      this.buildRoundQueue();

      // If still empty (e.g. all units dead), resolve battle
      if (this.turnQueue.length === 0) {
        this.checkBattleEnd();
        return null;
      }
    }

    // Pop the next scheduled actor
    const actorUid = this.turnQueue.shift()!;
    const actor = this.units.find((u) => u.uid === actorUid);

    // TEST F — Dead Actor: Hero dies before its scheduled action -> skipped!
    if (!actor || actor.state === 'dead' || actor.currentHp <= 0) {
      return {
        id: `act_${this.actionCounter++}`,
        roundNumber: this.roundNumber,
        turnIndex: this.turnQueue.length,
        actorUid,
        isPlayer: actor ? actor.isPlayer : true,
        isUltimate: false,
        skillName: 'None',
        actionType: 'melee',
        targetUids: [],
        effects: [],
        actorEnergyAfter: 0,
        logMessage: '',
        skippedReason: 'dead',
      };
    }

    // Handle Status Effects on actor:
    // 1. Burn tick
    const burnEffect = actor.statusEffects.find((s) => s.type === 'burn');
    if (burnEffect) {
      const burnDmg = Math.max(5, Math.round(actor.maxHp * 0.05));
      actor.currentHp = Math.max(0, actor.currentHp - burnDmg);
      burnEffect.duration--;
      if (burnEffect.duration <= 0) {
        actor.statusEffects = actor.statusEffects.filter((s) => s !== burnEffect);
      }
      if (actor.currentHp <= 0) {
        actor.state = 'dead';
        this.addLog(`${actor.name} succumbed to Burn damage!`, 'death');
        this.checkBattleEnd();
        return {
          id: `act_${this.actionCounter++}`,
          roundNumber: this.roundNumber,
          turnIndex: this.turnQueue.length,
          actorUid,
          isPlayer: actor.isPlayer,
          isUltimate: false,
          skillName: 'Burn Damage',
          actionType: 'melee',
          targetUids: [actor.uid],
          effects: [{
            targetUid: actor.uid,
            damage: burnDmg,
            hpAfter: 0,
            maxHp: actor.maxHp,
            targetDied: true,
          }],
          actorEnergyAfter: actor.energy,
          logMessage: `${actor.name} succumbed to burn.`,
          skippedReason: 'dead',
        };
      }
    }

    // 2. Stun: skip turn
    const stunEffect = actor.statusEffects.find((s) => s.type === 'stun');
    if (stunEffect) {
      stunEffect.duration--;
      if (stunEffect.duration <= 0) {
        actor.statusEffects = actor.statusEffects.filter((s) => s !== stunEffect);
      }
      this.addLog(`${actor.name} is STUNNED and cannot act!`, 'attack');
      return {
        id: `act_${this.actionCounter++}`,
        roundNumber: this.roundNumber,
        turnIndex: this.turnQueue.length,
        actorUid,
        isPlayer: actor.isPlayer,
        isUltimate: false,
        skillName: 'Stunned',
        actionType: 'melee',
        targetUids: [],
        effects: [],
        actorEnergyAfter: actor.energy,
        logMessage: `${actor.name} is stunned.`,
        skippedReason: 'stunned',
      };
    }

    // Check if battle already won before acting
    if (this.checkBattleEnd()) {
      return null;
    }

    // Determine if Ultimate is ready (Energy >= 100)
    const isUltimate = actor.energy >= actor.maxEnergy;

    let targetUids: string[] = [];
    const effects: BattleTargetEffect[] = [];
    let actionType: BattleAction['actionType'] = actor.stats.range > 1 ? 'ranged' : 'melee';
    let skillName = actor.definition.basicAttack.name;
    let logMsg = '';

    if (isUltimate) {
      const ult = actor.definition.ultimate;
      skillName = ult.name;
      actor.energy = 0; // Ultimate consumes all energy

      if (ult.type === 'heal') {
        actionType = 'heal';
        const allies = this.units.filter((u) => u.isPlayer === actor.isPlayer && u.state !== 'dead' && u.currentHp > 0);
        const healAmount = Math.round(actor.stats.atk * ult.multiplier);

        allies.forEach((ally) => {
          const oldHp = ally.currentHp;
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmount);
          const actualHeal = ally.currentHp - oldHp;
          targetUids.push(ally.uid);
          effects.push({
            targetUid: ally.uid,
            heal: actualHeal,
            hpAfter: ally.currentHp,
            maxHp: ally.maxHp,
          });
        });
        logMsg = `${actor.name} unleashed [${ult.name}], restoring ${healAmount} HP to allies!`;
      } else if (ult.type === 'shield') {
        actionType = 'shield';
        const shieldVal = Math.round(actor.maxHp * 0.35);
        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + shieldVal);
        targetUids.push(actor.uid);
        effects.push({
          targetUid: actor.uid,
          shield: shieldVal,
          hpAfter: actor.currentHp,
          maxHp: actor.maxHp,
        });
        logMsg = `${actor.name} unleashed [${ult.name}], gaining a ${shieldVal} point shield!`;
      } else if (ult.type === 'aoe_damage') {
        actionType = 'aoe';
        const enemies = this.units.filter((u) => u.isPlayer !== actor.isPlayer && u.state !== 'dead' && u.currentHp > 0);
        enemies.forEach((enemy) => {
          targetUids.push(enemy.uid);
          const dmg = this.calculateDamage(actor, enemy, ult.multiplier);
          enemy.currentHp = Math.max(0, enemy.currentHp - dmg.damage);
          const died = enemy.currentHp === 0;
          if (died) enemy.state = 'dead';
          effects.push({
            targetUid: enemy.uid,
            damage: dmg.damage,
            isCrit: dmg.isCrit,
            targetDied: died,
            hpAfter: enemy.currentHp,
            maxHp: enemy.maxHp,
          });
          enemy.energy = Math.min(enemy.maxEnergy, enemy.energy + 15);
        });
        logMsg = `${actor.name} unleashed [${ult.name}], blasting all enemies!`;
      } else {
        // Single target burst (e.g. Assassin Ultimate strikes backline)
        actionType = actor.stats.range > 1 ? 'ranged' : 'melee';
        let target = actor.role === 'ASSASSIN'
          ? this.selectAssassinUltimateTarget(actor)
          : this.selectNormalTarget(actor);

        if (target) {
          targetUids.push(target.uid);
          const dmg = this.calculateDamage(actor, target, ult.multiplier);
          target.currentHp = Math.max(0, target.currentHp - dmg.damage);
          const died = target.currentHp === 0;
          if (died) target.state = 'dead';
          effects.push({
            targetUid: target.uid,
            damage: dmg.damage,
            isCrit: dmg.isCrit,
            targetDied: died,
            hpAfter: target.currentHp,
            maxHp: target.maxHp,
          });
          target.energy = Math.min(target.maxEnergy, target.energy + 15);
          logMsg = `${actor.name} unleashed [${ult.name}] on ${target.name} for ${dmg.damage} damage!`;
        }
      }
    } else {
      // Normal Basic Attack
      const target = this.selectNormalTarget(actor);
      if (target) {
        targetUids.push(target.uid);
        const dmg = this.calculateDamage(actor, target, actor.definition.basicAttack.damageMult || 1.0);
        target.currentHp = Math.max(0, target.currentHp - dmg.damage);
        const died = target.currentHp === 0;
        if (died) target.state = 'dead';

        effects.push({
          targetUid: target.uid,
          damage: dmg.damage,
          isCrit: dmg.isCrit,
          targetDied: died,
          hpAfter: target.currentHp,
          maxHp: target.maxHp,
        });

        // Basic attack grants attacker +25 energy
        actor.energy = Math.min(actor.maxEnergy, actor.energy + 25);
        // Target taking hit gains +15 energy
        target.energy = Math.min(target.maxEnergy, target.energy + 15);

        // Passive check: Dawn Priestess heals lowest ally on-hit
        if (actor.heroId === 'dawn_priestess') {
          const livingAllies = this.units.filter((u) => u.isPlayer === actor.isPlayer && u.state !== 'dead' && u.currentHp > 0);
          if (livingAllies.length > 0) {
            livingAllies.sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp);
            const lowest = livingAllies[0];
            const healVal = Math.round(actor.stats.atk * 0.4);
            lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + healVal);
            effects.push({
              targetUid: lowest.uid,
              heal: healVal,
              hpAfter: lowest.currentHp,
              maxHp: lowest.maxHp,
            });
          }
        }

        logMsg = `${actor.name} attacked ${target.name} for ${dmg.damage} damage.`;
      }
    }

    if (logMsg) {
      this.addLog(logMsg, isUltimate ? 'ultimate' : 'attack');
    }

    this.checkBattleEnd();

    return {
      id: `act_${this.actionCounter++}`,
      roundNumber: this.roundNumber,
      turnIndex: this.turnQueue.length,
      actorUid: actor.uid,
      isPlayer: actor.isPlayer,
      isUltimate,
      skillName,
      actionType,
      targetUids,
      effects,
      actorEnergyAfter: actor.energy,
      logMessage: logMsg,
    };
  }

  // Deterministic damage calculation:
  // Attacker ATK + skill mult - DEF mitigation = damage
  private calculateDamage(attacker: BattleUnit, target: BattleUnit, multiplier: number = 1.0): { damage: number; isCrit: boolean } {
    let atkMod = 1.0;
    if (attacker.statusEffects.some((s) => s.type === 'atk_buff')) atkMod += 0.25;

    let defMod = 1.0;
    if (target.statusEffects.some((s) => s.type === 'def_debuff')) defMod -= 0.25;

    const effectiveAtk = attacker.stats.atk * multiplier * atkMod;
    const effectiveDef = target.stats.def * defMod;

    // Defense mitigation: 100 / (100 + DEF)
    const mitigation = 100 / (100 + effectiveDef);
    let damage = Math.max(12, Math.round(effectiveAtk * mitigation));

    // Controlled Critical Hit Check
    let isCrit = false;
    if (Math.random() < attacker.stats.critRate) {
      damage = Math.round(damage * attacker.stats.critDmg);
      isCrit = true;
    }

    return { damage, isCrit };
  }

  // Check victory / defeat condition
  public checkBattleEnd(): boolean {
    const livingPlayer = this.units.filter((u) => u.isPlayer && u.state !== 'dead' && u.currentHp > 0);
    const livingEnemy = this.units.filter((u) => !u.isPlayer && u.state !== 'dead' && u.currentHp > 0);

    if (livingEnemy.length === 0 && livingPlayer.length > 0) {
      this.state = 'victory';
      this.addLog('VICTORY! All enemy forces have been routed.', 'attack');
      return true;
    } else if (livingPlayer.length === 0) {
      this.state = 'defeat';
      this.addLog('DEFEAT! Your squad has fallen.', 'death');
      return true;
    }
    return false;
  }

  // Victory Analysis Evaluator (Section 20):
  // Returns: 'PERFECT' | 'DOMINANT' | 'CLOSE' | 'CLUTCH' | 'CLUTCH OUTPLAY' | 'OUTPLAY'
  public getVictoryDescriptor(): 'PERFECT' | 'DOMINANT' | 'CLOSE' | 'CLUTCH' | 'CLUTCH OUTPLAY' | 'OUTPLAY' {
    const livingPlayer = this.units.filter((u) => u.isPlayer && u.state !== 'dead' && u.currentHp > 0);
    const totalPlayer = this.units.filter((u) => u.isPlayer);
    const totalMaxHp = totalPlayer.reduce((acc, u) => acc + u.maxHp, 0);
    const currentTotalHp = livingPlayer.reduce((acc, u) => acc + u.currentHp, 0);
    const hpRatio = totalMaxHp > 0 ? currentTotalHp / totalMaxHp : 0;

    const isLowerPower = this.playerPower < this.enemyPower * 0.92;
    const isSeverelyUnderpowered = this.playerPower < this.enemyPower * 0.82;

    // PERFECT: 0 casualties & very high remaining HP
    if (livingPlayer.length === totalPlayer.length && hpRatio >= 0.75) {
      return 'PERFECT';
    }

    // CLUTCH OUTPLAY: lower power and 1-2 survivors
    if (isLowerPower && livingPlayer.length <= 2) {
      return 'CLUTCH OUTPLAY';
    }

    // OUTPLAY: won with severely lower power
    if (isSeverelyUnderpowered) {
      return 'OUTPLAY';
    }

    // CLUTCH: only 1 hero survived or HP < 25%
    if (livingPlayer.length === 1 || hpRatio <= 0.25) {
      return 'CLUTCH';
    }

    // DOMINANT: 4 or 5 heroes survived
    if (livingPlayer.length >= 4) {
      return 'DOMINANT';
    }

    // CLOSE: 2 or 3 heroes survived
    return 'CLOSE';
  }

  // Star rating based on survivors (1 to 3 stars)
  public getStars(): number {
    const survivors = this.units.filter((u) => u.isPlayer && u.state !== 'dead' && u.currentHp > 0).length;
    if (survivors >= 4) return 3;
    if (survivors >= 2) return 2;
    return 1;
  }

  public setSpeedMultiplier(speed: number) {
    this.speedMultiplier = speed;
  }

  public getState(): 'countdown' | 'fighting' | 'victory' | 'defeat' {
    return this.state;
  }

  public setState(state: 'countdown' | 'fighting' | 'victory' | 'defeat') {
    this.state = state;
  }

  public getPlayerPower(): number {
    return this.playerPower;
  }

  public getEnemyPower(): number {
    return this.enemyPower;
  }

  public getUnits(): BattleUnit[] {
    return this.units;
  }

  public getRoundNumber(): number {
    return this.roundNumber;
  }

  private addLog(text: string, type: CombatLogEntry['type']) {
    this.combatLogs.unshift({
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: Math.round(this.battleTime),
      text,
      type,
    });
    if (this.combatLogs.length > 15) {
      this.combatLogs.pop();
    }
  }

  public getSnapshot(): BattleSnapshot {
    return {
      units: [...this.units],
      projectiles: [],
      floatingTexts: [],
      combatLogs: [...this.combatLogs],
      battleTime: this.battleTime,
      roundNumber: this.roundNumber,
      state: this.state,
      countdownValue: Math.max(1, Math.ceil(this.countdownTimer)),
      speedMultiplier: this.speedMultiplier,
    };
  }
}
