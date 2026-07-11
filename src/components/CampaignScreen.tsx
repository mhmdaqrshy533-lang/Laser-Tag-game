import React, { useState } from "react";
import { useGameStore } from "../store";
import { sound } from "./SoundSystem";
import { Compass, Shield, Award, Play, ArrowLeft, Target, Radio } from "lucide-react";

export default function CampaignScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  const playerLevel = useGameStore((state) => state.playerLevel);
  const setPlayerLevel = useGameStore((state) => state.setPlayerLevel);
  const startGame = useGameStore((state) => state.startGame);

  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  const handleBack = () => {
    sound.playClick();
    setScreen("lobby");
  };

  const handleSelectLevel = (level: 1 | 2 | 3) => {
    sound.playSelect();
    setActiveLevel(level);
  };

  const handleLaunchLevel = () => {
    sound.playWeaponCharge();
    // Synchronize selected difficulty level with store level state
    setPlayerLevel(activeLevel);
    // Start game
    startGame();
  };

  const levelBriefings = {
    1: {
      title: "المستوى 1: الاختراق المداري (Orbital Penetration)",
      brief: "بدء الهجوم المداري التكتيكي عبر الغلاف الجوي الخارجي وتدمير 3 أهداف عسكرية فضائية تم رصدها كتهديد فوري لتأمين ممر الهبوط الرئيسي للمقاتلة.",
      enemies: "أهداف فضائية آلية",
      difficulty: "سهل (RECRUIT)",
      reward: "ترقية أجنحة الـ MIG-29",
    },
    2: {
      title: "المستوى 2: تصفية المطار العسكري (Airbase Clearing)",
      brief: "الهبوط على مدرج المطار المشتعل. تفعيل الطور الأرضي للبدلة المدرعة الثقيلة لتصفية السواتر وتأمين محيط المدرج من طائرات الدرون الهجومية والآليين المسلحين.",
      enemies: "مدرعات مشاة + طائرات بدون طيار",
      difficulty: "متوسط (VETERAN)",
      reward: "سلاح HKA16 بلازما مطوّر",
    },
    3: {
      title: "المستوى 3: السيادة الكاملة (Complete Sovereignty)",
      brief: "المواجهة التكتيكية الكبرى والنهائية! بسط السيادة التقنية والعسكرية الكاملة على كامل النطاق الجوي والأرضي للقطاع وهزيمة النواة الروبوتية الحامية.",
      enemies: "كوماندوز ثقيل + دفاعات أرضية ذكية",
      difficulty: "صعب جداً (ELITE)",
      reward: "درع بدلة النانو الكامل",
    },
  };

  return (
    <div className="w-full h-full bg-[#070b13] border-2 border-[#00f3ff]/20 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 text-white overflow-y-auto backdrop-blur-xl select-none relative">
      
      {/* Hologram radar ambient lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,243,255,0.06),transparent_75%)] pointer-events-none" />

      {/* LEFT COLUMN: Holographic Assault Map */}
      <div className="flex-grow flex flex-col gap-4 bg-black/55 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
        
        {/* Scanning grid animation */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent animate-pulse" />

        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="text-[#00f3ff] animate-pulse" size={18} />
            <span className="font-sans font-black text-base text-[#00f3ff] tracking-widest uppercase">
               خريطة مستويات المعركة ثلاثية الأبعاد (TACTICAL MAP)
            </span>
          </div>
          <button
            onClick={handleBack}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>العودة</span>
          </button>
        </div>

        {/* Dynamic Holographic Vector Map Grid */}
        <div className="flex-grow h-64 lg:h-auto border border-[#00f3ff]/15 bg-slate-950/70 rounded-xl relative flex items-center justify-center overflow-hidden">
          
          {/* Circular radar grid lines overlay */}
          <div className="absolute w-96 h-96 border border-[#00f3ff]/5 rounded-full animate-spin [animation-duration:40s]"></div>
          <div className="absolute w-64 h-64 border border-[#00f3ff]/10 rounded-full animate-spin [animation-duration:20s]"></div>
          <div className="absolute w-32 h-32 border border-[#00f3ff]/5 rounded-full"></div>

          {/* Compass grid line directions */}
          <div className="absolute inset-x-4 h-[1px] bg-slate-900/60" />
          <div className="absolute inset-y-4 w-[1px] bg-slate-900/60" />

          {/* Connected Level Nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw attack vector connector lines */}
            <line x1="30%" y1="70%" x2="50%" y2="40%" stroke="rgba(0, 243, 255, 0.25)" strokeWidth="2.5" strokeDasharray="5,5" />
            <line x1="50%" y1="40%" x2="75%" y2="25%" stroke="rgba(0, 243, 255, 0.25)" strokeWidth="2.5" strokeDasharray="5,5" />
          </svg>

          {/* Level 1 Node: Orbital */}
          <div className="absolute left-[26%] bottom-[20%] z-10">
            <button
              onClick={() => handleSelectLevel(1)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all relative cursor-pointer ${
                activeLevel === 1
                  ? "bg-[#00f3ff]/15 border-[#00f3ff] text-white shadow-[0_0_15px_#00f3ff]"
                  : "bg-slate-950/90 border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${activeLevel === 1 ? 'bg-[#00f3ff] border-white animate-ping' : 'bg-slate-700 border-slate-500'}`}></div>
              <span className="text-[10px] font-black tracking-wider">نقطة الاختراق 1</span>
            </button>
          </div>

          {/* Level 2 Node: Airbase */}
          <div className="absolute left-[45%] top-[35%] z-10">
            <button
              onClick={() => handleSelectLevel(2)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all relative cursor-pointer ${
                activeLevel === 2
                  ? "bg-[#00f3ff]/15 border-[#00f3ff] text-white shadow-[0_0_15px_#00f3ff]"
                  : "bg-slate-950/90 border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${activeLevel === 2 ? 'bg-[#00f3ff] border-white animate-ping' : 'bg-slate-700 border-slate-500'}`}></div>
              <span className="text-[10px] font-black tracking-wider">قاعدة المطار 2</span>
            </button>
          </div>

          {/* Level 3 Node: Sovereignty */}
          <div className="absolute right-[18%] top-[18%] z-10">
            <button
              onClick={() => handleSelectLevel(3)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all relative cursor-pointer ${
                activeLevel === 3
                  ? "bg-[#00f3ff]/15 border-[#00f3ff] text-white shadow-[0_0_15px_#00f3ff]"
                  : "bg-slate-950/90 border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${activeLevel === 3 ? 'bg-[#00f3ff] border-white animate-ping' : 'bg-slate-700 border-slate-500'}`}></div>
              <span className="text-[10px] font-black tracking-wider">السيادة الكبرى 3</span>
            </button>
          </div>

          {/* Overlay Coordinates */}
          <div className="absolute bottom-2 left-3 font-mono text-[8px] text-slate-500 uppercase tracking-widest leading-relaxed">
            <span>GRID SYSTEM ACTIVE // SEC_EAST_098</span>
            <br />
            <span>ALTITUDE SCALES // NORMALIZER</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Target Details & Brief */}
      <div className="w-full lg:w-96 flex flex-col gap-4 bg-black/65 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm justify-between">
        <div className="flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono text-amber-400 font-black tracking-widest uppercase block mb-1">
              CURRENT BRIEFING
            </span>
            <h3 className="text-lg font-black text-white font-sans leading-snug">
              {levelBriefings[activeLevel].title}
            </h3>
          </div>

          {/* Brief explanation paragraph */}
          <div className="p-3 bg-slate-950/65 border border-slate-900 rounded-xl leading-relaxed text-slate-300 text-xs">
            {levelBriefings[activeLevel].brief}
          </div>

          {/* Key tactical parameters list */}
          <div className="flex flex-col gap-2.5 text-xs font-mono">
            <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-900">
              <span className="text-slate-400">التهديدات المتوقعة:</span>
              <span className="text-[#00f3ff] font-bold">{levelBriefings[activeLevel].enemies}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-900">
              <span className="text-slate-400">مستوى الصعوبة العسكري:</span>
              <span className="text-amber-500 font-bold">{levelBriefings[activeLevel].difficulty}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-900">
              <span className="text-slate-400">المكافأة التكنولوجية:</span>
              <span className="text-emerald-400 font-bold">{levelBriefings[activeLevel].reward}</span>
            </div>
          </div>
        </div>

        {/* Big Launch Button */}
        <button
          onClick={handleLaunchLevel}
          className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base uppercase tracking-widest rounded-xl shadow-[0_4px_18px_rgba(245,158,11,0.25)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play size={16} fill="currentColor" />
          <span>ابدأ المعركة التكتيكية</span>
        </button>
      </div>
    </div>
  );
}
