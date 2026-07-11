/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { SharedGameState, createInitialSharedState } from './PhysicsEngine';
import { useGameStore } from '../store';
import { useShallow } from 'zustand/react/shallow';

// ==========================================
// 1. WEBGL ERROR BOUNDARY & CANVAS PROTECTION
// ==========================================

interface BoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WebGLBoundary extends Component<BoundaryProps, BoundaryState> {
  public state: BoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Engine Crash caught by boundary:", error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-white font-sans">
          <div className="max-w-md border border-red-500/30 bg-red-950/20 p-8 rounded-xl backdrop-blur-md">
            <div className="w-16 h-16 bg-red-600/20 border border-red-500 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-red-400">انقطاع اتصال محرك الرسوميات</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              تجاوز محرك الـ WebGL حدود طاقة كرت الشاشة أو حدث فقدان في سياق الرندرة (Context Lost). تم عزل الذاكرة بنجاح لحماية المتصفح من الانهيار.
            </p>
            <button
              onClick={this.handleRecover}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 border border-red-400 text-white font-medium rounded-lg shadow-lg hover:shadow-red-500/20 transition duration-150 text-sm tracking-wide"
            >
              إعادة تهيئة محرك الـ WebGL
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Context Loss Listener Component to be mounted inside Canvas
export function WebGLContextListener({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree();

  useEffect(() => {
    const canvasEl = gl.domElement;
    
    const handleLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL Context Loss detected!");
      onContextLost();
    };

    const handleRestored = () => {
      console.log("WebGL Context Restored successfully.");
    };

    canvasEl.addEventListener('webglcontextlost', handleLost, false);
    canvasEl.addEventListener('webglcontextrestored', handleRestored, false);

    return () => {
      canvasEl.removeEventListener('webglcontextlost', handleLost);
      canvasEl.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, [gl]);

  return null;
}

// ==========================================
// 2. STATIC LATTICE TOWER & ENVIRONMENT
// ==========================================

interface TowerProps {
  position: [number, number, number];
}

export function LatticeTower({ position }: TowerProps) {
  const g1 = useRef<THREE.CylinderGeometry>(null);
  const g2 = useRef<THREE.CylinderGeometry>(null);
  const g3 = useRef<THREE.BoxGeometry>(null);
  const g4 = useRef<THREE.BoxGeometry>(null);
  const g5 = useRef<THREE.CylinderGeometry>(null);
  const g6 = useRef<THREE.CylinderGeometry>(null);
  const g7 = useRef<THREE.SphereGeometry>(null);

  const m1 = useRef<THREE.MeshStandardMaterial>(null);
  const m2 = useRef<THREE.MeshStandardMaterial>(null);
  const m3 = useRef<THREE.MeshStandardMaterial>(null);
  const m4 = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    return () => {
      // Explicit VRAM cleanup on tower unmount
      [g1, g2, g3, g4, g5, g6, g7].forEach(g => g.current?.dispose());
      [m1, m2, m3, m4].forEach(m => m.current?.dispose());
    };
  }, []);

  return (
    <group position={position}>
      {/* 4 Corner Leg Pillars */}
      <mesh position={[-4, 50, -4]} castShadow>
        <cylinderGeometry ref={g1} args={[0.3, 0.6, 100, 4]} />
        <meshStandardMaterial ref={m1} color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[4, 50, -4]} castShadow>
        <cylinderGeometry ref={g2} args={[0.3, 0.6, 100, 4]} />
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

      {/* Platforms */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`plat-${i}`} position={[0, i * 25, 0]}>
          <boxGeometry ref={g3} args={[9, 0.8, 9]} />
          <meshStandardMaterial ref={m2} color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Cross braces */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = i * 25 + 12.5;
        return (
          <group key={`cross-${i}`} position={[0, y, 0]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry ref={g4} args={[13, 0.4, 0.4]} />
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

      {/* Antenna Dish */}
      <group position={[0, 104, 0]}>
        <mesh rotation={[Math.PI / 6, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry ref={g5} args={[7, 1, 3, 16, 1, true]} />
          <meshStandardMaterial ref={m3} color="#e2e8f0" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry ref={g6} args={[0.2, 0.2, 5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 6, 0]}>
          <sphereGeometry ref={g7} args={[0.6, 8, 8]} />
          <meshBasicMaterial ref={m4} color="#ff0000" />
        </mesh>
      </group>
    </group>
  );
}

// Drifting Clouds
export function VolumetricCloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const geo1 = useRef<THREE.BoxGeometry>(null);
  const mat1 = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.z += 8 * delta; // Drifting wind
      if (ref.current.position.z > 4000) {
        ref.current.position.z = -4000;
      }
    }
  });

  useEffect(() => {
    return () => {
      geo1.current?.dispose();
      mat1.current?.dispose();
    };
  }, []);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry ref={geo1} args={[120, 25, 60]} />
        <meshStandardMaterial ref={mat1} color="#ffffff" transparent opacity={0.4} roughness={0.9} />
      </mesh>
      <mesh position={[25, 10, 10]}>
        <boxGeometry args={[90, 25, 50]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={0.9} />
      </mesh>
      <mesh position={[-25, 5, -10]}>
        <boxGeometry args={[80, 20, 45]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. INSTANCED MESH ENVIRONMENT (ARENA)
// ==========================================

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function Hangar({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Curved roof arches using segments */}
      {Array.from({ length: 8 }).map((_, i) => {
        const z = i * 6 - 21;
        return (
          <group key={`arch-${i}`} position={[0, 0, z]}>
            {/* Left Column */}
            <mesh position={[-15, 6, 0]} castShadow>
              <boxGeometry args={[1, 12, 1]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Column */}
            <mesh position={[15, 6, 0]} castShadow>
              <boxGeometry args={[1, 12, 1]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Arched beam using segmented boxes */}
            {Array.from({ length: 9 }).map((_, j) => {
              const angle = (j / 8) * Math.PI;
              const x = Math.cos(angle) * 15;
              const y = Math.sin(angle) * 10 + 12;
              return (
                <mesh key={`seg-${j}`} position={[x, y, 0]} rotation={[0, 0, angle - Math.PI / 2]} castShadow>
                  <boxGeometry args={[1.2, 4.5, 1.2]} />
                  <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      
      {/* Corrugated Outer Roof Sheets */}
      {Array.from({ length: 17 }).map((_, i) => {
        const angle = (i / 16) * Math.PI;
        const x = Math.cos(angle) * 15.2;
        const y = Math.sin(angle) * 10 + 12.1;
        return (
          <mesh key={`sheet-${i}`} position={[x, y, 0]} rotation={[0, 0, angle - Math.PI / 2]} receiveShadow castShadow>
            <boxGeometry args={[0.2, 3.5, 43]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Back Wall panel */}
      <mesh position={[0, 10, -21.5]} castShadow receiveShadow>
        <boxGeometry args={[29.8, 20, 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* "HANGAR 03" Graphic Plate */}
      <group position={[0, 16, -21.2]}>
        <mesh>
          <boxGeometry args={[8, 2.5, 0.2]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
        {/* Decorative bright yellow stripes */}
        <mesh position={[0, 1.1, 0.1]}>
          <boxGeometry args={[7.8, 0.2, 0.1]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, -1.1, 0.1]}>
          <boxGeometry args={[7.8, 0.2, 0.1]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
}

export function MilitaryHumvee({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Lower chassis / body */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.8, 6.0]} />
        <meshStandardMaterial color="#4f5342" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Cabin top */}
      <mesh position={[0, 1.5, -0.4]} castShadow>
        <boxGeometry args={[3.0, 1.0, 3.6]} />
        <meshStandardMaterial color="#3f4234" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* Front hood */}
      <mesh position={[0, 1.1, 1.8]} castShadow>
        <boxGeometry args={[3.0, 0.4, 2.0]} />
        <meshStandardMaterial color="#4f5342" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Windows */}
      <mesh position={[0, 1.5, 1.41]} rotation={[-Math.PI / 10, 0, 0]}>
        <boxGeometry args={[2.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-1.51, 1.5, -0.4]}>
        <boxGeometry args={[0.1, 0.6, 3.0]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[1.51, 1.5, -0.4]}>
        <boxGeometry args={[0.1, 0.6, 3.0]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Grille / Bumper */}
      <mesh position={[0, 0.5, 3.05]} castShadow>
        <boxGeometry args={[3.0, 0.6, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[-1.1, 0.9, 2.81]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[1.1, 0.9, 2.81]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Wheels */}
      <group position={[-1.6, 0.4, 1.8]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>
      <group position={[1.6, 0.4, 1.8]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>
      <group position={[-1.6, 0.4, -1.8]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>
      <group position={[1.6, 0.4, -1.8]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export function ArenaVisual() {
  // 1. Runway Dashed Center Lines Layout (Deterministic)
  const dashes = useMemo(() => {
    const list = [];
    for (let i = 0; i < 100; i++) {
      list.push((i - 50) * 120);
    }
    return list;
  }, []);

  // 2. Forest Trees Layout (Deterministic)
  const treeLayout = useMemo(() => {
    const rng = mulberry32(112233);
    const pines: [number, number, number][] = [];
    const broads: [number, number, number][] = [];
    for (let i = 0; i < 160; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (rng() * 500 + 85);
      const z = (rng() - 0.5) * 6000;
      if (rng() > 0.45) {
        pines.push([x, -5, z]);
      } else {
        broads.push([x, -5, z]);
      }
    }
    return { pines, broads };
  }, []);

  // 3. Cargo Supply Crates Layout (Deterministic)
  const boxLayout = useMemo(() => {
    const rng = mulberry32(445566);
    const redBoxes: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
    const greenBoxes: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
    for (let i = 0; i < 35; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (rng() * 10 + 45); // asphalt off-shoulders
      const z = (rng() - 0.5) * 4000;
      const w = rng() * 4 + 4;
      const h = rng() * 3 + 3;
      const d = rng() * 4 + 4;
      const isRed = rng() > 0.5;

      const pos: [number, number, number] = [x, h / 2 - 5, z];
      const scale: [number, number, number] = [w, h, d];

      if (isRed) {
        redBoxes.push({ pos, scale });
      } else {
        greenBoxes.push({ pos, scale });
      }
    }
    return { redBoxes, greenBoxes };
  }, []);

  // References for InstancedMesh Matrices
  const dashMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const pineTrunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const pineLeaf1MeshRef = useRef<THREE.InstancedMesh>(null);
  const pineLeaf2MeshRef = useRef<THREE.InstancedMesh>(null);
  const pineLeaf3MeshRef = useRef<THREE.InstancedMesh>(null);

  const broadTrunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const broadLeaf1MeshRef = useRef<THREE.InstancedMesh>(null);
  const broadLeaf2MeshRef = useRef<THREE.InstancedMesh>(null);
  const broadLeaf3MeshRef = useRef<THREE.InstancedMesh>(null);

  const redBoxMeshRef = useRef<THREE.InstancedMesh>(null);
  const greenBoxMeshRef = useRef<THREE.InstancedMesh>(null);

  // Apply matrix transforms for all instanced environments on load
  useEffect(() => {
    const temp = new THREE.Object3D();

    // Dash lines
    if (dashMeshRef.current) {
      dashes.forEach((z, index) => {
        temp.position.set(0, -4.9, z);
        temp.rotation.set(-Math.PI / 2, 0, 0);
        temp.scale.set(1, 1, 1);
        temp.updateMatrix();
        dashMeshRef.current!.setMatrixAt(index, temp.matrix);
      });
      dashMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Pine Trees (Trunk & 3 Leaf Cones)
    const pineCount = treeLayout.pines.length;
    if (pineTrunkMeshRef.current && pineLeaf1MeshRef.current && pineLeaf2MeshRef.current && pineLeaf3MeshRef.current) {
      treeLayout.pines.forEach(([x, y, z], idx) => {
        // Trunk
        temp.position.set(x, y + 6, z);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(1, 1, 1);
        temp.updateMatrix();
        pineTrunkMeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Leaf cone 1
        temp.position.set(x, y + 14, z);
        temp.updateMatrix();
        pineLeaf1MeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Leaf cone 2
        temp.position.set(x, y + 19, z);
        temp.updateMatrix();
        pineLeaf2MeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Leaf cone 3
        temp.position.set(x, y + 23.5, z);
        temp.updateMatrix();
        pineLeaf3MeshRef.current!.setMatrixAt(idx, temp.matrix);
      });
      pineTrunkMeshRef.current.instanceMatrix.needsUpdate = true;
      pineLeaf1MeshRef.current.instanceMatrix.needsUpdate = true;
      pineLeaf2MeshRef.current.instanceMatrix.needsUpdate = true;
      pineLeaf3MeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Broadleaf Trees (Trunk & 3 Spheres)
    if (broadTrunkMeshRef.current && broadLeaf1MeshRef.current && broadLeaf2MeshRef.current && broadLeaf3MeshRef.current) {
      treeLayout.broads.forEach(([x, y, z], idx) => {
        // Trunk
        temp.position.set(x, y + 7, z);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(1, 1, 1);
        temp.updateMatrix();
        broadTrunkMeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Spherical leaves 1 (center)
        temp.position.set(x, y + 17, z);
        temp.updateMatrix();
        broadLeaf1MeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Spherical leaves 2 (right offset)
        temp.position.set(x + 3, y + 20, z + 2);
        temp.updateMatrix();
        broadLeaf2MeshRef.current!.setMatrixAt(idx, temp.matrix);

        // Spherical leaves 3 (left offset)
        temp.position.set(x - 3, y + 19, z - 2);
        temp.updateMatrix();
        broadLeaf3MeshRef.current!.setMatrixAt(idx, temp.matrix);
      });
      broadTrunkMeshRef.current.instanceMatrix.needsUpdate = true;
      broadLeaf1MeshRef.current.instanceMatrix.needsUpdate = true;
      broadLeaf2MeshRef.current.instanceMatrix.needsUpdate = true;
      broadLeaf3MeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Red Cargo Crates
    if (redBoxMeshRef.current) {
      boxLayout.redBoxes.forEach(({ pos, scale }, idx) => {
        temp.position.set(...pos);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(...scale);
        temp.updateMatrix();
        redBoxMeshRef.current!.setMatrixAt(idx, temp.matrix);
      });
      redBoxMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Green Cargo Crates
    if (greenBoxMeshRef.current) {
      boxLayout.greenBoxes.forEach(({ pos, scale }, idx) => {
        temp.position.set(...pos);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(...scale);
        temp.updateMatrix();
        greenBoxMeshRef.current!.setMatrixAt(idx, temp.matrix);
      });
      greenBoxMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [treeLayout, boxLayout, dashes]);

  // Clean up all instanced geometry and material VRAM allocations on unmount
  useEffect(() => {
    return () => {
      // Automatic disposal is great, but we force-dispose geometry & materials for strict safety compliance
      const instancedRefs = [
        dashMeshRef, pineTrunkMeshRef, pineLeaf1MeshRef, pineLeaf2MeshRef, pineLeaf3MeshRef,
        broadTrunkMeshRef, broadLeaf1MeshRef, broadLeaf2MeshRef, broadLeaf3MeshRef,
        redBoxMeshRef, greenBoxMeshRef
      ];
      instancedRefs.forEach(ref => {
        if (ref.current) {
          ref.current.geometry.dispose();
          if (Array.isArray(ref.current.material)) {
            ref.current.material.forEach(m => m.dispose());
          } else {
            ref.current.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <group>
      {/* 1. Procedural Sky & Ambient sun light - Highly dramatic sunset */}
      <Sky sunPosition={[150, 15, -100]} turbidity={10} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />

      {/* 2. Runway Asphalt center strip */}
      <mesh receiveShadow position={[0, -4.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 12000]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* 3. Runway Center Dashed Lines (InstancedMesh) */}
      <instancedMesh ref={dashMeshRef} args={[null as any, null as any, dashes.length]}>
        <planeGeometry args={[1.5, 18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} />
      </instancedMesh>

      {/* 4. Runway side yellow limits */}
      <mesh position={[-44, -4.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 12000]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[44, -4.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 12000]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {/* 5. Pine Tree Trunks Instanced */}
      <instancedMesh ref={pineTrunkMeshRef} args={[null as any, null as any, treeLayout.pines.length]} castShadow>
        <cylinderGeometry args={[0.5, 0.9, 12, 8]} />
        <meshStandardMaterial color="#4a3b32" roughness={0.9} />
      </instancedMesh>

      {/* 6. Pine Tree Leaf Layers Instanced */}
      <instancedMesh ref={pineLeaf1MeshRef} args={[null as any, null as any, treeLayout.pines.length]} castShadow>
        <coneGeometry args={[5.5, 9, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={pineLeaf2MeshRef} args={[null as any, null as any, treeLayout.pines.length]} castShadow>
        <coneGeometry args={[4.2, 7.5, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={pineLeaf3MeshRef} args={[null as any, null as any, treeLayout.pines.length]} castShadow>
        <coneGeometry args={[2.8, 6, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </instancedMesh>

      {/* 7. Broadleaf Tree Trunks Instanced */}
      <instancedMesh ref={broadTrunkMeshRef} args={[null as any, null as any, treeLayout.broads.length]} castShadow>
        <cylinderGeometry args={[0.6, 1.2, 14, 8]} />
        <meshStandardMaterial color="#3b2d24" roughness={0.95} />
      </instancedMesh>

      {/* 8. Broadleaf Tree Leaf Spheres Instanced */}
      <instancedMesh ref={broadLeaf1MeshRef} args={[null as any, null as any, treeLayout.broads.length]} castShadow>
        <sphereGeometry args={[6.5, 8, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={broadLeaf2MeshRef} args={[null as any, null as any, treeLayout.broads.length]} castShadow>
        <sphereGeometry args={[4.5, 8, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={broadLeaf3MeshRef} args={[null as any, null as any, treeLayout.broads.length]} castShadow>
        <sphereGeometry args={[4.5, 8, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>

      {/* 9. Tactical Cargo Crates Red Instanced */}
      <instancedMesh ref={redBoxMeshRef} args={[null as any, null as any, boxLayout.redBoxes.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} metalness={0.3} />
      </instancedMesh>

      {/* 10. Tactical Cargo Crates Green Instanced */}
      <instancedMesh ref={greenBoxMeshRef} args={[null as any, null as any, boxLayout.greenBoxes.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} metalness={0.3} />
      </instancedMesh>

      {/* Custom Scenery: Hangars on the right side of the runway */}
      <Hangar position={[65, -5, -120]} rotation={[0, -Math.PI / 2, 0]} />
      <Hangar position={[65, -5, 60]} rotation={[0, -Math.PI / 2, 0]} />
      <Hangar position={[65, -5, -300]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Custom Scenery: Military vehicles on both shoulders */}
      <MilitaryHumvee position={[-52, -5, -60]} rotation={[0, Math.PI / 4, 0]} />
      <MilitaryHumvee position={[-55, -5, 100]} rotation={[0, -Math.PI / 6, 0]} />
      <MilitaryHumvee position={[50, -5, -40]} rotation={[0, -Math.PI / 2, 0]} />
      <MilitaryHumvee position={[-53, -5, -240]} rotation={[0, Math.PI / 5, 0]} />

      {/* 11. Erangel-style Radio Lattice Towers */}
      <LatticeTower position={[-85, -5, -400]} />
      <LatticeTower position={[-95, -5, 500]} />
      <LatticeTower position={[85, -5, -600]} />

      {/* 12. Drift Volumetric Clouds */}
      {Array.from({ length: 45 }).map((_, i) => {
        const seedX = Math.sin(i * 452.12) * 4000;
        const seedY = Math.abs(Math.sin(i * 123.85)) * 250 + 500;
        const seedZ = Math.cos(i * 921.65) * 4000;
        return (
          <VolumetricCloud key={`cloud-${i}`} position={[seedX, seedY, seedZ]} />
        );
      })}
    </group>
  );
}

// ==========================================
// 4. SOLDIER PROCEDURAL MODEL VISUALIZER
// ==========================================

export interface SoldierVisualProps {
  getPhysicsState?: () => { stance: 'stand' | 'crouch' | 'prone'; isMoving: boolean; isAiming: boolean };
  stance?: 'stand' | 'crouch' | 'prone';
  isMoving?: boolean;
  isAiming?: boolean;
  color?: string;
  isEnemy?: boolean;
}

export function VisualSoldierMesh({ getPhysicsState, stance = 'stand', isMoving = false, isAiming = false, color = '#10b981', isEnemy = false }: SoldierVisualProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const legsGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    let currentStance = stance;
    let currentIsMoving = isMoving;
    let currentIsAiming = isAiming;

    if (getPhysicsState) {
      const pState = getPhysicsState();
      currentStance = pState.stance;
      currentIsMoving = pState.isMoving;
      currentIsAiming = pState.isAiming;
    }

    const time = state.clock.getElapsedTime();
    const swingSpeed = 12;
    const swingAmp = 0.6;

    if (currentIsMoving && currentStance !== 'prone') {
      const angle = Math.sin(time * swingSpeed) * swingAmp;
      if (leftLegRef.current) leftLegRef.current.rotation.x = angle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -angle;

      if (!currentIsAiming) {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -angle * 0.5;
        if (rightArmRef.current) rightArmRef.current.rotation.x = angle * 0.5;
      }
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    if (currentIsAiming) {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.set(-1.3, -0.3, 0.2);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(-1.1, 0.5, -0.1);
      }
    } else {
      if (rightArmRef.current && !currentIsMoving) {
        rightArmRef.current.rotation.set(-0.3, 0, 0.1);
      }
      if (leftArmRef.current && !currentIsMoving) {
        leftArmRef.current.rotation.set(-0.3, 0, -0.1);
      }
    }

    // Crouch / Prone physical offset height adjustments
    if (torsoGroupRef.current) {
      if (currentStance === 'crouch') {
        torsoGroupRef.current.position.y = -1.2;
        torsoGroupRef.current.rotation.x = 0.15;
      } else if (currentStance === 'prone') {
        torsoGroupRef.current.position.y = -2.1;
        torsoGroupRef.current.rotation.x = 1.45;
      } else {
        torsoGroupRef.current.position.y = 0;
        torsoGroupRef.current.rotation.x = 0;
      }
    }

    // Hide legs if prone
    if (legsGroupRef.current) {
      legsGroupRef.current.visible = currentStance !== 'prone';
    }
  });

  return (
    <group position={[0, 1.2, 0]}>
      <group ref={torsoGroupRef}>
        {/* Torso Shirt */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[1.1, 1.4, 0.6]} />
          <meshStandardMaterial color={isEnemy ? "#475569" : "#f8fafc"} roughness={0.8} />
        </mesh>

        {/* Tactical Backpack */}
        <group position={[0, 0.1, 0.42]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 1.15, 0.45]} />
            <meshStandardMaterial color="#2d3a22" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0.05]}>
            <boxGeometry args={[0.9, 0.15, 0.4]} />
            <meshStandardMaterial color="#40301d" roughness={0.95} />
          </mesh>
        </group>

        {/* Head & Level 3 Helmet */}
        <group position={[0, 1.15, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.44, 16, 16]} />
            <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, -0.02]} castShadow>
            <sphereGeometry args={[0.49, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.06, -0.4]} castShadow>
            <boxGeometry args={[0.54, 0.16, 0.1]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.05} />
          </mesh>
        </group>

        {/* Arms holding rifle */}
        <group ref={leftArmRef} position={[-0.75, 0.6, 0]}>
          <mesh castShadow position={[0, -0.4, 0]}>
            <boxGeometry args={[0.26, 0.9, 0.26]} />
            <meshStandardMaterial color={isEnemy ? "#475569" : "#f8fafc"} roughness={0.8} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.75, 0.6, 0]}>
          <mesh castShadow position={[0, -0.4, 0]}>
            <boxGeometry args={[0.26, 0.9, 0.26]} />
            <meshStandardMaterial color={isEnemy ? "#475569" : "#f8fafc"} roughness={0.8} />
          </mesh>
        </group>

        {/* Rifle Mesh */}
        <group position={[0.45, -0.3, -0.6]} rotation={[0, 0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.15, 0.9]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, -0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.6]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <group ref={legsGroupRef}>
        <group ref={leftLegRef} position={[-0.32, -0.6, 0]}>
          <mesh castShadow position={[0, -0.6, 0]}>
            <boxGeometry args={[0.34, 1.2, 0.34]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.32, -0.6, 0]}>
          <mesh castShadow position={[0, -0.6, 0]}>
            <boxGeometry args={[0.34, 1.2, 0.34]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ==========================================
// 5. HIGH-FREQUENCY PLAYER RENDER LOOP
// ==========================================

export function PlayerVisual({ stateRef }: { stateRef: React.MutableRefObject<SharedGameState> }) {
  const meshRef = useRef<THREE.Group>(null);
  const flashGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Sync coordinates inside useFrame, completely skipping re-renders of the general UI
  useFrame(() => {
    const player = stateRef.current.player;

    if (meshRef.current) {
      // Direct positioning from 60Hz Physics Engine
      meshRef.current.position.copy(player.position);
      meshRef.current.rotation.set(0, player.yaw, 0);
    }

    if (bodyGroupRef.current) {
      bodyGroupRef.current.visible = !player.isFPP;
    }

    // Apply fluid recoil decay on muzzle flashes
    if (flashGroupRef.current) {
      const showFlash = player.showMuzzleFlash;
      flashGroupRef.current.visible = showFlash;
      if (showFlash) {
        flashGroupRef.current.position.fromArray(player.muzzleFlashPos);
      }
    }

    // Dynamic Camera placement (First-Person vs Third-Person Orbit)
    if (player.isFPP) {
      const eyeHeight = player.stance === 'crouch' ? 0.3 : player.stance === 'prone' ? -0.8 : 1.45;
      const eyePos = player.position.clone().add(new THREE.Vector3(0, eyeHeight, 0));
      camera.position.copy(eyePos);
      camera.rotation.set(player.pitch, player.yaw + Math.PI, 0, 'YXZ');
    } else {
      // Third Person Behind-Shoulder Camera with cinematic OTS Lerp
      const eyeHeight = player.stance === 'crouch' ? 0.4 : player.stance === 'prone' ? -0.5 : 1.8;
      const cameraOffset = new THREE.Vector3(
        player.isAiming ? 0.65 : 0, 
        eyeHeight, 
        player.isAiming ? 2.1 : 4.5
      );
      // Kickback recoil offset
      if (player.recoilOffset > 0) {
        cameraOffset.y += player.recoilOffset * 0.5;
        cameraOffset.z += player.recoilOffset;
      }

      cameraOffset.applyEuler(new THREE.Euler(0, player.yaw, 0));
      const targetCamPos = player.position.clone().add(cameraOffset);
      
      camera.position.lerp(targetCamPos, 0.25);
      
      const lookOffset = player.stance === 'crouch' ? 0.5 : player.stance === 'prone' ? -0.4 : 1.2;
      const lookTarget = player.position.clone().add(new THREE.Vector3(0, lookOffset, 0));
      camera.lookAt(lookTarget);
    }
  });

  return (
    <group>
      {/* Soldier visual body - Hidden in FPP Mode for gameplay realism */}
      <group ref={meshRef}>
        <group ref={bodyGroupRef}>
          <VisualSoldierMesh 
            getPhysicsState={() => {
              const p = stateRef.current.player;
              return {
                stance: p.stance,
                isMoving: p.isMoving,
                isAiming: p.isAiming
              };
            }}
            color="#10b981" 
          />
        </group>
      </group>

      {/* Muzzle Flash dynamic lighting */}
      <group ref={flashGroupRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.45, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" toneMapped={false} />
        </mesh>
        <pointLight color="#f59e0b" intensity={3.5} distance={20} />
      </group>
    </group>
  );
}

// ==========================================
// 6. HOSTILE BOTS VISUALIZER
// ==========================================

export function EnemyVisual({ stateRef, botId }: { stateRef: React.MutableRefObject<SharedGameState>; botId: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const activeGroupRef = useRef<THREE.Group>(null);
  const stunnedGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const enemy = stateRef.current.enemies[botId];
    if (!enemy) return;

    if (meshRef.current) {
      meshRef.current.position.copy(enemy.position);
      meshRef.current.rotation.set(0, enemy.yaw, 0);
    }

    const isActive = enemy.state === 'active';
    if (activeGroupRef.current) activeGroupRef.current.visible = isActive;
    if (stunnedGroupRef.current) stunnedGroupRef.current.visible = !isActive;
  });

  return (
    <group ref={meshRef}>
      {/* Active Group */}
      <group ref={activeGroupRef}>
        <VisualSoldierMesh 
          getPhysicsState={() => {
            const enemy = stateRef.current.enemies[botId];
            return {
              stance: 'stand',
              isMoving: enemy ? enemy.isMoving : false,
              isAiming: enemy ? enemy.isAiming : false
            };
          }}
          color="#f97316" 
          isEnemy={true}
        />
      </group>

      {/* Stunned Group */}
      <group ref={stunnedGroupRef} visible={false}>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.25} wireframe />
        </mesh>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <VisualSoldierMesh 
            stance="prone" 
            isMoving={false} 
            isAiming={false} 
            color="#3b82f6" 
            isEnemy={true}
          />
        </group>
      </group>
    </group>
  );
}

// ==========================================
// 7. MULTIPLAYER OTHER PLAYERS VISUALIZER
// ==========================================

export function OtherPlayerVisual({ id }: { id: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const data = otherPlayers[id];

  useFrame(() => {
    if (!data || !meshRef.current) return;
    meshRef.current.position.set(...data.position);
    meshRef.current.rotation.set(0, data.rotation[1], 0);
  });

  if (!data) return null;

  return (
    <group ref={meshRef}>
      <VisualSoldierMesh 
        stance="stand" 
        isMoving={false} 
        isAiming={false} 
        color={data.color || '#ec4899'} 
      />
    </group>
  );
}
