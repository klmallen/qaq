/**
 * QAQ 游戏引擎 3D 网格实例节点
 * 提供 3D 模型渲染功能
 * 类似于 Godot 的 MeshInstance3D 类
 */

import Node3D from './Node3D'
import ResourceLoader from '../resources/ResourceLoader'
import type { LoadProgress, LoadResult } from '../resources/ResourceLoader'
import type { GLTFResource, GLTFLoadOptions } from '../resources/GLTFResource'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

// ============================================================================
// 材质类型枚举
// ============================================================================

export enum MaterialType {
  BASIC = 'basic',
  LAMBERT = 'lambert',
  PHONG = 'phong',
  STANDARD = 'standard',
  PHYSICAL = 'physical'
}

// ============================================================================
// 网格资源接口
// ============================================================================

export interface MeshResource {
  geometry: THREE.BufferGeometry
  materials: THREE.Material[]
  name?: string
  path?: string
}

// ============================================================================
// MeshInstance3D 类
// ============================================================================

export class MeshInstance3D extends Node3D {
  private _mesh: THREE.Mesh | null = null
  private _geometry: THREE.BufferGeometry | null = null
  private _materials: THREE.Material[] = []
  private _castShadow: boolean = true
  private _receiveShadow: boolean = true
  private _materialOverride: THREE.Material | null = null
  private _modelPath: string = ''
  private _loadedModel: THREE.Group | null = null
  private _skeleton: THREE.Skeleton | null = null
  private _animations: THREE.AnimationClip[] = []
  public importedAnimations: THREE.AnimationClip[] = []

  // 增强的GLTF资源存储
  private _gltfResource: GLTFResource | null = null
  private _animationMap: Map<string, THREE.AnimationClip> = new Map()
  private _mixer: THREE.AnimationMixer | null = null

  constructor(name: string = 'MeshInstance3D') {
    super(name)
    this.initializeMeshInstance3DSignals()
    this.initializeMeshInstance3DProperties()
    this._createDefaultMesh()
  }

  // ========================================================================
  // 网格属性
  // ========================================================================

  // 材质属性
  private _materialType: MaterialType = MaterialType.STANDARD
  private _materialColor: string = '#ffffff'
  private _roughness: number = 0.5
  private _metalness: number = 0.0

  // 🌟 智能推断：记录网格创建信息
  private _meshType: 'BOX' | 'SPHERE' | 'PLANE' | 'CUSTOM' = 'CUSTOM'
  private _meshParameters: any = null

  get mesh(): THREE.Mesh | null {
    return this._mesh
  }

  get geometry(): THREE.BufferGeometry | null {
    return this._geometry
  }

  set geometry(value: THREE.BufferGeometry | null) {
    if (this._geometry !== value) {
      // 清理旧几何体
      if (this._geometry) {
        this._geometry.dispose()
      }

      this._geometry = value
      this._updateMesh()
      this.emit('geometry_changed', this._geometry)
    }
  }

  get materials(): readonly THREE.Material[] {
    return this._materials
  }

  set materials(value: THREE.Material[]) {
    // 清理旧材质
    this._materials.forEach(material => material.dispose())

    this._materials = [...value]
    this._updateMesh()
    this.emit('materials_changed', this._materials)
  }

  get materialOverride(): THREE.Material | null {
    return this._materialOverride
  }

  set materialOverride(value: THREE.Material | null) {
    if (this._materialOverride !== value) {
      this._materialOverride = value
      this._updateMesh()
      this.emit('material_override_changed', this._materialOverride)
    }
  }

  // ========================================================================
  // 阴影属性
  // ========================================================================

  get castShadow(): boolean {
    return this._castShadow
  }

  set castShadow(value: boolean) {
    if (this._castShadow !== value) {
      this._castShadow = value
      if (this._mesh) {
        this._mesh.castShadow = value
      }
      this.emit('cast_shadow_changed', this._castShadow)
    }
  }

  get receiveShadow(): boolean {
    return this._receiveShadow
  }

  set receiveShadow(value: boolean) {
    if (this._receiveShadow !== value) {
      this._receiveShadow = value
      if (this._mesh) {
        this._mesh.receiveShadow = value
      }
      this.emit('receive_shadow_changed', this._receiveShadow)
    }
  }

  // ========================================================================
  // 材质属性 Getters/Setters
  // ========================================================================

  get materialType(): MaterialType {
    return this._materialType
  }

  set materialType(value: MaterialType) {
    if (this._materialType !== value) {
      this._materialType = value
      this._updateMesh()
      this.emit('material_type_changed', this._materialType)
    }
  }

  get materialColor(): string {
    return this._materialColor
  }

  set materialColor(value: string) {
    if (this._materialColor !== value) {
      this._materialColor = value
      this._updateMesh()
      this.emit('material_color_changed', this._materialColor)
    }
  }

  get roughness(): number {
    return this._roughness
  }

  set roughness(value: number) {
    const clampedValue = Math.max(0, Math.min(1, value))
    if (this._roughness !== clampedValue) {
      this._roughness = clampedValue
      this._updateMesh()
      this.emit('roughness_changed', this._roughness)
    }
  }

  get metalness(): number {
    return this._metalness
  }

  set metalness(value: number) {
    const clampedValue = Math.max(0, Math.min(1, value))
    if (this._metalness !== clampedValue) {
      this._metalness = clampedValue
      this._updateMesh()
      this.emit('metalness_changed', this._metalness)
    }
  }

  // ========================================================================
  // 模型路径属性
  // ========================================================================

  get modelPath(): string {
    return this._modelPath
  }

  set modelPath(value: string) {
    if (this._modelPath !== value) {
      this._modelPath = value
      if (value) {
        this.loadModel(value)
      }
      this.emit('model_path_changed', this._modelPath)
    }
  }

  get skeleton(): THREE.Skeleton | null {
    return this._skeleton
  }

  /**
   * 获取动画映射（供AnimationPlayer使用）
   * @returns 动画名称到AnimationClip的映射
   */
  getAnimationMap(): Map<string, THREE.AnimationClip> {
    return new Map(this._animationMap)
  }

  /**
   * 获取动画混合器（供AnimationPlayer使用）
   * @returns Three.js AnimationMixer实例
   */
  getAnimationMixer(): THREE.AnimationMixer | null {
    return this._mixer
  }

  /**
   * 获取GLTF资源对象（供高级用户使用）
   * @returns GLTF资源对象
   */
  getGLTFResource(): GLTFResource | null {
    return this._gltfResource
  }

  /**
   * 检查是否有指定名称的动画
   * @param animationName 动画名称
   * @returns 是否存在该动画
   */
  hasAnimation(animationName: string): boolean {
    return this._animationMap.has(animationName)
  }

  /**
   * 获取所有动画名称列表
   * @returns 动画名称数组
   */
  getAnimationNames(): string[] {
    return Array.from(this._animationMap.keys())
  }

  get animations(): readonly THREE.AnimationClip[] {
    return this._animations
  }

  // ========================================================================
  // 模型加载方法
  // ========================================================================



  private async _loadGLTF(path: string): Promise<THREE.Group> {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          this._animations = gltf.animations || []
          resolve(gltf.scene)
        },
        undefined,
        reject
      )
    })
  }

  private async _loadFBX(path: string): Promise<THREE.Group> {
    const loader = new FBXLoader()
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (fbx) => {
          this._animations = fbx.animations || []
          resolve(fbx)
        },
        undefined,
        reject
      )
    })
  }

  private _scaleModelToFit(model: THREE.Group, maxSize: number): void {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)

    if (maxDimension > maxSize) {
      const scale = maxSize / maxDimension
      model.scale.setScalar(scale)
    }
  }

  /**
   * 集成GLTF资源到MeshInstance3D
   * @param gltfResource GLTF资源对象
   */
  private _integrateGLTFResource(gltfResource: GLTFResource): void {
    // 清除现有模型
    this._clearLoadedModel()

    // 添加GLTF场景到节点
    this.threeObject.add(gltfResource.scene)
    this._loadedModel = gltfResource.scene

    // 提取和存储动画
    this._extractAndStoreAnimations(gltfResource)

    // 提取骨骼信息
    this._extractSkeletonFromGLTF(gltfResource.scene)

    // 设置阴影属性
    gltfResource.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = this._castShadow
        child.receiveShadow = this._receiveShadow
      }
    })

    // 创建动画混合器
    if (gltfResource.animations.length > 0) {
      this._mixer = new THREE.AnimationMixer(gltfResource.scene)
    }

    // 更新导入的动画列表（向后兼容）
    this.importedAnimations = gltfResource.animations
    this._animations = gltfResource.animations
  }

  /**
   * 从GLTF资源中提取和存储动画
   * @param gltfResource GLTF资源对象
   */
  private _extractAndStoreAnimations(gltfResource: GLTFResource): void {
    // 清空现有动画映射
    this._animationMap.clear()

    // 存储所有动画到映射中
    gltfResource.animations.forEach((clip, index) => {
      const animationName = clip.name || `Animation_${index}`
      this._animationMap.set(animationName, clip)

      console.log(`🎬 存储动画: ${animationName} (时长: ${clip.duration.toFixed(2)}s)`)
    })

    console.log(`📊 总共存储了 ${this._animationMap.size} 个动画`)
  }

  /**
   * 从GLTF场景中提取骨骼信息
   * @param scene GLTF场景
   */
  private _extractSkeletonFromGLTF(scene: THREE.Group): void {
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        this._skeleton = child.skeleton
      }
    })
  }

  private _extractSkeletonAndAnimations(model: THREE.Group): void {
    // 查找骨骼
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        this._skeleton = child.skeleton
      }
    })
  }

  private _replaceWithModel(model: THREE.Group): void {
    // 清理当前网格
    if (this._mesh) {
      this.threeObject.remove(this._mesh)
      this._mesh = null
    }

    // 清理当前几何体和材质
    if (this._geometry) {
      this._geometry.dispose()
      this._geometry = null
    }

    // 添加模型到场景
    this.threeObject.add(model)

    // 设置阴影属性
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = this._castShadow
        child.receiveShadow = this._receiveShadow
      }
    })
  }

  // ========================================================================
  // 网格操作方法
  // ========================================================================

  setMesh(meshResource: MeshResource): void {
    // 清理加载的模型
    this._clearLoadedModel()

    this.geometry = meshResource.geometry
    this.materials = meshResource.materials
  }

  private _clearLoadedModel(): void {
    if (this._loadedModel) {
      this.threeObject.remove(this._loadedModel)
      this._loadedModel = null
      this._skeleton = null
      this._animations = []
      this.importedAnimations = []
      this._modelPath = ''
    }
  }

  createBoxMesh(size: { x: number, y: number, z: number } = { x: 1, y: 1, z: 1 }): void {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.5,
      metalness: 0.1
    })

    this.geometry = geometry
    this.materials = [material]

    // 🌟 记录网格创建信息用于智能推断
    this._meshType = 'BOX'
    this._meshParameters = { size }
  }

  createSphereMesh(radius: number = 0.5, segments: number = 32): void {
    const geometry = new THREE.SphereGeometry(radius, segments, segments)
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.5,
      metalness: 0.1
    })

    this.geometry = geometry
    this.materials = [material]

    // 🌟 记录网格创建信息用于智能推断
    this._meshType = 'SPHERE'
    this._meshParameters = { radius, segments }
  }

  createPlaneMesh(size: { x: number, y: number } = { x: 1, y: 1 }): void {
    const geometry = new THREE.PlaneGeometry(size.x, size.y)
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    })

    this.geometry = geometry
    this.materials = [material]

    // 🌟 记录网格创建信息用于智能推断
    this._meshType = 'PLANE'
    this._meshParameters = { size }
  }

  /**
   * 🌟 获取网格类型信息用于智能碰撞推断
   */
  getMeshInfo(): { type: 'BOX' | 'SPHERE' | 'PLANE' | 'CUSTOM', parameters: any } {
    return {
      type: this._meshType,
      parameters: this._meshParameters
    }
  }

  createCylinderMesh(
    radiusTop: number = 0.5,
    radiusBottom: number = 0.5,
    height: number = 1,
    segments: number = 32
  ): void {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments)
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.5,
      metalness: 0.1
    })

    this.geometry = geometry
    this.materials = [material]
  }

  // ========================================================================
  // 材质操作方法
  // ========================================================================

  getMaterial(index: number = 0): THREE.Material | null {
    return this._materials[index] || null
  }

  setMaterial(material: THREE.Material, index: number = 0): void {
    if (index >= 0 && index < this._materials.length) {
      // 清理旧材质
      this._materials[index].dispose()

      this._materials[index] = material
      this._updateMesh()
      this.emit('material_changed', material, index)
    }
  }

  addMaterial(material: THREE.Material): void {
    this._materials.push(material)
    this._updateMesh()
    this.emit('material_added', material)
  }

  removeMaterial(index: number): boolean {
    if (index >= 0 && index < this._materials.length) {
      const material = this._materials[index]
      material.dispose()
      this._materials.splice(index, 1)
      this._updateMesh()
      this.emit('material_removed', material, index)
      return true
    }
    return false
  }

  createMaterial(type: MaterialType, options: any = {}): THREE.Material {
    const defaultOptions = {
      color: Math.random() * 0xffffff,
      ...options
    }

    switch (type) {
      case MaterialType.BASIC:
        return new THREE.MeshBasicMaterial(defaultOptions)
      case MaterialType.LAMBERT:
        return new THREE.MeshLambertMaterial(defaultOptions)
      case MaterialType.PHONG:
        return new THREE.MeshPhongMaterial(defaultOptions)
      case MaterialType.STANDARD:
        return new THREE.MeshStandardMaterial({
          roughness: 0.5,
          metalness: 0.1,
          ...defaultOptions
        })
      case MaterialType.PHYSICAL:
        return new THREE.MeshPhysicalMaterial({
          roughness: 0.5,
          metalness: 0.1,
          clearcoat: 0.0,
          clearcoatRoughness: 0.0,
          ...defaultOptions
        })
      default:
        return new THREE.MeshStandardMaterial(defaultOptions)
    }
  }

  // ========================================================================
  // 几何体操作方法
  // ========================================================================

  getVertexCount(): number {
    if (!this._geometry) return 0
    const positionAttribute = this._geometry.getAttribute('position')
    return positionAttribute ? positionAttribute.count : 0
  }

  getTriangleCount(): number {
    if (!this._geometry) return 0
    const index = this._geometry.getIndex()
    if (index) {
      return index.count / 3
    } else {
      return this.getVertexCount() / 3
    }
  }

  computeBoundingBox(): THREE.Box3 | null {
    if (!this._geometry) return null

    this._geometry.computeBoundingBox()
    return this._geometry.boundingBox
  }

  computeBoundingSphere(): THREE.Sphere | null {
    if (!this._geometry) return null

    this._geometry.computeBoundingSphere()
    return this._geometry.boundingSphere
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  private _createDefaultMesh(): void {
    this.createBoxMesh()
  }

  private _updateMesh(): void {
    // 移除旧网格
    if (this._mesh) {
      this.threeObject.remove(this._mesh)
      this._mesh = null
    }

    // 创建新网格
    if (this._geometry && this._materials.length > 0) {
      const material = this._materialOverride ||
                      (this._materials.length === 1 ? this._materials[0] : this._materials)

      this._mesh = new THREE.Mesh(this._geometry, material)
      this._mesh.name = `${this.name}_mesh`
      this._mesh.castShadow = this._castShadow
      this._mesh.receiveShadow = this._receiveShadow

      // 将网格添加到Node3D的threeObject中，而不是替换它
      this.threeObject.add(this._mesh)

      console.log(`✅ Mesh updated for ${this.name}:`, {
        geometry: this._geometry.constructor.name,
        material: material.constructor.name,
        position: this.position
      })
    }
  }

  // ========================================================================
  // 信号和属性初始化
  // ========================================================================

  protected initializeMeshInstance3DSignals(): void {
    this.addSignal('geometry_changed')
    this.addSignal('materials_changed')
    this.addSignal('material_changed')
    this.addSignal('material_added')
    this.addSignal('material_removed')
    this.addSignal('material_override_changed')
    this.addSignal('cast_shadow_changed')
    this.addSignal('receive_shadow_changed')
    this.addSignal('model_path_changed')
    this.addSignal('model_loaded')
    this.addSignal('model_load_failed')
  }

  protected initializeMeshInstance3DProperties(): void {
    // 使用传统的属性添加方式，因为propertyMetadata系统可能还未完全集成
    // 注释掉propertyMetadata相关代码以避免错误
    /*
    this.propertyMetadata.set('castShadow', {
      name: 'castShadow',
      type: 'bool',
      group: 'Rendering',
      order: 0,
      controlType: 'toggle',
      description: 'Whether this mesh casts shadows'
    })

    this.propertyMetadata.set('receiveShadow', {
      name: 'receiveShadow',
      type: 'bool',
      group: 'Rendering',
      order: 1,
      controlType: 'toggle',
      description: 'Whether this mesh receives shadows'
    })

    this.propertyMetadata.set('modelPath', {
      name: 'modelPath',
      type: 'string',
      group: 'Mesh',
      order: 0,
      controlType: 'file',
      description: 'Path to the 3D model file',
      fileFilter: '.gltf,.glb,.fbx,.obj'
    })

    this.propertyMetadata.set('materialType', {
      name: 'materialType',
      type: 'enum',
      group: 'Material',
      order: 0,
      controlType: 'select',
      description: 'Type of material to use',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Lambert', value: 'lambert' },
        { label: 'Phong', value: 'phong' },
        { label: 'Standard', value: 'standard' },
        { label: 'Physical', value: 'physical' }
      ]
    })

    this.propertyMetadata.set('materialColor', {
      name: 'materialColor',
      type: 'color',
      group: 'Material',
      order: 1,
      controlType: 'color',
      description: 'Base color of the material'
    })

    this.propertyMetadata.set('roughness', {
      name: 'roughness',
      type: 'float',
      group: 'Material',
      order: 2,
      controlType: 'slider',
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Surface roughness (0 = mirror, 1 = rough)'
    })

    this.propertyMetadata.set('metalness', {
      name: 'metalness',
      type: 'float',
      group: 'Material',
      order: 3,
      controlType: 'slider',
      min: 0,
      max: 1,
      step: 0.01,
      description: 'How metallic the material is (0 = dielectric, 1 = metallic)'
    })
    */

    // 使用传统的属性添加方式以保持兼容性
    this.addProperty({ name: 'cast_shadow', type: 'bool', usage: 1 }, this._castShadow)
    this.addProperty({ name: 'receive_shadow', type: 'bool', usage: 1 }, this._receiveShadow)
    this.addProperty({ name: 'model_path', type: 'string', usage: 1 }, this._modelPath)

    console.log(`✅ MeshInstance3D属性初始化完成: ${this.name}`)
  }

  // ========================================================================
  // 销毁方法
  // ========================================================================

  override destroy(): void {
    // 清理加载的模型
    this._clearLoadedModel()

    // 清理几何体
    if (this._geometry) {
      this._geometry.dispose()
      this._geometry = null
    }

    // 清理材质
    this._materials.forEach(material => material.dispose())
    this._materials = []

    if (this._materialOverride) {
      this._materialOverride.dispose()
      this._materialOverride = null
    }

    // 清理网格
    this._mesh = null

    super.destroy()
  }

  // ========================================================================
  // 模型加载方法 - 新架构集成
  // ========================================================================

  /**
   * 从文件路径加载3D模型
   * @param modelPath 模型文件路径
   * @param onProgress 进度回调函数
   * @returns 加载结果Promise
   */
  async loadModel(
    modelPath: string,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<LoadResult<THREE.Group>> {
    try {
      const resourceLoader = ResourceLoader.getInstance()

      // 设置进度回调
      if (onProgress) {
        resourceLoader.setGlobalProgressCallback(onProgress)
      }

      // 检查是否是GLTF文件，使用增强加载器
      const isGLTF = modelPath.toLowerCase().endsWith('.gltf') || modelPath.toLowerCase().endsWith('.glb')

      if (isGLTF) {
        // 使用增强的GLTF加载器
        const gltfResource = await resourceLoader.loadGLTF(modelPath, {
          parseAnimations: true,
          parseMaterials: true,
          parseTextures: true,
          createResourceIndex: true,
          parseDependencies: true
        })

        // 存储GLTF资源
        this._gltfResource = gltfResource

        // 将GLTF场景集成到MeshInstance3D
        this._integrateGLTFResource(gltfResource)

        // 发送模型加载完成信号
        this.emit('model_loaded', {
          path: modelPath,
          model: gltfResource.scene,
          gltfResource: gltfResource,
          duration: gltfResource.stats.parseTime
        })

        // 返回兼容的LoadResult格式
        return {
          resource: gltfResource.scene,
          info: {
            path: modelPath,
            type: 'gltf' as any,
            loadTime: Date.now(),
            size: gltfResource.stats.fileSize,
            cached: false
          },
          duration: gltfResource.stats.parseTime
        }
      } else {
        // 使用传统加载器处理其他格式
        const result = await resourceLoader.load<THREE.Group>(modelPath)
        this.setModelFromGroup(result.resource)

        this.emit('model_loaded', {
          path: modelPath,
          model: result.resource,
          duration: result.duration
        })

        return result
      }

    } catch (error) {
      console.error(`Failed to load model: ${modelPath}`, error)
      this.emit('model_load_failed', { path: modelPath, error })
      throw error
    }
  }

  /**
   * 从Three.js Group对象设置模型
   * @param group Three.js Group对象
   */
  setModelFromGroup(group: THREE.Group): void {
    // 清除现有网格
    this._clearLoadedModel()

    // 将加载的模型添加到节点
    this.threeObject.add(group)
    this._loadedModel = group

    // 提取骨骼和动画
    this._extractSkeletonAndAnimations(group)
    this.importedAnimations = this._animations

    // 设置阴影
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = this._castShadow
        child.receiveShadow = this._receiveShadow
      }
    })
  }

  /**
   * 异步加载并替换当前模型
   * @param modelPath 新模型路径
   * @param onProgress 进度回调
   */
  async replaceModel(
    modelPath: string,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<void> {
    // 保存当前状态
    const wasVisible = this.visible

    // 隐藏当前模型
    this.visible = false

    try {
      // 加载新模型
      await this.loadModel(modelPath, onProgress)

      // 恢复可见性
      this.visible = wasVisible

      this.emit('model_replaced', { path: modelPath })

    } catch (error) {
      // 恢复可见性
      this.visible = wasVisible
      throw error
    }
  }

  /**
   * 预加载模型到缓存
   * @param modelPath 模型路径
   * @returns 预加载结果Promise
   */
  static async preloadModel(modelPath: string): Promise<LoadResult<THREE.Group>> {
    const resourceLoader = ResourceLoader.getInstance()
    return resourceLoader.load<THREE.Group>(modelPath)
  }

  /**
   * 批量预加载模型
   * @param modelPaths 模型路径数组
   * @param onProgress 总体进度回调
   * @returns 预加载结果Promise数组
   */
  static async preloadModels(
    modelPaths: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<LoadResult<THREE.Group>[]> {
    const results: LoadResult<THREE.Group>[] = []

    for (let i = 0; i < modelPaths.length; i++) {
      const result = await MeshInstance3D.preloadModel(modelPaths[i])
      results.push(result)

      if (onProgress) {
        onProgress(i + 1, modelPaths.length)
      }
    }

    return results
  }

  /**
   * 清除资源缓存
   * @param modelPath 可选的特定模型路径
   */
  static clearModelCache(modelPath?: string): void {
    const resourceLoader = ResourceLoader.getInstance()
    resourceLoader.clearCache(modelPath)
  }

  /**
   * 获取模型缓存统计
   * @returns 缓存统计信息
   */
  static getModelCacheStats(): { count: number, urls: string[] } {
    const resourceLoader = ResourceLoader.getInstance()
    return resourceLoader.getCacheStats()
  }

  // ========================================================================
  // 序列化方法 - 包含模型路径和资源信息
  // ========================================================================

  /**
   * 序列化MeshInstance3D节点，包含模型路径和资源信息
   */
  override serialize(): any {
    const baseData = super.serialize()

    // 收集纹理路径
    const texturePaths: string[] = []
    if (this._materials.length > 0) {
      this._materials.forEach(material => {
        this.extractTexturePathsFromMaterial(material, texturePaths)
      })
    }

    return {
      ...baseData,
      // 模型资源信息
      modelPath: this._modelPath || null,
      texturePaths: texturePaths,

      // 材质属性
      materialType: this._materialType,
      materialColor: this._materialColor,
      roughness: this._roughness,
      metalness: this._metalness,

      // 阴影属性
      castShadow: this._castShadow,
      receiveShadow: this._receiveShadow,

      // 动画信息
      hasAnimations: this._animations.length > 0,
      animationNames: Array.from(this._animationMap.keys()),

      // 几何体信息
      geometryType: this._geometry?.type || null,
      vertexCount: this.getVertexCount(),
      triangleCount: this.getTriangleCount()
    }
  }

  /**
   * 反序列化MeshInstance3D节点，重新加载模型和资源
   */
  static override deserialize(data: any): MeshInstance3D {
    const instance = new MeshInstance3D(data.name)

    // 恢复基础Node3D属性
    if (data.position) instance.position = data.position
    if (data.rotation) instance.rotation = data.rotation
    if (data.scale) instance.scale = data.scale
    if (typeof data.visible === 'boolean') instance.visible = data.visible

    // 恢复材质属性
    if (data.materialType) instance._materialType = data.materialType
    if (data.materialColor) instance._materialColor = data.materialColor
    if (typeof data.roughness === 'number') instance._roughness = data.roughness
    if (typeof data.metalness === 'number') instance._metalness = data.metalness

    // 恢复阴影属性
    if (typeof data.castShadow === 'boolean') instance._castShadow = data.castShadow
    if (typeof data.receiveShadow === 'boolean') instance._receiveShadow = data.receiveShadow

    // 异步加载模型（如果有路径）
    if (data.modelPath) {
      instance._modelPath = data.modelPath
      // 延迟加载模型，避免阻塞反序列化过程
      setTimeout(async () => {
        try {
          await instance.loadModel(data.modelPath)
          console.log(`✅ 反序列化时重新加载模型: ${data.modelPath}`)
        } catch (error) {
          console.error(`❌ 反序列化时加载模型失败: ${data.modelPath}`, error)
          // 创建默认几何体作为占位符
          instance.createBoxMesh()
        }
      }, 100)
    } else {
      // 没有模型路径，创建默认几何体
      instance.createBoxMesh()
    }

    return instance
  }

  /**
   * 从材质中提取纹理路径
   */
  private extractTexturePathsFromMaterial(material: THREE.Material, texturePaths: string[]): void {
    const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'bumpMap', 'displacementMap']

    textureProperties.forEach(prop => {
      const texture = (material as any)[prop]
      if (texture && texture.image && texture.image.src) {
        const texturePath = texture.image.src
        if (!texturePaths.includes(texturePath)) {
          texturePaths.push(texturePath)
        }
      }
    })
  }
}

export default MeshInstance3D
