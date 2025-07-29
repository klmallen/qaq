<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-green-400" />
          <h3 class="text-lg font-semibold">{{ t('projects.renameProject') }}</h3>
        </div>
      </template>

      <UForm :schema="schema" :state="state" @submit="handleSubmit" class="space-y-4">
        <!-- 当前项目名称 -->
        <div class="p-3 bg-gray-800 rounded-lg">
          <div class="text-sm text-gray-400 mb-1">{{ t('projects.currentName') || '当前名称' }}</div>
          <div class="font-medium text-white">{{ project?.name }}</div>
        </div>

        <!-- 新项目名称 -->
        <UFormGroup :label="t('projects.newProjectName') || '新项目名称'" name="name" required>
          <UInput
            v-model="state.name"
            :placeholder="t('projects.enterNewName') || '输入新的项目名称'"
            size="lg"
            :ui="{ icon: { trailing: { pointer: '' } } }"
          >
            <template #trailing>
              <UButton
                v-show="state.name !== ''"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark-20-solid"
                :padded="false"
                @click="state.name = ''"
              />
            </template>
          </UInput>
        </UFormGroup>

        <!-- 项目描述（可选） -->
        <UFormGroup :label="t('projects.projectDescription')" name="description">
          <UTextarea
            v-model="state.description"
            :placeholder="t('projects.updateDescription') || '更新项目描述（可选）'"
            :rows="3"
            resize
          />
        </UFormGroup>

        <!-- 提示信息 -->
        <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div class="flex gap-2">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-blue-300">
              <p class="font-medium mb-1">{{ t('projects.renameInstructions') || '重命名说明：' }}</p>
              <ul class="text-xs space-y-1 text-blue-200">
                <li>• {{ t('projects.renameNote1') || '只会更改项目的显示名称' }}</li>
                <li>• {{ t('projects.renameNote2') || '项目文件夹和路径不会改变' }}</li>
                <li>• {{ t('projects.renameNote3') || '项目内部引用保持不变' }}</li>
              </ul>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton @click="handleCancel" variant="ghost">
              {{ t('common.cancel') }}
            </UButton>
            <UButton
              type="submit"
              color="green"
              :loading="loading"
              :disabled="!state.name.trim() || state.name === project?.name"
            >
              {{ t('projects.rename') || '重命名' }}
            </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup>
import { z } from 'zod'

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['update:modelValue', 'rename'])

// i18n
const { t } = useI18n()

// 响应式数据
const loading = ref(false)

// 表单状态
const state = reactive({
  name: '',
  description: ''
})

// 表单验证schema
const schema = z.object({
  name: z.string()
    .min(1, '项目名称不能为空')
    .max(50, '项目名称不能超过50个字符')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/, '项目名称只能包含字母、数字、中文、下划线、连字符和空格'),
  description: z.string().max(200, '描述不能超过200个字符').optional()
})

// 计算属性
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听项目变化，更新表单状态
watch(() => props.project, (newProject) => {
  if (newProject) {
    state.name = newProject.name
    state.description = newProject.description || ''
  }
}, { immediate: true })

// 监听模态框打开状态
watch(isOpen, (newValue) => {
  if (newValue && props.project) {
    // 模态框打开时重置表单
    state.name = props.project.name
    state.description = props.project.description || ''
  }
})

// 处理表单提交
async function handleSubmit() {
  if (!props.project) return

  loading.value = true
  try {
    console.log('🔄 开始重命名项目...')

    // 调用重命名API
    const response = await $fetch(`/api/projects/${props.project.id}/rename`, {
      method: 'PATCH',
      body: {
        name: state.name.trim(),
        description: state.description.trim()
      }
    })

    if (response.success) {
      console.log('✅ 项目重命名成功')

      // 发送重命名事件
      emit('rename', {
        ...props.project,
        name: state.name.trim(),
        description: state.description.trim()
      })

      // 显示成功消息
      const toast = useToast()
      toast.add({
        title: t('projects.renameSuccess'),
        description: t('projects.renameSuccessMessage', { name: state.name }) || `项目已重命名为 "${state.name}"`,
        icon: 'i-heroicons-check-circle',
        color: 'green'
      })

      // 关闭模态框
      isOpen.value = false
    } else {
      throw new Error(response.message || '重命名失败')
    }
  } catch (error) {
    console.error('❌ 项目重命名失败:', error)

    const toast = useToast()
    toast.add({
      title: t('projects.renameFailed'),
      description: error.message || t('projects.renameError') || '重命名项目时发生错误',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// 处理取消
function handleCancel() {
  isOpen.value = false

  // 重置表单状态
  if (props.project) {
    state.name = props.project.name
    state.description = props.project.description || ''
  }
}

// 键盘快捷键
onMounted(() => {
  const handleKeydown = (event) => {
    if (isOpen.value) {
      if (event.key === 'Escape') {
        handleCancel()
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (state.name.trim() && state.name !== props.project?.name) {
          handleSubmit()
        }
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
/* 自定义样式 */
</style>
