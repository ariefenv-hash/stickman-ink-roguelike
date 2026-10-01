/**
 * Stickman Skeletal Rig & Kinematics Renderer
 * Smooth procedural bones with Chinese ink brush calligraphy aesthetics
 */

import { ActionState, EnemyType, SkeletonPose } from '../types/game';

export class StickmanSkeleton {
  /**
   * Calculate bone angles based on action state, timer, and movement phase
   */
  public static getPose(state: ActionState, timer: number, duration: number, walkCycle: number): SkeletonPose {
    const progress = Math.min(1, Math.max(0, timer / Math.max(0.01, duration)));

    switch (state) {
      case 'RUN': {
        const legSwing = Math.sin(walkCycle) * 0.75;
        const armSwing = Math.cos(walkCycle) * 0.65;
        return {
          torsoAngle: 0.28,
          headAngle: 0.12,
          leftUpperArmAngle: -armSwing + 0.4,
          leftForearmAngle: 0.8,
          rightUpperArmAngle: armSwing - 0.2,
          rightForearmAngle: 0.7,
          leftThighAngle: legSwing + 0.35,
          leftShinAngle: Math.max(0, -legSwing * 1.1) + 0.2,
          rightThighAngle: -legSwing + 0.35,
          rightShinAngle: Math.max(0, legSwing * 1.1) + 0.2,
          weaponAngle: 0.3 + armSwing * 0.4,
          weaponOffset: { x: 4, y: 0 },
        };
      }

      case 'JUMP_UP': {
        return {
          torsoAngle: -0.15,
          headAngle: -0.2,
          leftUpperArmAngle: -1.2,
          leftForearmAngle: 0.6,
          rightUpperArmAngle: -1.0,
          rightForearmAngle: 0.8,
          leftThighAngle: -0.8,
          leftShinAngle: 1.4,
          rightThighAngle: -0.5,
          rightShinAngle: 1.1,
          weaponAngle: -0.8,
          weaponOffset: { x: 2, y: -2 },
        };
      }

      case 'FALL': {
        return {
          torsoAngle: 0.1,
          headAngle: 0.2,
          leftUpperArmAngle: -0.8,
          leftForearmAngle: 0.4,
          rightUpperArmAngle: -0.6,
          rightForearmAngle: 0.5,
          leftThighAngle: 0.3,
          leftShinAngle: 0.3,
          rightThighAngle: 0.1,
          rightShinAngle: 0.2,
          weaponAngle: 0.6,
          weaponOffset: { x: 0, y: 4 },
        };
      }

      case 'ATTACK_THRUST': {
        // Quick sharp lunge
        const lunge = Math.sin(progress * Math.PI);
        return {
          torsoAngle: 0.35 * lunge,
          headAngle: 0.1,
          leftUpperArmAngle: -0.6,
          leftForearmAngle: 0.9,
          rightUpperArmAngle: 1.57 * lunge,
          rightForearmAngle: 0.1,
          leftThighAngle: -0.5 * lunge,
          leftShinAngle: 0.7 * lunge,
          rightThighAngle: 0.7 * lunge,
          rightShinAngle: 0.1,
          weaponAngle: 0.05,
          weaponOffset: { x: 14 * lunge, y: -2 },
        };
      }

      case 'ATTACK_HORIZONTAL': {
        // Sweeping slash from back to forward
        const angle = -1.2 + progress * 2.8;
        return {
          torsoAngle: Math.sin(progress * Math.PI) * 0.4,
          headAngle: 0.05,
          leftUpperArmAngle: -0.5,
          leftForearmAngle: 0.7,
          rightUpperArmAngle: angle,
          rightForearmAngle: 0.5,
          leftThighAngle: 0.2,
          leftShinAngle: 0.3,
          rightThighAngle: -0.2,
          rightShinAngle: 0.2,
          weaponAngle: angle + 0.3,
          weaponOffset: { x: 6, y: -2 },
        };
      }

      case 'ATTACK_VERTICAL': {
        // High overhead chop downward
        const t = progress < 0.3 ? progress / 0.3 : (progress - 0.3) / 0.7;
        const armAng = progress < 0.3 ? -1.8 * t : -1.8 + 3.2 * t;
        return {
          torsoAngle: progress < 0.3 ? -0.2 : 0.45 * t,
          headAngle: progress < 0.3 ? -0.3 : 0.2,
          leftUpperArmAngle: -0.8,
          leftForearmAngle: 0.6,
          rightUpperArmAngle: armAng,
          rightForearmAngle: 0.3,
          leftThighAngle: -0.2,
          leftShinAngle: 0.4,
          rightThighAngle: 0.3,
          rightShinAngle: 0.5,
          weaponAngle: armAng + 0.2,
          weaponOffset: { x: 4, y: 0 },
        };
      }

      case 'ATTACK_LAUNCH': {
        // Rising dragon uppercut
        const arm = 1.6 - progress * 2.8;
        return {
          torsoAngle: -0.3 * progress,
          headAngle: -0.4 * progress,
          leftUpperArmAngle: 0.8,
          leftForearmAngle: 0.5,
          rightUpperArmAngle: arm,
          rightForearmAngle: 0.2,
          leftThighAngle: 0.3,
          leftShinAngle: 0.2,
          rightThighAngle: -0.4,
          rightShinAngle: 0.8,
          weaponAngle: arm - 0.4,
          weaponOffset: { x: 2, y: -6 },
        };
      }

      case 'ATTACK_TAICHI': {
        // 360 Spin
        const spin = progress * Math.PI * 2;
        return {
          torsoAngle: Math.sin(spin) * 0.2,
          headAngle: 0,
          leftUpperArmAngle: -1.2,
          leftForearmAngle: 0.8,
          rightUpperArmAngle: Math.cos(spin) * 1.5,
          rightForearmAngle: 0.4,
          leftThighAngle: Math.sin(spin) * 0.4,
          leftShinAngle: 0.3,
          rightThighAngle: -Math.sin(spin) * 0.4,
          rightShinAngle: 0.3,
          weaponAngle: spin,
          weaponOffset: { x: 0, y: 0 },
        };
      }

      case 'ATTACK_DASH': {
        // Low sleek horizontal dash
        return {
          torsoAngle: 0.65,
          headAngle: 0.2,
          leftUpperArmAngle: -1.4,
          leftForearmAngle: 0.2,
          rightUpperArmAngle: -1.2,
          rightForearmAngle: 0.3,
          leftThighAngle: -0.7,
          leftShinAngle: 1.2,
          rightThighAngle: 0.8,
          rightShinAngle: 0.1,
          weaponAngle: -1.5,
          weaponOffset: { x: -8, y: -4 },
        };
      }

      case 'HURT': {
        // Dramatic staggered recoil: body knocked back, head snapped back, limbs flinching
        const r = Math.max(0.35, Math.sin(progress * Math.PI));
        return {
          torsoAngle: -0.52 * r,
          headAngle: -0.62 * r,
          leftUpperArmAngle: -1.2 * r,
          leftForearmAngle: 0.8,
          rightUpperArmAngle: -1.1 * r,
          rightForearmAngle: 0.9,
          leftThighAngle: 0.5 * r,
          leftShinAngle: 0.3,
          rightThighAngle: -0.4 * r,
          rightShinAngle: 0.7 * r,
          weaponAngle: 0.95,
          weaponOffset: { x: -6 * r, y: 4 * r },
        };
      }

      case 'DEAD': {
        return {
          torsoAngle: 1.5,
          headAngle: 1.2,
          leftUpperArmAngle: 0.8,
          leftForearmAngle: 0.2,
          rightUpperArmAngle: 1.1,
          rightForearmAngle: 0.3,
          leftThighAngle: 0.8,
          leftShinAngle: 0.1,
          rightThighAngle: 0.5,
          rightShinAngle: 0.2,
          weaponAngle: 1.8,
          weaponOffset: { x: 10, y: 15 },
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
          leftShinAngle: 0.1,
          rightThighAngle: -0.15,
          rightShinAngle: 0.15,
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

    // Bone stroke style
    const mainColor = options.isPlayer ? '#181716' : '#2b1b17';
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
    const shoulderX = hipX + Math.sin(pose.torsoAngle) * torsoLen;
    const shoulderY = hipY - Math.cos(pose.torsoAngle) * torsoLen;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
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
    const lKneeY = hipY + Math.cos(pose.leftThighAngle) * legLen1;
    const lFootX = lKneeX + Math.sin(pose.leftThighAngle + pose.leftShinAngle) * legLen2;
    const lFootY = lKneeY + Math.cos(pose.leftThighAngle + pose.leftShinAngle) * legLen2;

    ctx.save();
    ctx.strokeStyle = options.isPlayer ? '#2d2b28' : '#3f2b26'; // slightly dimmer back leg
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(lKneeX, lKneeY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();
    ctx.restore();

    // Right Leg (Front leg)
    const rKneeX = hipX + Math.sin(pose.rightThighAngle) * legLen1;
    const rKneeY = hipY + Math.cos(pose.rightThighAngle) * legLen1;
    const rFootX = rKneeX + Math.sin(pose.rightThighAngle + pose.rightShinAngle) * legLen2;
    const rFootY = rKneeY + Math.cos(pose.rightThighAngle + pose.rightShinAngle) * legLen2;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
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
    ctx.strokeStyle = options.isPlayer ? '#33312e' : '#45322d';
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
