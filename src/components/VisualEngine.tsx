/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SharedGameState, createInitialSharedState } from './PhysicsEngine';
import { useGameStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { cinematicEngine } from './CinematicEngine';

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
// 8. BOSS MECH VISUALIZER
// ==========================================

export function BossVisual({ stateRef, bossId }: { stateRef: React.MutableRefObject<SharedGameState>; bossId: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const reactorRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const shieldActive = useGameStore(state => state.bossShieldActive);

  useFrame((state, delta) => {
    const enemy = stateRef.current.enemies[bossId];
    if (!enemy || !meshRef.current) return;

    meshRef.current.position.copy(enemy.position);
    meshRef.current.rotation.set(0, enemy.yaw, 0);

    const time = state.clock.getElapsedTime();
    const phase = enemy.userData.phase || 1;
    
    // Boss breathing / floating animation (intensifies with phase)
    meshRef.current.position.y += Math.sin(time * (0.5 + phase * 0.2)) * (0.5 + phase * 0.1);

    if (reactorRef.current) {
      const mat = reactorRef.current.material as THREE.MeshStandardMaterial;
      const color = phase === 3 ? '#ef4444' : phase === 2 ? '#f59e0b' : '#8b5cf6';
      mat.color.set(color);
      mat.opacity = 0.6 + Math.sin(time * 10) * 0.2;
    }

    if (shieldRef.current) {
      const mat = shieldRef.current.material as THREE.MeshBasicMaterial;
      shieldRef.current.visible = shieldActive;
      if (shieldActive) {
        shieldRef.current.rotation.y += delta * 0.5;
        mat.opacity = 0.2 + Math.sin(time * 3) * 0.1;
      }
    }

    if (enemy.isMoving) {
      const angle = Math.sin(time * 4) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = angle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -angle;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Energy Shield Sphere */}
      <mesh ref={shieldRef}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Massive Mech Body */}
      <mesh position={[0, 6, 0]} castShadow>
        <boxGeometry args={[8, 10, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Reactor Core Glow */}
      <mesh ref={reactorRef} position={[0, 6, 3.1]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 6, 4]} color="#8b5cf6" intensity={5} distance={20} />

      {/* Head Unit */}
      <group ref={headRef} position={[0, 12, 1]}>
        <mesh castShadow>
          <boxGeometry args={[4, 3, 4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 2.1]}>
          <boxGeometry args={[3, 0.5, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>

      {/* Left Arm Cannon */}
      <group position={[-6, 8, 2]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Right Arm Cannon */}
      <group position={[6, 8, 2]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-3, 0, 0]}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[2, 6, 2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[3, 0, 0]}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[2, 6, 2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 9. CINEMATIC OVERLAY & DIALOGUE (UI LAYER)
// ==========================================

export function CinematicOverlay() {
  const dialogue = useGameStore(state => state.activeDialogue);

  if (!dialogue) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 z-50 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-xl border-l-4 border-amber-500 p-6 rounded-r-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="text-amber-500 font-mono text-[10px] mb-2 tracking-[0.3em] uppercase opacity-80">نظام الاتصال الميداني: Alpha-6</div>
        <div className="text-white text-lg font-medium leading-relaxed tracking-tight text-right dir-rtl">
          {dialogue}
        </div>
      </div>
    </div>
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
      
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 200, 3000]} />
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Massive Grass Ground */}
      <mesh receiveShadow position={[0, -5.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20000, 20000]} />
        <meshStandardMaterial color="#166534" roughness={1.0} metalness={0.0} />
      </mesh>
      
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
                  <Text position={[-3, 0.5, -4]} rotation={[-Math.PI / 2, 0, Math.PI]} fontSize={1.5} color="#cbd5e1" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
                    TANKEEL
                  </Text>
                  <Text position={[3, 0.5, -4]} rotation={[-Math.PI / 2, 0, Math.PI]} fontSize={1.5} color="#cbd5e1">
                    تَنكِيل
                  </Text>
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
// 11. HIGH-FREQUENCY PLAYER RENDER LOOP
// ==========================================

export function PlayerVisual({ stateRef }: { stateRef: React.MutableRefObject<SharedGameState> }) {
  const meshRef = useRef<THREE.Group>(null);
  const flashGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const planeGroupRef = useRef<THREE.Group>(null);  const soldierGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Sync coordinates inside useFrame, completely skipping re-renders of the general UI
  useFrame((state, delta) => {
    const player = stateRef.current.player;
    if (planeGroupRef.current) planeGroupRef.current.visible = !!player.inVehicle;    if (soldierGroupRef.current) soldierGroupRef.current.visible = !player.inVehicle;

    // Update Cinematic Engine
    cinematicEngine.update(delta, state.clock.getElapsedTime());

    // Sync dialogue to store for UI overlay
    const store = useGameStore.getState();
    if (store.activeDialogue !== cinematicEngine.activeDialogue) {
      store.setActiveDialogue(cinematicEngine.activeDialogue);
    }

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

    // Handle Scripted Events from Physics Engine
    if (stateRef.current.scriptedEvents.includes('boss_reveal')) {
      stateRef.current.scriptedEvents = stateRef.current.scriptedEvents.filter(e => e !== 'boss_reveal');
      stateRef.current.scriptedEvents.push('boss_reveal_active');
      
      // Add Cinematic Events
      cinematicEngine.addEvent({
        id: 'boss_cam_1',
        type: 'camera_move',
        startTime: state.clock.getElapsedTime(),
        duration: 4,
        params: { start: [0, 0, 0], end: [0, 10, -50] }
      });
      cinematicEngine.addEvent({
        id: 'boss_shake_1',
        type: 'shake',
        startTime: state.clock.getElapsedTime(),
        duration: 3,
        params: { intensity: 1.5 }
      });
      cinematicEngine.addEvent({
        id: 'boss_dialogue_1',
        type: 'dialogue',
        startTime: state.clock.getElapsedTime() + 0.5,
        duration: 3,
        params: { text: "تحذير: تم رصد طاقة هائلة تقترب من موقعك. استعد للمواجهة!" }
      });
    }

    // Dynamic Camera placement (First-Person vs Third-Person Orbit)
    const shakeOffset = cinematicEngine.getShakeOffset();

    if (player.isFPP) {
      if (stateRef.current.selectedStage === 'desert') {
        const eyePos = player.position.clone();
        // Camera is right at the front of the plane cockpit
        eyePos.add(new THREE.Vector3(0, 0, 0).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'))).add(shakeOffset);
        camera.position.copy(eyePos);
        camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
      } else {
        const eyeHeight = player.stance === 'crouch' ? 0.3 : player.stance === 'prone' ? -0.8 : 1.45;
        const eyePos = player.position.clone().add(new THREE.Vector3(0, eyeHeight, 0)).add(shakeOffset);
        camera.position.copy(eyePos);
        camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
      }
    } else {
      // Third Person Behind-Shoulder Camera with cinematic OTS Lerp
      if (stateRef.current.selectedStage === 'desert') {
         const cameraOffset = new THREE.Vector3(0, 10, 30);
         cameraOffset.applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));
         const targetCamPos = player.position.clone().add(cameraOffset).add(shakeOffset);
         camera.position.lerp(targetCamPos, 0.25);
         camera.lookAt(player.position);
      } else {
         const eyeHeight = player.stance === 'crouch' ? 0.4 : player.stance === 'prone' ? -0.5 : 1.8;
         const cameraOffset = new THREE.Vector3(
           player.isAiming ? 0.65 : 0, 
           eyeHeight, 
           player.isAiming ? 2.1 : 4.5
         );
         
         // Apply Cinematic Offset
         cameraOffset.add(cinematicEngine.cameraOffset);

         // Kickback recoil offset
         if (player.recoilOffset > 0) {
           cameraOffset.y += player.recoilOffset * 0.5;
           cameraOffset.z += player.recoilOffset;
         }

         cameraOffset.applyEuler(new THREE.Euler(0, player.yaw, 0));
         const targetCamPos = player.position.clone().add(cameraOffset).add(shakeOffset);
         
         camera.position.lerp(targetCamPos, 0.25);
         
         const lookOffset = player.stance === 'crouch' ? 0.5 : player.stance === 'prone' ? -0.4 : 1.2;
         const lookTarget = player.position.clone().add(new THREE.Vector3(0, lookOffset, 0));
      }
    }
  });
  return (
    <group>
      {/* Soldier visual body - Hidden in FPP Mode for gameplay realism */}
      <group ref={meshRef}>
        <group ref={bodyGroupRef}>
             <group ref={planeGroupRef}>
               {/* Stealth Plane Flying Wing design - More Detailed */}
               <group rotation={[0, Math.PI, 0]}>
                   {/* Main body */}
                   <mesh castShadow>
                     <boxGeometry args={[25, 1, 15]} />
                     <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
                   </mesh>
                   {/* Wings */}
                   <mesh castShadow position={[0, 0, -5]}>
                     <coneGeometry args={[15, 8, 3, 1]} />
                     <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                   </mesh>
                   {/* Cockpit canopy */}
                   <mesh position={[0, 1.0, 2]} castShadow>
                     <boxGeometry args={[4, 1.5, 6]} />
                     <meshStandardMaterial color="#000000" metalness={1.0} roughness={0.0} />
                   </mesh>
                   
                   <Text position={[-3, 1.5, -4]} rotation={[0, Math.PI, 0]} fontSize={1.5} color="#cbd5e1">
                     TANKEEL
                   </Text>
               </group>
             </group>
             <group ref={soldierGroupRef}>
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
      </group>
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
// 12. HOSTILE BOTS VISUALIZER
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

  const enemy = stateRef.current.enemies[botId];
  if (enemy?.type === 'facility') {
    return (
      <group ref={meshRef}>
        {enemy.health > 0 ? (
          <group>
            <mesh castShadow receiveShadow position={[0, 20, 0]}>
              <boxGeometry args={[40, 40, 40]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 45, 0]}>
              <sphereGeometry args={[10, 16, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
            {/* Simple Health bar */}
            <mesh position={[0, 60, 0]}>
               <planeGeometry args={[(enemy.health / 1000) * 30, 2]} />
               <meshBasicMaterial color="red" />
            </mesh>
          </group>
        ) : (
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[40, 20, 40]} />
            <meshStandardMaterial color="#333" metalness={0.9} roughness={0.9} />
          </mesh>
        )}
      </group>
    );
  }
  if (enemy?.type === 'boss') {
    return <BossVisual stateRef={stateRef} bossId={botId} />;
  }
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
             getPhysicsState={() => ({ stance: 'prone', isMoving: false, isAiming: false })}
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
         getPhysicsState={() => ({ stance: 'stand', isMoving: false, isAiming: false })}
         color={data.color || '#ec4899'} 
       />
    </group>
  );
}

// ==========================================
// 13. POOLED IMPACT PARTICLES (INSTANCED)
// ==========================================

const MAX_PARTICLES = 1000;
const dummyParticle = new THREE.Object3D();

export function ImpactParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    (window as any).addParticles = (pos: [number, number, number], color: string) => {
      const count = 12;
      for (let i = 0; i < count; i++) {
        particles.current.push({
          pos: new THREE.Vector3(...pos),
          vel: new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 12, (Math.random() - 0.5) * 12),
          life: 1.0,
          color: new THREE.Color(color)
        });
      }
      if (particles.current.length > MAX_PARTICLES) {
        particles.current.splice(0, particles.current.length - MAX_PARTICLES);
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles.current[i];
      if (p && p.life > 0) {
        p.pos.addScaledVector(p.vel, delta);
        p.vel.y -= 30 * delta;
        p.life -= delta * 2.5;
        dummyParticle.position.copy(p.pos);
        dummyParticle.scale.setScalar(p.life * 0.3);
        dummyParticle.updateMatrix();
        meshRef.current.setMatrixAt(i, dummyParticle.matrix);
      } else {
        dummyParticle.scale.setScalar(0);
        dummyParticle.updateMatrix();
        meshRef.current.setMatrixAt(i, dummyParticle.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, MAX_PARTICLES]}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshBasicMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ==========================================
// 14. POOLED LASER TRACERS (INSTANCED)
// ==========================================

const MAX_LASERS = 150;
const dummyLaser = new THREE.Object3D();

export function Lasers() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lasers = useRef<any[]>([]);

  useEffect(() => {
    (window as any).addLaser = (start: [number, number, number], end: [number, number, number], color: string) => {
      const s = new THREE.Vector3(...start);
      const e = new THREE.Vector3(...end);
      const dir = new THREE.Vector3().subVectors(e, s);
      lasers.current.push({
        start: s,
        end: e,
        len: dir.length(),
        life: 1.0,
        color: new THREE.Color(color)
      });
      if (lasers.current.length > MAX_LASERS) {
        lasers.current.shift();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < MAX_LASERS; i++) {
      const l = lasers.current[i];
      if (l && l.life > 0) {
        l.life -= delta * 6.0;
        const mid = new THREE.Vector3().addVectors(l.start, l.end).multiplyScalar(0.5);
        dummyLaser.position.copy(mid);
        dummyLaser.lookAt(l.end);
        dummyLaser.scale.set(0.08 * l.life, 0.08 * l.life, l.len);
        dummyLaser.updateMatrix();
        meshRef.current.setMatrixAt(i, dummyLaser.matrix);
      } else {
        dummyLaser.scale.setScalar(0);
        dummyLaser.updateMatrix();
        meshRef.current.setMatrixAt(i, dummyLaser.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, MAX_LASERS]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={1} />
    </instancedMesh>
  );
}

// ==========================================
// 16. CHRONOS SHIFT EFFECT
// ==========================================

export function ChronosEffect() {
  const isTimeDilationActive = useGameStore(state => state.isTimeDilationActive);
  const { set } = useThree();
  
  useFrame((state) => {
    // Dynamic color shift during time dilation
    if (isTimeDilationActive) {
      const t = state.clock.getElapsedTime();
      const intensity = 0.5 + Math.sin(t * 8) * 0.1;
      // We simulate a "blue shift" or "cold" effect
      state.gl.setClearColor('#0a0f1a', 1);
    } else {
      state.gl.setClearColor('#020617', 1);
    }
  });

  return (
    <>
      {isTimeDilationActive && (
        <group>
          <mesh scale={[100, 100, 100]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              side={THREE.BackSide} 
              transparent 
              opacity={0.05} 
            />
          </mesh>
        </group>
      )}
    </>
  );
}
export function ShieldGeneratorVisual({ id }: { id: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const generator = useGameStore(state => state.shieldGenerators.find(g => g.id === id));
  
  useFrame((state, delta) => {
    if (!meshRef.current || !generator) return;
    const time = state.clock.getElapsedTime();
    
    if (generator.health > 0) {
      meshRef.current.children[0].rotation.y += delta * 2;
    } else {
      meshRef.current.scale.setScalar(Math.max(0.2, meshRef.current.scale.x - delta * 0.5));
      meshRef.current.position.y = Math.max(-2, meshRef.current.position.y - delta * 2);
    }
  });

  if (!generator) return null;

  return (
    <group ref={meshRef} position={generator.position}>
      {/* Rotating Core */}
      <mesh position={[0, 3, 0]}>
        <octahedronGeometry args={[2]} />
        <meshStandardMaterial 
          color={generator.health > 0 ? "#3b82f6" : "#475569"} 
          emissive={generator.health > 0 ? "#3b82f6" : "#000000"}
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[3, 4, 1, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Beam to Boss (Conceptual) */}
      {generator.health > 0 && (
        <mesh position={[0, 50, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 100]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>
      )}
      
    </group>
  );
}

export function DesertVisual() {
  const { camera } = useThree();
  const dunesRef = useRef<THREE.Mesh>(null);
  


  return (
    <group>
      <color attach="background" args={['#2a1f12']} />
      <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      
      <ambientLight intensity={0.6} color="#fcd34d" />
      <directionalLight 
        position={[200, 500, 200]} 
        intensity={2.0} 
        color="#fbbf24" 
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-10000}
        shadow-camera-right={10000}
        shadow-camera-top={10000}
        shadow-camera-bottom={-10000}
      />
      
      <fog attach="fog" args={['#2a1f12', 500, 15000]} />
      
      {/* Massive Desert Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0,-150,0]}>
        <planeGeometry args={[40000, 40000, 128, 128]} />
        <meshStandardMaterial color="#b45309" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Procedural Mountains/Hills */}
      {Array.from({ length: 40 }).map((_, i) => (
         <mesh 
           key={`mtn-${i}`}
           position={[Math.sin(i * 123) * 8000, -150, Math.cos(i * 456) * 8000]} 
           rotation={[0, i, 0]}
           castShadow
         >
           <coneGeometry args={[2000 + Math.random() * 2000, 3000 + Math.random() * 2000, 3]} />
           <meshStandardMaterial color="#92400e" roughness={0.9} />
         </mesh>
      ))}

      {/* Scattered Rocks */}
      {Array.from({ length: 300 }).map((_, i) => (
         <mesh 
           key={`rock-${i}`}
           position={[Math.sin(i * 99) * 5000, -145, Math.cos(i * 88) * 5000]} 
           castShadow
         >
           <dodecahedronGeometry args={[50 + Math.random() * 200]} />
           <meshStandardMaterial color="#57534e" roughness={0.8} />
         </mesh>
      ))}
    </group>
  );
}
