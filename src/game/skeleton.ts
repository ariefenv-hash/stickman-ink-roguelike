/**
 * Stickman Skeletal Rig & Kinematics Renderer
 * Smooth procedural bones with Chinese ink brush calligraphy aesthetics
 */

import { ActionState, EnemyType, SkeletonPose } from '../types/game';

export class StickmanSkeleton {
  /**
   * Calculate bone angles based on action state, timer, and movement phase
   *
   * 关节约定（与 render 中的三角函数一致）：
   * - 角度 0 = 肢体竖直向下（腿/臂）或竖直向上（躯干），正值朝面朝方向（+x）偏
   * - 膝盖是单向铰链：小腿只能向后折（shinAngle ≤ 0），正值会画成反向关节
   * - 肘部相反：前臂向前折（forearmAngle ≥ 0）
   */
  public static getPose(state: ActionState, timer: number, duration: number, walkCycle: number): SkeletonPose {
    const progress = Math.min(1, Math.max(0, timer / Math.max(0.01, duration)));

    switch (state) {
      case 'RUN': {
        // 跑步循环：大腿前后摆 ±0.55，膝只向后折——后摆时脚跟后踢，前摆时小腿收拢前探
        const legSwing = Math.sin(walkCycle) * 0.55;
        const armSwing = Math.cos(walkCycle) * 0.45;
        // 小腿角：基础 -0.3，前摆渐伸直，后摆时脚跟大幅后踢（更负）
        const shinOf = (ls: number) => -0.3 + 0.15 * ls + Math.min(0, ls) * 0.45;
        return {
          torsoAngle: 0.22,
          headAngle: 0.08,
          leftUpperArmAngle: -0.1 - armSwing * 1.1,
          leftForearmAngle: 0.75,
          rightUpperArmAngle: -0.45 + armSwing * 0.2,
          rightForearmAngle: 0.95,
          leftThighAngle: legSwing + 0.12,
          leftShinAngle: shinOf(legSwing),
          rightThighAngle: -legSwing + 0.12,
          rightShinAngle: shinOf(-legSwing),
          weaponAngle: 0.55 + Math.sin(walkCycle * 2) * 0.06,
          weaponOffset: { x: 3, y: 1 },
        };
      }

      case 'JUMP_UP': {
        // 腾空收腿：膝盖前提、小腿后折（正确弯曲方向的团身）
        return {
          torsoAngle: -0.1,
          headAngle: -0.15,
          leftUpperArmAngle: -1.45,
          leftForearmAngle: 0.45,
          rightUpperArmAngle: -1.2,
          rightForearmAngle: 0.55,
          leftThighAngle: 0.85,
          leftShinAngle: -1.2,
          rightThighAngle: 0.3,
          rightShinAngle: -0.7,
          weaponAngle: -0.7,
          weaponOffset: { x: 2, y: -2 },
        };
      }

      case 'FALL': {
        // 下落预备落地：膝微屈后折，手臂上扬平衡
        return {
          torsoAngle: 0.12,
          headAngle: 0.18,
          leftUpperArmAngle: -1.0,
          leftForearmAngle: 0.5,
          rightUpperArmAngle: -0.75,
          rightForearmAngle: 0.6,
          leftThighAngle: 0.35,
          leftShinAngle: -0.35,
          rightThighAngle: 0.12,
          rightShinAngle: -0.2,
          weaponAngle: 0.35,
          weaponOffset: { x: 0, y: 4 },
        };
      }

      case 'ATTACK_THRUST': {
        // 直刺：弓步——前膝前顶小腿后折撑地，后腿蹬直成力线
        const lunge = Math.sin(progress * Math.PI);
        return {
          torsoAngle: 0.3 * lunge,
          headAngle: 0.08,
          leftUpperArmAngle: -0.7,
          leftForearmAngle: 0.6,
          rightUpperArmAngle: 1.5 * lunge,
          rightForearmAngle: 0.05,
          leftThighAngle: -0.55 * lunge,
          leftShinAngle: -0.15 * lunge,
          rightThighAngle: 0.7 * lunge,
          rightShinAngle: -0.3 * lunge,
          weaponAngle: -0.02,
          weaponOffset: { x: 14 * lunge, y: -2 },
          hipDrop: 3 * lunge,
        };
      }

      case 'ATTACK_HORIZONTAL': {
        // 横扫：重心左右微移，双脚钉地旋转
        const angle = -1.2 + progress * 2.8;
        return {
          torsoAngle: Math.sin(progress * Math.PI) * 0.32,
          headAngle: 0.05,
          leftUpperArmAngle: -0.5,
          leftForearmAngle: 0.7,
          rightUpperArmAngle: angle,
          rightForearmAngle: 0.45,
          leftThighAngle: 0.25,
          leftShinAngle: -0.35,
          rightThighAngle: -0.2,
          rightShinAngle: -0.1,
          weaponAngle: angle + 0.3,
          weaponOffset: { x: 6, y: -2 },
        };
      }

      case 'ATTACK_VERTICAL': {
        // 劈砍：高举过顶后向前下劈，前腿撑住重心
        const t = progress < 0.3 ? progress / 0.3 : (progress - 0.3) / 0.7;
        const armAng = progress < 0.3 ? -1.8 * t : -1.8 + 3.2 * t;
        return {
          torsoAngle: progress < 0.3 ? -0.2 : 0.38 * t,
          headAngle: progress < 0.3 ? -0.3 : 0.18,
          leftUpperArmAngle: -0.8,
          leftForearmAngle: 0.6,
          rightUpperArmAngle: armAng,
          rightForearmAngle: 0.25,
          leftThighAngle: -0.28,
          leftShinAngle: -0.45,
          rightThighAngle: 0.35,
          rightShinAngle: -0.25,
          weaponAngle: armAng + 0.2,
          weaponOffset: { x: 4, y: 0 },
          hipDrop: 3 * t,
        };
      }

      case 'ATTACK_LAUNCH': {
        // 上挑：剑自下而上撩起，身体后仰展腹，后腿蹬地拖直
        const arm = 1.6 - progress * 2.8;
        return {
          torsoAngle: -0.28 * progress,
          headAngle: -0.35 * progress,
          leftUpperArmAngle: 0.8,
          leftForearmAngle: 0.45,
          rightUpperArmAngle: arm,
          rightForearmAngle: 0.2,
          leftThighAngle: 0.3,
          leftShinAngle: -0.2,
          rightThighAngle: -0.35,
          rightShinAngle: -0.5,
          weaponAngle: arm - 0.4,
          weaponOffset: { x: 2, y: -6 },
        };
      }

      case 'ATTACK_TAICHI': {
        // 360 旋转：双脚为轴钉地，剑随身体旋转
        const spin = progress * Math.PI * 2;
        return {
          torsoAngle: Math.sin(spin) * 0.16,
          headAngle: 0,
          leftUpperArmAngle: -1.2,
          leftForearmAngle: 0.8,
          rightUpperArmAngle: Math.cos(spin) * 1.5,
          rightForearmAngle: 0.4,
          leftThighAngle: 0.28,
          leftShinAngle: -0.3,
          rightThighAngle: -0.28,
          rightShinAngle: -0.2,
          weaponAngle: spin,
          weaponOffset: { x: 0, y: 0 },
          hipDrop: 2,
        };
      }

      case 'ATTACK_DASH': {
        // 滑步闪：压低重心的猎步——前膝深折、后腿蹬直拖行，剑前引低探
        return {
          torsoAngle: 0.5,
          headAngle: 0.1,
          leftUpperArmAngle: -1.0,
          leftForearmAngle: 0.3,
          rightUpperArmAngle: 0.9,
          rightForearmAngle: 0.15,
          leftThighAngle: -0.75,
          leftShinAngle: -0.35,
          rightThighAngle: 0.85,
          rightShinAngle: -0.75,
          weaponAngle: -0.1,
          weaponOffset: { x: 10, y: -2 },
          hipDrop: 8,
        };
      }

      case 'WINDUP': {
        // 攻击前摇蓄力：重心后坐、武器高举过顶并高频颤动，给玩家明确闪避预警
        const tremble = Math.sin(walkCycle * 22) * 0.09;
        const charge = Math.min(1, progress * 1.4);
        return {
          torsoAngle: -0.35 * charge,
          headAngle: -0.3 * charge,
          leftUpperArmAngle: -0.9 * charge,
          leftForearmAngle: 1.1,
          rightUpperArmAngle: -2.2 * charge + tremble,
          rightForearmAngle: 0.5,
          leftThighAngle: 0.55 * charge,
          leftShinAngle: -0.55 * charge,
          rightThighAngle: -0.45 * charge,
          rightShinAngle: -0.6 * charge,
          weaponAngle: -1.9 + tremble * 2,
          weaponOffset: { x: -4, y: -8 * charge },
          hipDrop: 5 * charge,
        };
      }

      case 'HURT': {
        // 受击踉跄：上身后仰，双腿后撑屈膝缓冲，髋部下沉
        const r = Math.max(0.35, Math.sin(progress * Math.PI));
        return {
          torsoAngle: -0.48 * r,
          headAngle: -0.58 * r,
          leftUpperArmAngle: -1.2 * r,
          leftForearmAngle: 0.8,
          rightUpperArmAngle: -1.1 * r,
          rightForearmAngle: 0.9,
          leftThighAngle: 0.45 * r,
          leftShinAngle: -0.35 * r,
          rightThighAngle: -0.35 * r,
          rightShinAngle: -0.55 * r,
          weaponAngle: 0.95,
          weaponOffset: { x: -6 * r, y: 4 * r },
          hipDrop: 6 * r,
        };
      }

      case 'DEAD': {
        // 倒地：髋部沉降贴近地面，躯干放平，四肢摊开
        return {
          torsoAngle: 1.45,
          headAngle: 1.05,
          leftUpperArmAngle: 1.15,
          leftForearmAngle: 0.2,
          rightUpperArmAngle: 0.85,
          rightForearmAngle: 0.35,
          leftThighAngle: 0.85,
          leftShinAngle: -0.35,
          rightThighAngle: 0.3,
          rightShinAngle: -0.75,
          weaponAngle: 1.6,
          weaponOffset: { x: 8, y: 10 },
          hipDrop: 26,
        };
      }

      case 'IDLE':
      default: {
        const breath = Math.sin(walkCycle * 0.8) * 0.05;
        return {
          torsoAngle: breath,
          headAngle: -breath * 0.5,
          leftUpperArmAngle: 0.35 + breath,
          leftForearmAngle: 0.7,
          rightUpperArmAngle: -0.2 - breath,
          rightForearmAngle: 0.9,
          leftThighAngle: 0.1,
          leftShinAngle: -0.05,
          rightThighAngle: -0.14,
          rightShinAngle: -0.1,
          weaponAngle: 0.45 + breath,
          weaponOffset: { x: 2, y: 0 },
        };
      }
    }
  }

  /**
   * Render stickman skeleton with Chinese calligraphy brush ink aesthetics
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    scale: number,
    facing: 1 | -1,
    pose: SkeletonPose,
    options: {
      isPlayer: boolean;
      enemyType?: EnemyType;
      inkAlpha?: number;
      ribbonPhase?: number;
      isAttacking?: boolean;
    }
  ) {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(facing * scale, scale);

    const alpha = options.inkAlpha ?? 1;
    ctx.globalAlpha = alpha;

    // Bone stroke style：玩家纯黑墨骨，妖墨暗赤（浅色宣纸上双方都清晰且可分辨）
    const mainColor = options.isPlayer ? '#16130f' : '#54241a';
    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const boneWidth = options.isPlayer ? 3.5 : options.enemyType === 'INK_BRUTE' ? 5.5 : 3.0;
    ctx.lineWidth = boneWidth;

    // Rig geometry constants (scaled to ~65px standing stickman)
    const hipX = 0;
    const hipY = -34;
    const torsoLen = 22;
    const headRadius = options.enemyType === 'INK_BRUTE' ? 10 : 7.5;
    const armLen1 = 11;
    const armLen2 = 11;
    const legLen1 = 15;
    const legLen2 = 14;

    // 1. Torso
    const hipY0 = hipY + (pose.hipDrop ?? 0);
    const shoulderX = hipX + Math.sin(pose.torsoAngle) * torsoLen;
    const shoulderY = hipY0 - Math.cos(pose.torsoAngle) * torsoLen;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY0);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // 2. Head & Martial Arts Bamboo Hat (斗笠)
    const headX = shoulderX + Math.sin(pose.headAngle) * 9;
    const headY = shoulderY - Math.cos(pose.headAngle) * 9 - headRadius;

    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo Hat for player or bosses
    if (options.isPlayer || options.enemyType === 'INK_BOSS') {
      const hatW = options.isPlayer ? 24 : 32;
      const hatH = options.isPlayer ? 7 : 10;
      ctx.save();
      ctx.translate(headX, headY - headRadius * 0.4);
      ctx.rotate(pose.headAngle);

      // Hat triangle cone
      ctx.beginPath();
      ctx.moveTo(-hatW / 2, 0);
      ctx.lineTo(0, -hatH);
      ctx.lineTo(hatW / 2, 0);
      ctx.closePath();
      ctx.fillStyle = options.isPlayer ? '#322c26' : '#5c1d1d';
      ctx.fill();
      ctx.strokeStyle = '#1a1918';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Red cinnabar ribbon (斗笠剑穗) fluttering behind
      const ribbonPhase = options.ribbonPhase ?? 0;
      const r1 = Math.sin(ribbonPhase) * 4;
      const r2 = Math.cos(ribbonPhase * 1.3) * 6;
      ctx.beginPath();
      ctx.moveTo(-hatW * 0.25, 0);
      ctx.bezierCurveTo(-hatW * 0.5 - 6, 6 + r1, -hatW * 0.8 - 10, 14 + r2, -hatW - 14, 20 + r1);
      ctx.strokeStyle = '#c22020'; // Vermilion red
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Legs
    // Left Leg (Back leg)
    const lKneeX = hipX + Math.sin(pose.leftThighAngle) * legLen1;
    const lKneeY = hipY0 + Math.cos(pose.leftThighAngle) * legLen1;
    const lFootX = lKneeX + Math.sin(pose.leftThighAngle + pose.leftShinAngle) * legLen2;
    const lFootY = lKneeY + Math.cos(pose.leftThighAngle + pose.leftShinAngle) * legLen2;

    ctx.save();
    ctx.strokeStyle = options.isPlayer ? '#2d2b28' : '#6b3226'; // slightly dimmer back leg
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(lKneeX, lKneeY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();
    ctx.restore();

    // Right Leg (Front leg)
    const rKneeX = hipX + Math.sin(pose.rightThighAngle) * legLen1;
    const rKneeY = hipY0 + Math.cos(pose.rightThighAngle) * legLen1;
    const rFootX = rKneeX + Math.sin(pose.rightThighAngle + pose.rightShinAngle) * legLen2;
    const rFootY = rKneeY + Math.cos(pose.rightThighAngle + pose.rightShinAngle) * legLen2;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY0);
    ctx.lineTo(rKneeX, rKneeY);
    ctx.lineTo(rFootX, rFootY);
    ctx.stroke();

    // 4. Arms & Weapons
    // Left Arm (Back arm)
    const lElbowX = shoulderX + Math.sin(pose.leftUpperArmAngle) * armLen1;
    const lElbowY = shoulderY + Math.cos(pose.leftUpperArmAngle) * armLen1;
    const lHandX = lElbowX + Math.sin(pose.leftUpperArmAngle + pose.leftForearmAngle) * armLen2;
    const lHandY = lElbowY + Math.cos(pose.leftUpperArmAngle + pose.leftForearmAngle) * armLen2;

    ctx.save();
    ctx.strokeStyle = options.isPlayer ? '#33312e' : '#7a4132';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(lElbowX, lElbowY);
    ctx.lineTo(lHandX, lHandY);
    ctx.stroke();
    ctx.restore();

    // Right Arm (Front arm, holds weapon)
    const rElbowX = shoulderX + Math.sin(pose.rightUpperArmAngle) * armLen1;
    const rElbowY = shoulderY + Math.cos(pose.rightUpperArmAngle) * armLen1;
    const rHandX = rElbowX + Math.sin(pose.rightUpperArmAngle + pose.rightForearmAngle) * armLen2;
    const rHandY = rElbowY + Math.cos(pose.rightUpperArmAngle + pose.rightForearmAngle) * armLen2;

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(rElbowX, rElbowY);
    ctx.lineTo(rHandX, rHandY);
    ctx.stroke();

    // 5. Weapon rendering
    ctx.save();
    ctx.translate(rHandX + pose.weaponOffset.x, rHandY + pose.weaponOffset.y);
    ctx.rotate(pose.weaponAngle);

    if (options.isPlayer) {
      // Ink Brush Sword (墨韵青锋剑)
      // Hilt
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(4, 0);
      ctx.strokeStyle = '#854d0e'; // Bronze wood hilt
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Guard
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.lineTo(4, 5);
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Blade (with ink edge)
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(34, 0);
      ctx.strokeStyle = '#1e1d1b';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Tip ink aura glow
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(36, 0);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dynamic Blade Arc Trail (挥剑墨光破空)
      if (options.isAttacking) {
        ctx.save();
        // 1. Broad ink wash crescent trail
        ctx.beginPath();
        ctx.arc(0, 0, 42, -0.9, 0.9);
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.75)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // 2. Cyan / Cinnabar sharp energy edge
        ctx.beginPath();
        ctx.arc(0, 0, 40, -0.75, 0.75);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 3. Blazing white cutting filament
        ctx.beginPath();
        ctx.arc(0, 0, 38, -0.45, 0.45);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }
    } else if (options.enemyType === 'INK_ARCHER') {
      // Longbow
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Bowstring
      ctx.beginPath();
      ctx.moveTo(11, -12);
      ctx.lineTo(11, 12);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (options.enemyType === 'INK_BRUTE') {
      // Giant spiked ink club (狼牙棒)
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(38, 0);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 7;
      ctx.stroke();
    } else {
      // Dao blade
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();

    ctx.restore();
  }
}
