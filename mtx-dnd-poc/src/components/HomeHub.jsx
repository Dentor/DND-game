import React, { useState, useEffect, useRef } from 'react';
import furnitureCatalog from '../data/mockFurniture.json';
import { getDistance, checkLineOfSight } from '../utils/combatUtils';
import PurchaseConfirmModal from './PurchaseConfirmModal';
import RestSummaryModal from './RestSummaryModal';
import SpellbookModal from './SpellbookModal';

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

const HomeHub = ({ character, healCharacter, onOpenExpedition, onOpenDashboard, onOpenBackpack, onOpenStash, onOpenWardrobe, modifySanctuary }) => {
  const sanctuaryData = character?.sanctuary || {};
  const COLS = sanctuaryData.cols || 30;
  const ROWS = sanctuaryData.rows || 30;
  
  const [playerPos, setPlayerPos] = useState({ x: 3, y: 4 });
  const [isMoving, setIsMoving] = useState(false);
  const [targetPos, setTargetPos] = useState(null);
  const [sysMessage, setSysMessage] = useState("Welcome home. Click objects to interact.");
  const moveIntervalRef = useRef(null);

  const [isGuestListOpen, setIsGuestListOpen] = useState(false);

  // BUILD MODE & NEW MODALS
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTab, setEditTab] = useState('stash'); 
  const [activeTool, setActiveTool] = useState(null); 
  const [hoverCell, setHoverCell] = useState(null);
  
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [sleepStats, setSleepStats] = useState(null);
  
  // SPELLBOOK INTEGRATION FOR MOVEMENT SPELLS
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(false);
  const [activeHubSpell, setActiveHubSpell] = useState(null);

  // CUSTOM MAP DRAG-TO-PAN STATE
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, sLeft: 0, sTop: 0 });
  const [dragDistance, setDragDistance] = useState(0);

  const activeGuests = [
    { id: 'host', name: character.name, role: 'Host', status: 'Online', class: 'Adventurer' },
    { id: 'g1', name: 'Thorin', role: 'Guest', status: 'Online', class: 'Warrior' }
  ];

  const unlockedTiles = new Set(sanctuaryData.unlockedTiles || []);
  const walls = new Set(sanctuaryData.walls || []);

  const interactables = (sanctuaryData.furniture || []).map(item => {
    let actionFn = () => {};
    if (item.actionId === 'rest') {
      actionFn = () => { 
        const stats = healCharacter(); 
        setSleepStats(stats); 
      };
    } else if (item.actionId === 'stash') {
      actionFn = onOpenStash;
    } else if (item.actionId === 'expedition') {
      actionFn = onOpenExpedition;
    }
    return { ...item, action: actionFn };
  });

  const getInteractableAt = (x, y) => interactables.find(obj => obj.cells.includes(`${x},${y}`));

  const isBlocked = (x, y) => {
    if (!unlockedTiles.has(`${x},${y}`)) return true;
    if (walls.has(`${x},${y}`)) return true;
    const obj = getInteractableAt(x, y);
    if (obj && obj.blocksMovement !== false) return true;
    return false;
  };

  const isAdjacentToInteractable = (px, py, interactableCells) => {
    return interactableCells.some(cellStr => {
      const [cx, cy] = cellStr.split(',').map(Number);
      return Math.abs(px - cx) + Math.abs(py - cy) <= 1; 
    });
  };

  const checkHubLineOfSight = (p1, p2) => {
    let x0 = p1.x, y0 = p1.y;
    const x1 = p2.x, y1 = p2.y;
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;

    while (true) {
      if (x0 === x1 && y0 === y1) return true;
      if (x0 !== p1.x || y0 !== p1.y) {
        if (!unlockedTiles.has(`${x0},${y0}`)) return false;
        if (walls.has(`${x0},${y0}`)) return false;
      }
      e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  // Mock Map Data for checking spell Line Of Sight in the Hub
  const hubMapData = {};
  for(let y=0; y<ROWS; y++) {
    for(let x=0; x<COLS; x++) {
       hubMapData[`${x},${y}`] = { type: isBlocked(x,y) ? 'block' : 'empty' };
    }
  }

  // Handle Rotation ('R') and Stashing ('ESC')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditMode && activeTool?.item) {
        if (e.key === 'r' || e.key === 'R') {
          setActiveTool(prev => {
            if (!prev || !prev.item) return prev;
            const newItem = { ...prev.item };
            const temp = newItem.spanX;
            newItem.spanX = newItem.spanY;
            newItem.spanY = temp;
            newItem.rotation = ((newItem.rotation || 0) + 90) % 360;
            return { ...prev, item: newItem };
          });
        } else if (e.key === 'Escape') {
          modifySanctuary('return_to_stash', { item: activeTool.item });
          setActiveTool(null);
          setSysMessage("Item sent to stash.");
        }
      } else if (isEditMode && !activeTool?.item && e.key === 'Escape') {
        setIsEditMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, activeTool, modifySanctuary]);

  // Handle Mouse Drag for Panning
  const startDrag = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    setDragDistance(0);
    setDragStart({ x: e.pageX, y: e.pageY, sLeft: scrollRef.current.scrollLeft, sTop: scrollRef.current.scrollTop });
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.pageX - dragStart.x;
    const dy = e.pageY - dragStart.y;
    setDragDistance(prev => prev + Math.abs(dx) + Math.abs(dy));
    scrollRef.current.scrollLeft = dragStart.sLeft - dx * 1.5; 
    scrollRef.current.scrollTop = dragStart.sTop - dy * 1.5;
  };

  const stopDrag = () => {
    setIsDragging(false);
    setTimeout(() => setDragDistance(0), 50); 
  };

  let previewCells = new Set();
  let isValidPlacement = true;
  
  if (isEditMode && activeTool?.type === 'place' && hoverCell) {
    const spanX = activeTool.item?.spanX || 1;
    const spanY = activeTool.item?.spanY || 1;
    for(let i=0; i<spanX; i++) {
      for(let j=0; j<spanY; j++) {
        const px = hoverCell.x + i;
        const py = hoverCell.y + j;
        previewCells.add(`${px},${py}`);
        if (px >= COLS || py >= ROWS || !unlockedTiles.has(`${px},${py}`) || walls.has(`${px},${py}`) || getInteractableAt(px, py) || (px === playerPos.x && py === playerPos.y)) {
          isValidPlacement = false;
        }
      }
    }
  }

  const handleGridClick = (x, y) => {
    if (dragDistance > 10) return; 

    if (isEditMode) {
      if (!unlockedTiles.has(`${x},${y}`)) return;

      if (activeTool?.type === 'place') {
        if (!isValidPlacement) {
          setSysMessage("Cannot place here. Space is blocked or locked.");
          return;
        }
        const newCells = [];
        for(let i=0; i<(activeTool.item.spanX||1); i++){
          for(let j=0; j<(activeTool.item.spanY||1); j++){
            newCells.push(`${x+i},${y+j}`);
          }
        }
        modifySanctuary('place_item', { item: activeTool.item, x, y, cells: newCells, rotation: activeTool.item.rotation });
        setActiveTool(null);
        setSysMessage("Item placed.");
        return;
      }

      if (!activeTool) {
        const clickedObj = getInteractableAt(x, y);
        if (clickedObj) {
          modifySanctuary('pickup_from_room', { type: 'Furniture', uid: clickedObj.uid, id: clickedObj.id });
          setActiveTool({ type: 'place', item: clickedObj });
          setSysMessage(`Picked up ${clickedObj.name}. Click to place, or press ESC to stash.`);
          return;
        }
        if (walls.has(`${x},${y}`)) {
          modifySanctuary('pickup_from_room', { type: 'Wall', x, y });
          const wallItem = { id: 'wall_stone_01', type: 'Wall', name: 'Stone Wall', spanX: 1, spanY: 1, sprite: '/src/assets/house/stone-wall-01.png', price: 50, uid: crypto.randomUUID() };
          setActiveTool({ type: 'place', item: wallItem });
          setSysMessage(`Picked up Wall. Click to place, or press ESC to stash.`);
          return;
        }
      }
      return; 
    }

    // ==========================================
    // SPELL MOVEMENT & AUTO-PATHING
    // ==========================================
    if (activeHubSpell) {
      if (activeHubSpell.category !== 'movement') {
        setSysMessage("Only movement spells can be used in the Sanctuary.");
        setActiveHubSpell(null);
        return;
      }
      
      if (isBlocked(x, y)) { 
        setSysMessage("Destination is blocked by furniture or walls!"); 
        return; 
      }

      // Auto-Pathing Logic to get within range before leaping
      const findLaunchpadPath = (start, target, maxRange) => {
        if (getDistance(start, target) <= maxRange && checkHubLineOfSight(start, target)) return [];
        
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Set([`${start.x},${start.y}`]);
        const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

        while (queue.length > 0) {
          const curr = queue.shift();
          
          if (getDistance(curr, target) <= maxRange && checkHubLineOfSight(curr, target)) {
            return curr.path;
          }

          for (const d of dirs) {
            const nx = curr.x + d.x;
            const ny = curr.y + d.y;
            const key = `${nx},${ny}`;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited.has(key) && !isBlocked(nx, ny)) {
              visited.add(key);
              queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
            }
          }
        }
        return null; 
      };

      const pathToLaunchpad = findLaunchpadPath(playerPos, {x, y}, activeHubSpell.range);

      if (pathToLaunchpad === null) {
        setSysMessage("Cannot find a clear path to get in range!");
        return;
      }

      if (pathToLaunchpad.length > 0) {
        setIsMoving(true);
        let step = 0;
        if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
        
        moveIntervalRef.current = setInterval(() => {
          setPlayerPos(pathToLaunchpad[step]);
          step++;
          if (step >= pathToLaunchpad.length) {
            clearInterval(moveIntervalRef.current);
            setIsMoving(false);
            
            // Execute Leap after walking
            setTimeout(() => {
              setPlayerPos({ x, y });
              setActiveHubSpell(null);
              setSysMessage(`💨 Walked into range and leaped using ${activeHubSpell.name}!`);
            }, 150);
          }
        }, 100);
      } else {
        // Already in range, leap immediately
        setPlayerPos({ x, y });
        setActiveHubSpell(null);
        setSysMessage(`💨 Leaped using ${activeHubSpell.name}!`);
      }
      return;
    }

    // PROXIMITY INTERACTION & WALKING
    const clickedObj = getInteractableAt(x, y);

    if (clickedObj) {
      if (!isAdjacentToInteractable(playerPos.x, playerPos.y, clickedObj.cells)) {
        setSysMessage(`You must move closer to interact with the ${clickedObj.name}.`);
        return;
      }
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
        const isUnlocked = unlockedTiles.has(`${x},${y}`);
        
        const floorSprite = sanctuaryData.customFloors?.[`${x},${y}`] || sanctuaryData.baseFloor || '/src/assets/house/wooden-tile-01.png';

        let cellContent = null;
        let cellClass = "relative transition-colors duration-200 ";

        if (!isUnlocked) {
           cellClass += "bg-[#05050a] pointer-events-none ";
        } else {
          if (isEditMode) {
            cellClass += "border border-slate-700/50 hover:border-amber-400 ";
          }
          
          if (interactable) {
            if (interactable.cells[0] === `${x},${y}`) {
              let tooltipPos = '';
              if (y < 2) tooltipPos += 'top-full mt-2 ';
              else tooltipPos += 'bottom-full mb-2 ';
  
              if (x < 3) tooltipPos += 'left-0 ';
              else if (x > COLS - 4) tooltipPos += 'right-0 ';
              else tooltipPos += 'left-1/2 -translate-x-1/2 ';
              
              const isPickupable = isEditMode && !activeTool;

              cellContent = (
                <div 
                  className={`absolute top-0 left-0 z-20 cursor-pointer group/item flex items-center justify-center 
                    ${isPickupable ? 'hover:brightness-150 hover:sepia hover:scale-105 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}`}
                  style={{ width: `calc(100% * ${interactable.spanX})`, height: `calc(100% * ${interactable.spanY})` }}
                  onClick={(e) => { e.stopPropagation(); handleGridClick(x, y); }}
                >
                  <img 
                    src={interactable.sprite} 
                    alt={interactable.type} 
                    className={`w-full h-full object-contain drop-shadow-xl transition-all ${!isEditMode && 'group-hover/item:brightness-125 group-hover/item:scale-[1.03]'}`} 
                    style={{ imageRendering: 'pixelated', transform: `rotate(${interactable.rotation || 0}deg)` }} 
                    onError={(e) => { e.target.style.opacity = 0; }} 
                  />
                  
                  {!isEditMode && (
                    <div className={`absolute hidden group-hover/item:flex flex-col w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[150] text-center pointer-events-none ${tooltipPos}`}>
                      <span className="text-white font-bold text-xs uppercase tracking-widest">{interactable.type}</span>
                      <span className="text-slate-400 text-[10px] mt-1">{interactable.tooltip}</span>
                    </div>
                  )}
                </div>
              );
            }
          } else if (!isWall && !isEditMode && !isDragging) {
            cellClass += "hover:brightness-110 cursor-pointer ";
          }
        }

        const isPreviewOrigin = hoverCell && hoverCell.x === x && hoverCell.y === y && isEditMode && activeTool?.type === 'place';
        
        // VISUAL RANGE INDICATOR FOR SPELLS
        const isWithinSpellRange = activeHubSpell && getDistance(playerPos, {x,y}) <= activeHubSpell.range && checkHubLineOfSight(playerPos, {x,y}) && !isBlocked(x,y);
        const isSpellTargetable = activeHubSpell && hoverCell?.x === x && hoverCell?.y === y && !isBlocked(x,y);

        cells.push(
          <div key={`${x}-${y}`} onClick={() => handleGridClick(x, y)} onMouseEnter={() => setHoverCell({x,y})} onMouseLeave={() => setHoverCell(null)} className={`min-w-[64px] min-h-[64px] flex items-center justify-center hover:z-[100] ${cellClass}`}>
            
            {isUnlocked && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img src={floorSprite} alt="floor" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} onError={(e) => { e.target.style.opacity = 0; }} />
              </div>
            )}

            {isWall && isUnlocked && (
              <div className="absolute inset-0 z-10 drop-shadow-md">
                <img 
                  src="/src/assets/house/stone-wall-01.png" 
                  alt="wall" 
                  className={`w-full h-full object-cover ${isEditMode && !activeTool ? 'hover:brightness-150 hover:sepia hover:scale-110 cursor-pointer transition-all' : 'pointer-events-none'}`} 
                  style={{ imageRendering: 'pixelated' }} 
                  onError={(e) => { e.target.style.opacity = 0; }} 
                />
              </div>
            )}

            {cellContent}
            {isTarget && !interactable && !isEditMode && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse z-20 pointer-events-none" />}
            
            {/* The Ghost Placement Overlay */}
            {isPreviewOrigin && activeTool?.item && (
              <div className="absolute top-0 left-0 z-[200] pointer-events-none opacity-60" style={{ width: `calc(100% * ${activeTool.item.spanX || 1})`, height: `calc(100% * ${activeTool.item.spanY || 1})` }}>
                <img src={activeTool.item.sprite} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated', transform: `rotate(${activeTool.item.rotation || 0}deg)` }} />
                <div className={`absolute inset-0 border-2 ${isValidPlacement ? 'bg-emerald-500/30 border-emerald-400' : 'bg-red-500/50 border-red-500'}`} />
              </div>
            )}

            {/* SPELL RANGE HIGHLIGHTS */}
            {isWithinSpellRange && <div className="absolute inset-0 bg-cyan-500/10 z-10 pointer-events-none" />}
            {isSpellTargetable && <div className="absolute inset-0 ring-4 ring-inset ring-indigo-400 bg-indigo-500/40 animate-pulse z-30 pointer-events-none" />}

            {isPlayer && isUnlocked && (
              <div className="absolute w-3/4 h-3/4 bg-emerald-500 rounded-full flex items-center justify-center z-40 shadow-lg transition-all duration-100 pointer-events-none border-2 border-emerald-300">
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
    <div className="flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full relative z-10">
      
      {/* HUB HEADER & CONTROLS */}
      <div className={`border-4 rounded-2xl p-4 flex flex-wrap justify-between items-center shadow-xl gap-4 transition-colors ${isEditMode ? 'bg-amber-950 border-amber-600' : 'bg-slate-900 border-slate-800'}`}>
        <div>
          <h2 className={`text-2xl font-black uppercase tracking-widest flex items-center gap-2 ${isEditMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isEditMode ? '🔨 Builder Mode' : '🏰 Sanctuary'}
          </h2>
          <p className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${isEditMode ? 'text-amber-200/70' : 'text-slate-400'}`}>
            {activeHubSpell ? `Click target tile to ${activeHubSpell.name} (ESC to cancel)` : sysMessage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditMode && (
            <>
              <button onClick={() => setIsSpellbookOpen(true)} className="px-4 py-2 bg-cyan-900/50 border border-cyan-700 text-cyan-300 hover:text-white hover:bg-cyan-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">📖 Spells</button>
              <button onClick={onOpenDashboard} className="px-4 py-2 bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">👤 Dashboard</button>
              <button onClick={onOpenBackpack} className="px-4 py-2 bg-purple-900/50 border border-purple-700 text-purple-300 hover:text-white hover:bg-purple-800 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md">🎒 Backpack</button>
            </>
          )}
          
          <button 
            onClick={() => {
              if (activeTool?.item) modifySanctuary('return_to_stash', { item: activeTool.item });
              setIsEditMode(!isEditMode);
              setActiveTool(null);
              setActiveHubSpell(null);
              setSysMessage(!isEditMode ? "Drag map to pan. Click objects to pick up." : "Welcome home. Click objects to interact.");
            }} 
            className={`px-6 py-2 border rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-md ${isEditMode ? 'bg-amber-600 text-slate-900 border-amber-400 hover:bg-amber-500' : 'bg-amber-900/50 border-amber-700 text-amber-300 hover:text-white hover:bg-amber-800'}`}
          >
            {isEditMode ? 'Finish Editing ✅' : '🔨 Edit Room'}
          </button>
          <button 
              onClick={onOpenWardrobe} 
              className="w-full py-4 bg-fuchsia-900/40 hover:bg-fuchsia-800 text-fuchsia-300 font-black uppercase tracking-widest rounded-xl transition-all shadow-md border border-fuchsia-700 cursor-pointer flex items-center justify-center gap-3"
            >
              <span className="text-xl">👗</span> Wardrobe
          </button>

        </div>
      </div>

      {/* DRAGGABLE MAP CONTAINER */}
      <div 
        ref={scrollRef}
        onMouseDown={startDrag}
        onMouseMove={onDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className={`bg-[#05050a] border-4 border-slate-800 rounded-2xl shadow-2xl relative w-full h-[500px] overflow-auto select-none [&::-webkit-scrollbar]:hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="grid gap-0 border-2 border-slate-900 bg-[#05050a] transition-colors w-max h-max" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(64px, 64px))` }}>
          {renderGrid()}
        </div>
      </div>

      {/* MODALS */}
      {pendingPurchase && (
        <PurchaseConfirmModal 
          item={pendingPurchase} 
          currentGold={character.currency.gold} 
          onConfirm={() => {
            modifySanctuary('buy_housing_item', { item: pendingPurchase });
            setEditTab('stash');
            setPendingPurchase(null);
          }}
          onCancel={() => setPendingPurchase(null)}
        />
      )}

      {sleepStats && (
        <RestSummaryModal stats={sleepStats} onClose={() => setSleepStats(null)} />
      )}

      {isSpellbookOpen && (
        <SpellbookModal 
          character={character} 
          onClose={() => setIsSpellbookOpen(false)}
          onSelectSpell={(spell) => {
            if (spell.category !== 'movement') {
              setSysMessage("You can only use Movement spells in the Sanctuary.");
            } else {
              setActiveHubSpell(spell);
            }
            setIsSpellbookOpen(false);
          }}
        />
      )}

      {/* BOTTOM PANEL */}
      {!isEditMode ? (
        <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl flex flex-col h-48 shadow-xl overflow-hidden shrink-0">
          <div className="bg-slate-950 p-2 border-b border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Local Chat (Sanctuary)</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Online</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-xs">
            <div className="text-slate-600 italic">System: Welcome to your Sanctuary. Multiplayer features are currently offline.</div>
          </div>
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input type="text" placeholder="Press Enter to chat..." disabled className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 outline-none cursor-not-allowed" />
            <button disabled className="bg-slate-800 text-slate-500 px-4 py-1.5 rounded text-xs font-bold uppercase cursor-not-allowed">Send</button>
          </div>
        </div>
      ) : activeTool?.item ? (
        <div className="bg-slate-900 border-4 border-amber-500 rounded-2xl flex items-center justify-between p-6 shadow-xl animate-in slide-in-from-bottom-4 shrink-0 h-40">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-950 border-2 border-slate-700 rounded-xl flex items-center justify-center p-2 shadow-inner">
              <img src={activeTool.item.sprite} className="max-w-full max-h-full object-contain" style={{imageRendering: 'pixelated'}} />
            </div>
            <div>
              <h3 className="text-xl text-amber-400 font-black tracking-widest uppercase">{activeTool.item.name}</h3>
              <p className="text-slate-400 text-xs mt-2 font-bold tracking-widest uppercase">
                <span className="text-amber-500">Hold R</span> to Rotate • <span className="text-amber-500">Click Map</span> to Place
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              modifySanctuary('return_to_stash', { item: activeTool.item });
              setActiveTool(null);
              setSysMessage("Item sent to stash.");
            }} 
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-md active:translate-y-1"
          >
            📦 Send to Stash (ESC)
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border-4 border-amber-800/50 rounded-2xl flex flex-col h-56 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 shrink-0">
          <div className="bg-slate-950 p-2 border-b border-slate-800 flex justify-between items-center">
            <div className="flex gap-4">
              <button onClick={() => setEditTab('stash')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border transition-colors ${editTab === 'stash' ? 'bg-amber-600 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-amber-400'}`}>📦 Housing Stash</button>
              <button onClick={() => setEditTab('store')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border transition-colors ${editTab === 'store' ? 'bg-amber-600 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-amber-400'}`}>🛒 Furniture Store</button>
            </div>
            <span className="text-[12px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-950/30 px-3 py-1 rounded border border-yellow-900">🪙 {character.currency.gold}g</span>
          </div>
          
          <div className="flex-1 p-3 flex gap-4 overflow-x-auto items-center [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            
            {editTab === 'stash' && (
              <>
                {sanctuaryData.housingInventory?.length === 0 ? (
                  <div className="w-full text-center text-slate-500 italic text-xs">Your housing stash is empty. Buy items from the Store or pick up placed furniture.</div>
                ) : (
                  sanctuaryData.housingInventory.map((item, idx) => (
                    <button 
                      key={`${item.id}-${idx}`}
                      onClick={() => setActiveTool({ type: 'place', item })}
                      className="min-w-[120px] h-full rounded-xl border-2 p-2 flex flex-col justify-between bg-slate-950 border-slate-700 hover:border-emerald-500/50 transition-all active:translate-y-1"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.type}</span>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Place ✋</span>
                      </div>
                      <div className="h-12 flex items-center justify-center my-1">
                        {item.sprite ? <img src={item.sprite} className="max-h-full object-contain drop-shadow" style={{ imageRendering: 'pixelated' }} /> : <span className="text-[8px] text-slate-600">IMG</span>}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">{item.name}</span>
                    </button>
                  ))
                )}
              </>
            )}

            {editTab === 'store' && (
              <>
                {furnitureCatalog.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setPendingPurchase(item)}
                    className="min-w-[120px] h-full rounded-xl border-2 p-2 flex flex-col justify-between bg-slate-950 border-slate-700 hover:border-amber-500/50 transition-all active:translate-y-1"
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.type}</span>
                      <span className="text-[10px] font-black text-yellow-400">{item.price}g</span>
                    </div>
                    <div className="h-12 flex items-center justify-center my-1">
                      {item.sprite ? <img src={item.sprite} className="max-h-full object-contain drop-shadow" style={{ imageRendering: 'pixelated' }} /> : <span className="text-[8px] text-slate-600">IMG</span>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">{item.name}</span>
                  </button>
                ))}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default HomeHub;