import React, { useState, useEffect } from 'react';
import { PlayerState, AppScreen, CampaignChapter, FormationGrid, PlayerHero } from './types';
import { loadPlayerState, savePlayerState, resetPlayerState } from './game/storage';
import { CAMPAIGN_CHAPTERS } from './data/campaign';
import { HERO_ROSTER } from './data/heroes';
import { sound } from './game/audio';

// Components
import { TopBar } from './components/common/TopBar';
import { BottomNav } from './components/common/BottomNav';
import { MainHub } from './components/hub/MainHub';
import { CampaignView } from './components/campaign/CampaignView';
import { FormationView } from './components/formation/FormationView';
import { BattleView } from './components/battle/BattleView';
import { BattleResultModal } from './components/battle/BattleResultModal';
import { HeroCollectionView } from './components/heroes/HeroCollectionView';
import { HeroDetailModal } from './components/heroes/HeroDetailModal';
import { GachaView, GachaBannerType } from './components/gacha/GachaView';
import { ArenaView } from './components/arena/ArenaView';
import { ProfileModal } from './components/profile/ProfileModal';
import { GuideModal } from './components/profile/GuideModal';
import { DevToolsModal } from './components/dev/DevToolsModal';
import { OrientationGate } from './components/common/OrientationGate';

export default function App() {
  const [playerState, setPlayerState] = useState<PlayerState>(() => loadPlayerState());
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('hub');
  const [selectedChapter, setSelectedChapter] = useState<CampaignChapter>(CAMPAIGN_CHAPTERS[0]);

  // Battle state
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null);
  const [battleStars, setBattleStars] = useState<number>(0);
  const [battleDescriptor, setBattleDescriptor] = useState<string | undefined>(undefined);

  // Modals state
  const [inspectHeroId, setInspectHeroId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);

  // Synchronize audio state with sound engine
  useEffect(() => {
    sound.setEnabled(playerState.soundEnabled);
  }, [playerState.soundEnabled]);

  // Secret Developer Cheat Shortcut Listener: SHIFT + CTRL + ALT + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isD = e.key === 'D' || e.key === 'd' || e.code === 'KeyD';
      if (isD && e.shiftKey && e.altKey) {
        e.preventDefault();
        setShowDevTools((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to update player state and persist
  const updatePlayer = (updater: (prev: PlayerState) => PlayerState) => {
    setPlayerState((prev) => {
      const next = updater(prev);
      savePlayerState(next);
      return next;
    });
  };

  // Sound toggle
  const handleToggleSound = () => {
    const nextVal = !playerState.soundEnabled;
    sound.setEnabled(nextVal);
    if (nextVal) sound.playClick();
    updatePlayer((prev) => ({ ...prev, soundEnabled: nextVal }));
  };

  // Formation update
  const handleUpdateFormation = (newFormation: FormationGrid, newSquad: string[]) => {
    updatePlayer((prev) => ({
      ...prev,
      formation: newFormation,
      squad: newSquad,
    }));
  };

  // Start battle from Campaign or Formation
  const handleStartBattle = (chapter?: CampaignChapter) => {
    const target = chapter || selectedChapter;
    setSelectedChapter(target);
    setBattleResult(null);
    setCurrentScreen('battle');
  };

  // Battle finished callback
  const handleBattleFinished = (result: 'victory' | 'defeat', stars: number, descriptor?: string) => {
    setBattleResult(result);
    setBattleStars(stars);
    setBattleDescriptor(descriptor);

    if (result === 'victory') {
      sound.playVictory();
      updatePlayer((prev) => {
        const nextChapterId = Math.min(10, selectedChapter.id + 1);
        const highest = Math.max(prev.highestChapterUnlocked, nextChapterId);
        const prevStars = prev.chapterStars[selectedChapter.id] || 0;
        const bestStars = Math.max(prevStars, stars);

        return {
          ...prev,
          gold: prev.gold + selectedChapter.rewards.gold,
          astralGems: prev.astralGems + selectedChapter.rewards.astralGems,
          heroShards: prev.heroShards + selectedChapter.rewards.shards,
          astralEssence: (prev.astralEssence || 0) + (selectedChapter.rewards.astralEssence || 0),
          highestChapterUnlocked: highest,
          chapterStars: {
            ...prev.chapterStars,
            [selectedChapter.id]: bestStars,
          },
        };
      });
    } else {
      sound.playDefeat();
    }
  };

  // Upgrade Hero Level
  const handleUpgradeHero = (heroId: string, goldCost: number) => {
    updatePlayer((prev) => {
      const currentHero = prev.ownedHeroes[heroId];
      if (!currentHero || prev.gold < goldCost) return prev;

      sound.playLevelUp();
      return {
        ...prev,
        gold: prev.gold - goldCost,
        ownedHeroes: {
          ...prev.ownedHeroes,
          [heroId]: {
            ...currentHero,
            level: currentHero.level + 1,
          },
        },
      };
    });
  };

  // Upgrade Hero Stars (1★ -> 5★) / Mythos Ascension
  const handleUpgradeHeroStars = (heroId: string) => {
    updatePlayer((prev) => {
      const currentHero = prev.ownedHeroes[heroId];
      const heroDef = HERO_ROSTER[heroId];
      if (!currentHero || !heroDef || (currentHero.stars || 1) >= 5) return prev;

      const currentStars = currentHero.stars || 1;
      const isMythos = heroDef.rarity === 'MYTHOS';

      let reqDuplicates = 2;
      let reqEssence = 0;

      if (isMythos) {
        reqDuplicates = currentStars;
        reqEssence = currentStars;
      } else {
        const starIdx = currentStars - 1;
        if (heroDef.rarity === 'LEGENDS') reqDuplicates = [5, 10, 20, 40][starIdx] || 5;
        else if (heroDef.rarity === 'EPIC') reqDuplicates = [4, 8, 16, 32][starIdx] || 4;
        else if (heroDef.rarity === 'RARE') reqDuplicates = [3, 6, 12, 24][starIdx] || 3;
        else reqDuplicates = [2, 4, 8, 16][starIdx] || 2;
      }

      const dupCount = currentHero.duplicates || 0;
      let newShards = prev.heroShards;
      let newEssence = prev.astralEssence || 0;
      let newDuplicates = dupCount;

      if (isMythos) {
        if (dupCount < reqDuplicates || newEssence < reqEssence) return prev;
        newDuplicates -= reqDuplicates;
        newEssence -= reqEssence;
      } else {
        if (dupCount >= reqDuplicates) {
          newDuplicates -= reqDuplicates;
        } else {
          const neededShards = (reqDuplicates - dupCount) * 20;
          if (newShards < neededShards) return prev;
          newDuplicates = 0;
          newShards -= neededShards;
        }
      }

      sound.playLevelUp();
      return {
        ...prev,
        heroShards: newShards,
        astralEssence: newEssence,
        ownedHeroes: {
          ...prev.ownedHeroes,
          [heroId]: {
            ...currentHero,
            stars: currentStars + 1,
            duplicates: newDuplicates,
          },
        },
      };
    });
  };

  // Set Home Showcase Hero
  const handleSetHomeShowcase = (heroId: string) => {
    updatePlayer((prev) => ({
      ...prev,
      homeShowcaseHeroId: heroId,
    }));
  };

  // Summon Completed
  const handleSummonCompleted = (
    updatedOwned: Record<string, PlayerHero>,
    gemCost: number,
    shardsGained: number,
    essenceGained: number,
    banner: GachaBannerType,
    newPityCount: number
  ) => {
    updatePlayer((prev) => ({
      ...prev,
      astralGems: Math.max(0, prev.astralGems - gemCost),
      heroShards: prev.heroShards + shardsGained,
      astralEssence: (prev.astralEssence || 0) + essenceGained,
      totalSummonsDone: (prev.totalSummonsDone || 0) + (gemCost >= 900 ? 10 : 1),
      gachaPity: {
        ...prev.gachaPity,
        [banner]: newPityCount,
      },
      ownedHeroes: updatedOwned,
    }));
  };

  // Reset Progress
  const handleResetProgress = () => {
    const fresh = resetPlayerState();
    setPlayerState(fresh);
    setCurrentScreen('hub');
  };

  const inspectedHeroDef = inspectHeroId ? HERO_ROSTER[inspectHeroId] : null;

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-stone-950 text-stone-100 font-sans antialiased select-none">
      {/* Landscape Orientation Gate */}
      <OrientationGate />

      {/* Top Bar (Hidden during combat for cinematic immersion) */}
      {currentScreen !== 'battle' && (
        <TopBar
          playerState={playerState}
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenProfile={() => setShowProfileModal(true)}
          onToggleSound={handleToggleSound}
          onOpenGuide={() => setShowGuideModal(true)}
        />
      )}

      {/* Main View Area */}
      <main className="relative flex-1 w-full flex flex-col overflow-hidden">
        {currentScreen === 'hub' && (
          <MainHub
            playerState={playerState}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onSelectHeroDetail={(heroId) => setInspectHeroId(heroId)}
            onStartCampaignBattle={(chapterId) => {
              const ch = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId) || CAMPAIGN_CHAPTERS[0];
              setSelectedChapter(ch);
              setCurrentScreen('squad');
            }}
          />
        )}

        {currentScreen === 'campaign' && (
          <CampaignView
            playerState={playerState}
            onSelectChapterToBattle={(chapter) => {
              setSelectedChapter(chapter);
              setCurrentScreen('squad');
            }}
          />
        )}

        {currentScreen === 'squad' && (
          <FormationView
            playerState={playerState}
            targetChapter={selectedChapter}
            onUpdateFormation={handleUpdateFormation}
            onStartBattle={() => handleStartBattle(selectedChapter)}
          />
        )}

        {currentScreen === 'battle' && (
          <BattleView
            playerState={playerState}
            chapter={selectedChapter}
            onBattleFinished={handleBattleFinished}
            onRetreat={() => {
              setCurrentScreen('campaign');
            }}
          />
        )}

        {currentScreen === 'heroes' && (
          <HeroCollectionView
            playerState={playerState}
            onSelectHeroDetail={(heroId) => setInspectHeroId(heroId)}
          />
        )}

        {currentScreen === 'gacha' && (
          <GachaView
            playerState={playerState}
            onSummonCompleted={handleSummonCompleted}
          />
        )}

        {currentScreen === 'arena' && <ArenaView />}
      </main>

      {/* Global RPG Navigation Bar */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
      />

      {/* Modals & Overlays */}
      {/* 1. Victory / Defeat Modal */}
      {battleResult && (
        <BattleResultModal
          result={battleResult}
          stars={battleStars}
          descriptor={battleDescriptor}
          chapter={selectedChapter}
          onContinue={() => {
            setBattleResult(null);
            const nextCh = CAMPAIGN_CHAPTERS.find((c) => c.id === selectedChapter.id + 1);
            if (nextCh && nextCh.id <= playerState.highestChapterUnlocked) {
              setSelectedChapter(nextCh);
            }
            setCurrentScreen('campaign');
          }}
          onRetry={() => {
            setBattleResult(null);
            handleStartBattle(selectedChapter);
          }}
          onChangeSquad={() => {
            setBattleResult(null);
            setCurrentScreen('squad');
          }}
          onBackToMap={() => {
            setBattleResult(null);
            setCurrentScreen('campaign');
          }}
        />
      )}

      {/* 2. HD Hero Detail Showcase Modal */}
      {inspectedHeroDef && (
        <HeroDetailModal
          hero={inspectedHeroDef}
          playerHero={playerState.ownedHeroes[inspectedHeroDef.id]}
          playerGold={playerState.gold}
          playerShards={playerState.heroShards}
          playerAstralEssence={playerState.astralEssence || 0}
          isHomeShowcase={playerState.homeShowcaseHeroId === inspectedHeroDef.id}
          onClose={() => setInspectHeroId(null)}
          onUpgradeLevel={handleUpgradeHero}
          onUpgradeStars={handleUpgradeHeroStars}
          onSetHomeShowcase={handleSetHomeShowcase}
        />
      )}

      {/* 3. Player Profile & Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          playerState={playerState}
          onClose={() => setShowProfileModal(false)}
          onUpdateAvatar={(avatarId) => {
            updatePlayer((prev) => ({ ...prev, avatarId }));
          }}
          onToggleSound={handleToggleSound}
          onResetProgress={handleResetProgress}
          onOpenDevTools={() => {
            setShowProfileModal(false);
            setShowDevTools(true);
          }}
        />
      )}

      {/* 4. Game Rules / Codex Modal */}
      {showGuideModal && <GuideModal onClose={() => setShowGuideModal(false)} />}

      {/* 5. Secret Developer Panel (Shift + Alt + D or via About Pixel Bound) */}
      {showDevTools && (
        <DevToolsModal
          isOpen={showDevTools}
          onClose={() => setShowDevTools(false)}
          playerState={playerState}
          onUpdateState={updatePlayer}
          onResetSave={handleResetProgress}
          onDebugBattle={(chapter) => {
            handleStartBattle(chapter);
          }}
        />
      )}
    </div>
  );
}
