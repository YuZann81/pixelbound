export type HeroRole = 'TANK' | 'FIGHTER' | 'ASSASSIN' | 'MAGE' | 'RANGER' | 'SUPPORT';

export type HeroElement = 'FIRE' | 'WATER' | 'EARTH' | 'WIND' | 'LIGHT' | 'DARK';

export type HeroRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDS' | 'MYTHOS';

export interface HeroStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number; // Speed stat for initiative order (higher acts first)
  critRate: number; // 0 to 1
  critDmg: number; // e.g. 1.5
  range: number; // 1 = melee (lunge), 2 = mid-reach, 3 = ranged (projectile)
}

export interface HeroSkill {
  name: string;
  description: string;
  energyCost: number; // 100 for Ultimate
  type: 'damage' | 'heal' | 'buff' | 'aoe_damage' | 'shield' | 'fate';
  multiplier: number; // percentage of ATK
  element: HeroElement;
  cooldown?: number;
}

export interface HeroPassive {
  name: string;
  description: string;
  trigger: 'start_of_battle' | 'on_hit' | 'low_hp' | 'constant' | 'on_kill';
  statBonus?: Partial<HeroStats>;
}

export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  role: HeroRole;
  element: HeroElement;
  rarity: HeroRarity;
  baseStats: HeroStats;
  basicAttack: {
    name: string;
    damageMult: number;
    range: number;
  };
  ultimate: HeroSkill;
  passive: HeroPassive;
  lore: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  visualTraits: {
    hairColor: string;
    armorColor: string;
    weaponType: 'sword' | 'shield' | 'daggers' | 'staff' | 'orb' | 'tome' | 'spear' | 'scythe' | 'bow';
    weaponColor: string;
    elementColor: string;
    headpiece?: 'helmet' | 'hood' | 'circlet' | 'crown' | 'horns' | 'halo';
    capeColor?: string;
  };
}

export interface PlayerHero {
  heroId: string;
  level: number; // 1 -> 100
  stars: number; // 1 -> 5
  duplicates: number;
  shards: number;
  obtainedAt: number;
}

// 3x3 Formation: rows 0, 1, 2; cols 0, 1, 2
// For Player: Col 0 = Back (C1), Col 1 = Mid (C2), Col 2 = Front (C3)
// For Enemy (mirrored): Col 0 = Front (C3), Col 1 = Mid (C2), Col 2 = Back (C1)
export interface FormationSlot {
  row: number; // 0 = Top, 1 = Center, 2 = Bottom
  col: number; // 0 = Back (C1), 1 = Mid (C2), 2 = Front (C3)
  heroId: string | null;
}

export type FormationGrid = FormationSlot[];

export interface StatusEffect {
  type: 'burn' | 'stun' | 'shield' | 'heal' | 'atk_buff' | 'def_debuff';
  value: number;
  duration: number; // in turns
}

export interface BattleUnit {
  uid: string; // unique instance ID
  heroId: string;
  name: string;
  isPlayer: boolean;
  role: HeroRole;
  element: HeroElement;
  rarity: HeroRarity;
  level: number;
  stars: number;
  stats: HeroStats;
  currentHp: number;
  maxHp: number;
  energy: number; // 0 -> 100
  maxEnergy: number;
  x: number; // 0 - 800 battlefield coordinate
  y: number; // 0 - 450 battlefield coordinate
  originX: number;
  originY: number;
  anchorX: number; // Permanent formation anchor X
  anchorY: number; // Permanent formation anchor Y
  slotRow: number;
  slotCol: number;
  targetUid: string | null;
  state: 'idle' | 'walking' | 'attacking' | 'casting' | 'hurt' | 'dead';
  actionProgress: number;
  animTimer: number;
  lastActionTime: number;
  isUltimateReady: boolean;
  definition: HeroDefinition;
  attackPhase: 'none' | 'anticipation' | 'lunge' | 'impact' | 'return';
  attackTimer: number;
  lungeTargetX: number;
  lungeTargetY: number;
  hurtTimer: number;
  statusEffects: StatusEffect[];
}

export interface Projectile {
  id: string;
  sourceUid: string;
  targetUid: string;
  isPlayer: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  element: HeroElement;
  color: string;
  isUltimate?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'damage' | 'crit' | 'heal' | 'ultimate' | 'miss' | 'shield';
  color: string;
  createdAt: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  text: string;
  sourceUid?: string;
  targetUid?: string;
  type: 'attack' | 'ultimate' | 'death' | 'heal' | 'status';
}

export interface CampaignChapter {
  id: number;
  worldId: number;
  chapterNumber: number;
  name: string;
  location: string;
  description: string;
  enemyComposition: { heroId: string; level: number; row: number; col: number }[];
  rewards: {
    gold: number;
    astralGems: number;
    shards: number;
    astralEssence?: number;
    heroDropId?: string;
  };
  recommendedPower: number;
  isBoss: boolean;
}

export interface CampaignWorld {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  isUnlocked: boolean;
  chaptersCount: number;
}

export type VictoryStateLabel = 'PERFECT' | 'DOMINANT' | 'CLOSE' | 'CLUTCH' | 'OUTPLAY';

export interface BattleVictoryAnalysis {
  labels: VictoryStateLabel[];
  stars: number;
  survivorsCount: number;
  playerHpPercent: number;
  powerDifference: number; // playerPower - enemyPower
}

export interface PlayerState {
  username: string;
  avatarId: string;
  homeShowcaseHeroId?: string; // Only LEGENDS and MYTHOS
  level: number;
  exp: number;
  gold: number;
  astralGems: number;
  heroShards: number;
  astralEssence: number;
  highestChapterUnlocked: number;
  chapterStars: Record<number, number>; // chapterId -> stars (1-3)
  ownedHeroes: Record<string, PlayerHero>;
  squad: string[]; // List of up to 5 hero IDs
  formation: FormationGrid;
  gachaPity: {
    novice: number;
    astral: number;
    legend: number;
    mythos: number;
    eternal: number;
  };
  soundEnabled: boolean;
  totalBattlesWon: number;
  totalSummonsDone: number;
}

export type AppScreen = 'hub' | 'campaign' | 'squad' | 'battle' | 'heroes' | 'gacha' | 'arena' | 'profile';
