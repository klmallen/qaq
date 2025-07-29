/**
 * QAQ游戏引擎 - 资源管理器
 * 
 * 参考Godot引擎的资源管理方案，实现基于UUID的资源管理系统
 */

import { ResourceType } from '../editor/ProjectExportTypes'
import type {
  ResourceReference,
  ResourceMetadata,
  ImportSettings,
  ResourceManifest
} from '../editor/ProjectExportTypes'

// ============================================================================
// 资源管理器类
// ============================================================================

export class ResourceManager {
  private static instance: ResourceManager | null = null
  private manifest: ResourceManifest
  private resourceCache: Map<string, any> = new Map()
  private loadingPromises: Map<string, Promise<any>> = new Map()
  private projectRoot: string = ''

  private constructor() {
    this.manifest = this.createEmptyManifest()
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  /**
   * 设置项目根目录
   */
  setProjectRoot(rootPath: string): void {
    this.projectRoot = this.normalizePath(rootPath)
    this.manifest.projectRoot = this.projectRoot
  }

  /**
   * 注册资源
   */
  registerResource(
    filePath: string, 
    type: ResourceType, 
    metadata?: Partial<ResourceMetadata>,
    importSettings?: Partial<ImportSettings>
  ): string {
    const uuid = this.generateUUID()
    const normalizedPath = this.normalizePath(filePath)
    const relativePath = this.getRelativePath(normalizedPath)
    
    const resource: ResourceReference = {
      uuid,
      type,
      originalPath: normalizedPath,
      relativePath,
      absolutePath: normalizedPath,
      size: 0, // 将在文件扫描时更新
      checksum: '',
      lastModified: Date.now(),
      dependencies: [],
      metadata: {
        format: this.getFileExtension(filePath),
        ...metadata
      },
      importSettings: importSettings ? {
        importer: this.getDefaultImporter(type),
        importerVersion: '1.0.0',
        settings: {},
        ...importSettings
      } : undefined
    }

    // 更新清单
    this.manifest.resources[uuid] = resource
    this.manifest.pathToUuid[relativePath] = uuid
    
    // 更新类型索引
    if (!this.manifest.typeIndex[type]) {
      this.manifest.typeIndex[type] = []
    }
    this.manifest.typeIndex[type].push(uuid)
    
    this.manifest.resourceCount++
    this.manifest.lastScan = Date.now()

    return uuid
  }

  /**
   * 通过UUID获取资源引用
   */
  getResourceByUUID(uuid: string): ResourceReference | null {
    return this.manifest.resources[uuid] || null
  }

  /**
   * 通过路径获取资源引用
   */
  getResourceByPath(path: string): ResourceReference | null {
    const relativePath = this.getRelativePath(this.normalizePath(path))
    const uuid = this.manifest.pathToUuid[relativePath]
    return uuid ? this.getResourceByUUID(uuid) : null
  }

  /**
   * 加载资源
   */
  async loadResource<T = any>(uuid: string): Promise<T | null> {
    // 检查缓存
    if (this.resourceCache.has(uuid)) {
      return this.resourceCache.get(uuid)
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(uuid)) {
      return await this.loadingPromises.get(uuid)
    }

    const resource = this.getResourceByUUID(uuid)
    if (!resource) {
      throw new Error(`资源不存在: ${uuid}`)
    }

    // 创建加载Promise
    const loadingPromise = this.loadResourceInternal<T>(resource)
    this.loadingPromises.set(uuid, loadingPromise)

    try {
      const loadedResource = await loadingPromise
      this.resourceCache.set(uuid, loadedResource)
      return loadedResource
    } finally {
      this.loadingPromises.delete(uuid)
    }
  }

  /**
   * 预加载资源
   */
  async preloadResources(uuids: string[]): Promise<void> {
    const loadPromises = uuids.map(uuid => this.loadResource(uuid))
    await Promise.allSettled(loadPromises)
  }

  /**
   * 更新资源路径
   */
  updateResourcePath(uuid: string, newPath: string): boolean {
    const resource = this.getResourceByUUID(uuid)
    if (!resource) {
      return false
    }

    const oldRelativePath = resource.relativePath
    const newNormalizedPath = this.normalizePath(newPath)
    const newRelativePath = this.getRelativePath(newNormalizedPath)

    // 更新资源引用
    resource.originalPath = newNormalizedPath
    resource.relativePath = newRelativePath
    resource.absolutePath = newNormalizedPath
    resource.lastModified = Date.now()

    // 更新路径映射
    delete this.manifest.pathToUuid[oldRelativePath]
    this.manifest.pathToUuid[newRelativePath] = uuid

    // 清除缓存
    this.resourceCache.delete(uuid)

    return true
  }

  /**
   * 验证资源完整性
   */
  async validateResources(): Promise<{
    valid: string[]
    missing: string[]
    corrupted: string[]
  }> {
    const valid: string[] = []
    const missing: string[] = []
    const corrupted: string[] = []

    for (const [uuid, resource] of Object.entries(this.manifest.resources)) {
      try {
        const exists = await this.fileExists(resource.absolutePath || resource.originalPath)
        if (!exists) {
          missing.push(uuid)
          continue
        }

        // 验证校验和（如果有）
        if (resource.checksum) {
          const currentChecksum = await this.calculateChecksum(resource.absolutePath || resource.originalPath)
          if (currentChecksum !== resource.checksum) {
            corrupted.push(uuid)
            continue
          }
        }

        valid.push(uuid)
      } catch (error) {
        missing.push(uuid)
      }
    }

    // 更新清单
    this.manifest.missingResources = missing
    this.manifest.brokenReferences = corrupted

    return { valid, missing, corrupted }
  }

  /**
   * 扫描项目目录并更新资源清单
   */
  async scanProjectDirectory(directory?: string): Promise<void> {
    const scanDir = directory || this.projectRoot
    if (!scanDir) {
      throw new Error('项目根目录未设置')
    }

    // 这里应该实现目录扫描逻辑
    // 由于浏览器环境限制，这个功能在实际应用中可能需要服务端支持
    console.warn('目录扫描功能需要服务端支持')
  }

  /**
   * 获取资源清单
   */
  getManifest(): ResourceManifest {
    return { ...this.manifest }
  }

  /**
   * 设置资源清单
   */
  setManifest(manifest: ResourceManifest): void {
    this.manifest = manifest
    this.projectRoot = manifest.projectRoot
    
    // 清除缓存
    this.resourceCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * 清除资源缓存
   */
  clearCache(): void {
    this.resourceCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * 获取依赖资源
   */
  getDependencies(uuid: string): ResourceReference[] {
    const resource = this.getResourceByUUID(uuid)
    if (!resource) {
      return []
    }

    return resource.dependencies
      .map(depUuid => this.getResourceByUUID(depUuid))
      .filter(dep => dep !== null) as ResourceReference[]
  }

  /**
   * 获取依赖此资源的其他资源
   */
  getDependents(uuid: string): ResourceReference[] {
    const dependents: ResourceReference[] = []
    
    for (const resource of Object.values(this.manifest.resources)) {
      if (resource.dependencies.includes(uuid)) {
        dependents.push(resource)
      }
    }

    return dependents
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private createEmptyManifest(): ResourceManifest {
    return {
      version: '1.0.0',
      projectRoot: '',
      resources: {},
      pathToUuid: {},
      typeIndex: {} as Record<ResourceType, string[]>,
      dependencyGraph: {},
      totalSize: 0,
      resourceCount: 0,
      missingResources: [],
      brokenReferences: [],
      lastScan: Date.now()
    }
  }

  private generateUUID(): string {
    return 'res_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
  }

  private normalizePath(path: string): string {
    // 统一使用正斜杠，处理跨平台路径兼容性
    return path.replace(/\\/g, '/').replace(/\/+/g, '/')
  }

  private getRelativePath(absolutePath: string): string {
    if (!this.projectRoot) {
      return absolutePath
    }

    const normalizedRoot = this.normalizePath(this.projectRoot)
    const normalizedPath = this.normalizePath(absolutePath)

    if (normalizedPath.startsWith(normalizedRoot)) {
      return normalizedPath.substring(normalizedRoot.length).replace(/^\//, '')
    }

    return normalizedPath
  }

  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.')
    return lastDot > 0 ? filePath.substring(lastDot + 1).toLowerCase() : ''
  }

  private getDefaultImporter(type: ResourceType): string {
    switch (type) {
      case ResourceType.MODEL:
        return 'GLTFImporter'
      case ResourceType.TEXTURE:
        return 'TextureImporter'
      case ResourceType.AUDIO:
        return 'AudioImporter'
      case ResourceType.SCRIPT:
        return 'ScriptImporter'
      case ResourceType.ANIMATION:
        return 'AnimationImporter'
      case ResourceType.MATERIAL:
        return 'MaterialImporter'
      default:
        return 'DefaultImporter'
    }
  }

  private async loadResourceInternal<T>(resource: ResourceReference): Promise<T> {
    const path = resource.absolutePath || resource.originalPath

    switch (resource.type) {
      case ResourceType.MODEL:
        return await this.loadModel(path) as T
      case ResourceType.TEXTURE:
        return await this.loadTexture(path) as T
      case ResourceType.AUDIO:
        return await this.loadAudio(path) as T
      case ResourceType.SCRIPT:
        return await this.loadScript(path) as T
      default:
        throw new Error(`不支持的资源类型: ${resource.type}`)
    }
  }

  private async loadModel(path: string): Promise<any> {
    // 实现模型加载逻辑
    // 这里应该使用Three.js的GLTFLoader等
    throw new Error('模型加载功能待实现')
  }

  private async loadTexture(path: string): Promise<any> {
    // 实现纹理加载逻辑
    throw new Error('纹理加载功能待实现')
  }

  private async loadAudio(path: string): Promise<any> {
    // 实现音频加载逻辑
    throw new Error('音频加载功能待实现')
  }

  private async loadScript(path: string): Promise<any> {
    // 实现脚本加载逻辑
    throw new Error('脚本加载功能待实现')
  }

  private async fileExists(path: string): Promise<boolean> {
    // 在浏览器环境中，这个功能有限
    // 实际应用中可能需要服务端API支持
    try {
      const response = await fetch(path, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  private async calculateChecksum(path: string): Promise<string> {
    // 计算文件校验和
    // 实际实现中应该使用更高效的算法
    try {
      const response = await fetch(path)
      const arrayBuffer = await response.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return ''
    }
  }
}

export default ResourceManager
