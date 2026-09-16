import React from 'react';

const PurchaseConfirmModal = ({ item, currentGold, onConfirm, onCancel }) => {
  const goldAfter = currentGold - item.price;
  const canAfford = goldAfter >= 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col relative overflow-hidden">
        
        {/* Shiny Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-md">Confirm Purchase</h2>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">Acquire New Furniture</p>
        </div>

        <div className="flex items-center gap-6 bg-slate-950 p-6 rounded-2xl border-2 border-slate-800 shadow-inner relative z-10 mb-8">
          <div className="w-24 h-24 bg-slate-900 border-2 border-amber-600/50 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
            {item.sprite ? (
              <img src={item.sprite} alt={item.name} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-xl scale-125" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <span className="text-slate-600 text-xs">IMG</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-amber-400 uppercase tracking-wider leading-tight">{item.name}</h3>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mt-1">{item.type}</span>
            <div className="mt-3 bg-slate-900 border border-slate-700 rounded-lg p-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">Current Gold:</span>
                <span className="text-yellow-400 font-bold">{currentGold}g</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">Cost:</span>
                <span className="text-red-400 font-bold">-{item.price}g</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-700 pt-1 mt-1">
                <span className="text-slate-300 font-bold">Gold After:</span>
                <span className={`font-black ${canAfford ? 'text-emerald-400' : 'text-red-500'}`}>{goldAfter}g</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 relative z-10">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:translate-y-1"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={!canAfford}
            className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:translate-y-1"
          >
            {canAfford ? 'Approve & Buy' : 'Not Enough Gold'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmModal;