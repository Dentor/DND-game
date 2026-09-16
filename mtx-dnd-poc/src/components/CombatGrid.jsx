import React from 'react';
import { getDistance, isCellInTrail, checkLineOfSight } from '../utils/combatUtils';

const CombatGrid = ({ engine }) => {
  const {
    gridSize, battleMap, playerPos, monsters, visibleTiles, exploredTiles,
    activeAction, hoveredCell, setHoveredCell, playerTrail, monsterTrail,
    previewPos, currentActor, isAnimating, movementLeft, battleResult,
    pendingRoll, equippedWeapon, handleGridClick, floatingTexts
  } = engine;

  const cells = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const isPlayer = playerPos.x === x && playerPos.y === y;
      const residentMonster = monsters.find(m => m.hp > 0 && m.x === x && m.y === y);
      
      const isVisible = visibleTiles.has(`${x},${y}`);
      const isExplored = exploredTiles.has(`${x},${y}`);
      const isMonster = !!residentMonster && isVisible;
      
      const dist = getDistance(playerPos, { x, y });
      const radiusOffset = activeAction && activeAction.radius ? Math.floor(activeAction.radius / 2) : 0;
      
      const isInSpellAOE = activeAction && typeof activeAction === 'object' && hoveredCell && 
        getDistance(playerPos, hoveredCell) <= activeAction.range &&
        Math.abs(x - hoveredCell.x) <= radiusOffset && Math.abs(y - hoveredCell.y) <= radiusOffset;

      const isPlayerTrail = isCellInTrail(x, y, playerTrail) && !isPlayer;
      const isMonsterTrail = isCellInTrail(x, y, monsterTrail) && !isMonster;
      const isPreviewDest = previewPos && previewPos.x === x && previewPos.y === y;
      
      const cellData = battleMap.mapData[`${x},${y}`];
      const isObstacle = battleMap.blockedCoords.has(`${x},${y}`) && !isPlayer && !isMonster;
      const inRange = currentActor.isPlayer && !isAnimating && dist <= movementLeft && !activeAction && battleResult === null && !pendingRoll;

      const isMeleeTargetable = activeAction === 'melee' && residentMonster && getDistance(playerPos, residentMonster) === 1;
      const isRangedTargetable = activeAction === 'ranged' && residentMonster && getDistance(playerPos, residentMonster) <= (equippedWeapon.range || 1) && checkLineOfSight(playerPos, residentMonster, battleMap.mapData);

      const isMovementTargetable = activeAction?.category === 'movement' && 
                                   hoveredCell?.x === x && hoveredCell?.y === y && 
                                   dist <= activeAction.range && 
                                   !battleMap.blockedCoords.has(`${x},${y}`) && 
                                   !residentMonster && 
                                   checkLineOfSight(playerPos, {x, y}, battleMap.mapData);

      cells.push(
        <div 
          key={`${x}-${y}`}
          onClick={() => handleGridClick(x, y)}
          onMouseEnter={() => setHoveredCell({ x, y })}
          onMouseLeave={() => setHoveredCell(null)}
          className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center relative cursor-pointer shrink-0"
        >
          <div className="absolute inset-0 border border-slate-400/20 z-20 pointer-events-none" />

          {!isExplored && <div className="absolute inset-0 bg-[#05050a] z-50 pointer-events-none" />}
          {isExplored && !isVisible && <div className="absolute inset-0 bg-[#05050a]/60 z-30 pointer-events-none" />}

          {cellData.isMaster && cellData.sprite && (
            <img 
              src={cellData.sprite} 
              alt={cellData.type} 
              className="absolute top-0 left-0 pointer-events-none z-0"
              style={{ width: `calc(100% * ${cellData.spanX})`, height: `calc(100% * ${cellData.spanY})`, maxWidth: 'none', maxHeight: 'none', objectFit: 'fill', imageRendering: 'pixelated' }} 
            />
          )}

          {isObstacle && cellData.type !== 'river' && <div className="absolute inset-0 bg-red-950/20 z-10 pointer-events-none" />}
          {isPlayerTrail && !isPreviewDest && <div className="absolute inset-0 bg-emerald-900/40 z-10 pointer-events-none" />}
          {isMonsterTrail && <div className="absolute inset-0 bg-red-900/40 z-10 pointer-events-none" />}
          {inRange && !isPlayer && !isMonster && !isObstacle && <div className="absolute inset-0 bg-emerald-500/20 hover:bg-emerald-400/40 z-10 pointer-events-none" />}
          {isPreviewDest && <div className="absolute inset-0 ring-4 ring-inset ring-emerald-400 bg-emerald-500/40 animate-pulse z-30 pointer-events-none" />}
          
          {isMeleeTargetable && <div className="absolute inset-0 ring-4 ring-inset ring-red-500 bg-red-500/40 animate-pulse z-30 pointer-events-none" />}
          {isRangedTargetable && <div className="absolute inset-0 ring-4 ring-inset ring-amber-500 bg-amber-500/40 animate-pulse z-30 pointer-events-none" />}
          {isInSpellAOE && <div className="absolute inset-0 bg-cyan-500/50 border-cyan-300 ring-2 ring-cyan-400 z-30 animate-pulse pointer-events-none" />}
          {isMovementTargetable && <div className="absolute inset-0 ring-4 ring-inset ring-indigo-400 bg-indigo-500/40 animate-pulse z-30 pointer-events-none" />}

          {isPlayer && (
            <div className="absolute w-3/4 h-3/4 bg-emerald-500 rounded-full flex items-center justify-center z-40 shadow-lg border-2 border-emerald-300">
              <span className="font-bold text-slate-900 text-sm md:text-lg">P</span>
            </div>
          )}
          
          {isMonster && residentMonster.sprite && (
            <>
              <div className="absolute inset-0 m-auto w-4/5 h-4/5 bg-white rounded-full border-2 border-red-600 z-30 pointer-events-none shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              <img src={residentMonster.sprite} alt={residentMonster.title} className="w-[70%] h-[70%] object-contain absolute inset-0 m-auto z-40" style={{ imageRendering: 'pixelated' }} />
            </>
          )}
          
          {floatingTexts.filter(ft => ft.x === x && ft.y === y).map(ft => (
            <span key={ft.id} className={`absolute z-[200] pointer-events-none floating-hit-text ${ft.colorClass}`}>{ft.text}</span>
          ))}
        </div>
      );
    }
  }

  return (
    <div className="grid gap-0 border-4 border-slate-900 shadow-2xl relative bg-slate-900" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
      {cells}
    </div>
  );
};

export default CombatGrid;