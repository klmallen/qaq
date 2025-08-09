<template>
  <div class="test-editor-integration">
    <div class="test-header">
      <h1>编辑器引擎集成测试</h1>
      <p>测试编辑器与QAQ引擎的深度集成功能</p>
    </div>

    <div class="test-controls">
      <div class="control-group">
        <h3>引擎桥接器测试</h3>
        <UButton 
          @click="initializeBridge" 
          :disabled="bridgeInitialized"
          color="primary"
        >
          {{ bridgeInitialized ? '✅ 桥接器已初始化' : '🔧 初始化桥接器' }}
        </UButton>
        
        <UButton 
          @click="createTestScene" 
          :disabled="!bridgeInitialized"
          color="green"
        >
          🌳 创建测试场景
        </UButton>
      </div>

      <div class="control-group">
        <h3>节点操作测试</h3>
        <UButton 
          @click="addCube" 
          :disabled="!sceneCreated"
          color="blue"
        >
          📦 添加立方体
        </UButton>
        
        <UButton 
          @click="addSphere" 
          :disabled="!sceneCreated"
          color="purple"
        >
          🔮 添加球体
        </UButton>
        
        <UButton 
          @click="selectRandomNode" 
          :disabled="!sceneCreated"
          color="orange"
        >
          🎯 随机选择节点
        </UButton>
      </div>

      <div class="control-group">
        <h3>场景信息</h3>
        <div class="info-panel">
          <div class="info-item">
            <span class="label">当前场景:</span>
            <span class="value">{{ currentSceneName || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="label">节点数量:</span>
            <span class="value">{{ nodeCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">选中节点:</span>
            <span class="value">{{ selectedNodeName || '无' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3D视口 -->
    <div class="test-viewport" ref="viewportContainer">
      <div v-if="!bridgeInitialized" class="viewport-placeholder">
        <UIcon name="i-heroicons-cube" class="placeholder-icon" />
        <p>请先初始化引擎桥接器</p>
      </div>
    </div>

    <!-- 节点列表 -->
    <div class="test-nodes">
      <h3>场景节点列表</h3>
      <div v-if="sceneNodes.length === 0" class="empty-nodes">
        <p>暂无节点</p>
      </div>
      <div v-else class="nodes-list">
        <div 
          v-for="node in sceneNodes" 
          :key="node.id"
          class="node-item"
          :class="{ selected: node.id === selectedNodeId }"
          @click="selectNode(node.id)"
        >
          <UIcon :name="getNodeIcon(node.type)" class="node-icon" />
          <span class="node-name">{{ node.name }}</span>
          <span class="node-type">{{ node.type }}</span>
        </div>
      </div>
    </div>

    <!-- 日志输出 -->
    <div class="test-logs">
      <h3>操作日志</h3>
      <div class="logs-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '~/stores/editor'
import { MeshInstance3D, Node3D } from '~/core'

// 页面标题
useHead({
  title: '编辑器引擎集成测试 - QAQ Game Engine'
})

// 状态管理
const editorStore = useEditorStore()

// 响应式数据
const viewportContainer = ref<HTMLElement>()
const bridgeInitialized = ref(false)
const sceneCreated = ref(false)
const logs = ref<Array<{ time: string, message: string, type: string }>>([])

// 计算属性
const currentSceneName = computed(() => {
  return editorStore.currentScene?.name || null
})

const nodeCount = computed(() => {
  return editorStore.state.sceneNodes.length
})

const selectedNodeName = computed(() => {
  const selectedIds = editorStore.state.selectedNodeIds
  if (selectedIds.length === 0) return null
  
  const selectedNode = editorStore.state.sceneNodes.find(node => 
    selectedIds.includes(node.id)
  )
  return selectedNode?.name || null
})

const selectedNodeId = computed(() => {
  const selectedIds = editorStore.state.selectedNodeIds
  return selectedIds.length > 0 ? selectedIds[0] : null
})

const sceneNodes = computed(() => {
  return editorStore.state.sceneNodes
})

// 方法
function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message, type })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

async function initializeBridge() {
  if (!viewportContainer.value) {
    addLog('❌ 视口容器未找到', 'error')
    return
  }

  try {
    addLog('🔧 正在初始化引擎桥接器...', 'info')
    await editorStore.initializeEngineBridge(viewportContainer.value)
    bridgeInitialized.value = true
    addLog('✅ 引擎桥接器初始化成功', 'success')
  } catch (error) {
    addLog(`❌ 引擎桥接器初始化失败: ${error}`, 'error')
  }
}

async function createTestScene() {
  try {
    addLog('🌳 正在创建测试场景...', 'info')
    await editorStore.createNewScene({
      name: 'TestScene',
      type: '3d'
    })
    sceneCreated.value = true
    addLog('✅ 测试场景创建成功', 'success')
  } catch (error) {
    addLog(`❌ 测试场景创建失败: ${error}`, 'error')
  }
}

function addCube() {
  const bridge = editorStore.state.engineBridge
  if (!bridge) {
    addLog('❌ 引擎桥接器未初始化', 'error')
    return
  }

  try {
    const cube = new MeshInstance3D(`Cube_${Date.now()}`)
    cube.createBoxMesh()
    cube.position = { 
      x: (Math.random() - 0.5) * 4, 
      y: Math.random() * 2, 
      z: (Math.random() - 0.5) * 4 
    }
    
    bridge.addNodeToScene(cube)
    addLog(`📦 添加立方体: ${cube.name}`, 'success')
  } catch (error) {
    addLog(`❌ 添加立方体失败: ${error}`, 'error')
  }
}

function addSphere() {
  const bridge = editorStore.state.engineBridge
  if (!bridge) {
    addLog('❌ 引擎桥接器未初始化', 'error')
    return
  }

  try {
    const sphere = new MeshInstance3D(`Sphere_${Date.now()}`)
    sphere.createSphereMesh()
    sphere.position = { 
      x: (Math.random() - 0.5) * 4, 
      y: Math.random() * 2, 
      z: (Math.random() - 0.5) * 4 
    }
    
    bridge.addNodeToScene(sphere)
    addLog(`🔮 添加球体: ${sphere.name}`, 'success')
  } catch (error) {
    addLog(`❌ 添加球体失败: ${error}`, 'error')
  }
}

function selectRandomNode() {
  const bridge = editorStore.state.engineBridge
  if (!bridge || sceneNodes.value.length === 0) {
    addLog('❌ 没有可选择的节点', 'error')
    return
  }

  const randomIndex = Math.floor(Math.random() * sceneNodes.value.length)
  const randomNode = sceneNodes.value[randomIndex]
  
  bridge.selectNode(randomNode.id)
  addLog(`🎯 选择节点: ${randomNode.name}`, 'success')
}

function selectNode(nodeId: string) {
  const bridge = editorStore.state.engineBridge
  if (!bridge) {
    addLog('❌ 引擎桥接器未初始化', 'error')
    return
  }

  bridge.selectNode(nodeId)
  const node = sceneNodes.value.find(n => n.id === nodeId)
  addLog(`🎯 选择节点: ${node?.name}`, 'success')
}

function getNodeIcon(nodeType: string): string {
  switch (nodeType) {
    case 'MeshInstance3D':
      return 'i-heroicons-cube'
    case 'Node3D':
      return 'i-heroicons-cube-transparent'
    case 'Scene':
      return 'i-heroicons-globe-alt'
    default:
      return 'i-heroicons-square-3-stack-3d'
  }
}

// 生命周期
onMounted(() => {
  addLog('🚀 编辑器引擎集成测试页面已加载', 'info')
})

onUnmounted(() => {
  // 清理资源
  if (bridgeInitialized.value) {
    editorStore.state.engineBridge?.dispose()
  }
})
</script>

<style scoped>
.test-editor-integration {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.test-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.control-group {
  background: #1f2937;
  padding: 20px;
  border-radius: 8px;
}

.control-group h3 {
  margin-bottom: 15px;
  font-weight: 600;
}

.control-group button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.info-panel {
  background: #111827;
  padding: 15px;
  border-radius: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #9ca3af;
}

.value {
  color: #f3f4f6;
  font-weight: 600;
}

.test-viewport {
  height: 400px;
  background: #111827;
  border-radius: 8px;
  margin-bottom: 30px;
  position: relative;
}

.viewport-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.test-nodes {
  background: #1f2937;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.test-nodes h3 {
  margin-bottom: 15px;
  font-weight: 600;
}

.empty-nodes {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}

.nodes-list {
  display: grid;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #111827;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  background: #374151;
}

.node-item.selected {
  background: #1d4ed8;
}

.node-icon {
  margin-right: 10px;
  color: #60a5fa;
}

.node-name {
  flex: 1;
  font-weight: 500;
}

.node-type {
  color: #9ca3af;
  font-size: 0.875rem;
}

.test-logs {
  background: #1f2937;
  padding: 20px;
  border-radius: 8px;
}

.test-logs h3 {
  margin-bottom: 15px;
  font-weight: 600;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: #111827;
  border-radius: 6px;
  padding: 10px;
}

.log-item {
  display: flex;
  margin-bottom: 5px;
  font-family: monospace;
  font-size: 0.875rem;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-time {
  color: #6b7280;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.info .log-message {
  color: #60a5fa;
}

.log-item.success .log-message {
  color: #10b981;
}

.log-item.error .log-message {
  color: #ef4444;
}
</style>
