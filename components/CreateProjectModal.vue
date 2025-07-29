<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-white">{{ t('modals.createProject.title') }}</h2>
          <UButton
            @click="isOpen = false"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
          />
        </div>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-6">
        <!-- Project Name -->
        <UFormGroup :label="t('projects.projectName')" required>
          <UInput
            v-model="form.projectName"
            :placeholder="t('forms.placeholder.projectName')"
            required
            :error="errors.projectName"
          />
        </UFormGroup>

        <!-- Project Path -->
        <UFormGroup :label="t('projects.projectPath')" required>
          <div class="flex">
            <UInput
              v-model="form.projectPath"
              placeholder="/path/to/project"
              class="flex-1 rounded-r-none"
              required
              :error="errors.projectPath"
            />
            <UButton
              @click="browseFolder"
              variant="outline"
              icon="i-heroicons-folder-open"
              class="rounded-l-none border-l-0"
              :title="t('modals.createProject.browse')"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">
            Choose where to create your project folder
          </p>
        </UFormGroup>

        <!-- Template Selection -->
        <UFormGroup :label="t('modals.createProject.selectTemplate')">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="template in templates"
              :key="template.id"
              @click="form.selectedTemplate = template.id"
              class="p-4 border rounded-lg cursor-pointer transition-colors"
              :class="form.selectedTemplate === template.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-gray-500'"
            >
              <div class="flex items-start space-x-3">
                <UIcon :name="template.icon" class="w-6 h-6 text-primary-500 mt-1" />
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-white">{{ t('modals.createProject.templates.' + template.id) || template.name }}</h4>
                    <UBadge
                      :color="template.category === '2D' ? 'green' : template.category === '3D' ? 'blue' : 'gray'"
                      size="xs"
                    >
                      {{ template.category }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-400 mt-1">{{ template.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </UFormGroup>

        <!-- Renderer Selection -->
        <UFormGroup label="Renderer">
          <URadioGroup
            v-model="form.renderer"
            :options="rendererOptions"
            class="flex space-x-6"
          />
          <p class="text-xs text-gray-400 mt-1">
            Choose the rendering mode for your project
          </p>
        </UFormGroup>

        <!-- Advanced Settings -->
        <UAccordion :items="accordionItems" class="w-full">
          <template #default="{ item, index, open }">
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              class="border-b border-gray-200 dark:border-gray-700"
              :ui="{ rounded: 'rounded-none', padding: { sm: 'p-3' } }"
            >
              <template #leading>
                <UIcon
                  name="i-heroicons-chevron-right-20-solid"
                  class="w-5 h-5 ms-auto transform transition-transform duration-200"
                  :class="[open && 'rotate-90']"
                />
              </template>

              {{ item.label }}
            </UButton>
          </template>

          <template #item="{ item }">
            <div class="p-4 space-y-4">
              <UFormGroup label="Physics Engine">
                <USelect
                  v-model="form.physics"
                  :options="physicsOptions"
                />
              </UFormGroup>

              <UFormGroup label="Audio System">
                <USelect
                  v-model="form.audio"
                  :options="audioOptions"
                />
              </UFormGroup>

              <UFormGroup label="Version Control">
                <UCheckbox
                  v-model="form.initGit"
                  label="Initialize Git repository"
                />
              </UFormGroup>
            </div>
          </template>
        </UAccordion>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <UButton
            @click="isOpen = false"
            variant="outline"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            icon="i-heroicons-plus"
            :disabled="!isFormValid"
            :loading="isCreating"
          >
            {{ isCreating ? t('modals.createProject.creating') : t('projects.createProject') }}
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
// 使用简化的错误处理

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'create', projectData: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// i18n
const { t } = useI18n()

// 响应式数据
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isCreating = ref(false)

const form = reactive({
  projectName: '',
  projectPath: '',
  selectedTemplate: 'empty',
  renderer: '3D' ,
  physics: 'builtin',
  audio: 'builtin',
  initGit: true
})

const errors = reactive({
  projectName: '',
  projectPath: ''
})

// 模板选项
const templates = [
  {
    id: 'empty',
    name: t('modals.createProject.templates.empty'),
    description: 'Start with a completely empty project',
    icon: 'i-heroicons-document',
    category: 'Basic'
  },
  {
    id: '2d',
    name: t('modals.createProject.templates.2d'),
    description: 'Basic 2D game with player movement',
    icon: 'i-heroicons-rectangle-stack',
    category: '2D'
  },
  {
    id: '3d',
    name: t('modals.createProject.templates.3d'),
    description: 'Basic 3D game with first-person controller',
    icon: 'i-heroicons-cube',
    category: '3D'
  },
  {
    id: 'platformer',
    name: t('modals.createProject.templates.platformer'),
    description: 'Side-scrolling platformer template',
    icon: 'i-heroicons-play',
    category: '2D'
  }
]

// 渲染器选项
const rendererOptions = [
  {
    label: '2D',
    value: '2D',
    description: 'Optimized for 2D games'
  },
  {
    label: '3D',
    value: '3D',
    description: 'Full 3D rendering capabilities'
  }
]

// 物理引擎选项
const physicsOptions = [
  { label: 'Built-in Physics', value: 'builtin' },
  { label: 'Box2D (2D)', value: 'box2d' },
  { label: 'Bullet (3D)', value: 'bullet' },
  { label: 'None', value: 'none' }
]

// 音频系统选项
const audioOptions = [
  { label: 'Built-in Audio', value: 'builtin' },
  { label: 'Web Audio API', value: 'webaudio' },
  { label: 'None', value: 'none' }
]

// 手风琴项目
const accordionItems = [
  {
    label: 'Advanced Settings',
    icon: 'i-heroicons-cog-6-tooth',
    defaultOpen: false
  }
]

// 计算属性
const isFormValid = computed(() => {
  return form.projectName.trim() !== '' &&
         form.projectPath.trim() !== '' &&
         !errors.projectName &&
         !errors.projectPath
})

// 验证表单
function validateForm() {
  errors.projectName = ''
  errors.projectPath = ''

  if (!form.projectName.trim()) {
    errors.projectName = 'Project name is required'
    return false
  }

  if (!form.projectPath.trim()) {
    errors.projectPath = 'Project path is required'
    return false
  }

  // 检查项目名称是否包含无效字符
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(form.projectName)) {
    errors.projectName = 'Project name contains invalid characters'
    return false
  }

  return true
}

// 方法
function browseFolder() {
  // TODO: 实现文件夹选择对话框
  console.log('Browse folder')
  // 临时设置一个默认路径
  if (!form.projectPath) {
    form.projectPath = `~/Documents/QAQ Projects/${form.projectName || 'NewProject'}`
  }
}

async function handleSubmit() {
  if (!validateForm()) return

  isCreating.value = true

  try {
    // 获取认证store
    const authStore = useAuthStore()
    const toast = useToast()

    // 检查用户是否已登录
    if (!authStore.isAuthenticated || !authStore.token) {
      toast.add({
        title: '认证失败',
        description: '请先登录后再创建项目',
        color: 'red',
        timeout: 5000,
        icon: 'i-heroicons-exclamation-triangle'
      })
      return
    }

    // 准备项目数据
    const projectData = {
      name: form.projectName.trim(),
      location: form.projectPath.trim().replace(/\/[^\/]*$/, ''), // 移除项目名称，只保留目录
      description: `${form.projectName} - Created with QAQ Game Engine`,
      template: form.selectedTemplate || 'empty'
    }

    console.log('🚀 开始创建项目:', projectData)

    // 调用项目创建API
    const response = await $fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: projectData
    })

    if (response.success) {
      console.log('✅ 项目创建成功:', response.data)

      // 显示成功通知
      toast.add({
        title: '项目创建成功',
        description: `项目 "${projectData.name}" 已成功创建！`,
        icon: 'i-heroicons-check-circle',
        color: 'green',
        timeout: 5000
      })

      // 发出创建成功事件
      emit('create', response.data.project)

      // 关闭模态框
      isOpen.value = false

      // 重置表单
      resetForm()
    } else {
      // 处理API返回的错误
      throw new Error(response.message || '项目创建失败')
    }

  } catch (error: any) {
    console.error('❌ 项目创建失败:', error)

    const toast = useToast()

    // 处理认证错误
    if (error.status === 401 || error.statusCode === 401) {
      const authStore = useAuthStore()
      await authStore.logout()

      toast.add({
        title: '认证失败',
        description: '登录已过期，请重新登录',
        color: 'red',
        timeout: 5000,
        icon: 'i-heroicons-exclamation-triangle'
      })

      // 重定向到登录页面
      await navigateTo('/auth/login')
      return
    }

    // 显示通用错误通知
    toast.add({
      title: '项目创建失败',
      description: error.message || error.data?.message || '创建项目时发生错误，请稍后重试',
      color: 'red',
      timeout: 8000,
      icon: 'i-heroicons-exclamation-circle'
    })

  } finally {
    isCreating.value = false
  }
}

function resetForm() {
  form.projectName = ''
  form.projectPath = ''
  form.selectedTemplate = 'empty'
  form.renderer = '3D'
  form.physics = 'builtin'
  form.audio = 'builtin'
  form.initGit = true

  errors.projectName = ''
  errors.projectPath = ''
}

// 监听模态框打开状态
watch(isOpen, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

// 监听项目名称变化，自动更新路径
watch(() => form.projectName, (newName) => {
  if (newName && !form.projectPath) {
    form.projectPath = `~/Documents/QAQ Projects/${newName}`
  }
})
</script>
