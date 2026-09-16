export const getDistance = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

export const checkLineOfSight = (p1, p2, mapData) => {
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

export const isCellInTrail = (x, y, trailArray) => {
  return trailArray.some(cell => cell.x === x && cell.y === y);
};

export const getBfsPath = (start, goal, maxDist, isBlockedFn) => {
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

export const getReachableCells = (start, movement, isBlockedFn) => {
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

export const generateBattleMap = (gridSize) => {
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