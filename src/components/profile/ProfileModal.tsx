import React, { useState, useRef } from 'react';
import { PlayerState } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { sound } from '../../game/audio';
import {
  X,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Check,
  Info,
  Sliders,
  Shield,
} from 'lucide-react';

interface ProfileModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onUpdateAvatar: (avatarId: string) => void;
  onToggleSound: () => void;
  onResetProgress: () => void;
  onOpenDevTools?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  playerState,
  onClose,
  onUpdateAvatar,
  onToggleSound,
  onResetProgress,
  onOpenDevTools,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'about'>('profile');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const currentHero = HERO_ROSTER[playerState.avatarId] || HERO_ROSTER.ashen_knight;

  // Hidden Developer Trigger State (Tapping title/logo 5 times or holding 1.5s)
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHiddenDevAccess = () => {
    if (onOpenDevTools) {
      sound.playLevelUp();
      onClose();
      onOpenDevTools();
    }
  };

  const handleTitleTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current > 2500) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      triggerHiddenDevAccess();
    }
  };

  const handleTouchStart = () => {
    holdTimerRef.current = setTimeout(() => {
      triggerHiddenDevAccess();
    }, 1500);
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-stone-900/95 rounded-xl border-2 border-stone-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Tab Switcher */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('profile');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medieval font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/70 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings & Profile</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('about');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medieval font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/70 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About Pixel Bound</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
          {activeTab === 'profile' ? (
            <div className="space-y-5">
              {/* Profile Badge */}
              <div className="flex items-center gap-4 p-3.5 rounded-lg bg-stone-950 border border-stone-800">
                <div className="relative w-14 h-14 rounded-full bg-stone-900 border-2 border-amber-500 flex items-center justify-center font-pixel text-lg font-bold text-amber-400">
                  {currentHero.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medieval text-base font-bold text-stone-100">
                    {playerState.username}
                  </h4>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    Player Level {playerState.level} • March: Chapter {playerState.highestChapterUnlocked}/10
                  </p>
                  <p className="text-[11px] text-amber-400 font-pixel mt-1">
                    Active Avatar: {currentHero.name}
                  </p>
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <h4 className="text-xs font-medieval font-bold text-stone-300 uppercase tracking-wider mb-2">
                  Select Avatar Hero
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(playerState.ownedHeroes).map((heroId) => {
                    const hero = HERO_ROSTER[heroId];
                    if (!hero) return null;
                    const isSelected = playerState.avatarId === hero.id;

                    return (
                      <button
                        key={hero.id}
                        onClick={() => {
                          sound.playClick();
                          onUpdateAvatar(hero.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medieval font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <span>{hero.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio & Settings */}
              <div className="space-y-3 pt-2 border-t border-stone-800">
                <h4 className="text-xs font-medieval font-bold text-stone-300 uppercase tracking-wider">
                  Audio & Visuals
                </h4>

                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-stone-800">
                  <div className="flex items-center gap-2">
                    {playerState.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-stone-500" />
                    )}
                    <span className="text-xs font-medieval text-stone-200">
                      Synthesizer Sound Effects (SFX)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onToggleSound();
                    }}
                    className={`px-3 py-1 rounded text-xs font-pixel font-bold border transition-colors cursor-pointer ${
                      playerState.soundEnabled
                        ? 'bg-amber-950 text-amber-300 border-amber-500'
                        : 'bg-stone-800 text-stone-500 border-stone-700'
                    }`}
                  >
                    {playerState.soundEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-stone-800 text-xs font-pixel text-stone-400">
                  <span>Graphics: <strong>32-bit Sprites + HD Cards</strong></span>
                  <span>Orientation: <strong>Enforced Landscape</strong></span>
                </div>
              </div>

              {/* Reset Progress Section */}
              <div className="pt-2 border-t border-stone-800">
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-2.5 rounded-lg bg-stone-950 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-900 text-stone-400 hover:text-rose-400 text-xs font-medieval transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Account Progress to Default</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 space-y-2 text-center">
                    <p className="text-xs text-rose-300 font-flavor">
                      Are you sure? This will reset your gold, gems, and unlocked heroes back to the initial 5 starters.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onResetProgress();
                          setShowConfirmReset(false);
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medieval font-bold cursor-pointer"
                      >
                        Confirm Reset
                      </button>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className="px-4 py-1.5 rounded bg-stone-800 text-stone-300 text-xs font-medieval cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Version info footer */}
              <div
                onClick={handleTitleTap}
                className="text-center pt-2 text-[10px] font-mono text-stone-600 select-none cursor-default"
              >
                PIXEL BOUND v0.1.0 • Tactical RPG
              </div>
            </div>
          ) : (
            /* ABOUT TAB — Clean, restrained layout with hidden developer access on logo/title */
            <div className="space-y-4">
              {/* Logo & Title (Easter egg trigger area) */}
              <div
                id="about-logo-card"
                onClick={handleTitleTap}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                className="text-center p-5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer select-none active:scale-99 transition-transform hover:border-stone-700"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-950/70 border border-amber-500/60 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-medieval text-xl font-bold text-stone-100 tracking-wider">
                  PIXEL BOUND
                </h3>
                <p className="text-xs text-amber-400 font-pixel mt-0.5">
                  Pixel Fantasy Collection RPG
                </p>
                <p className="text-[11px] text-stone-400 font-mono mt-1">
                  Version 0.1.0
                </p>
              </div>

              {/* Game Overview */}
              <div className="p-4 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2 text-xs font-flavor text-stone-300">
                <p>
                  A tactical 5v5 turn-based auto-battler featuring distinct champion classes, 3×3 battlefield grid positioning, and deterministic elemental synergy.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80 text-[11px] font-mono text-stone-400">
                  <div>• 16 Collectible Champions</div>
                  <div>• 3×3 Tactical Formations</div>
                  <div>• 10 Campaign March Chapters</div>
                  <div>• Asynchronous Astral Arena</div>
                </div>
              </div>

              {/* Credits & Tech Stack */}
              <div className="p-3.5 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px] font-mono text-stone-400 space-y-1">
                <div className="text-stone-300 font-bold mb-1">CRAFT & ARCHITECTURE</div>
                <div>Frontend: React 18, TypeScript, Tailwind CSS</div>
                <div>Audio: Web Audio API Procedural Synthesizer</div>
                <div>Sprites: Procedural High-Definition Pixel Canvas</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
