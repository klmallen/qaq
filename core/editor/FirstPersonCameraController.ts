/**
 * QAQ编辑器 - 第一人称相机控制器
 * 
 * 功能：
 * - WASD键位控制移动（W前进、S后退、A左移、D右移）
 * - 鼠标控制视角旋转
 * - Shift加速移动、Ctrl减速移动
 * - 类似Unity、Unreal Engine等主流游戏引擎的相机控制
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import * as THREE from 'three'

export interface FirstPersonCameraConfig {
  /** 移动速度 (米/秒) */
  moveSpeed?: number
  /** 鼠标灵敏度 */
  mouseSensitivity?: number
  /** 加速倍数 (Shift键) */
  speedMultiplier?: number
  /** 减速倍数 (Ctrl键) */
  slowMultiplier?: number
  /** 最大俯仰角度 (弧度) */
  maxPitch?: number
  /** 是否启用阻尼 */
  enableDamping?: boolean
  /** 阻尼系数 */
  dampingFactor?: number
}

export class FirstPersonCameraController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private config: Required<FirstPersonCameraConfig>
  
  // 移动状态
  private moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
    ctrl: false
  }
  
  // 鼠标状态
  private mouseState = {
    isLocked: false,
    lastX: 0,
    lastY: 0
  }
  
  // 相机旋转
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private velocity = new THREE.Vector3()
  private direction = new THREE.Vector3()
  
  // 事件监听器
  private boundKeyDown: (event: KeyboardEvent) => void
  private boundKeyUp: (event: KeyboardEvent) => void
  private boundMouseMove: (event: MouseEvent) => void
  private boundMouseDown: (event: MouseEvent) => void
  private boundPointerLockChange: () => void
  private boundPointerLockError: () => void
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, config: FirstPersonCameraConfig = {}) {
    this.camera = camera
    this.domElement = domElement
    
    // 设置默认配置
    this.config = {
      moveSpeed: 5.0,
      mouseSensitivity: 0.002,
      speedMultiplier: 3.0,
      slowMultiplier: 0.3,
      maxPitch: Math.PI / 2 - 0.1,
      enableDamping: true,
      dampingFactor: 0.1,
      ...config
    }
    
    // 绑定事件处理器
    this.boundKeyDown = this.onKeyDown.bind(this)
    this.boundKeyUp = this.onKeyUp.bind(this)
    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundMouseDown = this.onMouseDown.bind(this)
    this.boundPointerLockChange = this.onPointerLockChange.bind(this)
    this.boundPointerLockError = this.onPointerLockError.bind(this)
    
    // 初始化相机旋转
    this.euler.setFromQuaternion(this.camera.quaternion)
    
    this.connect()
  }
  
  /**
   * 连接事件监听器
   */
  connect(): void {
    document.addEventListener('keydown', this.boundKeyDown)
    document.addEventListener('keyup', this.boundKeyUp)
    this.domElement.addEventListener('mousedown', this.boundMouseDown)
    document.addEventListener('pointerlockchange', this.boundPointerLockChange)
    document.addEventListener('pointerlockerror', this.boundPointerLockError)
    
    console.log('🎮 第一人称相机控制器已连接')
  }
  
  /**
   * 断开事件监听器
   */
  disconnect(): void {
    document.removeEventListener('keydown', this.boundKeyDown)
    document.removeEventListener('keyup', this.boundKeyUp)
    this.domElement.removeEventListener('mousedown', this.boundMouseDown)
    document.removeEventListener('mousemove', this.boundMouseMove)
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange)
    document.removeEventListener('pointerlockerror', this.boundPointerLockError)
    
    // 退出指针锁定
    if (this.mouseState.isLocked) {
      document.exitPointerLock()
    }
    
    console.log('🎮 第一人称相机控制器已断开')
  }
  
  /**
   * 更新相机（每帧调用）
   */
  update(deltaTime: number): void {
    // 计算移动方向
    this.direction.set(0, 0, 0)
    
    if (this.moveState.forward) this.direction.z -= 1
    if (this.moveState.backward) this.direction.z += 1
    if (this.moveState.left) this.direction.x -= 1
    if (this.moveState.right) this.direction.x += 1
    if (this.moveState.up) this.direction.y += 1
    if (this.moveState.down) this.direction.y -= 1
    
    // 标准化方向向量
    this.direction.normalize()
    
    // 计算速度
    let speed = this.config.moveSpeed
    if (this.moveState.shift) speed *= this.config.speedMultiplier
    if (this.moveState.ctrl) speed *= this.config.slowMultiplier
    
    // 应用移动
    if (this.direction.length() > 0) {
      // 将方向转换到相机坐标系
      const cameraDirection = this.direction.clone()
      cameraDirection.applyQuaternion(this.camera.quaternion)
      
      // 计算目标速度
      const targetVelocity = cameraDirection.multiplyScalar(speed)
      
      if (this.config.enableDamping) {
        // 使用阻尼平滑移动
        this.velocity.lerp(targetVelocity, this.config.dampingFactor)
      } else {
        // 直接设置速度
        this.velocity.copy(targetVelocity)
      }
    } else if (this.config.enableDamping) {
      // 阻尼停止
      this.velocity.multiplyScalar(1 - this.config.dampingFactor)
    } else {
      // 立即停止
      this.velocity.set(0, 0, 0)
    }
    
    // 应用位置变化
    this.camera.position.addScaledVector(this.velocity, deltaTime)
  }
  
  /**
   * 键盘按下事件
   */
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.moveState.forward = true
        break
      case 'KeyS':
        this.moveState.backward = true
        break
      case 'KeyA':
        this.moveState.left = true
        break
      case 'KeyD':
        this.moveState.right = true
        break
      case 'KeyQ':
        this.moveState.down = true
        break
      case 'KeyE':
        this.moveState.up = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveState.shift = true
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.moveState.ctrl = true
        break
    }
  }
  
  /**
   * 键盘释放事件
   */
  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.moveState.forward = false
        break
      case 'KeyS':
        this.moveState.backward = false
        break
      case 'KeyA':
        this.moveState.left = false
        break
      case 'KeyD':
        this.moveState.right = false
        break
      case 'KeyQ':
        this.moveState.down = false
        break
      case 'KeyE':
        this.moveState.up = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveState.shift = false
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.moveState.ctrl = false
        break
    }
  }
  
  /**
   * 鼠标按下事件（请求指针锁定）
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // 左键
      this.domElement.requestPointerLock()
    }
  }
  
  /**
   * 鼠标移动事件
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.mouseState.isLocked) return
    
    const movementX = event.movementX || 0
    const movementY = event.movementY || 0
    
    // 更新欧拉角
    this.euler.y -= movementX * this.config.mouseSensitivity
    this.euler.x -= movementY * this.config.mouseSensitivity
    
    // 限制俯仰角
    this.euler.x = Math.max(-this.config.maxPitch, Math.min(this.config.maxPitch, this.euler.x))
    
    // 应用旋转到相机
    this.camera.quaternion.setFromEuler(this.euler)
  }
  
  /**
   * 指针锁定状态变化
   */
  private onPointerLockChange(): void {
    if (document.pointerLockElement === this.domElement) {
      this.mouseState.isLocked = true
      document.addEventListener('mousemove', this.boundMouseMove)
      console.log('🔒 鼠标已锁定 - 可以使用WASD移动和鼠标旋转视角')
    } else {
      this.mouseState.isLocked = false
      document.removeEventListener('mousemove', this.boundMouseMove)
      console.log('🔓 鼠标已解锁 - 点击视口重新锁定')
    }
  }
  
  /**
   * 指针锁定错误
   */
  private onPointerLockError(): void {
    console.error('❌ 指针锁定失败')
  }
  
  /**
   * 设置相机位置
   */
  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }
  
  /**
   * 设置相机旋转
   */
  setRotation(x: number, y: number, z: number): void {
    this.euler.set(x, y, z)
    this.camera.quaternion.setFromEuler(this.euler)
  }
  
  /**
   * 获取配置
   */
  getConfig(): FirstPersonCameraConfig {
    return { ...this.config }
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<FirstPersonCameraConfig>): void {
    Object.assign(this.config, newConfig)
  }
}
