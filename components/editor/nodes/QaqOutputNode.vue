<template>
  <div class="qaq-output-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="qaq-node-header">
      <div class="qaq-node-icon">
        <UIcon name="i-heroicons-arrow-right-circle" />
      </div>
      <span class="qaq-node-title">{{ data.label }}</span>
    </div>
    
    <!-- 输入端口 -->
    <div class="qaq-node-inputs">
      <div 
        v-for="(input, index) in materialInputs" 
        :key="index"
        class="qaq-input-port"
      >
        <Handle
          :id="`${id}-input-${input.id}`"
          type="target"
          :position="Position.Left"
          :style="getInputPortStyle(input.type)"
          class="qaq-input-handle"
        />
        <span class="qaq-port-label">{{ input.label }}</span>
        
        <!-- 预览颜色（如果有连接的颜色值） -->
        <div 
          v-if="input.type === 'color' && input.previewColor" 
          class="qaq-color-preview"
          :style="{ backgroundColor: input.previewColor }"
        ></div>
        
        <!-- 默认值输入（当没有连接时） -->
        <div v-if="!hasConnection(`${id}-input-${input.id}`)" class="qaq-default-input">
          <!-- 颜色输入 -->
          <input 
            v-if="input.type === 'color'"
            v-model="input.defaultValue" 
            type="color"
            @input="updateDefaultValue(input.id, $event)"
            class="qaq-color-input"
          />
          <!-- 数值输入 -->
          <input 
            v-else-if="input.type === 'float'"
            v-model.number="input.defaultValue" 
            type="number"
            step="0.01"
            min="0"
            max="1"
            @input="updateDefaultValue(input.id, $event)"
            class="qaq-number-input"
            :placeholder="input.placeholder"
          />
        </div>
      </div>
    </div>
    
    <!-- 材质预览 -->
    <div class="qaq-material-preview">
      <div class="qaq-preview-sphere" :style="getPreviewStyle()">
        <div class="qaq-preview-label">Material Preview</div>
      </div>
    </div>
    
    <!-- 输出信息 -->
    <div class="qaq-node-footer">
      <div class="qaq-output-info">
        <UIcon name="i-heroicons-cube" />
        <span>Material Output</span>
      </div>
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
    inputTypes: string[]
    materialProperties?: {
      albedo?: string
      metallic?: number
      roughness?: number
      normal?: string
      emission?: string
      alpha?: number
    }
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()

// 响应式状态
const materialInputs = ref([
  {
    id: 'albedo',
    label: 'Albedo',
    type: 'color',
    defaultValue: '#ffffff',
    previewColor: '#ffffff',
    placeholder: 'Base Color'
  },
  {
    id: 'metallic',
    label: 'Metallic',
    type: 'float',
    defaultValue: 0.0,
    placeholder: '0.0'
  },
  {
    id: 'roughness',
    label: 'Roughness',
    type: 'float',
    defaultValue: 0.5,
    placeholder: '0.5'
  },
  {
    id: 'normal',
    label: 'Normal',
    type: 'vector3',
    defaultValue: null,
    placeholder: 'Normal Map'
  },
  {
    id: 'emission',
    label: 'Emission',
    type: 'color',
    defaultValue: '#000000',
    previewColor: '#000000',
    placeholder: 'Emission Color'
  },
  {
    id: 'alpha',
    label: 'Alpha',
    type: 'float',
    defaultValue: 1.0,
    placeholder: '1.0'
  }
])

// 计算属性
const isSelected = computed(() => props.selected)

const currentMaterial = computed(() => {
  const material: any = {}
  materialInputs.value.forEach(input => {
    material[input.id] = input.defaultValue
  })
  return material
})

// 方法
const updateDefaultValue = (inputId: string, event: any) => {
  const input = materialInputs.value.find(i => i.id === inputId)
  if (input) {
    input.defaultValue = event.target.value
    if (input.type === 'color') {
      input.previewColor = event.target.value
    }
    
    // 发射更新事件
    emit('update', props.id, { 
      materialProperties: currentMaterial.value 
    })
  }
}

const hasConnection = (handleId: string) => {
  // 这里应该检查是否有连接到这个handle
  // 暂时返回false，实际实现需要从父组件传递连接信息
  return false
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

const getPreviewStyle = () => {
  const material = currentMaterial.value
  return {
    background: `linear-gradient(135deg, ${material.albedo || '#ffffff'}, ${material.emission || '#000000'})`,
    opacity: material.alpha || 1,
    filter: `brightness(${1 - (material.roughness || 0) * 0.3}) contrast(${1 + (material.metallic || 0) * 0.5})`
  }
}

// 初始化材质属性
watch(() => props.data.materialProperties, (newProps) => {
  if (newProps) {
    materialInputs.value.forEach(input => {
      if (newProps[input.id as keyof typeof newProps] !== undefined) {
        input.defaultValue = newProps[input.id as keyof typeof newProps]
        if (input.type === 'color') {
          input.previewColor = input.defaultValue
        }
      }
    })
  }
}, { immediate: true })
</script>

<style scoped>
.qaq-output-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-primary, #00DC82);
  border-radius: 8px;
  min-width: 220px;
  box-shadow: 0 2px 12px rgba(0, 220, 130, 0.2);
  transition: all 0.2s ease;
}

.qaq-output-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.4);
}

.qaq-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, var(--qaq-primary, #00DC82), #00b86f);
  color: #000000;
  border-radius: 6px 6px 0 0;
}

.qaq-node-icon {
  font-size: 14px;
}

.qaq-node-title {
  font-size: 12px;
  font-weight: 600;
}

.qaq-node-inputs {
  padding: 12px;
}

.qaq-input-port {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  position: relative;
}

.qaq-input-handle {
  position: relative !important;
  transform: none !important;
  left: -6px;
}

.qaq-port-label {
  font-size: 11px;
  color: var(--qaq-editor-text, #ffffff);
  min-width: 60px;
  font-weight: 500;
}

.qaq-color-preview {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-default-input {
  flex: 1;
  max-width: 80px;
}

.qaq-color-input {
  width: 40px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  cursor: pointer;
}

.qaq-number-input {
  width: 100%;
  padding: 4px 6px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 10px;
}

.qaq-number-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-material-preview {
  padding: 12px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-preview-sphere {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  position: relative;
  overflow: hidden;
}

.qaq-preview-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.qaq-node-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 0 0 6px 6px;
}

.qaq-output-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--qaq-primary, #00DC82);
}
</style>
