import React, { useState } from 'react';
import { PlayerState, CampaignChapter } from '../../types';
import { CAMPAIGN_WORLDS, CAMPAIGN_CHAPTERS } from '../../data/campaign';
import { HERO_ROSTER } from '../../data/heroes';
import { sound } from '../../game/audio';
import { PixelSprite } from '../common/PixelSprite';
import { getElementIcon, getRoleIcon, getRarityBadgeBg } from '../common/HDHeroCard';
import {
  Star,
  Swords,
  Skull,
  Lock,
  ChevronRight,
  Coins,
  Gem,
  Sparkles,
  MapPin,
  X,
  Compass,
  Flame,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface CampaignViewProps {
  playerState: PlayerState;
  onSelectChapterToBattle: (chapter: CampaignChapter) => void;
}

// Map coordinates in a 1000x560 virtual canvas for World 1
const CHAPTER_COORDINATES: Record<number, { x: number; y: number; region: string; iconType: string }> = {
  1: { x: 100, y: 440, region: 'Borderlands', iconType: 'forest' },
  2: { x: 200, y: 340, region: 'Cinder Hamlet', iconType: 'village' },
  3: { x: 290, y: 430, region: 'High Palisades', iconType: 'tower' },
  4: { x: 390, y: 340, region: 'Drowned Bog', iconType: 'ruins' },
  5: { x: 480, y: 220, region: 'Holy Ridge', iconType: 'monastery' },
  6: { x: 590, y: 320, region: 'Red Chasm', iconType: 'canyon' },
  7: { x: 680, y: 430, region: 'Vault Caverns', iconType: 'mine' },
  8: { x: 780, y: 310, region: 'Royal Gates', iconType: 'citadel' },
  9: { x: 860, y: 200, region: 'Crypt Spires', iconType: 'mausoleum' },
  10: { x: 920, y: 95, region: 'The Summit', iconType: 'throne' },
};

// SVG Winding Path Definition
const WINDING_ROAD_D =
  'M 100 440 C 140 380, 165 350, 200 340 C 235 330, 255 420, 290 430 C 330 440, 350 360, 390 340 C 430 320, 450 240, 480 220 C 520 200, 560 310, 590 320 C 625 330, 645 420, 680 430 C 720 440, 750 330, 780 310 C 810 290, 835 220, 860 200 C 885 180, 900 130, 920 95';

export const CampaignView: React.FC<CampaignViewProps> = ({
  playerState,
  onSelectChapterToBattle,
}) => {
  const currentChapterId = Math.min(10, playerState.highestChapterUnlocked);
  const [selectedChapterId, setSelectedChapterId] = useState<number>(currentChapterId);
  const [showScoutModal, setShowScoutModal] = useState<boolean>(true);

  const activeWorld = CAMPAIGN_WORLDS[0];
  const selectedChapter =
    CAMPAIGN_CHAPTERS.find((c) => c.id === selectedChapterId) || CAMPAIGN_CHAPTERS[0];
  const isUnlocked = selectedChapter.id <= playerState.highestChapterUnlocked;
  const isCompleted = (playerState.chapterStars[selectedChapter.id] || 0) > 0;
  const isCurrentTarget = selectedChapter.id === currentChapterId;

  const handleNodeClick = (chapterId: number) => {
    sound.playClick();
    setSelectedChapterId(chapterId);
    setShowScoutModal(true);
  };

  return (
    <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden bg-stone-950 select-none">
      {/* Top Realm Banner */}
      <div className="relative z-20 px-4 sm:px-8 py-2.5 bg-stone-950/90 border-b border-stone-800/80 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-950/90 border border-amber-600/60 text-amber-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
              World 1 • Adventure Map
            </span>
            <h2 className="font-medieval text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>The Fallen Kingdom</span>
              <span className="text-xs text-stone-400 font-flavor hidden sm:inline">
                (10 Chapters • Linear March)
              </span>
            </h2>
          </div>
        </div>

        {/* Quest Progress Indicator */}
        <div className="flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-800 shadow-inner">
          <span className="text-[11px] font-medieval text-stone-400">March Progress:</span>
          <span className="text-xs font-pixel text-amber-400 font-bold">
            Chapter {currentChapterId}/10
          </span>
        </div>
      </div>

      {/* Interactive Geographic Map Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Landscape Map Stage (1000x560 Aspect Ratio container) */}
        <div className="relative w-full max-w-5xl aspect-[1000/560] max-h-[75vh] bg-[#120f0e] rounded-2xl border-2 border-stone-800/90 shadow-2xl overflow-hidden">
          {/* Map Geography / Terrain Artwork (SVG Layer) */}
          <svg
            viewBox="0 0 1000 560"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              {/* Radial Gradients for regions */}
              <radialGradient id="forestGlow" cx="20%" cy="80%" r="40%">
                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="chasmGlow" cx="60%" cy="60%" r="35%">
                <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="throneGlow" cx="90%" cy="20%" r="35%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>

              {/* Path filters for glow */}
              <filter id="glowPath" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base Terrain fills */}
            <rect width="1000" height="560" fill="#141110" />
            <rect width="1000" height="560" fill="url(#forestGlow)" />
            <rect width="1000" height="560" fill="url(#chasmGlow)" />
            <rect width="1000" height="560" fill="url(#throneGlow)" />

            {/* Topographic Contours / River Silhouettes */}
            <path
              d="M 0 350 Q 250 280, 500 480 T 1000 320"
              stroke="#292524"
              strokeWidth="4"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 50 150 Q 300 80, 600 180 T 950 60"
              stroke="#292524"
              strokeWidth="3"
              fill="none"
              opacity="0.3"
            />

            {/* Mountain & Citadel Silhouettes in Background */}
            <polygon points="100,560 180,420 260,560" fill="#1c1917" opacity="0.5" />
            <polygon points="450,560 520,380 590,560" fill="#1c1917" opacity="0.5" />
            <polygon points="750,560 840,320 930,560" fill="#1c1917" opacity="0.6" />
            <polygon points="850,250 920,80 990,250" fill="#292524" opacity="0.7" />

            {/* Fortress Turrets at Summit (Chapter 10) */}
            <rect x="900" y="80" width="40" height="90" fill="#1c1917" opacity="0.9" />
            <polygon points="895,80 920,45 945,80" fill="#d97706" opacity="0.4" />

            {/* THE WINDING ROAD */}
            {/* 1. Road Bed Base (Dusky Brown) */}
            <path
              d={WINDING_ROAD_D}
              stroke="#292524"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* 2. Road Border (Cobblestone Edge) */}
            <path
              d={WINDING_ROAD_D}
              stroke="#44403c"
              strokeWidth="8"
              strokeDasharray="4 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* 3. Cleared Journey Illuminated Golden Path */}
            <path
              d={WINDING_ROAD_D}
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glowPath)"
              className="opacity-70 animate-pulse"
            />
          </svg>

          {/* Region Landmark Environmental Labels */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute left-[8%] bottom-[8%] text-[10px] font-medieval uppercase tracking-widest text-emerald-500/60 font-bold">
              The Whisper Woods
            </div>
            <div className="absolute left-[34%] top-[45%] text-[10px] font-medieval uppercase tracking-widest text-sky-500/60 font-bold">
              Sunken Plaza
            </div>
            <div className="absolute left-[54%] bottom-[12%] text-[10px] font-medieval uppercase tracking-widest text-rose-500/60 font-bold">
              Crimson Defile
            </div>
            <div className="absolute right-[6%] top-[6%] text-[10px] font-medieval uppercase tracking-widest text-amber-500/80 font-bold">
              Seat of the Fallen King
            </div>
          </div>

          {/* Interactive Chapter Nodes along the Winding Path */}
          {CAMPAIGN_CHAPTERS.map((chapter) => {
            const coords = CHAPTER_COORDINATES[chapter.id] || { x: 50, y: 50, region: '', iconType: '' };
            const unlocked = chapter.id <= playerState.highestChapterUnlocked;
            const stars = playerState.chapterStars[chapter.id] || 0;
            const isSelected = chapter.id === selectedChapterId;
            const isCurrent = chapter.id === currentChapterId;
            const isBoss = chapter.isBoss;

            // Percentage positioning relative to 1000x560 virtual canvas
            const leftPct = `${(coords.x / 1000) * 100}%`;
            const topPct = `${(coords.y / 560) * 100}%`;

            return (
              <div
                key={chapter.id}
                style={{ left: leftPct, top: topPct }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              >
                {/* Chapter Landmark Node Pin */}
                <button
                  onClick={() => handleNodeClick(chapter.id)}
                  className={`group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none ${
                    isSelected ? 'scale-115 z-30' : 'hover:scale-110 z-20'
                  }`}
                  title={`${chapter.name} (Chapter ${chapter.chapterNumber})`}
                >
                  {/* Current Objective Beacon Ring */}
                  {isCurrent && (
                    <div className="absolute -inset-3 rounded-full border-2 border-amber-400/80 animate-ping pointer-events-none" />
                  )}

                  {/* Main Landmark Node Circle */}
                  <div
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
                      isSelected
                        ? 'ring-4 ring-amber-400/80 border-amber-300 bg-amber-950 scale-105'
                        : isBoss
                        ? 'border-rose-500 bg-rose-950 text-rose-300 shadow-rose-950/60'
                        : unlocked
                        ? stars > 0
                          ? 'border-amber-500 bg-stone-900 text-amber-300 shadow-amber-950/50'
                          : 'border-amber-400 bg-amber-950/80 text-amber-200'
                        : 'border-stone-700 bg-stone-900/90 text-stone-600 opacity-60'
                    }`}
                  >
                    {isBoss ? (
                      <Skull className="w-5 h-5 text-rose-400 drop-shadow" />
                    ) : unlocked ? (
                      <div className="flex flex-col items-center">
                        <span className="font-pixel text-xs sm:text-sm font-bold leading-none">
                          {chapter.chapterNumber}
                        </span>
                        {/* 1-3 Stars mini-row */}
                        {stars > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`w-2 h-2 ${
                                  s <= stars
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-stone-700'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Lock className="w-4 h-4 text-stone-600" />
                    )}

                    {/* Active march waypoint marker */}
                    {isCurrent && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-[9px] font-medieval font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-md flex items-center gap-0.5">
                        <Swords className="w-2.5 h-2.5" />
                        <span>MARCH</span>
                      </div>
                    )}
                  </div>

                  {/* Node Title Plaque */}
                  <div
                    className={`mt-1.5 px-2 py-0.5 rounded-md border text-center whitespace-nowrap pointer-events-none transition-all shadow-md ${
                      isSelected
                        ? 'bg-amber-950/95 border-amber-500/80 text-amber-200 ring-1 ring-amber-400/40'
                        : unlocked
                        ? 'bg-stone-950/85 border-stone-800 text-stone-200'
                        : 'bg-stone-950/60 border-stone-900 text-stone-600'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-medieval font-bold block truncate max-w-[100px] sm:max-w-[130px]">
                      {chapter.name}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Chapter Scouting Drawer / Panel (Parchment Banner at Bottom) */}
      {showScoutModal && (
        <div className="relative z-30 w-full max-w-4xl mx-auto px-3 sm:px-6 pb-3 animate-fade-in">
          <div className="relative p-3.5 sm:p-4 rounded-xl bg-stone-900/95 border-2 border-stone-700 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Chapter Identification & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-pixel text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-700 font-bold uppercase">
                  Chapter {selectedChapter.chapterNumber}
                </span>
                {selectedChapter.isBoss && (
                  <span className="text-[10px] font-pixel text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-700 font-bold flex items-center gap-1 uppercase">
                    <Skull className="w-3 h-3 text-rose-400" /> Climax Encounter
                  </span>
                )}
                <span className="text-[11px] font-flavor text-stone-400">
                  {selectedChapter.location}
                </span>
              </div>

              <h3 className="font-medieval text-base sm:text-lg font-bold text-stone-100 truncate">
                {selectedChapter.name}
              </h3>
              <p className="text-xs text-stone-300 font-flavor line-clamp-1 mt-0.5 leading-relaxed">
                {selectedChapter.description}
              </p>

              {/* Enemy Squad Preview */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  Enemy Defenders:
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedChapter.enemyComposition.slice(0, 5).map((enemy, idx) => {
                    const hero = HERO_ROSTER[enemy.heroId];
                    if (!hero) return null;
                    return (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden"
                        title={`${hero.name} (Lv.${enemy.level})`}
                      >
                        <PixelSprite definition={hero} size={22} facing="left" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle: Rewards & Recommended Power */}
            <div className="flex items-center gap-4 shrink-0 px-2 border-y md:border-y-0 md:border-x border-stone-800 py-2 md:py-0">
              <div className="text-center md:text-left">
                <span className="text-[10px] font-mono text-stone-400 uppercase block">
                  Recommended Power
                </span>
                <span className="font-pixel text-sm text-amber-400 font-bold">
                  {selectedChapter.recommendedPower.toLocaleString()}
                </span>
              </div>

              <div className="text-center md:text-left">
                <span className="text-[10px] font-mono text-stone-400 uppercase block">
                  First Rewards
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-[11px] font-pixel text-amber-300">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>{selectedChapter.rewards.gold}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-pixel text-purple-300">
                    <Gem className="w-3 h-3 text-purple-400" />
                    <span>{selectedChapter.rewards.astralGems}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Primary March / Scout CTA Button */}
            <div className="shrink-0 w-full md:w-auto">
              {isUnlocked ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    onSelectChapterToBattle(selectedChapter);
                  }}
                  className="w-full md:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-medieval font-bold text-xs uppercase tracking-wider shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                >
                  <Swords className="w-4 h-4 fill-stone-950" />
                  <span>
                    {isCompleted ? 'Re-engage Chapter' : 'March to Battle'}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full md:w-auto py-2.5 px-5 rounded-xl bg-stone-800 border border-stone-700 text-stone-500 font-medieval font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Path Locked</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
