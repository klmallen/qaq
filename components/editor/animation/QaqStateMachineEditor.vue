<!--
  QAQ 游戏引擎 状态机可视化编辑器
  提供动画状态机的节点图编辑功能
  类似于 Godot 的 AnimationTree 状态机编辑器
-->

<template>
  <div class="state-machine-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          @click="addState"
        >
          添加状态
        </UButton>
        <UButton
          icon="i-heroicons-arrow-right"
          size="sm"
          variant="outline"
          @click="addTransition"
          :disabled="selectedNodes.length !== 2"
        >
          添加过渡
        </UButton>
        <UDivider orientation="vertical" class="mx-2" />
        <UButton
          icon="i-heroicons-play"
          size="sm"
          :color="isPlaying ? 'red' : 'primary'"
          @click="togglePlayback"
        >
          {{ isPlaying ? '停止' : '测试' }}
        </UButton>
      </div>

      <div class="toolbar-right">
        <span class="text-sm text-gray-600">当前状态: {{ currentState || '无' }}</span>
      </div>
    </div>

    <!-- Vue Flow 编辑器 -->
    <div class="flow-container">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @connect="onConnect"
        @pane-click="onPaneClick"
      >
        <!-- 自定义状态节点 -->
        <template #node-state="{ data, id }">
          <div
            class="state-node"
            :class="{
              'active': currentState === id,
              'entry': data.isEntry,
              'selected': selectedNodes.includes(id)
            }"
          >
            <div class="state-header">
              <UIcon :name="data.icon || 'i-heroicons-cube'" class="w-4 h-4" />
              <span class="state-name">{{ data.label }}</span>
              <UButton
                icon="i-heroicons-cog-6-tooth"
                size="xs"
                variant="ghost"
                @click.stop="editState(id)"
              />
            </div>

            <div class="state-body">
              <div class="state-info">
                <span class="text-xs text-gray-500">动画: {{ data.animationName || '无' }}</span>
                <span class="text-xs text-gray-500">速度: {{ data.speed || 1.0 }}x</span>
              </div>

              <!-- 连接点 -->
              <Handle
                type="source"
                position="right"
                class="state-handle state-handle-output"
              />
              <Handle
                type="target"
                position="left"
                class="state-handle state-handle-input"
              />
            </div>
          </div>
        </template>

        <!-- 自定义过渡边 -->
        <template #edge-transition="{ data, id }">
          <BaseEdge
            :path="data.path"
            :marker-end="data.markerEnd"
            class="transition-edge"
            :class="{ 'active': data.isActive }"
          />
          <EdgeLabelRenderer>
            <div
              class="transition-label"
              :style="{
                transform: `translate(-50%, -50%) translate(${data.labelX}px, ${data.labelY}px)`
              }"
              @click.stop="editTransition(id)"
            >
              <div class="transition-conditions">
                <div
                  v-for="condition in data.conditions"
                  :key="condition.id"
                  class="condition-chip"
                >
                  {{ condition.parameter }} {{ condition.operator }} {{ condition.value }}
                </div>
                <UButton
                  icon="i-heroicons-plus"
                  size="xs"
                  variant="ghost"
                  @click.stop="addCondition(id)"
                />
              </div>
            </div>
          </EdgeLabelRenderer>
        </template>

        <!-- 背景 -->
        <Background pattern-color="#e5e7eb" :gap="20" />

        <!-- 控制器 -->
        <Controls />

        <!-- 小地图 -->
        <MiniMap
          :node-color="getNodeColor"
          :mask-color="'rgba(255, 255, 255, 0.8)'"
          pannable
          zoomable
        />
      </VueFlow>
    </div>

    <!-- 参数面板 -->
    <div class="parameters-panel">
      <div class="panel-header">
        <h3 class="text-sm font-medium">状态机参数</h3>
        <UButton
          icon="i-heroicons-plus"
          size="xs"
          variant="ghost"
          @click="addParameter"
        />
      </div>

      <div class="parameters-list">
        <div
          v-for="param in parameters"
          :key="param.name"
          class="parameter-item"
        >
          <div class="parameter-header">
            <span class="parameter-name">{{ param.name }}</span>
            <span class="parameter-type">{{ param.type }}</span>
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              variant="ghost"
              color="red"
              @click="removeParameter(param.name)"
            />
          </div>

          <div class="parameter-control">
            <UInput
              v-if="param.type === 'number'"
              v-model.number="param.value"
              type="number"
              size="sm"
              @input="updateParameter(param.name, param.value)"
            />
            <UInput
              v-else-if="param.type === 'string'"
              v-model="param.value"
              size="sm"
              @input="updateParameter(param.name, param.value)"
            />
            <UToggle
              v-else-if="param.type === 'boolean'"
              v-model="param.value"
              @change="updateParameter(param.name, param.value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 状态编辑对话框 -->
    <UModal v-model="stateEditDialog.open">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">编辑状态</h3>
        </template>

        <div class="space-y-4">
          <UFormGroup label="状态名称">
            <UInput v-model="stateEditDialog.data.name" />
          </UFormGroup>

          <UFormGroup label="动画片段">
            <USelect
              v-model="stateEditDialog.data.animationClip"
              :options="availableAnimations"
              option-attribute="name"
              value-attribute="id"
              placeholder="选择动画片段"
            />
          </UFormGroup>

          <UFormGroup label="播放速度">
            <UInput
              v-model.number="stateEditDialog.data.speed"
              type="number"
              :min="0.1"
              :max="5"
              :step="0.1"
            />
          </UFormGroup>

          <UFormGroup label="循环播放">
            <UToggle v-model="stateEditDialog.data.loop" />
          </UFormGroup>

          <UFormGroup label="入口状态">
            <UToggle v-model="stateEditDialog.data.isEntry" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="stateEditDialog.open = false">
              取消
            </UButton>
            <UButton @click="saveStateEdit">
              保存
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 过渡编辑对话框 -->
    <UModal v-model="transitionEditDialog.open">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">编辑过渡条件</h3>
        </template>

        <div class="space-y-4">
          <UFormGroup label="过渡时间">
            <UInput
              v-model.number="transitionEditDialog.data.duration"
              type="number"
              :min="0"
              :max="5"
              :step="0.1"
            />
          </UFormGroup>

          <UFormGroup label="优先级">
            <UInput
              v-model.number="transitionEditDialog.data.priority"
              type="number"
            />
          </UFormGroup>

          <div class="conditions-editor">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">过渡条件</label>
              <UButton
                icon="i-heroicons-plus"
                size="xs"
                @click="addConditionToTransition"
              >
                添加条件
              </UButton>
            </div>

            <div
              v-for="(condition, index) in transitionEditDialog.data.conditions"
              :key="index"
              class="condition-editor"
            >
              <div class="flex items-center gap-2">
                <USelect
                  v-model="condition.parameter"
                  :options="parameterNames"
                  placeholder="参数"
                  class="flex-1"
                />
                <USelect
                  v-model="condition.operator"
                  :options="['>', '<', '>=', '<=', '==', '!=']"
                  class="w-20"
                />
                <UInput
                  v-model="condition.value"
                  placeholder="值"
                  class="flex-1"
                />
                <UButton
                  icon="i-heroicons-trash"
                  size="xs"
                  variant="ghost"
                  color="red"
                  @click="removeConditionFromTransition(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="transitionEditDialog.open = false">
              取消
            </UButton>
            <UButton @click="saveTransitionEdit">
              保存
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { VueFlow, Handle, BaseEdge, EdgeLabelRenderer } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge, Connection } from '@vue-flow/core'
import { animationTreeAdapter } from './AnimationTreeAdapter'
import AnimationTree from '../../../core/nodes/animation/AnimationTree'
import AnimationPlayer from '../../../core/nodes/animation/AnimationPlayer'

// ============================================================================
// 接口定义
// ============================================================================

interface StateMachineParameter {
  name: string
  type: 'number' | 'string' | 'boolean'
  value: any
}

interface TransitionCondition {
  id: string
  parameter: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  value: any
}

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  stateMachine?: any
  animationTree?: AnimationTree
  animationPlayer?: AnimationPlayer
  isPlaying?: boolean
  currentState?: string
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false
})

const emit = defineEmits<{
  'state-added': [stateData: any]
  'state-updated': [stateId: string, stateData: any]
  'state-removed': [stateId: string]
  'transition-added': [transitionData: any]
  'transition-updated': [transitionId: string, transitionData: any]
  'transition-removed': [transitionId: string]
  'parameter-changed': [name: string, value: any]
  'play': []
  'stop': []
}>()

// ============================================================================
// 响应式数据
// ============================================================================

// AnimationTree集成
const isConnectedToAnimationTree = ref(false)

// 使用适配器的响应式数据
const adapterStates = computed(() => animationTreeAdapter.states.value)
const adapterTransitions = computed(() => animationTreeAdapter.transitions.value)
const adapterParameters = computed(() => animationTreeAdapter.parameters.value)
const adapterCurrentState = computed(() => animationTreeAdapter.currentState.value)
const adapterIsPlaying = computed(() => animationTreeAdapter.isPlaying.value)

const nodes = ref<Node[]>([
  {
    id: 'idle',
    type: 'state',
    position: { x: 100, y: 100 },
    data: {
      label: 'Idle',
      animationName: 'idle_animation',
      speed: 1.0,
      isEntry: true,
      icon: 'i-heroicons-pause'
    }
  },
  {
    id: 'walk',
    type: 'state',
    position: { x: 300, y: 100 },
    data: {
      label: 'Walk',
      animationName: 'walk_animation',
      speed: 1.0,
      isEntry: false,
      icon: 'i-heroicons-forward'
    }
  },
  {
    id: 'run',
    type: 'state',
    position: { x: 500, y: 100 },
    data: {
      label: 'Run',
      animationName: 'run_animation',
      speed: 1.2,
      isEntry: false,
      icon: 'i-heroicons-bolt'
    }
  }
])

const edges = ref<Edge[]>([
  {
    id: 'idle-walk',
    type: 'transition',
    source: 'idle',
    target: 'walk',
    data: {
      conditions: [
        { id: '1', parameter: 'speed', operator: '>', value: 0.1 }
      ],
      duration: 0.2,
      priority: 1,
      isActive: false
    }
  },
  {
    id: 'walk-run',
    type: 'transition',
    source: 'walk',
    target: 'run',
    data: {
      conditions: [
        { id: '2', parameter: 'speed', operator: '>', value: 3.0 }
      ],
      duration: 0.3,
      priority: 1,
      isActive: false
    }
  }
])

const parameters = ref<StateMachineParameter[]>([
  { name: 'speed', type: 'number', value: 0 },
  { name: 'is_grounded', type: 'boolean', value: true },
  { name: 'action', type: 'string', value: '' }
])

const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])

// 对话框状态
const stateEditDialog = ref({
  open: false,
  nodeId: '',
  data: {
    name: '',
    animationClip: '',
    speed: 1.0,
    loop: true,
    isEntry: false
  }
})

const transitionEditDialog = ref({
  open: false,
  edgeId: '',
  data: {
    duration: 0.2,
    priority: 1,
    conditions: [] as TransitionCondition[]
  }
})

// ============================================================================
// 计算属性
// ============================================================================

const availableAnimations = computed(() => [
  { id: 'idle', name: 'Idle Animation' },
  { id: 'walk', name: 'Walk Animation' },
  { id: 'run', name: 'Run Animation' },
  { id: 'jump', name: 'Jump Animation' }
])

const parameterNames = computed(() => parameters.value.map(p => p.name))

// ============================================================================
// 方法
// ============================================================================

const addState = () => {
  const newId = `state_${Date.now()}`
  const newNode: Node = {
    id: newId,
    type: 'state',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: '新状态',
      animationName: '',
      speed: 1.0,
      isEntry: false,
      icon: 'i-heroicons-cube'
    }
  }

  nodes.value.push(newNode)
  emit('state-added', newNode.data)
}

const addTransition = () => {
  if (selectedNodes.value.length !== 2) return

  const [source, target] = selectedNodes.value
  const newId = `${source}-${target}`

  const newEdge: Edge = {
    id: newId,
    type: 'transition',
    source,
    target,
    data: {
      conditions: [],
      duration: 0.2,
      priority: 1,
      isActive: false
    }
  }

  edges.value.push(newEdge)
  emit('transition-added', newEdge.data)
}

const togglePlayback = () => {
  if (props.isPlaying) {
    emit('stop')
  } else {
    emit('play')
  }
}

const onNodesChange = (changes: any[]) => {
  // 处理节点变化
}

const onEdgesChange = (changes: any[]) => {
  // 处理边变化
}

const onNodeClick = (event: any) => {
  const nodeId = event.node.id
  if (selectedNodes.value.includes(nodeId)) {
    selectedNodes.value = selectedNodes.value.filter(id => id !== nodeId)
  } else {
    selectedNodes.value.push(nodeId)
  }
}

const onEdgeClick = (event: any) => {
  const edgeId = event.edge.id
  selectedEdges.value = [edgeId]
}

const onConnect = (connection: Connection) => {
  const newEdge: Edge = {
    id: `${connection.source}-${connection.target}`,
    type: 'transition',
    source: connection.source!,
    target: connection.target!,
    data: {
      conditions: [],
      duration: 0.2,
      priority: 1,
      isActive: false
    }
  }

  edges.value.push(newEdge)
}

const onPaneClick = () => {
  selectedNodes.value = []
  selectedEdges.value = []
}

const editState = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return

  stateEditDialog.value.nodeId = nodeId
  stateEditDialog.value.data = {
    name: node.data.label,
    animationClip: node.data.animationName,
    speed: node.data.speed,
    loop: node.data.loop || true,
    isEntry: node.data.isEntry || false
  }
  stateEditDialog.value.open = true
}

const saveStateEdit = () => {
  const node = nodes.value.find(n => n.id === stateEditDialog.value.nodeId)
  if (!node) return

  node.data.label = stateEditDialog.value.data.name
  node.data.animationName = stateEditDialog.value.data.animationClip
  node.data.speed = stateEditDialog.value.data.speed
  node.data.loop = stateEditDialog.value.data.loop
  node.data.isEntry = stateEditDialog.value.data.isEntry

  emit('state-updated', stateEditDialog.value.nodeId, node.data)
  stateEditDialog.value.open = false
}

const editTransition = (edgeId: string) => {
  const edge = edges.value.find(e => e.id === edgeId)
  if (!edge) return

  transitionEditDialog.value.edgeId = edgeId
  transitionEditDialog.value.data = {
    duration: edge.data.duration,
    priority: edge.data.priority,
    conditions: [...edge.data.conditions]
  }
  transitionEditDialog.value.open = true
}

const saveTransitionEdit = () => {
  const edge = edges.value.find(e => e.id === transitionEditDialog.value.edgeId)
  if (!edge) return

  edge.data.duration = transitionEditDialog.value.data.duration
  edge.data.priority = transitionEditDialog.value.data.priority
  edge.data.conditions = [...transitionEditDialog.value.data.conditions]

  emit('transition-updated', transitionEditDialog.value.edgeId, edge.data)
  transitionEditDialog.value.open = false
}

const addParameter = () => {
  const name = prompt('参数名称:')
  if (!name) return

  parameters.value.push({
    name,
    type: 'number',
    value: 0
  })
}

const removeParameter = (name: string) => {
  const index = parameters.value.findIndex(p => p.name === name)
  if (index !== -1) {
    parameters.value.splice(index, 1)
  }
}

const updateParameter = (name: string, value: any) => {
  emit('parameter-changed', name, value)
}

const getNodeColor = (node: Node) => {
  if (node.data.isEntry) return '#10b981'
  if (props.currentState === node.id) return '#f59e0b'
  return '#6b7280'
}

const addConditionToTransition = () => {
  transitionEditDialog.value.data.conditions.push({
    id: Date.now().toString(),
    parameter: '',
    operator: '>',
    value: 0
  })
}

const removeConditionFromTransition = (index: number) => {
  transitionEditDialog.value.data.conditions.splice(index, 1)
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化AnimationTree连接
  initializeAnimationTreeConnection()

  // 监听适配器数据变化
  setupAdapterWatchers()
})

// ============================================================================
// AnimationTree集成方法
// ============================================================================

/**
 * 初始化AnimationTree连接
 */
function initializeAnimationTreeConnection() {
  if (props.animationTree) {
    animationTreeAdapter.connectToAnimationTree(props.animationTree, props.animationPlayer)
    isConnectedToAnimationTree.value = true

    // 同步适配器数据到编辑器
    syncAdapterDataToEditor()
  } else {
    // 创建新的AnimationTree
    const newTree = animationTreeAdapter.createNewAnimationTree('StateMachine')
    isConnectedToAnimationTree.value = true

    // 发送事件通知父组件
    emit('animationTreeCreated', newTree)
  }
}

/**
 * 设置适配器数据监听
 */
function setupAdapterWatchers() {
  // 监听状态变化
  watch(adapterStates, (newStates) => {
    syncStatesToNodes(newStates)
  }, { deep: true })

  // 监听转换变化
  watch(adapterTransitions, (newTransitions) => {
    syncTransitionsToEdges(newTransitions)
  }, { deep: true })

  // 监听当前状态变化
  watch(adapterCurrentState, (newState) => {
    updateCurrentStateHighlight(newState)
  })
}

/**
 * 同步适配器数据到编辑器
 */
function syncAdapterDataToEditor() {
  syncStatesToNodes(adapterStates.value)
  syncTransitionsToEdges(adapterTransitions.value)
  updateCurrentStateHighlight(adapterCurrentState.value)
}

/**
 * 同步状态到节点
 */
function syncStatesToNodes(states: any[]) {
  nodes.value = states.map(state => ({
    id: state.id,
    type: 'state',
    position: state.position,
    data: {
      label: state.name,
      animationName: state.animationName,
      speed: state.speed || 1.0,
      isEntry: state.type === 'entry',
      icon: getStateIcon(state.type)
    }
  }))
}

/**
 * 同步转换到边
 */
function syncTransitionsToEdges(transitions: any[]) {
  edges.value = transitions.map(transition => ({
    id: transition.id,
    type: 'transition',
    source: transition.fromStateId,
    target: transition.toStateId,
    data: {
      conditions: transition.conditions,
      duration: transition.duration,
      priority: transition.priority
    }
  }))
}

/**
 * 获取状态图标
 */
function getStateIcon(type: string): string {
  switch (type) {
    case 'entry': return 'i-heroicons-play'
    case 'exit': return 'i-heroicons-stop'
    default: return 'i-heroicons-pause'
  }
}

/**
 * 更新当前状态高亮
 */
function updateCurrentStateHighlight(currentState: string) {
  nodes.value.forEach(node => {
    node.data.isActive = node.id === currentState
  })
}

// ============================================================================
// 编辑器操作方法
// ============================================================================

// AnimationTree集成方法已移除，避免与原有方法冲突
// 这些功能将通过修改现有方法来实现

// AnimationTree集成事件处理已移除，避免与原有代码冲突
</script>

<style scoped>
/* Vue Flow 样式导入 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
.state-machine-editor {
  @apply flex flex-col h-full bg-white;
}

.editor-toolbar {
  @apply flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50;
}

.toolbar-left {
  @apply flex items-center gap-2;
}

.toolbar-right {
  @apply flex items-center gap-2;
}

.flow-container {
  @apply flex-1 relative;
}

.parameters-panel {
  @apply w-64 border-l border-gray-200 bg-gray-50 p-3;
}

.panel-header {
  @apply flex items-center justify-between mb-3;
}

.parameters-list {
  @apply space-y-2;
}

.parameter-item {
  @apply p-2 bg-white rounded border border-gray-200;
}

.parameter-header {
  @apply flex items-center justify-between mb-2;
}

.parameter-name {
  @apply text-sm font-medium;
}

.parameter-type {
  @apply text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded;
}

.parameter-control {
  @apply w-full;
}

/* 状态节点样式 */
.state-node {
  @apply bg-white border-2 border-gray-300 rounded-lg shadow-sm min-w-32;
}

.state-node.active {
  @apply border-orange-400 bg-orange-50;
}

.state-node.entry {
  @apply border-green-400 bg-green-50;
}

.state-node.selected {
  @apply border-blue-400 bg-blue-50;
}

.state-header {
  @apply flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50;
}

.state-name {
  @apply flex-1 text-sm font-medium;
}

.state-body {
  @apply p-2 relative;
}

.state-info {
  @apply space-y-1;
}

.state-handle {
  @apply w-3 h-3 border-2 border-white bg-gray-400 rounded-full;
}

.state-handle-input {
  @apply -left-1.5;
}

.state-handle-output {
  @apply -right-1.5;
}

/* 过渡边样式 */
.transition-edge {
  @apply stroke-gray-400 stroke-2;
}

.transition-edge.active {
  @apply stroke-orange-400;
  stroke-width: 3;
}

.transition-label {
  @apply absolute bg-white border border-gray-200 rounded px-2 py-1 shadow-sm;
}

.transition-conditions {
  @apply flex items-center gap-1;
}

.condition-chip {
  @apply text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded;
}

.condition-editor {
  @apply mb-2;
}
</style>
