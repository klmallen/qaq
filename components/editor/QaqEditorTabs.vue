<template>
  <div class="qaq-editor-tabs">
    <!-- 标签栏 -->
    <div class="qaq-tabs-bar">
      <div class="qaq-tabs-container">
        <div
          v-for="tab in editorTabs"
          :key="tab.id"
          class="qaq-editor-tab qaq-tab"
          :class="{ 'qaq-tab-active': activeTabId === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <UIcon :name="tab.icon" class="qaq-tab-icon" />
          <span class="qaq-tab-label">{{ tab.label }}</span>
          <UButton
            v-if="tab.closable"
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="xs"
            class="qaq-tab-close"
            @click.stop="closeTab(tab.id)"
          />
        </div>

        <!-- 添加新标签按钮 -->
        <UDropdown :items="newTabOptions" class="qaq-add-tab-dropdown">
          <UButton
            icon="i-heroicons-plus"
            variant="ghost"
            size="sm"
            class="qaq-add-tab-btn"
          />
        </UDropdown>
      </div>

      <!-- 标签栏控制按钮 -->
      <div class="qaq-tabs-controls">
        <UButton
          icon="i-heroicons-squares-2x2"
          variant="ghost"
          size="sm"
          title="Split View"
          @click="toggleSplitView"
        />
        <UButton
          icon="i-heroicons-cog-6-tooth"
          variant="ghost"
          size="sm"
          title="Editor Settings"
          @click="openEditorSettings"
        />
      </div>
    </div>

    <!-- 标签内容区域 -->
    <div class="qaq-tabs-content">
      <!-- 主场景编辑器 -->
      <div
        v-if="activeTabId === 'main-editor'"
        class="qaq-tab-panel qaq-main-editor-panel"
      >
        <slot name="main-editor" />
      </div>

      <!-- 材质编辑器 -->
      <div
        v-else-if="activeTabId === 'material-editor'"
        class="qaq-tab-panel qaq-material-editor-panel"
      >
        <QaqMaterialEditor />
      </div>

      <!-- Vue Flow 材质编辑器 -->
      <div
        v-else-if="activeTabId === 'vueflow-material-editor'"
        class="qaq-tab-panel qaq-vueflow-material-editor-panel"
      >
        <QaqMaterialEditor />
      </div>

      <!-- 脚本编辑器 -->
      <div
        v-else-if="activeTabId === 'script-editor'"
        class="qaq-tab-panel qaq-script-editor-panel"
      >
        <QaqSimpleCodeEditor />
      </div>

      <!-- 代码编辑器 -->
      <div
        v-else-if="activeTabId === 'vscode-editor'"
        class="qaq-tab-panel qaq-code-editor-panel"
      >
        <QaqSimpleCodeEditor />
      </div>

      <!-- 动画编辑器 -->
      <div
        v-else-if="activeTabId === 'animation-editor'"
        class="qaq-tab-panel qaq-animation-editor-panel"
      >
        <QaqAnimationStateMachine />
      </div>

      <!-- 材质编辑器 -->
      <div
        v-else-if="activeTabId === 'material-editor'"
        class="qaq-tab-panel qaq-material-editor-panel"
      >
        <QaqMaterialEditor />
      </div>

      <!-- 地形编辑器 -->
      <div
        v-else-if="activeTabId === 'terrain-editor'"
        class="qaq-tab-panel qaq-terrain-editor-panel"
      >
        <QaqTerrainEditor />
      </div>

      <!-- 项目设置 -->
      <div
        v-else-if="activeTabId === 'project-settings'"
        class="qaq-tab-panel qaq-project-settings-panel"
      >
        <QaqProjectSettings />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'

// 导入编辑器组件
import QaqSimpleCodeEditor from './QaqSimpleCodeEditor.vue'
import QaqAnimationStateMachine from './QaqAnimationStateMachine.vue'
import QaqTerrainEditor from './QaqTerrainEditor.vue'
import QaqMaterialEditor from './material/QaqMaterialEditor.vue'

// 临时占位组件（稍后实现）
const QaqAnimationEditor = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="qaq-placeholder">Animation Editor - Coming Soon</div>' })
)
const QaqProjectSettings = defineAsyncComponent(() =>
  Promise.resolve({ template: '<div class="qaq-placeholder">Project Settings - Coming Soon</div>' })
)

interface EditorTab {
  id: string
  label: string
  icon: string
  closable: boolean
  type: 'editor' | 'tool' | 'settings'
}

// 响应式数据
const activeTabId = ref('main-editor')
const editorTabs = ref<EditorTab[]>([
  {
    id: 'main-editor',
    label: 'Scene Editor',
    icon: 'i-heroicons-cube',
    closable: false,
    type: 'editor'
  }
])

// 新标签选项
const newTabOptions = computed(() => [
  [
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
      label: 'Script Editor',
      icon: 'i-heroicons-code-bracket',
      click: () => openScriptEditor()
    },
    {
      label: 'VSCode Editor',
      icon: 'i-heroicons-code-bracket-square',
      click: () => openVSCodeEditor()
    },
    {
      label: 'Animation Editor',
      icon: 'i-heroicons-film',
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
      label: 'Project Settings',
      icon: 'i-heroicons-cog-6-tooth',
      click: () => openProjectSettings()
    }
  ]
])

// 方法
function setActiveTab(tabId: string) {
  activeTabId.value = tabId
  console.log(`🔄 Switched to tab: ${tabId}`)
}

function closeTab(tabId: string) {
  const tabIndex = editorTabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex >= 0 && editorTabs.value[tabIndex].closable) {
    editorTabs.value.splice(tabIndex, 1)

    // 如果关闭的是当前活动标签，切换到其他标签
    if (activeTabId.value === tabId) {
      if (editorTabs.value.length > 0) {
        const newIndex = Math.min(tabIndex, editorTabs.value.length - 1)
        activeTabId.value = editorTabs.value[newIndex].id
      } else {
        activeTabId.value = 'main-editor'
      }
    }

    console.log(`❌ Closed tab: ${tabId}`)
  }
}

function openMaterialEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'material-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'material-editor',
      label: 'Material Editor',
      icon: 'i-heroicons-swatch',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('material-editor')
}

function openVueFlowMaterialEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'vueflow-material-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'vueflow-material-editor',
      label: 'Vue Flow Material Editor',
      icon: 'i-heroicons-squares-plus',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('vueflow-material-editor')
}

function openScriptEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'script-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'script-editor',
      label: 'Script Editor',
      icon: 'i-heroicons-code-bracket',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('script-editor')
}

function openVSCodeEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'vscode-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'vscode-editor',
      label: 'VSCode Editor',
      icon: 'i-heroicons-code-bracket-square',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('vscode-editor')
}

function openAnimationEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'animation-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'animation-editor',
      label: 'Animation Editor',
      icon: 'i-heroicons-film',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('animation-editor')
}

function openTerrainEditor() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'terrain-editor')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'terrain-editor',
      label: 'Terrain Editor',
      icon: 'i-heroicons-globe-alt',
      closable: true,
      type: 'editor'
    })
  }
  setActiveTab('terrain-editor')
}

function openProjectSettings() {
  const existingTab = editorTabs.value.find(tab => tab.id === 'project-settings')
  if (!existingTab) {
    editorTabs.value.push({
      id: 'project-settings',
      label: 'Project Settings',
      icon: 'i-heroicons-cog-6-tooth',
      closable: true,
      type: 'settings'
    })
  }
  setActiveTab('project-settings')
}

function toggleSplitView() {
  console.log('🔄 Toggle split view')
  // TODO: 实现分屏视图
}

function openEditorSettings() {
  console.log('⚙️ Open editor settings')
  // TODO: 实现编辑器设置
}

// 暴露方法给父组件
defineExpose({
  openMaterialEditor,
  openVueFlowMaterialEditor,
  openScriptEditor,
  openVSCodeEditor,
  openAnimationEditor,
  openTerrainEditor,
  openProjectSettings,
  setActiveTab,
  closeTab
})
</script>

<style scoped>
.qaq-editor-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-editor-bg, #2b2b2b);
}

.qaq-tabs-bar {
  height: 40px;
  display: flex;
  align-items: center;
  background-color: var(--qaq-tabs-bar-bg, #3c3c3c);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-tabs-container {
  flex: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.qaq-tabs-container::-webkit-scrollbar {
  display: none;
}

.qaq-editor-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  min-width: 120px;
  height: 100%;
  background-color: transparent;
  border-right: 1px solid var(--qaq-border, #555555);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.qaq-editor-tab:hover {
  background-color: var(--qaq-hover-bg, #4a4a4a);
}

.qaq-tab-active {
  background-color: var(--qaq-panel-bg, #383838) !important;
  border-bottom: 2px solid var(--qaq-primary, #00DC82);
}

.qaq-tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.qaq-tab-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--qaq-text-primary, #ffffff);
  white-space: nowrap;
}

.qaq-tab-close {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.qaq-editor-tab:hover .qaq-tab-close {
  opacity: 1;
}

.qaq-add-tab-dropdown {
  margin-left: 8px;
}

.qaq-add-tab-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.qaq-tabs-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-left: 1px solid var(--qaq-border, #555555);
}

.qaq-tabs-content {
  flex: 1;
  overflow: hidden;
}

.qaq-tab-panel {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.qaq-main-editor-panel {
  background-color: var(--qaq-editor-bg, #2b2b2b);
}

.qaq-material-editor-panel,
.qaq-script-editor-panel,
.qaq-vscode-editor-panel,
.qaq-animation-editor-panel,
.qaq-project-settings-panel {
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.25rem;
  color: var(--qaq-text-secondary, #cccccc);
}
</style>
