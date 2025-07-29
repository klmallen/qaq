<template>
  <BaseEdge 
    :path="edgePath" 
    :class="edgeClasses"
    :style="edgeStyle"
  />
  
  <!-- 可选的边标签 -->
  <EdgeLabelRenderer v-if="data?.label">
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }"
      class="qaq-edge-label nodrag nopan"
    >
      {{ data.label }}
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EdgeProps } from '@vue-flow/core'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'

// Props
const props = defineProps<EdgeProps>()

// 计算贝塞尔路径
const pathData = computed(() => getBezierPath(props))

const edgePath = computed(() => pathData.value[0])
const labelX = computed(() => pathData.value[1])
const labelY = computed(() => pathData.value[2])

// 根据连接类型确定边的样式
const connectionType = computed(() => {
  // 可以根据源节点和目标节点的handle类型来确定连接类型
  // 这里简化处理，使用默认类型
  return props.data?.type || 'default'
})

const edgeStyle = computed(() => {
  const baseStyle = {
    strokeWidth: 2,
    stroke: getConnectionColor(connectionType.value),
  }

  // 如果边被选中，添加特殊样式
  if (props.selected) {
    return {
      ...baseStyle,
      strokeWidth: 3,
      stroke: '#00DC82',
      filter: 'drop-shadow(0 0 6px rgba(0, 220, 130, 0.6))'
    }
  }

  // 如果边是动画的
  if (props.animated) {
    return {
      ...baseStyle,
      strokeDasharray: '5,5',
      animation: 'qaq-edge-flow 1s linear infinite'
    }
  }

  return baseStyle
})

const edgeClasses = computed(() => [
  'qaq-material-edge',
  `qaq-edge-${connectionType.value}`,
  {
    'qaq-edge-selected': props.selected,
    'qaq-edge-animated': props.animated
  }
])

// 方法
function getConnectionColor(type: string): string {
  const colors = {
    'float': '#4CAF50',      // 绿色
    'vector2': '#2196F3',    // 蓝色
    'vector3': '#FF9800',    // 橙色
    'vector4': '#9C27B0',    // 紫色
    'color': '#E91E63',      // 粉色
    'texture': '#795548',    // 棕色
    'default': '#00DC82'     // 默认绿色
  }
  
  return colors[type] || colors.default
}
</script>

<style scoped>
.qaq-material-edge {
  transition: all 0.2s ease;
}

.qaq-edge-selected {
  filter: drop-shadow(0 0 6px rgba(0, 220, 130, 0.6));
}

.qaq-edge-label {
  background-color: var(--qaq-bg-elevated, #3a3a3a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  color: var(--qaq-text-primary, #ffffff);
  white-space: nowrap;
}

/* 动画关键帧 */
@keyframes qaq-edge-flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 10;
  }
}
</style>
