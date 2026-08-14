import React, { useState, useEffect } from 'react';

const ExpeditionModal = ({ character, pendingLevelUp, startCampaign, onClose }) => {
  const [selectedTier, setSelectedTier] = useState(1);
  const recommendedTier = Math.min(10, Math.max(1, Math.ceil((character?.level || 1) / 3)));

  useEffect(() => {
    if (character) setSelectedTier(recommendedTier);
  }, [character?.level, recommendedTier]);

  const getTierDescription = (tier) => {
    if (tier <= 2) return { title: "Scavenger's Run", desc: "Relatively safe. Expect rats, wolves, and bandits.", color: "text-emerald-400" };
    if (tier <= 4) return { title: "Adept Expedition", desc: "Risky. You will face ogres, elementals, and knights.", color: "text-blue-400" };
    if (tier <= 6) return { title: "Heroic Vanguard", desc: "Dangerous. Giants, golems, and elite monsters roam here.", color: "text-purple-400" };
    if (tier <= 8) return { title: "Mythic Descent", desc: "Deadly. Mind Flayers, Beholders, and minor dragons.", color: "text-rose-400" };
    if (tier === 9) return { title: "Abyssal Nightmare", desc: "Terrifying. Archliches, Krakens, and Pit Fiends.", color: "text-red-500" };
    return { title: "God-Slayer's Domain", desc: "Suicidal. Ancient Dragons, Solar Avatars, and The Tarrasque.", color: "text-orange-500 animate-pulse" };
  };

  const currentTierInfo = getTierDescription(selectedTier);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in">
      <div className="bg-[#0b0f19] border-4 border-indigo-500 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors">✕</button>
        
        <div className="text-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-black text-indigo-400 uppercase tracking-widest">Expedition Map</h2>
          <p className="text-xs text-slate-400 italic mt-1">Select your difficulty and embark on a new journey.</p>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => {
            const isSelected = selectedTier === tier;
            const isRecommended = recommendedTier === tier;
            return (
              <div key={tier} className="relative flex flex-col items-center">
                {isRecommended && <span className="absolute -top-4 text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-bounce">Rec.</span>}
                <button
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-black border-b-2 transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-900 text-white scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-10' : 'bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                >
                  {tier}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 text-center min-h-[80px] flex flex-col justify-center">
          <h4 className={`font-black uppercase tracking-widest text-sm ${currentTierInfo.color}`}>{currentTierInfo.title}</h4>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{currentTierInfo.desc}</p>
        </div>

        <button
          onClick={() => { startCampaign(selectedTier); onClose(); }}
          disabled={pendingLevelUp}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black uppercase tracking-widest rounded-xl border-b-4 border-indigo-800 transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
        >
          {pendingLevelUp ? 'Level Up Required First ⭐' : `Launch Tier ${selectedTier} 🗺️`}
        </button>
      </div>
    </div>
  );
};

export default ExpeditionModal;