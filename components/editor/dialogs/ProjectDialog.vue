<template>
  <UModal
    v-model="isOpen"
    :ui="{
      overlay: {
        base: 'fixed inset-0 transition-opacity',
        background: 'bg-black/80 backdrop-blur-sm',
        transition: {
          enter: 'ease-out duration-300',
          enterFrom: 'opacity-0',
          enterTo: 'opacity-100',
          leave: 'ease-in duration-200',
          leaveFrom: 'opacity-100',
          leaveTo: 'opacity-0'
        }
      },
      wrapper: 'fixed inset-0 z-[9999] overflow-y-auto',
      inner: 'flex min-h-full items-center justify-center p-4 text-center sm:p-0',
      container: 'relative transform overflow-hidden text-left transition-all sm:my-8 sm:w-full sm:max-w-lg'
    }"
    :prevent-close="false"
  >
    <UCard :ui="{
      background: 'bg-white dark:bg-gray-900',
      shadow: 'shadow-xl',
      body: { background: 'bg-white dark:bg-gray-900' },
      header: { background: 'bg-white dark:bg-gray-900' }
    }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="sm"
            @click="close"
          />
        </div>
      </template>

      <div class="qaq-project-dialog">
        <!-- 项目选择模式 -->
        <div v-if="mode === 'select'" class="qaq-project-selector">
          <div class="qaq-project-actions">
            <UButton
              icon="i-heroicons-folder-plus"
              size="lg"
              variant="outline"
              class="qaq-action-button"
              @click="createNewProject"
            >
              Create New Project
            </UButton>

            <UButton
              icon="i-heroicons-folder-open"
              size="lg"
              variant="outline"
              class="qaq-action-button"
              @click="openExistingProject"
            >
              Open Existing Project
            </UButton>
          </div>

          <div class="qaq-recent-projects">
            <h4>Recent Projects</h4>
            <div v-if="recentProjects.length === 0" class="qaq-empty-state">
              <p>No recent projects</p>
            </div>
            <div v-else class="qaq-project-list">
              <div
                v-for="project in recentProjects"
                :key="project.path"
                class="qaq-project-item"
                @click="openRecentProject(project)"
              >
                <UIcon name="i-heroicons-folder" class="qaq-project-icon" />
                <div class="qaq-project-info">
                  <h5>{{ project.name }}</h5>
                  <p>{{ project.path }}</p>
                  <span class="qaq-project-date">{{ formatDate(project.lastOpened) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 创建项目模式 -->
        <div v-else-if="mode === 'create'" class="qaq-project-creator">
          <UFormGroup label="Project Name" required>
            <UInput
              v-model="projectName"
              placeholder="Enter project name"
              :error="nameError"
            />
          </UFormGroup>

          <UFormGroup label="Project Location" required>
            <div class="flex gap-2">
              <UInput
                v-model="projectPath"
                placeholder="Select project location"
                readonly
                :error="pathError"
              />
              <UButton
                icon="i-heroicons-folder"
                variant="outline"
                @click="selectProjectLocation"
              >
                Browse
              </UButton>
            </div>
          </UFormGroup>

          <UFormGroup label="Project Template">
            <USelectMenu
              v-model="selectedTemplate"
              :options="projectTemplates"
              option-attribute="name"
              value-attribute="id"
            />
          </UFormGroup>

          <div class="qaq-project-preview">
            <h5>Project will be created at:</h5>
            <code>{{ fullProjectPath }}</code>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="mode === 'loading'" class="qaq-loading-state">
          <div class="flex flex-col items-center gap-4">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
            <p>{{ loadingMessage }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="close"
          >
            Cancel
          </UButton>

          <UButton
            v-if="mode === 'create'"
            :disabled="!canCreate"
            :loading="isCreating"
            @click="confirmCreate"
          >
            Create Project
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '~/stores/editor'

// ============================================================================
// Props 和 Emits
// ============================================================================

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'project-created', project: any): void
  (e: 'project-opened', project: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ============================================================================
// 状态管理
// ============================================================================

const editorStore = useEditorStore()

// ============================================================================
// 响应式数据
// ============================================================================

const mode = ref<'select' | 'create' | 'loading'>('select')
const projectName = ref('')
const projectPath = ref('')
const selectedTemplate = ref('3d-game')
const isCreating = ref(false)
const loadingMessage = ref('')

// 错误状态
const nameError = ref('')
const pathError = ref('')

// 最近项目（模拟数据）
const recentProjects = ref([
  // 这里可以从本地存储加载
])

// 项目模板
const projectTemplates = ref([
  { id: '3d-game', name: '3D Game' },
  { id: '2d-game', name: '2D Game' },
  { id: 'ui-app', name: 'UI Application' },
  { id: 'empty', name: 'Empty Project' }
])

// ============================================================================
// 计算属性
// ============================================================================

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const title = computed(() => {
  switch (mode.value) {
    case 'select': return 'Project Manager'
    case 'create': return 'Create New Project'
    case 'loading': return 'Loading...'
    default: return 'Project Manager'
  }
})

const fullProjectPath = computed(() => {
  if (!projectPath.value || !projectName.value) return ''
  return `${projectPath.value}/${projectName.value}`
})

const canCreate = computed(() => {
  return projectName.value.trim() !== '' &&
         projectPath.value.trim() !== '' &&
         !nameError.value &&
         !pathError.value
})

// ============================================================================
// 方法
// ============================================================================

function close() {
  isOpen.value = false
  resetForm()
}

function resetForm() {
  mode.value = 'select'
  projectName.value = ''
  projectPath.value = ''
  selectedTemplate.value = '3d-game'
  isCreating.value = false
  nameError.value = ''
  pathError.value = ''
}

function createNewProject() {
  mode.value = 'create'
}

async function openExistingProject() {
  try {
    mode.value = 'loading'
    loadingMessage.value = 'Opening project...'

    await editorStore.openProject()

    emit('project-opened', editorStore.state.currentProject)
    close()
  } catch (error) {
    console.error('Failed to open project:', error)
    mode.value = 'select'
    // 这里可以显示错误提示
  }
}

function openRecentProject(project: any) {
  // 实现打开最近项目的逻辑
  console.log('Opening recent project:', project)
}

function selectProjectLocation() {
  // 这里应该打开文件夹选择对话框
  // 由于浏览器限制，我们使用 File System Access API
  console.log('Selecting project location...')
}

async function confirmCreate() {
  if (!canCreate.value) return

  try {
    isCreating.value = true

    await editorStore.createProject()

    emit('project-created', editorStore.state.currentProject)
    close()
  } catch (error) {
    console.error('Failed to create project:', error)
    // 这里可以显示错误提示
  } finally {
    isCreating.value = false
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

// ============================================================================
// 验证
// ============================================================================

watch(projectName, (newName) => {
  nameError.value = ''

  if (!newName.trim()) {
    nameError.value = 'Project name is required'
  } else if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
    nameError.value = 'Project name can only contain letters, numbers, hyphens, and underscores'
  }
})

watch(projectPath, (newPath) => {
  pathError.value = ''

  if (!newPath.trim()) {
    pathError.value = 'Project location is required'
  }
})
</script>

<style scoped>
.qaq-project-dialog {
  min-height: 300px;
  padding: 16px 0;
}

.qaq-project-selector {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.qaq-project-actions {
  display: flex;
  gap: 16px;
}

.qaq-action-button {
  flex: 1;
  height: 80px;
  flex-direction: column;
  gap: 8px;
}

.qaq-recent-projects h4 {
  margin-bottom: 12px;
  font-weight: 600;
}

.qaq-project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--qaq-border-color, #333);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.qaq-project-item:hover {
  background-color: var(--qaq-hover-bg, #2a2a2a);
}

.qaq-project-icon {
  font-size: 24px;
  color: var(--qaq-accent-color, #4ade80);
}

.qaq-project-info h5 {
  margin: 0;
  font-weight: 600;
}

.qaq-project-info p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-project-date {
  font-size: 11px;
  color: var(--qaq-text-tertiary, #999999);
}

.qaq-project-creator {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qaq-project-preview {
  padding: 12px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  border-radius: 6px;
}

.qaq-project-preview h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.qaq-project-preview code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--qaq-accent-color, #4ade80);
}

.qaq-loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.qaq-empty-state {
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
  font-style: italic;
}
</style>
