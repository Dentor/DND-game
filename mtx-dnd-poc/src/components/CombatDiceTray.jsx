import React, { useEffect, useState } from 'react';
import Dice3D from './Dice3D';

const CombatDiceTray = ({ rollData, onComplete }) => {
  const [phase, setPhase] = useState('init');

  // Sequence Timing Logic[cite: 13]
  useEffect(() => {
    let timers = [];
    
    if (phase === 'init') {
      if (rollData.d20) timers.push(setTimeout(() => setPhase('roll_d20'), 100));
      else if (rollData.damage) timers.push(setTimeout(() => setPhase('roll_dmg'), 100));
      else setPhase('summary');
    }
    else if (phase === 'roll_d20') timers.push(setTimeout(() => setPhase('show_d20'), 800));
    else if (phase === 'show_d20') {
      timers.push(setTimeout(() => {
        // If it's a hit AND there is damage to roll (Combat)[cite: 13]
        if (rollData.isHit !== false && rollData.damage) setPhase('roll_dmg');
        // If it's a miss, or a successful skill check with no damage[cite: 13]
        else setPhase('summary'); 
      }, 1200));
    }
    else if (phase === 'roll_dmg') timers.push(setTimeout(() => setPhase('show_dmg'), 800));
    else if (phase === 'show_dmg') timers.push(setTimeout(() => setPhase('summary'), 1200));

    return () => timers.forEach(clearTimeout);
  }, [phase, rollData]);

  if (!rollData) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
      
      {/* Dynamic Background Glassmorphism */}
      <div className={`bg-slate-900/95 backdrop-blur-md border-4 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-500 min-w-[320px] ${
        phase === 'summary' 
          ? (rollData.isHit !== false ? 'border-emerald-500' : 'border-red-600') 
          : 'border-indigo-500'
      }`}>
        
        {/* State 1: Rolling D20 */}
        {(phase === 'roll_d20' || phase === 'show_d20') && rollData.d20 && (
          <div className="flex flex-col items-center justify-center w-full animate-in zoom-in duration-300">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">{rollData.title}</span>
            <Dice3D face={rollData.d20.face} isRolling={phase === 'roll_d20'} finalValue={rollData.d20.result} />
            <div className={`mt-6 text-center transition-opacity duration-300 ${phase === 'roll_d20' ? 'opacity-0' : 'opacity-100'}`}>
              <span className={`text-2xl font-black uppercase tracking-widest ${rollData.isHit ? 'text-emerald-400' : 'text-red-500'}`}>
                {rollData.isHit ? 'Hit!' : 'Miss!'}
              </span>
            </div>
          </div>
        )}

        {/* State 2: Rolling Damage */}
        {(phase === 'roll_dmg' || phase === 'show_dmg') && rollData.damage && (
          <div className="flex flex-col items-center justify-center w-full animate-in zoom-in duration-300">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Rolling {rollData.damage.label || 'Damage'}...</span>
            <Dice3D face={rollData.damage.face} isRolling={phase === 'roll_dmg'} finalValue={rollData.damage.result} />
          </div>
        )}

        {/* State 3: The Fight Summary */}
        {phase === 'summary' && (
          <>
            <div className="flex flex-col justify-center border-b-2 sm:border-b-0 sm:border-r-2 border-slate-700 pb-4 sm:pb-0 sm:pr-6 sm:mr-2 text-center sm:text-left w-full sm:w-auto">
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Action Summary</span>
              <span className="text-white font-bold text-lg whitespace-nowrap">{rollData.title}</span>
              {rollData.d20 && (
                <span className={`text-2xl font-black mt-1 uppercase tracking-widest ${rollData.isHit ? 'text-emerald-400' : 'text-red-500'}`}>
                  {rollData.isHit ? 'SUCCESS' : 'FAILED'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 justify-center w-full sm:w-auto">
              {/* D20 Breakdown */}
              {rollData.d20 && (
                <div className="flex flex-col items-center">
                  <div className="scale-75 origin-bottom">
                     <Dice3D face={rollData.d20.face} isRolling={false} finalValue={rollData.d20.result} />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center mt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total (DC {rollData.d20.targetDC})</span>
                    <span className="text-white font-black text-2xl bg-slate-950 px-3 py-1 rounded-lg border border-slate-700">
                      {rollData.d20.result + rollData.d20.mod}
                    </span>
                  </div>
                </div>
              )}

              {/* Plus symbol if both exist */}
              {rollData.d20 && rollData.damage && rollData.isHit !== false && (
                <div className="h-full flex items-center pt-8">
                  <span className="text-3xl text-slate-700 font-black">➔</span>
                </div>
              )}

              {/* Damage Breakdown */}
              {rollData.damage && rollData.isHit !== false && (
                <div className="flex flex-col items-center">
                  <div className="scale-75 origin-bottom">
                     <Dice3D face={rollData.damage.face} isRolling={false} finalValue={rollData.damage.result} />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center mt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total {rollData.damage.label}</span>
                    <span className={`font-black text-2xl bg-slate-950 px-3 py-1 rounded-lg border border-slate-700 ${rollData.type === 'heal' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {rollData.damage.result + rollData.damage.mod}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Reveal the Continue Button ONLY in the Summary Phase */}
      {phase === 'summary' && (
        <button 
          onClick={onComplete}
          className="mt-4 px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest rounded-full border-2 border-slate-600 shadow-xl transition-all active:translate-y-1 animate-in slide-in-from-top-4 fade-in cursor-pointer"
        >
          Continue
        </button>
      )}
    </div>
  );
};

export default CombatDiceTray;