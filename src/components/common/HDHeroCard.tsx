import React from 'react';
import { HeroDefinition, HeroElement, HeroRarity, HeroRole } from '../../types';
import { Flame, Droplets, Mountain, Wind, Sun, Moon, Shield, Sword, Wand2, Crosshair, HeartPulse, Target } from 'lucide-react';

interface HDHeroCardProps {
  definition: HeroDefinition;
  level?: number;
  stars?: number;
  isOwned?: boolean;
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

export const getElementIcon = (element: HeroElement, className: string = 'w-4 h-4') => {
  const normalized = (element || '').toUpperCase();
  switch (normalized) {
    case 'FIRE':
      return <Flame className={`${className} text-amber-500`} />;
    case 'WATER':
      return <Droplets className={`${className} text-sky-400`} />;
    case 'EARTH':
      return <Mountain className={`${className} text-emerald-500`} />;
    case 'WIND':
      return <Wind className={`${className} text-teal-400`} />;
    case 'LIGHT':
      return <Sun className={`${className} text-yellow-300`} />;
    case 'DARK':
      return <Moon className={`${className} text-purple-400`} />;
    default:
      return <Flame className={`${className} text-amber-500`} />;
  }
};

export const getRoleIcon = (role: HeroRole, className: string = 'w-4 h-4') => {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'TANK':
      return <Shield className={`${className} text-blue-400`} />;
    case 'FIGHTER':
      return <Sword className={`${className} text-red-400`} />;
    case 'ASSASSIN':
      return <Crosshair className={`${className} text-purple-400`} />;
    case 'MAGE':
      return <Wand2 className={`${className} text-cyan-400`} />;
    case 'RANGER':
      return <Target className={`${className} text-amber-400`} />;
    case 'SUPPORT':
      return <HeartPulse className={`${className} text-green-400`} />;
    default:
      return <Sword className={`${className} text-red-400`} />;
  }
};

export const getRarityBorder = (rarity: HeroRarity) => {
  const normalized = (rarity || '').toUpperCase();
  switch (normalized) {
    case 'COMMON':
      return 'border-stone-600 shadow-sm';
    case 'UNCOMMON':
      return 'border-emerald-600 shadow-emerald-950/40 shadow-sm';
    case 'RARE':
      return 'border-sky-500 shadow-sky-950/50 shadow-md';
    case 'EPIC':
      return 'border-purple-500 shadow-purple-950/50 shadow-lg';
    case 'LEGENDS':
    case 'LEGENDARY':
      return 'border-amber-400 shadow-amber-900/60 shadow-xl ring-1 ring-amber-400/40';
    case 'MYTHOS':
    case 'MYTHIC':
      return 'border-rose-500 shadow-rose-950/70 shadow-2xl ring-2 ring-rose-400/60';
    default:
      return 'border-stone-600';
  }
};

export const getRarityBadgeBg = (rarity: HeroRarity) => {
  const normalized = (rarity || '').toUpperCase();
  switch (normalized) {
    case 'COMMON':
      return 'bg-stone-800 text-stone-300';
    case 'UNCOMMON':
      return 'bg-emerald-950 text-emerald-300 border border-emerald-600/50';
    case 'RARE':
      return 'bg-sky-950 text-sky-300 border border-sky-600/50';
    case 'EPIC':
      return 'bg-purple-950 text-purple-300 border border-purple-600/50';
    case 'LEGENDS':
    case 'LEGENDARY':
      return 'bg-amber-950 text-amber-300 border border-amber-500/60';
    case 'MYTHOS':
    case 'MYTHIC':
      return 'bg-rose-950 text-rose-200 border border-rose-500/70 animate-pulse';
    default:
      return 'bg-stone-800 text-stone-300';
  }
};

export const HDHeroCard: React.FC<HDHeroCardProps> = ({
  definition,
  level = 1,
  stars = 1,
  isOwned = true,
  isSelected = false,
  isLocked = false,
  onClick,
  size = 'md',
  showStats = false,
}) => {
  const { name, role, element, rarity, colorScheme, visualTraits } = definition;

  const cardWidth = size === 'sm' ? 'w-36 h-52' : size === 'lg' ? 'w-64 h-92' : 'w-48 h-68';

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer select-none rounded-lg overflow-hidden border-2 bg-stone-900 transition-all duration-200 ${cardWidth} ${getRarityBorder(
        rarity
      )} ${
        isSelected
          ? 'scale-105 ring-2 ring-amber-300 z-10 shadow-amber-500/30 shadow-xl'
          : 'hover:-translate-y-1 hover:brightness-110'
      } ${isLocked ? 'grayscale opacity-60' : ''}`}
    >
      {/* Ornate corner brackets for medieval RPG card feel */}
      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500/60 pointer-events-none z-20" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500/60 pointer-events-none z-20" />
      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500/60 pointer-events-none z-20" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500/60 pointer-events-none z-20" />

      {/* Top Header: Role Icon, Element Icon, Rarity Badge */}
      <div className="absolute top-2 inset-x-2 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-1 bg-stone-950/80 px-1.5 py-0.5 rounded border border-stone-700/60 backdrop-blur-xs">
          {getRoleIcon(role, 'w-3.5 h-3.5')}
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-300">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="p-1 rounded bg-stone-950/80 border border-stone-700/60">
            {getElementIcon(element, 'w-3.5 h-3.5')}
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRarityBadgeBg(rarity)}`}>
            {rarity.slice(0, 3)}
          </span>
        </div>
      </div>

      {/* HD Fantasy Illustration Backdrop & Character Art */}
      <div className="relative w-full h-[65%] overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
        {/* Fantasy background magic aura */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${colorScheme.primary}, transparent 70%)`,
          }}
        />

        {/* Ornate Fantasy Crest / HD Silhouette Art */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 100 110"
            className={`w-28 h-28 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] ${
              isLocked ? 'brightness-50' : ''
            }`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Halo or Back Crest */}
            <circle
              cx="50"
              cy="42"
              r="34"
              fill={colorScheme.glow}
              stroke={colorScheme.accent}
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.6"
            />
            {/* Shoulders / Cloak */}
            <path
              d="M20 95 C25 65, 75 65, 80 95 Z"
              fill={visualTraits.capeColor || '#1f2937'}
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Chest Plate / Pauldrons */}
            <path
              d="M32 68 L50 90 L68 68 L50 62 Z"
              fill={visualTraits.armorColor}
              stroke={colorScheme.primary}
              strokeWidth="1.5"
            />
            {/* Pauldrons (Shoulder pads) */}
            <polygon points="18,65 32,60 28,78" fill={colorScheme.secondary} stroke="#000000" strokeWidth="1" />
            <polygon points="82,65 68,60 72,78" fill={colorScheme.secondary} stroke="#000000" strokeWidth="1" />
            {/* Head / Helmet */}
            <ellipse cx="50" cy="42" rx="16" ry="18" fill="#fce7f3" />
            {/* Hair / Headpiece */}
            {visualTraits.headpiece === 'helmet' ? (
              <path
                d="M32 38 C32 20, 68 20, 68 38 L65 52 L50 48 L35 52 Z"
                fill="#475569"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
            ) : visualTraits.headpiece === 'hood' ? (
              <path
                d="M30 46 C30 18, 70 18, 70 46 C68 56, 32 56, 30 46 Z"
                fill="#1e1b4b"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            ) : (
              <path
                d="M34 38 C34 24, 66 24, 66 38 C62 30, 38 30, 34 38 Z"
                fill={visualTraits.hairColor}
              />
            )}
            {/* Visor or Eyes */}
            <circle cx="44" cy="42" r="2.5" fill={colorScheme.accent} />
            <circle cx="56" cy="42" r="2.5" fill={colorScheme.accent} />
            {/* Weapon Symbol on chest or side */}
            <path
              d="M48 30 L52 30 L50 15 Z"
              fill={colorScheme.primary}
            />
          </svg>
        </div>

        {/* Level and Stars Badges in Bottom of portrait */}
        {isOwned && (
          <>
            <div className="absolute bottom-2 left-2 z-20 flex items-center gap-0.5 bg-stone-950/85 border border-stone-800 px-1 py-0.5 rounded">
              {Array.from({ length: Math.min(5, Math.max(1, stars)) }).map((_, i) => (
                <span key={i} className="text-amber-400 text-[9px] leading-none">★</span>
              ))}
            </div>
            <div className="absolute bottom-2 right-2 z-20 bg-stone-950/90 border border-amber-600/70 px-2 py-0.5 rounded text-[11px] font-pixel text-amber-300">
              Lv.{level}
            </div>
          </>
        )}

        {isLocked && (
          <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-medieval tracking-widest text-stone-400 uppercase bg-stone-950/80 px-2.5 py-1 rounded border border-stone-700">
              Locked
            </span>
          </div>
        )}
      </div>

      {/* Card Info Bottom Panel */}
      <div className="relative p-2.5 bg-stone-950 border-t border-stone-800 flex flex-col justify-between h-[35%]">
        <div>
          <h4 className="font-medieval text-sm font-bold text-stone-100 truncate tracking-wide">
            {name}
          </h4>
          <p className="text-[11px] text-stone-400 font-medium truncate">
            {definition.title}
          </p>
        </div>

        {/* Stats bar if requested */}
        {showStats ? (
          <div className="grid grid-cols-3 gap-1 text-[10px] text-stone-300 font-pixel mt-1 pt-1 border-t border-stone-800/80">
            <div>HP: <span className="text-emerald-400">{definition.baseStats.hp}</span></div>
            <div>ATK: <span className="text-amber-400">{definition.baseStats.atk}</span></div>
            <div>DEF: <span className="text-sky-400">{definition.baseStats.def}</span></div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mt-1 pt-1 border-t border-stone-800/80">
            <span className="text-stone-500 uppercase">{element}</span>
            <span className="text-amber-500/90 font-medium">{definition.ultimate.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
