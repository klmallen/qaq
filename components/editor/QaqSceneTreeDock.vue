<template>
  <div class="qaq-scene-tree-dock">
    <!-- 标题栏 -->
    <div class="qaq-dock-header">
      <h3 class="qaq-dock-title">Scene</h3>
      <div class="qaq-dock-actions">
        <UButton
          icon="i-heroicons-plus"
          variant="ghost"
          size="xs"
          title="Add Node"
          @click="showAddNodeDialog"
        />
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="xs"
          title="Refresh"
          @click="refreshTree"
        />
      </div>
    </div>

    <!-- 场景树 -->
    <div
      class="qaq-scene-tree-content"
      @contextmenu="handleEmptyAreaContextMenu"
    >
    <!-- {{ editorStore.state.engineBridge.getSceneNodes() }} -->
    123
      <div v-if="!editorStore.state.sceneTree" class="qaq-empty-state">
        <p>No scene loaded</p>
        <UButton
          label="Create Scene"
          size="sm"
          @click="createNewScene"
        />
      </div>

      <div v-else-if="!currentScene" class="qaq-empty-state">
        <p>Scene loaded but no root node</p>
        <UButton
          label="Add Root Node"
          size="sm"
          @click="showAddNodeDialog"
        />
      </div>
      
      <div v-else class="qaq-tree-container">
        <QaqSceneTreeNode
          :node="currentScene"
          :level="0"
          :selected-node="selectedNode"
          @select="handleNodeSelect"
          @context-menu="handleNodeContextMenu"
          @rename="handleNodeRename"
          @delete="handleNodeDelete"
        />
      </div>
    </div>

    <!-- 创建场景对话框 -->
    <UModal
      v-model="showCreateSceneDialog"
      :ui="{
        width: 'sm:max-w-2xl',
        overlay: {
          base: 'fixed inset-0 transition-opacity',
          background: 'bg-black/80 backdrop-blur-sm'
        },
        wrapper: 'fixed inset-0 z-[9999] overflow-y-auto',
        inner: 'flex min-h-full items-center justify-center p-4',
        container: 'relative transform overflow-hidden text-left transition-all'
      }"
      :prevent-close="false"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Create New Scene</h3>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="sm"
              @click="showCreateSceneDialog = false"
            />
          </div>
        </template>

        <div class="qaq-create-scene-dialog">
          <!-- 场景类型标签页 -->
          <UTabs v-model="selectedSceneTab" :items="sceneTypeTabs" class="qaq-scene-tabs">
            <!-- 3D Scene Tab -->
            <template #item="{ item }">
              <div v-if="item.key === '3d'" class="qaq-scene-tab-content">
                <div class="qaq-scene-preview">
                  <div class="qaq-scene-icon">
                    <UIcon name="i-heroicons-cube" class="w-16 h-16 text-blue-400" />
                  </div>
                  <div class="qaq-scene-description">
                    <h4 class="font-semibold mb-2">3D Scene</h4>
                    <p class="text-sm text-gray-400 mb-4">
                      Create a 3D scene with spatial nodes, meshes, cameras, and lighting.
                      Perfect for 3D games, simulations, and interactive experiences.
                    </p>
                    <div class="qaq-scene-features">
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-cube-transparent" class="w-4 h-4" />
                        <span>3D Meshes & Models</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-light-bulb" class="w-4 h-4" />
                        <span>Lighting & Shadows</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-camera" class="w-4 h-4" />
                        <span>Camera Controls</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="item.key === '2d'" class="qaq-scene-tab-content">
                <div class="qaq-scene-preview">
                  <div class="qaq-scene-icon">
                    <UIcon name="i-heroicons-rectangle-stack" class="w-16 h-16 text-green-400" />
                  </div>
                  <div class="qaq-scene-description">
                    <h4 class="font-semibold mb-2">2D Scene</h4>
                    <p class="text-sm text-gray-400 mb-4">
                      Create a 2D scene with sprites, animations, and 2D physics.
                      Ideal for platformers, top-down games, and 2D interactive content.
                    </p>
                    <div class="qaq-scene-features">
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-photo" class="w-4 h-4" />
                        <span>Sprites & Textures</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-play" class="w-4 h-4" />
                        <span>2D Animations</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
                        <span>2D Physics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="item.key === 'ui'" class="qaq-scene-tab-content">
                <div class="qaq-scene-preview">
                  <div class="qaq-scene-icon">
                    <UIcon name="i-heroicons-window" class="w-16 h-16 text-purple-400" />
                  </div>
                  <div class="qaq-scene-description">
                    <h4 class="font-semibold mb-2">UI Scene</h4>
                    <p class="text-sm text-gray-400 mb-4">
                      Create user interface scenes with controls, layouts, and interactive elements.
                      Perfect for menus, HUDs, and user interface design.
                    </p>
                    <div class="qaq-scene-features">
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
                        <span>UI Controls</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-view-columns" class="w-4 h-4" />
                        <span>Layout System</span>
                      </div>
                      <div class="qaq-feature-item">
                        <UIcon name="i-heroicons-cursor-arrow-ripple" class="w-4 h-4" />
                        <span>Interactive Elements</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>

          <!-- 场景名称输入 -->
          <div class="qaq-scene-name-section">
            <UFormGroup label="Scene Name" class="qaq-scene-name-group">
              <UInput
                v-model="newSceneName"
                placeholder="Enter scene name"
                @keyup.enter="confirmCreateSceneFromDialog"
                class="qaq-scene-name-input"
              />
            </UFormGroup>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              variant="ghost"
              @click="showCreateSceneDialog = false"
            />
            <UButton
              label="Create"
              @click="confirmCreateSceneFromDialog"
              :disabled="!newSceneName || !newSceneType"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 添加节点对话框 -->
    <UModal v-model="showAddDialog">
      <UCard>
        <template #header>
          <h3>Add Node</h3>
        </template>

        <div class="qaq-add-node-dialog">
          <!-- 节点类型选择 -->
          <div class="qaq-node-types">
            <USelectMenu
              v-model="selectedNodeType"
              :options="nodeTypes"
              placeholder="Select node type"
              searchable
            />
          </div>

          <!-- 节点名称 -->
          <div class="qaq-node-name">
            <UInput
              v-model="newNodeName"
              placeholder="Node name"
              @keyup.enter="addNode"
            />
          </div>

          <!-- 父节点选择 -->
          <div v-if="currentScene && currentScene.children.length > 0" class="qaq-parent-selection">
            <USelectMenu
              v-model="selectedParent"
              :options="parentOptions"
              placeholder="Select parent (optional)"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              variant="ghost"
              @click="showAddDialog = false"
            />
            <UButton
              label="Add"
              @click="addNode"
              :disabled="!selectedNodeType || !newNodeName"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 右键菜单 -->
    <UContextMenu
      v-if="contextMenuTarget"
      v-model="showContextMenu"
      :virtual-element="contextMenuTarget"
    >
      <div class="qaq-context-menu">
        <UButton
          label="Add Child"
          icon="i-heroicons-plus"
          variant="ghost"
          size="sm"
          @click="addChildToNode"
        />
        <UButton
          label="Create Script"
          icon="i-heroicons-document-text"
          variant="ghost"
          size="sm"
          @click="createScript"
        />
        <UButton
          v-if="contextMenuNode && contextMenuNode.constructor.name === 'MeshInstance3D'"
          label="Open Animation Editor"
          icon="i-heroicons-film"
          variant="ghost"
          size="sm"
          @click="openAnimationEditor"
        />
        <UDivider />
        <UButton
          label="Rename"
          icon="i-heroicons-pencil"
          variant="ghost"
          size="sm"
          @click="renameNode"
        />
        <UButton
          label="Duplicate"
          icon="i-heroicons-document-duplicate"
          variant="ghost"
          size="sm"
          @click="duplicateNode"
        />
        <UButton
          label="Delete"
          icon="i-heroicons-trash"
          variant="ghost"
          size="sm"
          color="red"
          @click="deleteNode"
        />
      </div>
    </UContextMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '~/stores/editor'
import { Node, Node2D, Node3D, MeshInstance3D, generateUniqueNodeName } from '~/core'
import { getEditorEventBus } from '~/core/editor/EditorEventBus'

// 状态管理
const editorStore = useEditorStore()
const eventBus = getEditorEventBus()

// 事件定义
const emit = defineEmits<{
  'open-animation-editor': [node: any]
  'node-selected-3d': [node: any]
}>()

// 事件监听器清理函数
let eventCleanupFunctions: (() => void)[] = []

// 设置事件监听
onMounted(() => {
  console.log('🌳 SceneTreeDock: 设置事件监听器')

  // 监听场景加载事件
  eventCleanupFunctions.push(
    eventBus.on('scene:loaded', (event) => {
      console.log('🌳 SceneTreeDock: 收到场景加载事件', event.data)
      refreshTree()
    })
  )

  // 监听节点添加事件
  eventCleanupFunctions.push(
    eventBus.on('scene:node_added', (event) => {
      console.log('🌳 SceneTreeDock: 收到节点添加事件', event.data)
      refreshTree()
    })
  )

  // 监听节点移除事件
  eventCleanupFunctions.push(
    eventBus.on('scene:node_removed', (event) => {
      console.log('🌳 SceneTreeDock: 收到节点移除事件', event.data)
      refreshTree()
    })
  )
})

// 清理事件监听器
onUnmounted(() => {
  console.log('🌳 SceneTreeDock: 清理事件监听器')
  eventCleanupFunctions.forEach(cleanup => cleanup())
  eventCleanupFunctions = []
})
// 响应式数据
const showAddDialog = ref(false)
const showCreateSceneDialog = ref(false)
const showContextMenu = ref(false)
const contextMenuTarget = ref<HTMLElement | null>(null)
const contextMenuNode = ref<Node | null>(null)
const selectedNodeType = ref('')
const newNodeName = ref('')
const selectedParent = ref<Node | null>(null)

// 创建场景相关
const newSceneName = ref('')
const newSceneType = ref<'3d' | '2d' | 'ui'>('3d')
const selectedSceneTab = ref(0)

// 场景类型标签页配置
const sceneTypeTabs = computed(() => [
  {
    key: '3d',
    label: '3D Scene',
    icon: 'i-heroicons-cube'
  },
  {
    key: '2d',
    label: '2D Scene',
    icon: 'i-heroicons-rectangle-stack'
  },
  {
    key: 'ui',
    label: 'UI Scene',
    icon: 'i-heroicons-window'
  }
])

// 监听标签页切换，更新场景类型
watch(selectedSceneTab, (newTab) => {
  const tabKey = sceneTypeTabs.value[newTab]?.key
  if (tabKey) {
    newSceneType.value = tabKey as '3d' | '2d' | 'ui'
  }
})

// 计算属性
const currentScene = computed(() => editorStore.currentScene)
const selectedNode = computed(() => editorStore.state.selectedNode)

// // 监听场景变化
// watch(currentScene, (newScene, oldScene) => {
//   console.log('🌳 SceneTreeDock scene watcher triggered:', {
//     newScene: newScene?.name,
//     oldScene: oldScene?.name,
//     hasChildren: newScene?.children?.length || 0
//   })

//   if (newScene !== oldScene && newScene) {
//     console.log('🌳 Scene changed in SceneTreeDock:', newScene?.name)
//     // 场景切换时清除选择，但避免在初始化时触发
//     if (oldScene && selectedNode.value) {
//       editorStore.clearSelection()
//     }
//   }
// }, { immediate: true, deep: true })

// 节点类型配置
const nodeTypes = [
  { label: 'Node', value: 'Node', icon: 'i-heroicons-cube' },
  { label: 'Node2D', value: 'Node2D', icon: 'i-heroicons-square-2-stack' },
  { label: 'Node3D', value: 'Node3D', icon: 'i-heroicons-cube-transparent' },
  { label: 'MeshInstance3D', value: 'MeshInstance3D', icon: 'i-heroicons-cube' }
]

// 场景类型配置（保留以备将来使用）
// const sceneTypes = [
//   { label: '3D Scene', value: '3d', icon: 'i-heroicons-cube' },
//   { label: '2D Scene', value: '2d', icon: 'i-heroicons-square-2-stack' },
//   { label: 'UI Scene', value: 'ui', icon: 'i-heroicons-window' }
// ]

// 父节点选项
const parentOptions = computed(() => {
  if (!currentScene.value) return []

  const options: any[] = [
    { label: currentScene.value.name, value: currentScene.value }
  ]

  function addNodeOptions(node: Node, level: number = 1) {
    for (const child of node.children) {
      options.push({
        label: '  '.repeat(level) + child.name,
        value: child
      })
      addNodeOptions(child, level + 1)
    }
  }

  addNodeOptions(currentScene.value)
  return options
})

// ========================================================================
// 事件处理
// ========================================================================

function handleNodeSelect(node: Node) {
  // 更新编辑器状态中的选中节点
  editorStore.setSelectedNode(node)

  // 如果是3D节点，通知3D视口更新transform控制器
  if (node.constructor.name === 'Node3D' || node.constructor.name === 'MeshInstance3D') {
    emit('node-selected-3d', node)
  }
}

function handleNodeContextMenu(event: MouseEvent, node: Node) {
  contextMenuTarget.value = event.target as any
  contextMenuNode.value = node
  showContextMenu.value = true
}

function handleNodeRename(node: Node, newName: string) {
  if (newName && newName !== node.name) {
    // 检查名称是否已存在
    const parent = node.parent
    if (parent) {
      const existingNames = parent.children.map(child => child.name)
      const uniqueName = generateUniqueNodeName(newName, existingNames.filter(name => name !== node.name))
      node.name = uniqueName
    } else {
      node.name = newName
    }
  }
}

function handleNodeDelete(node: Node) {
  if (node.parent) {
    node.parent.removeChild(node)
    node.destroy()

    // 如果删除的是选中节点，清除选择
    if (selectedNode.value === node) {
      editorStore.setSelectedNode(null)
    }
  }
}

// ========================================================================
// 对话框操作
// ========================================================================

function showAddNodeDialog() {
  selectedNodeType.value = ''
  newNodeName.value = ''
  selectedParent.value = (selectedNode.value as any) || (currentScene.value as any)
  showAddDialog.value = true
}

function addNode() {
  if (!selectedNodeType.value || !newNodeName.value) {
    console.warn('⚠️ 节点类型或名称未选择')
    return
  }

  const parent = selectedParent.value || currentScene.value
  if (!parent) {
    console.error('❌ 没有找到父节点')
    return
  }

  // 检查引擎桥接器
  const bridge = editorStore.state.engineBridge
  if (!bridge) {
    console.error('❌ 引擎桥接器未初始化')
    return
  }

  console.log(`🔨 开始创建节点: ${selectedNodeType.value} - ${newNodeName.value}`)
  console.log(`   父节点: ${parent.name}`)

  // 生成唯一名称
  const existingNames = parent.children.map(child => child.name)
  const uniqueName = generateUniqueNodeName(newNodeName.value, existingNames)

  console.log(`   唯一名称: ${uniqueName}`)

  // 创建节点
  let newNode: any

  try {
    switch (selectedNodeType.value) {
      case 'Node':
        newNode = new Node(uniqueName)
        break
      case 'Node2D':
        newNode = new Node2D(uniqueName)
        break
      case 'Node3D':
        newNode = new Node3D(uniqueName)
        break
      case 'MeshInstance3D':
        newNode = new MeshInstance3D(uniqueName)
        // 创建默认网格
        ;(newNode as MeshInstance3D).createBoxMesh()
        break
      default:
        newNode = new Node(uniqueName)
    }

    console.log(`✅ 节点创建成功: ${newNode.constructor.name}`)
    console.log(`   节点ID: ${newNode.getInstanceId()}`)

    // 使用引擎桥接器添加节点
    bridge.addNodeToScene(newNode, parent as any)

    console.log(`✅ 节点已添加到场景`)
    console.log(`   父节点子节点数: ${parent.children.length}`)

    // 强制更新场景节点列表
    editorStore.updateSceneNodes()

    // 选中新节点
    bridge.selectNode(newNode.getInstanceId())

    console.log(`✅ 节点已选中`)

    // 关闭对话框
    showAddDialog.value = false

    // 强制刷新场景树显示
    nextTick(() => {
      console.log('🔄 场景树刷新完成')
    })

  } catch (error) {
    console.error('❌ 创建节点失败:', error)
  }
}

// ========================================================================
// 右键菜单操作
// ========================================================================

function addChildToNode() {
  if (contextMenuNode.value) {
    selectedParent.value = contextMenuNode.value
    showAddNodeDialog()
  }
  showContextMenu.value = false
}

function createScript() {
  if (contextMenuNode.value) {
    // TODO: 实现脚本创建功能
    console.log('Creating script for node:', contextMenuNode.value.name)
    // 这里将来会打开脚本创建对话框
  }
  showContextMenu.value = false
}

function openAnimationEditor() {
  if (contextMenuNode.value && contextMenuNode.value.constructor.name === 'MeshInstance3D') {
    // TODO: 实现面板显示功能
    // editorStore.updatePanel('animation', { visible: true })
    // editorStore.updatePanel('output', { visible: true })

    // 通过事件通知父组件打开动画编辑器
    emit('open-animation-editor', contextMenuNode.value)

    console.log('Opening animation editor for MeshInstance3D:', contextMenuNode.value.name)
  }
  showContextMenu.value = false
}

function renameNode() {
  if (contextMenuNode.value) {
    // 触发节点的重命名模式
    // 这需要通知 QaqSceneTreeNode 组件进入重命名状态
    console.log('Starting rename for node:', contextMenuNode.value.name)

    // TODO: 实现重命名功能
    // 可以通过事件系统或者直接操作 QaqSceneTreeNode 组件来实现
  }
  showContextMenu.value = false
}

function duplicateNode() {
  if (contextMenuNode.value && contextMenuNode.value.parent) {
    // TODO: 实现节点复制
    console.log('Duplicate node:', contextMenuNode.value.name)
  }
  showContextMenu.value = false
}

function deleteNode() {
  if (contextMenuNode.value) {
    handleNodeDelete(contextMenuNode.value as any)
  }
  showContextMenu.value = false
}

// ========================================================================
// 其他操作
// ========================================================================

function refreshTree() {
  // 强制重新渲染
  editorStore.updateSceneNodes()
}

function createNewScene() {
  // 生成默认场景名称
  const existingScenes = editorStore.state.openTabs.filter(tab => tab.type === 'scene')
  const sceneNumber = existingScenes.length + 1
  const defaultName = `Scene${sceneNumber}`

  // 设置默认值并显示对话框
  newSceneName.value = defaultName
  newSceneType.value = '3d'
  selectedSceneTab.value = 0 // 默认选择3D场景标签页
  showCreateSceneDialog.value = true
}

async function confirmCreateSceneFromDialog() {
  if (!newSceneName.value || !newSceneType.value) return

  try {
    // 创建新场景
    const sceneConfig = {
      name: newSceneName.value,
      type: newSceneType.value as '3d' | '2d' | 'ui',
      rootNodeType: newSceneType.value === '3d' ? 'Node3D' : newSceneType.value === '2d' ? 'Node2D' : 'Node'
    }

    // 调用编辑器存储的创建场景方法
    await editorStore.createNewScene(sceneConfig)

    // 关闭对话框
    showCreateSceneDialog.value = false

    // 确保场景树被正确设置
    refreshTree()

    console.log('✅ Created new scene:', newSceneName.value)
  } catch (error) {
    console.error('❌ Failed to create new scene:', error)
  }
}

// ========================================================================
// 空白区域右键菜单
// ========================================================================

function handleEmptyAreaContextMenu(event: MouseEvent) {
  event.preventDefault()

  // 如果没有场景树，显示创建场景选项
  if (!editorStore.state.sceneTree) {
    // TODO: 显示创建场景的右键菜单
    createNewScene()
    return
  }

  // 如果有场景树但没有根节点，显示添加根节点选项
  if (!currentScene.value) {
    showAddNodeDialog()
    return
  }

  // 如果有根节点，显示添加子节点选项
  selectedParent.value = currentScene.value
  showAddNodeDialog()
}

// 监听选中节点变化
watch(selectedNodeType, (newType) => {
  if (newType && !newNodeName.value) {
    newNodeName.value = newType
  }
})
</script>

<style scoped>
.qaq-scene-tree-dock {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-dock-header {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background-color: var(--qaq-header-bg, #404040);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-dock-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
  margin: 0;
}

.qaq-dock-actions {
  display: flex;
  gap: 2px;
}

.qaq-scene-tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.qaq-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}

.qaq-tree-container {
  min-height: 100%;
}

/* 创建场景对话框样式 */
.qaq-create-scene-dialog {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
}

.qaq-scene-tabs {
  margin-bottom: 8px;
}

.qaq-scene-tab-content {
  padding: 16px 0;
}

.qaq-scene-preview {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.qaq-scene-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qaq-scene-description {
  flex: 1;
}

.qaq-scene-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-scene-name-section {
  border-top: 1px solid var(--qaq-border, #555555);
  padding-top: 16px;
}

.qaq-scene-name-group {
  margin-bottom: 0;
}

.qaq-scene-name-input {
  font-size: 1rem;
}

.qaq-scene-name,
.qaq-scene-type {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-add-node-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.qaq-context-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  min-width: 150px;
}
</style>
