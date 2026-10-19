import React, { useState, useEffect, useRef } from 'react';
import ExpeditionMapCanvas from './ExpeditionMapCanvas';

const CampaignMapModal = ({ campaign, character, equipItem, unequipItem, onSelectNode, onReturnToDashboard, onOpenBackpack, onForceComplete }) => {
  const containerRef = useRef(null);
  const [showMobileChar, setShowMobileChar] = useState(false);
  const [stagedNodeId, setStagedNodeId] = useState(null);
  const [showFleeConfirm, setShowFleeConfirm] = useState(false); // NEW STATE for the flee confirmation

  if (!campaign || !campaign.nodes) return null;

  const { nodes, currentNodeId, visitedIds = [] } = campaign;
  const currentNode = nodes.find(n => n.id === currentNodeId) || nodes[0];
  const maxRow = Math.max(...nodes.map(n => n.row));
  const currentStage = Math.max(1, currentNode.row); 
  
  // FAILSAFE: Detects if the Boss node has been conquered
  const isMapComplete = currentNode && currentNode.row === maxRow && visitedIds.includes(currentNode.id);
  const stagedNode = stagedNodeId ? nodes.find(n => n.id === stagedNodeId) : null;

  const CANVAS_TOP_OFFSET = 200; 

  useEffect(() => {
    if (containerRef.current && currentNode) {
      const nextRow = Math.min(currentNode.row + 1, maxRow);
      const targetTop = (maxRow - nextRow) * 110 + CANVAS_TOP_OFFSET;
      
      const containerHalfHeight = containerRef.current.clientHeight / 2;
      containerRef.current.scrollTo({
        top: Math.max(0, targetTop - containerHalfHeight + 55),
        behavior: 'smooth'
      });
    }
  }, [currentNodeId, maxRow]);

  const getMod = (score) => Math.floor((score - 10) / 2);
  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));

  const strMod = getMod(character.stats.strength);
  const dexMod = getMod(character.stats.dexterity);
  const mainHand = character.equipment?.mainHand;
  const isRanged = mainHand?.range > 1; 
  const hitModifier = isRanged ? dexMod : strMod;
  const modString = hitModifier === 0 ? '' : hitModifier > 0 ? `+${hitModifier}` : `${hitModifier}`;
  const damageDisplay = mainHand ? `1d${mainHand.damageDice}${modString}` : `1${modString}`;

  const gearSlots = [
    { key: 'head', label: 'Head' }, { key: 'neck', label: 'Neck' },
    { key: 'back', label: 'Back' }, { key: 'chest', label: 'Chest' },
    { key: 'hands', label: 'Hands' }, { key: 'belt', label: 'Belt' },
    { key: 'legs', label: 'Legs' }, { key: 'feet', label: 'Feet' },
    { key: 'mainHand', label: 'Main Hand' }, { key: 'offHand', label: 'Off Hand' },
    { key: 'ring1', label: 'Ring 1' }, { key: 'ring2', label: 'Ring 2' }
  ];

  const nextNodeIds = currentNode ? currentNode.connections : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 font-mono">
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-2xl w-full max-w-[1500px] h-[95vh] flex overflow-hidden shadow-2xl relative">
        
        {/* NEW FLEE CONFIRMATION POPUP */}
        {showFleeConfirm && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border-4 border-rose-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <h2 className="text-2xl font-black text-rose-400 uppercase tracking-widest mb-4">Flee Expedition?</h2>
              <p className="text-slate-400 font-bold mb-8 text-sm">Are you sure you want to flee? You will return to the Sanctuary and abandon all remaining nodes.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowFleeConfirm(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-xl transition-colors border border-slate-600 shadow-md cursor-pointer">Cancel</button>
                <button onClick={onReturnToDashboard} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-xl border-b-4 border-rose-800 transition-all shadow-lg active:translate-y-1 active:border-b-0 cursor-pointer">Yes, Flee</button>
              </div>
            </div>
          </div>
        )}

        {/* FAILSAFE VICTORY OVERLAY */}
        {isMapComplete && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border-4 border-emerald-500 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-widest mb-2">Victory!</h2>
              <p className="text-slate-400 font-bold mb-8">The region has been cleared.</p>
              <button 
                onClick={onForceComplete} 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl border-b-4 border-emerald-800 transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                Return to Sanctuary ➔
              </button>
            </div>
          </div>
        )}

        <button 
          className="lg:hidden absolute top-4 right-4 z-[60] bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl border-2 border-indigo-400 shadow-lg text-white font-black uppercase text-xs transition-colors cursor-pointer"
          onClick={() => setShowMobileChar(!showMobileChar)}
        >
          {showMobileChar ? '🗺️ View Map' : '👤 Character'}
        </button>

        {/* ==========================================
            LEFT PANEL: CAMPAIGN MAP
        ========================================== */}
        <div className={`flex-1 flex flex-col h-full bg-[#0b0f19] relative ${showMobileChar ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 sm:p-6 border-b-2 border-slate-800 bg-slate-900 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">Tier {campaign.tier || 1} • {campaign.location}</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                Stage {currentStage} / {maxRow}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-950 p-2 sm:px-4 sm:py-2 rounded-xl border border-slate-800 shadow-inner">
              <span className="flex items-center gap-1 cursor-help group relative">⚔️ <span className="hidden sm:inline">Combat</span></span>
              <span className="flex items-center gap-1 cursor-help group relative">🪙 <span className="hidden sm:inline">Shop</span></span>
              <span className="flex items-center gap-1 cursor-help group relative">🏕️ <span className="hidden sm:inline">Rest</span></span>
              <span className="flex items-center gap-1 cursor-help group relative">⚠️ <span className="hidden sm:inline">Hazard</span></span>
              <span className="flex items-center gap-1 text-rose-400">💀 <span className="hidden sm:inline">Boss</span></span>
            </div>
          </div>
          
          <div ref={containerRef} className="flex-1 overflow-y-auto relative p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            <ExpeditionMapCanvas 
              nodes={nodes}
              currentNode={currentNode}
              maxRow={maxRow}
              visitedIds={visitedIds}
              nextNodeIds={nextNodeIds}
              stagedNodeId={stagedNodeId}
              onSelectNode={onSelectNode}
              setStagedNodeId={setStagedNodeId}
              canvasTopOffset={CANVAS_TOP_OFFSET}
            />
          </div>

          {/* TRAVEL CONFIRMATION POPUP */}
          {stagedNode && !isMapComplete && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 border-4 border-indigo-500 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom-8 w-[90%] max-w-sm">
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                {stagedNode.type === 'Monster' && stagedNode.row === maxRow ? '💀 Boss Encounter' : 
                 stagedNode.type === 'Monster' ? '⚔️ Combat Encounter' : 
                 stagedNode.type === 'Merchant' ? '🪙 Wandering Merchant' : 
                 stagedNode.type === 'Camp' ? '🏕️ Rest Camp' : '⚠️ Hazard Area'}
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest text-center">Are you ready to travel here?</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setStagedNodeId(null)} 
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-widest rounded-xl transition-colors border border-slate-600 shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onSelectNode(stagedNodeId);
                    setStagedNodeId(null);
                  }} 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl border-b-4 border-indigo-800 shadow-lg active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
                >
                  Travel ➔
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            RIGHT PANEL: CHARACTER SHEET
        ========================================== */}
        <div className={`w-full lg:w-[450px] xl:w-[500px] bg-slate-900 border-l-4 border-slate-800 h-full flex flex-col p-4 sm:p-6 overflow-y-auto ${showMobileChar ? 'flex' : 'hidden lg:flex'} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest">{character.name}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Level {character.level} Adventurer</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onOpenBackpack} 
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border bg-purple-900/50 hover:bg-purple-800 text-purple-300 border-purple-700 shadow-inner"
              >
                🎒 Backpack ({character.inventory?.length || 0})
              </button>

              {onReturnToDashboard && (
                <button onClick={() => setShowFleeConfirm(true)} className="p-2 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shadow-md border border-slate-700" title="Flee Campaign">
                  🚪 Flee
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col justify-center items-center relative overflow-hidden">
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest z-10">HP {character.health.current}/{character.health.max}</span>
              <div className="absolute left-0 bottom-0 top-0 bg-emerald-900/40 transition-all" style={{ width: `${hpPercent}%` }} />
            </div>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 flex justify-center items-center text-yellow-400 font-black text-xs shadow-inner">
              🪙 {character.currency.gold}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-indigo-950/30 border border-indigo-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner cursor-help group relative">
              <span className="text-indigo-400 font-black tracking-widest uppercase text-[8px] mb-1">Armor Class</span>
              <span className="text-xl text-white font-black">{character.armorClass}</span>
            </div>
            <div className="bg-rose-950/30 border border-rose-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner cursor-help group relative">
              <span className="text-rose-400 font-black tracking-widest uppercase text-[8px] mb-1">Hit Chance</span>
              <span className="text-xl text-white font-black">{hitModifier >= 0 ? `+${hitModifier}` : hitModifier}</span>
            </div>
            <div className="bg-orange-950/30 border border-orange-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner cursor-help group relative">
              <span className="text-orange-400 font-black tracking-widest uppercase text-[8px] mb-1">Damage</span>
              <span className="text-lg text-white font-black">{damageDisplay}</span>
            </div>
          </div>

          <div className="mb-6 shrink-0">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-4 border-b border-slate-800 pb-2">Equipped Gear</h4>
            <div className="flex flex-wrap gap-4 justify-center pb-8">
              {gearSlots.map(slot => {
                const item = character.equipment[slot.key];
                return (
                  <div key={slot.key} onClick={() => { if (item) unequipItem(slot.key); }} className={`w-[140px] h-[140px] rounded-xl border-2 flex flex-col justify-between p-3 transition-all shadow-inner ${item ? 'bg-slate-950 border-indigo-700 hover:border-red-500 cursor-pointer group relative' : 'bg-slate-950/40 border-slate-800 border-dashed opacity-70'}`}>
                    <span className="text-slate-500 uppercase font-black text-[10px] tracking-widest block text-center">{slot.label}</span>
                    <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                      {item ? (
                        item.sprite ? <img src={item.sprite} alt={item.name} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-lg scale-125 pointer-events-none" style={{ imageRendering: 'pixelated' }} /> : <span className="text-emerald-400 font-bold text-xs text-center">{item.name}</span>
                      ) : <span className="text-slate-700 font-bold uppercase text-xs">Empty</span>}
                    </div>
                    {item && <span className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity text-center absolute bottom-2 w-full left-0">Unequip</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignMapModal;