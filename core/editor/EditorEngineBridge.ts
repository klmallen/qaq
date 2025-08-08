/**
 * QAQ编辑器引擎桥接器
 * 
 * 功能：
 * - 统一管理编辑器和引擎的场景系统
 * - 提供编辑器专用的引擎操作接口
 * - 处理编辑器模式和运行时模式的切换
 * - 同步编辑器状态和引擎状态
 */

import Engine from '../engine/Engine'
import { Scene } from '../scene/Scene'
import Node from '../nodes/Node'
import Node3D from '../nodes/Node3D'
import Camera3D from '../nodes/3d/Camera3D'
import { SceneTree } from '../scene/SceneTree'

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
  
  // 事件回调
  private _onSelectionChanged?: (nodeIds: string[]) => void
  private _onSceneChanged?: (scene: Scene | null) => void
  private _onNodeAdded?: (node: Node, parent: Node) => void
  private _onNodeRemoved?: (node: Node, parent: Node) => void

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
      // 创建新场景
      const scene = new Scene(name)
      
      // 获取场景树实例并设置场景
      const sceneTree = SceneTree.getInstance()
      await sceneTree.changeScene(scene)
      
      // 设置为当前场景
      this._currentScene = scene
      this._sceneTree = sceneTree
      
      // 场景已通过SceneTree设置到引擎
      
      // 添加编辑器相机到场景
      if (this._editorCamera) {
        scene.addChild(this._editorCamera)
      }

      // 触发场景变更事件
      this._onSceneChanged?.(scene)

      console.log(`✅ 创建新场景: ${name}`)
      return scene

    } catch (error) {
      console.error('❌ 创建场景失败:', error)
      throw error
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
   * 添加节点到场景
   */
  addNodeToScene(node: Node, parent?: Node): void {
    if (!this._currentScene) {
      throw new Error('没有当前场景')
    }

    const targetParent = parent || this._currentScene
    targetParent.addChild(node)
    
    // 触发节点添加事件
    this._onNodeAdded?.(node, targetParent)
    
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
   * 选择节点
   */
  selectNode(nodeId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this._selectedNodes.clear()
    }
    
    this._selectedNodes.add(nodeId)
    this._onSelectionChanged?.(Array.from(this._selectedNodes))
    
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
    // TODO: 创建网格辅助显示
    this._gridHelper = new Node3D('GridHelper')
    console.log('✅ 创建网格辅助器')
  }

  /**
   * 创建变换控制器
   */
  private async createGizmos(): Promise<void> {
    // TODO: 创建变换控制器
    this._gizmos = new Node3D('TransformGizmos')
    console.log('✅ 创建变换控制器')
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
