# QAQ 编辑器详细任务拆分

## 📋 Phase 1: 项目基础架构 (Week 1-2)

### 🔧 1.1 项目初始化 (3天)

#### Day 1: 脚手架搭建
- [ ] **任务1.1.1**: 创建 Vue 3 + TypeScript 项目
  - [ ] 使用 `npm create vue@latest qaq-game-engine` 
  - [ ] 配置 TypeScript 严格模式
  - [ ] 配置 Vite 构建选项
  - [ ] 设置环境变量配置
  - **预期产出**: 基础项目结构

- [ ] **任务1.1.2**: 集成 Nuxt UI Pro
  - [ ] 安装 `@nuxt/ui-pro` 和依赖
  - [ ] 配置 Tailwind CSS
  - [ ] 设置暗色/亮色主题
  - [ ] 创建基础布局组件
  - **预期产出**: UI 组件库可用

#### Day 2: 状态管理和工具配置
- [ ] **任务1.1.3**: Pinia 状态管理配置
  - [ ] 安装和配置 Pinia
  - [ ] 创建 stores 目录结构
  - [ ] 设置状态持久化插件
  - **预期产出**: 状态管理系统

- [ ] **任务1.1.4**: 开发工具配置
  - [ ] ESLint + Prettier 配置
  - [ ] Husky + lint-staged 配置
  - [ ] VS Code 工作区配置
  - [ ] 调试配置文件
  - **预期产出**: 开发环境完善

#### Day 3: 项目结构和依赖
- [ ] **任务1.1.5**: 创建项目目录结构
  ```
  src/
  ├── components/          # Vue 组件
  │   ├── editor/         # 编辑器组件
  │   ├── ui/             # UI 组件
  │   └── dialogs/        # 对话框组件
  ├── stores/             # Pinia 状态管理
  ├── core/               # 核心系统
  │   ├── nodes/          # 节点系统
  │   ├── scenes/         # 场景系统
  │   └── resources/      # 资源系统
  ├── utils/              # 工具函数
  ├── types/              # TypeScript 类型定义
  └── assets/             # 静态资源
  ```

- [ ] **任务1.1.6**: 安装核心依赖
  - [ ] Three.js 和类型定义
  - [ ] 图标库 (Heroicons, Lucide)
  - [ ] 文件处理库
  - [ ] 工具库 (lodash-es, uuid)
  - **预期产出**: 完整的依赖环境

### 🗂️ 1.2 项目管理系统 (4天)

#### Day 1: 核心接口设计
- [ ] **任务1.2.1**: 项目配置接口定义
  ```typescript
  // types/project.ts
  interface ProjectConfig {
    name: string
    version: string
    description: string
    main_scene: string
    settings: ProjectSettings
  }
  
  interface ProjectSettings {
    application: ApplicationSettings
    rendering: RenderingSettings
    input: InputSettings
    physics: PhysicsSettings
  }
  ```

- [ ] **任务1.2.2**: 文件系统抽象接口
  ```typescript
  // core/filesystem/FileSystemManager.ts
  interface FileSystemManager {
    exists(path: string): Promise<boolean>
    readFile(path: string): Promise<string>
    writeFile(path: string, content: string): Promise<void>
    createDirectory(path: string): Promise<void>
    listDirectory(path: string): Promise<FileInfo[]>
  }
  ```

#### Day 2: 项目创建功能
- [ ] **任务1.2.3**: ProjectManager 核心类
  ```typescript
  // stores/projectManager.ts
  export const useProjectManager = defineStore('projectManager', {
    state: () => ({
      currentProject: null as ProjectConfig | null,
      recentProjects: [] as RecentProject[],
      isLoading: false
    }),
    actions: {
      async createProject(config: CreateProjectConfig): Promise<void>
      async importProject(path: string): Promise<void>
      async saveProject(): Promise<void>
    }
  })
  ```

- [ ] **任务1.2.4**: 项目创建向导组件
  ```vue
  <!-- components/dialogs/CreateProjectDialog.vue -->
  <template>
    <UModal v-model="isOpen">
      <div class="p-6">
        <h2>创建新项目</h2>
        <UForm :state="formState" @submit="createProject">
          <!-- 项目信息表单 -->
        </UForm>
      </div>
    </UModal>
  </template>
  ```

#### Day 3: 项目导入功能
- [ ] **任务1.2.5**: 项目验证系统
  - [ ] project.qaq 文件格式验证
  - [ ] 项目完整性检查
  - [ ] 版本兼容性检查
  - [ ] 错误处理和用户提示

- [ ] **任务1.2.6**: 项目导入对话框
  - [ ] 文件选择器集成
  - [ ] 项目预览功能
  - [ ] 导入进度显示
  - [ ] 错误状态处理

#### Day 4: 项目配置文件
- [ ] **任务1.2.7**: project.qaq 文件格式
  ```ini
  ; QAQ Game Engine Project Configuration
  config_version=1
  
  [application]
  config/name="My Game"
  config/description="A game made with QAQ"
  run/main_scene="scenes/Main.tscn"
  
  [rendering]
  renderer/rendering_method="forward_plus"
  ```

- [ ] **任务1.2.8**: 配置文件解析器
  - [ ] INI 格式解析器
  - [ ] 配置验证和默认值
  - [ ] 配置文件生成器
  - [ ] 版本迁移支持

### 💾 1.3 编辑器状态管理 (3天)

#### Day 1: 状态数据结构
- [ ] **任务1.3.1**: EditorState 接口定义
  ```typescript
  // types/editor.ts
  interface EditorState {
    openScenes: SceneTab[]
    currentSceneId: string | null
    panels: PanelStates
    viewport: ViewportState
    selectedNodes: string[]
    recentFiles: string[]
    settings: EditorSettings
  }
  ```

- [ ] **任务1.3.2**: 状态管理 Store
  ```typescript
  // stores/editorState.ts
  export const useEditorState = defineStore('editorState', {
    state: (): EditorState => createDefaultState(),
    actions: {
      updatePanelState(panel: string, state: any): void
      addOpenScene(scene: SceneTab): void
      removeOpenScene(sceneId: string): void
      setSelectedNodes(nodeIds: string[]): void
    }
  })
  ```

#### Day 2: 状态持久化机制
- [ ] **任务1.3.3**: 状态序列化系统
  - [ ] JSON 序列化/反序列化
  - [ ] 状态压缩和优化
  - [ ] 敏感数据过滤
  - [ ] 版本兼容性处理

- [ ] **任务1.3.4**: 自动保存机制
  - [ ] 防抖处理 (300ms)
  - [ ] 状态变化监听
  - [ ] 保存失败重试
  - [ ] 保存状态指示器

#### Day 3: 状态恢复系统
- [ ] **任务1.3.5**: 状态加载和验证
  - [ ] 状态文件完整性检查
  - [ ] 默认状态生成
  - [ ] 状态迁移和升级
  - [ ] 错误恢复机制

- [ ] **任务1.3.6**: 编辑器状态恢复
  - [ ] 面板布局恢复
  - [ ] 打开场景恢复
  - [ ] 选中状态恢复
  - [ ] 视口状态恢复

## 📋 Phase 2: 核心系统架构 (Week 3-4)

### 🎯 2.1 Node 系统核心 (5天)

#### Day 1: 基础对象系统
- [ ] **任务2.1.1**: QaqObject 基类
  ```typescript
  // core/object/QaqObject.ts
  export class QaqObject {
    private _signals: Map<string, Signal>
    private _properties: Map<string, Property>
    
    connect(signal: string, callback: Function): void
    disconnect(signal: string, callback: Function): void
    emit(signal: string, ...args: any[]): void
    
    setProperty(name: string, value: any): void
    getProperty(name: string): any
  }
  ```

- [ ] **任务2.1.2**: 信号系统实现
  - [ ] Signal 类实现
  - [ ] 信号连接管理
  - [ ] 信号发射机制
  - [ ] 内存泄漏防护

#### Day 2: Node 基类实现
- [ ] **任务2.1.3**: Node 核心类
  ```typescript
  // core/nodes/Node.ts
  export class Node extends QaqObject {
    private _parent: Node | null = null
    private _children: Node[] = []
    private _name: string
    
    addChild(child: Node): void
    removeChild(child: Node): void
    getNode(path: string): Node | null
    findChild(name: string, recursive?: boolean): Node | null
    
    _ready(): void
    _process(delta: number): void
    _physicsProcess(delta: number): void
  }
  ```

- [ ] **任务2.1.4**: 节点生命周期管理
  - [ ] 节点初始化流程
  - [ ] 生命周期方法调用
  - [ ] 节点销毁和清理
  - [ ] 错误处理机制

#### Day 3: 节点类型扩展
- [ ] **任务2.1.5**: Node2D 实现
  ```typescript
  // core/nodes/Node2D.ts
  export class Node2D extends Node {
    position: Vector2 = new Vector2()
    rotation: number = 0
    scale: Vector2 = new Vector2(1, 1)
    
    getGlobalPosition(): Vector2
    getGlobalTransform(): Transform2D
    lookAt(point: Vector2): void
  }
  ```

- [ ] **任务2.1.6**: Node3D 实现
  ```typescript
  // core/nodes/Node3D.ts
  export class Node3D extends Node {
    position: Vector3 = new Vector3()
    rotation: Vector3 = new Vector3()
    scale: Vector3 = new Vector3(1, 1, 1)
    
    getGlobalPosition(): Vector3
    getGlobalTransform(): Transform3D
    lookAt(target: Vector3, up?: Vector3): void
  }
  ```

#### Day 4: 控件系统基础
- [ ] **任务2.1.7**: Control 基类
  ```typescript
  // core/nodes/Control.ts
  export class Control extends Node {
    anchorLeft: number = 0
    anchorTop: number = 0
    anchorRight: number = 0
    anchorBottom: number = 0
    
    getRect(): Rect2
    setAnchorsAndOffsetsPreset(preset: ControlPreset): void
  }
  ```

- [ ] **任务2.1.8**: 基础 UI 控件
  - [ ] Label 控件
  - [ ] Button 控件
  - [ ] Panel 控件
  - [ ] Container 控件

#### Day 5: 节点注册和工厂
- [ ] **任务2.1.9**: 节点类型注册系统
  ```typescript
  // core/nodes/NodeRegistry.ts
  export class NodeRegistry {
    private static nodeTypes = new Map<string, NodeConstructor>()
    
    static registerNodeType(name: string, constructor: NodeConstructor): void
    static createNode(typeName: string): Node
    static getNodeTypes(): string[]
  }
  ```

- [ ] **任务2.1.10**: 节点工厂和序列化
  - [ ] 节点创建工厂
  - [ ] 节点序列化支持
  - [ ] 节点克隆功能
  - [ ] 节点类型验证

### 🎬 2.2 场景系统 (4天)

#### Day 1: 场景树管理
- [ ] **任务2.2.1**: SceneTree 核心类
  ```typescript
  // core/scenes/SceneTree.ts
  export class SceneTree {
    private _root: Node | null = null
    private _currentScene: Node | null = null
    
    setCurrentScene(scene: Node): void
    changeScene(scenePath: string): Promise<void>
    reloadCurrentScene(): Promise<void>
    quit(): void
  }
  ```

#### Day 2: 场景资源系统
- [ ] **任务2.2.2**: PackedScene 实现
  ```typescript
  // core/scenes/PackedScene.ts
  export class PackedScene extends Resource {
    private _sceneState: SceneState
    
    pack(node: Node): void
    instantiate(): Node
    canInstantiate(): boolean
  }
  ```

#### Day 3: 场景序列化
- [ ] **任务2.2.3**: SceneState 序列化
  - [ ] 节点状态序列化
  - [ ] 属性值序列化
  - [ ] 资源引用处理
  - [ ] 场景依赖管理

#### Day 4: 场景文件格式
- [ ] **任务2.2.4**: .tscn 文件支持
  - [ ] 文件格式解析
  - [ ] 场景加载器
  - [ ] 场景保存器
  - [ ] 错误处理

### 📦 2.3 资源管理系统 (3天)

#### Day 1: 资源管理核心
- [ ] **任务2.3.1**: ResourceManager 实现
  ```typescript
  // core/resources/ResourceManager.ts
  export class ResourceManager {
    private _cache = new Map<string, Resource>()
    private _loaders = new Map<string, ResourceLoader>()
    
    load(path: string): Promise<Resource>
    preload(path: string): Promise<void>
    unload(path: string): void
  }
  ```

#### Day 2: 资源类型支持
- [ ] **任务2.3.2**: 基础资源类型
  - [ ] Texture 纹理资源
  - [ ] Mesh 网格资源
  - [ ] AudioStream 音频资源
  - [ ] Script 脚本资源

#### Day 3: 资源导入系统
- [ ] **任务2.3.3**: 资源导入器
  - [ ] 图片导入器
  - [ ] 3D模型导入器
  - [ ] 音频导入器
  - [ ] 导入设置管理

## 🎨 Phase 3: 编辑器界面系统 (Week 5-7)

### 🖼️ 3.1 主编辑器布局 (3天)

#### Day 1: 布局框架
- [ ] **任务3.1.1**: EditorLayout 主组件
  ```vue
  <!-- components/editor/EditorLayout.vue -->
  <template>
    <div class="editor-layout">
      <EditorMenuBar />
      <div class="editor-main">
        <EditorLeftPanel />
        <EditorCenterArea />
        <EditorRightPanel />
      </div>
      <EditorBottomPanel />
    </div>
  </template>
  ```

#### Day 2: 可调整面板
- [ ] **任务3.1.2**: ResizablePanel 组件
  - [ ] 面板拖拽调整
  - [ ] 最小/最大尺寸限制
  - [ ] 面板折叠/展开
  - [ ] 布局状态保存

#### Day 3: 菜单系统
- [ ] **任务3.1.3**: 菜单栏实现
  - [ ] 主菜单结构
  - [ ] 动态菜单项
  - [ ] 快捷键绑定
  - [ ] 上下文菜单

### 📊 3.2 核心面板组件 (8天)

#### Day 1-2: 场景树面板
- [ ] **任务3.2.1**: SceneTreeDock 基础
  ```vue
  <!-- components/editor/SceneTreeDock.vue -->
  <template>
    <div class="scene-tree-dock">
      <div class="toolbar">
        <UButton @click="addNode">+</UButton>
        <UButton @click="deleteNode">-</UButton>
      </div>
      <div class="tree-view">
        <SceneTreeItem 
          v-for="node in rootNodes" 
          :key="node.id"
          :node="node"
          @select="selectNode"
        />
      </div>
    </div>
  </template>
  ```

- [ ] **任务3.2.2**: 场景树交互功能
  - [ ] 节点拖拽重排
  - [ ] 多选支持
  - [ ] 右键菜单
  - [ ] 节点搜索过滤

#### Day 3-4: 属性检查器
- [ ] **任务3.2.3**: InspectorDock 基础
  - [ ] 动态属性列表
  - [ ] 属性分组显示
  - [ ] 属性搜索功能
  - [ ] 属性重置功能

- [ ] **任务3.2.4**: 属性编辑器组件
  - [ ] BoolEditor (复选框)
  - [ ] NumberEditor (数字输入)
  - [ ] StringEditor (文本输入)
  - [ ] Vector2Editor (向量编辑)
  - [ ] Vector3Editor (向量编辑)
  - [ ] ColorEditor (颜色选择器)

#### Day 5-6: 文件系统面板
- [ ] **任务3.2.5**: FileSystemDock 基础
  ```vue
  <!-- components/editor/FileSystemDock.vue -->
  <template>
    <div class="filesystem-dock">
      <div class="toolbar">
        <UButton @click="refresh">刷新</UButton>
        <UButton @click="newFolder">新建文件夹</UButton>
      </div>
      <div class="file-tree">
        <FileTreeItem 
          v-for="item in fileTree" 
          :key="item.path"
          :item="item"
          @select="selectFile"
        />
      </div>
    </div>
  </template>
  ```

- [ ] **任务3.2.6**: 文件操作功能
  - [ ] 文件拖拽导入
  - [ ] 文件重命名
  - [ ] 文件删除确认
  - [ ] 文件预览功能

#### Day 7-8: 视口工具栏
- [ ] **任务3.2.7**: ViewportToolbar 组件
  - [ ] 工具选择按钮
  - [ ] 视口模式切换
  - [ ] 网格显示控制
  - [ ] 相机控制选项

### 🎮 3.3 视口系统 (4天)

#### Day 1-2: 3D 视口
- [ ] **任务3.3.1**: EditorViewport3D 组件
  ```vue
  <!-- components/editor/EditorViewport3D.vue -->
  <template>
    <div class="viewport-3d" ref="container">
      <canvas ref="canvas"></canvas>
      <ViewportOverlay />
    </div>
  </template>
  ```

- [ ] **任务3.3.2**: Three.js 集成
  - [ ] 场景渲染器设置
  - [ ] 相机控制器
  - [ ] 光照系统
  - [ ] 网格和辅助线

#### Day 3: 2D 视口
- [ ] **任务3.3.3**: EditorViewport2D 组件
  - [ ] 2D 渲染系统
  - [ ] 2D 相机控制
  - [ ] 像素完美显示
  - [ ] 2D 网格系统

#### Day 4: 视口工具
- [ ] **任务3.3.4**: 变换工具实现
  - [ ] 选择工具
  - [ ] 移动 Gizmo
  - [ ] 旋转 Gizmo
  - [ ] 缩放 Gizmo

## 📈 预期产出和验收标准

### Phase 1 验收标准
- ✅ 能够创建新项目并生成正确的目录结构
- ✅ 能够导入现有项目并验证完整性
- ✅ 编辑器状态能够正确保存和恢复
- ✅ 项目管理界面功能完整

### Phase 2 验收标准
- ✅ Node 系统能够正确创建和管理节点层次
- ✅ 场景能够正确保存和加载
- ✅ 资源管理系统能够处理基本资源类型
- ✅ 信号系统能够正常工作

### Phase 3 验收标准
- ✅ 编辑器界面布局完整且可调整
- ✅ 所有核心面板功能正常
- ✅ 3D/2D 视口能够正确渲染
- ✅ 基础编辑工具可用

## 🔄 迭代和测试计划

每个 Phase 结束后进行：
1. **功能测试**: 验证所有功能按预期工作
2. **性能测试**: 确保响应时间和内存使用合理
3. **用户体验测试**: 界面交互流畅性测试
4. **代码审查**: 代码质量和架构合理性审查
5. **文档更新**: 更新相关文档和注释
