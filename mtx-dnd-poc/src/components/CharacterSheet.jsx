import React, { useState } from 'react';
import SpellbookModal from './SpellbookModal';

const getModifier = (score) => Math.floor((score - 10) / 2);
const calculateModifierString = (score) => {
  const mod = getModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const CharacterSheet = ({ character, equipItem, unequipItem, useConsumable }) => {
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const equipmentSlots = [
    { key: 'head', label: 'Head' },
    { key: 'neck', label: 'Neck' },
    { key: 'back', label: 'Back' },
    { key: 'chest', label: 'Chest' },
    { key: 'hands', label: 'Hands' },
    { key: 'belt', label: 'Belt' },
    { key: 'legs', label: 'Legs' },
    { key: 'feet', label: 'Feet' },
    { key: 'mainHand', label: 'Main Hand' },
    { key: 'offHand', label: 'Off Hand' },
    { key: 'ring1', label: 'Ring 1' },
    { key: 'ring2', label: 'Ring 2' },
  ];

  const xpPercentage = Math.min(100, Math.round((character.xp.current / character.xp.nextLevel) * 100));

  return (
    <div className="bg-slate-900 border-4 border-slate-700 rounded-2xl p-6 text-slate-100 font-mono shadow-2xl relative">
      
      {isBackpackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
          <div className="bg-slate-900 border-4 border-indigo-500 rounded-2xl p-6 max-w-2xl w-full shadow-[0_0_30px_rgba(99,102,241,0.3)] max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎒</span>
                <h3 className="text-2xl font-black text-indigo-400 uppercase tracking-widest">Backpack Inventory</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  🪙 {character.currency.gold} Gold
                </span>
                <button 
                  onClick={() => setIsBackpackOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 italic">Click equipment to auto-equip. Click consumables to drink potions instantly.</p>

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {character.inventory.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-600 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-xl">
                  Backpack is Empty
                </div>
              ) : (
                character.inventory.map((item) => {
                  const equippedItem = item.slotType ? character.equipment[item.slotType] : null;

                  return (
                    <div 
                      key={item.uid}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        if (item.slotType) {
                          equipItem(item, item.slotType);
                        } else if (item.type === 'Consumable') {
                          useConsumable(item);
                        }
                      }}
                      className={`p-3 rounded-xl border-2 transition-all relative flex flex-col justify-between cursor-pointer ${
                        item.slotType || item.type === 'Consumable'
                          ? 'bg-slate-950 border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20' 
                          : 'bg-slate-950/50 border-slate-800 opacity-80 cursor-default'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-emerald-400 text-sm">{item.name}</span>
                          <span className="text-xs font-bold text-yellow-500">{item.value}g</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          {item.type} {item.slotType ? `• Slot: ${item.slotType}` : ''}
                        </div>
                        
                        <div className="text-xs text-slate-300 font-bold">
                          {item.acBonus && <span className="text-indigo-300">+{item.acBonus} AC </span>}
                          {item.damageDice && <span className="text-red-400">1d{item.damageDice} Dmg </span>}
                          {item.healAmount && <span className="text-emerald-400">+{item.healAmount} HP Heal </span>}
                        </div>
                      </div>

                      {item.type === 'Consumable' && (
                        <div className="mt-2 text-right">
                          <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Click to Drink 🧪
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {isSpellbookOpen && (
        <SpellbookModal character={character} onClose={() => setIsSpellbookOpen(false)} />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-emerald-400 tracking-wider">{character.name}</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Level {character.level} {character.class}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border-2 border-slate-800 px-4 py-2 rounded-xl text-yellow-400 font-black flex items-center gap-2 shadow-inner">
            <span>🪙</span> {character.currency.gold} <span className="text-xs text-slate-500 font-normal">Gold</span>
          </div>

          <button
            onClick={() => setIsSpellbookOpen(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider rounded-xl border-b-4 border-cyan-800 transition-all flex items-center gap-2 shadow-lg text-xs"
          >
            <span>📖</span> Spellbook
          </button>
          
          <button
            onClick={() => setIsBackpackOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl border-b-4 border-indigo-800 transition-all flex items-center gap-2 shadow-lg text-xs"
          >
            <span>🎒</span> Backpack ({character.inventory.length})
          </button>
        </div>
      </div>

      <div className="mb-6 bg-slate-950 p-3 rounded-xl border-2 border-slate-800">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span className="text-slate-400 uppercase tracking-wider">Experience</span>
          <span className="text-emerald-400">{character.xp.current} / {character.xp.nextLevel} XP</span>
        </div>
        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
          <div className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_#10b981]" style={{ width: `${xpPercentage}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-950/40 border-2 border-red-600/60 p-4 rounded-xl text-center shadow-lg">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">Health</span>
              <span className="text-3xl font-black text-white">{character.health.current} / {character.health.max}</span>
            </div>
            
            <div className="bg-indigo-950/40 border-2 border-indigo-600/60 p-4 rounded-xl text-center shadow-lg">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Armor Class</span>
              <span className="text-3xl font-black text-white">{character.armorClass}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(character.stats).map(([statName, score]) => (
              <div key={statName} className="bg-slate-950 border-2 border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{statName}</span>
                <span className="text-xl font-black text-white block mb-0.5">{score}</span>
                <span className="text-xs font-bold text-emerald-400">{calculateModifierString(score)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border-2 border-slate-800 p-4 rounded-xl flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Equipped Gear</h3>
          
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {equipmentSlots.map((slot) => {
              const item = character.equipment[slot.key];

              return (
                <div 
                  key={slot.key}
                  onClick={() => {
                    if (item) unequipItem(slot.key);
                  }}
                  className={`p-2.5 rounded-lg border border-dashed flex flex-col justify-between transition-all ${
                    item 
                      ? 'bg-slate-900 border-slate-600 hover:border-red-500 hover:bg-red-950/10 cursor-pointer group' 
                      : 'bg-slate-950/50 border-slate-800 opacity-60 cursor-default'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{slot.label}</span>
                    {item && <span className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">Unequip ↩</span>}
                  </div>

                  {item ? (
                    <div>
                      <span className="font-bold text-emerald-400 text-xs block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {item.acBonus ? `+${item.acBonus} AC` : ''}
                        {item.damageDice ? `1d{item.damageDice} Dmg` : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterSheet;