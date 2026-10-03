/**
 * Main Application Component: 墨痕武道 (Ink Martial Stickman)
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { HUD } from './components/HUD';
import { RoguelikeModal } from './components/RoguelikeModal';
import { ManualModal } from './components/ManualModal';
import { AffixDrawerModal } from './components/AffixDrawerModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseOverlay } from './components/PauseOverlay';
import { TitleMenu } from './components/TitleMenu';
import { Affix, BossHudInfo, ControlMode, GestureResult, RunStats } from './types/game';
import { drawRandomAffixes } from './game/affixes';
import { sound } from './utils/audio';
import { PersistentRecords, loadRecords, saveRunStats } from './utils/storage';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI state
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'ROGUELIKE' | 'GAME_OVER'>('TITLE');
  const [controlMode, setControlMode] = useState<ControlMode>('FULL_GESTURE');
  const [hp, setHp] = useState<number>(120);
  const [maxHp, setMaxHp] = useState<number>(120);
  const [ink, setInk] = useState<number>(100);
  const [maxInk, setMaxInk] = useState<number>(100);
  const [shield, setShield] = useState<number>(0);
  const [shieldMax, setShieldMax] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [waveTitle, setWaveTitle] = useState<string>('第一折 · 墨卒现世');
  const [enemiesLeft, setEnemiesLeft] = useState<number>(6);
  const [combo, setCombo] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [recentGesture, setRecentGesture] = useState<GestureResult | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 波次大字横幅
  const [banner, setBanner] = useState<{ title: string; isBossWave: boolean; key: number } | null>(null);
  // Boss 顶部血条
  const [bossInfo, setBossInfo] = useState<BossHudInfo | null>(null);

  // Modals
  const [showManual, setShowManual] = useState<boolean>(false);
  const [showAffixDrawer, setShowAffixDrawer] = useState<boolean>(false);
  const [roguelikeChoices, setRoguelikeChoices] = useState<Affix[]>([]);
  const [rerollsLeft, setRerollsLeft] = useState<number>(1);
  const [activeAffixes, setActiveAffixes] = useState<Affix[]>([]);
  const [finalStats, setFinalStats] = useState<RunStats | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [records, setRecords] = useState<PersistentRecords>(() => loadRecords());
  const [newRecord, setNewRecord] = useState<boolean>(false);

  // Initialize Canvas and Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (engineRef.current) {
        engineRef.current.setSize(width, height);
      }
    };

    const engine = new GameEngine(canvas, {
      onHpChange: (newHp, newMaxHp) => {
        setHp(newHp);
        setMaxHp(newMaxHp);
      },
      onInkChange: (newInk, newMaxInk) => {
        setInk(newInk);
        setMaxInk(newMaxInk);
      },
      onShieldChange: (newShield, newShieldMax) => {
        setShield(newShield);
        setShieldMax(newShieldMax);
      },
      onWaveChange: (newWave, title, left) => {
        setWave(newWave);
        setWaveTitle(title);
        setEnemiesLeft(left);
      },
      onWaveBanner: (title, isBossWave) => {
        setBanner({ title, isBossWave, key: Date.now() });
      },
      onBossUpdate: (boss) => {
        setBossInfo(boss);
      },
      onComboChange: (newCombo) => {
        setCombo(newCombo);
      },
      onGestureRecognized: (gesture) => {
        setRecentGesture(gesture);
        // Clear recent gesture popup after 1.8s
        setTimeout(() => {
          setRecentGesture((cur) => (cur?.hanzi === gesture.hanzi ? null : cur));
        }, 1800);
      },
      onWaveCleared: (choices) => {
        setRoguelikeChoices(choices);
        setRerollsLeft(1);
        setGameState('ROGUELIKE');
        engine.isPaused = true;
      },
      onGameOver: (stats, victory) => {
        setFinalStats(stats);
        setIsVictory(victory);
        setWave(stats.wave);
        const prev = loadRecords();
        setNewRecord(stats.score > prev.highScore);
        const updated = saveRunStats(stats, victory);
        setRecords(updated);
        setGameState('GAME_OVER');
      },
      onPauseChange: (paused) => {
        setIsPaused(paused);
      },
      onControlModeChange: (mode) => {
        setControlMode(mode);
      },
    });

    engineRef.current = engine;
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, []);

  // 波次横幅自动消退
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 2400);
    return () => clearTimeout(t);
  }, [banner]);

  const handleStartGame = (difficulty: 'EASY' | 'NORMAL' | 'HARD') => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    sound.unlock();
    engine.resetGame();
    engine.setDifficulty(difficulty);
    engine.markRunStarted();

    // Adjust based on difficulty
    if (difficulty === 'EASY') {
      engine.player.hp = 180;
      engine.player.maxHp = 180;
      setHp(180);
      setMaxHp(180);
    } else if (difficulty === 'HARD') {
      engine.player.hp = 90;
      engine.player.maxHp = 90;
      setHp(90);
      setMaxHp(90);
    } else {
      setHp(engine.player.hp);
      setMaxHp(engine.player.maxHp);
    }

    setShield(0);
    setShieldMax(0);
    setActiveAffixes([]);
    setBossInfo(null);
    setIsPaused(false);
    setGameState('PLAYING');
    engine.start();
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    engine.resetGame();
    engine.markRunStarted();
    setActiveAffixes([]);
    setBossInfo(null);
    setIsPaused(false);
    setGameState('PLAYING');
    engine.start();
  };

  const handleContinueEndless = () => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    engine.continueEndless();
    setIsPaused(false);
    setGameState('PLAYING');
  };

  const handleBackToTitle = () => {
    if (!engineRef.current) return;
    engineRef.current.isPaused = true;
    engineRef.current.resetGame();
    setIsPaused(false);
    setBossInfo(null);
    setGameState('TITLE');
  };

  const handleSelectAffix = (affix: Affix) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const player = engine.player;
    player.affixes.push(affix);
    sound.playAffixPick();

    // Apply immediate stat upgrades if any
    if (affix.stats.maxHpBonus) {
      player.maxHp += affix.stats.maxHpBonus;
      player.hp = Math.min(player.maxHp, player.hp + affix.stats.maxHpBonus);
      setHp(player.hp);
      setMaxHp(player.maxHp);
    }

    setActiveAffixes([...player.affixes]);
    engine.isPaused = false;
    setGameState('PLAYING');

    // Advance to next wave
    engine.startWave(wave + 1);
  };

  const handleRerollAffixes = () => {
    if (!engineRef.current || rerollsLeft <= 0) return;
    const newChoices = drawRandomAffixes(engineRef.current.player.affixes, 3, wave);
    setRoguelikeChoices(newChoices);
    setRerollsLeft((n) => n - 1);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    sound.setVolume(v);
    if (v > 0 && isMuted) {
      sound.setMuted(false);
      setIsMuted(false);
    }
  };

  const handleToggleControlMode = () => {
    if (!engineRef.current) return;
    const nextMode = controlMode === 'FULL_GESTURE' ? 'SPLIT_SCREEN' : 'FULL_GESTURE';
    engineRef.current.setControlMode(nextMode);
    setControlMode(nextMode);
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
  };

  const handleTriggerMove = (type: 'TAP' | 'HORIZONTAL' | 'VERTICAL_DOWN' | 'DIAGONAL_UP' | 'CIRCLE' | 'ZIGZAG') => {
    if (engineRef.current && gameState === 'PLAYING' && !isPaused) {
      engineRef.current.triggerGestureDirect(type);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#e9e1cf] select-none touch-none">
      {/* Primary Pseudo-3D HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Title Menu */}
      {gameState === 'TITLE' && (
        <TitleMenu
          onStart={handleStartGame}
          onOpenManual={() => setShowManual(true)}
          records={records}
        />
      )}

      {/* Main HUD */}
      {gameState === 'PLAYING' && (
        <HUD
          hp={hp}
          maxHp={maxHp}
          ink={ink}
          maxInk={maxInk}
          shield={shield}
          shieldMax={shieldMax}
          wave={wave}
          waveTitle={waveTitle}
          enemiesLeft={enemiesLeft}
          combo={combo}
          score={engineRef.current?.score ?? 0}
          isMuted={isMuted}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setShowManual(true)}
          onOpenAffixes={() => setShowAffixDrawer(true)}
          activeAffixes={activeAffixes}
          recentGesture={recentGesture}
          onTriggerMove={handleTriggerMove}
          onTriggerJump={() => engineRef.current?.triggerJump()}
          controlMode={controlMode}
          onToggleControlMode={handleToggleControlMode}
          onTogglePause={handleTogglePause}
          isPaused={isPaused}
          bossInfo={bossInfo}
          banner={banner}
        />
      )}

      {/* 波次开场大字横幅 */}
      {gameState === 'PLAYING' && banner && (
        <div
          key={banner.key}
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center animate-in fade-in zoom-in-95 duration-500" style={{ animationDirection: 'normal' }}>
            <div
              className={`font-calligraphy tracking-[0.2em] drop-shadow-[0_4px_18px_rgba(88,68,40,0.35)] ${
                banner.isBossWave ? 'text-5xl sm:text-6xl text-[#dc2626]' : 'text-4xl sm:text-5xl text-[#2b2118]'
              }`}
            >
              {banner.title}
            </div>
            <div className={`mt-3 h-px w-40 mx-auto ${banner.isBossWave ? 'bg-[#dc2626]/60' : 'bg-[#2b2118]/40'}`} />
            <div className={`mt-2 text-xs font-ink-serif tracking-[0.5em] ${banner.isBossWave ? 'text-[#b91c1c]' : 'text-[#85745a]'}`}>
              {banner.isBossWave ? '宗 师 临 世 · 险 中 求 胜' : '挥 毫 落 剑 · 墨 起 风 云'}
            </div>
          </div>
        </div>
      )}

      {/* Roguelike 3-Choice Upgrade Modal */}
      {gameState === 'ROGUELIKE' && (
        <RoguelikeModal
          affixes={roguelikeChoices}
          onSelect={handleSelectAffix}
          onReroll={handleRerollAffixes}
          rerollsLeft={rerollsLeft}
          wave={wave}
        />
      )}

      {/* Game Over / Victory Modal */}
      {gameState === 'GAME_OVER' && finalStats && (
        <GameOverModal
          stats={finalStats}
          isVictory={isVictory}
          isNewRecord={newRecord}
          onRestart={handleRestart}
          onContinueEndless={isVictory ? handleContinueEndless : undefined}
        />
      )}

      {/* Pause Overlay */}
      {gameState === 'PLAYING' && isPaused && (
        <PauseOverlay
          onResume={handleTogglePause}
          onRestart={handleRestart}
          onBackToTitle={handleBackToTitle}
          waveTitle={waveTitle}
          score={engineRef.current?.score ?? 0}
        />
      )}

      {/* Martial Arts Manual Modal */}
      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} />
      )}

      {/* Active Affixes Inventory Modal */}
      {showAffixDrawer && (
        <AffixDrawerModal
          affixes={activeAffixes}
          onClose={() => setShowAffixDrawer(false)}
        />
      )}
    </div>
  );
}
