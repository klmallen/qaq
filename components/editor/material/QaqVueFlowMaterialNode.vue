<template>
  <div 
    class="qaq-vueflow-material-node"
    :class="[
      `qaq-node-${data.type}`,
      { 'qaq-node-selected': selected }
    ]"
  >
    <!-- 节点头部 -->
    <div class="qaq-node-header">
      <UIcon :name="data.icon" class="qaq-node-icon" />
      <span class="qaq-node-title">{{ data.label }}</span>
    </div>

    <!-- 节点主体 -->
    <div class="qaq-node-body">
      <!-- 输入端口 -->
      <div v-if="data.inputs.length > 0" class="qaq-node-inputs">
        <div
          v-for="(input, index) in data.inputs"
          :key="input.id"
          class="qaq-input-row"
        >
          <!-- 输入Handle -->
          <Handle
            :id="input.id"
            type="target"
            :position="Position.Left"
            :class="[
              'qaq-input-handle',
              `qaq-handle-${input.type}`
            ]"
            :style="getHandleStyle(input.type)"
          />
          
          <!-- 输入标签 -->
          <span class="qaq-input-label">{{ input.name }}</span>
          
          <!-- 输入值显示（如果没有连接） -->
          <div v-if="!isInputConnected(input.id)" class="qaq-input-value">
            <component
              :is="getInputComponent(input.type)"
              :value="getInputValue(input.id)"
              @update="updateInputValue(input.id, $event)"
            />
          </div>
        </div>
      </div>

      <!-- 节点属性（内联编辑） -->
      <div v-if="hasInlineProperties" class="qaq-node-properties">
        <div
          v-for="(value, key) in data.properties"
          :key="key"
          class="qaq-property-row"
        >
          <label class="qaq-property-label">{{ formatPropertyName(key) }}</label>
          <component
            :is="getPropertyComponent(key, value)"
            :value="value"
            @update="updateProperty(key, $event)"
          />
        </div>
      </div>

      <!-- 输出端口 -->
      <div v-if="data.outputs.length > 0" class="qaq-node-outputs">
        <div
          v-for="(output, index) in data.outputs"
          :key="output.id"
          class="qaq-output-row"
        >
          <!-- 输出标签 -->
          <span class="qaq-output-label">{{ output.name }}</span>
          
          <!-- 输出Handle -->
          <Handle
            :id="output.id"
            type="source"
            :position="Position.Right"
            :class="[
              'qaq-output-handle',
              `qaq-handle-${output.type}`
            ]"
            :style="getHandleStyle(output.type)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

// 简单的输入组件（临时实现）
const QaqFloatInput = {
  props: ['value'],
  emits: ['update'],
  template: `
    <input 
      type="number" 
      :value="value" 
      @input="$emit('update', parseFloat($event.target.value))"
      class="qaq-float-input"
      step="0.01"
    />
  `
}

const QaqColorInput = {
  props: ['value'],
  emits: ['update'],
  template: `
    <input 
      type="color" 
      :value="value" 
      @input="$emit('update', $event.target.value)"
      class="qaq-color-input"
    />
  `
}

const QaqTextInput = {
  props: ['value'],
  emits: ['update'],
  template: `
    <input 
      type="text" 
      :value="value" 
      @input="$emit('update', $event.target.value)"
      class="qaq-text-input"
    />
  `
}

// Props
interface MaterialNodeData {
  label: string
  type: string
  icon: string
  inputs: Array<{
    id: string
    name: string
    type: string
    defaultValue?: any
  }>
  outputs: Array<{
    id: string
    name: string
    type: string
  }>
  properties: Record<string, any>
}

const props = defineProps<NodeProps<MaterialNodeData>>()

// 计算属性
const hasInlineProperties = computed(() => {
  // 某些节点类型显示内联属性
  const inlinePropertyTypes = ['constant', 'vector3', 'color']
  return inlinePropertyTypes.includes(props.data.type) && 
         Object.keys(props.data.properties).length > 0
})

// 方法
function getHandleStyle(type: string) {
  const colors = {
    'float': '#4CAF50',      // 绿色
    'vector2': '#2196F3',    // 蓝色
    'vector3': '#FF9800',    // 橙色
    'vector4': '#9C27B0',    // 紫色
    'color': '#E91E63',      // 粉色
    'texture': '#795548'     // 棕色
  }
  
  return {
    backgroundColor: colors[type] || '#666666',
    border: `2px solid ${colors[type] || '#666666'}`
  }
}

function isInputConnected(inputId: string): boolean {
  // TODO: 检查输入是否已连接
  // 这需要访问Vue Flow的边数据
  return false
}

function getInputValue(inputId: string): any {
  const input = props.data.inputs.find(i => i.id === inputId)
  return input?.defaultValue || 0
}

function updateInputValue(inputId: string, value: any) {
  // TODO: 更新输入默认值
  console.log('Update input value:', inputId, value)
}

function getInputComponent(type: string) {
  switch (type) {
    case 'float':
      return QaqFloatInput
    case 'color':
      return QaqColorInput
    case 'texture':
      return QaqTextInput
    default:
      return QaqFloatInput
  }
}

function updateProperty(key: string, value: any) {
  // TODO: 更新节点属性
  console.log('Update property:', key, value)
}

function getPropertyComponent(key: string, value: any) {
  if (typeof value === 'number') {
    return QaqFloatInput
  } else if (typeof value === 'string' && key.includes('color')) {
    return QaqColorInput
  } else {
    return QaqTextInput
  }
}

function formatPropertyName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}
</script>

<style scoped>
.qaq-vueflow-material-node {
  min-width: 180px;
  background-color: var(--qaq-bg-elevated, #3a3a3a);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  font-family: inherit;
}

.qaq-vueflow-material-node:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.qaq-node-selected {
  border-color: var(--qaq-accent, #00DC82) !important;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3) !important;
}

.qaq-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  border-radius: 6px 6px 0 0;
}

.qaq-node-icon {
  width: 16px;
  height: 16px;
  color: var(--qaq-accent, #00DC82);
  flex-shrink: 0;
}

.qaq-node-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  flex: 1;
}

.qaq-node-body {
  padding: 12px 16px;
}

.qaq-node-inputs,
.qaq-node-outputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-node-inputs {
  margin-bottom: 12px;
}

.qaq-input-row,
.qaq-output-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.qaq-input-label,
.qaq-output-label {
  font-size: 0.75rem;
  color: var(--qaq-text-secondary, #cccccc);
  flex: 1;
}

.qaq-output-label {
  text-align: right;
}

.qaq-input-value {
  flex-shrink: 0;
}

.qaq-input-handle,
.qaq-output-handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  position: relative;
  flex-shrink: 0;
}

.qaq-input-handle {
  margin-left: -20px;
}

.qaq-output-handle {
  margin-right: -20px;
}

.qaq-node-properties {
  margin: 12px 0;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qaq-property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.qaq-property-row:last-child {
  margin-bottom: 0;
}

.qaq-property-label {
  font-size: 0.75rem;
  color: var(--qaq-text-secondary, #cccccc);
  min-width: 60px;
  flex-shrink: 0;
}

.qaq-float-input,
.qaq-color-input,
.qaq-text-input {
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--qaq-text-primary, #ffffff);
  font-size: 0.75rem;
  width: 100%;
}

.qaq-float-input {
  width: 60px;
}

.qaq-color-input {
  width: 40px;
  height: 24px;
  padding: 2px;
}

.qaq-float-input:focus,
.qaq-color-input:focus,
.qaq-text-input:focus {
  outline: none;
  border-color: var(--qaq-accent, #00DC82);
}

/* 特定节点类型样式 */
.qaq-node-material-output .qaq-node-header {
  background-color: var(--qaq-accent, #00DC82);
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-node-material-output .qaq-node-icon,
.qaq-node-material-output .qaq-node-title {
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-node-texture-sample .qaq-node-header {
  background-color: #795548;
}

.qaq-node-constant .qaq-node-header {
  background-color: #4CAF50;
}

.qaq-node-add .qaq-node-header,
.qaq-node-multiply .qaq-node-header,
.qaq-node-lerp .qaq-node-header {
  background-color: #2196F3;
}
</style>
