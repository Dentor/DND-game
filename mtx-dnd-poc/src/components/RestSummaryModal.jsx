import React from 'react';

const RestSummaryModal = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in duration-300">
      <div className="bg-slate-900 border-4 border-blue-500 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(59,130,246,0.2)] flex flex-col items-center text-center relative overflow-hidden">
        
        <div className="text-6xl mb-4 animate-bounce drop-shadow-lg">🏕️</div>
        
        <h2 className="text-3xl font-black text-blue-400 uppercase tracking-widest mb-2">Well Rested</h2>
        <p className="text-slate-400 text-xs italic mb-6">You awaken feeling refreshed and ready for the next adventure.</p>

        <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 mb-6 space-y-3 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">HP Restored</span>
            <span className="text-emerald-400 font-bold text-lg">+{stats.hpRestored}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-cyan-500 font-black text-xs uppercase tracking-widest">Spells Refreshed</span>
            <span className="text-cyan-400 font-bold text-lg">+{stats.spellsRestored}</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:translate-y-1"
        >
          Wake Up
        </button>
      </div>
    </div>
  );
};

export default RestSummaryModal;