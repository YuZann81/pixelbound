import React from 'react';
import { PlayerState, AppScreen } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { sound } from '../../game/audio';
import { Coins, Sparkles, Gem, Volume2, VolumeX, ArrowLeft, Shield, Info } from 'lucide-react';

interface TopBarProps {
  playerState: PlayerState;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onOpenProfile: () => void;
  onToggleSound: () => void;
  onOpenGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  playerState,
  currentScreen,
  onNavigate,
  onOpenProfile,
  onToggleSound,
  onOpenGuide,
}) => {
  const avatarHero = HERO_ROSTER[playerState.avatarId] || HERO_ROSTER.ashen_knight;

  return (
    <header className="relative w-full z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between bg-gradient-to-b from-stone-950/95 via-stone-950/80 to-transparent pointer-events-auto">
      {/* Left: Profile / Back button */}
      <div className="flex items-center gap-3">
        {currentScreen !== 'hub' && (
          <button
            onClick={() => {
              sound.playClick();
              if (currentScreen === 'squad') onNavigate('campaign');
              else onNavigate('hub');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-amber-600 transition-colors text-xs font-medieval font-bold shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Player Profile Clickable Badge */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-stone-900/85 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/70 transition-all text-left shadow-lg cursor-pointer group"
        >
          {/* Avatar frame */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-stone-950 border border-amber-500/80 flex items-center justify-center ring-1 ring-black">
            <span className="text-xs font-pixel font-bold text-amber-400">
              {avatarHero.name.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medieval font-bold text-stone-200 group-hover:text-amber-300 transition-colors flex items-center gap-1">
              {playerState.username}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
              <span className="text-amber-400 font-pixel">Lv.{playerState.level}</span>
              <span>•</span>
              <span className="text-stone-400">Ch.{playerState.highestChapterUnlocked}</span>
            </div>
          </div>
        </button>
      </div>

      {/* Right: Currencies & Settings */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gold */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900/90 border border-amber-900/60 shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-pixel text-amber-300 font-semibold tracking-wider">
            {playerState.gold.toLocaleString()}
          </span>
        </div>

        {/* Astral Gems */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900/90 border border-purple-900/60 shadow-inner">
          <Gem className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-pixel text-purple-300 font-semibold tracking-wider">
            {playerState.astralGems.toLocaleString()}
          </span>
        </div>

        {/* Hero Shards */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900/90 border border-teal-900/60 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs font-pixel text-teal-300 font-semibold tracking-wider">
            {playerState.heroShards}
          </span>
        </div>

        {/* Astral Essence */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900/90 border border-rose-900/60 shadow-inner" title="Astral Essence (Mythos Ascension)">
          <span className="text-[11px] text-rose-400 font-bold">✧</span>
          <span className="text-xs font-pixel text-rose-300 font-semibold tracking-wider">
            {playerState.astralEssence || 0}
          </span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          className="p-1.5 rounded bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-700 transition-colors cursor-pointer"
          title={playerState.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {playerState.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {/* Guide / Info */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenGuide();
          }}
          className="p-1.5 rounded bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-700 transition-colors cursor-pointer"
          title="Game Systems Guide"
        >
          <Info className="w-4 h-4 text-stone-400" />
        </button>
      </div>
    </header>
  );
};
