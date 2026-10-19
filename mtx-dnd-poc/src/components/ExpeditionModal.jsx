import React, { useState, useEffect } from 'react';

const ExpeditionModal = ({ character, pendingLevelUp, startCampaign, startRoguelike, onClose }) => {
  const [activeTab, setActiveTab] = useState('campaign'); // 'campaign' or 'roguelike'
  const [selectedTier, setSelectedTier] = useState(1);
  const recommendedTier = Math.min(10, Math.max(1, Math.ceil((character?.level || 1) / 3)));

  // UX FIX: Check if the player is dead/injured from a previous run
  const isGravelyInjured = character?.health?.current <= 0;

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
      <div className="bg-[#0b0f19] border-4 border-indigo-500 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors z-10">✕</button>
        
        <div className="text-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">Expedition Map</h2>
          <p className="text-xs text-slate-400 italic mt-1">Choose your path, adventurer.</p>
        </div>

        {/* MODE SELECTION TABS */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('campaign')}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-sm border-2 transition-all ${activeTab === 'campaign' ? 'bg-indigo-900/50 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
          >
            🗺️ Classic Campaign
          </button>
          <button 
            onClick={() => setActiveTab('roguelike')}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-sm border-2 transition-all ${activeTab === 'roguelike' ? 'bg-rose-900/50 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
          >
            🗼 Endless Tower
          </button>
        </div>

        {/* TAB CONTENT: CLASSIC CAMPAIGN */}
        {activeTab === 'campaign' && (
          <div className="animate-in fade-in flex-1 flex flex-col">
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
              disabled={pendingLevelUp || isGravelyInjured}
              className={`w-full py-4 mt-auto font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg cursor-pointer ${
                isGravelyInjured || pendingLevelUp 
                  ? 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-800 hover:-translate-y-1'
              }`}
            >
              {isGravelyInjured ? 'You must rest at the bed first 🛌' : pendingLevelUp ? 'Level Up Required First ⭐' : `Launch Tier ${selectedTier} 🗺️`}
            </button>
          </div>
        )}

        {/* TAB CONTENT: ENDLESS TOWER (ROGUELIKE) */}
        {activeTab === 'roguelike' && (
          <div className="animate-in fade-in flex-1 flex flex-col items-center text-center px-4">
            <div className="w-24 h-24 bg-slate-950 border-4 border-rose-900 rounded-full flex items-center justify-center text-4xl shadow-inner mb-4">
              🗼
            </div>
            <h3 className="text-xl font-black text-rose-400 uppercase tracking-widest mb-2">The Tower of Trials</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Descend into a procedurally generated maze. Visibility is limited. Monsters move when you move. <br/><br/>
              <span className="text-rose-400 font-bold">Warning:</span> You will enter with a temporary Level 1 character. If you die, the run ends permanently.
            </p>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 flex justify-around">
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🗝️</span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Find Loot</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🪙</span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Floor Merchants</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🏆</span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Leaderboards</span>
              </div>
            </div>

            <button
              onClick={() => { 
                if(startRoguelike) {
                  startRoguelike(); 
                  onClose(); 
                } else {
                  alert("Roguelike mode logic initializing in next update!");
                }
              }}
              className="w-full py-4 mt-auto bg-rose-700 hover:bg-rose-600 text-white font-black uppercase tracking-widest rounded-xl border-b-4 border-rose-900 transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              Enter the Tower
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExpeditionModal;