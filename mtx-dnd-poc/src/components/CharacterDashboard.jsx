import React from 'react';
import CombatStatCard from './CombatStatCard';

const getMod = (score) => Math.floor((score - 10) / 2);

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

const CharacterDashboard = ({ 
  character, 
  campaign, 
  onClose, 
  onOpenSpellbook, 
  onOpenBackpack, 
  onResetGame, 
  unequipItem 
}) => {
  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));
  const xpPercent = Math.max(0, Math.min(100, (character.xp.current / character.xp.nextLevel) * 100));

  const strMod = getMod(character.stats.strength);
  const dexMod = getMod(character.stats.dexterity);
  const mainHand = character.equipment?.mainHand;
  
  const isRanged = mainHand?.range > 1; 
  const hitModifier = isRanged ? dexMod : strMod;
  const scalingStatLabel = isRanged ? 'DEX' : 'STR';
  
  const modString = hitModifier === 0 ? '' : hitModifier > 0 ? ` + ${hitModifier}` : ` - ${Math.abs(hitModifier)}`;
  const damageDiceValue = mainHand?.damageDice || 1; 
  const damageDisplay = mainHand ? `1d${damageDiceValue}${modString}` : `1${modString}`;

  // Reverse calculate the gear bonus for the UI formula
  const gearAcBonus = character.armorClass - 10 - dexMod;

  return (
    <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col relative w-full h-full">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors cursor-pointer">✕</button>
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
          <button onClick={onOpenSpellbook} className="bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 px-4 py-2 rounded-xl text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">📖 Spellbook</button>
          {campaign && (
            <button onClick={onOpenBackpack} className="bg-purple-900/50 hover:bg-purple-800 border border-purple-700 px-4 py-2 rounded-xl text-purple-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">🎒 Backpack ({character.inventory?.length || 0})</button>
          )}
          <button 
            onClick={onResetGame} 
            className="bg-red-900/50 hover:bg-red-800 border border-red-700 px-4 py-2 rounded-xl text-red-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Reset Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-y-2 border-slate-800 py-6">
        
        {/* COMPACT EXPERIENCE BAR */}
        <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-8 relative overflow-hidden shadow-inner flex items-center justify-between px-4">
          <div className="bg-emerald-600 h-full transition-all duration-500 absolute left-0 top-0" style={{ width: `${xpPercent}%` }} />
          <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
            <span className="text-sm">✨</span> Experience
          </span>
          <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md tracking-widest">
            {character.xp.current} / {character.xp.nextLevel} XP
          </span>
        </div>

        {/* COMPACT HEALTH BAR */}
        <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-full h-8 relative overflow-hidden shadow-inner flex items-center justify-between px-4">
          <div className="bg-red-600 h-full transition-all duration-500 absolute left-0 top-0" style={{ width: `${hpPercent}%` }} />
          <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
            <span className="text-sm">❤️</span> Health
          </span>
          <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md tracking-widest">
            {character.health.current} / {character.health.max} HP
          </span>
        </div>

      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
        <div className="bg-slate-950 border-2 border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-inner w-full lg:w-auto">
          <CombatStatCard 
            title="Armor Class" 
            value={character.armorClass} 
            description="Your total physical defense. Incoming attacks must roll equal to or higher than this number to deal damage." 
            formula={`10 (Base) + ${dexMod} (DEX Mod) + ${gearAcBonus} (Gear Bonus)`} 
            colorTheme="indigo" 
          />
          <div className="w-full sm:w-px h-px sm:h-12 bg-slate-800 shrink-0"></div>
          
          <CombatStatCard 
            title="Hit Chance" 
            value={hitModifier >= 0 ? `+${hitModifier}` : hitModifier} 
            description="Your accuracy in combat. This modifier is added to all of your d20 weapon attack rolls." 
            formula={`${hitModifier} (${scalingStatLabel} Modifier)`} 
            colorTheme="rose" 
          />
          <div className="w-full sm:w-px h-px sm:h-12 bg-slate-800 shrink-0"></div>
          
          <CombatStatCard 
            title="Damage" 
            value={damageDisplay} 
            description="The amount of physical damage you inflict upon landing a successful weapon attack." 
            formula={`1d${damageDiceValue} (Weapon) ${modString} (${scalingStatLabel} Mod)`} 
            colorTheme="orange" 
          />
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
              <div key={slot.key} onClick={() => item && unequipItem(slot.key)} className="relative group bg-slate-950 border-2 border-dashed border-slate-800 hover:border-solid hover:border-slate-500 rounded-xl aspect-square flex flex-col items-center justify-center transition-all cursor-pointer overflow-visible shadow-inner p-2 sm:p-4">
                {item ? (
                  <>
                    {item.sprite ? <img src={item.sprite} alt={item.name} className="w-full h-full object-contain drop-shadow-md" style={{ imageRendering: 'pixelated' }} /> : <span className="text-emerald-400 text-[9px] font-bold text-center px-1 truncate w-full">{item.name}</span>}
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
                ) : <span className="text-slate-700 text-[10px] uppercase tracking-widest font-bold">{slot.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CharacterDashboard;