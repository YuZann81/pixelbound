import React from 'react';
import { AppScreen } from '../../types';
import { sound } from '../../game/audio';
import {
  Castle,
  Trophy,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  // Never show bottom nav during active combat for cinematic immersion
  if (currentScreen === 'battle') return null;

  const isHomeActive = currentScreen === 'hub';
  const isArenaActive = currentScreen === 'arena';
  // Campaign is active either directly on campaign map or during contextual battle prep (squad)
  const isCampaignActive = currentScreen === 'campaign' || currentScreen === 'squad';
  const isHeroesActive = currentScreen === 'heroes';
  const isSummonActive = currentScreen === 'gacha';

  return (
    <nav
      id="global-bottom-nav"
      aria-label="Main Navigation"
      className="relative z-30 w-full bg-stone-950/95 border-t border-stone-800/90 backdrop-blur-md select-none shrink-0"
    >
      <div className="relative max-w-lg mx-auto flex items-end justify-between px-3 sm:px-6 py-1.5 min-h-[58px]">
        {/* 1. HOME */}
        <button
          id="nav-home"
          onClick={() => {
            if (currentScreen !== 'hub') {
              sound.playClick();
              onNavigate('hub');
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-150 cursor-pointer ${
            isHomeActive
              ? 'bg-stone-900/90 border border-stone-700/80 text-amber-300 shadow-inner'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border border-transparent'
          }`}
        >
          <Castle
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform ${
              isHomeActive ? 'text-amber-400 scale-105' : 'text-stone-400'
            }`}
          />
          <span className="font-medieval text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            Home
          </span>
        </button>

        {/* 2. ARENA */}
        <button
          id="nav-arena"
          onClick={() => {
            if (currentScreen !== 'arena') {
              sound.playClick();
              onNavigate('arena');
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-150 cursor-pointer ${
            isArenaActive
              ? 'bg-stone-900/90 border border-stone-700/80 text-amber-300 shadow-inner'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border border-transparent'
          }`}
        >
          <Trophy
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform ${
              isArenaActive ? 'text-amber-400 scale-105' : 'text-stone-400'
            }`}
          />
          <span className="font-medieval text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            Arena
          </span>
        </button>

        {/* 3. CAMPAIGN (VISUAL CENTERPIECE)
            Physically integrated into the navigation bar with a carved crest silhouette,
            raised slightly above the adjacent items to establish primary journey progression
            without floating or excessive effects.
        */}
        <div className="flex-1 flex justify-center px-1">
          <button
            id="nav-campaign"
            onClick={() => {
              if (currentScreen !== 'campaign') {
                sound.playClick();
                onNavigate('campaign');
              }
            }}
            className={`relative -top-2.5 px-3.5 sm:px-4 py-1.5 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer select-none ${
              isCampaignActive
                ? 'bg-stone-900 border-amber-400 text-amber-200 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/40 scale-102'
                : 'bg-stone-900/95 border-amber-700/60 text-amber-400/90 hover:border-amber-500 hover:text-amber-300 hover:scale-101 shadow-md'
            }`}
          >
            {/* Subtle Carved Bezel Inset */}
            <div className="relative p-1 rounded-lg bg-stone-950/80 border border-amber-900/60 flex items-center justify-center mb-0.5">
              <Compass
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                  isCampaignActive ? 'text-amber-400 scale-110 animate-pulse' : 'text-amber-500'
                }`}
              />
            </div>
            <span className="font-medieval text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase">
              Campaign
            </span>
          </button>
        </div>

        {/* 4. HEROES */}
        <button
          id="nav-heroes"
          onClick={() => {
            if (currentScreen !== 'heroes') {
              sound.playClick();
              onNavigate('heroes');
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-150 cursor-pointer ${
            isHeroesActive
              ? 'bg-stone-900/90 border border-stone-700/80 text-amber-300 shadow-inner'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border border-transparent'
          }`}
        >
          <Users
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform ${
              isHeroesActive ? 'text-amber-400 scale-105' : 'text-stone-400'
            }`}
          />
          <span className="font-medieval text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            Heroes
          </span>
        </button>

        {/* 5. SUMMON */}
        <button
          id="nav-summon"
          onClick={() => {
            if (currentScreen !== 'gacha') {
              sound.playClick();
              onNavigate('gacha');
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-150 cursor-pointer ${
            isSummonActive
              ? 'bg-stone-900/90 border border-stone-700/80 text-amber-300 shadow-inner'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border border-transparent'
          }`}
        >
          <Sparkles
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform ${
              isSummonActive ? 'text-amber-400 scale-105' : 'text-stone-400'
            }`}
          />
          <span className="font-medieval text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            Summon
          </span>
        </button>
      </div>
    </nav>
  );
};
