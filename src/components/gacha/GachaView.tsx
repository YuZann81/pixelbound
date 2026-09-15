import React, { useState } from 'react';
import { PlayerState, HeroDefinition, HeroRarity, PlayerHero } from '../../types';
import { HERO_ROSTER, MYTHOS_HEROES, LEGENDS_HEROES, EPIC_HEROES, RARE_HEROES, UNCOMMON_HEROES, COMMON_HEROES } from '../../data/heroes';
import { HDHeroCard, getRarityBadgeBg, getRarityBorder } from '../common/HDHeroCard';
import { PixelSprite } from '../common/PixelSprite';
import { sound } from '../../game/audio';
import { Sparkles, Gem, ArrowRight, RotateCcw, Flame, ShieldAlert, FastForward, Crown, Zap, Award } from 'lucide-react';

export type GachaBannerType = 'novice' | 'astral' | 'legend' | 'mythos' | 'eternal';

interface BannerConfig {
  id: GachaBannerType;
  name: string;
  subtitle: string;
  cost1x: number;
  cost10x: number;
  poolDescription: string;
  allowedRarities: HeroRarity[];
  pityTarget: 'LEGENDS' | 'MYTHOS';
  pityMax: number;
  accentColor: string;
  bgGradient: string;
}

const BANNERS: BannerConfig[] = [
  {
    id: 'novice',
    name: 'Novice Summon',
    subtitle: 'Beginner Astral Gateway',
    cost1x: 100,
    cost10x: 900,
    poolDescription: 'Common to Legends heroes. Mythos unavailable.',
    allowedRarities: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDS'],
    pityTarget: 'LEGENDS',
    pityMax: 50,
    accentColor: '#38bdf8',
    bgGradient: 'from-sky-950/80 via-stone-900 to-stone-950',
  },
  {
    id: 'astral',
    name: 'Astral Summon',
    subtitle: 'The Standard Celestial Nexus',
    cost1x: 200,
    cost10x: 1800,
    poolDescription: 'Full Astral Pantheon. 1% Mythos, 4% Legends.',
    allowedRarities: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDS', 'MYTHOS'],
    pityTarget: 'LEGENDS',
    pityMax: 80,
    accentColor: '#a855f7',
    bgGradient: 'from-purple-950/80 via-stone-900 to-stone-950',
  },
  {
    id: 'legend',
    name: 'Legend Summon',
    subtitle: 'Vanguard of Renown',
    cost1x: 400,
    cost10x: 3600,
    poolDescription: 'Rare, Epic, and Legends heroes. 8% Legend rate.',
    allowedRarities: ['RARE', 'EPIC', 'LEGENDS'],
    pityTarget: 'LEGENDS',
    pityMax: 40,
    accentColor: '#eab308',
    bgGradient: 'from-amber-950/80 via-stone-900 to-stone-950',
  },
  {
    id: 'mythos',
    name: 'Mythos Summon',
    subtitle: 'Sanctuary of Ancient Deities',
    cost1x: 800,
    cost10x: 7200,
    poolDescription: 'Epic, Legends, and Mythos only. 4% Mythos rate.',
    allowedRarities: ['EPIC', 'LEGENDS', 'MYTHOS'],
    pityTarget: 'MYTHOS',
    pityMax: 50,
    accentColor: '#f43f5e',
    bgGradient: 'from-rose-950/80 via-stone-900 to-stone-950',
  },
  {
    id: 'eternal',
    name: 'Eternal Summon',
    subtitle: 'Sovereigns of Eternity',
    cost1x: 1500,
    cost10x: 13500,
    poolDescription: 'Exclusively Legends and Mythos heroes!',
    allowedRarities: ['LEGENDS', 'MYTHOS'],
    pityTarget: 'MYTHOS',
    pityMax: 20,
    accentColor: '#c084fc',
    bgGradient: 'from-fuchsia-950/80 via-stone-900 to-stone-950',
  },
];

interface GachaViewProps {
  playerState: PlayerState;
  onSummonCompleted: (
    updatedOwned: Record<string, PlayerHero>,
    gemCost: number,
    shardsGained: number,
    essenceGained: number,
    banner: GachaBannerType,
    newPityCount: number
  ) => void;
}

export const GachaView: React.FC<GachaViewProps> = ({
  playerState,
  onSummonCompleted,
}) => {
  const [selectedBanner, setSelectedBanner] = useState<GachaBannerType>('astral');
  const [isSummoning, setIsSummoning] = useState<boolean>(false);
  const [summonStage, setSummonStage] = useState<'idle' | 'charging' | 'cinematic' | 'summary'>('idle');
  const [pulledResults, setPulledResults] = useState<{ hero: HeroDefinition; isNew: boolean; shardsGranted: number }[]>([]);
  const [cinematicHero, setCinematicHero] = useState<HeroDefinition | null>(null);
  const [cinematicStep, setCinematicStep] = useState<number>(0);

  const currentBanner = BANNERS.find((b) => b.id === selectedBanner) || BANNERS[1];
  const currentPity = playerState.gachaPity?.[selectedBanner] || 0;

  // Resolve roll deterministically BEFORE starting any animation
  const executeSummon = (count: number, cost: number) => {
    if (playerState.astralGems < cost || isSummoning) return;

    sound.playClick();
    setIsSummoning(true);
    setSummonStage('charging');
    sound.playSummonChant();

    const banner = currentBanner;
    let pity = currentPity;
    const results: { hero: HeroDefinition; isNew: boolean; shardsGranted: number }[] = [];
    const updatedOwned: Record<string, PlayerHero> = { ...playerState.ownedHeroes };
    let totalShards = 0;
    let totalEssence = 0;

    for (let i = 0; i < count; i++) {
      pity += 1;
      let chosenRarity: HeroRarity = 'COMMON';

      // Check Pity threshold
      if (pity >= banner.pityMax) {
        chosenRarity = banner.pityTarget;
        pity = 0;
      } else {
        // Roll rarity based on banner config
        const roll = Math.random() * 100;

        if (banner.id === 'novice') {
          if (roll < 3) chosenRarity = 'LEGENDS';
          else if (roll < 20) chosenRarity = 'EPIC';
          else if (roll < 55) chosenRarity = 'RARE';
          else if (roll < 80) chosenRarity = 'UNCOMMON';
          else chosenRarity = 'COMMON';
        } else if (banner.id === 'astral') {
          if (roll < 1) chosenRarity = 'MYTHOS';
          else if (roll < 5) chosenRarity = 'LEGENDS';
          else if (roll < 23) chosenRarity = 'EPIC';
          else if (roll < 55) chosenRarity = 'RARE';
          else if (roll < 80) chosenRarity = 'UNCOMMON';
          else chosenRarity = 'COMMON';
        } else if (banner.id === 'legend') {
          if (roll < 8) chosenRarity = 'LEGENDS';
          else if (roll < 45) chosenRarity = 'EPIC';
          else chosenRarity = 'RARE';
        } else if (banner.id === 'mythos') {
          if (roll < 4) chosenRarity = 'MYTHOS';
          else if (roll < 22) chosenRarity = 'LEGENDS';
          else chosenRarity = 'EPIC';
        } else if (banner.id === 'eternal') {
          if (roll < 15) chosenRarity = 'MYTHOS';
          else chosenRarity = 'LEGENDS';
        }
      }

      // Reset pity on highest rarity pull
      if (chosenRarity === banner.pityTarget) {
        pity = 0;
      }

      // Filter heroes matching chosen rarity from banner allowed rarities
      let pool = Object.values(HERO_ROSTER).filter(
        (h) => h.rarity === chosenRarity && banner.allowedRarities.includes(h.rarity)
      );
      if (pool.length === 0) {
        pool = Object.values(HERO_ROSTER).filter((h) => banner.allowedRarities.includes(h.rarity));
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];

      const isNew = !updatedOwned[picked.id];
      let shardsGranted = 0;

      if (isNew) {
        updatedOwned[picked.id] = {
          heroId: picked.id,
          level: 1,
          stars: 1,
          duplicates: 0,
          shards: 0,
          obtainedAt: Date.now(),
        };
      } else {
        // Handle duplicates per Section 17
        const existing = updatedOwned[picked.id];
        existing.duplicates = (existing.duplicates || 0) + 1;

        if (picked.rarity === 'MYTHOS') {
          shardsGranted = 50;
          totalEssence += 1;
        } else if (picked.rarity === 'LEGENDS') {
          shardsGranted = 35;
        } else if (picked.rarity === 'EPIC') {
          shardsGranted = 25;
        } else if (picked.rarity === 'RARE') {
          shardsGranted = 18;
        } else {
          shardsGranted = 12;
        }

        existing.shards = (existing.shards || 0) + shardsGranted;
        totalShards += shardsGranted;
      }

      results.push({ hero: picked, isNew, shardsGranted });
    }

    setPulledResults(results);

    // Check for highest tier hero to feature in reveal
    const specialPull = results.find((r) => r.hero.rarity === 'MYTHOS') ||
      results.find((r) => r.hero.rarity === 'LEGENDS');

    const finalizeAndSave = () => {
      setSummonStage('summary');
      setIsSummoning(false);
      onSummonCompleted(updatedOwned, cost, totalShards, totalEssence, selectedBanner, pity);
    };

    // Charging rune animation
    setTimeout(() => {
      if (specialPull) {
        setCinematicHero(specialPull.hero);
        setSummonStage('cinematic');
        setCinematicStep(1);
        sound.playCardReveal(specialPull.hero.rarity);

        setTimeout(() => setCinematicStep(2), 1200);
        setTimeout(() => setCinematicStep(3), 2400);
        setTimeout(() => {
          finalizeAndSave();
        }, 3600);
      } else {
        sound.playCardReveal('EPIC');
        setTimeout(() => {
          finalizeAndSave();
        }, 1200);
      }
    }, 1300);
  };

  const handleSkipAnimation = () => {
    sound.playClick();
    setSummonStage('summary');
    setIsSummoning(false);
    // Find total shards/essence from pulled results
    let totalShards = 0;
    let totalEssence = 0;
    const updatedOwned: Record<string, PlayerHero> = { ...playerState.ownedHeroes };

    pulledResults.forEach((r) => {
      const existing = updatedOwned[r.hero.id];
      if (!existing) {
        updatedOwned[r.hero.id] = {
          heroId: r.hero.id,
          level: 1,
          stars: 1,
          duplicates: 0,
          shards: 0,
          obtainedAt: Date.now(),
        };
      } else {
        existing.duplicates = (existing.duplicates || 0) + 1;
        existing.shards = (existing.shards || 0) + r.shardsGranted;
        totalShards += r.shardsGranted;
        if (r.hero.rarity === 'MYTHOS') totalEssence += 1;
      }
    });

    onSummonCompleted(
      updatedOwned,
      pulledResults.length === 1 ? currentBanner.cost1x : currentBanner.cost10x,
      totalShards,
      totalEssence,
      selectedBanner,
      currentPity
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Banner Selector Tabs */}
      <div className="flex items-center gap-2 p-3 overflow-x-auto border-b border-stone-800 bg-stone-950/90 shrink-0">
        {BANNERS.map((banner) => {
          const isSelected = selectedBanner === banner.id;
          return (
            <button
              key={banner.id}
              onClick={() => {
                if (isSummoning) return;
                sound.playClick();
                setSelectedBanner(banner.id);
                setSummonStage('idle');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medieval tracking-wide uppercase transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-stone-800 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{banner.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Gacha Stage Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Banner Atmosphere Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${currentBanner.bgGradient} opacity-70 transition-all duration-700 pointer-events-none`}
        />

        {/* Constellation starfield background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* SKIP BUTTON (Available during summon animation) */}
        {isSummoning && summonStage !== 'summary' && (
          <button
            onClick={handleSkipAnimation}
            className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono text-stone-300 hover:text-white cursor-pointer shadow-lg transition-all"
          >
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>SKIP REVEAL</span>
          </button>
        )}

        {/* 1. IDLE STAGE: Altar Showcase */}
        {summonStage === 'idle' && (
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center space-y-6 animate-fade-in">
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full">
                {currentBanner.subtitle}
              </span>
              <h2 className="font-medieval text-3xl sm:text-4xl font-bold tracking-wide text-stone-100 drop-shadow-md">
                {currentBanner.name}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-flavor max-w-lg mx-auto">
                {currentBanner.poolDescription}
              </p>
            </div>

            {/* Astral Altar Arc */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Rune Ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_25s_linear_infinite]"
              />
              {/* Inner Rune Ring */}
              <div
                className="absolute inset-4 rounded-full border-2 border-stone-600/50 animate-[spin_15s_linear_infinite_reverse]"
              />

              {/* Central Glowing Core */}
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all"
                style={{
                  background: `radial-gradient(circle, ${currentBanner.accentColor} 0%, rgba(0,0,0,0.8) 75%)`,
                  boxShadow: `0 0 50px ${currentBanner.accentColor}66`,
                }}
              >
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            {/* Pity Counter Bar */}
            <div className="w-full max-w-sm bg-stone-950/80 border border-stone-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">
                  Guarantee {currentBanner.pityTarget}:
                </span>
                <span className="text-amber-400 font-bold">
                  {currentPity} / {currentBanner.pityMax}
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentPity / currentBanner.pityMax) * 100)}%` }}
                />
              </div>
            </div>

            {/* Summon Action Buttons */}
            <div className="flex items-center justify-center gap-4 w-full">
              {/* 1x Summon */}
              <button
                disabled={playerState.astralGems < currentBanner.cost1x}
                onClick={() => executeSummon(1, currentBanner.cost1x)}
                className={`flex flex-col items-center justify-center px-6 py-3 rounded-xl border-2 font-medieval tracking-wide transition-all cursor-pointer min-w-[150px] ${
                  playerState.astralGems >= currentBanner.cost1x
                    ? 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-amber-500 hover:scale-105 active:scale-95 text-stone-100 shadow-lg'
                    : 'bg-stone-950 border-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-bold">Summon 1x</span>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-amber-300">
                  <Gem className="w-3.5 h-3.5" />
                  <span>{currentBanner.cost1x}</span>
                </div>
              </button>

              {/* 10x Summon */}
              <button
                disabled={playerState.astralGems < currentBanner.cost10x}
                onClick={() => executeSummon(10, currentBanner.cost10x)}
                className={`flex flex-col items-center justify-center px-8 py-3 rounded-xl border-2 font-medieval tracking-wide transition-all cursor-pointer min-w-[170px] ${
                  playerState.astralGems >= currentBanner.cost10x
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 border-amber-400 text-white font-bold shadow-xl shadow-amber-950/60 hover:scale-105 active:scale-95 ring-2 ring-amber-400/40'
                    : 'bg-stone-950 border-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-amber-200" />
                  <span className="text-base font-bold">Summon 10x</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-amber-100">
                  <Gem className="w-3.5 h-3.5" />
                  <span>{currentBanner.cost10x}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. CHARGING STAGE: Vortex Ritual */}
        {summonStage === 'charging' && (
          <div className="relative z-20 flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-rose-400 animate-spin" />
              <Sparkles className="w-16 h-16 text-amber-300 animate-pulse" />
            </div>
            <h3 className="font-medieval text-xl text-amber-200 tracking-wider animate-pulse">
              Unlocking Astral Gateway...
            </h3>
          </div>
        )}

        {/* 3. CINEMATIC STAGE (For Mythos & Legends) */}
        {summonStage === 'cinematic' && cinematicHero && (
          <div className="relative z-30 flex flex-col items-center justify-center max-w-xl w-full p-6 text-center space-y-5 animate-fade-in">
            {/* Rarity Flare */}
            <div className="space-y-1">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getRarityBadgeBg(cinematicHero.rarity)}`}>
                {cinematicHero.rarity} DESTINY REVEALED
              </span>
              <h2 className="font-medieval text-3xl sm:text-4xl font-extrabold text-stone-100 tracking-wider">
                {cinematicHero.name}
              </h2>
              <p className="text-xs text-amber-300 font-flavor">
                — {cinematicHero.title} —
              </p>
            </div>

            {/* Hero Card Presentation */}
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <HDHeroCard definition={cinematicHero} size="lg" isOwned={true} showStats={true} />
            </div>

            {/* Signature Ultimate Banner */}
            <div className="p-3 bg-stone-900/90 border border-amber-600/70 rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between text-xs font-medieval text-amber-300 mb-1">
                <span>SIGNATURE: {cinematicHero.ultimate.name}</span>
                <span className="font-mono uppercase">{cinematicHero.role}</span>
              </div>
              <p className="text-[11px] text-stone-300 text-left font-flavor">
                {cinematicHero.ultimate.description}
              </p>
            </div>
          </div>
        )}

        {/* 4. SUMMARY STAGE: 1x / 10x Grid of Pulled Heroes */}
        {summonStage === 'summary' && (
          <div className="relative z-20 flex flex-col items-center w-full max-w-5xl h-full p-4 overflow-y-auto space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="font-medieval text-2xl font-bold text-stone-100">
                Summoning Completed
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {pulledResults.length} hero{pulledResults.length > 1 ? 'es' : ''} summoned from the Astral Gateway
              </p>
            </div>

            {/* Grid of Results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-4xl justify-items-center">
              {pulledResults.map((result, idx) => (
                <div key={idx} className="relative flex flex-col items-center">
                  <HDHeroCard
                    definition={result.hero}
                    size="sm"
                    isOwned={true}
                  />

                  {/* Badge: NEW or DUPLICATE (+Shards) */}
                  <div className="mt-1">
                    {result.isNew ? (
                      <span className="text-[10px] font-bold font-pixel px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">
                        NEW!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-700 flex items-center gap-1">
                        +{result.shardsGranted} Shards
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setSummonStage('idle');
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs font-medieval tracking-wide text-stone-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to Altar</span>
              </button>

              <button
                disabled={playerState.astralGems < (pulledResults.length === 1 ? currentBanner.cost1x : currentBanner.cost10x)}
                onClick={() => {
                  executeSummon(
                    pulledResults.length,
                    pulledResults.length === 1 ? currentBanner.cost1x : currentBanner.cost10x
                  );
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-medieval tracking-wide border cursor-pointer ${
                  playerState.astralGems >= (pulledResults.length === 1 ? currentBanner.cost1x : currentBanner.cost10x)
                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white font-bold shadow-lg'
                    : 'bg-stone-950 border-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Summon Again ({pulledResults.length === 1 ? currentBanner.cost1x : currentBanner.cost10x} Gems)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
