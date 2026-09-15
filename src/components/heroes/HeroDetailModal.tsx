import React from 'react';
import { HeroDefinition, PlayerHero } from '../../types';
import { HDHeroCard, getElementIcon, getRoleIcon, getRarityBadgeBg, getRarityBorder } from '../common/HDHeroCard';
import { PixelSprite } from '../common/PixelSprite';
import { sound } from '../../game/audio';
import { X, Sparkles, Flame, Shield, ArrowUpCircle, Heart, Zap, Crosshair, Swords, Award, Crown, Star } from 'lucide-react';

interface HeroDetailModalProps {
  hero: HeroDefinition;
  playerHero?: PlayerHero;
  playerGold: number;
  playerShards: number;
  playerAstralEssence: number;
  isHomeShowcase: boolean;
  onClose: () => void;
  onUpgradeLevel: (heroId: string, goldCost: number) => void;
  onUpgradeStars: (heroId: string) => void;
  onSetHomeShowcase?: (heroId: string) => void;
}

export const HeroDetailModal: React.FC<HeroDetailModalProps> = ({
  hero,
  playerHero,
  playerGold,
  playerShards,
  playerAstralEssence,
  isHomeShowcase,
  onClose,
  onUpgradeLevel,
  onUpgradeStars,
  onSetHomeShowcase,
}) => {
  const isOwned = !!playerHero;
  const level = playerHero?.level || 1;
  const stars = playerHero?.stars || 1;
  const duplicates = playerHero?.duplicates || 0;

  // Level up calculation
  const goldCost = level * 350;
  const canAffordLevel = playerGold >= goldCost && level < 100;

  // Star progression requirements (Section 13)
  const isMaxStars = stars >= 5;
  const isMythos = hero.rarity === 'MYTHOS';

  // Calculate required duplicates or shards for next star
  let reqDuplicates = 2;
  let reqEssence = 0;

  if (isMythos) {
    reqDuplicates = stars; // 1->2 = 1 dup, 2->3 = 2 dup, etc.
    reqEssence = stars; // 1, 2, 3, 4 Astral Essence
  } else {
    const starIndex = stars - 1; // 0, 1, 2, 3
    if (hero.rarity === 'LEGENDS') {
      reqDuplicates = [5, 10, 20, 40][starIndex] || 5;
    } else if (hero.rarity === 'EPIC') {
      reqDuplicates = [4, 8, 16, 32][starIndex] || 4;
    } else if (hero.rarity === 'RARE') {
      reqDuplicates = [3, 6, 12, 24][starIndex] || 3;
    } else {
      reqDuplicates = [2, 4, 8, 16][starIndex] || 2;
    }
  }

  const canAffordStars =
    !isMaxStars &&
    (isMythos
      ? duplicates >= reqDuplicates && playerAstralEssence >= reqEssence
      : duplicates >= reqDuplicates || playerShards >= reqDuplicates * 20);

  // Scaled stats based on level and stars
  const starMultiplier = 1 + (stars - 1) * 0.15;
  const scale = (1 + (level - 1) * 0.12) * starMultiplier;
  const hp = Math.round(hero.baseStats.hp * scale);
  const atk = Math.round(hero.baseStats.atk * scale);
  const def = Math.round(hero.baseStats.def * scale);

  const nextScale = (1 + level * 0.12) * starMultiplier;
  const nextHp = Math.round(hero.baseStats.hp * nextScale);
  const nextAtk = Math.round(hero.baseStats.atk * nextScale);
  const nextDef = Math.round(hero.baseStats.def * nextScale);

  const canBeHomeShowcase = hero.rarity === 'LEGENDS' || hero.rarity === 'MYTHOS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-stone-900/95 rounded-xl border-2 border-stone-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRarityBadgeBg(hero.rarity)}`}>
              {hero.rarity}
            </span>
            <h3 className="font-medieval text-lg sm:text-xl font-bold text-stone-100">
              {hero.name}
            </h3>
            <span className="text-xs text-stone-400 font-flavor hidden sm:inline">
              — {hero.title}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: HD Card + Pixel Form + Showcase Button (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-start space-y-3">
            <HDHeroCard
              definition={hero}
              level={level}
              stars={stars}
              isOwned={isOwned}
              size="lg"
            />

            {/* Combat Pixel Sprite Dual View */}
            <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PixelSprite definition={hero} size={42} state="idle" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medieval text-stone-400 uppercase">
                    Battle Form
                  </span>
                  <span className="text-xs font-pixel text-amber-400">
                    32-bit Sprite
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                Range: {hero.baseStats.range === 1 ? 'Melee' : 'Ranged'}
              </span>
            </div>

            {/* Home Showcase Button (Section 19) */}
            {isOwned && (
              <div className="w-full">
                {canBeHomeShowcase ? (
                  isHomeShowcase ? (
                    <div className="w-full py-2 px-3 rounded-lg bg-amber-950/70 border border-amber-500/80 text-amber-300 text-xs font-medieval flex items-center justify-center gap-1.5 shadow-md">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Active Home Showcase</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playLevelUp();
                        onSetHomeShowcase?.(hero.id);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-amber-600/70 text-amber-200 hover:text-white text-xs font-medieval flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.02]"
                    >
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Set as Home Showcase Hero</span>
                    </button>
                  )
                ) : (
                  <div className="text-[10px] font-mono text-stone-500 text-center py-1">
                    Showcase reserved for Legends & Mythos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Lore, Stats, Skills, Progression Controls (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Lore */}
            <p className="text-xs text-stone-400 font-flavor italic border-l-2 border-amber-600 pl-3">
              "{hero.lore}"
            </p>

            {/* Attributes Grid */}
            <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medieval font-bold text-stone-300 uppercase tracking-wider">
                  Attributes & Scaling
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < stars ? 'text-amber-400' : 'text-stone-700'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-amber-400 font-pixel text-xs">Lv.{level}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-pixel">
                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block">Health (HP)</span>
                  <span className="text-emerald-400 font-bold text-sm">{hp}</span>
                  {isOwned && level < 100 && (
                    <span className="text-[10px] text-emerald-600 block">→ {nextHp}</span>
                  )}
                </div>

                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block">Attack (ATK)</span>
                  <span className="text-amber-400 font-bold text-sm">{atk}</span>
                  {isOwned && level < 100 && (
                    <span className="text-[10px] text-amber-600 block">→ {nextAtk}</span>
                  )}
                </div>

                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block">Defense (DEF)</span>
                  <span className="text-sky-400 font-bold text-sm">{def}</span>
                  {isOwned && level < 100 && (
                    <span className="text-[10px] text-sky-600 block">→ {nextDef}</span>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] font-pixel text-stone-400">
                <span>Crit Rate: {(hero.baseStats.critRate * 100).toFixed(0)}%</span>
                <span>Crit Dmg: {(hero.baseStats.critDmg * 100).toFixed(0)}%</span>
                <span>Speed: {hero.baseStats.spd}</span>
              </div>
            </div>

            {/* Skills & Passives */}
            <div className="space-y-2">
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 text-xs">
                <div className="flex items-center justify-between font-medieval font-bold text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-red-400" />
                    Basic Attack: {hero.basicAttack.name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-pixel">
                    {(hero.basicAttack.damageMult * 100).toFixed(0)}% ATK
                  </span>
                </div>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-amber-900/60 text-xs">
                <div className="flex items-center justify-between font-medieval font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Ultimate: {hero.ultimate.name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-pixel">
                    Cost: 100 Energy
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  {hero.ultimate.description}
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-purple-900/50 text-xs">
                <div className="font-medieval font-bold text-purple-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Passive: {hero.passive.name}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {hero.passive.description}
                </p>
              </div>
            </div>

            {/* Dual Upgrade Action Controls (Level Up + Star Ascension) */}
            <div className="pt-3 border-t border-stone-800 space-y-2">
              {isOwned ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Level Up Button */}
                  <button
                    onClick={() => {
                      if (canAffordLevel) {
                        sound.playClick();
                        onUpgradeLevel(hero.id, goldCost);
                      }
                    }}
                    disabled={!canAffordLevel}
                    className={`py-2.5 px-3 rounded-lg font-medieval text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transition-transform ${
                      canAffordLevel
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold cursor-pointer hover:scale-[1.02]'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>
                      {level >= 100 ? 'Max Level' : `Level Up (${goldCost.toLocaleString()} Gold)`}
                    </span>
                  </button>

                  {/* Star Upgrade / Mythos Ascension */}
                  <button
                    onClick={() => {
                      if (canAffordStars) {
                        sound.playLevelUp();
                        onUpgradeStars(hero.id);
                      }
                    }}
                    disabled={!canAffordStars}
                    className={`py-2.5 px-3 rounded-lg font-medieval text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transition-transform ${
                      isMaxStars
                        ? 'bg-stone-900 border border-stone-800 text-stone-500 cursor-default'
                        : canAffordStars
                        ? isMythos
                          ? 'bg-gradient-to-r from-rose-600 via-purple-600 to-rose-600 text-white font-bold ring-2 ring-rose-400/40 hover:scale-[1.02] cursor-pointer'
                          : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold hover:scale-[1.02] cursor-pointer'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <Star className="w-4 h-4 text-amber-300" />
                    <span>
                      {isMaxStars
                        ? 'Max 5★ Stars'
                        : isMythos
                        ? `Ascend (${reqDuplicates} Dup + ${reqEssence} Astral)`
                        : `Star Up (${duplicates}/${reqDuplicates} Dup)`}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 text-center text-xs text-stone-500 font-flavor">
                  Hero not yet unlocked. Awaken in the Summoning Altar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
