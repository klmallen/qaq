<template>
  <div class="qaq-filesystem-dock">
    <!-- 标题栏 -->
    <div class="qaq-dock-header">
      <h3 class="qaq-dock-title">FileSystem</h3>
      <div class="qaq-dock-actions">
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="xs"
          title="Refresh"
          @click="refreshFileSystem"
        />
        <UButton
          icon="i-heroicons-folder-plus"
          variant="ghost"
          size="xs"
          title="New Folder"
          @click="createNewFolder"
        />
        <UButton
          icon="i-heroicons-document-plus"
          variant="ghost"
          size="xs"
          title="New File"
          @click="createNewFile"
        />
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="qaq-toolbar">
      <UInput
        v-model="searchQuery"
        placeholder="Search files..."
        size="xs"
        icon="i-heroicons-magnifying-glass"
        class="qaq-search-input"
      />
      <UButton
        :icon="showHiddenFiles ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
        variant="ghost"
        size="xs"
        :title="showHiddenFiles ? 'Hide hidden files' : 'Show hidden files'"
        @click="toggleHiddenFiles"
      />
    </div>

    <!-- 文件树 -->
    <div class="qaq-file-tree">
      <div v-if="isLoading" class="qaq-loading-state">
        <UIcon name="i-heroicons-arrow-path" class="qaq-loading-icon animate-spin" />
        <p>Loading files...</p>
      </div>

      <div v-else-if="filteredFiles.length === 0" class="qaq-empty-state">
        <UIcon name="i-heroicons-folder-open" class="qaq-empty-icon" />
        <p>No files found</p>
      </div>

      <div v-else class="qaq-file-list">
        <div
          v-for="file in filteredFiles"
          :key="file.path"
          class="qaq-file-item"
          :class="{ 'qaq-file-selected': selectedFile === file }"
          @click="selectFile(file)"
          @dblclick="openFile(file)"
          @contextmenu="showContextMenu($event, file)"
        >
          <UIcon :name="getFileTypeIcon(file.name)" class="qaq-file-icon" />
          <span class="qaq-file-name">{{ file.name }}</span>
        </div>
      </div>
    </div>

    <!-- 上下文菜单 -->
    <UContextMenu
      v-if="contextMenuTarget"
      v-model="contextMenuOpen"
      :virtual-element="contextMenuTarget"
    >
      <template #default>
        <div class="qaq-context-menu">
          <UButton
            v-if="contextFile?.type === 'file'"
            variant="ghost"
            size="xs"
            icon="i-heroicons-document-text"
            @click="openFile(contextFile)"
          >
            Open
          </UButton>

          <UButton
            v-if="contextFile?.type === 'file' && isSceneFile(contextFile)"
            variant="ghost"
            size="xs"
            icon="i-heroicons-play"
            @click="openScene(contextFile)"
          >
            Open Scene
          </UButton>

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-pencil"
            @click="renameFile(contextFile)"
          >
            Rename
          </UButton>

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-document-duplicate"
            @click="duplicateFile(contextFile)"
          >
            Duplicate
          </UButton>

          <UDivider />

          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            color="red"
            @click="deleteFile(contextFile)"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UContextMenu>

    <!-- 新建文件对话框 -->
    <UModal v-model="showNewFileDialog">
      <UCard>
        <template #header>
          <h3>Create New File</h3>
        </template>

        <div class="qaq-new-file-form">
          <UFormGroup label="File Name">
            <UInput
              v-model="newFileName"
              placeholder="Enter file name..."
              @keyup.enter="confirmCreateFile"
            />
          </UFormGroup>

          <UFormGroup label="File Type">
            <USelectMenu
              v-model="newFileType"
              :options="fileTypeOptions"
              placeholder="Select file type..."
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showNewFileDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!newFileName || !newFileType"
              @click="confirmCreateFile"
            >
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 新建文件夹对话框 -->
    <UModal v-model="showNewFolderDialog">
      <UCard>
        <template #header>
          <h3>Create New Folder</h3>
        </template>

        <UFormGroup label="Folder Name">
          <UInput
            v-model="newFolderName"
            placeholder="Enter folder name..."
            @keyup.enter="confirmCreateFolder"
          />
        </UFormGroup>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showNewFolderDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!newFolderName"
              @click="confirmCreateFolder"
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
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '~/stores/project'
import { useEditorStore } from '~/stores/editor'
import { getFileTypeIcon } from '~/core'

// 状态管理
const projectStore = useProjectStore()
const editorStore = useEditorStore()

// 响应式数据
const searchQuery = ref('')
const showHiddenFiles = ref(false)
const isLoading = ref(false)
const selectedFile = ref(null)
const contextMenuOpen = ref(false)
const contextMenuTarget = ref<HTMLElement | null>(null)
const contextFile = ref(null)

// 新建文件对话框
const showNewFileDialog = ref(false)
const newFileName = ref('')
const newFileType = ref(null)

// 新建文件夹对话框
const showNewFolderDialog = ref(false)
const newFolderName = ref('')

// 文件类型选项
const fileTypeOptions = [
  { label: 'Scene (.tscn)', value: 'tscn' },
  { label: 'Script (.js)', value: 'js' },
  { label: 'Script (.ts)', value: 'ts' },
  { label: 'Text (.txt)', value: 'txt' },
  { label: 'JSON (.json)', value: 'json' }
]

// 计算属性
const filteredFiles = computed(() => {
  let files = projectStore.projectFiles || []

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    files = files.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.path.toLowerCase().includes(query)
    )
  }

  // 隐藏文件过滤
  if (!showHiddenFiles.value) {
    files = files.filter(file => !file.name.startsWith('.'))
  }

  return files
})

// ========================================================================
// 文件操作
// ========================================================================

async function refreshFileSystem() {
  isLoading.value = true
  try {
    await projectStore.refreshProjectFiles()
  } catch (error) {
    console.error('Failed to refresh file system:', error)
  } finally {
    isLoading.value = false
  }
}

function selectFile(file: any) {
  selectedFile.value = file
  editorStore.setSelectedFile(file)
}

function openFile(file: any) {
  if (!file) return

  if (isSceneFile(file)) {
    openScene(file)
  } else if (isScriptFile(file)) {
    openScript(file)
  } else {
    // 其他文件类型的处理
    console.log('Open file:', file.path)
  }
}

function openScene(file: any) {
  editorStore.openScene(file.path)
}

function openScript(file: any) {
  editorStore.openScript(file.path)
}

function showContextMenu(event: MouseEvent, file: any) {
  contextMenuTarget.value = event.target
  contextFile.value = file
  contextMenuOpen.value = true
}

// ========================================================================
// 文件创建
// ========================================================================

function createNewFile() {
  newFileName.value = ''
  newFileType.value = null
  showNewFileDialog.value = true
}

function createNewFolder() {
  newFolderName.value = ''
  showNewFolderDialog.value = true
}

async function confirmCreateFile() {
  if (!newFileName.value || !newFileType.value) return

  try {
    const fileName = newFileName.value.endsWith(`.${newFileType.value}`)
      ? newFileName.value
      : `${newFileName.value}.${newFileType.value}`

    await projectStore.createFile(fileName, getDefaultFileContent(newFileType.value))

    showNewFileDialog.value = false
    await refreshFileSystem()

  } catch (error) {
    console.error('Failed to create file:', error)
  }
}

async function confirmCreateFolder() {
  if (!newFolderName.value) return

  try {
    await projectStore.createFolder(newFolderName.value)

    showNewFolderDialog.value = false
    await refreshFileSystem()

  } catch (error) {
    console.error('Failed to create folder:', error)
  }
}

// ========================================================================
// 文件管理
// ========================================================================

async function renameFile(file: any) {
  if (!file) return

  const newName = prompt('Enter new name:', file.name)
  if (newName && newName !== file.name) {
    try {
      await projectStore.renameFile(file.path, newName)
      await refreshFileSystem()
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }
}

async function duplicateFile(file: any) {
  if (!file) return

  try {
    const extension = file.name.split('.').pop()
    const baseName = file.name.replace(`.${extension}`, '')
    const newName = `${baseName}_copy.${extension}`

    await projectStore.duplicateFile(file.path, newName)
    await refreshFileSystem()
  } catch (error) {
    console.error('Failed to duplicate file:', error)
  }
}

async function deleteFile(file: any) {
  if (!file) return

  const confirmed = confirm(`Are you sure you want to delete "${file.name}"?`)
  if (confirmed) {
    try {
      await projectStore.deleteFile(file.path)
      await refreshFileSystem()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

// ========================================================================
// 工具函数
// ========================================================================

function toggleHiddenFiles() {
  showHiddenFiles.value = !showHiddenFiles.value
}

function isSceneFile(file: any): boolean {
  return file.name.endsWith('.tscn')
}

function isScriptFile(file: any): boolean {
  return file.name.endsWith('.js') || file.name.endsWith('.ts')
}

function getDefaultFileContent(fileType: string): string {
  switch (fileType) {
    case 'tscn':
      return '[gd_scene load_steps=1 format=3]\n\n[node name="Node" type="Node"]\n'
    case 'js':
      return '// JavaScript file\n'
    case 'ts':
      return '// TypeScript file\n'
    case 'json':
      return '{\n  \n}\n'
    case 'txt':
      return ''
    default:
      return ''
  }
}

// 生命周期
onMounted(() => {
  refreshFileSystem()
})
</script>

<style scoped>
.qaq-filesystem-dock {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-dock-header {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background-color: var(--qaq-header-bg, #404040);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-dock-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
  margin: 0;
}

.qaq-dock-actions {
  display: flex;
  gap: 2px;
}

.qaq-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-search-input {
  flex: 1;
}

.qaq-file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.qaq-loading-state,
.qaq-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-loading-icon,
.qaq-empty-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.qaq-loading-state p,
.qaq-empty-state p {
  font-size: 12px;
  margin: 0;
}

.qaq-file-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.qaq-context-menu {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.qaq-new-file-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qaq-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s ease;
}

.qaq-file-item:hover {
  background-color: var(--qaq-hover-bg, rgba(255, 255, 255, 0.05));
}

.qaq-file-selected {
  background-color: var(--qaq-selected-bg, #4a90e2) !important;
  color: var(--qaq-selected-text, #ffffff);
}

.qaq-file-icon {
  width: 16px;
  height: 16px;
  color: var(--qaq-icon-color, #cccccc);
  flex-shrink: 0;
}

.qaq-file-name {
  font-size: 12px;
  color: var(--qaq-text, #ffffff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
