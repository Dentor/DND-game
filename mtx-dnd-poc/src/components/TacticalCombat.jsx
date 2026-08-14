import React, { useState, useEffect, useRef } from 'react';
import monsterCatalog from '../data/mockMonsters.json';
import spellsCatalog from '../data/mockSpells.json';
import itemsCatalog from '../data/mockItems.json';
import DiceRollModal from './DiceRollModal';

const getModifier = (score) => Math.floor((score - 10) / 2);
const getDistance = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
const rollD20 = () => Math.floor(Math.random() * 20) + 1;

const rollDice = (diceInput) => {
  if (!diceInput) return 0;
  if (typeof diceInput === 'number') {
    return Math.floor(Math.random() * diceInput) + 1;
  }
  const parts = String(diceInput).toLowerCase().split('d');
  if (parts.length !== 2) return parseInt(diceInput) || 0;
  
  const count = parseInt(parts[0]) || 1;
  const faces = parseInt(parts[1]) || 6;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * faces) + 1;
  }
  return total;
};

const checkLineOfSight = (p1, p2, mapData) => {
  let x0 = p1.x, y0 = p1.y;
  const x1 = p2.x, y1 = p2.y;
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, e2;

  while (true) {
    if (x0 === x1 && y0 === y1) return true;
    const cell = mapData[`${x0},${y0}`];
    if ((x0 !== p1.x || y0 !== p1.y) && cell && cell.type === 'block') return false;
    e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
};

const isCellInTrail = (x, y, trailArray) => {
  return trailArray.some(cell => cell.x === x && cell.y === y);
};

const getBfsPath = (start, goal, maxDist, isBlockedFn) => {
  const queue = [{ x: start.x, y: start.y, path: [] }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);
  const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.x === goal.x && curr.y === goal.y) return curr.path;
    if (curr.path.length >= maxDist) continue;

    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && !isBlockedFn(nx, ny)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
};

const getReachableCells = (start, movement, isBlockedFn) => {
  const reachable = [];
  const queue = [{ x: start.x, y: start.y, dist: 0 }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);
  const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

  while (queue.length > 0) {
    const curr = queue.shift();
    reachable.push({ x: curr.x, y: curr.y, dist: curr.dist });
    if (curr.dist < movement) {
      for (const d of dirs) {
        const nx = curr.x + d.x;
        const ny = curr.y + d.y;
        const key = `${nx},${ny}`;
        if (!visited.has(key) && !isBlockedFn(nx, ny)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, dist: curr.dist + 1 });
        }
      }
    }
  }
  return reachable;
};

const generateBattleMap = (gridSize) => {
  const mapData = {};
  const blockedCoords = new Set();
  const hasRiver = Math.random() < 0.7; 
  const riverCol = Math.floor(gridSize / 2) - 1; 
  const bridgeRow = Math.floor((gridSize / 2) / 2) * 2; 

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      mapData[`${x},${y}`] = { type: 'empty', sprite: null, isMaster: false };
    }
  }

  if (hasRiver) {
    mapData[`${riverCol},${bridgeRow}`] = { type: 'bridge', sprite: '/src/assets/maps/forest/bridge-tile-2x2.png', isMaster: true, spanX: 2, spanY: 2 };
    mapData[`${riverCol+1},${bridgeRow}`] = { type: 'bridge', sprite: null, isMaster: false };
    mapData[`${riverCol},${bridgeRow+1}`] = { type: 'bridge', sprite: null, isMaster: false };
    mapData[`${riverCol+1},${bridgeRow+1}`] = { type: 'bridge', sprite: null, isMaster: false };

    for (let ry = 0; ry < gridSize; ry++) {
      if (ry === bridgeRow || ry === bridgeRow + 1) continue;
      mapData[`${riverCol},${ry}`] = { type: 'river', sprite: '/src/assets/maps/forest/river-tile-1x2.png', isMaster: true, spanX: 2, spanY: 1 };
      blockedCoords.add(`${riverCol},${ry}`);
      mapData[`${riverCol+1},${ry}`] = { type: 'river', sprite: null, isMaster: false };
      blockedCoords.add(`${riverCol+1},${ry}`);
    }
  }

  const spawnZone = [];
  const dangerZone = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (mapData[`${x},${y}`].type === 'empty') {
        if (x <= 2 || x >= gridSize - 2) spawnZone.push({ x, y });
        else dangerZone.push({ x, y });
      }
    }
  }

  const blockRate = hasRiver ? 0.02 : 0.04;
  const mainRate = hasRiver ? (0.6 + Math.random() * 0.1) : (0.7 + Math.random() * 0.1);
  const totalEmptyCells = spawnZone.length + dangerZone.length;
  let numBlock = Math.round(totalEmptyCells * blockRate);
  const numMainWalk = Math.round(totalEmptyCells * mainRate);

  dangerZone.sort(() => 0.5 - Math.random());
  numBlock = Math.min(numBlock, dangerZone.length);

  for (let i = 0; i < numBlock; i++) {
    const { x, y } = dangerZone.pop();
    mapData[`${x},${y}`] = { type: 'block', sprite: '/src/assets/maps/forest/block-tile-01-1x1.png', isMaster: true, spanX: 1, spanY: 1 };
    blockedCoords.add(`${x},${y}`);
  }

  const walkableCoords = [...dangerZone, ...spawnZone];
  walkableCoords.sort(() => 0.5 - Math.random());
  const miscWalkTiles = ['02', '03', '04', '05', '06', '07', '08', '09'];

  walkableCoords.forEach((coord, index) => {
    const { x, y } = coord;
    if (index < numMainWalk) {
      mapData[`${x},${y}`] = { type: 'walk', sprite: '/src/assets/maps/forest/tile-01-1x1.png', isMaster: true, spanX: 1, spanY: 1 };
    } else {
      const randomTile = miscWalkTiles[Math.floor(Math.random() * miscWalkTiles.length)];
      mapData[`${x},${y}`] = { type: 'walk', sprite: `/src/assets/maps/forest/tile-${randomTile}-1x1.png`, isMaster: true, spanX: 1, spanY: 1 };
    }
  });

  return { mapData, blockedCoords, bridgeRow };
};

const TacticalCombat = ({ character, encounter, onCombatEnd, consumeSpellCharge, useConsumable }) => {
  const [gridSize] = useState(() => Math.floor(Math.random() * 4) + 11);
  const [battleMap] = useState(() => generateBattleMap(gridSize));
  const obstacles = battleMap.blockedCoords;
  
  const playerMaxMovement = Math.max(1, Math.round(character.stats.dexterity / 5));
  const monsterMovement = 3;
  const strMod = getModifier(character.stats.strength);
  const dexMod = getModifier(character.stats.dexterity);
  const proficiencyBonus = Math.floor(((character.level || 1) - 1) / 4) + 2;
  
  const [playerPos, setPlayerPos] = useState({ x: 1, y: battleMap.bridgeRow || Math.floor(gridSize / 2) });
  const [playerHp, setPlayerHp] = useState(character.health.current);
  
  const [actionsLeft, setActionsLeft] = useState(1);
  const [movementLeft, setMovementLeft] = useState(playerMaxMovement);
  const [isCovered, setIsCovered] = useState(false);
  const [hasDisengaged, setHasDisengaged] = useState(false);
  
  const [visibleTiles, setVisibleTiles] = useState(new Set());
  const [exploredTiles, setExploredTiles] = useState(new Set());
  const visionRadius = 6;

  const logEndRef = useRef(null);
  const [battleResult, setBattleResult] = useState(null);
  const [earnedRewards, setEarnedRewards] = useState(null);
  const [lastActionRecap, setLastActionRecap] = useState({ icon: '⚔️', text: 'Battle has commenced!' });
  const [flankingPenalty, setFlankingPenalty] = useState(0);

  // DICE ROLL STATE
  const [pendingRoll, setPendingRoll] = useState(null);

  useEffect(() => {
    const newVisible = new Set();
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (getDistance(playerPos, { x, y }) <= visionRadius) {
          if (checkLineOfSight(playerPos, { x, y }, battleMap.mapData)) {
            newVisible.add(`${x},${y}`);
          }
        }
      }
    }
    setVisibleTiles(newVisible);
    setExploredTiles(prev => new Set([...prev, ...newVisible]));
  }, [playerPos, battleMap.mapData, gridSize]);

  const [monsters, setMonsters] = useState(() => {
    const arr = [];
    const occupiedCoords = new Set(obstacles);
    occupiedCoords.add(`${playerPos.x},${playerPos.y}`);

    const encounterMonsters = encounter.monsters || [];
    
    encounterMonsters.forEach((template, i) => {
      let spawnX, spawnY, attempts = 0;
      do {
        spawnX = Math.floor(Math.random() * (gridSize / 2)) + Math.floor(gridSize / 2); 
        spawnY = Math.floor(Math.random() * gridSize); 
        attempts++;
      } while (occupiedCoords.has(`${spawnX},${spawnY}`) && attempts < 50);

      occupiedCoords.add(`${spawnX},${spawnY}`);
      const dynamicMaxHp = (template.baseHp || 10) + ((template.hpPerLevel || 0) * Math.max(0, (character.level || 1) - 1));

      arr.push({
        id: i, x: spawnX, y: spawnY, title: template.title,
        hp: dynamicMaxHp, maxHp: dynamicMaxHp, ac: template.baseArmorClass || 12,
        aiType: template.aiType, sprite: template.sprite, damage: template.damage,
        stats: template.stats, skills: template.skills
      });
    });
    return arr;
  });

  useEffect(() => {
    const adjacentMonstersCount = monsters.filter(m => m.hp > 0 && getDistance(playerPos, m) === 1).length;
    setFlankingPenalty(adjacentMonstersCount >= 2 ? 2 : 0);
  }, [playerPos, monsters]);

  const effectivePlayerAC = character.armorClass - flankingPenalty + (isCovered ? 2 : 0);

  const [combatQueue, setCombatQueue] = useState(() => {
    const queue = [{ id: 'player', name: `${character.name} (Player)`, initiative: rollD20() + dexMod, isPlayer: true }];
    monsters.forEach(m => queue.push({ id: m.id, name: `[M${m.id + 1}] ${m.title}`, initiative: rollD20() + 1, isPlayer: false, monsterId: m.id }));
    queue.sort((a, b) => b.initiative - a.initiative);
    return queue;
  });

  const [turnIndex, setTurnIndex] = useState(0);
  const currentActor = combatQueue[turnIndex] || combatQueue[0];

  const [playerTrail, setPlayerTrail] = useState([]);
  const [monsterTrail, setMonsterTrail] = useState([]);
  const [previewPos, setPreviewPos] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [activeAction, setActiveAction] = useState(null);
  const [isSpellbookModalOpen, setIsSpellbookModalOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  const [combatLogs, setCombatLogs] = useState([`Combat started on a ${gridSize}x${gridSize} grid!`]);
  const [floatingTexts, setFloatingTexts] = useState([]);

  const [selectedWeaponSlot, setSelectedWeaponSlot] = useState('mainHand');
  const equippedWeapon = character.equipment[selectedWeaponSlot] || { name: 'Unarmed', range: 1, damageDice: 4 };

  const log = (msg) => setCombatLogs((prev) => [...prev, msg]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [combatLogs]);

  // INCREASED TIMEOUT & BIGGER RETRO TEXT
  const addFloatingText = (x, y, text, colorClass) => {
    const id = Date.now() + Math.random(); 
    setFloatingTexts((prev) => [...prev, { id, x, y, text, colorClass }]);
    setTimeout(() => setFloatingTexts((prev) => prev.filter((ft) => ft.id !== id)), 2500);
  };

  const isCellBlocked = (x, y, ignoreId = null) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return true;
    if (obstacles.has(`${x},${y}`)) return true;
    if (playerPos.x === x && playerPos.y === y && ignoreId !== 'player') return true;
    return monsters.some(m => m.hp > 0 && m.x === x && m.y === y && m.id !== ignoreId);
  };

  const animateMovement = (path, actorId, onComplete) => {
    if (!path || path.length === 0) { 
      if (onComplete) onComplete(); 
      return; 
    }
    setIsAnimating(true);
    let step = 0;
    const interval = setInterval(() => {
      const currentStep = path[step]; 
      if (currentStep) {
        if (actorId === 'player') {
          setPlayerPos(currentStep);
        } else {
          setMonsters(prev => prev.map(m => m.id === actorId ? { ...m, x: currentStep.x, y: currentStep.y } : m));
        }
      }
      step++;
      if (step >= path.length) { 
        clearInterval(interval); 
        setIsAnimating(false); 
        if (onComplete) onComplete(); 
      }
    }, 200);
  };

  useEffect(() => {
    if (currentActor.isPlayer) {
      setActionsLeft(1);
      setMovementLeft(playerMaxMovement);
      setIsCovered(false); 
      setHasDisengaged(false);
    }
  }, [currentActor, playerMaxMovement]);

  const advanceTurn = () => {
    setPreviewPos(null);
    setPlayerTrail([]);
    setActiveAction(null);

    let nextIndex = (turnIndex + 1) % combatQueue.length;
    let loops = 0;
    while (loops < combatQueue.length) {
      const nextActor = combatQueue[nextIndex];
      if (nextActor.isPlayer) break;
      const liveMonster = monsters.find(m => m.id === nextActor.monsterId);
      if (liveMonster && liveMonster.hp > 0) break;
      nextIndex = (nextIndex + 1) % combatQueue.length;
      loops++;
    }
    setTurnIndex(nextIndex);
  };

  useEffect(() => {
    if (battleResult !== null || pendingRoll) return; 
    if (currentActor.isPlayer || isAnimating) return;
    
    const currentMonster = monsters.find(m => m.id === currentActor.monsterId);
    if (!currentMonster || currentMonster.hp <= 0) { 
      advanceTurn(); 
      return; 
    }

    const thinkTimer = setTimeout(() => {
      const idealRange = currentMonster.aiType === 'archer' ? 3 : currentMonster.aiType === 'caster' ? 4 : 1;
      const reachable = getReachableCells({ x: currentMonster.x, y: currentMonster.y }, monsterMovement, (nx, ny) => isCellBlocked(nx, ny, currentMonster.id));
      
      let bestCell = { x: currentMonster.x, y: currentMonster.y };
      let bestScore = Infinity;
      reachable.forEach(cell => {
        const dist = getDistance(cell, playerPos);
        const score = Math.abs(dist - idealRange);
        if (score < bestScore) { 
          bestScore = score; 
          bestCell = cell; 
        }
      });

      const path = getBfsPath({ x: currentMonster.x, y: currentMonster.y }, bestCell, monsterMovement, (nx, ny) => isCellBlocked(nx, ny, currentMonster.id)) || [];
      setMonsterTrail(path);

      const finalizeMonsterTurn = (finalPos) => {
        const finalDist = getDistance(finalPos, playerPos);
        const isVisible = visibleTiles.has(`${finalPos.x},${finalPos.y}`);
        const mName = isVisible ? currentMonster.title : 'Unknown Entity';
        
        let actionType = 'attack';
        let chosenSpell = null;

        if (currentMonster.skills && currentMonster.skills.length > 0 && Math.random() < 0.40) {
          const randomSkillId = currentMonster.skills[Math.floor(Math.random() * currentMonster.skills.length)];
          chosenSpell = spellsCatalog.find(s => s.id === randomSkillId);
          if (chosenSpell) actionType = 'spell';
        }

        const hasLoS = checkLineOfSight(finalPos, playerPos, battleMap.mapData);

        if (actionType === 'spell') {
          const castStatKey = chosenSpell.stat || chosenSpell.scalingStat || 'intelligence';
          const monsterCastScore = currentMonster.stats ? currentMonster.stats[castStatKey.toLowerCase()] : 10;
          const spellMod = getModifier(monsterCastScore || 10);

          if (chosenSpell.healAmount) {
            const heal = Math.max(0, rollDice(chosenSpell.healAmount) + spellMod);
            setMonsters(prev => prev.map(m => m.id === currentMonster.id ? { ...m, hp: Math.min(m.maxHp, m.hp + heal) } : m));
            log(`✨ [${currentMonster.title}] Casts ${chosenSpell.name}! Heals for ${heal} HP.`);
            setLastActionRecap({ icon: '✨', text: `${mName} healed for ${heal} HP.` });
            addFloatingText(currentMonster.x, currentMonster.y, `+${heal}`, 'text-emerald-400');
          } else if (finalDist <= (chosenSpell.range || 5)) {
            if (!hasLoS) {
              log(`👣 [${currentMonster.title}] tries to cast a spell but is blocked by cover!`);
              setLastActionRecap({ icon: '👣', text: `${mName} attempted to cast but was blocked.` });
            } else {
              const spellDmg = Math.max(0, rollDice(chosenSpell.damageDice || "1d6") + spellMod);
              setPlayerHp((prev) => Math.max(0, prev - spellDmg));
              log(`☄️ [${currentMonster.title}] Casts ${chosenSpell.name}! Deals ${spellDmg} damage to you.`);
              setLastActionRecap({ icon: '☄️', text: `${mName} cast ${chosenSpell.name} for ${spellDmg} damage!` });
              addFloatingText(playerPos.x, playerPos.y, `-${spellDmg}`, 'text-orange-500');
            }
          } else {
            log(`👣 [${currentMonster.title}] tries to cast a spell but you are out of range!`);
            setLastActionRecap({ icon: '👣', text: `${mName} repositioned.` });
          }
        } else if (currentMonster.aiType === 'archer' && finalDist <= 4) {
          if (!hasLoS) {
            log(`👣 [${currentMonster.title}] loses sight of you behind cover and repositions!`);
            setLastActionRecap({ icon: '👣', text: `${mName} repositioned to seek line of sight.` });
          } else {
            const d20 = rollD20();
            const monsterAtkMod = currentMonster.stats ? getModifier(currentMonster.stats.dexterity) : (encounter.tier || 1);
            const totalAtk = d20 + monsterAtkMod;
            const baseDmg = Math.max(0, rollDice("1d6") + monsterAtkMod);
            log(`🏹 [${currentMonster.title}] Shot: d20(${d20}) + ${monsterAtkMod} = ${totalAtk} vs Player AC ${effectivePlayerAC}`);
            
            if (totalAtk >= effectivePlayerAC) {
              setPlayerHp((prev) => Math.max(0, prev - baseDmg));
              log(`🎯 HIT! Deals ${baseDmg} damage.`);
              setLastActionRecap({ icon: '🎯', text: `${mName} shot you for ${baseDmg} damage!` });
              addFloatingText(playerPos.x, playerPos.y, `-${baseDmg}`, 'text-red-500');
            } else {
              log(`❌ MISS! Arrow dodged.`);
              setLastActionRecap({ icon: '❌', text: `${mName} fired an arrow and missed.` });
              addFloatingText(playerPos.x, playerPos.y, 'Miss', 'text-slate-400');
            }
          }
        } else if (finalDist <= 1) {
          const d20 = rollD20();
          const monsterAtkMod = currentMonster.stats ? getModifier(currentMonster.stats.strength) : (encounter.tier || 1);
          const totalAtk = d20 + monsterAtkMod;
          const baseDmg = Math.max(0, rollDice("1d8") + monsterAtkMod);
          log(`⚔️ [${currentMonster.title}] Strike: d20(${d20}) + ${monsterAtkMod} = ${totalAtk} vs Player AC ${effectivePlayerAC}`);

          if (totalAtk >= effectivePlayerAC) {
            setPlayerHp((prev) => Math.max(0, prev - baseDmg));
            log(`🎯 HIT! Deals ${baseDmg} damage.`);
            setLastActionRecap({ icon: '🎯', text: `${mName} struck you for ${baseDmg} damage!` });
            addFloatingText(playerPos.x, playerPos.y, `-${baseDmg}`, 'text-red-500');
          } else {
            log(`❌ MISS! Attack deflected.`);
            setLastActionRecap({ icon: '❌', text: `${mName} attacked and missed.` });
            addFloatingText(playerPos.x, playerPos.y, 'Miss', 'text-slate-400');
          }
        } else {
          log(`👣 [${currentMonster.title}] repositions.`);
          setLastActionRecap({ icon: '👣', text: `${mName} repositioned.` });
        }
        advanceTurn();
      };

      animateMovement(path, currentMonster.id, () => finalizeMonsterTurn(path.length > 0 ? path[path.length - 1] : currentMonster));
    }, 600);

    return () => clearTimeout(thinkTimer);
  }, [currentActor, monsters, playerPos, isAnimating, isCovered, battleMap, battleResult, effectivePlayerAC, visibleTiles, pendingRoll]);

  useEffect(() => {
    if (battleResult !== null) return; 
    
    if (monsters.length > 0 && monsters.every(m => m.hp <= 0)) {
      if (!encounter.isBoss) {
        const xp = encounter.success?.xp || 40;
        const [minGold, maxGold] = encounter.success?.goldRange || [0, 0];
        const gold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        
        const drops = [];
        (encounter.success?.lootTable || []).forEach(drop => {
          if (Math.floor(Math.random() * 100) + 1 <= drop.dropChance) {
            const catalogItem = itemsCatalog.find(i => i.id === drop.id);
            if (catalogItem) drops.push({ ...catalogItem, uid: crypto.randomUUID() });
          }
        });

        if (Math.random() < 0.25) {
          drops.push({
            id: 'item_expedition_key', uid: crypto.randomUUID(), name: 'Expedition Key', type: 'Material', value: 50, sprite: '', description: 'A glowing key. Unlocks extra loot at the end of the expedition.'
          });
        }
        setEarnedRewards({ xp, gold, items: drops });
      }

      setTimeout(() => setBattleResult('victory'), 1500);
    } else if (playerHp <= 0) {
      setTimeout(() => setBattleResult('defeat'), 1500);
    }
  }, [monsters, playerHp, battleResult, encounter]);

  const handleTakeCover = () => {
    if (actionsLeft <= 0 || pendingRoll) { log("⚠️ No actions left!"); return; }
    setIsCovered(true);
    setActionsLeft(prev => prev - 1);
    setLastActionRecap({ icon: '🛡️', text: 'You took cover (+2 AC).' });
    log("🛡️ You take cover! AC increased by +2 for incoming attacks.");
    addFloatingText(playerPos.x, playerPos.y, '+2 AC', 'text-cyan-400');
  };

  const handleDisengage = () => {
    if (actionsLeft <= 0 || pendingRoll) { log("⚠️ No actions left!"); return; }
    setHasDisengaged(true);
    setActionsLeft(prev => prev - 1);
    setLastActionRecap({ icon: '💨', text: 'You disengaged from melee.' });
    log("💨 You Disengage. Moving will not provoke Attacks of Opportunity.");
    addFloatingText(playerPos.x, playerPos.y, 'Disengage', 'text-indigo-400');
  };

  const handleWeaponSwap = () => {
    if (actionsLeft <= 0 || pendingRoll) { log("⚠️ No actions left!"); return; }
    setSelectedWeaponSlot(prev => prev === 'mainHand' ? 'offHand' : 'mainHand');
    setActionsLeft(prev => prev - 1);
    setLastActionRecap({ icon: '⚔️', text: 'You swapped your equipped gear.' });
    log("⚔️ Switched gear.");
  };

  const handleDrinkPotionInCombat = (potion) => {
    if (actionsLeft <= 0 || pendingRoll) { log("⚠️ No actions left!"); return; }
    setPlayerHp(prev => Math.min(character.health.max, prev + potion.healAmount));
    setActionsLeft(prev => prev - 1);
    useConsumable(potion);
    setLastActionRecap({ icon: '🧪', text: `You drank a potion (+${potion.healAmount} HP).` });
    log(`🧪 Drank [${potion.name}]! Restored ${potion.healAmount} HP.`);
    addFloatingText(playerPos.x, playerPos.y, `+${potion.healAmount}`, 'text-emerald-400');
  };

  const executeMeleeAttack = (target) => {
    setActionsLeft(prev => prev - 1);
    setActiveAction(null); 

    const d20 = rollD20();
    const totalAtk = d20 + strMod + proficiencyBonus;
    const targetAC = target.ac || 12;
    const isHit = totalAtk >= targetAC;
    
    const diceSize = parseInt(equippedWeapon.damageDice) || 4;
    const dmgRoll = rollDice(diceSize);
    const totalDmg = Math.max(0, dmgRoll + strMod);

    setPendingRoll({
      type: 'attack',
      title: `Melee Attack vs ${target.title}`,
      d20: { face: 20, result: d20, mod: strMod + proficiencyBonus, targetDC: targetAC },
      damage: { face: diceSize, result: dmgRoll, mod: strMod, label: 'Damage' },
      isHit: isHit,
      onComplete: () => {
        setPendingRoll(null);
        log(`⚔️ Melee vs [${target.title}]: d20(${d20}) + STR(${strMod}) + PB(${proficiencyBonus}) = ${totalAtk} vs AC ${targetAC}`);
        
        if (isHit) {
          setMonsters(prev => prev.map(m => m.id === target.id ? { ...m, hp: Math.max(0, m.hp - totalDmg) } : m));
          log(`💥 HIT! Deals ${totalDmg} damage to ${target.title}.`);
          setLastActionRecap({ icon: '💥', text: `You dealt ${totalDmg} damage to ${target.title}.` });
          addFloatingText(target.x, target.y, `-${totalDmg}`, 'text-yellow-400');
        } else {
          log(`❌ MISS!`);
          setLastActionRecap({ icon: '❌', text: `Your melee attack missed.` });
          addFloatingText(target.x, target.y, 'Miss', 'text-slate-400');
        }
      }
    });
  };

  const executeRangedAttack = (target) => {
    setActionsLeft(prev => prev - 1);
    setActiveAction(null); 

    const d20 = rollD20();
    const totalAtk = d20 + dexMod + proficiencyBonus;
    const targetAC = target.ac || 12;
    const isHit = totalAtk >= targetAC;
    
    const diceSize = parseInt(equippedWeapon.damageDice) || 4;
    const dmgRoll = rollDice(diceSize);
    const totalDmg = Math.max(0, dmgRoll + dexMod);

    setPendingRoll({
      type: 'attack',
      title: `Ranged Attack vs ${target.title}`,
      d20: { face: 20, result: d20, mod: dexMod + proficiencyBonus, targetDC: targetAC },
      damage: { face: diceSize, result: dmgRoll, mod: dexMod, label: 'Damage' },
      isHit: isHit,
      onComplete: () => {
        setPendingRoll(null);
        log(`🏹 Ranged vs [${target.title}]: d20(${d20}) + DEX(${dexMod}) + PB(${proficiencyBonus}) = ${totalAtk} vs AC ${targetAC}`);
        
        if (isHit) {
          setMonsters(prev => prev.map(m => m.id === target.id ? { ...m, hp: Math.max(0, m.hp - totalDmg) } : m));
          log(`💥 HIT! Deals ${totalDmg} damage to ${target.title}.`);
          setLastActionRecap({ icon: '💥', text: `You shot ${target.title} for ${totalDmg} damage.` });
          addFloatingText(target.x, target.y, `-${totalDmg}`, 'text-yellow-400');
        } else {
          log(`❌ MISS!`);
          setLastActionRecap({ icon: '❌', text: `Your ranged attack missed.` });
          addFloatingText(target.x, target.y, 'Miss', 'text-slate-400');
        }
      }
    });
  };

  const handleGridClick = (x, y) => {
    // PREVENT ALL ACTIONS IF A ROLL OR ANIMATION IS IN PROGRESS
    if (!currentActor.isPlayer || isAnimating || battleResult !== null || pendingRoll) return;

    if (activeAction) {
      
      // HARD LOCKOUT: Stop spell spam exploits
      if (actionsLeft <= 0) {
        log("⚠️ No actions left this turn!");
        setActiveAction(null);
        return;
      }
        
      if (activeAction === 'melee') {
        const target = monsters.find(m => m.hp > 0 && m.x === x && m.y === y);
        if (!target) { log("⚠️ No enemy at target location!"); return; }
        if (getDistance(playerPos, target) !== 1) { log("⚠️ Target is out of melee range!"); return; }
        executeMeleeAttack(target);
        return;
      }

      if (activeAction === 'ranged') {
        const target = monsters.find(m => m.hp > 0 && m.x === x && m.y === y);
        if (!target) { log("⚠️ No enemy at target location!"); return; }
        const dist = getDistance(playerPos, { x, y });
        if (dist > (equippedWeapon.range || 1)) { log(`⚠️ Target out of range!`); return; }
        if (!checkLineOfSight(playerPos, { x, y }, battleMap.mapData)) { log(`⚠️ Target is blocked by cover!`); return; }
        executeRangedAttack(target);
        return;
      }

      const activeSpell = activeAction;
      const dist = getDistance(playerPos, { x, y });
      if (dist > activeSpell.range && activeSpell.range > 0) { 
        log(`⚠️ Target is out of range!`); 
        return; 
      }
      if (!checkLineOfSight(playerPos, { x, y }, battleMap.mapData) && !activeSpell.healAmount) { 
        log(`⚠️ Target location is blocked!`); 
        return; 
      }

      // INSTANTLY DEDUCT AND CLEAR TO PREVENT SPAM EXPLOIT
      setActionsLeft(prev => prev - 1);
      consumeSpellCharge(activeSpell.id);
      setActiveAction(null);
      setHoveredCell(null);

      const statKey = activeSpell.stat || activeSpell.scalingStat || 'intelligence';
      const castMod = getModifier(character.stats[statKey.toLowerCase()]);

      if (activeSpell.category === 'heal') {
        const diceSize = parseInt(activeSpell.healAmount) || 8;
        const healRoll = rollDice(diceSize);
        const totalHeal = Math.max(0, healRoll + castMod);
        
        setPendingRoll({
          type: 'heal',
          title: `Casting ${activeSpell.name}`,
          damage: { face: diceSize, result: healRoll, mod: castMod, label: 'Heal' },
          onComplete: () => {
            setPendingRoll(null);
            setPlayerHp(prev => Math.min(character.health.max, prev + totalHeal));
            log(`✨ Cast ${activeSpell.name}! Healed for ${totalHeal} HP.`);
            setLastActionRecap({ icon: '✨', text: `You healed yourself for ${totalHeal} HP.` });
            addFloatingText(playerPos.x, playerPos.y, `+${totalHeal}`, 'text-emerald-400');
          }
        });
      } else {
        const diceSize = parseInt(activeSpell.damageDice) || 6;
        const dmgRoll = rollDice(diceSize);
        const totalDmg = Math.max(0, dmgRoll + castMod);
        
        setPendingRoll({
          type: 'spell',
          title: `Casting ${activeSpell.name}`,
          damage: { face: diceSize, result: dmgRoll, mod: castMod, label: 'Damage' },
          onComplete: () => {
            setPendingRoll(null);
            log(`✨ Cast ${activeSpell.name} at [${x}, ${y}]!`);
            addFloatingText(x, y, '💥', 'text-cyan-400');
            
            let hitCount = 0;
            setMonsters(prev => prev.map(m => {
              if (m.hp > 0 && Math.abs(m.x - x) <= Math.floor(activeSpell.radius / 2) && Math.abs(m.y - y) <= Math.floor(activeSpell.radius / 2)) {
                hitCount++;
                log(`💥 ${activeSpell.name} hits ${m.title} for ${totalDmg} damage!`);
                addFloatingText(m.x, m.y, `-${totalDmg}`, 'text-yellow-400');
                return { ...m, hp: Math.max(0, m.hp - totalDmg) };
              }
              return m;
            }));
            setLastActionRecap({ icon: '☄️', text: `You cast ${activeSpell.name}, hitting ${hitCount} targets for ${totalDmg} dmg!` });
          }
        });
      }
      return;
    }

    if (movementLeft <= 0) { log("⚠️ No movement left this turn."); return; }
    if (isCellBlocked(x, y, 'player')) { log("⚠️ Tile blocked."); return; }

    const path = getBfsPath(playerPos, { x, y }, movementLeft, (nx, ny) => isCellBlocked(nx, ny, 'player'));
    if (!path) { log("⚠️ Out of range."); return; }

    if (previewPos && previewPos.x === x && previewPos.y === y) {
      setPreviewPos(null);
      setMonsterTrail([]);

      let aooLogs = [];
      let aooDamage = 0;
      let reactionUsed = new Set();

      if (!hasDisengaged) {
        for (let i = 0; i < path.length; i++) {
          const prevNode = i === 0 ? playerPos : path[i - 1];
          const currNode = path[i];
          
          monsters.filter(m => m.hp > 0).forEach(m => {
            if (getDistance(prevNode, m) === 1 && getDistance(currNode, m) > 1 && !reactionUsed.has(m.id)) {
              reactionUsed.add(m.id);
              const d20 = rollD20();
              const atkMod = m.stats ? getModifier(m.stats.strength) : (encounter.tier || 1);
              const totalAtk = d20 + atkMod;
              
              if (totalAtk >= effectivePlayerAC) {
                const dmg = Math.max(0, rollDice("1d8") + atkMod);
                aooDamage += dmg;
                aooLogs.push(`⚠️ AoO: [${m.title}] strikes for ${dmg} as you flee!`);
              } else {
                aooLogs.push(`💨 AoO: Dodged parting strike from [${m.title}]!`);
              }
            }
          });
        }
      }

      animateMovement(path, 'player', () => { 
        setMovementLeft(prev => prev - path.length);
        if (aooDamage > 0) {
          setPlayerHp(prev => Math.max(0, prev - aooDamage));
          addFloatingText(x, y, `-${aooDamage}`, 'text-red-500');
        }
        aooLogs.forEach(msg => log(msg));
        log(`🚶 Moved to [${x}, ${y}]. (${path.length} movement used)`); 
        setLastActionRecap({ icon: '🚶', text: `You moved ${path.length} tiles.` });
      });

    } else {
      setPreviewPos({ x, y });
      setPlayerTrail(path);
      setMonsterTrail([]);
    }
  };

  const startMeleeTargeting = () => {
    if (isCovered) { log("⚠️ You cannot use Melee Attack while taking cover!"); return; }
    const targets = monsters.filter(m => m.hp > 0 && getDistance(playerPos, m) === 1);
    if (targets.length === 0) { log("⚠️ No targets in melee range!"); return; }
    setActiveAction('melee');
    log("⚔️ Click an adjacent enemy to attack!");
  };

  const startRangedTargeting = () => {
    const weaponRange = equippedWeapon.range || 1;
    const targets = monsters.filter(m => m.hp > 0 && getDistance(playerPos, m) <= weaponRange && checkLineOfSight(playerPos, m, battleMap.mapData));
    if (targets.length === 0) { log(`⚠️ No targets in weapon range (${weaponRange} tiles) with line of sight!`); return; }
    setActiveAction('ranged');
    log("🏹 Click an enemy in range to shoot!");
  };

  const renderGrid = () => {
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
                style={{ 
                  width: `calc(100% * ${cellData.spanX})`, 
                  height: `calc(100% * ${cellData.spanY})`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  objectFit: 'fill',
                  imageRendering: 'pixelated'
                }} 
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

            {isPlayer && (
              <div className="absolute w-3/4 h-3/4 bg-emerald-500 rounded-full flex items-center justify-center z-40 shadow-lg border-2 border-emerald-300">
                <span className="font-bold text-slate-900 text-sm md:text-lg">P</span>
              </div>
            )}
            
            {isMonster && residentMonster.sprite && (
              <>
                <div className="absolute inset-0 m-auto w-4/5 h-4/5 bg-white rounded-full border-2 border-red-600 z-30 pointer-events-none shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                <img 
                  src={residentMonster.sprite} 
                  alt={residentMonster.title} 
                  className="w-[70%] h-[70%] object-contain absolute inset-0 m-auto z-40" 
                  style={{ imageRendering: 'pixelated' }} 
                />
              </>
            )}
            
            {floatingTexts.filter(ft => ft.x === x && ft.y === y).map(ft => (
              <span key={ft.id} className={`absolute z-[200] pointer-events-none floating-hit-text ${ft.colorClass}`}>{ft.text}</span>
            ))}
          </div>
        );
      }
    }
    return cells;
  };

  const isRanged = equippedWeapon?.range > 1; 
  const hitModifier = (isRanged ? dexMod : strMod) + proficiencyBonus;
  const modString = hitModifier === 0 ? '' : hitModifier > 0 ? `+${hitModifier}` : `${hitModifier}`;
  const damageDisplay = equippedWeapon ? `1d${equippedWeapon.damageDice}${modString}` : `1${modString}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 md:p-6 font-mono">
      
      {/* EPIC RETRO FLOATING TEXT CSS */}
      <style>{`
        @keyframes retroFloat {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          80% { opacity: 1; transform: translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
        }
        .floating-hit-text {
          animation: retroFloat 2.5s ease-out forwards;
          font-family: 'Press Start 2P', 'Courier New', Courier, monospace;
          font-weight: 900;
          font-size: 2.5rem;
          text-shadow: 3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 5px 0 #000;
        }
      `}</style>

      {/* NEW DICE ROLL MODAL */}
      {pendingRoll && (
        <DiceRollModal rollData={pendingRoll} onComplete={pendingRoll.onComplete} />
      )}

      {isSpellbookModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-4 border-cyan-500 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col text-slate-100 max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-800 pb-3">
              <h3 className="text-xl font-black text-cyan-400 uppercase tracking-widest">Select Spell / Skill</h3>
              <button onClick={() => setIsSpellbookModalOpen(false)} className="w-8 h-8 bg-slate-800 text-white rounded font-bold cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {character.learnedSpells?.map(spellId => {
                const spell = spellsCatalog.find(s => s.id === spellId);
                const charges = character.spellCharges?.[spellId] ?? 0;
                if (!spell) return null;
                return (
                  <button
                    key={spell.id} onClick={() => { setActiveAction(spell); setIsSpellbookModalOpen(false); }} disabled={charges <= 0}
                    className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl text-left flex justify-between items-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-cyan-300">{spell.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{spell.element} {spell.type} • Range: {spell.range} • Charges: {charges}</div>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded border ${charges > 0 ? 'bg-slate-900 text-yellow-400 border-slate-800' : 'bg-red-950/40 text-red-500 border-red-900'}`}>
                      {charges > 0 ? `${charges} left` : 'Out of Charges'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {battleResult && !pendingRoll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono animate-in fade-in duration-500">
          <div className={`border-4 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-6 ${battleResult === 'victory' ? 'bg-slate-900 border-emerald-500' : 'bg-red-950 border-red-600'}`}>
            <div className="text-center">
              <h2 className={`text-4xl font-black uppercase tracking-widest ${battleResult === 'victory' ? 'text-emerald-400' : 'text-red-500'}`}>
                {battleResult === 'victory' ? 'Victory!' : 'Defeat...'}
              </h2>
              {battleResult === 'defeat' && <p className="text-slate-400 text-sm mt-2">Your strength has failed you. You must rest.</p>}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-inner">
              <span className="text-slate-400 uppercase tracking-widest text-xs font-bold">Final Player HP</span>
              <span className={`text-xl font-black ${playerHp > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                {playerHp} / {character.health.max}
              </span>
            </div>

            {battleResult === 'victory' && !encounter.isBoss && earnedRewards && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
                <span className="text-slate-400 uppercase tracking-widest text-xs font-bold border-b border-slate-800 pb-2">Combat Rewards</span>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-400 font-bold">💰 Gold Looted</span>
                  <span className="text-slate-200">+{earnedRewards.gold}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cyan-400 font-bold">✨ Experience</span>
                  <span className="text-slate-200">+{earnedRewards.xp} XP</span>
                </div>
                
                {earnedRewards.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest block mb-2 font-bold">Items Found</span>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                      {earnedRewards.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-2 rounded-lg">
                          {item.sprite ? <img src={item.sprite} alt={item.name} className="w-8 h-8 object-contain bg-slate-950 rounded border border-slate-800" style={{ imageRendering: 'pixelated' }}/> : <div className="w-8 h-8 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-[8px] text-slate-500">IMG</div>}
                          <div>
                            <span className="text-emerald-400 font-bold text-xs block">{item.name}</span>
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider">{item.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {battleResult === 'victory' && encounter.isBoss && (
              <div className="bg-slate-950 border border-amber-900/50 rounded-xl p-6 flex flex-col items-center gap-3 text-center shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
                <span className="text-4xl drop-shadow-md relative z-10">🗝️</span>
                <div className="relative z-10">
                  <span className="text-amber-400 font-black tracking-widest uppercase block text-lg">The Vault is Unlocked</span>
                  <p className="text-slate-400 text-xs mt-1">Your Expedition Keys will now be consumed to unlock additional boss chests!</p>
                </div>
              </div>
            )}

            <button
              onClick={() => onCombatEnd(battleResult === 'victory', playerHp, earnedRewards)}
              className={`w-full py-4 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:brightness-110 cursor-pointer ${battleResult === 'victory' && encounter.isBoss ? 'bg-amber-500 border-b-4 border-amber-700' : battleResult === 'victory' ? 'bg-emerald-500 border-b-4 border-emerald-700' : 'bg-red-500 border-b-4 border-red-700 text-white'}`}
            >
              {battleResult === 'victory' && encounter.isBoss ? 'Proceed to Treasure Vault ➔' : battleResult === 'victory' ? 'Claim Loot & Continue' : 'Return to Camp'}
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1400px] h-full max-h-[95vh] bg-slate-900 rounded-xl border-4 border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* COMBAT HUD */}
        <div className="flex justify-between items-center p-4 bg-slate-950 border-b-4 border-slate-800 shrink-0 gap-4">
          <div className="flex gap-4">
            
            <div className="bg-emerald-900/50 border-2 border-emerald-500 px-4 py-1.5 rounded flex flex-col items-center min-w-[120px]">
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Player HP</span>
              <span className="text-xl text-white font-black">{playerHp} <span className="text-emerald-500/50">/</span> {character.health.max}</span>
            </div>

            <div className="bg-indigo-950/50 border-2 border-indigo-500 px-4 py-1.5 rounded flex flex-col items-center min-w-[80px] hidden sm:flex">
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Actions</span>
              <span className="text-xl text-white font-black">{actionsLeft} <span className="text-indigo-500/50">/</span> 1</span>
            </div>

            <div className="bg-indigo-950/50 border-2 border-indigo-500 px-4 py-1.5 rounded flex flex-col items-center min-w-[80px] hidden md:flex">
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Move</span>
              <span className="text-xl text-white font-black">{movementLeft} <span className="text-indigo-500/50">/</span> {playerMaxMovement}</span>
            </div>

            <div className={`bg-indigo-950/30 border-2 ${flankingPenalty > 0 ? 'border-red-500' : 'border-indigo-900'} px-4 py-1.5 rounded flex flex-col items-center min-w-[80px] hidden lg:flex group relative cursor-help`}>
              <span className={`${flankingPenalty > 0 ? 'text-red-400' : 'text-indigo-400'} font-bold text-[10px] uppercase tracking-widest`}>Armor</span>
              <span className={`text-xl text-white font-black ${flankingPenalty > 0 && 'text-red-400'}`}>{effectivePlayerAC}</span>
              <div className="absolute top-full mt-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] px-3 py-2 rounded shadow-xl z-50 pointer-events-none border border-slate-600 text-center">
                <span className={`font-bold ${flankingPenalty > 0 ? 'text-red-400' : 'text-indigo-400'} mb-1 block`}>Armor Class (AC)</span>
                Base: {character.armorClass} <br/>
                {isCovered && <span className="text-cyan-400">+2 (Covered)<br/></span>}
                {flankingPenalty > 0 && <span className="text-red-400">-{flankingPenalty} (Flanked!)</span>}
              </div>
            </div>
            
            <div className="bg-orange-950/50 border-2 border-orange-500 px-4 py-1.5 rounded flex flex-col items-center min-w-[100px] hidden xl:flex">
              <span className="text-orange-400 font-bold text-[10px] uppercase tracking-widest">Damage</span>
              <span className="text-lg text-white font-black">{damageDisplay}</span>
            </div>

          </div>
          
          <div className={`px-6 py-2 border-2 border-dashed rounded text-sm md:text-lg font-black uppercase tracking-widest truncate ${currentActor.isPlayer ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}>
            {currentActor.isPlayer ? (activeAction ? (typeof activeAction === 'object' ? `Casting: ${activeAction.name}` : `Targeting (${activeAction})`) : "Your Turn") : `${currentActor.name}'s Turn`}
          </div>
        </div>

        {/* INITIATIVE TRACKER */}
        <div className="bg-slate-900 border-b-4 border-slate-800 p-2 flex items-center overflow-x-auto gap-2 shrink-0 [&::-webkit-scrollbar]:h-1">
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
              <div key={actor.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 shrink-0 transition-all ${isCurrent ? 'bg-indigo-600 border-indigo-300 scale-105 shadow-md z-10 text-white' : isDead ? 'bg-slate-950 border-slate-800 opacity-40 text-slate-600' : isHidden ? 'bg-slate-900 border-slate-700 text-slate-400 border-dashed' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                <span className="text-xs">{displayIcon}</span>
                <span className="text-[10px] font-bold uppercase whitespace-nowrap">{displayName}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
          
          <div className="flex-1 overflow-auto bg-[#05050a] relative p-12 lg:p-24 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-950 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="w-max h-max mx-auto">
              <div className="grid gap-0 border-4 border-slate-900 shadow-2xl relative bg-slate-900" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                {renderGrid()}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-slate-950 border-t-4 lg:border-t-0 lg:border-l-4 border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            
            <div className="bg-slate-900 border border-indigo-900/50 p-3 rounded-lg flex items-center gap-3 shadow-inner shrink-0">
              <span className="text-2xl drop-shadow-md">{lastActionRecap.icon}</span>
              <div>
                <span className="text-indigo-400 font-bold block uppercase tracking-widest text-[9px] mb-0.5">Last Action Track</span>
                <span className="text-white text-xs font-bold leading-tight block">{lastActionRecap.text}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-emerald-900/50 p-3 rounded text-xs space-y-2">
              <span className="text-emerald-400 font-bold block uppercase tracking-wider border-b border-slate-800 pb-1.5">Quick Potions (1 Act)</span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {character.inventory.filter(i => i.type === 'Consumable' && i.category === 'heal').length === 0 ? (
                  <div className="text-slate-600 italic py-1">No potions in inventory</div>
                ) : (
                  character.inventory
                    .filter(i => i.type === 'Consumable' && i.category === 'heal')
                    .map(potion => (
                      <button
                        key={potion.uid}
                        onClick={() => handleDrinkPotionInCombat(potion)}
                        disabled={!currentActor.isPlayer || actionsLeft <= 0 || battleResult !== null || pendingRoll}
                        className="w-full p-2 bg-slate-950 hover:bg-slate-800 text-emerald-300 font-bold rounded flex justify-between items-center disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        <span className="truncate">{potion.name}</span>
                        <span className="text-[10px] text-yellow-400 shrink-0 ml-2">+{potion.healAmount} HP</span>
                      </button>
                    ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTakeCover}
                disabled={!currentActor.isPlayer || actionsLeft <= 0 || isCovered || battleResult !== null || pendingRoll}
                className="py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold uppercase rounded text-[10px] shadow-md transition-all cursor-pointer"
              >
                {isCovered ? '🛡️ Covered (+2)' : '🛡️ Take Cover'}
              </button>

              <button
                onClick={handleDisengage}
                disabled={!currentActor.isPlayer || actionsLeft <= 0 || hasDisengaged || battleResult !== null || pendingRoll}
                className="py-2.5 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold uppercase rounded text-[10px] shadow-md transition-all cursor-pointer"
              >
                {hasDisengaged ? '💨 Disengaging' : '💨 Disengage'}
              </button>

              <button
                onClick={handleWeaponSwap}
                disabled={!currentActor.isPlayer || actionsLeft <= 0 || battleResult !== null || pendingRoll}
                className="py-2.5 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold uppercase rounded text-[10px] shadow-md transition-all cursor-pointer col-span-2"
              >
                ⚔️ Swap Gear
              </button>
            </div>

            <button
              onClick={() => setIsSpellbookModalOpen(true)}
              disabled={!currentActor.isPlayer || isAnimating || battleResult !== null || pendingRoll || actionsLeft <= 0}
              className="py-3 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:border-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold uppercase rounded-lg border-b-4 border-cyan-900 transition-all text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>📖</span> Open Spellbook
            </button>

            <div className="bg-slate-900 border border-red-900/50 p-3 rounded text-xs space-y-2 shrink-0">
              <span className="text-red-400 font-bold block uppercase tracking-wider mb-1 border-b border-red-950 pb-1.5">Target Health Status</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {monsters.filter(m => visibleTiles.has(`${m.x},${m.y}`)).map(m => (
                  <div key={m.id} className={`flex justify-between items-center ${m.hp <= 0 ? 'line-through opacity-40 text-slate-500' : 'text-slate-300'}`}>
                    <span className="truncate pr-2">M{m.id + 1}: {m.title}</span>
                    <span className={`font-black shrink-0 ${m.hp > 0 ? 'text-red-400' : 'text-slate-600'}`}>{Math.max(0, m.hp)} / {m.maxHp} HP</span>
                  </div>
                ))}
                {monsters.filter(m => visibleTiles.has(`${m.x},${m.y}`)).length === 0 && (
                  <span className="text-slate-500 italic block py-1">No enemies in line of sight...</span>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded p-3 overflow-y-auto flex-1 min-h-[120px]">
              <h4 className="text-slate-500 text-[10px] font-black mb-2 uppercase tracking-widest">Combat Log</h4>
              <div className="space-y-1.5">
                {combatLogs.map((msg, i) => (
                  <div key={i} className={`text-[10px] leading-tight ${i === combatLogs.length - 1 ? 'text-white font-bold' : 'text-slate-500'}`}>
                    &gt; {msg}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-2 shrink-0">
              {equippedWeapon.range > 1 ? (
                <button 
                  onClick={startRangedTargeting}
                  disabled={!currentActor.isPlayer || isAnimating || activeAction !== null || actionsLeft <= 0 || battleResult !== null || pendingRoll}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:border-slate-900 text-white disabled:text-slate-600 font-bold uppercase rounded-lg border-b-4 border-amber-800 text-xs shadow-lg cursor-pointer transition-colors"
                >
                  Ranged Attack<br/><span className="text-[10px] font-normal">({equippedWeapon.name})</span>
                </button>
              ) : (
                <button 
                  onClick={startMeleeTargeting}
                  disabled={!currentActor.isPlayer || isAnimating || activeAction !== null || actionsLeft <= 0 || isCovered || battleResult !== null || pendingRoll}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:border-slate-900 text-white disabled:text-slate-600 font-bold uppercase rounded-lg border-b-4 border-red-800 text-xs shadow-lg cursor-pointer transition-colors"
                >
                  {isCovered ? 'Melee Disabled (Covered)' : (
                    <>Melee Attack<br/><span className="text-[10px] font-normal">({equippedWeapon.name})</span></>
                  )}
                </button>
              )}

              <button 
                onClick={advanceTurn}
                disabled={!currentActor.isPlayer || isAnimating || battleResult !== null || pendingRoll}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 font-bold uppercase rounded border-b-4 border-slate-900 text-xs cursor-pointer transition-colors"
              >
                End Turn
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default TacticalCombat;