<template>
  <div class="qaq-animation-state-machine">
    <!-- 工具栏 -->
    <div class="qaq-anim-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          :variant="currentTool === 'select' ? 'solid' : 'ghost'"
          color="primary"
          size="xs"
          icon="i-heroicons-cursor-arrow-rays"
          title="选择工具 (Q)"
          class="qaq-tool-button"
          @click="setTool('select')"
        />
        <UButton
          :variant="currentTool === 'state' ? 'solid' : 'ghost'"
          color="primary"
          size="xs"
          icon="i-heroicons-square-3-stack-3d"
          title="添加状态 (W)"
          class="qaq-tool-button"
          @click="setTool('state')"
        />
        <UButton
          :variant="currentTool === 'transition' ? 'solid' : 'ghost'"
          color="primary"
          size="xs"
          icon="i-heroicons-arrow-right-circle"
          title="添加过渡 (E)"
          class="qaq-tool-button"
          @click="setTool('transition')"
        />
        <UButton
          :variant="currentTool === 'entry' ? 'solid' : 'ghost'"
          color="primary"
          size="xs"
          icon="i-heroicons-play-circle"
          title="设置入口状态 (R)"
          class="qaq-tool-button"
          @click="setTool('entry')"
        />
      </div>

      <div class="qaq-toolbar-center">
        <span class="qaq-editor-title">动画状态机编辑器</span>
      </div>

      <div class="qaq-toolbar-right">
        <UButton
          :variant="isPlaying ? 'solid' : 'ghost'"
          color="primary"
          size="xs"
          :icon="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
          :title="isPlaying ? '暂停预览' : '播放预览'"
          class="qaq-tool-button"
          @click="togglePreview"
        />
        <UButton
          variant="ghost"
          color="primary"
          size="xs"
          icon="i-heroicons-arrow-path"
          title="重置视图"
          class="qaq-tool-button"
          @click="resetView"
        />
        <UButton
          variant="ghost"
          color="primary"
          size="xs"
          icon="i-heroicons-document-arrow-down"
          title="保存状态机"
          class="qaq-tool-button"
          @click="saveStateMachine"
        />
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="qaq-anim-editor-container">
      <!-- 简化的状态机图 -->
      <div class="qaq-anim-graph">
        <div class="qaq-simple-canvas" @click="handleCanvasClick">
          <!-- 网格背景 -->
          <div class="qaq-grid-background"></div>

          <!-- 状态节点 -->
          <div
            v-for="node in stateNodes"
            :key="node.id"
            class="qaq-simple-node"
            :class="{
              'qaq-node-selected': selectedNodeId === node.id,
              'qaq-node-active': activeStateId === node.id,
              'qaq-node-entry': node.type === 'entry',
              'qaq-node-dragging': isDragging && dragNodeId === node.id,
              'qaq-node-drop-target': isDropTarget && dropTargetId === node.id,
              'qaq-node-drop-forbidden': isDropTarget && dropTargetId === node.id && dragNodeId === node.id
            }"
            :style="{
              left: node.position.x + 'px',
              top: node.position.y + 'px'
            }"
            draggable="true"
            @click="selectNode(node.id)"
            @mousedown="startDrag(node.id, $event)"
            @dragstart="handleNodeDragStart(node.id, $event)"
            @dragend="handleNodeDragEnd"
            @dragover.prevent="handleNodeDragOver(node.id, $event)"
            @drop="handleNodeDrop(node.id, $event)"
            @dragleave="handleNodeDragLeave(node.id)"
          >
            <div class="qaq-node-icon">
              <UIcon :name="node.type === 'entry' ? 'i-heroicons-arrow-right-circle' : 'i-heroicons-play-circle'" />
            </div>
            <div class="qaq-node-label">{{ node.data.label }}</div>
            <div v-if="node.type === 'state'" class="qaq-node-info">
              <div class="qaq-node-clip">{{ node.data.animationClip }}</div>
              <div class="qaq-node-speed">{{ node.data.speed }}x</div>
            </div>
          </div>

          <!-- 连接线 -->
          <svg class="qaq-connections-svg">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7"
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--qaq-editor-border, #404040)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7"
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--qaq-primary, #00DC82)" />
              </marker>
            </defs>

            <line
              v-for="connection in connections"
              :key="connection.id"
              :x1="connection.x1"
              :y1="connection.y1"
              :x2="connection.x2"
              :y2="connection.y2"
              :stroke="connection.isActive ? 'var(--qaq-primary, #00DC82)' : 'var(--qaq-editor-border, #404040)'"
              :stroke-width="connection.isActive ? 3 : 2"
              :marker-end="connection.isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'"
              @click="selectConnection(connection.id)"
            />
          </svg>

          <!-- 调试面板 -->
          <div v-if="isPlaying" class="qaq-debug-panel">
            <div class="qaq-debug-info">
              <h3>调试信息</h3>
              <div class="qaq-debug-state">
                <span>当前状态:</span>
                <span class="qaq-active-state">{{ getActiveStateName() }}</span>
              </div>

              <h4>参数控制</h4>
              <div class="qaq-debug-params">
                <div v-for="param in parameters" :key="param.id" class="qaq-param-control">
                  <label>{{ param.name }}:</label>

                  <template v-if="param.type === 'Bool'">
                    <UToggle v-model="param.value" size="xs" />
                  </template>

                  <template v-else-if="param.type === 'Float'">
                    <URange
                      v-model="param.value"
                      :min="0"
                      :max="5"
                      :step="0.1"
                      size="xs"
                    />
                    <span class="qaq-param-value">{{ param.value.toFixed(1) }}</span>
                  </template>

                  <template v-else-if="param.type === 'Int'">
                    <URange
                      v-model="param.value"
                      :min="0"
                      :max="10"
                      :step="1"
                      size="xs"
                    />
                    <span class="qaq-param-value">{{ param.value }}</span>
                  </template>

                  <template v-else-if="param.type === 'Trigger'">
                    <UButton
                      size="xs"
                      @click="triggerParameter(param.id)"
                      :disabled="param.value"
                    >
                      触发
                    </UButton>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="qaq-anim-properties">
        <!-- 状态属性 -->
        <div v-if="selectedNode" class="qaq-properties-panel">
          <h3 class="qaq-panel-title">状态属性</h3>

          <div class="qaq-property-group">
            <label>名称</label>
            <UInput v-model="selectedNode.data.label" size="sm" />
          </div>

          <div class="qaq-property-group">
            <label>动画片段</label>
            <USelect
              v-model="selectedNode.data.animationClip"
              :options="animationClips"
              size="sm"
            />
          </div>

          <div class="qaq-property-group">
            <label>播放速度</label>
            <div class="qaq-slider-group">
              <URange
                v-model="selectedNode.data.speed"
                :min="0.1"
                :max="5"
                :step="0.1"
              />
              <span class="qaq-slider-value">{{ selectedNode.data.speed }}x</span>
            </div>
          </div>

          <div class="qaq-property-group">
            <label>循环模式</label>
            <USelect
              v-model="selectedNode.data.loopMode"
              :options="loopModes"
              size="sm"
            />
          </div>

          <div class="qaq-property-group">
            <label>退出时间 (0-1)</label>
            <URange
              v-model="selectedNode.data.exitTime"
              :min="0"
              :max="1"
              :step="0.01"
            />
          </div>
        </div>

        <!-- 过渡属性 -->
        <div v-else-if="selectedConnection" class="qaq-properties-panel">
          <h3 class="qaq-panel-title">过渡属性</h3>

          <div class="qaq-property-group">
            <label>过渡持续时间 (秒)</label>
            <URange
              v-model="selectedConnection.data.duration"
              :min="0"
              :max="5"
              :step="0.1"
            />
          </div>

          <div class="qaq-property-group">
            <label>过渡曲线</label>
            <USelect
              v-model="selectedConnection.data.curve"
              :options="transitionCurves"
              size="sm"
            />
          </div>

          <h4 class="qaq-section-title">条件</h4>

          <div v-for="(condition, index) in selectedConnection.data.conditions" :key="index" class="qaq-condition">
            <div class="qaq-condition-row">
              <USelect
                v-model="condition.parameter"
                :options="parameterOptions"
                size="sm"
                class="qaq-condition-param"
              />

              <USelect
                v-model="condition.operator"
                :options="operatorOptions"
                size="sm"
                class="qaq-condition-op"
              />

              <UInput
                v-model="condition.value"
                size="sm"
                class="qaq-condition-value"
              />

              <UButton
                icon="i-heroicons-trash"
                variant="ghost"
                size="xs"
                @click="removeCondition(index)"
                class="qaq-condition-delete"
              />
            </div>
          </div>

          <div class="qaq-condition-actions">
            <UButton
              icon="i-heroicons-plus"
              size="sm"
              @click="addCondition"
            >
              添加条件
            </UButton>

            <USelect
              v-model="selectedConnection.data.logicType"
              :options="logicTypes"
              size="sm"
            />
          </div>
        </div>

        <!-- 参数管理面板 -->
        <div v-else class="qaq-properties-panel">
          <h3 class="qaq-panel-title">参数管理</h3>

          <div class="qaq-parameters-list">
            <div v-for="param in parameters" :key="param.id" class="qaq-parameter-item">
              <div class="qaq-parameter-header">
                <UInput
                  v-model="param.name"
                  size="sm"
                  class="qaq-param-name"
                />

                <USelect
                  v-model="param.type"
                  :options="parameterTypes"
                  size="sm"
                  class="qaq-param-type"
                />

                <UButton
                  icon="i-heroicons-trash"
                  variant="ghost"
                  size="xs"
                  @click="removeParameter(param.id)"
                  class="qaq-param-delete"
                />
              </div>

              <div class="qaq-parameter-value">
                <template v-if="param.type === 'Bool'">
                  <UToggle v-model="param.value" />
                </template>

                <template v-else-if="param.type === 'Int'">
                  <UInput
                    v-model.number="param.value"
                    type="number"
                    size="sm"
                  />
                </template>

                <template v-else-if="param.type === 'Float'">
                  <UInput
                    v-model.number="param.value"
                    type="number"
                    step="0.1"
                    size="sm"
                  />
                </template>

                <template v-else-if="param.type === 'Trigger'">
                  <UButton
                    size="xs"
                    @click="triggerParameter(param.id)"
                  >
                    触发
                  </UButton>
                </template>
              </div>
            </div>
          </div>

          <div class="qaq-parameters-actions">
            <UButton
              icon="i-heroicons-plus"
              size="sm"
              @click="addParameter"
            >
              添加参数
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 简单的UUID生成器
function generateId() {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36)
}

// 状态机数据
const stateNodes = ref([
  {
    id: 'entry',
    type: 'entry',
    position: { x: 50, y: 100 },
    data: { label: 'Entry' }
  },
  {
    id: 'idle',
    type: 'state',
    position: { x: 200, y: 100 },
    data: {
      label: 'Idle',
      animationClip: 'idle',
      speed: 1,
      loopMode: 'loop',
      exitTime: 1
    }
  },
  {
    id: 'walk',
    type: 'state',
    position: { x: 400, y: 100 },
    data: {
      label: 'Walk',
      animationClip: 'walk',
      speed: 1,
      loopMode: 'loop',
      exitTime: 1
    }
  },
  {
    id: 'run',
    type: 'state',
    position: { x: 200, y: 250 },
    data: {
      label: 'Run',
      animationClip: 'run',
      speed: 1,
      loopMode: 'loop',
      exitTime: 1
    }
  }
])

const connections = ref([
  {
    id: 'entry-idle',
    source: 'entry',
    target: 'idle',
    x1: 130, y1: 130,
    x2: 200, y2: 130,
    isActive: false,
    data: {
      isEntryConnection: true,
      duration: 0,
      curve: 'linear',
      conditions: [],
      logicType: 'AND'
    }
  },
  {
    id: 'idle-walk',
    source: 'idle',
    target: 'walk',
    x1: 320, y1: 130,
    x2: 400, y2: 130,
    isActive: false,
    data: {
      duration: 0.3,
      curve: 'linear',
      conditions: [{ parameter: 'param1', operator: '>', value: 0.5 }],
      logicType: 'AND'
    }
  },
  {
    id: 'walk-idle',
    source: 'walk',
    target: 'idle',
    x1: 400, y1: 150,
    x2: 320, y2: 150,
    isActive: false,
    data: {
      duration: 0.2,
      curve: 'linear',
      conditions: [{ parameter: 'param1', operator: '<=', value: 0.5 }],
      logicType: 'AND'
    }
  },
  {
    id: 'idle-run',
    source: 'idle',
    target: 'run',
    x1: 260, y1: 180,
    x2: 260, y2: 250,
    isActive: false,
    data: {
      duration: 0.1,
      curve: 'linear',
      conditions: [{ parameter: 'param1', operator: '>', value: 2 }],
      logicType: 'AND'
    }
  }
])

// 编辑器状态
const currentTool = ref('select')
const selectedNodeId = ref('')
const selectedConnectionId = ref('')
const isPlaying = ref(false)
const activeStateId = ref('idle') // 默认激活idle状态
const activeTransitionId = ref('')

// 拖拽状态
const isDragging = ref(false)
const dragNodeId = ref('')
const dragOffset = ref({ x: 0, y: 0 })
const isDropTarget = ref(false)
const dropTargetId = ref('')

// 计算属性
const selectedNode = computed(() => {
  return stateNodes.value.find(node => node.id === selectedNodeId.value)
})

const selectedConnection = computed(() => {
  return connections.value.find(conn => conn.id === selectedConnectionId.value)
})

// 参数管理
const parameters = ref([
  { id: 'param1', name: 'Speed', type: 'Float', value: 0 },
  { id: 'param2', name: 'IsJumping', type: 'Bool', value: false },
  { id: 'param3', name: 'Jump', type: 'Trigger', value: false }
])

// 选项数据
const animationClips = [
  { label: 'Idle', value: 'idle' },
  { label: 'Walk', value: 'walk' },
  { label: 'Run', value: 'run' },
  { label: 'Jump', value: 'jump' },
  { label: 'Fall', value: 'fall' },
  { label: 'Attack', value: 'attack' }
]

const loopModes = [
  { label: '循环', value: 'loop' },
  { label: '单次', value: 'once' },
  { label: '来回', value: 'pingpong' }
]

const transitionCurves = [
  { label: '线性', value: 'linear' },
  { label: '缓入', value: 'easeIn' },
  { label: '缓出', value: 'easeOut' },
  { label: '缓入缓出', value: 'easeInOut' }
]

const parameterTypes = [
  { label: '布尔', value: 'Bool' },
  { label: '整数', value: 'Int' },
  { label: '浮点数', value: 'Float' },
  { label: '触发器', value: 'Trigger' }
]

const operatorOptions = [
  { label: '等于', value: '==' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' }
]

const logicTypes = [
  { label: '与 (AND)', value: 'AND' },
  { label: '或 (OR)', value: 'OR' }
]

// 计算属性
const parameterOptions = computed(() => {
  return parameters.value.map(param => ({
    label: param.name,
    value: param.id
  }))
})

// 节点和连接操作
function selectNode(nodeId: string) {
  if (currentTool.value === 'select') {
    selectedNodeId.value = nodeId
    selectedConnectionId.value = ''
  } else if (currentTool.value === 'entry' && nodeId !== 'entry') {
    setEntryState(nodeId)
  } else if (currentTool.value === 'transition') {
    handleTransitionTool(nodeId)
  }
}

// 过渡工具状态
const transitionSource = ref('')

function handleTransitionTool(nodeId: string) {
  if (!transitionSource.value) {
    // 第一次点击，设置源节点
    transitionSource.value = nodeId
    console.log('选择过渡源节点:', nodeId)
  } else if (transitionSource.value !== nodeId) {
    // 第二次点击，创建过渡
    createTransition(transitionSource.value, nodeId)
    transitionSource.value = ''
    currentTool.value = 'select'
  } else {
    // 点击同一个节点，取消选择
    transitionSource.value = ''
  }
}

function createTransition(sourceId: string, targetId: string) {
  const newConnection = {
    id: `transition-${generateId()}`,
    source: sourceId,
    target: targetId,
    x1: 0, y1: 0, x2: 0, y2: 0, // 将由updateConnections计算
    isActive: false,
    data: {
      duration: 0.3,
      curve: 'linear',
      conditions: [],
      logicType: 'AND'
    }
  }

  connections.value.push(newConnection)
  updateConnections()

  console.log('创建过渡:', sourceId, '->', targetId)
}

function selectConnection(connectionId: string) {
  if (currentTool.value === 'select') {
    selectedConnectionId.value = connectionId
    selectedNodeId.value = ''
  }
}

function startDrag(nodeId: string, event: MouseEvent) {
  if (currentTool.value !== 'select') return

  isDragging.value = true
  dragNodeId.value = nodeId

  const node = stateNodes.value.find(n => n.id === nodeId)
  if (node) {
    dragOffset.value = {
      x: event.clientX - node.position.x,
      y: event.clientY - node.position.y
    }
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(event: MouseEvent) {
  if (!isDragging.value || !dragNodeId.value) return

  const node = stateNodes.value.find(n => n.id === dragNodeId.value)
  if (node) {
    node.position.x = event.clientX - dragOffset.value.x
    node.position.y = event.clientY - dragOffset.value.y

    // 更新相关连接线
    updateConnections()
  }
}

function stopDrag() {
  isDragging.value = false
  dragNodeId.value = ''
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// HTML5 拖拽事件处理
function handleNodeDragStart(nodeId: string, event: DragEvent) {
  console.log('🚀 Node drag start:', nodeId)

  if (!event.dataTransfer) return

  // 设置拖拽数据
  event.dataTransfer.setData('application/qaq-node', JSON.stringify({
    nodeId: nodeId,
    type: 'state-node'
  }))
  event.dataTransfer.effectAllowed = 'move'

  // 设置拖拽状态
  isDragging.value = true
  dragNodeId.value = nodeId

  // 添加拖拽样式
  const dragNode = stateNodes.value.find(n => n.id === nodeId)
  if (dragNode) {
    console.log('📝 Dragging node:', dragNode.data.label)
  }
}

function handleNodeDragEnd() {
  console.log('🏁 Node drag end')

  // 清理拖拽状态
  isDragging.value = false
  dragNodeId.value = ''
  isDropTarget.value = false
  dropTargetId.value = ''
}

function handleNodeDragOver(targetNodeId: string, event: DragEvent) {
  // 检查是否是自拖拽
  if (dragNodeId.value === targetNodeId) {
    console.log('❌ Self-drag detected, blocking drop')
    event.dataTransfer!.dropEffect = 'none'
    isDropTarget.value = true
    dropTargetId.value = targetNodeId
    return
  }

  // 检查是否有有效的拖拽数据
  const hasNodeData = event.dataTransfer?.types.includes('application/qaq-node')
  if (!hasNodeData) {
    event.dataTransfer!.dropEffect = 'none'
    return
  }

  console.log('🎯 Valid drag over target:', targetNodeId)
  event.dataTransfer!.dropEffect = 'move'
  isDropTarget.value = true
  dropTargetId.value = targetNodeId
}

function handleNodeDrop(targetNodeId: string, event: DragEvent) {
  event.preventDefault()

  console.log('📦 Node drop on target:', targetNodeId)

  // 检查是否是自拖拽
  if (dragNodeId.value === targetNodeId) {
    console.log('❌ Self-drop blocked')
    isDropTarget.value = false
    dropTargetId.value = ''
    return
  }

  // 获取拖拽数据
  const nodeData = event.dataTransfer?.getData('application/qaq-node')
  if (!nodeData) {
    console.log('❌ No valid node data in drop')
    return
  }

  try {
    const dragData = JSON.parse(nodeData)
    console.log('✅ Creating connection:', dragData.nodeId, '→', targetNodeId)

    // 创建连接
    createConnection(dragData.nodeId, targetNodeId)

  } catch (error) {
    console.error('❌ Failed to parse drag data:', error)
  }

  // 清理状态
  isDropTarget.value = false
  dropTargetId.value = ''
}

function handleNodeDragLeave(targetNodeId: string) {
  // 只有当真正离开节点时才清理状态
  setTimeout(() => {
    if (dropTargetId.value === targetNodeId && !isDropTarget.value) {
      dropTargetId.value = ''
    }
  }, 50)
}

function updateConnections() {
  connections.value.forEach(conn => {
    const sourceNode = stateNodes.value.find(n => n.id === conn.source)
    const targetNode = stateNodes.value.find(n => n.id === conn.target)

    if (sourceNode && targetNode) {
      // 计算节点中心点
      const sourceWidth = sourceNode.type === 'entry' ? 80 : 120
      const sourceHeight = sourceNode.type === 'entry' ? 60 : 80
      const targetWidth = targetNode.type === 'entry' ? 80 : 120
      const targetHeight = targetNode.type === 'entry' ? 60 : 80

      // 计算连接点位置（节点边缘）
      const sourceCenterX = sourceNode.position.x + sourceWidth / 2
      const sourceCenterY = sourceNode.position.y + sourceHeight / 2
      const targetCenterX = targetNode.position.x + targetWidth / 2
      const targetCenterY = targetNode.position.y + targetHeight / 2

      // 计算方向向量
      const dx = targetCenterX - sourceCenterX
      const dy = targetCenterY - sourceCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        // 标准化方向向量
        const unitX = dx / distance
        const unitY = dy / distance

        // 计算连接点（从节点边缘开始）
        conn.x1 = sourceCenterX + unitX * (sourceWidth / 2)
        conn.y1 = sourceCenterY + unitY * (sourceHeight / 2)
        conn.x2 = targetCenterX - unitX * (targetWidth / 2)
        conn.y2 = targetCenterY - unitY * (targetHeight / 2)
      }
    }
  })
}

// 创建连接
function createConnection(sourceId: string, targetId: string) {
  // 检查是否已存在相同连接
  const existingConnection = connections.value.find(
    conn => conn.source === sourceId && conn.target === targetId
  )

  if (existingConnection) {
    console.log('⚠️ Connection already exists:', sourceId, '→', targetId)
    return
  }

  // 创建新连接
  const newConnection = {
    id: generateId(),
    source: sourceId,
    target: targetId,
    conditions: [],
    isActive: false,
    x1: 0, y1: 0, x2: 0, y2: 0  // 将由updateConnections计算
  }

  connections.value.push(newConnection)
  console.log('✅ Connection created:', sourceId, '→', targetId)

  // 更新连接线位置
  updateConnections()

  // 选中新连接
  selectedConnectionId.value = newConnection.id
  selectedNodeId.value = ''
}

// 工具方法
function setTool(tool: string) {
  currentTool.value = tool
}

function resetView() {
  // 重置视图
}

function saveStateMachine() {
  // 保存状态机配置
  console.log('保存状态机:', elements.value)
}

function togglePreview() {
  isPlaying.value = !isPlaying.value

  if (isPlaying.value) {
    // 开始预览，找到入口连接的目标状态
    const entryConnection = connections.value.find(conn => conn.source === 'entry')
    if (entryConnection) {
      activeStateId.value = entryConnection.target
    } else {
      // 如果没有入口连接，默认使用第一个状态
      const firstState = stateNodes.value.find(node => node.type === 'state')
      if (firstState) {
        activeStateId.value = firstState.id
      }
    }

    // 启动动画循环
    startAnimationLoop()
    console.log('🎮 开始预览，活动状态:', activeStateId.value)
  } else {
    // 停止预览
    stopAnimationLoop()
    activeStateId.value = ''
    activeTransitionId.value = ''

    // 重置所有连接状态
    connections.value.forEach(conn => conn.isActive = false)
    console.log('⏹️ 停止预览')
  }
}

// 动画循环
let animationFrameId: number | null = null

function startAnimationLoop() {
  const loop = () => {
    updateStateMachine()
    animationFrameId = requestAnimationFrame(loop)
  }

  animationFrameId = requestAnimationFrame(loop)
}

function stopAnimationLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function updateStateMachine() {
  // 更新状态机逻辑
  if (!activeStateId.value || !isPlaying.value) return

  // 检查当前状态的所有出边
  const outgoingConnections = connections.value.filter(conn =>
    conn.source === activeStateId.value && !conn.data.isEntryConnection
  )

  // 检查每个过渡的条件
  for (const conn of outgoingConnections) {
    if (checkTransitionConditions(conn)) {
      // 条件满足，激活过渡
      activeTransitionId.value = conn.id
      conn.isActive = true

      console.log(`🔄 过渡激活: ${activeStateId.value} -> ${conn.target}`)

      // 延迟后切换到目标状态
      setTimeout(() => {
        const previousState = activeStateId.value
        activeStateId.value = conn.target
        activeTransitionId.value = ''
        conn.isActive = false

        console.log(`✅ 状态切换完成: ${previousState} -> ${activeStateId.value}`)

        // 更新连接状态
        connections.value.forEach(c => c.isActive = false)
      }, (conn.data?.duration || 0.3) * 1000)

      break
    }
  }
}

function checkTransitionConditions(edge: any): boolean {
  if (!edge.data?.conditions || edge.data.conditions.length === 0) {
    return true // 没有条件时默认通过
  }

  const logicType = edge.data.logicType || 'AND'

  if (logicType === 'AND') {
    // 所有条件都必须满足
    return edge.data.conditions.every((condition: any) => {
      return evaluateCondition(condition)
    })
  } else {
    // 任一条件满足即可
    return edge.data.conditions.some((condition: any) => {
      return evaluateCondition(condition)
    })
  }
}

function evaluateCondition(condition: any): boolean {
  const param = parameters.value.find(p => p.id === condition.parameter)
  if (!param) return false

  const paramValue = param.value
  const conditionValue = parseFloat(condition.value)

  switch (condition.operator) {
    case '==': return paramValue === conditionValue
    case '!=': return paramValue !== conditionValue
    case '>': return paramValue > conditionValue
    case '<': return paramValue < conditionValue
    case '>=': return paramValue >= conditionValue
    case '<=': return paramValue <= conditionValue
    default: return false
  }
}

// 简化的事件处理
function handleCanvasClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (currentTool.value === 'state') {
    createNewState(x, y)
  } else if (currentTool.value === 'select') {
    // 点击空白区域取消选择
    selectedNodeId.value = ''
    selectedConnectionId.value = ''
  }
}

function createNewState(x: number = 300, y: number = 200) {
  const newState = {
    id: `state-${generateId()}`,
    type: 'state',
    position: { x: x - 60, y: y - 40 }, // 居中对齐
    data: {
      label: '新状态',
      animationClip: 'idle',
      speed: 1,
      loopMode: 'loop',
      exitTime: 1
    }
  }

  stateNodes.value.push(newState)
  selectedNodeId.value = newState.id
  currentTool.value = 'select'
}

// 状态机操作 - 简化版本
function setEntryState(stateId: string) {
  // 更新入口连接
  const entryConnection = connections.value.find(conn => conn.source === 'entry')
  if (entryConnection) {
    entryConnection.target = stateId
    updateConnections()
  }

  // 切换回选择工具
  currentTool.value = 'select'
}

// 参数操作
function addParameter() {
  parameters.value.push({
    id: `param-${generateId()}`,
    name: '新参数',
    type: 'Float',
    value: 0
  })
}

function removeParameter(id: string) {
  parameters.value = parameters.value.filter(param => param.id !== id)
}

function triggerParameter(id: string) {
  const param = parameters.value.find(p => p.id === id)
  if (param && param.type === 'Trigger') {
    param.value = true

    // 触发器参数自动重置
    setTimeout(() => {
      param.value = false
    }, 100)
  }
}

// 条件操作
function addCondition() {
  if (!selectedConnection.value) return

  if (!selectedConnection.value.data.conditions) {
    selectedConnection.value.data.conditions = []
  }

  selectedConnection.value.data.conditions.push({
    parameter: parameters.value[0]?.id || '',
    operator: '==',
    value: 0
  })
}

function removeCondition(index: number) {
  if (!selectedConnection.value || !selectedConnection.value.data.conditions) return

  selectedConnection.value.data.conditions.splice(index, 1)
}

// 删除选中的节点或连接
function deleteSelected() {
  if (selectedNodeId.value && selectedNodeId.value !== 'entry') {
    // 删除节点
    const nodeIndex = stateNodes.value.findIndex(node => node.id === selectedNodeId.value)
    if (nodeIndex > -1) {
      stateNodes.value.splice(nodeIndex, 1)
    }

    // 删除相关连接
    connections.value = connections.value.filter(conn =>
      conn.source !== selectedNodeId.value && conn.target !== selectedNodeId.value
    )

    selectedNodeId.value = ''
  } else if (selectedConnectionId.value) {
    // 删除连接
    const connIndex = connections.value.findIndex(conn => conn.id === selectedConnectionId.value)
    if (connIndex > -1) {
      connections.value.splice(connIndex, 1)
    }

    selectedConnectionId.value = ''
  }
}

function getActiveStateName() {
  if (!activeStateId.value) return '无'

  const activeNode = stateNodes.value.find(node => node.id === activeStateId.value)
  return activeNode?.data?.label || '未知'
}

// 测试拖拽功能
function testDragFunctionality() {
  console.log('🧪 Testing animation state machine drag functionality...')
  console.log('📊 Current state nodes:', stateNodes.value.length)
  console.log('📊 Current connections:', connections.value.length)

  // 测试自拖拽防护
  if (stateNodes.value.length > 0) {
    const testNode = stateNodes.value[0]
    console.log('🧪 Testing self-drag protection for node:', testNode.id)

    // 模拟自拖拽检测
    dragNodeId.value = testNode.id
    const mockEvent = {
      dataTransfer: { dropEffect: 'move', types: ['application/qaq-node'] },
      preventDefault: () => {}
    } as any

    handleNodeDragOver(testNode.id, mockEvent)

    if (mockEvent.dataTransfer.dropEffect === 'none') {
      console.log('✅ Self-drag protection working correctly')
    } else {
      console.log('❌ Self-drag protection failed')
    }

    // 清理测试状态
    dragNodeId.value = ''
    isDropTarget.value = false
    dropTargetId.value = ''
  }
}

// 生命周期
onMounted(() => {
  // 初始化
  window.addEventListener('keydown', handleKeyDown)

  // 初始化连接线位置
  updateConnections()

  // 开发模式下测试功能
  if (process.dev) {
    setTimeout(testDragFunctionality, 1000)
  }
})

onUnmounted(() => {
  // 清理
  window.removeEventListener('keydown', handleKeyDown)
  stopAnimationLoop()
})

// 键盘快捷键
function handleKeyDown(event: KeyboardEvent) {
  switch (event.key.toLowerCase()) {
    case 'q':
      setTool('select')
      break
    case 'w':
      setTool('state')
      break
    case 'e':
      setTool('transition')
      break
    case 'r':
      setTool('entry')
      break
    case 'delete':
    case 'backspace':
      deleteSelected()
      break
  }
}

// 删除函数已在上面定义
</script>

<style scoped>
.qaq-animation-state-machine {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #1a1a1a);
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-anim-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--qaq-editor-panel, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #404040);
}

.qaq-toolbar-left,
.qaq-toolbar-right {
  display: flex;
  gap: 4px;
}

/* 工具按钮统一样式 */
.qaq-tool-button {
  border: none !important;
  min-width: 32px;
  min-height: 32px;
  padding: 6px !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

.qaq-tool-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 220, 130, 0.2) !important;
}

.qaq-tool-button:active {
  transform: translateY(0);
}

.qaq-editor-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-anim-editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.qaq-anim-graph {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.qaq-simple-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.qaq-grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle, var(--qaq-editor-border, #404040) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
}

.qaq-simple-node {
  position: absolute;
  width: 120px;
  height: 80px;
  background: var(--qaq-editor-panel, #2a2a2a);
  border: 2px solid var(--qaq-editor-border, #404040);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.qaq-simple-node:hover {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 8px rgba(0, 220, 130, 0.3);
}

.qaq-node-dragging {
  opacity: 0.7;
  transform: scale(1.05);
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.4) !important;
}

.qaq-node-drop-target {
  border-color: var(--qaq-primary, #00DC82) !important;
  box-shadow: 0 0 16px rgba(0, 220, 130, 0.6) !important;
  background: rgba(0, 220, 130, 0.1) !important;
}

.qaq-node-drop-forbidden {
  border-color: #ef4444 !important;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.6) !important;
  background: rgba(239, 68, 68, 0.1) !important;
  cursor: not-allowed !important;
}

.qaq-node-drop-forbidden::after {
  content: '🚫';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  z-index: 10;
}

.qaq-node-selected {
  border-color: var(--qaq-accent-blue, #3b82f6);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.qaq-node-active {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.5);
  background: rgba(0, 220, 130, 0.1);
}

.qaq-node-entry {
  width: 80px;
  height: 60px;
  background: linear-gradient(135deg, var(--qaq-primary, #00DC82), var(--qaq-accent-green, #10b981));
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 220, 130, 0.3);
}

.qaq-node-entry:hover {
  transform: scale(1.05);
}

.qaq-node-icon {
  font-size: 20px;
  color: var(--qaq-primary, #00DC82);
  margin-bottom: 4px;
}

.qaq-node-entry .qaq-node-icon {
  color: white;
  font-size: 24px;
}

.qaq-node-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text, #ffffff);
  text-align: center;
  margin-bottom: 4px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qaq-node-entry .qaq-node-label {
  color: white;
  font-size: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.qaq-node-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.qaq-node-clip {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  text-transform: capitalize;
}

.qaq-node-speed {
  font-size: 9px;
  color: var(--qaq-accent-orange, #f59e0b);
  font-weight: 500;
}

.qaq-connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.qaq-connections-svg line {
  pointer-events: stroke;
  stroke-width: 1px; /* 增加点击区域 */
  cursor: pointer;
}

.qaq-debug-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--qaq-editor-border, #404040);
  border-radius: 6px;
  padding: 12px;
  max-width: 200px;
  z-index: 10;
}

.qaq-debug-info h3 {
  font-size: 12px;
  margin: 0 0 8px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-debug-state {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
}

.qaq-active-state {
  font-weight: bold;
  color: var(--qaq-primary, #00DC82);
}

/* 重复样式已删除 */

.qaq-anim-properties {
  width: 300px;
  border-left: 1px solid var(--qaq-editor-border, #404040);
  background: var(--qaq-editor-panel, #2a2a2a);
  overflow-y: auto;
}

.qaq-properties-panel {
  padding: 16px;
}

.qaq-panel-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--qaq-primary, #00DC82);
  border-bottom: 1px solid var(--qaq-editor-border, #404040);
  padding-bottom: 8px;
}

.qaq-section-title {
  font-size: 13px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-property-group {
  margin-bottom: 12px;
}

.qaq-property-group label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-slider-value {
  font-size: 12px;
  min-width: 30px;
  text-align: right;
}

.qaq-condition {
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.qaq-condition-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.qaq-condition-param {
  flex: 2;
}

.qaq-condition-op {
  flex: 1;
}

.qaq-condition-value {
  flex: 1;
}

.qaq-condition-delete {
  flex: 0;
}

.qaq-condition-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}

.qaq-parameters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qaq-parameter-item {
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.qaq-parameter-header {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.qaq-param-name {
  flex: 2;
}

.qaq-param-type {
  flex: 1;
}

.qaq-param-delete {
  flex: 0;
}

.qaq-parameters-actions {
  margin-top: 16px;
}

.qaq-debug-panel {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 8px;
  max-width: 200px;
}

.qaq-debug-info h3 {
  font-size: 12px;
  margin: 0 0 8px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-debug-state {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
}

.qaq-active-state {
  font-weight: bold;
  color: var(--qaq-primary, #00DC82);
}

.qaq-debug-params {
  font-size: 11px;
}

.qaq-param-value {
  font-size: 10px;
  min-width: 30px;
  text-align: right;
  color: var(--qaq-primary, #00DC82);
}

.qaq-param-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.qaq-param-control label {
  min-width: 50px;
  font-weight: 500;
}
</style>
