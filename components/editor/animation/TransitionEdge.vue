<template>
  <g>
    <!-- 主要路径 -->
    <path
      :d="edgePath"
      :stroke="edgeColor"
      :stroke-width="strokeWidth"
      fill="none"
      :marker-end="markerEnd"
      :class="{
        'qaq-edge-selected': selected,
        'qaq-edge-active': isActive
      }"
    />
    
    <!-- 活动状态的流动效果 -->
    <path
      v-if="isActive"
      :d="edgePath"
      stroke="var(--qaq-primary, #00DC82)"
      stroke-width="3"
      fill="none"
      stroke-dasharray="8 4"
      class="qaq-edge-flow"
    />
    
    <!-- 条件标签 -->
    <foreignObject
      v-if="hasConditions"
      :x="labelX - 30"
      :y="labelY - 10"
      width="60"
      height="20"
    >
      <div class="qaq-edge-label">
        <div class="qaq-condition-count">
          {{ conditionCount }}
        </div>
      </div>
    </foreignObject>
    
    <!-- 持续时间标签 -->
    <foreignObject
      v-if="data.duration && data.duration > 0"
      :x="durationX - 20"
      :y="durationY - 8"
      width="40"
      height="16"
    >
      <div class="qaq-duration-label">
        {{ data.duration }}s
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getBezierPath } from '@vue-flow/core'

interface Props {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: string
  targetPosition: string
  data?: {
    duration?: number
    curve?: string
    conditions?: Array<{
      parameter: string
      operator: string
      value: any
    }>
    isEntryConnection?: boolean
  }
  selected?: boolean
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  isActive: false
})

// 计算贝塞尔路径
const edgePath = computed(() => {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition as any,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition as any
  })
  return path
})

// 计算边的颜色
const edgeColor = computed(() => {
  if (props.data?.isEntryConnection) {
    return 'var(--qaq-primary, #00DC82)'
  }
  if (props.isActive) {
    return 'var(--qaq-primary, #00DC82)'
  }
  if (props.selected) {
    return 'var(--qaq-accent-blue, #3b82f6)'
  }
  return 'var(--qaq-editor-border, #404040)'
})

// 计算线条宽度
const strokeWidth = computed(() => {
  if (props.data?.isEntryConnection) return 3
  if (props.isActive) return 3
  if (props.selected) return 2
  return 1.5
})

// 箭头标记
const markerEnd = computed(() => {
  if (props.data?.isEntryConnection) {
    return 'url(#entry-arrow)'
  }
  if (props.isActive) {
    return 'url(#active-arrow)'
  }
  if (props.selected) {
    return 'url(#selected-arrow)'
  }
  return 'url(#default-arrow)'
})

// 条件相关
const hasConditions = computed(() => {
  return props.data?.conditions && props.data.conditions.length > 0
})

const conditionCount = computed(() => {
  return props.data?.conditions?.length || 0
})

// 标签位置计算
const labelX = computed(() => {
  return (props.sourceX + props.targetX) / 2
})

const labelY = computed(() => {
  return (props.sourceY + props.targetY) / 2
})

const durationX = computed(() => {
  return props.targetX - 40
})

const durationY = computed(() => {
  return props.targetY - 20
})
</script>

<style scoped>
.qaq-edge-selected {
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
}

.qaq-edge-active {
  filter: drop-shadow(0 0 6px rgba(0, 220, 130, 0.6));
}

.qaq-edge-flow {
  animation: flow 2s linear infinite;
}

@keyframes flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 12;
  }
}

.qaq-edge-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.qaq-condition-count {
  background: var(--qaq-accent-orange, #f59e0b);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.qaq-duration-label {
  background: rgba(0, 0, 0, 0.7);
  color: var(--qaq-editor-text, #ffffff);
  font-size: 9px;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 3px;
  text-align: center;
  border: 1px solid var(--qaq-editor-border, #404040);
}
</style>
