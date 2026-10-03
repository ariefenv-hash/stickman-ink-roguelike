/**
 * Martial Arts Manual & Calligraphy Gesture Guide
 */

import React from 'react';
import { X, Sparkles, Move, MousePointer, Touchpad, ShieldAlert, Crown, Pause, Skull } from 'lucide-react';

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
      color: 'text-[#92400e] border-[#92400e]/40 bg-[#92400e]/10',
    },
    {
      hanzi: '横',
      name: '横扫千军',
      strokeType: '水平划线「一」',
      key: 'U 键',
      desc: '向左或向右迅速挥出宽阔剑气，贯穿前方多名敌人，造成范围撕裂。',
      color: 'text-[#0369a1] border-[#0369a1]/40 bg-[#0369a1]/10',
    },
    {
      hanzi: '劈',
      name: '力劈华山',
      strokeType: '垂直向下拉线「丨」',
      key: 'I 键',
      desc: '凌空跃起重砸地面，激起奔涌的水墨地刺与冲击波，造成重度击飞。',
      color: 'text-[#b45309] border-[#b45309]/40 bg-[#b45309]/10',
    },
    {
      hanzi: '挑',
      name: '飞燕凌空',
      strokeType: '自下而上斜划「丿」',
      key: '右下至左上/右上',
      desc: '墨锋自下向上一挑，将正前方的敌人击飞至高空，可配合跳跃进行空战追斩。',
      color: 'text-[#16a34a] border-[#16a34a]/40 bg-[#16a34a]/10',
    },
    {
      hanzi: '圆',
      name: '浑元太极',
      strokeType: '画圆闭环「〇」',
      key: 'O 键',
      desc: '原地回旋旋舞水墨八卦阵，短暂无敌，反弹弹道箭矢并将贴身敌人震退。',
      color: 'text-[#7c3aed] border-[#7c3aed]/40 bg-[#7c3aed]/10',
    },
    {
      hanzi: '闪',
      name: '踏影瞬杀',
      strokeType: '折线闪电「Z」或「乛」',
      key: 'L 键',
      desc: '身形化为一道水墨残影穿透敌阵，处于无敌状态，并在敌人身后造成连续裂斩。',
      color: 'text-[#b91c1c] border-[#b91c1c]/40 bg-[#b91c1c]/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#f4eedd] border border-[#b3a181] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#85745a] hover:text-[#2b2118] rounded-lg hover:bg-[#e0d5ba] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="text-xs font-ink-serif text-[#85745a] tracking-widest mb-1">
            墨家秘传 · 出招心法
          </div>
          <h2 className="text-2xl font-calligraphy text-[#2b2118] tracking-wider">
            武学招式与手势图录
          </h2>
        </div>

        {/* Partition / Full Gesture Control Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3.5 bg-[#ece3cd] rounded-xl border border-[#c4b494] text-xs font-ink-serif">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#92400e]">全屏跟手滑动 · 到达拔剑斩击</span>
              <p className="text-[#85745a] mt-0.5 leading-relaxed">
                手指在屏幕滑动即可极速紧密跟手位移（滑到哪角色就到哪），到达滑动终点后<strong className="text-[#0369a1]">自动拔剑释放斩击</strong>！攻击命中将使敌人陷入<strong className="text-[#dc2626]">【受击硬直（破势）】</strong>，打断敌人攻击并震颤击退；若直接划过敌人更可触发多目标<strong className="text-[#b91c1c]">【瞬杀连斩】</strong>！
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Touchpad className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#2b2118]">自由切换 · 模式与键位双全</span>
              <p className="text-[#85745a] mt-0.5 leading-relaxed">
                可点击顶部【全屏瞬杀 / 分屏双控】按钮随时切换。支持键盘 WASD 纵深走位、空格轻功起跃，以及 J/U/I/O/L 快捷出招、ESC 暂停。
              </p>
            </div>
          </div>
        </div>

        {/* 实战要诀 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <div className="p-2.5 bg-[#f3e3da] rounded-lg border border-[#d9a29a] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
            <div className="text-[10px] font-ink-serif text-[#85745a] leading-relaxed">
              <span className="text-[#b91c1c] font-semibold">前摇预警</span>：敌人出手前头顶亮起红色「！」并后坐蓄力——此刻挥剑打断即可反制其攻势！
            </div>
          </div>
          <div className="p-2.5 bg-[#dfe7ea] rounded-lg border border-[#a9c3d4] flex items-start gap-2">
            <Crown className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
            <div className="text-[10px] font-ink-serif text-[#85745a] leading-relaxed">
              <span className="text-[#b45309] font-semibold">宗师技变</span>：首领掌握震地冲击（红圈预警可走位躲）、墨珠散射与召唤护法，半血后狂暴化！
            </div>
          </div>
          <div className="p-2.5 bg-[#e9e2f0] rounded-lg border border-[#c3aed6] flex items-start gap-2">
            <Skull className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
            <div className="text-[10px] font-ink-serif text-[#85745a] leading-relaxed">
              <span className="text-[#8b5cf6] font-semibold">精英精锐</span>：带光环词缀的精锐（迅捷/铁壁/狂暴/汲影）更强也更凶，斩杀可获高额功绩与墨意。
            </div>
          </div>
        </div>

        {/* 6 Gesture Cards Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
          {moves.map((move) => (
            <div
              key={move.hanzi}
              className="flex items-start gap-3 p-3 bg-[#ece4d0] border border-[#c9b995] rounded-xl"
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
                  <h4 className="font-calligraphy text-base text-[#2b2118]">{move.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] font-ink-serif text-[#85745a]">
                    <span>手势: {move.strokeType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#4a3c2a] font-medium">{move.key}</span>
                  </div>
                </div>
                <p className="text-xs text-[#85745a] font-ink-serif mt-1 leading-relaxed">
                  {move.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#c4b494]">
          <span className="text-xs text-[#937f60] font-ink-serif flex items-center gap-1.5">
            <Pause className="w-3 h-3" />
            提示：利用W/S纵深走位躲箭与红圈，ESC随时暂停闭目回气
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-[#f8f0dc] text-xs font-ink-serif rounded-lg transition-colors cursor-pointer"
          >
            领悟闭卷
          </button>
        </div>
      </div>
    </div>
  );
};
