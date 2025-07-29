<template>
  <div class="game-container">
    <div class="game-header">
      <NuxtLink to="/" class="back-button">
        ← 返回主页
      </NuxtLink>
      <h1>3D 肉鸽游戏测试</h1>
      <div class="game-stats">
        <div class="stat">
          <span>生命值: </span>
          <span class="health-bar">
            <span class="health-fill" :style="{ width: playerHealth + '%' }"></span>
          </span>
          <span>{{ playerHealth }}/100</span>
        </div>
        <div class="stat">等级: {{ playerLevel }}</div>
        <div class="stat">分数: {{ score }}</div>
      </div>
    </div>

    <div class="game-area">
      <div id="game-canvas" ref="gameCanvas"></div>

      <div class="game-controls" v-if="gameStarted">
        <div class="control-group">
          <h4>移动控制</h4>
          <div class="controls-grid">
            <button @click="movePlayer('forward')" class="control-btn">↑ W</button>
            <button @click="movePlayer('backward')" class="control-btn">↓ S</button>
            <button @click="movePlayer('left')" class="control-btn">← A</button>
            <button @click="movePlayer('right')" class="control-btn">→ D</button>
          </div>
        </div>

        <div class="control-group">
          <h4>动作</h4>
          <button @click="attack()" class="control-btn attack">攻击 (空格)</button>
          <button @click="switchAnimation()" class="control-btn">切换动画</button>
          <button @click="testCameraUpdate()" class="control-btn">测试相机</button>
        </div>

        <div class="control-group">
          <h4>调试</h4>
          <button @click="testPlayerMovement()" class="control-btn debug">测试移动</button>
          <button @click="togglePlayerDebug()" class="control-btn debug">切换调试</button>
          <button @click="forcePlayerMove()" class="control-btn debug">强制移动</button>
          <button @click="checkSystemStatus()" class="control-btn debug">系统状态</button>
        </div>

        <div class="control-group">
          <h4>映射测试</h4>
          <button @click="testPositionMapping()" class="control-btn debug">位置映射</button>
          <button @click="testCameraMapping()" class="control-btn debug">相机映射</button>
          <button @click="testPositionAPI()" class="control-btn debug">位置API</button>
          <button @click="syncTest()" class="control-btn debug">同步测试</button>
        </div>

        <div class="control-group">
          <h4>相机控制</h4>
          <button @click="testCameraShake()" class="control-btn camera">震动测试</button>
          <button @click="switchToThirdPerson()" class="control-btn camera">第三人称</button>
          <button @click="switchToTopDown()" class="control-btn camera">俯视角</button>
          <button @click="testCameraActivation()" class="control-btn camera">激活测试</button>
        </div>
      </div>
    </div>

    <div class="game-info" v-if="!gameStarted">
      <div class="start-screen">
        <h2>3D 肉鸽冒险</h2>
        <p>使用 WASD 移动，空格键攻击敌人</p>
        <p>收集道具，击败敌人，升级你的角色！</p>
        <button @click="startGame" class="start-btn">开始游戏</button>
      </div>
    </div>

    <div class="minimap" v-if="gameStarted">
      <h4>小地图</h4>
      <div class="minimap-grid">
        <div
          v-for="(cell, index) in minimapCells"
          :key="index"
          :class="['minimap-cell', cell.type]"
        >
          <div v-if="cell.hasPlayer" class="player-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node3D, MeshInstance3D, Camera3D, DirectionalLight3D, ScriptManager, ScriptBase, MaterialType, AnimationPlayer } from '~/core'

// 游戏状态
const gameStarted = ref(false)
const playerHealth = ref(100)
const playerLevel = ref(1)
const score = ref(0)
const gameCanvas = ref<HTMLElement>()

// 小地图数据
const minimapCells = ref<Array<{type: string, hasPlayer: boolean}>>([])

// 游戏对象引用
let player: Node3D | null = null
let camera: Camera3D | null = null
let enemies: Node3D[] = []
let collectibles: Node3D[] = []

// 相机控制器和震动系统
let cameraController: CameraController | null = null
let cameraShake: CameraShake | null = null

// 相机增强函数
function enhanceCamera3D(camera: Camera3D): void {
	console.log(camera,'camera')
	return
  // 添加震动系统
  (camera as any).shake = (intensity: number, duration: number, frequency: number = 20) => {
    if (!cameraShake) {
      cameraShake = new CameraShake(camera)
    }
    cameraShake.shake(intensity, duration, frequency)
  }

  // 添加停止震动方法
  (camera as any).stopShake = function(): void {
    if (cameraShake) {
      cameraShake.stopShake()
    }
  }

  // 添加设置跟随目标方法
  (camera as any).setTarget = function(target: Node3D | null): void {
    if (cameraController) {
      cameraController.setTarget(target)
    }
  }

  // 添加俯视角预设方法
  (camera as any).setTopDownView = function(height: number, angle: number = -60): void {
    console.log(`📷 设置俯视角预设: 高度=${height}, 角度=${angle}°`)

    // 如果有目标，设置相对于目标的位置
    if (player) {
      const playerPos = player.position
      camera.position = {
        x: playerPos.x,
        y: height,
        z: playerPos.z + 3
      }
      camera.lookAt(playerPos)
    } else {
      // 默认位置
      camera.position = { x: 0, y: height, z: 3 }
      camera.lookAt({ x: 0, y: 0, z: 0 })
    }
  }

  // 添加第三人称相机模式
  (camera as any).setThirdPersonMode = function(target: Node3D, distance: number = 8, height: number = 5): void {
    console.log(`📷 切换到第三人称模式: 距离=${distance}, 高度=${height}`)

    // 停止当前控制器
    if (cameraController) {
      cameraController.setEnabled(false)
    }

    // 创建第三人称控制器
    cameraController = new ThirdPersonCamera(camera)
    cameraController.setTarget(target)
    ;(cameraController as ThirdPersonCamera).setDistance(distance)
    ;(cameraController as ThirdPersonCamera).setHeight(height)
    cameraController.setEnabled(true)
  }

  // 添加俯视角相机模式
  (camera as any).setTopDownMode = function(target: Node3D, height: number = 20): void {
    console.log(`📷 切换到俯视角模式: 高度=${height}`)

    // 停止当前控制器
    if (cameraController) {
      cameraController.setEnabled(false)
    }

    // 创建俯视角控制器
    cameraController = new TopDownCamera(camera)
    cameraController.setTarget(target)
    ;(cameraController as TopDownCamera).setHeight(height)
    cameraController.setEnabled(true)
  }

  // 添加相机跟随更新方法
  (camera as any).updateFollow = function(delta: number): void {
    // 更新相机控制器
    if (cameraController && cameraController.enabled) {
      cameraController.update(delta)
    }

    // 更新震动效果
    if (cameraShake) {
      cameraShake.update(delta)
    }
  }

  // 添加相机状态检查方法
  (camera as any).getCameraStatus = function(): any {
    return {
      position: camera.position,
      current: camera.current,
      controller: cameraController ? cameraController.constructor.name : 'None',
      shaking: cameraShake && cameraShake.shakeIntensity > 0,
      target: cameraController?.target?.name || 'None'
    }
  }

  console.log('✅ Camera3D功能增强完成')
}
let currentAnimation = ref('idle')

// 相机控制器基类
abstract class CameraController {
  protected camera: Camera3D
  public target: Node3D | null = null
  public enabled: boolean = true
  protected debugMode: boolean = false

  constructor(camera: Camera3D) {
    this.camera = camera
  }

  abstract update(delta: number): void

  setTarget(target: Node3D | null): void {
    this.target = target
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }
}

// 第三人称相机控制器
class ThirdPersonCamera extends CameraController {
  private distance: number = 8
  private height: number = 5
  private angle: number = 0
  private pitch: number = -30 // 俯视角度
  private rotationSpeed: number = 2
  private followSpeed: number = 5
  private targetOffset: Vector3 = { x: 0, y: 0, z: 0 }

  constructor(camera: Camera3D) {
    super(camera)
  }

  setDistance(distance: number): void {
    this.distance = Math.max(1, distance)
  }

  setHeight(height: number): void {
    this.height = height
  }

  setAngle(angle: number): void {
    this.angle = angle
  }

  setPitch(pitch: number): void {
    this.pitch = Math.max(-89, Math.min(89, pitch))
  }

  setTargetOffset(offset: Vector3): void {
    this.targetOffset = offset
  }

  update(delta: number): void {
    if (!this.enabled || !this.target) return

    // 获取目标位置
    const targetPos = this.target.position
    const targetWithOffset = {
      x: targetPos.x + this.targetOffset.x,
      y: targetPos.y + this.targetOffset.y,
      z: targetPos.z + this.targetOffset.z
    }

    // 计算相机位置
    const angleRad = this.angle * Math.PI / 180
    const pitchRad = this.pitch * Math.PI / 180

    const cameraPos = {
      x: targetWithOffset.x + this.distance * Math.cos(pitchRad) * Math.sin(angleRad),
      y: targetWithOffset.y + this.height + this.distance * Math.sin(pitchRad),
      z: targetWithOffset.z + this.distance * Math.cos(pitchRad) * Math.cos(angleRad)
    }

    // 平滑移动相机
    const currentPos = this.camera.position
    const lerpFactor = Math.min(1, this.followSpeed * delta)

    this.camera.position = {
      x: currentPos.x + (cameraPos.x - currentPos.x) * lerpFactor,
      y: currentPos.y + (cameraPos.y - currentPos.y) * lerpFactor,
      z: currentPos.z + (cameraPos.z - currentPos.z) * lerpFactor
    }

    // 相机看向目标
    this.camera.lookAt(targetWithOffset)

    if (this.debugMode) {
      console.log(`📷 第三人称相机更新:`)
      console.log(`   目标位置: (${targetWithOffset.x.toFixed(2)}, ${targetWithOffset.y.toFixed(2)}, ${targetWithOffset.z.toFixed(2)})`)
      console.log(`   相机位置: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`)
      console.log(`   角度: ${this.angle.toFixed(1)}°, 俯仰: ${this.pitch.toFixed(1)}°`)
    }
  }

  // 围绕目标旋转
  rotateAround(deltaAngle: number): void {
    this.angle += deltaAngle
    this.angle = this.angle % 360
  }

  // 调整俯仰角
  adjustPitch(deltaPitch: number): void {
    this.pitch = Math.max(-89, Math.min(89, this.pitch + deltaPitch))
  }

  // 调整距离
  adjustDistance(deltaDistance: number): void {
    this.distance = Math.max(1, Math.min(50, this.distance + deltaDistance))
  }
}

// 俯视角相机控制器
class TopDownCamera extends CameraController {
  private height: number = 20
  private angle: number = -60 // 俯视角度
  private offset: Vector3 = { x: 0, y: 0, z: 3 }
  private followSpeed: number = 8
  private smoothing: boolean = true

  constructor(camera: Camera3D) {
    super(camera)
  }

  setHeight(height: number): void {
    this.height = Math.max(5, height)
  }

  setAngle(angle: number): void {
    this.angle = Math.max(-89, Math.min(0, angle))
  }

  setOffset(offset: Vector3): void {
    this.offset = offset
  }

  setFollowSpeed(speed: number): void {
    this.followSpeed = Math.max(0.1, speed)
  }

  setSmoothingEnabled(enabled: boolean): void {
    this.smoothing = enabled
  }

  update(delta: number): void {
    if (!this.enabled || !this.target) return

    const targetPos = this.target.position

    // 计算相机位置
    const cameraPos = {
      x: targetPos.x + this.offset.x,
      y: this.height,
      z: targetPos.z + this.offset.z
    }

    // 应用位置
    if (this.smoothing) {
      const currentPos = this.camera.position
      const lerpFactor = Math.min(1, this.followSpeed * delta)

      this.camera.position = {
        x: currentPos.x + (cameraPos.x - currentPos.x) * lerpFactor,
        y: currentPos.y + (cameraPos.y - currentPos.y) * lerpFactor,
        z: currentPos.z + (cameraPos.z - currentPos.z) * lerpFactor
      }
    } else {
      this.camera.position = cameraPos
    }

    // 相机看向目标
    this.camera.lookAt(targetPos)

    if (this.debugMode) {
      console.log(`📷 俯视角相机更新:`)
      console.log(`   目标位置: (${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)})`)
      console.log(`   相机位置: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`)
      console.log(`   高度: ${this.height}, 角度: ${this.angle}°`)
    }
  }
}

// 相机震动系统
class CameraShake {
  private camera: Camera3D
  private originalPosition: Vector3 | null = null
  public shakeIntensity: number = 0
  private shakeDuration: number = 0
  private shakeTimer: number = 0
  private shakeFrequency: number = 20
  private enabled: boolean = true

  constructor(camera: Camera3D) {
    this.camera = camera
  }

  shake(intensity: number, duration: number, frequency: number = 20): void {
    if (!this.enabled) return

    this.shakeIntensity = intensity
    this.shakeDuration = duration
    this.shakeTimer = 0
    this.shakeFrequency = frequency

    // 保存原始位置
    if (!this.originalPosition) {
      this.originalPosition = { ...this.camera.position }
    }

    console.log(`📳 相机震动开始: 强度=${intensity}, 持续时间=${duration}s, 频率=${frequency}Hz`)
  }

  update(delta: number): void {
    if (this.shakeTimer >= this.shakeDuration) {
      this.stopShake()
      return
    }

    if (this.shakeIntensity > 0 && this.originalPosition) {
      this.shakeTimer += delta

      // 计算震动偏移
      const progress = this.shakeTimer / this.shakeDuration
      const currentIntensity = this.shakeIntensity * (1 - progress) // 逐渐减弱

      const offsetX = (Math.random() - 0.5) * currentIntensity * 2
      const offsetY = (Math.random() - 0.5) * currentIntensity * 2
      const offsetZ = (Math.random() - 0.5) * currentIntensity * 2

      // 应用震动
      this.camera.position = {
        x: this.originalPosition.x + offsetX,
        y: this.originalPosition.y + offsetY,
        z: this.originalPosition.z + offsetZ
      }
    }
  }

  stopShake(): void {
    if (this.originalPosition) {
      this.camera.position = this.originalPosition
      this.originalPosition = null
    }
    this.shakeIntensity = 0
    this.shakeDuration = 0
    this.shakeTimer = 0
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopShake()
    }
  }
}

// 玩家移动脚本
class PlayerController extends ScriptBase {
  private speed: number = 5
  private keys: { [key: string]: boolean } = {}
  private velocity: { x: number, z: number } = { x: 0, z: 0 }
  private isAttacking: boolean = false
  private debugMode: boolean = true
  private lastPosition: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }
  private frameCount: number = 0

  _ready(): void {
    console.log('🎮 PlayerController._ready() 开始执行')
    this.print('玩家控制器准备就绪')

    // 验证节点引用
    if (!this.node) {
      console.error('❌ PlayerController: this.node 为 null!')
      return
    }

    console.log('✅ PlayerController: 节点引用正常', this.node.name)
    console.log('✅ PlayerController: 初始位置', this.node.position)

    // 保存初始位置
    this.lastPosition = { ...this.node.position }

    // 监听键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    console.log('✅ PlayerController: 键盘事件监听器已添加')

    // 初始化相机系统
    this.initializeCameraSystem()

    // 测试键盘状态
    setTimeout(() => {
      console.log('🧪 PlayerController: 键盘状态测试', this.keys)
    }, 1000)
  }

  private initializeCameraSystem(): void {
    // 等待相机初始化完成
    setTimeout(() => {
      if (camera) {
        console.log('📷 初始化相机系统...')

        // 设置相机为俯视角模式
        this.setupTopDownCamera()

        console.log('✅ 相机系统初始化完成')
      } else {
        console.warn('⚠️ 相机对象未找到，延迟初始化')
        setTimeout(() => this.initializeCameraSystem(), 500)
      }
    }, 100)
  }

  private setupTopDownCamera(): void {
    if (!camera || !this.node) return
	  camera.object3D.position.set(0, -200, -30)
	  console.log(eng,'cameracameracamera')
    // camera.object3D.lookAt(new Vector3(0, 0, 0))

    // 设置俯视角预设
    if (typeof (camera as any).setTopDownView === 'function') {
      // (camera as any).setTopDownView(200, -60)
    }

    // 设置俯视角模式控制器
    if (typeof (camera as any).setTopDownMode === 'function') {
      // (camera as any).setTopDownMode(this.node, 200)
    }

    // 确保相机激活
    camera.makeCurrent()

    console.log('📷 俯视角相机设置完成')
  }

  _process(delta: number): void {
    this.frameCount++

    // 每60帧输出一次调试信息
    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log(`🔄 PlayerController._process() 第${this.frameCount}帧`)
      console.log('   键盘状态:', Object.keys(this.keys).filter(key => this.keys[key]))
      console.log('   当前位置:', this.node?.position)
      console.log('   攻击状态:', this.isAttacking)
    }

    // 验证节点引用
    if (!this.node) {
      if (this.frameCount % 60 === 0) {
        console.error('❌ PlayerController._process: this.node 为 null!')
      }
      return
    }

    if (this.isAttacking) {
      if (this.debugMode && this.frameCount % 30 === 0) {
        console.log('⚔️ PlayerController: 攻击中，跳过移动')
      }
      return
    }

    // 计算移动方向
    let moveX = 0
    let moveZ = 0

    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      moveZ -= 1
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      moveZ += 1
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      moveX -= 1
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      moveX += 1
    }

    // 标准化移动向量
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (length > 0) {
      moveX /= length
      moveZ /= length

      // 调试输出（只在有移动时输出）
      if (this.debugMode) {
        console.log(`🏃 移动方向: (${moveX.toFixed(2)}, ${moveZ.toFixed(2)})`)
      }
    }

    // 应用移动
    const currentPos = this.node.position
    const newX = currentPos.x + moveX * this.speed * delta
    const newZ = currentPos.z + moveZ * this.speed * delta

    // 检查边界（扩大游戏区域）
    const maxDistance = 8
    const withinBounds = Math.abs(newX) <= maxDistance && Math.abs(newZ) <= maxDistance

    if (this.debugMode && length > 0) {
      console.log(`📍 位置计算:`)
      console.log(`   当前: (${currentPos.x.toFixed(2)}, ${currentPos.z.toFixed(2)})`)
      console.log(`   目标: (${newX.toFixed(2)}, ${newZ.toFixed(2)})`)
      console.log(`   边界检查: ${withinBounds ? '✅ 通过' : '❌ 超出边界'}`)
      console.log(`   移动速度: ${this.speed}, Delta: ${delta.toFixed(4)}`)
    }

    if (withinBounds) {
      // 只有在实际移动时才更新位置
      if (length > 0) {
        // 调试：位置设置前的状态
        if (this.debugMode) {
          console.log(`🎯 位置设置调试:`)
          console.log(`   设置前位置: (${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)})`)
          console.log(`   目标位置: (${newX.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${newZ.toFixed(2)})`)
          console.log(`   节点类型: ${this.node.constructor.name}`)
          console.log(`   position属性类型: ${typeof this.node.position}`)

          // 检查position属性的方法
          if (this.node.position && typeof this.node.position === 'object') {
            console.log(`   position.set方法: ${typeof this.node.position.set === 'function' ? '✅ 存在' : '❌ 不存在'}`)
            console.log(`   position.x属性: ${typeof this.node.position.x}`)
          }
        }

        // 更新位置 - 支持多种设置方式
        const targetPosition = {
          x: newX,
          y: currentPos.y,
          z: newZ
        }

        // 尝试使用Vector3Proxy的set方法
        if (this.node.position && typeof this.node.position.set === 'function') {
          this.node.position.set(targetPosition.x, targetPosition.y, targetPosition.z)
          if (this.debugMode) {
            console.log(`   ✅ 使用position.set()方法设置位置`)
          }
        } else {
          // 直接赋值
          this.node.position = targetPosition
          if (this.debugMode) {
            console.log(`   ✅ 使用直接赋值设置位置`)
          }
        }

        // 更新朝向
        const targetRotation = {
          x: 0,
          y: Math.atan2(moveX, moveZ),
          z: 0
        }

        if (this.node.rotation && typeof this.node.rotation.set === 'function') {
          this.node.rotation.set(targetRotation.x, targetRotation.y, targetRotation.z)
        } else {
          this.node.rotation = targetRotation
        }

        // 检查位置是否真的更新了
        let actualNewPos: Vector3

        // 获取实际位置 - 支持多种方式
        if (typeof this.node.position.toObject === 'function') {
          actualNewPos = this.node.position.toObject()
        } else if (typeof this.node.position.x === 'number') {
          actualNewPos = {
            x: this.node.position.x,
            y: this.node.position.y,
            z: this.node.position.z
          }
        } else {
          actualNewPos = this.node.position as Vector3
        }

        const positionChanged = Math.abs(actualNewPos.x - this.lastPosition.x) > 0.001 ||
                              Math.abs(actualNewPos.z - this.lastPosition.z) > 0.001

        if (this.debugMode) {
          console.log(`   设置后位置: (${actualNewPos.x.toFixed(2)}, ${actualNewPos.y.toFixed(2)}, ${actualNewPos.z.toFixed(2)})`)
          console.log(`   位置变化: ${positionChanged ? '✅ 成功' : '❌ 失败'}`)

          // 检查THREE.js对象的位置同步
          if (this.node.object3D && this.node.object3D.position) {
            const threePos = this.node.object3D.position
            console.log(`   THREE.js位置: (${threePos.x.toFixed(2)}, ${threePos.y.toFixed(2)}, ${threePos.z.toFixed(2)})`)

            const threeSynced = Math.abs(threePos.x - actualNewPos.x) < 0.001 &&
                               Math.abs(threePos.y - actualNewPos.y) < 0.001 &&
                               Math.abs(threePos.z - actualNewPos.z) < 0.001
            console.log(`   THREE.js同步: ${threeSynced ? '✅ 成功' : '❌ 失败'}`)
          }
        }

        if (positionChanged) {
          this.lastPosition = { ...actualNewPos }

          // 更新相机位置
          this.updateCamera()

          if (this.debugMode) {
            console.log(`✅ 玩家移动完成: (${actualNewPos.x.toFixed(2)}, ${actualNewPos.z.toFixed(2)})`)
          }
        } else if (this.debugMode) {
          console.warn('⚠️ 位置设置后没有实际改变，可能存在同步问题')
        }
      }
    } else if (this.debugMode && length > 0) {
      console.warn(`🚫 移动被边界限制: 目标位置 (${newX.toFixed(2)}, ${newZ.toFixed(2)}) 超出范围 ±${maxDistance}`)
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const wasPressed = this.keys[event.code]
    this.keys[event.code] = true

    // 只在首次按下时输出调试信息
    if (!wasPressed && this.debugMode) {
      console.log(`⌨️ 按键按下: ${event.code}`)
      console.log(`   当前按键状态:`, Object.keys(this.keys).filter(key => this.keys[key]))
    }

    // 处理攻击
    if (event.code === 'Space') {
      event.preventDefault()
      this.attack()
    }

    // 处理调试模式切换
    if (event.code === 'KeyF1') {r
      event.preventDefault()
      this.debugMode = !this.debugMode
      console.log(`🐛 调试模式: ${this.debugMode ? '开启' : '关闭'}`)
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.code] = false

    if (this.debugMode) {
      console.log(`⌨️ 按键释放: ${event.code}`)
    }
  }

  private updateCamera(): void {
    try {
      // 验证相机和节点引用
      if (!camera) {
        if (this.debugMode) {
          console.warn('⚠️ updateCamera: 全局camera变量为null')
        }
        return
      }

      if (!this.node) {
        if (this.debugMode) {
          console.warn('⚠️ updateCamera: this.node为null')
        }
        return
      }

      // 使用增强的相机跟随系统
      if (typeof (camera as any).updateFollow === 'function') {
        // 使用增强的相机系统
        (camera as any).updateFollow(1/60) // 假设60FPS

        if (this.debugMode && this.frameCount % 120 === 0) {
          const status = (camera as any).getCameraStatus()
          console.log(`📷 增强相机状态:`, status)
        }
      } else {
        // 回退到传统的相机更新方式
        this.updateCameraLegacy()
      }

    } catch (error) {
      console.error('❌ updateCamera 发生错误:', error)
      console.error('   错误堆栈:', error.stack)
    }
  }

  private updateCameraLegacy(): void {
    if (!camera || !this.node) return

    // 获取玩家位置 - 支持多种方式
    let playerPos: Vector3

    if (typeof this.node.position === 'object' && this.node.position !== null) {
      // 检查是否是Vector3Proxy对象
      if (typeof this.node.position.toObject === 'function') {
        playerPos = this.node.position.toObject()
      } else if (typeof this.node.position.x === 'number') {
        playerPos = {
          x: this.node.position.x,
          y: this.node.position.y,
          z: this.node.position.z
        }
      } else {
        console.error('❌ updateCamera: 无法解析玩家位置', this.node.position)
        return
      }
    } else {
      console.error('❌ updateCamera: 玩家位置无效', this.node.position)
      return
    }

    // 验证位置数据
    if (typeof playerPos.x !== 'number' || typeof playerPos.y !== 'number' || typeof playerPos.z !== 'number') {
      console.error('❌ updateCamera: 玩家位置数据类型错误', playerPos)
      return
    }

    // 计算相机位置
    const cameraHeight = 20
    const cameraOffset = 3
    const newCameraPos = {
      x: playerPos.x,
      y: cameraHeight,
      z: playerPos.z + cameraOffset
    }

    // 更新相机位置 - 支持多种设置方式
    if (camera.position && typeof camera.position.set === 'function') {
      // 使用Vector3Proxy的set方法
      camera.position.set(newCameraPos.x, newCameraPos.y, newCameraPos.z)
    } else {
      // 直接赋值
      camera.position = newCameraPos
    }

    // 相机看向玩家位置
    const lookAtTarget = {
      x: playerPos.x,
      y: playerPos.y,
      z: playerPos.z
    }

    // 验证lookAt方法存在并调用
    if (typeof camera.lookAt === 'function') {
      camera.lookAt(lookAtTarget)
    }

    // 检查相机是否为当前活动相机
    if (!camera.current && typeof camera.makeCurrent === 'function') {
      camera.makeCurrent()
    }
  }

  // 保持原有的move方法以兼容按钮控制
  move(direction: string): void {
    if (this.isAttacking) return

    const currentPos = this.node.position
    const moveDistance = 1

    switch (direction) {
      case 'forward':
        if (Math.abs(currentPos.z - moveDistance) <= 8) {
          this.node.position = { ...currentPos, z: currentPos.z - moveDistance }
        }
        break
      case 'backward':
        if (Math.abs(currentPos.z + moveDistance) <= 8) {
          this.node.position = { ...currentPos, z: currentPos.z + moveDistance }
        }
        break
      case 'left':
        if (Math.abs(currentPos.x - moveDistance) <= 8) {
          this.node.position = { ...currentPos, x: currentPos.x - moveDistance }
        }
        break
      case 'right':
        if (Math.abs(currentPos.x + moveDistance) <= 8) {
          this.node.position = { ...currentPos, x: currentPos.x + moveDistance }
        }
        break
    }

    this.updateCamera()
  }

  // 测试方法
  testMovement(): void {
    console.log('🧪 测试玩家移动系统...')
    console.log('   节点引用:', this.node ? '✅ 正常' : '❌ 为null')
    console.log('   当前位置:', this.node?.position)
    console.log('   键盘状态:', this.keys)
    console.log('   攻击状态:', this.isAttacking)
    console.log('   移动速度:', this.speed)

    // 手动移动测试
    if (this.node) {
      const testPos = {
        x: this.node.position.x + 1,
        y: this.node.position.y,
        z: this.node.position.z
      }

      console.log('🧪 尝试手动移动到:', testPos)
      this.node.position = testPos

      setTimeout(() => {
        console.log('🧪 移动后位置:', this.node?.position)
        this.updateCamera()
      }, 100)
    }
  }

  toggleDebugMode(): void {
    this.debugMode = !this.debugMode
    console.log(`🐛 调试模式: ${this.debugMode ? '开启' : '关闭'}`)
  }

  _exit_tree(): void {
    console.log('🧹 PlayerController 清理中...')

    // 清理事件监听器
    document.removeEventListener('keydown', this.onKeyDown.bind(this))
    document.removeEventListener('keyup', this.onKeyUp.bind(this))

    console.log('✅ PlayerController 清理完成')
  }

  attack(): void {
    if (this.isAttacking) return

    this.isAttacking = true

    // 攻击动画
    const animPlayer = this.node.findChild('AnimationPlayer') as AnimationPlayer
    if (animPlayer) {
      animPlayer.play('attack', 1)
      setTimeout(() => {
        animPlayer.play('idle', 1)
        this.isAttacking = false
      }, 800)
    } else {
      // 如果没有动画播放器，直接结束攻击状态
      setTimeout(() => {
        this.isAttacking = false
      }, 300)
    }

    // 检查攻击范围内的敌人
    this.checkAttackRange()
  }

  private checkAttackRange(): void {
    const playerPos = this.node.position
    // 这里简化处理，实际游戏中会有碰撞检测
    console.log('玩家攻击！位置:', playerPos)
  }
}

// 敌人AI脚本
class EnemyAI extends ScriptBase {
  private speed: number = 1
  private health: number = 30

  _ready(): void {
    this.print('敌人AI准备就绪')
  }

  _process(delta: number): void {
    // 简单的AI：向玩家移动
    if (player) {
      const enemyPos = this.node.position
      const playerPos = player.position

      const distance = Math.sqrt(
        Math.pow(playerPos.x - enemyPos.x, 2) +
        Math.pow(playerPos.z - enemyPos.z, 2)
      )

      if (distance > 0.5 && distance < 3) {
        const direction = {
          x: (playerPos.x - enemyPos.x) / distance,
          z: (playerPos.z - enemyPos.z) / distance
        }

        this.node.position = {
          x: enemyPos.x + direction.x * this.speed * delta,
          y: enemyPos.y,
          z: enemyPos.z + direction.z * this.speed * delta
        }
      }
    }
  }

  takeDamage(damage: number): void {
    this.health -= damage
    if (this.health <= 0) {
      this.node.destroy()
      score.value += 10
    }
  }
}

// 初始化小地图
function initMinimap(): void {
  minimapCells.value = []
  // 扩大小地图以匹配新的游戏区域 (17x17 网格，对应 -8 到 +8 的游戏区域)
  for (let i = 0; i < 17 * 17; i++) {
    const x = i % 17 - 8
    const z = Math.floor(i / 17) - 8

    let type = 'empty'
    if (Math.abs(x) === 8 || Math.abs(z) === 8) {
      type = 'wall'
    } else if (Math.random() < 0.08) {
      type = 'enemy'
    } else if (Math.random() < 0.04) {
      type = 'item'
    }

    minimapCells.value.push({
      type,
      hasPlayer: x === 0 && z === 0
    })
  }
}

// 更新小地图
function updateMinimap(): void {
  if (!player) return

  const playerPos = player.position
  const gridX = Math.round(playerPos.x) + 8
  const gridZ = Math.round(playerPos.z) + 8

  minimapCells.value.forEach((cell, index) => {
    const x = index % 17
    const z = Math.floor(index / 17)
    cell.hasPlayer = x === gridX && z === gridZ
  })
}

// 开始游戏
async function startGame(): Promise<void> {
  if (!gameCanvas.value) return

  try {
    console.log('🎮 启动3D肉鸽游戏...')

    const engine = Engine.getInstance()

    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      enableShadows: true,
      shadowMapSize: 1024,
      backgroundColor: 0x2c3e50
    })

    // 注册脚本
    const scriptManager = ScriptManager.getInstance()
    scriptManager.registerScriptClass('PlayerController', PlayerController)
    scriptManager.registerScriptClass('EnemyAI', EnemyAI)

    // 创建场景
    const scene = new Scene('Roguelike3D', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })

    const root = new Node3D('Root')
    scene.addChild(root)

    // 创建增强的相机系统
    console.log('📷 创建增强的Camera3D系统...')
    camera = new Camera3D('MainCamera')

    // 添加相机增强功能
    enhanceCamera3D(camera)

    // 设置初始俯视角
    camera.position = { x: 0, y: 20, z: 3 }
    camera.lookAt({ x: 0, y: 0, z: 0 })
    camera.setPerspective(60, 0.1, 100)

    // 激活相机并验证
    camera.makeCurrent()

    // 验证相机激活状态
    setTimeout(() => {
      console.log('📷 相机激活验证:')
      console.log('   相机对象:', camera ? '✅ 存在' : '❌ 不存在')
      console.log('   激活状态:', camera?.current ? '✅ 激活' : '❌ 未激活')
      console.log('   位置:', camera?.position)

      // 检查THREE.js相机同步
      if (camera?._perspectiveCamera) {
        const threeCamera = camera._perspectiveCamera
        console.log('   THREE.js相机位置:', `(${threeCamera.position.x.toFixed(2)}, ${threeCamera.position.y.toFixed(2)}, ${threeCamera.position.z.toFixed(2)})`)
      }
    }, 200)

    root.addChild(camera)
    console.log('✅ 增强的Camera3D系统创建完成')
    // 创建光照
    const light = new DirectionalLight3D('SunLight')
    light.position = { x: 5, y: 15, z: 5 }
    light.setTarget({ x: 0, y: 0, z: 0 })
    // 修复setColor调用 - 使用十六进制颜色值
    light.setColor(0xfff4e6)
    light.setIntensity(1.2)
    light.enableShadows(true)
    light.setShadowCamera(0.1, 50, 25)
    root.addChild(light)

    // 创建地面（扩大游戏区域）
    const ground = new MeshInstance3D('Ground')
    ground.createPlaneMesh({ x: 20, y: 20 })
    ground.position = { x: 0, y: 0, z: 0 }
    ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
    ground.receiveShadow = true

    const groundMat = ground.createMaterial(MaterialType.STANDARD, {
      color: 0x2c3e50,
      roughness: 0.8,
      metalness: 0.1
    })
    ground.materials = [groundMat]
    root.addChild(ground)

    // 创建玩家
    console.log('🎮 开始创建玩家节点...')
    player = new MeshInstance3D('Player')
    player.position = { x: 0, y: 0.5, z: 0 }
    player.castShadow = true
    player.receiveShadow = true

    console.log('✅ 玩家节点创建完成:', player.name)
    console.log('   初始位置:', player.position)

    try {
      await player.loadModel('/saien.glb')
      console.log('✅ 玩家模型加载成功')

      // 创建动画播放器
      const animPlayer = new AnimationPlayer('AnimationPlayer')
      player.addChild(animPlayer)

      // 设置动画（假设模型有动画）
      // animPlayer.addAnimation('idle', idleAnim)
      // animPlayer.addAnimation('walk', walkAnim)
      // animPlayer.addAnimation('attack', attackAnim)
      // animPlayer.play('idle')

    } catch (error) {
      console.warn('⚠️ 玩家模型加载失败，使用默认立方体:', error)
      player.createBoxMesh({ x: 0.5, y: 1, z: 0.5 })

      const playerMat = player.createMaterial(MaterialType.STANDARD, {
        color: 0x3498db,
        roughness: 0.3,
        metalness: 0.7
      })
      player.materials = [playerMat]
      console.log('✅ 默认玩家立方体创建完成')
    }

    // 附加脚本前的验证
    console.log('🔧 准备附加PlayerController脚本...')
    console.log('   玩家节点状态:', player ? '✅ 存在' : '❌ 不存在')
    console.log('   玩家节点名称:', player?.name)

    try {
      player.attachScript('PlayerController')
      console.log('✅ PlayerController脚本附加成功')

      // 验证脚本是否正确附加
      setTimeout(() => {
        const script = player?.getScript('PlayerController')
        console.log('🔍 脚本验证:', script ? '✅ 脚本存在' : '❌ 脚本不存在')
        if (script) {
          console.log('   脚本类型:', script.constructor.name)
          // 测试脚本方法
          if (typeof script.testMovement === 'function') {
            console.log('✅ 脚本方法可用')
          }
        }
      }, 500)

    } catch (error) {
      console.error('❌ PlayerController脚本附加失败:', error)
    }

    root.addChild(player)
    console.log('✅ 玩家节点已添加到场景')

    // 验证全局引用
    console.log('🔍 全局引用验证:')
    console.log('   player变量:', player ? '✅ 已设置' : '❌ 未设置')
    console.log('   camera变量:', camera ? '✅ 已设置' : '❌ 未设置')

    // 创建敌人和道具
    createEnemies(root)
    createCollectibles(root)

    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()
    engine.switchTo3D()
    engine.startRendering()
    await engine.startPlayMode()

    // 初始化小地图
    initMinimap()

    gameStarted.value = true
    console.log('🎉 3D肉鸽游戏启动成功！')

  } catch (error) {
    console.error('❌ 游戏启动失败:', error)
  }
}

// 创建敌人
function createEnemies(root: Node3D): void {
  for (let i = 0; i < 8; i++) {
    // 在更大的区域内生成敌人
    const x = (Math.random() - 0.5) * 14
    const z = (Math.random() - 0.5) * 14

    const enemy = new MeshInstance3D(`Enemy_${i}`)
    enemy.position = { x, y: 0.5, z }
    enemy.castShadow = true

    // 创建敌人模型（红色立方体）
    enemy.createBoxMesh({ x: 0.4, y: 0.8, z: 0.4 })

    const enemyMat = enemy.createMaterial(MaterialType.STANDARD, {
      color: 0xe74c3c,
      roughness: 0.5,
      metalness: 0.3
    })
    enemy.materials = [enemyMat]
    enemy.attachScript('EnemyAI')

    enemies.push(enemy)
    root.addChild(enemy)
  }
}

// 创建可收集物品
function createCollectibles(root: Node3D): void {
  for (let i = 0; i < 6; i++) {
    // 在更大的区域内生成道具
    const x = (Math.random() - 0.5) * 12
    const z = (Math.random() - 0.5) * 12

    const collectible = new MeshInstance3D(`Item_${i}`)
    collectible.position = { x, y: 0.3, z }

    collectible.createSphereMesh(0.2, 16)

    const itemMat = collectible.createMaterial(MaterialType.STANDARD, {
      color: 0xf1c40f,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xf1c40f,
      emissiveIntensity: 0.5
    })
    collectible.materials = [itemMat]

    collectibles.push(collectible)
    root.addChild(collectible)
  }
}

// 游戏控制函数
function movePlayer(direction: string): void {
  if (!player) return

  console.log(`移动玩家: ${direction}`)

  const controller = player.getScript('PlayerController') as PlayerController
  if (controller) {
    controller.move(direction)
    updateMinimap()
  } else {
    // 如果脚本控制器不可用，直接移动玩家
    const currentPos = player.position
    const moveDistance = 1
    let newPos = { ...currentPos }

    switch (direction) {
      case 'forward':
        newPos.z -= moveDistance
        break
      case 'backward':
        newPos.z += moveDistance
        break
      case 'left':
        newPos.x -= moveDistance
        break
      case 'right':
        newPos.x += moveDistance
        break
    }

    // 检查边界
    if (Math.abs(newPos.x) <= 8 && Math.abs(newPos.z) <= 8) {
      player.position = newPos
      updateMinimap()

      // 手动更新相机
      updateCameraManually()

      console.log(`玩家移动到: (${newPos.x}, ${newPos.z})`)
    }
  }
}

// 手动更新相机的函数
function updateCameraManually(): void {
  if (!player || !camera) return

  const playerPos = player.position
  camera.position = {
    x: playerPos.x,
    y: 20,
    z: playerPos.z + 3
  }

  camera.lookAt({
    x: playerPos.x,
    y: playerPos.y,
    z: playerPos.z
  })

  console.log(`相机更新到: (${playerPos.x}, 20, ${playerPos.z + 3})`)
}

function attack(): void {
  if (!player) return

  const controller = player.getScript('PlayerController') as PlayerController
  if (controller) {
    controller.attack()
  }
}

function switchAnimation(): void {
  // 切换动画状态
  const animations = ['idle', 'walk', 'run', 'jump']
  const currentIndex = animations.indexOf(currentAnimation.value)
  const nextIndex = (currentIndex + 1) % animations.length
  currentAnimation.value = animations[nextIndex]

  console.log('切换到动画:', currentAnimation.value)
}

// 测试相机更新
function testCameraUpdate(): void {
  console.log('🧪 测试相机更新...')

  if (!player) {
    console.error('玩家对象不存在')
    return
  }

  if (!camera) {
    console.error('相机对象不存在')
    return
  }

  console.log('当前玩家位置:', player.position)

  const playerPos = player.position

  // 设置真正的俯视角
  camera.position = {
    x: playerPos.x,
    y: 25, // 更高的高度
    z: playerPos.z + 2 // 稍微偏后
  }

  // 相机看向玩家
  camera.lookAt({
    x: playerPos.x,
    y: playerPos.y,
    z: playerPos.z
  })

  console.log('✅ 相机已更新到俯视角')
  console.log('相机位置:', camera.position)
}

// 测试玩家移动系统
function testPlayerMovement(): void {
  console.log('🧪 测试玩家移动系统...')

  if (!player) {
    console.error('❌ 玩家对象不存在')
    return
  }

  const script = player.getScript('PlayerController') as PlayerController
  if (!script) {
    console.error('❌ PlayerController脚本不存在')
    return
  }

  if (typeof script.testMovement === 'function') {
    script.testMovement()
  } else {
    console.error('❌ testMovement方法不存在')
  }
}

// 切换玩家调试模式
function togglePlayerDebug(): void {
  console.log('🐛 切换玩家调试模式...')

  if (!player) {
    console.error('❌ 玩家对象不存在')
    return
  }

  const script = player.getScript('PlayerController') as PlayerController
  if (!script) {
    console.error('❌ PlayerController脚本不存在')
    return
  }

  if (typeof script.toggleDebugMode === 'function') {
    script.toggleDebugMode()
  } else {
    console.error('❌ toggleDebugMode方法不存在')
  }
}

// 强制移动玩家
function forcePlayerMove(): void {
  console.log('🧪 强制移动玩家...')

  if (!player) {
    console.error('❌ 玩家对象不存在')
    return
  }

  const currentPos = player.position
  const newPos = {
    x: currentPos.x + (Math.random() - 0.5) * 2,
    y: currentPos.y,
    z: currentPos.z + (Math.random() - 0.5) * 2
  }

  console.log('当前位置:', currentPos)
  console.log('目标位置:', newPos)

  player.position = newPos

  setTimeout(() => {
    console.log('移动后位置:', player?.position)
    updateCameraManually()
    updateMinimap()
  }, 100)
}

// 检查系统状态
function checkSystemStatus(): void {
  console.log('🔍 系统状态检查...')
  console.log('==========================================')

  // 检查全局变量
  console.log('📋 全局变量状态:')
  console.log('   player:', player ? `✅ ${player.name}` : '❌ null')
  console.log('   camera:', camera ? `✅ ${camera.name}` : '❌ null')
  console.log('   enemies:', enemies.length, '个')
  console.log('   collectibles:', collectibles.length, '个')

  // 检查玩家状态
  if (player) {
    console.log('🎮 玩家状态:')
    console.log('   位置:', player.position)
    console.log('   旋转:', player.rotation)
    console.log('   可见:', player.visible)

    // 检查位置属性的详细信息
    if (player.position) {
      console.log('   位置属性详情:')
      console.log('     类型:', typeof player.position)
      console.log('     构造函数:', player.position.constructor?.name)
      console.log('     x值:', player.position.x, typeof player.position.x)
      console.log('     y值:', player.position.y, typeof player.position.y)
      console.log('     z值:', player.position.z, typeof player.position.z)
      console.log('     set方法:', typeof player.position.set === 'function' ? '✅' : '❌')
      console.log('     toObject方法:', typeof player.position.toObject === 'function' ? '✅' : '❌')
    }

    // 检查THREE.js对象同步
    if (player.object3D) {
      console.log('   THREE.js对象:')
      console.log('     存在:', player.object3D ? '✅' : '❌')
      console.log('     类型:', player.object3D.constructor?.name)
      if (player.object3D.position) {
        const threePos = player.object3D.position
        console.log('     THREE位置:', `(${threePos.x.toFixed(2)}, ${threePos.y.toFixed(2)}, ${threePos.z.toFixed(2)})`)

        // 检查同步状态
        const nodePos = player.position
        if (nodePos && typeof nodePos.x === 'number') {
          const synced = Math.abs(threePos.x - nodePos.x) < 0.001 &&
                        Math.abs(threePos.y - nodePos.y) < 0.001 &&
                        Math.abs(threePos.z - nodePos.z) < 0.001
          console.log('     位置同步:', synced ? '✅ 同步' : '❌ 不同步')
        }
      }
    }

    const script = player.getScript('PlayerController')
    console.log('   脚本:', script ? `✅ ${script.constructor.name}` : '❌ 无脚本')

    if (script) {
      console.log('   脚本方法:')
      console.log('     _ready:', typeof script._ready === 'function' ? '✅' : '❌')
      console.log('     _process:', typeof script._process === 'function' ? '✅' : '❌')
      console.log('     testMovement:', typeof script.testMovement === 'function' ? '✅' : '❌')
    }
  }

  // 检查相机状态
  if (camera) {
    console.log('📷 相机状态:')
    console.log('   位置:', camera.position)
    console.log('   lookAt方法:', typeof camera.lookAt === 'function' ? '✅' : '❌')
    console.log('   当前相机:', camera.current ? '✅ 激活' : '❌ 未激活')
    console.log('   makeCurrent方法:', typeof camera.makeCurrent === 'function' ? '✅' : '❌')

    // 检查相机位置属性详情
    if (camera.position) {
      console.log('   相机位置详情:')
      console.log('     类型:', typeof camera.position)
      console.log('     构造函数:', camera.position.constructor?.name)
      console.log('     x值:', camera.position.x, typeof camera.position.x)
      console.log('     y值:', camera.position.y, typeof camera.position.y)
      console.log('     z值:', camera.position.z, typeof camera.position.z)
      console.log('     set方法:', typeof camera.position.set === 'function' ? '✅' : '❌')
    }

    // 检查THREE.js相机对象
    if (camera._perspectiveCamera || camera._orthographicCamera) {
      const threeCamera = camera._perspectiveCamera || camera._orthographicCamera
      console.log('   THREE.js相机:')
      console.log('     存在:', threeCamera ? '✅' : '❌')
      console.log('     类型:', threeCamera?.constructor?.name)
      if (threeCamera && threeCamera.position) {
        const threeCamPos = threeCamera.position
        console.log('     THREE相机位置:', `(${threeCamPos.x.toFixed(2)}, ${threeCamPos.y.toFixed(2)}, ${threeCamPos.z.toFixed(2)})`)

        // 检查同步状态
        const nodePos = camera.position
        if (nodePos && typeof nodePos.x === 'number') {
          const synced = Math.abs(threeCamPos.x - nodePos.x) < 0.001 &&
                        Math.abs(threeCamPos.y - nodePos.y) < 0.001 &&
                        Math.abs(threeCamPos.z - nodePos.z) < 0.001
          console.log('     相机位置同步:', synced ? '✅ 同步' : '❌ 不同步')
        }
      }
    }
  }

  // 检查引擎状态
  try {
    const engine = Engine.getInstance()
    console.log('🔧 引擎状态:')
    console.log('   初始化:', engine.isInitialized() ? '✅' : '❌')
    console.log('   渲染中:', engine.isRendering() ? '✅' : '❌')
    console.log('   当前场景:', engine.getCurrentScene()?.name || '❌ 无场景')
  } catch (error) {
    console.error('❌ 引擎状态检查失败:', error)
  }

  console.log('==========================================')
}

// 测试位置映射
function testPositionMapping(): void {
  console.log('🧪 测试Node位置属性映射...')
  console.log('==========================================')

  if (!player) {
    console.error('❌ 玩家对象不存在')
    return
  }

  console.log('📍 位置映射测试开始')

  // 记录初始状态
  const initialPos = player.position
  console.log('初始位置:', initialPos)
  console.log('初始位置类型:', typeof initialPos)
  console.log('初始位置构造函数:', initialPos?.constructor?.name)

  if (player.object3D && player.object3D.position) {
    const initialThreePos = player.object3D.position
    console.log('初始THREE.js位置:', `(${initialThreePos.x}, ${initialThreePos.y}, ${initialThreePos.z})`)
  }

  // 测试1: 直接赋值
  console.log('\n🧪 测试1: 直接赋值 {x, y, z}')
  const testPos1 = { x: 5, y: 1, z: 3 }
  console.log('设置位置:', testPos1)

  player.position = testPos1

  setTimeout(() => {
    const newPos1 = player.position
    console.log('设置后位置:', newPos1)
    console.log('位置是否改变:',
      Math.abs(newPos1.x - testPos1.x) < 0.001 &&
      Math.abs(newPos1.y - testPos1.y) < 0.001 &&
      Math.abs(newPos1.z - testPos1.z) < 0.001 ? '✅ 成功' : '❌ 失败')

    if (player.object3D && player.object3D.position) {
      const threePos1 = player.object3D.position
      console.log('THREE.js位置:', `(${threePos1.x}, ${threePos1.y}, ${threePos1.z})`)
      console.log('THREE.js同步:',
        Math.abs(threePos1.x - testPos1.x) < 0.001 &&
        Math.abs(threePos1.y - testPos1.y) < 0.001 &&
        Math.abs(threePos1.z - testPos1.z) < 0.001 ? '✅ 同步' : '❌ 不同步')
    }

    // 测试2: 使用set方法（如果存在）
    console.log('\n🧪 测试2: 使用position.set()方法')
    if (player.position && typeof player.position.set === 'function') {
      const testPos2 = { x: -2, y: 1, z: -4 }
      console.log('设置位置:', testPos2)

      player.position.set(testPos2.x, testPos2.y, testPos2.z)

      setTimeout(() => {
        const newPos2 = player.position
        console.log('设置后位置:', newPos2)
        console.log('位置是否改变:',
          Math.abs(newPos2.x - testPos2.x) < 0.001 &&
          Math.abs(newPos2.y - testPos2.y) < 0.001 &&
          Math.abs(newPos2.z - testPos2.z) < 0.001 ? '✅ 成功' : '❌ 失败')

        if (player.object3D && player.object3D.position) {
          const threePos2 = player.object3D.position
          console.log('THREE.js位置:', `(${threePos2.x}, ${threePos2.y}, ${threePos2.z})`)
          console.log('THREE.js同步:',
            Math.abs(threePos2.x - testPos2.x) < 0.001 &&
            Math.abs(threePos2.y - testPos2.y) < 0.001 &&
            Math.abs(threePos2.z - testPos2.z) < 0.001 ? '✅ 同步' : '❌ 不同步')
        }

        // 恢复初始位置
        setTimeout(() => {
          player.position = { x: 0, y: 0.5, z: 0 }
          console.log('\n✅ 位置已恢复到初始状态')
          updateCameraManually()
          updateMinimap()
        }, 500)

      }, 100)
    } else {
      console.log('❌ position.set()方法不存在')

      // 恢复初始位置
      setTimeout(() => {
        player.position = { x: 0, y: 0.5, z: 0 }
        console.log('\n✅ 位置已恢复到初始状态')
        updateCameraManually()
        updateMinimap()
      }, 500)
    }

  }, 100)

  console.log('==========================================')
}

// 测试相机映射
function testCameraMapping(): void {
  console.log('🧪 测试Camera3D节点到引擎相机的映射...')
  console.log('==========================================')

  if (!camera) {
    console.error('❌ 相机对象不存在')
    return
  }

  console.log('📷 相机映射测试开始')

  // 记录初始状态
  const initialCamPos = camera.position
  console.log('初始相机位置:', initialCamPos)
  console.log('初始相机位置类型:', typeof initialCamPos)
  console.log('相机当前状态:', camera.current ? '✅ 激活' : '❌ 未激活')

  // 检查THREE.js相机对象
  const threeCamera = camera._perspectiveCamera || camera._orthographicCamera
  if (threeCamera && threeCamera.position) {
    const initialThreeCamPos = threeCamera.position
    console.log('初始THREE.js相机位置:', `(${initialThreeCamPos.x}, ${initialThreeCamPos.y}, ${initialThreeCamPos.z})`)
  }

  // 测试1: 设置相机位置
  console.log('\n🧪 测试1: 设置相机位置')
  const testCamPos1 = { x: 10, y: 25, z: 15 }
  console.log('设置相机位置:', testCamPos1)

  if (camera.position && typeof camera.position.set === 'function') {
    camera.position.set(testCamPos1.x, testCamPos1.y, testCamPos1.z)
    console.log('使用position.set()方法')
  } else {
    camera.position = testCamPos1
    console.log('使用直接赋值')
  }

  setTimeout(() => {
    const newCamPos1 = camera.position
    console.log('设置后相机位置:', newCamPos1)
    console.log('相机位置是否改变:',
      Math.abs(newCamPos1.x - testCamPos1.x) < 0.001 &&
      Math.abs(newCamPos1.y - testCamPos1.y) < 0.001 &&
      Math.abs(newCamPos1.z - testCamPos1.z) < 0.001 ? '✅ 成功' : '❌ 失败')

    if (threeCamera && threeCamera.position) {
      const threeCamPos1 = threeCamera.position
      console.log('THREE.js相机位置:', `(${threeCamPos1.x}, ${threeCamPos1.y}, ${threeCamPos1.z})`)
      console.log('THREE.js相机同步:',
        Math.abs(threeCamPos1.x - testCamPos1.x) < 0.001 &&
        Math.abs(threeCamPos1.y - testCamPos1.y) < 0.001 &&
        Math.abs(threeCamPos1.z - testCamPos1.z) < 0.001 ? '✅ 同步' : '❌ 不同步')
    }

    // 测试2: lookAt功能
    console.log('\n🧪 测试2: lookAt功能')
    const lookAtTarget = { x: 0, y: 0, z: 0 }
    console.log('lookAt目标:', lookAtTarget)

    if (typeof camera.lookAt === 'function') {
      camera.lookAt(lookAtTarget)
      console.log('✅ lookAt方法调用成功')

      // 检查THREE.js相机的朝向是否更新
      if (threeCamera) {
        console.log('THREE.js相机朝向已更新')
        // 这里可以检查相机的rotation或者matrix，但比较复杂
      }
    } else {
      console.log('❌ lookAt方法不存在')
    }

    // 测试3: makeCurrent功能
    console.log('\n🧪 测试3: makeCurrent功能')
    if (typeof camera.makeCurrent === 'function') {
      camera.makeCurrent()
      console.log('✅ makeCurrent方法调用成功')
      console.log('相机激活状态:', camera.current ? '✅ 激活' : '❌ 未激活')
    } else {
      console.log('❌ makeCurrent方法不存在')
    }

    // 恢复初始状态
    setTimeout(() => {
      if (player) {
        const playerPos = player.position
        camera.position = {
          x: playerPos.x,
          y: 20,
          z: playerPos.z + 3
        }
        camera.lookAt({
          x: playerPos.x,
          y: playerPos.y,
          z: playerPos.z
        })
        console.log('\n✅ 相机已恢复到跟随状态')
      }
    }, 1000)

  }, 100)

  console.log('==========================================')
}

// 测试位置API增强
function testPositionAPI(): void {
  console.log('🧪 测试Position属性API增强...')
  console.log('==========================================')

  if (!player) {
    console.error('❌ 玩家对象不存在')
    return
  }

  console.log('🔧 Position API测试开始')

  // 测试1: 检查支持的设置方式
  console.log('\n🧪 测试1: 检查支持的API')
  console.log('position属性类型:', typeof player.position)
  console.log('position构造函数:', player.position?.constructor?.name)

  const supportedAPIs = {
    'directAssignment': true, // node.position = {x, y, z}
    'setMethod': typeof player.position?.set === 'function', // node.position.set(x, y, z)
    'componentAccess': typeof player.position?.x === 'number', // node.position.x
    'toObjectMethod': typeof player.position?.toObject === 'function' // node.position.toObject()
  }

  console.log('支持的API:')
  Object.entries(supportedAPIs).forEach(([api, supported]) => {
    console.log(`   ${api}: ${supported ? '✅' : '❌'}`)
  })

  // 测试2: 直接赋值 {x, y, z}
  console.log('\n🧪 测试2: 直接赋值 node.position = {x, y, z}')
  const testPos1 = { x: 1, y: 1, z: 1 }
  player.position = testPos1

  setTimeout(() => {
    const result1 = player.position
    console.log('设置结果:', result1)
    console.log('设置成功:',
      Math.abs(result1.x - testPos1.x) < 0.001 &&
      Math.abs(result1.y - testPos1.y) < 0.001 &&
      Math.abs(result1.z - testPos1.z) < 0.001 ? '✅' : '❌')

    // 测试3: set方法（如果支持）
    if (supportedAPIs.setMethod) {
      console.log('\n🧪 测试3: node.position.set(x, y, z)')
      const testPos2 = { x: 2, y: 1, z: 2 }
      player.position.set(testPos2.x, testPos2.y, testPos2.z)

      setTimeout(() => {
        const result2 = player.position
        console.log('设置结果:', result2)
        console.log('设置成功:',
          Math.abs(result2.x - testPos2.x) < 0.001 &&
          Math.abs(result2.y - testPos2.y) < 0.001 &&
          Math.abs(result2.z - testPos2.z) < 0.001 ? '✅' : '❌')

        // 测试4: 单独设置分量（如果支持）
        if (supportedAPIs.componentAccess) {
          console.log('\n🧪 测试4: 单独设置分量 node.position.x = value')
          const originalPos = { ...player.position }

          try {
            player.position.x = 3
            player.position.z = 3

            setTimeout(() => {
              const result3 = player.position
              console.log('设置结果:', result3)
              console.log('X分量设置成功:', Math.abs(result3.x - 3) < 0.001 ? '✅' : '❌')
              console.log('Z分量设置成功:', Math.abs(result3.z - 3) < 0.001 ? '✅' : '❌')
              console.log('Y分量保持不变:', Math.abs(result3.y - originalPos.y) < 0.001 ? '✅' : '❌')

              // 恢复初始位置
              setTimeout(() => {
                player.position = { x: 0, y: 0.5, z: 0 }
                console.log('\n✅ 位置已恢复到初始状态')
                updateCameraManually()
                updateMinimap()
              }, 500)

            }, 100)
          } catch (error) {
            console.error('❌ 单独设置分量失败:', error)
            // 恢复初始位置
            player.position = { x: 0, y: 0.5, z: 0 }
          }
        } else {
          console.log('\n❌ 不支持单独设置分量')
          // 恢复初始位置
          setTimeout(() => {
            player.position = { x: 0, y: 0.5, z: 0 }
            console.log('\n✅ 位置已恢复到初始状态')
            updateCameraManually()
            updateMinimap()
          }, 500)
        }

      }, 100)
    } else {
      console.log('\n❌ 不支持position.set()方法')
      // 恢复初始位置
      setTimeout(() => {
        player.position = { x: 0, y: 0.5, z: 0 }
        console.log('\n✅ 位置已恢复到初始状态')
        updateCameraManually()
        updateMinimap()
      }, 500)
    }

  }, 100)

  console.log('==========================================')
}

// 同步测试
function syncTest(): void {
  console.log('🧪 测试Node到THREE.js的实时同步...')
  console.log('==========================================')

  if (!player || !camera) {
    console.error('❌ 玩家或相机对象不存在')
    return
  }

  console.log('🔄 实时同步测试开始')

  let testCount = 0
  const maxTests = 5

  const syncTestInterval = setInterval(() => {
    testCount++
    console.log(`\n🧪 同步测试 ${testCount}/${maxTests}`)

    // 随机位置
    const randomPos = {
      x: (Math.random() - 0.5) * 10,
      y: 0.5,
      z: (Math.random() - 0.5) * 10
    }

    console.log('设置玩家位置:', randomPos)
    player.position = randomPos

    // 检查同步延迟
    setTimeout(() => {
      const nodePos = player.position
      console.log('Node位置:', nodePos)

      if (player.object3D && player.object3D.position) {
        const threePos = player.object3D.position
        console.log('THREE.js位置:', `(${threePos.x.toFixed(2)}, ${threePos.y.toFixed(2)}, ${threePos.z.toFixed(2)})`)

        const synced = Math.abs(threePos.x - randomPos.x) < 0.001 &&
                      Math.abs(threePos.y - randomPos.y) < 0.001 &&
                      Math.abs(threePos.z - randomPos.z) < 0.001

        console.log('同步状态:', synced ? '✅ 同步' : '❌ 不同步')

        if (!synced) {
          console.log('同步差异:')
          console.log(`   X: ${Math.abs(threePos.x - randomPos.x).toFixed(4)}`)
          console.log(`   Y: ${Math.abs(threePos.y - randomPos.y).toFixed(4)}`)
          console.log(`   Z: ${Math.abs(threePos.z - randomPos.z).toFixed(4)}`)
        }
      }

      // 更新相机跟随
      updateCameraManually()

    }, 50) // 50ms延迟检查同步

    if (testCount >= maxTests) {
      clearInterval(syncTestInterval)

      // 恢复初始状态
      setTimeout(() => {
        player.position = { x: 0, y: 0.5, z: 0 }
        updateCameraManually()
        updateMinimap()
        console.log('\n✅ 同步测试完成，位置已恢复')
        console.log('==========================================')
      }, 1000)
    }

  }, 1500) // 每1.5秒一次测试
}

// 相机震动测试
function testCameraShake(): void {
  console.log('🧪 测试相机震动系统...')

  if (!camera) {
    console.error('❌ 相机对象不存在')
    return
  }

  if (typeof (camera as any).shake === 'function') {
    console.log('📳 开始相机震动测试')

    // 轻微震动
    (camera as any).shake(0.5, 1.0, 15)

    setTimeout(() => {
      // 中等震动
      (camera as any).shake(1.0, 1.5, 20)

      setTimeout(() => {
        // 强烈震动
        (camera as any).shake(2.0, 2.0, 25)

        setTimeout(() => {
          console.log('✅ 相机震动测试完成')
        }, 2500)
      }, 2000)
    }, 1500)
  } else {
    console.error('❌ 相机震动功能不可用')
  }
}

// 切换到第三人称视角
function switchToThirdPerson(): void {
  console.log('🧪 切换到第三人称视角...')

  if (!camera || !player) {
    console.error('❌ 相机或玩家对象不存在')
    return
  }

  if (typeof (camera as any).setThirdPersonMode === 'function') {
    (camera as any).setThirdPersonMode(player, 8, 5)
    console.log('✅ 已切换到第三人称视角')

    // 测试第三人称控制
    setTimeout(() => {
      if (cameraController && cameraController instanceof ThirdPersonCamera) {
        console.log('🧪 测试第三人称控制...')

        // 围绕玩家旋转
        let angle = 0
        const rotateInterval = setInterval(() => {
          angle += 30
          cameraController.rotateAround(30)

          if (angle >= 360) {
            clearInterval(rotateInterval)
            console.log('✅ 第三人称旋转测试完成')
          }
        }, 500)
      }
    }, 1000)
  } else {
    console.error('❌ 第三人称模式不可用')
  }
}

// 切换到俯视角
function switchToTopDown(): void {
  console.log('🧪 切换到俯视角...')

  if (!camera || !player) {
    console.error('❌ 相机或玩家对象不存在')
    return
  }

  if (typeof (camera as any).setTopDownMode === 'function') {
    (camera as any).setTopDownMode(player, 20)
    console.log('✅ 已切换到俯视角')

    // 测试高度调节
    setTimeout(() => {
      if (cameraController && cameraController instanceof TopDownCamera) {
        console.log('🧪 测试俯视角高度调节...')

        let height = 20
        const heightInterval = setInterval(() => {
          height += 5
          cameraController.setHeight(height)
          console.log(`📷 相机高度: ${height}`)

          if (height >= 35) {
            clearInterval(heightInterval)

            // 恢复默认高度
            setTimeout(() => {
              cameraController.setHeight(20)
              console.log('✅ 俯视角高度测试完成，已恢复默认高度')
            }, 1000)
          }
        }, 1000)
      }
    }, 1000)
  } else {
    console.error('❌ 俯视角模式不可用')
  }
}

// 测试相机激活
function testCameraActivation(): void {
  console.log('🧪 测试相机激活系统...')

  if (!camera) {
    console.error('❌ 相机对象不存在')
    return
  }

  console.log('📷 相机激活测试开始')
  console.log('当前激活状态:', camera.current ? '✅ 激活' : '❌ 未激活')

  // 测试makeCurrent方法
  if (typeof camera.makeCurrent === 'function') {
    console.log('🔄 调用makeCurrent()方法...')
    camera.makeCurrent()

    setTimeout(() => {
      console.log('激活后状态:', camera.current ? '✅ 激活' : '❌ 未激活')

      // 检查THREE.js相机同步
      if (camera._perspectiveCamera) {
        const threeCamera = camera._perspectiveCamera
        console.log('THREE.js相机信息:')
        console.log('   位置:', `(${threeCamera.position.x.toFixed(2)}, ${threeCamera.position.y.toFixed(2)}, ${threeCamera.position.z.toFixed(2)})`)
        console.log('   FOV:', threeCamera.fov)
        console.log('   Near:', threeCamera.near)
        console.log('   Far:', threeCamera.far)

        // 检查是否为当前渲染相机
        try {
          const engine = Engine.getInstance()
          const renderer = engine.getRenderer()
          if (renderer && renderer.camera === threeCamera) {
            console.log('   渲染器状态: ✅ 当前渲染相机')
          } else {
            console.log('   渲染器状态: ❌ 非当前渲染相机')
          }
        } catch (error) {
          console.log('   渲染器状态: ❓ 无法检查')
        }
      }

      // 测试位置同步
      console.log('\n🧪 测试位置同步...')
      const testPos = { x: 5, y: 25, z: 8 }
      console.log('设置测试位置:', testPos)

      camera.position = testPos

      setTimeout(() => {
        const currentPos = camera.position
        console.log('Node位置:', currentPos)

        if (camera._perspectiveCamera) {
          const threePos = camera._perspectiveCamera.position
          console.log('THREE.js位置:', `(${threePos.x.toFixed(2)}, ${threePos.y.toFixed(2)}, ${threePos.z.toFixed(2)})`)

          const synced = Math.abs(threePos.x - testPos.x) < 0.001 &&
                        Math.abs(threePos.y - testPos.y) < 0.001 &&
                        Math.abs(threePos.z - testPos.z) < 0.001
          console.log('位置同步:', synced ? '✅ 同步' : '❌ 不同步')
        }

        // 恢复跟随模式
        setTimeout(() => {
          if (player && typeof (camera as any).setTopDownMode === 'function') {
            (camera as any).setTopDownMode(player, 20)
            console.log('✅ 相机激活测试完成，已恢复跟随模式')
          }
        }, 1000)

      }, 100)

    }, 100)
  } else {
    console.error('❌ makeCurrent方法不存在')
  }
}

// 键盘控制（作为备用方案）
onMounted(() => {
  // 添加全局键盘监听作为备用方案
  const handleKeyPress = (event: KeyboardEvent) => {
    if (!gameStarted.value || !player) return

    console.log(`全局键盘事件: ${event.key}`)

    switch (event.key.toLowerCase()) {
      case 'w':
        movePlayer('forward')
        break
      case 's':
        movePlayer('backward')
        break
      case 'a':
        movePlayer('left')
        break
      case 'd':
        movePlayer('right')
        break
      case ' ':
        event.preventDefault()
        attack()
        break
    }
  }

  window.addEventListener('keydown', handleKeyPress)

  // 确保页面获得焦点
  if (gameCanvas.value) {
    gameCanvas.value.setAttribute('tabindex', '0')
    gameCanvas.value.focus()
  }

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)

    try {
      const engine = Engine.getInstance()
      engine.stopRendering()
      engine.destroy()
      console.log('🧹 游戏清理完成')
    } catch (error) {
      console.error('❌ 游戏清理失败:', error)
    }
  })
})

// 设置页面标题
useHead({
  title: '3D 肉鸽游戏测试'
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  color: #ffffff;
  font-family: 'Arial', sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-button {
  color: #00ff88;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.back-button:hover {
  color: #00cc6a;
}

.game-header h1 {
  font-size: 1.8rem;
  margin: 0;
  background: linear-gradient(45deg, #00ff88, #00ccff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.game-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.health-bar {
  width: 100px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff8888);
  transition: width 0.3s ease;
}

.game-area {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
}

#game-canvas {
  border: 2px solid #00ff88;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

.game-controls {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group h4 {
  color: #00ff88;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-width: 200px;
}

.control-btn {
  padding: 0.5rem 1rem;
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid rgba(0, 255, 136, 0.5);
  border-radius: 4px;
  color: #00ff88;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.control-btn:hover {
  background: rgba(0, 255, 136, 0.3);
  transform: translateY(-1px);
}

.control-btn.attack {
  background: rgba(255, 68, 68, 0.2);
  border-color: rgba(255, 68, 68, 0.5);
  color: #ff4444;
  grid-column: 1 / -1;
}

.control-btn.attack:hover {
  background: rgba(255, 68, 68, 0.3);
}

.control-btn.debug {
  background: rgba(155, 89, 182, 0.2);
  border-color: rgba(155, 89, 182, 0.5);
  color: #9b59b6;
  font-size: 12px;
  padding: 8px 12px;
}

.control-btn.debug:hover {
  background: rgba(155, 89, 182, 0.3);
}

.control-btn.camera {
  background: rgba(52, 152, 219, 0.2);
  border-color: rgba(52, 152, 219, 0.5);
  color: #3498db;
  font-size: 12px;
  padding: 8px 12px;
}

.control-btn.camera:hover {
  background: rgba(52, 152, 219, 0.3);
}

.game-info {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.start-screen {
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 3rem;
  backdrop-filter: blur(10px);
}

.start-screen h2 {
  color: #00ff88;
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.start-screen p {
  color: #cccccc;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.start-btn {
  margin-top: 2rem;
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #00ff88, #00ccff);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.start-btn:hover {
  transform: translateY(-2px);
}

.minimap {
  position: fixed;
  top: 100px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.minimap h4 {
  color: #00ff88;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.minimap-grid {
  display: grid;
  grid-template-columns: repeat(17, 6px);
  gap: 1px;
}

.minimap-cell {
  width: 6px;
  height: 6px;
  border-radius: 1px;
}

.minimap-cell.empty {
  background: rgba(255, 255, 255, 0.1);
}

.minimap-cell.wall {
  background: #666;
}

.minimap-cell.enemy {
  background: #ff4444;
}

.minimap-cell.item {
  background: #ffaa00;
}

.player-dot {
  width: 4px;
  height: 4px;
  background: #00ff88;
  border-radius: 50%;
  margin: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .game-stats {
    flex-direction: column;
    gap: 0.5rem;
  }

  .game-area {
    flex-direction: column;
    align-items: center;
  }

  .minimap {
    position: static;
    margin: 1rem auto;
  }
}
</style>
