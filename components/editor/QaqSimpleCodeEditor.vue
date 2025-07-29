<template>
  <div class="qaq-simple-code-editor">
    <!-- 编辑器工具栏 -->
    <div class="qaq-editor-toolbar">
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
          @change="updateLanguage"
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

    <!-- 代码编辑器 -->
    <div class="qaq-editor-container">
      <textarea
        ref="codeEditor"
        v-model="code"
        class="qaq-code-textarea"
        :placeholder="placeholder"
        @input="onCodeChange"
        @keydown="onKeyDown"
        @click="updateCursorPosition"
        @keyup="updateCursorPosition"
        spellcheck="false"
      ></textarea>
      
      <!-- 行号 -->
      <div class="qaq-line-numbers">
        <div
          v-for="lineNumber in lineCount"
          :key="lineNumber"
          class="qaq-line-number"
          :class="{ 'active': lineNumber === currentLine }"
        >
          {{ lineNumber }}
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="qaq-editor-statusbar">
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
        <span class="qaq-status-item">{{ selectedLanguage }}</span>
        <span class="qaq-status-item">{{ code.length }} 字符</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

// 响应式状态
const codeEditor = ref<HTMLTextAreaElement>()
const code = ref('')
const currentLine = ref(1)
const currentColumn = ref(1)
const currentFileName = ref('untitled.ts')
const hasUnsavedChanges = ref(false)
const selectedLanguage = ref('typescript')

// 语言选项
const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Vue', value: 'vue' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Plain Text', value: 'text' }
]

// 计算属性
const lineCount = computed(() => {
  return Math.max(1, code.value.split('\n').length)
})

const placeholder = computed(() => {
  const placeholders: Record<string, string> = {
    typescript: '// QAQ Game Engine TypeScript Script\nclass GameScript {\n  start() {\n    // 游戏开始时调用\n  }\n}',
    javascript: '// QAQ Game Engine JavaScript Script\nclass GameScript {\n  start() {\n    // 游戏开始时调用\n  }\n}',
    json: '{\n  "name": "QAQ Game Object",\n  "type": "GameObject",\n  "components": []\n}',
    html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>QAQ Game UI</title>\n</head>\n<body>\n  <div id="game-ui"></div>\n</body>\n</html>',
    css: '/* QAQ Game Engine Styles */\n.game-ui {\n  background: #2a2a2a;\n  color: #ffffff;\n}',
    vue: '<template>\n  <div class="qaq-component">\n    <!-- QAQ Game Component -->\n  </div>\n</template>',
    markdown: '# QAQ Game Engine Documentation\n\n## Overview\n\nThis is a QAQ game engine document.',
    text: 'QAQ Game Engine Text File\n\nWrite your content here...'
  }
  return placeholders[selectedLanguage.value] || 'Start typing...'
})

// 方法
const onCodeChange = () => {
  hasUnsavedChanges.value = true
  updateCursorPosition()
}

const updateCursorPosition = async () => {
  await nextTick()
  if (codeEditor.value) {
    const textarea = codeEditor.value
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = code.value.substring(0, cursorPos)
    const lines = textBeforeCursor.split('\n')
    
    currentLine.value = lines.length
    currentColumn.value = lines[lines.length - 1].length + 1
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  // Tab键处理
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // 插入两个空格代替Tab
    const spaces = '  '
    code.value = code.value.substring(0, start) + spaces + code.value.substring(end)
    
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + spaces.length
    })
  }
  
  // Ctrl+S 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    saveFile()
  }
  
  // Ctrl+N 新建
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    createNewFile()
  }
}

const createNewFile = () => {
  code.value = ''
  currentFileName.value = 'untitled.ts'
  hasUnsavedChanges.value = false
  currentLine.value = 1
  currentColumn.value = 1
}

const openFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.ts,.js,.json,.html,.css,.vue,.md,.txt'
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        code.value = content
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
          'vue': 'vue',
          'md': 'markdown',
          'txt': 'text'
        }
        
        if (extension && languageMap[extension]) {
          selectedLanguage.value = languageMap[extension]
        }
      }
      reader.readAsText(file)
    }
  }
  
  input.click()
}

const saveFile = () => {
  const content = code.value
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = currentFileName.value
  a.click()
  
  URL.revokeObjectURL(url)
  hasUnsavedChanges.value = false
}

const updateLanguage = () => {
  // 语言切换时可以添加特定逻辑
  console.log('Language changed to:', selectedLanguage.value)
}

// 生命周期
onMounted(() => {
  // 设置默认代码
  if (!code.value) {
    code.value = placeholder.value
  }
})
</script>

<style scoped>
.qaq-simple-code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.qaq-editor-toolbar {
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

.qaq-editor-container {
  flex: 1;
  position: relative;
  display: flex;
  min-height: 0;
}

.qaq-line-numbers {
  width: 50px;
  background: var(--qaq-editor-panel, #383838);
  border-right: 1px solid var(--qaq-editor-border, #4a4a4a);
  padding: 12px 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  user-select: none;
  overflow: hidden;
}

.qaq-line-number {
  text-align: right;
  height: 19.5px;
  transition: color 0.2s ease;
}

.qaq-line-number.active {
  color: var(--qaq-primary, #00DC82);
  font-weight: bold;
}

.qaq-code-textarea {
  flex: 1;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
  border: none;
  outline: none;
  padding: 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
  tab-size: 2;
}

.qaq-code-textarea::placeholder {
  color: var(--qaq-editor-text-muted, #aaaaaa);
  opacity: 0.7;
}

.qaq-code-textarea:focus {
  background: var(--qaq-editor-bg, #2a2a2a);
}

.qaq-editor-statusbar {
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
