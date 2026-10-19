import { useState } from 'react';
import { generateFloor } from '../utils/MazeGenerator';
import itemsCatalog from '../data/mockItems.json';
import mockMonsters from '../data/mockMonsters.json';
import spellsCatalog from '../data/mockSpells.json';

const getDist = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
const getModifier = (score) => Math.floor((score - 10) / 2);
const DND_XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000];

export const useRoguelikeState = () => {
  const [isRunActive, setIsRunActive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [character, setCharacter] = useState(null);
  const [floorLevel, setFloorLevel] = useState(1);
  const [mapData, setMapData] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [visibleRadius] = useState(6); 
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [isMerchantOpen, setIsMerchantOpen] = useState(false);
  const [runSummary, setRunSummary] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);

  const logEvent = (msg) => setGameLog(prev => [msg, ...prev].slice(0, 5));

  const recalculateStats = (charState) => {
    if (!charState) return null;
    const baseStats = charState.baseStats || { ...charState.stats };
    let addedStats = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    let gearAcBonus = 0;
    
    Object.values(charState.equipment || {}).forEach(item => {
      if (!item) return;
      if (item.acBonus) gearAcBonus += item.acBonus;
      if (item.statBonus) {
        Object.entries(item.statBonus).forEach(([stat, val]) => {
          if (addedStats[stat] !== undefined) addedStats[stat] += val;
        });
      }
    });

    const finalStats = {
      strength: baseStats.strength + addedStats.strength,
      dexterity: baseStats.dexterity + addedStats.dexterity,
      constitution: baseStats.constitution + addedStats.constitution,
      intelligence: baseStats.intelligence + addedStats.intelligence,
      wisdom: baseStats.wisdom + addedStats.wisdom,
      charisma: baseStats.charisma + addedStats.charisma,
    };

    return {
      ...charState,
      baseStats,
      stats: finalStats,
      armorClass: (charState.baseArmorClass || 10) + getModifier(finalStats.dexterity) + gearAcBonus,
    };
  };

  const startRun = () => {
    setIsCreating(true);
    setIsRunActive(true);
  };

  const finalizeCharacter = (name, baseStats, startingSpellId, startingGear) => {
    const newChar = recalculateStats({
      id: crypto.randomUUID(),
      name: name,
      level: 1,
      baseStats: baseStats,
      stats: baseStats,
      health: { current: 10 + getModifier(baseStats.constitution), max: 10 + getModifier(baseStats.constitution) },
      xp: { current: 0, nextLevel: DND_XP_THRESHOLDS[1] },
      currency: { gold: 0 },
      inventory: [],
      equipment: { mainHand: startingGear, armor: null, accessory: null },
      learnedSpells: [startingSpellId],
      spellCharges: { [startingSpellId]: 3 },
      runMetrics: { floorsCleared: 0, monstersKilled: 0, chestsOpened: 0 }
    });

    setCharacter(newChar);
    setFloorLevel(1);
    setRunSummary(null);
    setGameLog(["You enter the Endless Tower. The heavy doors seal behind you."]);
    setIsCreating(false);
    loadFloor(1);
  };

  const loadFloor = (level) => {
    const { grid, spawnPos, stairsPos, enemiesList } = generateFloor(40, 40, level);
    setMapData({ grid, stairsPos, enemies: enemiesList });
    setPlayerPos(spawnPos);
    updateVisibility(grid, spawnPos);
    logEvent(`Descended to Floor ${level}.`);
  };

  const updateVisibility = (grid, pos) => {
    const newGrid = [...grid];
    for (let y = 0; y < newGrid.length; y++) {
      for (let x = 0; x < newGrid[y].length; x++) {
        if (newGrid[y][x].visibility === 'visible') newGrid[y][x].visibility = 'discovered';
        if (getDist(pos, { x, y }) <= visibleRadius) newGrid[y][x].visibility = 'visible';
      }
    }
    setMapData(prev => ({ ...prev, grid: newGrid }));
  };

  const movePlayer = (dx, dy) => {
    if (activeEncounter || isMerchantOpen || runSummary || isCreating || !mapData) return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newY < 0 || newY >= mapData.grid.length || newX < 0 || newX >= mapData.grid[0].length) return;
    const targetCell = mapData.grid[newY][newX];
    if (targetCell.type === 'wall') return;

    const enemyAtTarget = mapData.enemies.find(e => e.x === newX && e.y === newY);
    if (enemyAtTarget) return triggerCombat(enemyAtTarget);

    handleCellInteraction(newX, newY, targetCell);

    const newPos = { x: newX, y: newY };
    setPlayerPos(newPos);
    updateVisibility(mapData.grid, newPos);
    tickEnemies(newPos);
  };

  const tickEnemies = (currentPlayerPos) => {
    setMapData(prev => {
      const updatedEnemies = prev.enemies.map(enemy => {
        if (getDist(enemy, currentPlayerPos) <= visibleRadius) {
          const dx = currentPlayerPos.x > enemy.x ? 1 : currentPlayerPos.x < enemy.x ? -1 : 0;
          const dy = currentPlayerPos.y > enemy.y ? 1 : currentPlayerPos.y < enemy.y ? -1 : 0;
          const nextX = enemy.x + dx;
          const nextY = enemy.y + dy;
          
          if (prev.grid[nextY][nextX].type !== 'wall' && !prev.enemies.some(e => e.id !== enemy.id && e.x === nextX && e.y === nextY)) {
             return { ...enemy, x: nextX, y: nextY };
          }
        }
        return enemy;
      });

      const ambushEnemy = updatedEnemies.find(e => e.x === currentPlayerPos.x && e.y === currentPlayerPos.y);
      if (ambushEnemy) {
         triggerCombat(ambushEnemy);
         ambushEnemy.x -= 1; 
      }
      return { ...prev, enemies: updatedEnemies };
    });
  };

  const handleCellInteraction = (x, y, cell) => {
    if (cell.entity === 'chest') {
      const goldAmt = Math.floor(Math.random() * (20 * floorLevel)) + 10;
      setCharacter(prev => ({ 
        ...prev, 
        currency: { gold: prev.currency.gold + goldAmt },
        runMetrics: { ...prev.runMetrics, chestsOpened: prev.runMetrics.chestsOpened + 1 }
      }));
      logEvent(`Opened a chest! Found ${goldAmt} gold.`);
      
      const newGrid = [...mapData.grid];
      newGrid[y][x] = { ...newGrid[y][x], entity: null };
      setMapData(prev => ({ ...prev, grid: newGrid }));
    }
    
    if (cell.entity === 'stairs') {
      logEvent(`Found the stairs! Advancing to Floor ${floorLevel + 1}...`);
      setIsMerchantOpen(true); 
    }
  };

  const triggerCombat = (enemyData) => {
    const possibleMonsters = mockMonsters.filter(m => m.tier === enemyData.tier);
    const template = possibleMonsters.length > 0 ? possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)] : mockMonsters[0];
    
    setActiveEncounter({
      type: 'Monster',
      tier: enemyData.tier,
      title: `Floor ${floorLevel} Encounter`,
      monsters: [template],
      mapEnemyId: enemyData.id
    });
    logEvent(`Combat initiated with ${template.title}!`);
  };

  const resolveCombat = (isVictory, finalHp) => {
    if (!isVictory) return endRun("Defeated in Combat");

    const tier = activeEncounter.tier || floorLevel;
    const xpGained = tier * 40;
    const goldGained = Math.floor(Math.random() * (20 * tier)) + (10 * tier);

    setCharacter(prev => {
      let newInventory = [...prev.inventory];
      let newXp = prev.xp.current + xpGained;
      let newGold = prev.currency.gold + goldGained;
      let logs = [`Victory! Gained ${xpGained} XP & ${goldGained} Gold.`];

      // D100 Global Loot Engine
      const roll = Math.floor(Math.random() * 100) + 1;
      if (roll > 50 && roll <= 75) {
        const items = itemsCatalog.filter(i => i.type === 'Consumable' && i.tier <= tier);
        if(items.length) {
           const drop = items[Math.floor(Math.random() * items.length)];
           newInventory.push({ ...drop, uid: crypto.randomUUID() });
           logs.push(`Looted: ${drop.name}`);
        }
      } else if (roll <= 90) {
        const items = itemsCatalog.filter(i => (i.type === 'Weapon' || i.type === 'Armor') && i.tier === tier && i.rarity !== 'Magical' && i.rarity !== 'Artifact');
        if(items.length) {
           const drop = items[Math.floor(Math.random() * items.length)];
           newInventory.push({ ...drop, uid: crypto.randomUUID() });
           logs.push(`Looted: ${drop.name}`);
        }
      } else if (roll <= 99) {
        const items = itemsCatalog.filter(i => (i.tier === tier || i.tier === tier - 1) && (i.rarity === 'Magical' || i.type === 'Accessory'));
        if(items.length) {
           const drop = items[Math.floor(Math.random() * items.length)];
           newInventory.push({ ...drop, uid: crypto.randomUUID() });
           logs.push(`✨ EPIC DROP: ${drop.name}!`);
        }
      } else if (roll === 100) {
        const items = itemsCatalog.filter(i => i.rarity === 'Artifact');
        if(items.length) {
           const drop = items[Math.floor(Math.random() * items.length)];
           newInventory.push({ ...drop, uid: crypto.randomUUID() });
           logs.push(`🔥 ARTIFACT FOUND: ${drop.name}!`);
        }
      }

      logs.forEach(l => logEvent(l));

      if (newXp >= prev.xp.nextLevel) {
        setPendingLevelUp(true);
        logEvent("🎉 You have enough XP to Level Up!");
      }

      return recalculateStats({
        ...prev,
        health: { ...prev.health, current: finalHp },
        xp: { current: newXp, nextLevel: prev.xp.nextLevel },
        currency: { gold: newGold },
        inventory: newInventory,
        runMetrics: { ...prev.runMetrics, monstersKilled: prev.runMetrics.monstersKilled + 1 }
      });
    });

    setMapData(prev => ({ ...prev, enemies: prev.enemies.filter(e => e.id !== activeEncounter.mapEnemyId) }));
    setActiveEncounter(null);
  };

  // GEAR MANAGEMENT
  const equipItem = (item, targetSlot) => {
    setCharacter(prev => {
      let slotKey = targetSlot.toLowerCase().trim();
      if (slotKey === 'main hand' || slotKey === 'mainhand') slotKey = 'mainHand';
      if (slotKey === 'off hand' || slotKey === 'offhand') slotKey = 'offHand';
      if (slotKey === 'ring 1' || slotKey === 'ring1') slotKey = 'ring1';
      if (slotKey === 'ring 2' || slotKey === 'ring2') slotKey = 'ring2';
      if (slotKey === 'gloves') slotKey = 'hands';

      const currentEquipment = prev.equipment || {};
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => i.uid === item.uid);
      if (itemIndex !== -1) newInventory.splice(itemIndex, 1);
      
      if (currentEquipment[slotKey]) newInventory.push(currentEquipment[slotKey]);
      logEvent(`Equipped [${item.name}].`);
      return recalculateStats({ ...prev, inventory: newInventory, equipment: { ...currentEquipment, [slotKey]: item } });
    });
  };

  const unequipItem = (slotKey) => {
    setCharacter(prev => {
      const itemToUnequip = prev.equipment[slotKey];
      if (!itemToUnequip) return prev;
      logEvent(`Unequipped [${itemToUnequip.name}].`);
      return recalculateStats({ 
        ...prev, 
        inventory: [...prev.inventory, itemToUnequip], 
        equipment: { ...prev.equipment, [slotKey]: null } 
      });
    });
  };

  const useConsumable = (item) => {
    setCharacter(prev => {
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => i.uid === item.uid);
      if (itemIndex === -1) return prev;
      newInventory.splice(itemIndex, 1);

      let newHp = prev.health.current;
      if (item.category === 'heal') {
        newHp = Math.min(prev.health.max, newHp + item.healAmount);
        logEvent(`🧪 Consumed [${item.name}] and restored ${item.healAmount} HP.`);
      }
      return { ...prev, health: { ...prev.health, current: newHp }, inventory: newInventory };
    });
  };

  const applyLevelUp = (statIncreases, chosenSpellId) => {
    setCharacter(prev => {
      const newLevel = prev.level + 1;
      const nextLevelXp = DND_XP_THRESHOLDS[newLevel] || prev.xp.nextLevel + 10000;
      const newBaseStats = {
        strength: prev.baseStats.strength + statIncreases.strength,
        dexterity: prev.baseStats.dexterity + statIncreases.dexterity,
        constitution: prev.baseStats.constitution + statIncreases.constitution,
        intelligence: prev.baseStats.intelligence + statIncreases.intelligence,
        wisdom: prev.baseStats.wisdom + statIncreases.wisdom,
        charisma: prev.baseStats.charisma + statIncreases.charisma,
      };

      const hpIncrease = Math.max(2, 6 + getModifier(newBaseStats.constitution));
      let newLearnedSpells = [...prev.learnedSpells];
      let newSpellCharges = { ...prev.spellCharges };

      if (chosenSpellId && !newLearnedSpells.includes(chosenSpellId)) {
        newLearnedSpells.push(chosenSpellId);
        const spellObj = spellsCatalog.find(s => s.id === chosenSpellId);
        if (spellObj) newSpellCharges[chosenSpellId] = spellObj.baseUses + getModifier(newBaseStats.wisdom);
      }

      logEvent(`Leveled up to ${newLevel}!`);
      return recalculateStats({
        ...prev,
        level: newLevel,
        baseStats: newBaseStats,
        xp: { current: prev.xp.current, nextLevel: nextLevelXp },
        health: { current: prev.health.current + hpIncrease, max: prev.health.max + hpIncrease },
        learnedSpells: newLearnedSpells,
        spellCharges: newSpellCharges
      });
    });
    setPendingLevelUp(false);
  };

  const consumeSpellCharge = (spellId) => {
    setCharacter(prev => ({ ...prev, spellCharges: { ...prev.spellCharges, [spellId]: Math.max(0, (prev.spellCharges[spellId] || 1) - 1) } }));
  };

  const proceedToNextFloor = () => {
    setCharacter(prev => ({ ...prev, runMetrics: { ...prev.runMetrics, floorsCleared: floorLevel } }));
    setFloorLevel(prev => prev + 1);
    setIsMerchantOpen(false);
    loadFloor(floorLevel + 1);
  };

  const endRun = (reason) => {
    setRunSummary({
      reason,
      floorsCleared: floorLevel - 1,
      monstersKilled: character.runMetrics.monstersKilled,
      chestsOpened: character.runMetrics.chestsOpened,
      goldAccumulated: character.currency.gold,
      finalScore: (floorLevel * 100) + (character.runMetrics.monstersKilled * 50) + character.currency.gold
    });
    // Removed setIsRunActive(false) from here so the summary screen can actually render!
    setActiveEncounter(null);
    setIsMerchantOpen(false);
  };

  // Instantly kills the run and returns to Home Hub without a summary
  const abortRun = () => {
    setRunSummary(null);
    setCharacter(null);
    setMapData(null);
    setActiveEncounter(null);
    setIsMerchantOpen(false);
    setIsRunActive(false); 
  };

  const closeRunSummary = () => {
    setRunSummary(null);
    setCharacter(null);
    setMapData(null);
    setIsRunActive(false); // Shifted to here so you only go home after closing the summary
  };

  return {
    isRunActive, isCreating, character, floorLevel, mapData, playerPos, activeEncounter, isMerchantOpen, runSummary, gameLog, pendingLevelUp,
    startRun, finalizeCharacter, movePlayer, resolveCombat, proceedToNextFloor, endRun, abortRun, closeRunSummary, equipItem, unequipItem, useConsumable, applyLevelUp, consumeSpellCharge
  };
};