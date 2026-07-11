/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface PlayerPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  velocityY: number;
  yaw: number;
  pitch: number;
  stance: 'stand' | 'crouch' | 'prone';
  isMoving: boolean;
  isAiming: boolean;
  isFPP: boolean;
  isReloading: boolean;
  recoilOffset: number;
  showMuzzleFlash: boolean;
  muzzleFlashPos: [number, number, number];
  ammo: number;
  health: number;
  armor: number;
  energy: number;
}

export interface EnemyPhysicsState {
  id: string;
  type: 'soldier' | 'boss' | 'drone';
  position: THREE.Vector3;
  yaw: number;
  pitch: number;
  isMoving: boolean;
  isAiming: boolean;
  state: 'active' | 'disabled' | 'scripted';
  health: number;
  maxHealth: number;
  disabledUntil: number;
  shootTimer: number;
  userData: any;
}

export interface SharedGameState {
  player: PlayerPhysicsState;
  enemies: Record<string, EnemyPhysicsState>;
  scriptedEvents: string[]; // Queue of events to trigger
  selectedStage?: string;
}

export const createInitialSharedState = (): SharedGameState => ({
  player: {
    position: new THREE.Vector3(0, -3.9, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    velocityY: 0,
    yaw: 0,
    pitch: 0.1,
    stance: 'stand',
    isMoving: false,
    isAiming: false,
    isFPP: false,
    isReloading: false,
    recoilOffset: 0,
    showMuzzleFlash: false,
    muzzleFlashPos: [0, 0, 0],
    ammo: 30,
    health: 80,
    armor: 60,
    energy: 70,
  },
  enemies: {
    'bot-1': { id: 'bot-1', type: 'soldier', position: new THREE.Vector3(40, -3.9, 40), yaw: 0, pitch: 0, isMoving: false, isAiming: false, state: 'active', health: 100, maxHealth: 100, disabledUntil: 0, shootTimer: Math.random() * 3, userData: {} },
    'bot-2': { id: 'bot-2', type: 'soldier', position: new THREE.Vector3(-40, -3.9, 40), yaw: 0, pitch: 0, isMoving: false, isAiming: false, state: 'active', health: 100, maxHealth: 100, disabledUntil: 0, shootTimer: Math.random() * 3, userData: {} },
    'bot-3': { id: 'bot-3', type: 'soldier', position: new THREE.Vector3(40, -3.9, -40), yaw: 0, pitch: 0, isMoving: false, isAiming: false, state: 'active', health: 100, maxHealth: 100, disabledUntil: 0, shootTimer: Math.random() * 3, userData: {} },
    'bot-4': { id: 'bot-4', type: 'soldier', position: new THREE.Vector3(-40, -3.9, -40), yaw: 0, pitch: 0, isMoving: false, isAiming: false, state: 'active', health: 100, maxHealth: 100, disabledUntil: 0, shootTimer: Math.random() * 3, userData: {} },
    'boss-1': { 
      id: 'boss-1', 
      type: 'boss', 
      position: new THREE.Vector3(0, -3.9, -200), 
      yaw: Math.PI, 
      pitch: 0, 
      isMoving: false, 
      isAiming: false, 
      state: 'scripted', 
      health: 2000, 
      maxHealth: 2000, 
      disabledUntil: 0, 
      shootTimer: 0, 
      userData: { phase: 1 } 
    }
  },
  scriptedEvents: []
});

/**
 * 60Hz Fixed Timestep Simulator.
 */
let accumulator = 0;
const FIXED_DT = 1 / 60;

export function simulateFixedStep(
  state: SharedGameState & { timeScale?: number; isTimeDilationActive?: boolean; abilityEnergy?: number },
  keys: { w: boolean; a: boolean; s: boolean; d: boolean; ' ': boolean; shift: boolean },
  mobileInput: { move: { x: number; y: number }; look: { x: number; y: number }; shooting: boolean },
  dt: number,
  playerLevel: number,
  gameState: string,
  playerState: string,
  actions: {
    hitPlayer: () => void;
    hitEnemy: (id: string, byPlayer?: boolean) => void;
    addLaser: (start: [number, number, number], end: [number, number, number], color: string) => void;
    addParticles: (position: [number, number, number], color: string) => void;
    toggleTimeDilation: (active: boolean) => void;
    updateAbilityEnergy: (delta: number) => void;
    setPlaneStats?: (speed: number, altitude: number) => void;
  }
) {
  if (gameState !== 'playing') return;

  const timeScale = state.timeScale || 1.0;

  // Ability Management
  if (keys.shift && !state.isTimeDilationActive && (state.abilityEnergy || 0) > 25) {
    actions.toggleTimeDilation(true);
  } else if (!keys.shift && state.isTimeDilationActive) {
    actions.toggleTimeDilation(false);
  }
  
  actions.updateAbilityEnergy(dt);

  // Fixed timestep accumulator
  const frameTime = Math.min(dt, 0.25); 
  accumulator += frameTime;

  while (accumulator >= FIXED_DT) {
    updatePhysics(state, keys, mobileInput, FIXED_DT, playerLevel, playerState, actions, timeScale);
    accumulator -= FIXED_DT;
  }
}

function updatePhysics(
  state: any,
  keys: any,
  mobileInput: any,
  dt: number,
  playerLevel: number,
  playerState: string,
  actions: any,
  timeScale: number
) {
  const player = state.player;
  const isDilation = state.isTimeDilationActive;
  
  const playerTimeMult = isDilation ? 0.6 : 1.0;
  const pDt = dt * playerTimeMult;
  const worldDt = dt * timeScale;

  if (state.selectedStage === 'desert') {
    // 1. Stealth Plane Flight Mechanics
    const speed = 150; 
    
    // Auto-leveling or manual control
    // Mobile input look Y maps to pitch, X maps to yaw
    if (keys.w) player.pitch -= 1.5 * pDt;
    if (keys.s) player.pitch += 1.5 * pDt;
    if (keys.a) player.yaw += 1.5 * pDt;
    if (keys.d) player.yaw -= 1.5 * pDt;
    
    // Clamp pitch
    player.pitch = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, player.pitch));

    const euler = new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ');
    const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    
    player.position.addScaledVector(forwardVec, speed * pDt);
    
    // Floor collision
    if (player.position.y < -5) {
      player.position.y = -5;
      player.pitch = Math.min(0, player.pitch);
    }
    
    if (actions.setPlaneStats) {
       actions.setPlaneStats(850 + (player.pitch * -200), 12400 + player.position.y * 10);
    }
  } else {
    // 1. Player Physics (Ground)
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + mobileInput.move.x;
    const moveY = (keys.w ? 1 : 0) - (keys.s ? 1 : 0) - mobileInput.move.y;
    player.isMoving = moveX !== 0 || moveY !== 0;

    let moveSpeed = 16.5;
    if (player.stance === 'crouch') moveSpeed = 8.0;
    if (player.stance === 'prone') moveSpeed = 3.2;
    if (player.isAiming) moveSpeed *= 0.6;

    if (player.isMoving) {
      const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.yaw, 0));
      const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.yaw, 0));
      const moveDir = new THREE.Vector3().addScaledVector(forwardVec, moveY).addScaledVector(rightVec, moveX).normalize();
      player.position.addScaledVector(moveDir, moveSpeed * pDt);
    }

    const roadGroundLevel = -3.9;
    if (player.position.y > roadGroundLevel) {
      player.velocityY -= 38 * pDt;
    } else {
      player.position.y = roadGroundLevel;
      player.velocityY = 0;
    }

    if (keys[' '] && player.position.y <= roadGroundLevel && player.stance === 'stand') {
      player.velocityY = 13.5;
    }
    player.position.y += player.velocityY * pDt;
  }

  // Recoil Recovery
  if (player.recoilOffset > 0) {
    player.recoilOffset = Math.max(0, player.recoilOffset - 15 * pDt);
  }

  // 2. AI Systems
  const isPlayerActive = playerState === 'active';
  const now = Date.now();

  Object.values(state.enemies).forEach((enemyAny: any) => {
    const enemy = enemyAny as EnemyPhysicsState;
    if (enemy.health <= 0) return;

    if (enemy.state === 'scripted') {
      if (enemy.id === 'boss-1' && player.position.z < -120) {
        if (!state.scriptedEvents.includes('boss_reveal')) state.scriptedEvents.push('boss_reveal');
      }
      return;
    }

    if (enemy.state === 'disabled') {
      if (now >= enemy.disabledUntil) enemy.state = 'active';
      else {
        enemy.yaw += 1.2 * worldDt;
        return;
      }
    }

    if (isPlayerActive) {
      if (enemy.type === 'boss') {
        updateBossAI(enemy, player, worldDt, actions);
      } else {
        updateSoldierAI(enemy, player, worldDt, playerLevel, actions);
      }
    }
  });

  // Sync to window for rendering
  (window as any).playerYaw = player.yaw;
  (window as any).playerPosition = player.position;
}

function updateBossAI(boss: EnemyPhysicsState, player: PlayerPhysicsState, dt: number, actions: any) {
  const healthPct = boss.health / boss.maxHealth;
  boss.userData.phase = healthPct < 0.3 ? 3 : healthPct < 0.6 ? 2 : 1;
  
  boss.isAiming = true;
  const targetAngle = Math.atan2(player.position.x - boss.position.x, player.position.z - boss.position.z);
  let diff = targetAngle - boss.yaw;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  boss.yaw += diff * (1.0 - Math.exp(-(2 + boss.userData.phase) * dt));

  boss.shootTimer += dt;
  const shootInterval = 2.0 / boss.userData.phase;

  if (boss.shootTimer >= shootInterval) {
    boss.shootTimer = 0;
    const phase = boss.userData.phase;
    
    if (phase === 3) {
      // Radial Burst
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
        const origin = boss.position.clone().add(new THREE.Vector3(0, 8, 0));
        const target = origin.clone().add(dir.multiplyScalar(60));
        actions.addLaser([origin.x, origin.y, origin.z], [target.x, target.y, target.z], '#f87171');
      }
    } else {
      const count = phase * 3;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count-1)/2) * 2;
        const origin = boss.position.clone().add(new THREE.Vector3(offset, 8, 5).applyEuler(new THREE.Euler(0, boss.yaw, 0)));
        actions.addLaser([origin.x, origin.y, origin.z], [player.position.x, player.position.y + 1, player.position.z], '#8b5cf6');
        if (Math.random() < 0.2) actions.hitPlayer();
      }
    }
  }

  // Boss distance maintenance
  const dist = boss.position.distanceTo(player.position);
  if (dist > 100) {
    const dir = new THREE.Vector3().subVectors(player.position, boss.position).normalize();
    boss.position.addScaledVector(dir, 8 * dt);
    boss.isMoving = true;
  } else if (dist < 50) {
    const dir = new THREE.Vector3().subVectors(boss.position, player.position).normalize();
    boss.position.addScaledVector(dir, 8 * dt);
    boss.isMoving = true;
  } else {
    boss.isMoving = false;
  }
}

function updateSoldierAI(enemy: EnemyPhysicsState, player: PlayerPhysicsState, dt: number, level: number, actions: any) {
  const botSpeed = level === 1 ? 4 : level === 2 ? 7 : 10;
  const accuracy = 0.1 + (level * 0.1);
  const dist = enemy.position.distanceTo(player.position);

  // Tactical AI: Flanking logic
  if (!enemy.userData.targetOffset) {
    enemy.userData.targetOffset = new THREE.Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 10);
  }

  if (dist < (60 + level * 20)) {
    enemy.isAiming = true;
    const targetAngle = Math.atan2(player.position.x - enemy.position.x, player.position.z - enemy.position.z);
    let diff = targetAngle - enemy.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    enemy.yaw += diff * (1.0 - Math.exp(-6 * dt));

    if (dist > 18) {
      enemy.isMoving = true;
      // Combine direct move with flanking offset
      const targetPos = player.position.clone().add(enemy.userData.targetOffset);
      const dir = new THREE.Vector3().subVectors(targetPos, enemy.position);
      dir.y = 0; dir.normalize();
      enemy.position.addScaledVector(dir, botSpeed * dt);
    } else if (dist < 10) {
      // Retreat slightly if too close
      enemy.isMoving = true;
      const dir = new THREE.Vector3().subVectors(enemy.position, player.position);
      dir.y = 0; dir.normalize();
      enemy.position.addScaledVector(dir, botSpeed * dt);
    } else {
      enemy.isMoving = false;
      // Change flank offset occasionally
      if (Math.random() < 0.01) {
        enemy.userData.targetOffset.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 20);
      }
    }

    enemy.shootTimer += dt;
    if (enemy.shootTimer >= (3.0 / level)) {
      enemy.shootTimer = 0;
      const muzzle = enemy.position.clone().add(new THREE.Vector3(0.3, 1.2, 0.8).applyEuler(new THREE.Euler(0, enemy.yaw, 0)));
      const target = player.position.clone().add(new THREE.Vector3(0, 1, 0));
      const isHit = Math.random() < accuracy;
      
      if (!isHit) {
        target.add(new THREE.Vector3((Math.random()-0.5)*5, 0, (Math.random()-0.5)*5));
      } else {
        actions.hitPlayer();
        actions.addParticles([target.x, target.y, target.z], '#ef4444');
      }
      actions.addLaser([muzzle.x, muzzle.y, muzzle.z], [target.x, target.y, target.z], '#ef4444');
    }
  } else {
    enemy.isAiming = false;
    enemy.isMoving = false;
    enemy.yaw += Math.sin(Date.now() * 0.001) * 0.5 * dt;
  }
}
