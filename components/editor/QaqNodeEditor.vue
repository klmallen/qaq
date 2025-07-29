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
          添加节点
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
        @selection-change="onSelectionChange"
        class="qaq-vue-flow"
      >
        <Background pattern="dots" :gap="20" :size="1" />
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
const selectedNode = ref<any>(null)
const showAddNodeMenu = ref(false)
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
  if (selection.nodes.length === 1) {
    selectedNode.value = selection.nodes[0]
  } else {
    selectedNode.value = null
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
</style>
