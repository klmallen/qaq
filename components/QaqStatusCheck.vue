<template>
  <div class="qaq-status-check">
    <div class="qaq-status-header">
      <UIcon name="i-heroicons-shield-check" class="qaq-status-logo" />
      <h2>System Status</h2>
    </div>

    <div class="qaq-status-grid">
      <div
        v-for="item in statusItems"
        :key="item.name"
        class="qaq-status-item"
        :class="{
          'qaq-status-success': item.status === 'success',
          'qaq-status-warning': item.status === 'warning',
          'qaq-status-error': item.status === 'error'
        }"
      >
        <div class="qaq-status-icon">
          <UIcon :name="getStatusIcon(item.status)" />
        </div>
        
        <div class="qaq-status-content">
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          
          <div v-if="item.installCommand" class="qaq-install-command">
            <code>{{ item.installCommand }}</code>
          </div>
        </div>
        
        <div class="qaq-status-badge">
          {{ getStatusText(item.status) }}
        </div>
      </div>
    </div>

    <div class="qaq-status-summary">
      <div class="qaq-summary-stats">
        <div class="qaq-stat">
          <span class="qaq-stat-number">{{ successCount }}</span>
          <span class="qaq-stat-label">Working</span>
        </div>
        <div class="qaq-stat">
          <span class="qaq-stat-number">{{ warningCount }}</span>
          <span class="qaq-stat-label">Optional</span>
        </div>
        <div class="qaq-stat">
          <span class="qaq-stat-number">{{ errorCount }}</span>
          <span class="qaq-stat-label">Missing</span>
        </div>
      </div>
      
      <div class="qaq-summary-message">
        <p v-if="allWorking">🎉 All core features are working! Optional dependencies can be installed for enhanced features.</p>
        <p v-else-if="coreWorking">✅ Core features are working! Some optional features need dependencies.</p>
        <p v-else>⚠️ Some core features may not work properly. Please check the dependencies.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface StatusItem {
  name: string
  description: string
  status: 'success' | 'warning' | 'error'
  installCommand?: string
  isCore: boolean
}

// 响应式数据
const statusItems = ref<StatusItem[]>([
  {
    name: 'Vue 3 + Nuxt',
    description: 'Core framework and development environment',
    status: 'success',
    isCore: true
  },
  {
    name: 'Nuxt UI',
    description: 'UI component library and styling',
    status: 'success',
    isCore: true
  },
  {
    name: 'Three.js',
    description: '3D graphics rendering engine',
    status: 'success',
    isCore: true
  },
  {
    name: 'Pinia',
    description: 'State management for editor data',
    status: 'success',
    isCore: true
  },
  {
    name: 'Main Editor',
    description: 'Scene tree, 3D viewport, property inspector',
    status: 'success',
    isCore: true
  },
  {
    name: 'Terrain Editor',
    description: 'UE-style terrain sculpting tools',
    status: 'success',
    isCore: false
  },
  {
    name: 'Simple Material Editor',
    description: 'Basic node-based material editing',
    status: 'success',
    isCore: false
  },
  {
    name: 'Monaco Editor',
    description: 'Advanced code editor with syntax highlighting',
    status: 'warning',
    installCommand: 'npm install monaco-editor',
    isCore: false
  },
  {
    name: 'Vue Flow Material Editor',
    description: 'Professional node-based material editor',
    status: 'warning',
    installCommand: 'npm install @vue-flow/core @vue-flow/controls @vue-flow/minimap @vue-flow/background',
    isCore: false
  }
])

// 计算属性
const successCount = computed(() => 
  statusItems.value.filter(item => item.status === 'success').length
)

const warningCount = computed(() => 
  statusItems.value.filter(item => item.status === 'warning').length
)

const errorCount = computed(() => 
  statusItems.value.filter(item => item.status === 'error').length
)

const coreWorking = computed(() => 
  statusItems.value.filter(item => item.isCore).every(item => item.status === 'success')
)

const allWorking = computed(() => 
  statusItems.value.every(item => item.status === 'success')
)

// 方法
function getStatusIcon(status: string): string {
  switch (status) {
    case 'success':
      return 'i-heroicons-check-circle'
    case 'warning':
      return 'i-heroicons-exclamation-triangle'
    case 'error':
      return 'i-heroicons-x-circle'
    default:
      return 'i-heroicons-question-mark-circle'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'success':
      return 'Ready'
    case 'warning':
      return 'Optional'
    case 'error':
      return 'Missing'
    default:
      return 'Unknown'
  }
}

async function checkDependencies() {
  // 检查Monaco Editor
  try {
    await import('monaco-editor')
    const monacoItem = statusItems.value.find(item => item.name === 'Monaco Editor')
    if (monacoItem) {
      monacoItem.status = 'success'
      monacoItem.installCommand = undefined
    }
  } catch {
    // Monaco Editor不可用，保持warning状态
  }

  // 检查Vue Flow
  try {
    await import('@vue-flow/core')
    const vueFlowItem = statusItems.value.find(item => item.name === 'Vue Flow Material Editor')
    if (vueFlowItem) {
      vueFlowItem.status = 'success'
      vueFlowItem.installCommand = undefined
    }
  } catch {
    // Vue Flow不可用，保持warning状态
  }
}

// 生命周期
onMounted(() => {
  checkDependencies()
})
</script>

<style scoped>
.qaq-status-check {
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.qaq-status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.qaq-status-logo {
  width: 32px;
  height: 32px;
  color: var(--qaq-accent, #00DC82);
}

.qaq-status-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0;
}

.qaq-status-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.qaq-status-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.qaq-status-success {
  background-color: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.qaq-status-warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.qaq-status-error {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.qaq-status-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.qaq-status-success .qaq-status-icon {
  color: #10b981;
}

.qaq-status-warning .qaq-status-icon {
  color: #f59e0b;
}

.qaq-status-error .qaq-status-icon {
  color: #ef4444;
}

.qaq-status-content {
  flex: 1;
}

.qaq-status-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0 0 4px 0;
}

.qaq-status-content p {
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0;
  line-height: 1.4;
}

.qaq-install-command {
  margin-top: 8px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  padding: 6px 8px;
  border-radius: 4px;
}

.qaq-install-command code {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--qaq-accent, #00DC82);
}

.qaq-status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-status-success .qaq-status-badge {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.qaq-status-warning .qaq-status-badge {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.qaq-status-error .qaq-status-badge {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.qaq-status-summary {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
}

.qaq-summary-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
}

.qaq-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.qaq-stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--qaq-accent, #00DC82);
}

.qaq-stat-label {
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-summary-message {
  text-align: center;
}

.qaq-summary-message p {
  font-size: 1rem;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0;
  line-height: 1.5;
}
</style>
