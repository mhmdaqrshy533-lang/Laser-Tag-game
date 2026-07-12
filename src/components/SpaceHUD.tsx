import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Crosshair, Navigation, Camera, Settings, Rocket, Target, ShieldAlert, Wifi, BatteryCharging, Zap, ArrowDownToLine } from 'lucide-react';

export function SpaceHUD() {
  const speed = useGameStore(state => state.speed) || 0;
  const altitude = useGameStore(state => state.altitude) || 0;
  const setMobileInput = useGameStore(state => state.setMobileInput);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  
  const [throttle, setThrottle] = useState(50); // 0, 25, 50, 75, 100
  const [isShooting, setIsShooting] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 });

  // Handle Joystick
  const handleTouchStart = (e: React.TouchEvent, type: 'move' | 'look') => {
    if (type === 'move') {
      const touch = e.touches[0];
      setJoystickBase({ x: touch.clientX, y: touch.clientY });
      setJoystickPos({ x: touch.clientX, y: touch.clientY });
      setJoystickActive(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, type: 'move' | 'look') => {
    if (type === 'move' && joystickActive) {
      const touch = Array.from(e.touches).find(t => 
        Math.hypot(t.clientX - joystickBase.x, t.clientY - joystickBase.y) < 200
      );
      if (touch) {
        setJoystickPos({ x: touch.clientX, y: touch.clientY });
        const dx = touch.clientX - joystickBase.x;
        const dy = touch.clientY - joystickBase.y;
        const distance = Math.hypot(dx, dy);
        const maxDist = 50;
        const nx = distance > maxDist ? (dx / distance) * maxDist : dx;
        const ny = distance > maxDist ? (dy / distance) * maxDist : dy;
        
        setMobileInput({ 
          move: { x: nx / maxDist, y: ny / maxDist },
          look: { x: 0, y: 0 },
          shooting: isShooting 
        });
      }
    }
  };

  const handleTouchEnd = (type: 'move' | 'look') => {
    if (type === 'move') {
      setJoystickActive(false);
      setMobileInput({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, shooting: isShooting });
    }
  };

  useEffect(() => {
    setMobileInput({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, shooting: isShooting });
  }, [isShooting]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans text-amber-500 overflow-hidden">
      {/* ---------------- CROSSHAIR ---------------- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80">
        <div className="w-16 h-16 border-2 border-dashed border-amber-500/50 rounded-full flex items-center justify-center animate-spin-slow">
          <Target className="text-[#00f3ff] animate-pulse" size={24} />
        </div>
      </div>

      {/* ---------------- TOP LEFT: Radar & Flight Data ---------------- */}
      <div className="absolute top-4 left-4 bg-slate-950/80 p-3 border border-amber-500/30 rounded-xl backdrop-blur-md flex gap-4 shadow-lg pointer-events-auto">
        <div className="w-24 h-24 rounded-full border-2 border-emerald-500/40 relative overflow-hidden flex items-center justify-center bg-emerald-950/20">
           <div className="w-full h-[1px] bg-emerald-500/30 absolute"></div>
           <div className="w-[1px] h-full bg-emerald-500/30 absolute"></div>
           <div className="absolute w-full h-full border-4 border-emerald-500/20 rounded-full animate-ping"></div>
           <div className="w-2 h-2 bg-white rounded-full"></div>
           <div className="absolute top-4 right-6 w-2 h-2 bg-red-500 rounded-full"></div>
           <div className="absolute bottom-6 left-8 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
        <div className="flex flex-col gap-1 text-right justify-center dir-rtl">
          <div className="text-sm font-bold text-slate-200">السرعة: <span className="text-[#00f3ff]">{(speed / 1000).toFixed(2)} ماخ</span></div>
          <div className="text-sm font-bold text-slate-200">الارتفاع: <span className="text-[#00f3ff]">{altitude.toLocaleString()} م</span></div>
          <div className="text-sm font-bold text-slate-200">الدفع: <span className="text-amber-400">{throttle}%</span></div>
        </div>
      </div>

      {/* ---------------- TOP RIGHT: Camera & Settings ---------------- */}
      <div className="absolute top-4 right-4 flex gap-3 pointer-events-auto">
        <button className="w-12 h-12 bg-slate-950/80 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
          <Camera size={24} />
        </button>
        <button className="w-12 h-12 bg-slate-950/80 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
          <Settings size={24} />
        </button>
      </div>

      {/* ---------------- BOTTOM CENTER: Mission Info ---------------- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/90 px-6 py-2 border border-slate-700/50 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="text-sm font-bold text-emerald-400 dir-rtl flex items-center gap-2">
          <Zap size={16} className="animate-pulse" />
          تدمير منشآت العدو: 0/3
        </div>
      </div>

      {/* ---------------- LEFT SIDE: Virtual Joystick & Throttle ---------------- */}
      <div className="absolute bottom-12 left-12 flex gap-8 pointer-events-auto">
        {/* Throttle Slider */}
        <div className="h-40 w-12 bg-slate-900/80 rounded-full border border-slate-700 flex flex-col-reverse items-center py-2 gap-2 shadow-inner">
          {[0, 25, 50, 75, 100].map(val => (
            <button 
              key={val}
              onClick={() => setThrottle(val)}
              className={`w-8 h-6 rounded-full font-bold text-[10px] transition-all flex items-center justify-center ${throttle === val ? 'bg-amber-500 text-black shadow-[0_0_10px_#f59e0b]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Joystick */}
        <div 
          className="w-32 h-32 bg-slate-800/50 rounded-full border-2 border-slate-600/50 relative touch-none shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          onTouchStart={(e) => handleTouchStart(e, 'move')}
          onTouchMove={(e) => handleTouchMove(e, 'move')}
          onTouchEnd={() => handleTouchEnd('move')}
          onTouchCancel={() => handleTouchEnd('move')}
        >
          {joystickActive && (
            <div 
              className="absolute w-14 h-14 bg-amber-500/80 rounded-full border-2 border-amber-300 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#f59e0b] flex items-center justify-center"
              style={{
                left: `calc(50% + ${joystickPos.x - joystickBase.x}px)`,
                top: `calc(50% + ${joystickPos.y - joystickBase.y}px)`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <Navigation className="text-white" size={20} />
            </div>
          )}
        </div>
      </div>

      {/* ---------------- RIGHT SIDE: Action Buttons ---------------- */}
      <div className="absolute bottom-12 right-12 flex flex-col items-end gap-6 pointer-events-auto">
        
        <div className="flex gap-4 items-end">
          <button className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-full flex flex-col items-center justify-center text-slate-300 active:scale-95 active:bg-amber-500 active:text-black transition-all mb-4 shadow-lg">
             <Rocket size={20} />
             <span className="text-[9px] font-bold mt-1">MISSILE</span>
          </button>
          <button className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-full flex flex-col items-center justify-center text-slate-300 active:scale-95 active:bg-amber-500 active:text-black transition-all mb-12 shadow-lg">
             <Zap size={20} />
             <span className="text-[9px] font-bold mt-1">BOOST</span>
          </button>
          
          <button 
            onPointerDown={() => setIsShooting(true)}
            onPointerUp={() => setIsShooting(false)}
            onPointerLeave={() => setIsShooting(false)}
            className="w-24 h-24 bg-red-600/90 border-4 border-red-400 rounded-full flex flex-col items-center justify-center text-white active:scale-95 active:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
             <Crosshair size={32} className={isShooting ? 'animate-spin' : ''} />
             <span className="text-xs font-black mt-1">FIRE</span>
          </button>
        </div>

        <button className="absolute -top-16 right-0 w-12 h-12 bg-slate-800/80 border border-slate-600 rounded-full flex flex-col items-center justify-center text-slate-300 active:scale-95 active:bg-emerald-500 active:text-black transition-all shadow-lg">
             <ArrowDownToLine size={18} />
             <span className="text-[8px] font-bold mt-0.5">LAND</span>
        </button>

      </div>
    </div>
  );
}
