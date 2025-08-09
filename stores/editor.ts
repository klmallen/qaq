import { defineStore } from 'pinia'
import { computed, readonly, reactive } from 'vue'
import { Node, Node3D, MeshInstance3D, SceneTree, Scene } from '~/core'
import { EditorEngineBridge } from '~/core/editor/EditorEngineBridge'
import type { EditorNodeInfo } from '~/core/editor/EditorEngineBridge'
import { getEditorEventBus } from '~/core/editor/EditorEventBus'

export interface EditorTab {
  id: string
  name: string
  path: string
  type: 'scene' | 'script' | 'resource'
  isDirty: boolean
  icon?: string
}

export interface EditorState {
  isInitialized: boolean
  openTabs: EditorTab[]
  activeTabId: string | null
  sceneTree: SceneTree | null
  selectedNode: Node | null
  selectedNodeIds: string[]
  projectName: string | null
  projectPath: string | null
  engineBridge: EditorEngineBridge | null
  sceneNodes: EditorNodeInfo[]
}

export const useEditorStore = defineStore('editor', () => {
  // 状态 - 使用 reactive 确保深度响应式
  const state = reactive<EditorState>({
    isInitialized: false,
    openTabs: [],
    activeTabId: null,
    sceneTree: null,
    selectedNode: null,
    selectedNodeIds: [],
    projectName: null,
    projectPath: null,
    engineBridge: null,
    sceneNodes: []
  })

  // 事件总线
  const eventBus = getEditorEventBus()

  // 初始化事件监听
  const initializeEventListeners = () => {
    // 监听场景变化事件
    eventBus.on('scene:loaded', (event) => {
      console.log('📡 收到场景加载事件:', event.data)
      // 强制触发响应式更新
      triggerSceneTreeUpdate()
    })

    eventBus.on('scene:node_added', (event) => {
      console.log('📡 收到节点添加事件:', event.data)
      updateSceneNodes()
    })

    eventBus.on('scene:node_removed', (event) => {
      console.log('📡 收到节点移除事件:', event.data)
      updateSceneNodes()
    })

    eventBus.on('selection:changed', (event) => {
      console.log('📡 收到选择变化事件:', event.data)
      if (event.data?.nodeIds) {
        state.selectedNodeIds = [...event.data.nodeIds]
      }
    })
  }

  // 强制触发场景树更新的辅助函数
  const triggerSceneTreeUpdate = () => {
    if (state.engineBridge) {
      const newSceneTree = state.engineBridge.getSceneTree()
      state.sceneTree = newSceneTree
      updateSceneNodes()
      console.log('🔄 强制更新场景树状态')
    }
  }

  // 计算属性
  const currentScene = computed(() => {
    return state.engineBridge?.getCurrentScene() || null
  })

  const activeTab = computed(() => {
    if (!state.activeTabId) return null
    return state.openTabs.find((tab: EditorTab) => tab.id === state.activeTabId) || null
  })

  const selectedNode = computed(() => {
    return state.selectedNode
  })

  const selectedNodes = computed(() => {
    return state.sceneNodes.filter(node =>
      state.selectedNodeIds.includes(node.id)
    )
  })

  const hasOpenTabs = computed(() => state.openTabs.length > 0)

  // 方法
  function setInitialized(initialized: boolean) {
    state.isInitialized = initialized
  }

  /**
   * 初始化编辑器引擎桥接器
   */
  async function initializeEngineBridge(container: HTMLElement): Promise<void> {
    if (state.engineBridge) {
      console.warn('⚠️ 引擎桥接器已经初始化')
      return
    }

    try {
      const bridge = new EditorEngineBridge()

      // 设置事件回调 (保持向后兼容)
      bridge.setEventCallbacks({
        onSelectionChanged: (nodeIds: string[]) => {
          state.selectedNodeIds = nodeIds
          console.log('🎯 选择变更:', nodeIds)
        },
        onSceneChanged: (scene: Scene | null) => {
          if (scene) {
            state.sceneTree = bridge.getSceneTree()
            updateSceneNodes()
            // 发送事件通知新的响应式系统
            eventBus.emit('scene:loaded', { scene: scene.name }, 'bridge')
          }
          console.log('🌳 场景变更:', scene?.name)
        },
        onNodeAdded: (node: Node, parent: Node) => {
          updateSceneNodes()
          console.log('➕ 节点添加:', node.name, '到', parent.name)
        },
        onNodeRemoved: (node: Node, parent: Node) => {
          updateSceneNodes()
          console.log('➖ 节点移除:', node.name, '从', parent.name)
        }
      })

      // 初始化桥接器
      await bridge.initialize({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        enableGrid: true,
        enableGizmos: true
      })

      state.engineBridge = bridge

      // 初始化事件监听
      initializeEventListeners()

      console.log('✅ 编辑器引擎桥接器初始化完成')

    } catch (error) {
      console.error('❌ 编辑器引擎桥接器初始化失败:', error)
      throw error
    }
  }

  /**
   * 更新场景节点列表
   */
  function updateSceneNodes(): void {
    if (state.engineBridge) {
      state.sceneNodes = state.engineBridge.getSceneNodes()
      console.log(state.sceneNodes,'state.sceneNodes')
    }
  }

  function setSceneTree(sceneTree: SceneTree | null) {
    state.sceneTree = sceneTree
    console.log('🌳 Scene tree updated:', sceneTree?.currentScene?.name)
  }

  function setSelectedNode(node: Node | null) {
    state.selectedNode = node
    console.log('🎯 Node selected:', node?.name || 'none')
  }

  function clearSelection() {
    state.selectedNode = null
    console.log('❌ Selection cleared')
  }

  function openTab(tab: EditorTab) {
    const existingIndex = state.openTabs.findIndex((t: EditorTab) => t.id === tab.id)
    if (existingIndex >= 0) {
      state.openTabs[existingIndex] = tab
    } else {
      state.openTabs.push(tab)
    }
    state.activeTabId = tab.id
  }

  function closeTab(tabId: string) {
    const index = state.openTabs.findIndex((tab: EditorTab) => tab.id === tabId)
    if (index >= 0) {
      state.openTabs.splice(index, 1)

      // 如果关闭的是当前活动标签，切换到其他标签
      if (state.activeTabId === tabId) {
        if (state.openTabs.length > 0) {
          const newIndex = Math.min(index, state.openTabs.length - 1)
          state.activeTabId = state.openTabs[newIndex].id
        } else {
          state.activeTabId = null
        }
      }
    }
  }

  function setActiveTab(tabId: string) {
    const tab = state.openTabs.find((t: EditorTab) => t.id === tabId)
    if (tab) {
      state.activeTabId = tabId
    }
  }

  function setProject(name: string, path: string) {
    state.projectName = name
    state.projectPath = path
  }

  // 创建新场景
  async function createNewScene(config: { name: string; type: '3d' | '2d' | 'ui' }) {
    console.log('🏗️ Creating new scene:', config)

    if (!state.engineBridge) {
      throw new Error('引擎桥接器未初始化')
    }

    try {
      // 使用引擎桥接器创建新场景
      const scene = await state.engineBridge.createNewScene(config.name)

      // 创建根节点
      let rootNode: Node
      if (config.type === '3d') {
        rootNode = new Node3D(config.name)

        // 创建示例场景结构
        // 1. 环境文件夹
        const environmentFolder = new Node3D('Environment')
        rootNode.addChild(environmentFolder)

        // 添加光照
        const directionalLight = new Node3D('DirectionalLight3D')
        environmentFolder.addChild(directionalLight)

        const ambientLight = new Node3D('AmbientLight3D')
        environmentFolder.addChild(ambientLight)

        // 2. 几何体文件夹
        const geometryFolder = new Node3D('Geometry')
        rootNode.addChild(geometryFolder)

        // 添加立方体
        const cubeNode = new MeshInstance3D('Cube')
        cubeNode.createBoxMesh()
        cubeNode.position = { x: 0, y: 0, z: 0 }
        geometryFolder.addChild(cubeNode)

        // 添加球体
        const sphereNode = new MeshInstance3D('Sphere')
        sphereNode.position = { x: 2, y: 0, z: 0 }
        geometryFolder.addChild(sphereNode)

        // 添加平面
        const planeNode = new MeshInstance3D('Plane')
        planeNode.position = { x: -2, y: 0, z: 0 }
        planeNode.scale = { x: 5, y: 1, z: 5 }
        geometryFolder.addChild(planeNode)

        // 3. 相机和控制
        const cameraFolder = new Node3D('Cameras')
        rootNode.addChild(cameraFolder)

        const mainCamera = new Node3D('MainCamera3D')
        mainCamera.position = { x: 5, y: 5, z: 5 }
        cameraFolder.addChild(mainCamera)

        // 4. 用户界面
        const uiFolder = new Node3D('UI')
        rootNode.addChild(uiFolder)

        const canvas = new Node3D('CanvasLayer')
        uiFolder.addChild(canvas)

        const label = new Node3D('Label')
        canvas.addChild(label)

      } else {
        rootNode = new Node(config.name)
      }
      scene.addChild(rootNode)

      // 更新场景节点列表
      updateSceneNodes()
      state.selectedNode = null

      // 打开场景标签页
      const tabId = `scene-${config.name}`
      openTab({
        id: tabId,
        name: config.name,
        path: `scenes/${config.name}.tscn`,
        type: 'scene',
        isDirty: true
      })

      // 发送场景创建完成事件
      eventBus.emit('scene:loaded', {
        scene: config.name,
        type: config.type,
        nodeCount: scene.children.length
      }, 'editor-store')

      console.log(`✅ Scene "${config.name}" created successfully`)
      console.log(`📡 发送场景加载事件: ${config.name}`)

    } catch (error) {
      console.error('❌ Failed to create scene:', error)
      throw error
    }
  }

  // 暴露状态和方法
  return {
    // 状态
    state: readonly(state),

    // 计算属性
    currentScene,
    activeTab,
    selectedNode,

    // 方法
    setInitialized,
    initializeEngineBridge,
    updateSceneNodes,
    setSceneTree,
    setSelectedNode,
    clearSelection,
    openTab,
    closeTab,
    setActiveTab,
    setProject,
    createNewScene
  }
})

// 类型已在上面导出，无需重复导出
