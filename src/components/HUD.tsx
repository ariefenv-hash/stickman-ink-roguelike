/**
 * Top HUD and Martial Arts Calligraphy Overlay
 */

import React from 'react';
import { Volume2, VolumeX, BookOpen, Layers, Sparkles, Wand2, Split } from 'lucide-react';
import { Affix, ControlMode, GestureResult } from '../types/game';

interface HUDProps {
  hp: number;
  maxHp: number;
  ink: number;
  maxInk: number;
  wave: number;
  waveTitle: string;
  enemiesLeft: number;
  combo: number;
  score: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenManual: () => void;
  onOpenAffixes: () => void;
  activeAffixes: Affix[];
  recentGesture: GestureResult | null;
  onTriggerMove: (type: 'TAP' | 'HORIZONTAL' | 'VERTICAL_DOWN' | 'DIAGONAL_UP' | 'CIRCLE' | 'ZIGZAG') => void;
  onTriggerJump: () => void;
  controlMode: ControlMode;
  onToggleControlMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  ink,
  maxInk,
  waveTitle,
  enemiesLeft,
  combo,
  score,
  isMuted,
  onToggleMute,
  onOpenManual,
  onOpenAffixes,
  activeAffixes,
  recentGesture,
  onTriggerMove,
  onTriggerJump,
  controlMode,
  onToggleControlMode,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const inkPercent = Math.max(0, Math.min(100, (ink / maxInk) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Bar Navigation & Status */}
      <header className="flex items-center justify-between pointer-events-auto bg-[#1a1816]/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#38332c] shadow-lg">
        {/* Left: Brand title & Health/Ink Bars */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-calligraphy tracking-widest text-[#f5f0e6] flex items-center gap-1.5">
              <span>墨痕武道</span>
              <span className="text-xs font-ink-serif text-[#b91c1c] border border-[#b91c1c]/50 px-1 py-0.2 rounded">
                无双
              </span>
            </h1>
            <div className="text-[11px] font-ink-serif text-[#a8a29e] flex items-center gap-2">
              <span>{waveTitle}</span>
              <span aria-hidden="true">·</span>
              <span>剩余妖墨: {enemiesLeft}</span>
            </div>
          </div>

          {/* Meters */}
          <div className="hidden sm:flex flex-col gap-1 w-36 sm:w-44">
            {/* HP Bar */}
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
              <span className="text-[#ef4444] font-semibold w-6">气血</span>
              <div className="flex-1 h-2 bg-[#26221d] rounded-full overflow-hidden border border-[#3f3830]">
                <div
                  className="h-full bg-gradient-to-r from-[#b91c1c] to-[#ef4444] transition-all duration-200"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              <span className="text-[#d6d3d1] tabular-nums text-[9px]">{hp}/{maxHp}</span>
            </div>

            {/* Ink Energy Bar */}
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
              <span className="text-[#38bdf8] font-semibold w-6">墨意</span>
              <div className="flex-1 h-2 bg-[#26221d] rounded-full overflow-hidden border border-[#3f3830]">
                <div
                  className="h-full bg-gradient-to-r from-[#0369a1] to-[#38bdf8] transition-all duration-200"
                  style={{ width: `${inkPercent}%` }}
                />
              </div>
              <span className="text-[#d6d3d1] tabular-nums text-[9px]">{Math.floor(ink)}/{maxInk}</span>
            </div>
          </div>
        </div>

        {/* Center: Score & Combo Notice */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#b91c1c]/20 border border-[#b91c1c]/40 rounded-lg animate-pulse">
              <span className="text-sm font-bold text-[#f87171] tabular-nums">{combo}</span>
              <span className="text-xs font-calligraphy text-[#fca5a5]">连斩</span>
            </div>
          )}
          <div className="text-right hidden md:block">
            <div className="text-[11px] font-ink-serif text-[#a8a29e]">功绩值</div>
            <div className="text-sm font-ink-serif font-bold text-[#f59e0b] tabular-nums">{score}</div>
          </div>
        </div>

        {/* Right: Controls & Modals */}
        <div className="flex items-center gap-2">
          {/* Control Mode Switch Button */}
          <button
            onClick={onToggleControlMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-ink-serif rounded-lg border transition-colors cursor-pointer ${
              controlMode === 'FULL_GESTURE'
                ? 'bg-[#b91c1c]/25 border-[#b91c1c] text-[#fef08a]'
                : 'bg-[#292520] border-[#443c33] text-[#e7e5e4] hover:bg-[#38332c]'
            }`}
            title="切换操控模式"
          >
            {controlMode === 'FULL_GESTURE' ? (
              <>
                <Wand2 className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span className="hidden sm:inline">全屏瞬杀</span>
              </>
            ) : (
              <>
                <Split className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="hidden sm:inline">分屏双控</span>
              </>
            )}
          </button>

          {/* Active Affixes Button */}
          <button
            onClick={onOpenAffixes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-ink-serif bg-[#292520] hover:bg-[#38332c] text-[#e7e5e4] border border-[#443c33] rounded-lg transition-colors cursor-pointer"
            title="已参悟词条"
          >
            <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="hidden sm:inline">词条</span>
            <span className="text-[10px] text-[#a8a29e]">({activeAffixes.length})</span>
          </button>

          {/* Martial Manual Guide */}
          <button
            onClick={onOpenManual}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-ink-serif bg-[#292520] hover:bg-[#38332c] text-[#e7e5e4] border border-[#443c33] rounded-lg transition-colors cursor-pointer"
            title="武学秘籍与出招指南"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">秘籍</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 text-xs bg-[#292520] hover:bg-[#38332c] text-[#e7e5e4] border border-[#443c33] rounded-lg transition-colors cursor-pointer"
            title={isMuted ? '开启音效' : '静音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#ef4444]" /> : <Volume2 className="w-4 h-4 text-[#22c55e]" />}
          </button>
        </div>
      </header>

      {/* Screen partition / mode hint banner */}
      <div className="flex justify-between items-center text-[11px] font-ink-serif text-[#a8a29e]/70 px-6 py-1 select-none pointer-events-none">
        {controlMode === 'FULL_GESTURE' ? (
          <div className="text-[#fef08a]/95 font-medium flex items-center gap-2">
            <span>手指滑动 · 滑到哪角色到哪并【自动拔剑斩击】</span>
            <span className="text-[#38bdf8]">· 划过敌人触发【瞬杀连斩】</span>
            <span className="text-[#ef4444]">· 击中造成【破势硬直】</span>
          </div>
        ) : (
          <>
            <div>左半屏 · 拖动身法移动 / 跃起跳跃 (WASD/Space)</div>
            <div>右半屏 · 挥墨手势写字出招 (或下方技能快捷施放)</div>
          </>
        )}
      </div>

      {/* Center Dynamic Calligraphy Recognition Banner (Recent gesture flash) */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {recentGesture && (
          <div className="flex items-center gap-3 bg-[#171513]/90 border border-[#b91c1c]/60 px-5 py-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Red cinnabar seal impression */}
            <div className="w-10 h-10 bg-[#b91c1c] text-[#fef3c7] font-calligraphy text-2xl flex items-center justify-center rounded border border-[#ef4444] shadow-inner">
              {recentGesture.hanzi}
            </div>
            <div className="flex flex-col">
              <div className="text-base font-calligraphy text-[#fef08a] flex items-center gap-1.5">
                <span>{recentGesture.name}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
              </div>
              <div className="text-[11px] font-ink-serif text-[#d6d3d1]">{recentGesture.desc}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quick Move Deck for Direct Touch / Click & Keyboard reference */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left mobile stick indicator & Dedicated Jump Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerJump}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d]/90 hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#38bdf8]/50 rounded-xl transition-transform cursor-pointer shadow-lg shadow-black/40"
            title="轻功起跃 (快捷键 Space / K)"
          >
            <span className="text-sm font-calligraphy text-[#38bdf8]">跃</span>
            <span className="text-[9px] text-[#a8a29e]">轻功[空格]</span>
          </button>
          <div className="text-[10px] font-ink-serif text-[#78716c] hidden sm:block">
            键盘: [WASD]纵深移动 [Space]轻功起跃 [J]刺 [U]横 [I]劈 [O]圆 [L]闪
          </div>
        </div>

        {/* Right Touch/Click Skill Bar for immediate action */}
        <div className="flex items-center gap-1.5 ml-auto bg-[#171513]/85 p-1.5 rounded-xl border border-[#3f3830]">
          <button
            onClick={() => onTriggerMove('TAP')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="基础墨刺 (快捷键 J / 右屏轻点)"
          >
            <span className="text-sm font-calligraphy text-[#fef08a]">刺</span>
            <span className="text-[9px] text-[#a8a29e]">连击[J]</span>
          </button>

          <button
            onClick={() => onTriggerMove('HORIZONTAL')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="横扫千军 (快捷键 U / 右屏画横「一」)"
          >
            <span className="text-sm font-calligraphy text-[#38bdf8]">横</span>
            <span className="text-[9px] text-[#a8a29e]">剑气[U]</span>
          </button>

          <button
            onClick={() => onTriggerMove('VERTICAL_DOWN')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="力劈华山 (快捷键 I / 右屏画竖「丨」)"
          >
            <span className="text-sm font-calligraphy text-[#fbbf24]">劈</span>
            <span className="text-[9px] text-[#a8a29e]">地刺[I]</span>
          </button>

          <button
            onClick={() => onTriggerMove('DIAGONAL_UP')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="飞燕凌空 (右屏右上/左上挥挑「丿」)"
          >
            <span className="text-sm font-calligraphy text-[#4ade80]">挑</span>
            <span className="text-[9px] text-[#a8a29e]">击飞</span>
          </button>

          <button
            onClick={() => onTriggerMove('CIRCLE')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="浑元太极 (快捷键 O / 右屏画圆「〇」)"
          >
            <span className="text-sm font-calligraphy text-[#c084fc]">圆</span>
            <span className="text-[9px] text-[#a8a29e]">太极[O]</span>
          </button>

          <button
            onClick={() => onTriggerMove('ZIGZAG')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#26221d] hover:bg-[#363028] active:scale-95 text-[#f5f5f4] border border-[#443c33] rounded-lg transition-transform cursor-pointer"
            title="踏影瞬杀 (快捷键 L / 右屏画闪折「Z」)"
          >
            <span className="text-sm font-calligraphy text-[#f87171]">闪</span>
            <span className="text-[9px] text-[#a8a29e]">瞬影[L]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
