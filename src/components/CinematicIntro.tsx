import React, { useEffect, useRef, useState } from "react";
import { sound } from "./SoundSystem";
import { useGameStore } from "../store";
import { ShieldAlert, Compass, Crosshair, Flame, Play, SkipForward } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

export default function CinematicIntro() {
  const setIntroActive = useGameStore((state) => state.setIntroActive);
  const setScreen = useGameStore((state) => state.setScreen);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scene, setScene] = useState<1 | 2 | 3>(1);
  const [hudWarning, setHudWarning] = useState(false);
  const [hudLocked, setHudLocked] = useState(false);
  const [canopyOpen, setCanopyOpen] = useState(false);
  const [weaponReady, setWeaponReady] = useState(false);

  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Scene transition timers (Total 10 seconds)
  useEffect(() => {
    // Sound alarm start on Scene 1
    const alarmTimer = setTimeout(() => {
      sound.playAlarm();
      setHudWarning(true);
    }, 1200);

    // Switch to Scene 2 (Atmospheric descent) at 3.5 seconds
    const scene2Timer = setTimeout(() => {
      setScene(2);
      sound.playAlarm();
    }, 3500);

    // Lock target in Scene 2 at 5.0 seconds
    const targetLockTimer = setTimeout(() => {
      setHudLocked(true);
      sound.playAlarm();
    }, 5200);

    // Switch to Scene 3 (Touchdown & Hero emerge) at 6.8 seconds
    const scene3Timer = setTimeout(() => {
      setScene(3);
    }, 6800);

    // Cockpit opening at 7.6 seconds
    const canopyTimer = setTimeout(() => {
      setCanopyOpen(true);
    }, 7600);

    // Weapon charge & ready at 8.4 seconds
    const weaponTimer = setTimeout(() => {
      sound.playWeaponCharge();
      setWeaponReady(true);
    }, 8400);

    // Auto-terminate intro at 10 seconds and start the main military march lobby theme
    const endTimer = setTimeout(() => {
      handleComplete();
    }, 10000);

    return () => {
      clearTimeout(alarmTimer);
      clearTimeout(scene2Timer);
      clearTimeout(targetLockTimer);
      clearTimeout(scene3Timer);
      clearTimeout(canopyTimer);
      clearTimeout(weaponTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const handleComplete = () => {
    sound.startMilitaryMarch();
    setIntroActive(false);
    setScreen("lobby");
  };

  // Canvas particle logic for dynamic visual effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize stars or heat friction fire particles
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: -Math.random() * 3 - 1,
        speedY: (Math.random() - 0.5) * 0.5,
        color: "#ffffff",
        alpha: Math.random(),
      });
    }
    particlesRef.current = particles;

    let time = 0;
    const draw = () => {
      time += 0.016;
      ctx.fillStyle = scene === 2 ? "rgba(12, 18, 30, 0.45)" : "rgba(8, 12, 22, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Update and draw background particles
      particlesRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Reset if goes off screen
        if (p.x < 0) {
          p.x = width;
          p.y = Math.random() * height;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Ambient nebula gases
      if (scene === 1) {
        const grad = ctx.createRadialGradient(width * 0.7, height * 0.4, 10, width * 0.7, height * 0.4, width * 0.6);
        grad.addColorStop(0, "rgba(217, 70, 239, 0.08)"); // Magenta
        grad.addColorStop(0.5, "rgba(0, 243, 255, 0.04)"); // Cyan neon
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // ================= Scene 1: MIG-29 Flying in deep space =================
      if (scene === 1) {
        ctx.save();
        ctx.translate(width * 0.5, height * 0.5 + Math.sin(time * 3) * 15);
        ctx.rotate(0.05 * Math.sin(time * 2));

        // Draw jet body trail (Neon Flame)
        const trailGrad = ctx.createLinearGradient(-180, 0, -60, 0);
        trailGrad.addColorStop(0, "rgba(0, 243, 255, 0)");
        trailGrad.addColorStop(0.5, "rgba(0, 243, 255, 0.65)");
        trailGrad.addColorStop(0.9, "rgba(217, 70, 239, 0.95)");
        trailGrad.addColorStop(1, "#ffffff");

        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(-160, -12 + Math.sin(time * 20) * 4);
        ctx.lineTo(-65, -4);
        ctx.lineTo(-65, 4);
        ctx.lineTo(-160, 12 + Math.sin(time * 20) * -4);
        ctx.closePath();
        ctx.fill();

        // Draw tactical MIG-29 fighter vector silhouette (electric slate outline)
        ctx.strokeStyle = "#00f3ff";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#00f3ff";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        // Nose cone
        ctx.moveTo(90, 0);
        // Canopy fuselage
        ctx.lineTo(20, -10);
        // Wing port
        ctx.lineTo(-20, -50);
        ctx.lineTo(-30, -50);
        ctx.lineTo(-25, -15);
        // Tail port
        ctx.lineTo(-65, -15);
        ctx.lineTo(-75, -35);
        // Engine exhaust
        ctx.lineTo(-65, -5);
        ctx.lineTo(-65, 5);
        // Tail starboard
        ctx.lineTo(-75, 35);
        ctx.lineTo(-65, 15);
        // Wing starboard
        ctx.lineTo(-25, 15);
        ctx.lineTo(-30, 50);
        ctx.lineTo(-20, 50);
        ctx.lineTo(20, 10);
        ctx.closePath();
        ctx.stroke();

        // Red flashing pilot light
        if (Math.floor(time * 5) % 2 === 0) {
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.beginPath();
          ctx.arc(15, -6, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ================= Scene 2: Atmospheric Descent (Severe thermal entry) =================
      if (scene === 2) {
        // Shake screen dynamically based on atmospheric speed
        const shakeX = (Math.random() - 0.5) * 8;
        const shakeY = (Math.random() - 0.5) * 8;

        ctx.save();
        ctx.translate(width * 0.5 + shakeX, height * 0.5 + shakeY);
        // Diving angle (steep roll/pitch rotation)
        ctx.rotate(-0.45 + Math.sin(time * 8) * 0.08);

        // Generate blazing heat flames friction
        for (let j = 0; j < 12; j++) {
          const flameX = 60 + Math.random() * 50;
          const flameY = (Math.random() - 0.5) * 40;
          const flameSize = Math.random() * 35 + 10;
          ctx.fillStyle = Math.random() > 0.5 ? "rgba(249, 115, 22, 0.75)" : "rgba(239, 68, 68, 0.65)";
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw MIG-29 silhouette undergoing severe friction heat
        ctx.strokeStyle = "#ff6a00";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff3c00";

        ctx.beginPath();
        ctx.moveTo(90, 0);
        ctx.lineTo(20, -10);
        ctx.lineTo(-20, -50);
        ctx.lineTo(-30, -50);
        ctx.lineTo(-25, -15);
        ctx.lineTo(-65, -15);
        ctx.lineTo(-75, -35);
        ctx.lineTo(-65, -5);
        ctx.lineTo(-65, 5);
        ctx.lineTo(-75, 35);
        ctx.lineTo(-65, 15);
        ctx.lineTo(-25, 15);
        ctx.lineTo(-30, 50);
        ctx.lineTo(-20, 50);
        ctx.lineTo(20, 10);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        // FLIR (Forward-Looking Infrared) Tactical Overlay
        ctx.strokeStyle = "rgba(0, 243, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        // Thermal camera scanning grid lines
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        // Reticle Center tracking Airbase target
        ctx.strokeStyle = hudLocked ? "#ef4444" : "#00f3ff";
        ctx.lineWidth = hudLocked ? 2 : 1;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.65, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs in target reticle
        ctx.beginPath();
        ctx.moveTo(width * 0.5 - 80, height * 0.65);
        ctx.lineTo(width * 0.5 + 80, height * 0.65);
        ctx.moveTo(width * 0.5, height * 0.65 - 80);
        ctx.lineTo(width * 0.5, height * 0.65 + 80);
        ctx.stroke();
      }

      // ================= Scene 3: Ground Touchdown & Nanosuit deploy =================
      if (scene === 3) {
        // Tarmac ground layout (dark concrete with cracking details & landing fire glow)
        const tarmacY = height * 0.72;
        ctx.save();

        // Fiery background tarmac glow
        const glowGrad = ctx.createLinearGradient(0, tarmacY - 200, 0, height);
        glowGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
        glowGrad.addColorStop(0.4, "rgba(239, 68, 68, 0.15)");
        glowGrad.addColorStop(0.7, "rgba(8, 12, 22, 0.9)");
        glowGrad.addColorStop(1, "rgba(8, 12, 22, 1)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, tarmacY - 200, width, height - tarmacY + 200);

        // Cracked tarmac lines
        ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, tarmacY);
        ctx.lineTo(width * 0.4, height);
        ctx.moveTo(width * 0.9, tarmacY);
        ctx.lineTo(width * 0.6, height);
        // Horizontal runway dividers
        ctx.moveTo(0, tarmacY + 20);
        ctx.lineTo(width, tarmacY + 20);
        ctx.moveTo(0, tarmacY + 80);
        ctx.lineTo(width, tarmacY + 80);
        ctx.stroke();

        // MIG-29 landed silhouette in the background with canopy open
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(width * 0.35, tarmacY - 55);

        // Draw simplified stationary fighter silhouette
        ctx.beginPath();
        ctx.moveTo(-110, 0);
        ctx.lineTo(-40, -45);
        ctx.lineTo(40, -45);
        ctx.lineTo(95, 0);
        ctx.lineTo(55, 20);
        ctx.lineTo(-75, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Canopy opening indicator line
        if (canopyOpen) {
          ctx.strokeStyle = "#ff0077";
          ctx.beginPath();
          ctx.moveTo(0, -45);
          ctx.lineTo(-15, -75);
          ctx.stroke();
          ctx.fillStyle = "#ff0077";
          ctx.font = "bold 9px monospace";
          ctx.fillText("CANOPY DEPLOYED", -40, -82);
        }
        ctx.restore();

        // Hero Super Soldier heavy nanosuit silhouette in foreground (Third Person Shooter camera aspect)
        ctx.save();
        ctx.translate(width * 0.62, tarmacY - 110);

        // Draw elegant cyberpunk warrior shadow silhouette with glowing neon details
        // Heavy armor body
        ctx.fillStyle = "rgba(10, 15, 25, 0.95)";
        ctx.strokeStyle = weaponReady ? "#00f3ff" : "rgba(0, 243, 255, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Helmet
        ctx.arc(0, -75, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visor glow
        ctx.fillStyle = weaponReady ? "#00f3ff" : "#f59e0b";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(-7, -79, 14, 4);

        // Shoulders & Body
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(10, 15, 25, 0.95)";
        ctx.beginPath();
        ctx.moveTo(-28, -60);
        ctx.lineTo(28, -60);
        ctx.lineTo(22, 10);
        ctx.lineTo(-22, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw HKA16 plasma rifle being pointed and charged in hand
        ctx.save();
        ctx.rotate(-0.1);
        ctx.strokeStyle = weaponReady ? "#00f3ff" : "#ef4444";
        ctx.lineWidth = 3;
        ctx.shadowBlur = weaponReady ? 14 : 0;
        ctx.shadowColor = "#00f3ff";

        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(55, -25); // Gun barrel
        ctx.moveTo(25, -25);
        ctx.lineTo(25, -12); // Scope/Grip
        ctx.stroke();

        // Charging plasma pulse particle circle at muzzle
        if (weaponReady) {
          ctx.fillStyle = "#00f3ff";
          ctx.beginPath();
          ctx.arc(58, -25, 6 + Math.sin(time * 30) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        ctx.restore();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [scene, canopyOpen, weaponReady, hudLocked]);

  return (
    <div className="absolute inset-0 z-[60] bg-[#080c16] flex flex-col items-center justify-between pointer-events-auto select-none overflow-hidden font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* skip button top-left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/60 hover:bg-black/90 text-[#00f3ff] hover:text-white border border-[#00f3ff]/40 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.15)]"
        >
          <SkipForward size={16} />
          <span>تخطي العرض السينمائي (Skip)</span>
        </button>
      </div>

      {/* Progress timeline indicator bottom-center */}
      <div className="absolute top-6 right-6 z-10 bg-slate-950/80 px-4 py-2 border border-slate-800 rounded-xl font-mono text-xs text-slate-400 flex items-center gap-2 backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-ping" />
        <span className="font-bold tracking-widest text-[#00f3ff]">TACTICAL_INTRO // {scene === 1 ? "MIG-29_DEPTH" : scene === 2 ? "DESCENT_FLIR" : "TARMAC_TPS"}</span>
      </div>

      {/* SCENE SPECIFIC TEXTS AND OVERLAYS */}
      <div className="w-full max-w-4xl px-8 py-10 z-10 pointer-events-none mt-20 flex flex-col items-center flex-grow justify-center">
        {scene === 1 && (
          <div className="text-center animate-fade-in flex flex-col items-center gap-6">
            <span className="px-4 py-1.5 bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 rounded-full font-bold text-xs tracking-widest uppercase">
              المشهد الأول : العمق المداري (Orbital Flight)
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-snug text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-md">
              التحليق المداري للمقاتلة <span className="text-[#00f3ff]">MIG-29</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              الكاميرا تسبح في الفضاء السحيق... تظهر المقاتلة الحربية بقيادة الكابتن{" "}
              <span className="text-amber-400 font-extrabold">"محمد الكمالي"</span> تخترق غازات السديم الكوني بعادم نيوني ساحر متوهج.
            </p>

            {/* Warning Alarm overlay */}
            {hudWarning && (
              <div className="mt-6 flex flex-col items-center gap-2 p-5 bg-red-950/70 border-2 border-red-500 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse max-w-md">
                <div className="flex items-center gap-2 text-red-400 font-black text-sm tracking-wider">
                  <ShieldAlert size={18} className="text-red-500" />
                  <span>⚠️ إنذار تكتيكي أحمر (HUD WARNING)</span>
                </div>
                <div className="text-white text-base font-black uppercase mt-1 text-center font-sans tracking-wide">
                  "تهديد أرضي مكتشف في قطاع قاعدة المطار العسكري"
                </div>
                <div className="text-red-400 font-mono text-[9px] tracking-widest mt-1">
                  TARGET LOCK: MILITARY_AIRBASE_SECTOR
                </div>
              </div>
            )}
          </div>
        )}

        {scene === 2 && (
          <div className="text-center animate-fade-in flex flex-col items-center gap-4">
            <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full font-bold text-xs tracking-widest uppercase">
              المشهد الثاني : الهبوط الاختراقي (Atmospheric Reentry)
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 leading-snug drop-shadow-md">
              الهبوط الاختراقي السحيق
            </h1>
            <p className="text-slate-200 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              المقاتلة تنحدر بفيزياء حركية حادة، تخترق الغلاف الجوي للكوكب وسط تلهب ناري وصلي حراري. تتغير زوايا الكاميرا ديناميكياً لتفعيل المسح الحراري التكتيكي{" "}
              <span className="text-[#00f3ff] font-extrabold font-mono">(FLIR)</span>.
            </p>

            <div className="mt-4 flex flex-col items-center gap-1.5 bg-slate-950/80 px-6 py-3 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-widest">AIRCRAFT VECTOR SYSTEMS</span>
              <div className="flex gap-4 font-mono text-xs font-bold text-orange-400">
                <span>PITCH: -34.8°</span>
                <span>ROLL: +12.4°</span>
                <span>VELOCITY: MACH 4.8</span>
              </div>
              {hudLocked && (
                <span className="text-red-500 font-black text-xs animate-ping mt-1">
                  🔴 تم تحديد الهدف الأرضي بنجاح (BASE LOCKED)
                </span>
              )}
            </div>
          </div>
        )}

        {scene === 3 && (
          <div className="text-center animate-fade-in flex flex-col items-center gap-4">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-xs tracking-widest uppercase">
              المشهد الثالث : الالتحام الميداني (Tactical Deployment)
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#00f3ff] leading-snug">
              السيادة والالتحام الميداني
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              تهبط الطائرة في المدرج المتشقق وسط النيران. يفتح باب المقصورة ليخرج المحارب الخارق ببدلته النانوية الثقيلة ساحباً سلاحه الـ{" "}
              <span className="text-[#00f3ff] font-bold">HKA16</span> حاملاً ذخيرة البلازما المتوهجة...
            </p>

            <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
              <div className="flex justify-between text-xs font-bold font-mono px-1">
                <span className="text-[#00f3ff]">HKA16 WEAPON STATUS</span>
                <span className={weaponReady ? "text-emerald-400 animate-pulse" : "text-amber-500"}>
                  {weaponReady ? "PLASMA LOGS: CHARGED" : "CHARGING PLASMAS..."}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 rounded-full"
                  style={{ width: weaponReady ? "100%" : "60%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cinematic HUD Overlay Lines */}
      <div className="absolute inset-x-0 bottom-4 text-center z-10 pointer-events-none text-slate-500 text-[10px] font-mono tracking-[0.3em]">
        MILITARY ENCRYPTION INTERFACE // CHASSIS_MIG29_HUD_ACTIVE
      </div>
    </div>
  );
}
