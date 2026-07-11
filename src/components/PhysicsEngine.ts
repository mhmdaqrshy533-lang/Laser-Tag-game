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
  position: THREE.Vector3;
  yaw: number;
  isMoving: boolean;
  isAiming: boolean;
  state: 'active' | 'disabled';
  disabledUntil: number;
  shootTimer: number;
}

export interface SharedGameState {
  player: PlayerPhysicsState;
  enemies: Record<string, EnemyPhysicsState>;
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
    'bot-1': { id: 'bot-1', position: new THREE.Vector3(40, -3.9, 40), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-2': { id: 'bot-2', position: new THREE.Vector3(-40, -3.9, 40), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-3': { id: 'bot-3', position: new THREE.Vector3(40, -3.9, -40), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-4': { id: 'bot-4', position: new THREE.Vector3(-40, -3.9, -40), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-5': { id: 'bot-5', position: new THREE.Vector3(0, -3.9, -50), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-6': { id: 'bot-6', position: new THREE.Vector3(60, -3.9, 0), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-7': { id: 'bot-7', position: new THREE.Vector3(-60, -3.9, 0), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
    'bot-8': { id: 'bot-8', position: new THREE.Vector3(0, -3.9, 50), yaw: 0, isMoving: false, isAiming: false, state: 'active', disabledUntil: 0, shootTimer: Math.random() * 3 },
  }
});

/**
 * 60Hz Fixed Timestep Simulator. Runs calculations on memory-safe refs.
 */
export function simulateFixedStep(
  state: SharedGameState,
  keys: { w: boolean; a: boolean; s: boolean; d: boolean; ' ': boolean },
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
  }
) {
  if (gameState !== 'playing') return;

  const player = state.player;

  // 1. Calculate player movement velocities and directions relative to camera look (yaw)
  const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + mobileInput.move.x;
  const moveY = (keys.w ? 1 : 0) - (keys.s ? 1 : 0) - mobileInput.move.y;

  player.isMoving = moveX !== 0 || moveY !== 0;

  // Speed factors based on posture stance
  let moveSpeed = 16.5; // standard walking speed
  if (player.stance === 'crouch') moveSpeed = 8.0;
  if (player.stance === 'prone') moveSpeed = 3.2;
  if (player.isAiming) moveSpeed *= 0.6; // slow down when aiming down sights

  const moveDirection = new THREE.Vector3(0, 0, 0);
  if (moveX !== 0 || moveY !== 0) {
    const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.yaw, 0));
    const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.yaw, 0));

    moveDirection.addScaledVector(forwardVec, moveY);
    moveDirection.addScaledVector(rightVec, moveX);
    moveDirection.normalize();

    player.position.addScaledVector(moveDirection, moveSpeed * dt);
  }

  // 2. Jumping and manual Gravity simulation
  const roadGroundLevel = -3.9;
  if (player.position.y > roadGroundLevel) {
    player.velocityY -= 38 * dt; // gravity deceleration
  } else {
    player.position.y = roadGroundLevel;
    player.velocityY = 0;
  }

  // Jump key validation (only allowed when standing on ground)
  if (keys[' '] && player.position.y <= roadGroundLevel && player.stance === 'stand') {
    player.velocityY = 13.5;
  }

  player.position.y += player.velocityY * dt;

  // Sync dynamic values with window context for maximum cross-canvas high-frequency polling
  (window as any).playerYaw = player.yaw;
  (window as any).playerPosition = player.position;
  (window as any).playerStance = player.stance;
  (window as any).playerIsAiming = player.isAiming;
  (window as any).playerIsFPP = player.isFPP;
  (window as any).playerIsReloading = player.isReloading;

  // 3. AI Bot Behavior simulation
  let botSpeed = 3.5;
  let targetRange = 50;
  let shootInterval = 4.0;
  let accuracy = 0.12;

  if (playerLevel === 2) {
    botSpeed = 6.0;
    targetRange = 75;
    shootInterval = 2.6;
    accuracy = 0.28;
  } else if (playerLevel >= 3) {
    botSpeed = 8.5;
    targetRange = 110;
    shootInterval = 1.6;
    accuracy = 0.45;
  }

  const isPlayerActive = playerState === 'active';
  const now = Date.now();

  Object.values(state.enemies).forEach((enemy) => {
    // Check if bot is disabled/stunned
    if (enemy.state === 'disabled') {
      if (now >= enemy.disabledUntil) {
        enemy.state = 'active';
      } else {
        // Spin slowly while stunned
        enemy.yaw += 0.8 * dt;
        enemy.isMoving = false;
        enemy.isAiming = false;
        return;
      }
    }

    if (isPlayerActive) {
      const dist = enemy.position.distanceTo(player.position);

      if (dist < targetRange) {
        enemy.isAiming = true;

        // Smooth yaw rotation towards player
        const targetAngle = Math.atan2(player.position.x - enemy.position.x, player.position.z - enemy.position.z);
        let diff = targetAngle - enemy.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        enemy.yaw += diff * (1.0 - Math.exp(-8 * dt));

        // Kinematic chase movement
        if (dist > 12) {
          enemy.isMoving = true;
          const dir = new THREE.Vector3().subVectors(player.position, enemy.position);
          dir.y = 0;
          dir.normalize();

          enemy.position.addScaledVector(dir, botSpeed * dt);
        } else {
          enemy.isMoving = false;
        }

        // Shoot timer loop
        enemy.shootTimer += dt;
        if (enemy.shootTimer >= shootInterval) {
          enemy.shootTimer = 0;

          const isHit = Math.random() < accuracy;
          const muzzleOrigin = enemy.position.clone().add(
            new THREE.Vector3(0.3, 1.2, 0.8).applyEuler(new THREE.Euler(0, enemy.yaw, 0))
          );
          const targetHitPoint = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));

          if (isHit) {
            actions.addLaser(
              [muzzleOrigin.x, muzzleOrigin.y, muzzleOrigin.z],
              [targetHitPoint.x, targetHitPoint.y, targetHitPoint.z],
              '#ef4444' // Hostile red tracer
            );
            actions.hitPlayer();
            actions.addParticles([targetHitPoint.x, targetHitPoint.y, targetHitPoint.z], '#ef4444');
          } else {
            // Apply slight bullet miss spread
            const missOffset = new THREE.Vector3(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 5
            );
            targetHitPoint.add(missOffset);
            actions.addLaser(
              [muzzleOrigin.x, muzzleOrigin.y, muzzleOrigin.z],
              [targetHitPoint.x, targetHitPoint.y, targetHitPoint.z],
              '#ef4444'
            );
            actions.addParticles([targetHitPoint.x, targetHitPoint.y, targetHitPoint.z], '#64748b');
          }
        }
      } else {
        // Idle ambient scan rotation
        enemy.isAiming = false;
        enemy.isMoving = false;
        enemy.yaw = Math.sin(dt * 0.4 + (enemy.position.z % 100)) * 1.2;
      }
    } else {
      // Idle breathing
      enemy.isAiming = false;
      enemy.isMoving = false;
      enemy.yaw = Math.sin(dt * 0.4 + (enemy.position.z % 100)) * 1.2;
    }
  });
}
