<template>
  <div class="group relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-green-500/50 transition-all duration-200">
    <!-- 项目缩略图/图标 -->
    <div class="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
      <!-- 项目类型图标 -->
      <div class="text-center">
        <UIcon
          :name="getProjectIcon(project)"
          class="w-12 h-12 text-gray-600 group-hover:text-green-400 transition-colors"
        />
        <div class="mt-2 text-xs text-gray-500 uppercase tracking-wide">
          {{ getProjectType(project) }}
        </div>
      </div>

      <!-- 悬停操作按钮 -->
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <UButton
          @click="$emit('open', project)"
          color="green"
          size="sm"
          icon="i-heroicons-play"
        >
          {{ t('common.open') }}
        </UButton>
        <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-start' }">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            icon="i-heroicons-ellipsis-vertical"
          />
        </UDropdown>
      </div>

      <!-- 项目状态标识 -->
      <div class="absolute top-2 right-2">
        <UBadge
          v-if="project.isPublic"
          color="blue"
          variant="subtle"
          size="xs"
        >
          公开
        </UBadge>
      </div>
    </div>

    <!-- 项目信息 -->
    <div class="p-4">
      <!-- 项目名称 -->
      <h3 class="font-semibold text-white text-lg mb-1 truncate group-hover:text-green-400 transition-colors">
        {{ project.name }}
      </h3>

      <!-- 项目描述 -->
      <p class="text-gray-400 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
        {{ project.description || t('projects.noDescription') || '暂无描述' }}
      </p>

      <!-- 项目统计 -->
      <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-film" class="w-3 h-3" />
            <span>{{ project.stats?.scenes || 0 }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-code-bracket" class="w-3 h-3" />
            <span>{{ project.stats?.scripts || 0 }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-cube" class="w-3 h-3" />
            <span>{{ project.stats?.materials || 0 }}</span>
          </div>
        </div>
        <div class="text-right">
          <div>v{{ project.version }}</div>
        </div>
      </div>

      <!-- 最后打开时间 -->
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-500">{{ t('projects.lastOpened') }}</span>
        <span class="text-gray-400">{{ formatDate(project.lastOpened) }}</span>
      </div>
    </div>

    <!-- 快速操作栏 -->
    <div class="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UButton
            @click="$emit('open', project)"
            color="green"
            variant="ghost"
            size="xs"
            icon="i-heroicons-play"
          >
            {{ t('common.open') }}
          </UButton>
          <UButton
            @click="$emit('rename', project)"
            color="gray"
            variant="ghost"
            size="xs"
            icon="i-heroicons-pencil"
          >
            {{ t('projects.rename') }}
          </UButton>
        </div>
        <UButton
          @click="$emit('delete', project)"
          color="red"
          variant="ghost"
          size="xs"
          icon="i-heroicons-trash"
        >
          {{ t('common.delete') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

// 定义emits
const emit = defineEmits(['open', 'delete', 'rename'])

// 下拉菜单项
const dropdownItems = computed(() => [
  [{
    label: '打开项目',
    icon: 'i-heroicons-play',
    click: () => emit('open', props.project)
  }, {
    label: '重命名',
    icon: 'i-heroicons-pencil',
    click: () => emit('rename', props.project)
  }, {
    label: '复制项目',
    icon: 'i-heroicons-document-duplicate',
    click: () => console.log('复制项目:', props.project.name)
  }],
  [{
    label: '项目设置',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => console.log('项目设置:', props.project.name)
  }, {
    label: '导出项目',
    icon: 'i-heroicons-arrow-down-tray',
    click: () => console.log('导出项目:', props.project.name)
  }],
  [{
    label: '删除项目',
    icon: 'i-heroicons-trash',
    click: () => emit('delete', props.project)
  }]
])

// 获取项目图标
function getProjectIcon(project) {
  // 根据项目设置或类型返回不同图标
  if (project.settings?.renderer?.type === '2d') {
    return 'i-heroicons-rectangle-stack'
  } else if (project.settings?.renderer?.type === '3d') {
    return 'i-heroicons-cube'
  }
  return 'i-heroicons-folder'
}

// 获取项目类型
function getProjectType(project) {
  if (project.settings?.renderer?.type === '2d') {
    return '2D Game'
  } else if (project.settings?.renderer?.type === '3d') {
    return '3D Game'
  }
  return 'Project'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未知'

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} 天前`
  } else if (diffDays <= 30) {
    return `${Math.floor(diffDays / 7)} 周前`
  } else if (diffDays <= 365) {
    return `${Math.floor(diffDays / 30)} 个月前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
