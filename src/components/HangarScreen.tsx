import React from "react";
import { useGameStore } from "../store";
import { sound } from "./SoundSystem";
import { Plane, Shield, Zap, Settings, ArrowLeft, Paintbrush, Flame, Info } from "lucide-react";

export default function HangarScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  
  // Customization specifications from Zustand store
  const {
    migJetFlame,
    migJetLivery,
    exosuitArmorLvl,
    weaponPlasmaLvl,
    setHangarSpecs,
    setArmor,
    setAmmo
  } = useGameStore();

  const handleBack = () => {
    sound.playClick();
    setScreen("lobby");
  };

  const handleFlameChange = (flameColor: "cyan" | "purple" | "amber") => {
    sound.playSelect();
    setHangarSpecs({ migJetFlame: flameColor });
  };

  const handleLiveryChange = (livery: "camo" | "stealth" | "sovereign") => {
    sound.playSelect();
    setHangarSpecs({ migJetLivery: livery });
  };

  const handleUpgradeArmor = () => {
    if (exosuitArmorLvl >= 3) return;
    sound.playWeaponCharge();
    const nextLvl = exosuitArmorLvl + 1;
    setHangarSpecs({ exosuitArmorLvl: nextLvl });
    // Increase active defense armor in game
    setArmor(60 + nextLvl * 15);
  };

  const handleUpgradeWeapon = () => {
    if (weaponPlasmaLvl >= 3) return;
    sound.playWeaponCharge();
    const nextLvl = weaponPlasmaLvl + 1;
    setHangarSpecs({ weaponPlasmaLvl: nextLvl });
    // Increase active ammo capacity in game
    setAmmo(30 + nextLvl * 5);
  };

  return (
    <div className="w-full h-full bg-[#070b13] border-2 border-[#00f3ff]/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 text-white overflow-y-auto backdrop-blur-xl relative select-none">
      
      {/* Background neon light effects */}
      <div className="absolute top-0 left-1/3 w-[1px] h-3/4 bg-gradient-to-b from-[#00f3ff]/40 to-transparent shadow-[0_0_20px_#00f3ff]"></div>
      <div className="absolute top-0 right-1/4 w-[1px] h-2/3 bg-gradient-to-b from-amber-500/30 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>

      {/* LEFT PANEL: Jet aircraft customization & Hangar controls */}
      <div className="flex-1 flex flex-col gap-5 bg-black/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[#00f3ff]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <Plane className="text-[#00f3ff] animate-pulse" size={22} />
            <span className="font-sans font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              المرآب العسكري الجوي (MIG-29)
            </span>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-1.5 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[#00f3ff] text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>العودة (Back)</span>
          </button>
        </div>

        {/* Jet Visual Render */}
        <div className="relative w-full h-48 bg-slate-950/80 rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center">
          <div className="absolute top-2 left-3 bg-[#00f3ff]/15 px-2 py-0.5 rounded text-[8px] font-mono text-[#00f3ff] tracking-widest uppercase">
            Hangar Bay: Aerial 01
          </div>

          {/* Simple simulated fighter rendering based on selected livery & flame */}
          <div className="relative flex flex-col items-center justify-center scale-90">
            {/* Engine fire exhaust glow */}
            <div
              className={`w-20 h-28 absolute -bottom-24 rounded-full filter blur-md transition-all duration-300 opacity-80 ${
                migJetFlame === "cyan"
                  ? "bg-gradient-to-t from-cyan-400 to-transparent shadow-[0_0_20px_#00f3ff]"
                  : migJetFlame === "purple"
                  ? "bg-gradient-to-t from-fuchsia-500 to-transparent shadow-[0_0_20px_#d946ef]"
                  : "bg-gradient-to-t from-amber-500 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.8)]"
              }`}
            ></div>

            {/* Wing livery visual outline */}
            <svg className="w-40 h-32 text-slate-400 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" fill="currentColor">
              {/* Livery fill color configurations */}
              {migJetLivery === "sovereign" && (
                <path d="M50 10 L85 85 L50 75 L15 85 Z" className="text-blue-900 border-2 stroke-blue-400" />
              )}
              {migJetLivery === "stealth" && (
                <path d="M50 10 L85 85 L50 75 L15 85 Z" className="text-zinc-800 border-2 stroke-zinc-600" />
              )}
              {migJetLivery === "camo" && (
                <path d="M50 10 L85 85 L50 75 L15 85 Z" className="text-emerald-950 border-2 stroke-emerald-600" />
              )}
              {/* Cockpit Canopy glass */}
              <ellipse cx="50" cy="45" rx="5" ry="12" fill="#00f3ff" opacity="0.8" />
            </svg>
          </div>

          {/* Hologram status overlay */}
          <div className="absolute bottom-2 right-3 font-mono text-[9px] text-slate-500 flex flex-col items-end uppercase">
            <span>FLAME: {migJetFlame}</span>
            <span>LIVERY: {migJetLivery}</span>
          </div>
        </div>

        {/* Customization controls */}
        <div className="flex flex-col gap-4">
          {/* Flame color selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
              <Flame size={14} className="text-[#00f3ff]" />
              <span>نظام اللهب النفّاث (Engine Exhaust Flame)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cyan", name: "نيون سيان", color: "bg-[#00f3ff] border-cyan-400 text-cyan-900" },
                { id: "purple", name: "بلازما أرجوانية", color: "bg-fuchsia-500 border-fuchsia-400 text-fuchsia-950" },
                { id: "amber", name: "جمر تكتيكي", color: "bg-amber-500 border-amber-400 text-amber-950" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleFlameChange(item.id as any)}
                  className={`py-2 rounded-xl text-[10px] font-black border text-center uppercase tracking-wider transition-all cursor-pointer ${
                    migJetFlame === item.id
                      ? `${item.color} shadow-lg font-black scale-102`
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Aircraft livery selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
              <Paintbrush size={14} className="text-amber-400" />
              <span>مظهر ولون الأجنحة (Aircraft Wing Livery)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sovereign", name: "السيادي الأزرق" },
                { id: "stealth", name: "الشبح الأسود" },
                { id: "camo", name: "التمويه الحربي" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleLiveryChange(item.id as any)}
                  className={`py-2 rounded-xl text-[10px] font-black border text-center transition-all cursor-pointer ${
                    migJetLivery === item.id
                      ? "bg-[#00f3ff] border-cyan-400 text-black shadow-lg scale-102 font-black"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Exosuit armor & HKA16 plasma weaponry */}
      <div className="flex-1 flex flex-col gap-5 bg-black/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="border-b border-amber-500/20 pb-3 flex items-center gap-2.5">
          <Shield className="text-amber-500 animate-pulse" size={22} />
          <span className="font-sans font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
            ترقيات المحارب الأرضي (Tactical Exosuit)
          </span>
        </div>

        {/* Upgrade Exosuit Defense Plating */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-black text-white">ترقية البدلة المدرعة الثقيلة (Exosuit Shield)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">ترقية دروع البقاء والمقاومة الفيزيائية العالية.</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              Lvl {exosuitArmorLvl}/3
            </span>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>القوة الفيزيائية للبدلة:</span>
              <span className="text-white font-bold">{60 + exosuitArmorLvl * 15}% HP Equivalent</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${(exosuitArmorLvl / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={handleUpgradeArmor}
            disabled={exosuitArmorLvl >= 3}
            className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              exosuitArmorLvl >= 3
                ? "bg-slate-900 border border-slate-800 text-slate-500"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-md active:scale-95"
            }`}
          >
            {exosuitArmorLvl >= 3 ? "تم الوصول للحد الأقصى (Max)" : "ترقية الدرع البدني (+15% Armor)"}
          </button>
        </div>

        {/* Upgrade Weapon HKA16 Plasma */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-black text-white">ذخيرة البلازما المتفجرة (HKA16 Rifle)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">ترقية قوة المقذوفات وسعة مخزن الذخيرة التكتيكي.</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-cyan-500/10 text-[#00f3ff] border border-cyan-500/20 rounded">
              Lvl {weaponPlasmaLvl}/3
            </span>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>حجم مخزن الذخيرة (Ammo capacity):</span>
              <span className="text-white font-bold">{30 + weaponPlasmaLvl * 5} Rounds</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f3ff] transition-all duration-300"
                style={{ width: `${(weaponPlasmaLvl / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={handleUpgradeWeapon}
            disabled={weaponPlasmaLvl >= 3}
            className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              weaponPlasmaLvl >= 3
                ? "bg-slate-900 border border-slate-800 text-slate-500"
                : "bg-[#00f3ff] hover:bg-[#00f3ff]/85 text-black shadow-md active:scale-95"
            }`}
          >
            {weaponPlasmaLvl >= 3 ? "تم الوصول للحد الأقصى (Max)" : "شحن وترقية البلازما (+5 Ammo Capacity)"}
          </button>
        </div>

        {/* Informative Footer */}
        <div className="flex items-start gap-2 text-slate-400 text-[10px] leading-relaxed p-3 bg-slate-950/45 border border-slate-900 rounded-lg">
          <Info size={14} className="text-[#00f3ff] shrink-0 mt-0.5" />
          <span>
             التعديلات والترقيات تحفظ في الذاكرة التكتيكية وتنعكس فوراً على إحصائيات البدلة والذخيرة بـ <b>شاشات القتال الحية</b>!
          </span>
        </div>
      </div>
    </div>
  );
}
