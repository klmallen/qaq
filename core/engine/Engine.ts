/**
 * QAQ游戏引擎 - Engine 核心引擎类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 引擎的核心管理类，统一管理Three.js渲染管道
 * - 负责初始化和管理Renderer、Scene、Camera等核心对象
 * - 提供统一的2D/3D渲染架构
 * - 管理场景树与Three.js场景图的同步
 * - 处理引擎生命周期和渲染循环
 *
 * 架构设计:
 * - 所有QAQ节点都对应Three.js Object3D实例
 * - 2D节点通过Plane几何体在3D空间中渲染
 * - 统一的变换同步机制
 * - 集成的事件处理系统
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Scene from '../scene/Scene'
import type { SceneChangeOptions } from '../scene/types'
import type { Vector2, Vector3 } from '../../types/core'
import { InputManager } from '../input/InputManager'

// 使用类型导入避免循环依赖
type SceneTree = any
type CameraManager = any

// ============================================================================
// 引擎相关接口和枚举
// ============================================================================

/**
 * 引擎配置接口
 */
export interface EngineConfig {
  /** 画布容器元素 */
  container: HTMLElement
  /** 初始画布宽度 */
  width?: number
  /** 初始画布高度 */
  height?: number
  /** 是否启用抗锯齿 */
  antialias?: boolean
  /** 背景颜色 */
  backgroundColor?: number
  /** 是否启用阴影 */
  enableShadows?: boolean
  /** 像素比 */
  pixelRatio?: number
  /** 是否启用VR */
  enableVR?: boolean
  /** 调试模式 */
  debug?: boolean
}

/**
 * 渲染统计信息接口
 */
export interface RenderStats {
  /** 帧率 */
  fps: number
  /** 渲染调用次数 */
  drawCalls: number
  /** 三角形数量 */
  triangles: number
  /** 几何体数量 */
  geometries: number
  /** 纹理数量 */
  textures: number
  /** 内存使用量 */
  memory: {
    geometries: number
    textures: number
  }
}

/**
 * 引擎状态枚举
 */
export enum EngineState {
  /** 未初始化 */
  UNINITIALIZED = 0,
  /** 初始化中 */
  INITIALIZING = 1,
  /** 运行中 */
  RUNNING = 2,
  /** 暂停 */
  PAUSED = 3,
  /** 已销毁 */
  DESTROYED = 4
}

// ============================================================================
// Engine 核心类实现
// ============================================================================

/**
 * Engine 类 - QAQ游戏引擎核心
 *
 * 主要功能:
 * 1. Three.js渲染器管理
 * 2. 场景和相机管理
 * 3. 渲染循环控制
 * 4. 节点系统与Three.js集成
 * 5. 事件处理和输入管理
 * 6. 资源管理和优化
 */
export class Engine {
  // ========================================================================
  // 私有属性 - Three.js核心对象
  // ========================================================================

  /** Three.js渲染器 */
  private _renderer: THREE.WebGLRenderer | null = null

  /** 主场景 */
  private _scene: THREE.Scene | null = null

  /** 当前活动相机 */
  private _activeCamera: THREE.Camera | null = null

  /** 2D正交相机 */
  private _camera2D: THREE.OrthographicCamera | null = null

  /** 3D透视相机 */
  private _camera3D: THREE.PerspectiveCamera | null = null

  /** 当前活动的QAQ相机节点 */
  private _currentQAQCamera: any = null

  /** 相机管理系统 */
  private _cameraManager: CameraManager | null = null

  /** 画布元素 */
  private _canvas: HTMLCanvasElement | null = null

  /** 容器元素 */
  private _container: HTMLElement | null = null

  // ========================================================================
  // 私有属性 - 引擎状态管理
  // ========================================================================

  /** 引擎状态 */
  private _state: EngineState = EngineState.UNINITIALIZED

  /** 引擎配置 */
  private _config: EngineConfig | null = null

  /** 是否正在渲染 */
  private _isRendering: boolean = false

  /** 渲染循环ID */
  private _renderLoopId: number | null = null

  /** 上一帧时间 */
  private _lastFrameTime: number = 0

  /** 帧率计算 */
  private _frameCount: number = 0
  private _fpsUpdateTime: number = 0
  private _currentFPS: number = 0

  // ========================================================================
  // 私有属性 - 2D/3D渲染层管理
  // ========================================================================

  /** 2D渲染层 - 用于UI和2D游戏对象 */
  private _layer2D: THREE.Group | null = null

  /** 3D渲染层 - 用于3D游戏对象 */
  private _layer3D: THREE.Group | null = null

  /** UI层 - 最顶层的UI元素 */
  private _layerUI: THREE.Group | null = null

  /** 当前渲染模式 (2D/3D/混合) */
  private _renderMode: '2D' | '3D' | 'MIXED' = 'MIXED'

  // ========================================================================
  // 私有属性 - 事件和输入
  // ========================================================================

  /** 输入管理器 */
  private _inputManager: InputManager | null = null

  /** 鼠标射线投射器 */
  private _raycaster: THREE.Raycaster | null = null

  /** 鼠标位置 */
  private _mousePosition: THREE.Vector2 = new THREE.Vector2(0, 0)

  /** 事件监听器映射 */
  private _eventListeners: Map<string, Function[]> = new Map()

  // ========================================================================
  // 私有属性 - 调试和测试
  // ========================================================================

  /** 测试立方体 - 用于验证渲染管道 */
  private _testCube: THREE.Mesh | null = null

  /** 轨道控制器 - 用于3D场景交互 */
  private _orbitControls: OrbitControls | null = null

  /** 测试立方体动画ID */
  private _testCubeAnimationId: number | null = null

  // ========================================================================
  // 私有属性 - 场景管理系统
  // ========================================================================

  /** 场景树管理器 */
  private _sceneTree: any = null

  /** 当前QAQ场景 */
  private _currentQAQScene: Scene | null = null

  /** 根节点 - 连接QAQ场景树和Three.js场景图 */
  private _rootNode: THREE.Group | null = null

  // ========================================================================
  // 静态属性 - 单例管理
  // ========================================================================

  /** 引擎单例实例 */
  private static _instance: Engine | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 私有构造函数 - 单例模式
   */
  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  /**
   * 获取引擎单例实例
   * @returns 引擎实例
   */
  static getInstance(): Engine {
    if (!Engine._instance) {
      Engine._instance = new Engine()
    }
    return Engine._instance
  }

  /**
   * 初始化引擎
   * @param config 引擎配置
   * @returns Promise<boolean> 初始化是否成功
   */
  async initialize(config: EngineConfig): Promise<boolean> {
    if (this._state !== EngineState.UNINITIALIZED) {
      console.warn('Engine is already initialized')
      return false
    }

    this._state = EngineState.INITIALIZING
    this._config = { ...config }

    try {
      // 初始化Three.js渲染器
      await this._initializeRenderer()

      // 初始化场景
      this._initializeScene()

      // 初始化相机
      this._initializeCameras()

      // 初始化渲染层
      this._initializeRenderLayers()

      // 初始化场景管理系统
      await this._initializeSceneSystem()

      // 初始化脚本管理系统
      await this._initializeScriptSystem()

      // 初始化事件系统
      this._initializeEventSystem()

      // 初始化输入管理系统
      await this._initializeInputSystem()

      // 设置渲染循环
      this._setupRenderLoop()

      this._state = EngineState.RUNNING

      console.log('🚀 QAQ Game Engine initialized successfully')
      this._emitEvent('engine_initialized')

      return true

    } catch (error) {
      console.error('❌ Failed to initialize QAQ Game Engine:', error)
      this._state = EngineState.UNINITIALIZED
      return false
    }
  }

  /**
   * 初始化Three.js渲染器
   */
  private async _initializeRenderer(): Promise<void> {
    const config = this._config!

    // 创建渲染器
    this._renderer = new THREE.WebGLRenderer({
      antialias: config.antialias ?? true,
      alpha: true,
      powerPreference: 'high-performance'
    })

    // 设置渲染器参数
    const width = config.width ?? config.container.clientWidth
    const height = config.height ?? config.container.clientHeight

    this._renderer.setSize(width, height)
    this._renderer.setPixelRatio(config.pixelRatio ?? window.devicePixelRatio)
    this._renderer.setClearColor(config.backgroundColor ?? new THREE.Color(0x222222), 1)
    // 启用阴影
    // if (config.enableShadows) {
    //   this._renderer.shadowMap.enabled = true
    //   this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // }
	//
    // // 启用色调映射
    // this._renderer.toneMapping = THREE.ACESFilmicToneMapping
    // this._renderer.toneMappingExposure = 1

    // 获取画布并添加到容器
    this._canvas = this._renderer.domElement
    this._container = config.container
    this._container.appendChild(this._canvas)

    console.log('✅ Three.js Renderer initialized')

    // 创建测试立方体和轨道控制器
    // this._createTestObjects()
  }

  /**
   * 初始化场景
   */
  private _initializeScene(): void {
    this._scene = new THREE.Scene()

    // // 设置场景背景
    // if (this._config?.backgroundColor !== undefined) {
    //   this._scene.background = new THREE.Color(this._config.backgroundColor)
    // }
	//
    // // 添加环境光
    // const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    // this._scene.add(ambientLight)
	//
    // // 添加方向光
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    // directionalLight.position.set(1, 1, 1)
    // directionalLight.castShadow = true
    // this._scene.add(directionalLight)

    console.log('✅ Scene initialized')
  }

  /**
   * 初始化相机
   */
  private _initializeCameras(): void {
    const width = this._config!.width ?? this._container!.clientWidth
    const height = this._config!.height ?? this._container!.clientHeight
    const aspect = width / height

    // 创建3D透视相机
    this._camera3D = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this._camera3D.position.set(0, 0, 10)

    // 创建2D正交相机 - 设置为左上角原点坐标系
    this._camera2D = new THREE.OrthographicCamera(
      0, width,           // left, right: 0 到 width
      height, 0,          // top, bottom: height 到 0 (Y轴向下)
      -1000, 1000         // near, far
    )
    this._camera2D.position.set(0, 0, 500) // 相机位置在原点上方

    // 默认使用混合模式的3D相机
    this._activeCamera = this._camera3D

    console.log('✅ Cameras initialized')

  }

  /**
   * 初始化渲染层
   */
  private _initializeRenderLayers(): void {
    // 创建3D渲染层
    this._layer3D = new THREE.Group()
    this._layer3D.name = 'Layer3D'
    this._scene!.add(this._layer3D)

    // 创建2D渲染层
    this._layer2D = new THREE.Group()
    this._layer2D.name = 'Layer2D'
    this._layer2D.position.z = 0 // 2D层在世界原点
    this._scene!.add(this._layer2D)

    // 创建UI层
    this._layerUI = new THREE.Group()
    this._layerUI.name = 'LayerUI'
    this._layerUI.position.z = 200 // UI层在最前面
    this._scene!.add(this._layerUI)

    console.log('✅ Render layers initialized')
  }

  /**
   * 初始化场景管理系统
   */
  private async _initializeSceneSystem(): Promise<void> {
    // 动态导入SceneTree避免循环依赖
    const { default: SceneTree } = await import('../scene/SceneTree')

    // 获取SceneTree单例并初始化
    this._sceneTree = SceneTree.getInstance()
    this._sceneTree.initialize(this)

    // 创建根节点用于连接QAQ场景树和Three.js场景图
    this._rootNode = new THREE.Group()
    this._rootNode.name = 'QAQSceneRoot'
    this._layer3D!.add(this._rootNode)

    console.log('✅ Scene management system initialized')
  }

  /**
   * 初始化脚本管理系统
   */
  private async _initializeScriptSystem(): Promise<void> {
    try {
      // 动态导入ScriptManager避免循环依赖
      const { default: ScriptManager, GameMode } = await import('../script/ScriptManager')

      // 获取ScriptManager单例并初始化
      const scriptManager = ScriptManager.getInstance()
      scriptManager.initialize(this)

      // 默认设置为编辑模式
      scriptManager.setGameMode(GameMode.EDITOR)

      console.log('✅ Script management system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize script system:', error)
    }
  }

  /**
   * 初始化事件系统
   */
  private _initializeEventSystem(): void {
    this._raycaster = new THREE.Raycaster()

    // 添加鼠标事件监听
    this._canvas!.addEventListener('mousemove', this._onMouseMove.bind(this))
    this._canvas!.addEventListener('mousedown', this._onMouseDown.bind(this))
    this._canvas!.addEventListener('mouseup', this._onMouseUp.bind(this))
    this._canvas!.addEventListener('click', this._onClick.bind(this))

    // 添加窗口尺寸变化监听
    window.addEventListener('resize', this._onWindowResize.bind(this))

    console.log('✅ Event system initialized')
  }

  /**
   * 初始化输入管理系统
   */
  private async _initializeInputSystem(): Promise<void> {
    this._inputManager = InputManager.getInstance()

    // 初始化输入管理器
    await this._inputManager.initialize({
      globalDeadzone: 0.1,
      mouseSensitivity: 1.0,
      gamepadSensitivity: 1.0,
      smoothingFactor: 0.1,
      enableGamepad: true,
      enableMouse: true,
      enableKeyboard: true
    })

    console.log('✅ Input system initialized')
  }

  /**
   * 设置渲染循环
   */
  private _setupRenderLoop(): void {
    this._lastFrameTime = performance.now()
    this._fpsUpdateTime = this._lastFrameTime
    this._startRenderLoop()

    console.log('✅ Render loop started')
  }

  // ========================================================================
  // 公共API - 场景管理
  // ========================================================================

  /**
   * 获取Three.js场景对象
   * @returns Three.js场景
   */
  getScene(): THREE.Scene | null {
    return this._scene
  }

  /**
   * 获取Three.js渲染器
   * @returns Three.js渲染器
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this._renderer
  }

  /**
   * 获取当前活动相机
   * @returns 当前相机
   */
  getActiveCamera(): THREE.Camera | null {
    return this._activeCamera
  }

  /**
   * 获取2D相机
   * @returns 2D正交相机
   */
  getCamera2D(): THREE.OrthographicCamera | null {
    return this._camera2D
  }

  /**
   * 获取3D相机
   * @returns 3D透视相机
   */
  getCamera3D(): THREE.PerspectiveCamera | null {
    return this._camera3D
  }

  /**
   * 获取输入管理器（类似UE5的全局访问方式）
   * @returns 输入管理器实例
   */
  get input(): InputManager | null {
    return this._inputManager
  }

  /**
   * 获取输入管理器（方法形式）
   * @returns 输入管理器实例
   */
  getInputManager(): InputManager | null {
    return this._inputManager
  }

  /**
   * 切换到2D渲染模式
   */
  switchTo2D(): void {
    this._renderMode = '2D'
    this._activeCamera = this._camera2D
    this._emitEvent('render_mode_changed', { mode: '2D' })
  }

  /**
   * 切换到3D渲染模式
   */
  switchTo3D(): void {
    this._renderMode = '3D'
    if (this._currentQAQCamera && this._currentQAQCamera.threeCamera) {
      this._activeCamera = this._currentQAQCamera.threeCamera
    } else {
      this._activeCamera = this._camera3D
    }
    this._emitEvent('render_mode_changed', { mode: '3D' })
  }

  /**
   * 切换到混合渲染模式
   */
  switchToMixed(): void {
    this._renderMode = 'MIXED'
    this._activeCamera = this._camera3D // 混合模式使用3D相机
    this._emitEvent('render_mode_changed', { mode: 'MIXED' })
  }

  // ========================================================================
  // 公共API - 游戏模式控制
  // ========================================================================

  /**
   * 开始播放模式
   */
  async startPlayMode(): Promise<void> {
    try {
      const { default: ScriptManager, GameMode } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()
      scriptManager.setGameMode(GameMode.PLAY)

      console.log('🎮 Play mode started')
      this._emitEvent('play_mode_started')
    } catch (error) {
      console.error('❌ Failed to start play mode:', error)
    }
  }

  /**
   * 停止播放模式
   */
  async stopPlayMode(): Promise<void> {
    try {
      const { default: ScriptManager, GameMode } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()
      scriptManager.setGameMode(GameMode.EDITOR)

      console.log('✏️ Edit mode started')
      this._emitEvent('edit_mode_started')
    } catch (error) {
      console.error('❌ Failed to stop play mode:', error)
    }
  }

  /**
   * 暂停播放模式
   */
  async pausePlayMode(): Promise<void> {
    try {
      const { default: ScriptManager, GameMode } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()
      scriptManager.setGameMode(GameMode.PAUSE)

      console.log('⏸️ Play mode paused')
      this._emitEvent('play_mode_paused')
    } catch (error) {
      console.error('❌ Failed to pause play mode:', error)
    }
  }

  /**
   * 恢复播放模式
   */
  async resumePlayMode(): Promise<void> {
    try {
      const { default: ScriptManager, GameMode } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()
      scriptManager.setGameMode(GameMode.PLAY)

      console.log('▶️ Play mode resumed')
      this._emitEvent('play_mode_resumed')
    } catch (error) {
      console.error('❌ Failed to resume play mode:', error)
    }
  }

  /**
   * 获取当前游戏模式
   */
  async getCurrentGameMode(): Promise<string> {
    try {
      const { default: ScriptManager } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()
      return scriptManager.getGameMode()
    } catch (error) {
      console.error('❌ Failed to get game mode:', error)
      return 'editor'
    }
  }

  /**
   * 获取指定层的Three.js Group对象
   * @param layer 层名称
   * @returns Three.js Group对象
   */
  getLayer(layer: '2D' | '3D' | 'UI'): THREE.Group | null {
    switch (layer) {
      case '2D': return this._layer2D
      case '3D': return this._layer3D
      case 'UI': return this._layerUI
      default: return null
    }
  }

  /**
   * 添加Three.js对象到指定层
   * @param object Three.js对象
   * @param layer 目标层
   */
  addToLayer(object: THREE.Object3D, layer: '2D' | '3D' | 'UI' = '3D'): void {
    const targetLayer = this.getLayer(layer)
    if (targetLayer) {
      targetLayer.add(object)
    }
  }

  /**
   * 从指定层移除Three.js对象
   * @param object Three.js对象
   * @param layer 源层
   */
  removeFromLayer(object: THREE.Object3D, layer: '2D' | '3D' | 'UI' = '3D'): void {
    const sourceLayer = this.getLayer(layer)
    if (sourceLayer) {
      sourceLayer.remove(object)
    }
  }

  // ========================================================================
  // 公共API - 渲染控制
  // ========================================================================

  /**
   * 开始渲染循环
   */
  startRendering(): void {
    if (this._state === EngineState.RUNNING && !this._isRendering) {
      this._startRenderLoop()
    }
  }

  /**
   * 停止渲染循环
   */
  stopRendering(): void {
    if (this._renderLoopId !== null) {
      cancelAnimationFrame(this._renderLoopId)
      this._renderLoopId = null
      this._isRendering = false
    }
  }

  /**
   * 暂停引擎
   */
  pause(): void {
    if (this._state === EngineState.RUNNING) {
      this.stopRendering()
      this._state = EngineState.PAUSED
      this._emitEvent('engine_paused')
    }
  }

  /**
   * 恢复引擎
   */
  resume(): void {
    if (this._state === EngineState.PAUSED) {
      this._state = EngineState.RUNNING
      this.startRendering()
      this._emitEvent('engine_resumed')
    }
  }

  /**
   * 手动渲染一帧
   */
  renderFrame(): void {
    if (this._renderer && this._scene && this._activeCamera) {
      const deltaTime = 0.016 // 假设60FPS，每帧约16ms

      // 更新输入系统
      this._updateInputSystem(deltaTime)

      // 更新物理系统
      this._updatePhysicsSystem(deltaTime)

      // 更新脚本系统
      this._updateScriptSystem(deltaTime)

      // 更新当前场景（如果有）
      if (this._currentQAQScene && this._currentQAQScene.isRunning()) {
        this._currentQAQScene._process(deltaTime)
      }
      this._renderer.render(this._scene, this._activeCamera)
    }
  }

  /**
   * 更新输入系统
   * @param deltaTime 时间增量
   */
  private _updateInputSystem(deltaTime: number): void {
    if (this._inputManager) {
      this._inputManager.update(deltaTime)
    }
  }

  /**
   * 更新物理系统
   * @param deltaTime 时间增量
   */
  private _updatePhysicsSystem(deltaTime: number): void {
    try {
      // 检查全局PhysicsServer是否可用
      if (typeof window !== 'undefined' && (window as any).PhysicsServer) {
        const PhysicsServer = (window as any).PhysicsServer
        const physicsServer = PhysicsServer.getInstance()
        if (physicsServer && physicsServer.initialized) {
          // 执行物理步进
          physicsServer.step(deltaTime)

          // 执行批量同步（未来优化点）
          physicsServer.syncAllBodies()

          // 每100帧输出一次调试信息
          if (this._frameCount % 100 === 0) {
            console.debug('🔄 Physics step:', {
              deltaTime,
              bodyCount: physicsServer.bodyCount,
              stepCount: physicsServer.stepCount || 0
            })
          }
        } else {
          if (this._frameCount % 300 === 0) { // 每5秒提示一次
            console.debug('⚠️ PhysicsServer not ready:', {
              available: !!physicsServer,
              initialized: physicsServer?.initialized
            })
          }
        }
      } else {
        if (this._frameCount % 300 === 0) { // 每5秒提示一次
          console.debug('⚠️ PhysicsServer not found in window')
        }
      }
    } catch (error) {
      console.warn('Physics update error:', error)
    }
  }

  /**
   * 更新脚本系统
   * @param deltaTime 时间增量
   */
  private _updateScriptSystem(deltaTime: number): void {
    // 动态导入ScriptManager避免循环依赖
    import('../script/ScriptManager').then(({ default: ScriptManager }) => {
      const scriptManager = ScriptManager.getInstance()
      scriptManager.processScripts(deltaTime)
    }).catch(error => {
      // 静默处理，避免在控制台产生过多错误信息
    })
  }

  // ========================================================================
  // 公共API - 场景管理
  // ========================================================================

  /**
   * 设置主场景
   * @param scene 主场景实例
   */
  async setMainScene(scene: Scene): Promise<void> {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }

    await this._sceneTree.setMainScene(scene)
    this._currentQAQScene = scene

    // 将场景的Three.js对象添加到根节点
    if (this._rootNode && scene.object3D) {
      this._rootNode.add(scene.object3D)
    }

    // 注册场景到全局，以便ProjectExporter能够找到
    this.registerSceneGlobally(scene)

    console.log(`🎬 Main scene set: ${scene.name}`)
  }

  /**
   * 注册场景到全局变量，以便ProjectExporter扫描
   */
  private registerSceneGlobally(scene: Scene): void {
    if (typeof window !== 'undefined') {
      // 设置当前场景
      ;(window as any).currentScene = scene

      // 如果场景有名称，也设置对应的全局变量
      if (scene.name) {
        const globalVarName = scene.name.replace(/[^a-zA-Z0-9_]/g, '_')
        ;(window as any)[globalVarName] = scene
      }

      console.log(`🌍 场景已注册到全局: ${scene.name}`)
    }
  }

  /**
   * 切换场景
   * @param scenePath 场景路径或Scene实例
   * @param options 切换选项
   * @returns 切换后的场景
   */
  async changeScene(
    scenePath: string | Scene,
    options?: SceneChangeOptions
  ): Promise<Scene> {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }

    // 移除当前场景的Three.js对象
    if (this._currentQAQScene && this._rootNode) {
      this._rootNode.remove(this._currentQAQScene.object3D)
    }

    // 切换场景
    const newScene = await this._sceneTree.changeScene(scenePath, options)
    this._currentQAQScene = newScene

    // 添加新场景的Three.js对象
    if (this._rootNode && newScene.object3D) {
      this._rootNode.add(newScene.object3D)
    }

    console.log(`🔄 Scene changed to: ${newScene.name}`)
    return newScene
  }

  /**
   * 获取当前场景
   * @returns 当前场景
   */
  getCurrentScene(): Scene | null {
    return this._currentQAQScene
  }

  /**
   * 设置当前活动的相机
   * @param camera Camera3D节点
   */
  setCurrentCamera(camera: any): void {
    console.log('🎥 Engine.setCurrentCamera() 调用')
    console.log('   设置相机:', camera?.name || '未知')
    console.log('   当前相机:', this._currentQAQCamera?.name || '无')

    // 如果是同一个相机，直接返回
    if (this._currentQAQCamera === camera) {
      console.log('   ✅ 相机已经是当前活动相机')
      return
    }

    // 取消之前相机的激活状态
    if (this._currentQAQCamera) {
      this._currentQAQCamera.current = false
      console.log('   📷 取消之前相机的激活状态:', this._currentQAQCamera.name)
    }

    // 设置新的当前相机
    this._currentQAQCamera = camera

    if (camera) {
      camera.current = true
      // 更新THREE.js渲染器使用的相机
      if (camera.threeCamera) {
        this._activeCamera = camera.threeCamera
        console.log('   📷 更新THREE.js渲染器相机:', camera.threeCamera.name)
      } else {
        console.warn('   ⚠️ 相机没有有效的THREE.js相机对象')
      }
    } else {
      this._activeCamera = null
      console.log('   📷 清除当前相机')
    }

    console.log('   🎥 相机设置完成')
  }

  /**
   * 获取当前活动的相机
   * @returns 当前活动的Camera3D节点
   */
  getCurrentCamera(): any {
    return this._currentQAQCamera
  }

  /**
   * 获取当前活动的THREE.js相机
   * @returns 当前活动的THREE.js相机
   */
  getActiveThreeCamera(): THREE.Camera | null {
    return this._activeCamera
  }

  /**
   * 获取场景树管理器
   * @returns SceneTree实例
   */
  getSceneTree(): SceneTree {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }
    return this._sceneTree
  }

  /**
   * 预加载场景
   * @param scenePath 场景路径
   * @returns 预加载的场景
   */
  async preloadScene(scenePath: string): Promise<Scene> {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }
    return await this._sceneTree.preloadScene(scenePath)
  }

  /**
   * 批量预加载场景
   * @param scenePaths 场景路径数组
   * @param onProgress 进度回调
   * @returns 预加载的场景数组
   */
  async preloadScenes(
    scenePaths: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Scene[]> {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }
    return await this._sceneTree.preloadScenes(scenePaths, onProgress)
  }

  /**
   * 返回到上一个场景
   * @param options 切换选项
   * @returns 返回的场景
   */
  async goBackScene(options?: SceneChangeOptions): Promise<Scene | null> {
    if (!this._sceneTree) {
      throw new Error('Scene system not initialized')
    }

    const previousScene = await this._sceneTree.goBack(options)

    if (previousScene) {
      // 更新当前场景引用
      if (this._currentQAQScene && this._rootNode) {
        this._rootNode.remove(this._currentQAQScene.object3D)
      }

      this._currentQAQScene = previousScene

      if (this._rootNode && previousScene.object3D) {
        this._rootNode.add(previousScene.object3D)
      }
    }

    return previousScene
  }

  // ========================================================================
  // 私有方法 - 渲染循环
  // ========================================================================

  /**
   * 启动渲染循环
   */
  private _startRenderLoop(): void {
    if (this._isRendering) return

    this._isRendering = true
    this._renderLoop()
  }

  /**
   * 渲染循环主函数
   */
  private _renderLoop = (): void => {
    if (!this._isRendering) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this._lastFrameTime) / 1000
    this._lastFrameTime = currentTime

    // 更新FPS计算
    this._updateFPS(currentTime)

    // 发送帧更新事件
    this._emitEvent('frame_update', { deltaTime, currentTime })

    // 执行渲染
    this.renderFrame()
    // 请求下一帧
    this._renderLoopId = requestAnimationFrame(this._renderLoop)
  }

  /**
   * 更新FPS计算
   */
  private _updateFPS(currentTime: number): void {
    this._frameCount++

    if (currentTime - this._fpsUpdateTime >= 1000) {
      this._currentFPS = this._frameCount
      this._frameCount = 0
      this._fpsUpdateTime = currentTime

      this._emitEvent('fps_updated', { fps: this._currentFPS })
    }
  }

  // ========================================================================
  // 私有方法 - 事件处理
  // ========================================================================

  /**
   * 鼠标移动事件处理
   */
  private _onMouseMove(event: MouseEvent): void {
    const rect = this._canvas!.getBoundingClientRect()
    this._mousePosition.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )

    this._emitEvent('mouse_move', {
      position: this._mousePosition,
      originalEvent: event
    })
  }

  /**
   * 鼠标按下事件处理
   */
  private _onMouseDown(event: MouseEvent): void {
    this._emitEvent('mouse_down', {
      position: this._mousePosition,
      button: event.button,
      originalEvent: event
    })
  }

  /**
   * 鼠标抬起事件处理
   */
  private _onMouseUp(event: MouseEvent): void {
    this._emitEvent('mouse_up', {
      position: this._mousePosition,
      button: event.button,
      originalEvent: event
    })
  }

  /**
   * 鼠标点击事件处理
   */
  private _onClick(event: MouseEvent): void {
    // 执行射线检测
    const intersects = this._performRaycast()

    this._emitEvent('mouse_click', {
      position: this._mousePosition,
      intersects,
      originalEvent: event
    })
  }

  /**
   * 窗口尺寸变化事件处理
   */
  private _onWindowResize(): void {
    if (!this._renderer || !this._container) return

    const width = this._container.clientWidth
    const height = this._container.clientHeight
    const aspect = width / height

    // 更新渲染器尺寸
    this._renderer.setSize(width, height)

    // 更新3D相机
    if (this._camera3D) {
      this._camera3D.aspect = aspect
      this._camera3D.updateProjectionMatrix()
    }

    // 更新2D相机 - 保持左上角原点坐标系
    if (this._camera2D) {
      this._camera2D.left = 0
      this._camera2D.right = width
      this._camera2D.top = height
      this._camera2D.bottom = 0
      this._camera2D.position.set(0, 0, 500)
      this._camera2D.updateProjectionMatrix()
    }

    this._emitEvent('window_resize', { width, height, aspect })
  }

  /**
   * 执行射线检测
   */
  private _performRaycast(): THREE.Intersection[] {
    if (!this._raycaster || !this._activeCamera || !this._scene) {
      return []
    }

    this._raycaster.setFromCamera(this._mousePosition, this._activeCamera)
    return this._raycaster.intersectObjects(this._scene.children, true)
  }

  // ========================================================================
  // 私有方法 - 事件系统
  // ========================================================================

  /**
   * 发送事件
   */
  private _emitEvent(eventName: string, data?: any): void {
    const listeners = this._eventListeners.get(eventName)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error)
        }
      })
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventName: string, listener: Function): void {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, [])
    }
    this._eventListeners.get(eventName)!.push(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventName: string, listener: Function): void {
    const listeners = this._eventListeners.get(eventName)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // ========================================================================
  // 公共API - 工具方法
  // ========================================================================

  /**
   * 获取渲染统计信息
   */
  getRenderStats(): RenderStats {
    const info = this._renderer?.info
    return {
      fps: this._currentFPS,
      drawCalls: info?.render.calls || 0,
      triangles: info?.render.triangles || 0,
      geometries: info?.memory.geometries || 0,
      textures: info?.memory.textures || 0,
      memory: {
        geometries: info?.memory.geometries || 0,
        textures: info?.memory.textures || 0
      }
    }
  }

  /**
   * 获取引擎状态
   */
  getState(): EngineState {
    return this._state
  }

  /**
   * 获取当前FPS
   */
  getFPS(): number {
    return this._currentFPS
  }

  /**
   * 清除所有数据和资源
   */
  async clearAllData(onProgress?: (progress: number, message: string) => void): Promise<void> {
    console.log('🧹 开始清除引擎数据...')

    try {
      onProgress?.(0, '停止渲染循环...')

      // 停止渲染循环
      if (this._state === EngineState.RUNNING) {
        this.stopRendering()
      }

      onProgress?.(20, '清理场景数据...')

      // 清理当前QAQ场景
      if (this._currentQAQScene) {
        this.clearSceneRecursive(this._currentQAQScene)
        this._currentQAQScene = null
      }

      // 清理Three.js场景
      if (this._scene) {
        this.clearThreeScene(this._scene)
      }

      onProgress?.(40, '清理渲染器资源...')

      // 清理渲染器资源
      if (this._renderer) {
        this.clearRendererResources()
      }

      onProgress?.(60, '重置动画系统...')

      // 重置动画系统
      this.resetAnimationSystem()

      onProgress?.(80, '重置脚本系统...')

      // 重置脚本系统
      this.resetScriptSystem()

      onProgress?.(90, '清理内存...')

      // 清理测试对象
      this._cleanupTestObjects()

      // 重置根节点
      if (this._rootNode) {
        this._rootNode.clear()
        this._rootNode = null
      }

      // 强制垃圾回收（如果可用）
      if (typeof (window as any).gc === 'function') {
        (window as any).gc()
      }

      onProgress?.(100, '清理完成')

      console.log('✅ 引擎数据清理完成')

    } catch (error) {
      console.error('❌ 清理引擎数据失败:', error)
      throw error
    }
  }

  /**
   * 递归清理场景节点
   */
  private clearSceneRecursive(node: any): void {
    if (!node) return

    // 清理子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of [...node.children]) {
        this.clearSceneRecursive(child)
      }
      node.children.length = 0
    }

    // 清理Three.js对象
    if (node.object3D) {
      this.disposeObject3D(node.object3D)
      node.object3D = null
    }

    // 清理材质
    if (node.material) {
      this.disposeMaterial(node.material)
      node.material = null
    }

    // 清理几何体
    if (node.geometry) {
      node.geometry.dispose()
      node.geometry = null
    }

    // 清理纹理
    if (node.texture) {
      node.texture.dispose()
      node.texture = null
    }

    // 清理动画混合器
    if (node.mixer) {
      node.mixer.stopAllAction()
      node.mixer = null
    }
  }

  /**
   * 清理Three.js场景
   */
  private clearThreeScene(scene: THREE.Scene): void {
    // 递归清理所有对象
    const objectsToRemove = [...scene.children]
    for (const object of objectsToRemove) {
      this.disposeObject3D(object)
      scene.remove(object)
    }
  }

  /**
   * 清理渲染器资源
   */
  private clearRendererResources(): void {
    if (!this._renderer) return

    // 清理渲染目标
    this._renderer.setRenderTarget(null)

    // 清理渲染器信息
    this._renderer.info.reset()

    // 清理WebGL上下文资源
    const gl = this._renderer.getContext()
    if (gl) {
      const numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
      for (let unit = 0; unit < numTextureUnits; ++unit) {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
      gl.bindRenderbuffer(gl.RENDERBUFFER, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
  }

  /**
   * 释放Three.js Object3D资源
   */
  private disposeObject3D(object: any): void {
    if (!object) return

    // 递归处理子对象
    if (object.children) {
      for (const child of [...object.children]) {
        this.disposeObject3D(child)
      }
    }

    // 释放几何体
    if (object.geometry) {
      object.geometry.dispose()
    }

    // 释放材质
    if (object.material) {
      this.disposeMaterial(object.material)
    }

    // 从父对象移除
    if (object.parent) {
      object.parent.remove(object)
    }
  }

  /**
   * 释放材质资源
   */
  private disposeMaterial(material: any): void {
    if (!material) return

    if (Array.isArray(material)) {
      for (const mat of material) {
        this.disposeMaterial(mat)
      }
      return
    }

    // 释放纹理
    for (const key in material) {
      const value = material[key]
      if (value && typeof value.dispose === 'function') {
        value.dispose()
      }
    }

    // 释放材质本身
    if (typeof material.dispose === 'function') {
      material.dispose()
    }
  }

  /**
   * 重置动画系统
   */
  private resetAnimationSystem(): void {
    // 清理全局动画混合器列表（如果存在）
    if ((window as any).animationMixers) {
      for (const mixer of (window as any).animationMixers) {
        mixer.stopAllAction()
      }
      (window as any).animationMixers = []
    }

    // 重置动画播放器
    if ((window as any).animationPlayer) {
      (window as any).animationPlayer = null
    }

    // 重置状态机
    if ((window as any).stateMachine) {
      (window as any).stateMachine = null
    }
  }

  /**
   * 重置脚本系统
   */
  private resetScriptSystem(): void {
    // 清理脚本管理器
    if ((window as any).scriptManager) {
      (window as any).scriptManager = null
    }

    // 清理全局脚本引用
    const globalKeys = ['characterController', 'animationCycler']
    for (const key of globalKeys) {
      if ((window as any)[key]) {
        (window as any)[key] = null
      }
    }
  }

  /**
   * 加载项目数据
   */
  async loadProjectData(
    projectData: any,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      onProgress?.(0, '开始加载项目数据...')

      // 1. 验证项目数据
      onProgress?.(10, '验证项目数据...')
      if (!projectData || !projectData.metadata) {
        throw new Error('无效的项目数据')
      }

      // 2. 清除当前数据
      onProgress?.(20, '清除当前数据...')
      await this.clearAllData()

      // 3. 恢复引擎状态
      onProgress?.(30, '恢复引擎状态...')
      if (projectData.engineState) {
        await this.restoreEngineState(projectData.engineState)
      }

      // 4. 恢复场景树
      onProgress?.(50, '恢复场景树...')
      if (projectData.sceneTree) {
        await this.restoreSceneTree(projectData.sceneTree)
      }

      // 5. 恢复脚本系统
      onProgress?.(70, '恢复脚本系统...')
      if (projectData.scriptSystem) {
        await this.restoreScriptSystem(projectData.scriptSystem)
      }

      // 6. 恢复动画系统
      onProgress?.(80, '恢复动画系统...')
      if (projectData.animationSystem) {
        await this.restoreAnimationSystem(projectData.animationSystem)
      }

      // 7. 加载资源
      onProgress?.(90, '加载项目资源...')
      if (projectData.resourceManifest) {
        await this.loadProjectResources(projectData.resourceManifest)
      }

      // 8. 重新启动渲染
      onProgress?.(95, '重新启动渲染...')
      if (this._state !== 'RUNNING') {
        this.startRendering()
      }

      onProgress?.(100, '项目加载完成')
      console.log('✅ 项目数据加载完成')

    } catch (error) {
      console.error('❌ 项目数据加载失败:', error)

      // 错误回滚机制
      try {
        await this.clearAllData()
        console.log('🔄 已回滚到清空状态')
      } catch (rollbackError) {
        console.error('❌ 回滚失败:', rollbackError)
      }

      throw error
    }
  }

  /**
   * 恢复引擎状态
   */
  private async restoreEngineState(engineState: any): Promise<void> {
    try {
      // 恢复画布尺寸
      if (engineState.config && this._canvas) {
        this._canvas.width = engineState.config.width || 800
        this._canvas.height = engineState.config.height || 600

        // 更新渲染器尺寸
        if (this._renderer) {
          this._renderer.setSize(this._canvas.width, this._canvas.height)
        }
      }

      // 恢复渲染器设置
      if (engineState.config && this._renderer) {
        // 设置背景色
        if (typeof engineState.config.backgroundColor === 'number') {
          this._scene.background = new (window as any).THREE.Color(engineState.config.backgroundColor)
        }

        // 设置阴影
        if (engineState.config.enableShadows) {
          this._renderer.shadowMap.enabled = true
          this._renderer.shadowMap.type = (window as any).THREE.PCFSoftShadowMap
        }
      }

      console.log('✅ 引擎状态恢复完成')
    } catch (error) {
      console.error('❌ 引擎状态恢复失败:', error)
      throw error
    }
  }

  /**
   * 恢复场景树
   */
  private async restoreSceneTree(sceneTree: any): Promise<void> {
    try {
      if (!sceneTree.currentScene || !sceneTree.scenes) {
        return
      }

      const currentSceneName = sceneTree.currentScene
      const sceneData = sceneTree.scenes[currentSceneName]

      if (!sceneData) {
        throw new Error(`场景数据不存在: ${currentSceneName}`)
      }

      // 使用Node的反序列化方法恢复场景
      const Scene = (await import('../scene/Scene')).default
      const Node = (await import('../nodes/Node')).default

      const restoredScene = Node.deserialize(sceneData, Scene)

      // 设置为当前场景
      this._currentQAQScene = restoredScene

      // 将场景添加到Three.js场景中
      if (restoredScene.object3D) {
        this._scene.add(restoredScene.object3D)
      }

      console.log('✅ 场景树恢复完成')
    } catch (error) {
      console.error('❌ 场景树恢复失败:', error)
      throw error
    }
  }

  /**
   * 恢复脚本系统
   */
  private async restoreScriptSystem(scriptSystem: any): Promise<void> {
    try {
      // 恢复注册的脚本类
      if (scriptSystem.registeredClasses) {
        for (const [className, classData] of Object.entries(scriptSystem.registeredClasses)) {
          // 这里需要根据实际的脚本系统实现来恢复脚本类
          console.log(`恢复脚本类: ${className}`)
        }
      }

      // 恢复脚本实例
      if (scriptSystem.scriptInstances) {
        for (const [instanceId, instanceData] of Object.entries(scriptSystem.scriptInstances)) {
          // 这里需要根据实际的脚本系统实现来恢复脚本实例
          console.log(`恢复脚本实例: ${instanceId}`)
        }
      }

      console.log('✅ 脚本系统恢复完成')
    } catch (error) {
      console.error('❌ 脚本系统恢复失败:', error)
      throw error
    }
  }

  /**
   * 恢复动画系统
   */
  private async restoreAnimationSystem(animationSystem: any): Promise<void> {
    try {
      // 恢复状态机
      if (animationSystem.stateMachines) {
        for (const [smId, smData] of Object.entries(animationSystem.stateMachines)) {
          // 这里需要根据实际的动画系统实现来恢复状态机
          console.log(`恢复状态机: ${smId}`)
        }
      }

      // 恢复动画播放器
      if (animationSystem.animationPlayers) {
        for (const [playerId, playerData] of Object.entries(animationSystem.animationPlayers)) {
          // 这里需要根据实际的动画系统实现来恢复动画播放器
          console.log(`恢复动画播放器: ${playerId}`)
        }
      }

      console.log('✅ 动画系统恢复完成')
    } catch (error) {
      console.error('❌ 动画系统恢复失败:', error)
      throw error
    }
  }

  /**
   * 加载项目资源
   */
  private async loadProjectResources(resourceManifest: any): Promise<void> {
    try {
      // 导入ResourceManager
      const { default: ResourceManager } = await import('../resources/ResourceManager')
      const resourceManager = ResourceManager.getInstance()

      // 设置资源清单
      resourceManager.setManifest(resourceManifest)

      // 验证资源完整性
      const validation = await resourceManager.validateResources()

      if (validation.missing.length > 0) {
        console.warn(`⚠️ 发现 ${validation.missing.length} 个缺失资源`)
      }

      if (validation.corrupted.length > 0) {
        console.warn(`⚠️ 发现 ${validation.corrupted.length} 个损坏资源`)
      }

      // 预加载关键资源
      const criticalResources = Object.keys(resourceManifest.resources).slice(0, 5)
      if (criticalResources.length > 0) {
        await resourceManager.preloadResources(criticalResources)
      }

      console.log('✅ 项目资源加载完成')
    } catch (error) {
      console.error('❌ 项目资源加载失败:', error)
      throw error
    }
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    // 停止渲染循环
    this.stopRendering()

    // 清理事件监听器
    if (this._canvas) {
      this._canvas.removeEventListener('mousemove', this._onMouseMove)
      this._canvas.removeEventListener('mousedown', this._onMouseDown)
      this._canvas.removeEventListener('mouseup', this._onMouseUp)
      this._canvas.removeEventListener('click', this._onClick)
    }

    window.removeEventListener('resize', this._onWindowResize)

    // 清理场景系统
    if (this._sceneTree) {
      this._sceneTree.unloadAll().catch(error => {
        console.error('Error unloading scenes during destroy:', error)
      })
      this._sceneTree.destroy().catch(error => {
        console.error('Error destroying SceneTree:', error)
      })
      this._sceneTree = null
    }

    this._currentQAQScene = null
    this._rootNode = null

    // 清理测试对象
    this._cleanupTestObjects()

    // 清理Three.js资源
    if (this._renderer) {
      this._renderer.dispose()
    }

    if (this._scene) {
      this._scene.clear()
    }

    // 从容器中移除画布
    if (this._canvas && this._container) {
      this._container.removeChild(this._canvas)
    }

    // 重置状态
    this._state = EngineState.DESTROYED
    this._eventListeners.clear()

    // 清除单例引用
    Engine._instance = null

    this._emitEvent('engine_destroyed')
    console.log('🗑️ QAQ Game Engine destroyed')
  }

  // ========================================================================
  // 私有方法 - 调试和测试
  // ========================================================================

  /**
   * 创建测试对象 - 立方体和轨道控制器
   * 用于验证渲染管道是否正常工作
   */
  private _createTestObjects(): void {
    try {
      console.log('🎲 创建测试立方体和轨道控制器...')

      // 创建测试立方体
      const geometry = new THREE.BoxGeometry(100, 100, 100)
      const material = new THREE.MeshBasicMaterial({
        color: 0xff6b35,  // 橙色
        wireframe: false
      })
      this._testCube = new THREE.Mesh(geometry, material)
      this._testCube.position.set(0, 0, 0)
      this._testCube.name = 'EngineTestCube'

      // 添加到3D层
      if (this._layer3D) {
        this._layer3D.add(this._testCube)
        console.log('✅ 测试立方体已添加到3D层')
      }

      // 创建轨道控制器
      if (this._camera3D && this._canvas) {
        this._orbitControls = new OrbitControls(this._camera3D, this._canvas)
        this._orbitControls.enableDamping = true
        this._orbitControls.dampingFactor = 0.05
        this._orbitControls.enableZoom = true
        this._orbitControls.enableRotate = true
        this._orbitControls.enablePan = true

        // 设置控制器限制
        this._orbitControls.maxDistance = 1000
        this._orbitControls.minDistance = 50

        console.log('✅ 轨道控制器已创建')
      }

      // 设置3D相机位置
      if (this._camera3D) {
        this._camera3D.position.set(200, 200, 200)
        this._camera3D.lookAt(0, 0, 0)
        console.log('✅ 3D相机位置已设置')
      }

      // 启动测试立方体动画
      this._startTestCubeAnimation()

      console.log('🎉 测试对象创建完成')

    } catch (error) {
      console.error('❌ 创建测试对象失败:', error)
    }
  }

  /**
   * 启动测试立方体旋转动画
   */
  private _startTestCubeAnimation(): void {
    if (!this._testCube) return

    const animate = () => {
      if (this._testCube) {
        this._testCube.rotation.x += 0.01
        this._testCube.rotation.y += 0.01
      }

      // 更新轨道控制器
      if (this._orbitControls) {
        this._orbitControls.update()
      }

      this._testCubeAnimationId = requestAnimationFrame(animate)
    }

    animate()
    console.log('✅ 测试立方体动画已启动')
  }

  /**
   * 停止测试立方体动画
   */
  private _stopTestCubeAnimation(): void {
    if (this._testCubeAnimationId) {
      cancelAnimationFrame(this._testCubeAnimationId)
      this._testCubeAnimationId = null
      console.log('⏹️ 测试立方体动画已停止')
    }
  }

  /**
   * 清理测试对象
   */
  private _cleanupTestObjects(): void {
    try {
      // 停止动画
      this._stopTestCubeAnimation()

      // 清理测试立方体
      if (this._testCube && this._layer3D) {
        this._layer3D.remove(this._testCube)
        this._testCube.geometry.dispose()
        if (this._testCube.material instanceof THREE.Material) {
          this._testCube.material.dispose()
        }
        this._testCube = null
        console.log('🧹 测试立方体已清理')
      }

      // 清理轨道控制器
      if (this._orbitControls) {
        this._orbitControls.dispose()
        this._orbitControls = null
        console.log('🧹 轨道控制器已清理')
      }

    } catch (error) {
      console.error('❌ 清理测试对象失败:', error)
    }
  }

  /**
   * 公共方法：移除测试对象
   * 允许外部代码清理测试对象
   */
  public removeTestObjects(): void {
    this._cleanupTestObjects()
  }

  /**
   * 公共方法：获取测试立方体
   */
  public getTestCube(): THREE.Mesh | null {
    return this._testCube
  }

  /**
   * 公共方法：获取轨道控制器
   */
  public getOrbitControls(): OrbitControls | null {
    return this._orbitControls
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Engine
