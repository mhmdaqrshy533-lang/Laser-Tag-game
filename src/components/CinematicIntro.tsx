import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SkipForward } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState<'splash' | 'story1' | 'story2'>('splash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('story1'), 4000);
    const t2 = setTimeout(() => setPhase('story2'), 10000);
    const t3 = setTimeout(onComplete, 16000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Skip Button */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer backdrop-blur-md"
        >
          <SkipForward size={16} />
          <span>تخطي (Skip)</span>
        </button>
      </div>

      <div className="relative w-full max-w-4xl px-8 z-10 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {phase === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="flex flex-col items-center gap-6"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                TANKEEL
              </h1>
              <h2 className="text-5xl md:text-7xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl dir-rtl">
                تَنكِيل
              </h2>
              
              <div className="w-24 h-[1px] bg-slate-600 my-4" />
              
              <h3 className="text-lg md:text-xl font-medium tracking-[0.2em] text-slate-300 uppercase">
                A Science Fiction Adventure
              </h3>
              
              <div className="mt-12 text-sm md:text-base font-bold text-slate-500 tracking-widest uppercase flex flex-col gap-2">
                <span>Created By:</span>
                <span className="text-slate-300">Suhail Al-Hazbari</span>
                <span className="text-slate-300 text-lg">سهيل الهزبري</span>
              </div>
            </motion.div>
          )}

          {phase === 'story1' && (
            <motion.div
              key="story1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="flex flex-col items-center gap-8 max-w-2xl"
            >
              <span className="text-amber-500 font-mono tracking-widest text-sm font-bold bg-amber-500/10 px-4 py-1 rounded border border-amber-500/20">
                LOCATION: MERCURY-X [عطارد-X]
              </span>
              <p className="text-slate-200 text-xl md:text-2xl leading-relaxed font-medium dir-rtl">
                مستعمرة بشرية قديمة فقدت الاتصال بالمجرة منذ سنوات.
              </p>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium dir-rtl">
                أنت الأمل الأخير... مهمتك: البحث عن الأجزاء المفقودة، إعادة تشغيل بوابات الطاقة، استعادة الاتصال مع بقية المجرة، والقضاء على أي تهديد.
              </p>
            </motion.div>
          )}

          {phase === 'story2' && (
            <motion.div
              key="story2"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="flex flex-col items-center gap-6"
            >
              <h2 className="text-3xl md:text-5xl font-black text-amber-500 tracking-wide dir-rtl">
                استعد للهبوط السطحي
              </h2>
              <div className="text-slate-400 font-mono text-sm tracking-widest mt-4">
                INITIATING ATMOSPHERIC DESCENT...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
