/**
 * Roguelike Skill Affix System (词条系统)
 * Classical Chinese Martial Arts & Ink Daoism Synergies
 */

import { Affix } from '../types/game';

export const ALL_AFFIXES: Affix[] = [
  {
    id: 'blade_qi',
    name: '剑气纵横',
    hanziSeal: '气',
    rarity: 'EPIC',
    desc: '挥砍斩击与招式附带穿透性水墨剑气，远距离撕裂群敌。',
    iconType: 'sword',
    stats: {
      swordBeamEnabled: true,
      attackBonus: 15,
    },
  },
  {
    id: 'mad_cursive',
    name: '狂草墨暴',
    hanziSeal: '狂',
    rarity: 'LEGENDARY',
    desc: '书法手势招式暴击率提高35%，暴击时引爆大范围水墨风暴。',
    iconType: 'brush',
    stats: {
      gestureBonus: 40,
      critChanceBonus: 0.35,
      inkExplosion: true,
    },
  },
  {
    id: 'taichi_void',
    name: '太极还虚',
    hanziSeal: '道',
    rarity: 'EPIC',
    desc: '「圆」招式生成更庞大的八卦气场，吸纳伤害转化为自身生命。',
    iconType: 'shield',
    stats: {
      damageReduction: 20,
      lifestealPercent: 0.1,
    },
  },
  {
    id: 'thousand_jin',
    name: '笔意千钧',
    hanziSeal: '钧',
    rarity: 'RARE',
    desc: '「劈」招式震地裂痕化为向前奔涌的三道墨龙地刺，击飞敌人。',
    iconType: 'lightning',
    stats: {
      attackBonus: 25,
      gestureBonus: 20,
    },
  },
  {
    id: 'phantom_chain',
    name: '瞬影连环',
    hanziSeal: '影',
    rarity: 'LEGENDARY',
    desc: '「闪」招式命中敌人立即重置内力消耗，可连续发动穿梭截杀。',
    iconType: 'feather',
    stats: {
      flashCooldownReset: true,
      moveSpeedBonus: 25,
    },
  },
  {
    id: 'glacial_ink',
    name: '泼墨成冰',
    hanziSeal: '寒',
    rarity: 'RARE',
    desc: '墨迹凝寒成冰，受击敌人移动与攻击速度减缓60%，持续4秒。',
    iconType: 'shield',
    stats: {
      frostSlow: true,
    },
  },
  {
    id: 'ink_thunder',
    name: '惊雷笔意',
    hanziSeal: '雷',
    rarity: 'EPIC',
    desc: '每成功书写释放一次书法手势，天降一道水墨惊雷轰击随机强敌。',
    iconType: 'lightning',
    stats: {
      thunderStrike: true,
      gestureBonus: 25,
    },
  },
  {
    id: 'flowing_water',
    name: '行云流水',
    hanziSeal: '韵',
    rarity: 'COMMON',
    desc: '身法空灵，墨意恢复速度提高80%，移动速度提升15%。',
    iconType: 'feather',
    stats: {
      inkRegenBonus: 80,
      moveSpeedBonus: 15,
    },
  },
  {
    id: 'iron_bone',
    name: '金刚铁骨',
    hanziSeal: '刚',
    rarity: 'RARE',
    desc: '内力护体，受到伤害减少30%，受击硬直减半。',
    iconType: 'shield',
    stats: {
      damageReduction: 30,
      maxHpBonus: 40,
    },
  },
  {
    id: 'blood_siphon',
    name: '饮墨生华',
    hanziSeal: '饮',
    rarity: 'EPIC',
    desc: '每次消灭敌人或打出高额连招，吸收天地墨韵恢复6%气血。',
    iconType: 'flame',
    stats: {
      lifestealPercent: 0.08,
      critDamageBonus: 40,
    },
  },
  {
    id: 'dense_ink',
    name: '浓墨破岳',
    hanziSeal: '破',
    rarity: 'COMMON',
    desc: '墨劲雄浑，基础攻击力提高30%，击退距离大幅提升。',
    iconType: 'sword',
    stats: {
      attackBonus: 30,
    },
  },
  {
    id: 'step_snow',
    name: '踏雪无痕',
    hanziSeal: '空',
    rarity: 'RARE',
    desc: '跳跃与起落滞空时间延长，浮空招式伤害提高50%。',
    iconType: 'feather',
    stats: {
      gestureBonus: 25,
      moveSpeedBonus: 20,
    },
  },
];

/**
 * Draw 3 random distinct affixes, prioritizing unowned ones
 */
export function drawRandomAffixes(owned: Affix[], count: number = 3): Affix[] {
  const ownedIds = new Set(owned.map((a) => a.id));
  const pool = ALL_AFFIXES.filter((a) => !ownedIds.has(a.id));
  const source = pool.length >= count ? pool : ALL_AFFIXES;

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
