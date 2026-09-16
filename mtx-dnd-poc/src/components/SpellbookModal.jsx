import React from 'react';
import spellsCatalog from '../data/mockSpells.json';
import SpellCard from './SpellCard';

const SpellbookModal = ({ character, onClose, onSelectSpell }) => {
  const learnedList = character.learnedSpells || [];
  const isInteractive = !!onSelectSpell;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border-4 border-cyan-500 rounded-2xl p-6 max-w-3xl w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] max-h-[85vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <h3 className="text-xl md:text-2xl font-black text-cyan-400 uppercase tracking-widest">
              {isInteractive ? 'Select Spell to Cast' : 'Spellbook & Abilities'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 italic text-center border border-slate-800 bg-slate-950 p-2 rounded-lg">
          Hover over any spell to view its lore and detailed mechanical scaling. Spells scale with <span className="text-indigo-400 font-bold">Intelligence (INT)</span> or <span className="text-amber-400 font-bold">Wisdom (WIS)</span>. Physical skills scale with <span className="text-emerald-400 font-bold">Strength (STR)</span> or <span className="text-orange-400 font-bold">Dexterity (DEX)</span>.
        </p>

        {/* Spells Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
          {learnedList.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center text-slate-600 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-xl">
              No Spells Learned Yet
            </div>
          ) : (
            learnedList.map((spellId) => {
              const spell = spellsCatalog.find(s => s.id === spellId);
              if (!spell) return null;
              
              const charges = character.spellCharges?.[spellId] ?? spell.baseUses;
              const isDisabled = isInteractive && charges <= 0;

              return (
                <SpellCard 
                  key={spell.id}
                  spell={spell}
                  charges={charges}
                  isInteractive={isInteractive}
                  isDisabled={isDisabled}
                  onSelect={onSelectSpell}
                  characterStats={character.stats}
                />
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default SpellbookModal;