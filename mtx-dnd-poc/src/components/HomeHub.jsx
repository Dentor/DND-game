import React, { useState, useEffect, useRef } from 'react';

// Basic BFS pathfinding for free movement in the hub
const getBfsPath = (start, goal, isBlockedFn, cols, rows) => {
  const queue = [{ x: start.x, y: start.y, path: [] }];
  const visited = new Set([`${start.x},${start.y}`]);
  const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.x === goal.x && curr.y === goal.y) return curr.path;

    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited.has(key) && !isBlockedFn(nx, ny)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
};

const getDistance = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

const HomeHub = ({ character, healCharacter, onOpenExpedition, onOpenDashboard, onOpenBackpack, onOpenStash }) => {
  const COLS = 14;
  const ROWS = 8;
  
  const [playerPos, setPlayerPos] = useState({ x: 3, y: 4 });
  const [isMoving, setIsMoving] = useState(false);
  const [targetPos, setTargetPos] = useState(null);
  const [sysMessage, setSysMessage] = useState("Welcome home. Click to move. Click objects to interact.");
  const moveIntervalRef = useRef(null);

  const [isGuestListOpen, setIsGuestListOpen] = useState(false);

  const activeGuests = [
    { id: 'host', name: character.name, role: 'Host', status: 'Online', class: 'Adventurer' },
    { id: 'g1', name: 'Thorin', role: 'Guest', status: 'Online', class: 'Warrior' },
    { id: 'g2', name: 'Elara', role: 'Guest', status: 'Online', class: 'Mage' }
  ];

  // Define static walls (x=6, leaving y=4 open for a door)
  const walls = new Set(['6,0', '6,1', '6,2', '6,3', '6,5', '6,6', '6,7']);

  // INTERACTABLES WITH CUSTOM SPRITES & SPAN DIMENSIONS
  const interactables = [
    { 
      id: 'bed', type: 'Bed', cells: ['0,0', '1,0', '0,1', '1,1'], spanX: 2, spanY: 2, 
      sprite: '/src/assets/house/bad_01.png', tooltip: 'Long Rest (Restore HP & Spells)', 
      action: () => { healCharacter(); setSysMessage("You rested peacefully. HP and Spells fully restored."); } 
    },
    { 
      id: 'chest', type: 'Stash Chest', cells: ['8,0', '9,0'], spanX: 2, spanY: 1, 
      sprite: '/src/assets/house/chest_01.png', tooltip: 'Personal Stash (Locked to others)', 
      action: onOpenStash 
    },
    { 
      id: 'expedition', type: 'Expedition Table', cells: ['12,6', '13,6', '12,7', '13,7'], spanX: 2, spanY: 2, 
      sprite: '/src/assets/house/backpack_01.png', tooltip: 'Launch Expedition', 
      action: onOpenExpedition 
    }
  ];

  const getInteractableAt = (x, y) => interactables.find(obj => obj.cells.includes(`${x},${y}`));

  const isBlocked = (x, y) => {
    if (walls.has(`${x},${y}`)) return true;
    if (getInteractableAt(x, y)) return true;
    return false;
  };

  const handleGridClick = (x, y) => {
    const clickedObj = getInteractableAt(x, y);

    // INSTANT INTERACTION: Removed distance constraints for better UX!
    if (clickedObj) {
      clickedObj.action();
      return;
    }

    if (isBlocked(x, y)) return;

    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    
    setTargetPos({ x, y });
    const path = getBfsPath(playerPos, { x, y }, isBlocked, COLS, ROWS);
    
    if (path && path.length > 0) {
      setIsMoving(true);
      let step = 0;
      moveIntervalRef.current = setInterval(() => {
        setPlayerPos(path[step]);
        step++;
        if (step >= path.length) {
          clearInterval(moveIntervalRef.current);
          setIsMoving(false);
          setTargetPos(null);
        }
      }, 100); 
    }
  };

  useEffect(() => {
    return () => { if (moveIntervalRef.current) clearInterval(moveIntervalRef.current); };
  }, []);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const isPlayer = playerPos.x === x && playerPos.y === y;
        const isWall = walls.has(`${x},${y}`);
        const isTarget = targetPos && targetPos.x === x && targetPos.y === y;
        const interactable = getInteractableAt(x, y);
        
        let cellContent = null;
        let cellClass = "relative transition-colors duration-200 ";
        
        if (interactable) {
          // Render the master object wrapper ONLY on the top-left coordinate of the item
          if (interactable.cells[0] === `${x},${y}`) {
            
            // SMART TOOLTIP DYNAMIC POSITIONING
            let tooltipPos = '';
            if (y < 2) tooltipPos += 'top-full mt-2 ';
            else tooltipPos += 'bottom-full mb-2 ';

            if (x < 3) tooltipPos += 'left-0 ';
            else if (x > COLS - 4) tooltipPos += 'right-0 ';
            else tooltipPos += 'left-1/2 -translate-x-1/2 ';
            
            cellContent = (
              // The wrapper spans dynamically based on spanX and spanY
              <div 
                className="absolute top-0 left-0 z-20 cursor-pointer group/item flex items-center justify-center"
                style={{ width: `calc(100% * ${interactable.spanX})`, height: `calc(100% * ${interactable.spanY})` }}
                onClick={(e) => { e.stopPropagation(); handleGridClick(x, y); }}
              >
                <img 
                  src={interactable.sprite} 
                  alt={interactable.type} 
                  className="w-full h-full object-contain drop-shadow-xl transition-all group-hover/item:brightness-125 group-hover/item:scale-[1.03]" 
                  style={{ imageRendering: 'pixelated' }} 
                  onError={(e) => { e.target.style.opacity = 0; }} 
                />
                
                {/* Dynamic Smart Tooltip anchored to the wrapper */}
                <div className={`absolute hidden group-hover/item:flex flex-col w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[150] text-center pointer-events-none ${tooltipPos}`}>
                  <span className="text-white font-bold text-xs uppercase tracking-widest">{interactable.type}</span>
                  <span className="text-slate-400 text-[10px] mt-1">{interactable.tooltip}</span>
                </div>
              </div>
            );
          }
        } else if (!isWall) {
          // Only normal empty floor tiles highlight when hovered
          cellClass += "hover:brightness-110 cursor-pointer ";
        }

        cells.push(
          <div key={`${x}-${y}`} onClick={() => handleGridClick(x, y)} className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center hover:z-[100] ${cellClass}`}>
            
            {/* LAYER 1: BASE WOODEN FLOOR */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/src/assets/house/wooden-tile-01.png" 
                alt="floor" 
                className="w-full h-full object-cover" 
                style={{ imageRendering: 'pixelated' }} 
                onError={(e) => { e.target.style.opacity = 0; }} 
              />
            </div>

            {/* LAYER 2: STONE WALL OBSTACLES */}
            {isWall && (
              <div className="absolute inset-0 z-10 drop-shadow-md">
                <img 
                  src="/src/assets/house/stone-wall-01.png" 
                  alt="wall" 
                  className="w-full h-full object-cover" 
                  style={{ imageRendering: 'pixelated' }} 
                  onError={(e) => { e.target.style.opacity = 0; }} 
                />
              </div>
            )}

            {/* LAYER 3: INTERACTABLES & HIGHLIGHTS */}
            {cellContent}
            {isTarget && !interactable && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse z-20 pointer-events-none" />}
            
            {/* LAYER 4: PLAYER TOKEN */}
            {isPlayer && (
              <div className="absolute w-3/4 h-3/4 bg-emerald-500 rounded-full flex items-center justify-center z-40 shadow-lg transition-all duration-100">
                <span className="font-bold text-slate-900 text-xs md:text-sm">P</span>
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full relative z-10">
      
      {/* HUB HEADER & CONTROLS */}
      <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center shadow-xl gap-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">🏰 Sanctuary</h2>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{sysMessage}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsGuestListOpen(true)} className="px-4 py-2 bg-blue-900/50 border border-blue-700 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">
            👥 Guests ({activeGuests.length})
          </button>
          <button onClick={onOpenDashboard} className="px-4 py-2 bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">👤 Dashboard</button>
          <button onClick={onOpenBackpack} className="px-4 py-2 bg-purple-900/50 border border-purple-700 text-purple-300 hover:text-white hover:bg-purple-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">🎒 Backpack</button>
          <button onClick={() => setSysMessage("Edit Mode unlocked in future update.")} className="px-4 py-2 bg-amber-900/50 border border-amber-700 text-amber-300 hover:text-white hover:bg-amber-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">🔨 Edit</button>
        </div>
      </div>

      {/* INTERACTIVE MAP */}
      <div className="bg-[#05050a] border-4 border-slate-800 rounded-2xl p-4 md:p-8 flex justify-center overflow-x-auto shadow-2xl relative">
        <div className="grid gap-0 border-2 border-slate-900 bg-slate-950" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {renderGrid()}
        </div>
      </div>

      {/* MMO CHAT WINDOW */}
      <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl flex flex-col h-48 shadow-xl overflow-hidden">
        <div className="bg-slate-950 p-2 border-b border-slate-800 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Local Chat (Sanctuary)</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Online</span>
        </div>
        <div className="flex-1 p-3 overflow-y-auto space-y-1 text-xs">
          <div className="text-slate-600 italic">System: Welcome to your Sanctuary. Multiplayer features are currently offline.</div>
          <div className="text-slate-400"><span className="font-bold text-blue-400">[Thorin]:</span> Nice place! Where did you get that armor?</div>
          <div className="text-slate-400"><span className="font-bold text-emerald-400">[{character.name}]:</span> Just finished setting up the furniture!</div>
        </div>
        <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input type="text" placeholder="Press Enter to chat..." disabled className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 outline-none cursor-not-allowed" />
          <button disabled className="bg-slate-800 text-slate-500 px-4 py-1.5 rounded text-xs font-bold uppercase cursor-not-allowed">Send</button>
        </div>
      </div>

      {/* GUEST LIST MODAL */}
      {isGuestListOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0b0f19] border-4 border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center p-4 border-b-2 border-slate-800 bg-slate-900">
              <div>
                <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">👥 Sanctuary Guests</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-0.5">Manage visitors in your instance</span>
              </div>
              <button onClick={() => setIsGuestListOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors">✕</button>
            </div>
            
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0b0f19] [&::-webkit-scrollbar-thumb]:bg-slate-700">
              {activeGuests.map(guest => (
                <div key={guest.id} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-3 rounded-xl hover:border-slate-600 transition-colors shadow-inner">
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${guest.role === 'Host' ? 'bg-indigo-950 border-indigo-700' : 'bg-slate-900 border-slate-700'}`}>
                      {guest.role === 'Host' ? '👑' : '👤'}
                    </div>
                    <div>
                      <div className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                        {guest.name}
                        {guest.role === 'Host' && <span className="text-[8px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-700">Host</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{guest.class}</div>
                    </div>
                  </div>
                  
                  {guest.role !== 'Host' && (
                    <div className="flex gap-2">
                      <button onClick={() => { setSysMessage(`Friend request sent to ${guest.name}.`); setIsGuestListOpen(false); }} className="w-8 h-8 flex items-center justify-center bg-emerald-900/40 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-800 transition-all shadow-md active:translate-y-0.5" title="Add Friend">🤝</button>
                      <button onClick={() => { setSysMessage(`Kicked ${guest.name} from the sanctuary.`); setIsGuestListOpen(false); }} className="w-8 h-8 flex items-center justify-center bg-orange-900/40 hover:bg-orange-600 text-orange-400 hover:text-white rounded-lg border border-orange-800 transition-all shadow-md active:translate-y-0.5" title="Kick Player">👢</button>
                      <button onClick={() => { setSysMessage(`Added ${guest.name} to Blocklist.`); setIsGuestListOpen(false); }} className="w-8 h-8 flex items-center justify-center bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-800 transition-all shadow-md active:translate-y-0.5" title="Block Player">🚫</button>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HomeHub;