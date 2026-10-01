/**
 * Martial Arts Manual & Calligraphy Gesture Guide
 */

import React from 'react';
import { X, Sparkles, Move, MousePointer, Touchpad } from 'lucide-react';

interface ManualModalProps {
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const moves = [
    {
      hanzi: '刺',
      name: '墨刺突刺',
      strokeType: '轻点 / 短促点击',
      key: 'J 键',
      desc: '向前迅猛刺出墨锋，出招极快，适合近战快速连击与破招断招。',
      color: 'text-[#fef08a] border-[#fef08a]/40 bg-[#fef08a]/10',
    },
    {
      hanzi: '横',
      name: '横扫千军',
      strokeType: '水平划线「一」',
      key: 'U 键',
      desc: '向左或向右迅速挥出宽阔剑气，贯穿前方多名敌人，造成范围撕裂。',
      color: 'text-[#38bdf8] border-[#38bdf8]/40 bg-[#38bdf8]/10',
    },
    {
      hanzi: '劈',
      name: '力劈华山',
      strokeType: '垂直向下拉线「丨」',
      key: 'I 键',
      desc: '凌空跃起重砸地面，激起奔涌的水墨地刺与冲击波，造成重度击飞。',
      color: 'text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10',
    },
    {
      hanzi: '挑',
      name: '飞燕凌空',
      strokeType: '自下而上斜划「丿」',
      key: '右下至左上/右上',
      desc: '墨锋自下向上一挑，将正前方的敌人击飞至高空，可配合跳跃进行空战追斩。',
      color: 'text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10',
    },
    {
      hanzi: '圆',
      name: '浑元太极',
      strokeType: '画圆闭环「〇」',
      key: 'O 键',
      desc: '原地回旋旋舞水墨八卦阵，短暂无敌，反弹弹道箭矢并将贴身敌人震退。',
      color: 'text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10',
    },
    {
      hanzi: '闪',
      name: '踏影瞬杀',
      strokeType: '折线闪电「Z」或「乛」',
      key: 'L 键',
      desc: '身形化为一道水墨残影穿透敌阵，处于无敌状态，并在敌人身后造成连续裂斩。',
      color: 'text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#181614] border border-[#443c33] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a8a29e] hover:text-[#f5f5f4] rounded-lg hover:bg-[#28241f] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="text-xs font-ink-serif text-[#a8a29e] tracking-widest mb-1">
            墨家秘传 · 出招心法
          </div>
          <h2 className="text-2xl font-calligraphy text-[#f5f0e6] tracking-wider">
            武学招式与手势图录
          </h2>
        </div>

        {/* Partition / Full Gesture Control Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-3.5 bg-[#201d19] rounded-xl border border-[#332c25] text-xs font-ink-serif">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#fef08a]">全屏跟手滑动 · 到达拔剑斩击</span>
              <p className="text-[#a8a29e] mt-0.5 leading-relaxed">
                手指在屏幕滑动即可极速紧密跟手位移（滑到哪角色就到哪），到达滑动终点后<strong className="text-[#38bdf8]">自动拔剑释放斩击</strong>！攻击命中将使敌人陷入<strong className="text-[#ef4444]">【受击硬直（破势）】</strong>，打断敌人攻击并震颤击退；若直接划过敌人更可触发多目标<strong className="text-[#fca5a5]">【瞬杀连斩】</strong>！
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Touchpad className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#f5f0e6]">自由切换 · 模式与键位双全</span>
              <p className="text-[#a8a29e] mt-0.5 leading-relaxed">
                可点击顶部【全屏瞬杀 / 分屏双控】按钮随时切换。支持键盘 WASD 纵深走位、空格轻功起跃，以及 J/U/I/O/L 快捷出招。
              </p>
            </div>
          </div>
        </div>

        {/* 6 Gesture Cards Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
          {moves.map((move) => (
            <div
              key={move.hanzi}
              className="flex items-start gap-3 p-3 bg-[#1f1c18] border border-[#352f28] rounded-xl"
            >
              {/* Hanzi Seal */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-calligraphy text-2xl shrink-0 border ${move.color}`}
              >
                {move.hanzi}
              </div>

              {/* Move Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-calligraphy text-base text-[#f5f0e6]">{move.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] font-ink-serif text-[#a8a29e]">
                    <span>手势: {move.strokeType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#e7e5e4] font-medium">{move.key}</span>
                  </div>
                </div>
                <p className="text-xs text-[#a8a29e] font-ink-serif mt-1 leading-relaxed">
                  {move.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#332c25]">
          <span className="text-xs text-[#78716c] font-ink-serif">
            提示：在仿3D空间中，利用W/S避开敌方箭矢与重击是通关要诀
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-[#f5f5f4] text-xs font-ink-serif rounded-lg transition-colors cursor-pointer"
          >
            领悟闭卷
          </button>
        </div>
      </div>
    </div>
  );
};
