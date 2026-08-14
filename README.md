

# 🐉 MTX D&D RPG - Playable Prototype

Welcome to the MTX D&D Prototype! This is a web-based, tactical 2D RPG built with React and Vite. It features a tabletop-style dice rolling engine, grid-based tactical combat, a campaign expedition map, and a real-time multiplayer-ready Sanctuary Hub.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
* **[Node.js](https://nodejs.org/)** (Version 16.0 or higher recommended)
* **npm**, **yarn**, or **pnpm** (npm is included with Node.js)

## 🚀 Installation & Setup

Follow these steps to get the game running locally on your machine:

**1. Clone the repository**

git clone <your-repository-url-here>
cd mtx-dnd-poc


**2. Install dependencies**
Run the following command to install all required React and Vite packages:

npm install
# or 'yarn install' / 'pnpm install'

**3. Run the development server**
Start the local Vite server to play the game:

npm run dev
# or 'yarn dev' / 'pnpm dev'

**4. Open the game**
Once the server starts, it will provide a local URL. Open your browser and navigate to:


http://localhost:5173/

```

---

## 🎨 Asset Library Note for Testers

This game relies on custom pixel art for the 2D grid maps, equipment, traps, and UI. If you are experiencing missing images (or seeing the fallback "IMG" text), ensure your local `src/assets/` folder is fully synced and matches this structure:

```text
src/
 └── assets/
      ├── house/         # Sanctuary tiles (wooden-tile-01, stone-wall-01, bed, chest, etc.)
      ├── maps/          # Combat grid tiles (forest textures, bridges, rivers, blocks)
      ├── traps/         # 18 unique hazard encounter cards
      └── icons/         # Stat attributes and UI elements

```

---

## 🎮 What to Test

If you are jumping in to test the latest features, please focus on the following areas:

* **The Sanctuary Hub:** You should spawn in the interactive 2D house. Test clicking the **Bed** (Heal), **Chest** (Stash Inventory), and **Backpack** (Expedition Map).
* **3D Tabletop Dice:** Engage in combat or trigger a Trap on the map. You should see the new pseudo-3D dice modal roll D20s and damage dice.
* **Tactical Combat:** Test moving, taking cover, and attacking. Ensure you **cannot** spam spells when you have 0 actions left.
* **Floating Retro Text:** Verify that damage and healing numbers pop up on the battle grid using the retro arcade font, floating upward slowly.

## 🐛 Bug Reporting

If you encounter any glitches, missing assets, or exploit loops (like infinite actions or hovering tooltips getting stuck/clipped), please document the exact steps you took and report them in the project tracker or Discord.

Happy adventuring! ⚔️

```

```