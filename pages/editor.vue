<template>
  <div class="qaq-editor">
    <!-- 全局鼠标跟随器 -->
    <QaqMouseFollower
      :enabled="interactiveEffectsEnabled"
      :speed="0.28"
      :size="18"
      color="#00DC82"
      :advanced-effects="true"
      :liquid-deformation="true"
      background-effect="backdrop"
      :perspective-intensity="1200"
    />

    <!-- 编辑器主界面 -->
    <div class="qaq-editor-layout">
      <!-- 顶部菜单栏 -->
      <div class="qaq-editor-header">
        <QaqMenuBar
          @open-material-editor="openMaterialEditor"
          @open-vueflow-material-editor="openVueFlowMaterialEditor"
          @open-animation-editor="openAnimationEditor"
          @open-terrain-editor="openTerrainEditor"
          @toggle-panel="togglePanel"
        />
      </div>



      <!-- 顶级标签系统 -->
      <QaqEditorTabs ref="editorTabs">
        <!-- 主场景编辑器插槽 -->
        <template #main-editor>
          <div class="qaq-main-editor">
            <!-- 可拖拽面板容器 -->
            <div class="qaq-panels-container">
              <!-- 场景树面板 -->
              <QaqTabbedPanel
                v-if="panels.sceneTree.visible"
                :tabs="getTabsForPanel('sceneTree')"
                :active-tab-id="panels.sceneTree.id"
                :width="panels.sceneTree.width"
                :height="panels.sceneTree.height"
                :x="panels.sceneTree.x"
                :y="panels.sceneTree.y"
                :can-resize-right="true"
                :can-resize-bottom="true"
                :merge-enabled="panels.sceneTree.mergeEnabled"
                :allow-stacking="panels.sceneTree.allowStacking"
                @resize="(size) => handlePanelResize('sceneTree', size)"
                @move="(pos) => handlePanelMove('sceneTree', pos)"
                @fullscreen="(fs) => handlePanelFullscreen('sceneTree', fs)"
                @close="() => closePanel('sceneTree')"
                @panel-merge="handlePanelMerge"
                @tab-detach="handleTabDetach"
                @toggle-merge="(enabled) => handleToggleMerge('sceneTree', enabled)"
              >
                <!-- 动态插槽：场景树面板 -->
                <template #scene-tree>
                  <QaqSceneTreeDock />
                </template>
                <!-- 动态插槽：文件系统面板（如果合并到场景树） -->
                <template #filesystem v-if="panelGroups.sceneTree?.includes('filesystem')">
                  <QaqFileSystemDock />
                </template>
                <!-- 动态插槽：检查器面板（如果合并到场景树） -->
                <template #inspector v-if="panelGroups.sceneTree?.includes('inspector')">
                  <QaqInspectorDock />
                </template>
                <!-- 动态插槽：输出面板（如果合并到场景树） -->
                <template #output v-if="panelGroups.sceneTree?.includes('output')">
                  <QaqOutputDock />
                </template>
              </QaqTabbedPanel>

              <!-- 3D视口面板 -->
              <QaqTabbedPanel
                v-if="panels.viewport.visible"
                :tabs="getTabsForPanel('viewport')"
                :active-tab-id="panels.viewport.id"
                :width="panels.viewport.width"
                :height="panels.viewport.height"
                :x="panels.viewport.x"
                :y="panels.viewport.y"
                :can-resize-right="true"
                :can-resize-bottom="true"
                :merge-enabled="panels.viewport.mergeEnabled"
                :allow-stacking="panels.viewport.allowStacking"
                @resize="(size) => handlePanelResize('viewport', size)"
                @move="(pos) => handlePanelMove('viewport', pos)"
                @fullscreen="(fs) => handlePanelFullscreen('viewport', fs)"
                @close="() => closePanel('viewport')"
                @panel-merge="handlePanelMerge"
                @tab-detach="handleTabDetach"
                @toggle-merge="(enabled) => handleToggleMerge('viewport', enabled)"
              >
                <!-- 动态插槽：3D视口面板 -->
                <template #viewport>
                  <QaqViewport3D ref="viewport" />
                </template>
                <!-- 动态插槽：场景树面板（如果合并到视口） -->
                <template #scene-tree v-if="panelGroups.viewport?.includes('scene-tree')">
                  <QaqSceneTreeDock />
                </template>
                <!-- 动态插槽：文件系统面板（如果合并到视口） -->
                <template #filesystem v-if="panelGroups.viewport?.includes('filesystem')">
                  <QaqFileSystemDock />
                </template>
                <!-- 动态插槽：检查器面板（如果合并到视口） -->
                <template #inspector v-if="panelGroups.viewport?.includes('inspector')">
                  <QaqInspectorDock />
                </template>
                <!-- 动态插槽：输出面板（如果合并到视口） -->
                <template #output v-if="panelGroups.viewport?.includes('output')">
                  <QaqOutputDock />
                </template>
              </QaqTabbedPanel>

              <!-- 属性检查器面板 -->
              <QaqTabbedPanel
                v-if="panels.inspector.visible"
                :tabs="getTabsForPanel('inspector')"
                :active-tab-id="panels.inspector.id"
                :width="panels.inspector.width"
                :height="panels.inspector.height"
                :x="panels.inspector.x"
                :y="panels.inspector.y"
                :can-resize-right="false"
                :can-resize-bottom="true"
                :merge-enabled="panels.inspector.mergeEnabled"
                :allow-stacking="panels.inspector.allowStacking"
                @resize="(size) => handlePanelResize('inspector', size)"
                @move="(pos) => handlePanelMove('inspector', pos)"
                @fullscreen="(fs) => handlePanelFullscreen('inspector', fs)"
                @close="() => closePanel('inspector')"
                @panel-merge="handlePanelMerge"
                @tab-detach="handleTabDetach"
                @toggle-merge="(enabled) => handleToggleMerge('inspector', enabled)"
              >
                <!-- 动态插槽：检查器面板 -->
                <template #inspector>
                  <QaqInspectorDock />
                </template>
                <!-- 动态插槽：场景树面板（如果合并到检查器） -->
                <template #scene-tree v-if="panelGroups.inspector?.includes('scene-tree')">
                  <QaqSceneTreeDock />
                </template>
                <!-- 动态插槽：文件系统面板（如果合并到检查器） -->
                <template #filesystem v-if="panelGroups.inspector?.includes('filesystem')">
                  <QaqFileSystemDock />
                </template>
                <!-- 动态插槽：视口面板（如果合并到检查器） -->
                <template #viewport v-if="panelGroups.inspector?.includes('viewport')">
                  <QaqViewport3D />
                </template>
                <!-- 动态插槽：输出面板（如果合并到检查器） -->
                <template #output v-if="panelGroups.inspector?.includes('output')">
                  <QaqOutputDock />
                </template>
              </QaqTabbedPanel>

              <!-- 文件系统面板 -->
              <QaqTabbedPanel
                v-if="panels.filesystem.visible && !panels.filesystem.tabGroup"
                :tabs="getTabsForPanel('filesystem')"
                :active-tab-id="panels.filesystem.id"
                :width="panels.filesystem.width"
                :height="panels.filesystem.height"
                :x="panels.filesystem.x"
                :y="panels.filesystem.y"
                :can-resize-right="true"
                :can-resize-bottom="true"
                :merge-enabled="panels.filesystem.mergeEnabled"
                :allow-stacking="panels.filesystem.allowStacking"
                @resize="(size) => handlePanelResize('filesystem', size)"
                @move="(pos) => handlePanelMove('filesystem', pos)"
                @fullscreen="(fs) => handlePanelFullscreen('filesystem', fs)"
                @close="() => closePanel('filesystem')"
                @panel-merge="handlePanelMerge"
                @tab-detach="handleTabDetach"
                @toggle-merge="(enabled) => handleToggleMerge('filesystem', enabled)"
              >
                <!-- 动态插槽：文件系统面板 -->
                <template #filesystem>
                  <QaqFileSystemDock />
                </template>
                <!-- 动态插槽：场景树面板（如果合并到文件系统） -->
                <template #scene-tree v-if="panelGroups.filesystem?.includes('scene-tree')">
                  <QaqSceneTreeDock />
                </template>
                <!-- 动态插槽：检查器面板（如果合并到文件系统） -->
                <template #inspector v-if="panelGroups.filesystem?.includes('inspector')">
                  <QaqInspectorDock />
                </template>
                <!-- 动态插槽：视口面板（如果合并到文件系统） -->
                <template #viewport v-if="panelGroups.filesystem?.includes('viewport')">
                  <QaqViewport3D />
                </template>
                <!-- 动态插槽：输出面板（如果合并到文件系统） -->
                <template #output v-if="panelGroups.filesystem?.includes('output')">
                  <QaqOutputDock />
                </template>
              </QaqTabbedPanel>

              <!-- 输出面板 -->
              <QaqTabbedPanel
                v-if="panels.output.visible"
                :tabs="getTabsForPanel('output')"
                :active-tab-id="panels.output.id"
                :width="panels.output.width"
                :height="panels.output.height"
                :x="panels.output.x"
                :y="panels.output.y"
                :can-resize-right="true"
                :can-resize-bottom="false"
                :merge-enabled="panels.output.mergeEnabled"
                :allow-stacking="panels.output.allowStacking"
                @resize="(size) => handlePanelResize('output', size)"
                @move="(pos) => handlePanelMove('output', pos)"
                @fullscreen="(fs) => handlePanelFullscreen('output', fs)"
                @close="() => closePanel('output')"
                @panel-merge="handlePanelMerge"
                @tab-detach="handleTabDetach"
                @toggle-merge="(enabled) => handleToggleMerge('output', enabled)"
              >
                <!-- 动态插槽：输出面板 -->
                <template #output>
                  <QaqBottomPanel />
                </template>
                <!-- 动态插槽：场景树面板（如果合并到输出） -->
                <template #scene-tree v-if="panelGroups.output?.includes('scene-tree')">
                  <QaqSceneTreeDock />
                </template>
                <!-- 动态插槽：文件系统面板（如果合并到输出） -->
                <template #filesystem v-if="panelGroups.output?.includes('filesystem')">
                  <QaqFileSystemDock />
                </template>
                <!-- 动态插槽：检查器面板（如果合并到输出） -->
                <template #inspector v-if="panelGroups.output?.includes('inspector')">
                  <QaqInspectorDock />
                </template>
                <!-- 动态插槽：视口面板（如果合并到输出） -->
                <template #viewport v-if="panelGroups.output?.includes('viewport')">
                  <QaqViewport3D />
                </template>
              </QaqTabbedPanel>
            </div>
          </div>
        </template>
      </QaqEditorTabs>
    </div>

    <!-- 项目对话框 -->
    <ProjectDialog v-model="showProjectDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 页面元数据
definePageMeta({
  title: 'QAQ Game Engine Editor',
  middleware: 'auth', // 需要认证才能访问
  layout: 'editor'
})

// 页面SEO
useSeoMeta({
  title: 'QAQ Game Engine Editor',
  description: 'Professional game development environment with advanced tools and features'
})

// 认证状态管理
const authStore = useAuthStore()

// 导入编辑器组件
import QaqMenuBar from '~/components/editor/QaqMenuBar.vue'
import QaqEditorTabs from '~/components/editor/QaqEditorTabs.vue'
import QaqSceneTreeDock from '~/components/editor/QaqSceneTreeDock.vue'
import QaqViewport3D from '~/components/editor/QaqViewport3D.vue'
import QaqInspectorDock from '~/components/editor/QaqInspectorDock.vue'
import QaqFileSystemDock from '~/components/editor/QaqFileSystemDock.vue'
import QaqBottomPanel from '~/components/editor/QaqBottomPanel.vue'
import QaqDraggablePanel from '~/components/editor/QaqDraggablePanel.vue'
import QaqTabbedPanel from '~/components/editor/QaqTabbedPanel.vue'
import ProjectDialog from '~/components/editor/dialogs/ProjectDialog.vue'

// 导入UI增强组件
import QaqMouseFollower from '~/components/ui/QaqMouseFollower.vue'

// 导入composables
import { useGlobalInteractiveEffects } from '~/composables/useGlobalInteractiveEffects'

// UI 状态
const showProjectDialog = ref(false)
const viewport = ref()
const editorTabs = ref()

// 全局交互效果

// 面板管理状态 - 优化紧凑布局
const panels = ref({
  sceneTree: {
    id: 'scene-tree',
    title: 'Scene',
    icon: 'i-heroicons-squares-2x2',
    x: 0,
    y: 0,
    width: 280,
    height: 350,
    visible: true,
    docked: true,
    zone: 'left',
    tabGroup: null,
    mergeEnabled: true,
    allowStacking: true
  },
  viewport: {
    id: 'viewport',
    title: '3D Viewport',
    icon: 'i-heroicons-cube',
    x: 285,
    y: 0,
    width: 750,
    height: 550,
    visible: true,
    docked: true,
    zone: 'center',
    tabGroup: null,
    mergeEnabled: false,  // 视口通常不需要合并
    allowStacking: true
  },
  inspector: {
    id: 'inspector',
    title: 'Inspector',
    icon: 'i-heroicons-cog-6-tooth',
    x: 1040,
    y: 0,
    width: 300,
    height: 550,
    visible: true,
    docked: true,
    zone: 'right',
    tabGroup: null,
    mergeEnabled: true,
    allowStacking: true
  },
  filesystem: {
    id: 'filesystem',
    title: 'FileSystem',
    icon: 'i-heroicons-folder',
    x: 0,
    y: 355,
    width: 280,
    height: 280,
    visible: true,
    docked: true,
    zone: 'left',
    tabGroup: null,
    mergeEnabled: true,
    allowStacking: true
  },
  output: {
    id: 'output',
    title: 'Output',
    icon: 'i-heroicons-terminal',
    x: 285,
    y: 555,
    width: 750,
    height: 180,
    visible: true,
    docked: true,
    zone: 'bottom',
    tabGroup: null,
    mergeEnabled: true,
    allowStacking: true
  }
})

// 方法
function openMaterialEditor() {
  if (editorTabs.value) {
    editorTabs.value.openMaterialEditor()
  }
}

function openVueFlowMaterialEditor() {
  if (editorTabs.value) {
    editorTabs.value.openVueFlowMaterialEditor()
  }
}

function openAnimationEditor() {
  if (editorTabs.value) {
    editorTabs.value.openAnimationEditor()
  }
}

function openTerrainEditor() {
  if (editorTabs.value) {
    editorTabs.value.openTerrainEditor()
  }
}

// 面板管理方法
function handlePanelResize(panelId: string, size: { width: number; height: number }) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    panel.width = size.width
    panel.height = size.height
  }
}

function handlePanelMove(panelId: string, position: { x: number; y: number }) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    panel.x = position.x
    panel.y = position.y
    panel.docked = false // 移动时取消停靠
  }
}

function handlePanelFullscreen(panelId: string, isFullscreen: boolean) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    // 全屏时可以添加到顶部标签栏
    console.log(`Panel ${panelId} fullscreen: ${isFullscreen}`)
  }
}

function handlePanelDrop(data: { zone: string; panelId: string }) {
  console.log('Panel drop:', data)
  // 实现面板停靠逻辑
}

function closePanel(panelId: string) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    panel.visible = false
  }
}

function togglePanel(panelId: string) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    panel.visible = !panel.visible
  }
}

// 面板合并功能
const panelGroups = ref<Record<string, string[]>>({})

function handlePanelMerge(sourceTab: any, targetPanelId: string) {
  console.log('🔄 handlePanelMerge called with:', { sourceTab, targetPanelId })
  console.log('📊 Current panels:', Object.keys(panels.value))
  console.log('📊 Panel merge states:', Object.fromEntries(
    Object.entries(panels.value).map(([key, panel]) => [key, { id: panel.id, mergeEnabled: panel.mergeEnabled }])
  ))

  // 找到源面板
  const sourcePanelId = Object.keys(panels.value).find(id =>
    panels.value[id as keyof typeof panels.value].id === sourceTab.id
  )

  console.log('🔍 Source panel search:', { sourceTabId: sourceTab.id, foundSourcePanelId: sourcePanelId })

  if (!sourcePanelId) {
    console.log('❌ Source panel not found for tab:', sourceTab.id)
    return
  }

  if (sourcePanelId === targetPanelId) {
    console.log('❌ Cannot merge panel with itself')
    return
  }

  // 检查目标面板是否允许合并
  const targetPanel = Object.values(panels.value).find(p => p.id === targetPanelId)
  console.log('🔍 Target panel search:', { targetPanelId, foundTargetPanel: targetPanel })

  if (!targetPanel) {
    console.log('❌ Target panel not found:', targetPanelId)
    return
  }

  if (!targetPanel.mergeEnabled) {
    console.log('❌ Target panel does not allow merging:', targetPanel.title)
    return
  }

  console.log('✅ Merge validation passed, proceeding with merge...')

  // 保存源面板的原始状态（用于分离时恢复）
  saveOriginalPanelState(sourcePanelId)

  // 创建或更新面板组
  if (!panelGroups.value[targetPanelId]) {
    panelGroups.value[targetPanelId] = [targetPanelId]
    console.log('📝 Created new panel group for:', targetPanelId)
  }

  // 添加源面板到目标组
  if (!panelGroups.value[targetPanelId].includes(sourcePanelId)) {
    panelGroups.value[targetPanelId].push(sourcePanelId)
    console.log('📝 Added source panel to group:', sourcePanelId, '→', targetPanelId)
  }

  // 隐藏源面板
  const sourcePanel = panels.value[sourcePanelId as keyof typeof panels.value]
  if (sourcePanel) {
    sourcePanel.visible = false
    sourcePanel.tabGroup = targetPanelId
    console.log('👁️ Hidden source panel:', sourcePanel.title)
  }

  console.log('✅ Panel merge completed! Groups:', panelGroups.value)
}

// 处理合并开关切换
function handleToggleMerge(panelId: string, enabled: boolean) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel) {
    panel.mergeEnabled = enabled
    console.log(`🔄 Panel ${panelId} merge ${enabled ? 'enabled' : 'disabled'}`)
  }
}



// 存储面板的原始状态，用于分离时恢复
const originalPanelStates = ref<Record<string, any>>({})

// 保存面板原始状态
function saveOriginalPanelState(panelId: string) {
  const panel = panels.value[panelId as keyof typeof panels.value]
  if (panel && !originalPanelStates.value[panelId]) {
    originalPanelStates.value[panelId] = {
      x: panel.x,
      y: panel.y,
      width: panel.width,
      height: panel.height,
      visible: panel.visible
    }
    console.log('💾 Saved original state for panel:', panelId, originalPanelStates.value[panelId])
  }
}

function handleTabDetach(tab: any, position: { x: number; y: number }) {
  console.log('🔄 Detaching tab:', tab.title, 'to position:', position)

  // 找到对应的面板并恢复为独立面板
  const panelId = Object.keys(panels.value).find(id =>
    panels.value[id as keyof typeof panels.value].id === tab.id
  )

  if (panelId) {
    const panel = panels.value[panelId as keyof typeof panels.value]

    // 恢复面板状态
    const originalState = originalPanelStates.value[panelId]
    if (originalState) {
      console.log('🔄 Restoring original state for panel:', panelId)
      panel.x = originalState.x
      panel.y = originalState.y
      panel.width = originalState.width
      panel.height = originalState.height
      panel.visible = true

      // 清除原始状态记录
      delete originalPanelStates.value[panelId]
    } else {
      // 如果没有原始状态，使用分离位置
      panel.visible = true
      panel.x = position.x
      panel.y = position.y
    }

    panel.tabGroup = null

    // 从面板组中移除
    Object.keys(panelGroups.value).forEach(groupId => {
      const index = panelGroups.value[groupId].indexOf(panelId)
      if (index > -1) {
        panelGroups.value[groupId].splice(index, 1)
        console.log('📝 Removed panel from group:', panelId, 'from', groupId)

        // 如果组中只剩一个面板，需要特殊处理
        if (panelGroups.value[groupId].length === 1) {
          const remainingPanelId = panelGroups.value[groupId][0]
          console.log('🔄 Only one panel remaining in group:', remainingPanelId)

          // 确保剩余面板状态正确
          const remainingPanel = panels.value[remainingPanelId as keyof typeof panels.value]
          if (remainingPanel) {
            remainingPanel.tabGroup = null
            console.log('✅ Restored remaining panel to single mode:', remainingPanel.title)
          }

          // 删除组
          delete panelGroups.value[groupId]
          console.log('🗑️ Deleted group with single remaining panel:', groupId)
        } else if (panelGroups.value[groupId].length === 0) {
          // 如果组为空，直接删除
          delete panelGroups.value[groupId]
          console.log('🗑️ Deleted empty group:', groupId)
        }
      }
    })

    console.log('✅ Panel detached successfully:', panelId)

    // 验证面板状态
    if (process.dev) {
      setTimeout(validatePanelStates, 100)
    }
  }
}

function getTabsForPanel(panelId: string) {
  const group = panelGroups.value[panelId] || [panelId]
  return group.map(id => {
    const panel = panels.value[id as keyof typeof panels.value]
    return {
      id: panel.id,
      title: panel.title,
      icon: panel.icon,
      closable: true
    }
  }).filter(Boolean)
}

// 验证面板状态的辅助函数
function validatePanelStates() {
  console.log('🔍 Validating panel states...')

  // 检查面板组状态
  Object.keys(panelGroups.value).forEach(groupId => {
    const group = panelGroups.value[groupId]
    console.log(`📊 Group ${groupId}:`, group)

    if (group.length === 1) {
      const panelId = group[0]
      const panel = panels.value[panelId as keyof typeof panels.value]
      if (panel && panel.tabGroup !== null) {
        console.log(`⚠️ Single panel ${panelId} still has tabGroup:`, panel.tabGroup)
      }
    }
  })

  // 检查孤立面板
  Object.keys(panels.value).forEach(panelId => {
    const panel = panels.value[panelId as keyof typeof panels.value]
    if (panel.tabGroup && !panelGroups.value[panel.tabGroup]) {
      console.log(`⚠️ Panel ${panelId} references non-existent group:`, panel.tabGroup)
    }
  })
}

// 生命周期
onMounted(async () => {
  console.log('QAQ Editor mounted')

  // 检查认证状态
  await authStore.checkAuth()

  if (!authStore.isAuthenticated) {
    console.log('用户未认证，重定向到登录页面')
    await navigateTo('/auth/login')
  }
})
</script>

<style scoped>
.qaq-editor {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #000000 !important;
  color: #f3f4f6 !important;
  overflow: hidden;
}

.qaq-editor-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qaq-editor-header {
  background-color: #0a0a0a !important;
  border-bottom: 1px solid #1a1a1a !important;
  flex-shrink: 0;
}

.qaq-main-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qaq-panels-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--qaq-editor-bg);
}

.qaq-editor-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.qaq-editor-left {
  width: 320px;
  background-color: #374151 !important;
  border-right: 1px solid #4b5563 !important;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.qaq-editor-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: #1f2937 !important;
}

.qaq-editor-right {
  width: 320px;
  background-color: #374151 !important;
  border-left: 1px solid #4b5563 !important;
  flex-shrink: 0;
}

.qaq-editor-bottom {
  height: 192px;
  background-color: #374151 !important;
  border-top: 1px solid #4b5563 !important;
  flex-shrink: 0;
}
</style>
