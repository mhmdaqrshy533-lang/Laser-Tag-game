import React from "react";
import { useGameStore } from "../store";
import { sound } from "./SoundSystem";
import { Info, User, ShieldCheck, Terminal, ArrowLeft, Radio } from "lucide-react";

export default function AboutScreen() {
  const setScreen = useGameStore((state) => state.setScreen);

  const handleBack = () => {
    sound.playClick();
    setScreen("lobby");
  };

  return (
    <div className="w-full h-full bg-[#070b13] border-2 border-[#00f3ff]/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 text-white overflow-y-auto backdrop-blur-xl relative select-none">
      
      {/* Absolute design aesthetic lines */}
      <div className="absolute top-4 left-4 font-mono text-[8px] text-[#00f3ff]/40 tracking-widest">
         SOVEREIGN_SYSTEM_INTEL // ID_789392
      </div>

      {/* LEFT COLUMN: System info and Developer Intro */}
      <div className="flex-1 flex flex-col gap-5 bg-black/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="text-[#00f3ff]" size={20} />
              <span className="font-sans font-black text-base text-white tracking-wider">
                 معلومات القيادة والمطور السيادي
              </span>
            </div>
            <button
              onClick={handleBack}
              className="px-3 py-1 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[#00f3ff] text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>العودة</span>
            </button>
          </div>

          {/* High-fidelity holographic developer profile badge */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="w-14 h-14 rounded-full bg-[#00f3ff]/10 border-2 border-[#00f3ff]/30 flex items-center justify-center text-[#00f3ff] shrink-0 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <Terminal size={24} className="animate-pulse" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">CHIEF TECHNICAL ARCHITECT</span>
              <h4 className="text-base font-black text-white mt-0.5">الكابتن المهندس "محمد الكمالي"</h4>
              <p className="text-[10px] text-[#00f3ff] font-semibold mt-1">الرؤية الهندسية، برمجة الـ React، ومصمم الواجهة السيادية</p>
            </div>
          </div>

          {/* Core Vision Paragraph */}
          <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex flex-col gap-3">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
              <ShieldCheck size={14} className="text-amber-400" />
              <span>الرؤية التقنية الهندسية للمشروع</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
               يتم بناء مشروع <b>Galaxy Division</b> كأنموذج برمجية قتالية سيادية عالية الأداء، مصمم بالكامل لتجاوز الأطر البرمجية المعتادة. نسعى لبناء بيئة محاكاة تكتيكية متقدمة تجمع بين فيزياء الطيران الجوي والالتحام البري التكتيكي لتأكيد ريادة السيطرة الإلكترونية الكاملة.
            </p>
          </div>
        </div>

        {/* Technical logs footer */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-500 flex flex-col gap-0.5">
           <span>DEVELOPED IN COOPERATION WITH COGNITIVE NETWORKS</span>
           <span>ENGINE STABILITY: 100% RELIABLE</span>
           <span>UI FRAMEWORK: REACT 18 + VITE + ZUSTAND ENGINE</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Game Description */}
      <div className="flex-1 flex flex-col gap-5 bg-black/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md justify-between">
        <div className="flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Radio className="text-[#00f3ff] animate-pulse" size={18} />
            <span className="font-sans font-black text-base text-white tracking-wider">
               عن اللعبة (Galaxy Division)
            </span>
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed font-medium overflow-y-auto pr-2 h-[450px]">
            <p className="mb-3">Galaxy Division هي لعبة سفينة فضاء متعددة اللاعبين عبر الإنترنت حيث يمكنك الاستمتاع بمعارك مكثفة بين النجوم في أوضاع لعب مختلفة في الوقت الفعلي ومهام غير متصلة بالإنترنت.</p>
            
            <h6 className="text-white font-bold mb-1">سفن الفضاء:</h6>
            <p className="mb-3">أكثر من 30 سفينة فضاء قتالية، مقسمة إلى ثلاث رتب (برونزية، فضية، ذهبية)، قابلة للتعزيز حتى 6 نجوم.</p>

            <h6 className="text-white font-bold mb-1">الترسانة:</h6>
            <p className="mb-3">تخصيص السفن بترسانة واسعة من الأسلحة (مدافع رشاشة، أنظمة دفاع، قدرات خاصة) وتخصيص الألوان.</p>

            <h6 className="text-white font-bold mb-1">المعارك:</h6>
            <p className="mb-3">6 أوضاع قتال متعددة اللاعبين (معارك الفريق، استعادة المعلومات، القتال حتى الموت، إلخ) بالإضافة إلى مهام يومية.</p>

            <h6 className="text-white font-bold mb-1">الميزات:</h6>
            <ul className="list-disc list-inside mb-3">
              <li>التعاون مع الأصدقاء وتكوين أساطيل.</li>
              <li>رسومات ثلاثية الأبعاد مذهلة (LOW to ULTRA).</li>
              <li>نظام ألقاب وإنجازات (أكثر من 30 عنواناً).</li>
              <li>لا يتطلب الاتصال بالإنترنت (في أوضاع معينة).</li>
            </ul>
            
            <p className="font-bold text-[#00f3ff]">حملها الآن وكن أسطورة في Starfleet!</p>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
          <Info size={14} className="shrink-0" />
          <span>هذه المحاكاة تخضع للتحديثات المستمرة لإضافة أنظمة القتال المتقدمة.</span>
        </div>
      </div>
    </div>
  );
}
