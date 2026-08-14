import React, { useState } from 'react';

const CampaignForkModal = ({ stage, location, choices = ['Monster', 'Merchant'], character, equipItem, unequipItem, useConsumable, onSelect }) => {
  const [isManagingGear, setIsManagingGear] = useState(false);

  const getChoiceDetails = (type) => {
    switch(type) {
      case 'Monster': return { icon: '⚔️', title: 'Monster Threat', desc: 'Engage in tactical combat for XP & loot.' };
      case 'Merchant': return { icon: '🪙', title: 'Traveling Merchant', desc: 'Buy gear and sell unwanted items.' };
      case 'Camp': return { icon: '🏕️', title: 'Safe Rest Camp', desc: 'Recover HP and refresh spell charges.' };
      case 'Trap': return { icon: '⚠️', title: 'Hazard / Trap', desc: 'Test your agility or face the consequences.' };
      default: return { icon: '❓', title: type, desc: 'Unknown path.' };
    }
  };

  const validChoices = Array.isArray(choices) && choices.length > 0 ? choices : ['Monster', 'Merchant'];
  
  const equipmentSlots = [
    { key: 'head', label: 'Head' }, { key: 'neck', label: 'Neck' },
    { key: 'back', label: 'Back' }, { key: 'chest', label: 'Chest' },
    { key: 'hands', label: 'Hands' }, { key: 'belt', label: 'Belt' },
    { key: 'legs', label: 'Legs' }, { key: 'feet', label: 'Feet' },
    { key: 'mainHand', label: 'Main Hand' }, { key: 'offHand', label: 'Off Hand' },
    { key: 'ring1', label: 'Ring 1' }, { key: 'ring2', label: 'Ring 2' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-2xl p-6 max-w-3xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">Stage {stage} / 6 • {location}</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              {isManagingGear ? 'Manage Character & Gear' : 'Choose Your Path'}
            </h2>
          </div>

          <button
            onClick={() => setIsManagingGear(!isManagingGear)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl border-b-2 border-indigo-800 transition-all cursor-pointer flex items-center gap-2"
          >
            {isManagingGear ? '🗺️ Back to Paths' : '🎒 Manage Gear'}
          </button>
        </div>

        {isManagingGear ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Backpack Inventory */}
              <div className="bg-slate-950 border-2 border-slate-800 p-3 rounded-xl flex flex-col h-[400px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-900 pb-1">Backpack ({character.inventory.length})</span>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {character.inventory.length === 0 ? (
                    <span className="text-xs text-slate-600 italic py-4 text-center block">Inventory empty</span>
                  ) : (
                    character.inventory.map(item => (
                      <div 
                        key={item.uid}
                        className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-emerald-400 text-sm">{item.name}</span>
                            <span className="text-[10px] text-slate-500 block uppercase">{item.type} {item.slotType ? `• Slot: ${item.slotType}` : ''}</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (item.slotType) equipItem(item, item.slotType);
                              else if (item.type === 'Consumable') useConsumable(item);
                            }}
                            className="bg-indigo-950 text-indigo-300 px-3 py-1 rounded text-[10px] font-bold border border-indigo-800 hover:bg-indigo-900 cursor-pointer"
                          >
                            {item.slotType ? 'EQUIP' : 'USE'}
                          </button>
                        </div>

                        {/* Stat Display */}
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                          {item.acBonus && <span className="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">AC: +{item.acBonus}</span>}
                          {item.damageDice && <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">Dmg: 1d{item.damageDice}</span>}
                          {item.statBonus && Object.entries(item.statBonus).map(([stat, val]) => (
                            <span key={stat} className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 capitalize">
                              {stat}: +{val}
                            </span>
                          ))}
                          {item.healAmount && <span className="bg-green-950 text-green-300 px-1.5 py-0.5 rounded border border-green-800">Heal: {item.healAmount}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Equipped Gear Slots */}
              <div className="bg-slate-950 border-2 border-slate-800 p-3 rounded-xl flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-2 border-b border-slate-900 pb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipped Gear</span>
                  <span className="text-[10px] text-slate-500 italic">Click slot to unequip</span>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                  {equipmentSlots.map(slot => {
                    const item = character.equipment[slot.key];
                    return (
                      <div 
                        key={slot.key}
                        onClick={() => { if (item) unequipItem(slot.key); }}
                        className={`p-2 rounded border text-[10px] flex flex-col justify-between h-20 transition-all ${item ? 'bg-slate-900 border-indigo-700 hover:border-red-500 cursor-pointer group' : 'bg-slate-950/40 border-slate-900 opacity-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase">{slot.label}</span>
                          {item && <span className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">Unequip ↩</span>}
                        </div>
                        {item ? (
                          <div>
                            <span className="font-bold text-emerald-400 block truncate">{item.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {item.acBonus ? `+${item.acBonus} AC ` : ''}
                              {item.damageDice ? `1d${item.damageDice} Dmg` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mt-1 mb-4 text-center">The path ahead splits. Select your route:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {validChoices.map((choiceType) => {
                const info = getChoiceDetails(choiceType);
                return (
                  <button 
                    key={choiceType}
                    onClick={() => onSelect(choiceType)} 
                    className="p-4 bg-slate-950 border-2 border-slate-800 hover:border-indigo-500 hover:bg-slate-900 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <span className="text-xl block mb-1">{info.icon}</span>
                    <div className="font-black text-white text-sm group-hover:text-indigo-400">{info.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{info.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CampaignForkModal;