/**
 * QAQ编辑器引擎桥接器 (重构版)
 *
 * 功能：
 * - 统一管理编辑器和引擎的场景系统
 * - 提供编辑器专用的引擎操作接口
 * - 处理编辑器模式和运行时模式的切换
 * - 事件驱动的状态同步，消除每帧更新
 * - 与响应式编辑器状态系统集成
 */

import Engine from '../engine/Engine'
import { Scene } from '../scene/Scene'
import Node from '../nodes/Node'
import Node3D from '../nodes/Node3D'
import Camera3D from '../nodes/3d/Camera3D'
import { SceneTree } from '../scene/SceneTree'
import { getEditorEventBus, type EditorEventBus } from './EditorEventBus'
import { getReactiveEditorState, type ReactiveEditorState } from './ReactiveEditorState'

export interface EditorEngineConfig {
  container: HTMLElement
  width?: number
  height?: number
  enableGrid?: boolean
  enableGizmos?: boolean
}

export interface EditorNodeInfo {
  id: string
  name: string
  type: string
  node: Node
  visible: boolean
  locked: boolean
}

/**
 * 编辑器引擎桥接器
 */
export class EditorEngineBridge {
  private _engine: Engine | null = null
  private _currentScene: Scene | null = null
  private _sceneTree: SceneTree | null = null
  private _selectedNodes: Set<string> = new Set()
  private _editorCamera: Camera3D | null = null
  private _isInitialized: boolean = false

  // 编辑器专用节点
  private _gridHelper: Node3D | null = null
  private _gizmos: Node3D | null = null

  // 响应式系统
  private _eventBus: EditorEventBus
  private _editorState: ReactiveEditorState

  // 事件回调 (保持向后兼容)
  private _onSelectionChanged?: (nodeIds: string[]) => void
  private _onSceneChanged?: (scene: Scene | null) => void
  private _onNodeAdded?: (node: Node, parent: Node) => void
  private _onNodeRemoved?: (node: Node, parent: Node) => void

  constructor() {
    // 初始化响应式系统
    this._eventBus = getEditorEventBus()
    this._editorState = getReactiveEditorState()

    // 设置引擎事件监听
    this.setupEngineEventListeners()
  }

  /**
   * 设置引擎事件监听器
   */
  private setupEngineEventListeners(): void {
    // 监听引擎帧更新事件，但只在需要时处理
    // 这里不再每帧都更新编辑器UI
  }

  /**
   * 初始化编辑器引擎
   */
  async initialize(config: EditorEngineConfig): Promise<void> {
    if (this._isInitialized) {
      console.warn('⚠️ 编辑器引擎已经初始化')
      return
    }

    try {
      // 获取引擎单例实例
      this._engine = Engine.getInstance()

      // 初始化引擎
      await this._engine.initialize({
        container: config.container,
        width: config.width,
        height: config.height,
        antialias: true,
        backgroundColor: 0x2a2a2a,
        enableShadows: true
      })

      // 创建编辑器相机
      this._editorCamera = new Camera3D('EditorCamera')
      this._editorCamera.position = { x: 5, y: 5, z: 5 }
      this._editorCamera.lookAt({ x: 0, y: 0, z: 0 })

      // 设置为当前相机
      this._engine.setCurrentCamera(this._editorCamera)

      // 创建编辑器辅助对象
      if (config.enableGrid) {
        await this.createGridHelper()
      }

      if (config.enableGizmos) {
        await this.createGizmos()
      }

      this._isInitialized = true
      console.log('✅ 编辑器引擎初始化完成')

    } catch (error) {
      console.error('❌ 编辑器引擎初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建新场景
   */
  async createNewScene(name: string): Promise<Scene> {
    if (!this._engine) {
      throw new Error('引擎未初始化')
    }

    try {
      console.log(`🌳 开始创建新场景: ${name}`)

      // 创建新场景
      const scene = new Scene(name)

      // 获取场景树实例并设置场景
      const sceneTree = SceneTree.getInstance()
      await sceneTree.changeScene(scene)

      // 设置为当前场景
      this._currentScene = scene
      this._sceneTree = sceneTree

      // 确保引擎知道当前场景
      console.log('🔄 同步场景到引擎...')

      // 添加编辑器相机到场景
      if (this._editorCamera) {
        scene.addChild(this._editorCamera)
        console.log('📷 编辑器相机已添加到场景')
      }

      // 添加一些默认的编辑器辅助对象
      await this.setupEditorHelpers(scene)

      // 设置编辑器环境
      await this.setupEditorEnvironment(scene)

      // 触发场景变更事件 (向后兼容)
      this._onSceneChanged?.(scene)

      // 发送新的事件系统通知
      this._eventBus.emit('scene:loaded', {
        scene: scene.name,
        nodeCount: scene.children.length
      }, 'bridge')

      console.log(`✅ 场景创建完成: ${name}`)
      console.log(`   - 场景节点数: ${scene.children.length}`)
      console.log(`   - 引擎当前场景: ${this._engine.getCurrentScene()?.name}`)

      return scene

    } catch (error) {
      console.error('❌ 创建场景失败:', error)
      throw error
    }
  }

  /**
   * 设置编辑器辅助对象
   */
  private async setupEditorHelpers(scene: Scene): Promise<void> {
    try {
      // 添加网格辅助器
      if (!this._gridHelper) {
        await this.createGridHelper()
        if (this._gridHelper) {
          scene.addChild(this._gridHelper)
          console.log('🔲 网格辅助器已添加')
        }
      }

      // 添加变换控制器辅助对象
      if (!this._gizmos) {
        await this.createGizmos()
        if (this._gizmos) {
          scene.addChild(this._gizmos)
          console.log('🎯 变换控制器已添加')
        }
      }

    } catch (error) {
      console.error('❌ 设置编辑器辅助对象失败:', error)
    }
  }

  /**
   * 加载场景
   */
  async loadScene(scenePath: string): Promise<Scene> {
    if (!this._engine) {
      throw new Error('引擎未初始化')
    }

    try {
      // TODO: 实现场景加载逻辑
      // 这里需要与场景序列化系统集成
      console.log(`🔄 加载场景: ${scenePath}`)
      
      // 临时创建一个场景作为示例
      return await this.createNewScene('LoadedScene')

    } catch (error) {
      console.error('❌ 加载场景失败:', error)
      throw error
    }
  }

  /**
   * 添加节点到场景 (重构版 - 事件驱动)
   */
  addNodeToScene(node: Node, parent?: Node): void {
    if (!this._currentScene) {
      throw new Error('没有当前场景')
    }

    const targetParent = parent || this._currentScene
    targetParent.addChild(node)

    // 发送事件通知 (新的响应式方式)
    this._eventBus.notifySceneChanged('node_added', {
      nodeId: node.getInstanceId(),
      nodeName: node.name,
      parentId: targetParent.getInstanceId(),
      parentName: targetParent.name
    })

    // 更新响应式状态
    this._editorState.updateSceneNodes(this.getSceneNodesList())

    // 触发节点添加事件 (保持向后兼容)
    this._onNodeAdded?.(node, targetParent)

    console.log(`📡 发送节点添加事件: ${node.name}`)

    console.log(`➕ 添加节点: ${node.name} 到 ${targetParent.name}`)
  }

  /**
   * 从场景移除节点
   */
  removeNodeFromScene(node: Node): void {
    const parent = node.parent
    if (parent) {
      parent.removeChild(node)

      // 如果节点被选中，取消选择
      this._selectedNodes.delete(node.getInstanceId())

      // 触发节点移除事件
      this._onNodeRemoved?.(node, parent)

      console.log(`➖ 移除节点: ${node.name}`)
    }
  }

  /**
   * 选择节点 (重构版 - 事件驱动)
   */
  selectNode(nodeId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this._selectedNodes.clear()
    }

    this._selectedNodes.add(nodeId)
    const selectedNodeIds = Array.from(this._selectedNodes)

    // 发送事件通知 (新的响应式方式)
    this._eventBus.notifySelectionChanged(selectedNodeIds)

    // 更新响应式状态
    const selectedNodes = this.getSelectedNodes()
    this._editorState.updateSelection(selectedNodeIds, selectedNodes)

    // 触发选择变更事件 (保持向后兼容)
    this._onSelectionChanged?.(selectedNodeIds)

    console.log(`🎯 选择节点: ${nodeId}`)
  }

  /**
   * 取消选择节点
   */
  deselectNode(nodeId: string): void {
    this._selectedNodes.delete(nodeId)
    this._onSelectionChanged?.(Array.from(this._selectedNodes))
    
    console.log(`❌ 取消选择节点: ${nodeId}`)
  }

  /**
   * 清除所有选择
   */
  clearSelection(): void {
    this._selectedNodes.clear()
    this._onSelectionChanged?.([])
    
    console.log('🧹 清除所有选择')
  }

  /**
   * 获取场景中的所有节点信息
   */
  getSceneNodes(): EditorNodeInfo[] {
    if (!this._currentScene) {
      return []
    }

    const nodes: EditorNodeInfo[] = []
    
    const collectNodes = (node: Node) => {
      nodes.push({
        id: node.getInstanceId(),
        name: node.name,
        type: node.constructor.name,
        node: node,
        visible: node.visible,
        locked: false // TODO: 实现锁定功能
      })
      
      node.children.forEach((child: Node) => collectNodes(child))
    }
    
    collectNodes(this._currentScene)
    return nodes
  }

  /**
   * 创建网格辅助器
   */
  private async createGridHelper(): Promise<void> {
    try {
      this._gridHelper = new Node3D('EditorGridHelper')

      // 创建THREE.js网格辅助器
      const THREE = await import('three')

      // 主网格 (1米间距)
      const mainGrid = new THREE.GridHelper(20, 20, 0x888888, 0x444444)
      mainGrid.name = 'MainGrid'

      // 细分网格 (0.1米间距)
      const subGrid = new THREE.GridHelper(20, 200, 0x333333, 0x333333)
      subGrid.name = 'SubGrid'

      // 坐标轴辅助器
      const axesHelper = new THREE.AxesHelper(2)
      axesHelper.name = 'AxesHelper'

      // 将辅助器添加到Node3D
      if (this._gridHelper.threeObject) {
        this._gridHelper.threeObject.add(subGrid)
        this._gridHelper.threeObject.add(mainGrid)
        this._gridHelper.threeObject.add(axesHelper)
      }

      console.log('✅ 编辑器网格系统创建完成')
      console.log('   - 主网格: 20x20米，1米间距')
      console.log('   - 细分网格: 20x20米，0.1米间距')
      console.log('   - 坐标轴: 2米长度')
    } catch (error) {
      console.error('❌ 创建网格辅助器失败:', error)
    }
  }

  /**
   * 创建变换控制器
   */
  private async createGizmos(): Promise<void> {
    try {
      this._gizmos = new Node3D('TransformGizmos')

      // 变换控制器将在QaqViewport3D中创建和管理
      // 这里只是创建一个占位节点

      console.log('✅ 变换控制器节点创建完成')
    } catch (error) {
      console.error('❌ 创建变换控制器失败:', error)
    }
  }

  /**
   * 设置编辑器环境
   */
  private async setupEditorEnvironment(_scene: Scene): Promise<void> {
    try {
      console.log('🌅 设置编辑器环境...')

      // 通过引擎获取THREE.js场景对象
      const threeScene = this._engine?.getScene()
      if (!threeScene) {
        console.warn('⚠️ 无法获取THREE.js场景对象')
        return
      }

      // 设置环境光
      const THREE = await import('three')

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      ambientLight.name = 'EditorAmbientLight'
      threeScene.add(ambientLight)

      // 添加方向光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.name = 'EditorDirectionalLight'
      threeScene.add(directionalLight)

      // 设置天空盒背景
      const skyColor = new THREE.Color(0x87CEEB) // 天空蓝
      threeScene.background = skyColor

      // 设置雾效果（可选）
      threeScene.fog = new THREE.Fog(skyColor, 50, 200)

      console.log('✅ 编辑器环境设置完成')
      console.log('   - 环境光: 0x404040, 强度 0.6')
      console.log('   - 方向光: 0xffffff, 强度 0.8')
      console.log('   - 天空背景: 天空蓝')
      console.log('   - 雾效果: 50-200米范围')

    } catch (error) {
      console.error('❌ 设置编辑器环境失败:', error)
    }
  }

  /**
   * 设置事件回调
   */
  setEventCallbacks(callbacks: {
    onSelectionChanged?: (nodeIds: string[]) => void
    onSceneChanged?: (scene: Scene | null) => void
    onNodeAdded?: (node: Node, parent: Node) => void
    onNodeRemoved?: (node: Node, parent: Node) => void
  }): void {
    this._onSelectionChanged = callbacks.onSelectionChanged
    this._onSceneChanged = callbacks.onSceneChanged
    this._onNodeAdded = callbacks.onNodeAdded
    this._onNodeRemoved = callbacks.onNodeRemoved
  }

  /**
   * 获取当前场景
   */
  getCurrentScene(): Scene | null {
    return this._currentScene
  }

  /**
   * 获取选中的节点对象列表
   */
  private getSelectedNodes(): Node[] {
    const nodes: Node[] = []
    if (this._currentScene) {
      for (const nodeId of this._selectedNodes) {
        const node = this.findNodeById(nodeId)
        if (node) {
          nodes.push(node)
        }
      }
    }
    return nodes
  }

  /**
   * 获取场景节点列表
   */
  private getSceneNodesList(): Node[] {
    if (!this._currentScene) return []

    const nodes: Node[] = []
    const collectNodes = (node: Node) => {
      nodes.push(node)
      node.children.forEach(child => collectNodes(child))
    }

    collectNodes(this._currentScene)
    return nodes
  }

  /**
   * 根据ID查找节点
   */
  private findNodeById(nodeId: string): Node | null {
    if (!this._currentScene) return null

    const search = (node: Node): Node | null => {
      if (node.getInstanceId() === nodeId) {
        return node
      }
      for (const child of node.children) {
        const found = search(child)
        if (found) return found
      }
      return null
    }

    return search(this._currentScene)
  }

  /**
   * 获取场景树
   */
  getSceneTree(): SceneTree | null {
    return this._sceneTree
  }

  /**
   * 获取引擎实例
   */
  getEngine(): Engine | null {
    return this._engine
  }

  /**
   * 获取选中的节点ID列表
   */
  getSelectedNodeIds(): string[] {
    return Array.from(this._selectedNodes)
  }

  /**
   * 销毁桥接器
   */
  dispose(): void {
    if (this._engine) {
      // Engine是单例，不需要dispose
      this._engine = null
    }
    
    this._currentScene = null
    this._sceneTree = null
    this._selectedNodes.clear()
    this._isInitialized = false
    
    console.log('🧹 编辑器引擎桥接器已销毁')
  }
}
