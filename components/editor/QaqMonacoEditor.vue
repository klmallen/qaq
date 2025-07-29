<template>
  <div class="qaq-monaco-editor">
    <!-- 编辑器工具栏 -->
    <div class="qaq-monaco-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-document-plus"
          size="xs"
          variant="ghost"
          @click="createNewFile"
          title="新建文件"
        >
          新建
        </UButton>
        <UButton
          icon="i-heroicons-folder-open"
          size="xs"
          variant="ghost"
          @click="openFile"
          title="打开文件"
        >
          打开
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          size="xs"
          variant="ghost"
          @click="saveFile"
          title="保存文件"
        >
          保存
        </UButton>
        <div class="qaq-toolbar-separator"></div>
        <USelectMenu
          v-model="selectedLanguage"
          :options="languageOptions"
          @change="changeLanguage"
          size="xs"
          class="qaq-language-select"
        />
      </div>

      <div class="qaq-toolbar-right">
        <span class="qaq-editor-info">
          行: {{ currentLine }} | 列: {{ currentColumn }} | {{ selectedLanguage }}
        </span>
      </div>
    </div>

    <!-- Monaco编辑器容器 -->
    <div ref="editorContainer" class="qaq-monaco-container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="qaq-editor-loading">
        <div class="qaq-loading-spinner"></div>
        <div class="qaq-loading-text">
          <h3>正在加载代码编辑器...</h3>
          <p v-if="loadAttempts > 1">重试第 {{ loadAttempts }} 次</p>
          <p class="qaq-loading-detail">Monaco Editor ({{ loadAttempts }}/{{ maxLoadAttempts }})</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="qaq-editor-error">
        <div class="qaq-error-icon">
          <UIcon name="i-heroicons-exclamation-triangle" />
        </div>
        <div class="qaq-error-content">
          <h3>编辑器加载失败</h3>
          <p>{{ error }}</p>
          <div class="qaq-error-actions">
            <UButton
              v-if="loadAttempts < maxLoadAttempts"
              icon="i-heroicons-arrow-path"
              size="sm"
              @click="retryInitialization"
            >
              重试加载 ({{ loadAttempts }}/{{ maxLoadAttempts }})
            </UButton>
            <UButton
              icon="i-heroicons-document-text"
              size="sm"
              variant="outline"
              @click="initializeFallbackEditor"
            >
              使用简单编辑器
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="qaq-monaco-statusbar">
      <div class="qaq-statusbar-left">
        <span class="qaq-status-item">
          <UIcon name="i-heroicons-document-text" />
          {{ currentFileName }}
        </span>
        <span class="qaq-status-item" v-if="hasUnsavedChanges">
          <UIcon name="i-heroicons-exclamation-circle" />
          未保存
        </span>
      </div>

      <div class="qaq-statusbar-right">
        <span class="qaq-status-item">UTF-8</span>
        <span class="qaq-status-item">LF</span>
        <span class="qaq-status-item">{{ selectedLanguage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// Monaco Editor全局对象
declare global {
  interface Window {
    monaco: any
    require: any
  }
}

let monaco: any = null
let isMonacoLoaded = ref(false)
let loadAttempts = ref(0)
const maxLoadAttempts = 3

// 响应式状态
const editorContainer = ref<HTMLElement>()
const editor = ref<any>()
const currentLine = ref(1)
const currentColumn = ref(1)
const currentFileName = ref('untitled.ts')
const hasUnsavedChanges = ref(false)
const selectedLanguage = ref('typescript')
const isLoading = ref(true)
const error = ref('')

// 语言选项
const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'SCSS', value: 'scss' },
  { label: 'Vue', value: 'vue' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'YAML', value: 'yaml' },
  { label: 'XML', value: 'xml' }
]

// 默认代码内容
const defaultCode = `// QAQ Game Engine Script
// 欢迎使用QAQ游戏引擎代码编辑器

class GameScript {
  constructor() {
    console.log('QAQ Game Engine Script initialized');
  }

  start() {
    // 游戏开始时调用
  }

  update(deltaTime: number) {
    // 每帧更新时调用
  }

  onDestroy() {
    // 对象销毁时调用
  }
}

export default GameScript;
`

// 加载Monaco Editor CDN
const loadMonacoFromCDN = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.monaco) {
      monaco = window.monaco
      isMonacoLoaded.value = true
      resolve()
      return
    }

    // 检查是否已经在加载
    if (document.querySelector('script[src*="monaco-editor"]')) {
      // 等待加载完成
      const checkLoaded = () => {
        if (window.monaco) {
          monaco = window.monaco
          isMonacoLoaded.value = true
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    // 创建script标签加载Monaco
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js'
    script.onload = () => {
      // 配置require路径
      window.require.config({
        paths: {
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
        }
      })

      // 加载Monaco Editor
      window.require(['vs/editor/editor.main'], () => {
        monaco = window.monaco
        isMonacoLoaded.value = true
        console.log('✅ Monaco Editor loaded from CDN')
        resolve()
      }, (error: any) => {
        console.error('❌ Failed to load Monaco Editor:', error)
        reject(error)
      })
    }
    script.onerror = () => {
      console.error('❌ Failed to load Monaco Editor script')
      reject(new Error('Failed to load Monaco Editor script'))
    }
    document.head.appendChild(script)
  })
}

// 方法
const initializeEditor = async () => {
  if (!editorContainer.value) return

  try {
    isLoading.value = true
    error.value = ''
    loadAttempts.value++

    console.log(`🔄 Initializing Monaco Editor (attempt ${loadAttempts.value}/${maxLoadAttempts})`)

    // 加载Monaco Editor
    if (!monaco) {
      await loadMonacoFromCDN()
    }

    // 配置Monaco编辑器主题
    monaco.editor.defineTheme('qaq-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
    ],
    colors: {
      'editor.background': '#2a2a2a',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#383838',
      'editor.selectionBackground': '#00DC8240',
      'editor.inactiveSelectionBackground': '#00DC8220',
      'editorCursor.foreground': '#00DC82',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#00DC82',
      'editor.findMatchBackground': '#00DC8260',
      'editor.findMatchHighlightBackground': '#00DC8240',
    }
  })

  // 创建编辑器实例
  editor.value = monaco.editor.create(editorContainer.value, {
    value: defaultCode,
    language: selectedLanguage.value,
    theme: 'qaq-dark',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    minimap: {
      enabled: true,
      side: 'right'
    },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    wordBasedSuggestions: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    bracketPairColorization: {
      enabled: true
    },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  })

  // 监听光标位置变化
  editor.value.onDidChangeCursorPosition((e) => {
    currentLine.value = e.position.lineNumber
    currentColumn.value = e.position.column
  })

  // 监听内容变化
  editor.value.onDidChangeModelContent(() => {
    hasUnsavedChanges.value = true
  })

    isLoading.value = false
    console.log('✅ Monaco Editor initialized successfully')

  } catch (err) {
    console.error('❌ Failed to initialize Monaco Editor:', err)
    error.value = `初始化编辑器失败: ${err instanceof Error ? err.message : '未知错误'}`
    isLoading.value = false

    // 重试机制
    if (loadAttempts.value < maxLoadAttempts) {
      console.log(`🔄 Retrying Monaco Editor initialization in 2 seconds...`)
      setTimeout(() => {
        initializeEditor()
      }, 2000)
    } else {
      console.error('❌ Max retry attempts reached, falling back to simple editor')
      initializeFallbackEditor()
    }
  }
}

// 降级编辑器（简单textarea）
const initializeFallbackEditor = () => {
  if (!editorContainer.value) return

  console.log('🔄 Initializing fallback editor')

  // 创建简单的textarea编辑器
  const textarea = document.createElement('textarea')
  textarea.value = defaultCode
  textarea.className = 'qaq-fallback-editor'
  textarea.style.cssText = `
    width: 100%;
    height: 100%;
    background: #2a2a2a;
    color: #ffffff;
    border: none;
    outline: none;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
    resize: none;
    tab-size: 2;
  `

  // 清空容器并添加textarea
  editorContainer.value.innerHTML = ''
  editorContainer.value.appendChild(textarea)

  // 监听变化
  textarea.addEventListener('input', () => {
    hasUnsavedChanges.value = true
  })

  // 监听光标位置（简单实现）
  textarea.addEventListener('selectionchange', () => {
    const lines = textarea.value.substring(0, textarea.selectionStart).split('\n')
    currentLine.value = lines.length
    currentColumn.value = lines[lines.length - 1].length + 1
  })

  // 保存引用以便其他函数使用
  editor.value = {
    getValue: () => textarea.value,
    setValue: (value: string) => { textarea.value = value },
    getModel: () => ({ getLanguageId: () => selectedLanguage.value }),
    dispose: () => { textarea.remove() }
  }

  isLoading.value = false
  error.value = ''
  console.log('✅ Fallback editor initialized')
}

const createNewFile = () => {
  if (editor.value) {
    editor.value.setValue('')
    currentFileName.value = 'untitled.ts'
    hasUnsavedChanges.value = false
  }
}

const openFile = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.ts,.js,.json,.html,.css,.scss,.vue,.md,.yaml,.xml'

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file && editor.value) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        editor.value!.setValue(content)
        currentFileName.value = file.name
        hasUnsavedChanges.value = false

        // 根据文件扩展名设置语言
        const extension = file.name.split('.').pop()?.toLowerCase()
        const languageMap: Record<string, string> = {
          'ts': 'typescript',
          'js': 'javascript',
          'json': 'json',
          'html': 'html',
          'css': 'css',
          'scss': 'scss',
          'vue': 'vue',
          'md': 'markdown',
          'yaml': 'yaml',
          'yml': 'yaml',
          'xml': 'xml'
        }

        if (extension && languageMap[extension]) {
          selectedLanguage.value = languageMap[extension]
          changeLanguage()
        }
      }
      reader.readAsText(file)
    }
  }

  input.click()
}

const saveFile = () => {
  if (editor.value) {
    const content = editor.value.getValue()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = currentFileName.value
    a.click()

    URL.revokeObjectURL(url)
    hasUnsavedChanges.value = false
  }
}

const changeLanguage = () => {
  if (editor.value) {
    const model = editor.value.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, selectedLanguage.value)
    }
  }
}

// 重试初始化
const retryInitialization = () => {
  console.log('🔄 Manual retry triggered')
  error.value = ''
  isLoading.value = true

  // 重置Monaco状态
  monaco = null
  isMonacoLoaded.value = false

  // 清理编辑器容器
  if (editorContainer.value) {
    editorContainer.value.innerHTML = ''
  }

  // 重新初始化
  nextTick(() => {
    initializeEditor()
  })
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initializeEditor()
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.dispose()
  }
})
</script>

<style scoped>
.qaq-monaco-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-monaco-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--qaq-editor-panel, #383838);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--qaq-editor-border, #4a4a4a);
  margin: 0 4px;
}

.qaq-language-select {
  min-width: 120px;
}

.qaq-toolbar-right {
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-editor-info {
  font-family: monospace;
}

.qaq-monaco-container {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* 加载状态样式 */
.qaq-editor-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--qaq-editor-bg, #2a2a2a);
  z-index: 1000;
}

.qaq-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--qaq-editor-border, #4a4a4a);
  border-top: 4px solid var(--qaq-primary, #00DC82);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qaq-loading-text {
  text-align: center;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-loading-text h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.qaq-loading-text p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-loading-detail {
  font-family: monospace;
  font-size: 12px;
  color: var(--qaq-primary, #00DC82);
}

/* 错误状态样式 */
.qaq-editor-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--qaq-editor-bg, #2a2a2a);
  z-index: 1000;
  padding: 32px;
  text-align: center;
}

.qaq-error-icon {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.qaq-error-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-error-content p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  max-width: 400px;
  line-height: 1.5;
}

.qaq-error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 降级编辑器样式 */
.qaq-fallback-editor {
  width: 100% !important;
  height: 100% !important;
  background: #2a2a2a !important;
  color: #ffffff !important;
  border: none !important;
  outline: none !important;
  font-family: 'Consolas', 'Courier New', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  padding: 16px !important;
  resize: none !important;
  tab-size: 2 !important;
}

.qaq-fallback-editor:focus {
  outline: 2px solid var(--qaq-primary, #00DC82) !important;
  outline-offset: -2px !important;
}

.qaq-monaco-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
  font-size: 11px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-statusbar-left,
.qaq-statusbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}
</style>
