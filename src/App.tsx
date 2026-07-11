/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { Game } from './components/Game';
import { useGameStore } from './store';
import CinematicIntro from './components/CinematicIntro';
import LobbyScreen from './components/LobbyScreen';
import HangarScreen from './components/HangarScreen';
import CampaignScreen from './components/CampaignScreen';
import MissionsScreen from './components/MissionsScreen';
import AboutScreen from './components/AboutScreen';
import { sound } from './components/SoundSystem';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Navigation, 
  Play, 
  Shield, 
  Sliders, 
  Wifi, 
  RotateCcw, 
  Activity 
} from 'lucide-react';

// Compass tape parameters
const COMPASS_HEADINGS: { angle: number; label: string }[] = [];
const HEADINGS_CONFIG: Record<number, string> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW'
};

// Generate compass tick marks from -180 to 540 degrees to allow continuous wrapping
for (let i = -180; i <= 540; i += 5) {
  const angle = (i % 360 + 360) % 360;
  const label = HEADINGS_CONFIG[angle] !== undefined 
    ? HEADINGS_CONFIG[angle] 
    : (angle % 15 === 0 ? angle.toString() : '');
  COMPASS_HEADINGS.push({ angle: i, label });
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    return uaMatch || coarsePointer || window.innerWidth < 1024;
  });

  useEffect(() => {
    const check = () => {
      const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(uaMatch || coarsePointer || window.innerWidth < 1024);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function HUD() {
  const gameState = useGameStore(state => state.gameState);
  const score = useGameStore(state => state.score);
  const timeLeft = useGameStore(state => state.timeLeft);
  const playerState = useGameStore(state => state.playerState);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const leaveGame = useGameStore(state => state.leaveGame);
  const mobileInput = useGameStore(state => state.mobileInput);
  const setMobileInput = useGameStore(state => state.setMobileInput);
  const playerLevel = useGameStore(state => state.playerLevel);

  // Store Vital states
  const health = useGameStore(state => state.health);
  const armor = useGameStore(state => state.armor);
  const energy = useGameStore(state => state.energy);
  const ammo = useGameStore(state => state.ammo);
  const reserveAmmo = useGameStore(state => state.reserveAmmo);
  const setAmmo = useGameStore(state => state.setAmmo);
  const activeWeapon = useGameStore(state => state.activeWeapon);
  const useMedkit = useGameStore(state => state.useMedkit);
  const useArmorKit = useGameStore(state => state.useArmorKit);
  const useEnergyDrink = useGameStore(state => state.useEnergyDrink);

  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [showTrainingGuide, setShowTrainingGuide] = useState(playerLevel === 1);
  const [localIsReloading, setLocalIsReloading] = useState(false);

  // Compass DOM reference for zero-lag high speed CSS transformations
  const compassContainerRef = useRef<HTMLDivElement>(null);
  
  // Minimap player pointers reference
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Virtual Joystick state/refs
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);
  const isDraggingJoystick = useRef(false);
  const joystickCenter = useRef({ x: 0, y: 0 });

  // Expose current stance & aim values for styling posture states
  const [currentStance, setCurrentStance] = useState<'stand' | 'crouch' | 'prone'>('stand');
  const [isAiming, setIsAiming] = useState(false);
  const [isFPP, setIsFPP] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Derive dynamic Battle Royale metrics
  const eliminations = Math.floor(score / 100);
  const remainingPlayers = Math.max(1, 41 - eliminations);

  // Trigger weapon reloading sequence
  const triggerReload = () => {
    if (isReloading || localIsReloading || ammo === 30) return;
    setLocalIsReloading(true);
    // Sync with player.tsx
    const keysMap = (window as any).keys || {};
    keysMap.r = true;
    setTimeout(() => {
      setAmmo(30);
      setLocalIsReloading(false);
      keysMap.r = false;
    }, 1500);
  };

  // Setup functional Virtual Joystick
  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDraggingJoystick.current = true;
      const rect = joystick.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateJoystickPosition(e);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingJoystick.current) return;
      // Prevent browser default touch scrolling while dragging
      if ('preventDefault' in e) e.preventDefault();
      updateJoystickPosition(e);
    };

    const handleEnd = () => {
      if (!isDraggingJoystick.current) return;
      isDraggingJoystick.current = false;
      setMobileInput({ move: { x: 0, y: 0 } });
      if (joystickHandleRef.current) {
        joystickHandleRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    const updateJoystickPosition = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - joystickCenter.current.x;
      const dy = clientY - joystickCenter.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = 42; // maximum bounds for drag

      let angle = Math.atan2(dy, dx);
      let constrainedRadius = Math.min(distance, maxRadius);

      const moveX = Math.cos(angle) * constrainedRadius;
      const moveY = Math.sin(angle) * constrainedRadius;

      if (joystickHandleRef.current) {
        joystickHandleRef.current.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
      }

      // Map to movement input coordinates
      const normX = moveX / maxRadius;
      const normY = moveY / maxRadius;
      setMobileInput({ move: { x: normX, y: -normY } }); // invert vertical joystick relative to coordinate grid
    };

    joystick.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    joystick.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      joystick.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);

      joystick.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [setMobileInput]);

  // Double requestAnimationFrame loop for scrolling compass, interactive minimap and window state scraping
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      // Scrap window exposed state values from Player.tsx for extreme performance zero-lag rendering
      const win = window as any;
      if (win.playerStance) setCurrentStance(win.playerStance);
      setIsAiming(!!win.playerIsAiming);
      setIsFPP(!!win.playerIsFPP);
      setIsReloading(!!win.playerIsReloading);

      // -- Update Compass --
      const rawYaw = win.playerYaw || 0;
      // Convert ThreeJS yaw to compass heading degrees
      const headingDegrees = ((rawYaw * 180 / Math.PI) % 360 + 360) % 360;
      
      if (compassContainerRef.current) {
        // Translate: 4px per degree. Center is offset
        const translation = (180 - headingDegrees) * 4.4;
        compassContainerRef.current.style.transform = `translateX(${translation}px)`;
      }

      // -- Draw Minimap Radar --
      const canvas = minimapCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Grid Background
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
          ctx.lineWidth = 1;
          for (let i = 0; i < w; i += 16) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
          }

          // Draw airfield runway line in center
          ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.fillRect(w / 2 - 8, 5, 16, h - 10);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(w / 2, 5); ctx.lineTo(w / 2, h - 10); ctx.stroke();
          ctx.setLineDash([]);

          // Safe Playzone Circle (Pulsing blue ring)
          const pulse = 22 + Math.sin(Date.now() * 0.003) * 2;
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Outer dangerous storm circle (Red ring)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
          ctx.stroke();

          // local player indicator at map center
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-rawYaw); // align look direction

          // Look direction green cone
          ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 32, -Math.PI / 6 - Math.PI/2, Math.PI / 6 - Math.PI/2);
          ctx.fill();

          // Player dot
          ctx.fillStyle = '#eab308'; // PUBG yellow
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(4, 4);
          ctx.lineTo(-4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Draw generic indicator for other players
          const otherPlayersState = useGameStore.getState().otherPlayers;
          ctx.fillStyle = '#ef4444'; // Red enemy dots
          Object.values(otherPlayersState).forEach((player, idx) => {
             const dx = (player.position[0]) * 0.08;
             const dz = (player.position[2]) * 0.08;
             const px = w / 2 + dx;
             const py = h / 2 + dz;
             if (px > 5 && px < w - 5 && py > 5 && py < h - 5) {
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
             }
          });
        }
      }

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans">
      
      {/* ----------------- TOP-LEFT PANEL (SHADOW FORCE SQUAD) ----------------- */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-auto z-40">
        <div className="flex flex-col select-none leading-none">
          <span className="text-white text-xl md:text-2xl font-black tracking-tight font-sans">SHADOW</span>
          <span className="text-slate-400 text-lg md:text-xl font-black tracking-widest font-sans">FORCE</span>
        </div>
        
        {/* SQUAD HEADER */}
        <div className="mt-2.5 bg-black/35 px-2.5 py-1 rounded border border-slate-800/40 w-fit">
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider font-sans">SQUAD</span>
        </div>

        {/* SQUAD MEMBERS LIST */}
        <div className="flex flex-col gap-1 bg-black/40 border border-slate-800/60 p-2 rounded-lg w-[165px] backdrop-blur-md shadow-xl mt-1">
          {/* Squad Member 1: Player 1 (You) */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-[10px] font-mono">1</span>
            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-amber-400 text-[10px] font-bold truncate max-w-[110px]">Player 1</span>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${health}%` }}></div>
              </div>
            </div>
          </div>
          {/* Squad Member 2: Player 2 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold text-[10px] font-mono">2</span>
            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-slate-300 text-[10px] font-medium truncate max-w-[110px]">Player 2</span>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/85" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          {/* Squad Member 3: Player 3 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold text-[10px] font-mono">3</span>
            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-slate-300 text-[10px] font-medium truncate max-w-[110px]">Player 3</span>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/85" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          {/* Squad Member 4: Player 4 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold text-[10px] font-mono">4</span>
            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-slate-300 text-[10px] font-medium truncate max-w-[110px]">Player 4</span>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/80" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- TOP-CENTER COMPASS TAPE ----------------- */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 select-none pointer-events-none">
        {/* Sliding compass container */}
        <div className="w-[280px] md:w-[380px] h-[36px] bg-black/45 border border-slate-800/80 rounded shadow-md overflow-hidden flex flex-col items-center justify-end select-none">
           {/* sliding ticks */}
           <div className="w-full relative h-[25px] overflow-hidden">
              <div 
                 ref={compassContainerRef} 
                 className="flex absolute bottom-0 left-1/2 h-full items-end gap-0 transition-transform duration-[45ms] ease-out select-none"
                 style={{ width: `${COMPASS_HEADINGS.length * 20}px` }}
              >
                 {COMPASS_HEADINGS.map((tick, idx) => (
                    <div 
                       key={idx} 
                       className="flex flex-col items-center justify-end select-none" 
                       style={{ width: '20px', flexShrink: 0 }}
                    >
                       {tick.label ? (
                          <span className={`text-[10px] font-extrabold leading-none select-none mb-1 ${tick.label === 'N' || tick.label === 'S' || tick.label === 'E' || tick.label === 'W' ? 'text-amber-400' : 'text-slate-300'}`}>
                             {tick.label}
                          </span>
                       ) : (
                          <div className="w-[1px] h-[5px] bg-slate-500/80 mb-0.5 select-none"></div>
                       )}
                       <div className={`w-[1px] h-[6px] select-none ${tick.angle % 45 === 0 ? 'bg-amber-400' : 'bg-slate-400/50'}`}></div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
        {/* Center downward notch */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400 z-40 mt-[-1px]"></div>
        <span className="text-amber-400 font-bold text-xs mt-0.5 font-mono">43m</span>
      </div>

      {/* ----------------- TOP-RIGHT MINI-MAP & CONTROLS ----------------- */}
      <div className="absolute top-4 right-4 flex gap-3 items-start pointer-events-auto z-40">
         
         {/* Survival Metrics Overlays */}
         <div className="flex flex-col items-end gap-1.5 mr-2">
            <div className="flex items-center gap-1.5 bg-black/45 border border-slate-800/60 px-3 py-1 rounded shadow-md">
               <span className="text-amber-400 font-black text-sm font-sans">{94 + remainingPlayers}</span>
               <span className="text-white text-[9px] font-black tracking-wide uppercase">ALIVE</span>
               <div className="w-[1.5px] h-3.5 bg-slate-700/50"></div>
               <span className="text-red-500 font-black text-sm font-sans">{eliminations}</span>
               <span className="text-white text-[9px] font-black tracking-wide uppercase">KILLS</span>
            </div>

            <div className="flex gap-2">
               <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shadow transition-all cursor-pointer ${isMuted ? 'bg-red-500/80 border-red-400 text-white' : 'bg-black/60 border-slate-700 text-slate-200 hover:bg-slate-800'}`}
               >
                  {isMuted ? (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                     </svg>
                  ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                     </svg>
                  )}
               </button>
               <button 
                  onClick={() => setIsMicOn(!isMicOn)} 
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shadow transition-all cursor-pointer ${isMicOn ? 'bg-amber-500/90 border-amber-400 text-black font-black' : 'bg-black/60 border-slate-700 text-slate-200 hover:bg-slate-800'}`}
               >
                  <svg className={`w-4 h-4 ${isMicOn ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                     <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                  </svg>
               </button>
               <button 
                  onClick={() => setShowTrainingGuide(prev => !prev)} 
                  className={`w-8 h-8 rounded-full border flex flex-col items-center justify-center shadow transition-all cursor-pointer ${showTrainingGuide ? 'bg-emerald-500/90 border-emerald-400 text-black font-black' : 'bg-black/60 border-slate-700 text-slate-200 hover:bg-slate-800'}`}
                  title="Toggle Training Guide"
               >
                  <span className="text-[11px] font-black font-mono">?</span>
               </button>
               <button 
                  onClick={leaveGame} 
                  className="w-8 h-8 rounded-full bg-red-600/85 border border-red-400 text-white flex items-center justify-center shadow hover:bg-red-700 transition-all font-black text-xs cursor-pointer"
                  title="Exit Match"
               >
                  ESC
               </button>
            </div>
         </div>

         {/* Circular Minimap Radar */}
         <div className="relative w-24 h-24 rounded-full border-2 border-slate-700 bg-black/75 p-0.5 overflow-hidden shadow-2xl flex items-center justify-center">
            <canvas 
               ref={minimapCanvasRef} 
               width={112} 
               height={112} 
               className="w-full h-full rounded-full"
            />
            {/* Storm Countdown Timer overlay */}
            <div className="absolute bottom-1.5 bg-slate-950/85 px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white font-mono flex items-center gap-0.5">
               <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
               {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
            </div>
         </div>
      </div>

      {/* ----------------- LEFT-SIDE MOTION JOYSTICK & QUICK SLOTS ----------------- */}
      <div className="absolute bottom-4 left-6 flex flex-col gap-3 pointer-events-auto z-40 select-none hud-left-panel">
         
         {/* Draggable Virtual Joystick */}
         <div className="flex items-center gap-4">
            <div 
               ref={joystickRef}
               className="w-24 h-24 rounded-full bg-slate-950/50 border-2 border-slate-700/50 relative shadow-2xl flex items-center justify-center touch-none cursor-crosshair"
            >
               {/* Center deadzone dot */}
               <div className="w-2 h-2 bg-slate-700/80 rounded-full"></div>
               {/* Outer drag boundary ring */}
               <div className="absolute inset-2 border border-slate-800/40 rounded-full"></div>
               {/* Draggable knob handle */}
               <div 
                  ref={joystickHandleRef}
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-75 select-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
               >
                  <svg className="w-5 h-5 text-black transform rotate-45" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                     <path d="M12 2L2 22l10-4 10 4z" />
                  </svg>
               </div>
            </div>
         </div>

         {/* Bottom Left Quick Items Row */}
         <div className="flex gap-3 select-none">
            {/* Backpack Info Slot */}
            <div className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center relative active:scale-95 transition-all">
               <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 8h16v13H4zm2-6h12v2H6zm-3 4h18v2H3z" />
               </svg>
               <span className="text-[7px] text-amber-400 font-black absolute bottom-1 font-mono">48/50</span>
            </div>

            {/* Quick Medkit slot (Interactive Healing) */}
            <button 
               onClick={useMedkit}
               className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center relative active:scale-95 transition-all cursor-pointer"
               title="Use Quick Medkit"
            >
               <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z" />
               </svg>
               <span className="text-[7px] text-slate-400 font-black absolute bottom-1 font-mono">HEALTH</span>
            </button>

            {/* Quick Armor kit (Interactive Vest repair) */}
            <button 
               onClick={useArmorKit}
               className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center relative active:scale-95 transition-all cursor-pointer"
               title="Repair Armor Plate"
            >
               <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5z" />
               </svg>
               <span className="text-[7px] text-slate-400 font-black absolute bottom-1 font-mono">ARMOR</span>
            </button>

            {/* Quick Energy Drink slot (Interactive Boost) */}
            <button 
               onClick={useEnergyDrink}
               className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center relative active:scale-95 transition-all cursor-pointer"
               title="Consume Energy Drink"
            >
               <span className="text-[10px] text-amber-500 mb-1">⚡</span>
               <span className="text-[7px] text-amber-400 font-black absolute bottom-1 font-mono">BOOST</span>
            </button>
         </div>
      </div>

      {/* ----------------- BOTTOM-CENTER HUD (VITALS OVERVIEW) ----------------- */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col pointer-events-auto z-40 select-none w-[220px] md:w-[260px]">
         {/* Soldier Name Plate */}
         <div className="self-center bg-black/60 px-3.5 py-0.5 rounded border border-slate-800/40 mb-1.5 w-fit">
            <span className="text-amber-400 font-black text-xs font-sans tracking-widest">AlphaOne</span>
         </div>
         
         <div className="flex flex-col gap-1 bg-black/50 border border-slate-800/80 p-2 rounded-xl backdrop-blur-md shadow-2xl">
            {/* HEALTH */}
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-black tracking-wider text-slate-300 w-11 text-left">HEALTH</span>
               <div className="flex-1 h-2 bg-slate-950 border border-slate-800/50 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300" style={{ width: `${health}%` }}></div>
               </div>
               <span className="text-white font-mono text-[9px] font-black w-8 text-right">{Math.round(health)}%</span>
            </div>
            {/* ARMOR */}
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-black tracking-wider text-slate-300 w-11 text-left">ARMOR</span>
               <div className="flex-1 h-2 bg-slate-950 border border-slate-800/50 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-300" style={{ width: `${armor}%` }}></div>
               </div>
               <span className="text-white font-mono text-[9px] font-black w-8 text-right">{Math.round(armor)}%</span>
            </div>
            {/* ENERGY */}
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-black tracking-wider text-slate-300 w-11 text-left">ENERGY</span>
               <div className="flex-1 h-2 bg-slate-950 border border-slate-800/50 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300" style={{ width: `${energy}%` }}></div>
               </div>
               <span className="text-white font-mono text-[9px] font-black w-8 text-right">{Math.round(energy)}%</span>
            </div>
         </div>
      </div>

      {/* ----------------- ACTION HUB (RIGHT SIDE ARCD CONTROLS) ----------------- */}
      <div className="absolute right-4 bottom-4 w-[280px] h-[280px] pointer-events-none z-40 select-none hud-control-panel">
         
         {/* Large Circular Action Fire Button */}
         <div className="absolute bottom-6 right-6 pointer-events-auto">
            <button 
               onPointerDown={() => setMobileInput({ shooting: true })}
               onPointerUp={() => setMobileInput({ shooting: false })}
               className="w-24 h-24 rounded-full bg-orange-600/10 border-2 border-orange-500/70 shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:bg-orange-600/25 flex flex-col items-center justify-center relative active:scale-95 transition-all select-none cursor-pointer group hud-fire-glow"
            >
               {/* Inner ring */}
               <div className="absolute inset-1.5 border border-orange-400/30 rounded-full"></div>
               
               {/* Diagonal bullet icon */}
               <svg className="w-12 h-12 text-orange-400 rotate-45 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
               </svg>
               <span className="absolute bottom-2 text-[8px] font-black text-orange-500/85 tracking-widest uppercase select-none">FIRE</span>
            </button>
         </div>

         {/* Jump Button - Above & Left of Fire Button */}
         <div className="absolute top-[35px] right-[10px] pointer-events-auto">
            <button 
               onClick={() => setMobileInput({ jump: true })} 
               className="w-12 h-12 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center active:scale-90 transition-all shadow-lg cursor-pointer"
            >
               <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 19V5M5 12l7-7 7 7" />
               </svg>
               <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">JUMP</span>
            </button>
         </div>

         {/* Crouch Button - Right-bottom of Jump Button */}
         <div className="absolute top-[105px] right-[0px] pointer-events-auto">
            <button 
               onClick={() => setMobileInput({ crouch: true })} 
               className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center transition-all shadow-md cursor-pointer ${
                  currentStance === 'crouch' 
                    ? 'bg-amber-500 border-amber-400 text-black font-black' 
                    : 'bg-slate-950/70 border-slate-700 text-slate-200 hover:bg-slate-800'
               }`}
            >
               <svg className={`w-5 h-5 ${currentStance === 'crouch' ? 'text-black' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4h3c.55 0 1 .45 1 1v5h-2v4h2v6h-3v-6h-2v6H8v-6h2v-4H8V7c0-.55.45-1 1-1h3zm0 8h2v3h-2zm-3 0h2v3H9z" />
               </svg>
               <span className="text-[7px] font-bold uppercase mt-0.5">CROUCH</span>
            </button>
         </div>

         {/* Prone Button - Bottom-right of Crouch Button */}
         <div className="absolute bottom-[10px] right-[115px] pointer-events-auto">
            <button 
               onClick={() => setMobileInput({ prone: true })} 
               className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center transition-all shadow-md cursor-pointer ${
                  currentStance === 'prone' 
                    ? 'bg-amber-500 border-amber-400 text-black font-black' 
                    : 'bg-slate-950/70 border-slate-700 text-slate-200 hover:bg-slate-800'
               }`}
            >
               <div className={`w-6 h-1.5 rounded-full ${currentStance === 'prone' ? 'bg-black' : 'bg-slate-200'}`}></div>
               <span className="text-[7px] font-bold uppercase mt-1">PRONE</span>
            </button>
         </div>

         {/* Scope Button - Left of Fire Button */}
         <div className="absolute bottom-[10px] left-[35px] pointer-events-auto">
            <button 
               onClick={() => setMobileInput({ scope: true })} 
               className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center transition-all shadow-lg cursor-pointer ${
                  isAiming 
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-950/70 border-slate-700 text-slate-200 hover:bg-slate-800'
               }`}
            >
               <svg className={`w-6 h-6 ${isAiming ? 'text-amber-400' : 'text-slate-200'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2v20M2 12h20"/>
               </svg>
               <span className="text-[7px] font-black uppercase mt-0.5">SCOPE</span>
            </button>
         </div>

         {/* Grenade Button - Left-top of Fire Button */}
         <div className="absolute top-[105px] left-[70px] pointer-events-auto">
            <button 
               className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
               <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
               </svg>
               <span className="text-[6px] text-slate-400 font-black uppercase tracking-widest mt-0.5">NADE</span>
            </button>
         </div>

         {/* Weapon View Toggle Button */}
         <div className="absolute top-[35px] left-[135px] pointer-events-auto">
            <button 
               onClick={() => setMobileInput({ fpp: true })} 
               className="w-11 h-11 rounded-full bg-slate-950/70 border border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
               <span className="text-[9px] font-black text-amber-400">FPP</span>
               <span className="text-[6px] text-slate-400 font-bold mt-0.5">VIEW</span>
            </button>
         </div>
      </div>

      {/* Dynamic Weapon Box (Bottom Right Side) */}
      <div className="absolute bottom-4 right-72 pointer-events-auto z-40 bg-black/65 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center gap-4 shadow-xl backdrop-blur-md">
         <div className="flex flex-col text-left">
            <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase">WEAPON</span>
            <span className="text-amber-400 text-xs font-black tracking-wider font-mono">HKA16</span>
         </div>
         
         <div className="w-[1px] h-6 bg-slate-800"></div>

         {/* Digital ammunition */}
         <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-black font-mono tracking-tight ${ammo < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
               {isReloading || localIsReloading ? '...' : ammo}
            </span>
            <span className="text-slate-400 text-[10px] font-bold font-mono">/ {reserveAmmo}</span>
         </div>

         <button 
            onClick={triggerReload}
            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600/50 flex items-center justify-center text-[9px] text-slate-300 active:scale-90 transition-all cursor-pointer select-none"
            title="Reload (R)"
         >
            R
         </button>

         {(isReloading || localIsReloading) && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-md font-sans">
                RELOADING...
            </div>
         )}
      </div>

      {/* ----------------- QUICK TRAINING MANUAL SIDEBAR ----------------- */}
      {showTrainingGuide && (
         <div className="absolute left-4 top-28 w-64 bg-slate-900/90 border-2 border-emerald-500/40 rounded-xl p-4 shadow-2xl pointer-events-auto z-40 select-none animate-fade-in max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2 mb-3">
               <span className="text-emerald-400 text-xs font-black tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  TRAINING MANUAL (LVL {playerLevel})
               </span>
               <button 
                  onClick={() => setShowTrainingGuide(false)}
                  className="text-slate-400 hover:text-white font-black text-xs px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 cursor-pointer"
               >
                  CLOSE [X]
               </button>
            </div>
            
            <div className="flex flex-col gap-2 text-[10px] font-mono leading-relaxed text-slate-300">
               <div>
                  <span className="text-amber-400 font-bold block">1. MOVE SOLDIER</span>
                  Use <span className="px-1 bg-slate-950 text-white border border-slate-700 rounded text-[9px]">W, A, S, D</span> keys or drag the Left Virtual Joystick to walk.
               </div>
               <div>
                  <span className="text-amber-400 font-bold block">2. CAMERA LOOK & AIM</span>
                  Drag your <span className="text-white font-bold">Mouse / Finger</span> over the screen to rotate your field of view.
               </div>
               <div>
                  <span className="text-amber-400 font-bold block">3. FIRE AUTOMATIC WEAPON</span>
                  <span className="text-white font-bold">Left-Click</span> or tap the <span className="text-orange-500 font-bold">FIRE</span> circle to shoot tracers.
               </div>
               <div>
                  <span className="text-amber-400 font-bold block">4. TOGGLE TACTICAL SCOPE</span>
                  <span className="text-white font-bold">Right-Click</span> or tap the <span className="text-amber-400 font-bold font-sans">SCOPE</span> button to zoom.
               </div>
               <div>
                  <span className="text-amber-400 font-bold block">5. TAKE COVER & DEFENSE</span>
                  Press <span className="px-1 bg-slate-950 text-white border border-slate-700 rounded text-[9px]">Space</span> to Jump, <span className="px-1 bg-slate-950 text-white border border-slate-700 rounded text-[9px]">C</span> to Crouch, or <span className="px-1 bg-slate-950 text-white border border-slate-700 rounded text-[9px]">Z</span> to Prone behind cargo crates to take cover from hostile lasers!
               </div>
            </div>
         </div>
      )}

      {/* Target Dot indicator */}
      {playerState === 'active' && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full opacity-80 shadow-[0_0_4px_#4ade80]" />
         </div>
      )}

      {/* ----------------- DAMAGE ALERT RED FLICKER ----------------- */}
      {playerState === 'disabled' && (
         <div className="absolute inset-0 bg-red-600/35 flex flex-col items-center justify-center pointer-events-none z-50 animate-pulse">
            <div className="bg-black/85 px-6 py-4 rounded-xl border border-red-500 text-center">
               <span className="text-red-500 text-3xl font-black tracking-widest uppercase font-sans">STUNNED / RECOV</span>
               <p className="text-slate-300 text-xs mt-1 uppercase font-mono tracking-widest">Wait 3 seconds to respawn...</p>
            </div>
         </div>
      )}
    </div>
  );
}

export default function App() {
  const gameState = useGameStore(state => state.gameState);
  const currentScreen = useGameStore(state => state.currentScreen);
  const isIntroActive = useGameStore(state => state.isIntroActive);
  const score = useGameStore(state => state.score);
  const startGame = useGameStore(state => state.startGame);
  const loadProgress = useGameStore(state => state.loadProgress);
  const playerLevel = useGameStore(state => state.playerLevel);
  const setPlayerLevel = useGameStore(state => state.setPlayerLevel);
  const isMobile = useIsMobile();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadProgress();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      sound.stopMilitaryMarch();
    }
  }, [gameState]);

  const handleInteraction = () => {
    sound.init();
  };

  return (
    <div 
      onPointerDown={handleInteraction}
      className="w-screen h-screen bg-[#090d16] relative overflow-hidden font-sans select-none text-white force-landscape-container"
    >

      {showSplash ? (
        <div className="absolute inset-0 z-50 bg-[#090d16] flex flex-col items-center justify-center pointer-events-auto">
           <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-tighter drop-shadow-2xl mb-3 animate-pulse">
             SHADOW FORCE
           </div>
           <div className="text-amber-400 tracking-[0.4em] text-xs md:text-sm uppercase font-extrabold">
              Battleground Simulator
           </div>
        </div>
      ) : isIntroActive ? (
        <CinematicIntro />
      ) : (
        <>
          {/* 3D Game Stage Canvas */}
          <div className="absolute inset-0">
            <Game />
          </div>

          {/* Interactive Battlegrounds HUD */}
          {gameState === 'playing' && <HUD />}

          {/* ----------------- TACTICAL SOVEREIGN LOBBY / SUB-SCREENS ----------------- */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 pointer-events-auto p-4 md:p-6 select-none animate-fade-in">
              <div className="max-w-6xl w-full h-[90vh] flex flex-col">
                {currentScreen === 'lobby' && <LobbyScreen />}
                {currentScreen === 'hangar' && <HangarScreen />}
                {currentScreen === 'campaign' && <CampaignScreen />}
                {currentScreen === 'missions' && <MissionsScreen />}
                {currentScreen === 'about' && <AboutScreen />}
              </div>
            </div>
          )}

          {/* ----------------- GAME OVER / RETRY VIEW ----------------- */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center z-10 pointer-events-auto p-4">
              <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl text-center">
                 
                 <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
                    <RotateCcw size={32} />
                 </div>

                 <h1 className="text-3xl font-black text-red-500 mb-2 tracking-tighter uppercase">
                   Match Terminated
                 </h1>
                 
                 <div className="text-base text-slate-400 mb-6 font-bold uppercase">
                    Your Score: <span className="text-amber-400">{score}</span>
                 </div>
                 
                 <button
                   onClick={() => {
                     sound.playWeaponCharge();
                     startGame();
                   }}
                   className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black text-base font-black uppercase tracking-widest rounded-xl transition-all duration-150 active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                 >
                   Play Again
                 </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
