import React, { useState } from 'react';
import DiceRollModal from './DiceRollModal';

const getModifier = (score) => Math.floor((score - 10) / 2);

const EncounterCard = ({ character, encounter, onRoll, onFinish, lastRoll }) => {
  const [pendingRoll, setPendingRoll] = useState(null);

  if (!encounter) return null;

  const triggerRoll = (isGamble) => {
    // Calculate the math
    const statKey = (encounter.challengeStat || 'dexterity').toLowerCase();
    const score = character?.stats?.[statKey] || 10;
    const modifier = getModifier(score);
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const targetDC = isGamble ? (encounter.targetDC || 12) + 5 : (encounter.targetDC || 12);
    const isSuccess = (d20 + modifier) >= targetDC;

    // Trigger the 3D Dice Modal
    setPendingRoll({
      type: 'attack', // Uses the D20 sequence
      title: isGamble ? 'Risking it for Loot!' : `${encounter.challengeStat} Check`,
      d20: { face: 20, result: d20, mod: modifier, targetDC: targetDC },
      isHit: isSuccess, 
      // Notice we DO NOT pass a 'damage' object. This tells the modal it's a Skill Check, not Combat!
      onComplete: () => {
        setPendingRoll(null);
        // Pass the exactly rolled D20 up to the main state to apply the results
        onRoll(encounter, isGamble, d20);
      }
    });
  };

  return (
    <div className="bg-[#0b0f19] border-4 border-indigo-500 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative font-mono">
      
      {/* 3D Dice Modal Overlay */}
      {pendingRoll && <DiceRollModal rollData={pendingRoll} onComplete={pendingRoll.onComplete} />}

      {/* Clean Image Container */}
      <div className="w-full h-48 md:h-56 bg-[#05050a] rounded-xl border-2 border-slate-800 mb-6 overflow-hidden shadow-inner">
        <img 
          src={`/src/assets/traps/${encounter.id}.png`} 
          alt={encounter.title} 
          className="w-full h-full object-cover" 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-indigo-400 uppercase tracking-widest">{encounter.title}</h2>
        <p className="text-slate-300 text-sm mt-3 leading-relaxed">{encounter.description}</p>
      </div>

      {lastRoll ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className={`p-4 rounded-xl border-2 flex flex-col items-center text-center ${lastRoll.success ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-800'}`}>
            <span className={`text-2xl mb-1 ${lastRoll.success ? 'text-emerald-400' : 'text-red-500'}`}>
              {lastRoll.success ? '✅ SUCCESS' : '❌ FAILED'}
            </span>
            <span className="text-slate-300 text-xs font-bold tracking-widest uppercase mt-2">
              Rolled: {lastRoll.totalRoll} (DC {lastRoll.isGamble ? (encounter.targetDC || 12) + 5 : (encounter.targetDC || 12)})
            </span>
          </div>
          <button 
            onClick={() => onFinish(lastRoll.success, encounter)} 
            className={`w-full py-4 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:-translate-y-1 cursor-pointer ${lastRoll.success ? 'bg-emerald-500 border-b-4 border-emerald-700' : 'bg-red-500 border-b-4 border-red-700 text-white'}`}
          >
            Continue ➔
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Safe Bypass */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-slate-600 transition-colors">
            <div className="text-center sm:text-left">
              <span className="text-emerald-400 font-black uppercase tracking-widest block text-sm mb-1">Safe Bypass</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">DC {encounter.targetDC} {encounter.challengeStat}</span>
            </div>
            <button 
              onClick={() => triggerRoll(false)} 
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all active:translate-y-0.5 cursor-pointer whitespace-nowrap"
            >
              Roll d20 🎲
            </button>
          </div>

          {/* Risky Chest */}
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-amber-700 transition-colors">
            <div className="text-center sm:text-left">
              <span className="text-amber-400 font-black uppercase tracking-widest block text-sm mb-1 flex items-center justify-center sm:justify-start gap-2">
                Hidden Chest <span className="bg-amber-900 text-amber-200 text-[8px] px-1.5 py-0.5 rounded border border-amber-700">Risk</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">Take damage if you fail.</span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Hard DC {encounter.targetDC + 5} {encounter.challengeStat}</span>
            </div>
            <button 
              onClick={() => triggerRoll(true)} 
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all active:translate-y-0.5 cursor-pointer whitespace-nowrap"
            >
              Risk It 🎁
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncounterCard;