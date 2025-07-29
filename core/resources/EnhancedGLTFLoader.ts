/**
 * QAQ游戏引擎 - 增强的GLTF资源加载器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 增强的GLTF资源加载器，返回完整的GLTF资源对象
 * - 支持所有GLTF资源类型的解析和分类
 * - 提供资源元数据和依赖关系管理
 * - 支持选择性资源加载和过滤
 * - 与原有ResourceLoader系统兼容
 */

import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import {
  GLTFResourceType,
  type GLTFResource,
  type GLTFLoadOptions,
  type GLTFResourceMetadata,
  type GLTFSceneMetadata,
  type GLTFNodeMetadata,
  type GLTFMeshMetadata,
  type GLTFMaterialMetadata,
  type GLTFTextureMetadata,
  type GLTFAnimationMetadata,
  type GLTFCameraMetadata,
  type GLTFResourceContainer,
  type GLTFResourceIndex,
  type IGLTFResourceAccessor
} from './GLTFResource'
import type { LoadProgress, IResourceLoader, LoadOptions } from './ResourceLoader'

// ============================================================================
// 增强的GLTF资源加载器
// ============================================================================

/**
 * 增强的GLTF资源加载器类
 */
export class EnhancedGLTFLoader implements IResourceLoader {
  supportedExtensions = ['gltf', 'glb']
  
  private _loader: GLTFLoader
  private _progressCallback: ((progress: LoadProgress) => void) | null = null
  
  constructor() {
    this._loader = new GLTFLoader()
    
    // 配置Draco解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    this._loader.setDRACOLoader(dracoLoader)
  }
  
  setProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._progressCallback = callback
  }
  
  /**
   * 加载GLTF资源（兼容原接口，返回scene）
   */
  async load(url: string, options?: LoadOptions): Promise<THREE.Group> {
    const gltfResource = await this.loadGLTF(url, {
      parseAnimations: false,
      parseMaterials: false,
      parseTextures: false,
      parseCameras: false,
      parseLights: false,
      parseSkins: false,
      createResourceIndex: false,
      parseDependencies: false
    })
    return gltfResource.scene
  }
  
  /**
   * 加载完整的GLTF资源
   */
  async loadGLTF(url: string, options: GLTFLoadOptions = {}): Promise<GLTFResource> {
    const startTime = Date.now()
    
    // 设置默认选项
    const mergedOptions: GLTFLoadOptions = {
      parseAnimations: true,
      parseMaterials: true,
      parseTextures: true,
      parseCameras: true,
      parseLights: true,
      parseSkins: true,
      createResourceIndex: true,
      parseDependencies: true,
      ...options
    }
    
    return new Promise((resolve, reject) => {
      this._loader.load(
        url,
        (gltf) => {
          try {
            const gltfResource = this.parseGLTFResource(gltf, mergedOptions, startTime)
            resolve(gltfResource)
          } catch (error) {
            reject(new Error(`Failed to parse GLTF resource: ${error}`))
          }
        },
        (progress) => {
          if (this._progressCallback) {
            this._progressCallback({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.total > 0 ? progress.loaded / progress.total : 0,
              url
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load GLTF: ${error}`))
        }
      )
    })
  }
  
  /**
   * 解析GLTF资源
   */
  private parseGLTFResource(gltf: GLTF, options: GLTFLoadOptions, startTime: number): GLTFResource {
    const parseTime = Date.now() - startTime
    
    // 提取基础资源
    const scenes = gltf.scenes || []
    const animations = gltf.animations || []
    const cameras = gltf.cameras || []
    
    // 提取网格、材质、纹理
    const meshes: THREE.Mesh[] = []
    const materials: THREE.Material[] = []
    const textures: THREE.Texture[] = []
    const lights: THREE.Light[] = []
    
    // 遍历场景提取资源
    scenes.forEach(scene => {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          meshes.push(object)
          
          // 提取材质
          if (object.material) {
            if (Array.isArray(object.material)) {
              materials.push(...object.material)
            } else {
              materials.push(object.material)
            }
          }
        }
        
        if (object instanceof THREE.Light) {
          lights.push(object)
        }
      })
    })
    
    // 提取纹理
    materials.forEach(material => {
      this.extractTexturesFromMaterial(material, textures)
    })
    
    // 去重
    const uniqueMaterials = Array.from(new Set(materials))
    const uniqueTextures = Array.from(new Set(textures))
    
    // 解析元数据
    const metadata = this.parseMetadata(gltf, options)
    
    // 创建资源索引
    const resourceIndex = options.createResourceIndex ? 
      this.createResourceIndex(gltf, scenes, animations, meshes, uniqueMaterials, uniqueTextures, cameras, lights) :
      this.createEmptyResourceIndex()
    
    // 计算统计信息
    const stats = this.calculateStats(meshes, uniqueTextures, parseTime)
    
    return {
      gltf,
      scene: scenes[0] || new THREE.Group(),
      scenes,
      animations,
      meshes,
      materials: uniqueMaterials,
      textures: uniqueTextures,
      cameras,
      lights,
      metadata,
      resourceIndex,
      stats
    }
  }
  
  /**
   * 从材质中提取纹理
   */
  private extractTexturesFromMaterial(material: THREE.Material, textures: THREE.Texture[]): void {
    const materialAny = material as any
    
    // 检查常见的纹理属性
    const textureProperties = [
      'map', 'normalMap', 'bumpMap', 'displacementMap',
      'roughnessMap', 'metalnessMap', 'alphaMap', 'lightMap',
      'aoMap', 'emissiveMap', 'envMap', 'gradientMap'
    ]
    
    textureProperties.forEach(prop => {
      if (materialAny[prop] && materialAny[prop] instanceof THREE.Texture) {
        textures.push(materialAny[prop])
      }
    })
  }
  
  /**
   * 解析元数据
   */
  private parseMetadata(gltf: GLTF, options: GLTFLoadOptions) {
    const metadata = {
      scenes: [] as GLTFSceneMetadata[],
      nodes: [] as GLTFNodeMetadata[],
      meshes: [] as GLTFMeshMetadata[],
      materials: [] as GLTFMaterialMetadata[],
      textures: [] as GLTFTextureMetadata[],
      animations: [] as GLTFAnimationMetadata[],
      cameras: [] as GLTFCameraMetadata[]
    }
    
    // 解析场景元数据
    if (options.parseAnimations && gltf.scenes) {
      gltf.scenes.forEach((scene, index) => {
        metadata.scenes.push({
          id: `scene_${index}`,
          name: scene.name || `Scene ${index}`,
          type: GLTFResourceType.SCENE,
          index,
          nodeIndices: [] // 这里需要从GLTF原始数据中获取
        })
      })
    }
    
    // 解析动画元数据
    if (options.parseAnimations && gltf.animations) {
      gltf.animations.forEach((animation, index) => {
        metadata.animations.push({
          id: `animation_${index}`,
          name: animation.name || `Animation ${index}`,
          type: GLTFResourceType.ANIMATION,
          index,
          duration: animation.duration,
          channelCount: animation.tracks.length,
          targetNodeIndices: [], // 需要从tracks中提取
          properties: [] // 需要从tracks中提取
        })
      })
    }
    
    // 解析相机元数据
    if (options.parseCameras && gltf.cameras) {
      gltf.cameras.forEach((camera, index) => {
        const cameraMetadata: GLTFCameraMetadata = {
          id: `camera_${index}`,
          name: camera.name || `Camera ${index}`,
          type: GLTFResourceType.CAMERA,
          index,
          cameraType: camera instanceof THREE.PerspectiveCamera ? 'perspective' : 'orthographic',
          near: camera.near,
          far: camera.far
        }
        
        if (camera instanceof THREE.PerspectiveCamera) {
          cameraMetadata.fov = camera.fov
          cameraMetadata.aspectRatio = camera.aspect
        }
        
        metadata.cameras.push(cameraMetadata)
      })
    }
    
    return metadata
  }
  
  /**
   * 创建资源索引
   */
  private createResourceIndex(
    gltf: GLTF,
    scenes: THREE.Group[],
    animations: THREE.AnimationClip[],
    meshes: THREE.Mesh[],
    materials: THREE.Material[],
    textures: THREE.Texture[],
    cameras: THREE.Camera[],
    lights: THREE.Light[]
  ): GLTFResourceIndex {
    const byType = new Map<GLTFResourceType, GLTFResourceContainer[]>()
    const byId = new Map<string, GLTFResourceContainer>()
    const byName = new Map<string, GLTFResourceContainer[]>()
    const dependencies = new Map<string, string[]>()
    
    // 创建资源容器的辅助函数
    const createContainer = <T>(
      resource: T, 
      type: GLTFResourceType, 
      index: number, 
      name?: string
    ): GLTFResourceContainer<T> => {
      const id = `${type}_${index}`
      const metadata: GLTFResourceMetadata = {
        id,
        name,
        type,
        index
      }
      
      return {
        resource,
        metadata,
        dependencies: []
      }
    }
    
    // 索引场景
    scenes.forEach((scene, index) => {
      const container = createContainer(scene, GLTFResourceType.SCENE, index, scene.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引动画
    animations.forEach((animation, index) => {
      const container = createContainer(animation, GLTFResourceType.ANIMATION, index, animation.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引网格
    meshes.forEach((mesh, index) => {
      const container = createContainer(mesh, GLTFResourceType.MESH, index, mesh.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引材质
    materials.forEach((material, index) => {
      const container = createContainer(material, GLTFResourceType.MATERIAL, index, material.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引纹理
    textures.forEach((texture, index) => {
      const container = createContainer(texture, GLTFResourceType.TEXTURE, index, texture.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引相机
    cameras.forEach((camera, index) => {
      const container = createContainer(camera, GLTFResourceType.CAMERA, index, camera.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    // 索引光照
    lights.forEach((light, index) => {
      const container = createContainer(light, GLTFResourceType.LIGHT, index, light.name)
      this.addToIndex(container, byType, byId, byName)
    })
    
    return {
      byType,
      byId,
      byName,
      dependencies
    }
  }
  
  /**
   * 添加到索引
   */
  private addToIndex(
    container: GLTFResourceContainer,
    byType: Map<GLTFResourceType, GLTFResourceContainer[]>,
    byId: Map<string, GLTFResourceContainer>,
    byName: Map<string, GLTFResourceContainer[]>
  ): void {
    // 按类型索引
    if (!byType.has(container.metadata.type)) {
      byType.set(container.metadata.type, [])
    }
    byType.get(container.metadata.type)!.push(container)
    
    // 按ID索引
    byId.set(container.metadata.id, container)
    
    // 按名称索引
    if (container.metadata.name) {
      if (!byName.has(container.metadata.name)) {
        byName.set(container.metadata.name, [])
      }
      byName.get(container.metadata.name)!.push(container)
    }
  }
  
  /**
   * 创建空的资源索引
   */
  private createEmptyResourceIndex(): GLTFResourceIndex {
    return {
      byType: new Map(),
      byId: new Map(),
      byName: new Map(),
      dependencies: new Map()
    }
  }
  
  /**
   * 计算统计信息
   */
  private calculateStats(meshes: THREE.Mesh[], textures: THREE.Texture[], parseTime: number) {
    let totalVertices = 0
    let totalTriangles = 0
    
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        const geometry = mesh.geometry
        if (geometry.attributes.position) {
          totalVertices += geometry.attributes.position.count
        }
        if (geometry.index) {
          totalTriangles += geometry.index.count / 3
        }
      }
    })
    
    let totalTextureMemory = 0
    textures.forEach(texture => {
      if (texture.image) {
        const image = texture.image
        totalTextureMemory += (image.width || 0) * (image.height || 0) * 4 // 假设RGBA
      }
    })
    
    return {
      totalVertices,
      totalTriangles,
      totalTextureMemory,
      fileSize: 0, // 需要从加载过程中获取
      parseTime
    }
  }
}

// ============================================================================
// GLTF资源访问器实现
// ============================================================================

/**
 * GLTF资源访问器实现
 */
export class GLTFResourceAccessor implements IGLTFResourceAccessor {
  constructor(private resource: GLTFResource) {}

  getAnimations(): THREE.AnimationClip[] {
    return this.resource.animations
  }

  getAnimationByName(name: string): THREE.AnimationClip | null {
    return this.resource.animations.find(anim => anim.name === name) || null
  }

  getMaterials(): THREE.Material[] {
    return this.resource.materials
  }

  getMaterialByName(name: string): THREE.Material | null {
    return this.resource.materials.find(mat => mat.name === name) || null
  }

  getTextures(): THREE.Texture[] {
    return this.resource.textures
  }

  getTextureByName(name: string): THREE.Texture | null {
    return this.resource.textures.find(tex => tex.name === name) || null
  }

  getMeshes(): THREE.Mesh[] {
    return this.resource.meshes
  }

  getMeshByName(name: string): THREE.Mesh | null {
    return this.resource.meshes.find(mesh => mesh.name === name) || null
  }

  getCameras(): THREE.Camera[] {
    return this.resource.cameras
  }

  getCameraByName(name: string): THREE.Camera | null {
    return this.resource.cameras.find(cam => cam.name === name) || null
  }

  getLights(): THREE.Light[] {
    return this.resource.lights
  }

  getLightByName(name: string): THREE.Light | null {
    return this.resource.lights.find(light => light.name === name) || null
  }

  getResourcesByType<T>(type: GLTFResourceType): GLTFResourceContainer<T>[] {
    return this.resource.resourceIndex.byType.get(type) as GLTFResourceContainer<T>[] || []
  }

  getResourceById<T>(id: string): GLTFResourceContainer<T> | null {
    return this.resource.resourceIndex.byId.get(id) as GLTFResourceContainer<T> || null
  }

  getResourceDependencies(resourceId: string): string[] {
    return this.resource.resourceIndex.dependencies.get(resourceId) || []
  }

  findDependentResources(resourceId: string): string[] {
    const dependents: string[] = []

    for (const [id, deps] of this.resource.resourceIndex.dependencies.entries()) {
      if (deps.includes(resourceId)) {
        dependents.push(id)
      }
    }

    return dependents
  }
}

// ============================================================================
// 导出
// ============================================================================

export default EnhancedGLTFLoader
