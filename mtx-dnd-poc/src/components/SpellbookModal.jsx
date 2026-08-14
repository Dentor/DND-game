import React from 'react';
import spellsCatalog from '../data/mockSpells.json';

const SpellbookModal = ({ character, onClose }) => {
  const learnedList = character.learnedSpells || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border-4 border-cyan-500 rounded-2xl p-6 max-w-2xl w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] max-h-[85vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-widest">Spellbook & Abilities</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 italic">
          Spells scale with <span className="text-indigo-400 font-bold">Intelligence (INT)</span>. Physical skills scale with <span className="text-emerald-400 font-bold">Strength (STR)</span>. Charges reset on Long Rest.
        </p>

        {/* Spells Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {learnedList.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-600 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-xl">
              No Spells Learned Yet
            </div>
          ) : (
            learnedList.map((spellId) => {
              const spell = spellsCatalog.find(s => s.id === spellId);
              if (!spell) return null;
              const charges = character.spellCharges?.[spellId] ?? spell.baseUses;

              return (
                <div key={spell.id} className="bg-slate-950 border-2 border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-cyan-300 text-sm">{spell.name}</span>
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-cyan-400 uppercase border border-slate-800 font-bold">
                        {spell.element} {spell.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                      Tier {spell.tier} • Range: {spell.range} • Radius: {spell.radius}x{spell.radius}
                    </div>

                    <div className="text-xs text-slate-300 font-bold mb-3">
                      {spell.category === 'damage' && (
                        <span className="text-red-400">1d{spell.damageDice} + {spell.scalingStat === 'intelligence' ? 'INT' : 'STR'} Dmg</span>
                      )}
                      {spell.category === 'heal' && (
                        <span className="text-emerald-400">+{spell.healAmount} HP Heal</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs">
                    <span className="text-slate-400">Charges Left:</span>
                    <span className={`font-black ${charges > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                      {charges} / {spell.baseUses + Math.floor(character.stats.wisdom/4) + Math.floor(character.stats.dexterity/4)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default SpellbookModal;