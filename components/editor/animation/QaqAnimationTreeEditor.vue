<!--
  QAQ游戏引擎 - AnimationTree集成编辑器
  
  完整的AnimationTree编辑器，集成状态机编辑器和参数面板
-->

<template>
  <div class="animation-tree-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <h2 class="editor-title">
          <UIcon name="i-heroicons-play" />
          AnimationTree 编辑器
        </h2>
        <UBadge
          :color="isConnected ? 'green' : 'red'"
          variant="soft"
        >
          {{ isConnected ? '已连接' : '未连接' }}
        </UBadge>
      </div>

      <div class="toolbar-right">
        <!-- 播放控制 -->
        <div class="playback-controls">
          <UButton
            :icon="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
            :color="isPlaying ? 'orange' : 'green'"
            size="sm"
            @click="togglePlayback"
          >
            {{ isPlaying ? '暂停' : '播放' }}
          </UButton>
          <UButton
            icon="i-heroicons-stop"
            color="red"
            size="sm"
            variant="outline"
            @click="stopPlayback"
          >
            停止
          </UButton>
        </div>

        <!-- 视图控制 -->
        <div class="view-controls">
          <UButton
            :icon="showParameterPanel ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            size="sm"
            variant="ghost"
            @click="showParameterPanel = !showParameterPanel"
          >
            参数面板
          </UButton>
          <UButton
            icon="i-heroicons-arrow-path"
            size="sm"
            variant="ghost"
            @click="resetView"
          >
            重置视图
          </UButton>
        </div>

        <!-- 文件操作 -->
        <div class="file-controls">
          <UButton
            icon="i-heroicons-folder-open"
            size="sm"
            variant="outline"
            @click="loadAnimationTree"
          >
            加载
          </UButton>
          <UButton
            icon="i-heroicons-document-arrow-down"
            size="sm"
            variant="outline"
            @click="saveAnimationTree"
          >
            保存
          </UButton>
        </div>
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-main">
      <!-- 状态机编辑器 -->
      <div class="state-machine-container">
        <QaqStateMachineEditor
          :animation-tree="animationTree"
          :animation-player="animationPlayer"
          @animation-tree-created="onAnimationTreeCreated"
          @state-selected="onStateSelected"
          @transition-selected="onTransitionSelected"
        />
      </div>

      <!-- 参数面板 -->
      <div
        v-if="showParameterPanel"
        class="parameter-panel-container"
      >
        <QaqAnimationParameterPanel
          @parameter-changed="onParameterChanged"
        />
      </div>
    </div>

    <!-- 状态信息面板 -->
    <div class="info-panel">
      <div class="info-section">
        <h4>当前选择</h4>
        <div v-if="selectedState" class="selection-info">
          <div class="info-item">
            <span class="info-label">状态:</span>
            <span class="info-value">{{ selectedState.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">动画:</span>
            <span class="info-value">{{ selectedState.animationName || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">速度:</span>
            <span class="info-value">{{ selectedState.speed || 1.0 }}</span>
          </div>
        </div>
        <div v-else-if="selectedTransition" class="selection-info">
          <div class="info-item">
            <span class="info-label">转换:</span>
            <span class="info-value">{{ selectedTransition.fromStateId }} → {{ selectedTransition.toStateId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">持续时间:</span>
            <span class="info-value">{{ selectedTransition.duration }}s</span>
          </div>
        </div>
        <div v-else class="no-selection">
          <span class="no-selection-text">未选择任何元素</span>
        </div>
      </div>

      <!-- 性能信息 -->
      <div class="info-section">
        <h4>性能信息</h4>
        <div class="performance-info">
          <div class="info-item">
            <span class="info-label">状态数量:</span>
            <span class="info-value">{{ stateCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">转换数量:</span>
            <span class="info-value">{{ transitionCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">参数数量:</span>
            <span class="info-value">{{ parameterCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前状态:</span>
            <UBadge
              :color="currentState ? 'green' : 'gray'"
              variant="soft"
              size="xs"
            >
              {{ currentState || '无' }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载文件对话框 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QaqStateMachineEditor from './QaqStateMachineEditor.vue'
import QaqAnimationParameterPanel from './QaqAnimationParameterPanel.vue'
import { animationTreeAdapter, type EditorStateMachineNode, type EditorStateTransition } from './AnimationTreeAdapter'
import AnimationTree from '../../../core/nodes/animation/AnimationTree'
import AnimationPlayer from '../../../core/nodes/animation/AnimationPlayer'

// ============================================================================
// 组件属性
// ============================================================================

interface Props {
  initialAnimationTree?: AnimationTree
  initialAnimationPlayer?: AnimationPlayer
}

const props = defineProps<Props>()

// ============================================================================
// 响应式数据
// ============================================================================

const animationTree = ref<AnimationTree | null>(props.initialAnimationTree || null)
const animationPlayer = ref<AnimationPlayer | null>(props.initialAnimationPlayer || null)

// UI状态
const showParameterPanel = ref(true)
const selectedState = ref<EditorStateMachineNode | null>(null)
const selectedTransition = ref<EditorStateTransition | null>(null)
const fileInput = ref<HTMLInputElement>()

// 适配器状态
const isConnected = computed(() => animationTree.value !== null)
const isPlaying = computed(() => animationTreeAdapter.isPlaying.value)
const currentState = computed(() => animationTreeAdapter.currentState.value)

// 统计信息
const stateCount = computed(() => animationTreeAdapter.states.value.length)
const transitionCount = computed(() => animationTreeAdapter.transitions.value.length)
const parameterCount = computed(() => animationTreeAdapter.parameters.value.length)

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 如果有初始AnimationTree，连接到适配器
  if (animationTree.value) {
    animationTreeAdapter.connectToAnimationTree(animationTree.value, animationPlayer.value)
  }
})

onUnmounted(() => {
  // 清理适配器
  animationTreeAdapter.destroy()
})

// ============================================================================
// 事件处理
// ============================================================================

/**
 * AnimationTree创建事件
 */
function onAnimationTreeCreated(tree: AnimationTree) {
  animationTree.value = tree
  emit('animationTreeCreated', tree)
}

/**
 * 状态选择事件
 */
function onStateSelected(stateId: string) {
  const state = animationTreeAdapter.states.value.find(s => s.id === stateId)
  selectedState.value = state || null
  selectedTransition.value = null
  
  emit('stateSelected', stateId, state)
}

/**
 * 转换选择事件
 */
function onTransitionSelected(transitionId: string) {
  const transition = animationTreeAdapter.transitions.value.find(t => t.id === transitionId)
  selectedTransition.value = transition || null
  selectedState.value = null
  
  emit('transitionSelected', transitionId, transition)
}

/**
 * 参数变化事件
 */
function onParameterChanged(name: string, value: any) {
  emit('parameterChanged', name, value)
}

// ============================================================================
// 播放控制
// ============================================================================

/**
 * 切换播放状态
 */
function togglePlayback() {
  if (isPlaying.value) {
    animationTreeAdapter.stop()
  } else {
    animationTreeAdapter.play()
  }
}

/**
 * 停止播放
 */
function stopPlayback() {
  animationTreeAdapter.stop()
}

// ============================================================================
// 视图控制
// ============================================================================

/**
 * 重置视图
 */
function resetView() {
  // 这里可以重置状态机编辑器的视图
  selectedState.value = null
  selectedTransition.value = null
}

// ============================================================================
// 文件操作
// ============================================================================

/**
 * 加载AnimationTree
 */
function loadAnimationTree() {
  fileInput.value?.click()
}

/**
 * 文件选择处理
 */
function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      animationTreeAdapter.importStateMachine(data)
      
      // 重置选择
      selectedState.value = null
      selectedTransition.value = null
      
      emit('animationTreeLoaded', data)
    } catch (error) {
      console.error('Failed to load animation tree:', error)
      // 这里应该显示错误提示
    }
  }
  reader.readAsText(file)
}

/**
 * 保存AnimationTree
 */
function saveAnimationTree() {
  const data = animationTreeAdapter.exportStateMachine()
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = 'animation_tree.json'
  a.click()
  
  URL.revokeObjectURL(url)
  
  emit('animationTreeSaved', data)
}

// ============================================================================
// 事件定义
// ============================================================================

const emit = defineEmits<{
  animationTreeCreated: [tree: AnimationTree]
  animationTreeLoaded: [data: any]
  animationTreeSaved: [data: any]
  stateSelected: [stateId: string, state: EditorStateMachineNode | null]
  transitionSelected: [transitionId: string, transition: EditorStateTransition | null]
  parameterChanged: [name: string, value: any]
}>()
</script>

<style scoped>
.animation-tree-editor {
  @apply flex flex-col h-full bg-gray-50 dark:bg-gray-900;
}

.editor-toolbar {
  @apply flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.toolbar-left {
  @apply flex items-center gap-4;
}

.editor-title {
  @apply flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white;
}

.toolbar-right {
  @apply flex items-center gap-4;
}

.playback-controls,
.view-controls,
.file-controls {
  @apply flex items-center gap-2;
}

.editor-main {
  @apply flex flex-1 overflow-hidden;
}

.state-machine-container {
  @apply flex-1;
}

.parameter-panel-container {
  @apply flex-shrink-0;
}

.info-panel {
  @apply p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  height: 200px;
}

.info-section {
  @apply mb-4;
}

.info-section h4 {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.selection-info,
.performance-info {
  @apply space-y-1;
}

.info-item {
  @apply flex items-center justify-between text-sm;
}

.info-label {
  @apply text-gray-600 dark:text-gray-400;
}

.info-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.no-selection {
  @apply flex items-center justify-center py-4;
}

.no-selection-text {
  @apply text-gray-500 dark:text-gray-400 text-sm;
}
</style>
