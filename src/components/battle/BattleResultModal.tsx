import React from 'react';
import { CampaignChapter, HeroDefinition } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { sound } from '../../game/audio';
import { Trophy, Skull, Star, Coins, Gem, Sparkles, ArrowRight, RotateCcw, Compass, Users } from 'lucide-react';

interface BattleResultModalProps {
  result: 'victory' | 'defeat';
  stars: number;
  descriptor?: string;
  chapter: CampaignChapter;
  onContinue: () => void;
  onRetry: () => void;
  onChangeSquad: () => void;
  onBackToMap: () => void;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  result,
  stars,
  descriptor,
  chapter,
  onContinue,
  onRetry,
  onChangeSquad,
  onBackToMap,
}) => {
  const isVictory = result === 'victory';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className={`relative w-full max-w-md rounded-xl p-6 border-2 text-center shadow-2xl overflow-hidden ${
          isVictory
            ? 'bg-stone-900/95 border-amber-500 shadow-amber-950/60'
            : 'bg-stone-900/95 border-rose-600 shadow-rose-950/60'
        }`}
      >
        {/* Ornate corner styling */}
        <div
          className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 ${
            isVictory ? 'border-amber-400' : 'border-rose-500'
          }`}
        />
        <div
          className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 ${
            isVictory ? 'border-amber-400' : 'border-rose-500'
          }`}
        />
        <div
          className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 ${
            isVictory ? 'border-amber-400' : 'border-rose-500'
          }`}
        />
        <div
          className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 ${
            isVictory ? 'border-amber-400' : 'border-rose-500'
          }`}
        />

        {/* Victory / Defeat Header */}
        <div className="mb-2">
          {isVictory ? (
            <div className="inline-flex p-3 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-400 mb-2">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
          ) : (
            <div className="inline-flex p-3 rounded-full bg-rose-950/80 border border-rose-600/80 text-rose-400 mb-2">
              <Skull className="w-8 h-8 animate-pulse" />
            </div>
          )}

          <h2
            className={`font-medieval text-3xl sm:text-4xl font-black tracking-wider ${
              isVictory
                ? 'text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]'
                : 'text-rose-400 drop-shadow-[0_2px_10px_rgba(225,29,72,0.5)]'
            }`}
          >
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </h2>

          <p className="text-xs font-flavor text-stone-400 mt-1">
            Chapter {chapter.chapterNumber} • {chapter.name}
          </p>
        </div>

        {/* Stars Display on Victory */}
        {isVictory && (
          <div className="flex flex-col items-center justify-center my-3 gap-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-7 h-7 transition-all ${
                    starIdx <= stars
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-110'
                      : 'text-stone-700'
                  }`}
                />
              ))}
            </div>

            {descriptor && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-300 font-pixel text-xs tracking-widest uppercase shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{descriptor}</span>
              </div>
            )}
          </div>
        )}

        {/* Rewards Section on Victory */}
        {isVictory && (
          <div className="my-5 p-3.5 rounded-lg bg-stone-950 border border-stone-800 text-left">
            <h4 className="text-xs font-medieval font-bold text-stone-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acquired Spoils
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-pixel">
              {/* Gold */}
              <div className="p-2 rounded bg-stone-900 border border-amber-900/60">
                <Coins className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-amber-300 font-bold block">
                  +{chapter.rewards.gold}
                </span>
                <span className="text-[10px] text-stone-400">Gold</span>
              </div>

              {/* Astral Gems */}
              <div className="p-2 rounded bg-stone-900 border border-purple-900/60">
                <Gem className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-purple-300 font-bold block">
                  +{chapter.rewards.astralGems}
                </span>
                <span className="text-[10px] text-stone-400">Gems</span>
              </div>

              {/* Hero Shards */}
              <div className="p-2 rounded bg-stone-900 border border-teal-900/60">
                <Sparkles className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <span className="text-teal-300 font-bold block">
                  +{chapter.rewards.shards}
                </span>
                <span className="text-[10px] text-stone-400">Shards</span>
              </div>
            </div>
          </div>
        )}

        {/* Defeat Advice */}
        {!isVictory && (
          <div className="my-5 p-3.5 rounded-lg bg-stone-950 border border-stone-800 text-center text-xs text-stone-400 font-flavor">
            <p>
              Your frontline collapsed under enemy assault. Try upgrading your heroes in the
              Collection or rearranging your 3×3 formation.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          {isVictory ? (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  onContinue();
                }}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-medieval font-black text-sm uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onBackToMap();
                }}
                className="w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medieval text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Back to World Map</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  onRetry();
                }}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 hover:from-rose-500 hover:to-red-400 text-stone-100 font-medieval font-black text-sm uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Battle</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onChangeSquad();
                  }}
                  className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medieval text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Change Squad</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onBackToMap();
                  }}
                  className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medieval text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span>Back to Map</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
