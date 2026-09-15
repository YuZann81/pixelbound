import React, { useState } from 'react';
import { PlayerState, FormationGrid, CampaignChapter, PlayerHero } from '../../types';
import { HERO_ROSTER } from '../../data/heroes';
import { PixelSprite } from '../common/PixelSprite';
import { getElementIcon, getRoleIcon, getRarityBadgeBg } from '../common/HDHeroCard';
import { sound } from '../../game/audio';
import {
  Swords,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Shield,
  Crosshair,
  Sparkles,
  MapPin,
  Users,
} from 'lucide-react';

interface FormationViewProps {
  playerState: PlayerState;
  onUpdateFormation: (newFormation: FormationGrid, newSquad: string[]) => void;
  onStartBattle: () => void;
  targetChapter?: CampaignChapter;
}

export const FormationView: React.FC<FormationViewProps> = ({
  playerState,
  onUpdateFormation,
  onStartBattle,
  targetChapter,
}) => {
  // Ensure latest formation has only currently owned & valid heroes
  const sanitizeFormation = (raw: FormationGrid): FormationGrid => {
    return raw.map((slot) => {
      if (slot.heroId && (!playerState.ownedHeroes[slot.heroId] || !HERO_ROSTER[slot.heroId])) {
        return { ...slot, heroId: null };
      }
      return slot;
    });
  };

  const [formation, setFormation] = useState<FormationGrid>(() => sanitizeFormation(playerState.formation));
  const [selectedSlot, setSelectedSlot] = useState<{ row: number; col: number } | null>(null);
  const [selectedRosterHeroId, setSelectedRosterHeroId] = useState<string | null>(null);

  // Synchronize and cleanse if playerState changes
  React.useEffect(() => {
    const cleaned = sanitizeFormation(playerState.formation);
    setFormation(cleaned);
  }, [playerState.formation, playerState.ownedHeroes]);

  // Active squad heroes on board
  const placedHeroIds = formation
    .map((s) => s.heroId)
    .filter((id): id is string => id !== null);

  const squadCount = placedHeroIds.length;

  // Calculate squad combat power
  const teamPower = placedHeroIds.reduce((sum, id) => {
    const hero = HERO_ROSTER[id];
    if (!hero) return sum;
    const lvl = playerState.ownedHeroes[id]?.level || 1;
    const power = Math.round(
      hero.baseStats.hp * 0.5 + hero.baseStats.atk * 3 + hero.baseStats.def * 2
    );
    return sum + Math.round(power * (1 + (lvl - 1) * 0.12));
  }, 0);

  // Handle clicking a 3x3 slot on the tactical board
  const handleSlotClick = (row: number, col: number) => {
    sound.playCardPlace();
    const currentSlot = formation.find((s) => s.row === row && s.col === col);
    const existingHeroId = currentSlot?.heroId || null;

    // Case 1: If a hero from the lower bench is selected, place into this slot
    if (selectedRosterHeroId) {
      const updated = formation.map((slot) => {
        if (slot.row === row && slot.col === col) {
          return { ...slot, heroId: selectedRosterHeroId };
        }
        if (slot.heroId === selectedRosterHeroId) {
          return { ...slot, heroId: existingHeroId };
        }
        return slot;
      });

      setFormation(updated);
      setSelectedRosterHeroId(null);
      setSelectedSlot(null);

      const newSquad = updated.map((s) => s.heroId).filter((id): id is string => id !== null);
      onUpdateFormation(updated, newSquad);
      return;
    }

    // Case 2: If a board slot was already selected, swap or move
    if (selectedSlot) {
      if (selectedSlot.row === row && selectedSlot.col === col) {
        setSelectedSlot(null);
        return;
      }

      const sourceSlot = formation.find(
        (s) => s.row === selectedSlot.row && s.col === selectedSlot.col
      );
      const sourceHeroId = sourceSlot?.heroId || null;

      const updated = formation.map((slot) => {
        if (slot.row === row && slot.col === col) {
          return { ...slot, heroId: sourceHeroId };
        }
        if (slot.row === selectedSlot.row && slot.col === selectedSlot.col) {
          return { ...slot, heroId: existingHeroId };
        }
        return slot;
      });

      setFormation(updated);
      setSelectedSlot(null);

      const newSquad = updated.map((s) => s.heroId).filter((id): id is string => id !== null);
      onUpdateFormation(updated, newSquad);
      return;
    }

    // Case 3: Select this slot
    setSelectedSlot({ row, col });
  };

  // Remove hero from board to bench
  const handleRemoveHero = (heroId: string) => {
    sound.playClick();
    const updated = formation.map((s) => (s.heroId === heroId ? { ...s, heroId: null } : s));
    setFormation(updated);
    setSelectedSlot(null);
    const newSquad = updated.map((s) => s.heroId).filter((id): id is string => id !== null);
    onUpdateFormation(updated, newSquad);
  };

  // Auto-Deploy 5 Strongest Champions
  const handleAutoFormation = () => {
    sound.playClick();
    const ownedIds = Object.keys(playerState.ownedHeroes).slice(0, 5);
    const updated = formation.map((s) => ({ ...s, heroId: null }));
    const slotsMap = [
      { r: 1, c: 2 }, // Front Center (Tank / Vanguard)
      { r: 0, c: 2 }, // Front Top (Fighter)
      { r: 1, c: 0 }, // Back Center (Mage / Carry)
      { r: 0, c: 0 }, // Back Top (Support / Healer)
      { r: 2, c: 1 }, // Mid Bottom (Assassin / Skirmisher)
    ];
    ownedIds.forEach((id, idx) => {
      if (idx < slotsMap.length) {
        const target = slotsMap[idx];
        const s = updated.find((slot) => slot.row === target.r && slot.col === target.c);
        if (s) s.heroId = id;
      }
    });

    setFormation(updated);
    setSelectedSlot(null);
    setSelectedRosterHeroId(null);
    const newSquad = updated.map((s) => s.heroId).filter((id): id is string => id !== null);
    onUpdateFormation(updated, newSquad);
  };

  return (
    <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden bg-stone-950 select-none">
      {/* Tactical Header */}
      <div className="relative z-10 px-4 sm:px-8 py-2.5 bg-stone-950/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-pixel uppercase tracking-wider text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
              BATTLE PREPARATION
            </span>
            <h2 className="font-medieval text-xl font-bold text-stone-100">
              Tactical Formation
            </h2>
          </div>
          <p className="text-xs text-stone-400 font-flavor">
            Frontline absorbs frontline blows • Midline skirmishes • Backline empowers spells & arrows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-3 text-xs font-pixel">
            <div>
              Squad:{' '}
              <strong className={squadCount === 5 ? 'text-emerald-400' : 'text-amber-400'}>
                {squadCount}/5
              </strong>
            </div>
            <span>•</span>
            <div>
              Squad Power: <strong className="text-amber-400">{teamPower.toLocaleString()}</strong>
            </div>
          </div>

          <button
            onClick={handleAutoFormation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-400 text-xs font-medieval font-bold cursor-pointer transition-colors"
            title="Automatically assign your strongest champions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Auto-Deploy</span>
          </button>
        </div>
      </div>

      {/* Main War Table Area */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-6 overflow-y-auto">
        {/* 3x3 Tactical Battlefield Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl bg-stone-900/90 rounded-2xl p-4 sm:p-6 border-2 border-stone-700 shadow-2xl relative">
            {/* Battlefield Direction Indicator */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800 text-xs font-medieval text-stone-400">
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Shield className="w-4 h-4" />
                Player Territory (Left)
              </span>
              <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                Facing Enemy Vanguard →
              </span>
            </div>

            {/* Column Headers: Backline (C1), Midline (C2), Frontline (C3) */}
            <div className="grid grid-cols-3 gap-3 mb-2.5 text-center text-xs font-medieval font-bold uppercase tracking-wider">
              <div className="text-stone-300 bg-stone-950/80 py-1 rounded border border-stone-800">
                Col 1: Backline
              </div>
              <div className="text-stone-300 bg-stone-950/80 py-1 rounded border border-stone-800">
                Col 2: Midline
              </div>
              <div className="text-amber-300 bg-amber-950/60 py-1 rounded border border-amber-900/50">
                Col 3: Frontline
              </div>
            </div>

            {/* 3x3 Tactical Grid Slots */}
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((colIdx) => (
                <div key={colIdx} className="space-y-3">
                  {[0, 1, 2].map((rowIdx) => {
                    const slot = formation.find((s) => s.row === rowIdx && s.col === colIdx);
                    const hero = slot?.heroId ? HERO_ROSTER[slot.heroId] : null;
                    const isSelected =
                      selectedSlot?.row === rowIdx && selectedSlot?.col === colIdx;

                    const rowName = rowIdx === 0 ? 'Top' : rowIdx === 1 ? 'Center' : 'Bottom';
                    const colRoleHint =
                      colIdx === 2
                        ? 'Vanguard / Tank'
                        : colIdx === 1
                        ? 'Assault / Assassin'
                        : 'Mage / Support';

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => handleSlotClick(rowIdx, colIdx)}
                        className={`relative h-24 sm:h-28 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden ${
                          isSelected
                            ? 'border-amber-400 bg-amber-950/50 ring-2 ring-amber-400 shadow-xl scale-102'
                            : hero
                            ? 'border-stone-700 bg-stone-950 hover:border-amber-600 hover:bg-stone-900'
                            : 'border-dashed border-stone-800 bg-stone-950/40 hover:border-stone-600 hover:bg-stone-900/40'
                        }`}
                      >
                        {hero ? (
                          <div className="relative w-full h-full p-2 flex flex-col items-center justify-between">
                            {/* Role & Element Header */}
                            <div className="w-full flex items-center justify-between z-10">
                              <div className="flex items-center gap-1">
                                {getRoleIcon(hero.role, 'w-3.5 h-3.5')}
                                <span className="text-[10px] font-pixel text-stone-300 uppercase">
                                  {hero.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getElementIcon(hero.element, 'w-3 h-3')}
                                <span className="text-[10px] font-pixel text-amber-400">
                                  Lv.{playerState.ownedHeroes[hero.id]?.level || 1}
                                </span>
                              </div>
                            </div>

                            {/* Pixel Art Sprite in Tactical Slot */}
                            <div className="my-auto">
                              <PixelSprite definition={hero} size={48} facing="right" />
                            </div>

                            {/* Hero Name Plate */}
                            <div className="w-full text-center z-10">
                              <span className="text-[11px] font-medieval font-bold text-stone-200 truncate block">
                                {hero.name}
                              </span>
                            </div>

                            {/* Remove Hero to Bench Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveHero(hero.id);
                              }}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-stone-800 hover:bg-rose-900 text-stone-400 hover:text-stone-100 flex items-center justify-center text-[10px] z-20 cursor-pointer"
                              title="Dismiss hero to bench"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-stone-600 px-1 text-center">
                            <span className="text-[10px] font-pixel uppercase tracking-wider text-stone-500">
                              {rowName}
                            </span>
                            <span className="text-[10px] font-flavor text-stone-500 mt-0.5 line-clamp-1">
                              {colRoleHint}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Tactical Placement Instruction */}
            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 font-flavor">
              <span>Click any slot to reposition heroes. Tap an adventurer on the right to assign.</span>
              {selectedRosterHeroId && (
                <span className="text-amber-400 font-pixel font-bold animate-pulse">
                  Assigning hero to slot...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Available Adventurers (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border-2 border-stone-700 shadow-2xl flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="font-medieval text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Available Adventurers ({Object.keys(playerState.ownedHeroes).length})
                </h3>
                <span className="text-xs font-pixel text-stone-400">
                  Select to place
                </span>
              </div>

              {/* Roster Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 max-h-72 overflow-y-auto pr-1">
                {(Object.values(playerState.ownedHeroes) as PlayerHero[]).map((owned) => {
                  const hero = HERO_ROSTER[owned.heroId];
                  if (!hero) return null;

                  const isPlaced = placedHeroIds.includes(hero.id);
                  const isSelected = selectedRosterHeroId === hero.id;

                  return (
                    <div
                      key={hero.id}
                      onClick={() => {
                        sound.playClick();
                        if (isSelected) setSelectedRosterHeroId(null);
                        else setSelectedRosterHeroId(hero.id);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/50 ring-1 ring-amber-400'
                          : isPlaced
                          ? 'border-stone-800 bg-stone-950/70 opacity-85'
                          : 'border-stone-700 bg-stone-950 hover:border-amber-600 hover:bg-stone-900'
                      }`}
                    >
                      {/* Pixel preview */}
                      <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                        <PixelSprite definition={hero} size={36} facing="right" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medieval text-xs font-bold text-stone-200 truncate">
                            {hero.name}
                          </h4>
                          <span className="text-[10px] font-pixel text-amber-400">
                            Lv.{owned.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-pixel mt-0.5">
                          <span>{hero.role}</span>
                          <span>•</span>
                          <span>{hero.element}</span>
                        </div>
                        {isPlaced && (
                          <span className="text-[9px] font-pixel uppercase font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> In Squad
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Combat Action CTA */}
            <div className="mt-6 pt-4 border-t border-stone-800">
              {targetChapter && (
                <div className="mb-3 p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-stone-300 font-medieval">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target: <strong>Chapter {targetChapter.chapterNumber} - {targetChapter.name}</strong></span>
                  </div>
                  <span className="text-amber-400 font-pixel font-bold">
                    Rec. {targetChapter.recommendedPower.toLocaleString()}
                  </span>
                </div>
              )}

              {squadCount > 0 ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    const newSquad = formation.map((s) => s.heroId).filter((id): id is string => id !== null);
                    onUpdateFormation(formation, newSquad);
                    onStartBattle();
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-stone-950 font-medieval font-bold text-sm uppercase tracking-wider shadow-2xl shadow-red-950/70 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Swords className="w-5 h-5 text-stone-950" />
                  <span>
                    {targetChapter
                      ? `Deploy into Chapter ${targetChapter.chapterNumber} (5v5)`
                      : 'Deploy Squad into Battle (5v5)'}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-500 font-medieval font-bold text-sm uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Assign at least 1 hero to battle</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
