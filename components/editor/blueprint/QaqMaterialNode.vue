<template>
  <div class="qaq-material-node" :class="nodeClasses">
    <!-- 节点头部 -->
    <div class="qaq-node-header">
      <UIcon :name="data.icon" class="qaq-node-icon" />
      <span class="qaq-node-title">{{ data.label }}</span>
    </div>

    <!-- 节点主体 -->
    <div class="qaq-node-body">
      <!-- 输入端口 -->
      <div class="qaq-node-inputs">
        <div
          v-for="(input, index) in data.inputs"
          :key="`input-${index}`"
          class="qaq-node-port qaq-input-port"
        >
          <div
            class="qaq-port-handle qaq-input-handle"
            @mousedown="onInputMouseDown(index, $event)"
            @mouseup="onInputMouseUp(index, $event)"
          ></div>
          <span class="qaq-port-label">{{ input }}</span>
        </div>
      </div>

      <!-- 节点内容 -->
      <div v-if="hasContent" class="qaq-node-content">
        <!-- 常量值输入 -->
        <div v-if="data.type === 'constant'" class="qaq-constant-input">
          <input
            v-model="data.value"
            type="number"
            step="0.01"
            class="qaq-inline-input"
            @input="updateNodeData"
          />
        </div>

        <!-- 颜色选择器 -->
        <div v-if="data.type === 'color'" class="qaq-color-input">
          <input
            v-model="data.color"
            type="color"
            class="qaq-inline-color"
            @input="updateNodeData"
          />
        </div>

        <!-- 纹理预览 -->
        <div v-if="data.type === 'texture'" class="qaq-texture-preview">
          <div class="qaq-texture-thumbnail">
            <UIcon name="i-heroicons-photo" class="qaq-texture-icon" />
          </div>
        </div>

        <!-- 数学运算符显示 -->
        <div v-if="isMathNode" class="qaq-math-operator">
          <span class="qaq-operator-symbol">{{ getMathSymbol(data.type) }}</span>
        </div>
      </div>

      <!-- 输出端口 -->
      <div class="qaq-node-outputs">
        <div
          v-for="(output, index) in data.outputs"
          :key="`output-${index}`"
          class="qaq-node-port qaq-output-port"
        >
          <span class="qaq-port-label">{{ output }}</span>
          <div
            class="qaq-port-handle qaq-output-handle"
            @mousedown="onOutputMouseDown(index, $event)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NodeData {
  label: string
  type: string
  icon: string
  inputs: string[]
  outputs: string[]
  value?: number
  color?: string
  texture?: string
}

interface Props {
  data: NodeData
  nodeId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'start-connection': [nodeId: string, outputIndex: number, event: MouseEvent]
  'end-connection': [nodeId: string, inputIndex: number, event: MouseEvent]
}>()

// 计算属性
const nodeClasses = computed(() => [
  `qaq-node-${props.data.type}`,
  {
    'qaq-node-selected': false, // TODO: 实现选择状态
    'qaq-node-output': props.data.type === 'output'
  }
])

const hasContent = computed(() => {
  return ['constant', 'color', 'texture'].includes(props.data.type) || isMathNode.value
})

const isMathNode = computed(() => {
  return ['add', 'multiply', 'subtract', 'divide', 'power', 'lerp'].includes(props.data.type)
})

// 方法
function getMathSymbol(type: string): string {
  const symbols: Record<string, string> = {
    'add': '+',
    'multiply': '×',
    'subtract': '−',
    'divide': '÷',
    'power': '^',
    'lerp': 'LERP'
  }
  return symbols[type] || '?'
}

function updateNodeData() {
  // TODO: 实现节点数据更新
  console.log('Node data updated:', props.data)
}

function onOutputMouseDown(outputIndex: number, event: MouseEvent) {
  if (props.nodeId) {
    emit('start-connection', props.nodeId, outputIndex, event)
  }
}

function onInputMouseDown(inputIndex: number, event: MouseEvent) {
  event.stopPropagation()
}

function onInputMouseUp(inputIndex: number, event: MouseEvent) {
  if (props.nodeId) {
    emit('end-connection', props.nodeId, inputIndex, event)
  }
}

// 获取节点类型的颜色
function getNodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'uv': '#4CAF50',
    'time': '#FF9800',
    'constant': '#2196F3',
    'color': '#E91E63',
    'add': '#9C27B0',
    'multiply': '#9C27B0',
    'subtract': '#9C27B0',
    'divide': '#9C27B0',
    'power': '#9C27B0',
    'lerp': '#9C27B0',
    'texture': '#FF5722',
    'normal': '#FF5722',
    'noise': '#FF5722',
    'output': '#607D8B'
  }
  return colors[type] || '#757575'
}
</script>

<style scoped>
.qaq-material-node {
  min-width: 150px;
  background-color: var(--qaq-node-bg, #2a2a2a);
  border: 2px solid var(--qaq-node-border, #555555);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.qaq-material-node:hover {
  border-color: var(--qaq-node-hover, #777777);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.qaq-node-selected {
  border-color: var(--qaq-primary, #00DC82) !important;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.qaq-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--qaq-node-header-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
  border-radius: 6px 6px 0 0;
}

.qaq-node-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.qaq-node-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
}

.qaq-node-body {
  padding: 8px 0;
  position: relative;
}

.qaq-node-inputs,
.qaq-node-outputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-node-port {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 12px;
  min-height: 20px;
}

.qaq-input-port {
  justify-content: flex-start;
}

.qaq-output-port {
  justify-content: flex-end;
}

.qaq-port-label {
  font-size: 0.75rem;
  color: var(--qaq-text-secondary, #cccccc);
  pointer-events: none;
}

.qaq-port-handle {
  width: 12px;
  height: 12px;
  border: 2px solid var(--qaq-port-border, #666666);
  background-color: var(--qaq-port-bg, #2a2a2a);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.qaq-input-handle {
  left: -6px;
}

.qaq-output-handle {
  right: -6px;
}

.qaq-port-handle:hover {
  border-color: var(--qaq-primary, #00DC82);
  background-color: var(--qaq-primary, #00DC82);
  transform: scale(1.2);
}

.qaq-node-content {
  margin: 8px 12px;
  padding: 8px;
  background-color: var(--qaq-node-content-bg, #333333);
  border-radius: 4px;
}

.qaq-constant-input {
  display: flex;
  align-items: center;
}

.qaq-inline-input {
  width: 100%;
  padding: 4px 8px;
  background-color: var(--qaq-input-bg, #2a2a2a);
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 4px;
  color: var(--qaq-text-primary, #ffffff);
  font-size: 0.875rem;
}

.qaq-inline-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-color-input {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-inline-color {
  width: 40px;
  height: 24px;
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
}

.qaq-texture-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-texture-thumbnail {
  width: 40px;
  height: 40px;
  background-color: var(--qaq-thumbnail-bg, #444444);
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-texture-icon {
  width: 20px;
  height: 20px;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-math-operator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-operator-symbol {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--qaq-text-primary, #ffffff);
}

/* 节点类型特定样式 */
.qaq-node-uv .qaq-node-header {
  background-color: #4CAF50;
}

.qaq-node-time .qaq-node-header {
  background-color: #FF9800;
}

.qaq-node-constant .qaq-node-header {
  background-color: #2196F3;
}

.qaq-node-color .qaq-node-header {
  background-color: #E91E63;
}

.qaq-node-add .qaq-node-header,
.qaq-node-multiply .qaq-node-header,
.qaq-node-subtract .qaq-node-header,
.qaq-node-divide .qaq-node-header,
.qaq-node-power .qaq-node-header,
.qaq-node-lerp .qaq-node-header {
  background-color: #9C27B0;
}

.qaq-node-texture .qaq-node-header,
.qaq-node-normal .qaq-node-header,
.qaq-node-noise .qaq-node-header {
  background-color: #FF5722;
}

.qaq-node-output .qaq-node-header {
  background-color: #607D8B;
}

.qaq-node-output {
  border-color: #607D8B;
}
</style>
