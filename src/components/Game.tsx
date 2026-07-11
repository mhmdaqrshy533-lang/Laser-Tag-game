/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
const AnyCanvas = Canvas as any;
import { useGameStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Import our decoupled engines
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
  OtherPlayerVisual 
} from './VisualEngine';
import { Effects } from './Effects';
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

// ==========================================
// CENTRAL INPUT & FIXED STEP SIMULATION LOOP
// ==========================================

interface LoopProps {
  stateRef: React.MutableRefObject<SharedGameState>;
  triggerReloadRef: React.MutableRefObject<() => void>;
  shootRef: React.MutableRefObject<() => void>;
}

function GameLoop({ stateRef, triggerReloadRef, shootRef }: LoopProps) {
  const gameState = useGameStore(state => state.gameState);
  const playerState = useGameStore(state => state.playerState);
  const playerLevel = useGameStore(state => state.playerLevel);

  // Actions
  const hitPlayer = useGameStore(state => state.hitPlayer);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const addLaser = useGameStore(state => state.addLaser);
  const addParticles = useGameStore(state => state.addParticles);

  // Timers
  const updateTime = useGameStore(state => state.updateTime);
  const updateEnemies = useGameStore(state => state.updateEnemies);
  const cleanupEffects = useGameStore(state => state.cleanupEffects);

  // Inputs Ref
  const keys = useRef({ w: false, a: false, s: false, d: false, ' ': false });
  const isMouseDown = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Fixed Timestep Accumulator
  const accumulator = useRef(0);
  const TIMESTEP = 1 / 60; // 60Hz Physical updates

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }

      // Keyboard stance/views binds
      if (key === 'c') {
        stateRef.current.player.stance = stateRef.current.player.stance === 'crouch' ? 'stand' : 'crouch';
      }
      if (key === 'z') {
        stateRef.current.player.stance = stateRef.current.player.stance === 'prone' ? 'stand' : 'prone';
      }
      if (key === 'f') {
        stateRef.current.player.isFPP = !stateRef.current.player.isFPP;
      }
      if (key === 'r') {
        triggerReloadRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      isMouseDown.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      // Left click triggers firing
      if (e.button === 0) {
        shootRef.current();
      }
      // Right click toggles OTS zoom aim
      if (e.button === 2) {
        e.preventDefault();
        stateRef.current.player.isAiming = !stateRef.current.player.isAiming;
      }
    };

    const handlePointerUp = () => {
      isMouseDown.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMouseDown.current) return;
      let deltaX = e.clientX - prevMousePos.current.x;
      let deltaY = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      const isForcedLandscape = window.innerHeight > window.innerWidth;
      if (isForcedLandscape) {
        const tempX = deltaX;
        deltaX = deltaY;
        deltaY = -tempX;
      }

      const sensitivity = 0.003;
      const player = stateRef.current.player;
      player.yaw -= deltaX * sensitivity;
      player.pitch = Math.max(-0.6, Math.min(0.6, player.pitch - deltaY * sensitivity));
    };

    const preventContext = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('contextmenu', preventContext);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('contextmenu', preventContext);
    };
  }, [stateRef, triggerReloadRef, shootRef]);

  // Synchronize mobile joystick looking values
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      if (state.mobileInput.shooting) {
        shootRef.current();
      }
    });
    return unsub;
  }, [shootRef]);

  // Game physical delta integration
  useFrame((_, delta) => {
    const now = Date.now();
    updateTime(delta);
    updateEnemies(now);
    cleanupEffects(now);

    // Fixed timestep update loops
    accumulator.current += delta;
    if (accumulator.current > 0.2) accumulator.current = 0.2; // Cap lag spikes

    while (accumulator.current >= TIMESTEP) {
      simulateFixedStep(
        stateRef.current,
        keys.current,
        {
          move: useGameStore.getState().mobileInput.move,
          look: useGameStore.getState().mobileInput.look,
          shooting: useGameStore.getState().mobileInput.shooting
        },
        TIMESTEP,
        playerLevel,
        gameState,
        playerState,
        {
          hitPlayer,
          hitEnemy,
          addLaser,
          addParticles
        }
      );
      accumulator.current -= TIMESTEP;
    }
  });

  return null;
}

// Custom R3F state override component to force WebGL drawing buffer and camera
// to landscape aspect ratio when the container is rotated by 90 degrees CSS
function CanvasSizeOverride() {
  const set = useThree((state: any) => state.set);
  const gl = useThree((state: any) => state.gl);
  const camera = useThree((state: any) => state.camera);

  const performOverride = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const isPortrait = window.innerHeight > window.innerWidth;
    const targetWidth = isPortrait ? window.innerHeight : window.innerWidth;
    const targetHeight = isPortrait ? window.innerWidth : window.innerHeight;

    set({
      size: {
        width: targetWidth,
        height: targetHeight,
        top: 0,
        left: 0,
      }
    });
    gl.setSize(targetWidth, targetHeight);
    if ((camera as any).isPerspectiveCamera) {
      const cam = camera as any;
      cam.aspect = targetWidth / targetHeight;
      cam.updateProjectionMatrix();
    }
  }, [set, gl, camera]);

  // Run immediately on mount and window resize
  useEffect(() => {
    performOverride();
    window.addEventListener('resize', performOverride);
    return () => window.removeEventListener('resize', performOverride);
  }, [performOverride]);

  // Also safeguard inside useFrame to continuously override any automated R3F ResizeObserver changes
  useFrame((state) => {
    const isPortrait = window.innerHeight > window.innerWidth;
    const targetWidth = isPortrait ? window.innerHeight : window.innerWidth;
    const targetHeight = isPortrait ? window.innerWidth : window.innerHeight;

    if (state.size.width !== targetWidth || state.size.height !== targetHeight) {
      set({
        size: {
          width: targetWidth,
          height: targetHeight,
          top: 0,
          left: 0,
        }
      });
      state.gl.setSize(targetWidth, targetHeight);
      if ((state.camera as any).isPerspectiveCamera) {
        const cam = state.camera as any;
        cam.aspect = targetWidth / targetHeight;
        cam.updateProjectionMatrix();
      }
    }
  });

  return null;
}

// ==========================================
// 3D GAME VIEWPORT CONTAINER
// ==========================================

export function Game() {
  const enemies = useGameStore(state => state.enemies);
  const otherPlayerIds = useGameStore(
    useShallow(state => Object.keys(state.otherPlayers))
  );
  const isMobile = useIsMobile();
  const gameState = useGameStore(state => state.gameState);

  // Initialize decoupled physical state ref
  const stateRef = useRef<SharedGameState>(createInitialSharedState());
  const [canvasKey, setCanvasKey] = useState(0);

  // Dynamic canvas sizing to override R3F ResizeObserver issues in rotated container
  const [canvasSize, setCanvasSize] = useState(() => {
    if (typeof window === 'undefined') return { width: 800, height: 600 };
    const isPortrait = window.innerHeight > window.innerWidth;
    return {
      width: isPortrait ? window.innerHeight : window.innerWidth,
      height: isPortrait ? window.innerWidth : window.innerHeight,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setCanvasSize({
        width: isPortrait ? window.innerHeight : window.innerWidth,
        height: isPortrait ? window.innerWidth : window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset local coordinate logs on restart
  useEffect(() => {
    if (gameState === 'playing') {
      stateRef.current = createInitialSharedState();
    }
  }, [gameState]);

  // We capture R3F camera and dispatch raycasting triggers inside refs for high performance
  const triggerReloadRef = useRef<() => void>(() => {});
  const shootRef = useRef<() => void>(() => {});

  // Set up action hooks to avoid closures inside useFrame
  useEffect(() => {
    triggerReloadRef.current = () => {
      const p = stateRef.current.player;
      if (p.isReloading || p.ammo === 30) return;
      p.isReloading = true;
      setTimeout(() => {
        p.ammo = 30;
        p.isReloading = false;
        useGameStore.getState().setAmmo(30);
      }, 1500);
    };
  }, []);

  // Raycaster Firing Action Hook
  const addLaser = useGameStore(state => state.addLaser);
  const addParticles = useGameStore(state => state.addParticles);
  const hitEnemy = useGameStore(state => state.hitEnemy);

  useEffect(() => {
    shootRef.current = () => {
      const player = stateRef.current.player;
      if (useGameStore.getState().gameState !== 'playing' || player.isReloading) return;
      if (player.ammo <= 0) {
        triggerReloadRef.current();
        return;
      }

      // Check bullet firing timing rate (M416: 110ms)
      const now = Date.now();
      if ((window as any).lastShootTime && now - (window as any).lastShootTime < 110) return;
      (window as any).lastShootTime = now;

      player.ammo -= 1;
      useGameStore.getState().setAmmo(player.ammo);

      // Firing screen shake/recoil
      player.pitch = Math.min(0.6, player.pitch + 0.015);
      player.recoilOffset = 0.08;
      setTimeout(() => { player.recoilOffset = 0; }, 60);

      // Trigger muzzle flash
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, player.yaw, 0));
      const barrelOffset = new THREE.Vector3(0.5, 0.9, -1.3).applyQuaternion(q);
      const flashPos = player.position.clone().add(barrelOffset);
      player.muzzleFlashPos = [flashPos.x, flashPos.y, flashPos.z];
      player.showMuzzleFlash = true;
      setTimeout(() => { player.showMuzzleFlash = false; }, 45);

      // Calculate camera coordinates
      const camDir = new THREE.Vector3(0, 0, -1);
      
      // We grab camera look rotation from window context easily
      const glCanvas = document.querySelector('canvas');
      if (glCanvas) {
        // Approximate standard look direction
        camDir.set(0, 0, -1).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));
      }

      const cameraHeight = player.stance === 'prone' ? 0.35 : (player.stance === 'crouch' ? 0.9 : 1.6);
      const barrelHeight = player.stance === 'prone' ? 0.2 : (player.stance === 'crouch' ? 0.65 : 1.2);

      const rayStart = player.position.clone().add(new THREE.Vector3(0, cameraHeight, 0));
      const barrelOrigin = player.position.clone().add(
        new THREE.Vector3(0.4, barrelHeight, -1.2).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, player.yaw, 0)))
      );

      // Fast vector cylinder check for bullet pathing
      let closestEnemyId: string | null = null;
      let closestDist = Infinity;
      const enemyRadius = 1.8;

      Object.values(stateRef.current.enemies).forEach(enemy => {
        const toEnemy = enemy.position.clone().add(new THREE.Vector3(0, cameraHeight, 0)).sub(rayStart);
        const projection = toEnemy.dot(camDir);
        if (projection < 0) return; // behind us

        const closestPointOnRay = rayStart.clone().addScaledVector(camDir, projection);
        const distToEnemy = closestPointOnRay.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, cameraHeight, 0)));
        
        if (distToEnemy < enemyRadius && projection < closestDist) {
          closestEnemyId = enemy.id;
          closestDist = projection;
        }
      });

      if (closestEnemyId) {
        const bot = stateRef.current.enemies[closestEnemyId];
        bot.state = 'disabled';
        bot.disabledUntil = Date.now() + 5000; // Stun for 5 seconds
        
        hitEnemy(closestEnemyId, true);
        
        const hitPoint = bot.position.clone().add(new THREE.Vector3(0, cameraHeight, 0));
        addParticles([hitPoint.x, hitPoint.y, hitPoint.z], '#22c55e'); // Green blood splatter
        addLaser([barrelOrigin.x, barrelOrigin.y, barrelOrigin.z], [hitPoint.x, hitPoint.y, hitPoint.z], '#f59e0b');
      } else {
        // Draw standard range shot
        const missEnd = rayStart.clone().addScaledVector(camDir, 1000);
        addLaser([barrelOrigin.x, barrelOrigin.y, barrelOrigin.z], [missEnd.x, missEnd.y, missEnd.z], '#f59e0b');
      }
    };
  }, [hitEnemy, addParticles, addLaser]);

  const handleCanvasReset = () => {
    // Increment Canvas key to re-mount fully fresh and clear context leaks
    setCanvasKey(prev => prev + 1);
  };

  return (
    <div className="w-full h-full relative" id="game-canvas-container">
      <WebGLBoundary onReset={handleCanvasReset}>
        <AnyCanvas 
          key={canvasKey}
          size={canvasSize}
          shadows={!isMobile} 
          camera={{ fov: 75, near: 0.1, far: 8000 }}
          dpr={isMobile ? [1, 1.25] : [1, 2]}
          gl={{ 
            antialias: true, 
            alpha: false, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
        >
          {/* Dynamic canvas drawing buffer size and aspect ratio correction */}
          <CanvasSizeOverride />

          {/* Context Loss Guardian */}
          <WebGLContextListener onContextLost={handleCanvasReset} />

          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#87CEEB', 200, 3000]} />
          
          <ambientLight intensity={isMobile ? 1.0 : 0.8} />
          <directionalLight 
            position={[100, 100, 50]} 
            intensity={1.5} 
            castShadow={!isMobile} 
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Centered logic processors */}
          <GameLoop 
            stateRef={stateRef} 
            triggerReloadRef={triggerReloadRef} 
            shootRef={shootRef} 
          />

          {/* Optimized environment meshes */}
          <ArenaVisual />

          {/* High speed visual mesh hooks */}
          <PlayerVisual stateRef={stateRef} />

          {enemies.map(enemy => (
            <EnemyVisual key={enemy.id} stateRef={stateRef} botId={enemy.id} />
          ))}

          {otherPlayerIds.map(id => (
            <OtherPlayerVisual key={id} id={id} />
          ))}

          <Effects />

          {/* Highly optimized tactical Bloom shader */}
          {!isMobile && (
            <EffectComposer>
              <Bloom luminanceThreshold={1} mipmapBlur intensity={0.4} />
            </EffectComposer>
          )}
        </AnyCanvas>
      </WebGLBoundary>
    </div>
  );
}
