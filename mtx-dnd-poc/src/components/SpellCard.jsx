import React from 'react';

const SpellCard = ({ spell, charges, isInteractive, isDisabled, onSelect, characterStats }) => {
  // Calculate max charges so the tooltip can show "3 / 4"
  const wisBonus = Math.floor(characterStats.wisdom / 4);
  const dexBonus = Math.floor(characterStats.dexterity / 4);
  const maxUses = spell.baseUses + wisBonus + dexBonus;

  return (
    <div className="relative group h-full">
      <button 
        onClick={() => {
          if (isInteractive && !isDisabled) {
            onSelect(spell);
          }
        }}
        disabled={isDisabled}
        className={`w-full h-full text-left bg-slate-950 border-2 p-4 rounded-xl flex flex-col justify-between transition-all outline-none ${
          isInteractive
            ? isDisabled
              ? 'border-slate-800 opacity-50 cursor-not-allowed'
              : 'border-slate-700 hover:border-cyan-500 hover:bg-slate-900 cursor-pointer shadow-md'
            : 'border-slate-800 cursor-default hover:border-slate-600'
        }`}
      >
        <div>
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-cyan-300 text-sm">{spell.name}</span>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-cyan-400 uppercase border border-slate-800 font-bold shrink-0 ml-2">
              {spell.element} {spell.type}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Tier {spell.tier} • Range: {spell.range} • Rad: {spell.radius}
          </div>

          <div className="text-xs text-slate-300 font-bold mb-3 flex items-center gap-2">
            {spell.sprite && (
              <img src={spell.sprite} alt={spell.name} className="w-8 h-8 object-contain bg-slate-900 rounded border border-slate-800 p-0.5 shrink-0" style={{ imageRendering: 'pixelated' }} />
            )}
            <div>
              {spell.category === 'damage' && (
                <span className="text-red-400 block">1d{spell.damageDice} + {spell.scalingStat === 'intelligence' ? 'INT' : 'STR'} Dmg</span>
              )}
              {spell.category === 'heal' && (
                <span className="text-emerald-400 block">+{spell.healAmount} HP Heal</span>
              )}
              {spell.category === 'movement' && (
                <span className="text-indigo-400 block">Movement Ability</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs mt-auto">
          <span className="text-slate-400">Charges Left:</span>
          <span className={`font-black ${charges > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
            {charges} / {maxUses}
          </span>
        </div>
      </button>

      {/* HOVER TOOLTIP */}
      <div 
        className="fixed z-[999] hidden group-hover:flex flex-col w-64 p-4 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none"
        style={{ transform: 'translate(calc(-50% + 50%), calc(-100% - 10px))' }} 
      >
        <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2">
          <span className="text-cyan-400 font-black text-sm">{spell.name}</span>
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Tier {spell.tier}</span>
        </div>
        
        <p className="text-slate-300 text-xs italic leading-relaxed mb-3">
          "{spell.description}"
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold bg-slate-900 p-2 rounded border border-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Range:</span>
            <span className="text-slate-300">{spell.range > 0 ? spell.range : 'Self'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Radius:</span>
            <span className="text-slate-300">{spell.radius}x{spell.radius}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Scales With:</span>
            <span className="text-amber-400 uppercase">{spell.scalingStat === 'intelligence' ? 'INT' : spell.scalingStat === 'strength' ? 'STR' : spell.scalingStat === 'dexterity' ? 'DEX' : 'WIS'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Base Uses:</span>
            <span className="text-yellow-400">{spell.baseUses}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpellCard;