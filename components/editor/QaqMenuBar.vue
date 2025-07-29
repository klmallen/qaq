<template>
  <div class="qaq-menubar">
    <!-- 主菜单 -->
    <div class="qaq-menubar-menus">
      <UDropdown
        v-for="menu in menus"
        :key="menu.label"
        :items="menu.items"
        :popper="{ placement: 'bottom-start' }"
      >
        <UButton
          :label="menu.label"
          variant="ghost"
          size="xs"
          class="qaq-menu-button"
          @click="handleMenuClick(menu)"
        />
      </UDropdown>
    </div>

    <!-- 工具栏按钮 -->
    <div class="qaq-menubar-toolbar">
      <!-- 场景控制 -->
      <div class="qaq-toolbar-group">
        <UButton
          icon="i-heroicons-play"
          variant="ghost"
          size="xs"
          title="Run Scene (F5)"
          @click="runScene"
        />
        <UButton
          icon="i-heroicons-pause"
          variant="ghost"
          size="xs"
          title="Pause Scene (F6)"
          @click="pauseScene"
        />
        <UButton
          icon="i-heroicons-stop"
          variant="ghost"
          size="xs"
          title="Stop Scene (F8)"
          @click="stopScene"
        />
      </div>

      <!-- 分隔符 -->
      <div class="qaq-toolbar-separator"></div>

      <!-- 视图控制 -->
      <div class="qaq-toolbar-group">
        <UButton
          icon="i-heroicons-eye"
          variant="ghost"
          size="xs"
          title="Toggle Visibility"
          @click="toggleVisibility"
        />
        <UButton
          icon="i-heroicons-lock-closed"
          variant="ghost"
          size="xs"
          title="Toggle Lock"
          @click="toggleLock"
        />
        <UButton
          icon="i-heroicons-squares-2x2"
          variant="ghost"
          size="xs"
          title="Toggle Grid"
          @click="toggleGrid"
        />
      </div>
    </div>

    <!-- 右侧信息 -->
    <div class="qaq-menubar-info">
      <span class="qaq-project-name">{{ projectStore.currentProject?.name || 'No Project' }}</span>

      <!-- 用户信息和登出 -->
      <div class="qaq-user-section">
        <UDropdown
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton
            variant="ghost"
            size="xs"
            class="qaq-user-button"
          >
            <template #leading>
              <UAvatar
                :src="authStore.user?.avatar"
                :alt="authStore.userDisplayName"
                size="xs"
                :ui="{ background: 'bg-primary-500' }"
              >
                <template #fallback>
                  <Icon name="heroicons:user" class="w-3 h-3" />
                </template>
              </UAvatar>
            </template>
            <span class="qaq-user-name">{{ authStore.userDisplayName }}</span>
            <template #trailing>
              <Icon name="heroicons:chevron-down" class="w-3 h-3" />
            </template>
          </UButton>
        </UDropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project'
import { useEditorStore } from '~/stores/editor'
import { useAuthStore } from '~/stores/auth'

// ============================================================================
// Emits
// ============================================================================

interface Emits {
  (e: 'create-project'): void
  (e: 'open-project'): void
  (e: 'open-material-editor'): void
  (e: 'open-vueflow-material-editor'): void
  (e: 'open-terrain-editor'): void
  (e: 'toggle-panel', panelId: string): void
}

const emit = defineEmits<Emits>()

// 状态管理
const projectStore = useProjectStore()
const editorStore = useEditorStore()
const authStore = useAuthStore()
const router = useRouter()

// 菜单配置
const menus = [
  {
    label: 'Scene',
    items: [
      [
        {
          label: 'New Project',
          icon: 'i-heroicons-folder-plus',
          shortcuts: ['Ctrl', 'Shift', 'N'],
          click: () => createNewProject()
        },
        {
          label: 'Open Project',
          icon: 'i-heroicons-folder-open',
          shortcuts: ['Ctrl', 'Shift', 'O'],
          click: () => openProject()
        }
      ],
      [
        {
          label: 'New Scene',
          icon: 'i-heroicons-plus',
          shortcuts: ['Ctrl', 'N'],
          click: () => createNewScene()
        },
        {
          label: 'Open Scene',
          icon: 'i-heroicons-folder-open',
          shortcuts: ['Ctrl', 'O'],
          click: () => openScene()
        },
        {
          label: 'Save Scene',
          icon: 'i-heroicons-document-arrow-down',
          shortcuts: ['Ctrl', 'S'],
          click: () => saveScene()
        },
        {
          label: 'Save Scene As...',
          icon: 'i-heroicons-document-duplicate',
          shortcuts: ['Ctrl', 'Shift', 'S'],
          click: () => saveSceneAs()
        }
      ],
      [
        {
          label: 'Import',
          icon: 'i-heroicons-arrow-down-tray',
          click: () => importAssets()
        },
        {
          label: 'Export',
          icon: 'i-heroicons-arrow-up-tray',
          click: () => exportScene()
        }
      ],
      [
        {
          label: 'Project Settings',
          icon: 'i-heroicons-cog-6-tooth',
          click: () => openProjectSettings()
        },
        {
          label: 'Close Project',
          icon: 'i-heroicons-x-mark',
          click: () => closeProject()
        }
      ]
    ]
  },
  {
    label: 'Edit',
    items: [
      [
        {
          label: 'Undo',
          icon: 'i-heroicons-arrow-uturn-left',
          shortcuts: ['Ctrl', 'Z'],
          click: () => undo()
        },
        {
          label: 'Redo',
          icon: 'i-heroicons-arrow-uturn-right',
          shortcuts: ['Ctrl', 'Y'],
          click: () => redo()
        }
      ],
      [
        {
          label: 'Cut',
          icon: 'i-heroicons-scissors',
          shortcuts: ['Ctrl', 'X'],
          click: () => cut()
        },
        {
          label: 'Copy',
          icon: 'i-heroicons-document-duplicate',
          shortcuts: ['Ctrl', 'C'],
          click: () => copy()
        },
        {
          label: 'Paste',
          icon: 'i-heroicons-clipboard',
          shortcuts: ['Ctrl', 'V'],
          click: () => paste()
        }
      ],
      [
        {
          label: 'Delete',
          icon: 'i-heroicons-trash',
          shortcuts: ['Delete'],
          click: () => deleteSelected()
        },
        {
          label: 'Duplicate',
          icon: 'i-heroicons-squares-plus',
          shortcuts: ['Ctrl', 'D'],
          click: () => duplicate()
        }
      ]
    ]
  },
  {
    label: 'View',
    items: [
      [
        {
          label: 'Toggle Scene Tree',
          icon: 'i-heroicons-list-bullet',
          shortcuts: ['F1'],
          click: () => toggleSceneTree()
        },
        {
          label: 'Toggle Inspector',
          icon: 'i-heroicons-adjustments-horizontal',
          shortcuts: ['F2'],
          click: () => toggleInspector()
        },
        {
          label: 'Toggle FileSystem',
          icon: 'i-heroicons-folder',
          shortcuts: ['F3'],
          click: () => toggleFileSystem()
        },
        {
          label: 'Toggle Bottom Panel',
          icon: 'i-heroicons-rectangle-stack',
          shortcuts: ['F4'],
          click: () => toggleBottomPanel()
        }
      ],
      [
        {
          label: 'Fullscreen',
          icon: 'i-heroicons-arrows-pointing-out',
          shortcuts: ['F11'],
          click: () => toggleFullscreen()
        }
      ]
    ]
  },
  {
    label: 'Tools',
    items: [
      [
        {
          label: 'Script Editor',
          icon: 'i-heroicons-code-bracket',
          click: () => openScriptEditor()
        },
        {
          label: 'Material Editor',
          icon: 'i-heroicons-swatch',
          click: () => openMaterialEditor()
        },
        {
          label: 'Vue Flow Material Editor',
          icon: 'i-heroicons-squares-plus',
          click: () => openVueFlowMaterialEditor()
        },
        {
          label: 'Animation Editor',
          icon: 'i-heroicons-play-circle',
          click: () => openAnimationEditor()
        },
        {
          label: 'Terrain Editor',
          icon: 'i-heroicons-globe-alt',
          click: () => openTerrainEditor()
        }
      ],
      [
        {
          label: 'Asset Library',
          icon: 'i-heroicons-building-storefront',
          click: () => openAssetLibrary()
        },
        {
          label: 'Version Control',
          icon: 'i-heroicons-code-bracket-square',
          click: () => openVersionControl()
        }
      ]
    ]
  },
  {
    label: 'Help',
    items: [
      [
        {
          label: 'Documentation',
          icon: 'i-heroicons-book-open',
          click: () => openDocumentation()
        },
        {
          label: 'Tutorials',
          icon: 'i-heroicons-academic-cap',
          click: () => openTutorials()
        }
      ],
      [
        {
          label: 'Report Bug',
          icon: 'i-heroicons-bug-ant',
          click: () => reportBug()
        },
        {
          label: 'About',
          icon: 'i-heroicons-information-circle',
          click: () => showAbout()
        }
      ]
    ]
  }
]

// ========================================================================
// 菜单操作
// ========================================================================

function handleMenuClick(menu: any) {
  // 处理菜单点击（如果需要的话）
}

// Project 菜单
function createNewProject() {
  console.log('Create new project')
  // 触发父组件的项目创建对话框
  emit('create-project')
}

function openProject() {
  console.log('Open project')
  // 触发父组件的项目打开对话框
  emit('open-project')
}

// Scene 菜单
function createNewScene() {
  console.log('Create new scene')
  // TODO: 实现新建场景
}

function openScene() {
  console.log('Open scene')
  // TODO: 实现打开场景
}

function saveScene() {
  console.log('Save scene')
  // TODO: 实现保存场景
}

function saveSceneAs() {
  console.log('Save scene as')
  // TODO: 实现另存为场景
}

function importAssets() {
  console.log('Import assets')
  // TODO: 实现导入资源
}

function exportScene() {
  console.log('Export scene')
  // TODO: 实现导出场景
}

function openProjectSettings() {
  console.log('Open project settings')
  // TODO: 实现项目设置
}

function closeProject() {
  console.log('Close project')
  navigateTo('/')
}

// Edit 菜单
function undo() {
  console.log('Undo')
  // TODO: 实现撤销
}

function redo() {
  console.log('Redo')
  // TODO: 实现重做
}

function cut() {
  console.log('Cut')
  // TODO: 实现剪切
}

function copy() {
  console.log('Copy')
  // TODO: 实现复制
}

function paste() {
  console.log('Paste')
  // TODO: 实现粘贴
}

function deleteSelected() {
  console.log('Delete selected')
  // TODO: 实现删除选中项
}

function duplicate() {
  console.log('Duplicate')
  // TODO: 实现复制选中项
}

// View 菜单
function toggleSceneTree() {
  emit('toggle-panel', 'sceneTree')
}

function toggleInspector() {
  emit('toggle-panel', 'inspector')
}

function toggleFileSystem() {
  emit('toggle-panel', 'filesystem')
}

function toggleBottomPanel() {
  emit('toggle-panel', 'output')
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

// Tools 菜单
function openScriptEditor() {
  console.log('Open script editor')
  // TODO: 实现脚本编辑器
}

function openMaterialEditor() {
  console.log('🎨 Opening Material Editor')
  emit('open-material-editor')
}

function openVueFlowMaterialEditor() {
  console.log('🎨 Opening Vue Flow Material Editor')
  emit('open-vueflow-material-editor')
}

function openAnimationEditor() {
  console.log('🎬 Opening Animation State Machine Editor')
  emit('open-animation-editor')
}

function openTerrainEditor() {
  console.log('🏔️ Opening Terrain Editor')
  emit('open-terrain-editor')
}

function openAssetLibrary() {
  console.log('Open asset library')
  // TODO: 实现资源库
}

function openVersionControl() {
  console.log('Open version control')
  // TODO: 实现版本控制
}

// Help 菜单
function openDocumentation() {
  window.open('https://docs.qaq-engine.com', '_blank')
}

function openTutorials() {
  window.open('https://tutorials.qaq-engine.com', '_blank')
}

function reportBug() {
  window.open('https://github.com/qaq-engine/qaq-engine/issues', '_blank')
}

function showAbout() {
  console.log('Show about')
  // TODO: 实现关于对话框
}

// ========================================================================
// 工具栏操作
// ========================================================================

function runScene() {
  console.log('Run scene')
  // TODO: 实现运行场景
}

function pauseScene() {
  console.log('Pause scene')
  // TODO: 实现暂停场景
}

function stopScene() {
  console.log('Stop scene')
  // TODO: 实现停止场景
}

function toggleVisibility() {
  console.log('Toggle visibility')
  // TODO: 实现切换可见性
}

function toggleLock() {
  console.log('Toggle lock')
  // TODO: 实现切换锁定
}

function toggleGrid() {
  console.log('Toggle grid')
  // TODO: 实现切换网格
}

// ============================================================================
// 用户菜单
// ============================================================================

// 用户菜单项
const userMenuItems = computed(() => [
  [
    {
      label: '个人资料',
      icon: 'i-heroicons-user',
      click: () => openProfile()
    },
    {
      label: '账户设置',
      icon: 'i-heroicons-cog-6-tooth',
      click: () => openAccountSettings()
    }
  ],
  [
    {
      label: '帮助与支持',
      icon: 'i-heroicons-question-mark-circle',
      click: () => openHelp()
    },
    {
      label: '关于 QAQ',
      icon: 'i-heroicons-information-circle',
      click: () => openAbout()
    }
  ],
  [
    {
      label: '登出',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: () => handleLogout()
    }
  ]
])

// 用户菜单功能
function openProfile() {
  console.log('Open profile')
  // TODO: 实现打开个人资料
}

function openAccountSettings() {
  console.log('Open account settings')
  // TODO: 实现打开账户设置
}

function openHelp() {
  console.log('Open help')
  // TODO: 实现打开帮助
}

function openAbout() {
  console.log('Open about')
  // TODO: 实现打开关于页面
}

async function handleLogout() {
  try {
    await authStore.logout()
    await router.push('/auth/login')
  } catch (error) {
    console.error('登出失败:', error)
  }
}
</script>

<style scoped>
.qaq-menubar {
  height: 32px;
  display: flex;
  align-items: center;
  background-color: var(--qaq-menubar-bg, #3c3c3c);
  border-bottom: 1px solid var(--qaq-border, #555555);
  padding: 0 8px;
  font-size: 12px;
}

.qaq-menubar-menus {
  display: flex;
  align-items: center;
  gap: 2px;
}

.qaq-menu-button {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--qaq-text, #ffffff);
}

.qaq-menu-button:hover {
  background-color: var(--qaq-hover-bg, #4a4a4a);
}

.qaq-menubar-toolbar {
  display: flex;
  align-items: center;
  margin-left: 16px;
  gap: 8px;
}

.qaq-toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.qaq-toolbar-separator {
  width: 1px;
  height: 20px;
  background-color: var(--qaq-border, #555555);
}

.qaq-menubar-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-project-name {
  font-size: 12px;
  color: var(--qaq-text-secondary, #cccccc);
  font-weight: 500;
}

.qaq-user-section {
  margin-left: 16px;
}

.qaq-user-button {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--qaq-text, #ffffff);
  gap: 6px;
}

.qaq-user-button:hover {
  background-color: var(--qaq-hover-bg, #4a4a4a);
}

.qaq-user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
