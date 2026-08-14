import React, { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import CharacterCreator from './components/CharacterCreator';
import EncounterCard from './components/EncounterCard';
import TacticalCombat from './components/TacticalCombat';
import LevelUpModal from './components/LevelUpModal';
import CampaignMapModal from './components/CampaignMapModal';
import MerchantModal from './components/MerchantModal';
import CampModal from './components/CampModal';
import CampaignVictoryModal from './components/CampaignVictoryModal';
import ExpeditionModal from './components/ExpeditionModal';
import HomeHub from './components/HomeHub';
import spellsCatalog from './data/mockSpells.json';
import StashModal from './components/StashModal';

const App = () => {
  const { 
    character, setCharacter, campaign, startCampaign, moveToNode, handleEncounterComplete, finishEncounter, failCampaign, buyItem, sellItem,
    activeEncounter, lastRoll, isResting, gameLog, pendingLevelUp, resolveEncounter, resolveRiddle, healCharacter, equipItem, unequipItem, 
    applyLevelUp, consumeSpellCharge, resetGame, useConsumable, campaignVictory, clearCampaignVictory,depositItem, withdrawItem
  } = useGameState();

  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(false);
  const [showCampaignMap, setShowCampaignMap] = useState(true);

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  const [isStashOpen, setIsStashOpen] = useState(false);

  if (!character) {
    return <CharacterCreator onComplete={(newChar) => setCharacter(newChar)} />;
  }

  const getMod = (score) => Math.floor((score - 10) / 2);
  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));
  const xpPercent = Math.max(0, Math.min(100, (character.xp.current / character.xp.nextLevel) * 100));

  const strMod = getMod(character.stats.strength);
  const dexMod = getMod(character.stats.dexterity);
  const mainHand = character.equipment?.mainHand;
  
  const isRanged = mainHand?.range > 1; 
  const hitModifier = isRanged ? dexMod : strMod;
  
  const modString = hitModifier === 0 ? '' : hitModifier > 0 ? ` + ${hitModifier}` : ` - ${Math.abs(hitModifier)}`;
  const damageDiceValue = mainHand?.damageDice || 1; 
  const damageDisplay = mainHand ? `1d${damageDiceValue}${modString}` : `1${modString}`;

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

  // The Character Sheet / Dashboard View (Wrapped in a rendering function for reuse/modals)
  const renderCharacterDashboard = () => (
    <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col relative">
      {/* If viewed as a modal in the Hub, give it a close button */}
      {!campaign && (
        <button onClick={() => setIsDashboardOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors">✕</button>
      )}

      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-wider">{character.name || 'Hero'}</h1>
          <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mt-1">Level {character.level} Adventurer</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end mt-2 md:mt-0">
          <div className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl flex items-center justify-center shadow-inner">
            <span className="font-black text-yellow-400 text-sm drop-shadow-md">🪙 {character.currency?.gold || 0} Gold</span>
          </div>
          <button onClick={() => setIsSpellbookOpen(true)} className="bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 px-4 py-2 rounded-xl text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">Spellbook</button>
          {campaign && (
            <button onClick={() => setIsBackpackOpen(true)} className="bg-purple-900/50 hover:bg-purple-800 border border-purple-700 px-4 py-2 rounded-xl text-purple-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">Backpack ({character.inventory?.length || 0})</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-y-2 border-slate-800 py-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Experience</span>
          </div>
          <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-7 relative overflow-hidden shadow-inner flex items-center justify-center">
            <div className="bg-emerald-600 h-full transition-all duration-500 absolute left-0 top-0" style={{ width: `${xpPercent}%` }} />
            <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md tracking-widest">{character.xp.current} / {character.xp.nextLevel} XP</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Health</span>
          </div>
          <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-7 relative overflow-hidden shadow-inner flex items-center justify-center">
            <div className="bg-red-600 h-full transition-all duration-500 absolute left-0 top-0" style={{ width: `${hpPercent}%` }} />
            <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md tracking-widest">{character.health.current} / {character.health.max} HP</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="bg-indigo-950/30 border-2 border-indigo-900 rounded-xl p-4 flex flex-row items-center justify-center gap-4 sm:gap-8 shadow-inner w-full lg:w-auto">
          <div className="relative group flex flex-col items-center cursor-help">
            <span className="text-indigo-400 font-black tracking-widest uppercase text-[10px] mb-1">Armor Class</span>
            <span className="text-3xl sm:text-4xl text-white font-black drop-shadow-lg">{character.armorClass}</span>
          </div>
          <div className="w-px h-12 bg-indigo-900/50"></div>
          <div className="relative group flex flex-col items-center cursor-help">
            <span className="text-rose-400 font-black tracking-widest uppercase text-[10px] mb-1">Hit Chance</span>
            <span className="text-3xl sm:text-4xl text-white font-black drop-shadow-lg">{hitModifier >= 0 ? `+${hitModifier}` : hitModifier}</span>
          </div>
          <div className="w-px h-12 bg-indigo-900/50"></div>
          <div className="relative group flex flex-col items-center cursor-help">
            <span className="text-orange-400 font-black tracking-widest uppercase text-[10px] mb-1">Damage</span>
            <span className="text-2xl sm:text-3xl text-white font-black drop-shadow-lg">{damageDisplay}</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {statsList.map(stat => {
            const score = character.stats[stat.key];
            const mod = getMod(score);
            return (
              <div key={stat.key} className="relative group bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center hover:border-slate-600 transition-colors cursor-help shadow-inner">
                <div className="w-8 h-8 mb-1 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                  <img src={`/src/assets/icons/icon-${stat.key}.png`} alt={stat.short} className="w-full h-full object-cover z-10" onError={(e) => { e.target.style.opacity = 0; }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 font-bold z-0">{stat.short}</span>
                </div>
                <span className="text-slate-500 text-[9px] font-black tracking-widest mb-0.5">{stat.short}</span>
                <span className="text-lg text-white font-bold leading-none mb-0.5">{score}</span>
                <span className={`text-[10px] font-black leading-none ${mod >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{mod > 0 ? `+${mod}` : mod}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-slate-500 text-xs font-black tracking-widest uppercase mb-4">Equipped Gear</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {gearSlots.map(slot => {
            const item = character.equipment?.[slot.key];
            return (
              <div key={slot.key} onClick={() => item && unequipItem(slot.key)} className="relative group bg-slate-950 border-2 border-dashed border-slate-800 hover:border-solid hover:border-slate-500 rounded-xl aspect-square flex flex-col items-center justify-center transition-all cursor-pointer overflow-visible shadow-inner">
                {item ? (
                  <>
                    {item.sprite ? <img src={item.sprite} alt={item.name} className="w-10 h-10 object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} /> : <span className="text-emerald-400 text-[9px] font-bold text-center px-1 truncate w-full">{item.name}</span>}
                    <div className="fixed z-[999] hidden group-hover:flex flex-col w-48 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
                      <span className="text-emerald-400 font-black text-xs mb-1">{item.name}</span>
                      <span className="text-slate-300 text-[10px] uppercase tracking-wider">{item.type} • {slot.label}</span>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
                        {item.acBonus && <span className="text-cyan-300 font-bold text-[10px]">+{item.acBonus} AC</span>}
                        {item.damageDice && <span className="text-orange-400 font-bold text-[10px]">{item.damageDice} DMG</span>}
                      </div>
                      <span className="text-slate-400 italic text-[9px] mt-2 block">Click to unequip</span>
                    </div>
                  </>
                ) : <span className="text-slate-700 text-[9px] uppercase tracking-widest font-bold">{slot.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 p-4 md:p-8 font-mono flex flex-col relative overflow-x-hidden">
      
      {/* =========================================
          MAIN GAME RENDERING LOGIC
      ========================================= */}
      
      {!campaign ? (
        // When not in a campaign, render the immersive HOME HUB
        <HomeHub 
          character={character} 
          healCharacter={healCharacter} 
          onOpenExpedition={() => setIsExpeditionModalOpen(true)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenBackpack={() => setIsBackpackOpen(true)}
          onOpenStash={() => setIsStashOpen(true)}
        />
      ) : (
        // When IN a campaign, render the classic dashboard log & map view
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
             {renderCharacterDashboard()}
          </div>
        </div>
      )}

      {/* =========================================
          MODALS & OVERLAYS
      ========================================= */}

      {/* Expedition Selection Modal */}
      {isExpeditionModalOpen && !campaign && (
        <ExpeditionModal 
          character={character} 
          pendingLevelUp={pendingLevelUp} 
          startCampaign={startCampaign} 
          onClose={() => setIsExpeditionModalOpen(false)} 
        />
      )}

      {/* Dashboard Character Sheet Modal (Used only in Home Hub) */}
      {isDashboardOpen && !campaign && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            {renderCharacterDashboard()}
          </div>
        </div>
      )}
      
      {/* Backpack Modal */}
      {isBackpackOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono animate-in fade-in">
          <div className="bg-slate-900 border-4 border-purple-500 rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-purple-400 uppercase tracking-widest">Backpack</h3>
                <p className="text-xs text-slate-400 italic">Manage your inventory and equip gear.</p>
              </div>
              <button onClick={() => setIsBackpackOpen(false)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {character.inventory?.length === 0 ? (
                <div className="text-center text-slate-500 italic py-12 border-2 border-dashed border-slate-800 rounded-xl">Your backpack is empty...</div>
              ) : (
                character.inventory.map((item, index) => {
                  const itemSlot = item.slotType || item.slot;
                  const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
                  const isRing = itemSlot?.toLowerCase().includes('ring');
                  const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
                  const eq2 = isRing ? character.equipment.ring2 : null;

                  return (
                    <div key={item.uid || `inv-${item.id}-${index}`} className="relative group bg-[#111827] border border-slate-800 rounded-xl p-3 flex justify-between items-center transition-colors hover:border-slate-600 shadow-md">
                      <div className="flex items-center gap-4">
                        {item.sprite ? (
                          <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-slate-900 rounded-lg border border-slate-800 shadow-inner">
                            <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-[8px] text-slate-500 shadow-inner">IMG</div>
                        )}
                        <div>
                          <div className="font-bold text-emerald-400 text-sm">{item.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            {item.type} {item.slotType ? `• ${item.slotType}` : ''} {item.damageDice ? `• ${item.damageDice} Dmg` : ''} {item.acBonus ? `• +${item.acBonus} AC` : ''} {item.healAmount ? `• +${item.healAmount} HP` : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        {itemSlot ? (
                          isRing ? (
                            <div className="flex gap-1 relative z-10">
                              <button onClick={() => equipItem(item, 'ring1')} className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer">Ring 1</button>
                              <button onClick={() => equipItem(item, 'ring2')} className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer">Ring 2</button>
                            </div>
                          ) : (
                            <button onClick={() => equipItem(item, itemSlot)} className="bg-indigo-700 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer relative z-10">Equip ➔</button>
                          )
                        ) : item.type === 'Consumable' ? (
                          <button onClick={() => useConsumable(item)} className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer relative z-10">Use 🧪</button>
                        ) : (
                          <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest px-2">Material</span>
                        )}
                      </div>

                      {isGear && itemSlot && (
                        <div className="fixed z-[999] hidden group-hover:flex flex-col w-52 sm:w-56 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
                          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Currently Equipped</span>
                          <div className={isRing ? "mb-2" : ""}>
                            <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">{isRing ? 'Slot: Ring 1' : 'Equipped Gear'}</span>
                            {eq1 ? (
                              <div className="flex items-center gap-2">
                                {eq1.sprite ? <div className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded border border-slate-700 shrink-0"><img src={eq1.sprite} alt={eq1.name} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /></div> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                                <div>
                                  <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq1.name}</span>
                                  <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                    {eq1.acBonus && <span className="text-blue-300">+{eq1.acBonus} AC</span>}
                                  </div>
                                </div>
                              </div>
                            ) : <div className="text-slate-600 italic text-[10px] py-1 bg-slate-900/50 rounded-lg text-center font-bold">No gear equipped.</div>}
                          </div>

                          {isRing && (
                            <div className="border-t border-slate-700 pt-2">
                              <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Slot: Ring 2</span>
                              {eq2 ? (
                                <div className="flex items-center gap-2">
                                  {eq2.sprite ? <div className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded border border-slate-700 shrink-0"><img src={eq2.sprite} alt={eq2.name} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /></div> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                                  <div>
                                    <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq2.name}</span>
                                  </div>
                                </div>
                              ) : <div className="text-slate-600 italic text-[10px] py-1 bg-slate-900/50 rounded-lg text-center font-bold">No gear equipped.</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spellbook Modal */}
      {isSpellbookOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono animate-in fade-in">
          <div className="bg-slate-900 border-4 border-cyan-500 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
              <h3 className="text-xl font-black text-cyan-400 uppercase tracking-widest">Spellbook</h3>
              <button onClick={() => setIsSpellbookOpen(false)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {character.learnedSpells?.map(spellId => {
                const spell = spellsCatalog.find(s => s.id === spellId);
                const charges = character.spellCharges?.[spellId] ?? 0;
                if (!spell) return null;
                return (
                  <div key={spell.id} className="bg-slate-950 border border-slate-800 p-3 flex justify-between items-center rounded-xl">
                    <div className="flex items-center gap-4">
                      {spell.sprite ? <img src={spell.sprite} alt={spell.name} className="w-12 h-12" style={{ imageRendering: 'pixelated' }} /> : <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>}
                      <div>
                        <div className="font-bold text-cyan-300 text-sm">{spell.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{spell.element} {spell.type} • Range: {spell.range}</div>
                      </div>
                    </div>
                    <div className="text-right bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Charges</div>
                      <div className={`text-sm font-black ${charges > 0 ? 'text-yellow-400' : 'text-red-500'}`}>{charges}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Stash Chest Modal */}
      {isStashOpen && !campaign && (
        <StashModal 
          character={character} 
          depositItem={depositItem} 
          withdrawItem={withdrawItem} 
          onClose={() => setIsStashOpen(false)} 
        />
      )}

      {pendingLevelUp && <LevelUpModal character={character} onConfirm={applyLevelUp} />}
      {campaignVictory && <CampaignVictoryModal data={campaignVictory} onClose={clearCampaignVictory} />}

      {/* Engine Renders for Combat & Map */}
      {campaign && !activeEncounter && showCampaignMap && (
        <CampaignMapModal 
          campaign={campaign} character={character} equipItem={equipItem} unequipItem={unequipItem} useConsumable={useConsumable}
          onSelectNode={(nodeId) => moveToNode(nodeId)} onReturnToDashboard={() => setShowCampaignMap(false)}
        />
      )}

      {activeEncounter && (
        <>
          {activeEncounter.type === 'Monster' ? (
            <TacticalCombat character={character} encounter={activeEncounter} consumeSpellCharge={consumeSpellCharge} useConsumable={useConsumable}
              onCombatEnd={(isWin, finalHp, earnedRewards) => {
                setCharacter(prev => ({ ...prev, health: { ...prev.health, current: finalHp } }));
                if (isWin) handleEncounterComplete(true, activeEncounter, earnedRewards); else failCampaign();
              }} 
            />
          ) : activeEncounter.type === 'Merchant' ? (
            <MerchantModal character={character} campaign={campaign} buyItem={buyItem} sellItem={sellItem} onClose={() => handleEncounterComplete(true, { success: { xp: 15, gold: 0 } })} />
          ) : activeEncounter.type === 'Camp' ? (
            <CampModal character={character} onComplete={() => { healCharacter(); handleEncounterComplete(true, { success: { xp: 20, gold: 10 } }); }} />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <EncounterCard 
                character={character} 
                encounter={activeEncounter} 
                onRoll={resolveEncounter} 
                onSolveRiddle={resolveRiddle} 
                onFinish={finishEncounter} 
                lastRoll={lastRoll} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;