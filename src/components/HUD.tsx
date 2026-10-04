/**
 * Top HUD and Martial Arts Calligraphy Overlay
 * v2: 墨盾条 / Boss顶部血条 / 暂停按钮 / 音量控制 / 低血警示
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Layers, Sparkles, Wand2, Split, Pause } from 'lucide-react';
import { Affix, BossHudInfo, ControlMode, GestureResult } from '../types/game';

interface HUDProps {
  hp: number;
  maxHp: number;
  ink: number;
  maxInk: number;
  shield: number;
  shieldMax: number;
  wave: number;
  waveTitle: string;
  enemiesLeft: number;
  combo: number;
  score: number;
  isMuted: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onOpenManual: () => void;
  onOpenAffixes: () => void;
  activeAffixes: Affix[];
  recentGesture: GestureResult | null;
  onTriggerMove: (type: 'TAP' | 'HORIZONTAL' | 'VERTICAL_DOWN' | 'DIAGONAL_UP' | 'CIRCLE' | 'ZIGZAG') => void;
  onTriggerJump: () => void;
  onTriggerAwakening: () => void;
  awakening: number;
  awakeningMax: number;
  controlMode: ControlMode;
  onToggleControlMode: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  bossInfo: BossHudInfo | null;
  banner: { title: string; isBossWave: boolean } | null;
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  ink,
  maxInk,
  shield,
  shieldMax,
  waveTitle,
  enemiesLeft,
  combo,
  score,
  isMuted,
  volume,
  onVolumeChange,
  onToggleMute,
  onOpenManual,
  onOpenAffixes,
  activeAffixes,
  recentGesture,
  onTriggerMove,
  onTriggerJump,
  onTriggerAwakening,
  awakening,
  awakeningMax,
  controlMode,
  onToggleControlMode,
  onTogglePause,
  bossInfo,
}) => {
  const [showVolume, setShowVolume] = useState(false);
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const inkPercent = Math.max(0, Math.min(100, (ink / maxInk) * 100));
  const shieldPercent = shieldMax > 0 ? Math.max(0, Math.min(100, (shield / shieldMax) * 100)) : 0;
  const awakeningPercent = awakeningMax > 0 ? Math.max(0, Math.min(100, (awakening / awakeningMax) * 100)) : 0;
  const isAwakenReady = awakening >= awakeningMax;
  const isLowHp = hp > 0 && hpPercent <= 30;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Boss 顶部血条 */}
      {bossInfo && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[68px] w-[min(560px,86vw)] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="font-calligraphy text-sm text-[#b91c1c] tracking-widest drop-shadow">
              {bossInfo.name}
              {bossInfo.phase === 2 && <span className="ml-2 text-[10px] font-ink-serif text-[#dc2626] border border-[#dc2626]/60 px-1 rounded animate-pulse">狂暴</span>}
            </span>
            <span className="text-[10px] font-ink-serif text-[#5a4a34] tabular-nums">{Math.ceil(bossInfo.hp)}/{bossInfo.maxHp}</span>
          </div>
          <div className="h-2.5 bg-[#f3e7d9]/90 rounded-full overflow-hidden border border-[#7f1d1d] shadow-lg">
            <div
              className={`h-full transition-all duration-300 ${bossInfo.phase === 2 ? 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#f97316]' : 'bg-gradient-to-r from-[#991b1b] to-[#dc2626]'}`}
              style={{ width: `${Math.max(0, (bossInfo.hp / bossInfo.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Top Bar Navigation & Status */}
      <header className="flex items-center justify-between pointer-events-auto bg-[#f1ead7]/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#d8c9aa] shadow-lg">
        {/* Left: Brand title & Health/Ink Bars */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-calligraphy tracking-widest text-[#2b2118] flex items-center gap-1.5">
              <span>墨痕武道</span>
              <span className="text-xs font-ink-serif text-[#b91c1c] border border-[#b91c1c]/50 px-1 py-0.2 rounded">
                无双
              </span>
            </h1>
            <div className="text-[11px] font-ink-serif text-[#85745a] flex items-center gap-2">
              <span>{waveTitle}</span>
              <span aria-hidden="true">·</span>
              <span>剩余妖墨: {enemiesLeft}</span>
            </div>
          </div>

          {/* Meters */}
          <div className="hidden sm:flex flex-col gap-1 w-36 sm:w-44">
            {/* HP Bar */}
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
              <span className={`font-semibold w-6 ${isLowHp ? 'text-[#dc2626] animate-pulse' : 'text-[#dc2626]'}`}>气血</span>
              <div className={`flex-1 h-2 bg-[#ded3b8] rounded-full overflow-hidden border ${isLowHp ? 'border-[#dc2626]/70' : 'border-[#b3a181]'}`}>
                <div
                  className={`h-full transition-all duration-200 ${isLowHp ? 'bg-gradient-to-r from-[#7f1d1d] to-[#dc2626] animate-pulse' : 'bg-gradient-to-r from-[#b91c1c] to-[#dc2626]'}`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              <span className="text-[#5a4a34] tabular-nums text-[9px]">{hp}/{maxHp}</span>
            </div>

            {/* Shield Bar (墨盾) */}
            {shieldMax > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
                <span className="text-[#0369a1] font-semibold w-6">墨盾</span>
                <div className="flex-1 h-2 bg-[#ded3b8] rounded-full overflow-hidden border border-[#0284c7]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0369a1] to-[#0284c7] transition-all duration-200"
                    style={{ width: `${shieldPercent}%` }}
                  />
                </div>
                <span className="text-[#5a4a34] tabular-nums text-[9px]">{Math.ceil(shield)}/{shieldMax}</span>
              </div>
            )}

            {/* Ink Energy Bar */}
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
              <span className="text-[#7c3aed] font-semibold w-6">墨意</span>
              <div className="flex-1 h-2 bg-[#ded3b8] rounded-full overflow-hidden border border-[#b3a181]">
                <div
                  className="h-full bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] transition-all duration-200"
                  style={{ width: `${inkPercent}%` }}
                />
              </div>
              <span className="text-[#5a4a34] tabular-nums text-[9px]">{Math.floor(ink)}/{maxInk}</span>
            </div>

            {/* Awakening Bar（觉醒槽：满槽可释放「万墨归宗」[G]） */}
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif">
              <span className={`font-semibold w-6 ${isAwakenReady ? 'text-[#b45309] animate-pulse' : 'text-[#92703c]'}`}>觉醒</span>
              <div className={`flex-1 h-2 bg-[#ded3b8] rounded-full overflow-hidden border ${isAwakenReady ? 'border-[#b45309] shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'border-[#b3a181]'}`}>
                <div
                  className={`h-full transition-all duration-200 ${isAwakenReady ? 'bg-gradient-to-r from-[#d97706] to-[#fbbf24] animate-pulse' : 'bg-gradient-to-r from-[#92703c] to-[#d97706]'}`}
                  style={{ width: `${awakeningPercent}%` }}
                />
              </div>
              <span className="text-[#5a4a34] tabular-nums text-[9px]">{isAwakenReady ? '可释放!' : `${Math.floor(awakening)}/${awakeningMax}`}</span>
            </div>
          </div>
        </div>

        {/* Center: Score & Combo Notice */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#b91c1c]/20 border border-[#b91c1c]/40 rounded-lg animate-pulse">
              <span className="text-sm font-bold text-[#b91c1c] tabular-nums">{combo}</span>
              <span className="text-xs font-calligraphy text-[#b91c1c]">连斩</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-[11px] font-ink-serif text-[#85745a]">功绩值</div>
            <div className="text-sm font-ink-serif font-bold text-[#b45309] tabular-nums">{score}</div>
          </div>
        </div>

        {/* Right: Controls & Modals */}
        <div className="flex items-center gap-2">
          {/* Control Mode Switch Button */}
          <button
            onClick={onToggleControlMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-ink-serif rounded-lg border transition-colors cursor-pointer ${
              controlMode === 'FULL_GESTURE'
                ? 'bg-[#b91c1c]/25 border-[#b91c1c] text-[#92400e]'
                : 'bg-[#e6dcc4] border-[#b3a181] text-[#4a3c2a] hover:bg-[#d8c9aa]'
            }`}
            title="切换操控模式"
          >
            {controlMode === 'FULL_GESTURE' ? (
              <>
                <Wand2 className="w-3.5 h-3.5 text-[#b45309]" />
                <span className="hidden sm:inline">全屏瞬杀</span>
              </>
            ) : (
              <>
                <Split className="w-3.5 h-3.5 text-[#0369a1]" />
                <span className="hidden sm:inline">分屏双控</span>
              </>
            )}
          </button>

          {/* Active Affixes Button */}
          <button
            onClick={onOpenAffixes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-ink-serif bg-[#e6dcc4] hover:bg-[#d8c9aa] text-[#4a3c2a] border border-[#b3a181] rounded-lg transition-colors cursor-pointer"
            title="已参悟词条"
          >
            <Layers className="w-3.5 h-3.5 text-[#b45309]" />
            <span className="hidden sm:inline">词条</span>
            <span className="text-[10px] text-[#85745a]">({activeAffixes.length})</span>
          </button>

          {/* Martial Manual Guide */}
          <button
            onClick={onOpenManual}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-ink-serif bg-[#e6dcc4] hover:bg-[#d8c9aa] text-[#4a3c2a] border border-[#b3a181] rounded-lg transition-colors cursor-pointer"
            title="武学秘籍与出招指南"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0369a1]" />
            <span className="hidden sm:inline">秘籍</span>
          </button>

          {/* Volume control */}
          <div className="relative">
            <button
              onClick={() => setShowVolume((v) => !v)}
              onDoubleClick={onToggleMute}
              className="p-1.5 text-xs bg-[#e6dcc4] hover:bg-[#d8c9aa] text-[#4a3c2a] border border-[#b3a181] rounded-lg transition-colors cursor-pointer"
              title={isMuted ? '已静音（双击切换）· 单击调节音量' : '音量调节（双击静音）'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-[#dc2626]" /> : <Volume2 className="w-4 h-4 text-[#15803d]" />}
            </button>
            {showVolume && (
              <div className="absolute right-0 top-full mt-2 p-3 bg-[#f1ead7]/95 backdrop-blur border border-[#b3a181] rounded-xl shadow-2xl flex flex-col gap-2 w-40 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-[10px] font-ink-serif text-[#85745a]">
                  <span>音量</span>
                  <span className="tabular-nums">{Math.round(volume)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full accent-[#b91c1c] cursor-pointer"
                />
                <button
                  onClick={onToggleMute}
                  className="text-[10px] font-ink-serif text-[#5a4a34] hover:text-[#2b2118] bg-[#ded3b8] border border-[#b3a181] rounded-lg py-1 transition-colors cursor-pointer"
                >
                  {isMuted ? '解除静音' : '一键静音'}
                </button>
              </div>
            )}
          </div>

          {/* Pause */}
          <button
            onClick={onTogglePause}
            className="p-1.5 text-xs bg-[#e6dcc4] hover:bg-[#d8c9aa] text-[#4a3c2a] border border-[#b3a181] rounded-lg transition-colors cursor-pointer"
            title="暂停 [ESC]"
          >
            <Pause className="w-4 h-4 text-[#b45309]" />
          </button>
        </div>
      </header>

      {/* Screen partition / mode hint banner */}
      <div className="flex justify-between items-center text-[11px] font-ink-serif text-[#85745a]/70 px-6 py-1 select-none pointer-events-none">
        {controlMode === 'FULL_GESTURE' ? (
          <div className="text-[#92400e]/95 font-medium flex flex-wrap items-center gap-2">
            <span>手指滑动 · 滑到哪角色到哪并【自动拔剑斩击】</span>
            <span className="text-[#0369a1]">· 划过敌人触发【瞬杀连斩】</span>
            <span className="text-[#dc2626]">· 头顶红色「！」时走位闪避</span>
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
          <div className="flex items-center gap-3 bg-[#f1ead7]/90 border border-[#b91c1c]/60 px-5 py-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Red cinnabar seal impression */}
            <div className="w-10 h-10 bg-[#b91c1c] text-[#fef3c7] font-calligraphy text-2xl flex items-center justify-center rounded border border-[#dc2626] shadow-inner">
              {recentGesture.hanzi}
            </div>
            <div className="flex flex-col">
              <div className="text-base font-calligraphy text-[#92400e] flex items-center gap-1.5">
                <span>{recentGesture.name}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
              </div>
              <div className="text-[11px] font-ink-serif text-[#5a4a34]">{recentGesture.desc}</div>
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
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8]/90 hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#0369a1]/50 rounded-xl transition-transform cursor-pointer shadow-lg shadow-black/40"
            title="轻功起跃 (快捷键 Space / K)"
          >
            <span className="text-sm font-calligraphy text-[#0369a1]">跃</span>
            <span className="text-[9px] text-[#85745a]">轻功[空格]</span>
          </button>
          <button
            onClick={onTriggerAwakening}
            className={`flex flex-col items-center justify-center w-11 h-11 active:scale-95 border rounded-xl transition-transform cursor-pointer shadow-lg shadow-black/40 ${
              isAwakenReady
                ? 'bg-gradient-to-b from-[#fbbf24] to-[#d97706] border-[#b45309] animate-pulse'
                : 'bg-[#ded3b8]/60 hover:bg-[#c9b995] border-[#b3a181]/50 opacity-70'
            }`}
            title="觉醒技·万墨归宗 (快捷键 G，满槽后释放全屏墨爆)"
          >
            <span className={`text-sm font-calligraphy ${isAwakenReady ? 'text-[#7c2d12]' : 'text-[#92703c]'}`}>觉</span>
            <span className={`text-[9px] ${isAwakenReady ? 'text-[#7c2d12] font-bold' : 'text-[#85745a]'}`}>万墨[G]</span>
          </button>
          <div className="text-[10px] font-ink-serif text-[#937f60] hidden lg:block">
            键盘: [WASD]纵深移动 [Space]轻功起跃 [J]刺 [U]横 [I]劈 [O]圆 [L]闪 [G]觉醒 [ESC]暂停
          </div>
        </div>

        {/* Right Touch/Click Skill Bar for immediate action */}
        <div className="flex items-center gap-1.5 ml-auto bg-[#f1ead7]/85 p-1.5 rounded-xl border border-[#b3a181]">
          <button
            onClick={() => onTriggerMove('TAP')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="基础墨刺 (快捷键 J / 右屏轻点)"
          >
            <span className="text-sm font-calligraphy text-[#92400e]">刺</span>
            <span className="text-[9px] text-[#85745a]">连击[J]</span>
          </button>

          <button
            onClick={() => onTriggerMove('HORIZONTAL')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="横扫千军 (快捷键 U / 右屏画横「一」)"
          >
            <span className="text-sm font-calligraphy text-[#0369a1]">横</span>
            <span className="text-[9px] text-[#85745a]">剑气[U]</span>
          </button>

          <button
            onClick={() => onTriggerMove('VERTICAL_DOWN')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="力劈华山 (快捷键 I / 右屏画竖「丨」)"
          >
            <span className="text-sm font-calligraphy text-[#b45309]">劈</span>
            <span className="text-[9px] text-[#85745a]">地刺[I]</span>
          </button>

          <button
            onClick={() => onTriggerMove('DIAGONAL_UP')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="飞燕凌空 (右屏右上/左上挥挑「丿」)"
          >
            <span className="text-sm font-calligraphy text-[#16a34a]">挑</span>
            <span className="text-[9px] text-[#85745a]">击飞</span>
          </button>

          <button
            onClick={() => onTriggerMove('CIRCLE')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="浑元太极 (快捷键 O / 右屏画圆「〇」)"
          >
            <span className="text-sm font-calligraphy text-[#7c3aed]">圆</span>
            <span className="text-[9px] text-[#85745a]">太极[O]</span>
          </button>

          <button
            onClick={() => onTriggerMove('ZIGZAG')}
            className="flex flex-col items-center justify-center w-11 h-11 bg-[#ded3b8] hover:bg-[#c9b995] active:scale-95 text-[#2b2118] border border-[#b3a181] rounded-lg transition-transform cursor-pointer"
            title="踏影瞬杀 (快捷键 L / 右屏画闪折「Z」)"
          >
            <span className="text-sm font-calligraphy text-[#b91c1c]">闪</span>
            <span className="text-[9px] text-[#85745a]">瞬影[L]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
