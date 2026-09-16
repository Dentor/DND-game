import React, { useState, useEffect } from 'react';
import itemsCatalog from '../data/mockItems.json';

const MerchantModal = ({ character, campaign, buyItem, sellItem, onClose }) => {
  const [merchantInventory, setMerchantInventory] = useState([]);
  const backpack = character.inventory || [];
  const currentTier = campaign?.tier || 1;

  // Generate the Merchant's Inventory on load
  useEffect(() => {
    const shop = [];
    
    // 1. Guarantee exactly 2 consumables (Potions, Bombs, Daggers <= current tier)
    const consumables = itemsCatalog.filter(i => i.type === 'Consumable' && (i.tier || 1) <= currentTier);
    for (let i = 0; i < 2; i++) {
      if (consumables.length > 0) {
        const randomConsumable = consumables[Math.floor(Math.random() * consumables.length)];
        shop.push({ ...randomConsumable, uid: crypto.randomUUID() });
      }
    }

    // 2. Standard Mundane Gear (Exactly matching the current tier)
    const standardGear = itemsCatalog.filter(i => 
      (i.type === 'Weapon' || i.type === 'Armor' || i.type === 'Accessory') && 
      (i.tier || 1) === currentTier && 
      i.rarity !== 'Magical' && 
      i.rarity !== 'Artifact'
    );
    
    // Add 2 to 4 standard items
    const numStandard = Math.floor(Math.random() * 3) + 2; 
    for (let i = 0; i < numStandard; i++) {
      if (standardGear.length > 0) {
        const randomGear = standardGear[Math.floor(Math.random() * standardGear.length)];
        shop.push({ ...randomGear, uid: crypto.randomUUID() });
      }
    }

    setMerchantInventory(shop);
  }, [currentTier]);

  const renderItemCard = (item, isShop, index) => {
    const isGear = item.type === 'Weapon' || item.type === 'Armor' || item.type === 'Accessory';
    const canAfford = character.currency.gold >= item.price;
    const isMagical = item.rarity === 'Magical' || item.rarity === 'Artifact';

    return (
      <div key={item.uid || `${item.id}-${index}`} className={`relative group bg-[#111827] border ${isMagical ? 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'border-slate-800'} rounded-xl p-3 flex justify-between items-center transition-colors hover:border-amber-500 shadow-md`}>
        
        {/* MERGED FIX: ITEM STACK BADGE FOR BACKPACK INVENTORY */}
        {!isShop && item.quantity > 1 && (
          <div className="absolute -top-2 -left-2 bg-amber-500 text-slate-900 font-black text-xs px-2 py-0.5 rounded-full shadow-md border-2 border-slate-900 z-20 pointer-events-none">
            x{item.quantity}
          </div>
        )}

        <div className="flex items-center gap-3">
          {item.sprite ? (
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 bg-slate-900 rounded border ${isMagical ? 'border-cyan-700' : 'border-slate-800'} shadow-inner`}>
              <img src={item.sprite} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
            </div>
          ) : (
            <div className={`w-10 h-10 bg-slate-900 rounded border ${isMagical ? 'border-cyan-700' : 'border-slate-800'} flex items-center justify-center text-[6px] text-slate-500 shadow-inner`}>IMG</div>
          )}
          <div>
            <div className={`font-bold text-xs ${isMagical ? 'text-cyan-400' : 'text-emerald-400'}`}>{item.name}</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
              {item.type} {item.slotType ? `• ${item.slotType}` : ''}
            </div>
            {/* Price Tag */}
            <div className="text-[10px] font-black mt-1 text-yellow-400">
              {isShop ? `${item.price}g` : `+${item.value || Math.floor((item.price || 10) / 2)}g`}
            </div>
          </div>
        </div>
        
        {isShop ? (
          <button 
            onClick={() => {
              if (canAfford) {
                buyItem(item);
                setMerchantInventory(prev => prev.filter(i => i.uid !== item.uid));
              }
            }} 
            disabled={!canAfford}
            className="bg-amber-900/50 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-amber-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-amber-800 shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer z-10"
          >
            Buy
          </button>
        ) : (
          <button 
            onClick={() => sellItem(item)} 
            className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 shadow-md transition-all active:translate-y-0.5 uppercase tracking-wider cursor-pointer z-10"
          >
            Sell
          </button>
        )}

        {/* Hover Stats Tooltip - Fixed positioning prevents clipping */}
        {isGear && (
          <div className="fixed z-[999] hidden group-hover:flex flex-col w-48 p-3 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none" style={{ transform: 'translateY(calc(-100% - 10px))' }}>
            <span className={`${isMagical ? 'text-cyan-400' : 'text-emerald-400'} font-black text-xs mb-1`}>{item.name}</span>
            <span className="text-slate-300 text-[10px] uppercase tracking-wider">{item.type} • {item.slotType}</span>
            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-600">
              {item.acBonus && <span className="text-cyan-300 font-bold text-[10px]">+{item.acBonus} AC</span>}
              {item.damageDice && <span className="text-orange-400 font-bold text-[10px]">{item.damageDice} DMG</span>}
              {item.healAmount && <span className="text-emerald-400 font-bold text-[10px]">+{item.healAmount} HP</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-mono animate-in fade-in">
      <div className="bg-[#0b0f19] border-4 border-amber-600 rounded-2xl p-6 max-w-5xl w-full shadow-2xl flex flex-col h-[85vh]">
        
        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-3">🛒 Wandering Merchant</h3>
            <p className="text-xs text-slate-400 italic mt-1">"Got some solid gear and fresh supplies on offer today, traveler. If you have the coin."</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl flex items-center justify-center shadow-inner">
              <span className="font-black text-yellow-400 text-sm drop-shadow-md">🪙 {character.currency.gold} Gold</span>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md border border-slate-600">✕</button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          
          {/* LEFT: MERCHANT SHOP */}
          <div className="flex-1 flex flex-col bg-slate-950 border-2 border-amber-900/50 rounded-xl overflow-hidden shadow-inner relative">
            <div className="absolute inset-0 bg-amber-900/5 pointer-events-none" />
            <div className="bg-slate-900 p-3 border-b border-amber-900/50 flex justify-between items-center shrink-0 relative z-10">
              <span className="font-black text-amber-400 uppercase tracking-widest text-xs">Tier {currentTier} Supplies</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative z-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-amber-700">
              {merchantInventory.length === 0 ? (
                <div className="text-center text-amber-700/50 italic py-12">"I'm completely sold out, friend."</div>
              ) : (
                merchantInventory.map((item, index) => renderItemCard(item, true, index))
              )}
            </div>
          </div>

          {/* RIGHT: BACKPACK (SELL) */}
          <div className="flex-1 flex flex-col bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="font-black text-slate-400 uppercase tracking-widest text-xs">🎒 Sell from Backpack</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {backpack.length === 0 ? (
                <div className="text-center text-slate-600 italic py-12">Your backpack is empty.</div>
              ) : (
                backpack.map((item, index) => renderItemCard(item, false, index))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MerchantModal;