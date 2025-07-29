<template>
  <div class="qaq-input-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="qaq-node-header">
      <div class="qaq-node-icon">
        <UIcon :name="getNodeIcon()" />
      </div>
      <span class="qaq-node-title">{{ data.label }}</span>
    </div>
    
    <!-- 节点内容 -->
    <div class="qaq-node-content">
      <!-- Float 输入 -->
      <div v-if="data.outputType === 'float'" class="qaq-node-input-group">
        <input 
          v-model.number="localValue" 
          type="number" 
          step="0.01"
          @input="updateValue"
          class="qaq-node-input"
          placeholder="0.0"
        />
      </div>
      
      <!-- Vector3 输入 -->
      <div v-else-if="data.outputType === 'vector3'" class="qaq-node-input-group">
        <div class="qaq-vector-inputs">
          <input 
            v-model.number="localVector.x" 
            type="number" 
            step="0.01"
            @input="updateVector"
            class="qaq-node-input qaq-vector-input"
            placeholder="X"
          />
          <input 
            v-model.number="localVector.y" 
            type="number" 
            step="0.01"
            @input="updateVector"
            class="qaq-node-input qaq-vector-input"
            placeholder="Y"
          />
          <input 
            v-model.number="localVector.z" 
            type="number" 
            step="0.01"
            @input="updateVector"
            class="qaq-node-input qaq-vector-input"
            placeholder="Z"
          />
        </div>
      </div>
      
      <!-- Color 输入 -->
      <div v-else-if="data.outputType === 'color'" class="qaq-node-input-group">
        <div class="qaq-color-input-wrapper">
          <input 
            v-model="localColor" 
            type="color"
            @input="updateColor"
            class="qaq-color-input"
          />
          <span class="qaq-color-value">{{ localColor }}</span>
        </div>
      </div>
      
      <!-- Texture 输入 -->
      <div v-else-if="data.outputType === 'texture'" class="qaq-node-input-group">
        <div class="qaq-texture-input">
          <button class="qaq-texture-button" @click="selectTexture">
            {{ data.textureName || '选择纹理' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 输出端口 -->
    <div class="qaq-node-outputs">
      <Handle
        :id="`${id}-output`"
        type="source"
        :position="Position.Right"
        :style="getOutputPortStyle()"
        class="qaq-output-handle"
      />
      <span class="qaq-port-label">{{ getOutputLabel() }}</span>
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
    outputType: string
    value?: number
    color?: string
    vector?: { x: number, y: number, z: number }
    textureName?: string
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()

// 响应式状态
const localValue = ref(props.data.value || 0)
const localColor = ref(props.data.color || '#ffffff')
const localVector = ref(props.data.vector || { x: 0, y: 0, z: 0 })

// 计算属性
const isSelected = computed(() => props.selected)

// 监听props变化
watch(() => props.data.value, (newValue) => {
  if (newValue !== undefined) {
    localValue.value = newValue
  }
})

watch(() => props.data.color, (newColor) => {
  if (newColor) {
    localColor.value = newColor
  }
})

watch(() => props.data.vector, (newVector) => {
  if (newVector) {
    localVector.value = { ...newVector }
  }
})

// 方法
const updateValue = () => {
  emit('update', props.id, { value: localValue.value })
}

const updateColor = () => {
  emit('update', props.id, { color: localColor.value })
}

const updateVector = () => {
  emit('update', props.id, { vector: { ...localVector.value } })
}

const selectTexture = () => {
  // 这里可以打开文件选择器或纹理库
  console.log('Select texture for node:', props.id)
  // 临时模拟选择纹理
  emit('update', props.id, { textureName: 'texture_' + Date.now() })
}

const getNodeIcon = () => {
  switch (props.data.outputType) {
    case 'float': return 'i-heroicons-hashtag'
    case 'vector3': return 'i-heroicons-cube'
    case 'color': return 'i-heroicons-swatch'
    case 'texture': return 'i-heroicons-photo'
    default: return 'i-heroicons-circle-stack'
  }
}

const getOutputLabel = () => {
  switch (props.data.outputType) {
    case 'float': return 'Float'
    case 'vector3': return 'Vector3'
    case 'color': return 'Color'
    case 'texture': return 'Texture'
    default: return 'Output'
  }
}

const getOutputPortStyle = () => {
  const colors = {
    float: '#4ade80',      // 绿色
    vector3: '#60a5fa',    // 蓝色
    color: '#f472b6',      // 粉色
    texture: '#a78bfa'     // 紫色
  }
  
  return {
    background: colors[props.data.outputType as keyof typeof colors] || '#6b7280',
    border: '2px solid #ffffff',
    width: '12px',
    height: '12px'
  }
}
</script>

<style scoped>
.qaq-input-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.qaq-input-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.qaq-input-node:hover {
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

.qaq-node-content {
  padding: 12px;
}

.qaq-node-input-group {
  margin-bottom: 8px;
}

.qaq-node-input {
  width: 100%;
  padding: 6px 8px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 11px;
}

.qaq-node-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-vector-inputs {
  display: flex;
  gap: 4px;
}

.qaq-vector-input {
  flex: 1;
  text-align: center;
}

.qaq-color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-color-input {
  width: 40px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  cursor: pointer;
}

.qaq-color-value {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  font-family: monospace;
}

.qaq-texture-button {
  width: 100%;
  padding: 8px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  color: var(--qaq-editor-text, #ffffff);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.qaq-texture-button:hover {
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-node-outputs {
  position: relative;
  padding: 8px 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.qaq-output-handle {
  position: relative !important;
  transform: none !important;
  right: -6px;
}

.qaq-port-label {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}
</style>
