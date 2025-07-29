/**
 * QAQ游戏引擎 - 项目导出类型定义
 * 
 * 定义项目导出系统的所有接口和类型
 */

// ============================================================================
// 枚举类型定义
// ============================================================================

export enum ProjectExportVersion {
  V1_0_0 = '1.0.0',
  V1_1_0 = '1.1.0',
  CURRENT = '1.0.0'
}

export enum ExportFormat {
  JSON = 'json',
  BINARY = 'binary',
  COMPRESSED = 'compressed'
}

export enum ResourceType {
  MODEL = 'model',
  TEXTURE = 'texture',
  AUDIO = 'audio',
  SCRIPT = 'script',
  ANIMATION = 'animation',
  MATERIAL = 'material'
}

export enum EngineState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  DESTROYED = 'destroyed'
}

// ============================================================================
// 核心数据接口
// ============================================================================

/**
 * 引擎状态数据接口
 */
export interface EngineStateData {
  state: EngineState
  config: {
    width: number
    height: number
    antialias: boolean
    enableShadows: boolean
    backgroundColor: number
    pixelRatio?: number
    powerPreference?: string
  }
  renderer: {
    type: string
    capabilities: Record<string, any>
    extensions: string[]
    parameters: Record<string, any>
  }
  canvas: {
    width: number
    height: number
    style: Record<string, string>
  }
  performance: {
    fps: number
    frameTime: number
    memoryUsage?: number
  }
}

/**
 * 场景树数据接口
 */
export interface SceneTreeData {
  currentScene: string | null
  scenes: Record<string, any>
  rootNodes: string[]
  nodeHierarchy: Record<string, string[]>
  nodeCount: number
}

/**
 * 脚本系统数据接口
 */
export interface ScriptSystemData {
  registeredClasses: Record<string, {
    className: string
    source?: string
    metadata: Record<string, any>
  }>
  scriptInstances: Record<string, {
    nodeId: string
    className: string
    properties: Record<string, any>
    state: 'ready' | 'running' | 'paused' | 'error'
  }>
  globalScripts: string[]
}

/**
 * 动画系统数据接口
 */
export interface AnimationSystemData {
  stateMachines: Record<string, {
    nodeId: string
    states: Record<string, any>
    parameters: Record<string, any>
    transitions: any[]
    currentState: string | null
  }>
  animationPlayers: Record<string, {
    nodeId: string
    animations: Record<string, any>
    currentAnimation: string | null
    playbackState: 'playing' | 'paused' | 'stopped'
    time: number
    speed: number
  }>
  globalMixers: any[]
}

/**
 * 编辑器状态接口
 */
export interface EditorStateData {
  mode: 'runtime' | 'editor' | 'debug'
  selectedNodes: string[]
  viewportState: {
    camera: {
      position: { x: number; y: number; z: number }
      rotation: { x: number; y: number; z: number }
      zoom: number
    }
    grid: {
      visible: boolean
      size: number
      divisions: number
    }
    gizmos: {
      visible: boolean
      mode: 'translate' | 'rotate' | 'scale'
    }
  }
  panels: {
    hierarchy: { visible: boolean; width: number }
    inspector: { visible: boolean; width: number }
    console: { visible: boolean; height: number }
  }
  debugOptions: {
    showFPS: boolean
    showMemory: boolean
    showWireframe: boolean
    showBoundingBoxes: boolean
  }
}

/**
 * 资源引用接口（类似Godot的资源系统）
 */
export interface ResourceReference {
  uuid: string                    // 资源唯一标识符
  type: ResourceType             // 资源类型
  originalPath: string           // 原始文件路径
  relativePath: string           // 项目相对路径
  absolutePath?: string          // 绝对路径（运行时计算）
  size: number                   // 文件大小
  checksum: string               // 文件校验和
  lastModified: number           // 最后修改时间
  dependencies: string[]         // 依赖的其他资源UUID
  metadata: ResourceMetadata     // 资源元数据
  importSettings?: ImportSettings // 导入设置
}

/**
 * 资源元数据接口
 */
export interface ResourceMetadata {
  format: string                 // 文件格式
  version?: string               // 格式版本
  compression?: string           // 压缩方式
  quality?: number               // 质量设置
  dimensions?: { width: number; height: number } // 图片/视频尺寸
  duration?: number              // 音频/视频时长
  channels?: number              // 音频声道数
  sampleRate?: number            // 音频采样率
  customProperties?: Record<string, any> // 自定义属性
}

/**
 * 导入设置接口
 */
export interface ImportSettings {
  importer: string               // 导入器类型
  importerVersion: string        // 导入器版本
  settings: Record<string, any>  // 导入器特定设置
  generateMipmaps?: boolean      // 生成Mipmap
  textureFormat?: string         // 纹理格式
  compressionQuality?: number    // 压缩质量
  audioFormat?: string           // 音频格式
  meshOptimization?: boolean     // 网格优化
}

/**
 * 资源清单接口（增强版）
 */
export interface ResourceManifest {
  version: string                // 清单版本
  projectRoot: string            // 项目根目录
  resources: Record<string, ResourceReference> // UUID -> 资源引用
  pathToUuid: Record<string, string>           // 路径 -> UUID映射
  typeIndex: Record<ResourceType, string[]>    // 类型索引
  dependencyGraph: Record<string, string[]>    // 依赖图
  totalSize: number              // 总大小
  resourceCount: number          // 资源数量
  missingResources: string[]     // 缺失资源UUID
  brokenReferences: string[]     // 损坏的引用
  lastScan: number               // 最后扫描时间
}

/**
 * 用户配置接口
 */
export interface UserConfigData {
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    autoSave: boolean
    autoSaveInterval: number
  }
  shortcuts: Record<string, string>
  customSettings: Record<string, any>
  recentProjects: string[]
}

/**
 * 项目元数据接口
 */
export interface ProjectMetadata {
  name: string
  version: string
  description?: string
  author?: string
  created: number
  modified: number
  engineVersion: string
  exportVersion: ProjectExportVersion
  platform: string
  checksum: string
  tags: string[]
}

/**
 * 主项目导出数据接口
 */
export interface ProjectExportData {
  metadata: ProjectMetadata
  engineState: EngineStateData
  sceneTree: SceneTreeData
  scriptSystem: ScriptSystemData
  animationSystem: AnimationSystemData
  editorState: EditorStateData
  resourceManifest: ResourceManifest
  userConfig: UserConfigData
  customData?: Record<string, any>
}

// ============================================================================
// 导出选项接口
// ============================================================================

/**
 * 项目导出选项
 */
export interface ProjectExportOptions {
  format: ExportFormat
  fileName?: string
  includeResources: boolean
  includeEditorState: boolean
  includeUserConfig: boolean
  compression: boolean
  validation: boolean
  onProgress?: (progress: number, message: string, details?: any) => void
  onError?: (error: Error, context?: string) => void
  onComplete?: (result: ProjectExportResult) => void
}

/**
 * 项目导入选项
 */
export interface ProjectImportOptions {
  validateVersion: boolean
  clearCurrentProject: boolean
  restoreEditorState: boolean
  restoreUserConfig: boolean
  loadResources: boolean
  onProgress?: (progress: number, message: string, details?: any) => void
  onError?: (error: Error, context?: string) => void
  onComplete?: (result: ProjectImportResult) => void
}

/**
 * 导出结果接口
 */
export interface ProjectExportResult {
  success: boolean
  fileName: string
  fileSize: number
  exportTime: number
  metadata: ProjectMetadata
  warnings: string[]
  errors: string[]
}

/**
 * 导入结果接口
 */
export interface ProjectImportResult {
  success: boolean
  projectName: string
  importTime: number
  metadata: ProjectMetadata
  restoredComponents: string[]
  warnings: string[]
  errors: string[]
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean
  version: ProjectExportVersion
  compatibility: 'full' | 'partial' | 'none'
  issues: {
    level: 'error' | 'warning' | 'info'
    message: string
    component: string
    suggestion?: string
  }[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    infos: number
  }
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 序列化上下文
 */
export interface SerializationContext {
  nodeRegistry: Map<string, any>
  resourceRegistry: Map<string, any>
  visited: Set<string>
  depth: number
  maxDepth: number
}

/**
 * 反序列化上下文
 */
export interface DeserializationContext {
  nodeRegistry: Map<string, any>
  resourceRegistry: Map<string, any>
  classRegistry: Map<string, any>
  version: ProjectExportVersion
  compatibility: boolean
}
