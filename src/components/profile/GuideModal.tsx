import React from 'react';
import { X, Shield, Swords, Sparkles, BookOpen, Flame, Compass } from 'lucide-react';
import { sound } from '../../game/audio';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-stone-900/95 rounded-xl border-2 border-stone-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-medieval text-lg font-bold text-stone-100">
              Tactician's Codex — Game Rules
            </h3>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-stone-300 leading-relaxed font-flavor">
          <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1">
            <h4 className="font-medieval text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <Swords className="w-4 h-4" /> 1. Deterministic 5v5 Auto-Battle
            </h4>
            <p className="text-stone-400">
              Units engage automatically in real time across the horizontal arena. Tanks protect the front, Fighters clash in the midline, while Mages, Assassins, and Healers strike or support from range.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1">
            <h4 className="font-medieval text-sm font-bold text-blue-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> 2. 3×3 Tactical Grid Formation
            </h4>
            <p className="text-stone-400">
              Your squad uses 5 heroes across a 3×3 (9-slot) board. Units in the frontline receive enemy focus first, shielding backline glass cannons. Units in the backline take longer to be engaged by standard melee units.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1">
            <h4 className="font-medieval text-sm font-bold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 3. Energy & Ultimate Abilities
            </h4>
            <p className="text-stone-400">
              Attacking and taking damage generates Energy. At 100 Energy, units trigger their signature Ultimates with cinematic time-dilation pauses and massive elemental effects.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1">
            <h4 className="font-medieval text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> 4. Elemental Resonance
            </h4>
            <p className="text-stone-400">
              Elemental interactions deal 120% damage on advantage: Fire strikes Wind, Wind cleaves Earth, Earth crushes Water, Water douses Fire. Light and Dark clash directly with critical vulnerability.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-950 text-right">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-medieval font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
