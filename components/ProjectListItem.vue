<template>
  <div class="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-green-500/50 transition-all duration-200">
    <div class="flex items-center gap-4">
      <!-- 项目图标 -->
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg flex items-center justify-center">
          <UIcon 
            :name="getProjectIcon(project)" 
            class="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors"
          />
        </div>
      </div>

      <!-- 项目信息 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <!-- 左侧信息 -->
          <div class="flex-1 min-w-0">
            <!-- 项目名称和状态 -->
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-white text-lg truncate group-hover:text-green-400 transition-colors">
                {{ project.name }}
              </h3>
              <UBadge 
                v-if="project.isPublic" 
                color="blue" 
                variant="subtle" 
                size="xs"
              >
                公开
              </UBadge>
            </div>
            
            <!-- 项目描述 -->
            <p class="text-gray-400 text-sm mb-2 line-clamp-1">
              {{ project.description || '暂无描述' }}
            </p>
            
            <!-- 项目统计和信息 -->
            <div class="flex items-center gap-6 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-film" class="w-3 h-3" />
                <span>{{ project.stats?.scenes || 0 }} 场景</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-code-bracket" class="w-3 h-3" />
                <span>{{ project.stats?.scripts || 0 }} 脚本</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-cube" class="w-3 h-3" />
                <span>{{ project.stats?.materials || 0 }} 材质</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-play" class="w-3 h-3" />
                <span>{{ project.stats?.animations || 0 }} 动画</span>
              </div>
              <div class="text-gray-600">|</div>
              <div>v{{ project.version }}</div>
              <div>{{ getProjectType(project) }}</div>
            </div>
          </div>

          <!-- 右侧信息和操作 -->
          <div class="flex-shrink-0 text-right">
            <!-- 时间信息 -->
            <div class="text-sm text-gray-400 mb-2">
              最后打开: {{ formatDate(project.lastOpened) }}
            </div>
            <div class="text-xs text-gray-500 mb-3">
              创建于: {{ formatDate(project.createdAt) }}
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-2">
              <UButton
                @click="$emit('open', project)"
                color="green"
                size="sm"
                icon="i-heroicons-play"
              >
                打开
              </UButton>
              
              <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-ellipsis-vertical"
                />
              </UDropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目路径 -->
    <div class="mt-3 pt-3 border-t border-gray-800">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 text-gray-500">
          <UIcon name="i-heroicons-folder" class="w-3 h-3" />
          <span class="font-mono truncate">{{ project.path }}</span>
        </div>
        <div class="flex items-center gap-4 text-gray-500">
          <span>引擎版本: {{ project.engineVersion }}</span>
          <span>大小: {{ getProjectSize(project) }}</span>
        </div>
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
    label: '重命名',
    icon: 'i-heroicons-pencil',
    click: () => emit('rename', props.project)
  }, {
    label: '复制项目',
    icon: 'i-heroicons-document-duplicate',
    click: () => console.log('复制项目:', props.project.name)
  }, {
    label: '在文件管理器中显示',
    icon: 'i-heroicons-folder-open',
    click: () => console.log('显示文件夹:', props.project.path)
  }],
  [{
    label: '项目设置',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => console.log('项目设置:', props.project.name)
  }, {
    label: '导出项目',
    icon: 'i-heroicons-arrow-down-tray',
    click: () => console.log('导出项目:', props.project.name)
  }, {
    label: '项目信息',
    icon: 'i-heroicons-information-circle',
    click: () => console.log('项目信息:', props.project.name)
  }],
  [{
    label: '删除项目',
    icon: 'i-heroicons-trash',
    click: () => emit('delete', props.project)
  }]
])

// 获取项目图标
function getProjectIcon(project) {
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
    return '2D 游戏'
  } else if (project.settings?.renderer?.type === '3d') {
    return '3D 游戏'
  }
  return '项目'
}

// 获取项目大小（模拟）
function getProjectSize(project) {
  // 这里应该从实际文件系统获取大小
  // 现在返回模拟数据
  const totalAssets = (project.stats?.scenes || 0) + 
                     (project.stats?.scripts || 0) + 
                     (project.stats?.materials || 0) + 
                     (project.stats?.animations || 0) + 
                     (project.stats?.assets || 0)
  
  if (totalAssets < 10) {
    return '< 1 MB'
  } else if (totalAssets < 50) {
    return `${Math.floor(totalAssets / 10)} MB`
  } else {
    return `${Math.floor(totalAssets / 10)} MB`
  }
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
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
