<!--
  QAQ编辑器通信系统测试组件
  
  用于验证编辑器与引擎之间的双向通信是否正常工作
-->

<template>
  <div class="communication-test">
    <h2>编辑器通信系统测试</h2>
    
    <!-- 状态显示 -->
    <div class="status-panel">
      <h3>当前状态</h3>
      <div class="status-item">
        <label>场景树:</label>
        <span>{{ sceneTreeStatus }}</span>
      </div>
      <div class="status-item">
        <label>当前场景:</label>
        <span>{{ currentSceneName }}</span>
      </div>
      <div class="status-item">
        <label>节点数量:</label>
        <span>{{ nodeCount }}</span>
      </div>
      <div class="status-item">
        <label>选中节点:</label>
        <span>{{ selectedNodeIds.join(', ') || '无' }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-panel">
      <h3>测试操作</h3>
      <button @click="createTestScene" :disabled="!canCreateScene">
        创建测试场景
      </button>
      <button @click="addTestNode" :disabled="!canAddNode">
        添加测试节点
      </button>
      <button @click="selectRandomNode" :disabled="!canSelectNode">
        随机选择节点
      </button>
      <button @click="clearSelection" :disabled="!hasSelection">
        清除选择
      </button>
    </div>

    <!-- 事件日志 -->
    <div class="events-panel">
      <h3>事件日志</h3>
      <div class="events-log">
        <div 
          v-for="event in eventLog" 
          :key="event.id"
          class="event-item"
          :class="event.type"
        >
          <span class="timestamp">{{ formatTime(event.timestamp) }}</span>
          <span class="event-type">{{ event.type }}</span>
          <span class="event-data">{{ JSON.stringify(event.data) }}</span>
        </div>
      </div>
      <button @click="clearEventLog">清除日志</button>
    </div>

    <!-- Watch 监听器状态 -->
    <div class="watchers-panel">
      <h3>Watch 监听器状态</h3>
      <div class="watcher-item">
        <label>sceneTree watch:</label>
        <span :class="{ active: sceneTreeWatchTriggered }">
          {{ sceneTreeWatchTriggered ? '✅ 已触发' : '❌ 未触发' }}
        </span>
      </div>
      <div class="watcher-item">
        <label>currentScene watch:</label>
        <span :class="{ active: currentSceneWatchTriggered }">
          {{ currentSceneWatchTriggered ? '✅ 已触发' : '❌ 未触发' }}
        </span>
      </div>
      <div class="watcher-item">
        <label>sceneNodes watch:</label>
        <span :class="{ active: sceneNodesWatchTriggered }">
          {{ sceneNodesWatchTriggered ? '✅ 已触发' : '❌ 未触发' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { getEditorEventBus } from '@/core/editor/EditorEventBus'
import { Node3D, MeshInstance3D } from '@/core'

// 编辑器状态
const editorStore = useEditorStore()
const eventBus = getEditorEventBus()

// 测试状态
const eventLog = ref<Array<{
  id: number,
  timestamp: number,
  type: string,
  data: any
}>>([])
let eventIdCounter = 0

// Watch 触发状态
const sceneTreeWatchTriggered = ref(false)
const currentSceneWatchTriggered = ref(false)
const sceneNodesWatchTriggered = ref(false)

// 计算属性
const sceneTreeStatus = computed(() => {
  return editorStore.state.sceneTree ? '已加载' : '未加载'
})

const currentSceneName = computed(() => {
  return editorStore.currentScene?.name || '无'
})

const nodeCount = computed(() => {
  return editorStore.state.sceneNodes.length
})

const selectedNodeIds = computed(() => {
  return editorStore.state.selectedNodeIds
})

const canCreateScene = computed(() => {
  return editorStore.state.engineBridge !== null
})

const canAddNode = computed(() => {
  return editorStore.currentScene !== null
})

const canSelectNode = computed(() => {
  return editorStore.state.sceneNodes.length > 0
})

const hasSelection = computed(() => {
  return editorStore.state.selectedNodeIds.length > 0
})

// 事件监听
onMounted(() => {
  // 监听所有编辑器事件
  const eventTypes = [
    'scene:loaded',
    'scene:changed',
    'scene:node_added',
    'scene:node_removed',
    'selection:changed',
    'selection:cleared'
  ]

  eventTypes.forEach(eventType => {
    eventBus.on(eventType as any, (event) => {
      addEventLog(eventType, event.data)
    })
  })

  // 启用调试模式
  eventBus.setDebugMode(true)
})

// Watch 监听器
watch(() => editorStore.state.sceneTree, (newTree, oldTree) => {
  sceneTreeWatchTriggered.value = true
  addEventLog('watch:sceneTree', { 
    hasTree: !!newTree,
    sceneName: newTree?.currentScene?.name 
  })
  console.log('🌳 sceneTree watch 触发:', newTree?.currentScene?.name)
}, { deep: true })

watch(() => editorStore.currentScene, (newScene, oldScene) => {
  currentSceneWatchTriggered.value = true
  addEventLog('watch:currentScene', { 
    newScene: newScene?.name,
    oldScene: oldScene?.name 
  })
  console.log('🎬 currentScene watch 触发:', newScene?.name)
})

watch(() => editorStore.state.sceneNodes, (newNodes, oldNodes) => {
  sceneNodesWatchTriggered.value = true
  addEventLog('watch:sceneNodes', { 
    count: newNodes.length,
    oldCount: oldNodes?.length || 0 
  })
  console.log('📦 sceneNodes watch 触发:', newNodes.length)
}, { deep: true })

// 测试方法
async function createTestScene() {
  try {
    await editorStore.createNewScene({
      name: `TestScene_${Date.now()}`,
      type: '3d'
    })
    addEventLog('action:createScene', { success: true })
  } catch (error) {
    addEventLog('action:createScene', { success: false, error: error.message })
  }
}

function addTestNode() {
  if (!editorStore.state.engineBridge || !editorStore.currentScene) {
    return
  }

  try {
    const testNode = new MeshInstance3D(`TestNode_${Date.now()}`)
    testNode.createBoxMesh()
    
    editorStore.state.engineBridge.addNodeToScene(testNode, editorStore.currentScene)
    addEventLog('action:addNode', { nodeName: testNode.name })
  } catch (error) {
    addEventLog('action:addNode', { success: false, error: error.message })
  }
}

function selectRandomNode() {
  const nodes = editorStore.state.sceneNodes
  if (nodes.length === 0) return

  const randomIndex = Math.floor(Math.random() * nodes.length)
  const randomNode = nodes[randomIndex]
  
  if (editorStore.state.engineBridge) {
    editorStore.state.engineBridge.selectNode(randomNode.id)
    addEventLog('action:selectNode', { nodeId: randomNode.id, nodeName: randomNode.name })
  }
}

function clearSelection() {
  if (editorStore.state.engineBridge) {
    editorStore.state.engineBridge.clearSelection()
    addEventLog('action:clearSelection', {})
  }
}

// 辅助方法
function addEventLog(type: string, data: any) {
  eventLog.value.unshift({
    id: eventIdCounter++,
    timestamp: Date.now(),
    type,
    data
  })
  
  // 限制日志数量
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

function clearEventLog() {
  eventLog.value = []
  // 重置 watch 触发状态
  sceneTreeWatchTriggered.value = false
  currentSceneWatchTriggered.value = false
  sceneNodesWatchTriggered.value = false
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
.communication-test {
  padding: 20px;
  font-family: monospace;
}

.status-panel, .actions-panel, .events-panel, .watchers-panel {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.status-item, .watcher-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.actions-panel button {
  margin-right: 10px;
  margin-bottom: 5px;
  padding: 8px 12px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.actions-panel button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.events-log {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
}

.event-item {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
}

.timestamp {
  color: #666;
  min-width: 80px;
}

.event-type {
  color: #007acc;
  min-width: 120px;
}

.event-data {
  color: #333;
  word-break: break-all;
}

.watcher-item .active {
  color: #28a745;
  font-weight: bold;
}
</style>
