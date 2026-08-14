export const generateMap = (campaignTier) => {
  const depth = 6 + Math.min(Math.floor(campaignTier / 2), 4); 
  const mapNodes = [];
  const nodeTypes = ['Monster', 'Merchant', 'Camp', 'Trap'];
  const trapStats = ['Strength', 'Dexterity', 'Intelligence'];

  // Row 0: The "Entrance" Point
  mapNodes.push({
    id: `node_0_1`, row: 0, col: 1, type: 'Entrance', isBoss: false, connections: []
  });

  for (let row = 1; row <= depth; row++) {
    const isBossRow = row === depth;
    const columns = isBossRow ? 1 : 3;

    for (let col = 0; col < columns; col++) {
      let type = isBossRow ? 'Monster' : nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      
      // Pre-assign the trap's required stat right at generation
      let challengeStat = null;
      if (type === 'Trap') {
        challengeStat = trapStats[Math.floor(Math.random() * trapStats.length)];
      }

      mapNodes.push({
        id: `node_${row}_${col}`, row, col: isBossRow ? 1 : col, type, isBoss: isBossRow, challengeStat, connections: []
      });
    }
  }

  for (let row = 0; row < depth; row++) {
    const isStartRow = row === 0;
    const isNextBossRow = (row + 1 === depth);
    const currentColumns = isStartRow ? 1 : 3;

    for (let col = 0; col < currentColumns; col++) {
      const actualCol = isStartRow || (row === depth) ? 1 : col;
      const current = mapNodes.find(n => n.row === row && n.col === actualCol);
      if (!current) continue;

      if (isStartRow) {
        for (let nextCol = 0; nextCol < 3; nextCol++) {
          const target = mapNodes.find(n => n.row === 1 && n.col === nextCol);
          if (target) current.connections.push(target.id);
        }
      } else if (isNextBossRow) {
        const bossNode = mapNodes.find(n => n.isBoss);
        if (bossNode && !current.connections.includes(bossNode.id)) current.connections.push(bossNode.id);
      } else {
        const targetCol1 = Math.floor(Math.random() * 3);
        const target1 = mapNodes.find(n => n.row === row + 1 && n.col === targetCol1);
        if (target1) current.connections.push(target1.id);

        if (Math.random() < 0.7) { 
          const targetCol2 = (targetCol1 + 1) % 3;
          const target2 = mapNodes.find(n => n.row === row + 1 && n.col === targetCol2);
          if (target2 && !current.connections.includes(target2.id)) {
            current.connections.push(target2.id);
          }
        }
      }
    }
  }

  return { nodes: mapNodes, startNodeId: 'node_0_1' };
};