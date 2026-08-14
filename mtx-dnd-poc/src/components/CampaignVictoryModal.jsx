import React from 'react';

const CampaignVictoryModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 font-mono animate-in zoom-in-95 duration-500 overflow-y-auto">
      <div className="bg-[#0b0f19] border-4 border-amber-500 rounded-2xl max-w-3xl w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col my-8">

        {/* Header */}
        <div className="p-8 text-center border-b-2 border-slate-800 bg-slate-900/50 rounded-t-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
          <span className="text-amber-500 font-black tracking-widest uppercase text-sm mb-2 block relative z-10">Tier {data.tier} Expedition Cleared</span>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest relative z-10 drop-shadow-lg">Campaign Victorious</h2>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          
          {/* Base Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
                <span className="text-yellow-400 text-3xl mb-1 drop-shadow-md">🪙</span>
                <span className="text-2xl font-black text-white">{data.gold}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Gold Recovered</span>
             </div>
             <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
                <span className="text-cyan-400 text-3xl mb-1 drop-shadow-md">✨</span>
                <span className="text-2xl font-black text-white">{data.xp}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Experience Gained</span>
             </div>
          </div>

          {/* Keys & Chests Breakdown */}
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-6 text-center shadow-inner">
             <h3 className="text-amber-400 font-black uppercase tracking-widest mb-2">Treasure Vault Breached</h3>
             <p className="text-slate-300 text-sm mb-4 leading-relaxed">
               You defeated the boss and claimed the <span className="text-white font-bold">2 Base Chests</span>. <br/>
               You consumed <span className="text-yellow-400 font-black">{data.keysUsed} Expedition Keys</span> to unlock additional vaults!
             </p>
             <div className="inline-block bg-slate-950 border border-slate-800 px-6 py-3 rounded-lg shadow-inner">
                <span className="text-emerald-400 font-black text-xl">{data.chestsOpened} Total Chests Opened</span>
             </div>
          </div>

          {/* Epic Loot Grid */}
          <div>
             <h4 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4 border-b-2 border-slate-800 pb-2">Artifacts & Gear Found</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                {data.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4 hover:border-amber-500 transition-colors shadow-md">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
                      {item.sprite ? (
                        <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <span className="text-[8px] text-slate-600 font-bold">IMG</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-amber-400 text-sm block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                        {item.type} {item.slotType ? `• ${item.slotType}` : ''}
                      </span>
                      <div className="flex gap-2 mt-1 text-[9px] font-bold">
                        {item.acBonus && <span className="text-cyan-400">+{item.acBonus} AC</span>}
                        {item.damageDice && <span className="text-orange-400">{item.damageDice} DMG</span>}
                        {item.healAmount && <span className="text-emerald-400">+{item.healAmount} HP</span>}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t-2 border-slate-800 rounded-b-xl">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase tracking-widest rounded-xl border-b-4 border-amber-800 transition-all shadow-lg active:translate-y-1 cursor-pointer"
          >
            Collect Spoils & Return ➔
          </button>
        </div>

      </div>
    </div>
  );
};

export default CampaignVictoryModal;