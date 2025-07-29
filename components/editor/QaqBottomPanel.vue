<template>
  <div class="qaq-bottom-panel">
    <!-- 面板标签栏 -->
    <div class="qaq-panel-tabs">
      <UButton
        v-for="tab in panelTabs"
        :key="tab.id"
        :variant="activeTab === tab.id ? 'solid' : 'ghost'"
        size="xs"
        :icon="tab.icon"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="qaq-tab-count">{{ tab.count }}</span>
      </UButton>

      <div class="qaq-tabs-spacer" />

      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        size="xs"
        title="Close Panel"
        @click="closePanel"
      />
    </div>

    <!-- 面板内容 -->
    <div class="qaq-panel-content">
      <!-- 输出面板 -->
      <div v-if="activeTab === 'output'" class="qaq-output-panel">
        <div class="qaq-output-toolbar">
          <UButton
            icon="i-heroicons-trash"
            variant="ghost"
            size="xs"
            title="Clear Output"
            @click="clearOutput"
          />
          <UButton
            :icon="autoScroll ? 'i-heroicons-arrow-down-circle' : 'i-heroicons-arrow-down-circle'"
            :variant="autoScroll ? 'solid' : 'ghost'"
            size="xs"
            title="Auto Scroll"
            @click="toggleAutoScroll"
          />
          <USelectMenu
            v-model="outputFilter"
            :options="outputFilterOptions"
            size="xs"
            placeholder="Filter..."
          />
        </div>

        <div class="qaq-output-content" ref="outputContent">
          <div
            v-for="(log, index) in filteredOutputLogs"
            :key="index"
            class="qaq-output-line"
            :class="`qaq-output-${log.level}`"
          >
            <span class="qaq-output-time">{{ formatTime(log.timestamp) }}</span>
            <UIcon :name="getLogIcon(log.level)" class="qaq-output-icon" />
            <span class="qaq-output-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- 调试器面板 -->
      <div v-else-if="activeTab === 'debugger'" class="qaq-debugger-panel">
        <div class="qaq-debugger-toolbar">
          <UButton
            :disabled="!isDebugging"
            icon="i-heroicons-play"
            variant="ghost"
            size="xs"
            title="Continue"
            @click="debugContinue"
          />
          <UButton
            :disabled="!isDebugging"
            icon="i-heroicons-forward"
            variant="ghost"
            size="xs"
            title="Step Over"
            @click="debugStepOver"
          />
          <UButton
            :disabled="!isDebugging"
            icon="i-heroicons-arrow-down"
            variant="ghost"
            size="xs"
            title="Step Into"
            @click="debugStepInto"
          />
          <UButton
            :disabled="!isDebugging"
            icon="i-heroicons-arrow-up"
            variant="ghost"
            size="xs"
            title="Step Out"
            @click="debugStepOut"
          />
          <UButton
            icon="i-heroicons-stop"
            variant="ghost"
            size="xs"
            title="Stop Debugging"
            @click="stopDebugging"
          />
        </div>

        <div class="qaq-debugger-content">
          <div v-if="!isDebugging" class="qaq-empty-state">
            <UIcon name="i-heroicons-bug-ant" class="qaq-empty-icon" />
            <p>No debugging session active</p>
          </div>

          <div v-else class="qaq-debug-info">
            <div class="qaq-debug-section">
              <h4>Call Stack</h4>
              <div class="qaq-call-stack">
                <div
                  v-for="(frame, index) in callStack"
                  :key="index"
                  class="qaq-stack-frame"
                  @click="selectStackFrame(frame)"
                >
                  <span class="qaq-frame-function">{{ frame.function }}</span>
                  <span class="qaq-frame-location">{{ frame.file }}:{{ frame.line }}</span>
                </div>
              </div>
            </div>

            <div class="qaq-debug-section">
              <h4>Variables</h4>
              <div class="qaq-variables">
                <div
                  v-for="variable in variables"
                  :key="variable.name"
                  class="qaq-variable"
                >
                  <span class="qaq-var-name">{{ variable.name }}</span>
                  <span class="qaq-var-value">{{ variable.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 动画面板 -->
      <div v-else-if="activeTab === 'animation'" class="qaq-animation-panel">
        <QaqAnimationEditor
          :target-mesh="selectedMeshNode"
          @animation-created="onAnimationCreated"
          @animation-updated="onAnimationUpdated"
          @animation-deleted="onAnimationDeleted"
          @target-changed="onAnimationTargetChanged"
        />
      </div>

      <!-- 音频面板 -->
      <div v-else-if="activeTab === 'audio'" class="qaq-audio-panel">
        <div class="qaq-audio-toolbar">
          <UButton
            icon="i-heroicons-speaker-wave"
            variant="ghost"
            size="xs"
            title="Master Volume"
          />
          <URange
            v-model="masterVolume"
            :min="0"
            :max="100"
            class="qaq-volume-slider"
          />
        </div>

        <div class="qaq-audio-content">
          <div class="qaq-empty-state">
            <UIcon name="i-heroicons-musical-note" class="qaq-empty-icon" />
            <p>Audio mixer coming soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useEditorStore } from '~/stores/editor'
import QaqAnimationEditor from './animation/QaqAnimationEditor.vue'

// 状态管理
const editorStore = useEditorStore()

// DOM 引用
const outputContent = ref<HTMLDivElement>()

// 响应式数据
const activeTab = ref('output')
const autoScroll = ref(true)
const outputFilter = ref(null)
const masterVolume = ref(80)

// 调试器状态
const isDebugging = ref(false)
const callStack = ref([])
const variables = ref([])

// 动画编辑器状态
const selectedMeshNode = ref(null)

// 面板标签配置
const panelTabs = computed(() => [
  {
    id: 'output',
    label: 'Output',
    icon: 'i-heroicons-command-line',
    count: outputLogs.value.length
  },
  {
    id: 'debugger',
    label: 'Debugger',
    icon: 'i-heroicons-bug-ant',
    count: 0
  },
  {
    id: 'animation',
    label: 'Animation',
    icon: 'i-heroicons-film',
    count: 0
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: 'i-heroicons-musical-note',
    count: 0
  }
])

// 输出日志
const outputLogs = ref([
  {
    level: 'info',
    message: 'QAQ Game Engine initialized',
    timestamp: Date.now()
  },
  {
    level: 'success',
    message: 'Project loaded successfully',
    timestamp: Date.now()
  }
])

// 输出过滤选项
const outputFilterOptions = [
  { label: 'All', value: null },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
  { label: 'Success', value: 'success' }
]

// 计算属性
const filteredOutputLogs = computed(() => {
  if (!outputFilter.value) return outputLogs.value
  return outputLogs.value.filter(log => log.level === outputFilter.value)
})

// ========================================================================
// 面板操作
// ========================================================================

function setActiveTab(tabId: string) {
  activeTab.value = tabId
}

function closePanel() {
  editorStore.updatePanel('output', { visible: false })
}

// ========================================================================
// 输出面板
// ========================================================================

function clearOutput() {
  outputLogs.value = []
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
}

function addOutputLog(level: string, message: string) {
  outputLogs.value.push({
    level,
    message,
    timestamp: Date.now()
  })

  if (autoScroll.value) {
    nextTick(() => {
      if (outputContent.value) {
        outputContent.value.scrollTop = outputContent.value.scrollHeight
      }
    })
  }
}

function getLogIcon(level: string): string {
  switch (level) {
    case 'error':
      return 'i-heroicons-x-circle'
    case 'warning':
      return 'i-heroicons-exclamation-triangle'
    case 'success':
      return 'i-heroicons-check-circle'
    case 'info':
    default:
      return 'i-heroicons-information-circle'
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// ========================================================================
// 调试器面板
// ========================================================================

function debugContinue() {
  console.log('Debug: Continue')
}

function debugStepOver() {
  console.log('Debug: Step Over')
}

function debugStepInto() {
  console.log('Debug: Step Into')
}

function debugStepOut() {
  console.log('Debug: Step Out')
}

function stopDebugging() {
  isDebugging.value = false
  callStack.value = []
  variables.value = []
}

function selectStackFrame(frame: any) {
  console.log('Select stack frame:', frame)
}

// ========================================================================
// 动画面板
// ========================================================================

function onAnimationCreated(animation: any) {
  console.log('Animation created:', animation)
  addOutputLog('success', `Animation "${animation.name}" created`)
}

function onAnimationUpdated(animation: any) {
  console.log('Animation updated:', animation)
  addOutputLog('info', `Animation "${animation.name}" updated`)
}

function onAnimationDeleted(animationId: string) {
  console.log('Animation deleted:', animationId)
  addOutputLog('info', `Animation "${animationId}" deleted`)
}

function onAnimationTargetChanged(target: any) {
  selectedMeshNode.value = target
  console.log('Animation target changed:', target)
  addOutputLog('info', `Animation target set to "${target.name}"`)
}

// 监听编辑器事件
watch(() => editorStore.outputLogs, (logs) => {
  outputLogs.value = logs
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  addOutputLog,
  setActiveTab,
  setSelectedMeshNode: (node: any) => {
    selectedMeshNode.value = node
    setActiveTab('animation')
  }
})
</script>

<style scoped>
.qaq-bottom-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-panel-tabs {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  background-color: var(--qaq-tabs-bg, #404040);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-tab-count {
  margin-left: 4px;
  padding: 1px 4px;
  background-color: var(--qaq-badge-bg, #666666);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.qaq-tabs-spacer {
  flex: 1;
}

.qaq-panel-content {
  flex: 1;
  overflow: hidden;
}

.qaq-output-panel,
.qaq-debugger-panel,
.qaq-animation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qaq-audio-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qaq-output-toolbar,
.qaq-debugger-toolbar,
.qaq-animation-toolbar,
.qaq-audio-toolbar {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-output-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}

.qaq-output-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  border-radius: 2px;
  margin-bottom: 1px;
}

.qaq-output-line:hover {
  background-color: var(--qaq-hover-bg, rgba(255, 255, 255, 0.05));
}

.qaq-output-time {
  color: var(--qaq-text-secondary, #888888);
  font-size: 10px;
  min-width: 60px;
}

.qaq-output-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.qaq-output-message {
  flex: 1;
  word-break: break-word;
}

.qaq-output-info {
  color: var(--qaq-info-color, #4a90e2);
}

.qaq-output-warning {
  color: var(--qaq-warning-color, #ff9500);
}

.qaq-output-error {
  color: var(--qaq-error-color, #ff3b30);
}

.qaq-output-success {
  color: var(--qaq-success-color, #34c759);
}

.qaq-debugger-content,
.qaq-animation-content,
.qaq-audio-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.qaq-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.qaq-empty-state p {
  font-size: 14px;
  margin: 0;
}

.qaq-debug-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qaq-debug-section h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--qaq-border, #555555);
}

.qaq-call-stack,
.qaq-variables {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qaq-stack-frame,
.qaq-variable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background-color: var(--qaq-card-bg, #404040);
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.qaq-stack-frame:hover,
.qaq-variable:hover {
  background-color: var(--qaq-hover-bg, #454545);
}

.qaq-frame-function,
.qaq-var-name {
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
}

.qaq-frame-location,
.qaq-var-value {
  color: var(--qaq-text-secondary, #cccccc);
  font-family: monospace;
}

.qaq-volume-slider {
  width: 100px;
  margin-left: 8px;
}
</style>
