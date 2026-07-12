sed -i '/{gameState === '"'"'gameover'"'"' && (/,/)}/c\
          {/* ----------------- GAME OVER / RETRY VIEW ----------------- */}\
          {gameState === '"'"'gameover'"'"' && (\
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center z-10 pointer-events-auto p-4">\
              <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl text-center">\
                 <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">\
                    <RotateCcw size={32} />\
                 </div>\
                 <h1 className="text-3xl font-black text-red-500 mb-2 tracking-tighter uppercase">\
                   تم تدميرك\
                 </h1>\
                 <p className="text-slate-400 mb-8 font-medium">MISSION FAILED</p>\
                 <div className="flex gap-4 w-full">\
                   <button \
                     onClick={() => useGameStore.getState().startGame()}\
                     className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"\
                   >\
                     RETRY\
                   </button>\
                   <button \
                     onClick={() => useGameStore.getState().leaveGame()}\
                     className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95"\
                   >\
                     ABORT\
                   </button>\
                 </div>\
              </div>\
            </div>\
          )}\
\
          {/* ----------------- VICTORY VIEW ----------------- */}\
          {gameState === '"'"'victory'"'"' && (\
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center z-10 pointer-events-auto p-4">\
              <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl text-center">\
                 <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-pulse">\
                    <Trophy size={32} />\
                 </div>\
                 <h1 className="text-4xl font-black text-amber-500 mb-2 tracking-tighter dir-rtl">\
                   نجاح المهمة\
                 </h1>\
                 <p className="text-slate-400 mb-4 font-medium">MISSION ACCOMPLISHED</p>\
                 <div className="bg-slate-800/50 w-full p-4 rounded-xl mb-8 flex flex-col gap-2">\
                    <div className="flex justify-between items-center text-sm font-bold text-slate-300">\
                      <span>النقاط</span>\
                      <span className="text-emerald-400">{score.toLocaleString()}</span>\
                    </div>\
                    <div className="flex justify-between items-center text-sm font-bold text-slate-300">\
                      <span>الجواهر المكتسبة</span>\
                      <span className="text-[#00f3ff]">+2</span>\
                    </div>\
                 </div>\
                 <button \
                   onClick={() => useGameStore.getState().leaveGame()}\
                   className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(217,119,6,0.4)]"\
                 >\
                   عودة إلى القاعدة (RETURN TO BASE)\
                 </button>\
              </div>\
            </div>\
          )}' src/App.tsx
