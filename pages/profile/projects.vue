<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 页面头部 -->
    <div class="border-b border-gray-800 bg-gray-900/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- 标题和面包屑 -->
          <div class="flex items-center space-x-4">
            <UButton
              @click="navigateTo('/')"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              {{ t('common.back') }}
            </UButton>
            <div class="h-6 w-px bg-gray-600"></div>
            <h1 class="text-xl font-semibold text-white">{{ t('projects.title') }}</h1>
            <UBadge color="green" variant="subtle">
              {{ t('projects.projectCount', { count: projectStore.recentProjects.length }) }}
            </UBadge>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center space-x-3">
            <UButton
              @click="refreshProjects"
              :loading="projectStore.isLoading"
              variant="ghost"
              icon="i-heroicons-arrow-path"
              size="sm"
            >
              {{ t('common.refresh') }}
            </UButton>
            <UButton
              @click="showCreateModal = true"
              icon="i-heroicons-plus"
              color="green"
              size="sm"
            >
              {{ t('projects.createProject') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 搜索和筛选栏 -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 搜索框 -->
          <div class="flex-1">
            <UInput
              v-model="searchQuery"
              placeholder="搜索项目名称或描述..."
              icon="i-heroicons-magnifying-glass"
              size="lg"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  v-show="searchQuery !== ''"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-x-mark-20-solid"
                  :padded="false"
                  @click="searchQuery = ''"
                />
              </template>
            </UInput>
          </div>

          <!-- 排序选择 -->
          <USelectMenu
            v-model="sortBy"
            :options="sortOptions"
            size="lg"
            class="w-full sm:w-48"
          />

          <!-- 视图切换 -->
          <UButtonGroup size="lg" orientation="horizontal">
            <UButton
              :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
              icon="i-heroicons-squares-2x2"
              @click="viewMode = 'grid'"
            />
            <UButton
              :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              icon="i-heroicons-list-bullet"
              @click="viewMode = 'list'"
            />
          </UButtonGroup>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="projectStore.isLoading" class="flex justify-center py-12">
        <div class="text-center">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p class="text-gray-400">正在加载项目...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="projectStore.error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-white mb-2">加载失败</h3>
        <p class="text-gray-400 mb-4">{{ projectStore.error }}</p>
        <UButton @click="refreshProjects" color="green">重试</UButton>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredProjects.length === 0 && !searchQuery" class="text-center py-16">
        <UIcon name="i-heroicons-folder-plus" class="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h3 class="text-xl font-semibold text-white mb-2">还没有项目</h3>
        <p class="text-gray-400 mb-6">创建您的第一个QAQ游戏项目开始开发吧！</p>
        <UButton @click="showCreateModal = true" color="green" size="lg">
          <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
          创建新项目
        </UButton>
      </div>

      <!-- 搜索无结果 -->
      <div v-else-if="filteredProjects.length === 0 && searchQuery" class="text-center py-16">
        <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h3 class="text-xl font-semibold text-white mb-2">未找到匹配的项目</h3>
        <p class="text-gray-400 mb-6">尝试使用不同的关键词搜索</p>
        <UButton @click="searchQuery = ''" variant="outline">清除搜索</UButton>
      </div>

      <!-- 项目列表 - 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProjectCard
          v-for="project in paginatedProjects"
          :key="project.id"
          :project="project"
          @open="openProject"
          @delete="deleteProject"
          @rename="renameProject"
        />
      </div>

      <!-- 项目列表 - 列表视图 -->
      <div v-else class="space-y-4">
        <ProjectListItem
          v-for="project in paginatedProjects"
          :key="project.id"
          :project="project"
          @open="openProject"
          @delete="deleteProject"
          @rename="renameProject"
        />
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="mt-8 flex justify-center">
        <UPagination
          v-model="currentPage"
          :page-count="pageSize"
          :total="filteredProjects.length"
          :ui="{
            wrapper: 'flex items-center gap-1',
            rounded: '!rounded-full min-w-[32px] justify-center',
            default: {
              activeButton: {
                variant: 'outline'
              }
            }
          }"
        />
      </div>
    </div>

    <!-- 创建项目模态框 -->
    <CreateProjectModal
      v-model="showCreateModal"
      @create="handleProjectCreated"
    />

    <!-- 重命名项目模态框 -->
    <RenameProjectModal
      v-model="showRenameModal"
      :project="selectedProject"
      @rename="handleProjectRenamed"
    />

    <!-- 删除确认模态框 -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-400" />
            <h3 class="text-lg font-semibold">删除项目</h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-300">
            确定要删除项目 <span class="font-semibold text-white">"{{ selectedProject?.name }}"</span> 吗？
          </p>
          <p class="text-sm text-red-400">
            ⚠️ 此操作无法撤销，项目文件和数据将被永久删除。
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton @click="showDeleteModal = false" variant="ghost">
              取消
            </UButton>
            <UButton @click="confirmDelete" color="red" :loading="deleting">
              删除项目
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// 页面元数据
definePageMeta({
  title: '我的项目',
  middleware: 'auth'
})

// 使用stores和i18n
const authStore = useAuthStore()
const projectStore = useProjectStore()
const { t } = useI18n()

// 响应式数据
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const selectedProject = ref(null)
const deleting = ref(false)

// 搜索和筛选
const searchQuery = ref('')
const sortBy = ref('lastOpened')
const viewMode = ref('grid')

// 分页
const currentPage = ref(1)
const pageSize = 12

// 排序选项
const sortOptions = [
  { label: '最近打开', value: 'lastOpened' },
  { label: '创建时间', value: 'createdAt' },
  { label: '项目名称', value: 'name' },
  { label: '更新时间', value: 'updatedAt' }
]

// 计算属性
const filteredProjects = computed(() => {
  let projects = [...projectStore.recentProjects]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    projects = projects.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    )
  }

  // 排序
  projects.sort((a, b) => {
    const field = sortBy.value
    if (field === 'name') {
      return a[field].localeCompare(b[field])
    } else {
      return new Date(b[field]) - new Date(a[field])
    }
  })

  return projects
})

const totalPages = computed(() => Math.ceil(filteredProjects.value.length / pageSize))

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredProjects.value.slice(start, end)
})

// 方法
async function refreshProjects() {
  try {
    await projectStore.fetchUserProjects()
  } catch (error) {
    console.error('刷新项目列表失败:', error)
  }
}

function openProject(project) {
  console.log('打开项目:', project.name)
  // TODO: 实现项目打开逻辑
  navigateTo(`/editor?project=${project.id}`)
}

function deleteProject(project) {
  selectedProject.value = project
  showDeleteModal.value = true
}

function renameProject(project) {
  selectedProject.value = project
  showRenameModal.value = true
}

async function confirmDelete() {
  if (!selectedProject.value) return

  deleting.value = true
  try {
    // TODO: 调用删除项目API
    console.log('删除项目:', selectedProject.value.name)

    // 从store中移除项目
    projectStore.removeFromRecentProjects(selectedProject.value.id)

    showDeleteModal.value = false
    selectedProject.value = null

    // 显示成功消息
    const toast = useToast()
    toast.add({
      title: '项目已删除',
      description: '项目已成功删除',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (error) {
    console.error('删除项目失败:', error)
    const toast = useToast()
    toast.add({
      title: '删除失败',
      description: error.message || '删除项目时发生错误',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

function handleProjectCreated(project) {
  console.log('项目创建成功:', project)
  showCreateModal.value = false

  // 刷新项目列表
  refreshProjects()

  // 显示成功消息
  const toast = useToast()
  toast.add({
    title: '项目创建成功',
    description: `项目 "${project.name}" 已创建`,
    icon: 'i-heroicons-check-circle',
    color: 'green'
  })
}

function handleProjectRenamed(project) {
  console.log('项目重命名成功:', project)
  showRenameModal.value = false
  selectedProject.value = null

  // 刷新项目列表
  refreshProjects()
}

// 页面挂载时加载项目
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await refreshProjects()
  }
})

// 监听搜索变化，重置分页
watch(searchQuery, () => {
  currentPage.value = 1
})

watch(sortBy, () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* 自定义样式 */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
