import * as THREE from 'three'

/**
 * 模型管理器 - 负责加载和缓存3D模型
 */
export class ModelManager {
  private static instance: ModelManager
  private loadedModels: Map<string, THREE.Object3D> = new Map()
  private loadingPromises: Map<string, Promise<THREE.Object3D>> = new Map()

  private constructor() {}

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager()
    }
    return ModelManager.instance
  }

  /**
   * 加载模型
   */
  public async loadModel(path: string): Promise<THREE.Object3D> {
    // 如果已经加载过，直接返回
    if (this.loadedModels.has(path)) {
      return this.loadedModels.get(path)!.clone()
    }

    // 如果正在加载，等待加载完成
    if (this.loadingPromises.has(path)) {
      const model = await this.loadingPromises.get(path)!
      return model.clone()
    }

    // 开始加载
    const loadingPromise = this.doLoadModel(path)
    this.loadingPromises.set(path, loadingPromise)

    try {
      const model = await loadingPromise
      this.loadedModels.set(path, model)
      this.loadingPromises.delete(path)
      return model.clone()
    } catch (error) {
      this.loadingPromises.delete(path)
      throw error
    }
  }

  /**
   * 实际加载模型的方法
   */
  private async doLoadModel(path: string): Promise<THREE.Object3D> {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
    const loader = new GLTFLoader()

    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      )
    })
  }

  /**
   * 预加载模型
   */
  public async preloadModel(path: string): Promise<void> {
    try {
      await this.loadModel(path)
    } catch (error) {
      console.warn(`预加载模型失败: ${path}`, error)
    }
  }

  /**
   * 预加载多个模型
   */
  public async preloadModels(paths: string[]): Promise<void> {
    const promises = paths.map(path => this.preloadModel(path))
    await Promise.allSettled(promises)
  }

  /**
   * 检查模型是否已加载
   */
  public isModelLoaded(path: string): boolean {
    return this.loadedModels.has(path)
  }

  /**
   * 获取已加载的模型（不克隆）
   */
  public getLoadedModel(path: string): THREE.Object3D | undefined {
    return this.loadedModels.get(path)
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.loadedModels.clear()
    this.loadingPromises.clear()
  }

  /**
   * 移除特定模型的缓存
   */
  public removeModel(path: string): void {
    this.loadedModels.delete(path)
    this.loadingPromises.delete(path)
  }
}

export default ModelManager
