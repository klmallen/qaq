<template>
  <div class="particle-age-node" :class="{ 'selected': isSelected }">
    <!-- 节点头部 -->
    <div class="node-header">
      <div class="node-icon">
        <UIcon name="i-heroicons-clock" />
      </div>
      <span class="node-title">{{ data.label || '粒子年龄' }}</span>
    </div>
    
    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-description">
        获取粒子的当前年龄（0.0 到 1.0）
      </div>
      
      <!-- 年龄可视化 -->
      <div class="age-visualization">
        <div class="age-bar">
          <div 
            class="age-progress" 
            :style="{ width: (previewAge * 100) + '%' }"
          ></div>
        </div>
        <span class="age-value">{{ previewAge.toFixed(2) }}</span>
      </div>
    </div>
    
    <!-- 输出端口 -->
    <div class="node-outputs">
      <Handle
        :id="`${id}-output-age`"
        type="source"
        :position="Position.Right"
        :style="getOutputPortStyle()"
        class="output-handle"
      />
      <span class="port-label">Age</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'

// Props
interface Props {
  id: string
  data: {
    label?: string
    previewMode?: boolean
  }
  selected?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()

// 响应式状态
const previewAge = ref(0.0)
const animationId = ref<number | null>(null)

// 计算属性
const isSelected = computed(() => props.selected)

// 方法
const getOutputPortStyle = () => {
  return {
    background: '#4ade80', // 绿色表示float类型
    border: '2px solid #ffffff',
    width: '12px',
    height: '12px'
  }
}

// 预览动画
const startPreviewAnimation = () => {
  if (!props.data.previewMode) return
  
  const animate = () => {
    previewAge.value = (previewAge.value + 0.01) % 1.0
    animationId.value = requestAnimationFrame(animate)
  }
  
  animate()
}

const stopPreviewAnimation = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

// 生命周期
onMounted(() => {
  if (props.data.previewMode) {
    startPreviewAnimation()
  }
})

onUnmounted(() => {
  stopPreviewAnimation()
})
</script>

<style scoped>
.particle-age-node {
  background: var(--qaq-editor-panel, #383838);
  border: 2px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  min-width: 160px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.particle-age-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.particle-age-node:hover {
  border-color: var(--qaq-primary, #00DC82);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
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

.node-content {
  padding: 12px;
}

.node-description {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  margin-bottom: 8px;
  line-height: 1.3;
}

.age-visualization {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.age-bar {
  flex: 1;
  height: 6px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.age-progress {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #fbbf24, #ef4444);
  transition: width 0.1s ease;
}

.age-value {
  font-size: 10px;
  color: var(--qaq-editor-text, #ffffff);
  font-family: monospace;
  min-width: 30px;
  text-align: right;
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

.port-label {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  font-weight: 500;
}
</style>
