/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { Text } from '@react-three/drei';
import { SoldierVisual } from './Player';

export function OtherPlayer({ id }: { id: string }) {
  const data = useGameStore(state => state.otherPlayers[id]);
  const body = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!body.current || !data) return;
    
    const currentPos = body.current.translation();
    const targetPos = new THREE.Vector3(...data.position);
    
    // Smoothly interpolate positions over the network
    const lerpFactor = 1.0 - Math.exp(-20 * delta);
    const newPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(targetPos, lerpFactor);
    
    body.current.setNextKinematicTranslation({ x: newPos.x, y: newPos.y, z: newPos.z });

    if (groupRef.current) {
      if (Array.isArray(data.rotation) && data.rotation.length === 3) {
         const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...data.rotation, 'YXZ'));
         groupRef.current.quaternion.slerp(targetQuat, lerpFactor);
         body.current.setNextKinematicRotation(groupRef.current.quaternion);
      }
    }
  });

  if (!data) return null;

  // Render player in red silhouette if hit / disabled
  const color = data.state === 'disabled' ? '#ef4444' : data.color || '#10b981';

  return (
    <RigidBody
      ref={body}
      colliders={false}
      type="kinematicPosition"
      position={data.position}
      enabledRotations={[false, false, false]}
      userData={{ name: data.id }}
    >
      <CapsuleCollider args={[1.2, 0.6]} position={[0, 1.2, 0]} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
         {data.state === 'disabled' && (
             <mesh position={[0, 1.2, 0]}>
                 <sphereGeometry args={[1.4, 16, 16]} />
                 <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
             </mesh>
         )}
         
         {/* Render the 3D Soldier Model for the other player */}
         <SoldierVisual 
            color={color} 
            stance="stand" 
            isMoving={false} 
            isAiming={false} 
            time={0} 
         />
         
         {/* Username overhead Label */}
         <Text
           position={[0, 2.7, 0]}
           fontSize={0.4}
           color={data.state === 'active' ? '#fbbf24' : '#ef4444'}
           anchorX="center"
           anchorY="middle"
           outlineWidth={0.03}
           outlineColor="#000000"
         >
           {data.name}
         </Text>
      </group>
    </RigidBody>
  );
}
