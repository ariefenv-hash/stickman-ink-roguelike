/**
 * Active Affixes Inventory Modal
 */

import React from 'react';
import { X, Layers, Shield, Sword, Feather, Zap } from 'lucide-react';
import { Affix } from '../types/game';

interface AffixDrawerModalProps {
  affixes: Affix[];
  onClose: () => void;
}

export const AffixDrawerModal: React.FC<AffixDrawerModalProps> = ({ affixes, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-[#181614] border border-[#443c33] rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a8a29e] hover:text-[#f5f5f4] rounded-lg hover:bg-[#28241f] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="text-xs font-ink-serif text-[#a8a29e] tracking-widest mb-1">
            平生所学 · 心法集成
          </div>
          <h2 className="text-2xl font-calligraphy text-[#f5f0e6] tracking-wider">
            已参悟武道词条 ({affixes.length})
          </h2>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {affixes.length === 0 ? (
            <div className="text-center py-12 text-[#78716c] font-ink-serif text-sm">
              尚无心法词条。通关每波妖墨挑战后即可参悟神功！
            </div>
          ) : (
            affixes.map((affix, idx) => (
              <div
                key={`${affix.id}-${idx}`}
                className="flex items-center gap-3.5 p-3.5 bg-[#201d19] border border-[#352f28] rounded-xl"
              >
                <div className="w-9 h-9 rounded-lg bg-[#b91c1c]/20 border border-[#b91c1c]/50 text-[#f87171] font-calligraphy text-lg flex items-center justify-center shrink-0">
                  {affix.hanziSeal}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-calligraphy text-base text-[#f5f0e6]">
                      【{affix.name}】
                    </h4>
                    <span className="text-[10px] font-ink-serif text-[#f59e0b] border border-[#f59e0b]/40 px-1.5 py-0.5 rounded">
                      {affix.rarity === 'LEGENDARY' ? '神品' : affix.rarity === 'EPIC' ? '绝品' : affix.rarity === 'RARE' ? '灵品' : '凡品'}
                    </span>
                  </div>
                  <p className="text-xs text-[#a8a29e] font-ink-serif mt-1">
                    {affix.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#332c25] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2a2621] hover:bg-[#38332c] text-[#f5f5f4] text-xs font-ink-serif rounded-lg border border-[#443c33] transition-colors cursor-pointer"
          >
            返回战斗
          </button>
        </div>
      </div>
    </div>
  );
};
