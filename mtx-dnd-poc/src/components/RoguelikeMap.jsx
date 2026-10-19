import React, { useEffect, useState, useRef } from 'react';

const TILE_SIZE = 48;

const RoguelikeMap = ({ character, floorLevel, mapData, playerPos, gameLog, movePlayer, onFlee }) => {
  const containerRef = useRef(null);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [showFleeConfirm, setShowFleeConfirm] = useState(false); // NEW STATE

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) e.preventDefault();
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': movePlayer(0, -1); break;
        case 'arrowdown': case 's': movePlayer(0, 1); break;
        case 'arrowleft': case 'a': movePlayer(-1, 0); break;
        case 'arrowright': case 'd': movePlayer(1, 0); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  useEffect(() => {
    if (containerRef.current && playerPos) {
      const targetX = (containerRef.current.clientWidth / 2) - (playerPos.x * TILE_SIZE) - (TILE_SIZE / 2);
      const targetY = (containerRef.current.clientHeight / 2) - (playerPos.y * TILE_SIZE) - (TILE_SIZE / 2);
      setCameraOffset({ x: targetX, y: targetY });
    }
  }, [playerPos]);

  if (!mapData || !mapData.grid) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 font-mono text-white">
        <h2 className="text-2xl font-black tracking-widest uppercase animate-pulse text-rose-500">Generating Floor {floorLevel}...</h2>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (character.health.current / character.health.max) * 100));

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#05050a] font-mono animate-in fade-in">
      
      {/* CONFIRMATION MODAL */}
      {showFleeConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border-4 border-rose-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-400 uppercase tracking-widest mb-4">Abandon Run?</h2>
            <p className="text-slate-400 font-bold mb-8 text-sm">Are you sure you want to leave the run? All temporary items and progress will be lost.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowFleeConfirm(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-xl transition-colors border border-slate-600 shadow-md">Cancel</button>
              <button onClick={onFlee} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-xl border-b-4 border-rose-800 transition-all shadow-lg active:translate-y-1 active:border-b-0">Yes, Leave</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border-b-4 border-slate-800 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div>
            <h2 className="text-2xl font-black text-rose-400 uppercase tracking-widest">Floor {floorLevel}</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Endless Tower Mode</span>
          </div>

          <div className="flex-1 max-w-[200px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">HP</span>
              <span className="text-[10px] text-white font-bold">{character.health.current} / {character.health.max}</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 border border-yellow-900/50 rounded-lg px-4 py-2 flex items-center gap-2 shadow-inner">
            <span className="text-xl drop-shadow-md">🪙</span>
            <span className="text-yellow-400 font-black">{character.currency.gold}</span>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowFleeConfirm(true)} className="px-4 py-2 bg-rose-900/50 hover:bg-rose-800 text-rose-300 border border-rose-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer">🚪 Abandon Run</button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#020204]" ref={containerRef}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-6 py-2 pointer-events-none shadow-lg">
          <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Use W, A, S, D to Move</span>
        </div>

        <div className="absolute transition-transform duration-150 ease-linear" style={{ transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`, width: mapData.grid[0].length * TILE_SIZE, height: mapData.grid.length * TILE_SIZE }}>
          {mapData.grid.map((row, y) => (
            row.map((cell, x) => {
              if (cell.visibility === 'unexplored') return <div key={`${x}-${y}`} className="absolute bg-black" style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />;

              const isPlayer = playerPos.x === x && playerPos.y === y;
              const enemy = mapData.enemies.find(e => e.x === x && e.y === y);
              const isVisible = cell.visibility === 'visible';
              
              let cellBg = cell.type === 'wall' ? 'bg-slate-800 border-slate-900 shadow-inner' : 'bg-slate-950 border-slate-800/30';
              let content = null;

              if (cell.entity === 'stairs') content = <span className="text-2xl animate-pulse drop-shadow-md">🌀</span>;
              if (cell.entity === 'chest' && isVisible) content = <span className="text-2xl drop-shadow-md">🧰</span>;
              if (cell.entity === 'trap' && isVisible) content = <span className="text-2xl opacity-50 drop-shadow-md">⚠️</span>;
              if (enemy && isVisible) content = <div className="w-4/5 h-4/5 bg-red-950/80 rounded-full border-2 border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.6)]"><span className="text-sm">👹</span></div>;
              if (isPlayer) content = <div className="w-3/4 h-3/4 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-emerald-300 z-40"><span className="font-bold text-slate-900 text-sm">P</span></div>;

              return (
                <div key={`${x}-${y}`} className={`absolute flex items-center justify-center border transition-opacity duration-300 ${cellBg} ${isVisible ? 'opacity-100' : 'opacity-30'}`} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                  {content}
                  {!isVisible && <div className="absolute inset-0 bg-black/60 pointer-events-none" />}
                </div>
              );
            })
          ))}
        </div>
      </div>

      <div className="h-32 bg-slate-900 border-t-4 border-slate-800 p-4 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700">
        <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Tower Log</h4>
        <div className="space-y-1">
          {gameLog.map((log, i) => (
            <div key={i} className={`text-xs leading-tight ${i === 0 ? 'text-white font-bold' : 'text-slate-500'}`}>&gt; {log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoguelikeMap;