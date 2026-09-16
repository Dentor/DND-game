/**
 * Calculates the loot and XP penalty for overleveled players farming low-tier content.
 * Assumes every 3 levels corresponds to roughly 1 Tier of difficulty.
 */
export const calculateLootPenalty = (playerLevel, tier) => {
  // A Tier 1 dungeon is meant for levels 1-3. Tier 2 is for 4-6.
  const expectedMaxLevel = tier * 3;
  const levelDiff = playerLevel - expectedMaxLevel;

  if (levelDiff <= 2) {
    // Player is within normal range
    return { isPenalized: false, xpMultiplier: 1, goldMultiplier: 1, message: "" };
  } 
  
  if (levelDiff <= 4) {
    // Player is slightly overleveled
    return { 
      isPenalized: true, 
      xpMultiplier: 0.5, 
      goldMultiplier: 0.5, 
      message: "⚠️ Overleveled: XP and Gold reduced by 50%. Item drops disabled." 
    };
  }

  // Player is vastly overleveled (Anti-Bot Zone)
  return { 
    isPenalized: true, 
    xpMultiplier: 0, 
    goldMultiplier: 0.1, 
    message: "🚨 Anti-Farm Active: No XP. Gold reduced by 90%. Item drops disabled." 
  };
};