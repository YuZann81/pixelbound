import { FormationGrid, HeroRole, HeroDefinition } from '../types';
import { HERO_ROSTER, ENEMY_ROSTER_TEMPLATES } from '../data/heroes';

export type FormationArchetype =
  | 'Balanced'
  | 'Defensive'
  | 'Mage Heavy'
  | 'Assassin'
  | 'Aggressive'
  | 'Support Heavy';

// Default empty 3x3 grid
export function createEmptyFormation(): FormationGrid {
  const slots: FormationGrid = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      slots.push({ row: r, col: c, heroId: null });
    }
  }
  return slots;
}

// Generate starting default player formation with initial 5 heroes
export function createDefaultPlayerFormation(heroIds: string[]): FormationGrid {
  const grid = createEmptyFormation();

  // Sensible placement:
  // Tanks/Fighters in Col 2 (Front)
  // Supports/Mages in Col 0 (Back)
  // Assassins in Col 1 (Mid) or Col 2 (Front)
  const assigned = new Set<string>();

  heroIds.slice(0, 5).forEach((id) => {
    const hero = HERO_ROSTER[id];
    if (!hero) return;

    let targetCol = 1;
    let targetRow = 1;

    if (hero.role === 'TANK') {
      targetCol = 2; // Frontline
      targetRow = getFirstAvailableRow(grid, targetCol);
    } else if (hero.role === 'FIGHTER') {
      targetCol = isColFull(grid, 2) ? 1 : 2;
      targetRow = getFirstAvailableRow(grid, targetCol);
    } else if (hero.role === 'MAGE' || hero.role === 'SUPPORT') {
      targetCol = 0; // Backline
      targetRow = getFirstAvailableRow(grid, targetCol);
    } else if (hero.role === 'RANGER') {
      targetCol = 0; // Backline
      targetRow = getFirstAvailableRow(grid, targetCol);
    } else if (hero.role === 'ASSASSIN') {
      targetCol = 1; // Midline flank
      targetRow = getFirstAvailableRow(grid, targetCol);
    }

    // Fallback if target column is full
    if (targetRow === -1) {
      for (let c = 2; c >= 0; c--) {
        const r = getFirstAvailableRow(grid, c);
        if (r !== -1) {
          targetCol = c;
          targetRow = r;
          break;
        }
      }
    }

    if (targetRow !== -1) {
      const slot = grid.find((s) => s.row === targetRow && s.col === targetCol);
      if (slot) {
        slot.heroId = id;
        assigned.add(id);
      }
    }
  });

  return grid;
}

function getFirstAvailableRow(grid: FormationGrid, col: number): number {
  for (let r = 0; r < 3; r++) {
    const slot = grid.find((s) => s.row === r && s.col === col);
    if (slot && !slot.heroId) return r;
  }
  return -1;
}

function isColFull(grid: FormationGrid, col: number): boolean {
  return grid.filter((s) => s.col === col && s.heroId !== null).length >= 3;
}

// Enemy Formation Engine
// Places 5 enemy heroes according to Role and Archetype:
// Enemy Col 0 = Frontline (closest to player)
// Enemy Col 1 = Midline
// Enemy Col 2 = Backline
export function generateEnemyFormation(
  heroList: { heroId: string; level: number }[],
  archetype: FormationArchetype = 'Balanced'
): { heroId: string; level: number; row: number; col: number }[] {
  const result: { heroId: string; level: number; row: number; col: number }[] = [];
  const occupied = new Set<string>();

  const isFree = (r: number, c: number) => !occupied.has(`${r},${c}`);
  const mark = (r: number, c: number) => occupied.add(`${r},${c}`);

  // Sort units by role priority for placement
  const sortedUnits = [...heroList].sort((a, b) => {
    const heroA = HERO_ROSTER[a.heroId] || ENEMY_ROSTER_TEMPLATES[a.heroId];
    const heroB = HERO_ROSTER[b.heroId] || ENEMY_ROSTER_TEMPLATES[b.heroId];
    const rolePriority: Record<HeroRole, number> = {
      TANK: 1,
      FIGHTER: 2,
      ASSASSIN: 3,
      SUPPORT: 4,
      MAGE: 5,
      RANGER: 5,
    };
    return (rolePriority[heroA?.role || 'FIGHTER'] || 3) - (rolePriority[heroB?.role || 'FIGHTER'] || 3);
  });

  sortedUnits.forEach((unit) => {
    const hero = HERO_ROSTER[unit.heroId] || ENEMY_ROSTER_TEMPLATES[unit.heroId];
    const role = hero?.role || 'FIGHTER';

    let placed = false;

    // Preferred column for Enemy: 0 = Front, 1 = Mid, 2 = Back
    let preferredCols: number[] = [0, 1, 2];
    let preferredRows: number[] = [1, 0, 2]; // Center first, then flanks

    if (role === 'TANK') {
      preferredCols = [0, 1, 2];
      preferredRows = [1, 0, 2];
    } else if (role === 'FIGHTER') {
      preferredCols = archetype === 'Aggressive' ? [0, 1, 2] : [1, 0, 2];
      preferredRows = [0, 2, 1];
    } else if (role === 'ASSASSIN') {
      preferredCols = [1, 0, 2];
      preferredRows = [0, 2, 1]; // Flanks
    } else if (role === 'MAGE' || role === 'RANGER') {
      preferredCols = [2, 1, 0];
      preferredRows = [1, 0, 2];
    } else if (role === 'SUPPORT') {
      preferredCols = [2, 1, 0];
      preferredRows = [1, 2, 0];
    }

    for (const c of preferredCols) {
      if (placed) break;
      for (const r of preferredRows) {
        if (isFree(r, c)) {
          mark(r, c);
          result.push({ heroId: unit.heroId, level: unit.level, row: r, col: c });
          placed = true;
          break;
        }
      }
    }

    // Fallback if full
    if (!placed) {
      for (let c = 0; c < 3; c++) {
        if (placed) break;
        for (let r = 0; r < 3; r++) {
          if (isFree(r, c)) {
            mark(r, c);
            result.push({ heroId: unit.heroId, level: unit.level, row: r, col: c });
            placed = true;
            break;
          }
        }
      }
    }
  });

  return result;
}

// Convert 3x3 slot coordinates to battlefield X, Y coordinates
// Battlefield virtual dimensions: 800 width × 460 height
// Player on Left side (Cols 0 Back, 1 Mid, 2 Front) -> X from 70 to 270
// Center clash zone -> X from 280 to 520
// Enemy on Right side (Cols 0 Front, 1 Mid, 2 Back) -> X from 530 to 730
export function slotToBattleCoords(row: number, col: number, isPlayer: boolean): { x: number; y: number } {
  // Rows: 0 = Top (Y: 130), 1 = Center (Y: 230), 2 = Bottom (Y: 330)
  const y = 130 + row * 105;

  let x = 0;
  if (isPlayer) {
    // Col 0: Back (80), Col 1: Mid (170), Col 2: Front (260)
    x = 80 + col * 90;
  } else {
    // Enemy side (mirrored perspective):
    // Col 0: Front (540), Col 1: Mid (630), Col 2: Back (720)
    x = 540 + col * 90;
  }

  return { x, y };
}

// Calculate total tactical combat power of squad
export function calculateSquadPower(
  squadHeroIds: string[],
  ownedHeroes: Record<string, { level: number; stars?: number }>
): number {
  let totalPower = 0;
  squadHeroIds.forEach((id) => {
    const hero = HERO_ROSTER[id];
    if (!hero) return;
    const owned = ownedHeroes[id];
    const level = owned?.level || 1;
    const stars = owned?.stars || 1;
    const starMult = 1 + (stars - 1) * 0.15;
    const scale = (1 + (level - 1) * 0.12) * starMult;
    const hp = hero.baseStats.hp * scale;
    const atk = hero.baseStats.atk * scale;
    const def = hero.baseStats.def * scale;
    const power = Math.round(atk * 1.5 + hp * 0.25 + def * 1.2);
    totalPower += power;
  });
  return Math.max(100, totalPower);
}
