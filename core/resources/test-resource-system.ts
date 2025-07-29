/**
 * QAQ游戏引擎 - 资源系统测试
 * 
 * 测试资源管理系统的完整性和正确性
 */

import ResourceManager from './ResourceManager'
import { ResourceType } from '../editor/ProjectExportTypes'
import type { ResourceReference, ResourceManifest } from '../editor/ProjectExportTypes'

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试ResourceManager单例模式
 */
export function testResourceManagerSingleton(): boolean {
  try {
    const manager1 = ResourceManager.getInstance()
    const manager2 = ResourceManager.getInstance()
    
    return manager1 === manager2
  } catch (error) {
    return false
  }
}

/**
 * 测试资源注册功能
 */
export function testResourceRegistration(): {
  success: boolean
  registeredUUIDs: string[]
  errors: string[]
} {
  const registeredUUIDs: string[] = []
  const errors: string[] = []

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 注册不同类型的资源
    const testResources = [
      { path: './models/test_character.gltf', type: ResourceType.MODEL },
      { path: './textures/test_diffuse.jpg', type: ResourceType.TEXTURE },
      { path: './audio/test_sound.wav', type: ResourceType.AUDIO },
      { path: './scripts/test_script.js', type: ResourceType.SCRIPT }
    ]

    for (const resource of testResources) {
      try {
        const uuid = resourceManager.registerResource(
          resource.path,
          resource.type,
          { testResource: true }
        )
        registeredUUIDs.push(uuid)
      } catch (error) {
        errors.push(`注册资源失败 ${resource.path}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      registeredUUIDs,
      errors
    }

  } catch (error) {
    errors.push(`资源注册测试失败: ${error}`)
    return {
      success: false,
      registeredUUIDs,
      errors
    }
  }
}

/**
 * 测试资源查找功能
 */
export function testResourceLookup(): {
  success: boolean
  foundByUUID: number
  foundByPath: number
  errors: string[]
} {
  const errors: string[] = []
  let foundByUUID = 0
  let foundByPath = 0

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 先注册一些测试资源
    const testPaths = [
      './test/model1.gltf',
      './test/texture1.jpg',
      './test/audio1.wav'
    ]

    const uuids: string[] = []
    for (const path of testPaths) {
      const uuid = resourceManager.registerResource(path, ResourceType.MODEL)
      uuids.push(uuid)
    }

    // 测试通过UUID查找
    for (const uuid of uuids) {
      const resource = resourceManager.getResourceByUUID(uuid)
      if (resource) {
        foundByUUID++
      } else {
        errors.push(`通过UUID查找失败: ${uuid}`)
      }
    }

    // 测试通过路径查找
    for (const path of testPaths) {
      const resource = resourceManager.getResourceByPath(path)
      if (resource) {
        foundByPath++
      } else {
        errors.push(`通过路径查找失败: ${path}`)
      }
    }

    return {
      success: errors.length === 0,
      foundByUUID,
      foundByPath,
      errors
    }

  } catch (error) {
    errors.push(`资源查找测试失败: ${error}`)
    return {
      success: false,
      foundByUUID,
      foundByPath,
      errors
    }
  }
}

/**
 * 测试路径处理功能
 */
export function testPathHandling(): {
  success: boolean
  normalizedPaths: Record<string, string>
  relativePaths: Record<string, string>
  errors: string[]
} {
  const errors: string[] = []
  const normalizedPaths: Record<string, string> = {}
  const relativePaths: Record<string, string> = {}

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 设置项目根目录
    resourceManager.setProjectRoot('/project/root')

    // 测试路径规范化
    const testPaths = [
      'C:\\Windows\\Path\\file.txt',
      '/unix/path/file.txt',
      './relative/path/file.txt',
      '../parent/path/file.txt',
      'simple/path/file.txt'
    ]

    for (const path of testPaths) {
      try {
        // 通过注册资源来测试路径处理
        const uuid = resourceManager.registerResource(path, ResourceType.TEXTURE)
        const resource = resourceManager.getResourceByUUID(uuid)
        
        if (resource) {
          normalizedPaths[path] = resource.originalPath
          relativePaths[path] = resource.relativePath
        }
      } catch (error) {
        errors.push(`路径处理失败 ${path}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      normalizedPaths,
      relativePaths,
      errors
    }

  } catch (error) {
    errors.push(`路径处理测试失败: ${error}`)
    return {
      success: false,
      normalizedPaths,
      relativePaths,
      errors
    }
  }
}

/**
 * 测试资源清单生成
 */
export function testManifestGeneration(): {
  success: boolean
  manifest: ResourceManifest | null
  errors: string[]
} {
  const errors: string[] = []

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 注册一些测试资源
    const uuids = [
      resourceManager.registerResource('./test1.gltf', ResourceType.MODEL),
      resourceManager.registerResource('./test2.jpg', ResourceType.TEXTURE),
      resourceManager.registerResource('./test3.wav', ResourceType.AUDIO)
    ]

    // 获取清单
    const manifest = resourceManager.getManifest()

    // 验证清单结构
    const requiredFields = [
      'version', 'projectRoot', 'resources', 'pathToUuid',
      'typeIndex', 'dependencyGraph', 'totalSize', 'resourceCount',
      'missingResources', 'brokenReferences', 'lastScan'
    ]

    for (const field of requiredFields) {
      if (!(field in manifest)) {
        errors.push(`清单缺少字段: ${field}`)
      }
    }

    // 验证资源数量
    if (manifest.resourceCount !== uuids.length) {
      errors.push(`资源数量不匹配: 期望 ${uuids.length}, 实际 ${manifest.resourceCount}`)
    }

    // 验证UUID映射
    for (const uuid of uuids) {
      if (!(uuid in manifest.resources)) {
        errors.push(`清单中缺少资源: ${uuid}`)
      }
    }

    return {
      success: errors.length === 0,
      manifest: errors.length === 0 ? manifest : null,
      errors
    }

  } catch (error) {
    errors.push(`清单生成测试失败: ${error}`)
    return {
      success: false,
      manifest: null,
      errors
    }
  }
}

/**
 * 测试资源路径更新
 */
export function testPathUpdate(): {
  success: boolean
  updatedPaths: Record<string, string>
  errors: string[]
} {
  const errors: string[] = []
  const updatedPaths: Record<string, string> = {}

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 注册测试资源
    const originalPath = './original/path/test.gltf'
    const uuid = resourceManager.registerResource(originalPath, ResourceType.MODEL)

    // 更新路径
    const newPath = './new/path/test.gltf'
    const updateSuccess = resourceManager.updateResourcePath(uuid, newPath)

    if (!updateSuccess) {
      errors.push('路径更新失败')
    } else {
      // 验证更新结果
      const resource = resourceManager.getResourceByUUID(uuid)
      if (resource) {
        updatedPaths[originalPath] = resource.originalPath
        
        // 验证新路径可以找到资源
        const foundByNewPath = resourceManager.getResourceByPath(newPath)
        if (!foundByNewPath || foundByNewPath.uuid !== uuid) {
          errors.push('更新后无法通过新路径找到资源')
        }

        // 验证旧路径不能找到资源
        const foundByOldPath = resourceManager.getResourceByPath(originalPath)
        if (foundByOldPath) {
          errors.push('更新后仍能通过旧路径找到资源')
        }
      } else {
        errors.push('更新后无法找到资源')
      }
    }

    return {
      success: errors.length === 0,
      updatedPaths,
      errors
    }

  } catch (error) {
    errors.push(`路径更新测试失败: ${error}`)
    return {
      success: false,
      updatedPaths,
      errors
    }
  }
}

/**
 * 测试依赖关系管理
 */
export function testDependencyManagement(): {
  success: boolean
  dependencies: Record<string, string[]>
  dependents: Record<string, string[]>
  errors: string[]
} {
  const errors: string[] = []
  const dependencies: Record<string, string[]> = {}
  const dependents: Record<string, string[]> = {}

  try {
    const resourceManager = ResourceManager.getInstance()
    
    // 创建有依赖关系的资源
    const textureUUID = resourceManager.registerResource('./texture.jpg', ResourceType.TEXTURE)
    const materialUUID = resourceManager.registerResource('./material.mat', ResourceType.MATERIAL)
    const modelUUID = resourceManager.registerResource('./model.gltf', ResourceType.MODEL)

    // 手动设置依赖关系（在实际应用中这会在资源加载时自动设置）
    const manifest = resourceManager.getManifest()
    manifest.resources[materialUUID].dependencies = [textureUUID]
    manifest.resources[modelUUID].dependencies = [materialUUID, textureUUID]

    // 测试获取依赖
    const materialDeps = resourceManager.getDependencies(materialUUID)
    const modelDeps = resourceManager.getDependencies(modelUUID)

    dependencies[materialUUID] = materialDeps.map(dep => dep.uuid)
    dependencies[modelUUID] = modelDeps.map(dep => dep.uuid)

    // 测试获取依赖者
    const textureDependents = resourceManager.getDependents(textureUUID)
    const materialDependents = resourceManager.getDependents(materialUUID)

    dependents[textureUUID] = textureDependents.map(dep => dep.uuid)
    dependents[materialUUID] = materialDependents.map(dep => dep.uuid)

    // 验证依赖关系
    if (!dependencies[materialUUID].includes(textureUUID)) {
      errors.push('材质依赖纹理关系错误')
    }

    if (!dependencies[modelUUID].includes(materialUUID)) {
      errors.push('模型依赖材质关系错误')
    }

    if (!dependents[textureUUID].includes(materialUUID)) {
      errors.push('纹理被材质依赖关系错误')
    }

    return {
      success: errors.length === 0,
      dependencies,
      dependents,
      errors
    }

  } catch (error) {
    errors.push(`依赖关系测试失败: ${error}`)
    return {
      success: false,
      dependencies,
      dependents,
      errors
    }
  }
}

/**
 * 运行所有资源系统测试
 */
export async function runAllResourceSystemTests(): Promise<void> {
  const results = {
    singletonTest: false,
    registrationTest: false,
    lookupTest: false,
    pathHandlingTest: false,
    manifestTest: false,
    pathUpdateTest: false,
    dependencyTest: false
  }

  try {
    // 测试1: 单例模式测试
    results.singletonTest = testResourceManagerSingleton()

    // 测试2: 资源注册测试
    const registrationResult = testResourceRegistration()
    results.registrationTest = registrationResult.success

    // 测试3: 资源查找测试
    const lookupResult = testResourceLookup()
    results.lookupTest = lookupResult.success

    // 测试4: 路径处理测试
    const pathHandlingResult = testPathHandling()
    results.pathHandlingTest = pathHandlingResult.success

    // 测试5: 清单生成测试
    const manifestResult = testManifestGeneration()
    results.manifestTest = manifestResult.success

    // 测试6: 路径更新测试
    const pathUpdateResult = testPathUpdate()
    results.pathUpdateTest = pathUpdateResult.success

    // 测试7: 依赖关系测试
    const dependencyResult = testDependencyManagement()
    results.dependencyTest = dependencyResult.success

    // 输出测试结果摘要
    const passedTests = Object.values(results).filter(Boolean).length
    const totalTests = Object.keys(results).length

  } catch (error) {
    // 测试过程中的错误处理
  }
}

// ============================================================================
// 导出到全局（仅在浏览器环境中）
// ============================================================================

if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testResourceManagerSingleton = testResourceManagerSingleton
    (window as any).testResourceRegistration = testResourceRegistration
    (window as any).testResourceLookup = testResourceLookup
    (window as any).testPathHandling = testPathHandling
    (window as any).testManifestGeneration = testManifestGeneration
    (window as any).testPathUpdate = testPathUpdate
    (window as any).testDependencyManagement = testDependencyManagement
    (window as any).runAllResourceSystemTests = runAllResourceSystemTests
    
  } catch (error) {
    // 静默处理全局设置错误
  }
}

// 函数已在定义时导出，无需重复导出
