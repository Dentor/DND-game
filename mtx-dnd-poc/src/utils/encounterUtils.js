import mockMonsters from '../data/mockMonsters.json';

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

export const selectMonsterForEncounter = ({ campaignTier, location, isBoss = false }) => {
  const requestedTier = isBoss ? Math.min(10, campaignTier + 1) : campaignTier;

  let pool = mockMonsters.filter(
    monster => monster.tier === requestedTier && Array.isArray(monster.locations) && monster.locations.includes(location)
  );

  if (pool.length === 0) pool = mockMonsters.filter(monster => monster.tier === requestedTier);

  if (pool.length === 0) {
    const safeTiers = mockMonsters.map(monster => monster.tier).filter(tier => tier < requestedTier);
    const highestSafeTier = safeTiers.length > 0 ? Math.max(...safeTiers) : null;

    if (highestSafeTier !== null) {
      pool = mockMonsters.filter(
        monster => monster.tier === highestSafeTier && (!Array.isArray(monster.locations) || monster.locations.includes(location))
      );
      if (pool.length === 0) pool = mockMonsters.filter(monster => monster.tier === highestSafeTier);
    }
  }

  if (pool.length === 0) return mockMonsters[0]; 
  return pool[Math.floor(Math.random() * pool.length)];
};

export const createEncounterObject = (node, campaignTier, playerLevel, location = 'Dark Forest') => {
  const base = {
    type: node.type,
    tier: campaignTier,
    location,
    title: node.isBoss ? 'FINAL BOSS CHAMBER' : `${node.type} Encounter`,
    isBoss: node.isBoss
  };

  if (node.type === 'Trap') {
    const forcedStat = node.challengeStat || 'Dexterity';
    const trapCatalog = [
      { id: 'trap-collapsing-ceiling', title: 'Collapsing Ceiling', stat: 'Strength', desc: 'The masonry above begins to fracture and rain heavy debris down.' },
      { id: 'trap-crushing-walls', title: 'Crushing Walls', stat: 'Strength', desc: 'The corridor suddenly narrows as the stone walls slide inward, threatening to crush you.' },
      { id: 'trap-iron-maiden', title: 'Iron Maiden Snare', stat: 'Strength', desc: 'A rusted iron maiden snaps shut around you; you must pry the heavy doors open before the spikes pierce.' },
      { id: 'trap-poison-darts', title: 'Poison Dart Wall', stat: 'Dexterity', desc: 'A tripwire releases a volley of envenomed darts from the stonework.' },
      { id: 'trap-hidden-pitfall', title: 'Hidden Pitfall', stat: 'Dexterity', desc: 'The floor gives way over a deep, spike-lined subterranean drop.' },
      { id: 'trap-swinging-scythes', title: 'Swinging Scythes', stat: 'Dexterity', desc: 'Massive, rusted scythe blades swing down from the darkness like deadly pendulums.' },
      { id: 'trap-noxious-gas', title: 'Noxious Gas Chamber', stat: 'Constitution', desc: 'Vents open in the floor, spewing a thick, green, choking miasma into the room.' },
      { id: 'trap-freezing-mist', title: 'Freezing Mist', stat: 'Constitution', desc: 'A pressurized canister bursts, releasing a cloud of bone-chilling, sub-zero mist.' },
      { id: 'trap-necrotic-spores', title: 'Necrotic Spores', stat: 'Constitution', desc: 'Disturbing a patch of fungal growth releases a cloud of flesh-eating, toxic spores.' },
      { id: 'trap-arcane-glyph', title: 'Arcane Runebound Glyph', stat: 'Intelligence', desc: 'A volatile magical rune pulses with unstable energy on the floor.' },
      { id: 'trap-shifting-labyrinth', title: 'Shifting Labyrinth', stat: 'Intelligence', desc: 'The corridor twists into a mind-bending optical illusion designed to trap the unwary.' },
      { id: 'trap-puzzle-box', title: 'Trapped Puzzle Box', stat: 'Intelligence', desc: 'A complex, rigged puzzle mechanism triggers an arcane explosion if solved incorrectly.' },
      { id: 'trap-siren-crystal', title: 'Siren Song Crystal', stat: 'Wisdom', desc: 'A glowing crystal emanates a hypnotic melody that compels you to walk directly into danger.' },
      { id: 'trap-mirage-oasis', title: 'Mirage Oasis', stat: 'Wisdom', desc: 'A shimmering illusion of safety masks a deadly pit of boiling mud; you must see through the deception.' },
      { id: 'trap-whispering-shadows', title: 'Whispering Shadows', stat: 'Wisdom', desc: 'Disembodied voices echo in the dark, attempting to drive your mind to madness and exhaustion.' },
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