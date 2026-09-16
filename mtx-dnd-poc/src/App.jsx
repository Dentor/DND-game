import React, { useState } from 'react';
import { useGameState } from './hooks/useGameState';

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

const App = () => {
  const { 
    character, setCharacter, campaign, startCampaign, moveToNode, handleEncounterComplete, finishEncounter, failCampaign, buyItem, sellItem,
    activeEncounter, lastRoll, isResting, gameLog, pendingLevelUp, resolveEncounter, resolveRiddle, healCharacter, equipItem, unequipItem, 
    applyLevelUp, consumeSpellCharge, resetGame, useConsumable, runSummary, clearRunSummary, depositItem, withdrawItem, modifySanctuary
  } = useGameState();

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

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 p-4 md:p-8 font-mono flex flex-col relative overflow-x-hidden">
      
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
                <button onClick={() => setShowCampaignMap(!showCampaignMap)} className={`w-full py-3.5 font-black uppercase tracking-widest rounded-xl border-b-4 transition-all shadow-lg cursor-pointer text-xs ${showCampaignMap ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 animate-pulse'}`}>
                  {showCampaignMap ? '🛡️ Manage Character Gear' : '🗺️ View Expedition Map'}
                </button>
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

      {/* ALL GAME MODALS */}
      {isExpeditionModalOpen && !campaign && <ExpeditionModal character={character} pendingLevelUp={pendingLevelUp} startCampaign={startCampaign} onClose={() => setIsExpeditionModalOpen(false)} />}
      
      {isDashboardOpen && !campaign && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <CharacterDashboard character={character} campaign={campaign} unequipItem={unequipItem} onClose={() => setIsDashboardOpen(false)} onOpenSpellbook={() => setIsSpellbookOpen(true)} onOpenBackpack={() => setIsBackpackOpen(true)} onResetGame={handleResetGame} />
          </div>
        </div>
      )}
      
      {isAvatarEditorOpen && (
        <AvatarCustomizer 
          onSave={handleSaveAvatar} 
          onCancel={() => setIsAvatarEditorOpen(false)} 
        />
      )}
      
      {isBackpackOpen && <BackpackModal character={character} equipItem={equipItem} useConsumable={useConsumable} onClose={() => setIsBackpackOpen(false)} />}
      {isSpellbookOpen && <SpellbookModal character={character} onClose={() => setIsSpellbookOpen(false)} />}
      {isStashOpen && !campaign && <StashModal character={character} depositItem={depositItem} withdrawItem={withdrawItem} onClose={() => setIsStashOpen(false)} />}
      
      {pendingLevelUp && <LevelUpModal character={character} onConfirm={applyLevelUp} />}
      {runSummary && <RunSummaryModal summary={runSummary} onClose={clearRunSummary} />}

      {campaign && !activeEncounter && showCampaignMap && (
        <CampaignMapModal campaign={campaign} character={character} equipItem={equipItem} unequipItem={unequipItem} useConsumable={useConsumable} onSelectNode={(nodeId) => moveToNode(nodeId)} onReturnToDashboard={() => setShowCampaignMap(false)} onOpenBackpack={() => setIsBackpackOpen(true)} />
      )}

      {activeEncounter && (
        <>
          {activeEncounter.type === 'Monster' ? (
            <TacticalCombat character={character} encounter={activeEncounter} consumeSpellCharge={consumeSpellCharge} useConsumable={useConsumable}
              onCombatEnd={(isWin, finalHp, earnedRewards) => {
                setCharacter(prev => ({ ...prev, health: { ...prev.health, current: finalHp } }));
                if (isWin) {
                  handleEncounterComplete(true, activeEncounter, earnedRewards); 
                } else {
                  failCampaign(activeEncounter); // FIX: Passing the encounter data so the defeat screen knows who killed you!
                }
              }} 
            />
          ) : activeEncounter.type === 'Merchant' ? (
            <MerchantModal character={character} campaign={campaign} buyItem={buyItem} sellItem={sellItem} onClose={() => handleEncounterComplete(true, { success: { xp: 15, gold: 0 } })} />
          ) : activeEncounter.type === 'Camp' ? (
            <CampModal character={character} onComplete={() => { healCharacter(); handleEncounterComplete(true, { success: { xp: 20, gold: 10 } }); }} />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <EncounterCard 
                character={character} encounter={activeEncounter} lastRoll={lastRoll} consumeSpellCharge={consumeSpellCharge}
                onRoll={resolveEncounter} onFinish={finishEncounter} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;