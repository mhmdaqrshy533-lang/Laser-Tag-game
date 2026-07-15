/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
const AnyCanvas = Canvas as any;
import { useGameStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { useProgress } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { LoadingScreen } from './LoadingScreen';
import { DebugOverlay } from './DebugOverlay';

import { 
  SharedGameState, 
  createInitialSharedState, 
  simulateFixedStep 
} from './PhysicsEngine';
import { 
  WebGLBoundary, 
  WebGLContextListener, 
  ArenaVisual, 
  PlayerVisual, 
  EnemyVisual, 
  OtherPlayerVisual,
  CinematicOverlay,
  Lasers,
  ImpactParticles,
  ShieldGeneratorVisual,
  ChronosEffect,
  DesertVisual
} from './VisualEngine';
import * as THREE from 'three';

// Detect mobile clients for DPR scaling
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    return uaMatch || coarsePointer || window.innerWidth < 768;
  });

  useEffect(() => {
    const check = () => {
      const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(uaMatch || coarsePointer || window.innerWidth < 768);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

interface LoopProps {
  stateRef: React.MutableRefObject<SharedGameState>;
  triggerReloadRef: React.MutableRefObject<() => void>;
  shootRef: React.MutableRefObject<() => void>;
}

function GameLoop({ stateRef, triggerReloadRef, shootRef }: LoopProps) {
  const { camera } = useThree();

  useEffect(() => {
    shootRef.current = () => {
       const physState = stateRef.current;
       if (!physState) return;
       const winKeys = (window as any).keys || {};
       winKeys[' '] = true;
       setTimeout(() => { winKeys[' '] = false; }, 100);
    };
    triggerReloadRef.current = () => {
       const physState = stateRef.current;
       if (!physState) return;
       physState.player.isReloading = true;
       setTimeout(() => { physState.player.isReloading = false; }, 2000);
    };
  }, []);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    const physState = stateRef.current;
    if (!physState) return;

    physState.selectedStage = store.selectedStage;

    const winKeys = (window as any).keys || {};
    const mobileInput = store.mobileInput || { move: {x: 0, y: 0}, look: {x: 0, y: 0}, shooting: false };
    const keys = { 
      w: winKeys.w || false, 
      a: winKeys.a || false, 
      s: winKeys.s || false, 
      d: winKeys.d || false, 
      ' ': winKeys[' '] || false, 
      shift: winKeys.shift || false 
    };

    simulateFixedStep(
      physState, 
      keys,
      mobileInput,
      delta, 
      store.playerLevel,
      store.gameState,
      store.playerState,
      {
        hitPlayer: store.hitPlayer,
        hitEnemy: store.hitEnemy,
        winGame: store.winGame,
        addLaser: (start, end, color) => {
           if ((window as any).addLaser) (window as any).addLaser(start, end, color);
        },
        addParticles: (position, color) => {
           if ((window as any).addImpactParticle) (window as any).addImpactParticle(position, color);
        },
        toggleTimeDilation: store.toggleTimeDilation,
        updateAbilityEnergy: store.updateAbilityEnergy,
        setPlaneStats: store.setPlaneStats
      }
    );
  });

  return null;
}

export function Game() {
  const isMobile = useIsMobile();
  const gameState = useGameStore(state => state.gameState);
  const selectedStage = useGameStore(state => state.selectedStage);
  
  const { progress, item, errors } = useProgress();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        setIsTimedOut(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [selectedStage]);

  useEffect(() => {
    if (errors.length > 0) {
      setHasError(true);
    }
  }, [errors]);
  
  // Create state based on the actual stage
  const stateRef = useRef<SharedGameState>(createInitialSharedState(useGameStore.getState().selectedStage));
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    if (gameState === 'playing') {
      setIsTimedOut(false);
      setHasError(false);
      stateRef.current = createInitialSharedState(useGameStore.getState().selectedStage);
    }
  }, [gameState, selectedStage]);

  const triggerReloadRef = useRef<() => void>(() => {});
  const shootRef = useRef<() => void>(() => {});

  const handleCanvasReset = () => {
    setCanvasKey(prev => prev + 1);
  };

  const isMouseDown = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  const isLoading = progress < 100 && !isTimedOut && !hasError;

  return (
    <div 
      className="w-full h-full relative" id="game-canvas-container"
      onPointerDown={(e) => {
        isMouseDown.current = true;
        prevMousePos.current = { x: e.clientX, y: e.clientY };
        if (e.button === 0) shootRef.current();
        if (e.button === 2) stateRef.current.player.isAiming = !stateRef.current.player.isAiming;
      }}
      onPointerUp={() => { isMouseDown.current = false; }}
      onPointerMove={(e) => {
        if (!isMouseDown.current) return;
        let deltaX = e.clientX - prevMousePos.current.x;
        let deltaY = e.clientY - prevMousePos.current.y;
        prevMousePos.current = { x: e.clientX, y: e.clientY };
        
        const isForcedLandscape = window.innerWidth < window.innerHeight;
        if (isForcedLandscape) {
          const tempX = deltaX;
          deltaX = deltaY;
          deltaY = -tempX;
        }
        
        const sensitivity = 0.003;
        stateRef.current.player.yaw -= deltaX * sensitivity;
        stateRef.current.player.pitch -= deltaY * sensitivity;
        
        stateRef.current.player.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, stateRef.current.player.pitch));
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CinematicOverlay />
      {isLoading && (
        <LoadingScreen 
          progress={progress} 
          item={item || undefined} 
          error={isTimedOut ? "انتهت مهلة التحميل" : hasError ? "فشل تحميل بعض الموارد" : null} 
        />
      )}
      <WebGLBoundary onReset={handleCanvasReset}>
        <Suspense fallback={null}>
            <AnyCanvas 
            key={canvasKey}
            shadows={!isMobile} 
            camera={{ fov: 75, near: 0.1, far: 8000 }}
            dpr={isMobile ? 1 : [1, 2]}
            gl={{ 
                antialias: true, 
                alpha: false, 
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false
            }}
            >
            <WebGLContextListener onContextLost={handleCanvasReset} />
            
            <DebugOverlay 
              stateRef={stateRef}
              isLoaded={!isLoading}
            />
            
            <GameLoop 
                stateRef={stateRef} 
                triggerReloadRef={triggerReloadRef} 
                shootRef={shootRef} 
            />

            {selectedStage === 'desert' ? (
                <DesertVisual />
            ) : (
                <ArenaVisual />
            )}

            <Lasers />
            <ImpactParticles />
            <ChronosEffect />

            <PlayerVisual stateRef={stateRef} />
            
            {/* We use an internal component to render enemies to avoid Game re-render loop on enemies array */}
            <EnemiesRenderer stateRef={stateRef} />
            <GeneratorsRenderer stateRef={stateRef} />
            <OtherPlayersRenderer />
            
            {!isMobile && (
                <EffectComposer>
                <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
                </EffectComposer>
            )}
            </AnyCanvas>
        </Suspense>
      </WebGLBoundary>
    </div>
  );
}

// These helper components prevent re-rendering the whole Game (and Canvas) when array changes
function EnemiesRenderer({ stateRef }: { stateRef: React.MutableRefObject<SharedGameState> }) {
   const enemies = useGameStore(useShallow(state => state.enemies));
   return (
     <>
       {enemies.map(enemy => (
         <EnemyVisual key={enemy.id} stateRef={stateRef} botId={enemy.id} />
       ))}
     </>
   );
}

function GeneratorsRenderer({ stateRef }: { stateRef: React.MutableRefObject<SharedGameState> }) {
   const shieldGenerators = useGameStore(useShallow(state => state.shieldGenerators));
   return (
     <>
       {shieldGenerators.map(gen => (
         <ShieldGeneratorVisual key={gen.id} id={gen.id} />
       ))}
     </>
   );
}

function OtherPlayersRenderer() {
   const otherPlayerIds = useGameStore(useShallow(state => Object.keys(state.otherPlayers)));
   return (
     <>
       {otherPlayerIds.map(id => (
         <OtherPlayerVisual key={id} id={id} />
       ))}
     </>
   );
}
