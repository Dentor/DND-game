import React from 'react';

const BackpackModal = ({ character, equipItem, useConsumable, onClose }) => {
  const inventory = character.inventory || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono animate-in fade-in">
      <div className="bg-slate-900 border-4 border-purple-500 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-800 pb-4 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest">Backpack Inventory</h3>
            <p className="text-xs text-slate-400 italic mt-1">Manage your gear, stack consumables, and equip enhancements.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md border border-slate-600 flex items-center justify-center">✕</button>
        </div>
        
        {/* Grid Container matching the 140px card standard */}
        <div className="flex-1 overflow-y-auto p-2 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-purple-700">
          {inventory.length === 0 ? (
            <div className="text-center text-slate-500 italic py-20 border-2 border-dashed border-slate-800 rounded-2xl text-sm uppercase tracking-widest">
              Your backpack is completely empty...
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-start">
              {inventory.map((item, index) => {
                const itemSlot = item.slotType || item.slot;
                const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
                const isRing = itemSlot?.toLowerCase().includes('ring');
                
                const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
                const eq2 = isRing ? character.equipment.ring2 : null;

                return (
                  <div 
                    key={item.uid || `inv-${item.id}-${index}`} 
                    className="w-[140px] h-[140px] relative group p-3 bg-slate-950 border-2 border-slate-800 rounded-2xl flex flex-col items-center justify-between hover:border-purple-500 transition-all shadow-lg"
                  >
                    
                    {/* Stacking Quantity Badge */}
                    {item.quantity > 1 && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow-md border-2 border-slate-900 z-20 pointer-events-none">
                        x{item.quantity}
                      </div>
                    )}

                    {/* Sprite Display */}
                    <div className="flex-1 flex items-center justify-center w-full relative">
                      {item.sprite ? (
                        <img src={item.sprite} alt={item.name} className="max-w-[70%] max-h-[70%] object-contain drop-shadow-md scale-150" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <div className="w-10 h-10 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-[8px] text-slate-500">IMG</div>
                      )}
                    </div>

                    {/* Bottom Info & Action Button on Hover */}
                    <div className="w-full text-center mt-2 border-t border-slate-800/80 pt-2 h-12 flex flex-col justify-end">
                      <span className="font-bold text-emerald-400 text-[10px] block truncate leading-none mb-1">{item.name}</span>
                      
                      <div className="hidden group-hover:flex w-full mt-1">
                        {itemSlot ? (
                          isRing ? (
                            <div className="flex gap-1 w-full">
                              <button onClick={() => equipItem(item, 'ring1')} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-1 rounded text-[9px] font-bold cursor-pointer">R1</button>
                              <button onClick={() => equipItem(item, 'ring2')} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-1 rounded text-[9px] font-bold cursor-pointer">R2</button>
                            </div>
                          ) : (
                            <button onClick={() => equipItem(item, itemSlot)} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white py-1 rounded text-[9px] font-bold uppercase tracking-widest cursor-pointer shadow-md">Equip</button>
                          )
                        ) : item.type === 'Consumable' ? (
                          <button onClick={() => useConsumable(item)} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-1 rounded text-[9px] font-bold uppercase tracking-widest cursor-pointer shadow-md">Use</button>
                        ) : (
                          <span className="w-full text-slate-600 text-[9px] uppercase font-bold tracking-widest block text-center">Material</span>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest group-hover:hidden">{item.type}</span>
                    </div>

                    {/* Equipment Comparison Tooltip */}
                    {isGear && itemSlot && (
                      <div className="fixed z-[999] hidden group-hover:flex flex-col w-52 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none" style={{ transform: 'translateY(calc(-100% - 15px))' }}>
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Currently Equipped</span>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Equipped Slot</span>
                          {eq1 ? (
                            <div className="flex items-center gap-2">
                              {eq1.sprite ? <div className="w-6 h-6 flex items-center justify-center bg-slate-900 rounded border border-slate-700 shrink-0"><img src={eq1.sprite} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /></div> : <div className="w-6 h-6 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                              <div>
                                <span className="text-cyan-300 font-bold text-[9px] block leading-tight">{eq1.name}</span>
                                <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                  {eq1.acBonus && <span className="text-blue-300">+{eq1.acBonus} AC</span>}
                                  {eq1.damageDice && <span className="text-red-400">{eq1.damageDice} DMG</span>}
                                </div>
                              </div>
                            </div>
                          ) : <div className="text-slate-600 italic text-[9px] py-1 font-bold">Empty Slot</div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackpackModal;