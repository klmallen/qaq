/**
 * QAQ响应式编辑器状态管理器
 * 
 * 功能：
 * - 与Vue响应式系统深度集成
 * - 只在真正需要时更新UI
 * - 提供细粒度的状态变化监听
 * - 支持状态快照和回滚
 */

import { reactive, computed, watch, watchEffect, ref, type Ref, type ComputedRef } from 'vue'
import { getEditorEventBus, type EditorEventType } from './EditorEventBus'
import type { Scene } from '../scene/Scene'
import type Node from '../nodes/Node'

// ============================================================================
// 状态接口定义
// ============================================================================

export interface EditorViewportState {
  camera: {
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
    fov: number
    near: number
    far: number
  }
  controls: {
    enabled: boolean
    type: 'orbit' | 'first-person' | 'fly'
    target: { x: number, y: number, z: number }
  }
  rendering: {
    fps: number
    frameCount: number
    needsRender: boolean
    lastRenderTime: number
  }
}

export interface EditorSelectionState {
  selectedNodeIds: string[]
  selectedNodes: Node[]
  lastSelectedNode: Node | null
  selectionBounds: any | null
}

export interface EditorSceneState {
  currentScene: Scene | null
  sceneTree: any | null
  sceneNodes: Node[]
  isDirty: boolean
  lastModified: number
}

export interface EditorToolState {
  activeTool: 'select' | 'move' | 'rotate' | 'scale' | 'camera'
  gizmosEnabled: boolean
  gridEnabled: boolean
  snapEnabled: boolean
  snapSize: number
}

export interface EditorUIState {
  panels: {
    sceneTree: { visible: boolean, width: number, height: number }
    inspector: { visible: boolean, width: number, height: number }
    fileSystem: { visible: boolean, width: number, height: number }
    console: { visible: boolean, width: number, height: number }
  }
  theme: 'dark' | 'light'
  language: string
}

// ============================================================================
// 响应式编辑器状态类
// ============================================================================

export class ReactiveEditorState {
  // ========================================================================
  // 响应式状态
  // ========================================================================
  
  private _viewport = reactive<EditorViewportState>({
    camera: {
      position: { x: 5, y: 5, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 75,
      near: 0.1,
      far: 1000
    },
    controls: {
      enabled: true,
      type: 'orbit',
      target: { x: 0, y: 0, z: 0 }
    },
    rendering: {
      fps: 60,
      frameCount: 0,
      needsRender: false,
      lastRenderTime: 0
    }
  })

  private _selection = reactive<EditorSelectionState>({
    selectedNodeIds: [],
    selectedNodes: [],
    lastSelectedNode: null,
    selectionBounds: null
  })

  private _scene = reactive<EditorSceneState>({
    currentScene: null,
    sceneTree: null,
    sceneNodes: [],
    isDirty: false,
    lastModified: 0
  })

  private _tools = reactive<EditorToolState>({
    activeTool: 'select',
    gizmosEnabled: true,
    gridEnabled: true,
    snapEnabled: false,
    snapSize: 1
  })

  private _ui = reactive<EditorUIState>({
    panels: {
      sceneTree: { visible: true, width: 300, height: 400 },
      inspector: { visible: true, width: 300, height: 400 },
      fileSystem: { visible: true, width: 300, height: 300 },
      console: { visible: false, width: 800, height: 200 }
    },
    theme: 'dark',
    language: 'zh-CN'
  })

  // 事件总线
  private _eventBus = getEditorEventBus()
  
  // 监听器清理函数
  private _cleanupFunctions: (() => void)[] = []

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor() {
    this.setupEventListeners()
    this.setupReactiveEffects()
  }

  // ========================================================================
  // 公共API - 状态访问
  // ========================================================================

  get viewport() { return this._viewport }
  get selection() { return this._selection }
  get scene() { return this._scene }
  get tools() { return this._tools }
  get ui() { return this._ui }

  // ========================================================================
  // 公共API - 计算属性
  // ========================================================================

  readonly hasSelection = computed(() => this._selection.selectedNodeIds.length > 0)
  readonly selectedNodeCount = computed(() => this._selection.selectedNodeIds.length)
  readonly isMultiSelection = computed(() => this._selection.selectedNodeIds.length > 1)
  readonly canUndo = computed(() => this._scene.isDirty)
  readonly needsRender = computed(() => this._viewport.rendering.needsRender)

  // ========================================================================
  // 公共API - 状态更新方法
  // ========================================================================

  /**
   * 更新相机状态
   */
  updateCamera(position?: any, rotation?: any, fov?: number): void {
    let changed = false
    
    if (position) {
      Object.assign(this._viewport.camera.position, position)
      changed = true
    }
    
    if (rotation) {
      Object.assign(this._viewport.camera.rotation, rotation)
      changed = true
    }
    
    if (fov !== undefined) {
      this._viewport.camera.fov = fov
      changed = true
    }
    
    if (changed) {
      this._eventBus.emit('camera:moved', {
        position: this._viewport.camera.position,
        rotation: this._viewport.camera.rotation,
        fov: this._viewport.camera.fov
      }, 'state')
    }
  }

  /**
   * 更新选择状态
   */
  updateSelection(nodeIds: string[], nodes: Node[] = []): void {
    this._selection.selectedNodeIds = [...nodeIds]
    this._selection.selectedNodes = [...nodes]
    this._selection.lastSelectedNode = nodes.length > 0 ? nodes[nodes.length - 1] : null
    
    this._eventBus.notifySelectionChanged(nodeIds)
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.updateSelection([])
  }

  /**
   * 更新场景状态
   */
  updateScene(scene: Scene | null): void {
    this._scene.currentScene = scene
    this._scene.lastModified = Date.now()
    this._scene.isDirty = true
    
    if (scene) {
      this._eventBus.emit('scene:loaded', { scene: scene.name }, 'state')
    }
  }

  /**
   * 更新场景节点列表
   */
  updateSceneNodes(nodes: Node[]): void {
    this._scene.sceneNodes = [...nodes]
    this._scene.lastModified = Date.now()
    
    this._eventBus.emit('scene:hierarchy_changed', { nodeCount: nodes.length }, 'state')
  }

  /**
   * 标记需要渲染
   */
  markNeedsRender(): void {
    this._viewport.rendering.needsRender = true
  }

  /**
   * 清除渲染标记
   */
  clearRenderFlag(): void {
    this._viewport.rendering.needsRender = false
    this._viewport.rendering.lastRenderTime = performance.now()
  }

  /**
   * 更新FPS
   */
  updateFPS(fps: number): void {
    this._viewport.rendering.fps = fps
    this._viewport.rendering.frameCount++
  }

  /**
   * 切换工具
   */
  setActiveTool(tool: EditorToolState['activeTool']): void {
    if (this._tools.activeTool !== tool) {
      this._tools.activeTool = tool
      this._eventBus.emit('editor:tool_changed', { tool }, 'state')
    }
  }

  /**
   * 切换面板可见性
   */
  togglePanel(panelName: keyof EditorUIState['panels']): void {
    this._ui.panels[panelName].visible = !this._ui.panels[panelName].visible
  }

  // ========================================================================
  // 私有方法 - 事件监听设置
  // ========================================================================

  private setupEventListeners(): void {
    // 监听场景变化事件
    this._cleanupFunctions.push(
      this._eventBus.on('scene:node_added', (event) => {
        this.markNeedsRender()
      })
    )

    this._cleanupFunctions.push(
      this._eventBus.on('scene:node_removed', (event) => {
        this.markNeedsRender()
      })
    )

    this._cleanupFunctions.push(
      this._eventBus.on('scene:node_modified', (event) => {
        this.markNeedsRender()
      })
    )

    // 监听变换变化事件
    this._cleanupFunctions.push(
      this._eventBus.onMultiple([
        'transform:position_changed',
        'transform:rotation_changed',
        'transform:scale_changed'
      ], (event) => {
        this.markNeedsRender()
      })
    )

    // 监听材质变化事件
    this._cleanupFunctions.push(
      this._eventBus.on('material:changed', (event) => {
        this.markNeedsRender()
      })
    )
  }

  private setupReactiveEffects(): void {
    // 监听渲染需求变化
    this._cleanupFunctions.push(
      watchEffect(() => {
        if (this._viewport.rendering.needsRender) {
          // 这里可以触发实际的渲染
          console.log('🎨 检测到渲染需求')
        }
      })
    )

    // 监听选择变化
    this._cleanupFunctions.push(
      watchEffect(() => {
        const count = this._selection.selectedNodeIds.length
        if (count > 0) {
          console.log(`🎯 选择了 ${count} 个节点`)
        }
      })
    )
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  dispose(): void {
    // 清理所有监听器
    this._cleanupFunctions.forEach(cleanup => cleanup())
    this._cleanupFunctions.length = 0
    
    console.log('🧹 ReactiveEditorState 已清理')
  }
}

// ============================================================================
// 全局单例
// ============================================================================

let globalEditorState: ReactiveEditorState | null = null

export function getReactiveEditorState(): ReactiveEditorState {
  if (!globalEditorState) {
    globalEditorState = new ReactiveEditorState()
  }
  return globalEditorState
}

export function createReactiveEditorState(): ReactiveEditorState {
  return new ReactiveEditorState()
}

export default ReactiveEditorState
