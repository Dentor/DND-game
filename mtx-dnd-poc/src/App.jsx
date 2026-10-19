import React, { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useRoguelikeState } from './hooks/useRoguelikeState';

// === IMPORTED COMPONENTS ===
import CharacterCreator from './components/CharacterCreator';
import EncounterCard from './components/EncounterCard';
import TacticalCombat from './components/TacticalCombat';
import LevelUpModal from './components/LevelUpModal';
import CampaignMapModal from './components/CampaignMapModal';
import MerchantModal from './components/MerchantModal';
import CampModal from './components/CampModal';
import RunSummaryModal from './components/RunSummaryModal';
import ExpeditionModal from './components/ExpeditionModal';
import HomeHub from './components/HomeHub';
import StashModal from './components/StashModal';
import CharacterDashboard from './components/CharacterDashboard';
import BackpackModal from './components/BackpackModal';
import SpellbookModal from './components/SpellbookModal';
import AvatarCustomizer from './components/AvatarCustomizer';
import RoguelikeMap from './components/RoguelikeMap'; 

const App = () => {
  const { 
    character, setCharacter, campaign, startCampaign, moveToNode, handleEncounterComplete, finishEncounter, failCampaign, buyItem, sellItem,
    activeEncounter, lastRoll, isResting, gameLog, pendingLevelUp, resolveEncounter, resolveRiddle, healCharacter, equipItem, unequipItem, 
    applyLevelUp, consumeSpellCharge, resetGame, useConsumable, runSummary, clearRunSummary, depositItem, withdrawItem, modifySanctuary
  } = useGameState();

  const rlState = useRoguelikeState();

  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(false);
  const [showCampaignMap, setShowCampaignMap] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  const [isStashOpen, setIsStashOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

  if (!character) {
    return <CharacterCreator onComplete={(newChar) => setCharacter(newChar)} />;
  }

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to permanently reset your character?')) resetGame();
  };

  const handleSaveAvatar = (newSpriteDataUrl) => {
    setCharacter(prev => ({ ...prev, sprite: newSpriteDataUrl }));
    setIsAvatarEditorOpen(false);
  };

  // NEW: A robust failsafe function to force-exit the campaign state if the player gets stuck
  const forceEndCampaign = () => {
    failCampaign({ title: "Expedition Concluded" }); // Leverages the existing hook to clear the campaign object
    setShowCampaignMap(true); // Resets the map toggle for the next time you launch an expedition
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 p-4 md:p-8 font-mono flex flex-col relative overflow-x-hidden">
      
      {rlState.isRunActive ? (
        /* ==========================================
            ROGUELIKE MODE ROUTING
        ========================================== */
        <>
          {rlState.isCreating ? (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 text-white flex-col gap-8 animate-in fade-in p-4">
              <div className="text-center">
                <h2 className="text-4xl font-black text-rose-500 uppercase tracking-widest">Choose Your Champion</h2>
                <p className="text-slate-400 mt-2">Select a starting loadout for the Endless Tower. If you die, this character is lost forever.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center">
                
                <button onClick={() => rlState.finalizeCharacter("Knight", { strength: 16, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 10, charisma: 10 }, "spell_power_strike", itemsCatalog.find(i => i.id === "gear_sword_short"))} 
                  className="flex-1 bg-slate-900 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center transition-all hover:-translate-y-2 group">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⚔️</div>
                  <h3 className="text-xl font-black text-blue-400 uppercase tracking-widest">The Knight</h3>
                  <p className="text-xs text-slate-400 mt-2">High Strength & HP. Starts with Iron Shortsword and Power Strike.</p>
                </button>

                <button onClick={() => rlState.finalizeCharacter("Mage", { strength: 8, dexterity: 12, constitution: 10, intelligence: 16, wisdom: 14, charisma: 10 }, "spell_fireball", itemsCatalog.find(i => i.id === "gear_wand_novice"))} 
                  className="flex-1 bg-slate-900 border-2 border-slate-700 hover:border-purple-500 rounded-2xl p-6 text-center transition-all hover:-translate-y-2 group">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔮</div>
                  <h3 className="text-xl font-black text-purple-400 uppercase tracking-widest">The Mage</h3>
                  <p className="text-xs text-slate-400 mt-2">High Intelligence. Starts with Novice Wand and Fireball.</p>
                </button>

                <button onClick={() => rlState.finalizeCharacter("Rogue", { strength: 10, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 10, charisma: 14 }, "spell_quick_shot", itemsCatalog.find(i => i.id === "gear_bow_short"))} 
                  className="flex-1 bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all hover:-translate-y-2 group">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏹</div>
                  <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest">The Rogue</h3>
                  <p className="text-xs text-slate-400 mt-2">High Dexterity. Starts with Hunting Shortbow and Quick Shot.</p>
                </button>

              </div>
            </div>
          ) : rlState.activeEncounter ? (
            <TacticalCombat 
              character={rlState.character} 
              encounter={rlState.activeEncounter} 
              onCombatEnd={(isVictory, finalHp, rewards) => rlState.resolveCombat(isVictory, finalHp, rewards)} 
              consumeSpellCharge={rlState.consumeSpellCharge} 
              useConsumable={rlState.useConsumable}
            />
          ) : rlState.isMerchantOpen ? (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 text-white flex-col gap-4 animate-in fade-in">
              <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">Floor Cleared!</h2>
              <button onClick={rlState.proceedToNextFloor} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl uppercase tracking-widest transition-colors shadow-lg">Descend to Floor {rlState.floorLevel + 1}</button>
            </div>
          ) : rlState.runSummary ? (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 text-white flex-col gap-4 animate-in fade-in">
              <h2 className="text-4xl font-black text-rose-500 uppercase tracking-widest">Run Over</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest">Reason: <span className="text-white">{rlState.runSummary.reason}</span></p>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center w-64 my-4">
                <span className="block text-xs text-slate-500 font-black uppercase mb-2">Final Score</span>
                <span className="text-3xl text-yellow-400 font-black">{rlState.runSummary.finalScore}</span>
              </div>
              <button onClick={rlState.closeRunSummary} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl uppercase tracking-widest transition-colors border border-slate-600 shadow-lg">Return to Sanctuary</button>
            </div>
          ) : (
            <>
              <RoguelikeMap 
                character={rlState.character}
                floorLevel={rlState.floorLevel}
                mapData={rlState.mapData}
                playerPos={rlState.playerPos}
                gameLog={rlState.gameLog}
                movePlayer={rlState.movePlayer}
                onFlee={() => rlState.abortRun()}
              />
              <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
                <button onClick={() => setIsBackpackOpen(true)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-xl shadow-lg border border-slate-600">🎒</button>
                {rlState.pendingLevelUp && (
                  <button onClick={() => setPendingLevelUp(true)} className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400 animate-bounce">⭐</button>
                )}
              </div>
            </>
          )}

          {isBackpackOpen && <BackpackModal character={rlState.character} equipItem={rlState.equipItem} useConsumable={rlState.useConsumable} onClose={() => setIsBackpackOpen(false)} />}
          {rlState.pendingLevelUp && <LevelUpModal character={rlState.character} onConfirm={rlState.applyLevelUp} />}
        </>
      ) : (
        /* ==========================================
            CLASSIC CAMPAIGN & HOME HUB ROUTING
        ========================================== */
        <>
          {!campaign ? (
            <HomeHub 
              character={character} healCharacter={healCharacter} 
              onOpenExpedition={() => setIsExpeditionModalOpen(true)} 
              onOpenDashboard={() => setIsDashboardOpen(true)} 
              onOpenBackpack={() => setIsBackpackOpen(true)}
              onOpenStash={() => setIsStashOpen(true)}
              onOpenWardrobe={() => setIsAvatarEditorOpen(true)}
              modifySanctuary={modifySanctuary}
            />
          ) : (
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
              <div className="xl:col-span-5 flex flex-col gap-6 order-2 xl:order-1">
                <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex justify-between items-center z-10">
                    <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase">Expedition Status</h3>
                  </div>
                  <div className="flex flex-col gap-3 z-10">
                    <div className="w-full py-3 px-5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-widest">{campaign.location} (Tier {campaign.tier || 1})</span>
                        <span className="text-sm font-black text-white uppercase">Expedition Active</span>
                      </div>
                      <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded font-black border border-indigo-700 animate-pulse tracking-widest uppercase">In Progress</span>
                    </div>
                    
                    {/* NEW: Explicit Dashboard Flee Control */}
                    <div className="flex gap-2 w-full mt-1">
                      <button onClick={() => setShowCampaignMap(!showCampaignMap)} className={`flex-1 py-3.5 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg cursor-pointer text-xs ${showCampaignMap ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 animate-pulse'}`}>
                        {showCampaignMap ? '🛡️ Manage Character Gear' : '🗺️ View Expedition Map'}
                      </button>
                      
                      {!showCampaignMap && (
                        <button 
                          onClick={() => { if(window.confirm('Are you sure you want to abandon the expedition and return to the Sanctuary?')) forceEndCampaign(); }} 
                          className="px-5 py-3.5 bg-rose-900/40 hover:bg-rose-800 text-rose-300 border-b-4 border-rose-800 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg cursor-pointer"
                          title="Abandon Run"
                        >
                          🚪 Flee
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col min-h-[250px]">
                  <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4 border-b-2 border-slate-800 pb-2">Adventure Log</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                    {gameLog.length === 0 ? <div className="text-slate-600 italic text-sm py-4 text-center">The journey has just begun...</div> : gameLog.map((log, index) => <div key={index} className={`text-xs ${index === 0 ? 'text-white font-bold' : 'text-slate-500'}`}>&gt; {log}</div>)}
                  </div>
                </div>
              </div>
              <div className="xl:col-span-7 flex flex-col order-1 xl:order-2">
                 <CharacterDashboard 
                   character={character} campaign={campaign} unequipItem={unequipItem}
                   onClose={null}
                   onOpenSpellbook={() => setIsSpellbookOpen(true)}
                   onOpenBackpack={() => setIsBackpackOpen(true)}
                   onResetGame={handleResetGame}
                 />
              </div>
            </div>
          )}

          {/* ALL CLASSIC GAME MODALS */}
          {isExpeditionModalOpen && !campaign && (
            <ExpeditionModal 
              character={character} 
              pendingLevelUp={pendingLevelUp} 
              startCampaign={startCampaign} 
              startRoguelike={() => {
                rlState.startRun();
                setIsExpeditionModalOpen(false);
              }}
              onClose={() => setIsExpeditionModalOpen(false)} 
            />
          )}
          
          {isDashboardOpen && !campaign && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in overflow-y-auto">
              <div className="max-w-4xl w-full my-8">
                <CharacterDashboard character={character} campaign={campaign} unequipItem={unequipItem} onClose={() => setIsDashboardOpen(false)} onOpenSpellbook={() => setIsSpellbookOpen(true)} onOpenBackpack={() => setIsBackpackOpen(true)} onResetGame={handleResetGame} />
              </div>
            </div>
          )}
          
          {isAvatarEditorOpen && <AvatarCustomizer onSave={handleSaveAvatar} onCancel={() => setIsAvatarEditorOpen(false)} />}
          {isBackpackOpen && <BackpackModal character={character} equipItem={equipItem} useConsumable={useConsumable} onClose={() => setIsBackpackOpen(false)} />}
          {isSpellbookOpen && <SpellbookModal character={character} onClose={() => setIsSpellbookOpen(false)} />}
          {isStashOpen && !campaign && <StashModal character={character} depositItem={depositItem} withdrawItem={withdrawItem} onClose={() => setIsStashOpen(false)} />}
          {pendingLevelUp && <LevelUpModal character={character} onConfirm={applyLevelUp} />}
          {runSummary && <RunSummaryModal summary={runSummary} onClose={clearRunSummary} />}

          {/* NEW: Wired forceEndCampaign to all Map exit routes */}
          {campaign && !activeEncounter && showCampaignMap && (
            <CampaignMapModal 
              campaign={campaign} 
              character={character} 
              equipItem={equipItem} 
              unequipItem={unequipItem} 
              useConsumable={useConsumable} 
              onSelectNode={(nodeId) => moveToNode(nodeId)} 
              onReturnToDashboard={forceEndCampaign} 
              onOpenBackpack={() => setIsBackpackOpen(true)} 
              onForceComplete={forceEndCampaign} 
            />
          )}

          {activeEncounter && (
            <>
              {activeEncounter.type === 'Monster' ? (
                <TacticalCombat character={character} encounter={activeEncounter} consumeSpellCharge={consumeSpellCharge} useConsumable={useConsumable}
                  onCombatEnd={(isWin, finalHp, earnedRewards) => {
                    setCharacter(prev => ({ ...prev, health: { ...prev.health, current: finalHp } }));
                    if (isWin) handleEncounterComplete(true, activeEncounter, earnedRewards); 
                    else failCampaign(activeEncounter); 
                  }} 
                />
              ) : activeEncounter.type === 'Merchant' ? (
                <MerchantModal character={character} campaign={campaign} buyItem={buyItem} sellItem={sellItem} onClose={() => handleEncounterComplete(true, { success: { xp: 15, gold: 0 } })} />
              ) : activeEncounter.type === 'Camp' ? (
                <CampModal character={character} onComplete={() => { healCharacter(); handleEncounterComplete(true, { success: { xp: 20, gold: 10 } }); }} />
              ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                  <EncounterCard character={character} encounter={activeEncounter} lastRoll={lastRoll} consumeSpellCharge={consumeSpellCharge} onRoll={resolveEncounter} onFinish={finishEncounter} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;