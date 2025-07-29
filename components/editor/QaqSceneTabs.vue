<template>
  <div class="qaq-scene-tabs">
    <!-- 场景标签列表 -->
    <div class="qaq-tabs-container">
      <div
        v-for="scene in openScenes"
        :key="scene.id"
        class="qaq-scene-tab qaq-tab"
        :class="{ 'qaq-tab-active': scene.id === currentSceneId }"
        @click="switchToScene(scene.id)"
        @contextmenu="showTabContextMenu($event, scene)"
      >
        <UIcon :name="getSceneIcon(scene)" class="qaq-tab-icon" />
        <span class="qaq-tab-name">{{ scene.name }}</span>
        <span v-if="scene.isDirty" class="qaq-tab-modified">*</span>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="xs"
          class="qaq-tab-close"
          @click.stop="closeScene(scene.id)"
        />
      </div>

      <!-- 新建场景按钮 -->
      <UButton
        icon="i-heroicons-plus"
        variant="ghost"
        size="xs"
        class="qaq-new-scene-btn"
        title="New Scene"
        @click="createNewScene"
      />
    </div>

    <!-- 场景操作按钮 -->
    <div class="qaq-tabs-actions">
      <UDropdown :items="sceneMenuItems">
        <UButton
          icon="i-heroicons-ellipsis-horizontal"
          variant="ghost"
          size="xs"
          title="Scene Options"
        />
      </UDropdown>
    </div>

    <!-- 上下文菜单 -->
    <UContextMenu
      v-model="contextMenuOpen"
      :virtual-element="contextMenuTarget"
    >
      <template #default>
        <div class="qaq-context-menu">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-document-duplicate"
            @click="duplicateScene(contextScene)"
          >
            Duplicate Scene
          </UButton>

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-pencil"
            @click="renameScene(contextScene)"
          >
            Rename Scene
          </UButton>

          <UDivider />

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-folder-open"
            @click="showInFileSystem(contextScene)"
          >
            Show in FileSystem
          </UButton>

          <UDivider />

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-x-mark"
            color="red"
            @click="closeScene(contextScene?.id)"
          >
            Close Scene
          </UButton>
        </div>
      </template>
    </UContextMenu>

    <!-- 新建场景对话框 -->
    <UModal v-model="showNewSceneDialog">
      <UCard>
        <template #header>
          <h3>Create New Scene</h3>
        </template>

        <div class="qaq-new-scene-form">
          <UFormGroup label="Scene Name">
            <UInput
              v-model="newSceneName"
              placeholder="Enter scene name..."
              @keyup.enter="confirmCreateScene"
            />
          </UFormGroup>

          <UFormGroup label="Scene Type">
            <USelectMenu
              v-model="newSceneType"
              :options="sceneTypeOptions"
              placeholder="Select scene type..."
            />
          </UFormGroup>

          <UFormGroup label="Root Node Type">
            <USelectMenu
              v-model="newSceneRootType"
              :options="rootNodeTypeOptions"
              placeholder="Select root node type..."
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showNewSceneDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!newSceneName || !newSceneType"
              @click="confirmCreateScene"
            >
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '~/stores/editor'
import { useProjectStore } from '~/stores/project'

// 临时 toast 函数
function useToast() {
  return {
    add: (options: any) => {
      console.log(`Toast [${options.color}]: ${options.title} - ${options.description}`)
    }
  }
}

// 状态管理
const editorStore = useEditorStore()
const projectStore = useProjectStore()

// 响应式数据
const contextMenuOpen = ref(false)
const contextMenuTarget = ref(null)
const contextScene = ref(null)

// 新建场景对话框
const showNewSceneDialog = ref(false)
const newSceneName = ref('')
const newSceneType = ref(null)
const newSceneRootType = ref(null)

// 场景类型选项
const sceneTypeOptions = [
  { label: '3D Scene', value: '3d' },
  { label: '2D Scene', value: '2d' },
  { label: 'UI Scene', value: 'ui' }
]

// 根节点类型选项
const rootNodeTypeOptions = [
  { label: 'Node3D', value: 'Node3D' },
  { label: 'Node2D', value: 'Node2D' },
  { label: 'Control', value: 'Control' },
  { label: 'Node', value: 'Node' }
]

// 场景菜单选项
const sceneMenuItems = [
  [
    { label: 'New Scene (Quick)', click: () => createNewScene() },
    { label: 'New Scene (Custom)', click: () => showNewSceneDialog.value = true },
    { label: 'Save Scene', click: () => saveCurrentScene() },
    { label: 'Save All Scenes', click: () => saveAllScenes() }
  ],
  [
    { label: 'Close All Scenes', click: () => closeAllScenes() },
    { label: 'Close Other Scenes', click: () => closeOtherScenes() }
  ]
]

// 计算属性
const openScenes = computed(() => editorStore.sceneTabs)
const currentSceneId = computed(() => editorStore.state.activeTabId)

// ========================================================================
// 场景操作
// ========================================================================

function switchToScene(sceneId: string) {
  editorStore.setActiveTab(sceneId)
}

function closeScene(sceneId: string) {
  if (!sceneId) return

  const scene = openScenes.value.find(s => s.id === sceneId)
  if (scene?.isDirty) {
    // 如果场景已修改，询问是否保存
    const shouldSave = confirm(`Scene "${scene.name}" has unsaved changes. Save before closing?`)
    if (shouldSave) {
      saveScene(scene)
    }
  }

  editorStore.closeTab(sceneId)
}

function createNewScene() {
  // 显示创建场景对话框
  const existingScenes = editorStore.sceneTabs
  const sceneNumber = existingScenes.length + 1
  const defaultName = `Scene${sceneNumber}`

  newSceneName.value = defaultName
  newSceneType.value = '3d'
  newSceneRootType.value = 'Node3D'
  showNewSceneDialog.value = true
}

async function confirmCreateScene() {
  if (!newSceneName.value || !newSceneType.value) {
    console.warn('Scene name or type not provided')
    return
  }

  try {
    console.log('Creating scene with config:', {
      name: newSceneName.value,
      type: newSceneType.value,
      rootNodeType: newSceneRootType.value
    })

    const sceneConfig = {
      name: newSceneName.value,
      type: newSceneType.value as '3d' | '2d' | 'ui',
      rootNodeType: newSceneRootType.value || (newSceneType.value === '3d' ? 'Node3D' : 'Node')
    }

    await editorStore.createNewScene(sceneConfig)

    // 重置表单
    newSceneName.value = ''
    newSceneType.value = null
    newSceneRootType.value = null
    showNewSceneDialog.value = false

    console.log(`✅ Scene "${sceneConfig.name}" created successfully`)

    const toast = useToast()
    toast.add({
      title: 'Scene Created',
      description: `Scene "${sceneConfig.name}" created successfully`,
      color: 'green'
    })

  } catch (error) {
    console.error('Failed to create scene:', error)

    const toast = useToast()
    toast.add({
      title: 'Scene Creation Failed',
      description: `Failed to create scene "${newSceneName.value}": ${error}`,
      color: 'red'
    })
  }
}

// ========================================================================
// 上下文菜单
// ========================================================================

function showTabContextMenu(event: MouseEvent, scene: any) {
  event.preventDefault()
  contextMenuTarget.value = event.target
  contextScene.value = scene
  contextMenuOpen.value = true
}

function duplicateScene(scene: any) {
  if (!scene) return

  const newName = `${scene.name}_copy`
  // TODO: 实现场景复制功能
  console.log('Duplicate scene:', newName)
}

function renameScene(scene: any) {
  if (!scene) return

  const newName = prompt('Enter new scene name:', scene.name)
  if (newName && newName !== scene.name) {
    // TODO: 实现场景重命名功能
    console.log('Rename scene:', scene.name, '->', newName)
  }
}

function showInFileSystem(scene: any) {
  if (!scene) return

  // 在文件系统中显示场景文件
  console.log('Show in file system:', scene.path)
}

// ========================================================================
// 场景管理
// ========================================================================

function saveCurrentScene() {
  const currentScene = openScenes.value.find(s => s.id === currentSceneId.value)
  if (currentScene) {
    saveScene(currentScene)
  }
}

function saveAllScenes() {
  openScenes.value.forEach(scene => {
    if (scene.isDirty) {
      saveScene(scene)
    }
  })
}

function saveScene(scene: any) {
  try {
    editorStore.saveScene(scene.id)

    const toast = useToast()
    toast.add({
      title: 'Scene Saved',
      description: `Scene "${scene.name}" saved successfully`,
      color: 'green'
    })

  } catch (error) {
    console.error('Failed to save scene:', error)

    const toast = useToast()
    toast.add({
      title: 'Save Failed',
      description: `Failed to save scene "${scene.name}"`,
      color: 'red'
    })
  }
}

function closeAllScenes() {
  const modifiedScenes = openScenes.value.filter(s => s.isDirty)

  if (modifiedScenes.length > 0) {
    const shouldSave = confirm(`${modifiedScenes.length} scene(s) have unsaved changes. Save before closing?`)
    if (shouldSave) {
      saveAllScenes()
    }
  }

  editorStore.closeAllTabs()
}

function closeOtherScenes() {
  const currentScene = openScenes.value.find(s => s.id === currentSceneId.value)
  const otherScenes = openScenes.value.filter(s => s.id !== currentSceneId.value)
  const modifiedOtherScenes = otherScenes.filter(s => s.isDirty)

  if (modifiedOtherScenes.length > 0) {
    const shouldSave = confirm(`${modifiedOtherScenes.length} scene(s) have unsaved changes. Save before closing?`)
    if (shouldSave) {
      modifiedOtherScenes.forEach(scene => saveScene(scene))
    }
  }

  editorStore.closeOtherTabs()
}

// ========================================================================
// 工具函数
// ========================================================================

function getSceneIcon(scene: any): string {
  // 使用场景标签页的图标属性，或者根据名称推断
  if (scene.icon) {
    return scene.icon
  }

  // 根据文件扩展名或名称推断
  if (scene.name.includes('3D') || scene.path.includes('3d')) {
    return 'i-heroicons-cube'
  } else if (scene.name.includes('2D') || scene.path.includes('2d')) {
    return 'i-heroicons-square-2-stack'
  } else if (scene.name.includes('UI') || scene.path.includes('ui')) {
    return 'i-heroicons-window'
  }

  return 'i-heroicons-document'
}
</script>

<style scoped>
.qaq-scene-tabs {
  height: 100%;
  display: flex;
  align-items: center;
  background-color: var(--qaq-tabs-bg, #2d2d2d);
  border-bottom: 1px solid var(--qaq-border, #4a4a4a);
  padding: 0 8px;
}

.qaq-tabs-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.qaq-tabs-container::-webkit-scrollbar {
  display: none;
}

.qaq-scene-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: var(--qaq-tab-bg, #3a3a3a);
  border: 1px solid var(--qaq-border, #4a4a4a);
  border-radius: 0;
  cursor: pointer;
  user-select: none;
  transition: all 0.1s ease;
  white-space: nowrap;
  min-width: 0;
  position: relative;
}

.qaq-scene-tab:hover {
  background-color: var(--qaq-tab-hover-bg, #484848);
}

.qaq-tab-active {
  background-color: var(--qaq-tab-active-bg, #525252) !important;
  color: var(--qaq-tab-active-text, #ffffff);
  border-color: var(--qaq-tab-active-border, #666666);
  border-bottom: 2px solid var(--qaq-accent-color, #84cc16);
}

.qaq-tab-icon {
  width: 14px;
  height: 14px;
  color: var(--qaq-icon-color, #cccccc);
  flex-shrink: 0;
}

.qaq-tab-name {
  font-size: 12px;
  color: var(--qaq-text, #ffffff);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.qaq-tab-modified {
  font-size: 14px;
  color: var(--qaq-warning-color, #ff9500);
  font-weight: bold;
  flex-shrink: 0;
}

.qaq-tab-close {
  opacity: 0;
  transition: opacity 0.1s ease;
  flex-shrink: 0;
}

.qaq-scene-tab:hover .qaq-tab-close {
  opacity: 1;
}

.qaq-new-scene-btn {
  margin-left: 4px;
  flex-shrink: 0;
}

.qaq-tabs-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.qaq-context-menu {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.qaq-new-scene-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
