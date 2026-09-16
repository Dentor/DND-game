import { useState, useEffect, useRef } from 'react';
import { getDistance, checkLineOfSight, getBfsPath, getReachableCells, generateBattleMap } from '../utils/combatUtils';
import { getModifier, rollDice } from '../utils/diceUtils';
import spellsCatalog from '../data/mockSpells.json';

const rollD20 = () => Math.floor(Math.random() * 20) + 1;

export const useCombatEngine = ({ character, encounter, onCombatEnd, consumeSpellCharge, useConsumable }) => {
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
  
  // FIX 5: BONUS ACTIONS ADDED
  const [actionsLeft, setActionsLeft] = useState(1);
  const [bonusActionsLeft, setBonusActionsLeft] = useState(1);
  
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
    if (!path || path.length === 0) { if (onComplete) onComplete(); return; }
    setIsAnimating(true);
    let step = 0;
    const interval = setInterval(() => {
      const currentStep = path[step]; 
      if (currentStep) {
        if (actorId === 'player') setPlayerPos(currentStep);
        else setMonsters(prev => prev.map(m => m.id === actorId ? { ...m, x: currentStep.x, y: currentStep.y } : m));
      }
      step++;
      if (step >= path.length) { clearInterval(interval); setIsAnimating(false); if (onComplete) onComplete(); }
    }, 200);
  };

  useEffect(() => {
    if (currentActor.isPlayer) {
      setActionsLeft(1);
      setBonusActionsLeft(1); // FIX 5: Reset Bonus Action
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
    if (!currentMonster || currentMonster.hp <= 0) { advanceTurn(); return; }

    const thinkTimer = setTimeout(() => {
      const idealRange = currentMonster.aiType === 'archer' ? 3 : currentMonster.aiType === 'caster' ? 4 : 1;
      const reachable = getReachableCells({ x: currentMonster.x, y: currentMonster.y }, monsterMovement, (nx, ny) => isCellBlocked(nx, ny, currentMonster.id));
      
      let bestCell = { x: currentMonster.x, y: currentMonster.y };
      let bestScore = Infinity;
      reachable.forEach(cell => {
        const dist = getDistance(cell, playerPos);
        const score = Math.abs(dist - idealRange);
        if (score < bestScore) { bestScore = score; bestCell = cell; }
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
              log(`👣 [${currentMonster.title}] tries to cast but is blocked by cover!`);
              setLastActionRecap({ icon: '👣', text: `${mName} attempted to cast but was blocked.` });
            } else {
              const spellDmg = Math.max(0, rollDice(chosenSpell.damageDice || "1d6") + spellMod);
              setPlayerHp((prev) => Math.max(0, prev - spellDmg));
              log(`☄️ [${currentMonster.title}] Casts ${chosenSpell.name}! Deals ${spellDmg} dmg.`);
              setLastActionRecap({ icon: '☄️', text: `${mName} cast ${chosenSpell.name} for ${spellDmg} damage!` });
              addFloatingText(playerPos.x, playerPos.y, `-${spellDmg}`, 'text-orange-500');
            }
          } else {
            log(`👣 [${currentMonster.title}] repositioned.`);
            setLastActionRecap({ icon: '👣', text: `${mName} repositioned.` });
          }
        } else if (currentMonster.aiType === 'archer' && finalDist <= 4) {
          if (!hasLoS) {
            log(`👣 [${currentMonster.title}] loses sight behind cover!`);
            setLastActionRecap({ icon: '👣', text: `${mName} repositioned for line of sight.` });
          } else {
            const d20 = rollD20();
            const monsterAtkMod = currentMonster.stats ? getModifier(currentMonster.stats.dexterity) : (encounter.tier || 1);
            const totalAtk = d20 + monsterAtkMod;
            const baseDmg = Math.max(0, rollDice("1d6") + monsterAtkMod);
            
            if (totalAtk >= effectivePlayerAC) {
              setPlayerHp((prev) => Math.max(0, prev - baseDmg));
              log(`🎯 HIT! Deals ${baseDmg} damage.`);
              setLastActionRecap({ icon: '🎯', text: `${mName} shot you for ${baseDmg} damage!` });
              addFloatingText(playerPos.x, playerPos.y, `-${baseDmg}`, 'text-red-500');
            } else {
              log(`❌ MISS! Arrow dodged.`);
              setLastActionRecap({ icon: '❌', text: `${mName} fired and missed.` });
              addFloatingText(playerPos.x, playerPos.y, 'Miss', 'text-slate-400');
            }
          }
        } else if (finalDist <= 1) {
          const d20 = rollD20();
          const monsterAtkMod = currentMonster.stats ? getModifier(currentMonster.stats.strength) : (encounter.tier || 1);
          const totalAtk = d20 + monsterAtkMod;
          const baseDmg = Math.max(0, rollDice("1d8") + monsterAtkMod);

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
    if (bonusActionsLeft > 0) { setBonusActionsLeft(prev => prev - 1); log("⚔️ Switched gear (Bonus Action)."); }
    else if (actionsLeft > 0) { setActionsLeft(prev => prev - 1); log("⚔️ Switched gear (Action)."); }
    else { log("⚠️ No Actions or Bonus Actions left!"); return; }
    
    setSelectedWeaponSlot(prev => prev === 'mainHand' ? 'offHand' : 'mainHand');
    setLastActionRecap({ icon: '⚔️', text: 'You swapped your equipped gear.' });
  };

  // FIX 5: POTIONS USE BONUS ACTIONS
  const handleDrinkPotionInCombat = (potion) => {
    if (bonusActionsLeft > 0) { setBonusActionsLeft(prev => prev - 1); log(`🧪 Drank [${potion.name}] (Bonus Action). Restored ${potion.healAmount} HP.`); }
    else if (actionsLeft > 0) { setActionsLeft(prev => prev - 1); log(`🧪 Drank [${potion.name}] (Action). Restored ${potion.healAmount} HP.`); }
    else { log("⚠️ No Actions or Bonus Actions left!"); return; }

    setPlayerHp(prev => Math.min(character.health.max, prev + potion.healAmount));
    useConsumable(potion);
    setLastActionRecap({ icon: '🧪', text: `You drank a potion (+${potion.healAmount} HP).` });
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
      title: `Melee vs ${target.title}`,
      d20: { face: 20, result: d20, mod: strMod + proficiencyBonus, targetDC: targetAC },
      damage: { face: diceSize, result: dmgRoll, mod: strMod, label: 'Damage' },
      isHit: isHit,
      onComplete: () => {
        setPendingRoll(null);
        log(`⚔️ Melee vs [${target.title}]: d20(${d20}) + Mod = ${totalAtk} vs AC ${targetAC}`);
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
      title: `Ranged vs ${target.title}`,
      d20: { face: 20, result: d20, mod: dexMod + proficiencyBonus, targetDC: targetAC },
      damage: { face: diceSize, result: dmgRoll, mod: dexMod, label: 'Damage' },
      isHit: isHit,
      onComplete: () => {
        setPendingRoll(null);
        log(`🏹 Ranged vs [${target.title}]: d20(${d20}) + Mod = ${totalAtk} vs AC ${targetAC}`);
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
    if (!currentActor.isPlayer || isAnimating || battleResult !== null || pendingRoll) return;

    if (activeAction) {
      if (actionsLeft <= 0) { log("⚠️ No actions left this turn!"); setActiveAction(null); return; }
        
      if (activeAction === 'melee') {
        const target = monsters.find(m => m.hp > 0 && m.x === x && m.y === y);
        if (!target) { log("⚠️ No enemy at target location!"); return; }
        if (getDistance(playerPos, target) !== 1) { log("⚠️ Target is out of melee range!"); return; }
        executeMeleeAttack(target); return;
      }

      if (activeAction === 'ranged') {
        const target = monsters.find(m => m.hp > 0 && m.x === x && m.y === y);
        if (!target) { log("⚠️ No enemy at target location!"); return; }
        const dist = getDistance(playerPos, { x, y });
        if (dist > (equippedWeapon.range || 1)) { log(`⚠️ Target out of range!`); return; }
        if (!checkLineOfSight(playerPos, { x, y }, battleMap.mapData)) { log(`⚠️ Target is blocked by cover!`); return; }
        executeRangedAttack(target); return;
      }

      const activeSpell = activeAction;
      const dist = getDistance(playerPos, { x, y });

      if (activeSpell.category === 'movement') {
        if (dist > activeSpell.range && activeSpell.range > 0) { log(`⚠️ Target out of range!`); return; }
        if (isCellBlocked(x, y, 'player')) { log(`⚠️ Destination blocked!`); return; }
        if (!checkLineOfSight(playerPos, { x, y }, battleMap.mapData)) { log(`⚠️ Cannot see destination!`); return; }

        setActionsLeft(prev => prev - 1);
        consumeSpellCharge(activeSpell.id);
        setActiveAction(null); setHoveredCell(null);
        
        const statKey = activeSpell.stat || activeSpell.scalingStat || 'intelligence';
        const castMod = getModifier(character.stats[statKey.toLowerCase()]);
        const diceSize = parseInt(activeSpell.damageDice) || 0;
        
        animateMovement([playerPos, { x, y }], 'player', () => {
          if (diceSize > 0) {
            const dmgRoll = rollDice(diceSize);
            const totalDmg = Math.max(0, dmgRoll + castMod);
            setPendingRoll({
              type: 'spell', title: `Landing ${activeSpell.name}`,
              damage: { face: diceSize, result: dmgRoll, mod: castMod, label: 'Impact' },
              onComplete: () => {
                setPendingRoll(null);
                log(`💨 Leaped to [${x}, ${y}]!`);
                addFloatingText(x, y, '💥', 'text-cyan-400');
                let hitCount = 0;
                setMonsters(prev => prev.map(m => {
                  if (m.hp > 0 && Math.abs(m.x - x) <= Math.floor(activeSpell.radius / 2) && Math.abs(m.y - y) <= Math.floor(activeSpell.radius / 2)) {
                    hitCount++;
                    log(`💥 Hits ${m.title} for ${totalDmg} dmg!`);
                    addFloatingText(m.x, m.y, `-${totalDmg}`, 'text-yellow-400');
                    return { ...m, hp: Math.max(0, m.hp - totalDmg) };
                  }
                  return m;
                }));
                setLastActionRecap({ icon: '☄️', text: `Hit ${hitCount} targets for ${totalDmg} dmg!` });
              }
            });
          } else {
             log(`💨 Leaped to [${x}, ${y}]!`);
             setLastActionRecap({ icon: '💨', text: `You used ${activeSpell.name}.` });
          }
        });
        return;
      }

      if (dist > activeSpell.range && activeSpell.range > 0) { log(`⚠️ Target out of range!`); return; }
      if (!checkLineOfSight(playerPos, { x, y }, battleMap.mapData) && !activeSpell.healAmount) { log(`⚠️ Target blocked!`); return; }

      setActionsLeft(prev => prev - 1);
      consumeSpellCharge(activeSpell.id);
      setActiveAction(null); setHoveredCell(null);

      const statKey = activeSpell.stat || activeSpell.scalingStat || 'intelligence';
      const castMod = getModifier(character.stats[statKey.toLowerCase()]);

      if (activeSpell.category === 'heal') {
        const diceSize = parseInt(activeSpell.healAmount) || 8;
        const healRoll = rollDice(diceSize);
        const totalHeal = Math.max(0, healRoll + castMod);
        setPendingRoll({
          type: 'heal', title: `Casting ${activeSpell.name}`,
          damage: { face: diceSize, result: healRoll, mod: castMod, label: 'Heal' },
          onComplete: () => {
            setPendingRoll(null);
            setPlayerHp(prev => Math.min(character.health.max, prev + totalHeal));
            log(`✨ Healed for ${totalHeal} HP.`);
            setLastActionRecap({ icon: '✨', text: `Healed yourself for ${totalHeal} HP.` });
            addFloatingText(playerPos.x, playerPos.y, `+${totalHeal}`, 'text-emerald-400');
          }
        });
      } else {
        const diceSize = parseInt(activeSpell.damageDice) || 6;
        const dmgRoll = rollDice(diceSize);
        const totalDmg = Math.max(0, dmgRoll + castMod);
        setPendingRoll({
          type: 'spell', title: `Casting ${activeSpell.name}`,
          damage: { face: diceSize, result: dmgRoll, mod: castMod, label: 'Damage' },
          onComplete: () => {
            setPendingRoll(null);
            log(`✨ Cast ${activeSpell.name} at [${x}, ${y}]!`);
            addFloatingText(x, y, '💥', 'text-cyan-400');
            let hitCount = 0;
            setMonsters(prev => prev.map(m => {
              if (m.hp > 0 && Math.abs(m.x - x) <= Math.floor(activeSpell.radius / 2) && Math.abs(m.y - y) <= Math.floor(activeSpell.radius / 2)) {
                hitCount++;
                addFloatingText(m.x, m.y, `-${totalDmg}`, 'text-yellow-400');
                return { ...m, hp: Math.max(0, m.hp - totalDmg) };
              }
              return m;
            }));
            setLastActionRecap({ icon: '☄️', text: `Hit ${hitCount} targets for ${totalDmg} dmg!` });
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
      setPreviewPos(null); setMonsterTrail([]);
      let aooLogs = []; let aooDamage = 0; let reactionUsed = new Set();

      if (!hasDisengaged) {
        for (let i = 0; i < path.length; i++) {
          const prevNode = i === 0 ? playerPos : path[i - 1];
          const currNode = path[i];
          monsters.filter(m => m.hp > 0).forEach(m => {
            if (getDistance(prevNode, m) === 1 && getDistance(currNode, m) > 1 && !reactionUsed.has(m.id)) {
              reactionUsed.add(m.id);
              const d20 = rollD20();
              const atkMod = m.stats ? getModifier(m.stats.strength) : (encounter.tier || 1);
              if ((d20 + atkMod) >= effectivePlayerAC) {
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
        if (aooDamage > 0) { setPlayerHp(prev => Math.max(0, prev - aooDamage)); addFloatingText(x, y, `-${aooDamage}`, 'text-red-500'); }
        aooLogs.forEach(msg => log(msg));
        log(`🚶 Moved ${path.length} tiles.`); 
        setLastActionRecap({ icon: '🚶', text: `You moved ${path.length} tiles.` });
      });

    } else {
      setPreviewPos({ x, y }); setPlayerTrail(path); setMonsterTrail([]);
    }
  };

  const startMeleeTargeting = () => {
    if (isCovered) { log("⚠️ You cannot use Melee Attack while taking cover!"); return; }
    setActiveAction('melee'); log("⚔️ Click an adjacent enemy to attack!");
  };

  const startRangedTargeting = () => {
    setActiveAction('ranged'); log("🏹 Click an enemy in range to shoot!");
  };

  return {
    gridSize, battleMap, obstacles, playerPos, playerHp, actionsLeft, bonusActionsLeft, movementLeft, isCovered, hasDisengaged, visibleTiles, exploredTiles,
    monsters, combatQueue, turnIndex, currentActor, playerTrail, monsterTrail, previewPos, isAnimating, activeAction, setActiveAction,
    isSpellbookModalOpen, setIsSpellbookModalOpen, hoveredCell, setHoveredCell, combatLogs, floatingTexts, selectedWeaponSlot, equippedWeapon,
    battleResult, earnedRewards, lastActionRecap, flankingPenalty, effectivePlayerAC, pendingRoll, playerMaxMovement,
    handleGridClick, handleTakeCover, handleDisengage, handleWeaponSwap, handleDrinkPotionInCombat, startMeleeTargeting, startRangedTargeting, advanceTurn,
    logEndRef
  };
};