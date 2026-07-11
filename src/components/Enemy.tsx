/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { EnemyData, useGameStore } from '../store';
import { Text } from '@react-three/drei';
import { SoldierVisual } from './Player';

export function Enemy({ data }: { data: EnemyData }) {
  const body = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const localPos = useRef<THREE.Vector3>(new THREE.Vector3(...data.position));
  const shootTimer = useRef<number>(Math.random() * 3); // stagger initial shots

  const [isMoving, setIsMoving] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const isMovingStateRef = useRef(false);
  const isAimingStateRef = useRef(false);
  
  // Get active player level (for progressive AI difficulty) and local state helpers
  const playerLevel = useGameStore(state => state.playerLevel);
  const playerState = useGameStore(state => state.playerState);
  const hitPlayer = useGameStore(state => state.hitPlayer);
  const addLaser = useGameStore(state => state.addLaser);
  const addParticles = useGameStore(state => state.addParticles);

  // Sync physics body if position in store changes (e.g., on game restart)
  useEffect(() => {
    localPos.current.set(...data.position);
    if (body.current) {
      body.current.setTranslation(localPos.current, true);
    }
  }, [data.position]);

  // Determine bot difficulty parameters based on progression
  let speed = 3.5;
  let targetRange = 50;
  let shootInterval = 4.0;
  let accuracy = 0.12; // 12% hit rate
  let botTitle = `[BOT] RECRUIT - EASY`;
  let color = '#fb923c'; // Orange recruit

  if (playerLevel === 2) {
    speed = 6.0;
    targetRange = 75;
    shootInterval = 2.6;
    accuracy = 0.28; // 28% hit rate
    botTitle = `[BOT] VETERAN - MEDIUM`;
    color = '#ea580c'; // Darker orange
  } else if (playerLevel >= 3) {
    speed = 8.5;
    targetRange = 110;
    shootInterval = 1.6;
    accuracy = 0.45; // 45% hit rate
    botTitle = `[BOT] SQUAD LEADER - ELITE`;
    color = '#dc2626'; // Hostile red
  }

  useFrame((state, delta) => {
    if (!body.current) return;

    // Get current position
    const currentPos = body.current.translation();
    localPos.current.set(currentPos.x, currentPos.y, currentPos.z);

    // Grab player's dynamic position from window context (extremely high performance)
    const playerPosRaw = (window as any).playerPosition;
    const isPlayerActive = playerState === 'active';

    let isMoving = false;
    let isAiming = false;

    // Only run AI logic if bot is active
    if (data.state === 'active') {
      if (playerPosRaw && isPlayerActive) {
        const playerVec = new THREE.Vector3(playerPosRaw.x, playerPosRaw.y, playerPosRaw.z);
        const dist = localPos.current.distanceTo(playerVec);

        if (dist < targetRange) {
          isAiming = true;
          
          // Face the player
          const angle = Math.atan2(playerVec.x - localPos.current.x, playerVec.z - localPos.current.z);
          if (groupRef.current) {
            // Smoothly rotate towards player
            const lerpFactor = 1.0 - Math.exp(-8 * delta);
            const targetRotation = angle;
            let diff = targetRotation - groupRef.current.rotation.y;
            // Normalize angle to -PI to PI
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            groupRef.current.rotation.y += diff * lerpFactor;
          }

          // Move towards player if not too close
          if (dist > 12) {
            isMoving = true;
            const dir = new THREE.Vector3().subVectors(playerVec, localPos.current);
            dir.y = 0; // lock height
            dir.normalize();
            
            localPos.current.addScaledVector(dir, speed * delta);
            body.current.setNextKinematicTranslation({
              x: localPos.current.x,
              y: -3.9, // Align accurately with asphalt ground level
              z: localPos.current.z
            });
          }

          // Shoot AI weapon logic
          shootTimer.current += delta;
          if (shootTimer.current >= shootInterval) {
            shootTimer.current = 0;

            // Roll probability to determine if bot hits player
            const isHit = Math.random() < accuracy;
            const muzzleOrigin = localPos.current.clone().add(new THREE.Vector3(0.3, 1.2, 0.8).applyEuler(new THREE.Euler(0, groupRef.current?.rotation.y || 0, 0)));
            let targetHitPoint = playerVec.clone().add(new THREE.Vector3(0, 1.0, 0));

            if (isHit) {
              // Create red hostile laser tracer directly hitting player
              addLaser(
                [muzzleOrigin.x, muzzleOrigin.y, muzzleOrigin.z],
                [targetHitPoint.x, targetHitPoint.y, targetHitPoint.z],
                '#ef4444' // Hostile Red Tracer
              );
              // Trigger player hit penalty in game state
              hitPlayer();
              // Spawn blood impact particles
              addParticles([targetHitPoint.x, targetHitPoint.y, targetHitPoint.z], '#ef4444');
            } else {
              // Miss cinematic: laser lands slightly offset to left, right or over head
              const missOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 5
              );
              targetHitPoint.add(missOffset);
              addLaser(
                [muzzleOrigin.x, muzzleOrigin.y, muzzleOrigin.z],
                [targetHitPoint.x, targetHitPoint.y, targetHitPoint.z],
                '#ef4444'
              );
              addParticles([targetHitPoint.x, targetHitPoint.y, targetHitPoint.z], '#64748b'); // smoke puff
            }
          }
        } else {
          // Normal idle patrol around original spawn area
          const time = state.clock.elapsedTime;
          if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(time * 0.4 + data.position[2]) * 1.2;
          }
        }
      } else {
        // Idle breathing patrol rotation
        const time = state.clock.elapsedTime;
        if (groupRef.current) {
          groupRef.current.rotation.y = Math.sin(time * 0.4 + data.position[2]) * 1.2;
        }
      }
    } else {
      // Disabled stun state rotation
      if (groupRef.current) {
         groupRef.current.rotation.y += 0.8 * delta;
      }
    }

    // Synchronize React state to trigger render updates of animations only on state transitions
    if (isMoving !== isMovingStateRef.current) {
      isMovingStateRef.current = isMoving;
      setIsMoving(isMoving);
    }
    if (isAiming !== isAimingStateRef.current) {
      isAimingStateRef.current = isAiming;
      setIsAiming(isAiming);
    }
  });

  // Calculate stun countdown
  const timeRemaining = Math.max(0, Math.ceil((data.disabledUntil - Date.now()) / 1000));

  return (
    <RigidBody 
      ref={body}
      type="kinematicPosition" 
      position={[data.position[0], -3.9, data.position[2]]} 
      userData={{ name: data.id }}
      colliders={false}
    >
      <CapsuleCollider args={[1.2, 0.6]} position={[0, 1.2, 0]} />
      
      <group ref={groupRef}>
         {data.state === 'disabled' ? (
           <group>
             {/* Dynamic Holographic Stun shield so they don't disappear */}
             <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.25} />
             </mesh>
             
             {/* Stunned red visual indicator */}
             <SoldierVisual 
                stance="stand"
                isMoving={false}
                isAiming={false}
                time={performance.now() * 0.001}
                color="#7f1d1d" // dark maroon
             />

             {/* Stun countdown */}
             <Text
               position={[0, 2.9, 0]}
               fontSize={0.4}
               color={'#ef4444'}
               outlineWidth={0.03}
               outlineColor="#000000"
               font="monospace"
             >
               {`RECOVERING IN ${timeRemaining}s`}
             </Text>
           </group>
         ) : (
           <group>
             {/* Hostile Soldier Model */}
             <SoldierVisual 
                stance="stand"
                isMoving={isMoving}
                isAiming={isAiming}
                time={performance.now() * 0.001}
                color={color}
             />

             {/* Floating Hostile Overhead label */}
             <Text
               position={[0, 2.9, 0]}
               fontSize={0.4}
               color={'#ef4444'}
               outlineWidth={0.03}
               outlineColor="#000000"
               font="monospace"
             >
               {botTitle}
             </Text>
           </group>
         )}
      </group>
    </RigidBody>
  );
}
