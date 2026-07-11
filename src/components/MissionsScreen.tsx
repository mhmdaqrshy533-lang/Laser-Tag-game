import React, { useState } from "react";
import { useGameStore } from "../store";
import { sound } from "./SoundSystem";
import { Award, CheckCircle2, Circle, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  reward: string;
  claimed: boolean;
}

export default function MissionsScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  const xp = useGameStore((state) => state.xp);
  const playerLevel = useGameStore((state) => state.playerLevel);

  // Initialize a few sample daily and weekly sovereign missions with claiming state
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: "m1",
      title: "تصفية الأهداف بالصواريخ الذكية",
      description: "قم بتصفية 5 أهداف باستخدام صواريخ القفل الذكي لفتح ترقية البدلة والدرع.",
      targetCount: 5,
      currentCount: 5, // Ready to claim
      reward: "ترقية درع بدلة النانو (+10%)",
      claimed: false,
    },
    {
      id: "m2",
      title: "السيادة الكاملة للمدرج العسكري",
      description: "أكمل جولة قتالية بنتيجة تتجاوز 300 نقطة لإثبات السيادة القتالية الكاملة.",
      targetCount: 300,
      currentCount: 150, // In progress
      reward: "صندوق ذخيرة بلازما حارق (+100 XP)",
      claimed: false,
    },
    {
      id: "m3",
      title: "الحفاظ على حيوية الطاقة",
      description: "استخدم حقيبة الإسعاف السريع (Medkit) مرتين تحت نيران الأعداء لتأمين نسبة البقاء.",
      targetCount: 2,
      currentCount: 2, // Ready to claim
      reward: "شريحة تسريع الحركة النانوية",
      claimed: false,
    },
    {
      id: "m4",
      title: "الصمود الناري المتواصل",
      description: "صمد طيلة 120 ثانية كاملة داخل المطار الحربي دون الاستسلام لنيران Bots المتمردين.",
      targetCount: 120,
      currentCount: 120, // Ready to claim
      reward: "نقاط خبرة إضافية (+200 XP)",
      claimed: true, // Already claimed
    },
  ]);

  const handleBack = () => {
    sound.playClick();
    setScreen("lobby");
  };

  const handleClaim = (id: string) => {
    sound.playWeaponCharge();
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, claimed: true };
        }
        return m;
      })
    );
    // Give some virtual event notifications
    useGameStore.getState().addEvent(`Claimed reward: ${missions.find(m => m.id === id)?.reward}`);
  };

  return (
    <div className="w-full h-full bg-[#070b13] border-2 border-[#00f3ff]/20 rounded-2xl p-6 flex flex-col gap-5 text-white overflow-y-auto backdrop-blur-xl relative select-none">
      
      {/* Upper header */}
      <div className="flex justify-between items-center border-b border-[#00f3ff]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <Award className="text-[#00f3ff] animate-bounce" size={24} />
          <span className="font-sans font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
             لوحة المهمات والترقيات الحيوية (Directives & Missions)
          </span>
        </div>
        <button
          onClick={handleBack}
          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>العودة</span>
        </button>
      </div>

      {/* Subtitle brief */}
      <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl bg-slate-950/40 p-3 rounded-lg border border-slate-900/60">
         مجموعة المهام التكتيكية الممنوحة مباشرة من قيادة السيطرة لتعزيز مستواك وفتح حزم التسليح الإستراتيجية. إكمال المهام يمنحك ترقيات بدنية خارقة.
      </p>

      {/* Missions Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missions.map((m) => {
          const isCompleted = m.currentCount >= m.targetCount;
          const progressPercent = Math.min(100, (m.currentCount / m.targetCount) * 100);

          return (
            <div
              key={m.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                m.claimed
                  ? "bg-slate-950/40 border-slate-900 opacity-60"
                  : isCompleted
                  ? "bg-emerald-950/15 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <div className="flex flex-col gap-2">
                {/* Title & Status */}
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-sans font-black text-sm text-white flex items-center gap-1.5">
                    {m.claimed ? (
                      <CheckCircle2 size={15} className="text-slate-500" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={15} className="text-emerald-400 animate-pulse" />
                    ) : (
                      <Circle size={15} className="text-slate-600" />
                    )}
                    <span>{m.title}</span>
                  </h4>
                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                      m.claimed
                        ? "bg-slate-900 text-slate-500"
                        : isCompleted
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {m.claimed ? "تم الاستلام" : isCompleted ? "مكتملة وجاهزة" : "قيد التنفيذ"}
                  </span>
                </div>

                {/* Description info */}
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  {m.description}
                </p>
              </div>

              {/* Progress Bar & Reward Claim Button */}
              <div className="flex flex-col gap-3 mt-1.5">
                {/* Linear progress bar */}
                <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>معدل التقدم:</span>
                    <span>
                      {m.currentCount} / {m.targetCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Reward and CTA action */}
                <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">المكافأة التكنولوجية:</span>
                    <span className="text-[#00f3ff] text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles size={10} />
                      {m.reward}
                    </span>
                  </div>

                  {!m.claimed && isCompleted ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded-md transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] uppercase"
                    >
                      استلام المكافأة
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1 bg-slate-900 text-slate-500 font-extrabold text-[10px] rounded border border-slate-800"
                    >
                      {m.claimed ? "مستلمة" : "غير جاهز"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
