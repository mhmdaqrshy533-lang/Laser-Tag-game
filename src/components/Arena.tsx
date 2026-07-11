/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Tall steel lattice tower mimicking Erangel military antennas
function LatticeTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
       {/* 4 Main vertical corner leg pillars, tapering slightly */}
       <mesh position={[-4, 50, -4]} castShadow>
          <cylinderGeometry args={[0.3, 0.6, 100, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
       </mesh>
       <mesh position={[4, 50, -4]} castShadow>
          <cylinderGeometry args={[0.3, 0.6, 100, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
       </mesh>
       <mesh position={[-4, 50, 4]} castShadow>
          <cylinderGeometry args={[0.3, 0.6, 100, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
       </mesh>
       <mesh position={[4, 50, 4]} castShadow>
          <cylinderGeometry args={[0.3, 0.6, 100, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
       </mesh>

       {/* Horizontal support struts */}
       {Array.from({ length: 5 }).map((_, i) => (
         <mesh key={`plat-${i}`} position={[0, i * 25, 0]}>
           <boxGeometry args={[9, 0.8, 9]} />
           <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
         </mesh>
       ))}

       {/* Lattice cross bracing trusses */}
       {Array.from({ length: 4 }).map((_, i) => {
         const y = i * 25 + 12.5;
         return (
           <group key={`cross-${i}`} position={[0, y, 0]}>
             <mesh rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[13, 0.4, 0.4]} />
                <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
             <mesh rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[13, 0.4, 0.4]} />
                <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
             <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
                <boxGeometry args={[13, 0.4, 0.4]} />
                <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
             <mesh rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
                <boxGeometry args={[13, 0.4, 0.4]} />
                <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
           </group>
         );
       })}

       {/* Radar dish at top */}
       <group position={[0, 104, 0]}>
          <mesh rotation={[Math.PI / 6, Math.PI / 4, 0]} castShadow>
             <cylinderGeometry args={[7, 1, 3, 16, 1, true]} />
             <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 5]} />
             <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Flashing red light at very top */}
          <mesh position={[0, 6, 0]}>
             <sphereGeometry args={[0.6, 8, 8]} />
             <meshBasicMaterial color="#ff0000" />
          </mesh>
       </group>
    </group>
  );
}

// High-fidelity Pine tree component
function PineTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
       {/* Trunk */}
       <mesh position={[0, 6, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.9, 12, 8]} />
          <meshStandardMaterial color="#4a3b32" roughness={0.9} />
       </mesh>
       {/* Dark Green Cones */}
       <mesh position={[0, 14, 0]} castShadow>
          <coneGeometry args={[5.5, 9, 8]} />
          <meshStandardMaterial color="#14532d" roughness={0.85} />
       </mesh>
       <mesh position={[0, 19, 0]} castShadow>
          <coneGeometry args={[4.2, 7.5, 8]} />
          <meshStandardMaterial color="#166534" roughness={0.85} />
       </mesh>
       <mesh position={[0, 23.5, 0]} castShadow>
          <coneGeometry args={[2.8, 6, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.85} />
       </mesh>
    </group>
  );
}

// Broadleaf deciduous tree
function BroadleafTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
       {/* Trunk */}
       <mesh position={[0, 7, 0]} castShadow>
          <cylinderGeometry args={[0.6, 1.2, 14, 8]} />
          <meshStandardMaterial color="#3b2d24" roughness={0.95} />
       </mesh>
       {/* Fluffy Green leaves */}
       <mesh position={[0, 17, 0]} castShadow>
          <sphereGeometry args={[6.5, 8, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.9} />
       </mesh>
       <mesh position={[3, 20, 2]} castShadow>
          <sphereGeometry args={[4.5, 8, 8]} />
          <meshStandardMaterial color="#166534" roughness={0.9} />
       </mesh>
       <mesh position={[-3, 19, -2]} castShadow>
          <sphereGeometry args={[4.5, 8, 8]} />
          <meshStandardMaterial color="#166534" roughness={0.9} />
       </mesh>
    </group>
  );
}

export function Arena() {
  // Generate beautiful tree layout and obstacles deterministically
  const trees = useMemo(() => {
    const rngLocal = mulberry32(112233);
    const list = [];
    // Place trees on the sides of the runway (Runway width is X: -50 to 50)
    for (let i = 0; i < 160; i++) {
      // Place left side or right side
      const side = rngLocal() > 0.5 ? 1 : -1;
      const x = side * (rngLocal() * 500 + 85); // buffer of 85 units from runway center
      const z = (rngLocal() - 0.5) * 6000;
      const isPine = rngLocal() > 0.45;
      list.push({
        id: i,
        position: [x, -5, z] as [number, number, number],
        isPine
      });
    }
    return list;
  }, []);

  // Place some military supply boxes as cover along the runway sides
  const barricades = useMemo(() => {
    const rngLocal = mulberry32(445566);
    const list = [];
    for (let i = 0; i < 35; i++) {
      const side = rngLocal() > 0.5 ? 1 : -1;
      const x = side * (rngLocal() * 10 + 45); // just off the asphalt shoulder
      const z = (rngLocal() - 0.5) * 4000;
      const w = rngLocal() * 4 + 4;
      const h = rngLocal() * 3 + 3;
      const d = rngLocal() * 4 + 4;
      list.push({
        id: i,
        position: [x, h / 2 - 5, z] as [number, number, number],
        size: [w, h, d] as [number, number, number],
        color: rngLocal() > 0.5 ? '#7f1d1d' : '#22c55e' // Red/Green cargo boxes
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* Dynamic natural bright sky */}
      <Sky sunPosition={[150, 45, 100]} turbidity={1.5} rayleigh={0.8} />
      
      {/* Ground Grass Plane */}
      <RigidBody type="fixed" name="floor" friction={1.2}>
          <mesh receiveShadow position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[15000, 15000]} />
            <meshStandardMaterial color="#4d7c0f" roughness={1.0} metalness={0.0} />
          </mesh>
      </RigidBody>
      
      {/* Asphalt Runway in Center (Erangel Runway style) */}
      <mesh receiveShadow position={[0, -4.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 12000]} />
        <meshStandardMaterial color="#334155" roughness={0.9} metalness={0.15} />
      </mesh>

      {/* Runway White Dashed Center Lines */}
      {Array.from({ length: 100 }).map((_, i) => {
        const zPos = (i - 50) * 120;
        return (
          <mesh key={`dash-${i}`} position={[0, -4.9, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 18]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Runway yellow shoulder lines */}
      <mesh position={[-44, -4.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[0.5, 12000]} />
         <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>
      <mesh position={[44, -4.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[0.5, 12000]} />
         <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>

      {/* Two Epic Radio Lattice Masts exactly like Erangel base on the left shoulder */}
      <LatticeTower position={[-85, -5, -400]} />
      <LatticeTower position={[-95, -5, 500]} />

      {/* Forest Trees on Left and Right Sides */}
      {trees.map((t) => (
         <RigidBody key={`tree-${t.id}`} type="fixed" position={[t.position[0], -5, t.position[2]]}>
            {t.isPine ? (
              <PineTree position={[0, 0, 0]} />
            ) : (
              <BroadleafTree position={[0, 0, 0]} />
            )}
         </RigidBody>
      ))}

      {/* Cargo Supply Boxes/Barricades for Tactical Cover */}
      {barricades.map((b) => (
         <RigidBody key={`box-${b.id}`} type="fixed" position={b.position}>
             <mesh castShadow receiveShadow>
                <boxGeometry args={b.size} />
                <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.3} />
             </mesh>
             {/* Draw some stripes or metal corners on crates */}
             <mesh position={[0, 0, 0]}>
                <boxGeometry args={[b.size[0] + 0.1, b.size[1] + 0.1, b.size[2] + 0.1]} />
                <meshStandardMaterial color="#000000" wireframe />
             </mesh>
         </RigidBody>
      ))}

      {/* Volumetric Clouds */}
      {Array.from({ length: 50 }).map((_, i) => (
         <Cloud key={`cloud-${i}`} position={[(Math.random() - 0.5) * 8000, Math.random() * 250 + 500, (Math.random() - 0.5) * 8000]} />
      ))}
    </group>
  );
}

function Cloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
      if (ref.current) {
          ref.current.position.z += 8 * delta; // Wind speed
          if (ref.current.position.z > 4000) ref.current.position.z = -4000;
      }
  });

  return (
    <group ref={ref} position={position}>
       <mesh>
           <boxGeometry args={[120, 25, 60]} />
           <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.9} />
       </mesh>
       <mesh position={[25, 10, 10]}>
           <boxGeometry args={[90, 25, 50]} />
           <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.9} />
       </mesh>
       <mesh position={[-25, 5, -10]}>
           <boxGeometry args={[80, 20, 45]} />
           <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.9} />
       </mesh>
    </group>
  );
}
