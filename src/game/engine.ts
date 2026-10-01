/**
 * Pseudo-3D Ink Wash Stickman Combat Engine
 */

import { sound } from '../utils/audio';
import { ALL_AFFIXES, drawRandomAffixes } from './affixes';
import { GestureRecognizer, StrokePoint } from './gestureRecognizer';
import { StickmanSkeleton } from './skeleton';
import {
  ActionState,
  Affix,
  ControlMode,
  DashGhost,
  EnemyEntity,
  EnemyType,
  FloatingText,
  GestureResult,
  InkParticle,
  PlayerEntity,
  Projectile,
  SlashLink,
  Vec3,
} from '../types/game';

export interface GameEngineCallbacks {
  onHpChange: (hp: number, maxHp: number) => void;
  onInkChange: (ink: number, maxInk: number) => void;
  onWaveChange: (wave: number, waveTitle: string, enemiesLeft: number) => void;
  onComboChange: (combo: number) => void;
  onGestureRecognized: (gesture: GestureResult) => void;
  onWaveCleared: (affixes: Affix[]) => void;
  onGameOver: (score: number, wave: number, isVictory: boolean) => void;
  onControlModeChange?: (mode: ControlMode) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Background asset
  private bgImage: HTMLImageElement | null = null;
  private bgLoaded: boolean = false;

  // Control Mode: 'FULL_GESTURE' (Flagship: slice across enemies to warp & combo) vs 'SPLIT_SCREEN'
  public controlMode: ControlMode = 'FULL_GESTURE';
  public slashLinks: SlashLink[] = [];
  public dashGhosts: DashGhost[] = [];
  public slideTarget: { x: number; z: number } | null = null;
  public isSlidingMove: boolean = false;

  // Game loop
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private hitStopTimer: number = 0;

  // Camera & Screen Shake
  private cameraX: number = 0;
  private cameraShake: number = 0;
  private screenWidth: number = 1200;
  private screenHeight: number = 700;

  // Player
  public player: PlayerEntity;
  private walkCycle: number = 0;

  // Enemies & Projectiles
  public enemies: EnemyEntity[] = [];
  private projectiles: Projectile[] = [];
  private particles: InkParticle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Gesture stroke drawing (Right half / Mouse)
  public activeStroke: StrokePoint[] = [];
  public isDrawingStroke: boolean = false;

  // Touch Virtual Joystick on Left half
  public touchMoveOrigin: { x: number; y: number } | null = null;
  public touchMoveCurrent: { x: number; y: number } | null = null;
  public touchMoveActive: boolean = false;

  // Multi-touch isolation: track specific pointer IDs so left thumb & right brush never conflict
  private movePointerId: number | null = null;
  private drawPointerId: number | null = null;
  private moveStartTime: number = 0;
  private eventCleanupFns: (() => void)[] = [];

  // Keyboard input state
  private keys: Record<string, boolean> = {};

  // Progression & Waves
  public wave: number = 1;
  public waveTitle: string = '第一折 · 墨卒现世';
  public enemiesSpawnedInWave: number = 0;
  public totalEnemiesInWave: number = 6;
  public enemiesKilledInWave: number = 0;
  private spawnTimer: number = 0;
  public isWaveClearing: boolean = false;
  public score: number = 0;
  public isPaused: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get 2d context');
    this.ctx = context;
    this.callbacks = callbacks;

    this.player = this.createInitialPlayer();
    this.initBackground();
    this.setupEvents();
    this.startWave(1);
  }

  private createInitialPlayer(): PlayerEntity {
    return {
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      facing: 1,
      hp: 120,
      maxHp: 120,
      ink: 100,
      maxInk: 100,
      state: 'IDLE',
      stateTimer: 0,
      stateDuration: 0,
      comboCount: 0,
      comboTimer: 0,
      isInvincible: false,
      invincibleTimer: 0,
      dashTrail: [],
      ribbonWave: 0,
      affixes: [],
    };
  }

  private initBackground() {
    this.bgImage = new Image();
    this.bgImage.src = '/src/assets/images/ink_wash_mountain_backdrop_1790306562587.jpg';
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };
  }

  public setSize(w: number, h: number) {
    this.screenWidth = w;
    this.screenHeight = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    sound.startAmbientBgm();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    this.resetTouches();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setControlMode(mode: ControlMode) {
    this.controlMode = mode;
    this.resetTouches();
    if (this.callbacks.onControlModeChange) {
      this.callbacks.onControlModeChange(mode);
    }
  }

  // World (X, Y, Z) to Screen (sx, sy, scale, groundY)
  public project(pos: Vec3): { sx: number; sy: number; scale: number; groundY: number } {
    const w = this.screenWidth;
    const h = this.screenHeight;
    const horizonY = h * 0.48;
    const depthFactor = (pos.z + 180) / 360;
    const scale = 0.85 + depthFactor * 0.45;
    const sx = (pos.x - this.cameraX) * scale + w / 2;
    const groundY = horizonY + 80 + depthFactor * (h * 0.42);
    const sy = groundY - pos.y * scale;
    return { sx, sy, scale, groundY };
  }

  // Screen (sx, sy) to World ground (x, z)
  public unproject(sx: number, sy: number): { x: number; z: number } {
    const w = this.screenWidth;
    const h = this.screenHeight;
    const horizonY = h * 0.48;
    const planeTop = horizonY + 80;
    const planeH = Math.max(1, h * 0.42);
    const depthFactor = Math.max(0, Math.min(1, (sy - planeTop) / planeH));
    const z = depthFactor * 360 - 180;
    const scale = 0.85 + depthFactor * 0.45;
    const x = (sx - w / 2) / scale + this.cameraX;
    return { x, z };
  }

  public distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  public resetGame() {
    this.player = this.createInitialPlayer();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.slashLinks = [];
    this.floatingTexts = [];
    this.activeStroke = [];
    this.score = 0;
    this.isWaveClearing = false;
    this.isPaused = false;
    this.startWave(1);
  }

  // --- WAVE CONFIGURATION ---
  public startWave(waveNum: number) {
    this.wave = waveNum;
    this.enemiesKilledInWave = 0;
    this.enemiesSpawnedInWave = 0;
    this.isWaveClearing = false;
    this.spawnTimer = 0.5;

    let title = `第${this.getChineseNumeral(waveNum)}折 · `;
    let count = 5 + waveNum * 3;

    if (waveNum === 1) {
      title += '墨卒突袭';
      count = 5;
    } else if (waveNum === 2) {
      title += '墨弓飞矢';
      count = 7;
    } else if (waveNum === 3) {
      title += '巨力狂墨';
      count = 9;
    } else if (waveNum === 4) {
      title += '暗影无极';
      count = 11;
    } else if (waveNum % 5 === 0) {
      title += '墨煞宗师降临';
      count = 1 + waveNum;
    } else {
      title += '群魔乱舞';
      count = 10 + waveNum * 2;
    }

    this.waveTitle = title;
    this.totalEnemiesInWave = count;
    this.callbacks.onWaveChange(this.wave, this.waveTitle, this.totalEnemiesInWave - this.enemiesKilledInWave);
  }

  private getChineseNumeral(n: number): string {
    const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (n <= 10) return chars[n];
    if (n < 20) return `十${chars[n % 10]}`;
    return `${chars[Math.floor(n / 10)]}十${chars[n % 10] || ''}`;
  }

  private spawnNextEnemy() {
    if (this.enemiesSpawnedInWave >= this.totalEnemiesInWave) return;

    this.enemiesSpawnedInWave++;
    const isBossWave = this.wave % 5 === 0;
    const isBoss = isBossWave && this.enemiesSpawnedInWave === 1;

    let type: EnemyType = 'INK_MINION';
    if (isBoss) {
      type = 'INK_BOSS';
    } else if (this.wave >= 2 && Math.random() < 0.35) {
      type = 'INK_ARCHER';
    } else if (this.wave >= 3 && Math.random() < 0.25) {
      type = 'INK_BRUTE';
    } else if (this.wave >= 4 && Math.random() < 0.3) {
      type = 'SHADOW_NINJA';
    }

    // Spawn from left or right edge of pseudo-3D arena
    const spawnSide = Math.random() > 0.5 ? 1 : -1;
    const spawnX = this.player.pos.x + spawnSide * (this.screenWidth * 0.55 + Math.random() * 80);
    const spawnZ = (Math.random() - 0.5) * 220;

    let hp = 45 + this.wave * 12;
    let damage = 12 + this.wave * 2;
    let scale = 1.0;

    if (type === 'INK_BRUTE') {
      hp = 140 + this.wave * 25;
      damage = 25 + this.wave * 4;
      scale = 1.35;
    } else if (type === 'SHADOW_NINJA') {
      hp = 60 + this.wave * 10;
      damage = 18 + this.wave * 3;
      scale = 0.95;
    } else if (type === 'INK_BOSS') {
      hp = 450 + this.wave * 80;
      damage = 35 + this.wave * 5;
      scale = 1.6;
    }

    const enemy: EnemyEntity = {
      id: Math.random().toString(),
      type,
      name: isBoss ? '墨煞宗师' : type === 'INK_BRUTE' ? '巨力狂墨' : type === 'SHADOW_NINJA' ? '暗影刺客' : type === 'INK_ARCHER' ? '墨羽弓手' : '普通墨卒',
      pos: { x: spawnX, y: 0, z: spawnZ },
      vel: { x: 0, y: 0, z: 0 },
      facing: spawnSide > 0 ? -1 : 1,
      hp,
      maxHp: hp,
      damage,
      state: 'IDLE',
      stateTimer: 0,
      stateDuration: 0,
      attackCooldown: 1.0 + Math.random() * 1.5,
      hitStun: 0,
      isAirborne: false,
      scale,
      isBoss,
    };

    this.enemies.push(enemy);
  }

  // --- CONTROLS & EVENT BINDINGS ---
  private setupEvents() {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;

      // Quick hotkeys for gestures
      if (e.key.toLowerCase() === 'j') {
        this.triggerGestureDirect('TAP');
      } else if (e.key.toLowerCase() === 'u') {
        this.triggerGestureDirect('HORIZONTAL');
      } else if (e.key.toLowerCase() === 'i') {
        this.triggerGestureDirect('VERTICAL_DOWN');
      } else if (e.key.toLowerCase() === 'o') {
        this.triggerGestureDirect('CIRCLE');
      } else if (e.key.toLowerCase() === 'l') {
        this.triggerGestureDirect('ZIGZAG');
      } else if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
        this.triggerJump();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.eventCleanupFns.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    // Multi-touch isolated Canvas Pointer events
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.controlMode === 'FULL_GESTURE') {
        // FULL_GESTURE mode: Entire screen is active calligraphy canvas & slide-to-move
        if (this.drawPointerId === null) {
          this.drawPointerId = e.pointerId;
          this.isDrawingStroke = true;
          this.activeStroke = [{ x, y, t: performance.now() }];
          const worldPos = this.unproject(x, y);
          this.slideTarget = worldPos;
          this.isSlidingMove = true;
          sound.playBrushDraw();
        }
      } else {
        // SPLIT_SCREEN mode: Left half is joystick, right half is calligraphy
        const isLeftHalf = x < this.screenWidth * 0.48;

        if (isLeftHalf) {
          if (this.movePointerId === null) {
            this.movePointerId = e.pointerId;
            this.touchMoveOrigin = { x, y };
            this.touchMoveCurrent = { x, y };
            this.touchMoveActive = true;
            this.moveStartTime = performance.now();
          }
        } else {
          if (this.drawPointerId === null) {
            this.drawPointerId = e.pointerId;
            this.isDrawingStroke = true;
            this.activeStroke = [{ x, y, t: performance.now() }];
            sound.playBrushDraw();
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // STRICT ISOLATION BY POINTER ID:
      // Movement pointer ONLY controls the virtual joystick (X / Z planar movement)
      if (e.pointerId === this.movePointerId) {
        if (this.touchMoveActive && this.touchMoveOrigin) {
          this.touchMoveCurrent = { x, y };
        }
      }
      // Drawing pointer adds brush stroke points and updates slide target
      else if (e.pointerId === this.drawPointerId) {
        if (this.isDrawingStroke) {
          this.activeStroke.push({ x, y, t: performance.now() });
          if (this.controlMode === 'FULL_GESTURE') {
            const worldPos = this.unproject(x, y);
            this.slideTarget = worldPos;
          }
          if (this.activeStroke.length % 4 === 0) {
            sound.playBrushDraw();
          }
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      // Release movement joystick
      if (e.pointerId === this.movePointerId) {
        // Only trigger jump if user performed a distinct, rapid flick-up on release
        if (this.touchMoveOrigin && this.touchMoveCurrent) {
          const dy = this.touchMoveCurrent.y - this.touchMoveOrigin.y;
          const dt = performance.now() - this.moveStartTime;
          if (dy < -45 && dt < 280 && this.player.pos.y === 0) {
            this.triggerJump();
          }
        }

        this.movePointerId = null;
        this.touchMoveActive = false;
        this.touchMoveOrigin = null;
        this.touchMoveCurrent = null;
      }

      // Finalize and recognize calligraphy gesture & arrival attack
      if (e.pointerId === this.drawPointerId) {
        this.drawPointerId = null;
        this.isDrawingStroke = false;
        this.isSlidingMove = false;
        if (this.activeStroke.length > 0) {
          this.finalizeStroke(this.activeStroke);
          this.activeStroke = [];
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      onPointerUp(e);
    };

    const onWindowBlur = () => {
      this.resetTouches();
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onWindowBlur);

    this.eventCleanupFns.push(() => {
      this.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
    });
  }

  public resetTouches() {
    this.movePointerId = null;
    this.drawPointerId = null;
    this.touchMoveActive = false;
    this.touchMoveOrigin = null;
    this.touchMoveCurrent = null;
    this.isDrawingStroke = false;
    this.isSlidingMove = false;
    this.slideTarget = null;
    this.activeStroke = [];
  }

  public triggerJump() {
    if (this.player.pos.y > 2) return;
    this.player.vel.y = 12.5;
    this.player.state = 'JUMP_UP';
    this.player.stateTimer = 0;
    this.player.stateDuration = 0.5;
    sound.playJump();
  }

  private finalizeStroke(points: StrokePoint[]) {
    if (!points || points.length === 0) return;

    const result = GestureRecognizer.recognize(points);
    if (!result) return;

    const pStart = points[0];
    const pEnd = points[points.length - 1];
    const totalDist = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
    const duration = pEnd.t - pStart.t;

    // Detect if this stroke sliced through any enemies on screen
    interface SlicedTarget {
      enemy: EnemyEntity;
      hitIndex: number;
    }
    const slicedTargets: SlicedTarget[] = [];

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const proj = this.project(enemy.pos);
      const targetX = proj.sx;
      const targetY = proj.sy - 28 * proj.scale;
      const targetRadius = 48 * proj.scale * enemy.scale;

      let minHitIdx = -1;

      // Check single-point / short tap directly on target
      if (points.length <= 2 || totalDist < 25) {
        const d = Math.hypot(targetX - pStart.x, targetY - pStart.y);
        if (d <= targetRadius) {
          minHitIdx = 0;
        }
      } else {
        // Multi-point stroke line segments
        for (let i = 1; i < points.length; i++) {
          const d = this.distToSegment(targetX, targetY, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
          if (d <= targetRadius) {
            minHitIdx = i;
            break;
          }
        }
      }

      if (minHitIdx >= 0) {
        slicedTargets.push({ enemy, hitIndex: minHitIdx });
      }
    }

    // Sort sliced targets in the exact chronological order the stroke hit them
    slicedTargets.sort((a, b) => a.hitIndex - b.hitIndex);
    const slicedEnemies = slicedTargets.map((t) => t.enemy);

    // 1. Sliced through one or more enemies: TRIGGER PHANTOM SLICE CHAIN! (划敌瞬杀连击)
    if (slicedEnemies.length > 0) {
      this.callbacks.onGestureRecognized(result);
      sound.playCalligraphyGong(result.name);
      this.executePhantomSliceChain(slicedEnemies, result);
      return;
    }

    // 2. In FULL_GESTURE mode: "滑到哪角色就到哪，到达后自动拔剑释放一次攻击"
    if (this.controlMode === 'FULL_GESTURE') {
      const targetWorld = this.unproject(pEnd.x, pEnd.y);
      this.executeArrivalMovementAndStrike(targetWorld.x, targetWorld.z, result);
      return;
    }

    // 3. Normal gesture release in air (SPLIT_SCREEN mode)
    this.callbacks.onGestureRecognized(result);
    sound.playCalligraphyGong(result.name);
    this.executeGestureMove(result);
  }

  private executePhantomSliceChain(enemies: EnemyEntity[], gesture: GestureResult) {
    const player = this.player;

    // Ink cost
    const inkCost = gesture.type === 'TAP' ? 6 : gesture.type === 'CIRCLE' ? 22 : 15;
    if (player.ink < inkCost) {
      this.addFloatingText('内力不济', player.pos.x, player.pos.y + 60, '#ef4444', 1.2);
      return;
    }
    player.ink = Math.max(0, player.ink - inkCost);
    this.callbacks.onInkChange(player.ink, player.maxInk);

    // Calligraphy banner display
    this.addFloatingText(`${gesture.name} · 瞬华连斩`, player.pos.x, player.pos.y + 70, '#f59e0b', 1.6, true, true);

    // 1. IMMEDIATELY create full chain connecting lines between player and all sliced targets!
    let prevScreen = this.project(player.pos);
    const sealChars = ['斩', '裂', '断', '破', '绝', '煞', '影'];

    enemies.forEach((targetEnemy, i) => {
      const targetScreen = this.project(targetEnemy.pos);
      const sealHanzi = sealChars[i % sealChars.length];
      this.slashLinks.push({
        id: Math.random().toString(),
        from: { x: prevScreen.sx, y: prevScreen.sy - 25 },
        to: { x: targetScreen.sx, y: targetScreen.sy - 25 },
        alpha: 1.0,
        maxAlpha: 1.0,
        color: i % 2 === 0 ? '#b91c1c' : '#38bdf8',
        width: 10,
        hanzi: sealHanzi,
      });
      prevScreen = targetScreen;
    });

    // 2. High-speed consecutive blitz execution through all targets
    const comboPoses: ActionState[] = [
      'ATTACK_THRUST',
      'ATTACK_HORIZONTAL',
      'ATTACK_LAUNCH',
      'ATTACK_VERTICAL',
      'ATTACK_TAICHI',
    ];

    enemies.forEach((enemy, idx) => {
      setTimeout(() => {
        if (enemy.hp <= 0 && idx > 0) return;

        const prevPlayerPos = { ...player.pos };

        // Instant dash adjacent to enemy
        const attackSide = enemy.pos.x > player.pos.x ? -1 : 1;
        player.pos.x = enemy.pos.x + attackSide * 36;
        player.pos.y = enemy.pos.y;
        player.pos.z = enemy.pos.z;
        player.facing = attackSide < 0 ? 1 : -1;

        // Spawn 6 high-fidelity ink afterimages (墨韵残影) along trajectory
        for (let i = 1; i <= 6; i++) {
          const ratio = i / 6;
          const ghostX = prevPlayerPos.x + (player.pos.x - prevPlayerPos.x) * ratio;
          const ghostY = prevPlayerPos.y + (player.pos.y - prevPlayerPos.y) * ratio;
          const ghostZ = prevPlayerPos.z + (player.pos.z - prevPlayerPos.z) * ratio;

          this.dashGhosts.push({
            id: Math.random().toString(),
            x: ghostX,
            y: ghostY,
            z: ghostZ,
            facing: player.facing,
            state: 'ATTACK_DASH',
            stateTimer: 0.1,
            stateDuration: 0.3,
            alpha: 0.85 * ratio,
            maxAlpha: 0.85,
            color: '#1a1917',
          });
        }

        // Set dynamic martial arts animation pose
        player.state = comboPoses[idx % comboPoses.length];
        player.stateTimer = 0;
        player.stateDuration = 0.28;
        player.isInvincible = true;
        player.invincibleTimer = 0.35;

        // Damage calculation
        const baseDmg = 42 * this.getAffixDamageMultiplier() * (1 + idx * 0.35);
        let critChance = 0.3;
        for (const a of player.affixes) {
          if (a.stats.critChanceBonus) critChance += a.stats.critChanceBonus;
        }
        const isCrit = Math.random() < critChance;
        const finalDmg = Math.round(isCrit ? baseDmg * 2.2 : baseDmg);

        this.damageEnemy(enemy, finalDmg, isCrit);

        // Splatter bursts at impact point
        this.spawnInkBurst(enemy.pos, 14, '#171513');
        this.spawnInkBurst(enemy.pos, 8, idx % 2 === 0 ? '#b91c1c' : '#38bdf8');

        // Motion & Impact feedback
        if (player.state === 'ATTACK_LAUNCH') {
          enemy.vel.y = 15;
          enemy.vel.x = player.facing * 5;
        } else if (player.state === 'ATTACK_VERTICAL') {
          enemy.vel.y = 2;
          this.cameraShake = 18;
          this.spawnGroundSlamWave(enemy.pos, player.facing);
        } else {
          enemy.vel.x = player.facing * 12;
          enemy.vel.y = 4;
        }

        this.hitStopTimer = 0.08;
        this.cameraShake = Math.max(this.cameraShake, 12 + idx * 3);
        sound.playHit(isCrit);
        sound.playSlash('heavy');

        player.comboCount += 1;
        player.comboTimer = 3.0;
        this.callbacks.onComboChange(player.comboCount);

        // Lifesteal
        let lifesteal = 0;
        for (const a of player.affixes) {
          if (a.stats.lifestealPercent) lifesteal += a.stats.lifestealPercent;
        }
        if (lifesteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + Math.round(finalDmg * lifesteal));
          this.callbacks.onHpChange(player.hp, player.maxHp);
        }
      }, idx * 85);
    });
  }

  private executeArrivalMovementAndStrike(targetX: number, targetZ: number, gesture?: GestureResult) {
    const player = this.player;

    const finalX = Math.max(-1200, Math.min(1200, targetX));
    const finalZ = Math.max(-130, Math.min(130, targetZ));

    const prevX = player.pos.x;
    const prevZ = player.pos.z;
    const dx = finalX - prevX;
    const dz = finalZ - prevZ;
    const dist = Math.hypot(dx, dz);

    // If moved, leave high-speed martial arts dash ghosts (墨韵残影)
    if (dist > 25) {
      const ghostCount = Math.min(6, Math.max(2, Math.floor(dist / 45)));
      for (let i = 1; i <= ghostCount; i++) {
        const ratio = i / ghostCount;
        this.dashGhosts.push({
          id: Math.random().toString(),
          x: prevX + dx * ratio,
          y: player.pos.y,
          z: prevZ + dz * ratio,
          facing: dx >= 0 ? 1 : -1,
          state: 'ATTACK_DASH',
          stateTimer: 0.1,
          stateDuration: 0.25,
          alpha: 0.85 * ratio,
          maxAlpha: 0.85,
          color: '#1a1917',
        });
      }
    }

    // Move to arrival point
    player.pos.x = finalX;
    player.pos.z = finalZ;
    if (Math.abs(dx) > 8) {
      player.facing = dx >= 0 ? 1 : -1;
    }
    this.slideTarget = null;

    // Airborne plunge slam
    const isAirborne = player.pos.y > 5;
    if (isAirborne) {
      player.pos.y = 0;
      player.vel.y = 0;
      this.cameraShake = 16;
      this.spawnGroundSlamWave(player.pos, player.facing);
      this.addFloatingText('千斤坠 · 震岳', player.pos.x, player.pos.y + 65, '#f59e0b', 1.45, true);
    }

    // Check if there are enemies nearby within auto-target attack range (~175px)
    let nearestEnemy: EnemyEntity | null = null;
    let minEnemyDist = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const edx = enemy.pos.x - player.pos.x;
      const edz = enemy.pos.z - player.pos.z;
      const ed = Math.hypot(edx, edz);
      if (ed < 175 && ed < minEnemyDist) {
        minEnemyDist = ed;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy) {
      player.facing = nearestEnemy.pos.x >= player.pos.x ? 1 : -1;
    }

    // Automatically unleash arrival strike
    const attackStances: ActionState[] = ['ATTACK_HORIZONTAL', 'ATTACK_THRUST', 'ATTACK_DASH'];
    const chosenPose = isAirborne
      ? 'ATTACK_VERTICAL'
      : gesture && gesture.type === 'VERTICAL_DOWN'
      ? 'ATTACK_VERTICAL'
      : gesture && gesture.type === 'CIRCLE'
      ? 'ATTACK_TAICHI'
      : gesture && gesture.type === 'DIAGONAL_UP'
      ? 'ATTACK_LAUNCH'
      : attackStances[Math.floor(Math.random() * attackStances.length)];

    player.state = chosenPose;
    player.stateTimer = 0;
    player.stateDuration = 0.32;
    player.isInvincible = true;
    player.invincibleTimer = 0.35;

    sound.playSlash('heavy');
    this.spawnInkBurst(player.pos, 14, '#181513');

    // Execute Arrival Strike Hitbox (with Hit-Stun)
    this.performHitCheck({
      rangeX: 155,
      rangeZ: 65,
      damageMultiplier: isAirborne ? 2.0 : 1.6,
      knockbackX: player.facing * 10,
      knockbackY: chosenPose === 'ATTACK_LAUNCH' ? 14 : isAirborne ? 1 : 2,
    });

    if (gesture && gesture.type !== 'TAP') {
      this.callbacks.onGestureRecognized(gesture);
      this.addFloatingText(`${gesture.name} · 破空斩`, player.pos.x, player.pos.y + 55, '#f59e0b', 1.35, true);
    } else if (isAirborne) {
      this.addFloatingText('踏云斩', player.pos.x, player.pos.y + 55, '#e0e7ff', 1.25);
    } else {
      this.addFloatingText(nearestEnemy ? '疾风斩' : '踏雪破空', player.pos.x, player.pos.y + 45, '#38bdf8', 1.15);
    }
  }

  private handleGroundStep(screenX: number, screenY: number) {
    const target = this.unproject(screenX, screenY);
    this.executeArrivalMovementAndStrike(target.x, target.z);
  }

  public triggerGestureDirect(type: 'TAP' | 'HORIZONTAL' | 'VERTICAL_DOWN' | 'DIAGONAL_UP' | 'CIRCLE' | 'ZIGZAG') {
    const dummyPoints: StrokePoint[] = [
      { x: 0, y: 0, t: 0 },
      { x: 50, y: 50, t: 100 },
    ];
    let name = '墨刺连击';
    let hanzi = '刺';
    let desc = '疾速突刺，破招连击';

    if (type === 'HORIZONTAL') {
      name = '横扫千军';
      hanzi = '横';
      desc = '挥墨千钧，破浪剑气横扫前方群敌';
    } else if (type === 'VERTICAL_DOWN') {
      name = '力劈华山';
      hanzi = '劈';
      desc = '凌空重劈，震撼大地激起墨涌地刺';
    } else if (type === 'DIAGONAL_UP') {
      name = '飞燕凌空';
      hanzi = '挑';
      desc = '墨锋挑空，击飞目标实现凌空追击';
    } else if (type === 'CIRCLE') {
      name = '浑元太极';
      hanzi = '圆';
      desc = '墨劲圆转，八卦护体并震退群敌';
    } else if (type === 'ZIGZAG') {
      name = '踏影瞬杀';
      hanzi = '闪';
      desc = '残影穿梭，瞬身斩敌留下水墨裂痕';
    }

    const result: GestureResult = {
      type,
      name,
      hanzi,
      desc,
      confidence: 1.0,
      points: dummyPoints,
    };

    this.callbacks.onGestureRecognized(result);
    sound.playCalligraphyGong(result.name);
    this.executeGestureMove(result);
  }

  private executeGestureMove(res: GestureResult) {
    const player = this.player;

    // Check ink cost
    const inkCost = res.type === 'TAP' ? 8 : res.type === 'CIRCLE' ? 25 : 18;
    if (player.ink < inkCost) {
      this.addFloatingText('内力不济', player.pos.x, player.pos.y + 60, '#ef4444', 1.2);
      return;
    }
    player.ink = Math.max(0, player.ink - inkCost);
    this.callbacks.onInkChange(player.ink, player.maxInk);

    // Calligraphy banner display above player
    this.addFloatingText(res.name, player.pos.x, player.pos.y + 70, '#f59e0b', 1.4, true, true);

    // Thunder affix check
    const hasThunder = player.affixes.some((a) => a.stats.thunderStrike);
    if (hasThunder && this.enemies.length > 0) {
      const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      this.createLightningStrike(target);
    }

    switch (res.type) {
      case 'TAP': {
        player.state = 'ATTACK_THRUST';
        player.stateTimer = 0;
        player.stateDuration = 0.22;
        player.vel.x = player.facing * 4;
        sound.playSlash('light');
        this.performHitCheck({
          rangeX: 85,
          rangeZ: 35,
          damageMultiplier: 1.0,
          knockbackX: player.facing * 5,
          knockbackY: 2,
        });
        break;
      }

      case 'HORIZONTAL': {
        player.state = 'ATTACK_HORIZONTAL';
        player.stateTimer = 0;
        player.stateDuration = 0.35;
        player.vel.x = player.facing * 7;
        sound.playSlash('heavy');
        this.cameraShake = 7;

        this.performHitCheck({
          rangeX: 135,
          rangeZ: 50,
          damageMultiplier: 1.6,
          knockbackX: player.facing * 12,
          knockbackY: 3,
        });

        // Blade Qi affix check
        const hasSwordBeam = player.affixes.some((a) => a.stats.swordBeamEnabled);
        if (hasSwordBeam || Math.random() < 0.5) {
          this.shootProjectile({
            pos: { x: player.pos.x + player.facing * 35, y: player.pos.y + 20, z: player.pos.z },
            vel: { x: player.facing * 15, y: 0, z: 0 },
            damage: 28 * this.getAffixDamageMultiplier(),
            isPlayer: true,
            life: 0.9,
            maxLife: 0.9,
            type: 'SWORD_BEAM',
            radius: 40,
          });
        }
        break;
      }

      case 'VERTICAL_DOWN': {
        player.state = 'ATTACK_VERTICAL';
        player.stateTimer = 0;
        player.stateDuration = 0.42;
        sound.playSlash('heavy');
        this.cameraShake = 12;

        // Ground slam shockwave
        setTimeout(() => {
          sound.playHit(true);
          this.spawnGroundSlamWave(player.pos, player.facing);
          this.performHitCheck({
            rangeX: 110,
            rangeZ: 60,
            damageMultiplier: 2.2,
            knockbackX: player.facing * 8,
            knockbackY: 9,
          });
        }, 120);
        break;
      }

      case 'DIAGONAL_UP': {
        player.state = 'ATTACK_LAUNCH';
        player.stateTimer = 0;
        player.stateDuration = 0.32;
        player.vel.y = 8;
        player.vel.x = player.facing * 4;
        sound.playSlash('light');

        this.performHitCheck({
          rangeX: 95,
          rangeZ: 40,
          damageMultiplier: 1.4,
          knockbackX: player.facing * 4,
          knockbackY: 13, // High aerial launch!
        });
        break;
      }

      case 'CIRCLE': {
        player.state = 'ATTACK_TAICHI';
        player.stateTimer = 0;
        player.stateDuration = 0.5;
        player.isInvincible = true;
        player.invincibleTimer = 0.5;
        sound.playSlash('whirlwind');
        this.cameraShake = 9;

        // Deflect projectiles & push away all surrounding foes
        this.projectiles = this.projectiles.filter((p) => {
          if (!p.isPlayer && Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z) < 140) {
            this.addFloatingText('太极借力', p.pos.x, p.pos.y + 30, '#38bdf8', 1.0);
            return false;
          }
          return true;
        });

        // 360-degree knockback
        for (const enemy of this.enemies) {
          const dx = enemy.pos.x - player.pos.x;
          const dz = enemy.pos.z - player.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 130) {
            const angle = Math.atan2(dz, dx);
            enemy.vel.x = Math.cos(angle) * 14;
            enemy.vel.z = Math.sin(angle) * 8;
            enemy.vel.y = 5;
            this.damageEnemy(enemy, 35 * this.getAffixDamageMultiplier(), true);
          }
        }
        break;
      }

      case 'ZIGZAG': {
        player.state = 'ATTACK_DASH';
        player.stateTimer = 0;
        player.stateDuration = 0.3;
        player.isInvincible = true;
        player.invincibleTimer = 0.35;
        sound.playDash();

        // Dash forward rapidly piercing enemies
        const dashDistance = player.facing * 220;
        const targetX = player.pos.x + dashDistance;

        // Record dash trail afterimages
        for (let i = 0; i < 4; i++) {
          player.dashTrail.push({
            x: player.pos.x + (dashDistance * i) / 4,
            y: player.pos.y,
            z: player.pos.z,
          });
        }

        player.pos.x = targetX;
        this.cameraShake = 8;

        this.performHitCheck({
          rangeX: 200,
          rangeZ: 50,
          damageMultiplier: 2.0,
          knockbackX: player.facing * 6,
          knockbackY: 4,
        });

        // Phantom chain affix check
        const hasPhantomChain = player.affixes.some((a) => a.stats.flashCooldownReset);
        if (hasPhantomChain) {
          player.ink = Math.min(player.maxInk, player.ink + 18);
        }
        break;
      }
    }
  }

  private getAffixDamageMultiplier(): number {
    let mult = 1.0;
    for (const affix of this.player.affixes) {
      if (affix.stats.attackBonus) {
        mult += affix.stats.attackBonus / 100;
      }
    }
    return mult;
  }

  private performHitCheck(opts: {
    rangeX: number;
    rangeZ: number;
    damageMultiplier: number;
    knockbackX: number;
    knockbackY: number;
  }) {
    const player = this.player;
    let hitCount = 0;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = (enemy.pos.x - player.pos.x) * player.facing;
      const dz = Math.abs(enemy.pos.z - player.pos.z);
      const dy = Math.abs(enemy.pos.y - player.pos.y);

      // Hitbox is ahead of player in facing direction, within Z depth and Y height
      if (dx > -20 && dx < opts.rangeX && dz < opts.rangeZ && dy < 45) {
        hitCount++;
        enemy.vel.x = opts.knockbackX;
        enemy.vel.y = opts.knockbackY;

        // Base damage formula
        const baseDmg = 24 * opts.damageMultiplier * this.getAffixDamageMultiplier();

        // Crit check
        let critChance = 0.15;
        for (const a of player.affixes) {
          if (a.stats.critChanceBonus) critChance += a.stats.critChanceBonus;
        }
        const isCrit = Math.random() < critChance;
        const finalDmg = Math.round(isCrit ? baseDmg * 1.85 : baseDmg);

        this.damageEnemy(enemy, finalDmg, isCrit, 0.48);

        // Lifesteal affix
        let lifesteal = 0;
        for (const a of player.affixes) {
          if (a.stats.lifestealPercent) lifesteal += a.stats.lifestealPercent;
        }
        if (lifesteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + Math.round(finalDmg * lifesteal));
          this.callbacks.onHpChange(player.hp, player.maxHp);
        }
      }
    }

    if (hitCount > 0) {
      // Hit-stop impact freeze
      this.hitStopTimer = 0.055;
      sound.playHit(false);

      const prevCombo = player.comboCount;
      player.comboCount += hitCount;
      player.comboTimer = 2.8;
      this.callbacks.onComboChange(player.comboCount);

      // Check combo milestones
      const milestones: [number, string][] = [
        [50, '无双剑神'],
        [35, '人剑合一'],
        [20, '剑气纵横'],
        [10, '势如破竹'],
        [5, '连斩 · 五合'],
      ];
      for (const [threshold, title] of milestones) {
        if (prevCombo < threshold && player.comboCount >= threshold) {
          this.addFloatingText(title, player.pos.x, player.pos.y + 75, '#fbbf24', 1.6, true, true);
          sound.playCalligraphyGong(title);
          break;
        }
      }
    }
  }

  private damageEnemy(enemy: EnemyEntity, damage: number, isCrit: boolean = false, stunOverride?: number) {
    enemy.hp -= damage;

    // Hit-Stun Mechanism (敌人受击硬直机制):
    // 1. Interrupt active windup/charging
    // 2. Lock in HURT flinch posture
    // 3. Reset attack cooldown to prevent immediate revenge strikes
    // 4. Stagger recoil velocity
    // 5. Boss tenacity
    const baseStun = stunOverride ?? (isCrit ? 0.75 : 0.45);
    const hitStunTime = enemy.isBoss ? (isCrit ? baseStun * 0.8 : baseStun * 0.55) : baseStun;
    enemy.hitStun = Math.max(enemy.hitStun, hitStunTime);
    enemy.maxHitStun = enemy.hitStun;
    enemy.state = 'HURT';
    enemy.stateTimer = 0;
    enemy.stateDuration = enemy.hitStun;

    // Reset enemy attack cooldown with an extra buffer
    enemy.attackCooldown = Math.max(enemy.attackCooldown, (enemy.isBoss ? 0.75 : 1.05) + Math.random() * 0.4);

    // Stagger knockback direction
    const recoilDir = enemy.pos.x >= this.player.pos.x ? 1 : -1;
    const recoilPower = enemy.isBoss ? (isCrit ? 5.0 : 3.0) : isCrit ? 9.5 : 5.5;
    enemy.vel.x = recoilDir * recoilPower;
    enemy.vel.z = (Math.random() - 0.5) * 2;

    // Ink splatter particles
    this.spawnInkBurst(enemy.pos, 12, '#181412');
    if (isCrit) {
      this.spawnInkBurst(enemy.pos, 8, '#b91c1c'); // Cinnabar crit ink
      this.addFloatingText('『破势』', enemy.pos.x, enemy.pos.y + 60, '#ef4444', 1.35, true);
    } else if (enemy.hitStun > 0.5) {
      this.addFloatingText('『僵直』', enemy.pos.x, enemy.pos.y + 55, '#f59e0b', 1.15);
    }

    // Floating damage numbers in classical Chinese style
    const dmgText = isCrit ? `暴击 · ${damage}` : `${damage}`;
    this.addFloatingText(dmgText, enemy.pos.x, enemy.pos.y + 40, isCrit ? '#dc2626' : '#f5f5f4', isCrit ? 1.4 : 1.0, isCrit);

    // Frost slow affix check
    const hasFrost = this.player.affixes.some((a) => a.stats.frostSlow);
    if (hasFrost) {
      this.spawnInkBurst(enemy.pos, 5, '#38bdf8');
    }

    // Enemy Death
    if (enemy.hp <= 0) {
      enemy.state = 'DEAD';
      this.enemiesKilledInWave++;
      this.score += enemy.isBoss ? 500 : 100;
      this.spawnInkBurst(enemy.pos, 25, '#0a0a0a');
      this.callbacks.onWaveChange(this.wave, this.waveTitle, Math.max(0, this.totalEnemiesInWave - this.enemiesKilledInWave));

      // Ink recover on kill
      this.player.ink = Math.min(this.player.maxInk, this.player.ink + 15);
      this.callbacks.onInkChange(this.player.ink, this.player.maxInk);
    }
  }

  private shootProjectile(proj: Omit<Projectile, 'id'>) {
    const fullProj: Projectile = {
      ...proj,
      id: Math.random().toString(),
    };
    this.projectiles.push(fullProj);
  }

  private spawnGroundSlamWave(pos: Vec3, facing: 1 | -1) {
    const hasThousandJin = this.player.affixes.some((a) => a.stats.thunderStrike || a.id === 'thousand_jin');
    const waveCount = hasThousandJin ? 3 : 1;

    for (let i = 0; i < waveCount; i++) {
      setTimeout(() => {
        this.shootProjectile({
          pos: { x: pos.x + facing * (30 + i * 45), y: 0, z: pos.z },
          vel: { x: facing * 12, y: 0, z: 0 },
          damage: 35 * this.getAffixDamageMultiplier(),
          isPlayer: true,
          life: 0.65,
          maxLife: 0.65,
          type: 'INK_SHOCKWAVE',
          radius: 35 + i * 8,
        });
      }, i * 90);
    }
  }

  private createLightningStrike(target: EnemyEntity) {
    this.shootProjectile({
      pos: { x: target.pos.x, y: 120, z: target.pos.z },
      vel: { x: 0, y: -25, z: 0 },
      damage: 40 * this.getAffixDamageMultiplier(),
      isPlayer: true,
      life: 0.35,
      maxLife: 0.35,
      type: 'LIGHTNING',
      radius: 40,
    });
    this.addFloatingText('天降惊雷', target.pos.x, target.pos.y + 60, '#38bdf8', 1.3);
  }

  private spawnInkBurst(pos: Vec3, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x: pos.x,
        y: pos.y + 20 + (Math.random() - 0.5) * 20,
        z: pos.z + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() * 6 - 2),
        vz: Math.sin(angle) * (speed * 0.4),
        size: 3 + Math.random() * 7,
        alpha: 0.9,
        decay: 0.02 + Math.random() * 0.03,
        color,
      });
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string, scale: number = 1.0, isCrit: boolean = false, isGesture: boolean = false) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale,
      isCrit,
      isGesture,
    });
  }

  // --- GAME LOOP ---
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (!this.isPaused) {
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const player = this.player;

    // Screen shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 25);
    }

    // Passive Ink Energy Regen
    let regenMult = 1.0;
    for (const a of player.affixes) {
      if (a.stats.inkRegenBonus) regenMult += a.stats.inkRegenBonus / 100;
    }
    player.ink = Math.min(player.maxInk, player.ink + dt * 14 * regenMult);
    this.callbacks.onInkChange(player.ink, player.maxInk);

    // Combo timer decay
    if (player.comboTimer > 0) {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0) {
        player.comboCount = 0;
        this.callbacks.onComboChange(0);
      }
    }

    // Invincibility decay
    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= dt;
      if (player.invincibleTimer <= 0) {
        player.isInvincible = false;
      }
    }

    // Dash trail decay
    if (player.dashTrail.length > 0 && Math.random() < 0.2) {
      player.dashTrail.shift();
    }

    // Ribbon wave animation
    player.ribbonWave += dt * 8;

    // --- PLAYER MOVEMENT & INPUT HANDLING ---
    let moveX = 0;
    let moveZ = 0;

    // Keyboard movement
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;

    // Touch stick movement (Left half of screen)
    if (this.touchMoveActive && this.touchMoveOrigin && this.touchMoveCurrent) {
      const tdx = this.touchMoveCurrent.x - this.touchMoveOrigin.x;
      const tdy = this.touchMoveCurrent.y - this.touchMoveOrigin.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 12) {
        moveX = tdx / dist;
        // Map Y drag to pseudo-3D Z depth
        moveZ = tdy / dist;
      }
    }

    // Normalize diagonal movement
    const moveLen = Math.hypot(moveX, moveZ);
    if (moveLen > 1) {
      moveX /= moveLen;
      moveZ /= moveLen;
    }

    let moveSpeed = 190;
    for (const a of player.affixes) {
      if (a.stats.moveSpeedBonus) moveSpeed += (190 * a.stats.moveSpeedBonus) / 100;
    }

    // Can only freely walk when not locked in heavy attack animation
    const isAttacking =
      player.state === 'ATTACK_HORIZONTAL' ||
      player.state === 'ATTACK_VERTICAL' ||
      player.state === 'ATTACK_TAICHI' ||
      player.state === 'ATTACK_DASH';

    if (!isAttacking && player.state !== 'HURT' && player.state !== 'DEAD') {
      // 1. Real-time Finger Slide Movement in FULL_GESTURE mode (跟手移动: 滑到哪角色就到哪)
      if (this.controlMode === 'FULL_GESTURE' && this.slideTarget) {
        const sdx = this.slideTarget.x - player.pos.x;
        const sdz = this.slideTarget.z - player.pos.z;
        const sDist = Math.hypot(sdx, sdz);
        if (sDist > 6) {
          const slideSpeed = Math.max(moveSpeed * 2.2, sDist * 9.5);
          const step = Math.min(sDist, slideSpeed * dt);
          player.pos.x += (sdx / sDist) * step;
          player.pos.z += (sdz / sDist) * step;
          if (Math.abs(sdx) > 4) {
            player.facing = sdx >= 0 ? 1 : -1;
          }
          if (player.pos.y === 0) {
            player.state = 'RUN';
            this.walkCycle += dt * 18;
          }
          if (Math.random() < 0.25) {
            this.spawnInkBurst(player.pos, 2, '#44403c');
          }
        }
      }
      // 2. Keyboard & Virtual Joystick Movement
      else if (moveLen > 0.1) {
        player.pos.x += moveX * moveSpeed * dt;
        player.pos.z += moveZ * moveSpeed * 0.7 * dt;

        // Facing direction
        if (moveX > 0.05) player.facing = 1;
        else if (moveX < -0.05) player.facing = -1;

        if (player.pos.y === 0) {
          player.state = 'RUN';
          this.walkCycle += dt * 14;
        }
      } else if (player.pos.y === 0) {
        player.state = 'IDLE';
        this.walkCycle += dt * 3;
      }
    }

    // Jump / Gravity Physics
    if (player.pos.y > 0 || player.vel.y !== 0) {
      player.pos.y += player.vel.y;
      player.vel.y -= 0.65; // gravity

      if (player.pos.y <= 0) {
        player.pos.y = 0;
        player.vel.y = 0;
        if (player.state === 'FALL' || player.state === 'JUMP_UP') {
          player.state = 'IDLE';
          this.spawnInkBurst(player.pos, 6, '#44403c');
        }
      } else if (player.vel.y < 0 && player.state === 'JUMP_UP') {
        player.state = 'FALL';
      }
    }

    // Boundary constraints for Pseudo-3D Arena
    player.pos.z = Math.max(-130, Math.min(130, player.pos.z));
    player.pos.x = Math.max(-1200, Math.min(1200, player.pos.x));

    // Smooth camera tracking
    const targetCamX = player.pos.x;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;

    // State timer countdown
    if (player.stateTimer < player.stateDuration) {
      player.stateTimer += dt;
      if (player.stateTimer >= player.stateDuration) {
        if (player.state !== 'DEAD') {
          player.state = player.pos.y > 0 ? 'FALL' : 'IDLE';
        }
      }
    }

    // --- ENEMY SPAWNER & WAVE LOGIC ---
    if (this.enemiesSpawnedInWave < this.totalEnemiesInWave) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnNextEnemy();
        this.spawnTimer = 1.8 + Math.random() * 1.5;
      }
    } else if (this.enemies.every((e) => e.hp <= 0) && !this.isWaveClearing) {
      // Wave Cleared!
      this.isWaveClearing = true;
      sound.playCalligraphyGong('圆');
      this.addFloatingText('功成圆满', player.pos.x, player.pos.y + 80, '#f59e0b', 1.8, true, true);

      // Trigger Roguelike 3-card pick
      setTimeout(() => {
        const choices = drawRandomAffixes(player.affixes, 3);
        this.callbacks.onWaveCleared(choices);
      }, 1000);
    }

    // --- ENEMY AI & UPDATE ---
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      // Enemy gravity
      if (enemy.pos.y > 0 || enemy.vel.y !== 0) {
        enemy.pos.y += enemy.vel.y;
        enemy.vel.y -= 0.65;
        if (enemy.pos.y <= 0) {
          enemy.pos.y = 0;
          enemy.vel.y = 0;
        }
      }

      // Enemy velocity damping & knockback recoil
      enemy.pos.x += enemy.vel.x;
      enemy.pos.z += enemy.vel.z;
      enemy.vel.x *= 0.88;
      enemy.vel.z *= 0.88;

      // Hit stun check (recoil motion runs, but enemy cannot move or attack while stunned)
      if (enemy.hitStun > 0) {
        enemy.hitStun -= dt;
        enemy.state = 'HURT';
        enemy.stateTimer += dt;
        if (enemy.hitStun <= 0) {
          enemy.state = 'IDLE';
        }
        continue;
      }

      // Attack cooldown
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= dt;
      }

      // Face player
      enemy.facing = enemy.pos.x < player.pos.x ? 1 : -1;

      const dx = player.pos.x - enemy.pos.x;
      const dz = player.pos.z - enemy.pos.z;
      const dist = Math.hypot(dx, dz);

      // AI Archetypes
      if (enemy.type === 'INK_ARCHER') {
        // Keep distance and shoot arrows
        const idealDist = 260;
        if (dist < idealDist - 30) {
          enemy.pos.x -= (dx / dist) * 70 * dt;
          enemy.pos.z -= (dz / dist) * 50 * dt;
        } else if (dist > idealDist + 40) {
          enemy.pos.x += (dx / dist) * 80 * dt;
          enemy.pos.z += (dz / dist) * 60 * dt;
        }

        if (enemy.attackCooldown <= 0 && Math.abs(dz) < 40) {
          enemy.attackCooldown = 2.4 + Math.random() * 0.8;
          enemy.state = 'ATTACK_THRUST';
          enemy.stateDuration = 0.3;
          enemy.stateTimer = 0;
          this.shootProjectile({
            pos: { x: enemy.pos.x + enemy.facing * 20, y: enemy.pos.y + 15, z: enemy.pos.z },
            vel: { x: enemy.facing * 10, y: 0, z: 0 },
            damage: enemy.damage,
            isPlayer: false,
            life: 2.0,
            maxLife: 2.0,
            type: 'INK_ARROW',
            radius: 15,
          });
        }
      } else {
        // Melee pursue (Minion, Brute, Ninja, Boss)
        let speed = enemy.type === 'SHADOW_NINJA' ? 140 : enemy.type === 'INK_BRUTE' ? 85 : 110;
        if (enemy.isBoss) speed = 120;

        // Follow player along X and Z
        if (dist > 50) {
          enemy.pos.x += (dx / dist) * speed * dt;
          enemy.pos.z += (dz / dist) * speed * 0.6 * dt;
          enemy.state = 'RUN';
        } else {
          enemy.state = 'IDLE';
        }

        // Melee attack trigger
        if (dist < 65 && Math.abs(dz) < 30 && enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.type === 'SHADOW_NINJA' ? 1.2 : 2.0;
          enemy.state = 'ATTACK_HORIZONTAL';
          enemy.stateDuration = 0.35;
          enemy.stateTimer = 0;

          // Hurt player if not invincible
          setTimeout(() => {
            const curDist = Math.hypot(player.pos.x - enemy.pos.x, player.pos.z - enemy.pos.z);
            if (curDist < 75 && !player.isInvincible && player.hp > 0) {
              this.hurtPlayer(enemy.damage, enemy.facing);
            }
          }, 180);
        }
      }
    }

    // Clean up dead enemies
    this.enemies = this.enemies.filter((e) => e.hp > 0 || (e.state === 'DEAD' && e.stateTimer < 0.8));

    // --- PROJECTILES UPDATE ---
    for (const p of this.projectiles) {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.pos.z += p.vel.z;
      p.life -= dt;

      // Check collision
      if (p.isPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.pos.x - p.pos.x, enemy.pos.z - p.pos.z);
          if (dist < p.radius && Math.abs(enemy.pos.y - p.pos.y) < 35) {
            this.damageEnemy(enemy, p.damage, true);
            p.life = 0; // Destroy projectile on impact
            sound.playHit(true);
            break;
          }
        }
      } else {
        // Enemy projectile hits player
        const dist = Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z);
        if (dist < p.radius && Math.abs(player.pos.y - p.pos.y) < 35 && !player.isInvincible) {
          this.hurtPlayer(p.damage, p.vel.x > 0 ? 1 : -1);
          p.life = 0;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);

    // --- PARTICLES UPDATE ---
    for (const part of this.particles) {
      part.x += part.vx;
      part.y += part.vy;
      part.z += part.vz;
      part.vy -= 0.25; // gravity on droplets
      part.alpha -= part.decay;
    }
    this.particles = this.particles.filter((p) => p.alpha > 0);

    // --- FLOATING TEXTS UPDATE ---
    for (const ft of this.floatingTexts) {
      ft.y += 0.8;
      ft.alpha -= 0.016;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.alpha > 0);

    // --- SLASH LINKS CONNECTION VFX UPDATE ---
    for (const link of this.slashLinks) {
      link.alpha -= dt * 2.2;
    }
    this.slashLinks = this.slashLinks.filter((l) => l.alpha > 0);

    // --- DASH GHOSTS UPDATE ---
    for (const ghost of this.dashGhosts) {
      ghost.alpha -= dt * 3.2;
    }
    this.dashGhosts = this.dashGhosts.filter((g) => g.alpha > 0);

    // Trim player dashTrail
    if (this.player.dashTrail.length > 8) {
      this.player.dashTrail.splice(0, this.player.dashTrail.length - 8);
    }
  }

  private hurtPlayer(amount: number, fromFacing: 1 | -1) {
    const player = this.player;
    if (player.isInvincible || player.hp <= 0) return;

    let dmgRed = 0;
    for (const a of player.affixes) {
      if (a.stats.damageReduction) dmgRed += a.stats.damageReduction;
    }
    const finalDmg = Math.max(1, Math.round(amount * (1 - dmgRed / 100)));

    player.hp = Math.max(0, player.hp - finalDmg);
    this.callbacks.onHpChange(player.hp, player.maxHp);
    this.addFloatingText(`-${finalDmg}`, player.pos.x, player.pos.y + 40, '#ef4444', 1.2);

    player.state = 'HURT';
    player.stateTimer = 0;
    player.stateDuration = 0.25;
    player.vel.x = fromFacing * 8;
    player.isInvincible = true;
    player.invincibleTimer = 0.65;
    this.cameraShake = 10;
    sound.playHit(false);

    if (player.hp <= 0) {
      player.state = 'DEAD';
      this.callbacks.onGameOver(this.score, this.wave, false);
    }
  }

  // --- RENDERING & PSEUDO-3D PROJECTION ---
  private render() {
    const ctx = this.ctx;
    const w = this.screenWidth;
    const h = this.screenHeight;

    ctx.clearRect(0, 0, w, h);

    // Camera shake offset
    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Draw Traditional Chinese Ink Wash Backdrop
    this.renderBackground(ctx, w, h);

    // 2. Horizon & Ground Plane with Ink Wash Stepping Grid
    const horizonY = h * 0.48;
    this.renderGround(ctx, w, h, horizonY);

    // 3. Project & Sort Entities along Pseudo-3D Z depth
    // Project world coordinates (X, Y, Z) to Screen Coordinates (sx, sy, scale)
    const project = (pos: Vec3) => {
      // Perspective scale factor based on depth Z
      // Higher Z is closer to screen; lower Z is farther into mountain distance
      const depthFactor = (pos.z + 180) / 360; // 0 (far) to 1 (near)
      const scale = 0.85 + depthFactor * 0.45;
      const sx = (pos.x - this.cameraX) * scale + w / 2;
      const groundY = horizonY + 80 + depthFactor * (h * 0.42);
      const sy = groundY - pos.y * scale;
      return { sx, sy, scale, groundY };
    };

    // Gather all renderable elements for Z-sorting
    interface Renderable {
      z: number;
      draw: () => void;
    }
    const renderQueue: Renderable[] = [];

    // Sliding arrival indicator on ground (指引光晕)
    if (this.controlMode === 'FULL_GESTURE' && this.slideTarget && this.isSlidingMove) {
      const targetPos = { ...this.slideTarget };
      renderQueue.push({
        z: targetPos.z,
        draw: () => {
          const { sx, groundY, scale } = project({ x: targetPos.x, y: 0, z: targetPos.z });
          const pulse = (Math.sin(performance.now() * 0.012) + 1) * 0.5;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(sx, groundY, 22 * scale + pulse * 5, 8 * scale + pulse * 2, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, groundY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.restore();
        },
      });
    }

    // Player Shadow & Skeleton
    renderQueue.push({
      z: this.player.pos.z,
      draw: () => {
        const { sx, sy, scale, groundY } = project(this.player.pos);

        // Ground shadow (ink puddle ellipse)
        this.renderShadow(ctx, sx, groundY, scale, this.player.pos.y);

        // Dash trail afterimages
        for (let i = 0; i < this.player.dashTrail.length; i++) {
          const tPos = this.player.dashTrail[i];
          const tProj = project(tPos);
          const tPose = StickmanSkeleton.getPose('ATTACK_DASH', 0.2, 0.3, 0);
          StickmanSkeleton.render(ctx, tProj.sx, tProj.sy, tProj.scale, this.player.facing, tPose, {
            isPlayer: true,
            inkAlpha: 0.15 + (i / this.player.dashTrail.length) * 0.25,
          });
        }

        // Main Player Stickman
        const pose = StickmanSkeleton.getPose(
          this.player.state,
          this.player.stateTimer,
          this.player.stateDuration,
          this.walkCycle
        );

        // Invincibility flashing
        const alpha = this.player.isInvincible && Math.floor(performance.now() / 80) % 2 === 0 ? 0.35 : 1.0;
        const isAttacking = this.player.state.startsWith('ATTACK_');

        StickmanSkeleton.render(ctx, sx, sy, scale, this.player.facing, pose, {
          isPlayer: true,
          inkAlpha: alpha,
          ribbonPhase: this.player.ribbonWave,
          isAttacking,
        });
      },
    });

    // High-speed Martial Arts Dash Ghosts (水墨残影)
    for (const ghost of this.dashGhosts) {
      renderQueue.push({
        z: ghost.z,
        draw: () => {
          const { sx, sy, scale, groundY } = project({ x: ghost.x, y: ghost.y, z: ghost.z });
          this.renderShadow(ctx, sx, groundY, scale, ghost.y);
          const pose = StickmanSkeleton.getPose(ghost.state, ghost.stateTimer, ghost.stateDuration, 0);
          StickmanSkeleton.render(ctx, sx, sy, scale, ghost.facing, pose, {
            isPlayer: true,
            inkAlpha: ghost.alpha * 0.45,
          });
        },
      });
    }

    // Enemies
    for (const enemy of this.enemies) {
      renderQueue.push({
        z: enemy.pos.z,
        draw: () => {
          const { sx, sy, scale, groundY } = project(enemy.pos);
          const finalScale = scale * enemy.scale;

          let renderSx = sx;
          let renderSy = sy;

          // Hit-Stun Tremble & Stagger Indicator (受击硬直震颤特效)
          if (enemy.hitStun > 0 && enemy.hp > 0) {
            const tremor = Math.sin(performance.now() * 0.08) * 3.5;
            renderSx += tremor;
          }

          this.renderShadow(ctx, sx, groundY, finalScale, enemy.pos.y);

          const pose = StickmanSkeleton.getPose(enemy.state, enemy.stateTimer, enemy.stateDuration, performance.now() * 0.008);
          StickmanSkeleton.render(ctx, renderSx, renderSy, finalScale, enemy.facing, pose, {
            isPlayer: false,
            enemyType: enemy.type,
            inkAlpha: enemy.state === 'DEAD' ? 0.3 : 1.0,
          });

          // Draw Stun Crack Mark above head when staggered
          if (enemy.hitStun > 0 && enemy.hp > 0) {
            ctx.save();
            ctx.font = `bold ${Math.round(13 * finalScale)}px 'Ma Shan Zheng', cursive`;
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.fillText('⚡破势', renderSx, renderSy - 80 * finalScale);
            ctx.restore();
          }

          // Floating Health Bar for Enemies
          if (enemy.hp < enemy.maxHp && enemy.hp > 0) {
            const barW = 34 * finalScale;
            const barH = 3.5;
            const barX = sx - barW / 2;
            const barY = sy - 72 * finalScale;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            const ratio = Math.max(0, enemy.hp / enemy.maxHp);
            ctx.fillStyle = enemy.isBoss ? '#dc2626' : '#ea580c';
            ctx.fillRect(barX, barY, barW * ratio, barH);
          }
        },
      });
    }

    // Projectiles
    for (const p of this.projectiles) {
      renderQueue.push({
        z: p.pos.z,
        draw: () => {
          const { sx, sy, scale } = project(p.pos);
          this.renderProjectile(ctx, p, sx, sy, scale);
        },
      });
    }

    // Sort by depth (far away objects drawn first, near objects drawn on top)
    renderQueue.sort((a, b) => a.z - b.z);
    for (const item of renderQueue) {
      item.draw();
    }

    // 4. Dynamic Calligraphy Ink Connection Links (水墨剑意连击特效 / 锁链切线)
    this.renderSlashLinks(ctx);

    // 5. Ink Splatter Particles
    for (const part of this.particles) {
      const { sx, sy } = project({ x: part.x, y: part.y, z: part.z });
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1, part.size * part.alpha), 0, Math.PI * 2);
      ctx.fillStyle = part.color;
      ctx.globalAlpha = part.alpha;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 6. Floating Text (Combat numbers & Calligraphy moves)
    for (const ft of this.floatingTexts) {
      const { sx, sy } = project({ x: ft.x, y: ft.y, z: 0 });
      ctx.save();
      ctx.font = ft.isGesture ? `bold 22px 'Ma Shan Zheng', cursive` : ft.isCrit ? `bold 18px 'Noto Serif SC', serif` : `15px 'Noto Serif SC', serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, sx, sy);
      ctx.restore();
    }

    // 7. Draw User Calligraphy Brush Stroke
    if (this.activeStroke.length > 0) {
      GestureRecognizer.renderBrushStroke(ctx, this.activeStroke);
    }

    // 8. Draw Touch Joystick on Left Screen (Only if in SPLIT_SCREEN mode and active)
    if (this.controlMode === 'SPLIT_SCREEN' && this.touchMoveActive && this.touchMoveOrigin && this.touchMoveCurrent) {
      this.renderTouchJoystick(ctx, this.touchMoveOrigin, this.touchMoveCurrent);
    }

    // 9. Subtle Ink Border Vignette & Screen Partition Line Guide
    this.renderScreenGuides(ctx, w, h);

    ctx.restore();
  }

  private renderSlashLinks(ctx: CanvasRenderingContext2D) {
    if (this.slashLinks.length === 0) return;

    ctx.save();
    for (const link of this.slashLinks) {
      const alpha = Math.max(0, link.alpha);
      if (alpha <= 0) continue;

      const dx = link.to.x - link.from.x;
      const dy = link.to.y - link.from.y;
      const midX = (link.from.x + link.to.x) / 2;
      const midY = (link.from.y + link.to.y) / 2;
      const dist = Math.hypot(dx, dy);

      // 0. End-point and start-point ink ripple rings (剑气墨晕光环)
      ctx.beginPath();
      ctx.arc(link.to.x, link.to.y, Math.max(4, 20 * (1 - alpha * 0.5)), 0, Math.PI * 2);
      ctx.strokeStyle = link.color === '#b91c1c' ? `rgba(239, 68, 68, ${alpha * 0.6})` : `rgba(56, 189, 248, ${alpha * 0.6})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(link.from.x, link.from.y, Math.max(3, 14 * (1 - alpha * 0.5)), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(254, 240, 138, ${alpha * 0.5})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 1. Broad ethereal ink aura (水墨挥洒虚影)
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.strokeStyle =
        link.color === '#b91c1c'
          ? `rgba(185, 28, 28, ${alpha * 0.5})`
          : `rgba(56, 189, 248, ${alpha * 0.5})`;
      ctx.lineWidth = link.width * 2.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Core dark ink blade slit (焦墨锋刃)
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.strokeStyle = `rgba(20, 18, 16, ${alpha * 0.95})`;
      ctx.lineWidth = link.width;
      ctx.stroke();

      // 3. Lightning / Cinnabar spark inner core (金芒雷意)
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(2, link.width * 0.35);
      ctx.stroke();

      // 4. Bristle dry splatters (飞白碎墨) along connection line
      if (dist > 30) {
        const nx = -dy / dist;
        const ny = dx / dist;
        for (let i = 1; i <= 4; i++) {
          const t = i / 5;
          const jitter = Math.sin(i * 3.7) * 12;
          const px = link.from.x + dx * t + nx * jitter;
          const py = link.from.y + dy * t + ny * jitter;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, 3 * alpha), 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#1c1917' : link.color;
          ctx.globalAlpha = alpha * 0.85;
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // 5. Cinnabar Seal Hanzi impression at midpoint (朱砂古印)
      if (link.hanzi) {
        const sealSize = 26;
        ctx.save();
        ctx.globalAlpha = alpha;

        // Red Seal Box
        ctx.fillStyle = '#b91c1c';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.fillRect(midX - sealSize / 2, midY - sealSize / 2, sealSize, sealSize);
        ctx.strokeRect(midX - sealSize / 2, midY - sealSize / 2, sealSize, sealSize);

        // Gold Calligraphy Character
        ctx.font = `bold 16px 'Ma Shan Zheng', cursive`;
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#b91c1c';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(link.hanzi, midX, midY);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.bgLoaded && this.bgImage) {
      // Parallax scroll with camera
      const parallaxFactor = 0.15;
      const bgW = w * 1.3;
      const bgH = h * 0.7;
      const bgX = -((this.cameraX * parallaxFactor) % w) * 0.5 - w * 0.15;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.bgImage, bgX, 0, bgW, bgH);
      ctx.globalAlpha = 1.0;
    } else {
      // Atmospheric ink wash gradient fallback
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c1b18');
      grad.addColorStop(0.5, '#262420');
      grad.addColorStop(1, '#171614');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private renderGround(ctx: CanvasRenderingContext2D, w: number, h: number, horizonY: number) {
    // Rice paper ground gradient
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#1a1916');
    groundGrad.addColorStop(0.3, '#24221d');
    groundGrad.addColorStop(1, '#141311');

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY + 20, w, h - horizonY);

    // Misty horizon divider line
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 20);
    ctx.lineTo(w, horizonY + 20);
    ctx.strokeStyle = 'rgba(215, 205, 185, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pseudo-3D ground grid ink wash lines (curving with perspective)
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 165, 140, 0.05)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 6; i++) {
      const gy = horizonY + 30 + Math.pow(i / 5, 1.8) * (h - horizonY - 40);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Perspective depth lines receding towards camera vanishing point
    const vpX = w / 2 - (this.cameraX * 0.25) % 120;
    const vpY = horizonY + 15;
    for (let x = -w * 0.5; x < w * 1.5; x += 140) {
      const offsetX = x - (this.cameraX * 0.8) % 140;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(offsetX, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderShadow(ctx: CanvasRenderingContext2D, sx: number, groundY: number, scale: number, height: number) {
    const shadowW = Math.max(10, (32 * scale) / (1 + height * 0.02));
    const shadowH = shadowW * 0.35;
    const shadowAlpha = Math.max(0.1, 0.45 - height * 0.005);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(sx, groundY, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(15, 12, 10, ${shadowAlpha})`;
    ctx.fill();
    ctx.restore();
  }

  private renderProjectile(ctx: CanvasRenderingContext2D, p: Projectile, sx: number, sy: number, scale: number) {
    ctx.save();
    ctx.translate(sx, sy);

    if (p.type === 'SWORD_BEAM') {
      // Sweeping blue-black ink crescent blade
      const facing = p.vel.x > 0 ? 1 : -1;
      ctx.scale(facing * scale, scale);

      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.strokeStyle = '#0284c7'; // cyan-blue ink aura
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(4, 0, 22, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.strokeStyle = '#0f172a'; // dark sumi core
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (p.type === 'INK_SHOCKWAVE') {
      // Ground surging ink dragon shockwave
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * scale, Math.PI, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, (p.radius - 8) * scale, Math.PI, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 15, 10, 0.6)';
      ctx.fill();
    } else if (p.type === 'INK_ARROW') {
      const angle = Math.atan2(p.vel.y, p.vel.x);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(12, 0);
      ctx.strokeStyle = '#3f2b26';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(6, -4);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fillStyle = '#b91c1c';
      ctx.fill();
    } else if (p.type === 'LIGHTNING') {
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(6, -20);
      ctx.lineTo(-4, 0);
      ctx.lineTo(4, 30);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderTouchJoystick(
    ctx: CanvasRenderingContext2D,
    origin: { x: number; y: number },
    curr: { x: number; y: number }
  ) {
    const dx = curr.x - origin.x;
    const dy = curr.y - origin.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const stickX = origin.x + Math.cos(angle) * clampedDist;
    const stickY = origin.y + Math.sin(angle) * clampedDist;

    ctx.save();
    // Base circle
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, maxRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(215, 205, 185, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stick thumb
    ctx.beginPath();
    ctx.arc(stickX, stickY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(215, 205, 185, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderScreenGuides(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // Subtle central hairline indicating Left / Right split for touch control (Only in SPLIT_SCREEN mode)
    if (this.controlMode === 'SPLIT_SCREEN') {
      const midX = w * 0.48;
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.moveTo(midX, 60);
      ctx.lineTo(midX, h - 30);
      ctx.strokeStyle = 'rgba(215, 205, 185, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vignette border
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.7);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(10, 8, 6, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }
}
