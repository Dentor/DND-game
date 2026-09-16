import React from 'react';

const PartyLobby = ({ character, isPlayerReady, onToggleReady }) => {
  // Mocking connected players for the UI demonstration
  const partyMembers = [
    { id: 'host', name: character.name, level: character.level, role: 'Party Leader', isReady: isPlayerReady, isYou: true },
    { id: 'guest1', name: 'Thorin', level: character.level, role: 'Member', isReady: true, isYou: false },
    { id: 'guest2', name: 'Elara', level: Math.max(1, character.level - 1), role: 'Member', isReady: false, isYou: false },
  ];

  const allReady = partyMembers.every(m => m.isReady);

  return (
    <div className="bg-slate-950 border-2 border-slate-800 rounded-xl p-4 flex flex-col gap-3 h-full shadow-inner animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className="text-indigo-400 font-black uppercase tracking-widest text-xs">Multiplayer Lobby</span>
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          {partyMembers.filter(m => m.isReady).length} / {partyMembers.length} Ready
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {partyMembers.map(member => (
          <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${member.isReady ? 'bg-emerald-950/20 border-emerald-900' : 'bg-slate-900 border-slate-700'} ${member.isYou ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : ''}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{member.name}</span>
                {member.isYou && <span className="bg-indigo-600 text-white text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-black">You</span>}
              </div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Level {member.level} {member.role}</span>
            </div>
            
            <div className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest border ${member.isReady ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500 border-slate-600'}`}>
              {member.isReady ? 'Ready' : 'Waiting...'}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onToggleReady}
        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:translate-y-1 ${isPlayerReady ? 'bg-amber-600 hover:bg-amber-500 text-slate-900 border-b-4 border-amber-800' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-b-4 border-emerald-800'}`}
      >
        {isPlayerReady ? 'Cancel Ready' : 'Ready Up'}
      </button>

      {/* Host Only Launch Button (Mocked) */}
      <div className="pt-2">
        <button 
          disabled={!allReady}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-lg transition-colors cursor-pointer"
        >
          {allReady ? 'Host: Launch Expedition' : 'Waiting for party...'}
        </button>
      </div>
    </div>
  );
};

export default PartyLobby;