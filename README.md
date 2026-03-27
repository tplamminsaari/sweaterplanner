# Sweater Planner

A browser-based tool for designing knitting patterns for sweaters. Draw colorwork patterns on a grid, assign yarn colors, and see a live preview of the finished sweater.

**Features:**
- Two pattern grids: hem/cuffs and yoke, with configurable dimensions
- Yarn library with colors from Ístex (Léttlopi, Álafoss Lopi) and Sandnes Garn (Peer Gynt)
- Live sweater preview: pattern colors rendered onto a flat 2D sweater illustration
- Pattern state persisted in browser localStorage

**Tech stack:** React 19 + TypeScript + Vite, Zustand + Immer for state, HTML Canvas for rendering.

---

## Development Setup

### Prerequisites

- **Node.js** 18 or later — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node.js) or **yarn**

### Linux

```bash
# Install Node.js via your package manager, e.g. on Ubuntu/Debian:
sudo apt install nodejs npm

# Or use nvm for version management (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart your shell, then:
nvm install --lts

# Clone and install
git clone <repo-url> sweaterplanner
cd sweaterplanner
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Windows

1. Download and install Node.js from [nodejs.org](https://nodejs.org) (LTS version recommended).
   Alternatively, install via [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

2. Open a terminal (Command Prompt, PowerShell, or Windows Terminal) and run:
   ```powershell
   git clone <repo-url> sweaterplanner
   cd sweaterplanner
   npm install
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with hot module reloading |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
