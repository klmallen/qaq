<!--
  QAQ游戏引擎 - 动画参数面板
  
  用于编辑和控制AnimationTree的参数
-->

<template>
  <div class="animation-parameter-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <h3 class="panel-title">
        <UIcon name="i-heroicons-adjustments-horizontal" />
        动画参数
      </h3>
      <div class="panel-actions">
        <UButton
          icon="i-heroicons-plus"
          size="xs"
          variant="ghost"
          @click="showAddParameterModal = true"
        >
          添加参数
        </UButton>
      </div>
    </div>

    <!-- 参数列表 -->
    <div class="parameter-list">
      <div
        v-for="parameter in parameters"
        :key="parameter.name"
        class="parameter-item"
      >
        <!-- 参数名称和类型 -->
        <div class="parameter-header">
          <div class="parameter-info">
            <span class="parameter-name">{{ parameter.name }}</span>
            <UBadge
              :color="getParameterTypeColor(parameter.type)"
              variant="soft"
              size="xs"
            >
              {{ parameter.type }}
            </UBadge>
          </div>
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            variant="ghost"
            color="red"
            @click="removeParameter(parameter.name)"
          />
        </div>

        <!-- 参数控制器 -->
        <div class="parameter-control">
          <!-- 浮点数参数 -->
          <div v-if="parameter.type === 'float'" class="float-control">
            <URange
              v-model="parameter.currentValue"
              :min="-10"
              :max="10"
              :step="0.1"
              @update:model-value="updateParameter(parameter.name, $event)"
            />
            <UInput
              v-model="parameter.currentValue"
              type="number"
              size="xs"
              class="value-input"
              @update:model-value="updateParameter(parameter.name, $event)"
            />
          </div>

          <!-- 整数参数 -->
          <div v-else-if="parameter.type === 'int'" class="int-control">
            <URange
              v-model="parameter.currentValue"
              :min="-100"
              :max="100"
              :step="1"
              @update:model-value="updateParameter(parameter.name, $event)"
            />
            <UInput
              v-model="parameter.currentValue"
              type="number"
              size="xs"
              class="value-input"
              @update:model-value="updateParameter(parameter.name, $event)"
            />
          </div>

          <!-- 布尔参数 -->
          <div v-else-if="parameter.type === 'bool'" class="bool-control">
            <UToggle
              v-model="parameter.currentValue"
              @update:model-value="updateParameter(parameter.name, $event)"
            />
            <span class="bool-label">
              {{ parameter.currentValue ? 'True' : 'False' }}
            </span>
          </div>

          <!-- 触发器参数 -->
          <div v-else-if="parameter.type === 'trigger'" class="trigger-control">
            <UButton
              :color="parameter.currentValue ? 'green' : 'gray'"
              size="xs"
              @click="triggerParameter(parameter.name)"
            >
              {{ parameter.currentValue ? '已触发' : '触发' }}
            </UButton>
          </div>
        </div>

        <!-- 参数值显示 -->
        <div class="parameter-value">
          <span class="value-label">当前值:</span>
          <span class="value-display">{{ formatParameterValue(parameter) }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="parameters.length === 0" class="empty-state">
        <UIcon name="i-heroicons-variable" class="empty-icon" />
        <p class="empty-text">暂无参数</p>
        <UButton
          variant="outline"
          size="sm"
          @click="showAddParameterModal = true"
        >
          添加第一个参数
        </UButton>
      </div>
    </div>

    <!-- 实时状态显示 -->
    <div class="status-section">
      <div class="status-header">
        <h4>状态机状态</h4>
      </div>
      <div class="status-info">
        <div class="status-item">
          <span class="status-label">当前状态:</span>
          <UBadge
            :color="currentState ? 'green' : 'gray'"
            variant="soft"
          >
            {{ currentState || '无' }}
          </UBadge>
        </div>
        <div class="status-item">
          <span class="status-label">播放状态:</span>
          <UBadge
            :color="isPlaying ? 'blue' : 'gray'"
            variant="soft"
          >
            {{ isPlaying ? '播放中' : '已停止' }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- 添加参数模态框 -->
    <UModal v-model="showAddParameterModal">
      <UCard>
        <template #header>
          <h3>添加新参数</h3>
        </template>

        <div class="add-parameter-form">
          <UFormGroup label="参数名称" required>
            <UInput
              v-model="newParameter.name"
              placeholder="输入参数名称"
            />
          </UFormGroup>

          <UFormGroup label="参数类型" required>
            <USelect
              v-model="newParameter.type"
              :options="parameterTypeOptions"
            />
          </UFormGroup>

          <UFormGroup label="默认值" required>
            <!-- 浮点数默认值 -->
            <UInput
              v-if="newParameter.type === 'float'"
              v-model="newParameter.defaultValue"
              type="number"
              step="0.1"
              placeholder="0.0"
            />
            <!-- 整数默认值 -->
            <UInput
              v-else-if="newParameter.type === 'int'"
              v-model="newParameter.defaultValue"
              type="number"
              step="1"
              placeholder="0"
            />
            <!-- 布尔默认值 -->
            <UToggle
              v-else-if="newParameter.type === 'bool'"
              v-model="newParameter.defaultValue"
            />
            <!-- 触发器默认值 -->
            <UInput
              v-else
              v-model="newParameter.defaultValue"
              disabled
              placeholder="false"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="modal-actions">
            <UButton
              variant="ghost"
              @click="showAddParameterModal = false"
            >
              取消
            </UButton>
            <UButton
              color="primary"
              @click="addParameter"
              :disabled="!newParameter.name"
            >
              添加
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { animationTreeAdapter, type EditorParameter } from './AnimationTreeAdapter'

// ============================================================================
// 组件属性和事件
// ============================================================================

interface Props {
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  parameterChanged: [name: string, value: any]
}>()

// ============================================================================
// 响应式数据
// ============================================================================

// 使用适配器的参数数据
const parameters = computed(() => animationTreeAdapter.parameters.value)
const currentState = computed(() => animationTreeAdapter.currentState.value)
const isPlaying = computed(() => animationTreeAdapter.isPlaying.value)

// 添加参数模态框
const showAddParameterModal = ref(false)
const newParameter = reactive({
  name: '',
  type: 'float' as 'float' | 'int' | 'bool' | 'trigger',
  defaultValue: 0
})

// 参数类型选项
const parameterTypeOptions = [
  { label: '浮点数 (Float)', value: 'float' },
  { label: '整数 (Int)', value: 'int' },
  { label: '布尔值 (Bool)', value: 'bool' },
  { label: '触发器 (Trigger)', value: 'trigger' }
]

// ============================================================================
// 方法
// ============================================================================

/**
 * 更新参数值
 */
function updateParameter(name: string, value: any) {
  animationTreeAdapter.setParameter(name, value)
  emit('parameterChanged', name, value)
}

/**
 * 触发参数
 */
function triggerParameter(name: string) {
  const parameter = parameters.value.find(p => p.name === name)
  if (parameter) {
    const newValue = !parameter.currentValue
    updateParameter(name, newValue)
    
    // 触发器参数在短时间后自动重置
    if (newValue) {
      setTimeout(() => {
        updateParameter(name, false)
      }, 100)
    }
  }
}

/**
 * 添加参数
 */
function addParameter() {
  if (!newParameter.name) return
  
  // 检查参数名是否已存在
  if (parameters.value.some(p => p.name === newParameter.name)) {
    // 这里应该显示错误提示
    return
  }
  
  // 处理默认值
  let defaultValue = newParameter.defaultValue
  if (newParameter.type === 'float') {
    defaultValue = parseFloat(defaultValue) || 0.0
  } else if (newParameter.type === 'int') {
    defaultValue = parseInt(defaultValue) || 0
  } else if (newParameter.type === 'bool') {
    defaultValue = Boolean(defaultValue)
  } else if (newParameter.type === 'trigger') {
    defaultValue = false
  }
  
  animationTreeAdapter.addParameter(newParameter.name, newParameter.type, defaultValue)
  
  // 重置表单
  newParameter.name = ''
  newParameter.type = 'float'
  newParameter.defaultValue = 0
  showAddParameterModal.value = false
}

/**
 * 移除参数
 */
function removeParameter(name: string) {
  // 这里需要在适配器中添加removeParameter方法
  // animationTreeAdapter.removeParameter(name)
}

/**
 * 获取参数类型颜色
 */
function getParameterTypeColor(type: string): string {
  switch (type) {
    case 'float': return 'blue'
    case 'int': return 'green'
    case 'bool': return 'purple'
    case 'trigger': return 'orange'
    default: return 'gray'
  }
}

/**
 * 格式化参数值显示
 */
function formatParameterValue(parameter: EditorParameter): string {
  if (parameter.type === 'float') {
    return Number(parameter.currentValue).toFixed(2)
  } else if (parameter.type === 'bool') {
    return parameter.currentValue ? 'true' : 'false'
  } else {
    return String(parameter.currentValue)
  }
}
</script>

<style scoped>
.animation-parameter-panel {
  @apply flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700;
  width: 300px;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.panel-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white;
}

.panel-actions {
  @apply flex items-center gap-2;
}

.parameter-list {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.parameter-item {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.parameter-header {
  @apply flex items-center justify-between mb-2;
}

.parameter-info {
  @apply flex items-center gap-2;
}

.parameter-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.parameter-control {
  @apply mb-2;
}

.float-control,
.int-control {
  @apply flex items-center gap-2;
}

.value-input {
  @apply w-20;
}

.bool-control {
  @apply flex items-center gap-2;
}

.bool-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.trigger-control {
  @apply flex items-center;
}

.parameter-value {
  @apply flex items-center justify-between text-xs text-gray-500 dark:text-gray-400;
}

.value-label {
  @apply font-medium;
}

.value-display {
  @apply font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.empty-icon {
  @apply w-12 h-12 text-gray-400 mb-2;
}

.empty-text {
  @apply text-gray-500 dark:text-gray-400 mb-4;
}

.status-section {
  @apply p-4 border-t border-gray-200 dark:border-gray-700;
}

.status-header h4 {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.status-info {
  @apply space-y-2;
}

.status-item {
  @apply flex items-center justify-between text-sm;
}

.status-label {
  @apply text-gray-600 dark:text-gray-400;
}

.add-parameter-form {
  @apply space-y-4;
}

.modal-actions {
  @apply flex items-center justify-end gap-2;
}
</style>
