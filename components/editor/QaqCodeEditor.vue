<template>
  <div class="qaq-code-editor">
    <!-- 编辑器工具栏 -->
    <div class="qaq-editor-toolbar">
      <div class="qaq-toolbar-left">
        <!-- 文件标签页 -->
        <div class="qaq-file-tabs">
          <div
            v-for="file in openFiles"
            :key="file.path"
            class="qaq-file-tab"
            :class="{ 'qaq-tab-active': activeFile?.path === file.path }"
            @click="setActiveFile(file)"
          >
            <UIcon :name="getFileIcon(file.name)" class="qaq-file-icon" />
            <span class="qaq-file-name">{{ file.name }}</span>
            <UButton
              v-if="file.isDirty"
              icon="i-heroicons-circle"
              variant="ghost"
              size="xs"
              class="qaq-dirty-indicator"
            />
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="xs"
              class="qaq-close-tab"
              @click.stop="closeFile(file)"
            />
          </div>
        </div>
      </div>

      <div class="qaq-toolbar-right">
        <!-- 编辑器设置 -->
        <UDropdown :items="editorMenuItems">
          <UButton
            icon="i-heroicons-cog-6-tooth"
            variant="ghost"
            size="sm"
          />
        </UDropdown>
      </div>
    </div>

    <!-- Monaco编辑器容器 -->
    <div class="qaq-editor-container">
      <!-- Monaco Editor 不可用时的提示 -->
      <div v-if="!isMonacoAvailable" class="qaq-monaco-fallback">
        <div class="qaq-fallback-content">
          <UIcon name="i-heroicons-exclamation-triangle" class="qaq-fallback-icon" />
          <h3>Monaco Editor Not Available</h3>
          <p>Monaco Editor dependencies are not installed. Please install them to use the code editor.</p>
          <div class="qaq-fallback-install">
            npm install monaco-editor
          </div>
          <UButton
            icon="i-heroicons-document-text"
            variant="ghost"
            @click="createSimpleEditor"
          >
            Use Simple Text Editor Instead
          </UButton>
        </div>
      </div>

      <!-- Monaco编辑器 -->
      <div
        v-else
        ref="editorContainer"
        class="qaq-monaco-editor"
      ></div>

      <!-- 空状态 -->
      <div v-if="!activeFile && isMonacoAvailable" class="qaq-empty-editor">
        <div class="qaq-empty-content">
          <UIcon name="i-heroicons-code-bracket" class="qaq-empty-icon" />
          <h3>No file open</h3>
          <p>Open a file to start editing</p>
          <UButton
            icon="i-heroicons-document-plus"
            @click="createNewFile"
          >
            Create New File
          </UButton>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="qaq-status-bar">
      <div class="qaq-status-left">
        <span v-if="activeFile" class="qaq-file-info">
          {{ activeFile.language }} • Line {{ cursorPosition.line }}, Column {{ cursorPosition.column }}
        </span>
      </div>

      <div class="qaq-status-right">
        <span class="qaq-encoding">UTF-8</span>
        <span class="qaq-line-ending">LF</span>
        <UButton
          v-if="activeFile?.isDirty"
          variant="ghost"
          size="xs"
          @click="saveFile"
        >
          Save
        </UButton>
      </div>
    </div>

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
              placeholder="script.js"
              @keyup.enter="confirmCreateFile"
            />
          </UFormGroup>

          <UFormGroup label="File Type">
            <USelectMenu
              v-model="newFileType"
              :options="fileTypeOptions"
              placeholder="Select file type"
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
              @click="confirmCreateFile"
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
import { ref, onMounted, onUnmounted, nextTick, watch, defineAsyncComponent } from 'vue'

// Monaco Editor 类型定义（临时）
interface MonacoEditor {
  getValue(): string
  setValue(value: string): void
  dispose(): void
  focus(): void
  setModel(model: any): void
  getOption(option: any): any
  updateOptions(options: any): void
  getAction(actionId: string): any
  onDidChangeCursorPosition(callback: (e: any) => void): void
  onDidChangeModelContent(callback: () => void): void
}

// 检查Monaco Editor是否可用
const isMonacoAvailable = ref(true) // 默认设为true，尝试加载

// 文件接口定义
interface EditorFile {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  model?: monaco.editor.ITextModel
}

// 响应式数据
const editorContainer = ref<HTMLElement>()
const editor = ref<monaco.editor.IStandaloneCodeEditor>()
const openFiles = ref<EditorFile[]>([])
const activeFile = ref<EditorFile | null>(null)
const cursorPosition = ref({ line: 1, column: 1 })
const showNewFileDialog = ref(false)
const newFileName = ref('')
const newFileType = ref('javascript')

// 编辑器菜单项
const editorMenuItems = [
  [
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      click: () => openSettings()
    },
    {
      label: 'Toggle Word Wrap',
      icon: 'i-heroicons-arrows-right-left',
      click: () => toggleWordWrap()
    }
  ],
  [
    {
      label: 'Format Document',
      icon: 'i-heroicons-sparkles',
      click: () => formatDocument()
    }
  ]
]

// 文件类型选项
const fileTypeOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'C#', value: 'csharp' },
  { label: 'GLSL', value: 'glsl' },
  { label: 'Plain Text', value: 'plaintext' }
]

// 方法
function initializeEditor() {
  if (!editorContainer.value) return

  try {
    // 尝试动态导入Monaco Editor
    import('monaco-editor').then(async (monaco) => {
      isMonacoAvailable.value = true

      // 配置TypeScript编译器选项
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
        strict: true,
        noImplicitAny: false,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedLocals: false,
        noUnusedParameters: false
      })

      // 配置诊断选项
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false
      })

      // 添加QAQ引擎类型定义
      await setupQAQTypeDefinitions(monaco)

      // 添加常用库的类型定义
      await setupLibraryTypeDefinitions(monaco)

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
          { token: 'class', foreground: '4EC9B0' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' }
        ],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.foreground': '#ffffff',
          'editorLineNumber.foreground': '#666666',
          'editor.selectionBackground': '#00DC8240',
          'editor.lineHighlightBackground': '#1a1a1a',
          'editorCursor.foreground': '#00DC82',
          'editor.findMatchBackground': '#00DC8240',
          'editor.findMatchHighlightBackground': '#00DC8220'
        }
      })

      // 创建编辑器实例
      editor.value = monaco.editor.create(editorContainer.value, {
        theme: 'qaq-dark',
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'off',
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        // TypeScript特性
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: true,
        // 代码折叠
        folding: true,
        foldingStrategy: 'indentation',
        // 括号匹配
        matchBrackets: 'always',
        // 自动格式化
        formatOnType: true,
        formatOnPaste: true,
        // 错误提示
        glyphMargin: true,
        // 参数提示
        parameterHints: {
          enabled: true,
          cycle: true
        },
        // 悬停提示
        hover: {
          enabled: true,
          delay: 300
        }
      })

      // 设置快捷键
      setupEditorKeybindings(monaco)

      // 监听光标位置变化
      editor.value.onDidChangeCursorPosition((e) => {
        cursorPosition.value = {
          line: e.position.lineNumber,
          column: e.position.column
        }
      })

      // 监听内容变化
      editor.value.onDidChangeModelContent(() => {
        if (activeFile.value) {
          activeFile.value.isDirty = true
          activeFile.value.content = editor.value?.getValue() || ''
        }
      })

      console.log('✅ Monaco Editor with TypeScript support initialized')
    }).catch(error => {
      console.error('Failed to load Monaco Editor:', error)
      isMonacoAvailable.value = false
    })
  } catch (error) {
    console.error('Error initializing editor:', error)
    isMonacoAvailable.value = false
  }
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    'js': 'i-vscode-icons-file-type-js',
    'ts': 'i-vscode-icons-file-type-typescript',
    'json': 'i-vscode-icons-file-type-json',
    'html': 'i-vscode-icons-file-type-html',
    'css': 'i-vscode-icons-file-type-css',
    'py': 'i-vscode-icons-file-type-python',
    'cs': 'i-vscode-icons-file-type-csharp',
    'glsl': 'i-vscode-icons-file-type-glsl'
  }
  return iconMap[ext || ''] || 'i-heroicons-document-text'
}

function getLanguageFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'py': 'python',
    'cs': 'csharp',
    'glsl': 'glsl'
  }
  return langMap[ext || ''] || 'plaintext'
}

function createNewFile() {
  showNewFileDialog.value = true
  newFileName.value = ''
  newFileType.value = 'javascript'
}

function confirmCreateFile() {
  if (!newFileName.value.trim()) return

  const file: EditorFile = {
    path: `/${newFileName.value}`,
    name: newFileName.value,
    content: getTemplateContent(newFileType.value),
    language: newFileType.value,
    isDirty: true
  }

  openFile(file)
  showNewFileDialog.value = false
}

function getTemplateContent(fileType: string): string {
  const templates: Record<string, string> = {
    'javascript': '// JavaScript file\nconsole.log("Hello, QAQ Game Engine!");\n',
    'typescript': '// TypeScript file\nconsole.log("Hello, QAQ Game Engine!");\n',
    'json': '{\n  "name": "example",\n  "version": "1.0.0"\n}\n',
    'html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>QAQ Game Engine</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n',
    'css': '/* CSS file */\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: Arial, sans-serif;\n}\n',
    'python': '# Python file\nprint("Hello, QAQ Game Engine!")\n',
    'csharp': '// C# file\nusing System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, QAQ Game Engine!");\n    }\n}\n',
    'glsl': '// GLSL Shader\n#version 330 core\n\nvoid main()\n{\n    // Shader code here\n}\n'
  }
  return templates[fileType] || ''
}

function openFile(file: EditorFile) {
  // 检查文件是否已经打开
  const existingFile = openFiles.value.find(f => f.path === file.path)
  if (existingFile) {
    setActiveFile(existingFile)
    return
  }

  // 创建Monaco模型
  file.model = monaco.editor.createModel(file.content, file.language)

  // 添加到打开文件列表
  openFiles.value.push(file)
  setActiveFile(file)
}

function setActiveFile(file: EditorFile) {
  activeFile.value = file
  if (editor.value && file.model) {
    editor.value.setModel(file.model)
    editor.value.focus()
  }
}

function closeFile(file: EditorFile) {
  const index = openFiles.value.findIndex(f => f.path === file.path)
  if (index >= 0) {
    // 销毁Monaco模型
    file.model?.dispose()

    // 从列表中移除
    openFiles.value.splice(index, 1)

    // 如果关闭的是当前文件，切换到其他文件
    if (activeFile.value?.path === file.path) {
      if (openFiles.value.length > 0) {
        const newIndex = Math.min(index, openFiles.value.length - 1)
        setActiveFile(openFiles.value[newIndex])
      } else {
        activeFile.value = null
        editor.value?.setModel(null)
      }
    }
  }
}

function saveFile() {
  if (activeFile.value) {
    activeFile.value.isDirty = false
    console.log('💾 Saved file:', activeFile.value.path)
    // TODO: 实现实际的文件保存逻辑
  }
}

function openSettings() {
  console.log('⚙️ Open editor settings')
  // TODO: 实现编辑器设置
}

function toggleWordWrap() {
  if (editor.value) {
    const currentWrap = editor.value.getOption(monaco.editor.EditorOption.wordWrap)
    editor.value.updateOptions({
      wordWrap: currentWrap === 'off' ? 'on' : 'off'
    })
  }
}

function formatDocument() {
  if (editor.value) {
    editor.value.getAction('editor.action.formatDocument')?.run()
  }
}

function createSimpleEditor() {
  console.log('🔄 Creating simple text editor fallback')
  // TODO: 实现简单文本编辑器
}

// TypeScript类型定义设置
async function setupQAQTypeDefinitions(monaco: any) {
  const qaqEngineTypes = `
declare module '@qaq/engine' {
  // 核心引擎类
  export class Engine {
    constructor();
    initialize(): Promise<void>;
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    getVersion(): string;
    isRunning(): boolean;
  }

  // 场景管理
  export class Scene {
    name: string;
    constructor(name?: string);
    addChild(node: Node): void;
    removeChild(node: Node): void;
    getChild(name: string): Node | null;
    getChildren(): Node[];
    findNode(name: string): Node | null;
    clear(): void;
  }

  // 节点基类
  export class Node {
    name: string;
    parent: Node | null;
    children: Node[];

    constructor(name?: string);
    addChild(node: Node): void;
    removeChild(node: Node): void;
    getChild(name: string): Node | null;
    findChild(name: string): Node | null;
    queueFree(): void;
    isInTree(): boolean;
  }

  // 3D节点
  export class Node3D extends Node {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    transform: Transform3D;

    constructor(name?: string);
    translate(offset: Vector3): void;
    rotate(axis: Vector3, angle: number): void;
    lookAt(target: Vector3, up?: Vector3): void;
    getGlobalPosition(): Vector3;
    getGlobalRotation(): Vector3;
  }

  // 网格实例
  export class MeshInstance3D extends Node3D {
    mesh: Mesh | null;
    material: Material | null;

    constructor(name?: string);
    setMesh(mesh: Mesh): void;
    setMaterial(material: Material): void;
    getMesh(): Mesh | null;
    getMaterial(): Material | null;
  }

  // 数学类型
  export interface Vector3 {
    x: number;
    y: number;
    z: number;
    add(other: Vector3): Vector3;
    subtract(other: Vector3): Vector3;
    multiply(scalar: number): Vector3;
    normalize(): Vector3;
    length(): number;
    distance(other: Vector3): number;
  }

  export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
    toHex(): string;
    fromHex(hex: string): Color;
  }

  // 资源类型
  export class Resource {
    path: string;
    constructor(path?: string);
    load(): Promise<void>;
    isLoaded(): boolean;
  }

  export class Mesh extends Resource {
    vertices: number[];
    indices: number[];
    normals: number[];
    uvs: number[];

    constructor();
    createBox(size: Vector3): void;
    createSphere(radius: number, segments: number): void;
  }

  export class Material extends Resource {
    albedo: Color;
    metallic: number;
    roughness: number;

    constructor();
    setTexture(slot: string, texture: Texture): void;
  }

  export class Texture extends Resource {
    width: number;
    height: number;

    constructor();
    loadFromFile(path: string): Promise<void>;
  }

  // 输入系统
  export class Input {
    static isActionPressed(action: string): boolean;
    static getMousePosition(): Vector2;
  }

  export interface Vector2 {
    x: number;
    y: number;
  }
}
`

  // 添加QAQ引擎类型定义
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    qaqEngineTypes,
    'file:///node_modules/@qaq/engine/index.d.ts'
  )

  console.log('✅ QAQ Engine type definitions loaded')
}

async function setupLibraryTypeDefinitions(monaco: any) {
  // Three.js基础类型定义
  const threeJsTypes = `
declare module 'three' {
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    add(v: Vector3): this;
    normalize(): this;
    length(): number;
  }

  export class Scene {
    constructor();
    add(object: Object3D): this;
    remove(object: Object3D): this;
  }

  export class Object3D {
    name: string;
    position: Vector3;
    constructor();
    add(object: Object3D): this;
  }

  export class Mesh extends Object3D {
    constructor(geometry?: any, material?: any);
  }
}
`

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    threeJsTypes,
    'file:///node_modules/@types/three/index.d.ts'
  )

  console.log('✅ Library type definitions loaded')
}

function setupEditorKeybindings(monaco: any) {
  if (!editor.value) return

  // 保存文件
  editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveCurrentFile()
  })

  // 新建文件
  editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, () => {
    createNewFile()
  })

  // 格式化代码
  editor.value.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
    editor.value?.getAction('editor.action.formatDocument')?.run()
  })

  console.log('✅ Editor keybindings configured')
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initializeEditor()

  // 创建示例文件
  const exampleFile: EditorFile = {
    path: '/example.js',
    name: 'example.js',
    content: '// Welcome to QAQ Game Engine Code Editor\nconsole.log("Hello, World!");\n\n// Start coding here...\n',
    language: 'javascript',
    isDirty: false
  }

  openFile(exampleFile)
})

onUnmounted(() => {
  // 清理Monaco编辑器
  editor.value?.dispose()
  openFiles.value.forEach(file => file.model?.dispose())
})

// 暴露方法给父组件
defineExpose({
  openFile,
  createNewFile,
  saveFile
})
</script>

<style scoped>
.qaq-code-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-editor-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  flex-shrink: 0;
}

.qaq-toolbar-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.qaq-file-tabs {
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.qaq-file-tabs::-webkit-scrollbar {
  display: none;
}

.qaq-file-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  min-width: 120px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
}

.qaq-file-tab:hover {
  background-color: var(--qaq-hover, rgba(255, 255, 255, 0.1));
}

.qaq-tab-active {
  background-color: var(--qaq-bg-primary, #0a0a0a) !important;
  border-bottom: 2px solid var(--qaq-accent, #00DC82);
}

.qaq-file-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.qaq-file-name {
  font-size: 0.875rem;
  color: var(--qaq-text-primary, #ffffff);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qaq-dirty-indicator {
  width: 8px;
  height: 8px;
  color: var(--qaq-accent, #00DC82);
}

.qaq-close-tab {
  width: 16px;
  height: 16px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.qaq-file-tab:hover .qaq-close-tab {
  opacity: 1;
}

.qaq-toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.qaq-editor-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.qaq-monaco-editor {
  width: 100%;
  height: 100%;
}

.qaq-empty-editor {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-empty-content {
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  opacity: 0.5;
}

.qaq-empty-content h3 {
  font-size: 1.25rem;
  margin: 0 0 8px 0;
}

.qaq-empty-content p {
  margin: 0 0 16px 0;
  opacity: 0.7;
}

.qaq-status-bar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  font-size: 0.75rem;
  color: var(--qaq-text-secondary, #cccccc);
  flex-shrink: 0;
}

.qaq-status-left,
.qaq-status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-new-file-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0;
}

.qaq-monaco-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-fallback-content {
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
  max-width: 400px;
  padding: 32px;
}

.qaq-fallback-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  opacity: 0.5;
  color: #f59e0b;
}

.qaq-fallback-content h3 {
  font-size: 1.25rem;
  margin: 0 0 8px 0;
  color: var(--qaq-text-primary, #ffffff);
}

.qaq-fallback-content p {
  margin: 0 0 16px 0;
  opacity: 0.7;
  line-height: 1.5;
}

.qaq-fallback-install {
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  padding: 12px 16px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--qaq-accent, #00DC82);
  margin-bottom: 16px;
}
</style>
