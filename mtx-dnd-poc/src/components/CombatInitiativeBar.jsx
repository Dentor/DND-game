import React from 'react';

const CombatInitiativeBar = ({ combatQueue, turnIndex, monsters, visibleTiles }) => {
  return (
    <div className="bg-slate-900 border-b-4 border-slate-800 p-2 flex items-center overflow-x-auto gap-2 shrink-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-indigo-700">
      <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest mr-2 shrink-0">Initiative:</span>
      
      {combatQueue.map((actor, idx) => {
        const isCurrent = idx === turnIndex;
        let displayName = actor.name;
        let displayIcon = actor.isPlayer ? '👤' : '👹';
        let isDead = false;
        let isHidden = false;

        if (!actor.isPlayer) {
          const m = monsters.find(m => m.id === actor.monsterId);
          if (!m) return null;
          isDead = m.hp <= 0;
          if (isDead) {
            displayIcon = '💀';
            displayName = m.title;
          } else if (!visibleTiles.has(`${m.x},${m.y}`)) {
            isHidden = true;
            displayIcon = '❓';
            displayName = 'Unknown Entity';
          } else {
            displayName = m.title;
          }
        }

        return (
          <div key={actor.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 shrink-0 transition-all ${isCurrent ? 'bg-indigo-600 border-indigo-300 scale-105 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-10 text-white' : isDead ? 'bg-slate-950 border-slate-800 opacity-40 text-slate-600' : isHidden ? 'bg-slate-900 border-slate-700 text-slate-400 border-dashed' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
            <span className="text-xs">{displayIcon}</span>
            <span className="text-[10px] font-bold uppercase whitespace-nowrap">{displayName}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CombatInitiativeBar;