<template>
  <div class="qaq-blueprint-material-editor">
    <!-- 工具栏 -->
    <div class="qaq-blueprint-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-plus"
          variant="ghost"
          size="sm"
          @click="showNodePalette = !showNodePalette"
        >
          Add Node
        </UButton>
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="sm"
          @click="resetView"
        >
          Reset View
        </UButton>
        <UButton
          icon="i-heroicons-eye"
          variant="ghost"
          size="sm"
          @click="previewMaterial"
        >
          Preview
        </UButton>
      </div>

      <div class="qaq-toolbar-right">
        <UButton
          icon="i-heroicons-document-arrow-down"
          variant="ghost"
          size="sm"
          @click="saveMaterial"
        >
          Save Material
        </UButton>
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="qaq-blueprint-main">
      <!-- 节点面板 -->
      <div v-if="showNodePalette" class="qaq-node-palette">
        <div class="qaq-palette-header">
          <h4>Material Nodes</h4>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="xs"
            @click="showNodePalette = false"
          />
        </div>

        <div class="qaq-palette-content">
          <div class="qaq-node-category">
            <h5>Input</h5>
            <div class="qaq-node-list">
              <div
                v-for="node in inputNodes"
                :key="node.type"
                class="qaq-node-item"
                @click="addNode(node)"
              >
                <UIcon :name="node.icon" class="qaq-node-icon" />
                <span>{{ node.label }}</span>
              </div>
            </div>
          </div>

          <div class="qaq-node-category">
            <h5>Math</h5>
            <div class="qaq-node-list">
              <div
                v-for="node in mathNodes"
                :key="node.type"
                class="qaq-node-item"
                @click="addNode(node)"
              >
                <UIcon :name="node.icon" class="qaq-node-icon" />
                <span>{{ node.label }}</span>
              </div>
            </div>
          </div>

          <div class="qaq-node-category">
            <h5>Texture</h5>
            <div class="qaq-node-list">
              <div
                v-for="node in textureNodes"
                :key="node.type"
                class="qaq-node-item"
                @click="addNode(node)"
              >
                <UIcon :name="node.icon" class="qaq-node-icon" />
                <span>{{ node.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 简化的Blueprint画布 -->
      <div class="qaq-blueprint-canvas">
        <div
          class="qaq-canvas-container"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @wheel="onCanvasWheel"
        >
          <!-- 网格背景 -->
          <div class="qaq-canvas-grid" :style="gridStyle"></div>

          <!-- 节点容器 -->
          <div
            class="qaq-nodes-container"
            :style="canvasTransform"
          >
            <!-- 渲染所有节点 -->
            <div
              v-for="node in nodes"
              :key="node.id"
              class="qaq-canvas-node"
              :style="getNodeStyle(node)"
              @mousedown="onNodeMouseDown(node, $event)"
            >
              <QaqMaterialNode
                :data="node.data"
                :node-id="node.id"
                @start-connection="startConnection"
                @end-connection="endConnection"
              />
            </div>

            <!-- 渲染连接线 -->
            <svg class="qaq-connections-svg">
              <path
                v-for="connection in connections"
                :key="connection.id"
                :d="getConnectionPath(connection)"
                class="qaq-connection-path"
                stroke="#00DC82"
                stroke-width="2"
                fill="none"
              />
            </svg>
          </div>

          <!-- 画布控制器 -->
          <div class="qaq-canvas-controls">
            <UButton
              icon="i-heroicons-plus"
              variant="ghost"
              size="sm"
              @click="zoomIn"
              title="Zoom In"
            />
            <UButton
              icon="i-heroicons-minus"
              variant="ghost"
              size="sm"
              @click="zoomOut"
              title="Zoom Out"
            />
            <UButton
              icon="i-heroicons-arrow-path"
              variant="ghost"
              size="sm"
              @click="resetCanvas"
              title="Reset View"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 属性面板 -->
    <div class="qaq-blueprint-properties">
      <div class="qaq-properties-header">
        <h4>Properties</h4>
      </div>

      <div class="qaq-properties-content">
        <div v-if="selectedNode" class="qaq-node-properties">
          <h5>{{ selectedNode.data.label }}</h5>

          <!-- 根据节点类型显示不同的属性 -->
          <div v-if="selectedNode.type === 'texture'" class="qaq-property-group">
            <UFormGroup label="Texture">
              <UInput
                v-model="selectedNode.data.texture"
                placeholder="Select texture..."
                readonly
                @click="selectTexture"
              />
            </UFormGroup>
          </div>

          <div v-if="selectedNode.type === 'constant'" class="qaq-property-group">
            <UFormGroup label="Value">
              <UInput
                v-model="selectedNode.data.value"
                type="number"
                step="0.01"
              />
            </UFormGroup>
          </div>

          <div v-if="selectedNode.type === 'color'" class="qaq-property-group">
            <UFormGroup label="Color">
              <input
                v-model="selectedNode.data.color"
                type="color"
                class="qaq-color-input"
              />
            </UFormGroup>
          </div>
        </div>

        <div v-else class="qaq-empty-properties">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="qaq-empty-icon" />
          <p>Select a node to edit properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 导入自定义节点组件
import QaqMaterialNode from './blueprint/QaqMaterialNode.vue'

// 简化的节点和连接类型定义
interface SimpleNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    type: string
    icon: string
    inputs: string[]
    outputs: string[]
    value?: number
    color?: string
    texture?: string
  }
}

interface SimpleConnection {
  id: string
  source: string
  target: string
  sourceOutput: string
  targetInput: string
}

// 响应式数据
const showNodePalette = ref(true)
const selectedNode = ref<SimpleNode | null>(null)
const nodes = ref<SimpleNode[]>([])
const connections = ref<SimpleConnection[]>([])
const canvasOffset = ref({ x: 0, y: 0 })
const canvasZoom = ref(1)

// 节点类型定义
const inputNodes = [
  { type: 'uv', label: 'UV Coordinates', icon: 'i-heroicons-map' },
  { type: 'time', label: 'Time', icon: 'i-heroicons-clock' },
  { type: 'constant', label: 'Constant', icon: 'i-heroicons-hashtag' },
  { type: 'color', label: 'Color', icon: 'i-heroicons-swatch' }
]

const mathNodes = [
  { type: 'add', label: 'Add', icon: 'i-heroicons-plus' },
  { type: 'multiply', label: 'Multiply', icon: 'i-heroicons-x-mark' },
  { type: 'subtract', label: 'Subtract', icon: 'i-heroicons-minus' },
  { type: 'divide', label: 'Divide', icon: 'i-heroicons-slash' },
  { type: 'power', label: 'Power', icon: 'i-heroicons-arrow-up' },
  { type: 'lerp', label: 'Lerp', icon: 'i-heroicons-arrows-right-left' }
]

const textureNodes = [
  { type: 'texture', label: 'Texture Sample', icon: 'i-heroicons-photo' },
  { type: 'normal', label: 'Normal Map', icon: 'i-heroicons-cube' },
  { type: 'noise', label: 'Noise', icon: 'i-heroicons-sparkles' }
]

// 计算属性
const canvasTransform = computed(() => ({
  transform: `translate(${canvasOffset.value.x}px, ${canvasOffset.value.y}px) scale(${canvasZoom.value})`
}))

const gridStyle = computed(() => ({
  backgroundSize: `${20 * canvasZoom.value}px ${20 * canvasZoom.value}px`,
  backgroundPosition: `${canvasOffset.value.x}px ${canvasOffset.value.y}px`
}))

// 方法
function addNode(nodeType: any) {
  const newNode: SimpleNode = {
    id: `${nodeType.type}-${Date.now()}`,
    type: 'material',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    data: {
      label: nodeType.label,
      type: nodeType.type,
      icon: nodeType.icon,
      inputs: getNodeInputs(nodeType.type),
      outputs: getNodeOutputs(nodeType.type)
    }
  }

  nodes.value.push(newNode)
  console.log('Added node:', newNode)
}

function getNodeInputs(type: string): string[] {
  const inputMap: Record<string, string[]> = {
    'add': ['A', 'B'],
    'multiply': ['A', 'B'],
    'subtract': ['A', 'B'],
    'divide': ['A', 'B'],
    'power': ['Base', 'Exponent'],
    'lerp': ['A', 'B', 'Alpha'],
    'texture': ['UV'],
    'normal': ['UV'],
    'noise': ['UV', 'Scale']
  }
  return inputMap[type] || []
}

function getNodeOutputs(type: string): string[] {
  const outputMap: Record<string, string[]> = {
    'uv': ['UV'],
    'time': ['Time'],
    'constant': ['Value'],
    'color': ['RGB', 'R', 'G', 'B', 'A'],
    'add': ['Result'],
    'multiply': ['Result'],
    'subtract': ['Result'],
    'divide': ['Result'],
    'power': ['Result'],
    'lerp': ['Result'],
    'texture': ['RGB', 'R', 'G', 'B', 'A'],
    'normal': ['Normal'],
    'noise': ['Value']
  }
  return outputMap[type] || ['Output']
}

// 画布交互方法
let isDragging = false
let dragStartPos = { x: 0, y: 0 }
let dragStartOffset = { x: 0, y: 0 }
let isDraggingNode = false
let draggedNode: SimpleNode | null = null
let nodeDragStartPos = { x: 0, y: 0 }
let nodeDragStartNodePos = { x: 0, y: 0 }
let isConnecting = false
let connectionStart: { nodeId: string; outputIndex: number } | null = null
let tempConnectionEnd = { x: 0, y: 0 }

function getNodeStyle(node: SimpleNode) {
  return {
    position: 'absolute',
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
    zIndex: selectedNode.value?.id === node.id ? 10 : 1
  }
}

function onCanvasMouseDown(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    isDragging = true
    dragStartPos = { x: event.clientX, y: event.clientY }
    dragStartOffset = { ...canvasOffset.value }
  }
}

function onCanvasMouseMove(event: MouseEvent) {
  if (isDraggingNode && draggedNode) {
    // 节点拖拽
    const deltaX = (event.clientX - nodeDragStartPos.x) / canvasZoom.value
    const deltaY = (event.clientY - nodeDragStartPos.y) / canvasZoom.value

    draggedNode.position = {
      x: nodeDragStartNodePos.x + deltaX,
      y: nodeDragStartNodePos.y + deltaY
    }
  } else if (isDragging) {
    // 画布拖拽
    const deltaX = event.clientX - dragStartPos.x
    const deltaY = event.clientY - dragStartPos.y
    canvasOffset.value = {
      x: dragStartOffset.x + deltaX,
      y: dragStartOffset.y + deltaY
    }
  }

  // 更新临时连接线
  updateTempConnection(event)
}

function onCanvasMouseUp() {
  isDragging = false
  isDraggingNode = false
  draggedNode = null
}

function onCanvasWheel(event: WheelEvent) {
  event.preventDefault()
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  canvasZoom.value = Math.max(0.2, Math.min(4, canvasZoom.value * zoomFactor))
}

function onNodeMouseDown(node: SimpleNode, event: MouseEvent) {
  event.stopPropagation()
  selectedNode.value = node

  // 开始节点拖拽
  isDraggingNode = true
  draggedNode = node
  nodeDragStartPos = { x: event.clientX, y: event.clientY }
  nodeDragStartNodePos = { ...node.position }

  console.log('Selected node:', node)
}

function getConnectionPath(connection: SimpleConnection): string {
  // 简化的连接路径计算
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) return ''

  const startX = sourceNode.position.x + 150
  const startY = sourceNode.position.y + 50
  const endX = targetNode.position.x
  const endY = targetNode.position.y + 50

  const midX = (startX + endX) / 2

  return `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`
}

function zoomIn() {
  canvasZoom.value = Math.min(4, canvasZoom.value * 1.2)
}

function zoomOut() {
  canvasZoom.value = Math.max(0.2, canvasZoom.value / 1.2)
}

function resetCanvas() {
  canvasOffset.value = { x: 0, y: 0 }
  canvasZoom.value = 1
}

// 连接相关方法
function startConnection(nodeId: string, outputIndex: number, event: MouseEvent) {
  event.stopPropagation()
  isConnecting = true
  connectionStart = { nodeId, outputIndex }
  tempConnectionEnd = { x: event.clientX, y: event.clientY }
  console.log('Started connection from:', nodeId, 'output:', outputIndex)
}

function endConnection(nodeId: string, inputIndex: number, event: MouseEvent) {
  event.stopPropagation()

  if (isConnecting && connectionStart && connectionStart.nodeId !== nodeId) {
    // 创建新连接
    const newConnection: SimpleConnection = {
      id: `connection-${Date.now()}`,
      source: connectionStart.nodeId,
      target: nodeId,
      sourceOutput: connectionStart.outputIndex.toString(),
      targetInput: inputIndex.toString()
    }

    connections.value.push(newConnection)
    console.log('Created connection:', newConnection)
  }

  // 重置连接状态
  isConnecting = false
  connectionStart = null
}

function updateTempConnection(event: MouseEvent) {
  if (isConnecting) {
    tempConnectionEnd = { x: event.clientX, y: event.clientY }
  }
}

function resetView() {
  // 重置视图
  console.log('Reset view')
}

function previewMaterial() {
  // 预览材质
  console.log('Preview material')
}

function saveMaterial() {
  // 保存材质
  console.log('Save material')
}

function selectTexture() {
  // 选择纹理
  console.log('Select texture')
}

// 初始化示例节点
onMounted(() => {
  const initialNodes: SimpleNode[] = [
    {
      id: 'output',
      type: 'material',
      position: { x: 600, y: 200 },
      data: {
        label: 'Material Output',
        type: 'output',
        icon: 'i-heroicons-arrow-right-circle',
        inputs: ['Base Color', 'Metallic', 'Roughness', 'Normal', 'Emission'],
        outputs: []
      }
    }
  ]

  nodes.value.push(...initialNodes)
  console.log('Blueprint Material Editor initialized')
})
</script>

<style scoped>
.qaq-blueprint-material-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-blueprint-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-toolbar-left,
.qaq-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-blueprint-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.qaq-node-palette {
  width: 250px;
  background-color: var(--qaq-panel-bg, #383838);
  border-right: 1px solid var(--qaq-border, #555555);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.qaq-palette-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
}

.qaq-palette-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.qaq-palette-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.qaq-node-category {
  margin-bottom: 16px;
}

.qaq-node-category h5 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0 0 8px 0;
  padding: 0 4px;
}

.qaq-node-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qaq-node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.qaq-node-item:hover {
  background-color: var(--qaq-hover-bg, #4a4a4a);
}

.qaq-node-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.qaq-blueprint-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.qaq-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-canvas-container:active {
  cursor: grabbing;
}

.qaq-canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle, var(--qaq-grid-dot, #333333) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.qaq-nodes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
}

.qaq-canvas-node {
  position: absolute;
  cursor: pointer;
  user-select: none;
}

.qaq-connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.qaq-connection-path {
  filter: drop-shadow(0 0 4px rgba(0, 220, 130, 0.3));
}

.qaq-canvas-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--qaq-panel-bg, #383838);
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 6px;
  padding: 4px;
}

.qaq-blueprint-properties {
  width: 300px;
  background-color: var(--qaq-panel-bg, #383838);
  border-left: 1px solid var(--qaq-border, #555555);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.qaq-properties-header {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
}

.qaq-properties-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.qaq-properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.qaq-node-properties h5 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.qaq-property-group {
  margin-bottom: 16px;
}

.qaq-color-input {
  width: 100%;
  height: 32px;
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
}

.qaq-empty-properties {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}
</style>
