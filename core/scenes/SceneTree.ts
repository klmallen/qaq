/**
 * QAQ 游戏引擎场景树管理器
 * 提供场景树的管理、更新和渲染功能
 * 类似于 Godot 的 SceneTree 类
 */

import Node from '../nodes/Node'
import Node3D from '../nodes/Node3D'
import QaqObject from '../object/QaqObject'
import * as THREE from 'three'

// ============================================================================
// 场景树配置接口
// ============================================================================

export interface SceneTreeConfig {
  autoAcceptQuit: boolean
  debugCollisionsHint: boolean
  debugNavigationHint: boolean
  editedSceneRoot: Node | null
  multiplayer: any // TODO: 实现多人游戏系统
  paused: boolean
  physicsInterpolation: boolean
  quitOnGoBack: boolean
}

// ============================================================================
// 场景树类
// ============================================================================

export class SceneTree extends QaqObject {
  private _root: Node | null = null
  private _currentScene: Node | null = null
  private _config: SceneTreeConfig
  private _isRunning: boolean = false
  private _frameCount: number = 0
  private _lastFrameTime: number = 0
  private _deltaTime: number = 0
  private _timeScale: number = 1.0
  
  // Three.js 渲染相关
  private _threeScene: THREE.Scene
  private _threeRenderer: THREE.WebGLRenderer | null = null
  private _threeCamera: THREE.Camera | null = null
  
  // 节点组管理
  private _groups: Map<string, Set<Node>> = new Map()
  
  // 处理队列
  private _processQueue: Node[] = []
  private _physicsProcessQueue: Node[] = []

  constructor() {
    super('SceneTree')
    
    this._config = {
      autoAcceptQuit: true,
      debugCollisionsHint: false,
      debugNavigationHint: false,
      editedSceneRoot: null,
      multiplayer: null,
      paused: false,
      physicsInterpolation: false,
      quitOnGoBack: true
    }

    this._threeScene = new THREE.Scene()
    this._threeScene.name = 'QAQ Scene'
    
    this.initializeSceneTreeSignals()
    this.initializeSceneTreeProperties()
  }

  // ========================================================================
  // 基础属性
  // ========================================================================

  get root(): Node | null {
    return this._root
  }

  get currentScene(): Node | null {
    return this._currentScene
  }

  get config(): Readonly<SceneTreeConfig> {
    return this._config
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get frameCount(): number {
    return this._frameCount
  }

  get deltaTime(): number {
    return this._deltaTime
  }

  get timeScale(): number {
    return this._timeScale
  }

  set timeScale(value: number) {
    this._timeScale = Math.max(0, value)
  }

  get paused(): boolean {
    return this._config.paused
  }

  set paused(value: boolean) {
    if (this._config.paused !== value) {
      this._config.paused = value
      this.emit('paused_changed', value)
    }
  }

  // ========================================================================
  // Three.js 集成
  // ========================================================================

  get threeScene(): THREE.Scene {
    return this._threeScene
  }

  get threeRenderer(): THREE.WebGLRenderer | null {
    return this._threeRenderer
  }

  set threeRenderer(renderer: THREE.WebGLRenderer | null) {
    this._threeRenderer = renderer
  }

  get threeCamera(): THREE.Camera | null {
    return this._threeCamera
  }

  set threeCamera(camera: THREE.Camera | null) {
    this._threeCamera = camera
  }

  // ========================================================================
  // 场景管理
  // ========================================================================

  setRoot(node: Node): void {
    if (this._root) {
      this._root._exitTree()
      if (this._root instanceof Node3D) {
        this._threeScene.remove(this._root.threeObject)
      }
    }

    this._root = node
    
    if (this._root) {
      this._root._enterTree()
      if (this._root instanceof Node3D) {
        this._threeScene.add(this._root.threeObject)
      }
    }

    this.emit('root_changed', this._root)
  }

  changeScene(scene: Node): void {
    if (this._currentScene) {
      this._currentScene._exitTree()
      if (this._currentScene instanceof Node3D) {
        this._threeScene.remove(this._currentScene.threeObject)
      }
    }

    this._currentScene = scene
    
    if (this._currentScene) {
      this._currentScene._enterTree()
      if (this._currentScene instanceof Node3D) {
        this._threeScene.add(this._currentScene.threeObject)
      }
    }

    this.emit('scene_changed', this._currentScene)
  }

  reloadCurrentScene(): void {
    if (this._currentScene) {
      const sceneCopy = this._currentScene // TODO: 实现场景克隆
      this.changeScene(sceneCopy)
    }
  }

  quit(exitCode: number = 0): void {
    this._isRunning = false
    this.emit('quit_requested', exitCode)
  }

  // ========================================================================
  // 节点组管理
  // ========================================================================

  addToGroup(node: Node, groupName: string): void {
    if (!this._groups.has(groupName)) {
      this._groups.set(groupName, new Set())
    }
    
    const group = this._groups.get(groupName)!
    group.add(node)
    
    this.emit('node_added_to_group', node, groupName)
  }

  removeFromGroup(node: Node, groupName: string): void {
    const group = this._groups.get(groupName)
    if (group && group.has(node)) {
      group.delete(node)
      
      // 如果组为空，删除组
      if (group.size === 0) {
        this._groups.delete(groupName)
      }
      
      this.emit('node_removed_from_group', node, groupName)
    }
  }

  getNodesInGroup(groupName: string): Node[] {
    const group = this._groups.get(groupName)
    return group ? Array.from(group) : []
  }

  hasGroup(groupName: string): boolean {
    return this._groups.has(groupName)
  }

  getGroupList(): string[] {
    return Array.from(this._groups.keys())
  }

  // ========================================================================
  // 节点查找
  // ========================================================================

  getFirstNodeInGroup(groupName: string): Node | null {
    const group = this._groups.get(groupName)
    if (group && group.size > 0) {
      return group.values().next().value
    }
    return null
  }

  findNode(path: string): Node | null {
    if (!this._root) return null
    return this._root.getNode(path)
  }

  findNodesByType<T extends Node>(nodeClass: new (...args: any[]) => T): T[] {
    const results: T[] = []
    if (this._root) {
      this._findNodesByTypeRecursive(this._root, nodeClass, results)
    }
    return results
  }

  findNodesByName(name: string): Node[] {
    const results: Node[] = []
    if (this._root) {
      this._findNodesByNameRecursive(this._root, name, results)
    }
    return results
  }

  // ========================================================================
  // 生命周期管理
  // ========================================================================

  start(): void {
    if (this._isRunning) return
    
    this._isRunning = true
    this._lastFrameTime = performance.now()
    this.emit('started')
    
    // 开始主循环
    this._mainLoop()
  }

  stop(): void {
    if (!this._isRunning) return
    
    this._isRunning = false
    this.emit('stopped')
  }

  private _mainLoop(): void {
    if (!this._isRunning) return

    const currentTime = performance.now()
    this._deltaTime = (currentTime - this._lastFrameTime) / 1000 * this._timeScale
    this._lastFrameTime = currentTime
    this._frameCount++

    // 处理输入
    this._processInput()

    // 更新物理
    if (!this._config.paused) {
      this._physicsProcess(this._deltaTime)
    }

    // 更新逻辑
    if (!this._config.paused) {
      this._process(this._deltaTime)
    }

    // 渲染
    this._render()

    // 发射帧更新信号
    this.emit('frame_updated', this._deltaTime)

    // 继续下一帧
    requestAnimationFrame(() => this._mainLoop())
  }

  private _processInput(): void {
    // TODO: 实现输入处理
    this.emit('input_processed')
  }

  private _process(delta: number): void {
    if (this._root) {
      this._root._process(delta)
    }
    this.emit('process_frame', delta)
  }

  private _physicsProcess(delta: number): void {
    if (this._root) {
      this._root._physicsProcess(delta)
    }
    this.emit('physics_frame', delta)
  }

  private _render(): void {
    if (this._threeRenderer && this._threeCamera) {
      this._threeRenderer.render(this._threeScene, this._threeCamera)
    }
    this.emit('render_frame')
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  private _findNodesByTypeRecursive<T extends Node>(
    node: Node, 
    nodeClass: new (...args: any[]) => T, 
    results: T[]
  ): void {
    if (node instanceof nodeClass) {
      results.push(node)
    }

    for (const child of node.children) {
      this._findNodesByTypeRecursive(child, nodeClass, results)
    }
  }

  private _findNodesByNameRecursive(node: Node, name: string, results: Node[]): void {
    if (node.name === name) {
      results.push(node)
    }

    for (const child of node.children) {
      this._findNodesByNameRecursive(child, name, results)
    }
  }

  // ========================================================================
  // 信号和属性初始化
  // ========================================================================

  protected initializeSceneTreeSignals(): void {
    this.addSignal('started')
    this.addSignal('stopped')
    this.addSignal('paused_changed')
    this.addSignal('root_changed')
    this.addSignal('scene_changed')
    this.addSignal('quit_requested')
    this.addSignal('node_added_to_group')
    this.addSignal('node_removed_from_group')
    this.addSignal('frame_updated')
    this.addSignal('process_frame')
    this.addSignal('physics_frame')
    this.addSignal('render_frame')
    this.addSignal('input_processed')
  }

  protected initializeSceneTreeProperties(): void {
    this.addProperty({ name: 'paused', type: 'bool', usage: 1 }, this._config.paused)
    this.addProperty({ name: 'time_scale', type: 'float', usage: 1 }, this._timeScale)
    this.addProperty({ name: 'auto_accept_quit', type: 'bool', usage: 1 }, this._config.autoAcceptQuit)
    this.addProperty({ name: 'debug_collisions_hint', type: 'bool', usage: 1 }, this._config.debugCollisionsHint)
    this.addProperty({ name: 'debug_navigation_hint', type: 'bool', usage: 1 }, this._config.debugNavigationHint)
    this.addProperty({ name: 'physics_interpolation', type: 'bool', usage: 1 }, this._config.physicsInterpolation)
    this.addProperty({ name: 'quit_on_go_back', type: 'bool', usage: 1 }, this._config.quitOnGoBack)
  }

  // ========================================================================
  // 销毁方法
  // ========================================================================

  destroy(): void {
    this.stop()
    
    if (this._root) {
      this._root.destroy()
      this._root = null
    }

    if (this._currentScene) {
      this._currentScene.destroy()
      this._currentScene = null
    }

    this._groups.clear()
    this._processQueue = []
    this._physicsProcessQueue = []

    // 清理 Three.js 资源
    this._threeScene.clear()

    super.destroy()
  }
}

export default SceneTree
