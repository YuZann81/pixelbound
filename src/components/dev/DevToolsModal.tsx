import React, { useEffect } from 'react';
import { PlayerState, CampaignChapter } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { CAMPAIGN_CHAPTERS } from '../../data/campaign';
import {
  Terminal,
  X,
  Coins,
  Sparkles,
  Trophy,
  Users,
  ShieldAlert,
  RotateCcw,
  Swords,
  Flame,
} from 'lucide-react';
import { sound } from '../../game/audio';

interface DevToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onUpdateState: (updater: (prev: PlayerState) => PlayerState) => void;
  onResetSave: () => void;
  onDebugBattle?: (chapter: CampaignChapter) => void;
}

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  isOpen,
  onClose,
  playerState,
  onUpdateState,
  onResetSave,
  onDebugBattle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddGold = (amount: number) => {
    sound.playClick();
    onUpdateState((prev) => ({
      ...prev,
      gold: prev.gold + amount,
    }));
  };

  const handleSetMaxGold = () => {
    sound.playLevelUp();
    onUpdateState((prev) => ({
      ...prev,
      gold: 999999,
    }));
  };

  const handleAddGems = (amount: number) => {
    sound.playClick();
    onUpdateState((prev) => ({
      ...prev,
      astralGems: prev.astralGems + amount,
    }));
  };

  const handleSetMaxGems = () => {
    sound.playLevelUp();
    onUpdateState((prev) => ({
      ...prev,
      astralGems: 50000,
    }));
  };

  const handleAddShards = (amount: number) => {
    sound.playClick();
    onUpdateState((prev) => ({
      ...prev,
      heroShards: prev.heroShards + amount,
    }));
  };

  const handleAddEssence = (amount: number) => {
    sound.playLevelUp();
    onUpdateState((prev) => ({
      ...prev,
      astralEssence: (prev.astralEssence || 0) + amount,
    }));
  };

  const handleUnlockAllHeroes = () => {
    sound.playLevelUp();
    onUpdateState((prev) => {
      const updated = { ...prev.ownedHeroes };
      Object.keys(HERO_ROSTER).forEach((id) => {
        if (!updated[id]) {
          updated[id] = {
            heroId: id,
            level: 10,
            stars: 1,
            duplicates: 5,
            shards: 50,
            obtainedAt: Date.now(),
          };
        }
      });
      return {
        ...prev,
        ownedHeroes: updated,
      };
    });
  };

  const handleMaxHeroLevels = () => {
    sound.playLevelUp();
    onUpdateState((prev) => {
      const updated = { ...prev.ownedHeroes };
      Object.keys(updated).forEach((id) => {
        updated[id] = {
          ...updated[id],
          level: 50,
        };
      });
      return {
        ...prev,
        ownedHeroes: updated,
      };
    });
  };

  const handleUnlockAllCampaign = () => {
    sound.playLevelUp();
    onUpdateState((prev) => ({
      ...prev,
      highestChapterUnlocked: 10,
      chapterStars: {
        1: 3,
        2: 3,
        3: 3,
        4: 3,
        5: 3,
        6: 3,
        7: 3,
        8: 3,
        9: 3,
        10: 3,
      },
    }));
  };

  const handleCompleteCurrentChapter = () => {
    sound.playLevelUp();
    onUpdateState((prev) => {
      const current = prev.highestChapterUnlocked;
      const nextChapter = Math.min(10, current + 1);
      return {
        ...prev,
        highestChapterUnlocked: nextChapter,
        chapterStars: {
          ...prev.chapterStars,
          [current]: 3,
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-stone-950 border-2 border-emerald-500/80 rounded-lg shadow-[0_0_35px_rgba(16,185,129,0.25)] p-5 flex flex-col gap-4 text-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header with Dev Mode indicator */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-emerald-400">DEVELOPER PANEL</h2>
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-bold uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Shortcut: Shift + Alt + D • Testing & Inspection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 cursor-pointer"
            title="Close Dev Overlay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current State Quick Stats */}
        <div className="grid grid-cols-4 gap-2 bg-stone-900/60 p-2.5 rounded border border-stone-800 text-xs">
          <div>
            <span className="text-stone-500 text-[10px] block">GOLD</span>
            <span className="text-amber-400 font-bold">{playerState.gold.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] block">GEMS</span>
            <span className="text-purple-400 font-bold">{playerState.astralGems.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] block">CHAPTER</span>
            <span className="text-blue-400 font-bold">{playerState.highestChapterUnlocked}/10</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] block">HEROES</span>
            <span className="text-emerald-400 font-bold">
              {Object.keys(playerState.ownedHeroes).length}/{Object.keys(HERO_ROSTER).length}
            </span>
          </div>
        </div>

        {/* Cheat Controls Grid */}
        <div className="space-y-3.5 text-xs">
          {/* Gold Section */}
          <div>
            <div className="flex items-center gap-1.5 text-stone-400 mb-1.5 text-[11px] font-semibold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>GOLD</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddGold(1000)}
                className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/60 rounded text-amber-300 font-bold cursor-pointer transition-colors"
              >
                +1,000
              </button>
              <button
                onClick={() => handleAddGold(10000)}
                className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/60 rounded text-amber-300 font-bold cursor-pointer transition-colors"
              >
                +10,000
              </button>
              <button
                onClick={handleSetMaxGold}
                className="py-1.5 px-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/80 rounded text-amber-400 font-bold cursor-pointer transition-colors"
              >
                MAX (999K)
              </button>
            </div>
          </div>

          {/* Astral Gems & Essences */}
          <div>
            <div className="flex items-center gap-1.5 text-stone-400 mb-1.5 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>GEMS & ASCENSION ESSENCE</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleAddGems(100)}
                className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-purple-500/60 rounded text-purple-300 font-bold cursor-pointer transition-colors"
              >
                +100 Gems
              </button>
              <button
                onClick={() => handleAddGems(1000)}
                className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-purple-500/60 rounded text-purple-300 font-bold cursor-pointer transition-colors"
              >
                +1K Gems
              </button>
              <button
                onClick={handleSetMaxGems}
                className="py-1.5 px-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/80 rounded text-purple-400 font-bold cursor-pointer transition-colors"
              >
                MAX (50K)
              </button>
              <button
                onClick={() => handleAddEssence(5)}
                className="py-1.5 px-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/80 rounded text-rose-300 font-bold cursor-pointer transition-colors"
              >
                +5 Essence
              </button>
            </div>
          </div>

          {/* Shards & Heroes */}
          <div>
            <div className="flex items-center gap-1.5 text-stone-400 mb-1.5 text-[11px] font-semibold">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>HERO ROSTER & PROGRESSION</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleUnlockAllHeroes}
                className="py-2 px-2 bg-stone-900 hover:bg-emerald-950 border border-stone-700 hover:border-emerald-500 rounded text-emerald-300 text-center font-semibold cursor-pointer transition-colors"
              >
                ★ Unlock All 16 Heroes
              </button>
              <button
                onClick={handleMaxHeroLevels}
                className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-500 rounded text-stone-200 text-center font-semibold cursor-pointer transition-colors"
              >
                ▲ Max Hero Levels (50)
              </button>
              <button
                onClick={() => handleAddShards(50)}
                className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-teal-500 rounded text-teal-300 text-center font-semibold cursor-pointer transition-colors"
              >
                +50 Hero Shards
              </button>
            </div>
          </div>

          {/* Campaign & Battle Testing */}
          <div>
            <div className="flex items-center gap-1.5 text-stone-400 mb-1.5 text-[11px] font-semibold">
              <Trophy className="w-3.5 h-3.5 text-blue-400" />
              <span>CAMPAIGN PROGRESSION</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCompleteCurrentChapter}
                className="py-2 px-3 bg-stone-900 hover:bg-blue-950 border border-stone-700 hover:border-blue-500 rounded text-blue-300 text-left font-semibold cursor-pointer transition-colors"
              >
                ✓ Complete Chapter {playerState.highestChapterUnlocked}
              </button>
              <button
                onClick={handleUnlockAllCampaign}
                className="py-2 px-3 bg-stone-900 hover:bg-blue-950 border border-stone-700 hover:border-blue-500 rounded text-blue-300 text-left font-semibold cursor-pointer transition-colors"
              >
                ★ Unlock All 10 Chapters
              </button>
            </div>
          </div>

          {/* Debug Battle Direct Launch */}
          {onDebugBattle && (
            <div>
              <div className="flex items-center gap-1.5 text-stone-400 mb-1.5 text-[11px] font-semibold">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>DEBUG BATTLE SIMULATION</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const ch = CAMPAIGN_CHAPTERS[0];
                    onClose();
                    onDebugBattle(ch);
                  }}
                  className="py-2 px-3 bg-stone-900 hover:bg-amber-950 border border-stone-700 hover:border-amber-600 rounded text-amber-300 text-left font-semibold cursor-pointer transition-colors"
                >
                  ⚔ Test Chapter 1 (Borderlands)
                </button>
                <button
                  onClick={() => {
                    const bossCh = CAMPAIGN_CHAPTERS[CAMPAIGN_CHAPTERS.length - 1];
                    onClose();
                    onDebugBattle(bossCh);
                  }}
                  className="py-2 px-3 bg-stone-900 hover:bg-rose-950 border border-stone-700 hover:border-rose-600 rounded text-rose-300 text-left font-semibold cursor-pointer transition-colors"
                >
                  ☠ Test Boss Chapter 10 (Summit)
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone: Reset Save */}
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Local storage state reset</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset save state to initial fresh game?')) {
                  onResetSave();
                  onClose();
                }
              }}
              className="py-1 px-2.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 rounded text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Save</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-1 text-[10px] text-stone-600 flex items-center justify-between border-t border-stone-900">
          <span>PIXEL BOUND Internal Dev Tools</span>
          <span>Press ESC or Shift + Alt + D to dismiss</span>
        </div>
      </div>
    </div>
  );
};
