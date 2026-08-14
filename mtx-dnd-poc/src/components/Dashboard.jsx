import React, { useState, useEffect } from 'react';

const Dashboard = ({ character, campaign, gameLog, onStartCampaign, onResumeCampaign, onUnequip, onOpenSpellbook, onOpenBackpack, onHeal, onReset }) => {
  // --- TIER SELECTION LOGIC ---
  const recommendedTier = Math.min(10, Math.max(1, Math.ceil((character?.level || 1) / 3)));
  const [selectedTier, setSelectedTier] = useState(recommendedTier);

  useEffect(() => {
    setSelectedTier(recommendedTier);
  }, [recommendedTier]);

  const getTierDescription = (tier) => {
    if (tier <= 2) return { title: "Scavenger's Run", desc: "Relatively safe. Expect rats, wolves, and bandits.", color: "text-emerald-400" };
    if (tier <= 4) return { title: "Adept Expedition", desc: "Risky. You will face ogres, elementals, and knights.", color: "text-blue-400" };
    if (tier <= 6) return { title: "Heroic Vanguard", desc: "Dangerous. Giants, golems, and elite monsters roam here.", color: "text-purple-400" };
    if (tier <= 8) return { title: "Mythic Descent", desc: "Deadly. Mind Flayers, Beholders, and minor dragons.", color: "text-rose-400" };
    if (tier === 9) return { title: "Abyssal Nightmare", desc: "Terrifying. Archliches, Krakens, and Pit Fiends.", color: "text-red-500" };
    return { title: "God-Slayer's Domain", desc: "Suicidal. Ancient Dragons, Solar Avatars, and The Tarrasque.", color: "text-orange-500 animate-pulse" };
  };
  const currentTierInfo = getTierDescription(selectedTier);
  // -----------------------------

  if (!character) return null;

  const getMod = (score) => Math.floor((score - 10) / 2);
  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));
  const xpPercent = Math.max(0, Math.min(100, (character.xp.current / character.xp.nextLevel) * 100));

  const statsList = [
    { key: 'strength', short: 'STR', label: 'Strength' },
    { key: 'dexterity', short: 'DEX', label: 'Dexterity' },
    { key: 'constitution', short: 'CON', label: 'Constitution' },
    { key: 'intelligence', short: 'INT', label: 'Intelligence' },
    { key: 'wisdom', short: 'WIS', label: 'Wisdom' },
    { key: 'charisma', short: 'CHA', label: 'Charisma' }
  ];

  const gearSlots = [
    { key: 'head', label: 'Head' }, { key: 'neck', label: 'Neck' },
    { key: 'back', label: 'Back' }, { key: 'chest', label: 'Chest' },
    { key: 'hands', label: 'Hands' }, { key: 'belt', label: 'Belt' },
    { key: 'legs', label: 'Legs' }, { key: 'feet', label: 'Feet' },
    { key: 'mainHand', label: 'Main Hand' }, { key: 'offHand', label: 'Off Hand' },
    { key: 'ring1', label: 'Ring 1' }, { key: 'ring2', label: 'Ring 2' }
  ];

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 font-mono p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Campaign & Logs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* CAMPAIGN HUB */}
          <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Top Header Row for Status and Reset Game */}
            <div className="flex justify-between items-center w-full mb-6 relative z-10">
              <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Expedition Status</span>
              {onReset && (
                <button 
                  onClick={onReset} 
                  className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded border border-red-800 transition-colors cursor-pointer"
                >
                  Reset Game
                </button>
              )}
            </div>

            {campaign ? (
              <div className="text-center w-full relative z-10 flex flex-col items-center">
                <span className="text-emerald-400 font-black tracking-widest uppercase text-xs mb-2">Active Tier {campaign.tier || 1} Expedition</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6">{campaign.location}</h2>
                <button 
                  onClick={onResumeCampaign}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl border-b-4 border-emerald-800 transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                  Resume Journey 🗺️
                </button>
              </div>
            ) : (
              <div className="w-full relative z-10">
                <div className="text-center mb-4">
                  <h3 className="text-white font-black text-lg uppercase tracking-wider">Select Difficulty Tier</h3>
                </div>

                {/* 1-10 Button Grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => {
                    const isSelected = selectedTier === tier;
                    const isRecommended = recommendedTier === tier;
                    
                    return (
                      <div key={tier} className="relative flex flex-col items-center">
                        {isRecommended && (
                          <span className="absolute -top-4 text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-bounce">Rec.</span>
                        )}
                        <button
                          onClick={() => setSelectedTier(tier)}
                          className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-black border-b-2 transition-all cursor-pointer
                            ${isSelected 
                              ? 'bg-indigo-600 border-indigo-900 text-white scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-10' 
                              : 'bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                        >
                          {tier}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Flavor Text */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 text-center min-h-[70px] flex flex-col justify-center">
                  <h4 className={`font-black uppercase tracking-widest text-xs ${currentTierInfo.color}`}>{currentTierInfo.title}</h4>
                  <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{currentTierInfo.desc}</p>
                </div>

                {/* DYNAMIC BUTTON FIX: Swaps to Rest if HP is 0 */}
                {character.health.current > 0 ? (
                  <button 
                    onClick={() => onStartCampaign(selectedTier)}
                    className="w-full py-4 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-1 text-white border-indigo-800 cursor-pointer"
                  >
                    Launch Tier {selectedTier} 🗺️
                  </button>
                ) : (
                  <button 
                    onClick={onHeal}
                    className="w-full py-4 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 text-white border-emerald-800 cursor-pointer animate-pulse"
                  >
                    Take Long Rest First 🏕️
                  </button>
                )}

              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
          </div>

          {/* ADVENTURE LOG */}
          <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4 border-b-2 border-slate-800 pb-2">Adventure Log</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {gameLog.length === 0 ? (
                <div className="text-slate-600 italic text-sm py-4 text-center">The journey has just begun...</div>
              ) : (
                gameLog.map((log, index) => (
                  <div key={index} className={`text-xs ${index === 0 ? 'text-white font-bold' : 'text-slate-400'}`}>
                    &gt; {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Character Sheet */}
        <div className="lg:col-span-7 bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col">
          
          {/* HEADER */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider">{character.name || 'Hero'}</h1>
              <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mt-1">
                Level {character.level} Adventurer
              </p>
            </div>
            <div className="flex gap-2">
              <div className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl flex items-center justify-center">
                <span className="font-black text-yellow-400 text-sm">🪙 {character.currency?.gold || 0}</span>
              </div>
              <button onClick={onOpenSpellbook} className="bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 px-4 py-2 rounded-xl text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                Spellbook
              </button>
              <button onClick={onOpenBackpack} className="bg-purple-900/50 hover:bg-purple-800 border border-purple-700 px-4 py-2 rounded-xl text-purple-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                Backpack ({character.inventory?.length || 0})
              </button>
            </div>
          </div>

          {/* PROGRESS BARS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-y-2 border-slate-800 py-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Experience</span>
                <span className="text-xs font-bold text-slate-400">{character.xp.current} / {character.xp.nextLevel} XP</span>
              </div>
              <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-6 relative overflow-hidden shadow-inner">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Health</span>
              </div>
              <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-6 relative overflow-hidden shadow-inner flex items-center justify-center">
                <div className="bg-red-600 h-full transition-all duration-500 absolute left-0 top-0" style={{ width: `${hpPercent}%` }} />
                <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md tracking-widest">
                  {character.health.current} / {character.health.max} HP
                </span>
              </div>
            </div>
          </div>

          {/* STATS & AC */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="bg-indigo-950/30 border-2 border-indigo-900 rounded-xl p-4 flex flex-col items-center justify-center shrink-0 w-32 shadow-inner">
              <span className="text-indigo-400 font-black tracking-widest uppercase text-[10px] mb-1">Armor Class</span>
              <span className="text-4xl text-white font-black">{character.armorClass}</span>
            </div>

            <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-2">
              {statsList.map(stat => {
                const score = character.stats[stat.key];
                const mod = getMod(score);
                return (
                  <div key={stat.key} className="relative group bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center hover:border-slate-600 transition-colors cursor-help">
                    <span className="text-slate-500 text-[10px] font-black tracking-widest">{stat.short}</span>
                    <span className="text-lg text-white font-bold">{score}</span>
                    <span className={`text-[10px] font-black ${mod >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {mod > 0 ? `+${mod}` : mod}
                    </span>

                    {/* Stat Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-xl z-50 pointer-events-none">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EQUIPPED GEAR GRID */}
          <div>
            <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4">Equipped Gear</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {gearSlots.map(slot => {
                const item = character.equipment?.[slot.key];
                
                return (
                  <div 
                    key={slot.key} 
                    onClick={() => item && onUnequip(slot.key)}
                    className="relative group bg-slate-950 border-2 border-dashed border-slate-800 hover:border-solid hover:border-slate-500 rounded-xl aspect-square flex flex-col items-center justify-center transition-all cursor-pointer overflow-visible"
                  >
                    {item ? (
                      <>
                        {item.sprite ? (
                          <img src={item.sprite} alt={item.name} className="w-10 h-10 object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-bold text-center px-1 truncate w-full">{item.name}</span>
                        )}

                        {/* Gear Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-48 p-3 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-[60] pointer-events-none">
                          <span className="text-emerald-400 font-black text-xs mb-1">{item.name}</span>
                          <span className="text-slate-300 text-[10px] uppercase tracking-wider">{item.type} • {slot.label}</span>
                          
                          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
                            {item.acBonus && <span className="text-cyan-300 font-bold text-[10px]">+{item.acBonus} AC</span>}
                            {item.damageDice && <span className="text-orange-400 font-bold text-[10px]">{item.damageDice} DMG</span>}
                          </div>
                          <span className="text-slate-400 italic text-[9px] mt-2 block">Click to unequip</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-700 text-[9px] uppercase tracking-widest font-bold">{slot.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-right text-slate-600 italic text-[10px] mt-2">Click an item to return it to your backpack</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;