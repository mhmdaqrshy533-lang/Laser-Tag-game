import React from "react";
import { useGameStore } from "../store";
import { sound } from "./SoundSystem";
import { Play, Shield, Plane, Award, Info, Sliders, Wifi, Navigation, ShieldCheck } from "lucide-react";

export default function LobbyScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);
  
  // States from Zustand store
  const {
    playerLevel,
    xp,
    score,
    migJetFlame,
    migJetLivery,
    exosuitArmorLvl,
    weaponPlasmaLvl
  } = useGameStore();

  const handleNavigate = (screenName: "lobby" | "hangar" | "campaign" | "missions" | "about") => {
    sound.playClick();
    setScreen(screenName);
  };

  const handleQuickPlay = () => {
    sound.playWeaponCharge();
    startGame();
  };

  return (
    <div className="w-full h-full bg-[#080d16]/95 border-2 border-[#00f3ff]/20 rounded-2xl flex flex-col justify-between text-white relative select-none overflow-hidden p-6">
      
      {/* Absolute floating cyber decorations */}
      <div className="absolute top-2 left-6 text-xs text-[#00f3ff]/40 font-mono tracking-widest pointer-events-none uppercase">
         LOBBY_REPLICA_PUBG // SECURITY_CLEARANCE_LVL_{playerLevel}
      </div>

      {/* 1. TOP HEADER STATUS BAR */}
      <div className="flex justify-between items-center bg-black/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
        
        {/* Left: Player Level Card & XP */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00f3ff]/10 border-2 border-[#00f3ff]/30 rounded-lg flex flex-col items-center justify-center text-[#00f3ff] relative shadow-[0_0_10px_rgba(0,243,255,0.15)] shrink-0">
            <span className="text-[8px] font-bold">المستوى</span>
            <span className="text-lg font-black font-mono leading-none">{playerLevel}</span>
          </div>

          <div className="flex flex-col gap-1 w-36">
            <div className="flex justify-between text-[10px] font-bold font-sans">
              <span className="text-slate-300">نقاط الخبرة (XP)</span>
              <span className="text-[#00f3ff] font-mono">{xp} / {playerLevel * 100}</span>
            </div>
            {/* Linear Progress bar */}
            <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${(xp / (playerLevel * 100)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Center: Sovereign Logo */}
        <div className="text-center shrink-0">
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-[#00f3ff] tracking-tight">
             تَـنْــكِــيــلْ (Shadow Force)
          </h2>
          <span className="text-[8px] font-bold text-slate-500 tracking-[0.3em] uppercase block mt-0.5">
             BATTLEGROUNDS SYSTEM REPLICA
          </span>
        </div>

        {/* Right: Network Latency & General Stats */}
        <div className="flex items-center gap-4">
          {/* Latency badge */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black text-emerald-400 font-mono">
            <Wifi size={11} className="animate-pulse" />
            <span>24 ms (مستقر)</span>
          </div>

          {/* High Score badge */}
          <div className="hidden sm:flex flex-col text-right font-mono">
            <span className="text-[8px] text-slate-500 font-bold uppercase">النقاط الحالية</span>
            <span className="text-amber-400 text-sm font-black">{score} PTS</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN MIDDLE LOBBY SECTION */}
      <div className="flex-grow my-6 flex flex-col md:flex-row gap-6 items-stretch justify-between relative min-h-0">
        
        {/* LEFT COLUMN: Squad list/Active status */}
        <div className="w-full md:w-64 bg-black/55 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm flex flex-col gap-3 shrink-0">
          <span className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-800 pb-1.5 uppercase">
             تشكيلة الفرقة النشطة (SQUAD STAFF)
          </span>

          <div className="flex flex-col gap-2">
            {/* Squad Member 1: AlphaOne (You) */}
            <div className="flex items-center justify-between p-2.5 bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-lg relative overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
                <span className="text-xs font-black text-[#00f3ff]">AlphaOne (أنت)</span>
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-400">القائد</span>
            </div>

            {/* Squad Member 2: Captain Mohammad Al-Kamali */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black text-slate-200">الكمالي (الكابتن المهندس)</span>
              </div>
              <span className="text-[8px] font-bold font-mono text-amber-400 px-1.5 py-0.5 bg-amber-400/5 border border-amber-400/15 rounded">مستشار</span>
            </div>

            {/* Squad Member 3: Militia Pilot */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg opacity-60">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-xs font-black text-slate-400">مساعد طيار MIG-29</span>
              </div>
              <span className="text-[8px] font-bold font-mono text-slate-500">منظّم</span>
            </div>
          </div>

          {/* Quick tips brief */}
          <div className="mt-auto p-2.5 bg-slate-950/70 border border-slate-900 rounded-lg text-[9px] text-slate-400 leading-relaxed">
             💡 <b>دليل تكتيكي</b>: تذكر ترقية البدلة والذخيرة من "المرآب العسكري" لرفع كفاءة ومقاومة المحارب ضد هجمات الآليين!
          </div>
        </div>

        {/* CENTER: 3D Holographic Character Stand */}
        <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden">
          {/* Circular cyber floor decal */}
          <div className="absolute bottom-4 w-48 h-12 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-full filter blur-sm"></div>
          <div className="absolute bottom-6 w-36 h-6 border border-[#00f3ff]/30 rounded-full animate-ping"></div>

          {/* Exosuit Warrior Hologram Vector illustration */}
          <div className="relative mb-8 text-center flex flex-col items-center">
            {/* Super Soldier vector outline */}
            <svg className="w-32 h-44 text-[#00f3ff] filter drop-shadow-[0_0_15px_#00f3ff] animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Helmet */}
              <circle cx="50" cy="20" r="8" />
              <path d="M45 20 L55 20" stroke="white" strokeWidth="2" />
              {/* Torso Exosuit */}
              <path d="M35 32 L65 32 L60 65 L40 65 Z" />
              <rect x="42" y="38" width="16" height="12" rx="2" stroke="white" strokeWidth="1" />
              {/* Arms */}
              <line x1="35" y1="32" x2="24" y2="52" />
              <line x1="65" y1="32" x2="76" y2="52" />
              {/* Rifle HKA16 outline */}
              <line x1="24" y1="52" x2="80" y2="52" stroke="white" strokeWidth="3" />
              <rect x="48" y="48" width="14" height="4" fill="white" />
              {/* Legs */}
              <line x1="40" y1="65" x2="35" y2="90" />
              <line x1="60" y1="65" x2="65" y2="90" />
            </svg>
            <span className="text-xs font-black tracking-widest text-[#00f3ff] mt-4 block uppercase font-mono bg-cyan-950/60 px-4 py-1.5 border border-[#00f3ff]/30 rounded-full">
               المحارب التكتيكي الخارق (AlphaOne)
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Hangar stats / customizations summary */}
        <div className="w-full md:w-64 bg-black/55 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm flex flex-col gap-3 shrink-0 justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-800 pb-1.5 uppercase block mb-3">
               تعديلات المرآب النشطة (GARAGE ACTIVE DATA)
            </span>

            <div className="flex flex-col gap-2.5">
              {/* Exosuit Level */}
              <div className="p-2 bg-slate-950/80 border border-slate-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">البدلة المدرعة (Exosuit):</span>
                  <span className="text-xs font-black text-amber-400">Lvl {exosuitArmorLvl} / 3</span>
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5">درع مضاف: {exosuitArmorLvl * 15}%</p>
              </div>

              {/* Weapon Level */}
              <div className="p-2 bg-slate-950/80 border border-slate-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">ذخيرة الـ HKA16:</span>
                  <span className="text-xs font-black text-[#00f3ff]">Lvl {weaponPlasmaLvl} / 3</span>
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5">ذخيرة البلازما: {30 + weaponPlasmaLvl * 5} Rounds</p>
              </div>

              {/* MiG-29 Flame */}
              <div className="p-2 bg-slate-950/80 border border-slate-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">لهب المقاتلة MIG-29:</span>
                  <span className="text-xs font-black text-fuchsia-400 uppercase font-mono">{migJetFlame}</span>
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5">اللون الخارجي للأجنحة: {migJetLivery}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Seal */}
          <div className="p-2.5 bg-[#00f3ff]/5 border border-[#00f3ff]/15 rounded-lg text-center font-bold text-[9px] text-[#00f3ff] flex items-center gap-1.5 justify-center">
             <ShieldCheck size={12} />
             <span>الأصول العسكرية مهيأة للقتال</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SELECTION MENU BUTTONS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-black/60 p-3.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
        
        {/* Play Button - Large first */}
        <button
          onClick={handleQuickPlay}
          className="col-span-2 md:col-span-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(220,38,38,0.25)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Play size={15} fill="currentColor" />
          <span>ابدأ القتال</span>
        </button>

        {/* Hangar button */}
        <button
          onClick={() => handleNavigate("hangar")}
          className="py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-extrabold text-xs rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plane size={14} className="text-[#00f3ff]" />
          <span>المرآب العسكري</span>
        </button>

        {/* Campaign stages button */}
        <button
          onClick={() => handleNavigate("campaign")}
          className="py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-extrabold text-xs rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Navigation size={14} className="text-amber-400" />
          <span>مستويات المعركة</span>
        </button>

        {/* Missions button */}
        <button
          onClick={() => handleNavigate("missions")}
          className="py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-extrabold text-xs rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Award size={14} className="text-emerald-400" />
          <span>المهمات الحيوية</span>
        </button>

        {/* About & Intel button */}
        <button
          onClick={() => handleNavigate("about")}
          className="col-span-2 md:col-span-1 py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-extrabold text-xs rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Info size={14} className="text-fuchsia-400" />
          <span>حول اللعبة والسيادة</span>
        </button>
      </div>
    </div>
  );
}
