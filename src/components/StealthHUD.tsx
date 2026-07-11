import { useGameStore } from '../store';

export function StealthHUD() {
  const speed = useGameStore(state => state.speed) || 0;
  const altitude = useGameStore(state => state.altitude) || 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans text-amber-500">
      {/* Reticle / Center HUD */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-80">
        <div className="w-[400px] h-[200px] border border-amber-500/30 rounded-lg relative flex items-center justify-center">
           {/* Center Crosshair */}
           <div className="w-10 h-[2px] bg-amber-500/80 absolute"></div>
           <div className="w-[2px] h-10 bg-amber-500/80 absolute"></div>
           
           <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 px-4 py-1 rounded border border-amber-500/50 backdrop-blur-sm text-center">
             <div className="text-xl font-bold font-sans">تَنكِيل SGMW</div>
             <div className="text-[10px] uppercase tracking-widest text-amber-300">Strategic Stealth Platform // S3T-01</div>
           </div>
        </div>
      </div>

      {/* Left Panel */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 bg-black/40 p-4 border border-amber-500/50 rounded-lg backdrop-blur-sm">
         <div className="flex flex-col gap-2 text-right dir-rtl">
            <div className="text-sm font-bold">أنظمة الأسلحة: <span className="text-emerald-400">جاهزة</span></div>
            <div className="text-sm font-bold">بصمة الرادار: <span className="text-emerald-400">منخفضة</span></div>
            <div className="text-sm font-bold">القناع الحراري: <span className="text-amber-400">نشط</span></div>
         </div>
      </div>

      {/* Right Panel */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 bg-black/40 p-4 border border-amber-500/50 rounded-lg backdrop-blur-sm">
         <div className="flex flex-col gap-2 text-right dir-rtl">
            <div className="text-sm font-bold">الموقع: <span className="text-slate-300">24.7136° شمالاً | 46.6753° شرقاً</span></div>
            <div className="text-sm font-bold">الارتفاع: <span className="text-slate-300">{altitude.toLocaleString()} قدم</span></div>
            <div className="text-sm font-bold">السرعة: <span className="text-slate-300">{(speed / 1000).toFixed(2)} ماخ</span></div>
         </div>
      </div>
    </div>
  );
}
