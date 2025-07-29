<template>
  <div class="qaq-material-node-properties">
    <!-- 面板标题 -->
    <div class="qaq-properties-header">
      <h3>Node Properties</h3>
      <span v-if="selectedNode" class="qaq-node-type">{{ selectedNode.data.label }}</span>
    </div>

    <!-- 无选中节点状态 -->
    <div v-if="!selectedNode" class="qaq-empty-state">
      <UIcon name="i-heroicons-cursor-arrow-rays" class="qaq-empty-icon" />
      <h4>No Node Selected</h4>
      <p>Select a node to view and edit its properties</p>
    </div>

    <!-- 节点属性编辑 -->
    <div v-else class="qaq-properties-content">
      <!-- 基本信息 -->
      <div class="qaq-property-section">
        <h4>Basic Information</h4>
        
        <div class="qaq-property-group">
          <label>Node ID</label>
          <UInput
            :value="selectedNode.id"
            readonly
            class="qaq-readonly-input"
          />
        </div>

        <div class="qaq-property-group">
          <label>Node Type</label>
          <UInput
            :value="selectedNode.data.type"
            readonly
            class="qaq-readonly-input"
          />
        </div>

        <div class="qaq-property-group">
          <label>Position</label>
          <div class="qaq-position-inputs">
            <UInput
              :value="selectedNode.position.x.toFixed(0)"
              type="number"
              @input="updatePosition('x', $event)"
              placeholder="X"
            />
            <UInput
              :value="selectedNode.position.y.toFixed(0)"
              type="number"
              @input="updatePosition('y', $event)"
              placeholder="Y"
            />
          </div>
        </div>
      </div>

      <!-- 节点特定属性 -->
      <div v-if="hasCustomProperties" class="qaq-property-section">
        <h4>Node Settings</h4>
        
        <div
          v-for="(value, key) in selectedNode.data.properties"
          :key="key"
          class="qaq-property-group"
        >
          <label>{{ formatPropertyName(key) }}</label>
          <component
            :is="getPropertyComponent(key, value)"
            :value="value"
            @update="updateProperty(key, $event)"
            :options="getPropertyOptions(key)"
          />
        </div>
      </div>

      <!-- 输入端口 -->
      <div v-if="selectedNode.data.inputs.length > 0" class="qaq-property-section">
        <h4>Input Ports</h4>
        
        <div
          v-for="input in selectedNode.data.inputs"
          :key="input.id"
          class="qaq-port-item"
        >
          <div class="qaq-port-header">
            <div 
              class="qaq-port-indicator"
              :style="{ backgroundColor: getPortColor(input.type) }"
            ></div>
            <span class="qaq-port-name">{{ input.name }}</span>
            <span class="qaq-port-type">{{ input.type }}</span>
          </div>
          
          <div v-if="input.defaultValue !== undefined" class="qaq-port-default">
            <label>Default Value</label>
            <component
              :is="getInputComponent(input.type)"
              :value="input.defaultValue"
              @update="updateInputDefault(input.id, $event)"
            />
          </div>
        </div>
      </div>

      <!-- 输出端口 -->
      <div v-if="selectedNode.data.outputs.length > 0" class="qaq-property-section">
        <h4>Output Ports</h4>
        
        <div
          v-for="output in selectedNode.data.outputs"
          :key="output.id"
          class="qaq-port-item"
        >
          <div class="qaq-port-header">
            <div 
              class="qaq-port-indicator"
              :style="{ backgroundColor: getPortColor(output.type) }"
            ></div>
            <span class="qaq-port-name">{{ output.name }}</span>
            <span class="qaq-port-type">{{ output.type }}</span>
          </div>
        </div>
      </div>

      <!-- 节点操作 -->
      <div class="qaq-property-section">
        <h4>Actions</h4>
        
        <div class="qaq-action-buttons">
          <UButton
            icon="i-heroicons-document-duplicate"
            variant="ghost"
            size="sm"
            @click="duplicateNode"
          >
            Duplicate
          </UButton>
          
          <UButton
            icon="i-heroicons-trash"
            variant="ghost"
            size="sm"
            color="red"
            @click="deleteNode"
          >
            Delete
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Node } from '@vue-flow/core'

// 简单的属性编辑组件
const QaqFloatProperty = {
  props: ['value'],
  emits: ['update'],
  template: `
    <UInput
      type="number"
      :value="value"
      @input="$emit('update', parseFloat($event.target.value))"
      step="0.01"
    />
  `
}

const QaqColorProperty = {
  props: ['value'],
  emits: ['update'],
  template: `
    <div class="qaq-color-property">
      <input
        type="color"
        :value="value"
        @input="$emit('update', $event.target.value)"
        class="qaq-color-picker"
      />
      <UInput
        type="text"
        :value="value"
        @input="$emit('update', $event.target.value)"
        class="qaq-color-text"
      />
    </div>
  `
}

const QaqSelectProperty = {
  props: ['value', 'options'],
  emits: ['update'],
  template: `
    <USelectMenu
      :value="value"
      :options="options"
      @change="$emit('update', $event)"
    />
  `
}

const QaqTextProperty = {
  props: ['value'],
  emits: ['update'],
  template: `
    <UInput
      type="text"
      :value="value"
      @input="$emit('update', $event.target.value)"
    />
  `
}

// Props
interface Props {
  selectedNode: Node | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-node': [nodeId: string, properties: Record<string, any>]
}>()

// 计算属性
const hasCustomProperties = computed(() => {
  return props.selectedNode && 
         Object.keys(props.selectedNode.data.properties).length > 0
})

// 方法
function formatPropertyName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

function getPropertyComponent(key: string, value: any) {
  if (typeof value === 'number') {
    return QaqFloatProperty
  } else if (typeof value === 'string' && key.toLowerCase().includes('color')) {
    return QaqColorProperty
  } else if (key.toLowerCase().includes('mode') || key.toLowerCase().includes('type')) {
    return QaqSelectProperty
  } else {
    return QaqTextProperty
  }
}

function getPropertyOptions(key: string): any[] {
  const optionsMap: Record<string, any[]> = {
    'filterMode': [
      { label: 'Linear', value: 'linear' },
      { label: 'Nearest', value: 'nearest' }
    ],
    'wrapMode': [
      { label: 'Repeat', value: 'repeat' },
      { label: 'Clamp', value: 'clamp' },
      { label: 'Mirror', value: 'mirror' }
    ]
  }
  
  return optionsMap[key] || []
}

function getInputComponent(type: string) {
  switch (type) {
    case 'float':
      return QaqFloatProperty
    case 'color':
      return QaqColorProperty
    default:
      return QaqTextProperty
  }
}

function getPortColor(type: string): string {
  const colors = {
    'float': '#4CAF50',      // 绿色
    'vector2': '#2196F3',    // 蓝色
    'vector3': '#FF9800',    // 橙色
    'vector4': '#9C27B0',    // 紫色
    'color': '#E91E63',      // 粉色
    'texture': '#795548'     // 棕色
  }
  
  return colors[type] || '#666666'
}

function updatePosition(axis: 'x' | 'y', value: string) {
  if (!props.selectedNode) return
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return
  
  const newPosition = { ...props.selectedNode.position }
  newPosition[axis] = numValue
  
  // 直接更新节点位置
  props.selectedNode.position = newPosition
  
  console.log('📍 Updated node position:', props.selectedNode.id, newPosition)
}

function updateProperty(key: string, value: any) {
  if (!props.selectedNode) return
  
  const newProperties = { ...props.selectedNode.data.properties }
  newProperties[key] = value
  
  emit('update-node', props.selectedNode.id, newProperties)
  
  console.log('⚙️ Updated node property:', key, value)
}

function updateInputDefault(inputId: string, value: any) {
  if (!props.selectedNode) return
  
  const input = props.selectedNode.data.inputs.find(i => i.id === inputId)
  if (input) {
    input.defaultValue = value
    console.log('🔌 Updated input default:', inputId, value)
  }
}

function duplicateNode() {
  if (!props.selectedNode) return
  
  console.log('📋 Duplicate node:', props.selectedNode.id)
  // TODO: 实现节点复制逻辑
}

function deleteNode() {
  if (!props.selectedNode) return
  
  console.log('🗑️ Delete node:', props.selectedNode.id)
  // TODO: 实现节点删除逻辑
}
</script>

<style scoped>
.qaq-material-node-properties {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.qaq-properties-header {
  margin-bottom: 20px;
}

.qaq-properties-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0 0 4px 0;
}

.qaq-node-type {
  font-size: 0.875rem;
  color: var(--qaq-accent, #00DC82);
  font-weight: 500;
}

.qaq-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.qaq-empty-state h4 {
  font-size: 1.125rem;
  margin: 0 0 8px 0;
}

.qaq-empty-state p {
  margin: 0;
  opacity: 0.7;
}

.qaq-properties-content {
  flex: 1;
}

.qaq-property-section {
  margin-bottom: 24px;
}

.qaq-property-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-property-group {
  margin-bottom: 16px;
}

.qaq-property-group label {
  display: block;
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
  margin-bottom: 6px;
}

.qaq-readonly-input {
  opacity: 0.6;
}

.qaq-position-inputs {
  display: flex;
  gap: 8px;
}

.qaq-position-inputs input {
  flex: 1;
}

.qaq-port-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
}

.qaq-port-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.qaq-port-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.qaq-port-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--qaq-text-primary, #ffffff);
  flex: 1;
}

.qaq-port-type {
  font-size: 0.75rem;
  color: var(--qaq-text-muted, #888888);
  background-color: var(--qaq-bg-elevated, #3a3a3a);
  padding: 2px 6px;
  border-radius: 3px;
}

.qaq-port-default {
  margin-top: 8px;
}

.qaq-port-default label {
  font-size: 0.75rem;
  color: var(--qaq-text-muted, #888888);
  margin-bottom: 4px;
}

.qaq-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-color-property {
  display: flex;
  gap: 8px;
  align-items: center;
}

.qaq-color-picker {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.qaq-color-text {
  flex: 1;
}
</style>
