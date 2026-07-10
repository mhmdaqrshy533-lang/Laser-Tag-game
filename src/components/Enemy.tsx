/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { EnemyData, useGameStore } from '../store';
import { Text } from '@react-three/drei';
import { SoldierVisual } from './Player';

export function Enemy({ data }: { data: EnemyData }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Patrol behavior and posture animation
  useFrame((state) => {
      if (groupRef.current && data.state === 'active') {
          // Slow breathing and rotational patrol
          const time = state.clock.elapsedTime;
          groupRef.current.position.y = Math.sin(time * 1.5 + data.position[0]) * 0.05;
          // Rotate slightly left and right to "patrol" scan the road
          groupRef.current.rotation.y = Math.sin(time * 0.5 + data.position[2]) * 0.8;
      }
  });

  if (data.state === 'disabled') return null;

  // Render on the asphalt runway floor (Y=-3.9 is standard feet level)
  return (
    <RigidBody 
      type="fixed" 
      position={[data.position[0], -3.9, data.position[2]]} 
      userData={{ name: data.id }}
    >
      <CapsuleCollider args={[1.2, 0.6]} position={[0, 1.2, 0]} />
      
      <group ref={groupRef}>
         {/* Hostile Rogue Soldier model styled with distinct Red/Orange colors */}
         <SoldierVisual 
            stance="stand"
            isMoving={false}
            isAiming={true}
            time={0}
            color="#ef4444" // Hostile red
         />

         {/* Floating Red Enemy Target Overhead Bar */}
         <Text
           position={[0, 2.8, 0]}
           fontSize={0.45}
           color={'#ef4444'}
           outlineWidth={0.04}
           outlineColor="#000000"
           font="monospace"
         >
           {`[BOT] HOSTILE`}
         </Text>
      </group>
    </RigidBody>
  );
}
