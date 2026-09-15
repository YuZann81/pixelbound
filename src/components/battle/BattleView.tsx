import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CampaignChapter, PlayerState, BattleUnit, FloatingText, PlayerHero, Projectile } from '../../types';
import { BattleEngine, BattleAction, BattleSnapshot } from '../../game/battleEngine';
import { slotToBattleCoords } from '../../game/formationEngine';
import { PixelSprite } from '../common/PixelSprite';
import { sound } from '../../game/audio';
import { getElementIcon, getRoleIcon } from '../common/HDHeroCard';
import { FastForward, Play, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface BattleViewProps {
  playerState: PlayerState;
  chapter: CampaignChapter;
  onBattleFinished: (result: 'victory' | 'defeat', stars: number, descriptor?: string) => void;
  onRetreat: () => void;
}

type ActionPhase = 'idle' | 'anticipation' | 'action' | 'impact' | 'recovery';

export const BattleView: React.FC<BattleViewProps> = ({
  playerState,
  chapter,
  onBattleFinished,
  onRetreat,
}) => {
  const engineRef = useRef<BattleEngine | null>(null);

  // Core visual state (only updated on discrete turn events)
  const [units, setUnits] = useState<BattleUnit[]>([]);
  const [countdown, setCountdown] = useState<number>(2);
  const [isBattleStarted, setIsBattleStarted] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [battleTime, setBattleTime] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Turn lifecycle visual state
  const [activeActorUid, setActiveActorUid] = useState<string | null>(null);
  const [activeTargetUids, setActiveTargetUids] = useState<string[]>([]);
  const [actionPhase, setActionPhase] = useState<ActionPhase>('idle');
  const [currentAction, setCurrentAction] = useState<BattleAction | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [activeProjectiles, setActiveProjectiles] = useState<Projectile[]>([]);

  // Refs for tracking async timeouts and unmounting safely
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTerminatedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const speedRef = useRef<number>(1);
  const nextTextIdRef = useRef<number>(1);
  const nextProjIdRef = useRef<number>(1);

  isPausedRef.current = isPaused;
  speedRef.current = speed;

  // Initialize battle engine
  useEffect(() => {
    isTerminatedRef.current = false;
    const engine = new BattleEngine();

    const playerLevels: Record<string, number> = {};
    const playerStars: Record<string, number> = {};
    (Object.values(playerState.ownedHeroes) as PlayerHero[]).forEach((h) => {
      playerLevels[h.heroId] = h.level;
      playerStars[h.heroId] = h.stars || 1;
    });

    engine.initBattle(playerState.formation, chapter.enemyComposition, playerLevels, playerStars);
    engineRef.current = engine;
    setUnits([...engine.getUnits()]);

    // Countdown sequence (2s)
    setCountdown(2);
    const cd1 = setTimeout(() => {
      if (isTerminatedRef.current) return;
      setCountdown(1);
    }, 1000);

    const cd2 = setTimeout(() => {
      if (isTerminatedRef.current) return;
      setCountdown(0);
      setIsBattleStarted(true);
      engine.setState('fighting');
      startNextTurn();
    }, 2000);

    return () => {
      isTerminatedRef.current = true;
      clearTimeout(cd1);
      clearTimeout(cd2);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chapter, playerState]);

  // Floating text helper with auto-cleanup
  const addFloatingText = (x: number, y: number, text: string, type: FloatingText['type'], color: string) => {
    const id = `ft_${nextTextIdRef.current++}`;
    const newText: FloatingText = { id, x, y, text, type, color, createdAt: Date.now() };
    setFloatingTexts((prev) => [...prev, newText]);

    setTimeout(() => {
      if (isTerminatedRef.current) return;
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 900);
  };

  // Trigger brief screen shake
  const triggerShake = (durationMs: number) => {
    setScreenShake(true);
    setTimeout(() => {
      if (isTerminatedRef.current) return;
      setScreenShake(false);
    }, durationMs);
  };

  // Main turn lifecycle executor:
  // SELECT ACTOR -> SELECT TARGET -> ANTICIPATION -> ACTION -> IMPACT -> RECOVERY -> RETURN TO ANCHOR -> NEXT ACTOR
  const executeAction = useCallback((action: BattleAction) => {
    if (isTerminatedRef.current) return;
    const engine = engineRef.current;
    if (!engine) return;

    const currentSpeed = speedRef.current;
    const timeScale = 1 / currentSpeed;

    const actor = engine.getUnits().find((u) => u.uid === action.actorUid);
    if (!actor) {
      startNextTurn();
      return;
    }

    setCurrentAction(action);
    setActiveActorUid(action.actorUid);
    setActiveTargetUids(action.targetUids);
    setRoundNumber(action.roundNumber);

    // 1. ANTICIPATION PHASE (Actor highlight, pose set, target designated)
    setActionPhase('anticipation');
    setUnits([...engine.getUnits()]);

    const anticipationDuration = Math.round(150 * timeScale);
    const actionDuration = Math.round(220 * timeScale);
    const impactDuration = Math.round(240 * timeScale);
    const recoveryDuration = Math.round(180 * timeScale);
    const interTurnPause = Math.round(120 * timeScale);

    timerRef.current = setTimeout(() => {
      if (isTerminatedRef.current) return;

      // 2. ACTION / STRIKE PHASE
      setActionPhase('action');

      // If ranged or mage: spawn projectile from actor to target
      if (action.actionType === 'ranged' && action.targetUids.length > 0) {
        const primaryTarget = engine.getUnits().find((u) => u.uid === action.targetUids[0]);
        if (primaryTarget) {
          const projId = `proj_${nextProjIdRef.current++}`;
          const proj: Projectile = {
            id: projId,
            sourceUid: actor.uid,
            targetUid: primaryTarget.uid,
            isPlayer: actor.isPlayer,
            startX: actor.anchorX,
            startY: actor.anchorY,
            currentX: actor.anchorX,
            currentY: actor.anchorY,
            targetX: primaryTarget.anchorX,
            targetY: primaryTarget.anchorY,
            progress: 0,
            element: actor.element,
            color: actor.definition.colorScheme.primary,
          };
          setActiveProjectiles([proj]);
        }
      }

      // If ultimate: play ultimate sound
      if (action.isUltimate) {
        sound.playUltimate(actor.element);
      }

      timerRef.current = setTimeout(() => {
        if (isTerminatedRef.current) return;

        // Clear active projectiles upon landing
        setActiveProjectiles([]);

        // 3. IMPACT PHASE (Damage applied, HP drops, floating text, sound)
        setActionPhase('impact');

        // Play hit / crit sound
        const hasCrit = action.effects.some((e) => e.isCrit);
        if (hasCrit) {
          sound.playCrit();
          triggerShake(180);
        } else if (action.actionType === 'heal') {
          // Heal sound
        } else {
          sound.playHit();
        }

        // Spawn floating damage / heal texts on targets
        action.effects.forEach((eff) => {
          const targetUnit = engine.getUnits().find((u) => u.uid === eff.targetUid);
          if (targetUnit) {
            if (eff.damage !== undefined && eff.damage > 0) {
              const text = eff.isCrit ? `CRIT -${eff.damage}` : `-${eff.damage}`;
              const color = eff.isCrit ? '#fbbf24' : '#ef4444';
              const type = eff.isCrit ? 'crit' : 'damage';
              addFloatingText(targetUnit.anchorX, targetUnit.anchorY - 20, text, type, color);
            } else if (eff.heal !== undefined && eff.heal > 0) {
              addFloatingText(targetUnit.anchorX, targetUnit.anchorY - 20, `+${eff.heal}`, 'heal', '#22c55e');
            } else if (eff.shield !== undefined && eff.shield > 0) {
              addFloatingText(targetUnit.anchorX, targetUnit.anchorY - 20, `SHIELD +${eff.shield}`, 'shield', '#38bdf8');
            }
          }
        });

        // Update units to reflect post-impact HP and states
        setUnits([...engine.getUnits()]);

        timerRef.current = setTimeout(() => {
          if (isTerminatedRef.current) return;

          // 4. RECOVERY PHASE (Return to anchor, recover to idle)
          setActionPhase('recovery');

          timerRef.current = setTimeout(() => {
            if (isTerminatedRef.current) return;

            // 5. RETURN TO ANCHOR / IDLE RESET
            setActionPhase('idle');
            setActiveActorUid(null);
            setActiveTargetUids([]);
            setCurrentAction(null);
            setUnits([...engine.getUnits()]);

            // Check if battle finished
            const battleState = engine.getState();
            if (battleState === 'victory') {
              const stars = engine.getStars();
              const descriptor = engine.getVictoryDescriptor();
              setTimeout(() => {
                if (isTerminatedRef.current) return;
                onBattleFinished('victory', stars, descriptor);
              }, 1000);
              return;
            } else if (battleState === 'defeat') {
              setTimeout(() => {
                if (isTerminatedRef.current) return;
                onBattleFinished('defeat', 0);
              }, 1000);
              return;
            }

            // Dwell before next actor begins
            timerRef.current = setTimeout(() => {
              if (isTerminatedRef.current) return;
              startNextTurn();
            }, interTurnPause);
          }, recoveryDuration);
        }, impactDuration);
      }, actionDuration);
    }, anticipationDuration);
  }, [onBattleFinished]);

  // Request next action from the battle engine
  const startNextTurn = useCallback(() => {
    if (isTerminatedRef.current) return;
    if (isPausedRef.current) return;

    const engine = engineRef.current;
    if (!engine) return;

    // Check if battle ended
    const currentState = engine.getState();
    if (currentState === 'victory' || currentState === 'defeat') {
      return;
    }

    const nextAction = engine.stepTurn();
    if (!nextAction) {
      // Check if finished
      if (engine.getState() === 'victory') {
        const stars = engine.getStars();
        const descriptor = engine.getVictoryDescriptor();
        setTimeout(() => {
          if (isTerminatedRef.current) return;
          onBattleFinished('victory', stars, descriptor);
        }, 1000);
      } else if (engine.getState() === 'defeat') {
        setTimeout(() => {
          if (isTerminatedRef.current) return;
          onBattleFinished('defeat', 0);
        }, 1000);
      }
      return;
    }

    // TEST F — Dead Actor: Hero dies before scheduled action -> skipped immediately!
    if (nextAction.skippedReason === 'dead') {
      startNextTurn();
      return;
    }

    // If stunned, show brief stunned notice then advance
    if (nextAction.skippedReason === 'stunned') {
      const actor = engine.getUnits().find((u) => u.uid === nextAction.actorUid);
      if (actor) {
        addFloatingText(actor.anchorX, actor.anchorY - 20, 'STUNNED!', 'miss', '#a855f7');
      }
      setTimeout(() => {
        if (isTerminatedRef.current) return;
        startNextTurn();
      }, Math.round(300 / speedRef.current));
      return;
    }

    executeAction(nextAction);
  }, [executeAction, onBattleFinished]);

  // Speed toggle (1x / 2x)
  const toggleSpeed = () => {
    sound.playClick();
    const newSpeed = speed === 1 ? 2 : 1;
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
    engineRef.current?.setSpeedMultiplier(newSpeed);
  };

  // Pause / Resume toggle
  const togglePause = () => {
    sound.playClick();
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    isPausedRef.current = nextPaused;

    if (!nextPaused && isBattleStarted && actionPhase === 'idle') {
      startNextTurn();
    }
  };

  const playerUnits = units.filter((u) => u.isPlayer);
  const enemyUnits = units.filter((u) => !u.isPlayer);

  // Compute Lunge Offset for the active actor based on role and target position
  const getActorLungeStyle = (unit: BattleUnit) => {
    const isActor = unit.uid === activeActorUid;
    const isTarget = activeTargetUids.includes(unit.uid);

    // Recoil when taking impact damage
    if (isTarget && actionPhase === 'impact') {
      const recoilX = unit.isPlayer ? -8 : 8;
      return {
        transform: `translate3d(${recoilX}px, 0, 0)`,
        transition: 'transform 100ms ease-out',
      };
    }

    if (!isActor) {
      return {
        transform: 'translate3d(0, 0, 0)',
        transition: 'transform 180ms ease-in-out',
      };
    }

    // Anticipation: slight backward lean
    if (actionPhase === 'anticipation') {
      const leanX = unit.isPlayer ? -4 : 4;
      return {
        transform: `translate3d(${leanX}px, 0, 0)`,
        transition: 'transform 120ms ease-out',
      };
    }

    // Action & Impact: Forward Lunge (Melee / Assassin)
    if (actionPhase === 'action' || actionPhase === 'impact') {
      if (unit.stats.range > 1) {
        // Ranged / Mage / Support: Stay at anchor with small cast step
        const castStep = unit.isPlayer ? 8 : -8;
        return {
          transform: `translate3d(${castStep}px, 0, 0)`,
          transition: 'transform 150ms ease-out',
        };
      }

      // Melee / Assassin: Short controlled forward movement towards primary target
      let lungeDist = 45;
      if (unit.role === 'TANK') lungeDist = 32;
      else if (unit.role === 'FIGHTER') lungeDist = 58;
      else if (unit.role === 'ASSASSIN') lungeDist = 88;

      const targetUnit = units.find((u) => u.uid === activeTargetUids[0]);
      let dirY = 0;
      if (targetUnit) {
        const dy = targetUnit.anchorY - unit.anchorY;
        dirY = Math.sign(dy) * 12;
      }

      const lungeX = unit.isPlayer ? lungeDist : -lungeDist;
      return {
        transform: `translate3d(${lungeX}px, ${dirY}px, 0)`,
        transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      };
    }

    // Recovery & Idle: Strictly return to 0, 0 (Permanent formation anchor)
    return {
      transform: 'translate3d(0, 0, 0)',
      transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    };
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#0a0a0c] transition-transform duration-75 ${
        screenShake ? 'translate-y-1 -translate-x-1' : ''
      }`}
    >
      {/* 1. Minimal Battlefield Header (Chapter info, Round, Speed, Pause, Retreat) */}
      <header className="relative z-30 px-4 py-2 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
        {/* Left: Chapter name & Round */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-pixel uppercase font-bold text-amber-500 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            Chapter {chapter.chapterNumber}
          </span>
          <span className="font-medieval text-sm sm:text-base font-bold text-stone-100 truncate">
            {chapter.name}
          </span>
          <span className="text-xs text-stone-400 font-pixel">
            Round {roundNumber}
          </span>
        </div>

        {/* Right: 1x/2x Speed, Pause, Retreat */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            onClick={toggleSpeed}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-pixel font-bold border transition-colors cursor-pointer ${
              speed === 2
                ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-sm'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
            title="Toggle 1x / 2x Combat Speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{speed}x</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className={`p-1.5 rounded text-xs font-pixel border transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-500 text-stone-950 border-amber-300 font-bold'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
            title={isPaused ? 'Resume Combat' : 'Pause Combat'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Retreat */}
          <button
            onClick={() => {
              sound.playClick();
              onRetreat();
            }}
            className="px-2.5 py-1 rounded bg-stone-900 hover:bg-rose-950 border border-stone-700 hover:border-rose-700 text-stone-400 hover:text-rose-300 text-xs font-medieval transition-colors cursor-pointer"
          >
            Retreat
          </button>
        </div>
      </header>

      {/* 2. Main Central Battlefield (Anchored 3x3 Spatial Formations) */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2">
        {/* Arena Background Scenery */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#181614] via-[#100e0d] to-[#080706]" />

          {/* Center battlefield lane divide */}
          <svg viewBox="0 0 800 460" preserveAspectRatio="none" className="w-full h-full opacity-20">
            <line x1="400" y1="40" x2="400" y2="420" stroke="#78350f" strokeWidth="2" strokeDasharray="8 6" />
            <line x1="60" y1="130" x2="740" y2="130" stroke="#44403c" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="60" y1="235" x2="740" y2="235" stroke="#44403c" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="60" y1="340" x2="740" y2="340" stroke="#44403c" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Countdown Overlay (3, 2, 1) */}
        {countdown > 0 && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-center animate-pulse">
              <div className="text-7xl sm:text-9xl font-pixel font-black text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.9)]">
                {countdown}
              </div>
              <div className="font-medieval text-xs sm:text-sm uppercase tracking-widest text-stone-300 mt-2">
                Formations Locking In
              </div>
            </div>
          </div>
        )}

        {/* Action / Ultimate Callout Banner */}
        {currentAction && (actionPhase === 'anticipation' || actionPhase === 'action') && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none transition-all duration-150">
            <div className="px-4 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/80 shadow-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medieval text-xs sm:text-sm font-bold text-amber-300">
                {units.find((u) => u.uid === currentAction.actorUid)?.name}
              </span>
              <span className="text-[10px] font-pixel text-amber-400 font-bold uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                {currentAction.isUltimate ? `ULTIMATE: ${currentAction.skillName}` : currentAction.skillName}
              </span>
            </div>
          </div>
        )}

        {/* Virtual 800x460 Stage Canvas */}
        <div
          className="relative w-full h-full max-w-5xl max-h-[500px]"
          style={{ aspectRatio: '800 / 460' }}
        >
          {/* Permanent 3x3 Formation Ground Anchors */}
          {[
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
            { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
            { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
          ].map((slot) => {
            const pCoords = slotToBattleCoords(slot.row, slot.col, true);
            const eCoords = slotToBattleCoords(slot.row, slot.col, false);

            const hasLivingPlayer = units.some(
              (u) => u.isPlayer && u.slotRow === slot.row && u.slotCol === slot.col && u.state !== 'dead' && u.currentHp > 0
            );
            const hasLivingEnemy = units.some(
              (u) => !u.isPlayer && u.slotRow === slot.row && u.slotCol === slot.col && u.state !== 'dead' && u.currentHp > 0
            );

            return (
              <React.Fragment key={`slot_${slot.row}_${slot.col}`}>
                {/* Player Anchor Rune */}
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(pCoords.x / 800) * 100}%`,
                    top: `${((pCoords.y + 24) / 460) * 100}%`,
                  }}
                >
                  <div
                    className={`w-12 sm:w-14 h-4 sm:h-5 rounded-[100%] border transition-all duration-300 ${
                      hasLivingPlayer
                        ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : 'border-stone-800/40 bg-stone-900/10'
                    }`}
                  />
                </div>

                {/* Enemy Anchor Rune */}
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(eCoords.x / 800) * 100}%`,
                    top: `${((eCoords.y + 24) / 460) * 100}%`,
                  }}
                >
                  <div
                    className={`w-12 sm:w-14 h-4 sm:h-5 rounded-[100%] border transition-all duration-300 ${
                      hasLivingEnemy
                        ? 'border-rose-400/40 bg-rose-500/10 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                        : 'border-stone-800/40 bg-stone-900/10'
                    }`}
                  />
                </div>
              </React.Fragment>
            );
          })}

          {/* Render All 10 Battle Units */}
          {units.map((unit) => {
            const isDead = unit.state === 'dead' || unit.currentHp <= 0;
            const isActor = unit.uid === activeActorUid;
            const isTarget = activeTargetUids.includes(unit.uid);

            const leftPercent = (unit.anchorX / 800) * 100;
            const topPercent = (unit.anchorY / 460) * 100;

            const hpPercent = Math.max(0, (unit.currentHp / unit.maxHp) * 100);
            const energyPercent = Math.min(100, (unit.energy / unit.maxEnergy) * 100);
            const isUltReady = energyPercent >= 100 && !isDead;

            // Compute CSS movement transform
            const motionStyle = getActorLungeStyle(unit);

            // Derive sprite state
            let spriteState = unit.state;
            if (isDead) spriteState = 'dead';
            else if (isActor && (actionPhase === 'anticipation' || actionPhase === 'action')) {
              spriteState = unit.stats.range > 1 ? 'casting' : 'attacking';
            } else if (isTarget && actionPhase === 'impact') {
              spriteState = 'hurt';
            } else {
              spriteState = 'idle';
            }

            return (
              <div
                key={unit.uid}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none ${
                  isActor ? 'z-30' : isTarget ? 'z-20' : isDead ? 'z-0 opacity-40 grayscale' : 'z-10'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                {/* Visual Anchor Glow / Target Reticle */}
                {isActor && !isDead && (
                  <div className="absolute -bottom-1 w-14 h-5 rounded-[100%] border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse" />
                )}
                {isTarget && !isDead && (
                  <div className="absolute -bottom-1 w-14 h-5 rounded-[100%] border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-ping" />
                )}

                {/* Target Marker Indicator */}
                {isTarget && !isDead && (
                  <div className="absolute -top-7 text-rose-400 font-pixel text-xs animate-bounce font-bold">
                    ▼
                  </div>
                )}

                {/* Overhead Health & Energy Bar (for alive units) */}
                {!isDead && (
                  <div className="mb-1 w-14 sm:w-16 flex flex-col gap-0.5">
                    {/* HP Bar */}
                    <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-sm">
                      <div
                        className={`h-full transition-all duration-150 ${
                          unit.isPlayer ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                    {/* Energy Bar */}
                    <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className={`h-full transition-all duration-150 ${
                          isUltReady ? 'bg-amber-400 animate-pulse' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${energyPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Unit Sprite with Smooth Transform Transition */}
                <div style={motionStyle} className="relative flex flex-col items-center">
                  <PixelSprite
                    definition={unit.definition}
                    state={spriteState}
                    facing={unit.isPlayer ? 'right' : 'left'}
                    size={52}
                  />

                  {/* Floor Shadow */}
                  {!isDead && (
                    <div className="w-8 h-2 rounded-[100%] bg-black/50 blur-[1px] -mt-1" />
                  )}
                </div>

                {/* Name Label / Fallen indicator */}
                <span
                  className={`mt-1 text-[9px] font-pixel px-1.5 py-0.5 rounded border truncate max-w-20 ${
                    isDead
                      ? 'bg-stone-950/90 text-stone-500 border-stone-900'
                      : isActor
                      ? 'bg-amber-950 text-amber-300 border-amber-500 font-bold'
                      : 'bg-stone-950/80 text-stone-300 border-stone-800'
                  }`}
                >
                  {isDead ? 'FALLEN' : unit.name.split(' ')[0]}
                </span>
              </div>
            );
          })}

          {/* Active Projectiles */}
          {activeProjectiles.map((p) => {
            const leftPercent = (p.targetX / 800) * 100;
            const topPercent = (p.targetY / 460) * 100;
            return (
              <div
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full animate-spin"
                  style={{
                    backgroundColor: p.color,
                    boxShadow: `0 0 12px ${p.color}, 0 0 4px #ffffff`,
                  }}
                />
              </div>
            );
          })}

          {/* Floating Combat Texts (Damage numbers, crits, heals) */}
          {floatingTexts.map((ft) => {
            const leftPercent = (ft.x / 800) * 100;
            const topPercent = (ft.y / 460) * 100;

            return (
              <div
                key={ft.id}
                className={`absolute transform -translate-x-1/2 pointer-events-none font-pixel font-bold z-40 animate-bounce ${
                  ft.type === 'crit'
                    ? 'text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] scale-110'
                    : 'text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  color: ft.color,
                }}
              >
                {ft.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom HUD: Player's 5 Heroes Status */}
      <footer className="relative z-30 px-3 py-2 bg-stone-950/95 border-t border-stone-800 flex items-center justify-center">
        <div className="w-full grid grid-cols-5 gap-2 max-w-2xl mx-auto">
          {playerUnits.map((unit) => {
            const isDead = unit.state === 'dead' || unit.currentHp <= 0;
            const isActor = unit.uid === activeActorUid;
            const hpPercent = Math.max(0, (unit.currentHp / unit.maxHp) * 100);
            const energyPercent = Math.min(100, (unit.energy / unit.maxEnergy) * 100);
            const isUltReady = energyPercent >= 100 && !isDead;

            return (
              <div
                key={unit.uid}
                className={`relative p-1.5 rounded border transition-all duration-150 flex flex-col justify-between ${
                  isActor
                    ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400 shadow-md'
                    : isUltReady
                    ? 'bg-amber-950/40 border-amber-500/80'
                    : isDead
                    ? 'bg-stone-950 border-stone-900 opacity-40 grayscale'
                    : 'bg-stone-900/90 border-stone-800'
                }`}
              >
                {/* Hero Name & Element */}
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medieval text-[10px] sm:text-xs font-bold text-stone-200 truncate">
                    {unit.name.split(' ')[0]}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {getElementIcon(unit.element, 'w-3 h-3')}
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center justify-between text-[9px] font-pixel text-stone-400">
                    <span>HP</span>
                    <span className={isDead ? 'text-stone-500' : 'text-emerald-400'}>
                      {isDead ? '0' : `${Math.round(unit.currentHp)}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Energy Bar */}
                <div className="mt-1">
                  <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isUltReady ? 'bg-amber-400 animate-pulse' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Ult Ready Badge */}
                {isUltReady && (
                  <div className="absolute -top-1.5 inset-x-0 flex justify-center pointer-events-none">
                    <span className="text-[8px] font-pixel font-black uppercase text-stone-950 bg-amber-400 px-1 rounded shadow">
                      ULT
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
