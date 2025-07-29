<template>
  <div class="boundary-demo">
    <div class="demo-header">
      <NuxtLink to="/" class="back-button">← 返回主页</NuxtLink>
      <h1>边界系统演示</h1>
      <div class="controls">
        <p>体验不同的边界处理方式</p>
        <div class="boundary-controls">
          <button 
            v-for="type in boundaryTypes" 
            :key="type.value"
            @click="setBoundaryType(type.value)"
            :class="['boundary-btn', { active: currentBoundaryType === type.value }]"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="game-container">
      <div id="game-canvas" ref="gameCanvas"></div>
    </div>
    
    <div class="demo-info">
      <div class="info-panel">
        <h3>当前边界模式</h3>
        <p :class="`mode-${currentBoundaryType.toLowerCase()}`">
          {{ boundaryTypes.find(t => t.value === currentBoundaryType)?.label }}
        </p>
        <p class="description">
          {{ boundaryTypes.find(t => t.value === currentBoundaryType)?.description }}
        </p>
      </div>
      
      <div class="info-panel">
        <h3>控制说明</h3>
        <ul>
          <li>WASD 或 方向键移动</li>
          <li>尝试移动到边界外</li>
          <li>观察不同边界行为</li>
        </ul>
      </div>
      
      <div class="info-panel">
        <h3>玩家状态</h3>
        <p>位置: ({{ playerPos.x.toFixed(1) }}, {{ playerPos.y.toFixed(1) }})</p>
        <p>状态: {{ status }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node2D, Sprite2D, ScriptManager, ScriptBase } from '~/core'
import * as THREE from 'three'

useHead({
  title: '边界系统演示 - QAQ引擎'
})

const gameCanvas = ref<HTMLElement>()
const status = ref<string>('准备初始化...')
const playerPos = ref({ x: 0, y: 0 })
const currentBoundaryType = ref<string>('CLAMP')

// 边界类型配置
const boundaryTypes = [
  { 
    value: 'NONE', 
    label: '无边界', 
    description: '可以移动到任意位置，没有限制' 
  },
  { 
    value: 'CLAMP', 
    label: '夹紧边界', 
    description: '移动被限制在边界内，无法超出' 
  },
  { 
    value: 'WRAP', 
    label: '环绕边界', 
    description: '从一边移出会从对面出现' 
  },
  { 
    value: 'BOUNCE', 
    label: '反弹边界', 
    description: '碰到边界会反弹回来' 
  }
]

let playerNode: Sprite2D | null = null

// 边界控制脚本
class BoundaryController extends ScriptBase {
  private speed: number = 200
  private keys: { [key: string]: boolean } = {}
  private canvasWidth: number = 800
  private canvasHeight: number = 600
  private spriteSize: number = 25
  private boundaryType: string = 'CLAMP'

  _ready(): void {
    this.print('边界控制器准备就绪')
    
    // 监听键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  _process(delta: number): void {
    const movement = { x: 0, y: 0, z: 0 }

    // 检查按键状态并计算移动
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      movement.y -= this.speed * delta  // 向上移动
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      movement.y += this.speed * delta  // 向下移动
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      movement.x -= this.speed * delta  // 向左移动
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      movement.x += this.speed * delta  // 向右移动
    }

    // 应用移动
    if (movement.x !== 0 || movement.y !== 0) {
      const currentPos = this.position
      let newX = currentPos.x + movement.x
      let newY = currentPos.y + movement.y
      
      // 根据边界类型处理
      const result = this.handleBoundary(newX, newY)
      
      this.position = {
        x: result.x,
        y: result.y,
        z: currentPos.z
      }
      
      // 更新显示的位置信息
      playerPos.value = { x: this.position.x, y: this.position.y }
    }
  }

  private handleBoundary(x: number, y: number): { x: number, y: number } {
    switch (this.boundaryType) {
      case 'NONE':
        // 无边界限制
        return { x, y }
        
      case 'CLAMP':
        // 夹紧到边界内
        return {
          x: Math.max(this.spriteSize, Math.min(this.canvasWidth - this.spriteSize, x)),
          y: Math.max(this.spriteSize, Math.min(this.canvasHeight - this.spriteSize, y))
        }
        
      case 'WRAP':
        // 环绕边界
        let wrapX = x
        let wrapY = y
        
        if (x < -this.spriteSize) wrapX = this.canvasWidth + this.spriteSize
        if (x > this.canvasWidth + this.spriteSize) wrapX = -this.spriteSize
        if (y < -this.spriteSize) wrapY = this.canvasHeight + this.spriteSize
        if (y > this.canvasHeight + this.spriteSize) wrapY = -this.spriteSize
        
        return { x: wrapX, y: wrapY }
        
      case 'BOUNCE':
        // 简单的反弹处理（夹紧到边界）
        return {
          x: Math.max(this.spriteSize, Math.min(this.canvasWidth - this.spriteSize, x)),
          y: Math.max(this.spriteSize, Math.min(this.canvasHeight - this.spriteSize, y))
        }
        
      default:
        return { x, y }
    }
  }

  setBoundaryType(type: string): void {
    this.boundaryType = type
    this.print(`边界类型切换为: ${type}`)
  }

  _exit_tree(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this))
    document.removeEventListener('keyup', this.onKeyUp.bind(this))
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.code] = true
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.code] = false
  }
}

// 设置边界类型
const setBoundaryType = (type: string) => {
  currentBoundaryType.value = type
  if (playerNode && playerNode.getScript('BoundaryController')) {
    const script = playerNode.getScript('BoundaryController') as BoundaryController
    script.setBoundaryType(type)
  }
}

onMounted(async () => {
  if (!gameCanvas.value) return
  
  try {
    console.log('🎯 开始边界系统演示...')
    status.value = '正在初始化引擎...'
    
    // 获取引擎实例
    const engine = Engine.getInstance()
    
    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      backgroundColor: 0x2a2a2a
    })
    
    console.log('✅ 引擎初始化完成')
    status.value = '引擎初始化完成'
    
    // 切换到2D模式
    engine.switchTo2D()
    
    // 注册脚本类
    const scriptManager = ScriptManager.getInstance()
    scriptManager.registerScriptClass('BoundaryController', BoundaryController)
    
    // 创建场景
    const scene = new Scene('BoundaryDemoScene', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })
    
    // 创建根节点
    const root = new Node2D('Root')
    scene.addChild(root)
    
    // 创建边界可视化
    const boundary = new Sprite2D('Boundary')
    boundary.position = { x: 400, y: 300, z: -2 }
    
    const boundaryCanvas = document.createElement('canvas')
    boundaryCanvas.width = 800
    boundaryCanvas.height = 600
    const boundaryCtx = boundaryCanvas.getContext('2d')!
    
    // 绘制边界框
    boundaryCtx.strokeStyle = '#22c55e'
    boundaryCtx.lineWidth = 3
    boundaryCtx.strokeRect(2, 2, 796, 596)
    
    // 绘制网格
    boundaryCtx.strokeStyle = '#444444'
    boundaryCtx.lineWidth = 1
    for (let x = 0; x <= 800; x += 100) {
      boundaryCtx.beginPath()
      boundaryCtx.moveTo(x, 0)
      boundaryCtx.lineTo(x, 600)
      boundaryCtx.stroke()
    }
    for (let y = 0; y <= 600; y += 100) {
      boundaryCtx.beginPath()
      boundaryCtx.moveTo(0, y)
      boundaryCtx.lineTo(800, y)
      boundaryCtx.stroke()
    }
    
    const boundaryTexture = new THREE.CanvasTexture(boundaryCanvas)
    boundary.texture = boundaryTexture
    root.addChild(boundary)
    
    // 创建玩家精灵
    playerNode = new Sprite2D('Player')
    playerNode.position = { x: 400, y: 300, z: 0 }
    playerPos.value = { x: 400, y: 300 }
    
    const playerCanvas = document.createElement('canvas')
    playerCanvas.width = 50
    playerCanvas.height = 50
    const playerCtx = playerCanvas.getContext('2d')!
    
    // 绘制玩家（圆形）
    playerCtx.fillStyle = '#ff6b6b'
    playerCtx.beginPath()
    playerCtx.arc(25, 25, 20, 0, Math.PI * 2)
    playerCtx.fill()
    
    playerCtx.strokeStyle = '#ffffff'
    playerCtx.lineWidth = 3
    playerCtx.stroke()
    
    const playerTexture = new THREE.CanvasTexture(playerCanvas)
    playerNode.texture = playerTexture
    
    // 附加控制脚本
    playerNode.attachScript('BoundaryController')
    root.addChild(playerNode)
    
    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()
    
    // 启动渲染
    engine.startRendering()
    
    console.log('🎉 边界系统演示启动成功！')
    status.value = '演示运行中'
    
  } catch (error) {
    console.error('❌ 边界系统演示初始化失败:', error)
    status.value = `初始化失败: ${error.message}`
  }
})

onUnmounted(() => {
  try {
    const engine = Engine.getInstance()
    engine.stopRendering()
    engine.destroy()
    console.log('🧹 边界系统演示清理完成')
  } catch (error) {
    console.error('❌ 边界系统演示清理失败:', error)
  }
})
</script>

<style scoped>
.boundary-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  padding: 1rem;
  font-family: 'Arial', sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.back-button {
  color: #22c55e;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.back-button:hover {
  color: #4ade80;
}

.demo-header h1 {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #22c55e, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.controls p {
  color: #a0a0a0;
  margin: 0.5rem 0;
  font-size: 1rem;
}

.boundary-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.boundary-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.boundary-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}

.boundary-btn.active {
  background: #22c55e;
  color: #000000;
  font-weight: bold;
}

.game-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

#game-canvas {
  border: 2px solid #22c55e;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.demo-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.info-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 200px;
  backdrop-filter: blur(10px);
}

.info-panel h3 {
  color: #22c55e;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.info-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-panel li {
  color: #c0c0c0;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.info-panel p {
  margin: 0.5rem 0;
  color: #c0c0c0;
}

.mode-none { color: #ffc107; }
.mode-clamp { color: #22c55e; }
.mode-wrap { color: #3b82f6; }
.mode-bounce { color: #f59e0b; }

.description {
  font-size: 0.9rem;
  font-style: italic;
  color: #a0a0a0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .demo-header h1 {
    font-size: 1.5rem;
  }
  
  #game-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .demo-info {
    flex-direction: column;
    align-items: center;
  }
  
  .info-panel {
    width: 100%;
    max-width: 300px;
  }
}
</style>
