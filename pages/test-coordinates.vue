<template>
  <div class="test-container">
    <div class="test-header">
      <NuxtLink to="/" class="back-button">← 返回主页</NuxtLink>
      <h1>坐标系测试</h1>
      <div class="info">
        <p>测试2D坐标系是否正确：(0,0)应该在左上角</p>
        <p>红色方块 = 原点(0,0)，绿色方块 = 玩家精灵</p>
      </div>
    </div>

    <div class="game-container">
      <div id="game-canvas" ref="gameCanvas"></div>
    </div>

    <div class="controls">
      <p><strong>控制说明：</strong></p>
      <p>WASD 或 方向键移动绿色方块</p>
      <p>观察坐标变化和边界检测</p>
    </div>

    <div class="debug-info">
      <h3>调试信息</h3>
      <p>状态: {{ status }}</p>
      <p>玩家位置: ({{ playerPos.x.toFixed(1) }}, {{ playerPos.y.toFixed(1) }})</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node2D, Sprite2D, ScriptManager, ScriptBase } from '~/core'
import * as THREE from 'three'

useHead({
  title: '坐标系测试 - QAQ引擎'
})

const gameCanvas = ref<HTMLElement>()
const status = ref<string>('准备初始化...')
const playerPos = ref({ x: 0, y: 0 })

// 测试控制脚本
class TestController extends ScriptBase {
  private speed: number = 150
  private keys: { [key: string]: boolean } = {}
  private canvasWidth: number = 800
  private canvasHeight: number = 600
  private spriteSize: number = 25

  _ready(): void {
    this.print('测试控制器准备就绪')

    // 监听键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  _process(delta: number): void {
    const movement = { x: 0, y: 0, z: 0 }

    // 检查按键状态并计算移动
    // 2D坐标系：(0,0)在左上角，Y轴向下为正
    // W键 = 向上移动 = Y值减少，S键 = 向下移动 = Y值增加
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      movement.y -= this.speed * delta  // 向上移动（屏幕上向上，Y值减少）
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      movement.y += this.speed * delta  // 向下移动（屏幕上向下，Y值增加）
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      movement.x -= this.speed * delta  // 向左移动（X值减少）
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      movement.x += this.speed * delta  // 向右移动（X值增加）
    }

    // 应用移动并进行边界检测
    if (movement.x !== 0 || movement.y !== 0) {
      const currentPos = this.position
      const newX = currentPos.x + movement.x
      const newY = currentPos.y + movement.y

      // 边界检测
      this.position = {
        x: Math.max(this.spriteSize, Math.min(this.canvasWidth - this.spriteSize, newX)),
        y: Math.max(this.spriteSize, Math.min(this.canvasHeight - this.spriteSize, newY)),
        z: currentPos.z
      }

      // 更新显示的位置信息
      playerPos.value = { x: this.position.x, y: this.position.y }
    }
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

onMounted(async () => {
  if (!gameCanvas.value) return

  try {
    console.log('🧪 开始坐标系测试...')
    status.value = '正在初始化引擎...'

    // 获取引擎实例
    const engine = Engine.getInstance()

    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      backgroundColor: 0x333333
    })

    console.log('✅ 引擎初始化完成')
    status.value = '引擎初始化完成'

    // 切换到2D模式
    engine.switchTo2D()

    // 注册脚本类
    const scriptManager = ScriptManager.getInstance()
    scriptManager.registerScriptClass('TestController', TestController)

    // 创建场景
    const scene = new Scene('CoordinateTestScene', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })

    // 创建根节点
    const root = new Node2D('Root')
    scene.addChild(root)

    // 创建原点标记 (0,0) - 红色方块
    const origin = new Sprite2D('Origin')
    origin.position = { x: 0, y: 0, z: 1 }

    const originCanvas = document.createElement('canvas')
    originCanvas.width = 50
    originCanvas.height = 50
    const originCtx = originCanvas.getContext('2d')!
    originCtx.fillStyle = '#ff0000'
    originCtx.fillRect(0, 0, 50, 50)
    originCtx.fillStyle = '#ffffff'
    originCtx.font = '12px Arial'
    originCtx.fillText('(0,0)', 5, 15)

    const originTexture = new THREE.CanvasTexture(originCanvas)
    origin.texture = originTexture
    root.addChild(origin)

    // 创建玩家精灵 - 绿色方块
    const player = new Sprite2D('Player')
    player.position = { x: 100, y: 100, z: 0 }
    playerPos.value = { x: 100, y: 100 }

    const playerCanvas = document.createElement('canvas')
    playerCanvas.width = 50
    playerCanvas.height = 50
    const playerCtx = playerCanvas.getContext('2d')!
    playerCtx.fillStyle = '#22c55e'
    playerCtx.fillRect(0, 0, 50, 50)
    playerCtx.strokeStyle = '#ffffff'
    playerCtx.lineWidth = 2
    playerCtx.strokeRect(2, 2, 46, 46)

    const playerTexture = new THREE.CanvasTexture(playerCanvas)
    player.texture = playerTexture

    // 附加控制脚本
    player.attachScript('TestController')
    root.addChild(player)

    // 创建边界标记
    const corners = [
      { pos: { x: 0, y: 0 }, label: '左上' },
      { pos: { x: 800, y: 0 }, label: '右上' },
      { pos: { x: 0, y: 600 }, label: '左下' },
      { pos: { x: 800, y: 600 }, label: '右下' }
    ]

    corners.forEach(corner => {
      const marker = new Sprite2D(`Corner_${corner.label}`)
      marker.position = { x: corner.pos.x, y: corner.pos.y, z: -1 }

      const canvas = document.createElement('canvas')
      canvas.width = 20
      canvas.height = 20
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(0, 0, 20, 20)

      const texture = new THREE.CanvasTexture(canvas)
      marker.texture = texture
      root.addChild(marker)
    })

    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()

    // 启动渲染
    engine.startRendering()

    console.log('🎉 坐标系测试启动成功！')
    status.value = '测试运行中'

  } catch (error) {
    console.error('❌ 坐标系测试初始化失败:', error)
    status.value = `初始化失败: ${error.message}`
  }
})

onUnmounted(() => {
  try {
    const engine = Engine.getInstance()
    engine.stopRendering()
    engine.destroy()
    console.log('🧹 坐标系测试清理完成')
  } catch (error) {
    console.error('❌ 坐标系测试清理失败:', error)
  }
})
</script>

<style scoped>
.test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  padding: 1rem;
  font-family: 'Arial', sans-serif;
}

.test-header {
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

.test-header h1 {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #22c55e, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.info p {
  color: #a0a0a0;
  margin: 0.25rem 0;
  font-size: 0.9rem;
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

.controls, .debug-info {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem auto;
  max-width: 600px;
  backdrop-filter: blur(10px);
}

.controls h3, .debug-info h3 {
  color: #22c55e;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.controls p, .debug-info p {
  margin: 0.25rem 0;
  color: #c0c0c0;
}
</style>
