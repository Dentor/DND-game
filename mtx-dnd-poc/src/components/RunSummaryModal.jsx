import React from 'react';

const RunSummaryModal = ({ summary, onClose }) => {
  const isVictory = summary.status === 'victory';
  
  // Calculate total items including quantities from stacked consumables
  const totalItemsCount = summary.items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 font-mono animate-in zoom-in-95 duration-300">
      <div className={`bg-slate-900 border-4 rounded-3xl p-6 md:p-8 max-w-2xl w-full flex flex-col gap-6 shadow-2xl relative overflow-hidden ${isVictory ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.2)]'}`}>
        
        {/* Header */}
        <div className="text-center relative z-10">
          <span className="text-6xl drop-shadow-md mb-2 block">{isVictory ? '🏆' : '💀'}</span>
          <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-widest ${isVictory ? 'text-emerald-400' : 'text-red-500'}`}>
            {isVictory ? 'Expedition Complete' : 'Expedition Failed'}
          </h2>
          
          {isVictory ? (
            <div className="mt-3 flex justify-center gap-4 text-xs font-bold uppercase tracking-widest">
              <span className="bg-emerald-950 text-emerald-300 px-3 py-1 rounded border border-emerald-800">
                Chests Opened: {summary.chestsOpened || 1}
              </span>
              <span className="bg-indigo-950 text-indigo-300 px-3 py-1 rounded border border-indigo-800">
                Keys Used: {summary.keysUsed || 0}
              </span>
            </div>
          ) : (
            <div className="mt-3 bg-red-950/50 border border-red-900 rounded-lg p-3 inline-block">
              <span className="text-red-400 text-xs font-black uppercase tracking-widest block mb-1">Defeated By:</span>
              <span className="text-white text-lg font-bold">{summary.killer || 'Unknown Hazard'}</span>
            </div>
          )}
        </div>

        {/* Kept Loot Overview */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
            <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">{isVictory ? 'Gold Acquired' : 'Gold Kept'}</span>
            <span className="text-3xl text-white font-black">+{summary.gold}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-1">{isVictory ? 'XP Gained' : 'XP Kept'}</span>
            <span className="text-3xl text-white font-black">+{summary.xp}</span>
          </div>
        </div>

        {/* Looted Items List */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col shadow-inner relative z-10 max-h-56">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex justify-between">
            <span>{isVictory ? 'Items Looted' : 'Items Kept'} ({totalItemsCount})</span>
            {!isVictory && summary.lostItems?.length > 0 && (
              <span className="text-red-500">Lost: {summary.lostItems.join(', ')}</span>
            )}
          </span>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            {summary.items.length === 0 ? (
              <span className="text-slate-600 italic text-sm py-4 block text-center">No items found on this run.</span>
            ) : (
              summary.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded flex items-center justify-center shrink-0 p-1">
                      {item.sprite ? (
                        <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <span className="text-[8px] text-slate-500">IMG</span>
                      )}
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold text-sm block leading-tight mb-0.5">{item.name}</span>
                      <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{item.type}</span>
                    </div>
                  </div>
                  {item.quantity > 1 && (
                    <span className="bg-amber-500 text-slate-900 font-black text-xs px-2 py-0.5 rounded-full shadow-md mr-2 border-2 border-slate-900">
                      x{item.quantity}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Continue Button */}
        <button 
          onClick={onClose}
          className={`w-full py-4 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:translate-y-1 relative z-10 cursor-pointer ${isVictory ? 'bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700' : 'bg-red-500 hover:bg-red-400 border-b-4 border-red-700 text-white'}`}
        >
          {isVictory ? 'Return to Sanctuary' : 'Try Again'}
        </button>
      </div>
    </div>
  );
};

export default RunSummaryModal;