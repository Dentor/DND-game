import React from 'react';

const CombatSidebar = ({ monsters, visibleTiles, combatLogs, logEndRef }) => {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      
      {/* TARGET HEALTH STATUS */}
      <div className="bg-slate-900 border border-red-900/50 p-3 rounded-xl shadow-inner shrink-0">
        <span className="text-red-400 font-bold block uppercase tracking-wider mb-2 border-b border-red-950 pb-1.5 text-xs">Target Health Status</span>
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-red-900">
          {monsters.filter(m => visibleTiles.has(`${m.x},${m.y}`)).map(m => (
            <div key={m.id} className={`flex justify-between items-center text-xs ${m.hp <= 0 ? 'line-through opacity-40 text-slate-500' : 'text-slate-300'}`}>
              <span className="truncate pr-2">M{m.id + 1}: {m.title}</span>
              <span className={`font-black shrink-0 ${m.hp > 0 ? 'text-red-400' : 'text-slate-600'}`}>{Math.max(0, m.hp)} / {m.maxHp} HP</span>
            </div>
          ))}
          {monsters.filter(m => visibleTiles.has(`${m.x},${m.y}`)).length === 0 && (
            <span className="text-slate-500 italic block py-2 text-xs text-center">No enemies in line of sight...</span>
          )}
        </div>
      </div>

      {/* COMBAT LOG */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-inner flex-1 flex flex-col min-h-[120px] overflow-hidden">
        <h4 className="text-slate-500 text-[10px] font-black mb-2 uppercase tracking-widest border-b border-slate-800 pb-1.5 shrink-0">Combat Log</h4>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-600">
          {combatLogs.map((msg, i) => (
            <div key={i} className={`text-[10px] leading-tight ${i === combatLogs.length - 1 ? 'text-white font-bold' : 'text-slate-500'}`}>
              &gt; {msg}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

    </div>
  );
};

export default CombatSidebar;