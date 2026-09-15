import React from 'react';
import { PlayerState, AppScreen } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_WORLDS } from '../../data/campaign';
import { calculateSquadPower } from '../../game/formationEngine';
import { sound } from '../../game/audio';
import { PixelSprite } from '../common/PixelSprite';
import { HDHeroCard, getRarityBadgeBg } from '../common/HDHeroCard';
import {
  Swords,
  Compass,
  Users,
  Sparkles,
  Shield,
  Trophy,
  Crown,
  Play,
  MapPin,
  Flame,
} from 'lucide-react';

interface MainHubProps {
  playerState: PlayerState;
  onNavigate: (screen: AppScreen) => void;
  onSelectHeroDetail: (heroId: string) => void;
  onStartCampaignBattle: (chapterId: number) => void;
}

export const MainHub: React.FC<MainHubProps> = ({
  playerState,
  onNavigate,
  onSelectHeroDetail,
  onStartCampaignBattle,
}) => {
  // Find Home Showcase Hero (LEGENDS or MYTHOS)
  const showcaseId =
    playerState.homeShowcaseHeroId ||
    Object.keys(playerState.ownedHeroes).find(
      (id) => HERO_ROSTER[id]?.rarity === 'LEGENDS' || HERO_ROSTER[id]?.rarity === 'MYTHOS'
    ) ||
    'valiant_paladin';

  const showcaseHero = HERO_ROSTER[showcaseId] || HERO_ROSTER.valiant_paladin;
  const showcasePlayerHero = playerState.ownedHeroes[showcaseHero.id];
  const showcaseLevel = showcasePlayerHero?.level || 1;
  const showcaseStars = showcasePlayerHero?.stars || 1;

  // Next Chapter progression data
  const currentChapterId = Math.min(10, playerState.highestChapterUnlocked);
  const currentChapter =
    CAMPAIGN_CHAPTERS.find((c) => c.id === currentChapterId) || CAMPAIGN_CHAPTERS[0];
  const activeWorld = CAMPAIGN_WORLDS[0];

  const squadPower = calculateSquadPower(playerState.squad, playerState.ownedHeroes);

  // Squad hero list for visual battle order
  const squadHeroes = playerState.squad
    .map((id) => HERO_ROSTER[id])
    .filter(Boolean);

  return (
    <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-hidden select-none bg-stone-950">
      {/* Background Environmental Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-[#181311] to-[#0c0a09]" />

        {/* Mountain & Castle Horizon Silhouettes */}
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-[70%] opacity-25"
        >
          <polygon points="0,600 0,350 200,270 450,420 700,230 950,380 1200,280 1200,600" fill="#292524" />
          <rect x="520" y="190" width="80" height="260" fill="#1c1917" />
          <polygon points="510,190 560,120 610,190" fill="#0c0a09" />
          <rect x="630" y="230" width="60" height="220" fill="#1c1917" />
          <polygon points="620,230 660,160 700,230" fill="#0c0a09" />
          <rect x="400" y="380" width="400" height="120" fill="#1c1917" />
        </svg>

        {/* Floating Ember & Starlight Atmosphere */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
      </div>

      {/* Hub Realm Header */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-3 pb-2 flex items-center justify-between border-b border-stone-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-400 shadow-md">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
              {activeWorld.title} • Realm Outpost
            </span>
            <h1 className="font-medieval text-base sm:text-lg font-bold text-stone-100">
              The Fallen Kingdom
            </h1>
          </div>
        </div>

        {/* Squad War Power Pill */}
        <div className="flex items-center gap-3 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-lg shadow-inner">
          <Shield className="w-4 h-4 text-sky-400" />
          <div className="text-right">
            <span className="text-[10px] font-mono text-stone-400 uppercase block leading-none">
              Squad Power
            </span>
            <span className="font-pixel text-sm text-amber-400 font-bold leading-tight">
              {squadPower.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main World Stage: Hero Focal Point & Expedition Marchboard */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column (7 cols): Showcase Champion on Altar Pedestal */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="relative flex flex-col items-center">
            {/* Ancient Stone Pedestal Runic Glow Rings */}
            <div
              className="absolute -bottom-6 w-60 h-24 rounded-[100%] border border-amber-500/30 opacity-70 pointer-events-none"
              style={{
                boxShadow: `0 0 45px ${showcaseHero.colorScheme.glow}`,
                transform: 'rotateX(65deg)',
              }}
            />
            <div
              className="absolute -bottom-3 w-48 h-16 rounded-[100%] border border-purple-500/40 pointer-events-none"
              style={{ transform: 'rotateX(65deg)' }}
            />

            {/* Showcase Hero Card / Visual */}
            <div
              onClick={() => {
                sound.playClick();
                onSelectHeroDetail(showcaseHero.id);
              }}
              className="group relative cursor-pointer transform hover:scale-[1.03] transition-all duration-300"
              title="Click to inspect and upgrade champion"
            >
              {/* Royal Crown Crest */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-stone-950 border border-amber-500/80 px-3 py-0.5 rounded-full shadow-lg">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-medieval text-amber-200 tracking-wider font-bold">
                  CAMP CHAMPION
                </span>
              </div>

              <HDHeroCard
                definition={showcaseHero}
                level={showcaseLevel}
                stars={showcaseStars}
                isOwned={true}
                size="lg"
                showStats={true}
              />

              {/* Hover inspect prompt */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center z-30 pointer-events-none">
                <span className="text-xs font-medieval text-amber-300 bg-stone-950/95 px-3 py-1.5 rounded-lg border border-amber-500/60 shadow-xl">
                  Inspect Champion
                </span>
              </div>
            </div>
          </div>

          {/* Champion Lore Quote Banner */}
          <div className="mt-3 text-center max-w-md">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getRarityBadgeBg(showcaseHero.rarity)}`}>
                {showcaseHero.rarity}
              </span>
              <span className="text-xs font-medieval text-stone-200 font-bold">
                {showcaseHero.name}
              </span>
              <span className="text-xs text-amber-400 font-pixel">
                Lv.{showcaseLevel}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-flavor italic line-clamp-1">
              "{showcaseHero.lore}"
            </p>
          </div>
        </div>

        {/* Right Column (5 cols): Active Expedition & Squad Readiness */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Active Expedition Marchboard */}
          <div className="bg-stone-950/85 border-2 border-stone-800 p-5 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-950 border border-amber-800 text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                    Next Destination
                  </span>
                  <span className="font-medieval text-xs text-stone-400">
                    Chapter {currentChapter.chapterNumber} of 10
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigate('campaign');
                }}
                className="text-[11px] font-medieval text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                View World Map →
              </button>
            </div>

            {/* Destination Description */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-stone-400 text-xs font-flavor mb-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentChapter.location}</span>
              </div>
              <h2 className="font-medieval text-xl font-bold text-stone-100">
                {currentChapter.name}
              </h2>
              <p className="text-xs text-stone-300 font-flavor leading-relaxed mt-1">
                {currentChapter.description}
              </p>
            </div>

            {/* Recommended Power vs Squad Power */}
            <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between text-xs mb-4">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase block">
                  Recommended
                </span>
                <span className="font-pixel text-sm text-stone-300 font-bold">
                  {currentChapter.recommendedPower.toLocaleString()} Power
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-stone-400 uppercase block">
                  Squad Power
                </span>
                <span
                  className={`font-pixel text-sm font-bold ${
                    squadPower >= currentChapter.recommendedPower
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {squadPower.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Primary Action Button: March Directly into Battle */}
            <button
              onClick={() => {
                sound.playClick();
                onStartCampaignBattle(currentChapter.id);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-medieval font-bold text-sm uppercase tracking-wider shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-99 transition-all"
            >
              <Swords className="w-4 h-4 fill-stone-950" />
              <span>March to Battle</span>
            </button>
          </div>

          {/* Deployed Squad Quick Preview (Battle Readiness) */}
          <div className="bg-stone-950/70 border border-stone-800/80 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                Deployed Squad ({squadHeroes.length}/5)
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {squadHeroes.map((hero, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center overflow-hidden"
                    title={hero.name}
                  >
                    <PixelSprite definition={hero} size={28} facing="right" />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('squad');
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-400 text-xs font-medieval font-bold cursor-pointer transition-colors"
            >
              Tactical Formation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
