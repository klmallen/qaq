/**
 * QAQ游戏引擎 - 资源管理API
 * 
 * 提供资源管理的全局接口和使用示例
 */

import ResourceManager from './ResourceManager'
import { ResourceType } from '../editor/ProjectExportTypes'
import type { ResourceReference, ResourceManifest } from '../editor/ProjectExportTypes'

// ============================================================================
// 全局资源管理API
// ============================================================================

/**
 * 注册资源文件
 */
export function registerResource(
  filePath: string,
  type: ResourceType,
  metadata?: Record<string, any>
): string {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.registerResource(filePath, type, metadata)
}

/**
 * 通过UUID加载资源
 */
export async function loadResourceByUUID<T = any>(uuid: string): Promise<T | null> {
  const resourceManager = ResourceManager.getInstance()
  return await resourceManager.loadResource<T>(uuid)
}

/**
 * 通过路径加载资源
 */
export async function loadResourceByPath<T = any>(path: string): Promise<T | null> {
  const resourceManager = ResourceManager.getInstance()
  const resource = resourceManager.getResourceByPath(path)
  if (!resource) {
    throw new Error(`资源不存在: ${path}`)
  }
  return await resourceManager.loadResource<T>(resource.uuid)
}

/**
 * 预加载多个资源
 */
export async function preloadResources(uuids: string[]): Promise<void> {
  const resourceManager = ResourceManager.getInstance()
  await resourceManager.preloadResources(uuids)
}

/**
 * 获取资源信息
 */
export function getResourceInfo(uuid: string): ResourceReference | null {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.getResourceByUUID(uuid)
}

/**
 * 更新资源路径
 */
export function updateResourcePath(uuid: string, newPath: string): boolean {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.updateResourcePath(uuid, newPath)
}

/**
 * 验证所有资源
 */
export async function validateAllResources(): Promise<{
  valid: string[]
  missing: string[]
  corrupted: string[]
}> {
  const resourceManager = ResourceManager.getInstance()
  return await resourceManager.validateResources()
}

/**
 * 获取资源清单
 */
export function getResourceManifest(): ResourceManifest {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.getManifest()
}

/**
 * 清除资源缓存
 */
export function clearResourceCache(): void {
  const resourceManager = ResourceManager.getInstance()
  resourceManager.clearCache()
}

/**
 * 获取资源依赖关系
 */
export function getResourceDependencies(uuid: string): ResourceReference[] {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.getDependencies(uuid)
}

/**
 * 获取依赖此资源的其他资源
 */
export function getResourceDependents(uuid: string): ResourceReference[] {
  const resourceManager = ResourceManager.getInstance()
  return resourceManager.getDependents(uuid)
}

/**
 * 设置项目根目录
 */
export function setProjectRoot(rootPath: string): void {
  const resourceManager = ResourceManager.getInstance()
  resourceManager.setProjectRoot(rootPath)
}

/**
 * 批量注册资源
 */
export function registerResourceBatch(resources: Array<{
  path: string
  type: ResourceType
  metadata?: Record<string, any>
}>): string[] {
  const resourceManager = ResourceManager.getInstance()
  const uuids: string[] = []
  
  for (const resource of resources) {
    const uuid = resourceManager.registerResource(
      resource.path,
      resource.type,
      resource.metadata
    )
    uuids.push(uuid)
  }
  
  return uuids
}

/**
 * 获取指定类型的所有资源
 */
export function getResourcesByType(type: ResourceType): ResourceReference[] {
  const resourceManager = ResourceManager.getInstance()
  const manifest = resourceManager.getManifest()
  const uuids = manifest.typeIndex[type] || []
  
  return uuids
    .map(uuid => resourceManager.getResourceByUUID(uuid))
    .filter(resource => resource !== null) as ResourceReference[]
}

/**
 * 资源路径修复工具
 */
export async function repairResourcePaths(
  pathMappings: Record<string, string>
): Promise<{
  repaired: string[]
  failed: string[]
}> {
  const resourceManager = ResourceManager.getInstance()
  const repaired: string[] = []
  const failed: string[] = []
  
  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    const resource = resourceManager.getResourceByPath(oldPath)
    if (resource) {
      const success = resourceManager.updateResourcePath(resource.uuid, newPath)
      if (success) {
        repaired.push(resource.uuid)
      } else {
        failed.push(resource.uuid)
      }
    }
  }
  
  return { repaired, failed }
}

/**
 * 显示资源管理帮助信息
 */
export function showResourceManagementHelp(): void {
  const helpText = `
🗂️ QAQ引擎资源管理系统使用指南:

📝 资源注册:
  window.registerResource('./models/character.gltf', 'model')
  window.registerResourceBatch([
    { path: './textures/diffuse.jpg', type: 'texture' },
    { path: './audio/bgm.mp3', type: 'audio' }
  ])

📦 资源加载:
  const model = await window.loadResourceByUUID('res_123')
  const texture = await window.loadResourceByPath('./textures/diffuse.jpg')
  await window.preloadResources(['res_123', 'res_456'])

🔍 资源信息:
  const info = window.getResourceInfo('res_123')
  const manifest = window.getResourceManifest()
  const models = window.getResourcesByType('model')

🔧 资源管理:
  window.updateResourcePath('res_123', './new/path/model.gltf')
  const validation = await window.validateAllResources()
  window.clearResourceCache()

🔗 依赖关系:
  const deps = window.getResourceDependencies('res_123')
  const dependents = window.getResourceDependents('res_123')

🛠️ 路径修复:
  const result = await window.repairResourcePaths({
    './old/path.gltf': './new/path.gltf'
  })

💡 提示:
  - 资源使用UUID作为主要标识符，避免路径变更问题
  - 支持资源依赖关系管理和完整性验证
  - 提供资源缓存和预加载功能
  - 跨平台路径兼容性处理
  `
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 基础使用示例
 */
export async function basicResourceExample(): Promise<void> {
  try {
    // 设置项目根目录
    setProjectRoot('./assets')
    
    // 注册资源
    const modelUUID = registerResource('./models/character.gltf', ResourceType.MODEL, {
      format: 'gltf',
      version: '2.0'
    })
    
    const textureUUID = registerResource('./textures/character_diffuse.jpg', ResourceType.TEXTURE, {
      format: 'jpeg',
      dimensions: { width: 1024, height: 1024 }
    })
    
    // 加载资源
    const model = await loadResourceByUUID(modelUUID)
    const texture = await loadResourceByUUID(textureUUID)
    
    console.log('✅ 资源加载成功:', { model, texture })
    
  } catch (error) {
    console.error('❌ 资源示例失败:', error)
  }
}

/**
 * 批量资源管理示例
 */
export async function batchResourceExample(): Promise<void> {
  try {
    // 批量注册资源
    const uuids = registerResourceBatch([
      { path: './models/character.gltf', type: ResourceType.MODEL },
      { path: './models/environment.gltf', type: ResourceType.MODEL },
      { path: './textures/grass.jpg', type: ResourceType.TEXTURE },
      { path: './textures/stone.jpg', type: ResourceType.TEXTURE },
      { path: './audio/footsteps.wav', type: ResourceType.AUDIO }
    ])
    
    // 预加载所有资源
    await preloadResources(uuids)
    
    // 验证资源完整性
    const validation = await validateAllResources()
    console.log('📊 资源验证结果:', validation)
    
    // 获取特定类型的资源
    const models = getResourcesByType(ResourceType.MODEL)
    const textures = getResourcesByType(ResourceType.TEXTURE)
    
    console.log('✅ 批量资源管理完成:', { models: models.length, textures: textures.length })
    
  } catch (error) {
    console.error('❌ 批量资源示例失败:', error)
  }
}

/**
 * 资源路径修复示例
 */
export async function pathRepairExample(): Promise<void> {
  try {
    // 模拟资源路径变更
    const pathMappings = {
      './old/models/character.gltf': './new/models/character.gltf',
      './old/textures/diffuse.jpg': './new/textures/diffuse.jpg'
    }
    
    // 执行路径修复
    const result = await repairResourcePaths(pathMappings)
    
    console.log('🔧 路径修复结果:', result)
    
    // 重新验证资源
    const validation = await validateAllResources()
    console.log('📊 修复后验证结果:', validation)
    
  } catch (error) {
    console.error('❌ 路径修复示例失败:', error)
  }
}

// ============================================================================
// 导出到全局（仅在浏览器环境中）
// ============================================================================

if (typeof window !== 'undefined' && window) {
  try {
    // 资源管理API
    (window as any).registerResource = registerResource
    (window as any).loadResourceByUUID = loadResourceByUUID
    (window as any).loadResourceByPath = loadResourceByPath
    (window as any).preloadResources = preloadResources
    (window as any).getResourceInfo = getResourceInfo
    (window as any).updateResourcePath = updateResourcePath
    (window as any).validateAllResources = validateAllResources
    (window as any).getResourceManifest = getResourceManifest
    (window as any).clearResourceCache = clearResourceCache
    (window as any).getResourceDependencies = getResourceDependencies
    (window as any).getResourceDependents = getResourceDependents
    (window as any).setProjectRoot = setProjectRoot
    (window as any).registerResourceBatch = registerResourceBatch
    (window as any).getResourcesByType = getResourcesByType
    (window as any).repairResourcePaths = repairResourcePaths
    (window as any).showResourceManagementHelp = showResourceManagementHelp
    
    // 使用示例
    (window as any).basicResourceExample = basicResourceExample
    (window as any).batchResourceExample = batchResourceExample
    (window as any).pathRepairExample = pathRepairExample
    
    // ResourceManager类
    (window as any).ResourceManager = ResourceManager
    
  } catch (error) {
    // 静默处理全局设置错误
  }
}

// 函数已在定义时导出，无需重复导出
