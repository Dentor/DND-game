import React, { useState } from 'react';
import spellsCatalog from '../data/mockSpells.json';

const getModifier = (score) => Math.floor((score - 10) / 2);

const LevelUpModal = ({ character, onConfirm }) => {
  // Amount of stat points granted per level up
  const STAT_POINTS_PER_LEVEL = 2; 

  const [increases, setIncreases] = useState({
    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
  });
  
  const [pointsLeft, setPointsLeft] = useState(STAT_POINTS_PER_LEVEL);
  const [chosenSpellId, setChosenSpellId] = useState(null);

  const statsList = [
    { key: 'strength', short: 'STR' },
    { key: 'dexterity', short: 'DEX' },
    { key: 'constitution', short: 'CON' },
    { key: 'intelligence', short: 'INT' },
    { key: 'wisdom', short: 'WIS' },
    { key: 'charisma', short: 'CHA' }
  ];

  // Filter out spells the character already knows
  // (Optional: You can also filter by Tier here based on character.level)
  const availableSpells = spellsCatalog.filter(s => !character.learnedSpells.includes(s.id));

  const adjustStat = (statKey, amount) => {
    const currentBase = (character.baseStats || character.stats)[statKey];
    const currentTotal = currentBase + increases[statKey];

    if (amount > 0 && pointsLeft > 0 && currentTotal < 20) {
      setIncreases(prev => ({ ...prev, [statKey]: prev[statKey] + 1 }));
      setPointsLeft(prev => prev - 1);
    } else if (amount < 0 && increases[statKey] > 0) {
      setIncreases(prev => ({ ...prev, [statKey]: prev[statKey] - 1 }));
      setPointsLeft(prev => prev + 1);
    }
  };

  // Determine if the player can submit the level up
  // Edge case: If they learned every spell in the game, allow them to proceed without picking one.
  const hasSpellsToLearn = availableSpells.length > 0;
  const canSubmit = pointsLeft === 0 && (!hasSpellsToLearn || chosenSpellId !== null);

  let buttonText = "Confirm Level Up";
  if (pointsLeft > 0) buttonText = `Spend ${pointsLeft} More Points`;
  else if (!chosenSpellId && hasSpellsToLearn) buttonText = "Select a New Ability";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 font-mono overflow-y-auto">
      <div className="bg-[#0b0f19] border-4 border-emerald-500 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] my-8 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6">
          <h2 className="text-3xl md:text-4xl font-black text-emerald-400 tracking-widest uppercase mb-2">Level Up!</h2>
          <p className="text-slate-300 font-bold tracking-wider">You have reached Level {character.level + 1}</p>
        </div>

        {/* Attribute Points Tracker */}
        <div className="bg-[#05050a] border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
          <span className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Attribute Points Available</span>
          <span className={`text-3xl font-black ${pointsLeft > 0 ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>
            {pointsLeft}
          </span>
        </div>

        {/* Stat Allocation Rows */}
        <div className="space-y-2">
          {statsList.map(stat => {
            const currentBase = (character.baseStats || character.stats)[stat.key];
            const activeScore = currentBase + increases[stat.key];
            const activeMod = getModifier(activeScore);
            
            return (
              <div key={stat.key} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl transition-colors hover:border-slate-700">
                <span className="text-sm uppercase font-black text-slate-400 w-12">{stat.short}</span>
                
                <div className="flex-1 flex justify-center items-center gap-3">
                  <span className="text-lg font-black text-white w-6 text-center">{activeScore}</span>
                  <span className={`text-xs font-bold w-8 text-center ${activeMod >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ({activeMod >= 0 ? `+${activeMod}` : activeMod})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => adjustStat(stat.key, -1)} 
                    disabled={increases[stat.key] <= 0}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => adjustStat(stat.key, 1)} 
                    disabled={pointsLeft === 0 || activeScore >= 20}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-emerald-800 text-white rounded font-bold disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spell Selection Grid */}
        <div>
          <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 border-b-2 border-slate-800 pb-2">
            Learn New Spell / Skill
          </h3>
          
          {!hasSpellsToLearn ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 italic font-bold">
              You have already mastered all available abilities!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {availableSpells.map(spell => {
                const isSelected = chosenSpellId === spell.id;
                return (
                  <div 
                    key={spell.id} 
                    onClick={() => setChosenSpellId(spell.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-3 flex flex-col transition-all overflow-hidden ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                        : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                    }`}
                  >
                    {/* Card Header & Checkbox */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center text-xs mt-0.5 transition-colors ${
                        isSelected ? 'bg-cyan-500 border-cyan-500 text-slate-900' : 'bg-slate-900 border-slate-600'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div>
                        <div className={`font-black text-sm uppercase tracking-wide ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {spell.name}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {spell.element} {spell.type} • Tier {spell.tier || 1}
                        </div>
                      </div>
                    </div>

                    {/* Spell Details */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] bg-slate-900/50 p-2 rounded-lg mt-1 shadow-inner">
                      <div className="text-slate-400"><span className="text-slate-600 font-bold">Range:</span> {spell.range}</div>
                      <div className="text-slate-400"><span className="text-slate-600 font-bold">Uses:</span> {spell.baseUses}/rest</div>
                      {spell.damageDice && <div className="text-orange-400 font-bold col-span-2">Damage: {spell.damageDice}</div>}
                      {spell.healAmount && <div className="text-emerald-400 font-bold col-span-2">Heals: {spell.healAmount} HP</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Validation & Submit */}
        <button 
          onClick={() => onConfirm(increases, chosenSpellId)} 
          disabled={!canSubmit}
          className={`w-full py-5 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg text-sm mt-2 ${
            canSubmit 
              ? 'bg-emerald-600 border-emerald-800 text-white hover:bg-emerald-500 hover:-translate-y-1 cursor-pointer' 
              : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'
          }`}
        >
          {buttonText}
        </button>

      </div>
    </div>
  );
};

export default LevelUpModal;