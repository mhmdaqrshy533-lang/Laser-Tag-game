import React, { useRef, useState } from 'react';
import { useGameStore } from '../store';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Sphere, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';

const planets = [
  { id: 'mercury-x', nameAr: 'عطارد-X', nameEn: 'Mercury-X', color: '#fb923c', locked: false },
  { id: 'venus-x', nameAr: 'الزهرة-X', nameEn: 'Venus-X', color: '#fcd34d', locked: true },
  { id: 'earth-x', nameAr: 'الأرض-X', nameEn: 'Earth-X', color: '#60a5fa', locked: true },
  { id: 'mars-x', nameAr: 'المريخ-X', nameEn: 'Mars-X', color: '#ef4444', locked: true },
  { id: 'jupiter-x', nameAr: 'المشتري-X', nameEn: 'Jupiter-X', color: '#d97706', locked: true },
];

function Planet({ planet, position, onClick }: { planet: any, position: [number, number, number], onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (hovered && !planet.locked) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {
          if (!planet.locked) onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={planet.locked ? '#333333' : planet.color} 
          emissive={planet.locked ? '#000000' : planet.color}
          emissiveIntensity={hovered && !planet.locked ? 0.5 : 0.2}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      
      <Html position={[0, -1.5, 0]} center>
        <div className={`flex flex-col items-center gap-1 w-32 select-none ${planet.locked ? 'opacity-50' : ''}`}>
          <div className={`text-lg font-bold ${planet.locked ? 'text-slate-500' : 'text-white'}`}>{planet.nameAr}</div>
          <div className="text-xs tracking-widest text-slate-400 font-mono">{planet.nameEn}</div>
          {planet.locked && (
            <div className="text-red-500 text-xs font-bold mt-1">LOCKED</div>
          )}
        </div>
      </Html>
    </group>
  );
}

export function PlanetSelection() {
  const startGame = useGameStore(state => state.startGame);
  const setSelectedStage = useGameStore(state => state.setSelectedStage);

  const handleSelect = (id: string) => {
    if (id === 'mercury-x') {
      setSelectedStage('desert');
      startGame();
    }
  };

  return (
    <div className="absolute inset-0 bg-black z-50">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        
        <group position={[-4, 0, 0]}>
          {planets.map((planet, i) => (
            <Planet 
              key={planet.id} 
              planet={planet} 
              position={[i * 2.5, Math.sin(i) * 0.5, -Math.abs(i - 2)]} 
              onClick={() => handleSelect(planet.id)} 
            />
          ))}
        </group>

        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2} />
      </Canvas>
      
      <div className="absolute top-8 w-full text-center pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-lg">إختر الكوكب</h1>
        <div className="text-amber-500 font-mono text-sm mt-2 tracking-[0.2em]">SYSTEM_MAP // SECTOR_1</div>
      </div>
    </div>
  );
}
