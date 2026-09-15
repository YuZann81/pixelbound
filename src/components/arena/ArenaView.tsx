import React from 'react';
import { Trophy, Globe, Wifi, Lock, Swords, Shield } from 'lucide-react';

export const ArenaView: React.FC = () => {
  return (
    <div className="relative flex-1 w-full flex flex-col overflow-hidden bg-stone-950 select-none">
      {/* Colosseum arena background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1917] to-[#0c0a09]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 sm:px-8 py-3 bg-stone-950/85 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-pixel uppercase tracking-wider text-amber-500 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            THE GRAND COLOSSEUM
          </span>
          <h2 className="font-medieval text-xl sm:text-2xl font-black text-stone-100">
            VS Arena
          </h2>
        </div>
        <p className="text-xs text-stone-400 font-flavor">
          PvP combat arena for competitive tacticians
        </p>
      </div>

      {/* Arena Modes */}
      <div className="relative z-10 flex-1 p-6 sm:p-10 flex items-center justify-center">
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. VS ONLINE (All Servers) */}
          <div className="p-6 rounded-xl bg-stone-900/90 border-2 border-stone-800 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-pixel text-amber-500 bg-stone-950 px-2 py-1 rounded border border-stone-800">
              <Lock className="w-3.5 h-3.5" />
              <span>LOCKED</span>
            </div>

            <div>
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 w-fit text-amber-400 mb-4">
                <Globe className="w-8 h-8" />
              </div>

              <h3 className="font-medieval text-xl font-bold text-stone-200">
                VS ONLINE
              </h3>
              <p className="text-xs text-amber-400/80 font-pixel mt-0.5">
                All Servers
              </p>

              <p className="text-xs text-stone-400 font-flavor mt-3 leading-relaxed">
                Ranked ladder and cross-realm 5v5 tactical asynchronous duel matchmaking.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-stone-800 text-center">
              <span className="inline-block px-4 py-1.5 rounded bg-stone-950 border border-stone-800 font-pixel text-xs text-stone-400 uppercase tracking-widest font-bold">
                Status: COMING SOON
              </span>
            </div>
          </div>

          {/* 2. VS LAN (Same Network) */}
          <div className="p-6 rounded-xl bg-stone-900/90 border-2 border-stone-800 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-pixel text-amber-500 bg-stone-950 px-2 py-1 rounded border border-stone-800">
              <Lock className="w-3.5 h-3.5" />
              <span>LOCKED</span>
            </div>

            <div>
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 w-fit text-teal-400 mb-4">
                <Wifi className="w-8 h-8" />
              </div>

              <h3 className="font-medieval text-xl font-bold text-stone-200">
                VS LAN
              </h3>
              <p className="text-xs text-teal-400/80 font-pixel mt-0.5">
                Same Network
              </p>

              <p className="text-xs text-stone-400 font-flavor mt-3 leading-relaxed">
                Local peer-to-peer arena battles across devices connected to the same local area network.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-stone-800 text-center">
              <span className="inline-block px-4 py-1.5 rounded bg-stone-950 border border-stone-800 font-pixel text-xs text-stone-400 uppercase tracking-widest font-bold">
                Status: COMING SOON
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
