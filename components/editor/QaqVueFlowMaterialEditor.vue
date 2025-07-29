<template>
  <div class="qaq-vueflow-material-editor">
    <!-- Vue Flow 未安装时的占位符 -->
    <div v-if="!isVueFlowAvailable" class="vue-flow-fallback">
      <UIcon name="i-heroicons-exclamation-triangle" class="vue-flow-fallback-icon" />
      <h3>Vue Flow Not Available</h3>
      <p>Vue Flow dependencies are not installed. Please install them to use this editor.</p>
      <div class="vue-flow-fallback-install">
        npm install @vue-flow/core @vue-flow/controls @vue-flow/minimap @vue-flow/background
      </div>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        @click="goBackToSimpleEditor"
      >
        Use Simple Material Editor Instead
      </UButton>
    </div>

    <!-- 材质编辑器布局 -->
    <div v-else class="qaq-material-layout">
      <!-- 左侧节点面板 -->
      <div class="qaq-material-left-panel">
        <div class="qaq-simple-node-palette">
          <h3>Material Nodes</h3>
          <div class="qaq-node-categories">
            <div class="qaq-category">
              <h4>Input Nodes</h4>
              <div class="qaq-node-buttons">
                <UButton
                  v-for="nodeType in ['float', 'vector3', 'color', 'texture-sample']"
                  :key="nodeType"
                  variant="ghost"
                  size="sm"
                  @click="addMaterialNode(nodeType)"
                  class="qaq-node-button"
                  :draggable="true"
                  @dragstart="handleNodeDragStart($event, nodeType)"
                >
                  {{ formatNodeName(nodeType) }}
                </UButton>
              </div>
            </div>

            <div class="qaq-category">
              <h4>Math Nodes</h4>
              <div class="qaq-node-buttons">
                <UButton
                  v-for="nodeType in ['add', 'multiply', 'lerp']"
                  :key="nodeType"
                  variant="ghost"
                  size="sm"
                  @click="addMaterialNode(nodeType)"
                  class="qaq-node-button"
                >
                  {{ formatNodeName(nodeType) }}
                </UButton>
              </div>
            </div>

            <div class="qaq-category">
              <h4>Output</h4>
              <div class="qaq-node-buttons">
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="addMaterialNode('material-output')"
                  class="qaq-node-button"
                >
                  Material Output
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中央Vue Flow画布 -->
      <div class="qaq-material-canvas"
           @drop="handleCanvasDrop"
           @dragover.prevent
           @dragenter.prevent>
        <!-- 材质节点渲染区域 -->
        <div class="material-nodes-container">
          <!-- 渲染所有材质节点 -->
          <TextureSampleNode
            v-for="node in textureNodes"
            :key="node.id"
            :node-id="node.id"
            :position="node.position"
            :is-selected="selectedNodeId === node.id"
            :data="node.data"
            @select="selectNode"
            @update="updateNode"
            :style="{
              left: node.position.x + 'px',
              top: node.position.y + 'px'
            }"
          />

          <MathNode
            v-for="node in mathNodes"
            :key="node.id"
            :node-id="node.id"
            :position="node.position"
            :math-type="node.data.mathType"
            :is-selected="selectedNodeId === node.id"
            :data="node.data"
            @select="selectNode"
            @update="updateNode"
            :style="{
              left: node.position.x + 'px',
              top: node.position.y + 'px'
            }"
          />

          <ConstantNode
            v-for="node in constantNodes"
            :key="node.id"
            :node-id="node.id"
            :position="node.position"
            :constant-type="node.data.constantType"
            :is-selected="selectedNodeId === node.id"
            :data="node.data"
            @select="selectNode"
            @update="updateNode"
            :style="{
              left: node.position.x + 'px',
              top: node.position.y + 'px'
            }"
          />

          <MaterialOutputNode
            v-for="node in outputNodes"
            :key="node.id"
            :node-id="node.id"
            :position="node.position"
            :is-selected="selectedNodeId === node.id"
            :data="node.data"
            @select="selectNode"
            @update="updateNode"
            :style="{
              left: node.position.x + 'px',
              top: node.position.y + 'px'
            }"
          />
        </div>

        <!-- 画布网格背景 -->
        <div class="canvas-grid"></div>

        <!-- 画布状态信息 -->
        <div class="canvas-info">
          <span>Nodes: {{ allNodes.length }} • Connections: {{ connections.length }}</span>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="qaq-material-right-panel">
        <div class="qaq-simple-properties">
          <h3>Node Properties</h3>

          <div v-if="!selectedNode" class="qaq-no-selection">
            <p>No node selected</p>
          </div>

          <div v-else class="qaq-node-details">
            <div class="qaq-property-group">
              <label>Node Type</label>
              <span>{{ selectedNode.data.type }}</span>
            </div>

            <div class="qaq-property-group">
              <label>Node ID</label>
              <span>{{ selectedNode.id }}</span>
            </div>

            <div class="qaq-property-group">
              <label>Position</label>
              <span>{{ selectedNode.position.x.toFixed(0) }}, {{ selectedNode.position.y.toFixed(0) }}</span>
            </div>

            <div v-if="Object.keys(selectedNode.data.properties).length > 0" class="qaq-property-group">
              <label>Properties</label>
              <div class="qaq-properties-list">
                <div
                  v-for="(value, key) in selectedNode.data.properties"
                  :key="key"
                  class="qaq-property-item"
                >
                  <span class="qaq-property-key">{{ key }}:</span>
                  <span class="qaq-property-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 材质编辑器工具栏 -->
    <div class="qaq-material-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-plus"
          variant="ghost"
          size="sm"
          @click="addOutputNode"
        >
          Add Output
        </UButton>
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="sm"
          @click="resetMaterial"
        >
          Reset
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          variant="ghost"
          size="sm"
          @click="exportMaterial"
        >
          Export
        </UButton>
      </div>

      <div class="qaq-toolbar-right">
        <span class="qaq-material-info">
          Nodes: {{ nodes.length }} • Connections: {{ edges.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, defineAsyncComponent } from 'vue'

// 导入材质节点组件
import TextureSampleNode from './material/nodes/TextureSampleNode.vue'
import MathNode from './material/nodes/MathNode.vue'
import ConstantNode from './material/nodes/ConstantNode.vue'
import MaterialOutputNode from './material/nodes/MaterialOutputNode.vue'

// 检查Vue Flow是否可用
const isVueFlowAvailable = ref(true)

// 尝试检查Vue Flow是否可用
try {
  // 简单的检查方式
  // isVueFlowAvailable.value = false // 暂时设为false，直到依赖安装
} catch (error) {
  console.warn('Vue Flow is not available:', error)
  // isVueFlowAvailable.value = false
}

// 临时的类型定义
interface Node {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

interface Edge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  animated?: boolean
  style?: any
}

interface Connection {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

// 导入自定义组件（条件导入）
const QaqMaterialNodePalette = defineAsyncComponent(() =>
  import('./material/QaqMaterialNodePalette.vue').catch(() =>
    Promise.resolve({ template: '<div>Node Palette Loading...</div>' })
  )
)

const QaqVueFlowMaterialNode = defineAsyncComponent(() =>
  import('./material/QaqVueFlowMaterialNode.vue').catch(() =>
    Promise.resolve({ template: '<div>Material Node</div>' })
  )
)

const QaqVueFlowMaterialEdge = defineAsyncComponent(() =>
  import('./material/QaqVueFlowMaterialEdge.vue').catch(() =>
    Promise.resolve({ template: '<div>Material Edge</div>' })
  )
)

const QaqMaterialNodeProperties = defineAsyncComponent(() =>
  import('./material/QaqMaterialNodeProperties.vue').catch(() =>
    Promise.resolve({ template: '<div>Node Properties Loading...</div>' })
  )
)

// 材质节点数据接口
interface MaterialNodeData {
  label: string
  type: string
  icon: string
  inputs: MaterialInput[]
  outputs: MaterialOutput[]
  properties: Record<string, any>
}

interface MaterialInput {
  id: string
  name: string
  type: 'float' | 'vector2' | 'vector3' | 'vector4' | 'color' | 'texture'
  defaultValue?: any
}

interface MaterialOutput {
  id: string
  name: string
  type: 'float' | 'vector2' | 'vector3' | 'vector4' | 'color' | 'texture'
}

// 响应式数据
const nodes = ref<Node<MaterialNodeData>[]>([])
const edges = ref<Edge[]>([])
const selectedNode = ref<Node<MaterialNodeData> | null>(null)
const selectedNodeId = ref<string | null>(null)
const connections = ref<Connection[]>([])

// 节点分类计算属性
const textureNodes = computed(() =>
  nodes.value.filter(node => node.type === 'texture-sample')
)

const mathNodes = computed(() =>
  nodes.value.filter(node => ['add', 'multiply', 'subtract', 'divide', 'lerp'].includes(node.type))
)

const constantNodes = computed(() =>
  nodes.value.filter(node => ['float', 'vector3', 'color'].includes(node.type))
)

const outputNodes = computed(() =>
  nodes.value.filter(node => node.type === 'material-output')
)

const allNodes = computed(() => nodes.value)

// Vue Flow 实例（暂时禁用）
// let vueFlowInstance: any = null

// 材质节点类型定义
const materialNodeTypes = {
  // 输入节点
  'texture-sample': {
    label: 'Texture Sample',
    icon: 'i-heroicons-photo',
    inputs: [
      { id: 'texture', name: 'Texture', type: 'texture' },
      { id: 'uv', name: 'UV', type: 'vector2', defaultValue: [0, 0] }
    ],
    outputs: [
      { id: 'rgba', name: 'RGBA', type: 'vector4' },
      { id: 'rgb', name: 'RGB', type: 'vector3' },
      { id: 'r', name: 'R', type: 'float' },
      { id: 'g', name: 'G', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
      { id: 'a', name: 'A', type: 'float' }
    ],
    properties: {
      textureFile: '',
      filterMode: 'linear',
      wrapMode: 'repeat'
    }
  },
  'constant': {
    label: 'Constant',
    icon: 'i-heroicons-hashtag',
    inputs: [],
    outputs: [
      { id: 'value', name: 'Value', type: 'float' }
    ],
    properties: {
      value: 1.0
    }
  },
  'vector3': {
    label: 'Vector3',
    icon: 'i-heroicons-cube',
    inputs: [],
    outputs: [
      { id: 'vector', name: 'Vector', type: 'vector3' }
    ],
    properties: {
      x: 0.0,
      y: 0.0,
      z: 0.0
    }
  },
  'color': {
    label: 'Color',
    icon: 'i-heroicons-swatch',
    inputs: [],
    outputs: [
      { id: 'color', name: 'Color', type: 'color' }
    ],
    properties: {
      color: '#ffffff'
    }
  },

  // 数学节点
  'add': {
    label: 'Add',
    icon: 'i-heroicons-plus',
    inputs: [
      { id: 'a', name: 'A', type: 'float', defaultValue: 0 },
      { id: 'b', name: 'B', type: 'float', defaultValue: 0 }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'float' }
    ],
    properties: {}
  },
  'multiply': {
    label: 'Multiply',
    icon: 'i-heroicons-x-mark',
    inputs: [
      { id: 'a', name: 'A', type: 'float', defaultValue: 1 },
      { id: 'b', name: 'B', type: 'float', defaultValue: 1 }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'float' }
    ],
    properties: {}
  },
  'lerp': {
    label: 'Lerp',
    icon: 'i-heroicons-arrows-right-left',
    inputs: [
      { id: 'a', name: 'A', type: 'float', defaultValue: 0 },
      { id: 'b', name: 'B', type: 'float', defaultValue: 1 },
      { id: 't', name: 'T', type: 'float', defaultValue: 0.5 }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'float' }
    ],
    properties: {}
  },

  // 输出节点
  'material-output': {
    label: 'Material Output',
    icon: 'i-heroicons-arrow-right-circle',
    inputs: [
      { id: 'baseColor', name: 'Base Color', type: 'color', defaultValue: [1, 1, 1, 1] },
      { id: 'metallic', name: 'Metallic', type: 'float', defaultValue: 0 },
      { id: 'roughness', name: 'Roughness', type: 'float', defaultValue: 0.5 },
      { id: 'normal', name: 'Normal', type: 'vector3', defaultValue: [0, 0, 1] },
      { id: 'emission', name: 'Emission', type: 'color', defaultValue: [0, 0, 0, 1] }
    ],
    outputs: [],
    properties: {}
  }
}

// 方法
function addMaterialNode(nodeType: string, position?: { x: number; y: number }) {
  console.log(`Adding material node: ${nodeType}`)

  const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 根据节点类型创建不同的数据结构
  let nodeData: any = {}

  switch (nodeType) {
    case 'texture-sample':
      nodeData = { type: 'texture-sample' }
      break
    case 'float':
      nodeData = { type: 'float', constantType: 'float', value: 1.0 }
      break
    case 'vector3':
      nodeData = { type: 'vector3', constantType: 'vector3', vector: { x: 0, y: 0, z: 0 } }
      break
    case 'color':
      nodeData = { type: 'color', constantType: 'color', color: '#ffffff' }
      break
    case 'add':
    case 'multiply':
    case 'subtract':
    case 'divide':
    case 'lerp':
      nodeData = { type: nodeType, mathType: nodeType }
      break
    case 'material-output':
      nodeData = { type: 'material-output' }
      break
    default:
      console.warn(`Unknown node type: ${nodeType}`)
      return
  }

  const newNode: Node = {
    id: nodeId,
    type: nodeType,
    position: position || {
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150
    },
    data: nodeData
  }

  nodes.value.push(newNode)
  console.log(`Added node: ${nodeId}`, newNode)
  return newNode
}

function addOutputNode() {
  addMaterialNode('material-output')
}

// 选择节点
const selectNode = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectedNode.value = nodes.value.find(node => node.id === nodeId) || null
  console.log('Selected node:', selectedNode.value)
}

// 更新节点数据
const updateNode = (nodeId: string, data: any) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data = { ...node.data, ...data }
    console.log('Updated node:', nodeId, data)
  }
}

// 处理节点拖拽开始
const handleNodeDragStart = (event: DragEvent, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/node-type', nodeType)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// 处理画布拖放
const handleCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  const nodeType = event.dataTransfer?.getData('application/node-type')
  if (nodeType) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    addMaterialNode(nodeType, position)
  }
}

function onNodesChange(changes: any[]) {
  console.log('📝 Nodes changed:', changes)
}

function onEdgesChange(changes: any[]) {
  console.log('🔗 Edges changed:', changes)
}

function onConnect(connection: Connection) {
  const newEdge: Edge = {
    id: `edge-${Date.now()}`,
    type: 'material',
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    animated: true,
    style: {
      stroke: '#00DC82',
      strokeWidth: 2
    }
  }

  edges.value.push(newEdge)
  console.log('🔗 Connected:', newEdge)
}

function onNodeClick(event: any) {
  selectedNode.value = event.node
  console.log('🎯 Selected node:', event.node)
}

function onEdgeClick(event: any) {
  console.log('🔗 Selected edge:', event.edge)
}

function onPaneClick() {
  selectedNode.value = null
}

function updateNodeProperties(nodeId: string, properties: Record<string, any>) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data.properties = { ...node.data.properties, ...properties }
    console.log('⚙️ Updated node properties:', nodeId, properties)
  }
}

function resetMaterial() {
  nodes.value = []
  edges.value = []
  selectedNode.value = null

  // 添加默认的材质输出节点
  addOutputNode()

  console.log('🔄 Material reset')
}

function exportMaterial() {
  const materialData = {
    nodes: nodes.value.map(node => ({
      id: node.id,
      type: node.data.type,
      position: node.position,
      properties: node.data.properties
    })),
    edges: edges.value.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }))
  }

  console.log('💾 Exported material:', materialData)

  // TODO: 实现实际的导出逻辑
  const blob = new Blob([JSON.stringify(materialData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'material.json'
  a.click()
  URL.revokeObjectURL(url)
}

function goBackToSimpleEditor() {
  console.log('🔄 Switching to simple material editor')
  // 发送事件给父组件切换到简单材质编辑器
  // TODO: 实现切换逻辑
}

function formatNodeName(nodeType: string): string {
  return nodeType.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// 生命周期
onMounted(() => {
  console.log('🎨 Vue Flow Material Editor mounted')

  // 添加默认的材质输出节点
  nextTick(() => {
    addOutputNode()
  })
})

// 暴露方法给父组件
defineExpose({
  addMaterialNode,
  resetMaterial,
  exportMaterial
})
</script>

<style scoped>
.qaq-vueflow-material-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-material-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.qaq-material-left-panel {
  width: 280px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  flex-shrink: 0;
  overflow-y: auto;
}

.qaq-material-canvas {
  flex: 1;
  position: relative;
  background-color: var(--qaq-bg-primary, #0a0a0a);
  border: 1px solid var(--qaq-border, #404040);
  border-radius: 8px;
  overflow: hidden;
}

.material-nodes-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.canvas-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--qaq-text-secondary, #cccccc);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 10;
}

.qaq-vue-flow {
  width: 100%;
  height: 100%;
}

.qaq-material-right-panel {
  width: 320px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  flex-shrink: 0;
  overflow-y: auto;
}

.qaq-material-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  flex-shrink: 0;
}

.qaq-toolbar-left,
.qaq-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-material-info {
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
}

/* Vue Flow 深色主题覆盖 */
.qaq-vue-flow.dark {
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-vue-flow.dark .vue-flow__background {
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-vue-flow.dark .vue-flow__controls {
  background-color: var(--qaq-bg-secondary, #1a1a1a);
}

.qaq-vue-flow.dark .vue-flow__minimap {
  background-color: var(--qaq-bg-secondary, #1a1a1a);
}

.qaq-vueflow-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-placeholder-content {
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
  max-width: 400px;
  padding: 32px;
}

.qaq-placeholder-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  opacity: 0.5;
  color: var(--qaq-accent, #00DC82);
}

.qaq-placeholder-content h3 {
  font-size: 1.25rem;
  margin: 0 0 8px 0;
  color: var(--qaq-text-primary, #ffffff);
}

.qaq-placeholder-content p {
  margin: 0 0 8px 0;
  opacity: 0.7;
  line-height: 1.5;
}

.qaq-placeholder-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

/* 简化的节点面板样式 */
.qaq-simple-node-palette {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.qaq-simple-node-palette h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0 0 16px 0;
}

.qaq-node-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qaq-category h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-node-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qaq-node-button {
  justify-content: flex-start;
  width: 100%;
}

/* 简化的属性面板样式 */
.qaq-simple-properties {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.qaq-simple-properties h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0 0 16px 0;
}

.qaq-no-selection {
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
  opacity: 0.7;
  margin-top: 40px;
}

.qaq-node-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qaq-property-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qaq-property-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-secondary, #cccccc);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-property-group span {
  font-size: 0.875rem;
  color: var(--qaq-text-primary, #ffffff);
}

.qaq-properties-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  padding: 8px;
  border-radius: 4px;
}

.qaq-property-item {
  display: flex;
  gap: 8px;
}

.qaq-property-key {
  font-weight: 500;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-property-value {
  color: var(--qaq-accent, #00DC82);
}
</style>
