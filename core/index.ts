/**
 * QAQ 游戏引擎核心模块导出
 *
 * 新架构说明：
 * - Engine: 核心引擎类，管理Three.js渲染管道
 * - Node: 重构后的节点基类，深度集成Three.js Object3D
 * - 统一2D/3D渲染：所有节点都通过Three.js渲染
 * - 场景图同步：QAQ场景树与Three.js场景图完全同步
 */

// ============================================================================
// 核心引擎系统 - 新架构的核心
// ============================================================================

export { default as Engine, EngineState } from './engine/Engine'

// ============================================================================
// 基础对象系统
// ============================================================================

export { default as QaqObject, QaqSignal, QaqProperty } from './object/QaqObject'

// ============================================================================
// 节点系统
// ============================================================================

export { default as Node, QaqNodePath } from './nodes/Node'
export { default as CanvasItem, BlendMode, TextureFilter, TextureRepeat } from './nodes/base/CanvasItem'
export { default as Control, FocusMode, MouseFilter, LayoutPreset, GrowDirection } from './nodes/ui/Control'
export { default as Node2D, Transform2DHelper } from './nodes/Node2D'
export { default as Node3D, Transform3DHelper } from './nodes/Node3D'
export { default as MeshInstance3D, MaterialType } from './nodes/MeshInstance3D'
export { default as Camera3D, ProjectionMode, KeepAspect } from './nodes/3d/Camera3D'

// 光照系统
export { default as Light3D, LightType, ShadowType } from './nodes/lights/Light3D'
export { default as DirectionalLight3D } from './nodes/lights/DirectionalLight3D'
export { default as OmniLight3D } from './nodes/lights/OmniLight3D'
export { default as SpotLight3D } from './nodes/lights/SpotLight3D'

// 资源管理系统
export { default as ResourceLoader, ResourceType } from './resources/ResourceLoader'

// 场景系统
export { default as Scene, SceneState, SceneType } from './scene/Scene'
// export { default as SceneTree, SceneChangeMode } from './scene/SceneTree' // 注释掉重复导出
export { default as PackedScene, PACKED_SCENE_VERSION } from './scene/PackedScene'

// 脚本系统
export { ScriptManager } from './script/ScriptManager'
export { ScriptBase } from './script/ScriptBase'

// 视口系统
export { default as Viewport } from './viewport/Viewport'
export { default as ViewportManager } from './viewport/ViewportManager'

// 物理系统
export { default as PhysicsServer, PhysicsBodyType, CollisionShapeType } from './physics/PhysicsServer'
export { default as StaticBody3D } from './nodes/physics/StaticBody3D'
export { default as RigidBody3D, RigidBodyMode } from './nodes/physics/RigidBody3D'
export { default as CollisionShape3D } from './nodes/physics/CollisionShape3D'

// ============================================================================
// 场景系统
// ============================================================================

export { default as SceneTree } from './scene/SceneTree'
export { SceneChangeMode } from './scene/types' // 导出SceneChangeMode枚举和SceneChangeOptions接口
/**
 * 场景切换选项接口
 */
export interface SceneChangeOptions {
	/** 切换模式 */
	mode?: SceneChangeMode
	/** 过渡时间（毫秒） */
	duration?: number
	/** 是否保留当前场景 */
	keepCurrent?: boolean
	/** 自定义过渡回调 */
	customTransition?: (from: any, to: any) => Promise<void>
	/** 切换完成回调 */
	onComplete?: () => void
	/** 切换失败回调 */
	onError?: (error: Error) => void
}
// ============================================================================
// 文件系统
// ============================================================================

export {
  default as FileSystemManager,
  BrowserFileSystem,
  type FileSystemAPI
} from './filesystem/FileSystemManager'

// ============================================================================
// 类型定义
// ============================================================================

export * from '../types/core'

// ============================================================================
// 工具函数
// ============================================================================

export const QAQ_CORE_VERSION = '1.0.0'

/**
 * 创建一个新的场景树实例
 */
export function createSceneTree(): SceneTree {
  return new SceneTree()
}

/**
 * 创建一个新的文件系统管理器实例
 */
export function createFileSystemManager(): FileSystemManager {
  return new FileSystemManager()
}

/**
 * 创建一个基础的 3D 场景
 */
export function createBasic3DScene(name: string = 'Main'): Node3D {
  const root = new Node3D(name)

  // 添加一个默认的网格实例
  const meshInstance = new MeshInstance3D('MeshInstance3D')
  meshInstance.createBoxMesh()
  root.addChild(meshInstance)

  return root
}

/**
 * 创建一个基础的 2D 场景
 */
export function createBasic2DScene(name: string = 'Main'): Node2D {
  const root = new Node2D(name)
  return root
}

/**
 * 验证节点名称是否有效
 */
export function isValidNodeName(name: string): boolean {
  if (!name || name.trim() === '') return false

  // 不能包含特殊字符
  const invalidChars = /[\/\\:*?"<>|]/
  if (invalidChars.test(name)) return false

  // 不能以点开头
  if (name.startsWith('.')) return false

  return true
}

/**
 * 生成唯一的节点名称
 */
export function generateUniqueNodeName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName
  }

  let counter = 1
  let uniqueName = `${baseName}${counter}`

  while (existingNames.includes(uniqueName)) {
    counter++
    uniqueName = `${baseName}${counter}`
  }

  return uniqueName
}

/**
 * 深度克隆对象（简单实现）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : ''
}

/**
 * 检查文件是否为场景文件
 */
export function isSceneFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return extension === 'tscn' || extension === 'scn'
}

/**
 * 检查文件是否为脚本文件
 */
export function isScriptFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['ts', 'js', 'gd', 'cs'].includes(extension)
}

/**
 * 检查文件是否为资源文件
 */
export function isResourceFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['tres', 'res'].includes(extension)
}

/**
 * 检查文件是否为模型文件
 */
export function isModelFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['gltf', 'glb', 'obj', 'fbx', 'dae'].includes(extension)
}

/**
 * 检查文件是否为图像文件
 */
export function isImageFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(extension)
}

/**
 * 检查文件是否为音频文件
 */
export function isAudioFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)
}

/**
 * 获取文件类型图标名称
 */
export function getFileTypeIcon(fileName: string): string {
  if (isSceneFile(fileName)) return 'i-heroicons-cube'
  if (isScriptFile(fileName)) return 'i-heroicons-code-bracket'
  if (isResourceFile(fileName)) return 'i-heroicons-archive-box'
  if (isModelFile(fileName)) return 'i-heroicons-cube-transparent'
  if (isImageFile(fileName)) return 'i-heroicons-photo'
  if (isAudioFile(fileName)) return 'i-heroicons-musical-note'

  const extension = getFileExtension(fileName)
  switch (extension) {
    case 'txt':
    case 'md':
      return 'i-heroicons-document-text'
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return 'i-heroicons-document-chart-bar'
    default:
      return 'i-heroicons-document'
  }
}

/**
 * 规范化路径
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '')
}

/**
 * 连接路径
 */
export function joinPath(...parts: string[]): string {
  return normalizePath(parts.filter(part => part).join('/'))
}

/**
 * 获取路径的目录部分
 */
export function getDirectoryPath(path: string): string {
  const normalizedPath = normalizePath(path)
  const lastSlash = normalizedPath.lastIndexOf('/')
  return lastSlash > 0 ? normalizedPath.substring(0, lastSlash) : ''
}

/**
 * 获取路径的文件名部分
 */
export function getFileName(path: string): string {
  const normalizedPath = normalizePath(path)
  const lastSlash = normalizedPath.lastIndexOf('/')
  return lastSlash >= 0 ? normalizedPath.substring(lastSlash + 1) : normalizedPath
}

/**
 * 获取不带扩展名的文件名
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.substring(0, lastDot) : fileName
}

// ============================================================================
// 2D节点导出
// ============================================================================

export { default as Sprite2D } from './nodes/2d/Sprite2D'
export { default as AnimatedSprite2D } from './nodes/2d/AnimatedSprite2D'

// 动画系统导出
// ============================================================================

export { default as SpriteAnimation } from './animation/SpriteAnimation'
export { default as SpriteSheetAnimator2D } from './nodes/2d/SpriteSheetAnimator2D'
export { default as AnimationPlayer } from './nodes/animation/AnimationPlayer'
export { default as StateMachine } from './animation/StateMachine'
export { default as Label } from './nodes/2d/Label'
export { default as Button } from './nodes/2d/Button'
export { default as Panel } from './nodes/2d/Panel'
export { default as TextureRect } from './nodes/2d/TextureRect'
