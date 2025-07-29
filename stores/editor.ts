import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Node, Node3D, MeshInstance3D, SceneTree } from '~/core'

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
  projectName: string | null
  projectPath: string | null
}

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const state = ref<EditorState>({
    isInitialized: false,
    openTabs: [],
    activeTabId: null,
    sceneTree: null,
    selectedNode: null,
    projectName: null,
    projectPath: null
  })

  // 计算属性
  const currentScene = computed(() => {
    return state.value.sceneTree?.root || null
  })

  const activeTab = computed(() => {
    if (!state.value.activeTabId) return null
    return state.value.openTabs.find(tab => tab.id === state.value.activeTabId) || null
  })

  const selectedNode = computed(() => {
    return state.value.selectedNode
  })

  // 方法
  function setInitialized(initialized: boolean) {
    state.value.isInitialized = initialized
  }

  function setSceneTree(sceneTree: SceneTree | null) {
    state.value.sceneTree = sceneTree
    console.log('🌳 Scene tree updated:', sceneTree?.root?.name)
  }

  function setSelectedNode(node: Node | null) {
    state.value.selectedNode = node
    console.log('🎯 Node selected:', node?.name || 'none')
  }

  function clearSelection() {
    state.value.selectedNode = null
    console.log('❌ Selection cleared')
  }

  function openTab(tab: EditorTab) {
    const existingIndex = state.value.openTabs.findIndex(t => t.id === tab.id)
    if (existingIndex >= 0) {
      state.value.openTabs[existingIndex] = tab
    } else {
      state.value.openTabs.push(tab)
    }
    state.value.activeTabId = tab.id
  }

  function closeTab(tabId: string) {
    const index = state.value.openTabs.findIndex(tab => tab.id === tabId)
    if (index >= 0) {
      state.value.openTabs.splice(index, 1)

      // 如果关闭的是当前活动标签，切换到其他标签
      if (state.value.activeTabId === tabId) {
        if (state.value.openTabs.length > 0) {
          const newIndex = Math.min(index, state.value.openTabs.length - 1)
          state.value.activeTabId = state.value.openTabs[newIndex].id
        } else {
          state.value.activeTabId = null
        }
      }
    }
  }

  function setActiveTab(tabId: string) {
    const tab = state.value.openTabs.find(t => t.id === tabId)
    if (tab) {
      state.value.activeTabId = tabId
    }
  }

  function setProject(name: string, path: string) {
    state.value.projectName = name
    state.value.projectPath = path
  }

  // 创建新场景
  async function createNewScene(config: { name: string; type: '3d' | '2d' | 'ui' }) {
    console.log('🏗️ Creating new scene:', config)

    try {
      // 创建新的场景树
      const sceneTree = new SceneTree()
      sceneTree.setMeta('sceneName', config.name)
      sceneTree.setMeta('sceneType', config.type)

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
        cubeNode.transform.position.set(0, 0, 0)
        geometryFolder.addChild(cubeNode)

        // 添加球体
        const sphereNode = new MeshInstance3D('Sphere')
        sphereNode.transform.position.set(2, 0, 0)
        geometryFolder.addChild(sphereNode)

        // 添加平面
        const planeNode = new MeshInstance3D('Plane')
        planeNode.transform.position.set(-2, 0, 0)
        planeNode.transform.scale.set(5, 1, 5)
        geometryFolder.addChild(planeNode)

        // 3. 相机和控制
        const cameraFolder = new Node3D('Cameras')
        rootNode.addChild(cameraFolder)

        const mainCamera = new Node3D('MainCamera3D')
        mainCamera.transform.position.set(5, 5, 5)
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

      // 设置场景树的根节点
      sceneTree.setRoot(rootNode)

      // 设置当前场景树
      setSceneTree(sceneTree)
      state.value.selectedNode = null

      // 打开场景标签页
      const tabId = `scene-${config.name}`
      openTab({
        id: tabId,
        name: config.name,
        path: `scenes/${config.name}.tscn`,
        type: 'scene',
        isDirty: true
      })

      console.log(`✅ Scene "${config.name}" created successfully`)
      return sceneTree

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

// 导出类型
export type { EditorState, EditorTab }
