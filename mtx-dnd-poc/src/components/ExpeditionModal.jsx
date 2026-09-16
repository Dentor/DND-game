import React, { useState } from 'react';
import PartyLobby from './PartyLobby';
import { calculateLootPenalty } from '../utils/antiCheatUtils';

const ExpeditionModal = ({ character, pendingLevelUp, startCampaign, onClose }) => {
  const [selectedTier, setSelectedTier] = useState(1);
  const [gameMode, setGameMode] = useState('solo'); // 'solo' or 'multi'
  const [isReady, setIsReady] = useState(false);

  // Highest tier is based on level (1 tier per 3 levels)
  const maxUnlockedTier = Math.min(10, Math.max(1, Math.ceil((character.level || 1) / 3)));
  
  // Calculate if the player is trying to cheat/farm a low-level dungeon
  const penaltyData = calculateLootPenalty(character.level, selectedTier);

  const handleLaunchSolo = () => {
    if (pendingLevelUp) {
      alert("You must level up your character before starting a new expedition.");
      return;
    }
    startCampaign(selectedTier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in">
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-2xl p-6 max-w-5xl w-full shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col md:flex-row gap-6 max-h-[90vh]">
        
        {/* LEFT PANEL: Tier Selection */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-black text-indigo-400 uppercase tracking-widest">Expedition Map</h2>
              <p className="text-slate-400 text-xs mt-1 italic">Select your difficulty and embark on a new journey.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors cursor-pointer">✕</button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-6 flex-1 content-start">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => {
              const isUnlocked = tier <= maxUnlockedTier;
              const isSelected = selectedTier === tier;
              
              return (
                <button
                  key={tier}
                  onClick={() => isUnlocked && setSelectedTier(tier)}
                  disabled={!isUnlocked}
                  className={`relative p-4 rounded-xl flex items-center justify-center font-black text-xl transition-all outline-none 
                    ${!isUnlocked ? 'bg-slate-950 border-2 border-slate-900 text-slate-800 cursor-not-allowed' : 
                      isSelected ? 'bg-indigo-600 border-2 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105 z-10' : 
                      'bg-slate-900 border-2 border-slate-700 text-slate-400 hover:border-indigo-500 hover:bg-slate-800 cursor-pointer'}`}
                >
                  {tier}
                  {tier === maxUnlockedTier && isUnlocked && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-black shadow-md">
                      Rec.
                    </span>
                  )}
                  {!isUnlocked && <span className="absolute bottom-1 right-1 text-[8px]">🔒</span>}
                </button>
              );
            })}
          </div>

          <div className={`p-4 rounded-xl border-2 mb-4 text-center transition-colors ${penaltyData.isPenalized ? 'bg-red-950/30 border-red-900' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`font-black text-sm uppercase tracking-widest block mb-1 ${penaltyData.isPenalized ? 'text-red-400' : 'text-emerald-400'}`}>
              Tier {selectedTier} Briefing
            </span>
            {penaltyData.isPenalized ? (
              <span className="text-red-400 text-xs font-bold">{penaltyData.message}</span>
            ) : (
              <span className="text-slate-400 text-xs">Standard difficulty. Full XP and Loot tables are active.</span>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Mode Selection & Launch */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button 
              onClick={() => setGameMode('solo')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${gameMode === 'solo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
            >
              Solo
            </button>
            <button 
              onClick={() => setGameMode('multi')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${gameMode === 'multi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
            >
              Party
            </button>
          </div>

          {gameMode === 'solo' ? (
            <div className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-6 shadow-inner animate-in fade-in zoom-in-95 duration-200">
              <span className="text-6xl drop-shadow-lg">🐺</span>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">Lone Wolf</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Enter the dungeon alone. You rely entirely on your own stats, gear, and spells.</p>
              </div>
              <button 
                onClick={handleLaunchSolo}
                className="w-full py-4 mt-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg border-b-4 border-indigo-800 active:translate-y-1 cursor-pointer"
              >
                Launch Tier {selectedTier}
              </button>
            </div>
          ) : (
            <PartyLobby 
              character={character} 
              isPlayerReady={isReady} 
              onToggleReady={() => setIsReady(!isReady)} 
            />
          )}

        </div>

      </div>
    </div>
  );
};

export default ExpeditionModal;