# OPERATION ART3MIS

**Phase 1** - Single-player lunar rover movement & local save

**Live Demo**: https://art3mis.org/

## Overview
This first-phase version lets you pilot a simple rover across a blank lunar surface. Your rover’s position is saved in **localStorage**, so you can reload and resume.

## Tech Stack
- **Runtime**: Browser (PWA-ready)
- **Language**: TypeScript
- **Engine**: [Phaser 3](https://phaser.io)
- **Bundler/Dev Server**: Vite
- **Storage**: IndexedDB (via browser API) for future expansions, current phase uses `localStorage`

## Setup & Development
```bash
# 1. Install deps
npm install

# 2. Launch dev server
npm run dev

# 3. Open http://localhost:3000
```

## Build & Deploy
```bash
# Build for production
npm run build

# Deploy the `dist/` folder to GitHub Pages or any static host
```

## Gameplay Controls
- **Arrow keys** to move the rover.
- Position persists across reloads.

## License
MIT
