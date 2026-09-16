export const defaultUnlocked = [];

for (let x = 0; x < 14; x++) {
  for (let y = 0; y < 8; y++) {
    defaultUnlocked.push(`${x},${y}`);
  }
}

export const DEFAULT_SANCTUARY = {
  cols: 30,
  rows: 30,
  unlockedTiles: defaultUnlocked, 
  housingInventory: [], 
  baseFloor: '/src/assets/house/wooden-tile-01.png',
  customFloors: {}, 
  walls: ['6,0', '6,1', '6,2', '6,3', '6,5', '6,6', '6,7'],
  furniture: [
    { uid: 'default-bed', id: 'bed', type: 'Bed', cells: ['0,0', '1,0', '0,1', '1,1'], spanX: 2, spanY: 2, sprite: '/src/assets/house/bad_01.png', tooltip: 'Long Rest (Restore HP & Spells)', actionId: 'rest' },
    { uid: 'default-chest', id: 'chest', type: 'Stash Chest', cells: ['8,0', '9,0'], spanX: 2, spanY: 1, sprite: '/src/assets/house/chest_01.png', tooltip: 'Personal Stash (Locked to others)', actionId: 'stash' },
    { uid: 'default-exp', id: 'expedition', type: 'Expedition Table', cells: ['12,6', '13,6', '12,7', '13,7'], spanX: 2, spanY: 2, sprite: '/src/assets/house/backpack_01.png', tooltip: 'Launch Expedition', actionId: 'expedition' }
  ]
};