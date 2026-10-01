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
import { TitleMenu } from './components/TitleMenu';
import { Affix, ControlMode, GestureResult } from './types/game';
import { drawRandomAffixes } from './game/affixes';
import { sound } from './utils/audio';

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
  const [wave, setWave] = useState<number>(1);
  const [waveTitle, setWaveTitle] = useState<string>('第一折 · 墨卒现世');
  const [enemiesLeft, setEnemiesLeft] = useState<number>(6);
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [recentGesture, setRecentGesture] = useState<GestureResult | null>(null);

  // Modals
  const [showManual, setShowManual] = useState<boolean>(false);
  const [showAffixDrawer, setShowAffixDrawer] = useState<boolean>(false);
  const [roguelikeChoices, setRoguelikeChoices] = useState<Affix[]>([]);
  const [activeAffixes, setActiveAffixes] = useState<Affix[]>([]);
  const [isVictory, setIsVictory] = useState<boolean>(false);

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
      onWaveChange: (newWave, title, left) => {
        setWave(newWave);
        setWaveTitle(title);
        setEnemiesLeft(left);
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
        setGameState('ROGUELIKE');
        engine.isPaused = true;
      },
      onGameOver: (finalScore, finalWave, victory) => {
        setScore(finalScore);
        setWave(finalWave);
        setIsVictory(victory);
        setGameState('GAME_OVER');
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

  const handleStartGame = (difficulty: 'EASY' | 'NORMAL' | 'HARD') => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();

    // Adjust based on difficulty
    if (difficulty === 'EASY') {
      engineRef.current.player.hp = 180;
      engineRef.current.player.maxHp = 180;
      setHp(180);
      setMaxHp(180);
    } else if (difficulty === 'HARD') {
      engineRef.current.player.hp = 90;
      engineRef.current.player.maxHp = 90;
      setHp(90);
      setMaxHp(90);
    }

    setGameState('PLAYING');
    engineRef.current.start();
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setActiveAffixes([]);
    setGameState('PLAYING');
    engineRef.current.start();
  };

  const handleSelectAffix = (affix: Affix) => {
    if (!engineRef.current) return;
    const player = engineRef.current.player;
    player.affixes.push(affix);

    // Apply immediate stat upgrades if any
    if (affix.stats.maxHpBonus) {
      player.maxHp += affix.stats.maxHpBonus;
      player.hp = Math.min(player.maxHp, player.hp + affix.stats.maxHpBonus);
      setHp(player.hp);
      setMaxHp(player.maxHp);
    }

    setActiveAffixes([...player.affixes]);
    engineRef.current.isPaused = false;
    setGameState('PLAYING');

    // Advance to next wave
    engineRef.current.startWave(wave + 1);
  };

  const handleRerollAffixes = () => {
    if (!engineRef.current) return;
    const newChoices = drawRandomAffixes(engineRef.current.player.affixes, 3);
    setRoguelikeChoices(newChoices);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleToggleControlMode = () => {
    if (!engineRef.current) return;
    const nextMode = controlMode === 'FULL_GESTURE' ? 'SPLIT_SCREEN' : 'FULL_GESTURE';
    engineRef.current.setControlMode(nextMode);
    setControlMode(nextMode);
  };

  const handleTriggerMove = (type: 'TAP' | 'HORIZONTAL' | 'VERTICAL_DOWN' | 'DIAGONAL_UP' | 'CIRCLE' | 'ZIGZAG') => {
    if (engineRef.current && gameState === 'PLAYING') {
      engineRef.current.triggerGestureDirect(type);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121110] select-none touch-none">
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
        />
      )}

      {/* Main HUD */}
      {gameState === 'PLAYING' && (
        <HUD
          hp={hp}
          maxHp={maxHp}
          ink={ink}
          maxInk={maxInk}
          wave={wave}
          waveTitle={waveTitle}
          enemiesLeft={enemiesLeft}
          combo={combo}
          score={score}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setShowManual(true)}
          onOpenAffixes={() => setShowAffixDrawer(true)}
          activeAffixes={activeAffixes}
          recentGesture={recentGesture}
          onTriggerMove={handleTriggerMove}
          onTriggerJump={() => engineRef.current?.triggerJump()}
          controlMode={controlMode}
          onToggleControlMode={handleToggleControlMode}
        />
      )}

      {/* Roguelike 3-Choice Upgrade Modal */}
      {gameState === 'ROGUELIKE' && (
        <RoguelikeModal
          affixes={roguelikeChoices}
          onSelect={handleSelectAffix}
          onReroll={handleRerollAffixes}
        />
      )}

      {/* Game Over / Victory Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          wave={wave}
          isVictory={isVictory}
          onRestart={handleRestart}
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
