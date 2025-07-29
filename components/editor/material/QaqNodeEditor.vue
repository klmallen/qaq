<template>
  <div class="qaq-node-editor">
    <!-- 工具栏 -->
    <div class="qaq-node-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-plus"
          size="xs"
          variant="ghost"
          @click="showAddNodeMenu = !showAddNodeMenu"
          title="添加节点"
        >
          <span>添加节点</span>
        </UButton>

        <UButton
          icon="i-heroicons-trash"
          size="xs"
          variant="ghost"
          @click="deleteSelectedNodes"
          :disabled="selectedNodes.length === 0"
          title="删除选中节点"
        >
          删除
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          size="xs"
          variant="ghost"
          @click="exportGraph"
          title="导出图表"
        >
          导出
        </UButton>
      </div>

      <div class="qaq-toolbar-right">
        <span class="qaq-node-count">节点: {{ nodes.length }} | 连接: {{ edges.length }}</span>
      </div>
    </div>

    <!-- 节点添加菜单 -->
    <div v-if="showAddNodeMenu" class="qaq-add-node-menu">
      <div class="qaq-node-category">
        <h4>输入节点</h4>
        <button @click="addNode('input', 'Float')" class="qaq-node-button">Float</button>
        <button @click="addNode('input', 'Vector3')" class="qaq-node-button">Vector3</button>
        <button @click="addNode('input', 'Color')" class="qaq-node-button">Color</button>
        <button @click="addNode('input', 'Texture')" class="qaq-node-button">Texture</button>
      </div>

      <div class="qaq-node-category">
        <h4>数学节点</h4>
        <button @click="addNode('math', 'Add')" class="qaq-node-button">Add</button>
        <button @click="addNode('math', 'Multiply')" class="qaq-node-button">Multiply</button>
        <button @click="addNode('math', 'Lerp')" class="qaq-node-button">Lerp</button>
      </div>

      <div class="qaq-node-category">
        <h4>输出节点</h4>
        <button @click="addNode('output', 'Material Output')" class="qaq-node-button">Material Output</button>
      </div>
    </div>

    <!-- Vue Flow 画布 -->
    <div class="qaq-flow-container">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @connect="handleConnect"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @edge-double-click="onEdgeDoubleClick"
        @edge-context-menu="onEdgeContextMenu"
        @selection-change="onSelectionChange"
        @keydown="onKeyDown"
        class="qaq-vue-flow"
        :delete-key-code="['Delete', 'Backspace']"
      >
        <Background pattern="dots" :gap="16" :size="1" class="qaq-ue-background" />
        <Controls />

        <!-- 自定义节点模板 -->
        <template #node-qaq-input="{ data, id }">
          <QaqInputNode :data="data" :id="id" @update="updateNodeData" />
        </template>

        <template #node-qaq-math="{ data, id }">
          <QaqMathNode :data="data" :id="id" @update="updateNodeData" />
        </template>

        <template #node-qaq-output="{ data, id }">
          <QaqOutputNode :data="data" :id="id" @update="updateNodeData" />
        </template>
      </VueFlow>
    </div>

    <!-- 属性面板 -->
    <div class="qaq-properties-panel" v-if="selectedNode">
      <h3>节点属性</h3>
      <div class="qaq-property-group">
        <label>节点名称:</label>
        <input
          v-model="selectedNode.data.label"
          @input="updateSelectedNode"
          class="qaq-property-input"
        />
      </div>

      <div class="qaq-property-group" v-if="selectedNode.data.value !== undefined">
        <label>数值:</label>
        <input
          v-model="selectedNode.data.value"
          type="number"
          step="0.01"
          @input="updateSelectedNode"
          class="qaq-property-input"
        />
      </div>

      <div class="qaq-property-group" v-if="selectedNode.data.color">
        <label>颜色:</label>
        <input
          v-model="selectedNode.data.color"
          type="color"
          @input="updateSelectedNode"
          class="qaq-property-input"
        />
      </div>
    </div>

    <!-- 边的右键菜单 -->
    <div
      v-if="showEdgeContextMenu"
      class="qaq-edge-context-menu"
      :style="{
        left: edgeContextMenuPosition.x + 'px',
        top: edgeContextMenuPosition.y + 'px'
      }"
      @click.stop
    >
      <div class="qaq-context-menu-item" @click="deleteEdge(selectedEdge.id)">
        <UIcon name="i-heroicons-trash" />
        <span>删除连接</span>
      </div>
      <div class="qaq-context-menu-item" @click="showEdgeContextMenu = false">
        <UIcon name="i-heroicons-x-mark" />
        <span>取消</span>
      </div>
    </div>

    <!-- 点击遮罩层关闭菜单 -->
    <div
      v-if="showEdgeContextMenu"
      class="qaq-context-menu-overlay"
      @click="showEdgeContextMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { VueFlow, useVueFlow, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'

// 导入自定义节点组件
import QaqInputNode from './nodes/QaqInputNode.vue'
import QaqMathNode from './nodes/QaqMathNode.vue'
import QaqOutputNode from './nodes/QaqOutputNode.vue'



// Props
interface Props {
  mode?: 'material' | 'blueprint'
  initialNodes?: any[]
  initialEdges?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'material',
  initialNodes: () => [],
  initialEdges: () => []
})

// Emits
const emit = defineEmits<{
  'graph-change': [{ nodes: any[], edges: any[] }]
  'node-select': [node: any]
  'export': [data: any]
}>()

// 响应式状态
const nodes = ref(props.initialNodes)
const edges = ref(props.initialEdges)
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)
const showAddNodeMenu = ref(false)
const showEdgeContextMenu = ref(false)
const edgeContextMenuPosition = ref({ x: 0, y: 0 })
const nodeIdCounter = ref(1)

// Vue Flow 实例
const { addEdges, removeNodes, removeEdges } = useVueFlow()

// 计算属性
const selectedNodeIds = computed(() => selectedNodes.value)

// 节点变化处理
const onNodesChange = (changes: any[]) => {
  console.log('Nodes changed:', changes)
  emitGraphChange()
}

// 边变化处理
const onEdgesChange = (changes: any[]) => {
  console.log('Edges changed:', changes)
  emitGraphChange()
}

// 连接处理
const handleConnect = (connection: any) => {
  console.log('New connection:', connection)

  // 验证连接
  if (validateConnection(connection)) {
    addEdges([{
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'default',
      style: { stroke: '#00DC82', strokeWidth: 2 }
    }])
  }
}

// 节点点击处理
const onNodeClick = (event: any) => {
  console.log('Node clicked:', event.node)
  selectedNode.value = event.node
  emit('node-select', event.node)
}

// 选择变化处理
const onSelectionChange = (selection: any) => {
  selectedNodes.value = selection.nodes.map((node: any) => node.id)
  selectedEdges.value = selection.edges.map((edge: any) => edge.id)

  if (selection.nodes.length === 1) {
    selectedNode.value = selection.nodes[0]
  } else {
    selectedNode.value = null
  }

  if (selection.edges.length === 1) {
    selectedEdge.value = selection.edges[0]
  } else {
    selectedEdge.value = null
  }
}

// 边点击处理
const onEdgeClick = (event: any) => {
  console.log('Edge clicked:', event.edge)
  selectedEdge.value = event.edge
  showEdgeContextMenu.value = false
}

// 边双击处理 - 删除连接
const onEdgeDoubleClick = (event: any) => {
  console.log('Edge double-clicked, deleting:', event.edge.id)
  deleteEdge(event.edge.id)
}

// 边右键菜单处理
const onEdgeContextMenu = (event: any) => {
  event.event.preventDefault()
  selectedEdge.value = event.edge
  edgeContextMenuPosition.value = {
    x: event.event.clientX,
    y: event.event.clientY
  }
  showEdgeContextMenu.value = true
  console.log('Edge context menu:', event.edge)
}

// 键盘事件处理
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // 删除选中的节点
    if (selectedNodes.value.length > 0) {
      deleteSelectedNodes()
    }
    // 删除选中的边
    if (selectedEdges.value.length > 0) {
      selectedEdges.value.forEach(edgeId => deleteEdge(edgeId))
    }
  }
}

// 添加节点
const addNode = (category: string, type: string) => {
  const newNode = createNode(category, type)
  nodes.value.push(newNode)
  showAddNodeMenu.value = false

  nextTick(() => {
    emitGraphChange()
  })
}

// 创建节点
const createNode = (category: string, type: string) => {
  const id = `node-${nodeIdCounter.value++}`
  const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }

  const baseNode = {
    id,
    position,
    data: { label: type },
    type: `qaq-${category}`
  }

  // 根据类型添加特定数据
  switch (category) {
    case 'input':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          value: type === 'Float' ? 0 : undefined,
          color: type === 'Color' ? '#ffffff' : undefined,
          outputType: type.toLowerCase()
        }
      }
    case 'math':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          operation: type.toLowerCase(),
          inputTypes: ['float', 'float'],
          outputType: 'float'
        }
      }
    case 'output':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          inputTypes: ['color', 'float', 'float', 'float']
        }
      }
    default:
      return baseNode
  }
}

// 删除选中节点
const deleteSelectedNodes = () => {
  if (selectedNodes.value.length > 0) {
    removeNodes(selectedNodes.value)
    selectedNodes.value = []
    selectedNode.value = null
  }
}

// 删除边
const deleteEdge = (edgeId: string) => {
  console.log('Deleting edge:', edgeId)
  removeEdges([edgeId])

  // 更新选中状态
  selectedEdges.value = selectedEdges.value.filter(id => id !== edgeId)
  if (selectedEdge.value?.id === edgeId) {
    selectedEdge.value = null
  }

  // 隐藏右键菜单
  showEdgeContextMenu.value = false

  // 触发图表变化事件
  emitGraphChange()
}

// 删除所有选中的边
const deleteSelectedEdges = () => {
  if (selectedEdges.value.length > 0) {
    removeEdges(selectedEdges.value)
    selectedEdges.value = []
    selectedEdge.value = null
    showEdgeContextMenu.value = false
    emitGraphChange()
  }
}

// 更新节点数据
const updateNodeData = (nodeId: string, newData: any) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data = { ...node.data, ...newData }
    emitGraphChange()
  }
}

// 更新选中节点
const updateSelectedNode = () => {
  if (selectedNode.value) {
    emitGraphChange()
  }
}

// 验证连接
const validateConnection = (connection: any) => {
  // 基本验证：不能连接到自己
  if (connection.source === connection.target) {
    return false
  }

  // 检查是否已存在相同连接
  const existingEdge = edges.value.find(edge =>
    edge.source === connection.source &&
    edge.target === connection.target &&
    edge.sourceHandle === connection.sourceHandle &&
    edge.targetHandle === connection.targetHandle
  )

  return !existingEdge
}

// 导出图表
const exportGraph = () => {
  const graphData = {
    nodes: nodes.value,
    edges: edges.value,
    metadata: {
      mode: props.mode,
      exportTime: new Date().toISOString(),
      nodeCount: nodes.value.length,
      edgeCount: edges.value.length
    }
  }

  console.log('Exporting graph:', graphData)
  emit('export', graphData)

  // 下载JSON文件
  const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qaq-${props.mode}-graph.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 发射图表变化事件
const emitGraphChange = () => {
  emit('graph-change', { nodes: nodes.value, edges: edges.value })
}

// 初始化默认节点（如果没有提供）
if (nodes.value.length === 0 && props.mode === 'material') {
  // 添加一个默认的材质输出节点
  nodes.value.push(createNode('output', 'Material Output'))
}
</script>

<style scoped>
.qaq-node-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-node-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--qaq-editor-panel, #383838);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-toolbar-left {
  display: flex;
  gap: 8px;
}

.qaq-toolbar-right {
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-add-node-menu {
  position: absolute;
  top: 50px;
  left: 12px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 6px;
  padding: 12px;
  z-index: 1000;
  min-width: 200px;
}

.qaq-node-category {
  margin-bottom: 12px;
}

.qaq-node-category h4 {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: var(--qaq-primary, #00DC82);
  text-transform: uppercase;
}

.qaq-node-button {
  display: block;
  width: 100%;
  padding: 6px 8px;
  margin: 2px 0;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  color: var(--qaq-editor-text, #ffffff);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.qaq-node-button:hover {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-flow-container {
  flex: 1;
  position: relative;
}

.qaq-vue-flow {
  height: 100%;
  background: #1a1a1a !important;
}

/* UE风格背景网格 */
.qaq-ue-background {
  background-color: #1a1a1a !important;
}

.qaq-ue-background .vue-flow__background-pattern {
  fill: rgba(0, 220, 130, 0.15) !important;
  stroke: rgba(0, 220, 130, 0.1) !important;
  stroke-width: 0.5px !important;
}

/* UE风格连接线 - 贝塞尔曲线 */
.qaq-vue-flow .vue-flow__edge-path {
  stroke: #00DC82 !important;
  stroke-width: 2px !important;
  fill: none !important;
}

.qaq-vue-flow .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #ffffff !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 6px #00DC82) !important;
}

/* UE风格连接点 */
.qaq-vue-flow .vue-flow__handle {
  width: 14px !important;
  height: 14px !important;
  border: 2px solid #2a2a2a !important;
  border-radius: 50% !important;
  background: #00DC82 !important;
  transition: all 0.2s ease !important;
}

.qaq-vue-flow .vue-flow__handle:hover {
  transform: scale(1.3) !important;
  border-color: #ffffff !important;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.8) !important;
}

.qaq-vue-flow .vue-flow__handle.connecting {
  background: #ffffff !important;
  border-color: #00DC82 !important;
  box-shadow: 0 0 16px rgba(0, 220, 130, 1) !important;
}

.qaq-properties-panel {
  position: absolute;
  top: 50px;
  right: 12px;
  width: 250px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 6px;
  padding: 12px;
  z-index: 1000;
}

.qaq-properties-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-property-group {
  margin-bottom: 12px;
}

.qaq-property-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-property-input {
  width: 100%;
  padding: 6px 8px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 12px;
}

.qaq-property-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

/* 边的右键菜单样式 */
.qaq-edge-context-menu {
  position: fixed;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  min-width: 150px;
  overflow: hidden;
}

.qaq-context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-context-menu-item:hover {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-context-menu-item:first-child:hover {
  background: #ef4444; /* 删除按钮用红色 */
  color: #ffffff;
}

.qaq-context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
  background: transparent;
}

/* 选中的边样式增强 */
.qaq-vue-flow .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #ffffff !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 8px #00DC82) !important;
  animation: pulse-edge 2s infinite !important;
}

@keyframes pulse-edge {
  0%, 100% {
    filter: drop-shadow(0 0 8px #00DC82);
  }
  50% {
    filter: drop-shadow(0 0 12px #00DC82);
  }
}

/* 边悬停效果 */
.qaq-vue-flow .vue-flow__edge:hover .vue-flow__edge-path {
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 6px #00DC82) !important;
}
</style>
