import React, { useState } from 'react';
import spellsCatalog from '../data/mockSpells.json';
import itemsCatalog from '../data/mockItems.json';

const BASE_STAT = 8;
const STARTING_POINTS = 25;

const CharacterCreator = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [stats, setStats] = useState({ strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 });
  const [pointsLeft, setPointsLeft] = useState(STARTING_POINTS);
  
  // Initialize as null to force the player to make an explicit choice
  const [chosenSpellId, setChosenSpellId] = useState(null);

  const tier1Spells = spellsCatalog.filter(s => s.tier === 1);

  const adjustStat = (stat, amount) => {
    const newVal = stats[stat] + amount;
    if (newVal >= 8 && newVal <= 18 && (pointsLeft - amount >= 0)) {
      setStats({ ...stats, [stat]: newVal });
      setPointsLeft(pointsLeft - amount);
    }
  };

  // Determine if the player has met all creation requirements
  const canStart = name.trim().length > 0 && pointsLeft === 0 && chosenSpellId !== null;

  // Dynamic button text to guide the player
  let buttonText = "Start Journey ➔";
  if (!name.trim()) buttonText = "Enter Character Name";
  else if (pointsLeft > 0) buttonText = `Spend ${pointsLeft} More Points`;
  else if (!chosenSpellId) buttonText = "Select a Starting Ability";

  const handleCreate = () => {
    if (!canStart) return;
    
    // Helper to pull items from the mockItems database and assign a unique ID
    const getStartingItem = (id) => {
      const item = itemsCatalog.find(i => i.id === id);
      return item ? { ...item, uid: crypto.randomUUID() } : null;
    };

    // Pull starting gear directly from the database, with hardcoded fallbacks just in case
    const startingGear = {
      chest: getStartingItem('gear_chest_rags') || { name: "Worn Tunic", type: "Armor", slotType: "chest", acBonus: 1, value: 10 },
      legs: getStartingItem('gear_legs_cloth') || { name: "Cloth Trousers", type: "Armor", slotType: "legs", acBonus: 1, value: 10 },
      feet: getStartingItem('gear_feet_shoes') || { name: "Walking Shoes", type: "Armor", slotType: "feet", acBonus: 1, value: 10 },
      mainHand: getStartingItem('gear_sword_short') || { name: "Iron Shortsword", type: "Weapon", slotType: "mainHand", range: 1, damageDice: 6, value: 20 }
    };

    const newChar = {
      name: name.trim(), 
      bio: bio.trim(),
      class: "Adventurer",
      level: 1,
      baseArmorClass: 10,
      armorClass: 10 + getModifier(stats.dexterity),
      xp: { current: 0, nextLevel: 300 },
      health: { current: 10 + getModifier(stats.constitution), max: 10 + getModifier(stats.constitution) },
      stats,
      currency: { gold: 0 },
      learnedSpells: [chosenSpellId],
      spellCharges: { [chosenSpellId]: spellsCatalog.find(s => s.id === chosenSpellId).baseUses },
      equipment: startingGear,
      inventory: []
    };
    onComplete(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono overflow-y-auto">
      <div className="bg-slate-900 border-4 border-emerald-500 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl my-8">
        <h2 className="text-3xl font-black text-emerald-400 mb-6 uppercase tracking-widest text-center">Character Creation</h2>
        
        {/* Basic Info */}
        <div className="mb-6 space-y-3">
          <input 
            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors" 
            placeholder="Character Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            maxLength={20}
          />
          <textarea 
            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none h-20" 
            placeholder="Character Bio (Optional)" 
            value={bio} 
            onChange={e => setBio(e.target.value)} 
            maxLength={150}
          />
        </div>

        {/* Stat Allocation */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3 border-b-2 border-slate-800 pb-2">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Attributes</h3>
            <span className={`text-xs font-black px-2 py-1 rounded ${pointsLeft > 0 ? 'bg-amber-900/50 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
              Points Left: {pointsLeft}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(stats).map(stat => (
              <div key={stat} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs uppercase font-bold text-slate-400">{stat}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => adjustStat(stat, -1)} 
                    disabled={stats[stat] <= 8}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-red-900 text-white rounded font-bold disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-black w-6 text-center text-white">{stats[stat]}</span>
                  <button 
                    onClick={() => adjustStat(stat, 1)} 
                    disabled={pointsLeft === 0 || stats[stat] >= 18}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-emerald-700 text-white rounded font-bold disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spell Selection */}
        <div className="mb-8">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-3 border-b-2 border-slate-800 pb-2">
            Starting Ability
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            {tier1Spells.map(spell => {
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
                        {spell.element} {spell.type}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] bg-slate-900/50 p-2 rounded-lg mt-1">
                    <div className="text-slate-400"><span className="text-slate-600 font-bold">Range:</span> {spell.range}</div>
                    <div className="text-slate-400"><span className="text-slate-600 font-bold">Uses:</span> {spell.baseUses}/rest</div>
                    {spell.damageDice && <div className="text-orange-400 font-bold col-span-2">Damage: {spell.damageDice}</div>}
                    {spell.healAmount && <div className="text-emerald-400 font-bold col-span-2">Heals: {spell.healAmount} HP</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation & Submit */}
        <button 
          onClick={handleCreate} 
          disabled={!canStart}
          className={`w-full py-4 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg text-sm ${
            canStart 
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

// Helper for AC calc
const getModifier = (score) => Math.floor((score - 10) / 2);

export default CharacterCreator;