<template>
  <div class="material-node output-node" :class="{ selected: isSelected }">
    <div class="node-header">
      <UIcon name="i-heroicons-arrow-right-circle" class="node-icon" />
      <span class="node-title">Material Output</span>
    </div>
    
    <div class="node-body">
      <!-- 输入端口 -->
      <div class="node-inputs">
        <div class="input-port" data-port="albedo">
          <div class="port-dot input-dot albedo-port"></div>
          <span class="port-label">Albedo</span>
        </div>
        <div class="input-port" data-port="metallic">
          <div class="port-dot input-dot metallic-port"></div>
          <span class="port-label">Metallic</span>
        </div>
        <div class="input-port" data-port="roughness">
          <div class="port-dot input-dot roughness-port"></div>
          <span class="port-label">Roughness</span>
        </div>
        <div class="input-port" data-port="normal">
          <div class="port-dot input-dot normal-port"></div>
          <span class="port-label">Normal</span>
        </div>
        <div class="input-port" data-port="emission">
          <div class="port-dot input-dot emission-port"></div>
          <span class="port-label">Emission</span>
        </div>
        <div class="input-port" data-port="alpha">
          <div class="port-dot input-dot alpha-port"></div>
          <span class="port-label">Alpha</span>
        </div>
      </div>
      
      <!-- 节点内容 -->
      <div class="node-content">
        <div class="output-preview">
          <div class="material-sphere">
            <div class="sphere-gradient"></div>
          </div>
          <div class="output-label">Final Material</div>
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
    albedo?: string
    metallic?: number
    roughness?: number
    normal?: string
    emission?: string
    alpha?: number
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
</script>

<style scoped>
.output-node {
  position: absolute;
  background: var(--qaq-bg-secondary, #2a2a2a);
  border: 2px solid var(--qaq-accent-red, #ef4444);
  border-radius: 8px;
  min-width: 180px;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.output-node:hover {
  border-color: var(--qaq-accent-red, #ef4444);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.output-node.selected {
  border-color: var(--qaq-accent-red, #ef4444);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-bottom: 1px solid var(--qaq-border, #404040);
  border-radius: 6px 6px 0 0;
}

.node-icon {
  color: white;
  font-size: 14px;
}

.node-title {
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.node-body {
  position: relative;
  padding: 12px;
  padding-left: 24px;
}

.node-inputs {
  position: absolute;
  top: 0;
  left: -8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}

.input-port {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
}

.port-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--qaq-border, #404040);
  cursor: pointer;
  transition: all 0.2s ease;
}

.port-dot:hover {
  border-color: var(--qaq-primary, #00DC82);
  transform: scale(1.2);
}

.albedo-port {
  background: #f59e0b;
  border-color: #f59e0b;
}

.metallic-port {
  background: #6b7280;
  border-color: #6b7280;
}

.roughness-port {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.normal-port {
  background: #3b82f6;
  border-color: #3b82f6;
}

.emission-port {
  background: #10b981;
  border-color: #10b981;
}

.alpha-port {
  background: #ec4899;
  border-color: #ec4899;
}

.port-label {
  white-space: nowrap;
  pointer-events: none;
  font-weight: 500;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.output-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.material-sphere {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 2px solid var(--qaq-border, #404040);
}

.sphere-gradient {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, 
    rgba(255, 255, 255, 0.8) 0%,
    rgba(0, 220, 130, 0.6) 30%,
    rgba(0, 100, 60, 0.8) 70%,
    rgba(0, 50, 30, 1) 100%
  );
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.output-label {
  font-size: 10px;
  color: var(--qaq-text-tertiary, #666666);
  text-align: center;
  font-weight: 500;
}
</style>
