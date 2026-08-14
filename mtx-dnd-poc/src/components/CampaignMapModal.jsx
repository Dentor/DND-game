import React, { useState, useEffect, useRef } from 'react';

const CampaignMapModal = ({ campaign, character, equipItem, unequipItem, useConsumable, onSelectNode, onReturnToDashboard }) => {
  const containerRef = useRef(null);
  const inlineBackpackRef = useRef(null);
  const [showMobileChar, setShowMobileChar] = useState(false);
  
  // This state now controls if the Left Panel shows the Map or the Backpack
  const [isManagingGear, setIsManagingGear] = useState(false);

  if (!campaign || !campaign.nodes) return null;

  const { nodes, currentNodeId, visitedIds = [] } = campaign;
  const currentNode = nodes.find(n => n.id === currentNodeId) || nodes[0];
  const maxRow = Math.max(...nodes.map(n => n.row));
  const currentStage = Math.max(1, currentNode.row); 

  const CANVAS_TOP_OFFSET = 200; 

  useEffect(() => {
    if (containerRef.current && currentNode && !isManagingGear) {
      const nextRow = Math.min(currentNode.row + 1, maxRow);
      const targetTop = (maxRow - nextRow) * 110 + CANVAS_TOP_OFFSET;
      
      const containerHalfHeight = containerRef.current.clientHeight / 2;
      containerRef.current.scrollTo({
        top: Math.max(0, targetTop - containerHalfHeight + 55),
        behavior: 'smooth'
      });
    }
  }, [currentNodeId, maxRow, isManagingGear]);

  const getMod = (score) => Math.floor((score - 10) / 2);
  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));
  const xpPercent = Math.max(0, Math.min(100, (character.xp.current / character.xp.nextLevel) * 100));

  const strMod = getMod(character.stats.strength);
  const dexMod = getMod(character.stats.dexterity);
  const mainHand = character.equipment?.mainHand;
  const isRanged = mainHand?.range > 1; 
  const hitModifier = isRanged ? dexMod : strMod;
  const modString = hitModifier === 0 ? '' : hitModifier > 0 ? `+${hitModifier}` : `${hitModifier}`;
  const damageDisplay = mainHand ? `1d${mainHand.damageDice}${modString}` : `1${modString}`;

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

  const nextNodeIds = currentNode ? currentNode.connections : [];

  const scrollToBackpack = () => {
    inlineBackpackRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 font-mono">
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-2xl w-full max-w-[1400px] h-[95vh] flex overflow-hidden shadow-2xl relative">
        
        {/* MOBILE TOGGLE BUTTON */}
        <button 
          className="lg:hidden absolute top-4 right-4 z-[60] bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl border-2 border-indigo-400 shadow-lg text-white font-black uppercase text-xs transition-colors cursor-pointer"
          onClick={() => setShowMobileChar(!showMobileChar)}
        >
          {showMobileChar ? '🗺️ View Map' : '👤 Character'}
        </button>

        {/* ==========================================
            LEFT PANEL: CAMPAIGN MAP OR BACKPACK
        ========================================== */}
        <div className={`flex-1 flex flex-col h-full bg-[#0b0f19] ${showMobileChar ? 'hidden lg:flex' : 'flex'}`}>
          
          <div className="p-4 sm:p-6 border-b-2 border-slate-800 bg-slate-900 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">
                Tier {campaign.tier || 1} • {campaign.location}
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                {isManagingGear ? 'Backpack & Inventory' : `Stage ${currentStage} / ${maxRow}`}
              </h2>
            </div>

            {/* RESTORED LEGEND CHEAT SHEET */}
            {!isManagingGear && (
              <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-950 p-2 sm:px-4 sm:py-2 rounded-xl border border-slate-800 shadow-inner">
                <span className="flex items-center gap-1 cursor-help group relative">
                  ⚔️ <span className="hidden sm:inline">Combat</span>
                  <div className="absolute top-full mt-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded shadow-xl border border-slate-600 z-50 w-48 text-center normal-case tracking-normal">Test your might against foes to earn XP and Gold.</div>
                </span>
                <span className="flex items-center gap-1 cursor-help group relative">
                  🪙 <span className="hidden sm:inline">Shop</span>
                  <div className="absolute top-full mt-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded shadow-xl border border-slate-600 z-50 w-48 text-center normal-case tracking-normal">Buy gear and sell junk.</div>
                </span>
                <span className="flex items-center gap-1 cursor-help group relative">
                  🏕️ <span className="hidden sm:inline">Rest</span>
                  <div className="absolute top-full mt-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded shadow-xl border border-slate-600 z-50 w-48 text-center normal-case tracking-normal">Fully restores HP and Spell Charges.</div>
                </span>
                <span className="flex items-center gap-1 cursor-help group relative">
                  ⚠️ <span className="hidden sm:inline">Hazard</span>
                  <div className="absolute top-full mt-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded shadow-xl border border-slate-600 z-50 w-48 text-center normal-case tracking-normal">Pass an attribute check or take damage!</div>
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  💀 <span className="hidden sm:inline">Boss</span>
                </span>
              </div>
            )}
          </div>
          
          {isManagingGear ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
              <p className="text-xs text-slate-400 italic mb-4">Review your inventory, equip upgrades, or drink health potions before picking your next path node.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BACKPACK LIST */}
                <div className="bg-[#0b0f19] border-2 border-slate-800 p-4 rounded-xl flex flex-col h-[500px]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-900 pb-2">
                    Backpack ({character.inventory.length})
                  </span>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                    {character.inventory.length === 0 ? (
                      <span className="text-xs text-slate-600 italic py-4 text-center block">Inventory empty</span>
                    ) : (
                      character.inventory.map((item, index) => {
                        const itemSlot = item.slotType || item.slot;
                        const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
                        const isRing = itemSlot?.toLowerCase().includes('ring');
                        const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
                        const eq2 = isRing ? character.equipment.ring2 : null;

                        return (
                          <div key={`inv-${item.uid || item.id}-${index}`} className="relative group hover:z-[60] p-3 bg-slate-900 border border-slate-700 rounded-lg flex flex-col gap-2 hover:border-slate-500 transition-colors shadow-md">
                            
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                {item.sprite ? (
                                  <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-slate-950 rounded border border-slate-800 shadow-inner">
                                    <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-[6px] text-slate-500 shadow-inner">IMG</div>
                                )}
                                <div>
                                  <span className="font-bold text-emerald-400 text-sm block leading-tight">{item.name || 'Unnamed Equipment'}</span>
                                  <span className="text-[9px] text-slate-500 block uppercase tracking-widest mt-0.5">
                                    {item.type || 'Gear'} {itemSlot ? `• Slot: ${itemSlot}` : ''}
                                  </span>
                                </div>
                              </div>
                              
                              <div>
                                {itemSlot ? (
                                  isRing ? (
                                    <div className="flex gap-1 relative z-10">
                                      <button onClick={() => equipItem(item, 'ring1')} className="bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded text-[9px] font-bold border border-indigo-800 shadow-md cursor-pointer">Ring 1</button>
                                      <button onClick={() => equipItem(item, 'ring2')} className="bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded text-[9px] font-bold border border-indigo-800 shadow-md cursor-pointer">Ring 2</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => equipItem(item, itemSlot)} className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-[10px] font-bold border border-indigo-800 shadow-md cursor-pointer relative z-10">Equip ➔</button>
                                  )
                                ) : item.type === 'Consumable' ? (
                                  <button onClick={() => useConsumable(item)} className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold border border-emerald-800 shadow-md cursor-pointer relative z-10">Use 🧪</button>
                                ) : (
                                  <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest px-2">Material</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px] font-bold ml-12">
                              {item.acBonus && <span className="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">AC: +{item.acBonus}</span>}
                              {item.damageDice && <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">Dmg: 1d{item.damageDice}</span>}
                              {item.healAmount && <span className="bg-green-950 text-green-300 px-1.5 py-0.5 rounded border border-green-800">Heal: {item.healAmount}</span>}
                            </div>

                            {/* HOVER TOOLTIP FIX: Using the fixed CSS trick to avoid clipping */}
                            {isGear && itemSlot && (
                              <div 
                                className="fixed z-[999] hidden group-hover:flex flex-col w-52 sm:w-56 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none"
                                style={{ transform: 'translateY(calc(-100% - 10px))' }}
                              >
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
                                          {eq1.damageDice && <span className="text-red-400">{eq1.damageDice} DMG</span>}
                                          {eq1.healAmount && <span className="text-emerald-400">+{eq1.healAmount} HP</span>}
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
                                          <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                            {eq2.acBonus && <span className="text-blue-300">+{eq2.acBonus} AC</span>}
                                            {eq2.damageDice && <span className="text-red-400">{eq2.damageDice} DMG</span>}
                                            {eq2.healAmount && <span className="text-emerald-400">+{eq2.healAmount} HP</span>}
                                          </div>
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

                {/* CURRENTLY EQUIPPED */}
                <div className="bg-[#0b0f19] border-2 border-slate-800 p-4 rounded-xl flex flex-col h-[500px]">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipped Gear</span>
                    <span className="text-[10px] text-slate-500 italic">Click slot to unequip</span>
                  </div>
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                    {gearSlots.map(slot => {
                      const item = character.equipment[slot.key];
                      return (
                        <div 
                          key={slot.key}
                          onClick={() => { if (item) unequipItem(slot.key); }}
                          className={`p-3 rounded-lg border flex flex-col justify-between h-24 transition-all shadow-inner ${item ? 'bg-slate-900 border-indigo-700 hover:border-red-500 cursor-pointer group' : 'bg-slate-950/40 border-slate-900 opacity-50'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 uppercase font-black text-[10px] tracking-widest">{slot.label}</span>
                            {item && <span className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">Unequip ↩</span>}
                          </div>
                          {item ? (
                            <div>
                              <span className="font-bold text-emerald-400 block truncate text-xs">{item.name || 'Item'}</span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {item.acBonus ? `+${item.acBonus} AC ` : ''}
                                {item.damageDice ? `1d${item.damageDice} Dmg` : ''}
                              </span>
                            </div>
                          ) : <span className="text-slate-600 italic text-xs font-bold">Empty</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div ref={containerRef} className="flex-1 overflow-y-auto relative p-4 flex items-center justify-center [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              <div className="relative w-[500px]" style={{ height: `${(maxRow + 1) * 110 + CANVAS_TOP_OFFSET + 100}px` }}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {nodes.map(node => {
                    const isVisible = node.row <= currentNode.row + 3;
                    if (!isVisible) return null;

                    return (node.connections || []).map(targetId => {
                      const target = nodes.find(n => n.id === targetId);
                      if (!target || target.row > currentNode.row + 3) return null;

                      const x1 = node.col * 160 + 60;
                      const y1 = (maxRow - node.row) * 110 + (CANVAS_TOP_OFFSET + 24); 
                      const x2 = target.col * 160 + 60;
                      const y2 = (maxRow - target.row) * 110 + (CANVAS_TOP_OFFSET + 24);
                      
                      const isPlayerPath = node.id === currentNodeId;
                      const isFuturePath = nextNodeIds.includes(node.id);

                      let strokeColor = '#334155'; let strokeWidth = '3'; let dash = 'none';
                      if (isPlayerPath) { strokeColor = '#34d399'; strokeWidth = '4'; dash = '6'; } 
                      else if (isFuturePath) { strokeColor = '#38bdf8'; strokeWidth = '3'; dash = '3'; }

                      return <line key={`${node.id}-${targetId}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dash} className={isPlayerPath ? 'animate-pulse' : ''} />;
                    });
                  })}
                </svg>

                {nodes.map(node => {
                  const isVisited = visitedIds.includes(node.id);
                  const isCurrent = node.id === currentNodeId;
                  const isNext = currentNode.connections.includes(node.id);
                  
                  const isVisible = node.row <= currentNode.row + 3;
                  if (!isVisible) return null;

                  let icon = '⚔️';
                  let colorBg = 'bg-red-950 border-red-700 text-red-300';
                  if (node.type === 'Entrance') { icon = '🚪'; colorBg = 'bg-slate-800 border-slate-600 text-slate-300'; }
                  else if (node.type === 'Merchant') { icon = '🪙'; colorBg = 'bg-yellow-950 border-yellow-700 text-yellow-300'; }
                  else if (node.type === 'Camp') { icon = '🏕️'; colorBg = 'bg-blue-950 border-blue-700 text-blue-300'; }
                  else if (node.type === 'Trap') { icon = '⚠️'; colorBg = 'bg-purple-950 border-purple-700 text-purple-300'; }
                  if (node.isBoss) { icon = '💀'; colorBg = 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'; }

                  const renderTop = (maxRow - node.row) * 110 + CANVAS_TOP_OFFSET;

                  return (
                    <div key={node.id} className="absolute group" style={{ left: `${node.col * 160 + 36}px`, top: `${renderTop}px` }}>
                      <button
                        disabled={!isNext} 
                        onClick={() => onSelectNode(node.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg font-bold text-lg
                          ${isCurrent ? 'ring-4 ring-indigo-400 bg-indigo-600 border-indigo-300 text-white scale-110 z-20 cursor-default' : 
                            isVisited ? 'bg-slate-900 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed' : 
                            isNext ? `${colorBg} hover:scale-110 cursor-pointer z-10 animate-bounce ring-2 ring-emerald-400` : 'bg-slate-950 border-slate-900 text-slate-700 opacity-40 cursor-not-allowed'}`}
                      >
                        {isVisited ? '✅' : icon}
                      </button>
                      
                      {isNext && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded shadow-xl border border-slate-600 whitespace-nowrap flex flex-col items-center gap-0.5">
                            <span className="font-bold text-amber-400 uppercase tracking-widest">{node.type}</span>
                            {node.type === 'Trap' && <span className="text-[8px] text-slate-300 border-t border-slate-600 pt-0.5 mt-0.5 w-full text-center">Requires {node.challengeStat}</span>}
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600 mt-[-1px]"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            RIGHT PANEL: CHARACTER SHEET & INVENTORY
        ========================================== */}
        <div className={`w-full lg:w-[400px] xl:w-[450px] bg-slate-900 border-l-4 border-slate-800 h-full flex flex-col p-4 sm:p-6 overflow-y-auto ${showMobileChar ? 'flex' : 'hidden lg:flex'} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest">{character.name}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Level {character.level} Adventurer</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={scrollToBackpack} 
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border bg-purple-900/50 hover:bg-purple-800 text-purple-300 border-purple-700 shadow-inner"
              >
                Backpack ({character.inventory?.length || 0})
              </button>
              {onReturnToDashboard && (
                <button onClick={onReturnToDashboard} className="p-2 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shadow-md border border-slate-700" title="Flee Campaign">
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
              {/* FIXED CSS TOOLTIP FOR CLIPPING */}
              <div className="fixed z-[999] hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] px-3 py-2 rounded shadow-xl pointer-events-none border border-slate-600 text-center" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
                <span className="font-bold text-indigo-400 mb-1 block">Armor Class (AC)</span>
                Determines how hard you are to hit. <br/>
                <span className="text-slate-400 mt-1 block border-t border-slate-600 pt-1">Base 10 + DEX Mod + Armor</span>
              </div>
            </div>
            <div className="bg-rose-950/30 border border-rose-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner cursor-help group relative">
              <span className="text-rose-400 font-black tracking-widest uppercase text-[8px] mb-1">Hit Chance</span>
              <span className="text-xl text-white font-black">{hitModifier >= 0 ? `+${hitModifier}` : hitModifier}</span>
              <div className="fixed z-[999] hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] px-3 py-2 rounded shadow-xl pointer-events-none border border-slate-600 text-center" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
                <span className="font-bold text-rose-400 mb-1 block">Hit Chance</span>
                Added to your d20 roll when attacking. <br/>
                <span className="text-slate-400 mt-1 block border-t border-slate-600 pt-1">Based on STR (Melee) or DEX (Ranged).</span>
              </div>
            </div>
            <div className="bg-orange-950/30 border border-orange-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner cursor-help group relative">
              <span className="text-orange-400 font-black tracking-widest uppercase text-[8px] mb-1">Damage</span>
              <span className="text-lg text-white font-black">{damageDisplay}</span>
              <div className="fixed z-[999] hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] px-3 py-2 rounded shadow-xl pointer-events-none border border-slate-600 text-center" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
                <span className="font-bold text-orange-400 mb-1 block">Weapon Damage</span>
                The damage rolled on a successful hit. <br/>
                <span className="text-slate-400 mt-1 block border-t border-slate-600 pt-1">Weapon Dice + Attack Mod</span>
              </div>
            </div>
          </div>

          <div className="mb-6 shrink-0">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2 border-b border-slate-800 pb-1">Equipped Gear</h4>
            <div className="grid grid-cols-4 gap-2">
              {gearSlots.map(slot => {
                const item = character.equipment[slot.key];
                return (
                  <div key={slot.key} onClick={() => { if (item) unequipItem(slot.key); }} className={`aspect-square rounded-lg border text-[8px] flex flex-col justify-center items-center transition-all shadow-inner ${item ? 'bg-slate-950 border-slate-700 hover:border-red-500 cursor-pointer group relative' : 'bg-slate-950/40 border-slate-900 opacity-50'}`}>
                    {item ? (
                      <>
                        {item.sprite ? <img src={item.sprite} alt={item.name} className="w-6 h-6 object-contain" style={{ imageRendering: 'pixelated' }} /> : <span className="text-emerald-400 font-bold truncate px-1 text-center w-full">{item.name}</span>}
                        {/* FIXED CSS TOOLTIP FOR CLIPPING */}
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
                    ) : <span className="text-slate-700 font-bold uppercase">{slot.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* INLINE BACKPACK LIST */}
          <div ref={inlineBackpackRef} className="flex flex-col shrink-0 mt-2 border-t-2 border-slate-800 pt-6">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2 border-b border-slate-800 pb-1">Backpack ({character.inventory.length})</h4>
            <div className="space-y-2 pr-1">
              {character.inventory.length === 0 ? (
                <span className="text-[10px] text-slate-600 italic py-4 text-center block">Empty</span>
              ) : (
                character.inventory.map((item, index) => {
                  const itemSlot = item.slotType || item.slot;
                  const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
                  const isRing = itemSlot?.toLowerCase().includes('ring');
                  
                  const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
                  const eq2 = isRing ? character.equipment.ring2 : null;

                  return (
                    <div key={`${item.uid || item.id}-${index}`} className="relative group p-2 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center hover:border-slate-600 transition-colors shadow-inner">
                      <div className="flex items-center gap-2">
                        {item.sprite ? <img src={item.sprite} alt={item.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-800 shadow-inner" style={{ imageRendering: 'pixelated' }} /> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-[6px] text-slate-500 shadow-inner">IMG</div>}
                        <div>
                          <span className="font-bold text-emerald-400 text-xs block">{item.name}</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">{item.type} {item.damageDice ? `• ${item.damageDice}` : ''} {item.acBonus ? `• +${item.acBonus}AC` : ''}</span>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {itemSlot ? (
                          isRing ? (
                            <div className="flex gap-1">
                              <button onClick={() => equipItem(item, 'ring1')} className="bg-slate-800 text-indigo-300 px-2 py-1 rounded text-[9px] font-bold border border-slate-700 hover:bg-indigo-600 hover:text-white cursor-pointer shadow-md">Ring 1</button>
                              <button onClick={() => equipItem(item, 'ring2')} className="bg-slate-800 text-indigo-300 px-2 py-1 rounded text-[9px] font-bold border border-slate-700 hover:bg-indigo-600 hover:text-white cursor-pointer shadow-md">Ring 2</button>
                            </div>
                          ) : (
                            <button onClick={() => equipItem(item, itemSlot)} className="bg-slate-800 text-white px-2 py-1 rounded text-[9px] font-bold border border-slate-700 hover:bg-indigo-600 cursor-pointer shadow-md">Equip</button>
                          )
                        ) : item.type === 'Consumable' ? (
                          <button onClick={() => useConsumable(item)} className="bg-slate-800 text-emerald-300 px-2 py-1 rounded text-[9px] font-bold border border-slate-700 hover:bg-emerald-600 hover:text-white cursor-pointer shadow-md">Use</button>
                        ) : (
                          <span className="text-slate-600 text-[9px] uppercase font-bold tracking-widest px-2">-</span>
                        )}
                      </div>

                      {/* FIXED CSS TOOLTIP FOR CLIPPING */}
                      {isGear && itemSlot && (
                        <div 
                          className="fixed z-[999] hidden group-hover:flex flex-col w-48 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none"
                          style={{ transform: 'translateY(calc(-100% - 10px))' }}
                        >
                          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Currently Equipped</span>
                          <div className={isRing ? "mb-2" : ""}>
                            <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">{isRing ? 'Slot: Ring 1' : 'Equipped Gear'}</span>
                            {eq1 ? (
                              <div className="flex items-center gap-2">
                                {eq1.sprite ? <img src={eq1.sprite} alt={eq1.name} className="w-6 h-6 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-6 h-6 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                                <div>
                                  <span className="text-cyan-300 font-bold text-[9px] block leading-tight">{eq1.name}</span>
                                  <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                    {eq1.acBonus && <span className="text-blue-300">+{eq1.acBonus} AC</span>}
                                    {eq1.damageDice && <span className="text-red-400">{eq1.damageDice} DMG</span>}
                                    {eq1.healAmount && <span className="text-emerald-400">+{eq1.healAmount} HP</span>}
                                  </div>
                                </div>
                              </div>
                            ) : <div className="text-slate-600 italic text-[9px] py-1 font-bold">Empty Slot</div>}
                          </div>

                          {isRing && (
                            <div className="border-t border-slate-700 pt-2">
                              <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Slot: Ring 2</span>
                              {eq2 ? (
                                <div className="flex items-center gap-2">
                                  {eq2.sprite ? <img src={eq2.sprite} alt={eq2.name} className="w-6 h-6 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-6 h-6 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                                  <div>
                                    <span className="text-cyan-300 font-bold text-[9px] block leading-tight">{eq2.name}</span>
                                    <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                      {eq2.acBonus && <span className="text-blue-300">+{eq2.acBonus} AC</span>}
                                      {eq2.damageDice && <span className="text-red-400">{eq2.damageDice} DMG</span>}
                                      {eq2.healAmount && <span className="text-emerald-400">+{eq2.healAmount} HP</span>}
                                    </div>
                                  </div>
                                </div>
                              ) : <div className="text-slate-600 italic text-[9px] py-1 font-bold">Empty Slot</div>}
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

      </div>
    </div>
  );
};

export default CampaignMapModal;