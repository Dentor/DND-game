import React from 'react';
import SpellbookModal from './SpellbookModal';
import CombatGrid from './CombatGrid';
import CombatInitiativeBar from './CombatInitiativeBar';
import CombatSidebar from './CombatSidebar';
import CombatDiceTray from './CombatDiceTray';
import { useCombatEngine } from '../hooks/useCombatEngine';

const TacticalCombat = ({ character, encounter, onCombatEnd, consumeSpellCharge, useConsumable }) => {
  const engine = useCombatEngine({ character, encounter, onCombatEnd, consumeSpellCharge, useConsumable });
  
  const {
    playerHp, actionsLeft, bonusActionsLeft, movementLeft, isCovered, hasDisengaged,
    currentActor, isAnimating, activeAction, combatQueue, turnIndex, monsters, visibleTiles, combatLogs, logEndRef,
    isSpellbookModalOpen, setIsSpellbookModalOpen, equippedWeapon,
    battleResult, earnedRewards, lastActionRecap, playerMaxMovement,
    handleTakeCover, handleDisengage, handleWeaponSwap, handleDrinkPotionInCombat, startMeleeTargeting, startRangedTargeting, advanceTurn,
    pendingRoll
  } = engine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-2 md:p-6 font-mono overflow-hidden">
      <style>{`
        @keyframes retroFloat { 0% { opacity: 0; transform: translateY(0) scale(0.5); } 10% { opacity: 1; transform: translateY(-20px) scale(1.2); } 80% { opacity: 1; transform: translateY(-60px) scale(1); } 100% { opacity: 0; transform: translateY(-80px) scale(0.8); } }
        .floating-hit-text { animation: retroFloat 2.5s ease-out forwards; font-family: 'Press Start 2P', monospace; font-weight: 900; font-size: 2.5rem; text-shadow: 3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 5px 0 #000; }
      `}</style>

      {/* NEW SLEEK DICE TRAY - DOES NOT BLOCK THE SCREEN */}
      {pendingRoll && <CombatDiceTray rollData={pendingRoll} onComplete={pendingRoll.onComplete} />}

      {isSpellbookModalOpen && (
        <SpellbookModal character={character} onClose={() => setIsSpellbookModalOpen(false)} onSelectSpell={(spell) => { engine.setActiveAction(spell); setIsSpellbookModalOpen(false); }} />
      )}

      {/* VICTORY/DEFEAT OVERLAY */}
      {battleResult && !pendingRoll && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className={`border-4 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 ${battleResult === 'victory' ? 'bg-slate-900 border-emerald-500' : 'bg-red-950 border-red-600'}`}>
            <div className="text-center">
              <span className="text-6xl drop-shadow-md mb-2 block">{battleResult === 'victory' ? '🏆' : '💀'}</span>
              <h2 className={`text-4xl font-black uppercase tracking-widest ${battleResult === 'victory' ? 'text-emerald-400' : 'text-red-500'}`}>{battleResult === 'victory' ? 'Victory!' : 'Defeat...'}</h2>
            </div>
            {/* Kept minimal for brevity - logic handled by engine */}
            <button onClick={() => onCombatEnd(battleResult === 'victory', playerHp, earnedRewards)} className="w-full py-4 text-slate-950 font-black uppercase tracking-widest rounded-xl bg-emerald-500 shadow-lg cursor-pointer">Continue</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1500px] h-full bg-slate-900 rounded-2xl border-4 border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* TOP COMBAT HUD */}
        <div className="flex justify-between items-center p-4 bg-slate-950 border-b-4 border-slate-800 shrink-0 gap-4 overflow-x-auto">
          <div className="flex gap-4 shrink-0">
            <div className="bg-emerald-900/50 border-2 border-emerald-500 px-4 py-1.5 rounded flex flex-col items-center min-w-[120px]">
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Player HP</span>
              <span className="text-xl text-white font-black">{playerHp} <span className="text-emerald-500/50">/</span> {character.health.max}</span>
            </div>
            
            {/* ACTIONS / BONUS ACTIONS HUD */}
            <div className="bg-indigo-950/50 border-2 border-indigo-500 px-4 py-1.5 rounded flex flex-col items-center">
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Action</span>
              <span className="text-xl text-white font-black">{actionsLeft} / 1</span>
            </div>
            <div className="bg-amber-950/50 border-2 border-amber-500 px-4 py-1.5 rounded flex flex-col items-center">
              <span className="text-amber-400 font-bold text-[10px] uppercase tracking-widest">Bonus Act.</span>
              <span className="text-xl text-white font-black">{bonusActionsLeft} / 1</span>
            </div>
            <div className="bg-indigo-950/50 border-2 border-indigo-500 px-4 py-1.5 rounded flex flex-col items-center hidden md:flex">
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Move</span>
              <span className="text-xl text-white font-black">{movementLeft} / {playerMaxMovement}</span>
            </div>
          </div>
          <div className={`px-6 py-2 border-2 border-dashed rounded text-sm md:text-lg font-black uppercase tracking-widest truncate shrink-0 ${currentActor.isPlayer ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}>
            {currentActor.isPlayer ? (activeAction ? (typeof activeAction === 'object' ? `Casting: ${activeAction.name}` : `Targeting (${activeAction})`) : "Your Turn") : `${currentActor.name}'s Turn`}
          </div>
        </div>

        {/* INITIATIVE TRACKER RESTORED */}
        <CombatInitiativeBar combatQueue={combatQueue} turnIndex={turnIndex} monsters={monsters} visibleTiles={visibleTiles} />

        <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row relative">
          
          <div className="flex-1 overflow-auto bg-[#05050a] relative p-12 lg:p-24 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            <div className="w-max h-max mx-auto">
              <CombatGrid engine={engine} />
            </div>
          </div>

          <div className="w-full lg:w-80 bg-slate-950 lg:border-l-4 border-slate-800 flex flex-col shrink-0">
            
            {/* SIDEBAR RESTORED: HEALTH & LOGS */}
            <div className="p-4 flex-1 flex flex-col min-h-0">
               <CombatSidebar monsters={monsters} visibleTiles={visibleTiles} combatLogs={combatLogs} logEndRef={logEndRef} />
            </div>

            {/* ACTION CONTROLS */}
            <div className="p-4 border-t-2 border-slate-800 bg-[#0b0f19] flex flex-col gap-3 shrink-0">
              
              <div className="bg-slate-900 border border-emerald-900/50 p-2 rounded text-xs space-y-1.5 max-h-24 overflow-y-auto pr-1">
                <span className="text-emerald-400 font-bold block uppercase tracking-wider border-b border-slate-800 pb-1">Quick Potions (Bonus Act.)</span>
                {character.inventory.filter(i => i.type === 'Consumable' && i.category === 'heal').length === 0 ? (
                  <div className="text-slate-600 italic">No potions in inventory</div>
                ) : (
                  character.inventory.filter(i => i.type === 'Consumable' && i.category === 'heal').map(potion => (
                    <button key={potion.uid} onClick={() => handleDrinkPotionInCombat(potion)} disabled={!currentActor.isPlayer || (actionsLeft <= 0 && bonusActionsLeft <= 0) || battleResult !== null} className="w-full p-2 bg-slate-950 hover:bg-slate-800 text-emerald-300 font-bold rounded flex justify-between items-center disabled:opacity-40 cursor-pointer shadow-inner">
                      <span className="truncate">{potion.name}</span>
                      <span className="text-[10px] text-yellow-400 shrink-0 ml-2">+{potion.healAmount} HP</span>
                    </button>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={handleTakeCover} disabled={!currentActor.isPlayer || actionsLeft <= 0 || isCovered || battleResult !== null} className="py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 text-white font-bold uppercase rounded text-[10px] cursor-pointer shadow-md">
                  {isCovered ? '🛡️ Covered' : '🛡️ Take Cover'}
                </button>
                <button onClick={handleDisengage} disabled={!currentActor.isPlayer || actionsLeft <= 0 || hasDisengaged || battleResult !== null} className="py-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-white font-bold uppercase rounded text-[10px] cursor-pointer shadow-md">
                  {hasDisengaged ? '💨 Free Move' : '💨 Disengage'}
                </button>
                <button onClick={handleWeaponSwap} disabled={!currentActor.isPlayer || (actionsLeft <= 0 && bonusActionsLeft <= 0) || battleResult !== null} className="py-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-800 text-white font-bold uppercase rounded text-[10px] cursor-pointer col-span-2 shadow-md">
                  ⚔️ Swap Gear
                </button>
              </div>

              <button onClick={() => setIsSpellbookModalOpen(true)} disabled={!currentActor.isPlayer || isAnimating || actionsLeft <= 0} className="py-3 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-white font-bold uppercase rounded-lg border-b-4 border-cyan-900 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md mt-1">
                <span>📖</span> Open Spellbook
              </button>

              <div className="space-y-2 mt-1">
                {equippedWeapon.range > 1 ? (
                  <button onClick={startRangedTargeting} disabled={!currentActor.isPlayer || activeAction !== null || actionsLeft <= 0} className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold uppercase rounded-lg border-b-4 border-amber-800 text-xs cursor-pointer shadow-md">
                    Ranged Attack
                  </button>
                ) : (
                  <button onClick={startMeleeTargeting} disabled={!currentActor.isPlayer || activeAction !== null || actionsLeft <= 0 || isCovered} className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold uppercase rounded-lg border-b-4 border-red-800 text-xs cursor-pointer shadow-md">
                    {isCovered ? 'Melee Disabled' : 'Melee Attack'}
                  </button>
                )}
                <button onClick={advanceTurn} disabled={!currentActor.isPlayer || isAnimating} className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-bold uppercase rounded border-b-4 border-slate-900 text-xs cursor-pointer shadow-sm">
                  End Turn
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalCombat;