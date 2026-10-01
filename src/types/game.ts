/**
 * Game Types and Interfaces for Ink Martial: Stickman Roguelike
 */

export type GestureType =
  | 'TAP'           // 刺: 基础墨刺 / 连击
  | 'HORIZONTAL'    // 横: 横扫千军
  | 'VERTICAL_DOWN' // 劈: 力劈华山
  | 'DIAGONAL_UP'   // 挑: 飞燕凌空
  | 'CIRCLE'        // 圆: 浑元太极
  | 'ZIGZAG';       // 闪: 踏影瞬杀

export interface GestureResult {
  type: GestureType;
  name: string;
  hanzi: string;
  desc: string;
  confidence: number;
  points: { x: number; y: number; t: number }[];
}

export type AffixRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Affix {
  id: string;
  name: string;
  hanziSeal: string;
  rarity: AffixRarity;
  desc: string;
  iconType: 'sword' | 'shield' | 'flame' | 'brush' | 'lightning' | 'feather';
  stats: {
    attackBonus?: number;       // percentage
    critChanceBonus?: number;   // 0 to 1
    critDamageBonus?: number;   // percentage
    maxHpBonus?: number;        // flat
    moveSpeedBonus?: number;    // percentage
    inkRegenBonus?: number;     // percentage
    damageReduction?: number;   // percentage
    gestureBonus?: number;      // percentage extra damage on gestures
    lifestealPercent?: number;  // 0 to 1
    swordBeamEnabled?: boolean; // shoots ink crescent on attack
    inkExplosion?: boolean;     // explosive ink on crit
    frostSlow?: boolean;        // slow enemies
    flashCooldownReset?: boolean;// reset dash on hit
    thunderStrike?: boolean;    // lightning on gesture
  };
}

export interface Vec3 {
  x: number;
  y: number; // height (jump)
  z: number; // depth
}

export interface SkeletonPose {
  torsoAngle: number;
  headAngle: number;
  leftUpperArmAngle: number;
  leftForearmAngle: number;
  rightUpperArmAngle: number;
  rightForearmAngle: number;
  leftThighAngle: number;
  leftShinAngle: number;
  rightThighAngle: number;
  rightShinAngle: number;
  weaponAngle: number;
  weaponOffset: { x: number; y: number };
}

export type ActionState =
  | 'IDLE'
  | 'RUN'
  | 'JUMP_UP'
  | 'FALL'
  | 'LAND'
  | 'ATTACK_THRUST'     // 刺
  | 'ATTACK_HORIZONTAL' // 横
  | 'ATTACK_VERTICAL'   // 劈
  | 'ATTACK_LAUNCH'     // 挑
  | 'ATTACK_TAICHI'     // 圆
  | 'ATTACK_DASH'       // 闪
  | 'HURT'
  | 'DEAD';

export interface PlayerEntity {
  pos: Vec3;
  vel: Vec3;
  facing: 1 | -1; // 1 = right, -1 = left
  hp: number;
  maxHp: number;
  ink: number;
  maxInk: number;
  state: ActionState;
  stateTimer: number;
  stateDuration: number;
  comboCount: number;
  comboTimer: number;
  isInvincible: boolean;
  invincibleTimer: number;
  dashTrail: Vec3[];
  ribbonWave: number;
  affixes: Affix[];
}

export type EnemyType = 'INK_MINION' | 'INK_ARCHER' | 'INK_BRUTE' | 'SHADOW_NINJA' | 'INK_BOSS';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  name: string;
  pos: Vec3;
  vel: Vec3;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  damage: number;
  state: ActionState;
  stateTimer: number;
  stateDuration: number;
  attackCooldown: number;
  hitStun: number;
  maxHitStun?: number;
  isAirborne: boolean;
  scale: number;
  isBoss?: boolean;
}

export interface Projectile {
  id: string;
  pos: Vec3;
  vel: Vec3;
  damage: number;
  isPlayer: boolean;
  life: number;
  maxLife: number;
  type: 'SWORD_BEAM' | 'INK_ARROW' | 'LIGHTNING' | 'INK_SHOCKWAVE';
  radius: number;
}

export interface InkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  isSplat?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  isCrit?: boolean;
  isGesture?: boolean;
}

export interface SlashLink {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  alpha: number;
  maxAlpha: number;
  color: string;
  width: number;
  hanzi?: string;
  points?: { x: number; y: number }[];
}

export interface DashGhost {
  id: string;
  x: number;
  y: number;
  z: number;
  facing: 1 | -1;
  state: ActionState;
  stateTimer: number;
  stateDuration: number;
  alpha: number;
  maxAlpha: number;
  color?: string;
}

export type ControlMode = 'FULL_GESTURE' | 'SPLIT_SCREEN';

export interface WaveConfig {
  waveNumber: number;
  totalEnemies: number;
  minions: number;
  archers: number;
  brutes: number;
  ninjas: number;
  isBossWave: boolean;
  title: string;
}
