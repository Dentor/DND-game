import { useState, useEffect } from 'react';
import spellsCatalog from '../data/mockSpells.json';
import itemsCatalog from '../data/mockItems.json';
import { getModifier, rollDice } from '../utils/diceUtils';
import { DEFAULT_SANCTUARY, defaultUnlocked } from '../data/defaultSanctuary';
import { createEncounterObject } from '../utils/encounterUtils';
import { generateMap } from '../utils/mapGenerator';

const DND_XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000];

export const useGameState = () => {
  const [character, setCharacter] = useState(() => {
    const saved = localStorage.getItem('mtx_rpg_character');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.sanctuary) parsed.sanctuary = DEFAULT_SANCTUARY;
      if (!parsed.sanctuary.cols) parsed.sanctuary.cols = 30;
      if (!parsed.sanctuary.rows) parsed.sanctuary.rows = 30;
      if (!parsed.sanctuary.unlockedTiles) parsed.sanctuary.unlockedTiles = [...defaultUnlocked];
      if (!parsed.sanctuary.housingInventory) parsed.sanctuary.housingInventory = [];
      if (!parsed.sanctuary.furniture) parsed.sanctuary.furniture = [];
      
      parsed.sanctuary.furniture = parsed.sanctuary.furniture.map(f => f.uid ? f : { ...f, uid: crypto.randomUUID() });
      parsed.sanctuary.housingInventory = parsed.sanctuary.housingInventory.map(f => f.uid ? f : { ...f, uid: crypto.randomUUID() });

      const requiredDefaults = ['bed', 'chest', 'expedition'];
      requiredDefaults.forEach(reqId => {
        const inRoom = parsed.sanctuary.furniture.some(f => f.id === reqId);
        const inStash = parsed.sanctuary.housingInventory.some(f => f.id === reqId);
        if (!inRoom && !inStash) {
          const defaultItem = DEFAULT_SANCTUARY.furniture.find(f => f.id === reqId);
          if (defaultItem) parsed.sanctuary.furniture.push({ ...defaultItem, uid: crypto.randomUUID() });
        }
      });

      if (parsed.inventory) {
        const consolidated = [];
        parsed.inventory.forEach(item => {
          if (item.type === 'Consumable' || item.type === 'Material') {
            const existingIndex = consolidated.findIndex(i => i.id === item.id);
            if (existingIndex !== -1) consolidated[existingIndex].quantity = (consolidated[existingIndex].quantity || 1) + (item.quantity || 1);
            else consolidated.push({ ...item, quantity: item.quantity || 1 });
          } else {
            consolidated.push(item);
          }
        });
        parsed.inventory = consolidated;
      }

      return parsed;
    }
    return null;
  });

  useEffect(() => {
    if (character && !character.sanctuary) setCharacter(prev => ({ ...prev, sanctuary: DEFAULT_SANCTUARY }));
  }, [character]);

  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('mtx_rpg_campaign');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeEncounter, setActiveEncounter] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [isResting, setIsResting] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  
  const [sessionRewards, setSessionRewards] = useState({ xp: 0, gold: 0, items: [] });
  const [runSummary, setRunSummary] = useState(null); 
  const clearRunSummary = () => setRunSummary(null);

  useEffect(() => {
    if (character) localStorage.setItem('mtx_rpg_character', JSON.stringify(character));
    else localStorage.removeItem('mtx_rpg_character');
  }, [character]);

  useEffect(() => {
    if (campaign) localStorage.setItem('mtx_rpg_campaign', JSON.stringify(campaign));
    else localStorage.removeItem('mtx_rpg_campaign');
  }, [campaign]);

  const logEvent = (message) => setGameLog((prev) => [message, ...prev].slice(0, 7)); 

  const recalculateStats = (charState) => {
    if (!charState) return null;
    const baseStats = charState.baseStats || { ...charState.stats };
    let addedStats = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    let gearAcBonus = 0;
    
    const equipment = charState.equipment || {};
    Object.values(equipment).forEach(item => {
      if (!item) return;
      if (item.acBonus) gearAcBonus += item.acBonus;
      if (item.statBonus) {
        Object.entries(item.statBonus).forEach(([stat, val]) => {
          if (addedStats[stat] !== undefined) addedStats[stat] += val;
        });
      }
    });

    const finalStats = { strength: baseStats.strength + addedStats.strength, dexterity: baseStats.dexterity + addedStats.dexterity, constitution: baseStats.constitution + addedStats.constitution, intelligence: baseStats.intelligence + addedStats.intelligence, wisdom: baseStats.wisdom + addedStats.wisdom, charisma: baseStats.charisma + addedStats.charisma };
    const dexMod = getModifier(finalStats.dexterity);
    return { ...charState, baseStats: baseStats, stats: finalStats, armorClass: (charState.baseArmorClass || 10) + dexMod + gearAcBonus, sanctuary: charState.sanctuary || DEFAULT_SANCTUARY };
  };

  const startCampaign = (selectedTier = null) => {
    if (character && character.health.current <= 0) { logEvent("⚠️ You must take a Long Rest before starting a new campaign!"); return; }
    const calculatedTier = Math.min(10, Math.max(1, Math.ceil((character.level || 1) / 3)));
    const finalTier = selectedTier || calculatedTier;
    const locations = ['Dark Forest', 'Cursed Swamps', 'Ancient Catacombs', 'Scorching Desert', 'City Sewers'];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const { nodes, startNodeId } = generateMap(finalTier); 
    const startNode = nodes.find(n => n.id === startNodeId) || nodes[0];
    if (!startNode) return;
    
    setSessionRewards({ xp: 0, gold: 0, items: [] });
    setCampaign({ nodes, currentNodeId: startNode.id, visitedIds: [startNode.id], location: randomLoc, tier: finalTier });
    setActiveEncounter(null); 
    logEvent(`🗺️ Started Tier ${finalTier} expedition in the ${randomLoc}!`);
  };

  const moveToNode = (nodeId) => {
    const node = campaign.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setCampaign(prev => ({ ...prev, currentNodeId: nodeId, visitedIds: [...prev.visitedIds, prev.currentNodeId] }));
    setActiveEncounter(createEncounterObject(node, campaign.tier, character.level, campaign.location));
    logEvent(`➡️ Traveled to node [Row ${node.row}, Col ${node.col}]: ${node.type}`);
  };

  const addToInventory = (inventoryArr, sessionItemsArr, itemToAdd) => {
    if (itemToAdd.type === 'Consumable' || itemToAdd.type === 'Material') {
      const existingInvIndex = inventoryArr.findIndex(i => i.id === itemToAdd.id);
      if (existingInvIndex !== -1) {
        inventoryArr[existingInvIndex] = { ...inventoryArr[existingInvIndex], quantity: (inventoryArr[existingInvIndex].quantity || 1) + 1 };
      } else {
        inventoryArr.push({ ...itemToAdd, quantity: 1, uid: crypto.randomUUID() });
      }
      
      const existingSessIndex = sessionItemsArr.findIndex(i => i.id === itemToAdd.id);
      if (existingSessIndex !== -1) {
        sessionItemsArr[existingSessIndex] = { ...sessionItemsArr[existingSessIndex], quantity: (sessionItemsArr[existingSessIndex].quantity || 1) + 1 };
      } else {
        sessionItemsArr.push({ ...itemToAdd, quantity: 1 });
      }
    } else {
      inventoryArr.push({ ...itemToAdd, uid: crypto.randomUUID() });
      sessionItemsArr.push({ ...itemToAdd, quantity: 1 });
    }
  };

  const handleEncounterComplete = (success, encounterData, earnedRewards = null) => {
    applyResults(success, encounterData, earnedRewards);
  };

  const applyResults = (isSuccess, encounter, earnedRewards = null) => {
    let triggerVictory = false;
    let triggerDefeat = false;
    let victoryData = null;

    setCharacter((prev) => {
      let newHp = prev.health.current;
      let newXp = prev.xp.current;
      let newInventory = [...prev.inventory];
      let newGold = prev.currency.gold;
      let newPity = prev.lootPity || 0; 
      let messages = [];

      let sessionXpGained = 0;
      let sessionGoldGained = 0;
      let currentSessionItems = [...sessionRewards.items];

      if (isSuccess) {
        if (encounter?.isBoss) {
           triggerVictory = true;
           let bossGold = Math.floor(Math.random() * 200) + (300 * (encounter.tier || 1));
           const keyCount = newInventory.filter(i => i.id === 'item_expedition_key').length;
           newInventory = newInventory.filter(i => i.id !== 'item_expedition_key'); 
           bossGold += keyCount * 150 * (encounter.tier || 1);

           const dropsToGive = 2 + keyCount;
           const validItems = itemsCatalog.filter(i => (i.tier || 1) <= (encounter.tier || 1) && i.type !== 'Material' && i.type !== 'Consumable');
           
           for (let k = 0; k < dropsToGive; k++) {
              if (validItems.length > 0) {
                 const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
                 addToInventory(newInventory, currentSessionItems, randomItem);
              }
           }
           
           const bossXp = encounter?.success?.xp || 500;
           newXp += bossXp;
           newGold += bossGold;
           sessionXpGained += bossXp;
           sessionGoldGained += bossGold;

           victoryData = {
             status: 'victory',
             xp: sessionRewards.xp + sessionXpGained,
             gold: sessionRewards.gold + sessionGoldGained,
             items: currentSessionItems,
             keysUsed: keyCount,
             chestsOpened: dropsToGive
           };

           messages.push(`🏆 CAMPAIGN VICTORIOUS!`);
        } else {
          const xpGained = earnedRewards?.xp || encounter?.success?.xp || 40;
          let goldGained = earnedRewards?.gold || 0;

          if (!earnedRewards && encounter?.success?.goldRange) {
             const [min, max] = encounter.success.goldRange;
             if (max > 0) goldGained = Math.floor(Math.random() * (max - min + 1)) + min;
          } else if (!earnedRewards && encounter?.success?.gold) {
             goldGained = encounter.success.gold;
          }

          newXp += xpGained;
          newGold += goldGained;
          sessionXpGained += xpGained;
          sessionGoldGained += goldGained;

          if (earnedRewards?.items) {
             earnedRewards.items.forEach(item => addToInventory(newInventory, currentSessionItems, item));
          } else if (encounter?.success?.lootTable) {
             encounter.success.lootTable.forEach(drop => {
               if (Math.floor(Math.random() * 100) + 1 <= drop.dropChance) {
                 const catalogItem = itemsCatalog.find(i => i.id === drop.id);
                 if (catalogItem) addToInventory(newInventory, currentSessionItems, catalogItem);
               }
             });
          }

          const isCombatOrChest = encounter?.type === 'Monster' || (encounter?.type === 'Trap' && encounter?.isGamble);
          if (isCombatOrChest) {
            const roll = Math.floor(Math.random() * 100) + 1 + newPity;
            const tier = encounter.tier || 1;

            if (roll <= 50) newPity += 5;
            else if (roll <= 75) {
              const consumables = itemsCatalog.filter(i => i.type === 'Consumable' && i.tier <= tier);
              if (consumables.length > 0) {
                const item = consumables[Math.floor(Math.random() * consumables.length)];
                addToInventory(newInventory, currentSessionItems, item);
                messages.push(`Found a ${item.name}!`);
              }
              newPity += 5; 
            } else if (roll <= 90) {
              const gear = itemsCatalog.filter(i => (i.type === 'Weapon' || i.type === 'Armor') && i.tier === tier && i.rarity !== 'Magical' && i.rarity !== 'Artifact');
              if (gear.length > 0) {
                const item = gear[Math.floor(Math.random() * gear.length)];
                addToInventory(newInventory, currentSessionItems, item);
                messages.push(`Looted: ${item.name}!`);
              }
              newPity = 0; 
            } else if (roll <= 99) {
              const magicGear = itemsCatalog.filter(i => (i.tier === tier || i.tier === tier - 1) && (i.rarity === 'Magical' || i.type === 'Accessory'));
              if (magicGear.length > 0) {
                const item = magicGear[Math.floor(Math.random() * magicGear.length)];
                addToInventory(newInventory, currentSessionItems, item);
                messages.push(`✨ EPIC DROP: ${item.name}!`);
              }
              newPity = 0; 
            } else {
              const epic = itemsCatalog.filter(i => i.rarity === 'Artifact' || (i.tier === tier + 1 && i.type === 'Weapon'));
              if (epic.length > 0) {
                const item = epic[Math.floor(Math.random() * epic.length)];
                addToInventory(newInventory, currentSessionItems, item);
                messages.push(`🔥 MYTHIC ARTIFACT FOUND: ${item.name}!`);
              }
              newPity = 0; 
            }
          }
          if (goldGained > 0) messages.push(`💰 Looted ${goldGained} gold!`);
        }

        if (newXp >= prev.xp.nextLevel) {
          setPendingLevelUp(true);
          messages.push(`🎉 You have enough XP to reach Level ${prev.level + 1}!`);
        }
        messages.forEach(msg => logEvent(msg));
        
        setSessionRewards(sr => ({ xp: sr.xp + sessionXpGained, gold: sr.gold + sessionGoldGained, items: currentSessionItems }));

      } else {
        const diceToRoll = encounter?.failure?.damageDice || '1d4';
        const hpLoss = rollDice(diceToRoll);
        newHp = Math.max(0, newHp - hpLoss);
        logEvent(`💥 Failure! Triggered hazard. Took ${hpLoss} damage (${diceToRoll}).`);
        if (newHp <= 0) triggerDefeat = true;
      }

      return recalculateStats({ ...prev, xp: { current: newXp, nextLevel: prev.xp.nextLevel }, health: { current: newHp, max: prev.health.max }, currency: { gold: newGold }, inventory: newInventory, lootPity: newPity });
    });

    if (triggerVictory) {
      setRunSummary(victoryData);
      setCampaign(null);
      setActiveEncounter(null);
    } else if (triggerDefeat) {
      failCampaign(encounter);
    } else {
      setActiveEncounter(null);
    }
  };

  const resolveEncounter = (encounter, isGamble = false, forcedD20 = null) => {
    if (!encounter || !character) return;
    const statKey = (encounter.challengeStat || 'dexterity').toLowerCase();
    const modifier = getModifier(character.stats[statKey] || 10);
    const d20 = forcedD20 !== null ? forcedD20 : rollDice(20);
    const totalRoll = d20 + modifier;
    const targetDC = isGamble ? (encounter.targetDC || 12) + 5 : (encounter.targetDC || 12);
    const isSuccess = totalRoll >= targetDC;

    if (isGamble) encounter.isGamble = true;

    if (isGamble && isSuccess) {
      const goldAmount = Math.floor(Math.random() * (30 * encounter.tier)) + (10 * encounter.tier);
      encounter.success = { xp: 20 * encounter.tier, gold: goldAmount };
    } else if (!isGamble && isSuccess) {
      encounter.success = { xp: 10 * encounter.tier, gold: 0 };
    }

    setLastRoll({ d20, modifier, totalRoll, success: isSuccess, isGamble });
    if (isSuccess) logEvent(isGamble ? `Success! Cracked the chest with a ${totalRoll} vs DC ${targetDC}.` : `Success! Bypassed hazard with ${totalRoll} vs DC ${targetDC}.`);
    else logEvent(`Failed! Rolled ${totalRoll} vs DC ${targetDC}.`);
  };

  const finishEncounter = (isSuccess, encounter) => {
    setLastRoll(null);
    handleEncounterComplete(isSuccess, encounter);
  };

  const failCampaign = (killerEncounter) => {
    const killerName = killerEncounter?.title || killerEncounter?.name || 'Unknown Hazard';
    logEvent(`💀 Campaign Failed. Defeated by ${killerName}.`);
    
    setRunSummary({ 
      status: 'defeat', 
      killer: killerName,
      xp: sessionRewards.xp,
      gold: sessionRewards.gold,
      items: sessionRewards.items,
      lostItems: ['Expedition Keys']
    }); 
    
    setCampaign(null);
    setActiveEncounter(null);
    setIsResting(true);
    
    setCharacter(prev => {
      const inventoryWithoutKeys = prev.inventory.filter(item => item.id !== 'item_expedition_key');
      return recalculateStats({ ...prev, inventory: inventoryWithoutKeys, health: { ...prev.health, current: 0 } });
    });
  };

  const buyItem = (item) => {
    setCharacter(prev => {
      if (prev.currency.gold < item.price) return prev;
      const newGold = prev.currency.gold - item.price;
      let newInventory = [...prev.inventory];
      
      if (item.type === 'Consumable' || item.type === 'Material') {
        const existingIndex = newInventory.findIndex(i => i.id === item.id);
        if (existingIndex !== -1) {
          newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: (newInventory[existingIndex].quantity || 1) + 1 };
        } else {
          newInventory.push({ ...item, quantity: 1, uid: crypto.randomUUID() });
        }
      } else {
        newInventory.push({ ...item, uid: crypto.randomUUID() });
      }
      
      logEvent(`🛒 Bought [${item.name}] for ${item.price} gold.`);
      return { ...prev, currency: { gold: newGold }, inventory: newInventory };
    });
  };

  const sellItem = (item) => {
    setCharacter(prev => {
      let newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i.id === item.id);
      
      if (itemIndex !== -1) {
        if (newInventory[itemIndex].quantity > 1) {
          newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
        } else {
          newInventory.splice(itemIndex, 1);
        }
      }
      const salePrice = item.value || Math.floor((item.price || 10) / 2);
      const newGold = prev.currency.gold + salePrice;
      logEvent(`💰 Sold [${item.name}] for ${salePrice} gold.`);
      return { ...prev, currency: { gold: newGold }, inventory: newInventory };
    });
  };

  const equipItem = (item, targetSlot) => {
    setCharacter(prev => {
      if (!targetSlot) return prev;
      let slotKey = targetSlot.toLowerCase().trim();
      if (slotKey === 'main hand' || slotKey === 'mainhand') slotKey = 'mainHand';
      if (slotKey === 'off hand' || slotKey === 'offhand') slotKey = 'offHand';
      if (slotKey === 'ring 1' || slotKey === 'ring1') slotKey = 'ring1';
      if (slotKey === 'ring 2' || slotKey === 'ring2') slotKey = 'ring2';
      if (slotKey === 'gloves') slotKey = 'hands';

      const currentEquipment = prev.equipment || {};
      let newInventory = [...prev.inventory];
      
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i === item);
      if (itemIndex !== -1) {
         if (newInventory[itemIndex].quantity > 1) {
             newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
         } else {
             newInventory.splice(itemIndex, 1);
         }
      }
      
      const currentlyEquipped = currentEquipment[slotKey];
      if (currentlyEquipped) newInventory.push(currentlyEquipped);

      const newEquipment = { ...currentEquipment, [slotKey]: item };
      const updatedChar = { ...prev, inventory: newInventory, equipment: newEquipment };
      logEvent(`Equipped [${item.name || 'Item'}].`);
      return recalculateStats(updatedChar);
    });
  };

  const unequipItem = (slotKey) => {
    setCharacter(prev => {
      const currentEquipment = prev.equipment || {};
      const itemToUnequip = currentEquipment[slotKey];
      if (!itemToUnequip) return prev;
      const newInventory = [...prev.inventory, itemToUnequip];
      const newEquipment = { ...currentEquipment, [slotKey]: null };
      const updatedChar = { ...prev, inventory: newInventory, equipment: newEquipment };
      logEvent(`Unequipped [${itemToUnequip.name || 'Item'}]. Sent back to backpack.`);
      return recalculateStats(updatedChar);
    });
  };

  const depositItem = (item) => {
    setCharacter(prev => {
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => i.uid === item.uid);
      if (itemIndex === -1) return prev;
      newInventory.splice(itemIndex, 1);
      const newStash = [...(prev.stash || []), item];
      logEvent(`📦 Deposited [${item.name}] into Stash.`);
      return { ...prev, inventory: newInventory, stash: newStash };
    });
  };

  const withdrawItem = (item) => {
    setCharacter(prev => {
      const currentStash = prev.stash || [];
      const itemIndex = currentStash.findIndex(i => i.uid === item.uid);
      if (itemIndex === -1) return prev;
      const newStash = [...currentStash];
      newStash.splice(itemIndex, 1);
      const newInventory = [...prev.inventory, item];
      logEvent(`🎒 Withdrew [${item.name}] from Stash.`);
      return { ...prev, inventory: newInventory, stash: newStash };
    });
  };

  const useConsumable = (item) => {
    setCharacter(prev => {
      let newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i.id === item.id);
      if (itemIndex === -1) return prev;
      
      if (newInventory[itemIndex].quantity > 1) {
          newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
      } else {
          newInventory.splice(itemIndex, 1);
      }

      let newHp = prev.health.current;
      if (item.category === 'heal') {
        newHp = Math.min(prev.health.max, newHp + item.healAmount);
        logEvent(`🧪 Consumed [${item.name}] and restored ${item.healAmount} HP.`);
      } else {
        logEvent(`⚡ Used [${item.name}].`);
      }
      return { ...prev, health: { ...prev.health, current: newHp }, inventory: newInventory };
    });
  };

  const applyLevelUp = (statIncreases, chosenSpellId) => {
    setCharacter(prev => {
      const newLevel = prev.level + 1;
      const nextLevelXp = DND_XP_THRESHOLDS[newLevel] || prev.xp.nextLevel + 10000;
      
      const currentBase = prev.baseStats || prev.stats;
      const newBaseStats = {
        strength: currentBase.strength + statIncreases.strength, dexterity: currentBase.dexterity + statIncreases.dexterity,
        constitution: currentBase.constitution + statIncreases.constitution, intelligence: currentBase.intelligence + statIncreases.intelligence,
        wisdom: currentBase.wisdom + statIncreases.wisdom, charisma: currentBase.charisma + statIncreases.charisma,
      };

      const newConMod = getModifier(newBaseStats.constitution);
      const hpIncrease = Math.max(2, 6 + newConMod);
      const newMaxHp = prev.health.max + hpIncrease;
      const newHp = prev.health.current + hpIncrease;

      let newLearnedSpells = [...prev.learnedSpells];
      let newSpellCharges = { ...prev.spellCharges };

      if (chosenSpellId && !newLearnedSpells.includes(chosenSpellId)) {
        newLearnedSpells.push(chosenSpellId);
        const spellObj = spellsCatalog.find(s => s.id === chosenSpellId);
        if (spellObj) {
          const wisBonus = Math.floor(newBaseStats.wisdom / 4);
          const dexBonus = Math.floor(newBaseStats.dexterity / 4);
          newSpellCharges[chosenSpellId] = spellObj.baseUses + wisBonus + dexBonus;
        }
      }

      const updatedChar = { ...prev, level: newLevel, baseStats: newBaseStats, xp: { current: prev.xp.current, nextLevel: nextLevelXp }, health: { current: newHp, max: newMaxHp }, learnedSpells: newLearnedSpells, spellCharges: newSpellCharges };
      logEvent(`Level Up! You are now Level ${newLevel}.`);
      return recalculateStats(updatedChar);
    });
    setPendingLevelUp(false);
  };

  const resolveRiddle = (encounter, isCorrect) => {
    if (!encounter) return;
    setLastRoll({ success: isCorrect, total: null });
    if (isCorrect) logEvent(`Correct answer! Riddle solved.`);
    else logEvent(`Incorrect answer! Riddle failed.`);
  };

  const healCharacter = () => {
    let hpRestored = 0; let spellsRestored = 0;
    setCharacter(prev => {
      hpRestored = prev.health.max - prev.health.current;
      const refreshedCharges = {};
      prev.learnedSpells.forEach(id => {
        const spellObj = spellsCatalog.find(s => s.id === id);
        if (spellObj) {
          const wisBonus = Math.floor(prev.stats.wisdom / 4);
          const dexBonus = Math.floor(prev.stats.dexterity / 4);
          const maxUses = spellObj.baseUses + wisBonus + dexBonus;
          const current = prev.spellCharges?.[id] || 0;
          spellsRestored += Math.max(0, maxUses - current);
          refreshedCharges[id] = maxUses;
        }
      });
      return { ...prev, health: { ...prev.health, current: prev.health.max }, spellCharges: refreshedCharges };
    });
    setIsResting(false);
    logEvent("✨ You took a Long Rest. HP restored and all ability charges refreshed!");
    return { hpRestored, spellsRestored };
  };

  const consumeSpellCharge = (spellId) => {
    setCharacter(prev => ({
      ...prev, spellCharges: { ...prev.spellCharges, [spellId]: Math.max(0, (prev.spellCharges[spellId] || 1) - 1) }
    }));
  };

  const resetGame = () => {
    localStorage.removeItem('mtx_rpg_character');
    localStorage.removeItem('mtx_rpg_campaign');
    setCharacter(null); setCampaign(null); setActiveEncounter(null); setGameLog([]);
  };

  const modifySanctuary = (action, payload) => {
    setCharacter(prev => {
      let newGold = prev.currency.gold;
      let newSanctuary = { ...prev.sanctuary };
      let logs = [];

      if (!newSanctuary.unlockedTiles) newSanctuary.unlockedTiles = [...defaultUnlocked];
      if (!newSanctuary.housingInventory) newSanctuary.housingInventory = [];
      if (!newSanctuary.cols) newSanctuary.cols = 30;
      if (!newSanctuary.rows) newSanctuary.rows = 30;

      if (action === 'unlock_tile') {
        if (newGold < payload.cost) return prev;
        newGold -= payload.cost;
        newSanctuary.unlockedTiles = [...newSanctuary.unlockedTiles, `${payload.x},${payload.y}`];
        logs.push(`🔨 Unlocked new tile (-${payload.cost}g)`);
      }
      else if (action === 'buy_housing_item') {
        if (newGold < payload.item.price) return prev;
        newGold -= payload.item.price;
        const newItem = { ...payload.item, uid: crypto.randomUUID() };
        newSanctuary.housingInventory = [...newSanctuary.housingInventory, newItem];
        logs.push(`🛒 Bought ${newItem.name} for Housing Stash (-${payload.item.price}g)`);
      }
      else if (action === 'place_item') {
        const stashIndex = newSanctuary.housingInventory.findIndex(i => i.uid === payload.item.uid);
        if (stashIndex !== -1) {
          newSanctuary.housingInventory = [...newSanctuary.housingInventory];
          newSanctuary.housingInventory.splice(stashIndex, 1);
        }
        
        const newItem = { ...payload.item, uid: payload.item.uid || crypto.randomUUID(), cells: payload.cells, rotation: payload.rotation };
        if (newItem.type === 'Wall') {
          newSanctuary.walls = [...newSanctuary.walls, `${payload.x},${payload.y}`];
        } else {
          newSanctuary.furniture = [...newSanctuary.furniture, newItem];
        }
      }
      else if (action === 'pickup_from_room') {
        if (payload.type === 'Wall') {
          const wallIndex = newSanctuary.walls.indexOf(`${payload.x},${payload.y}`);
          if (wallIndex !== -1) {
            newSanctuary.walls = [...newSanctuary.walls];
            newSanctuary.walls.splice(wallIndex, 1);
          }
        } else {
          const furnIndex = newSanctuary.furniture.findIndex(f => (f.uid && f.uid === payload.uid) || f.id === payload.id);
          if (furnIndex !== -1) {
             newSanctuary.furniture = [...newSanctuary.furniture];
             newSanctuary.furniture.splice(furnIndex, 1);
          }
        }
      }
      else if (action === 'return_to_stash') {
        newSanctuary.housingInventory = [...newSanctuary.housingInventory, payload.item];
        logs.push(`📦 Stashed ${payload.item.name}`);
      }

      logs.forEach(msg => logEvent(msg));
      return { ...prev, currency: { ...prev.currency, gold: newGold }, sanctuary: newSanctuary };
    });
  };

  return { 
    character, setCharacter, activeEncounter, setActiveEncounter, campaign, startCampaign, moveToNode, handleEncounterComplete, finishEncounter, failCampaign, buyItem, sellItem,
    lastRoll, isResting, gameLog, pendingLevelUp, resolveEncounter, resolveRiddle, healCharacter, equipItem, unequipItem, applyLevelUp, consumeSpellCharge, resetGame, useConsumable,
    runSummary, clearRunSummary, depositItem, withdrawItem, modifySanctuary
  };
};