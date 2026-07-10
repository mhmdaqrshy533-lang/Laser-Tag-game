/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier, RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../store';

// Beautiful procedural M416 Assault Rifle mesh
function RifleVisual({ isAiming }: { isAiming: boolean }) {
  return (
    <group position={[0.45, -0.3, -0.6]} rotation={[0.0, 0.05, 0]}>
      {/* Gun Main Body */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.15, 0.9]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Buttstock */}
      <mesh position={[0, -0.02, 0.55]} castShadow>
        <boxGeometry args={[0.06, 0.14, 0.3]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Gun Barrel */}
      <mesh position={[0, 0.02, -0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.6]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Magazine Clip */}
      <mesh position={[0, -0.22, -0.15]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.22, 0.12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Scope Attachment (Red Dot / Holo) */}
      <group position={[0, 0.11, -0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.06, 0.22]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0.05]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Holographic lens glow */}
        <mesh position={[0, 0.05, -0.02]} rotation={[Math.PI/2, 0, 0]}>
          <planeGeometry args={[0.035, 0.035]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Handguard grip */}
      <mesh position={[0, -0.11, -0.4]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Highly polished 3D Soldier Visual Component matching the PUBG screenshot
export function SoldierVisual({ 
  stance = 'stand', 
  isMoving = false, 
  isAiming = false, 
  time = 0, 
  color = '#10b981' 
}: { 
  stance?: 'stand' | 'crouch' | 'prone'; 
  isMoving?: boolean; 
  isAiming?: boolean; 
  time?: number; 
  color?: string;
}) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);

  // Procedural leg swing & arm swing based on movement
  useFrame(() => {
    const swingSpeed = 12;
    const swingAmp = 0.6;
    
    if (isMoving && stance !== 'prone') {
      const angle = Math.sin(time * swingSpeed) * swingAmp;
      if (leftLegRef.current) leftLegRef.current.rotation.x = angle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -angle;
      
      if (!isAiming) {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -angle * 0.5;
        if (rightArmRef.current) rightArmRef.current.rotation.x = angle * 0.5;
      }
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    // Aiming arm angles
    if (isAiming) {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.3;
        rightArmRef.current.rotation.y = -0.3;
        rightArmRef.current.rotation.z = 0.2;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.1;
        leftArmRef.current.rotation.y = 0.5;
        leftArmRef.current.rotation.z = -0.1;
      }
    } else {
      if (rightArmRef.current && !isMoving) {
        rightArmRef.current.rotation.set(-0.3, 0, 0.1);
      }
      if (leftArmRef.current && !isMoving) {
        leftArmRef.current.rotation.set(-0.3, 0, -0.1);
      }
    }

    // Adapt visual posture height for crouching/proning
    if (torsoGroupRef.current) {
      if (stance === 'crouch') {
        torsoGroupRef.current.position.y = -1.2;
        torsoGroupRef.current.rotation.x = 0.15; // lean forward slightly
      } else if (stance === 'prone') {
        torsoGroupRef.current.position.y = -2.1;
        torsoGroupRef.current.rotation.x = 1.45; // lay flat on ground
      } else {
        torsoGroupRef.current.position.y = 0;
        torsoGroupRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group position={[0, 1.2, 0]}>
      {/* Root Torso and everything above it */}
      <group ref={torsoGroupRef}>
         {/* Torso: White tactical shirt with folds */}
         <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
            <boxGeometry args={[1.1, 1.4, 0.6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.8} metalness={0.05} />
         </mesh>

         {/* Collar / Shirt details */}
         <mesh position={[0, 0.75, -0.1]} rotation={[Math.PI / 12, 0, 0]}>
            <boxGeometry args={[0.5, 0.15, 0.5]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
         </mesh>

         {/* Camouflage Military Backpack (Mottled green/brown boxes with black straps) */}
         <group position={[0, 0.1, 0.42]}>
            {/* Main backpack pouch */}
            <mesh castShadow>
               <boxGeometry args={[0.85, 1.15, 0.45]} />
               <meshStandardMaterial color="#2d3a22" roughness={0.9} />
            </mesh>
            {/* Camo print detail 1 (horizontal brown strap/stripe) */}
            <mesh position={[0, 0.2, 0.05]}>
               <boxGeometry args={[0.9, 0.15, 0.4]} />
               <meshStandardMaterial color="#40301d" roughness={0.95} />
            </mesh>
            {/* Camo print detail 2 (vertical tan strap/stripe) */}
            <mesh position={[0.2, -0.1, 0.05]}>
               <boxGeometry args={[0.15, 0.9, 0.4]} />
               <meshStandardMaterial color="#57533e" roughness={0.95} />
            </mesh>
            {/* Secondary lower pocket */}
            <mesh position={[0, -0.25, 0.1]} castShadow>
               <boxGeometry args={[0.7, 0.45, 0.25]} />
               <meshStandardMaterial color="#1e2d14" roughness={0.9} />
            </mesh>
            {/* Left strap */}
            <mesh position={[-0.43, 0.1, -0.25]}>
               <boxGeometry args={[0.06, 1.0, 0.1]} />
               <meshStandardMaterial color="#020617" />
            </mesh>
            {/* Right strap */}
            <mesh position={[0.43, 0.1, -0.25]}>
               <boxGeometry args={[0.06, 1.0, 0.1]} />
               <meshStandardMaterial color="#020617" />
            </mesh>
         </group>

         {/* Head & Level 3 Military Tactical Helmet */}
         <group position={[0, 1.15, 0.0]}>
            {/* Face/Skin */}
            <mesh castShadow>
               <sphereGeometry args={[0.44, 16, 16]} />
               <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
            </mesh>
            
            {/* Level 3 Helmet dome */}
            <mesh position={[0, 0.12, -0.02]} castShadow>
               <sphereGeometry args={[0.49, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
               <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
            </mesh>
            
            {/* Level 3 Helmet protective chin guard */}
            <mesh position={[0, -0.1, -0.15]} castShadow>
               <boxGeometry args={[0.45, 0.25, 0.35]} />
               <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Black ballistic visor plate on front (Level 3 characteristic helmet shield) */}
            <mesh position={[0, 0.06, -0.4]} castShadow>
               <boxGeometry args={[0.54, 0.16, 0.1]} />
               <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.05} />
            </mesh>
            <mesh position={[0, 0.06, -0.46]}>
               <boxGeometry args={[0.3, 0.02, 0.02]} />
               <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
         </group>

         {/* Left Arm holding weapon grip */}
         <group ref={leftArmRef} position={[-0.75, 0.6, 0]}>
            <mesh castShadow position={[0, -0.4, 0]}>
               <boxGeometry args={[0.26, 0.9, 0.26]} />
               <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
            {/* Skin hand */}
            <mesh position={[0, -0.9, 0]}>
               <sphereGeometry args={[0.13, 8, 8]} />
               <meshStandardMaterial color="#fbcfe8" />
            </mesh>
         </group>

         {/* Right Arm holding weapon trigger */}
         <group ref={rightArmRef} position={[0.75, 0.6, 0]}>
            <mesh castShadow position={[0, -0.4, 0]}>
               <boxGeometry args={[0.26, 0.9, 0.26]} />
               <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
            {/* Skin hand */}
            <mesh position={[0, -0.9, 0]}>
               <sphereGeometry args={[0.13, 8, 8]} />
               <meshStandardMaterial color="#fbcfe8" />
            </mesh>
         </group>

         {/* Holds the M416 tactical rifle */}
         <RifleVisual isAiming={isAiming} />
      </group>

      {/* Legs (Only swing when NOT in prone stance) */}
      {stance !== 'prone' && (
        <>
          {/* Left Leg: Dark trousers & black boots */}
          <group ref={leftLegRef} position={[-0.32, -0.6, 0]}>
             <mesh castShadow position={[0, -0.6, 0]}>
                <boxGeometry args={[0.34, 1.2, 0.34]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
             </mesh>
             {/* Boot */}
             <mesh position={[0, -1.25, -0.06]} castShadow>
                <boxGeometry args={[0.36, 0.18, 0.48]} />
                <meshStandardMaterial color="#020617" roughness={0.4} />
             </mesh>
          </group>

          {/* Right Leg */}
          <group ref={rightLegRef} position={[0.32, -0.6, 0]}>
             <mesh castShadow position={[0, -0.6, 0]}>
                <boxGeometry args={[0.34, 1.2, 0.34]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
             </mesh>
             {/* Boot */}
             <mesh position={[0, -1.25, -0.06]} castShadow>
                <boxGeometry args={[0.36, 0.18, 0.48]} />
                <meshStandardMaterial color="#020617" roughness={0.4} />
             </mesh>
          </group>
        </>
      )}
    </group>
  );
}

export function Player() {
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  const playerState = useGameStore(state => state.gameState);
  const addLaser = useGameStore(state => state.addLaser);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const addParticles = useGameStore(state => state.addParticles);
  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);

  // Character States
  const [stance, setStance] = useState<'stand' | 'crouch' | 'prone'>('stand');
  const [isAiming, setIsAiming] = useState(false);
  const [isFPP, setIsFPP] = useState(false);
  const [ammo, setAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);

  // Recoil offset for weapon fire kickback
  const [recoilOffset, setRecoilOffset] = useState(0);

  // Muzzle Flash state
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [muzzleFlashPos, setMuzzleFlashPos] = useState<[number, number, number]>([0, 0, 0]);

  // Pointer angles (yaw and pitch)
  const pointerYaw = useRef(0);
  const pointerPitch = useRef(0.1); // slight tilt downwards

  // Ground / Movement variables
  const playerPosition = useRef(new THREE.Vector3(0, -3.9, 0)); // Start on road surface (Y=-5 + half height)
  const playerVelocityY = useRef(0);
  const isGrounded = useRef(true);
  const [isMoving, setIsMoving] = useState(false);

  const planeGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<RapierRigidBody>(null);

  // Controls map
  const keys = useRef({ 
    w: false, a: false, s: false, d: false, ' ': false,
    c: false, z: false, r: false, f: false
  });

  const lastEmitTime = useRef(0);
  const lastShootTime = useRef(0);

  // Pointer dragging orbit logic (iframe-safe mouse looking)
  const isMouseDown = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Handle keys and mouse click drag for orbit look
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
      
      // Crouch toggle
      if (key === 'c') {
        setStance(current => current === 'crouch' ? 'stand' : 'crouch');
      }
      // Prone toggle
      if (key === 'z') {
        setStance(current => current === 'prone' ? 'stand' : 'prone');
      }
      // Reload trigger
      if (key === 'r') {
        triggerReload();
      }
      // FPP / TPP toggle
      if (key === 'f') {
        setIsFPP(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Allow drag rotating anywhere
      isMouseDown.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      // Left click to shoot
      if (e.button === 0) {
         shoot();
      }
      // Right click to toggle Scope / Aim
      if (e.button === 2) {
         e.preventDefault();
         setIsAiming(prev => !prev);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isMouseDown.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMouseDown.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.003;
      pointerYaw.current -= deltaX * sensitivity;
      pointerPitch.current = Math.max(-0.6, Math.min(0.6, pointerPitch.current - deltaY * sensitivity));
    };

    const preventContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [playerState, stance, ammo, isReloading]);

  // Synchronize mobile input values as well
  useEffect(() => {
     // Periodically check if shooting from store is active
     const unsub = useGameStore.subscribe(
       (state) => {
          if (state.mobileInput.shooting) {
             shoot();
          }
       }
     );
     return unsub;
  }, []);

  const triggerReload = () => {
     if (isReloading || ammo === 30) return;
     setIsReloading(true);
     // Simulating reload time of 1.5 seconds
     setTimeout(() => {
       setAmmo(30);
       setIsReloading(false);
     }, 1500);
  };

  const shoot = () => {
    if (playerState !== 'playing' || isReloading) return;
    if (ammo <= 0) {
       triggerReload();
       return;
    }

    const now = Date.now();
    if (now - lastShootTime.current < 110) return; // M416 automatic firing rate: ~110ms
    lastShootTime.current = now;
    setAmmo(prev => prev - 1);

    // Muzzle flash visual trigger
    if (planeGroupRef.current) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pointerYaw.current, 0));
      const barrelOffset = new THREE.Vector3(0.5, 0.9, -1.3).applyQuaternion(q);
      const flashPos = playerPosition.current.clone().add(barrelOffset);
      setMuzzleFlashPos([flashPos.x, flashPos.y, flashPos.z]);
      setShowMuzzleFlash(true);
      setTimeout(() => setShowMuzzleFlash(false), 45);
    }

    // Camera firing recoil kickback
    pointerPitch.current = Math.min(0.6, pointerPitch.current + 0.015);
    setRecoilOffset(0.08);
    setTimeout(() => setRecoilOffset(0), 60);

    // Raycasting: starts from the camera, pointing directly where the crosshair points
    const camDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Begin raycast from player's eye height
    const rayStart = playerPosition.current.clone().add(new THREE.Vector3(0, 1.2, 0));
    const ray = new rapier.Ray(
        { x: rayStart.x, y: rayStart.y, z: rayStart.z }, 
        { x: camDirection.x, y: camDirection.y, z: camDirection.z }
    );
    const hit = world.castRay(ray, 1500, true);
    
    let endPosVec;
    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      endPosVec = new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
      
      const collider = hit.collider;
      const rb = collider.parent();
      if (rb && rb.userData) {
        const userData = rb.userData as { name?: string };
        const name = userData.name;
        if (name) {
          if (name.startsWith('bot-')) {
             hitEnemy(name, true);
          } else if (name !== 'player' && useGameStore.getState().otherPlayers[name]) {
             hitEnemy(name, true);
          }
        }
      }
      
      // Beautiful green blood hit splatter / spark particle effect mimicking PUBG Mobile
      addParticles([endPosVec.x, endPosVec.y, endPosVec.z], '#22c55e');
    } else {
      endPosVec = rayStart.clone().add(camDirection.multiplyScalar(1500));
    }

    // Draw tracer
    const barrelOrigin = playerPosition.current.clone().add(new THREE.Vector3(0.4, 0.9, -1.2).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pointerYaw.current, 0))));
    addLaser(
        [barrelOrigin.x, barrelOrigin.y, barrelOrigin.z], 
        [endPosVec.x, endPosVec.y, endPosVec.z], 
        '#f59e0b' // yellow tracer round
    );
  };

  useFrame((state, delta) => {
    if (playerState !== 'playing') return;

    const k = keys.current;
    const mobileInput = useGameStore.getState().mobileInput;

    // Expose pointerYaw to window for high-performance fluid compass rendering
    (window as any).playerYaw = pointerYaw.current;

    // Process mobile action toggles
    if (mobileInput.crouch) {
      setStance(current => current === 'crouch' ? 'stand' : 'crouch');
      useGameStore.getState().setMobileInput({ crouch: false });
    }
    if (mobileInput.prone) {
      setStance(current => current === 'prone' ? 'stand' : 'prone');
      useGameStore.getState().setMobileInput({ prone: false });
    }
    if (mobileInput.jump && isGrounded.current && stance === 'stand') {
      playerVelocityY.current = 13.5; // Jump strength
      isGrounded.current = false;
      useGameStore.getState().setMobileInput({ jump: false });
    }
    if (mobileInput.scope) {
      setIsAiming(prev => !prev);
      useGameStore.getState().setMobileInput({ scope: false });
    }
    if (mobileInput.fpp) {
      setIsFPP(prev => !prev);
      useGameStore.getState().setMobileInput({ fpp: false });
    }

    // Toggle Scope with mobile input
    if (mobileInput.shooting) shoot();

    // 1. Calculate movement vectors relative to camera Yaw orientation
    const moveX = (k.d ? 1 : 0) - (k.a ? 1 : 0) + mobileInput.move.x;
    const moveY = (k.w ? 1 : 0) - (k.s ? 1 : 0) - mobileInput.move.y; // invert joysticks if needed
    
    setIsMoving(moveX !== 0 || moveY !== 0);

    // Speed factors based on posture stance
    let moveSpeed = 16.5; // standard walking speed
    if (stance === 'crouch') moveSpeed = 8.0;
    if (stance === 'prone') moveSpeed = 3.2;
    if (isAiming) moveSpeed *= 0.6; // slow down when aiming down sights

    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (moveX !== 0 || moveY !== 0) {
      // Determine movement angles relative to yaw direction
      const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, pointerYaw.current, 0));
      const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, pointerYaw.current, 0));
      
      moveDirection.addScaledVector(forwardVec, moveY);
      moveDirection.addScaledVector(rightVec, moveX);
      moveDirection.normalize();

      // Update position coordinates
      playerPosition.current.addScaledVector(moveDirection, moveSpeed * delta);
    }

    // 2. Jumping physics (restricted when Crouched or Proned)
    const roadGroundLevel = -3.9; // Y position when feet are on the floor (Y = -5 + 1.1 half height)
    
    // Manual gravity simulation
    if (playerPosition.current.y > roadGroundLevel) {
       playerVelocityY.current -= 38 * delta; // Gravity force
       isGrounded.current = false;
    } else {
       playerPosition.current.y = roadGroundLevel;
       playerVelocityY.current = 0;
       isGrounded.current = true;
    }

    if (k[' '] && isGrounded.current && stance === 'stand') {
       playerVelocityY.current = 13.5; // Jump strength
       isGrounded.current = false;
    }
    
    playerPosition.current.y += playerVelocityY.current * delta;

    // Apply translation to Three.JS Group and Rapier Physics Body
    if (planeGroupRef.current) {
        planeGroupRef.current.position.copy(playerPosition.current);
        // Face the player towards the Yaw direction
        planeGroupRef.current.rotation.y = pointerYaw.current;
        
        // Weapon and arms subtle offsets during motion or breathing
        const breathe = Math.sin(state.clock.elapsedTime * 2.5) * 0.015;
        planeGroupRef.current.position.y += breathe;
    }
    
    if (bodyRef.current) {
        bodyRef.current.setNextKinematicTranslation(playerPosition.current);
        bodyRef.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pointerYaw.current, 0)));
    }

    // 3. Camera Position Logic (Third Person Over-The-Shoulder / First Person inside head)
    let targetCameraPos = new THREE.Vector3();
    const qCam = new THREE.Quaternion().setFromEuler(new THREE.Euler(pointerPitch.current, pointerYaw.current, 0));
    
    if (isFPP) {
      // FPP Camera inside head
      const headOffset = new THREE.Vector3(0, 1.25, -0.2).applyQuaternion(qCam);
      targetCameraPos.copy(playerPosition.current).add(headOffset);
      camera.position.copy(targetCameraPos);
    } else {
      // TPP camera orbits behind player's shoulder
      const aimZoomFactor = isAiming ? 10 : 16; // Camera gets closer when aiming
      const cameraOffset = new THREE.Vector3(1.2, 1.3, aimZoomFactor).applyQuaternion(qCam);
      targetCameraPos.copy(playerPosition.current).add(cameraOffset);
      
      // Interpolate for extremely smooth camera following motion
      camera.position.lerp(targetCameraPos, 0.25);
    }

    // Smooth field of view transition for scope aiming
    const targetFOV = isAiming ? 25 : 72; // Zoom camera
    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
       persCam.fov = THREE.MathUtils.lerp(persCam.fov, targetFOV, 0.25);
       persCam.updateProjectionMatrix();
    }

    // Look at point: matches the center crosshair
    const targetLookAt = playerPosition.current.clone()
       .add(new THREE.Vector3(0, 1.2, 0)) // target player head/shoulders height
       .add(new THREE.Vector3(0, -recoilOffset, -100).applyQuaternion(qCam)); // look forward
    camera.lookAt(targetLookAt);

    // Sync player details over multiplayer network
    const now = Date.now();
    if (now - lastEmitTime.current > 100) {
      updatePlayerPosition(
          [playerPosition.current.x, playerPosition.current.y, playerPosition.current.z], 
          [0, pointerYaw.current, 0] // Send Euler rotation
      );
      lastEmitTime.current = now;
    }
  });

  const selectedStage = useGameStore(state => state.selectedStage);
  
  return (
    <>
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} userData={{ name: 'player' }}>
         {/* Capsule Collider spanning feet to shoulder height */}
         <mesh position={[0, 0, 0]} visible={false}>
            <cylinderGeometry args={[0.6, 0.6, 2.4]} />
         </mesh>
      </RigidBody>

      {/* Gun fire muzzle flash effect */}
      {showMuzzleFlash && (
        <group position={muzzleFlashPos}>
           <mesh>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color="#fcd34d" toneMapped={false} />
           </mesh>
           <pointLight color="#fcd34d" intensity={5} distance={15} />
        </group>
      )}

      {/* Render Player Soldier model if NOT in FPP, or render only arms/gun in FPP */}
      <group ref={planeGroupRef}>
         {!isFPP ? (
           <SoldierVisual 
              stance={stance} 
              isMoving={isMoving} 
              isAiming={isAiming} 
              time={performance.now() * 0.001} 
           />
         ) : (
           // Render a minimal FP gun holder so arms & gun are still visible on camera
           <group position={[-0.1, 1.1, -0.2]}>
              <RifleVisual isAiming={isAiming} />
           </group>
         )}
      </group>

      {/* Floating Tactical Scope Reticle overlay if aiming */}
      {isAiming && (
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {/* Sniper Scope Vignette */}
            <div className="absolute inset-0 bg-radial-vignette opacity-85"></div>
            
            {/* Crosshair circle with ticks */}
            <div className="relative w-[320px] h-[320px] rounded-full border-[3px] border-black flex items-center justify-center">
                {/* Horizontal grid line */}
                <div className="absolute w-[300px] h-[1px] bg-black/80"></div>
                {/* Vertical grid line */}
                <div className="absolute h-[300px] w-[1px] bg-black/80"></div>
                
                {/* Red dot center */}
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_red]"></div>
                
                {/* Tactical lines and range ticks */}
                <div className="absolute top-[30%] h-3 w-[1px] bg-black"></div>
                <div className="absolute top-[40%] h-3 w-[1px] bg-black"></div>
                <div className="absolute bottom-[30%] h-3 w-[1px] bg-black"></div>
                <div className="absolute bottom-[40%] h-3 w-[1px] bg-black"></div>
                
                <div className="absolute right-[30%] w-3 h-[1px] bg-black"></div>
                <div className="absolute right-[40%] w-3 h-[1px] bg-black"></div>
                <div className="absolute left-[30%] w-3 h-[1px] bg-black"></div>
                <div className="absolute left-[40%] w-3 h-[1px] bg-black"></div>

                {/* Outer scope overlay markings */}
                <span className="absolute top-2 text-[10px] text-green-500 font-mono font-bold">4X</span>
                <span className="absolute bottom-4 text-[9px] text-green-500 font-mono">100M</span>
            </div>
         </div>
      )}

      {/* Screen HUD Indicators overlay (for Ammo status) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/75 border border-slate-700/80 rounded-xl px-6 py-2.5 flex items-center gap-6 z-40 pointer-events-auto shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
         <div className="flex flex-col select-none text-left">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest font-sans">WEAPON</span>
            <span className="text-white text-base font-black font-sans tracking-wide">M416 (AUTO)</span>
         </div>
         
         <div className="w-[1px] h-8 bg-slate-700"></div>

         <div className="flex items-baseline gap-1 select-none">
            <span className={`text-3xl font-black font-sans ${ammo < 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
               {isReloading ? '...' : ammo}
            </span>
            <span className="text-sm text-slate-400 font-bold">/ 120</span>
         </div>

         {isReloading && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full animate-bounce shadow-md font-sans">
                RELOADING...
            </div>
         )}
      </div>
    </>
  );
}
