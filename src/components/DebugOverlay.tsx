import React from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SharedGameState } from './PhysicsEngine';
import { useGameStore } from '../store';

export function DebugOverlay({ stateRef, isLoaded }: { stateRef: React.MutableRefObject<SharedGameState>, isLoaded: boolean }) {
  const { camera } = useThree();
  const gameState = useGameStore(state => state.gameState);
  
  return (
    <Html>
      <div className="absolute top-4 left-4 z-[100] bg-black/60 p-4 rounded text-white font-mono text-xs pointer-events-none">
        <div>Pos: {camera.position.x.toFixed(0)}, {camera.position.y.toFixed(0)}, {camera.position.z.toFixed(0)}</div>
        <div>Rot: {camera.rotation.x.toFixed(2)}, {camera.rotation.y.toFixed(2)}</div>
        <div>Terrain: {isLoaded ? '✅' : '❌'}</div>
        <div>Skybox: {isLoaded ? '✅' : '❌'}</div>
        <div>Player: {stateRef?.current?.player ? '✅' : '❌'}</div>
        <div>Status: {isLoaded ? 'Loaded' : 'Loading...'}</div>
        <div>Game: {gameState}</div>
      </div>
    </Html>
  );
}
