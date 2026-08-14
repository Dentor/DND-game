import React from 'react';

const StashModal = ({ character, depositItem, withdrawItem, onClose }) => {
  const backpack = character.inventory || [];
  const stash = character.stash || [];

  const renderItemCard = (item, isStash, actionFn) => {
    const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
    
    return (
      <div key={item.uid} className="relative group bg-[#111827] border border-slate-800 rounded-xl p-3 flex justify-between items-center transition-colors hover:border-amber-500 shadow-md">
        <div className="flex items-center gap-3">
          {item.sprite ? (
            <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-slate-900 rounded border border-slate-800 shadow-inner">
              <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
            </div>
          ) : (
            <div className="w-10 h-10 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-[6px] text-slate-500 shadow-inner">IMG</div>
          )}
          <div>
            <div className="font-bold text-emerald-400 text-xs">{item.name}</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
              {item.type} {item.slotType ? `• ${item.slotType}` : ''}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => actionFn(item)} 
          className="bg-amber-900/50 hover:bg-amber-600 text-amber-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-amber-800 shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer z-10"
        >
          {isStash ? 'Take ➔' : 'Store ➔'}
        </button>

        {/* Hover Stats Tooltip (Anti-Clipping Fixed position) */}
        {isGear && (
          <div 
            className="fixed z-[999] hidden group-hover:flex flex-col w-48 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none"
            style={{ transform: 'translateY(calc(-100% - 10px))' }}
          >
            <span className="text-emerald-400 font-black text-xs mb-1">{item.name}</span>
            <span className="text-slate-300 text-[10px] uppercase tracking-wider">{item.type} • {item.slotType}</span>
            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
              {item.acBonus && <span className="text-cyan-300 font-bold text-[10px]">+{item.acBonus} AC</span>}
              {item.damageDice && <span className="text-orange-400 font-bold text-[10px]">{item.damageDice} DMG</span>}
              {item.healAmount && <span className="text-emerald-400 font-bold text-[10px]">+{item.healAmount} HP</span>}
            </div>
            <span className="text-slate-400 italic text-[9px] mt-2 block">Value: {item.value || 0}g</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in">
      <div className="bg-[#0b0f19] border-4 border-amber-600 rounded-2xl p-6 max-w-5xl w-full shadow-2xl flex flex-col h-[85vh]">
        
        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-800 pb-4 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-3">🧰 Personal Stash</h3>
            <p className="text-xs text-slate-400 italic mt-1">Safely store excess gear. Other players cannot access this chest.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md border border-slate-600">✕</button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          
          {/* LEFT: BACKPACK */}
          <div className="flex-1 flex flex-col bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="font-black text-purple-400 uppercase tracking-widest text-xs">🎒 Your Backpack</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold">{backpack.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {backpack.length === 0 ? (
                <div className="text-center text-slate-600 italic py-12">Backpack is empty.</div>
              ) : (
                backpack.map(item => renderItemCard(item, false, depositItem))
              )}
            </div>
          </div>

          {/* RIGHT: STASH CHEST */}
          <div className="flex-1 flex flex-col bg-slate-950 border-2 border-amber-900/50 rounded-xl overflow-hidden shadow-inner relative">
            <div className="absolute inset-0 bg-amber-900/5 pointer-events-none" />
            <div className="bg-slate-900 p-3 border-b border-amber-900/50 flex justify-between items-center shrink-0 relative z-10">
              <span className="font-black text-amber-400 uppercase tracking-widest text-xs">📦 Stash Chest</span>
              <span className="text-[10px] bg-amber-900/30 border border-amber-800 text-amber-300 px-2 py-1 rounded font-bold">{stash.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative z-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-amber-700">
              {stash.length === 0 ? (
                <div className="text-center text-amber-700/50 italic py-12">Stash is completely empty.</div>
              ) : (
                stash.map(item => renderItemCard(item, true, withdrawItem))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StashModal;