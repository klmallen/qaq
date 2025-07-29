<template>
  <div class="qaq-math-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="qaq-node-header">
      <div class="qaq-node-icon">
        <UIcon :name="getNodeIcon()" />
      </div>
      <span class="qaq-node-title">{{ data.label }}</span>
    </div>
    
    <!-- 输入端口 -->
    <div class="qaq-node-inputs">
      <div 
        v-for="(inputType, index) in data.inputTypes" 
        :key="index"
        class="qaq-input-port"
      >
        <Handle
          :id="`${id}-input-${index}`"
          type="target"
          :position="Position.Left"
          :style="getInputPortStyle(inputType)"
          class="qaq-input-handle"
        />
        <span class="qaq-port-label">{{ getInputLabel(inputType, index) }}</span>
        
        <!-- 内联输入（当没有连接时显示） -->
        <div v-if="!hasConnection(`${id}-input-${index}`)" class="qaq-inline-input">
          <input 
            v-model.number="localInputs[index]" 
            type="number" 
            step="0.01"
            @input="updateInputValue(index)"
            class="qaq-node-input"
            :placeholder="getInputPlaceholder(inputType, index)"
          />
        </div>
      </div>
    </div>
    
    <!-- 节点内容（操作选择） -->
    <div class="qaq-node-content" v-if="showOperationSelector">
      <select 
        v-model="localOperation" 
        @change="updateOperation"
        class="qaq-operation-select"
      >
        <option value="add">Add (+)</option>
        <option value="subtract">Subtract (-)</option>
        <option value="multiply">Multiply (×)</option>
        <option value="divide">Divide (÷)</option>
        <option value="power">Power (^)</option>
        <option value="min">Min</option>
        <option value="max">Max</option>
        <option value="lerp">Lerp</option>
      </select>
    </div>
    
    <!-- 输出端口 -->
    <div class="qaq-node-outputs">
      <span class="qaq-port-label">{{ getOutputLabel() }}</span>
      <Handle
        :id="`${id}-output`"
        type="source"
        :position="Position.Right"
        :style="getOutputPortStyle()"
        class="qaq-output-handle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'

// Props
interface Props {
  id: string
  data: {
    label: string
    operation: string
    inputTypes: string[]
    outputType: string
    inputValues?: number[]
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()

// 响应式状态
const localOperation = ref(props.data.operation || 'add')
const localInputs = ref(props.data.inputValues || [0, 0])

// 计算属性
const isSelected = computed(() => props.selected)

const showOperationSelector = computed(() => {
  return ['add', 'subtract', 'multiply', 'divide', 'power', 'min', 'max'].includes(localOperation.value)
})

// 监听props变化
watch(() => props.data.operation, (newOperation) => {
  if (newOperation) {
    localOperation.value = newOperation
  }
})

watch(() => props.data.inputValues, (newValues) => {
  if (newValues) {
    localInputs.value = [...newValues]
  }
})

// 方法
const updateOperation = () => {
  emit('update', props.id, { operation: localOperation.value })
}

const updateInputValue = (index: number) => {
  const newInputValues = [...localInputs.value]
  newInputValues[index] = localInputs.value[index]
  emit('update', props.id, { inputValues: newInputValues })
}

const hasConnection = (handleId: string) => {
  // 这里应该检查是否有连接到这个handle
  // 暂时返回false，实际实现需要从父组件传递连接信息
  return false
}

const getNodeIcon = () => {
  switch (localOperation.value) {
    case 'add': return 'i-heroicons-plus'
    case 'subtract': return 'i-heroicons-minus'
    case 'multiply': return 'i-heroicons-x-mark'
    case 'divide': return 'i-heroicons-slash'
    case 'power': return 'i-heroicons-arrow-up'
    case 'min': return 'i-heroicons-arrow-down'
    case 'max': return 'i-heroicons-arrow-up'
    case 'lerp': return 'i-heroicons-arrows-right-left'
    default: return 'i-heroicons-calculator'
  }
}

const getInputLabel = (inputType: string, index: number) => {
  if (localOperation.value === 'lerp') {
    return ['A', 'B', 'T'][index] || `Input ${index + 1}`
  }
  return ['A', 'B'][index] || `Input ${index + 1}`
}

const getInputPlaceholder = (inputType: string, index: number) => {
  if (localOperation.value === 'lerp' && index === 2) {
    return '0.5'
  }
  return index === 0 ? '0.0' : '1.0'
}

const getOutputLabel = () => {
  return 'Result'
}

const getInputPortStyle = (inputType: string) => {
  const colors = {
    float: '#4ade80',      // 绿色
    vector3: '#60a5fa',    // 蓝色
    color: '#f472b6',      // 粉色
    texture: '#a78bfa'     // 紫色
  }
  
  return {
    background: colors[inputType as keyof typeof colors] || '#6b7280',
    border: '2px solid #ffffff',
    width: '12px',
    height: '12px'
  }
}

const getOutputPortStyle = () => {
  return getInputPortStyle(props.data.outputType)
}

// 根据操作类型调整输入数量
watch(localOperation, (newOperation) => {
  if (newOperation === 'lerp' && localInputs.value.length < 3) {
    localInputs.value = [0, 1, 0.5]
    emit('update', props.id, { 
      inputTypes: ['float', 'float', 'float'],
      inputValues: localInputs.value 
    })
  } else if (newOperation !== 'lerp' && localInputs.value.length > 2) {
    localInputs.value = [0, 1]
    emit('update', props.id, { 
      inputTypes: ['float', 'float'],
      inputValues: localInputs.value 
    })
  }
})
</script>

<style scoped>
.qaq-math-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.qaq-math-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.qaq-math-node:hover {
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-node-icon {
  color: var(--qaq-primary, #00DC82);
  font-size: 14px;
}

.qaq-node-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-node-inputs {
  padding: 8px 12px;
}

.qaq-input-port {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  position: relative;
}

.qaq-input-handle {
  position: relative !important;
  transform: none !important;
  left: -6px;
}

.qaq-port-label {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  min-width: 20px;
}

.qaq-inline-input {
  flex: 1;
}

.qaq-node-input {
  width: 100%;
  padding: 4px 6px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 10px;
}

.qaq-node-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-node-content {
  padding: 8px 12px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-operation-select {
  width: 100%;
  padding: 6px 8px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 11px;
}

.qaq-operation-select:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-node-outputs {
  position: relative;
  padding: 8px 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-output-handle {
  position: relative !important;
  transform: none !important;
  right: -6px;
}
</style>
