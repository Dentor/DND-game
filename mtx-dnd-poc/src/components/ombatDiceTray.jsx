import React, { useEffect, useState } from 'react';

const CombatDiceTray = ({ rollData, onComplete }) => {
  const [phase, setPhase] = useState('rolling'); // rolling -> result

  // Convert the single d20/damage objects into arrays to future-proof for Advantage / Multiple Dice rolls
  const primaryRolls = rollData.d20 ? [rollData.d20] : [];
  const secondaryRolls = rollData.damage ? [rollData.damage] : [];

  useEffect(() => {
    const timer = setTimeout(() => setPhase('result'), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
      
      <div className={`bg-slate-900/95 backdrop-blur-md border-4 rounded-2xl p-4 flex gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-colors duration-500 ${phase === 'result' ? (rollData.isHit !== false ? 'border-emerald-500' : 'border-red-600') : 'border-indigo-500'}`}>
        
        {/* Title */}
        <div className="flex flex-col justify-center border-r-2 border-slate-700 pr-6 mr-2">
          <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Action</span>
          <span className="text-white font-bold text-sm whitespace-nowrap">{rollData.title}</span>
          {phase === 'result' && rollData.d20 && (
            <span className={`text-xl font-black mt-1 uppercase tracking-widest ${rollData.isHit ? 'text-emerald-400' : 'text-red-500'}`}>
              {rollData.isHit ? 'SUCCESS' : 'FAILED'}
            </span>
          )}
        </div>

        {/* Primary Dice (d20s) */}
        {primaryRolls.length > 0 && (
          <div className="flex items-center gap-4">
            {primaryRolls.map((roll, idx) => (
              <div key={`d20-${idx}`} className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black shadow-inner transition-all ${phase === 'rolling' ? 'bg-indigo-900 border-indigo-400 animate-spin text-transparent' : 'bg-slate-950 border-slate-600 text-white'}`}>
                  {phase === 'result' ? roll.result : '?'}
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">D{roll.face}</span>
              </div>
            ))}
            {phase === 'result' && primaryRolls[0] && (
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total (DC {primaryRolls[0].targetDC})</span>
                <span className="text-white font-black text-2xl bg-slate-950 px-3 py-1 rounded-lg border border-slate-700">
                  {primaryRolls[0].result + primaryRolls[0].mod}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Secondary Dice (Damage/Heals) */}
        {secondaryRolls.length > 0 && phase === 'result' && rollData.isHit !== false && (
          <div className="flex items-center gap-4 pl-6 ml-2 border-l-2 border-slate-700 animate-in fade-in zoom-in duration-300">
            {secondaryRolls.map((roll, idx) => (
              <div key={`dmg-${idx}`} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl border-2 bg-slate-950 border-slate-600 flex items-center justify-center text-lg font-black text-white shadow-inner">
                  {roll.result}
                </div>
                <span className="text-[9px] text-slate-500 font-bold uppercase mt-1">D{roll.face}</span>
              </div>
            ))}
            {secondaryRolls[0] && (
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total {secondaryRolls[0].label}</span>
                <span className={`font-black text-2xl ${secondaryRolls[0].label === 'Heal' ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {secondaryRolls[0].result + secondaryRolls[0].mod}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
      
      {phase === 'result' && (
        <button 
          onClick={onComplete}
          className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest rounded-full border-2 border-slate-600 shadow-xl transition-all active:translate-y-1"
        >
          Continue
        </button>
      )}
    </div>
  );
};

export default CombatDiceTray;