/**
 * QAQ 游戏引擎核心类型定义
 * 定义引擎中使用的基础数据类型和接口
 */

// ============================================================================
// 基础数学类型
// ============================================================================

export interface Vector2 {
  x: number
  y: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Vector4 {
  x: number
  y: number
  z: number
  w: number
}

export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface Transform2D {
  position: Vector2
  rotation: number
  scale: Vector2
}

export interface Transform3D {
  position: Vector3
  rotation: Vector3
  scale: Vector3
}

export interface Rect2 {
  position: Vector2
  size: Vector2
}

export interface AABB {
  position: Vector3
  size: Vector3
}

// ============================================================================
// 信号系统类型
// ============================================================================

export type SignalCallback = (...args: any[]) => void

export interface Signal {
  name: string
  callbacks: SignalCallback[]
  connect(callback: SignalCallback): void
  disconnect(callback: SignalCallback): void
  emit(...args: any[]): void
}

// ============================================================================
// 属性系统类型
// ============================================================================

export type PropertyType = 
  | 'bool'
  | 'int'
  | 'float'
  | 'string'
  | 'vector2'
  | 'vector3'
  | 'color'
  | 'resource'
  | 'node_path'
  | 'enum'
  | 'array'
  | 'dictionary'

export interface PropertyInfo {
  name: string
  type: PropertyType
  hint?: string
  hintString?: string
  usage?: PropertyUsage
  className?: string
}

export enum PropertyUsage {
  NONE = 0,
  STORAGE = 1,
  EDITOR = 2,
  NETWORK = 4,
  EDITOR_HELPER = 8,
  CHECKABLE = 16,
  CHECKED = 32,
  INTERNATIONALIZED = 64,
  GROUP = 128,
  CATEGORY = 256,
  STORE_IF_NONZERO = 512,
  STORE_IF_NONONE = 1024,
  NO_INSTANCE_STATE = 2048,
  RESTART_IF_CHANGED = 4096,
  SCRIPT_VARIABLE = 8192,
  STORE_IF_NULL = 16384,
  ANIMATE_AS_TRIGGER = 32768,
  UPDATE_ALL_IF_MODIFIED = 65536,
  SCRIPT_DEFAULT_VALUE = 131072,
  CLASS_IS_ENUM = 262144,
  NIL_IS_VARIANT = 524288,
  INTERNAL = 1048576,
  DO_NOT_SHARE_ON_DUPLICATE = 2097152,
  HIGH_END_GFX = 4194304,
  NODE_PATH_FROM_SCENE_FILE = 8388608,
  RESOURCE_NOT_PERSISTENT = 16777216,
  KEYING_INCREMENTS = 33554432,
  DEFERRED_SET_RESOURCE = 67108864,
  EDITOR_INSTANTIATE_OBJECT = 134217728,
  EDITOR_BASIC_SETTING = 268435456,
  READ_ONLY = 536870912,
  ARRAY = 1073741824
}

// ============================================================================
// 节点系统类型
// ============================================================================

export type NodeID = string

export interface NodePath {
  path: string
  subname?: string
  absolute: boolean
}

export enum ProcessMode {
  INHERIT,
  PAUSABLE,
  WHEN_PAUSED,
  ALWAYS,
  DISABLED
}

// ============================================================================
// 资源系统类型
// ============================================================================

export type ResourceID = string

export interface ResourceInfo {
  id: ResourceID
  path: string
  type: string
  lastModified: Date
  size?: number
  dependencies?: ResourceID[]
}

// ============================================================================
// 场景系统类型
// ============================================================================

export interface SceneInfo {
  name: string
  path: string
  lastModified: Date
  isMain?: boolean
  dependencies?: string[]
}

// ============================================================================
// 文件系统类型
// ============================================================================

export interface FileInfo {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: Date
  extension?: string
}

export interface DirectoryInfo extends FileInfo {
  type: 'directory'
  children?: FileInfo[]
}

// ============================================================================
// 编辑器类型
// ============================================================================

export interface EditorSettings {
  theme: 'dark' | 'light' | 'system'
  fontSize: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  autoSave: boolean
  autoSaveInterval: number
}

// ============================================================================
// 项目配置类型
// ============================================================================

export interface ProjectConfig {
  name: string
  version: string
  description: string
  mainScene: string
  settings: {
    application: ApplicationSettings
    rendering: RenderingSettings
    input: InputSettings
    physics: PhysicsSettings
    audio: AudioSettings
  }
}

export interface ApplicationSettings {
  name: string
  description: string
  icon: string
  version: string
  runMainScene: string
}

export interface RenderingSettings {
  renderer: '2D' | '3D'
  vsync: boolean
  maxFps: number
  resolution: {
    width: number
    height: number
    fullscreen: boolean
  }
}

export interface InputSettings {
  globalDeadzone: number
  mouseSensitivity: number
  gamepadSensitivity: number
  smoothingFactor: number
  enableGamepad: boolean
  enableMouse: boolean
  enableKeyboard: boolean
  actions?: { [key: string]: InputAction }
}

export interface InputAction {
  deadzone: number
  events: InputEvent[]
}

export interface InputActionValue {
  value: boolean | number | Vector2 | Vector3
  type: string
}

export interface InputMappingContext {
  name: string
  priority: number
  mappings: { [key: string]: string }
}

export interface GamepadState {
  connected: boolean
  buttons: boolean[]
  axes: number[]
  timestamp: number
}

export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface InputEvent {
  type: 'key' | 'mouse' | 'gamepad'
  keycode?: number
  button?: number
  axis?: number
  modifiers?: string[]
}

export interface PhysicsSettings {
  engine: 'builtin' | 'box2d' | 'bullet'
  gravity: Vector3
  defaultLinearDamp: number
  defaultAngularDamp: number
}

export interface AudioSettings {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
}

// ============================================================================
// 工具类型
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ============================================================================
// 常量
// ============================================================================

export const QAQ_VERSION = '1.0.0'
export const QAQ_ENGINE_NAME = 'QAQ Game Engine'
