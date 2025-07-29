<template>
  <div 
    class="qaq-state-node"
    :class="{
      'qaq-state-selected': selected,
      'qaq-state-active': isActive
    }"
  >
    <!-- 状态图标 -->
    <div class="qaq-state-icon">
      <UIcon name="i-heroicons-play-circle" />
    </div>
    
    <!-- 状态名称 -->
    <div class="qaq-state-label">
      {{ data.label }}
    </div>
    
    <!-- 动画信息 -->
    <div class="qaq-state-info">
      <div class="qaq-state-clip">{{ data.animationClip }}</div>
      <div class="qaq-state-speed">{{ data.speed }}x</div>
    </div>
    
    <!-- 连接点 -->
    <Handle
      type="target"
      position="left"
      class="qaq-handle qaq-handle-target"
    />
    <Handle
      type="source"
      position="right"
      class="qaq-handle qaq-handle-source"
    />
    
    <!-- 活动状态指示器 -->
    <div v-if="isActive" class="qaq-active-indicator">
      <div class="qaq-pulse-ring"></div>
    </div>
    
    <!-- 进度条（播放时显示） -->
    <div v-if="isActive && progress > 0" class="qaq-progress-bar">
      <div 
        class="qaq-progress-fill"
        :style="{ width: `${progress * 100}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle } from '@vue-flow/core'

interface Props {
  data: {
    label: string
    animationClip: string
    speed: number
    loopMode: string
    exitTime: number
  }
  selected?: boolean
  isActive?: boolean
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  isActive: false,
  progress: 0
})

// 计算状态颜色
const stateColor = computed(() => {
  if (props.isActive) return 'var(--qaq-primary, #00DC82)'
  if (props.selected) return 'var(--qaq-accent-blue, #3b82f6)'
  return 'var(--qaq-editor-border, #404040)'
})
</script>

<style scoped>
.qaq-state-node {
  position: relative;
  width: 120px;
  height: 80px;
  background: var(--qaq-editor-panel, #2a2a2a);
  border: 2px solid var(--qaq-editor-border, #404040);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.qaq-state-node:hover {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 8px rgba(0, 220, 130, 0.3);
}

.qaq-state-selected {
  border-color: var(--qaq-accent-blue, #3b82f6);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.qaq-state-active {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.5);
  background: rgba(0, 220, 130, 0.1);
}

.qaq-state-icon {
  font-size: 20px;
  color: var(--qaq-primary, #00DC82);
  margin-bottom: 4px;
}

.qaq-state-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text, #ffffff);
  text-align: center;
  margin-bottom: 4px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qaq-state-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.qaq-state-clip {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  text-transform: capitalize;
}

.qaq-state-speed {
  font-size: 9px;
  color: var(--qaq-accent-orange, #f59e0b);
  font-weight: 500;
}

.qaq-handle {
  width: 8px;
  height: 8px;
  border: 2px solid var(--qaq-editor-bg, #1a1a1a);
  background: var(--qaq-primary, #00DC82);
  border-radius: 50%;
}

.qaq-handle-target {
  left: -6px;
}

.qaq-handle-source {
  right: -6px;
}

.qaq-active-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
}

.qaq-pulse-ring {
  width: 100%;
  height: 100%;
  background: var(--qaq-primary, #00DC82);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.qaq-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
}

.qaq-progress-fill {
  height: 100%;
  background: var(--qaq-primary, #00DC82);
  transition: width 0.1s ease;
}
</style>
