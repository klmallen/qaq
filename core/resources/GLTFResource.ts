/**
 * QAQ游戏引擎 - GLTF资源类型定义
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 定义完整的GLTF资源结构和类型
 * - 支持GLTF文件中所有资源类型的解析和分类
 * - 提供资源访问和查询接口
 * - 支持资源依赖关系管理
 * - 与Three.js GLTF加载器深度集成
 */

import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ============================================================================
// GLTF资源类型枚举
// ============================================================================

/**
 * GLTF资源类型枚举
 */
export enum GLTFResourceType {
  /** 场景 */
  SCENE = 'scene',
  /** 节点 */
  NODE = 'node',
  /** 网格 */
  MESH = 'mesh',
  /** 材质 */
  MATERIAL = 'material',
  /** 纹理 */
  TEXTURE = 'texture',
  /** 图像 */
  IMAGE = 'image',
  /** 动画 */
  ANIMATION = 'animation',
  /** 皮肤 */
  SKIN = 'skin',
  /** 相机 */
  CAMERA = 'camera',
  /** 光照 */
  LIGHT = 'light',
  /** 缓冲区 */
  BUFFER = 'buffer',
  /** 缓冲区视图 */
  BUFFER_VIEW = 'bufferView',
  /** 访问器 */
  ACCESSOR = 'accessor',
  /** 采样器 */
  SAMPLER = 'sampler'
}

/**
 * GLTF加载选项
 */
export interface GLTFLoadOptions {
  /** 是否解析动画 */
  parseAnimations?: boolean
  /** 是否解析材质 */
  parseMaterials?: boolean
  /** 是否解析纹理 */
  parseTextures?: boolean
  /** 是否解析相机 */
  parseCameras?: boolean
  /** 是否解析光照 */
  parseLights?: boolean
  /** 是否解析皮肤 */
  parseSkins?: boolean
  /** 需要的资源类型过滤 */
  resourceTypeFilter?: GLTFResourceType[]
  /** 是否创建资源索引 */
  createResourceIndex?: boolean
  /** 是否解析依赖关系 */
  parseDependencies?: boolean
}

// ============================================================================
// GLTF资源元数据接口
// ============================================================================

/**
 * GLTF资源元数据基类
 */
export interface GLTFResourceMetadata {
  /** 资源ID */
  id: string
  /** 资源名称 */
  name?: string
  /** 资源类型 */
  type: GLTFResourceType
  /** 资源索引 */
  index: number
  /** 扩展信息 */
  extensions?: Record<string, any>
  /** 额外信息 */
  extras?: Record<string, any>
}

/**
 * GLTF场景元数据
 */
export interface GLTFSceneMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.SCENE
  /** 场景中的节点索引 */
  nodeIndices: number[]
}

/**
 * GLTF节点元数据
 */
export interface GLTFNodeMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.NODE
  /** 父节点索引 */
  parentIndex?: number
  /** 子节点索引 */
  childIndices: number[]
  /** 网格索引 */
  meshIndex?: number
  /** 相机索引 */
  cameraIndex?: number
  /** 皮肤索引 */
  skinIndex?: number
  /** 变换矩阵 */
  matrix?: number[]
  /** 位置 */
  translation?: number[]
  /** 旋转 */
  rotation?: number[]
  /** 缩放 */
  scale?: number[]
}

/**
 * GLTF网格元数据
 */
export interface GLTFMeshMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.MESH
  /** 图元数量 */
  primitiveCount: number
  /** 材质索引 */
  materialIndices: number[]
  /** 顶点数量 */
  vertexCount: number
  /** 三角形数量 */
  triangleCount: number
}

/**
 * GLTF材质元数据
 */
export interface GLTFMaterialMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.MATERIAL
  /** 材质类型 */
  materialType: 'PBR' | 'Unlit' | 'Custom'
  /** 纹理索引 */
  textureIndices: number[]
  /** 是否双面 */
  doubleSided: boolean
  /** Alpha模式 */
  alphaMode: 'OPAQUE' | 'MASK' | 'BLEND'
}

/**
 * GLTF纹理元数据
 */
export interface GLTFTextureMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.TEXTURE
  /** 图像索引 */
  imageIndex: number
  /** 采样器索引 */
  samplerIndex?: number
  /** 纹理格式 */
  format: string
  /** 纹理大小 */
  size: { width: number; height: number }
}

/**
 * GLTF动画元数据
 */
export interface GLTFAnimationMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.ANIMATION
  /** 动画时长（秒） */
  duration: number
  /** 通道数量 */
  channelCount: number
  /** 目标节点索引 */
  targetNodeIndices: number[]
  /** 动画属性类型 */
  properties: ('translation' | 'rotation' | 'scale' | 'weights')[]
}

/**
 * GLTF相机元数据
 */
export interface GLTFCameraMetadata extends GLTFResourceMetadata {
  type: GLTFResourceType.CAMERA
  /** 相机类型 */
  cameraType: 'perspective' | 'orthographic'
  /** 视野角度（透视相机） */
  fov?: number
  /** 宽高比 */
  aspectRatio?: number
  /** 近平面 */
  near: number
  /** 远平面 */
  far: number
}

// ============================================================================
// GLTF资源容器接口
// ============================================================================

/**
 * GLTF资源容器
 */
export interface GLTFResourceContainer<T = any> {
  /** 资源对象 */
  resource: T
  /** 资源元数据 */
  metadata: GLTFResourceMetadata
  /** 依赖的资源ID */
  dependencies: string[]
}

/**
 * GLTF资源索引
 */
export interface GLTFResourceIndex {
  /** 按类型分组的资源 */
  byType: Map<GLTFResourceType, GLTFResourceContainer[]>
  /** 按ID索引的资源 */
  byId: Map<string, GLTFResourceContainer>
  /** 按名称索引的资源 */
  byName: Map<string, GLTFResourceContainer[]>
  /** 资源依赖图 */
  dependencies: Map<string, string[]>
}

// ============================================================================
// 主要GLTF资源接口
// ============================================================================

/**
 * 完整的GLTF资源对象
 */
export interface GLTFResource {
  /** 原始GLTF对象 */
  gltf: GLTF
  
  /** 主场景（默认场景或第一个场景） */
  scene: THREE.Group
  
  /** 所有场景 */
  scenes: THREE.Group[]
  
  /** 所有动画 */
  animations: THREE.AnimationClip[]
  
  /** 所有网格 */
  meshes: THREE.Mesh[]
  
  /** 所有材质 */
  materials: THREE.Material[]
  
  /** 所有纹理 */
  textures: THREE.Texture[]
  
  /** 所有相机 */
  cameras: THREE.Camera[]
  
  /** 所有光照（如果有扩展） */
  lights: THREE.Light[]
  
  /** 资源元数据 */
  metadata: {
    /** 场景元数据 */
    scenes: GLTFSceneMetadata[]
    /** 节点元数据 */
    nodes: GLTFNodeMetadata[]
    /** 网格元数据 */
    meshes: GLTFMeshMetadata[]
    /** 材质元数据 */
    materials: GLTFMaterialMetadata[]
    /** 纹理元数据 */
    textures: GLTFTextureMetadata[]
    /** 动画元数据 */
    animations: GLTFAnimationMetadata[]
    /** 相机元数据 */
    cameras: GLTFCameraMetadata[]
  }
  
  /** 资源索引 */
  resourceIndex: GLTFResourceIndex
  
  /** 资源统计信息 */
  stats: {
    /** 总顶点数 */
    totalVertices: number
    /** 总三角形数 */
    totalTriangles: number
    /** 总纹理内存（字节） */
    totalTextureMemory: number
    /** 文件大小（字节） */
    fileSize: number
    /** 解析时间（毫秒） */
    parseTime: number
  }
}

// ============================================================================
// GLTF资源访问接口
// ============================================================================

/**
 * GLTF资源访问器接口
 */
export interface IGLTFResourceAccessor {
  /** 获取所有动画 */
  getAnimations(): THREE.AnimationClip[]
  
  /** 根据名称获取动画 */
  getAnimationByName(name: string): THREE.AnimationClip | null
  
  /** 获取所有材质 */
  getMaterials(): THREE.Material[]
  
  /** 根据名称获取材质 */
  getMaterialByName(name: string): THREE.Material | null
  
  /** 获取所有纹理 */
  getTextures(): THREE.Texture[]
  
  /** 根据名称获取纹理 */
  getTextureByName(name: string): THREE.Texture | null
  
  /** 获取所有网格 */
  getMeshes(): THREE.Mesh[]
  
  /** 根据名称获取网格 */
  getMeshByName(name: string): THREE.Mesh | null
  
  /** 获取所有相机 */
  getCameras(): THREE.Camera[]
  
  /** 根据名称获取相机 */
  getCameraByName(name: string): THREE.Camera | null
  
  /** 获取所有光照 */
  getLights(): THREE.Light[]
  
  /** 根据名称获取光照 */
  getLightByName(name: string): THREE.Light | null
  
  /** 根据类型获取资源 */
  getResourcesByType<T>(type: GLTFResourceType): GLTFResourceContainer<T>[]
  
  /** 根据ID获取资源 */
  getResourceById<T>(id: string): GLTFResourceContainer<T> | null
  
  /** 获取资源依赖 */
  getResourceDependencies(resourceId: string): string[]
  
  /** 查找依赖于指定资源的其他资源 */
  findDependentResources(resourceId: string): string[]
}

// ============================================================================
// 导出
// ============================================================================

export default GLTFResource
