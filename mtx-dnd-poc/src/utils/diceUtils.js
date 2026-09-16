export const getModifier = (score) => Math.floor((score - 10) / 2);

export const rollDice = (diceInput) => {
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