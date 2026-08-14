import { useState, useEffect } from 'react';
import spellsCatalog from '../data/mockSpells.json';
import itemsCatalog from '../data/mockItems.json';
import mockMonsters from '../data/mockMonsters.json';
import { generateMap } from '../utils/mapGenerator';

const getModifier = (score) => Math.floor((score - 10) / 2);
const DND_XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000];

// ==================================================
// HELPER: DICE ROLLER
// ==================================================
const rollDice = (diceInput) => {
  if (!diceInput) return 0;
  if (typeof diceInput === 'number') return Math.floor(Math.random() * diceInput) + 1;
  const parts = String(diceInput).toLowerCase().split('d');
  if (parts.length !== 2) return parseInt(diceInput) || 0;
  
  const count = parseInt(parts[0]) || 1;
  const faces = parseInt(parts[1]) || 6;
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * faces) + 1;
  return total;
};

// ==================================================
// DATA VALIDATION & MONSTER TIER RESOLVER
// ==================================================
const REQUIRED_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const validateMonsterCatalog = (monsters) => {
  for (const tier of REQUIRED_TIERS) {
    const tierMonsters = monsters.filter(monster => monster.tier === tier);
    if (tierMonsters.length === 0) {
      console.warn(`[MonsterCatalog] Missing monsters for Tier ${tier}. Safe fallbacks will be used.`);
    }
  }
};
validateMonsterCatalog(mockMonsters);

const selectMonsterForEncounter = ({ campaignTier, location, isBoss = false }) => {
  const requestedTier = isBoss ? Math.min(10, campaignTier + 1) : campaignTier;

  let pool = mockMonsters.filter(
    monster =>
      monster.tier === requestedTier &&
      Array.isArray(monster.locations) &&
      monster.locations.includes(location)
  );

  if (pool.length === 0) {
    pool = mockMonsters.filter(monster => monster.tier === requestedTier);
  }

  if (pool.length === 0) {
    const safeTiers = mockMonsters.map(monster => monster.tier).filter(tier => tier < requestedTier);
    const highestSafeTier = safeTiers.length > 0 ? Math.max(...safeTiers) : null;

    if (highestSafeTier !== null) {
      pool = mockMonsters.filter(
        monster =>
          monster.tier === highestSafeTier &&
          (!Array.isArray(monster.locations) || monster.locations.includes(location))
      );
      if (pool.length === 0) pool = mockMonsters.filter(monster => monster.tier === highestSafeTier);
    }
  }

  if (pool.length === 0) return mockMonsters[0]; 
  return pool[Math.floor(Math.random() * pool.length)];
};

// ==================================================
// MAIN GAME STATE HOOK
// ==================================================
export const useGameState = () => {
  const [character, setCharacter] = useState(() => {
    const saved = localStorage.getItem('mtx_rpg_character');
    return saved ? JSON.parse(saved) : null;
  });

  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('mtx_rpg_campaign');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeEncounter, setActiveEncounter] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [isResting, setIsResting] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);

  // EPIC BOSS VICTORY STATE
  const [campaignVictory, setCampaignVictory] = useState(null);
  const clearCampaignVictory = () => setCampaignVictory(null);

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

    const finalStats = {
      strength: baseStats.strength + addedStats.strength,
      dexterity: baseStats.dexterity + addedStats.dexterity,
      constitution: baseStats.constitution + addedStats.constitution,
      intelligence: baseStats.intelligence + addedStats.intelligence,
      wisdom: baseStats.wisdom + addedStats.wisdom,
      charisma: baseStats.charisma + addedStats.charisma,
    };

    const dexMod = getModifier(finalStats.dexterity);

    return {
      ...charState,
      baseStats: baseStats,
      stats: finalStats,
      armorClass: (charState.baseArmorClass || 10) + dexMod + gearAcBonus
    };
  };

  const createEncounterObject = (node, campaignTier, playerLevel, location = 'Dark Forest') => {
    const base = {
      type: node.type,
      tier: campaignTier,
      location,
      title: node.isBoss ? 'FINAL BOSS CHAMBER' : `${node.type} Encounter`,
      isBoss: node.isBoss
    };

    // THIS IS WHAT WAS MISSING: The opening 'if' statement!
    if (node.type === 'Trap') {
      const forcedStat = node.challengeStat || 'Dexterity';
      const trapCatalog = [
        // STRENGTH
        { id: 'trap-collapsing-ceiling', title: 'Collapsing Ceiling', stat: 'Strength', desc: 'The masonry above begins to fracture and rain heavy debris down.' },
        { id: 'trap-crushing-walls', title: 'Crushing Walls', stat: 'Strength', desc: 'The corridor suddenly narrows as the stone walls slide inward, threatening to crush you.' },
        { id: 'trap-iron-maiden', title: 'Iron Maiden Snare', stat: 'Strength', desc: 'A rusted iron maiden snaps shut around you; you must pry the heavy doors open before the spikes pierce.' },

        // DEXTERITY
        { id: 'trap-poison-darts', title: 'Poison Dart Wall', stat: 'Dexterity', desc: 'A tripwire releases a volley of envenomed darts from the stonework.' },
        { id: 'trap-hidden-pitfall', title: 'Hidden Pitfall', stat: 'Dexterity', desc: 'The floor gives way over a deep, spike-lined subterranean drop.' },
        { id: 'trap-swinging-scythes', title: 'Swinging Scythes', stat: 'Dexterity', desc: 'Massive, rusted scythe blades swing down from the darkness like deadly pendulums.' },

        // CONSTITUTION
        { id: 'trap-noxious-gas', title: 'Noxious Gas Chamber', stat: 'Constitution', desc: 'Vents open in the floor, spewing a thick, green, choking miasma into the room.' },
        { id: 'trap-freezing-mist', title: 'Freezing Mist', stat: 'Constitution', desc: 'A pressurized canister bursts, releasing a cloud of bone-chilling, sub-zero mist.' },
        { id: 'trap-necrotic-spores', title: 'Necrotic Spores', stat: 'Constitution', desc: 'Disturbing a patch of fungal growth releases a cloud of flesh-eating, toxic spores.' },

        // INTELLIGENCE
        { id: 'trap-arcane-glyph', title: 'Arcane Runebound Glyph', stat: 'Intelligence', desc: 'A volatile magical rune pulses with unstable energy on the floor.' },
        { id: 'trap-shifting-labyrinth', title: 'Shifting Labyrinth', stat: 'Intelligence', desc: 'The corridor twists into a mind-bending optical illusion designed to trap the unwary.' },
        { id: 'trap-puzzle-box', title: 'Trapped Puzzle Box', stat: 'Intelligence', desc: 'A complex, rigged puzzle mechanism triggers an arcane explosion if solved incorrectly.' },

        // WISDOM
        { id: 'trap-siren-crystal', title: 'Siren Song Crystal', stat: 'Wisdom', desc: 'A glowing crystal emanates a hypnotic melody that compels you to walk directly into danger.' },
        { id: 'trap-mirage-oasis', title: 'Mirage Oasis', stat: 'Wisdom', desc: 'A shimmering illusion of safety masks a deadly pit of boiling mud; you must see through the deception.' },
        { id: 'trap-whispering-shadows', title: 'Whispering Shadows', stat: 'Wisdom', desc: 'Disembodied voices echo in the dark, attempting to drive your mind to madness and exhaustion.' },

        // CHARISMA
        { id: 'trap-banshee-mirror', title: 'Banshee’s Mirror', stat: 'Charisma', desc: 'A cursed mirror reflects a horrifying visage that attempts to forcefully possess your spirit.' },
        { id: 'trap-demonic-vow', title: 'Demonic Vow Scroll', stat: 'Charisma', desc: 'A magical contract flares to life, trying to bind your soul with deceptive, commanding words.' },
        { id: 'trap-haunted-effigy', title: 'Haunted Effigy', stat: 'Charisma', desc: 'A ghostly apparition demands tribute, trying to drain your life force unless you assert your dominance.' }
      ];

      const matchingTraps = trapCatalog.filter(t => t.stat === forcedStat);
      const randomTrap = matchingTraps.length > 0 ? matchingTraps[Math.floor(Math.random() * matchingTraps.length)] : trapCatalog[0];
      
      let damageDice = '1d4';
      if (campaignTier >= 9) damageDice = '4d6';
      else if (campaignTier >= 7) damageDice = '3d6';
      else if (campaignTier >= 5) damageDice = '2d6';
      else if (campaignTier >= 3) damageDice = '1d6';

      return {
        ...base,
        id: randomTrap.id, 
        title: randomTrap.title,
        description: randomTrap.desc,
        challengeStat: forcedStat,
        targetDC: 10 + Math.floor(campaignTier / 2),
        failure: { damageDice }
      };
    } else if (node.type === 'Monster') {
      const count = node.isBoss ? 1 : (campaignTier === 1 ? (Math.random() < 0.5 ? 1 : 2) : campaignTier <= 4 ? 2 : 3);
      let minGold = 0; let maxGold = 0; let totalXp = node.isBoss ? campaignTier * 100 : 0;
      const spawnedMonsters = []; const combinedLoot = [];
      
      for (let i = 0; i < count; i++) {
        const m = selectMonsterForEncounter({ campaignTier, location, isBoss: node.isBoss });
        spawnedMonsters.push(m);
        minGold += m.goldRange ? m.goldRange[0] : 0; 
        maxGold += m.goldRange ? m.goldRange[1] : 0;
        totalXp += (m.tier || 1) * 30; 
        if (m.lootTable) combinedLoot.push(...m.lootTable);
      }
      return { ...base, monsters: spawnedMonsters, success: { goldRange: [minGold, maxGold], xp: totalXp, lootTable: combinedLoot } };
    }
    
    return base;
  };

  const startCampaign = (selectedTier = null) => {
    if (character && character.health.current <= 0) {
      logEvent("⚠️ You must take a Long Rest before starting a new campaign!");
      return;
    }

    const calculatedTier = Math.min(10, Math.max(1, Math.ceil((character.level || 1) / 3)));
    const finalTier = selectedTier || calculatedTier;

    const locations = ['Dark Forest', 'Cursed Swamps', 'Ancient Catacombs', 'Scorching Desert', 'City Sewers'];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const { nodes, startNodeId } = generateMap(finalTier);
    
    const startNode = nodes.find(n => n.id === startNodeId) || nodes[0];
    if (!startNode) return;
    
    setCampaign({ 
      nodes, 
      currentNodeId: startNode.id, 
      visitedIds: [startNode.id], 
      location: randomLoc,
      tier: finalTier 
    });
    
    setActiveEncounter(null); 
    logEvent(`🗺️ Started Tier ${finalTier} expedition in the ${randomLoc}! Select your path.`);
  };

  const moveToNode = (nodeId) => {
    const node = campaign.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCampaign(prev => ({
      ...prev,
      currentNodeId: nodeId,
      visitedIds: [...prev.visitedIds, prev.currentNodeId]
    }));

    setActiveEncounter(createEncounterObject(node, campaign.tier, character.level, campaign.location));
    logEvent(`➡️ Traveled to node [Row ${node.row}, Col ${node.col}]: ${node.type}`);
  };

  const handleEncounterComplete = (success, encounterData, earnedRewards = null) => {
    applyResults(success, encounterData, earnedRewards);
    
    if (!success && encounterData?.type === 'Monster') {
      return failCampaign();
    }

    const currentNode = campaign?.nodes?.find(n => n.id === campaign.currentNodeId);
    
    if (currentNode && currentNode.isBoss && success) {
      setCampaign(null);
      setActiveEncounter(null);
    } else {
      setActiveEncounter(null);
    }
  };

  const applyResults = (isSuccess, encounter, earnedRewards = null) => {
    setCharacter((prev) => {
      let newHp = prev.health.current;
      let newXp = prev.xp.current;
      let newInventory = [...prev.inventory];
      let newGold = prev.currency.gold;
      let messages = [];

      if (isSuccess) {
        // ==========================================
        // EPIC BOSS LOOT EXPLOSION
        // ==========================================
        if (encounter?.isBoss) {
           const bossGold = Math.floor(Math.random() * 200) + (300 * (encounter.tier || 1));
           let totalGold = bossGold;
           
           const keyCount = newInventory.filter(i => i.id === 'item_expedition_key').length;
           newInventory = newInventory.filter(i => i.id !== 'item_expedition_key'); 

           const bonusGold = keyCount * 150 * (encounter.tier || 1);
           totalGold += bonusGold;

           const dropsToGive = 2 + keyCount;
           const validItems = itemsCatalog.filter(i => (i.tier || 1) <= (encounter.tier || 1) && i.type !== 'Material' && i.type !== 'Consumable');
           
           const bossLoot = [];
           for (let k = 0; k < dropsToGive; k++) {
              if (validItems.length > 0) {
                 const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
                 bossLoot.push({ ...randomItem, uid: crypto.randomUUID() });
              }
           }
           
           newInventory.push(...bossLoot);
           
           const bossXp = encounter?.success?.xp || 500;
           newXp += bossXp;
           newGold += totalGold;

           // TRIGGER THE NEW CAMPAIGN VICTORY SCREEN
           setCampaignVictory({
             tier: encounter.tier || 1,
             keysUsed: keyCount,
             chestsOpened: dropsToGive,
             gold: totalGold,
             xp: bossXp,
             items: bossLoot
           });

           messages.push(`🏆 CAMPAIGN VICTORIOUS!`);
        } else {
          // ==========================================
          // STANDARD ENCOUNTER (Using exact combat rewards)
          // ==========================================
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

          if (earnedRewards?.items) {
             earnedRewards.items.forEach(item => {
               newInventory.push(item);
             });
          } else if (encounter?.success?.lootTable) {
             // Fallback for Traps / Gambles
             encounter.success.lootTable.forEach(drop => {
               if (Math.floor(Math.random() * 100) + 1 <= drop.dropChance) {
                 const catalogItem = itemsCatalog.find(i => i.id === drop.id);
                 if (catalogItem) newInventory.push({ ...catalogItem, uid: crypto.randomUUID() });
               }
             });
          }
          if (goldGained > 0) messages.push(`💰 Looted ${goldGained} gold!`);
        }

        if (newXp >= prev.xp.nextLevel) {
          setPendingLevelUp(true);
          messages.push(`🎉 You have enough XP to reach Level ${prev.level + 1}!`);
        }
        messages.forEach(msg => logEvent(msg));

      } else {
        const diceToRoll = encounter?.failure?.damageDice || '1d4';
        const hpLoss = rollDice(diceToRoll);
        newHp = Math.max(0, newHp - hpLoss);
        logEvent(`💥 Failure! Triggered hazard. Took ${hpLoss} damage (${diceToRoll}).`);
      }

      return recalculateStats({
        ...prev,
        xp: { current: newXp, nextLevel: prev.xp.nextLevel },
        health: { current: newHp, max: prev.health.max },
        currency: { gold: newGold },
        inventory: newInventory
      });
    });
  };

  const finishEncounter = (isSuccess, encounter) => {
    setLastRoll(null);
    handleEncounterComplete(isSuccess, encounter);
  };

  const failCampaign = () => {
    logEvent("💀 Campaign Failed. Your health is depleted and your Expedition Keys were lost.");
    setCampaign(null);
    setActiveEncounter(null);
    setIsResting(true);
    
    setCharacter(prev => {
      // Strip out any expedition keys upon failure so they cannot be hoarded
      const inventoryWithoutKeys = prev.inventory.filter(item => item.id !== 'item_expedition_key');
      
      return recalculateStats({ 
        ...prev, 
        inventory: inventoryWithoutKeys,
        health: { ...prev.health, current: 0 } 
      });
    });
  };

  const buyItem = (item) => {
    setCharacter(prev => {
      if (prev.currency.gold < item.price) return prev;
      const newGold = prev.currency.gold - item.price;
      const newInventory = [...prev.inventory, { ...item, uid: crypto.randomUUID() }];
      logEvent(`🛒 Bought [${item.name}] for ${item.price} gold.`);
      return { ...prev, currency: { gold: newGold }, inventory: newInventory };
    });
  };

  const sellItem = (item) => {
    setCharacter(prev => {
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i === item);
      if (itemIndex !== -1) newInventory.splice(itemIndex, 1);
      
      const salePrice = item.value || 5;
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
      const newInventory = [...prev.inventory];
      
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i === item);
      if (itemIndex !== -1) newInventory.splice(itemIndex, 1);
      
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
      const newStash = [...(prev.stash || []), item]; // Safely handle old saves

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
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.findIndex(i => (item.uid && i.uid === item.uid) || i === item);
      if (itemIndex === -1) return prev;
      newInventory.splice(itemIndex, 1);

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

  const resolveEncounter = (encounter, isGamble = false, forcedD20 = null) => {
    if (!encounter || !character) return;
    const statKey = (encounter.challengeStat || 'dexterity').toLowerCase();
    const modifier = getModifier(character.stats[statKey] || 10);
    
    // IMPORTANT: Use the pre-rolled 3D dice if it exists!
    const d20 = forcedD20 !== null ? forcedD20 : rollDice(20);
    const totalRoll = d20 + modifier;
    
    const targetDC = isGamble ? (encounter.targetDC || 12) + 5 : (encounter.targetDC || 12);
    const isSuccess = totalRoll >= targetDC;

    if (isGamble) {
      encounter.isGamble = true;
    }

    if (isGamble && isSuccess) {
      const goldAmount = Math.floor(Math.random() * (30 * encounter.tier)) + (10 * encounter.tier);
      encounter.success = {
        xp: 20 * encounter.tier,
        gold: goldAmount,
      };
      
      if (Math.random() > 0.5) {
        const validItems = itemsCatalog.filter(i => (i.tier || 1) <= encounter.tier && i.type !== 'Material');
        if (validItems.length > 0) {
          const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
          encounter.success.lootTable = [{ id: randomItem.id, dropChance: 100 }];
        }
      }
    } else if (!isGamble && isSuccess) {
      encounter.success = { xp: 10 * encounter.tier, gold: 0 };
    }

    setLastRoll({ d20, modifier, totalRoll, success: isSuccess, isGamble });
    if (isSuccess) logEvent(isGamble ? `Success! Cracked the chest with a ${totalRoll} vs DC ${targetDC}.` : `Success! Bypassed hazard with ${totalRoll} vs DC ${targetDC}.`);
    else logEvent(`Failed! Rolled ${totalRoll} vs DC ${targetDC}.`);
  };

  const applyLevelUp = (statIncreases, chosenSpellId) => {
    setCharacter(prev => {
      const newLevel = prev.level + 1;
      const nextLevelXp = DND_XP_THRESHOLDS[newLevel] || prev.xp.nextLevel + 10000;
      
      const currentBase = prev.baseStats || prev.stats;
      const newBaseStats = {
        strength: currentBase.strength + statIncreases.strength,
        dexterity: currentBase.dexterity + statIncreases.dexterity,
        constitution: currentBase.constitution + statIncreases.constitution,
        intelligence: currentBase.intelligence + statIncreases.intelligence,
        wisdom: currentBase.wisdom + statIncreases.wisdom,
        charisma: currentBase.charisma + statIncreases.charisma,
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

      const updatedChar = {
        ...prev,
        level: newLevel,
        baseStats: newBaseStats,
        xp: { current: prev.xp.current, nextLevel: nextLevelXp },
        health: { current: newHp, max: newMaxHp },
        learnedSpells: newLearnedSpells,
        spellCharges: newSpellCharges
      };

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
    setCharacter(prev => {
      const refreshedCharges = {};
      prev.learnedSpells.forEach(id => {
        const spellObj = spellsCatalog.find(s => s.id === id);
        if (spellObj) {
          const wisBonus = Math.floor(prev.stats.wisdom / 4);
          const dexBonus = Math.floor(prev.stats.dexterity / 4);
          refreshedCharges[id] = spellObj.baseUses + wisBonus + dexBonus;
        }
      });
      return { ...prev, health: { ...prev.health, current: prev.health.max }, spellCharges: refreshedCharges };
    });
    setIsResting(false);
    logEvent("✨ You took a Long Rest. HP restored and all ability charges refreshed!");
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

  return { 
    character, setCharacter, activeEncounter, setActiveEncounter, campaign, startCampaign, moveToNode, handleEncounterComplete, finishEncounter, failCampaign, buyItem, sellItem,
    lastRoll, isResting, gameLog, pendingLevelUp, resolveEncounter, resolveRiddle, healCharacter, equipItem, unequipItem, applyLevelUp, consumeSpellCharge, resetGame, useConsumable,
    campaignVictory, clearCampaignVictory, depositItem, withdrawItem
  };
};