---
layout: home

hero:
  name: "QAQ游戏引擎"
  text: "新一代TypeScript游戏引擎"
  tagline: "基于Three.js构建，支持统一的2D/3D渲染，现代Web技术驱动"
  image:
    src: /images/qaq-hero.png
    alt: QAQ游戏引擎
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看源码
      link: https://github.com/qaq-engine/qaq-game-engine
    - theme: alt
      text: API文档
      link: /api/core/engine

features:
  - icon: 🎮
    title: 统一2D/3D渲染
    details: 单一引擎无缝切换2D和3D渲染模式，完美支持需要多种视角的游戏开发。

  - icon: 🔧
    title: TypeScript优先
    details: 从零开始使用TypeScript构建，提供类型安全、更好的IDE支持和现代开发体验。

  - icon: 🌐
    title: Web原生设计
    details: 专为Web浏览器设计，支持WebGL、渐进式加载和响应式设计。

  - icon: 📦
    title: 节点架构
    details: 直观的场景图系统，包含Node2D、Node3D和各种专用节点，适用于不同的游戏对象和UI元素。

  - icon: 🎯
    title: 脚本系统
    details: 强大的脚本系统，支持生命周期管理、类型安全API和热重载，助力快速开发。

  - icon: ⚡
    title: 性能优化
    details: 基于Three.js构建，优化了批处理、剔除和高效内存管理。

  - icon: 🎨
    title: 丰富的UI系统
    details: 完整的UI框架，支持响应式布局、主题和无障碍功能。

  - icon: 🔌
    title: 可扩展架构
    details: 插件架构支持自定义节点、渲染器和游戏特定功能的轻松扩展。

  - icon: 📱
    title: 跨平台部署
    details: 部署到Web、移动Web和桌面Electron，一套代码多平台运行。
---

<div class="qaq-hero">
  <QaqLogo :animation="true" />
</div>

## Why QAQ Game Engine?

QAQ Game Engine represents the next evolution in web-based game development. Unlike traditional engines that were ported to the web, QAQ was designed from the ground up for modern web browsers and JavaScript/TypeScript development.

<div class="qaq-feature-grid">
  <div class="qaq-feature-card">
    <h3>🚀 Modern Architecture</h3>
    <p>Built with ES6+ modules, TypeScript, and modern web APIs. No legacy baggage, just clean, maintainable code.</p>
  </div>

  <div class="qaq-feature-card">
    <h3>🎯 Developer Experience</h3>
    <p>IntelliSense support, hot-reloading, comprehensive documentation, and debugging tools designed for web developers.</p>
  </div>

  <div class="qaq-feature-card">
    <h3>🌟 Production Ready</h3>
    <p>Used in production games with proven performance, stability, and scalability for both indie and commercial projects.</p>
  </div>
</div>

## Quick Start

Get up and running with QAQ Game Engine in minutes:

```bash
# Install QAQ Game Engine
npm install qaq-game-engine

# Create a new project
npx create-qaq-game my-game
cd my-game

# Start development server
npm run dev
```

```typescript
// main.ts - Your first QAQ game
import { Engine, Scene, Sprite2D } from 'qaq-game-engine'

async function main() {
  // Initialize the engine
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })

  // Create a scene
  const scene = new Scene('MainScene')

  // Add a sprite
  const player = new Sprite2D('Player')
  player.position = { x: 400, y: 300, z: 0 }
  scene.addChild(player)

  // Set as main scene and start
  await engine.setMainScene(scene)
  engine.startRendering()
}

main()
```

## Core Features

### 🎮 Unified Rendering Pipeline

QAQ's unique architecture allows you to mix 2D and 3D content seamlessly:

- **2D Mode**: Optimized for sprites, UI, and traditional 2D games
- **3D Mode**: Full 3D rendering with lighting, shadows, and post-processing
- **Mixed Mode**: Combine 2D UI with 3D worlds or 2D sprites in 3D space

### 📦 Node System

Everything in QAQ is a node. This provides a consistent, intuitive way to structure your game:

```
Scene
├── Node2D (UI Layer)
│   ├── Button2D
│   └── Label
├── Node3D (Game World)
│   ├── Camera3D
│   ├── MeshInstance3D
│   └── Light3D
└── Node2D (HUD Layer)
    └── Sprite2D
```

### 🎯 Script System

Type-safe scripting with full IDE support:

```typescript
export class PlayerController extends ScriptBase {
  private speed = 200

  _ready(): void {
    this.print('Player ready!')
  }

  _process(delta: number): void {
    // Move player based on input
    if (Input.isActionPressed('move_right')) {
      this.position.x += this.speed * delta
    }
  }
}
```

## Community & Support

- 📚 **Documentation**: Comprehensive guides and API reference
- 💬 **Discord**: Join our community for help and discussions
- 🐛 **GitHub Issues**: Report bugs and request features
- 📝 **Blog**: Development updates and tutorials
- 🎓 **Examples**: Learn from real-world game examples

## Browser Support

QAQ Game Engine supports all modern browsers with WebGL:

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

QAQ Game Engine is released under the [MIT License](https://github.com/qaq-engine/qaq-game-engine/blob/main/LICENSE).

---

<div style="text-align: center; margin: 3rem 0;">
  <h2>Ready to build your next game?</h2>
  <p>Join thousands of developers already using QAQ Game Engine</p>
  <a href="/guide/getting-started/introduction" class="get-started-btn">Get Started Now →</a>
</div>

<style>
.get-started-btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--qaq-green-600), var(--qaq-green-500));
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

.get-started-btn:hover {
  background: linear-gradient(135deg, var(--qaq-green-500), var(--qaq-green-400));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}
</style>
