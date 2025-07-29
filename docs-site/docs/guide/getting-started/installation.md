# Installation

This guide will walk you through the process of installing QAQ Game Engine and setting up your development environment.

## Prerequisites

Before installing QAQ Game Engine, make sure you have the following:

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)
- **A modern web browser**: Chrome, Firefox, Safari, or Edge with WebGL support
- **A code editor**: Visual Studio Code (recommended), WebStorm, or any TypeScript-compatible editor

## Installation Methods

There are several ways to install and use QAQ Game Engine:

### Method 1: Create a New Project (Recommended)

The easiest way to get started is to use our project creation tool:

```bash
# Using npx (comes with npm)
npx create-qaq-game my-game

# Navigate to your new project
cd my-game

# Start the development server
npm run dev
```

This will:
1. Create a new directory with the project name
2. Install QAQ Game Engine and all dependencies
3. Set up a basic project structure
4. Configure TypeScript, bundling, and development tools
5. Create a starter game template

### Method 2: Add to an Existing Project

If you already have a project and want to add QAQ Game Engine:

```bash
# Using npm
npm install qaq-game-engine

# Using yarn
yarn add qaq-game-engine

# Using pnpm
pnpm add qaq-game-engine
```

Then import it in your code:

```typescript
// Import the entire engine
import { Engine, Scene, Node2D } from 'qaq-game-engine'

// Or import specific modules
import { Engine } from 'qaq-game-engine/core/engine'
import { Scene } from 'qaq-game-engine/core/scene'
```

### Method 3: Use CDN (Quick Prototyping)

For quick prototyping or testing, you can use a CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QAQ Game</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #game-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  
  <!-- Import QAQ Engine from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/qaq-game-engine@latest/dist/qaq.min.js"></script>
  
  <script>
    // QAQ is available as a global variable
    const { Engine, Scene, Sprite2D } = QAQ

    async function startGame() {
      // Initialize the engine
      const engine = Engine.getInstance()
      await engine.initialize({
        container: document.getElementById('game-container'),
        width: 800,
        height: 600
      })

      // Create a scene
      const scene = new Scene('MainScene')
      
      // Add a sprite
      const sprite = new Sprite2D('MySprite')
      sprite.position = { x: 400, y: 300, z: 0 }
      scene.addChild(sprite)

      // Set as main scene and start
      await engine.setMainScene(scene)
      engine.startRendering()
    }

    // Start the game when the page loads
    window.addEventListener('load', startGame)
  </script>
</body>
</html>
```

::: warning CDN Usage
The CDN version is great for prototyping but not recommended for production. It doesn't provide TypeScript support and may have performance implications.
:::

## Project Structure

When using the `create-qaq-game` tool, your project will have the following structure:

```
my-game/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   ├── audio/
│   │   └── models/
│   ├── scripts/
│   │   ├── Player.ts
│   │   └── GameManager.ts
│   ├── scenes/
│   │   ├── MainScene.ts
│   │   └── GameOverScene.ts
│   ├── main.ts
│   └── types.ts
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## TypeScript Configuration

QAQ Game Engine is built with TypeScript and works best with TypeScript projects. Here's a recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Development Environment Setup

### Visual Studio Code (Recommended)

For the best development experience, we recommend using Visual Studio Code with the following extensions:

1. **ESLint**: JavaScript/TypeScript linting
2. **Prettier**: Code formatting
3. **Three.js Snippets**: Helpful for working with Three.js (which QAQ uses internally)
4. **WebGL GLSL Editor**: For shader editing

### Recommended VS Code Settings

Add these to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Bundlers and Build Tools

QAQ Game Engine works with all modern bundlers and build tools:

### Vite (Recommended)

```bash
# Create a new Vite project with QAQ
npm create vite@latest my-qaq-game -- --template vanilla-ts
cd my-qaq-game
npm install qaq-game-engine
npm run dev
```

### Webpack

If you're using Webpack, make sure to configure it for TypeScript:

```javascript
// webpack.config.js
module.exports = {
  // ... other config
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(glb|gltf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
```

## Verifying Your Installation

To verify that QAQ Game Engine is installed correctly, create a simple test:

```typescript
// src/test.ts
import { Engine } from 'qaq-game-engine'

// Get the engine instance
const engine = Engine.getInstance()

// Log the engine version
console.log(`QAQ Game Engine version: ${engine.version}`)

// Check if WebGL is supported
console.log(`WebGL supported: ${engine.isWebGLSupported()}`)
```

## Troubleshooting

### Common Issues

#### "Cannot find module 'qaq-game-engine'"

Make sure you've installed the package:

```bash
npm install qaq-game-engine
```

#### TypeScript errors about missing types

QAQ includes TypeScript definitions, but you might need to update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ... other options
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

#### WebGL not supported

QAQ requires WebGL support. Check if your browser supports WebGL:

```typescript
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
console.log('WebGL supported:', !!gl)
```

### Getting Help

If you encounter issues:

1. Check the [FAQ](/guide/faq) for common problems
2. Search [GitHub Issues](https://github.com/qaq-engine/qaq-game-engine/issues)
3. Join our [Discord community](https://discord.gg/qaq-engine) for real-time help

## Next Steps

Now that you have QAQ Game Engine installed, you're ready to start building your first game:

- [Quick Start →](/guide/getting-started/quick-start)
- [Your First Scene →](/guide/getting-started/first-scene)
- [Basic Concepts →](/guide/getting-started/basic-concepts)
