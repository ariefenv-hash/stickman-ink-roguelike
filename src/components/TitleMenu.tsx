/**
 * Game Title Screen / Main Menu
 */

import React, { useState } from 'react';
import { Play, BookOpen, Volume2, ShieldAlert, Award } from 'lucide-react';
import inkSeal from '@/assets/images/ink_seal_martial_art_1790306578422.jpg';
import inkSeal from '@/assets/images/ink_seal_martial_art_1790306578422.jpg';

interface TitleMenuProps {
  onStart: (difficulty: 'EASY' | 'NORMAL' | 'HARD') => void;
  onOpenManual: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({ onStart, onOpenManual }) => {
  const [difficulty, setDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="max-w-xl w-full bg-[#181614] border border-[#443c33] rounded-2xl p-7 sm:p-9 shadow-2xl relative flex flex-col items-center text-center">
        {/* Decorative Seal Icon */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#b91c1c] shadow-lg mb-4">
          <img
            src={inkSeal}
            alt="墨武"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Title */}
        <div className="text-xs font-ink-serif text-[#a8a29e] tracking-widest mb-1.5">
          中国古典水墨 · 仿3D火柴人动作肉鸽
        </div>
        <h1 className="text-3xl sm:text-4xl font-calligraphy text-[#f5f0e6] tracking-widest mb-3">
          墨痕武道
        </h1>
        <p className="text-xs sm:text-sm text-[#d6d3d1] font-ink-serif max-w-md mb-6 leading-relaxed">
          以笔化剑，踏墨而行。在仿3D水墨画卷中施展流畅骨骼身法与书法手势招式，参悟随机武道词条，迎战高难度的妖墨浪潮！
        </p>

        {/* Difficulty Selection */}
        <div className="w-full mb-6 text-left">
          <div className="text-xs font-ink-serif text-[#a8a29e] mb-2 text-center">
            选择江湖试炼难度
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDifficulty('EASY')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                difficulty === 'EASY'
                  ? 'bg-[#292520] border-[#38bdf8] text-[#38bdf8] shadow-md'
                  : 'bg-[#1e1b17] border-[#332c25] text-[#a8a29e] hover:border-[#443c33]'
              }`}
            >
              <div className="font-calligraphy text-sm sm:text-base">初入江湖</div>
              <div className="text-[10px] font-ink-serif mt-0.5 opacity-80">新手磨砺</div>
            </button>

            <button
              onClick={() => setDifficulty('NORMAL')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                difficulty === 'NORMAL'
                  ? 'bg-[#292520] border-[#fbbf24] text-[#fbbf24] shadow-md'
                  : 'bg-[#1e1b17] border-[#332c25] text-[#a8a29e] hover:border-[#443c33]'
              }`}
            >
              <div className="font-calligraphy text-sm sm:text-base">炉火纯青</div>
              <div className="text-[10px] font-ink-serif mt-0.5 opacity-80">标准挑战</div>
            </button>

            <button
              onClick={() => setDifficulty('HARD')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                difficulty === 'HARD'
                  ? 'bg-[#292520] border-[#ef4444] text-[#ef4444] shadow-md'
                  : 'bg-[#1e1b17] border-[#332c25] text-[#a8a29e] hover:border-[#443c33]'
              }`}
            >
              <div className="font-calligraphy text-sm sm:text-base">宗师绝顶</div>
              <div className="text-[10px] font-ink-serif mt-0.5 opacity-80">高难杀伐</div>
            </button>
          </div>
        </div>

        {/* Feature summary */}
        <div className="flex items-center justify-center gap-4 text-xs font-ink-serif text-[#a8a29e] mb-6">
          <span>左屏摇杆身法</span>
          <span aria-hidden="true">·</span>
          <span>右屏书法手势</span>
          <span aria-hidden="true">·</span>
          <span>键鼠/触屏双全</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => onStart(difficulty)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#b91c1c] hover:bg-[#991b1b] text-[#f5f5f4] font-calligraphy text-lg rounded-xl transition-all shadow-lg shadow-[#b91c1c]/25 cursor-pointer w-full"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>执笔入局 · 开战</span>
          </button>

          <button
            onClick={onOpenManual}
            className="flex items-center justify-center gap-1.5 py-3 px-5 bg-[#25211c] hover:bg-[#332d26] text-[#e7e5e4] font-ink-serif text-sm rounded-xl border border-[#443c33] transition-colors cursor-pointer w-full sm:w-auto"
          >
            <BookOpen className="w-4 h-4 text-[#38bdf8]" />
            <span>秘籍心法</span>
          </button>
        </div>
      </div>
    </div>
  );
};
