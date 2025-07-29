<template>
  <div class="material-node texture-sample-node" :class="{ selected: isSelected }">
    <div class="node-header">
      <UIcon name="i-heroicons-photo" class="node-icon" />
      <span class="node-title">Texture Sample</span>
    </div>
    
    <div class="node-body">
      <!-- 输入端口 -->
      <div class="node-inputs">
        <div class="input-port" data-port="texture">
          <div class="port-dot input-dot"></div>
          <span class="port-label">Texture</span>
        </div>
        <div class="input-port" data-port="uv">
          <div class="port-dot input-dot"></div>
          <span class="port-label">UV</span>
        </div>
      </div>
      
      <!-- 节点内容 -->
      <div class="node-content">
        <div class="texture-preview">
          <div class="texture-placeholder">
            <UIcon name="i-heroicons-photo" />
          </div>
        </div>
      </div>
      
      <!-- 输出端口 -->
      <div class="node-outputs">
        <div class="output-port" data-port="rgba">
          <span class="port-label">RGBA</span>
          <div class="port-dot output-dot"></div>
        </div>
        <div class="output-port" data-port="rgb">
          <span class="port-label">RGB</span>
          <div class="port-dot output-dot"></div>
        </div>
        <div class="output-port" data-port="alpha">
          <span class="port-label">A</span>
          <div class="port-dot output-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  nodeId: string
  position: { x: number; y: number }
  isSelected?: boolean
  data?: {
    texture?: string
    uvScale?: { x: number; y: number }
  }
}

interface Emits {
  (e: 'select', nodeId: string): void
  (e: 'connect', connection: { from: string; to: string; fromPort: string; toPort: string }): void
  (e: 'update', nodeId: string, data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  data: () => ({})
})

const emit = defineEmits<Emits>()

const handleNodeClick = () => {
  emit('select', props.nodeId)
}

const handlePortClick = (port: string, type: 'input' | 'output') => {
  // 端口连接逻辑
  console.log(`Port clicked: ${port} (${type})`)
}
</script>

<style scoped>
.material-node {
  position: absolute;
  background: var(--qaq-bg-secondary, #2a2a2a);
  border: 2px solid var(--qaq-border, #404040);
  border-radius: 8px;
  min-width: 160px;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.material-node:hover {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2);
}

.material-node.selected {
  border-color: var(--qaq-primary, #00DC82);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--qaq-bg-tertiary, #1a1a1a);
  border-bottom: 1px solid var(--qaq-border, #404040);
  border-radius: 6px 6px 0 0;
}

.node-icon {
  color: var(--qaq-primary, #00DC82);
  font-size: 14px;
}

.node-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
}

.node-body {
  position: relative;
  padding: 12px;
}

.node-inputs,
.node-outputs {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
}

.node-inputs {
  left: -8px;
}

.node-outputs {
  right: -8px;
}

.input-port,
.output-port {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
}

.output-port {
  flex-direction: row-reverse;
}

.port-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--qaq-border, #404040);
  background: var(--qaq-bg-primary, #0a0a0a);
  cursor: pointer;
  transition: all 0.2s ease;
}

.port-dot:hover {
  border-color: var(--qaq-primary, #00DC82);
  background: var(--qaq-primary, #00DC82);
}

.input-dot {
  background: var(--qaq-accent-blue, #3b82f6);
  border-color: var(--qaq-accent-blue, #3b82f6);
}

.output-dot {
  background: var(--qaq-accent-orange, #f59e0b);
  border-color: var(--qaq-accent-orange, #f59e0b);
}

.port-label {
  white-space: nowrap;
  pointer-events: none;
}

.node-content {
  margin: 0 16px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.texture-preview {
  width: 60px;
  height: 60px;
  border: 1px solid var(--qaq-border, #404040);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qaq-bg-primary, #0a0a0a);
}

.texture-placeholder {
  color: var(--qaq-text-tertiary, #666666);
  font-size: 20px;
}
</style>
