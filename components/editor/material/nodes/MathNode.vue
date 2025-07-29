<template>
  <div class="material-node math-node" :class="{ selected: isSelected }">
    <div class="node-header">
      <UIcon :name="getNodeIcon()" class="node-icon" />
      <span class="node-title">{{ getNodeTitle() }}</span>
    </div>
    
    <div class="node-body">
      <!-- 输入端口 -->
      <div class="node-inputs">
        <div class="input-port" data-port="a">
          <div class="port-dot input-dot"></div>
          <span class="port-label">A</span>
        </div>
        <div class="input-port" data-port="b" v-if="needsSecondInput()">
          <div class="port-dot input-dot"></div>
          <span class="port-label">B</span>
        </div>
        <div class="input-port" data-port="factor" v-if="mathType === 'lerp'">
          <div class="port-dot input-dot"></div>
          <span class="port-label">Factor</span>
        </div>
      </div>
      
      <!-- 节点内容 -->
      <div class="node-content">
        <div class="math-symbol">
          {{ getMathSymbol() }}
        </div>
      </div>
      
      <!-- 输出端口 -->
      <div class="node-outputs">
        <div class="output-port" data-port="result">
          <span class="port-label">Result</span>
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
  mathType: 'add' | 'multiply' | 'subtract' | 'divide' | 'lerp' | 'dot' | 'cross'
  isSelected?: boolean
  data?: {
    valueA?: number
    valueB?: number
    factor?: number
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

const getNodeIcon = () => {
  const icons = {
    add: 'i-heroicons-plus',
    multiply: 'i-heroicons-x-mark',
    subtract: 'i-heroicons-minus',
    divide: 'i-heroicons-slash',
    lerp: 'i-heroicons-arrows-right-left',
    dot: 'i-heroicons-circle-stack',
    cross: 'i-heroicons-x-circle'
  }
  return icons[props.mathType] || 'i-heroicons-calculator'
}

const getNodeTitle = () => {
  const titles = {
    add: 'Add',
    multiply: 'Multiply',
    subtract: 'Subtract',
    divide: 'Divide',
    lerp: 'Lerp',
    dot: 'Dot Product',
    cross: 'Cross Product'
  }
  return titles[props.mathType] || 'Math'
}

const getMathSymbol = () => {
  const symbols = {
    add: '+',
    multiply: '×',
    subtract: '−',
    divide: '÷',
    lerp: 'LERP',
    dot: '•',
    cross: '×'
  }
  return symbols[props.mathType] || '?'
}

const needsSecondInput = () => {
  return ['add', 'multiply', 'subtract', 'divide', 'lerp', 'dot', 'cross'].includes(props.mathType)
}

const handleNodeClick = () => {
  emit('select', props.nodeId)
}
</script>

<style scoped>
.math-node {
  position: absolute;
  background: var(--qaq-bg-secondary, #2a2a2a);
  border: 2px solid var(--qaq-border, #404040);
  border-radius: 8px;
  min-width: 120px;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.math-node:hover {
  border-color: var(--qaq-accent-purple, #8b5cf6);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.math-node.selected {
  border-color: var(--qaq-accent-purple, #8b5cf6);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
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
  color: var(--qaq-accent-purple, #8b5cf6);
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

.math-symbol {
  font-size: 24px;
  font-weight: bold;
  color: var(--qaq-accent-purple, #8b5cf6);
  text-align: center;
}
</style>
