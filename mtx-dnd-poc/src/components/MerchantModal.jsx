import React, { useState, useEffect } from 'react';
import itemsCatalog from '../data/mockItems.json';

const MerchantModal = ({ character, campaign, buyItem, sellItem, onClose }) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [wares, setWares] = useState([]);

  useEffect(() => {
    const shopTier = campaign?.tier || Math.min(10, Math.max(1, Math.ceil((character?.level || 1) / 3)));

    const availableConsumables = itemsCatalog.filter(i => i.type === 'Consumable' && (i.tier || 1) <= shopTier);
    const availableGear = itemsCatalog.filter(i => i.type !== 'Material' && i.type !== 'Consumable' && (i.tier || 1) <= shopTier);

    const chosenConsumable = availableConsumables.length > 0 
      ? availableConsumables[Math.floor(Math.random() * availableConsumables.length)]
      : null;
    
    const remainingPool = [...availableConsumables, ...availableGear].filter(i => i.id !== chosenConsumable?.id);
    const shuffledRemaining = remainingPool.sort(() => 0.5 - Math.random()).slice(0, 4);

    let initialWares = [chosenConsumable, ...shuffledRemaining].filter(Boolean);
    
    initialWares = initialWares.map(item => ({
        ...item,
        shopUid: crypto.randomUUID(),
        stock: item.type === 'Consumable' ? Math.floor(Math.random() * 4) + 2 : 1
    }));

    setWares(initialWares.sort(() => 0.5 - Math.random()));
  }, [campaign?.tier, character?.level]);

  const handleLocalBuy = (shopItem) => {
    if ((character?.currency?.gold || 0) < shopItem.price || shopItem.stock <= 0) return;
    buyItem(shopItem);
    setWares(prev => prev.map(w => 
      w.shopUid === shopItem.shopUid ? { ...w, stock: w.stock - 1 } : w
    ));
  };

  const getItemRarity = (price) => {
    if (price >= 2000) return { label: 'Artifact', color: 'text-orange-400', bg: 'bg-orange-900 text-orange-200 border-orange-700', border: 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' };
    if (price >= 500) return { label: 'Epic', color: 'text-purple-400', bg: 'bg-purple-900 text-purple-200 border-purple-700', border: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]' };
    if (price >= 100) return { label: 'Rare', color: 'text-blue-400', bg: 'bg-blue-900 text-blue-200 border-blue-700', border: 'border-blue-500' };
    return { label: 'Common', color: 'text-slate-300', bg: 'bg-slate-800 text-slate-300 border-slate-600', border: 'border-slate-700' };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono animate-in fade-in">
      <div className="bg-[#0b0f19] border-4 border-yellow-500 rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-widest flex items-center gap-3">
              <span>Merchant</span>
              <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-700 normal-case tracking-normal">
                Tier {campaign?.tier || 1} Stock
              </span>
            </h2>
            <p className="text-sm text-slate-400 italic mt-1">"Ah, looking for standard steel or legendary magic?"</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
            <span className="text-yellow-500 font-black">🪙</span>
            <span className="text-yellow-400 font-black">{character?.currency?.gold || 0} Gold</span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 font-black uppercase tracking-widest rounded-lg transition-all text-xs ${activeTab === 'buy' ? 'bg-yellow-600 text-slate-900 shadow-md' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
          >
            Buy Wares
          </button>
          <button 
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 font-black uppercase tracking-widest rounded-lg transition-all text-xs ${activeTab === 'sell' ? 'bg-yellow-600 text-slate-900 shadow-md' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
          >
            Sell Gear / Junk ({character?.inventory?.length || 0})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full pb-4">
          
          {activeTab === 'buy' && (
            wares.map((shopItem, index) => {
              const rarity = getItemRarity(shopItem.price);
              const canAfford = (character?.currency?.gold || 0) >= shopItem.price;
              const isOutOfStock = shopItem.stock <= 0;
              const isGear = shopItem.type === 'Weapon' || shopItem.type === 'Armor' || shopItem.type === 'Accessory';
              const itemSlot = shopItem.slotType;
              const isRing = itemSlot?.toLowerCase().includes('ring');
              
              const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
              const eq2 = isRing ? character.equipment.ring2 : null;

              return (
                <div key={`buy-${shopItem.shopUid}-${index}`} className={`relative group bg-[#111827] border-2 rounded-xl p-3 flex justify-between items-center transition-colors ${rarity.border} ${isOutOfStock ? 'opacity-50 grayscale' : 'hover:bg-[#1f2937]'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-slate-900 rounded-lg border border-slate-800 shadow-inner">
                      {shopItem.sprite ? (
                        <img src={shopItem.sprite} alt={shopItem.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold truncate">IMG</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-black ${rarity.color} text-sm drop-shadow-md`}>{shopItem.name || 'Unknown Item'}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border ${rarity.bg}`}>
                          {rarity.label}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase font-black tracking-widest">
                          {isGear ? 'Gear' : 'Consumable'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        {shopItem.type} {shopItem.slotType ? `(${shopItem.slotType})` : ''} 
                        {shopItem.acBonus ? <span className="text-cyan-400 ml-1">• +{shopItem.acBonus} AC</span> : ''} 
                        {shopItem.damageDice ? <span className="text-orange-400 ml-1">• {shopItem.damageDice} DMG</span> : ''} 
                        {shopItem.healAmount ? <span className="text-emerald-400 ml-1">• +{shopItem.healAmount} HP</span> : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                      In Stock: {shopItem.stock}
                    </span>
                    <button 
                      onClick={() => handleLocalBuy(shopItem)}
                      disabled={!canAfford || isOutOfStock}
                      className={`w-28 py-2 rounded-lg font-black text-xs transition-all shadow-md z-10 
                        ${isOutOfStock ? 'bg-slate-800 text-slate-600 border border-slate-700' : 
                          canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-900 border-b-2 border-yellow-800 active:translate-y-0.5 cursor-pointer' : 
                          'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                    >
                      {isOutOfStock ? 'SOLD OUT' : `${shopItem.price} GOLD`}
                    </button>
                  </div>

                  {isGear && itemSlot && !isOutOfStock && (
                    <div className="absolute bottom-full left-16 mb-2 hidden group-hover:flex flex-col w-56 p-3 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-[150] pointer-events-none">
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Currently Equipped</span>
                      <div className={isRing ? "mb-2" : ""}>
                        <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">{isRing ? 'Slot: Ring 1' : 'Equipped Gear'}</span>
                        {eq1 ? (
                          <div className="flex items-center gap-2">
                            {eq1.sprite ? <img src={eq1.sprite} alt={eq1.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                            <div>
                              <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq1.name}</span>
                              <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                {eq1.acBonus && <span className="text-blue-300">+{eq1.acBonus} AC</span>}
                                {eq1.damageDice && <span className="text-red-400">{eq1.damageDice} DMG</span>}
                                {eq1.healAmount && <span className="text-emerald-400">+{eq1.healAmount} HP</span>}
                              </div>
                            </div>
                          </div>
                        ) : <div className="text-slate-600 italic text-[10px] py-1">Empty Slot</div>}
                      </div>

                      {isRing && (
                        <div className="border-t border-slate-700 pt-2">
                          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Slot: Ring 2</span>
                          {eq2 ? (
                            <div className="flex items-center gap-2">
                              {eq2.sprite ? <img src={eq2.sprite} alt={eq2.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                              <div>
                                <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq2.name}</span>
                                <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                  {eq2.acBonus && <span className="text-blue-300">+{eq2.acBonus} AC</span>}
                                  {eq2.damageDice && <span className="text-red-400">{eq2.damageDice} DMG</span>}
                                  {eq2.healAmount && <span className="text-emerald-400">+{eq2.healAmount} HP</span>}
                                </div>
                              </div>
                            </div>
                          ) : <div className="text-slate-600 italic text-[10px] py-1">Empty Slot</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {activeTab === 'sell' && (
            (!character?.inventory || character.inventory.length === 0) ? (
              <div className="text-center text-slate-500 italic py-12 border-2 border-dashed border-slate-800 rounded-xl">Your backpack is completely empty.</div>
            ) : (
              character.inventory.map((item, idx) => {
                const itemSlot = item.slotType || item.slot;
                const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
                const isRing = itemSlot?.toLowerCase().includes('ring');
                const eq1 = isRing ? character.equipment.ring1 : (itemSlot ? character.equipment[itemSlot] : null);
                const eq2 = isRing ? character.equipment.ring2 : null;

                return (
                  <div key={`sell-${item.uid || item.id}-${idx}`} className="relative group bg-slate-900 border border-slate-700 rounded-xl p-3 flex justify-between items-center hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-slate-950 rounded-lg border border-slate-800">
                        {item.sprite ? (
                          <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="text-[9px] text-slate-600 font-bold truncate">IMG</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 text-sm">{item.name || 'Unknown Item'}</span>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-widest">{item.type || 'Item'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => sellItem(item)}
                      className="w-28 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-black border border-slate-600 transition-colors cursor-pointer"
                    >
                      SELL FOR {item.value}G
                    </button>

                    {isGear && itemSlot && (
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col w-56 p-3 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-[150] pointer-events-none">
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-700 pb-1 mb-2">Currently Equipped</span>
                        <div className={isRing ? "mb-2" : ""}>
                          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">{isRing ? 'Slot: Ring 1' : 'Equipped Gear'}</span>
                          {eq1 ? (
                            <div className="flex items-center gap-2">
                              {eq1.sprite ? <img src={eq1.sprite} alt={eq1.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                              <div>
                                <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq1.name}</span>
                                <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                  {eq1.acBonus && <span className="text-blue-300">+{eq1.acBonus} AC</span>}
                                  {eq1.damageDice && <span className="text-red-400">{eq1.damageDice} DMG</span>}
                                </div>
                              </div>
                            </div>
                          ) : <div className="text-slate-600 italic text-[10px] py-1">Empty Slot</div>}
                        </div>
                        {isRing && (
                          <div className="border-t border-slate-700 pt-2">
                            <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Slot: Ring 2</span>
                            {eq2 ? (
                              <div className="flex items-center gap-2">
                                {eq2.sprite ? <img src={eq2.sprite} alt={eq2.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-700" style={{ imageRendering: 'pixelated' }} /> : <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 shrink-0" />}
                                <div>
                                  <span className="text-cyan-300 font-bold text-[10px] block leading-tight">{eq2.name}</span>
                                  <div className="flex gap-1 mt-0.5 text-[8px] font-bold">
                                    {eq2.acBonus && <span className="text-blue-300">+{eq2.acBonus} AC</span>}
                                    {eq2.damageDice && <span className="text-red-400">{eq2.damageDice} DMG</span>}
                                  </div>
                                </div>
                              </div>
                            ) : <div className="text-slate-600 italic text-[10px] py-1">Empty Slot</div>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest rounded-xl transition-colors text-xs cursor-pointer shadow-md border-b-4 border-slate-900 active:translate-y-1"
          >
            Leave Shop & Continue Journey 🚪
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantModal;