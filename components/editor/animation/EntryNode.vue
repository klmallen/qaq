<template>
  <div 
    class="qaq-entry-node"
    :class="{
      'qaq-entry-selected': selected
    }"
  >
    <!-- 入口图标 -->
    <div class="qaq-entry-icon">
      <UIcon name="i-heroicons-arrow-right-circle" />
    </div>
    
    <!-- 入口标签 -->
    <div class="qaq-entry-label">
      {{ data.label }}
    </div>
    
    <!-- 连接点 -->
    <Handle
      type="source"
      position="right"
      class="qaq-handle qaq-handle-source"
    />
    
    <!-- 入口指示器 -->
    <div class="qaq-entry-indicator">
      <div class="qaq-entry-arrow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle } from '@vue-flow/core'

interface Props {
  data: {
    label: string
    targetState?: string
  }
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})
</script>

<style scoped>
.qaq-entry-node {
  position: relative;
  width: 80px;
  height: 60px;
  background: linear-gradient(135deg, var(--qaq-primary, #00DC82), var(--qaq-accent-green, #10b981));
  border: 2px solid var(--qaq-primary, #00DC82);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 8px rgba(0, 220, 130, 0.3);
}

.qaq-entry-node:hover {
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.5);
}

.qaq-entry-selected {
  border-color: var(--qaq-accent-blue, #3b82f6);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
}

.qaq-entry-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 2px;
}

.qaq-entry-label {
  font-size: 10px;
  font-weight: 600;
  color: white;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.qaq-handle-source {
  width: 8px;
  height: 8px;
  border: 2px solid white;
  background: var(--qaq-primary, #00DC82);
  border-radius: 50%;
  right: -6px;
}

.qaq-entry-indicator {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
}

.qaq-entry-arrow {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 8px solid var(--qaq-primary, #00DC82);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}
</style>
