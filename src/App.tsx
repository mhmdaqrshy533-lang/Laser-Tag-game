/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { Game } from './components/Game';
import { useGameStore } from './store';
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

  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  // Compass DOM reference for zero-lag high speed CSS transformations
  const compassContainerRef = useRef<HTMLDivElement>(null);
  
  // Minimap player pointers reference
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Derive dynamic Battle Royale metrics
  const eliminations = Math.floor(score / 100);
  const remainingPlayers = Math.max(1, 41 - eliminations);

  // 1. Double requestAnimationFrame loop for scrolling compass and interactive minimap
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      // -- Update Compass --
      const rawYaw = (window as any).playerYaw || 0;
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
             // Map 3D positions [-2000, 2000] roughly to map canvas delta
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
      
      {/* ----------------- TOP-LEFT PANEL ----------------- */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-auto z-40">
         {/* Gold PUBG Badge */}
         <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/40 px-3 py-1 rounded shadow-md">
            <span className="text-amber-400 font-extrabold text-[11px] tracking-widest font-mono">PUBG MOBILE</span>
            <div className="w-[1.5px] h-3 bg-amber-500/30"></div>
            <span className="text-slate-300 text-[10px] font-bold tracking-tight">SHADOW FORCE</span>
         </div>

         {/* Survival Cards: Remaining & Eliminations */}
         <div className="flex gap-1.5">
            <div className="bg-black/60 border border-slate-700/50 px-3 py-1.5 rounded flex flex-col items-center min-w-[75px] shadow-lg">
               <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Remaining</span>
               <span className="text-white text-base font-black font-mono leading-none mt-0.5">{remainingPlayers}</span>
            </div>
            <div className="bg-black/60 border border-slate-700/50 px-3 py-1.5 rounded flex flex-col items-center min-w-[75px] shadow-lg">
               <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Eliminations</span>
               <span className="text-amber-400 text-base font-black font-mono leading-none mt-0.5">{eliminations}</span>
            </div>
         </div>
      </div>

      {/* ----------------- TOP-CENTER COMPASS TAPE ----------------- */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[340px] md:w-[480px] h-[36px] bg-black/50 border border-slate-800/80 rounded shadow-md overflow-hidden flex flex-col items-center justify-end z-30 select-none">
         {/* Center indicator notch */}
         <div className="absolute top-0 w-[2px] h-[10px] bg-amber-400 z-40"></div>
         
         {/* Sliding tick-mark tape */}
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

      {/* ----------------- TOP-RIGHT MINI-MAP & CONTROLS ----------------- */}
      <div className="absolute top-4 right-4 flex gap-3 items-start pointer-events-auto z-40">
         
         {/* Quick Sound/Mic Buttons */}
         <div className="flex flex-col gap-2 mt-1.5">
            <button 
               onClick={() => setIsMuted(!isMuted)} 
               className={`w-8 h-8 rounded-full border flex items-center justify-center shadow transition-all ${isMuted ? 'bg-red-500/80 border-red-400 text-white' : 'bg-black/60 border-slate-700 text-slate-200 hover:bg-slate-800'}`}
            >
               {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button 
               onClick={() => setIsMicOn(!isMicOn)} 
               className={`w-8 h-8 rounded-full border flex items-center justify-center shadow transition-all ${isMicOn ? 'bg-amber-500/90 border-amber-400 text-black font-black' : 'bg-black/60 border-slate-700 text-slate-200 hover:bg-slate-800'}`}
            >
               <Mic size={14} className={isMicOn ? 'animate-pulse' : ''} />
            </button>
            <button 
               onClick={leaveGame} 
               className="w-8 h-8 rounded-full bg-red-600/85 border border-red-400 text-white flex items-center justify-center shadow hover:bg-red-700 transition-all font-black text-xs"
               title="Exit Match"
            >
               ESC
            </button>
         </div>

         {/* Circular Minimap Radar */}
         <div className="relative w-28 h-28 rounded-xl border border-slate-700/60 bg-black/70 p-0.5 overflow-hidden shadow-2xl flex flex-col items-center">
            {/* Live Minimap canvas */}
            <canvas 
               ref={minimapCanvasRef} 
               width={112} 
               height={112} 
               className="w-full h-full rounded"
            />
            
            {/* Area tag overlays */}
            <div className="absolute top-1 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-amber-400 font-mono tracking-wider">
               Militia Base
            </div>
            
            {/* Storm Countdown Timer overlay */}
            <div className="absolute bottom-1 right-2 bg-slate-950/85 px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white font-mono flex items-center gap-0.5">
               <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
               {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
            </div>
         </div>
      </div>

      {/* ----------------- BOTTOM-LEFT STATUS & COMPONENT SLIDERS ----------------- */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-auto z-40 select-none">
         {/* Backpack/Helmet Inventory Indicators */}
         <div className="flex gap-2 bg-black/40 border border-slate-800/40 p-1.5 rounded-lg">
            {/* Backpack Icon */}
            <div className="w-9 h-9 bg-slate-800/70 border border-slate-600/50 rounded flex flex-col items-center justify-center p-1 relative">
               <Shield size={16} className="text-slate-300" />
               <span className="text-[7px] text-amber-400 font-bold font-mono absolute bottom-0.5">LVL 3</span>
            </div>
            {/* Helmet Icon */}
            <div className="w-9 h-9 bg-slate-800/70 border border-slate-600/50 rounded flex flex-col items-center justify-center p-1 relative">
               <Activity size={16} className="text-slate-300" />
               <span className="text-[7px] text-slate-300 font-bold font-mono absolute bottom-0.5">Vst 3</span>
            </div>
         </div>

         {/* Network Ping & HDR indicators */}
         <div className="flex items-center gap-2 bg-black/45 px-2.5 py-1 rounded text-[10px] font-black text-slate-300 select-none">
            <span className="text-[9px] font-mono font-black text-slate-400">HDR</span>
            <div className="w-[1px] h-3 bg-slate-700"></div>
            <div className="flex items-center gap-1 text-emerald-400">
               <Wifi size={11} className="animate-pulse" />
               <span className="font-mono">24 ms</span>
            </div>
         </div>
      </div>

      {/* ----------------- BOTTOM-CENTER STANCE SWITCHER (TPP/FPP) ----------------- */}
      <div className="absolute bottom-6 left-[22%] -translate-x-1/2 pointer-events-auto z-40">
         <button 
            onClick={() => setMobileInput({ fpp: true })} 
            className="px-4 py-2 bg-black/65 border border-slate-700 text-white rounded-full font-black text-xs tracking-widest hover:bg-slate-800 flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
         >
            <Sliders size={12} className="text-amber-400" />
            <span>FPP / TPP</span>
         </button>
      </div>

      {/* ----------------- DOUBLE TOUCH FIRE BUTTONS (LEFT & RIGHT) ----------------- */}
      {/* Left Fire Button */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-auto z-40">
         <button 
            onPointerDown={() => setMobileInput({ shooting: true })}
            onPointerUp={() => setMobileInput({ shooting: false })}
            className="w-16 h-16 rounded-full bg-slate-800/50 border-2 border-slate-500/40 hover:bg-slate-700/60 flex items-center justify-center relative active:scale-90 transition-all select-none group"
         >
            {/* Bullet PNG style SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white rotate-[135deg]">
               <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="absolute bottom-1 text-[7px] font-black text-slate-400 uppercase tracking-widest select-none">FIRE</span>
         </button>
      </div>

      {/* Right Fire Button */}
      <div className="absolute right-32 bottom-[35%] pointer-events-auto z-40">
         <button 
            onPointerDown={() => setMobileInput({ shooting: true })}
            onPointerUp={() => setMobileInput({ shooting: false })}
            className="w-20 h-20 rounded-full bg-slate-800/50 border-2 border-slate-500/40 hover:bg-slate-700/60 flex items-center justify-center relative active:scale-90 transition-all select-none group"
         >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-white rotate-[45deg]">
               <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="absolute bottom-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest select-none">FIRE</span>
         </button>
      </div>

      {/* ----------------- ACTION TACTICAL BUTTONS (RIGHT-MARGIN) ----------------- */}
      <div className="absolute right-6 bottom-6 flex flex-col md:flex-row gap-4 pointer-events-auto z-40 select-none items-end">
         
         {/* Stance Toggles: Crouch & Prone */}
         <div className="flex gap-3">
            {/* Prone Button */}
            <button 
               onClick={() => setMobileInput({ prone: true })} 
               className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-600/50 flex flex-col items-center justify-center text-slate-200 active:scale-90 transition-all shadow-md hover:bg-slate-800"
            >
               {/* Prone/Lay down SVG */}
               <div className="w-8 h-2 bg-slate-200 rounded-full"></div>
               <span className="text-[7px] font-black text-slate-400 uppercase mt-1">PRONE (Z)</span>
            </button>

            {/* Crouch Button */}
            <button 
               onClick={() => setMobileInput({ crouch: true })} 
               className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-600/50 flex flex-col items-center justify-center text-slate-200 active:scale-90 transition-all shadow-md hover:bg-slate-800"
            >
               {/* Crouch human vector */}
               <svg className="w-6 h-6 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4h3c.55 0 1 .45 1 1v5h-2v4h2v6h-3v-6h-2v6H8v-6h2v-4H8V7c0-.55.45-1 1-1h3zm0 8h2v3h-2zm-3 0h2v3H9z"/>
               </svg>
               <span className="text-[7px] font-black text-slate-400 uppercase mt-0.5">CROUCH (C)</span>
            </button>
         </div>

         {/* Jump & Scope Buttons */}
         <div className="flex gap-3">
            {/* Jump Button */}
            <button 
               onClick={() => setMobileInput({ jump: true })} 
               className="w-16 h-16 rounded-full bg-slate-800/55 border border-slate-500/40 flex flex-col items-center justify-center text-slate-200 active:scale-90 transition-all shadow-lg hover:bg-slate-800"
            >
               {/* Jump icon */}
               <svg className="w-7 h-7 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm5 11h-2v4c0 1.1-.9 2-2 2s-2-.9-2-2v-4H9V8c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2h2v3z"/>
               </svg>
               <span className="text-[7px] font-black text-slate-400 uppercase mt-1">JUMP (Space)</span>
            </button>

            {/* Scope / Aim Button */}
            <button 
               onClick={() => setMobileInput({ scope: true })} 
               className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/60 flex flex-col items-center justify-center text-amber-400 active:scale-90 transition-all shadow-lg hover:bg-amber-500/30"
            >
               {/* Crosshair scope */}
               <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2v20M2 12h20"/>
               </svg>
               <span className="text-[7px] font-black text-amber-400 uppercase mt-0.5">SCOPE (R-Clk)</span>
            </button>
         </div>
      </div>

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
              <span className="text-red-500 text-3xl font-black tracking-widest uppercase">STUNNED / RECOV</span>
              <p className="text-slate-300 text-xs mt-1 uppercase font-mono tracking-widest">Wait 3 seconds to respawn...</p>
           </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const gameState = useGameStore(state => state.gameState);
  const score = useGameStore(state => state.score);
  const startGame = useGameStore(state => state.startGame);
  const loadProgress = useGameStore(state => state.loadProgress);
  const isMobile = useIsMobile();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadProgress();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#090d16] relative overflow-hidden font-sans select-none text-white">
      {/* Landscape restrictor for mobile screens */}
      <div className="hidden absolute inset-0 z-[100] bg-slate-950 max-md:portrait:flex flex-col items-center justify-center text-white text-center p-8 pointer-events-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-amber-500 animate-pulse"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <h2 className="text-2xl font-black mb-2 uppercase tracking-wider text-amber-400">Rotate Device</h2>
        <p className="text-slate-400 text-xs max-w-xs font-mono leading-relaxed">
           Please turn your phone into Landscape mode for playing with precise Battle Royale Joysticks.
        </p>
      </div>

      {showSplash ? (
        <div className="absolute inset-0 z-50 bg-[#090d16] flex flex-col items-center justify-center pointer-events-auto">
           <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-tighter drop-shadow-2xl mb-3 animate-pulse">
             SHADOW FORCE
           </div>
           <div className="text-amber-400 tracking-[0.4em] text-xs md:text-sm uppercase font-extrabold">
              Battleground Simulator
           </div>
        </div>
      ) : (
        <>
          {/* 3D Game Stage Canvas */}
          <div className="absolute inset-0">
            <Game />
          </div>

          {/* Interactive Battlegrounds HUD */}
          {gameState === 'playing' && <HUD />}

          {/* ----------------- CORE PLAY MENU ----------------- */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-10 pointer-events-auto p-4 select-none">
              <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl text-center">
                 
                 {/* Logo title */}
                 <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 mb-2 tracking-tighter uppercase">
                   SHADOW FORCE
                 </h1>
                 <p className="text-slate-400 text-xs uppercase tracking-[0.25em] font-extrabold mb-8">
                    PUBG BATTLEGROUND REPLICA
                 </p>

                 {/* Match Area select list */}
                 <div className="w-full mb-8">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-3 text-left">
                       Map Location
                    </span>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left flex items-center gap-4">
                       <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-400 font-extrabold text-sm">
                          ERGL
                       </div>
                       <div>
                          <h4 className="text-white text-sm font-bold">Erangel Runway</h4>
                          <p className="text-slate-400 text-[11px] font-mono">Military base airfield with lattice antennas.</p>
                       </div>
                    </div>
                 </div>

                 {/* Play Button */}
                 <button
                   onClick={startGame}
                   className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black text-lg font-black uppercase tracking-widest rounded-xl transition-all duration-150 active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                 >
                   <Play size={18} fill="currentColor" />
                   <span>Start Match</span>
                 </button>
                 
                 {/* Desktop Instructions Footer */}
                 <div className="mt-8 text-slate-500 text-[10px] font-mono text-left w-full border-t border-slate-800/80 pt-4 flex flex-col gap-1 select-none">
                    <div className="flex justify-between"><span>WASD</span> <span>Move Soldier</span></div>
                    <div className="flex justify-between"><span>Mouse Drag</span> <span>Orbit Camera Look</span></div>
                    <div className="flex justify-between"><span>Left-Click</span> <span>Fire Rifle</span></div>
                    <div className="flex justify-between"><span>Right-Click</span> <span>Toggle Aim Scope</span></div>
                    <div className="flex justify-between"><span>C / Z / Space</span> <span>Crouch / Prone / Jump</span></div>
                    <div className="flex justify-between"><span>R / F</span> <span>Reload Ammo / TPP Toggle</span></div>
                 </div>
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
                   onClick={startGame}
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
