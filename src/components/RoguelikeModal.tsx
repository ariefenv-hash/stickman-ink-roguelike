/**
 * Roguelike Skill Affix Selection Modal
 */

import React from 'react';
import { Affix } from '../types/game';
import { Sparkles, RefreshCw, Check } from 'lucide-react';

interface RoguelikeModalProps {
  affixes: Affix[];
  onSelect: (affix: Affix) => void;
  onReroll: () => void;
}

export const RoguelikeModal: React.FC<RoguelikeModalProps> = ({ affixes, onSelect, onReroll }) => {
  const getRarityBadge = (rarity: Affix['rarity']) => {
    switch (rarity) {
      case 'LEGENDARY':
        return { label: '传世神品', color: 'text-[#fbbf24] border-[#fbbf24]/50 bg-[#fbbf24]/10' };
      case 'EPIC':
        return { label: '稀世绝品', color: 'text-[#c084fc] border-[#c084fc]/50 bg-[#c084fc]/10' };
      case 'RARE':
        return { label: '上乘灵品', color: 'text-[#38bdf8] border-[#38bdf8]/50 bg-[#38bdf8]/10' };
      case 'COMMON':
      default:
        return { label: '精妙凡品', color: 'text-[#d6d3d1] border-[#78716c]/50 bg-[#292520]' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-3xl w-full bg-[#171513] border border-[#443c33] rounded-2xl p-6 sm:p-8 shadow-2xl relative flex flex-col items-center">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="text-xs font-ink-serif text-[#a8a29e] tracking-widest mb-1">
            武道精进 · 顿悟天机
          </div>
          <h2 className="text-2xl sm:text-3xl font-calligraphy text-[#f5f0e6] tracking-wider">
            参悟武学真意
          </h2>
          <p className="text-xs text-[#a8a29e] mt-1 font-ink-serif">
            从天地墨韵中择取一道心法词条，强化招式威能
          </p>
        </div>

        {/* 3 Scroll Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          {affixes.map((affix) => {
            const badge = getRarityBadge(affix.rarity);
            return (
              <div
                key={affix.id}
                onClick={() => onSelect(affix)}
                className="group relative bg-[#201d19] hover:bg-[#28241f] border border-[#3f3830] hover:border-[#b91c1c] rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl shadow-black/40"
              >
                {/* Stamp Seal Impression */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-ink-serif px-2 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="w-8 h-8 rounded bg-[#b91c1c]/20 border border-[#b91c1c]/50 text-[#f87171] font-calligraphy text-base flex items-center justify-center">
                    {affix.hanziSeal}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-calligraphy text-[#f5f0e6] group-hover:text-[#fef08a] transition-colors mb-2">
                  【{affix.name}】
                </h3>

                {/* Description */}
                <p className="text-xs text-[#d6d3d1] font-ink-serif leading-relaxed flex-1 mb-4">
                  {affix.desc}
                </p>

                {/* Action CTA */}
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#2d2822] group-hover:bg-[#b91c1c] text-[#e7e5e4] text-xs font-ink-serif rounded-lg transition-colors">
                  <Check className="w-3.5 h-3.5" />
                  <span>参悟此道</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reroll & Confirmation Footer */}
        <div className="flex items-center justify-between w-full pt-3 border-t border-[#332c25]">
          <span className="text-xs text-[#78716c] font-ink-serif">
            词条效果全局永久生效并可相互叠加强化
          </span>
          <button
            onClick={onReroll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#26221d] hover:bg-[#38332c] text-[#e7e5e4] text-xs font-ink-serif rounded-lg border border-[#443c33] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>重新推演</span>
          </button>
        </div>
      </div>
    </div>
  );
};
