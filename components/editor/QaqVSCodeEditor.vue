<template>
  <div class="qaq-vscode-editor">
    <!-- 编辑器工具栏 -->
    <div class="qaq-vscode-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-folder-open"
          variant="ghost"
          size="xs"
          @click="openFolder"
          title="打开文件夹"
        />
        <UButton
          icon="i-heroicons-document-plus"
          variant="ghost"
          size="xs"
          @click="createNewFile"
          title="新建文件"
        />
        <UButton
          icon="i-heroicons-document-arrow-down"
          variant="ghost"
          size="xs"
          @click="saveFile"
          title="保存文件 (Ctrl+S)"
        />
      </div>
      
      <div class="qaq-toolbar-center">
        <span class="qaq-editor-title">VSCode Editor</span>
      </div>
      
      <div class="qaq-toolbar-right">
        <UButton
          :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
          variant="ghost"
          size="xs"
          @click="toggleFullscreen"
          :title="isFullscreen ? '退出全屏' : '全屏'"
        />
        <UButton
          icon="i-heroicons-cog-6-tooth"
          variant="ghost"
          size="xs"
          @click="openSettings"
          title="设置"
        />
      </div>
    </div>
    
    <!-- VSCode编辑器容器 -->
    <div class="qaq-vscode-container" ref="vscodeContainer">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="qaq-loading-state">
        <div class="qaq-loading-content">
          <div class="qaq-loading-spinner"></div>
          <h3>正在加载 VSCode 编辑器...</h3>
          <p>首次加载可能需要一些时间</p>
        </div>
      </div>
      
      <!-- VSCode iframe -->
      <iframe
        v-show="!isLoading"
        ref="vscodeFrame"
        class="qaq-vscode-frame"
        :src="vscodeUrl"
        @load="handleVSCodeLoad"
        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals"
      ></iframe>
      
      <!-- 错误状态 -->
      <div v-if="hasError" class="qaq-error-state">
        <div class="qaq-error-content">
          <UIcon name="i-heroicons-exclamation-triangle" class="qaq-error-icon" />
          <h3>VSCode 编辑器加载失败</h3>
          <p>{{ errorMessage }}</p>
          <div class="qaq-error-actions">
            <UButton @click="retryLoad" variant="solid">重试</UButton>
            <UButton @click="useFallback" variant="ghost">使用简化编辑器</UButton>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文件管理对话框 -->
    <UModal v-model="showFileDialog" title="文件管理">
      <div class="qaq-file-manager">
        <div class="qaq-file-tree">
          <h4>项目文件</h4>
          <div class="qaq-file-list">
            <div
              v-for="file in projectFiles"
              :key="file.path"
              class="qaq-file-item"
              @click="openFile(file)"
            >
              <UIcon :name="getFileIcon(file.name)" />
              <span>{{ file.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="qaq-file-actions">
          <UButton @click="uploadFiles" icon="i-heroicons-arrow-up-tray">上传文件</UButton>
          <UButton @click="createFolder" icon="i-heroicons-folder-plus">新建文件夹</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface ProjectFile {
  name: string
  path: string
  type: 'file' | 'folder'
  content?: string
  language?: string
}

// 响应式状态
const vscodeContainer = ref<HTMLDivElement>()
const vscodeFrame = ref<HTMLIFrameElement>()
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const isFullscreen = ref(false)
const showFileDialog = ref(false)

// VSCode配置
const vscodeUrl = ref('https://vscode.dev/')
const projectFiles = ref<ProjectFile[]>([
  {
    name: 'main.ts',
    path: '/project/main.ts',
    type: 'file',
    language: 'typescript',
    content: `// QAQ Game Engine - Main Script
import { Engine, Scene, Node3D } from '@qaq/engine';

class GameManager {
  private engine: Engine;
  private scene: Scene;
  
  constructor() {
    this.engine = new Engine();
    this.scene = new Scene();
  }
  
  async initialize(): Promise<void> {
    await this.engine.initialize();
    this.setupScene();
    this.startGameLoop();
  }
  
  private setupScene(): void {
    // 创建根节点
    const root = new Node3D();
    root.name = 'Root';
    this.scene.addChild(root);
    
    console.log('Scene setup completed');
  }
  
  private startGameLoop(): void {
    this.engine.start();
    console.log('Game loop started');
  }
}

// 启动游戏
const game = new GameManager();
game.initialize().catch(console.error);`
  },
  {
    name: 'types.d.ts',
    path: '/project/types.d.ts',
    type: 'file',
    language: 'typescript',
    content: `// QAQ Game Engine - Type Definitions
declare module '@qaq/engine' {
  export class Engine {
    initialize(): Promise<void>;
    start(): void;
    stop(): void;
  }
  
  export class Scene {
    addChild(node: Node3D): void;
    removeChild(node: Node3D): void;
    getChildren(): Node3D[];
  }
  
  export class Node3D {
    name: string;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    
    addChild(node: Node3D): void;
    removeChild(node: Node3D): void;
  }
  
  export interface Vector3 {
    x: number;
    y: number;
    z: number;
  }
}`
  },
  {
    name: 'package.json',
    path: '/project/package.json',
    type: 'file',
    language: 'json',
    content: `{
  "name": "qaq-game-project",
  "version": "1.0.0",
  "description": "QAQ Game Engine Project",
  "main": "main.ts",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@qaq/engine": "^1.0.0",
    "three": "^0.158.0"
  },
  "devDependencies": {
    "@types/three": "^0.158.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}`
  }
])

// 生命周期
onMounted(async () => {
  await nextTick()
  console.log('🚀 VSCode Editor mounted')
  setupVSCodeIntegration()
})

onUnmounted(() => {
  cleanup()
})

// VSCode集成
function setupVSCodeIntegration() {
  // 设置VSCode URL with workspace
  const workspaceConfig = {
    folders: [
      {
        name: 'QAQ Project',
        uri: 'memfs:/'
      }
    ]
  }
  
  // 使用vscode.dev with workspace configuration
  vscodeUrl.value = `https://vscode.dev/?workspace=${encodeURIComponent(JSON.stringify(workspaceConfig))}`
  
  console.log('🔧 VSCode URL configured:', vscodeUrl.value)
}

function handleVSCodeLoad() {
  console.log('✅ VSCode loaded successfully')
  isLoading.value = false
  hasError.value = false
  
  // 尝试与VSCode通信
  setupVSCodeCommunication()
}

function setupVSCodeCommunication() {
  if (!vscodeFrame.value) return
  
  try {
    // 监听来自VSCode的消息
    window.addEventListener('message', handleVSCodeMessage)
    
    // 发送初始化消息到VSCode
    setTimeout(() => {
      sendToVSCode({
        type: 'init',
        files: projectFiles.value
      })
    }, 2000)
    
  } catch (error) {
    console.error('Failed to setup VSCode communication:', error)
  }
}

function handleVSCodeMessage(event: MessageEvent) {
  if (event.origin !== 'https://vscode.dev') return
  
  console.log('📨 Message from VSCode:', event.data)
  
  const { type, data } = event.data
  
  switch (type) {
    case 'fileChanged':
      handleFileChange(data)
      break
    case 'ready':
      handleVSCodeReady()
      break
    default:
      console.log('Unknown message type:', type)
  }
}

function sendToVSCode(message: any) {
  if (!vscodeFrame.value?.contentWindow) return
  
  try {
    vscodeFrame.value.contentWindow.postMessage(message, 'https://vscode.dev')
  } catch (error) {
    console.error('Failed to send message to VSCode:', error)
  }
}

function handleVSCodeReady() {
  console.log('🎉 VSCode is ready for communication')
  
  // 发送项目文件到VSCode
  projectFiles.value.forEach(file => {
    if (file.type === 'file' && file.content) {
      sendToVSCode({
        type: 'createFile',
        path: file.path,
        content: file.content,
        language: file.language
      })
    }
  })
}

function handleFileChange(data: any) {
  console.log('📝 File changed:', data.path)
  
  // 更新本地文件内容
  const file = projectFiles.value.find(f => f.path === data.path)
  if (file) {
    file.content = data.content
  }
}

// 文件操作
function openFolder() {
  showFileDialog.value = true
}

function createNewFile() {
  const fileName = prompt('请输入文件名:')
  if (!fileName) return
  
  const newFile: ProjectFile = {
    name: fileName,
    path: `/project/${fileName}`,
    type: 'file',
    content: '',
    language: getLanguageFromExtension(fileName)
  }
  
  projectFiles.value.push(newFile)
  
  // 在VSCode中创建文件
  sendToVSCode({
    type: 'createFile',
    path: newFile.path,
    content: newFile.content,
    language: newFile.language
  })
}

function saveFile() {
  sendToVSCode({ type: 'saveAll' })
  console.log('💾 Files saved')
}

function openFile(file: ProjectFile) {
  sendToVSCode({
    type: 'openFile',
    path: file.path
  })
  showFileDialog.value = false
}

function uploadFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files) return
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const projectFile: ProjectFile = {
          name: file.name,
          path: `/project/${file.name}`,
          type: 'file',
          content,
          language: getLanguageFromExtension(file.name)
        }
        
        projectFiles.value.push(projectFile)
        
        sendToVSCode({
          type: 'createFile',
          path: projectFile.path,
          content: projectFile.content,
          language: projectFile.language
        })
      }
      reader.readAsText(file)
    })
  }
  input.click()
}

function createFolder() {
  const folderName = prompt('请输入文件夹名:')
  if (!folderName) return
  
  const newFolder: ProjectFile = {
    name: folderName,
    path: `/project/${folderName}`,
    type: 'folder'
  }
  
  projectFiles.value.push(newFolder)
}

// 工具函数
function getLanguageFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'js': 'javascript',
    'json': 'json',
    'css': 'css',
    'html': 'html',
    'vue': 'vue',
    'md': 'markdown',
    'py': 'python',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'java': 'java',
    'go': 'go',
    'rs': 'rust'
  }
  return languageMap[ext || ''] || 'plaintext'
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    'ts': 'i-vscode-icons-file-type-typescript',
    'js': 'i-vscode-icons-file-type-js',
    'json': 'i-vscode-icons-file-type-json',
    'css': 'i-vscode-icons-file-type-css',
    'html': 'i-vscode-icons-file-type-html',
    'vue': 'i-vscode-icons-file-type-vue',
    'md': 'i-vscode-icons-file-type-markdown'
  }
  return iconMap[ext || ''] || 'i-heroicons-document'
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    vscodeContainer.value?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function openSettings() {
  sendToVSCode({ type: 'openSettings' })
}

function retryLoad() {
  hasError.value = false
  isLoading.value = true
  
  if (vscodeFrame.value) {
    vscodeFrame.value.src = vscodeUrl.value
  }
}

function useFallback() {
  // 切换到Monaco编辑器
  console.log('🔄 Switching to Monaco Editor fallback')
  // 这里可以发射事件通知父组件切换编辑器
}

function cleanup() {
  window.removeEventListener('message', handleVSCodeMessage)
}
</script>

<style scoped>
.qaq-vscode-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--qaq-editor-bg, #1a1a1a);
}

.qaq-vscode-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--qaq-editor-panel, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #404040);
}

.qaq-toolbar-left,
.qaq-toolbar-right {
  display: flex;
  gap: 4px;
}

.qaq-editor-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-vscode-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.qaq-vscode-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #1e1e1e;
}

.qaq-loading-state,
.qaq-error-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qaq-editor-bg, #1a1a1a);
}

.qaq-loading-content,
.qaq-error-content {
  text-align: center;
  max-width: 400px;
  padding: 32px;
}

.qaq-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--qaq-editor-border, #404040);
  border-top: 3px solid var(--qaq-primary, #00DC82);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qaq-error-icon {
  font-size: 48px;
  color: var(--qaq-accent-orange, #f59e0b);
  margin-bottom: 16px;
}

.qaq-error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.qaq-file-manager {
  padding: 16px;
}

.qaq-file-tree h4 {
  margin-bottom: 12px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-file-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.qaq-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.qaq-file-item:hover {
  background: var(--qaq-hover-bg, rgba(0, 220, 130, 0.05));
}

.qaq-file-actions {
  display: flex;
  gap: 8px;
}
</style>
