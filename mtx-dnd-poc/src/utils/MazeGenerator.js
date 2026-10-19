// Constants for map generation
const MIN_LEAF_SIZE = 8;
const MAX_LEAF_SIZE = 24;
const MIN_ROOM_SIZE = 4;

class Leaf {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.leftChild = null;
    this.rightChild = null;
    this.room = null;
    this.halls = [];
  }

  split() {
    if (this.leftChild || this.rightChild) return false;

    // Determine direction of split
    let splitH = Math.random() > 0.5;
    if (this.width > this.height && this.width / this.height >= 1.25) splitH = false;
    else if (this.height > this.width && this.height / this.width >= 1.25) splitH = true;

    const max = (splitH ? this.height : this.width) - MIN_LEAF_SIZE;
    if (max <= MIN_LEAF_SIZE) return false;

    const split = Math.floor(Math.random() * (max - MIN_LEAF_SIZE)) + MIN_LEAF_SIZE;

    if (splitH) {
      this.leftChild = new Leaf(this.x, this.y, this.width, split);
      this.rightChild = new Leaf(this.x, this.y + split, this.width, this.height - split);
    } else {
      this.leftChild = new Leaf(this.x, this.y, split, this.height);
      this.rightChild = new Leaf(this.x + split, this.y, this.width - split, this.height);
    }
    return true;
  }

  createRooms() {
    if (this.leftChild || this.rightChild) {
      if (this.leftChild) this.leftChild.createRooms();
      if (this.rightChild) this.rightChild.createRooms();
      if (this.leftChild && this.rightChild) {
        this.createHall(this.leftChild.getRoom(), this.rightChild.getRoom());
      }
    } else {
      const roomSize = {
        x: Math.floor(Math.random() * (this.width - MIN_ROOM_SIZE - 2)) + MIN_ROOM_SIZE,
        y: Math.floor(Math.random() * (this.height - MIN_ROOM_SIZE - 2)) + MIN_ROOM_SIZE
      };
      const roomPos = {
        x: Math.floor(Math.random() * (this.width - roomSize.x - 2)) + 1,
        y: Math.floor(Math.random() * (this.height - roomSize.y - 2)) + 1
      };
      this.room = {
        x: this.x + roomPos.x,
        y: this.y + roomPos.y,
        w: roomSize.x,
        h: roomSize.y
      };
    }
  }

  getRoom() {
    if (this.room) return this.room;
    let lRoom = null;
    let rRoom = null;
    if (this.leftChild) lRoom = this.leftChild.getRoom();
    if (this.rightChild) rRoom = this.rightChild.getRoom();
    if (!lRoom && !rRoom) return null;
    if (!lRoom) return rRoom;
    if (!rRoom) return lRoom;
    return Math.random() > 0.5 ? lRoom : rRoom;
  }

  createHall(l, r) {
    if (!l || !r) return;
    const point1 = { x: Math.floor(l.x + l.w / 2), y: Math.floor(l.y + l.h / 2) };
    const point2 = { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };

    const w = point2.x - point1.x;
    const h = point2.y - point1.y;

    if (w < 0) {
      if (h < 0) {
        if (Math.random() > 0.5) {
          this.halls.push({ x: point2.x, y: point1.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point2.x, y: point2.y, w: 1, h: Math.abs(h) });
        } else {
          this.halls.push({ x: point2.x, y: point2.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point1.x, y: point2.y, w: 1, h: Math.abs(h) });
        }
      } else {
        if (Math.random() > 0.5) {
          this.halls.push({ x: point2.x, y: point1.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point2.x, y: point1.y, w: 1, h: Math.abs(h) });
        } else {
          this.halls.push({ x: point2.x, y: point2.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point1.x, y: point1.y, w: 1, h: Math.abs(h) });
        }
      }
    } else {
      if (h < 0) {
        if (Math.random() > 0.5) {
          this.halls.push({ x: point1.x, y: point2.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point1.x, y: point2.y, w: 1, h: Math.abs(h) });
        } else {
          this.halls.push({ x: point1.x, y: point1.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point2.x, y: point2.y, w: 1, h: Math.abs(h) });
        }
      } else {
        if (Math.random() > 0.5) {
          this.halls.push({ x: point1.x, y: point2.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point1.x, y: point1.y, w: 1, h: Math.abs(h) });
        } else {
          this.halls.push({ x: point1.x, y: point1.y, w: Math.abs(w), h: 1 });
          this.halls.push({ x: point2.x, y: point1.y, w: 1, h: Math.abs(h) });
        }
      }
    }
  }
}

export const generateFloor = (width = 50, height = 50, floorLevel = 1) => {
  const leaves = [];
  const root = new Leaf(0, 0, width, height);
  leaves.push(root);

  let didSplit = true;
  while (didSplit) {
    didSplit = false;
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      if (!l.leftChild && !l.rightChild) {
        if (l.width > MAX_LEAF_SIZE || l.height > MAX_LEAF_SIZE || Math.random() > 0.25) {
          if (l.split()) {
            leaves.push(l.leftChild);
            leaves.push(l.rightChild);
            didSplit = true;
          }
        }
      }
    }
  }

  root.createRooms();

  // 1. Initialize Solid Grid
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x, y,
        type: 'wall', // 'wall', 'floor'
        entity: null, // 'player', 'stairs', 'chest', 'trap', 'enemy'
        enemyData: null,
        visibility: 'unexplored' // 'unexplored', 'discovered', 'visible'
      });
    }
    grid.push(row);
  }

  const rooms = [];

  // 2. Carve Rooms and Halls
  const carve = (leaf) => {
    if (leaf.room) {
      rooms.push(leaf.room);
      for (let y = leaf.room.y; y < leaf.room.y + leaf.room.h; y++) {
        for (let x = leaf.room.x; x < leaf.room.x + leaf.room.w; x++) {
          grid[y][x].type = 'floor';
        }
      }
    }
    leaf.halls.forEach(hall => {
      for (let y = hall.y; y <= hall.y + hall.h; y++) {
        for (let x = hall.x; x <= hall.x + hall.w; x++) {
          if (y < height && x < width) grid[y][x].type = 'floor';
        }
      }
    });
    if (leaf.leftChild) carve(leaf.leftChild);
    if (leaf.rightChild) carve(leaf.rightChild);
  };
  
  carve(root);

  // 3. Populate Floor (Player, Stairs, Enemies, Loot)
  // Sort rooms randomly
  const shuffledRooms = rooms.sort(() => 0.5 - Math.random());
  
  // The first room gets the player spawn
  const startRoom = shuffledRooms[0];
  const spawnPos = { 
    x: startRoom.x + Math.floor(startRoom.w / 2), 
    y: startRoom.y + Math.floor(startRoom.h / 2) 
  };
  grid[spawnPos.y][spawnPos.x].entity = 'player';

  // The last room gets the stairs to the next floor
  const endRoom = shuffledRooms[shuffledRooms.length - 1];
  const stairsPos = {
    x: endRoom.x + Math.floor(endRoom.w / 2),
    y: endRoom.y + Math.floor(endRoom.h / 2)
  };
  grid[stairsPos.y][stairsPos.x].entity = 'stairs';

  const enemiesList = [];

  // Populate remaining rooms
  for (let i = 1; i < shuffledRooms.length - 1; i++) {
    const room = shuffledRooms[i];
    
    // Scale density based on floor level
    const enemyChance = Math.min(0.8, 0.4 + (floorLevel * 0.05));
    const chestChance = 0.25;
    const trapChance = 0.20 + (floorLevel * 0.02);

    const center = { x: room.x + Math.floor(room.w / 2), y: room.y + Math.floor(room.h / 2) };

    if (Math.random() < enemyChance) {
      grid[center.y][center.x].entity = 'enemy';
      // Store reference for AI ticks later
      enemiesList.push({ id: crypto.randomUUID(), x: center.x, y: center.y, tier: Math.ceil(floorLevel / 2) });
    } else if (Math.random() < chestChance) {
      grid[center.y][center.x].entity = 'chest';
    } else if (Math.random() < trapChance) {
      grid[center.y][center.x].entity = 'trap';
    }
  }

  return { grid, spawnPos, stairsPos, enemiesList };
};