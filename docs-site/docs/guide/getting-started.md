# 快速开始

欢迎使用QAQ游戏引擎！本指南将帮助您快速上手，创建您的第一个游戏项目。

## 什么是QAQ游戏引擎？

QAQ游戏引擎是一个基于TypeScript和Three.js构建的现代Web游戏引擎，具有以下特点：

- **统一渲染**：支持2D和3D渲染模式无缝切换
- **TypeScript优先**：完整的类型支持和现代开发体验
- **节点系统**：直观的场景图架构
- **脚本系统**：类型安全的脚本开发
- **Web原生**：专为现代浏览器优化

## 安装

### 方式一：使用脚手架（推荐）

```bash
# 创建新项目
npx create-qaq-game my-game
cd my-game

# 启动开发服务器
npm run dev
```

### 方式二：手动安装

```bash
# 安装QAQ引擎
npm install qaq-game-engine

# 或使用yarn
yarn add qaq-game-engine
```

## 第一个项目

让我们创建一个简单的游戏来了解QAQ引擎的基本用法：

<CodeExample
  title="基础游戏示例"
  :code="`// main.ts
import { Engine, Scene, Node2D, Sprite2D } from 'qaq-game-engine'

async function main() {
  // 1. 获取引擎实例
  const engine = Engine.getInstance()
  
  // 2. 初始化引擎
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600,
    antialias: true
  })
  
  // 3. 创建场景
  const scene = new Scene('MainScene', {
    type: 'MAIN',
    persistent: false,
    autoStart: true
  })
  
  // 4. 创建根节点
  const rootNode = new Node2D('Root')
  scene.addChild(rootNode)
  
  // 5. 创建精灵
  const player = new Sprite2D('Player')
  player.position = { x: 400, y: 300, z: 0 }
  rootNode.addChild(player)
  
  // 6. 设置主场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 7. 切换到2D模式并开始渲染
  engine.switchTo2D()
  engine.startRendering()
  
  console.log('游戏启动成功！')
}

// 启动游戏
main().catch(console.error)`"
  language="typescript"
  description="这个示例展示了如何创建一个基本的QAQ游戏项目"
/>

## HTML页面设置

创建一个HTML文件来承载您的游戏：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的QAQ游戏</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #game-canvas {
      border: 1px solid #333;
    }
  </style>
</head>
<body>
  <div id="game-canvas"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

## 添加脚本

让我们为玩家精灵添加一个简单的移动脚本：

<CodeExample
  title="玩家移动脚本"
  :code="`// scripts/PlayerController.ts
import { ScriptBase } from 'qaq-game-engine'

export class PlayerController extends ScriptBase {
  private speed: number = 200
  
  _ready(): void {
    this.print('玩家控制器已准备就绪')
    this.print(\`节点名称: \${this.node.name}\`)
  }
  
  _process(delta: number): void {
    // 简单的移动逻辑
    const pos = this.position
    
    // 让精灵在屏幕中央做圆周运动
    const time = this.getTime()
    const radius = 100
    
    this.position = {
      x: 400 + Math.cos(time) * radius,
      y: 300 + Math.sin(time) * radius,
      z: pos.z
    }
  }
  
  _exit_tree(): void {
    this.print('玩家控制器已销毁')
  }
}`"
  language="typescript"
  description="这个脚本让精灵做圆周运动"
/>

然后在主文件中注册并使用脚本：

```typescript
// 在main.ts中添加
import { ScriptManager } from 'qaq-game-engine'
import { PlayerController } from './scripts/PlayerController'

// 注册脚本类
const scriptManager = ScriptManager.getInstance()
scriptManager.registerScriptClass('PlayerController', PlayerController)

// 为精灵附加脚本
player.attachScript('PlayerController')
```

## 项目结构

推荐的项目结构：

```
my-game/
├── src/
│   ├── scripts/          # 游戏脚本
│   │   ├── PlayerController.ts
│   │   └── GameManager.ts
│   ├── scenes/           # 场景文件
│   │   ├── MainScene.ts
│   │   └── MenuScene.ts
│   ├── assets/           # 资源文件
│   │   ├── images/
│   │   ├── audio/
│   │   └── models/
│   ├── main.ts          # 入口文件
│   └── types.ts         # 类型定义
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
└── tsconfig.json
```

## 下一步

现在您已经创建了第一个QAQ游戏项目！接下来可以：

1. **[了解引擎核心](/guide/engine)** - 深入了解Engine类的功能
2. **[学习节点系统](/guide/nodes/node)** - 掌握节点的创建和管理
3. **[探索脚本系统](/guide/scripting/basics)** - 学习如何编写游戏逻辑
4. **[查看API文档](/api/core/engine)** - 详细的API参考

## 常见问题

### 为什么看不到精灵？

1. 检查是否正确设置了位置
2. 确认已切换到正确的渲染模式（2D/3D）
3. 验证节点是否已添加到场景中

### 脚本不执行怎么办？

1. 确保已注册脚本类
2. 检查是否已附加脚本到节点
3. 确认游戏处于播放模式

### 如何调试？

使用浏览器开发者工具：

```typescript
// 在脚本中添加调试信息
_process(delta: number): void {
  console.log('当前位置:', this.position)
  console.log('帧时间:', delta)
}
```

---

恭喜！您已经成功创建了第一个QAQ游戏项目。继续探索文档来学习更多高级功能。
