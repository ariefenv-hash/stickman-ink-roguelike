/**
 * Defeat and Victory Settlement Modal
 */

import React from 'react';
import { RotateCcw, Award, Skull } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  wave: number;
  isVictory: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  wave,
  isVictory,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#181614] border border-[#443c33] rounded-2xl p-7 shadow-2xl relative flex flex-col items-center text-center">
        {/* Chinese Seal Stamp Graphic */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#b91c1c] shadow-lg">
            <img
              src="/src/assets/images/ink_seal_martial_art_1790306578422.jpg"
              alt="墨武印章"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-xs font-ink-serif text-[#a8a29e] tracking-widest mb-1">
          江湖路远 · 胜败无常
        </div>
        <h2 className="text-3xl font-calligraphy text-[#f5f0e6] mb-2">
          {isVictory ? '笑傲江湖 · 墨武大成' : '身陨道消 · 墨染残躯'}
        </h2>
        <p className="text-xs text-[#a8a29e] font-ink-serif mb-6 leading-relaxed">
          {isVictory
            ? '少侠一手神妙水墨书法招式冠绝天下，已斩尽来犯妖墨，留得赫赫威名！'
            : '气血耗尽，虽败犹荣。武道一途重在磨砺心性，重整旗鼓再战江湖！'}
        </p>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 p-4 bg-[#201d19] rounded-xl border border-[#332c25]">
          <div className="text-center">
            <div className="text-[11px] font-ink-serif text-[#a8a29e]">止步关卡</div>
            <div className="text-xl font-calligraphy text-[#f5f0e6] mt-0.5">
              第{wave}折
            </div>
          </div>
          <div className="text-center border-l border-[#332c25]">
            <div className="text-[11px] font-ink-serif text-[#a8a29e]">总功绩值</div>
            <div className="text-xl font-calligraphy text-[#f59e0b] mt-0.5 tabular-nums">
              {score}
            </div>
          </div>
        </div>

        {/* Single-line Play Again button as required by casual games guidelines */}
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#b91c1c] hover:bg-[#991b1b] text-[#f5f5f4] font-calligraphy text-base rounded-xl transition-colors shadow-lg shadow-[#b91c1c]/25 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重出江湖 · 再续墨痕</span>
        </button>
      </div>
    </div>
  );
};
