<template>
  <div class="demo-container">
    <div class="demo-header">
      <NuxtLink to="/" class="back-button">
        ← 返回主页
      </NuxtLink>
      <h1>QAQ引擎 2D演示</h1>
      <div class="controls">
        <p>使用 WASD 键控制精灵移动 - 无边界限制，自由探索世界</p>
        <div class="mode-buttons">
          <button @click="toggleCameraFollow" :class="['mode-btn', { active: cameraFollow }]">
            {{ cameraFollow ? '相机跟随：开' : '相机跟随：关' }}
          </button>
          <button @click="resetPlayerPosition" class="mode-btn">
            重置位置
          </button>
          <button @click="adjustCameraSpeed" class="mode-btn">
            跟随速度: {{ cameraSpeed.toFixed(1) }}x
          </button>
        </div>

        <div class="animation-controls">
          <h4>动画控制</h4>
          <div class="mode-buttons">
            <button @click="playAnimation('idle')" :class="['mode-btn', { active: currentAnimation === 'idle' }]">
              待机动画
            </button>
            <button @click="playAnimation('walk')" :class="['mode-btn', { active: currentAnimation === 'walk' }]">
              行走动画
            </button>
            <button @click="playAnimation('jump')" :class="['mode-btn', { active: currentAnimation === 'jump' }]">
              跳跃动画
            </button>
            <button @click="toggleAutoAnimation" :class="['mode-btn', { active: autoAnimation }]">
              {{ autoAnimation ? '自动切换：开' : '自动切换：关' }}
            </button>
          </div>
        </div>

        <div class="camera-controls">
          <h4>相机效果</h4>
          <div class="mode-buttons">
            <button @click="startCameraShake('light')" class="mode-btn">
              轻微抖动
            </button>
            <button @click="startCameraShake('medium')" class="mode-btn">
              中等抖动
            </button>
            <button @click="startCameraShake('heavy')" class="mode-btn">
              强烈抖动
            </button>
            <button @click="stopCameraShake" class="mode-btn">
              停止抖动
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
          <li>✓ 2D精灵渲染</li>
          <li>✓ 无边界世界</li>
          <li>✓ 相机跟随系统</li>
          <li>✓ 世界坐标显示</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>控制说明</h3>
        <ul>
          <li><kbd>W</kbd> - 向上移动</li>
          <li><kbd>A</kbd> - 向左移动</li>
          <li><kbd>S</kbd> - 向下移动</li>
          <li><kbd>D</kbd> - 向右移动</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>玩家状态</h3>
        <p>世界位置: ({{ playerPos.x.toFixed(1) }}, {{ playerPos.y.toFixed(1) }})</p>
        <p>移动状态: {{ playerState }}</p>
        <p>移动速度: {{ playerSpeed }} px/s</p>
      </div>

      <div class="info-panel">
        <h3>动画状态</h3>
        <p>当前动画: {{ currentAnimation }}</p>
        <p>当前帧: {{ currentFrame + 1 }}/{{ totalFrames }}</p>
        <p>播放状态: {{ animationState }}</p>
        <p>自动切换: {{ autoAnimation ? '开启' : '关闭' }}</p>
      </div>

      <div class="info-panel">
        <h3>相机状态</h3>
        <p>相机位置: ({{ cameraPos.x.toFixed(1) }}, {{ cameraPos.y.toFixed(1) }})</p>
        <p>跟随状态: {{ cameraFollow ? '跟随中' : '静止' }}</p>
        <p>抖动状态: {{ cameraShaking ? '抖动中' : '正常' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node2D, AnimatedSprite2D,Sprite2D, ScriptManager, ScriptBase, ViewportManager } from '~/core'
import Camera2D from '~/core/nodes/2d/Camera2D'
import { AnimationMode } from '~/core/nodes/2d/AnimatedSprite2D'
import * as THREE from 'three'

// 设置页面标题
useHead({
  title: 'QAQ引擎 2D演示'
})

const gameCanvas = ref<HTMLElement>()

// 响应式状态
const playerPos = ref({ x: 0, y: 0 })
const cameraPos = ref({ x: 0, y: 0 })
const playerSpeed = ref(200)
const playerState = ref('idle')
const cameraFollow = ref(true)
const cameraSpeed = ref(5.0)
const cameraShaking = ref(false)

// 动画状态
const currentAnimation = ref('idle')
const currentFrame = ref(0)
const totalFrames = ref(0)
const animationState = ref('stopped')
const autoAnimation = ref(true)

// 全局变量
let playerNode: AnimatedSprite2D | null = null
let camera2D: Camera2D | null = null

// 玩家控制脚本
class PlayerController extends ScriptBase {
  private speed: number = 200
  private keys: { [key: string]: boolean } = {}
  private animatedSprite: AnimatedSprite2D | null = null
  private isMoving: boolean = false
  private lastState: string = 'idle'

  _ready(): void {
    this.print('玩家控制器准备就绪')

    // 获取AnimatedSprite2D节点引用 - 脚本附加到的节点就是AnimatedSprite2D
    this.animatedSprite = this.getOwner() as AnimatedSprite2D

    // 调试信息
    console.log('🔍 调试信息:')
    console.log('- Owner节点:', this.animatedSprite)
    console.log('- Owner类型:', this.animatedSprite?.constructor.name)
    console.log('- 是否有connect方法:', typeof this.animatedSprite?.connect)
    console.log('- 是否有hasSignal方法:', typeof this.animatedSprite?.hasSignal)
    console.log('- 是否有addSignal方法:', typeof this.animatedSprite?.addSignal)

    // 检查信号是否存在
    if (this.animatedSprite && typeof this.animatedSprite.hasSignal === 'function') {
      const requiredSignals = ['animation_started', 'animation_finished', 'frame_changed']
      for (const signal of requiredSignals) {
        const hasSignal = this.animatedSprite.hasSignal(signal)
        console.log(`- 信号 ${signal}:`, hasSignal ? '✅ 存在' : '❌ 不存在')
      }
    }

    // 监听键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    // 连接动画信号
    if (this.animatedSprite && typeof this.animatedSprite.connect === 'function') {
      try {
        this.animatedSprite.connect('animation_started', this.onAnimationStarted.bind(this))
        this.animatedSprite.connect('animation_finished', this.onAnimationFinished.bind(this))
        this.animatedSprite.connect('frame_changed', this.onFrameChanged.bind(this))
        console.log('✅ 动画信号连接成功')
      } catch (error) {
        console.error('❌ 信号连接失败:', error)
      }
    } else {
      console.warn('⚠️ AnimatedSprite2D节点未找到或信号系统不可用')
    }
  }

  _process(delta: number): void {
    const movement = { x: 0, y: 0, z: 0 }
    let isCurrentlyMoving = false

    // 检查按键状态并计算移动
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      movement.y -= this.speed * delta  // 向上移动
      isCurrentlyMoving = true
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      movement.y += this.speed * delta  // 向下移动
      isCurrentlyMoving = true
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      movement.x -= this.speed * delta  // 向左移动
      isCurrentlyMoving = true
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      movement.x += this.speed * delta  // 向右移动
      isCurrentlyMoving = true
    }

    // 更新移动状态
    this.isMoving = isCurrentlyMoving

    // 应用移动
    if (movement.x !== 0 || movement.y !== 0) {
      const currentPos = this.position
      this.position = {
        x: currentPos.x + movement.x,
        y: currentPos.y + movement.y,
        z: currentPos.z
      }

      // 更新UI显示的位置
      playerPos.value = { x: this.position.x, y: this.position.y }
    }

    // 自动切换动画
    if (autoAnimation.value) {
      this.updateAnimationState()
    }

    // 更新相机跟随
    if (camera2D && cameraFollow.value) {
      camera2D.setFollowTarget(this.position)
    }
  }

  _physics_process(delta: number): void {
    // 2D演示不需要物理处理
  }

  _input(event: any): void {
    // 输入已在键盘事件中处理
  }

  /**
   * 更新动画状态
   */
  private updateAnimationState(): void {
    let targetState = 'idle'

    if (this.isMoving) {
      targetState = 'walk'
    }

    // 检查是否需要切换动画
    if (targetState !== this.lastState) {
      this.playAnimation(targetState)
      this.lastState = targetState

      // 更新UI状态
      playerState.value = targetState
    }
  }

  /**
   * 播放指定动画
   */
  private playAnimation(animationName: string): void {
    if (this.animatedSprite && this.animatedSprite.hasAnimation(animationName)) {
      this.animatedSprite.play(animationName)
      currentAnimation.value = animationName
      console.log(`🎬 播放动画: ${animationName}`)
    }
  }

  /**
   * 动画开始事件
   */
  private onAnimationStarted(data: any): void {
    animationState.value = 'playing'
    console.log(`🎬 动画开始: ${data.animation}`)
  }

  /**
   * 动画结束事件
   */
  private onAnimationFinished(data: any): void {
    animationState.value = 'finished'
    console.log(`🏁 动画结束: ${data.animation}`)
  }

  /**
   * 帧变化事件
   */
  private onFrameChanged(data: any): void {
    currentFrame.value = data.frame
    if (this.animatedSprite) {
      totalFrames.value = this.animatedSprite.getCurrentAnimationFrameCount()
    }
  }



  _exit_tree(): void {
    this.print('玩家控制器销毁')
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

const resetPlayerPosition = () => {
  if (playerNode) {
    playerNode.position = { x: 0, y: 0, z: 0 }
    playerPos.value = { x: 0, y: 0 }

    if (camera2D) {
      camera2D.setPosition({ x: 0, y: 0 })
      cameraPos.value = { x: 0, y: 0 }
    }
    console.log('玩家位置已重置到原点')
  }
}

const adjustCameraSpeed = () => {
  const speeds = [1.0, 3.0, 5.0, 10.0]
  const currentIndex = speeds.indexOf(cameraSpeed.value)
  const nextIndex = (currentIndex + 1) % speeds.length
  cameraSpeed.value = speeds[nextIndex]

  if (camera2D) {
    camera2D.setFollowSpeed(cameraSpeed.value)
  }

  console.log(`相机跟随速度调整为: ${cameraSpeed.value}x`)
}

// 动画控制函数
const playAnimation = (animationName: string) => {
  if (playerNode && playerNode.hasAnimation(animationName)) {
    playerNode.play(animationName)
    currentAnimation.value = animationName
    console.log(`🎬 手动播放动画: ${animationName}`)
  }
}

const toggleAutoAnimation = () => {
  autoAnimation.value = !autoAnimation.value
  console.log(`自动动画切换: ${autoAnimation.value ? '开启' : '关闭'}`)
}

// 相机效果控制函数
const startCameraShake = (intensity: string) => {
  if (camera2D) {
    let shakeIntensity = 5
    let duration = 1.0

    switch (intensity) {
      case 'light':
        shakeIntensity = 3
        duration = 0.5
        break
      case 'medium':
        shakeIntensity = 8
        duration = 1.0
        break
      case 'heavy':
        shakeIntensity = 15
        duration = 1.5
        break
    }

    camera2D.startShake(shakeIntensity, duration)
    cameraShaking.value = true

    // 自动停止抖动状态显示
    setTimeout(() => {
      cameraShaking.value = false
    }, duration * 1000)

    console.log(`📳 开始相机抖动: ${intensity}`)
  }
}

const stopCameraShake = () => {
  if (camera2D) {
    camera2D.stopShake()
    cameraShaking.value = false
    console.log('📳 停止相机抖动')
  }
}

// 创建多个动画序列
const createPlayerAnimations = async (sprite: AnimatedSprite2D) => {
  try {
    console.log('🎬 开始创建玩家动画...')

    // 创建待机动画
    await createIdleAnimation(sprite)

    // 创建行走动画
    await createWalkAnimation(sprite)

    // 创建跳跃动画
    await createJumpAnimation(sprite)

    // 设置默认动画
    sprite.play('idle')
    currentAnimation.value = 'idle'
    animationState.value = 'playing'

    console.log('✅ 所有动画创建完成')

  } catch (error) {
    console.error('❌ 创建动画失败:', error)
  }
}

// 创建待机动画
const createIdleAnimation = async (sprite: AnimatedSprite2D) => {
  const frames = []
  const frameCount = 6

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 待机动画：轻微的呼吸效果
    const progress = i / (frameCount - 1)
    const breathe = 1 + Math.sin(progress * Math.PI * 2) * 0.1
    const size = 48 * breathe
    const offset = (64 - size) / 2

    // 绘制角色（蓝色）
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(offset, offset, size, size)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(offset, offset, size, size)

    // 添加标识
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('IDLE', 32, 32)

    frames.push({
      texture: new THREE.CanvasTexture(canvas),
      duration: 0.3
    })
  }

  sprite.addAnimation({
    name: 'idle',
    frames,
    mode: AnimationMode.LOOP,
    speed: 1.0,
    autoPlay: false
  })
}

// 创建行走动画
const createWalkAnimation = async (sprite: AnimatedSprite2D) => {
  const frames = []
  const frameCount = 8

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 行走动画：左右摆动效果
    const progress = i / (frameCount - 1)
    const sway = Math.sin(progress * Math.PI * 4) * 3
    const size = 48
    const offset = (64 - size) / 2 + sway

    // 绘制角色（绿色）
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(offset, (64 - size) / 2, size, size)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(offset, (64 - size) / 2, size, size)

    // 添加标识
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('WALK', 32, 32)

    frames.push({
      texture: new THREE.CanvasTexture(canvas),
      duration: 0.15
    })
  }

  sprite.addAnimation({
    name: 'walk',
    frames,
    mode: AnimationMode.LOOP,
    speed: 1.0,
    autoPlay: false
  })
}

// 创建跳跃动画
const createJumpAnimation = async (sprite: AnimatedSprite2D) => {
  const frames = []
  const frameCount = 4

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 跳跃动画：上下弹跳效果
    const progress = i / (frameCount - 1)
    const bounce = Math.sin(progress * Math.PI) * 8
    const size = 48
    const offsetY = (64 - size) / 2 - bounce

    // 绘制角色（橙色）
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect((64 - size) / 2, offsetY, size, size)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect((64 - size) / 2, offsetY, size, size)

    // 添加标识
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('JUMP', 32, offsetY + size / 2 + 3)

    frames.push({
      texture: new THREE.CanvasTexture(canvas),
      duration: 0.2
    })
  }

  sprite.addAnimation({
    name: 'jump',
    frames,
    mode: AnimationMode.ONCE,
    speed: 1.0,
    autoPlay: false
  })
}

onMounted(async () => {
  if (!gameCanvas.value) return

  try {
    console.log('🎮 初始化2D演示...')

    // 获取引擎实例
    const engine = Engine.getInstance()

    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      backgroundColor: 0x222222
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
    scriptManager.registerScriptClass('PlayerController', PlayerController)

    // 创建场景
    const scene = new Scene('Demo2DScene', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })

    // 创建根节点
    const root = new Node2D('Root')
    scene.addChild(root)

    // 创建动画精灵
    playerNode = new AnimatedSprite2D('Player', { autoPlay: false })
    playerNode.position = { x: 0, y: 0, z: 0 }
    playerPos.value = { x: 0, y: 0 }

    // 调试：检查信号系统
    console.log('🔍 AnimatedSprite2D信号系统调试:')
    console.log('- 节点类型:', playerNode.constructor.name)
    console.log('- 是否有connect方法:', typeof playerNode.connect)
    console.log('- 是否有hasSignal方法:', typeof playerNode.hasSignal)
    console.log('- 是否有addSignal方法:', typeof playerNode.addSignal)

    // 检查具体信号
    const testSignals = ['animation_started', 'animation_finished', 'frame_changed']
    for (const signal of testSignals) {
      const hasSignal = playerNode.hasSignal && playerNode.hasSignal(signal)
      console.log(`- 信号 ${signal}:`, hasSignal ? '✅ 存在' : '❌ 不存在')
    }

    // 手动测试信号连接
    if (playerNode.connect && typeof playerNode.connect === 'function') {
      try {
        const testCallback = (data: any) => {
          console.log('🎉 测试信号接收成功:', data)
        }
        const connectResult = playerNode.connect('animation_started', testCallback)
        console.log('信号连接结果:', connectResult)

        // 手动发射信号测试
        if (playerNode.emit && typeof playerNode.emit === 'function') {
          playerNode.emit('animation_started', { test: 'manual_emit' })
        }
      } catch (error) {
        console.error('❌ 手动信号测试失败:', error)
      }
    }

    // 创建所有动画
    await createPlayerAnimations(playerNode)

    console.log('✅ 玩家动画创建完成')

    // 附加控制脚本
    playerNode.attachScript('PlayerController')
    root.addChild(playerNode)

    // 创建世界原点标记
    const origin = new Sprite2D('Origin')
    origin.position = { x: 0, y: 0, z: -1 }

    const originCanvas = document.createElement('canvas')
    originCanvas.width = 20
    originCanvas.height = 20
    const originCtx = originCanvas.getContext('2d')!

    // 绘制原点标记（红色十字）
    originCtx.fillStyle = '#ff0000'
    originCtx.fillRect(8, 0, 4, 20)  // 垂直线
    originCtx.fillRect(0, 8, 20, 4)  // 水平线

    const originTexture = new THREE.CanvasTexture(originCanvas)
    origin.texture = originTexture
    root.addChild(origin)

    // 创建Camera2D节点
    camera2D = new Camera2D('MainCamera')
    camera2D.position = { x: 0, y: 0, z: 0 }
    camera2D.setViewportSize(800, 600)
    camera2D.setFollowSpeed(cameraSpeed.value)
    camera2D.setFollowTarget(playerNode.position)
    camera2D.makeCurrent() // 设置为当前相机
    root.addChild(camera2D)

    // 连接相机信号
    camera2D.connect('position_changed', (position) => {
      cameraPos.value = { x: position.x, y: position.y }
    })

    console.log('✅ Camera2D节点创建完成')

    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()

    // 切换到2D模式
    engine.switchTo2D()

    // 启动渲染
    engine.startRendering()

    // 启动播放模式
    await engine.startPlayMode()

    console.log('🎉 2D演示启动成功！')

  } catch (error) {
    console.error('❌ 2D演示初始化失败:', error)
  }
})

onUnmounted(() => {
  try {
    const engine = Engine.getInstance()
    engine.stopRendering()
    engine.destroy()
    console.log('🧹 2D演示清理完成')
  } catch (error) {
    console.error('❌ 2D演示清理失败:', error)
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

.animation-controls,
.camera-controls {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
}

.animation-controls h4,
.camera-controls h4 {
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
