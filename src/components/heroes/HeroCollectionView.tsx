import React, { useState } from 'react';
import { PlayerState, HeroRole, HeroElement } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { HDHeroCard } from '../common/HDHeroCard';
import { sound } from '../../game/audio';
import { Users, Filter, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

interface HeroCollectionViewProps {
  playerState: PlayerState;
  onSelectHeroDetail: (heroId: string) => void;
}

export const HeroCollectionView: React.FC<HeroCollectionViewProps> = ({
  playerState,
  onSelectHeroDetail,
}) => {
  const [roleFilter, setRoleFilter] = useState<HeroRole | 'All'>('All');
  const [elementFilter, setElementFilter] = useState<HeroElement | 'All'>('All');

  const heroesList = Object.values(HERO_ROSTER);

  const filteredHeroes = heroesList.filter((hero) => {
    if (roleFilter !== 'All' && hero.role !== roleFilter) return false;
    if (elementFilter !== 'All' && hero.element !== elementFilter) return false;
    return true;
  });

  const ownedCount = Object.keys(playerState.ownedHeroes).length;
  const deployedIds = playerState.squad;

  return (
    <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden bg-stone-950 select-none">
      {/* Hall of Champions Header */}
      <div className="relative z-10 px-4 sm:px-8 py-3 bg-stone-950/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-pixel uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              HALL OF CHAMPIONS
            </span>
            <h2 className="font-medieval text-xl sm:text-2xl font-bold text-stone-100">
              Adventurer Roster
            </h2>
          </div>
          <p className="text-xs text-stone-400 font-flavor">
            {ownedCount} of {heroesList.length} Heroes Awoken • Click any hero to inspect stats, lore, and ascend stars
          </p>
        </div>

        {/* Thematic Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-lg border border-stone-800 text-xs">
            {(['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Support'] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  sound.playClick();
                  setRoleFilter(role);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medieval font-semibold transition-colors cursor-pointer ${
                  roleFilter === role
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Element Filter */}
          <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-lg border border-stone-800 text-xs">
            {(['All', 'Fire', 'Water', 'Earth', 'Wind', 'Light', 'Dark'] as const).map((el) => (
              <button
                key={el}
                onClick={() => {
                  sound.playClick();
                  setElementFilter(el);
                }}
                className={`px-2 py-1 rounded text-[10px] font-pixel transition-colors cursor-pointer ${
                  elementFilter === el
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {el}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Cards Grid */}
      <div className="relative z-10 flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {filteredHeroes.map((hero) => {
            const playerHero = playerState.ownedHeroes[hero.id];
            const isOwned = !!playerHero;
            const isDeployed = deployedIds.includes(hero.id);

            return (
              <div key={hero.id} className="relative group">
                <HDHeroCard
                  definition={hero}
                  level={playerHero?.level || 1}
                  stars={playerHero?.stars || 1}
                  isOwned={isOwned}
                  isLocked={!isOwned}
                  size="md"
                  showStats={false}
                  onClick={() => {
                    sound.playClick();
                    onSelectHeroDetail(hero.id);
                  }}
                />

                {/* Squad Placement Tag */}
                {isDeployed && (
                  <div className="absolute top-2 left-2 z-20 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-[9px] font-pixel font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>IN SQUAD</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
