<template>
  <div class="demo-container">
    <div class="demo-header">
      <NuxtLink to="/" class="back-button">
        ← 返回主页
      </NuxtLink>
      <h1>QAQ引擎 TileMap演示</h1>
      <div class="controls">
        <p>使用 WASD 键移动相机 - 探索瓦片地图世界</p>
        <div class="mode-buttons">
          <button @click="toggleCameraFollow" :class="['mode-btn', { active: cameraFollow }]">
            {{ cameraFollow ? '相机跟随：开' : '相机跟随：关' }}
          </button>
          <button @click="resetCameraPosition" class="mode-btn">
            重置相机
          </button>
          <button @click="adjustCameraSpeed" class="mode-btn">
            移动速度: {{ cameraSpeed.toFixed(1) }}x
          </button>
        </div>

        <div class="tilemap-controls">
          <h4>瓦片地图控制</h4>
          <div class="mode-buttons">
            <button @click="generateRandomMap" class="mode-btn">
              生成随机地图
            </button>
            <button @click="generateMaze" class="mode-btn">
              生成迷宫
            </button>
            <button @click="generateChessboard" class="mode-btn">
              生成棋盘
            </button>
            <button @click="clearMap" class="mode-btn">
              清空地图
            </button>
          </div>
        </div>

        <div class="layer-controls">
          <h4>图层控制</h4>
          <div class="mode-buttons">
            <button @click="toggleLayer('background')" :class="['mode-btn', { active: layerVisibility.background }]">
              背景层
            </button>
            <button @click="toggleLayer('main')" :class="['mode-btn', { active: layerVisibility.main }]">
              主要层
            </button>
            <button @click="toggleLayer('foreground')" :class="['mode-btn', { active: layerVisibility.foreground }]">
              前景层
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="game-container">
      <div id="game-canvas" ref="gameCanvas"></div>
    </div>

    <div class="demo-info">
      <div class="info-panel">
        <h3>演示功能</h3>
        <ul>
          <li>✓ 多层瓦片地图</li>
          <li>✓ 块优化渲染</li>
          <li>✓ 动态瓦片生成</li>
          <li>✓ 相机控制系统</li>
          <li>✓ 图层管理</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>控制说明</h3>
        <ul>
          <li><kbd>W</kbd> - 相机向上</li>
          <li><kbd>A</kbd> - 相机向左</li>
          <li><kbd>S</kbd> - 相机向下</li>
          <li><kbd>D</kbd> - 相机向右</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>相机状态</h3>
        <p>相机位置: ({{ cameraPos.x.toFixed(1) }}, {{ cameraPos.y.toFixed(1) }})</p>
        <p>移动速度: {{ cameraSpeed.toFixed(1) }}x</p>
        <p>跟随状态: {{ cameraFollow ? '跟随中' : '手动控制' }}</p>
      </div>

      <div class="info-panel">
        <h3>地图信息</h3>
        <p>地图尺寸: {{ mapSize.x }}x{{ mapSize.y }}</p>
        <p>瓦片尺寸: {{ tileSize.x }}x{{ tileSize.y }}</p>
        <p>已加载块数: {{ loadedChunks }}</p>
        <p>总瓦片数: {{ totalTiles }}</p>
      </div>

      <div class="info-panel">
        <h3>图层状态</h3>
        <p>背景层: {{ layerVisibility.background ? '显示' : '隐藏' }}</p>
        <p>主要层: {{ layerVisibility.main ? '显示' : '隐藏' }}</p>
        <p>前景层: {{ layerVisibility.foreground ? '显示' : '隐藏' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node2D, ScriptManager, ScriptBase, ViewportManager } from '~/core'
import Camera2D from '~/core/nodes/2d/Camera2D'
import TileMap2D from '~/core/nodes/2d/TileMap2D'
import TileSet from '~/core/resources/TileSet'
import * as THREE from 'three'

// 设置页面标题
useHead({
  title: 'QAQ引擎 TileMap演示'
})

const gameCanvas = ref<HTMLElement>()

// 响应式状态
const cameraPos = ref({ x: 0, y: 0 })
const cameraSpeed = ref(3.0)
const cameraFollow = ref(false)
const mapSize = ref({ x: 50, y: 50 })
const tileSize = ref({ x: 32, y: 32 })
const loadedChunks = ref(0)
const totalTiles = ref(0)
const layerVisibility = ref({
  background: true,
  main: true,
  foreground: true
})

// 全局变量
let camera2D: Camera2D | null = null
let tileMap: TileMap2D | null = null
let tileSet: TileSet | null = null
let cameraController: any = null

// 相机控制脚本
class CameraController extends ScriptBase {
  private speed: number = 200
  private keys: { [key: string]: boolean } = {}

  _ready(): void {
    this.print('相机控制器准备就绪')

    // 监听键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  _process(delta: number): void {
    if (cameraFollow.value || !camera2D) return

    const movement = { x: 0, y: 0 }

    // 检查按键状态并计算移动
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      movement.y -= this.speed * delta * cameraSpeed.value
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      movement.y += this.speed * delta * cameraSpeed.value
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      movement.x -= this.speed * delta * cameraSpeed.value
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      movement.x += this.speed * delta * cameraSpeed.value
    }

    // 应用移动
    if (movement.x !== 0 || movement.y !== 0) {
      const currentPos = camera2D.followTarget || { x: 0, y: 0 }
      const newPos = {
        x: currentPos.x + movement.x,
        y: currentPos.y + movement.y
      }

      camera2D.setFollowTarget(newPos)
      cameraPos.value = { x: newPos.x, y: newPos.y }
    }
  }

  _exit_tree(): void {
    this.print('相机控制器销毁')
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

// 控制函数
const toggleCameraFollow = () => {
  cameraFollow.value = !cameraFollow.value
  console.log(`相机跟随: ${cameraFollow.value ? '开启' : '关闭'}`)
}

const resetCameraPosition = () => {
  if (camera2D) {
    camera2D.setFollowTarget({ x: 0, y: 0 })
    cameraPos.value = { x: 0, y: 0 }
    console.log('相机位置已重置到原点')
  }
}

const adjustCameraSpeed = () => {
  const speeds = [1.0, 2.0, 3.0, 5.0, 8.0]
  const currentIndex = speeds.indexOf(cameraSpeed.value)
  const nextIndex = (currentIndex + 1) % speeds.length
  cameraSpeed.value = speeds[nextIndex]
  console.log(`相机移动速度调整为: ${cameraSpeed.value}x`)
}

// TileMap控制函数
const generateRandomMap = () => {
  if (!tileMap) return

  console.log('🎲 生成随机地图...')

  // 清空现有地图
  clearMap()

  // 在主要层生成随机瓦片
  for (let x = 0; x < mapSize.value.x; x++) {
    for (let y = 0; y < mapSize.value.y; y++) {
      if (Math.random() < 0.3) { // 30%概率放置瓦片
        const tileId = Math.floor(Math.random() * 4) // 随机选择瓦片类型
        tileMap.setTile(x, y, tileId, 'main')
      }
    }
  }

  updateMapStats()
}

const generateMaze = () => {
  if (!tileMap) return

  console.log('🌀 生成迷宫...')

  // 清空现有地图
  clearMap()

  // 生成简单的迷宫模式
  for (let x = 0; x < mapSize.value.x; x++) {
    for (let y = 0; y < mapSize.value.y; y++) {
      // 边界墙
      if (x === 0 || y === 0 || x === mapSize.value.x - 1 || y === mapSize.value.y - 1) {
        tileMap.setTile(x, y, 1, 'main') // 墙壁瓦片
      }
      // 内部迷宫
      else if (x % 2 === 0 && y % 2 === 0) {
        tileMap.setTile(x, y, 1, 'main') // 墙壁瓦片
      }
      else if (x % 4 === 0 || y % 4 === 0) {
        if (Math.random() < 0.7) {
          tileMap.setTile(x, y, 1, 'main') // 墙壁瓦片
        }
      }
    }
  }

  updateMapStats()
}

const generateChessboard = () => {
  if (!tileMap) return

  console.log('♟️ 生成棋盘...')

  // 清空现有地图
  clearMap()

  // 生成棋盘模式
  for (let x = 0; x < mapSize.value.x; x++) {
    for (let y = 0; y < mapSize.value.y; y++) {
      const tileId = (x + y) % 2 === 0 ? 0 : 2 // 交替使用两种瓦片
      tileMap.setTile(x, y, tileId, 'main')
    }
  }

  updateMapStats()
}

const clearMap = () => {
  if (!tileMap) return

  console.log('🧹 清空地图...')

  // 清空所有层的瓦片
  for (let x = 0; x < mapSize.value.x; x++) {
    for (let y = 0; y < mapSize.value.y; y++) {
      tileMap.clearTile(x, y, 'background')
      tileMap.clearTile(x, y, 'main')
      tileMap.clearTile(x, y, 'foreground')
    }
  }

  updateMapStats()
}

const toggleLayer = (layerName: string) => {
  if (!tileMap) return

  layerVisibility.value[layerName] = !layerVisibility.value[layerName]
  tileMap.setLayerVisible(layerName, layerVisibility.value[layerName])
  console.log(`图层 ${layerName}: ${layerVisibility.value[layerName] ? '显示' : '隐藏'}`)
}

const updateMapStats = () => {
  if (!tileMap) return

  let count = 0
  for (let x = 0; x < mapSize.value.x; x++) {
    for (let y = 0; y < mapSize.value.y; y++) {
      if (tileMap.getTile(x, y, 'main') !== -1) count++
      if (tileMap.getTile(x, y, 'background') !== -1) count++
      if (tileMap.getTile(x, y, 'foreground') !== -1) count++
    }
  }
  totalTiles.value = count
}

// 创建瓦片集
const createTileSet = async (): Promise<TileSet> => {
  const tileSet = new TileSet()
  tileSet.name = 'DemoTileSet'
  tileSet.tileSize = { x: 32, y: 32 }

  // 创建瓦片纹理
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  // 绘制4种不同的瓦片
  const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'] // 绿、红、蓝、橙
  const patterns = ['solid', 'border', 'cross', 'dots']

  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 32
    const y = Math.floor(i / 2) * 32

    ctx.fillStyle = colors[i]
    ctx.fillRect(x, y, 32, 32)

    // 添加不同的图案
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2

    switch (patterns[i]) {
      case 'solid':
        // 纯色，不添加额外图案
        break
      case 'border':
        ctx.strokeRect(x + 2, y + 2, 28, 28)
        break
      case 'cross':
        ctx.beginPath()
        ctx.moveTo(x + 8, y + 16)
        ctx.lineTo(x + 24, y + 16)
        ctx.moveTo(x + 16, y + 8)
        ctx.lineTo(x + 16, y + 24)
        ctx.stroke()
        break
      case 'dots':
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2)
        ctx.arc(x + 22, y + 10, 2, 0, Math.PI * 2)
        ctx.arc(x + 10, y + 22, 2, 0, Math.PI * 2)
        ctx.arc(x + 22, y + 22, 2, 0, Math.PI * 2)
        ctx.fill()
        break
    }
  }

  // 设置纹理
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  tileSet.texture = texture

  // 创建瓦片定义
  tileSet.createTilesFromGrid(2, 2, 0)

  console.log('✅ 瓦片集创建完成')
  return tileSet
}

onMounted(async () => {
  if (!gameCanvas.value) return

  try {
    console.log('🎮 初始化TileMap演示...')

    // 获取引擎实例
    const engine = Engine.getInstance()

    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      backgroundColor: 0x1a1a1a
    })

    console.log('✅ 引擎初始化完成')

    // 切换到2D模式
    engine.switchTo2D()

    // 初始化视口系统
    const viewportManager = ViewportManager.getInstance()
    viewportManager.setCanvasSize(800, 600)
    viewportManager.createDefaultViewport()

    console.log('✅ 视口系统初始化完成')

    // 注册脚本类
    const scriptManager = ScriptManager.getInstance()
    scriptManager.registerScriptClass('CameraController', CameraController)

    // 创建场景
    const scene = new Scene('TileMapDemoScene', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })

    // 创建根节点
    const root = new Node2D('Root')
    scene.addChild(root)

    // 创建瓦片集
    tileSet = await createTileSet()

    // 创建TileMap
    tileMap = new TileMap2D('DemoTileMap')
    tileMap.tileSet = tileSet
    tileMap.tileSize = tileSize.value
    tileMap.mapSize = mapSize.value

    // 创建图层
    tileMap.createLayer('background', 0, -1)
    tileMap.createLayer('main', 0, 0)
    tileMap.createLayer('foreground', 0, 1)

    root.addChild(tileMap)

    // 创建相机控制器节点
    const cameraControllerNode = new Node2D('CameraController')
    cameraControllerNode.attachScript('CameraController')
    root.addChild(cameraControllerNode)
    cameraController = cameraControllerNode

    // 创建Camera2D节点
    camera2D = new Camera2D('MainCamera')
    camera2D.position = { x: 0, y: 0, z: 0 }
    camera2D.setViewportSize(800, 600)
    camera2D.setFollowSpeed(5.0)
    camera2D.setFollowTarget({ x: 0, y: 0 })
    camera2D.makeCurrent()
    root.addChild(camera2D)

    // 连接相机信号
    camera2D.connect('position_changed', (position) => {
      cameraPos.value = { x: position.x, y: position.y }
    })

    console.log('✅ Camera2D节点创建完成')

    // 生成初始地图
    generateChessboard()

    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()

    // 切换到2D模式
    engine.switchTo2D()

    // 启动渲染
    engine.startRendering()

    // 启动播放模式
    await engine.startPlayMode()

    console.log('🎉 TileMap演示启动成功！')

  } catch (error) {
    console.error('❌ TileMap演示初始化失败:', error)
  }
})

onUnmounted(() => {
  try {
    const engine = Engine.getInstance()
    engine.stopRendering()
    engine.destroy()
    console.log('🧹 TileMap演示清理完成')
  } catch (error) {
    console.error('❌ TileMap演示清理失败:', error)
  }
})
</script>

<style scoped>
.demo-container {
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
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mode-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.mode-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}

.mode-btn.active {
  background: #22c55e;
  color: #000000;
  font-weight: bold;
}

.tilemap-controls,
.layer-controls {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
}

.tilemap-controls h4,
.layer-controls h4 {
  color: #22c55e;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
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

kbd {
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
  color: #22c55e;
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
