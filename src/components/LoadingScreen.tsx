import React from 'react';

export function LoadingScreen({ progress, item, error }: { progress: number, item?: string, error?: string | null }) {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white font-sans">
      <div className="text-2xl font-bold mb-4 tracking-widest text-amber-500">
        {error ? "حدث خطأ أثناء التحميل" : "جاري تحميل البيئة..."}
      </div>
      
      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
      
      <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${error ? 'bg-red-500' : 'bg-amber-500'} transition-all duration-300`}
          style={{ width: `${error ? 100 : progress}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-slate-400 font-mono text-center">
        {error ? "جارٍ تحميل البيئة الاحتياطية..." : `${Math.round(progress)}%`}
        <br />
        <span className="text-xs text-slate-600 truncate max-w-[200px] block">{item || '...'}</span>
      </div>
    </div>
  );
}
