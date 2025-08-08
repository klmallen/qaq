<template>
  <div class="particle-color-ramp-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="node-header">
      <div class="node-icon">
        <UIcon name="i-heroicons-swatch" />
      </div>
      <span class="node-title">{{ data.label || '颜色渐变' }}</span>
    </div>
    
    <!-- 输入端口 -->
    <div class="node-inputs">
      <div class="input-port">
        <Handle
          :id="`${id}-input-factor`"
          type="target"
          :position="Position.Left"
          :style="getInputPortStyle('float')"
          class="input-handle"
        />
        <span class="port-label">Factor</span>
        
        <!-- 默认值输入 -->
        <div v-if="!hasConnection('factor')" class="default-input">
          <input 
            v-model.number="localFactor" 
            type="number"
            step="0.01"
            min="0"
            max="1"
            @input="updateFactor"
            class="number-input"
            placeholder="0.5"
          />
        </div>
      </div>
    </div>
    
    <!-- 节点内容 -->
    <div class="node-content">
      <!-- 颜色渐变预览 -->
      <div class="gradient-preview" :style="getGradientStyle()">
        <div class="gradient-overlay"></div>
        <div class="factor-indicator" :style="getFactorIndicatorStyle()"></div>
      </div>
      
      <!-- 颜色停止点编辑 -->
      <div class="color-stops">
        <div class="stops-header">
          <span>颜色停止点</span>
          <button @click="addColorStop" class="add-stop-btn">
            <UIcon name="i-heroicons-plus" />
          </button>
        </div>
        
        <div class="stops-list">
          <div 
            v-for="(stop, index) in colorStops" 
            :key="index"
            class="color-stop"
          >
            <input 
              v-model.number="stop.position" 
              type="number"
              step="0.01"
              min="0"
              max="1"
              @input="updateColorStops"
              class="position-input"
            />
            <input 
              v-model="stop.color" 
              type="color"
              @input="updateColorStops"
              class="color-input"
            />
            <button 
              v-if="colorStops.length > 2"
              @click="removeColorStop(index)" 
              class="remove-stop-btn"
            >
              <UIcon name="i-heroicons-x-mark" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输出端口 -->
    <div class="node-outputs">
      <Handle
        :id="`${id}-output-color`"
        type="source"
        :position="Position.Right"
        :style="getOutputPortStyle()"
        class="output-handle"
      />
      <span class="port-label">Color</span>
      
      <!-- 输出颜色预览 -->
      <div class="output-preview" :style="{ backgroundColor: getOutputColor() }"></div>
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
    label?: string
    colorStops?: Array<{ position: number, color: string }>
    factor?: number
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()

// 响应式状态
const localFactor = ref(props.data.factor || 0.5)
const colorStops = ref(props.data.colorStops || [
  { position: 0.0, color: '#ff0000' },
  { position: 0.5, color: '#ffff00' },
  { position: 1.0, color: '#000000' }
])

// 计算属性
const isSelected = computed(() => props.selected)

// 监听props变化
watch(() => props.data.factor, (newFactor) => {
  if (newFactor !== undefined) {
    localFactor.value = newFactor
  }
})

watch(() => props.data.colorStops, (newStops) => {
  if (newStops) {
    colorStops.value = [...newStops]
  }
})

// 方法
const hasConnection = (inputId: string) => {
  // 这里应该检查是否有连接，暂时返回false
  return false
}

const getInputPortStyle = (type: string) => {
  const colors = {
    float: '#4ade80',
    color: '#f472b6'
  }
  
  return {
    background: colors[type as keyof typeof colors] || '#6b7280',
    border: '2px solid #ffffff',
    width: '12px',
    height: '12px'
  }
}

const getOutputPortStyle = () => {
  return {
    background: '#f472b6', // 粉色表示颜色类型
    border: '2px solid #ffffff',
    width: '12px',
    height: '12px'
  }
}

const getGradientStyle = () => {
  const sortedStops = [...colorStops.value].sort((a, b) => a.position - b.position)
  const gradientStops = sortedStops.map(stop => 
    `${stop.color} ${stop.position * 100}%`
  ).join(', ')
  
  return {
    background: `linear-gradient(90deg, ${gradientStops})`
  }
}

const getFactorIndicatorStyle = () => {
  return {
    left: `${localFactor.value * 100}%`
  }
}

const getOutputColor = () => {
  const sortedStops = [...colorStops.value].sort((a, b) => a.position - b.position)
  const factor = Math.max(0, Math.min(1, localFactor.value))
  
  // 找到factor所在的区间
  for (let i = 0; i < sortedStops.length - 1; i++) {
    const currentStop = sortedStops[i]
    const nextStop = sortedStops[i + 1]
    
    if (factor >= currentStop.position && factor <= nextStop.position) {
      // 在这个区间内插值
      const t = (factor - currentStop.position) / (nextStop.position - currentStop.position)
      return interpolateColor(currentStop.color, nextStop.color, t)
    }
  }
  
  // 如果超出范围，返回边界颜色
  if (factor <= sortedStops[0].position) {
    return sortedStops[0].color
  } else {
    return sortedStops[sortedStops.length - 1].color
  }
}

const interpolateColor = (color1: string, color2: string, t: number): string => {
  // 简化的颜色插值
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substr(0, 2), 16)
  const g1 = parseInt(hex1.substr(2, 2), 16)
  const b1 = parseInt(hex1.substr(4, 2), 16)
  
  const r2 = parseInt(hex2.substr(0, 2), 16)
  const g2 = parseInt(hex2.substr(2, 2), 16)
  const b2 = parseInt(hex2.substr(4, 2), 16)
  
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  
  return `rgb(${r}, ${g}, ${b})`
}

const updateFactor = () => {
  emit('update', props.id, { factor: localFactor.value })
}

const updateColorStops = () => {
  emit('update', props.id, { colorStops: [...colorStops.value] })
}

const addColorStop = () => {
  const newPosition = colorStops.value.length > 0 
    ? Math.max(...colorStops.value.map(s => s.position)) + 0.1
    : 0.5
  
  colorStops.value.push({
    position: Math.min(1.0, newPosition),
    color: '#ffffff'
  })
  
  updateColorStops()
}

const removeColorStop = (index: number) => {
  if (colorStops.value.length > 2) {
    colorStops.value.splice(index, 1)
    updateColorStops()
  }
}
</script>

<style scoped>
.particle-color-ramp-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.particle-color-ramp-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: #ffffff;
  border-radius: 6px 6px 0 0;
}

.node-icon {
  font-size: 14px;
}

.node-title {
  font-size: 12px;
  font-weight: 600;
}

.node-inputs {
  padding: 8px 12px;
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.input-port {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.input-handle {
  position: relative !important;
  transform: none !important;
  left: -6px;
}

.port-label {
  font-size: 11px;
  color: var(--qaq-editor-text, #ffffff);
  min-width: 40px;
  font-weight: 500;
}

.default-input {
  flex: 1;
  max-width: 60px;
}

.number-input {
  width: 100%;
  padding: 4px 6px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 10px;
}

.node-content {
  padding: 12px;
}

.gradient-preview {
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  position: relative;
  margin-bottom: 12px;
  overflow: hidden;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
}

.factor-indicator {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transform: translateX(-1px);
  transition: left 0.1s ease;
}

.color-stops {
  margin-top: 8px;
}

.stops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stops-header span {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  font-weight: 500;
}

.add-stop-btn {
  background: var(--qaq-primary, #00DC82);
  border: none;
  border-radius: 3px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000000;
  font-size: 10px;
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-stop {
  display: flex;
  align-items: center;
  gap: 6px;
}

.position-input {
  width: 50px;
  padding: 2px 4px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 9px;
}

.color-input {
  width: 24px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  cursor: pointer;
}

.remove-stop-btn {
  background: #ef4444;
  border: none;
  border-radius: 3px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  font-size: 8px;
}

.node-outputs {
  position: relative;
  padding: 8px 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.output-handle {
  position: relative !important;
  transform: none !important;
  right: -6px;
}

.output-preview {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}
</style>
