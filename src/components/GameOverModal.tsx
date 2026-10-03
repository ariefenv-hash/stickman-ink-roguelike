/**
 * Defeat and Victory Settlement Modal
 * v2: 完整战斗统计 / 破纪录提示 / 无尽模式入口 / 修复图片路径
 */

import React from 'react';
import { RotateCcw, Award, Skull, Infinity as InfinityIcon, Crown, Swords, Zap, Timer, ScrollText } from 'lucide-react';
import { RunStats } from '../types/game';
import { formatDuration } from '../utils/storage';
import inkSeal from '@/src/assets/images/title_seal.png';

interface GameOverModalProps {
  stats: RunStats;
  isVictory: boolean;
  isNewRecord: boolean;
  onRestart: () => void;
  onContinueEndless?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isVictory,
  isNewRecord,
  onRestart,
  onContinueEndless,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#f4eedd] border border-[#b3a181] rounded-2xl p-7 shadow-2xl relative flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
        {/* Chinese Seal Stamp Graphic */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#b91c1c] shadow-lg">
            <img
              src={inkSeal}
              alt="墨武印章"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {isVictory && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#b45309] rounded-full flex items-center justify-center border-2 border-[#f4eedd]">
              <Crown className="w-4 h-4 text-[#f4eedd]" />
            </div>
          )}
        </div>

        {/* Heading */}
        <div className="text-xs font-ink-serif text-[#85745a] tracking-widest mb-1">
          江湖路远 · 胜败无常
        </div>
        <h2 className="text-3xl font-calligraphy text-[#2b2118] mb-2">
          {isVictory ? '笑傲江湖 · 墨武大成' : '身陨道消 · 墨染残躯'}
        </h2>
        <p className="text-xs text-[#85745a] font-ink-serif mb-4 leading-relaxed">
          {isVictory
            ? '十五折尽破，墨煞大帝亦伏于笔下！一手神妙水墨书法冠绝天下，留得赫赫威名。'
            : '气血耗尽，虽败犹荣。武道一途重在磨砺心性，重整旗鼓再战江湖！'}
        </p>

        {/* New record badge */}
        {isNewRecord && stats.score > 0 && (
          <div className="mb-4 px-3 py-1 bg-[#b45309]/40 border border-[#b45309]/60 rounded-full flex items-center gap-1.5 animate-pulse">
            <Award className="w-3.5 h-3.5 text-[#b45309]" />
            <span className="text-[11px] font-ink-serif text-[#b45309] tracking-widest">功绩创历史新高！</span>
          </div>
        )}

        {/* Core stats: wave + score */}
        <div className="grid grid-cols-2 gap-3 w-full mb-3 p-4 bg-[#ece3cd] rounded-xl border border-[#c4b494]">
          <div className="text-center">
            <div className="text-[11px] font-ink-serif text-[#85745a]">{isVictory ? '问鼎关卡' : '止步关卡'}</div>
            <div className="text-xl font-calligraphy text-[#2b2118] mt-0.5">
              第{stats.wave}折
            </div>
          </div>
          <div className="text-center border-l border-[#c4b494]">
            <div className="text-[11px] font-ink-serif text-[#85745a]">总功绩值</div>
            <div className="text-xl font-calligraphy text-[#b45309] mt-0.5 tabular-nums">
              {stats.score}
            </div>
          </div>
        </div>

        {/* Detailed battle stats */}
        <div className="grid grid-cols-4 gap-2 w-full mb-3">
          <div className="p-2 bg-[#ece4d0] rounded-lg border border-[#c4b494] flex flex-col items-center">
            <Swords className="w-3.5 h-3.5 text-[#dc2626] mb-1" />
            <div className="text-sm font-calligraphy text-[#2b2118] tabular-nums leading-none">{stats.kills}</div>
            <div className="text-[9px] font-ink-serif text-[#937f60] mt-1">斩敌</div>
          </div>
          <div className="p-2 bg-[#ece4d0] rounded-lg border border-[#c4b494] flex flex-col items-center">
            <Zap className="w-3.5 h-3.5 text-[#b45309] mb-1" />
            <div className="text-sm font-calligraphy text-[#2b2118] tabular-nums leading-none">{stats.maxCombo}</div>
            <div className="text-[9px] font-ink-serif text-[#937f60] mt-1">最大连击</div>
          </div>
          <div className="p-2 bg-[#ece4d0] rounded-lg border border-[#c4b494] flex flex-col items-center">
            <Skull className="w-3.5 h-3.5 text-[#9333ea] mb-1" />
            <div className="text-sm font-calligraphy text-[#2b2118] tabular-nums leading-none">{stats.eliteKills + stats.bossKills}</div>
            <div className="text-[9px] font-ink-serif text-[#937f60] mt-1">精锐/宗师</div>
          </div>
          <div className="p-2 bg-[#ece4d0] rounded-lg border border-[#c4b494] flex flex-col items-center">
            <Timer className="w-3.5 h-3.5 text-[#0369a1] mb-1" />
            <div className="text-sm font-calligraphy text-[#2b2118] tabular-nums leading-none">{formatDuration(stats.timeSurvived)}</div>
            <div className="text-[9px] font-ink-serif text-[#937f60] mt-1">闯荡时长</div>
          </div>
        </div>

        {/* Collected affixes */}
        {stats.affixes.length > 0 && (
          <div className="w-full mb-5 p-3 bg-[#ece4d0] rounded-xl border border-[#c4b494] text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-ink-serif text-[#85745a] tracking-[0.3em] mb-2">
              <ScrollText className="w-3 h-3" />
              <span>本局参悟 · {stats.affixes.length} 道</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.affixes.map((a, i) => (
                <span
                  key={`${a.id}-${i}`}
                  className={`inline-flex items-center gap-1 text-[10px] font-ink-serif px-1.5 py-0.5 rounded border ${
                    a.rarity === 'LEGENDARY'
                      ? 'text-[#b45309] border-[#b45309]/40 bg-[#b45309]/20'
                      : a.rarity === 'EPIC'
                      ? 'text-[#7c3aed] border-[#9333ea]/40 bg-[#9333ea]/30'
                      : a.rarity === 'RARE'
                      ? 'text-[#0369a1] border-[#0284c7]/40 bg-[#0284c7]/30'
                      : 'text-[#5a4a34] border-[#85745a]/50 bg-[#85745a]/40'
                  }`}
                >
                  <span className="font-calligraphy">{a.hanziSeal}</span>
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#b91c1c] hover:bg-[#991b1b] text-[#f8f0dc] font-calligraphy text-base rounded-xl transition-colors shadow-lg shadow-[#b91c1c]/25 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重出江湖 · 再续墨痕</span>
          </button>

          {onContinueEndless && (
            <button
              onClick={onContinueEndless}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-6 bg-[#ded3b8] hover:bg-[#d8c9aa] text-[#4a3c2a] font-ink-serif text-sm rounded-xl border border-[#9333ea]/50 transition-colors cursor-pointer"
            >
              <InfinityIcon className="w-4 h-4 text-[#7c3aed]" />
              <span>意犹未尽 · 闯入无尽妖墨深渊</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
