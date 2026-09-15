import { PlayerState } from '../types';
import { createDefaultPlayerFormation } from './formationEngine';

const STORAGE_KEY = 'pixel_bound_save_v2';

export const INITIAL_PLAYER_STATE: PlayerState = {
  username: 'Astral Warden',
  avatarId: 'valiant_paladin',
  homeShowcaseHeroId: 'valiant_paladin',
  level: 1,
  exp: 0,
  gold: 3500,
  astralGems: 1800, // Enough for summons right away!
  heroShards: 50,
  astralEssence: 1, // 1 Astral Essence to start with
  highestChapterUnlocked: 1,
  chapterStars: {},
  soundEnabled: true,
  totalBattlesWon: 0,
  totalSummonsDone: 0,
  gachaPity: {
    novice: 0,
    astral: 0,
    legend: 0,
    mythos: 0,
    eternal: 0,
  },
  ownedHeroes: {
    valiant_paladin: { heroId: 'valiant_paladin', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
    ashen_knight: { heroId: 'ashen_knight', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
    emberblade: { heroId: 'emberblade', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
    arcane_seer: { heroId: 'arcane_seer', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
    dawn_priestess: { heroId: 'dawn_priestess', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
    verdant_guardian: { heroId: 'verdant_guardian', level: 1, stars: 1, duplicates: 0, shards: 0, obtainedAt: Date.now() },
  },
  squad: ['valiant_paladin', 'ashen_knight', 'emberblade', 'arcane_seer', 'dawn_priestess'],
  formation: createDefaultPlayerFormation([
    'valiant_paladin',
    'ashen_knight',
    'emberblade',
    'arcane_seer',
    'dawn_priestess',
  ]),
};

export function loadPlayerState(): PlayerState {
  if (typeof window === 'undefined') return INITIAL_PLAYER_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PLAYER_STATE;
    const parsed = JSON.parse(raw);
    
    // Normalize owned heroes with default stars and duplicates
    const normalizedOwned: Record<string, any> = {};
    if (parsed.ownedHeroes) {
      Object.entries(parsed.ownedHeroes).forEach(([id, hero]: [string, any]) => {
        normalizedOwned[id] = {
          ...hero,
          stars: hero.stars || 1,
          duplicates: hero.duplicates || 0,
        };
      });
    }

    const finalOwned = { ...INITIAL_PLAYER_STATE.ownedHeroes, ...normalizedOwned };
    const rawFormation = parsed.formation && parsed.formation.length === 9 ? parsed.formation : INITIAL_PLAYER_STATE.formation;
    const sanitizedFormation = rawFormation.map((slot: any) => {
      if (slot.heroId && !finalOwned[slot.heroId]) {
        return { ...slot, heroId: null };
      }
      return slot;
    });

    return {
      ...INITIAL_PLAYER_STATE,
      ...parsed,
      gachaPity: {
        ...INITIAL_PLAYER_STATE.gachaPity,
        ...(parsed.gachaPity || {}),
      },
      ownedHeroes: finalOwned,
      formation: sanitizedFormation,
    };
  } catch {
    return INITIAL_PLAYER_STATE;
  }
}

export function savePlayerState(state: PlayerState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export function resetPlayerState(): PlayerState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return { ...INITIAL_PLAYER_STATE };
}
