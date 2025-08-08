<template>
  <div class="particle-output-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="node-header">
      <div class="node-icon">
        <UIcon name="i-heroicons-sparkles" />
      </div>
      <span class="node-title">{{ data.label || '粒子输出' }}</span>
    </div>
    
    <!-- 输入端口 -->
    <div class="node-inputs">
      <div 
        v-for="input in particleInputs" 
        :key="input.id"
        class="input-port"
      >
        <Handle
          :id="`${id}-input-${input.id}`"
          type="target"
          :position="Position.Left"
          :style="getInputPortStyle(input.type)"
          class="input-handle"
        />
        <span class="port-label">{{ input.label }}</span>
        
        <!-- 预览颜色 -->
        <div 
          v-if="input.type === 'color' && input.previewColor" 
          class="color-preview"
          :style="{ backgroundColor: input.previewColor }"
        ></div>
        
        <!-- 默认值输入 -->
        <div v-if="!hasConnection(`${id}-input-${input.id}`)" class="default-input">
          <!-- 颜色输入 -->
          <input 
            v-if="input.type === 'color'"
            v-model="input.defaultValue" 
            type="color"
            @input="updateDefaultValue(input.id, $event)"
            class="color-input"
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
            class="number-input"
            :placeholder="input.placeholder"
          />
        </div>
      </div>
    </div>
    
    <!-- 粒子预览 -->
    <div class="particle-preview">
      <div class="preview-container">
        <div class="preview-particle" :style="getParticlePreviewStyle()">
          <div class="particle-glow" :style="getGlowStyle()"></div>
        </div>
        <div class="preview-label">Particle Preview</div>
      </div>
      
      <!-- 预览控制 -->
      <div class="preview-controls">
        <button @click="toggleAnimation" class="control-btn">
          <UIcon :name="isAnimating ? 'i-heroicons-pause' : 'i-heroicons-play'" />
        </button>
        <button @click="resetPreview" class="control-btn">
          <UIcon name="i-heroicons-arrow-path" />
        </button>
      </div>
    </div>
    
    <!-- 输出信息 -->
    <div class="node-footer">
      <div class="output-info">
        <UIcon name="i-heroicons-sparkles" />
        <span>Final Particle Output</span>
      </div>
      
      <!-- GLSL代码预览 -->
      <div class="glsl-preview" v-if="showGLSL">
        <div class="glsl-header">
          <span>Generated GLSL</span>
          <button @click="showGLSL = false" class="close-btn">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>
        <pre class="glsl-code">{{ generatedGLSL }}</pre>
      </div>
      
      <button @click="showGLSL = !showGLSL" class="glsl-toggle-btn">
        <UIcon name="i-heroicons-code-bracket" />
        <span>{{ showGLSL ? '隐藏' : '显示' }} GLSL</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'

// Props
interface Props {
  id: string
  data: {
    label?: string
    particleProperties?: {
      baseColor?: string
      emissive?: string
      alpha?: number
      size?: number
    }
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
  'compile-glsl': [nodeId: string]
}>()

// 响应式状态
const particleInputs = ref([
  {
    id: 'baseColor',
    label: 'Base Color',
    type: 'color',
    defaultValue: '#ffffff',
    previewColor: '#ffffff',
    placeholder: 'Base Color'
  },
  {
    id: 'emissive',
    label: 'Emissive',
    type: 'color',
    defaultValue: '#000000',
    previewColor: '#000000',
    placeholder: 'Emissive Color'
  },
  {
    id: 'alpha',
    label: 'Alpha',
    type: 'float',
    defaultValue: 1.0,
    placeholder: '1.0'
  },
  {
    id: 'size',
    label: 'Size',
    type: 'float',
    defaultValue: 1.0,
    placeholder: '1.0'
  }
])

const isAnimating = ref(false)
const animationTime = ref(0)
const animationId = ref<number | null>(null)
const showGLSL = ref(false)

// 计算属性
const isSelected = computed(() => props.selected)

const currentParticle = computed(() => {
  const particle: any = {}
  particleInputs.value.forEach(input => {
    particle[input.id] = input.defaultValue
  })
  return particle
})

const generatedGLSL = computed(() => {
  // 简化的GLSL代码生成
  const baseColor = particleInputs.value.find(i => i.id === 'baseColor')?.defaultValue || '#ffffff'
  const emissive = particleInputs.value.find(i => i.id === 'emissive')?.defaultValue || '#000000'
  const alpha = particleInputs.value.find(i => i.id === 'alpha')?.defaultValue || 1.0
  
  return `// Generated Particle Fragment Shader
void main() {
  vec4 baseColor = vec4(${hexToRgb(baseColor).join(', ')}, ${alpha});
  vec4 emissive = vec4(${hexToRgb(emissive).join(', ')}, 1.0);
  
  // Apply particle age fade
  float ageFactor = 1.0 - (vParticleAge / vParticleLifetime);
  
  // Final color
  vec4 finalColor = baseColor + emissive;
  finalColor.a *= ageFactor;
  
  gl_FragColor = finalColor;
  
  if (gl_FragColor.a < 0.001) discard;
}`
})

// 方法
const hasConnection = (handleId: string) => {
  // 这里应该检查是否有连接，暂时返回false
  return false
}

const updateDefaultValue = (inputId: string, event: any) => {
  const input = particleInputs.value.find(i => i.id === inputId)
  if (input) {
    input.defaultValue = event.target.value
    if (input.type === 'color') {
      input.previewColor = event.target.value
    }
    
    // 发射更新事件
    emit('update', props.id, { 
      particleProperties: currentParticle.value 
    })
  }
}

const getInputPortStyle = (inputType: string) => {
  const colors = {
    float: '#4ade80',      // 绿色
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

const getParticlePreviewStyle = () => {
  const particle = currentParticle.value
  const baseColor = particle.baseColor || '#ffffff'
  const emissive = particle.emissive || '#000000'
  const alpha = particle.alpha || 1.0
  const size = (particle.size || 1.0) * 40 // 基础大小40px
  
  // 动画效果
  const animationScale = isAnimating.value 
    ? 1.0 + Math.sin(animationTime.value * 0.05) * 0.2 
    : 1.0
  
  return {
    width: `${size * animationScale}px`,
    height: `${size * animationScale}px`,
    background: `radial-gradient(circle, ${baseColor}, ${emissive})`,
    opacity: alpha,
    transform: `scale(${animationScale})`
  }
}

const getGlowStyle = () => {
  const emissive = currentParticle.value.emissive || '#000000'
  const glowIntensity = isAnimating.value 
    ? 0.5 + Math.sin(animationTime.value * 0.03) * 0.3 
    : 0.3
  
  return {
    boxShadow: `0 0 20px ${emissive}, 0 0 40px ${emissive}`,
    opacity: glowIntensity
  }
}

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value
  
  if (isAnimating.value) {
    startAnimation()
  } else {
    stopAnimation()
  }
}

const startAnimation = () => {
  const animate = () => {
    animationTime.value += 1
    animationId.value = requestAnimationFrame(animate)
  }
  animate()
}

const stopAnimation = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

const resetPreview = () => {
  animationTime.value = 0
  // 重置所有输入到默认值
  particleInputs.value.forEach(input => {
    switch (input.id) {
      case 'baseColor':
        input.defaultValue = '#ffffff'
        input.previewColor = '#ffffff'
        break
      case 'emissive':
        input.defaultValue = '#000000'
        input.previewColor = '#000000'
        break
      case 'alpha':
        input.defaultValue = 1.0
        break
      case 'size':
        input.defaultValue = 1.0
        break
    }
  })
  
  emit('update', props.id, { 
    particleProperties: currentParticle.value 
  })
}

const hexToRgb = (hex: string): number[] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [1, 1, 1]
}

// 初始化材质属性
watch(() => props.data.particleProperties, (newProps) => {
  if (newProps) {
    particleInputs.value.forEach(input => {
      if (newProps[input.id as keyof typeof newProps] !== undefined) {
        input.defaultValue = newProps[input.id as keyof typeof newProps]
        if (input.type === 'color') {
          input.previewColor = input.defaultValue
        }
      }
    })
  }
}, { immediate: true })

// 生命周期
onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
.particle-output-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-primary, #00DC82);
  border-radius: 8px;
  min-width: 240px;
  box-shadow: 0 2px 12px rgba(0, 220, 130, 0.2);
  transition: all 0.2s ease;
}

.particle-output-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.4);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, var(--qaq-primary, #00DC82), #00b86f);
  color: #000000;
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
  padding: 12px;
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.input-port {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
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
  min-width: 60px;
  font-weight: 500;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.default-input {
  flex: 1;
  max-width: 80px;
}

.color-input {
  width: 40px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  cursor: pointer;
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

.particle-preview {
  padding: 16px;
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.preview-container {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%);
  border-radius: 8px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  overflow: hidden;
}

.preview-particle {
  border-radius: 50%;
  transition: all 0.1s ease;
  position: relative;
}

.particle-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  pointer-events: none;
}

.preview-label {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.preview-controls {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: center;
}

.control-btn {
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 10px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  border-color: var(--qaq-primary, #00DC82);
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.node-footer {
  padding: 8px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 0 0 6px 6px;
}

.output-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--qaq-primary, #00DC82);
  margin-bottom: 8px;
}

.glsl-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 9px;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.glsl-toggle-btn:hover {
  border-color: var(--qaq-primary, #00DC82);
}

.glsl-preview {
  margin-top: 8px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 4px;
  overflow: hidden;
}

.glsl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.glsl-header span {
  font-size: 9px;
  color: var(--qaq-primary, #00DC82);
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  cursor: pointer;
  font-size: 10px;
}

.glsl-code {
  padding: 8px;
  font-size: 8px;
  font-family: 'Courier New', monospace;
  color: var(--qaq-editor-text, #ffffff);
  background: transparent;
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.2;
  max-height: 120px;
  overflow-y: auto;
}
</style>
