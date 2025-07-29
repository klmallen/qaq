<template>
  <div class="qaq-project-manager min-h-screen" style="background-color: var(--qaq-bg-primary)">
    <!-- Header -->
    <div class="p-4" style="background-color: var(--qaq-bg-secondary)">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-4">
          <UButton
            @click="navigateTo('/')"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            size="sm"
          />
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-cube-transparent" class="w-8 h-8" style="color: var(--qaq-accent)" />
            <h1 class="text-2xl font-bold" style="color: var(--qaq-text-primary)">Project Manager</h1>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <UButton
            @click="refreshProjects"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            size="sm"
            title="Refresh Projects"
          />
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6">
      <!-- Tabs -->
      <UTabs v-model="activeTab" :items="tabs" class="mb-8" />

      <!-- Projects Tab -->
      <div v-if="activeTab === 0">
        <!-- Actions -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Search projects..."
              class="w-80"
            />
          </div>

          <div class="flex items-center space-x-2">
            <UButton
              @click="showCreateDialog = true"
              icon="i-heroicons-plus"
              size="lg"
            >
              New Project
            </UButton>
            <UButton
              @click="importProject"
              variant="outline"
              icon="i-heroicons-folder-open"
              size="lg"
            >
              Import
            </UButton>
          </div>
        </div>

        <!-- System Status -->
        <div class="mb-8">
          <QaqStatusCheck />
        </div>

        <!-- Projects Grid -->
        <div v-if="filteredProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UCard
            v-for="project in filteredProjects"
            :key="project.id"
            class="hover:bg-gray-800 transition-colors cursor-pointer group"
            @click="openProject(project)"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <UIcon name="i-heroicons-folder" class="w-8 h-8 text-primary-500" />
                <UDropdown :items="getProjectMenuItems(project)">
                  <UButton
                    @click.stop
                    variant="ghost"
                    icon="i-heroicons-ellipsis-vertical"
                    size="sm"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </UDropdown>
              </div>
            </template>

            <div>
              <h3 class="text-lg font-semibold text-white mb-2 truncate">{{ project.name }}</h3>
              <p class="text-sm text-gray-400 mb-3 truncate">{{ project.path }}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ formatDate(project.lastOpened) }}</span>
                <UBadge :color="project.settings.renderer === '3D' ? 'blue' : 'green'" size="xs">
                  {{ project.settings.renderer }}
                </UBadge>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <UIcon name="i-heroicons-folder" class="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h3 class="text-2xl font-semibold text-gray-400 mb-4">
            {{ searchQuery ? 'No projects found' : 'No projects yet' }}
          </h3>
          <p class="text-gray-500 mb-8 max-w-md mx-auto">
            {{ searchQuery
              ? 'Try adjusting your search terms or create a new project.'
              : 'Create your first project or import an existing one to get started with QAQ Game Engine.'
            }}
          </p>
          <div class="flex justify-center space-x-4">
            <UButton
              @click="showCreateDialog = true"
              icon="i-heroicons-plus"
              size="lg"
            >
              Create New Project
            </UButton>
            <UButton
              @click="importProject"
              variant="outline"
              icon="i-heroicons-folder-open"
              size="lg"
            >
              Import Project
            </UButton>
          </div>
        </div>
      </div>

      <!-- Templates Tab -->
      <div v-else-if="activeTab === 1">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Project Templates</h2>
          <p class="text-gray-400">Choose a template to get started quickly with your new project.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="template in projectTemplates"
            :key="template.id"
            class="hover:bg-gray-800 transition-colors cursor-pointer"
            @click="createFromTemplate(template)"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <UIcon :name="template.icon" class="w-8 h-8 text-primary-500" />
                <UBadge :color="template.category === '2D' ? 'green' : template.category === '3D' ? 'blue' : 'gray'" size="xs">
                  {{ template.category }}
                </UBadge>
              </div>
            </template>

            <div>
              <h3 class="text-lg font-semibold text-white mb-2">{{ template.name }}</h3>
              <p class="text-sm text-gray-400">{{ template.description }}</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 2">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Settings</h2>
          <p class="text-gray-400">Configure your project manager preferences.</p>
        </div>

        <div class="max-w-2xl">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-white">General Settings</h3>
            </template>

            <div class="space-y-6">
              <UFormGroup label="Default Project Location">
                <UInput
                  v-model="settings.defaultProjectPath"
                  placeholder="~/Documents/QAQ Projects"
                />
              </UFormGroup>

              <UFormGroup label="Preferences">
                <div class="space-y-3">
                  <UCheckbox
                    v-model="settings.autoOpenLastProject"
                    label="Auto-open last project on startup"
                  />
                  <UCheckbox
                    v-model="settings.showRecentProjects"
                    label="Show recent projects on home screen"
                  />
                  <UCheckbox
                    v-model="settings.checkForUpdates"
                    label="Check for updates automatically"
                  />
                </div>
              </UFormGroup>

              <UFormGroup label="Editor Theme">
                <USelect
                  v-model="settings.theme"
                  :options="themeOptions"
                />
              </UFormGroup>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-model="showCreateDialog"
      @create="handleCreateProject"
    />
  </div>
</template>

<script setup>
// 页面元数据
definePageMeta({
  title: 'Project Manager',
  layout: 'default'
})

// 使用 Pinia stores
const projectStore = useProjectStore()
const route = useRoute()

// 响应式数据
const activeTab = ref(0)
const searchQuery = ref('')
const showCreateDialog = ref(false)

// 设置
const settings = reactive({
  defaultProjectPath: '~/Documents/QAQ Projects',
  autoOpenLastProject: false,
  showRecentProjects: true,
  checkForUpdates: true,
  theme: 'dark'
})

// 标签页配置
const tabs = [
  { label: 'Projects', icon: 'i-heroicons-folder' },
  { label: 'Templates', icon: 'i-heroicons-document-text' },
  { label: 'Settings', icon: 'i-heroicons-cog-6-tooth' }
]

// 主题选项
const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' }
]

// 项目模板
const projectTemplates = [
  {
    id: '2d-game',
    name: '2D Game',
    description: 'A basic 2D game template with player movement and collision',
    icon: 'i-heroicons-rectangle-stack',
    category: '2D'
  },
  {
    id: '3d-game',
    name: '3D Game',
    description: 'A basic 3D game template with first-person controller',
    icon: 'i-heroicons-cube',
    category: '3D'
  },
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Start with a completely empty project',
    icon: 'i-heroicons-document',
    category: 'Basic'
  },
  {
    id: 'platformer-2d',
    name: '2D Platformer',
    description: 'Side-scrolling platformer with physics and animations',
    icon: 'i-heroicons-play',
    category: '2D'
  },
  {
    id: 'fps-3d',
    name: '3D FPS',
    description: 'First-person shooter template with weapons and enemies',
    icon: 'i-heroicons-eye',
    category: '3D'
  },
  {
    id: 'puzzle',
    name: 'Puzzle Game',
    description: 'Grid-based puzzle game template',
    icon: 'i-heroicons-puzzle-piece',
    category: '2D'
  }
]

// 计算属性
const filteredProjects = computed(() => {
  if (!searchQuery.value) {
    return projectStore.recentProjects
  }
  return projectStore.recentProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    project.path.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 项目菜单项
function getProjectMenuItems(project) {
  return [
    [
      {
        label: 'Open',
        icon: 'i-heroicons-folder-open',
        click: () => openProject(project)
      },
      {
        label: 'Show in Explorer',
        icon: 'i-heroicons-folder',
        click: () => showInExplorer(project)
      }
    ],
    [
      {
        label: 'Remove from List',
        icon: 'i-heroicons-x-mark',
        click: () => removeProject(project)
      }
    ]
  ]
}

// 方法
async function openProject(project) {
  try {
    await projectStore.openProject(project.path)
    navigateTo('/editor')
  } catch (error) {
    console.error('Failed to open project:', error)
  }
}

function removeProject(project) {
  projectStore.removeFromRecentProjects(project.path)
}

function showInExplorer(project) {
  console.log('Show in explorer:', project.path)
  // TODO: 实现在文件管理器中显示
}

function importProject() {
  console.log('Import project')
  // TODO: 实现导入项目
}

function refreshProjects() {
  projectStore.loadRecentProjects()
}

function createFromTemplate(template) {
  console.log('Create from template:', template.name)
  showCreateDialog.value = true
}

async function handleCreateProject(projectData) {
  try {
    await projectStore.createProject(
      projectData.name,
      projectData.path,
      projectData.template,
      projectData.renderer
    )
    navigateTo('/editor')
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 页面挂载时处理 URL 参数
onMounted(() => {
  const action = route.query.action
  if (action === 'new') {
    showCreateDialog.value = true
  } else if (action === 'import') {
    importProject()
  }

  // 加载最近项目
  projectStore.loadRecentProjects()
})
</script>
