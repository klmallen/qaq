/**
 * QAQ游戏引擎 - GLTF资源过滤器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 提供GLTF资源的过滤和查询功能
 * - 支持按类型、名称、属性等条件过滤资源
 * - 实现资源依赖关系分析
 * - 支持资源使用统计和优化建议
 */

import * as THREE from 'three'
import { 
  GLTFResource, 
  GLTFResourceType, 
  GLTFResourceContainer,
  GLTFResourceMetadata 
} from './GLTFResource'

// ============================================================================
// 过滤条件接口
// ============================================================================

/**
 * 资源过滤条件
 */
export interface ResourceFilter {
  /** 资源类型过滤 */
  types?: GLTFResourceType[]
  /** 名称模式匹配 */
  namePattern?: string | RegExp
  /** 是否包含未命名资源 */
  includeUnnamed?: boolean
  /** 自定义过滤函数 */
  customFilter?: (container: GLTFResourceContainer) => boolean
}

/**
 * 资源查询选项
 */
export interface ResourceQueryOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean
  /** 是否使用正则表达式 */
  useRegex?: boolean
  /** 最大返回数量 */
  limit?: number
  /** 排序方式 */
  sortBy?: 'name' | 'type' | 'index'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 依赖关系分析结果
 */
export interface DependencyAnalysis {
  /** 资源ID */
  resourceId: string
  /** 直接依赖 */
  directDependencies: string[]
  /** 间接依赖 */
  indirectDependencies: string[]
  /** 被依赖的资源 */
  dependents: string[]
  /** 依赖深度 */
  dependencyDepth: number
  /** 是否存在循环依赖 */
  hasCircularDependency: boolean
}

// ============================================================================
// GLTF资源过滤器类
// ============================================================================

/**
 * GLTF资源过滤器
 */
export class GLTFResourceFilter {
  constructor(private resource: GLTFResource) {}
  
  /**
   * 按条件过滤资源
   * @param filter 过滤条件
   * @returns 过滤后的资源容器数组
   */
  filterResources(filter: ResourceFilter): GLTFResourceContainer[] {
    const results: GLTFResourceContainer[] = []
    
    // 遍历所有资源类型
    for (const [type, containers] of this.resource.resourceIndex.byType.entries()) {
      // 类型过滤
      if (filter.types && !filter.types.includes(type)) {
        continue
      }
      
      for (const container of containers) {
        // 名称过滤
        if (filter.namePattern && !this.matchesNamePattern(container.metadata.name, filter.namePattern)) {
          continue
        }
        
        // 未命名资源过滤
        if (!filter.includeUnnamed && !container.metadata.name) {
          continue
        }
        
        // 自定义过滤
        if (filter.customFilter && !filter.customFilter(container)) {
          continue
        }
        
        results.push(container)
      }
    }
    
    return results
  }
  
  /**
   * 查找资源
   * @param query 查询字符串
   * @param options 查询选项
   * @returns 匹配的资源容器数组
   */
  findResources(query: string, options: ResourceQueryOptions = {}): GLTFResourceContainer[] {
    const results: GLTFResourceContainer[] = []
    const { caseSensitive = false, useRegex = false, limit, sortBy = 'name', sortOrder = 'asc' } = options
    
    // 准备查询模式
    let pattern: RegExp
    if (useRegex) {
      pattern = new RegExp(query, caseSensitive ? 'g' : 'gi')
    } else {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      pattern = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi')
    }
    
    // 搜索所有资源
    for (const containers of this.resource.resourceIndex.byType.values()) {
      for (const container of containers) {
        if (this.matchesQuery(container, pattern)) {
          results.push(container)
        }
      }
    }
    
    // 排序
    this.sortResults(results, sortBy, sortOrder)
    
    // 限制数量
    if (limit && limit > 0) {
      return results.slice(0, limit)
    }
    
    return results
  }
  
  /**
   * 获取资源统计信息
   * @returns 资源统计信息
   */
  getResourceStats(): {
    totalResources: number
    resourcesByType: Map<GLTFResourceType, number>
    namedResources: number
    unnamedResources: number
    averageDependencies: number
  } {
    let totalResources = 0
    let namedResources = 0
    let unnamedResources = 0
    let totalDependencies = 0
    const resourcesByType = new Map<GLTFResourceType, number>()
    
    for (const [type, containers] of this.resource.resourceIndex.byType.entries()) {
      resourcesByType.set(type, containers.length)
      totalResources += containers.length
      
      for (const container of containers) {
        if (container.metadata.name) {
          namedResources++
        } else {
          unnamedResources++
        }
        
        totalDependencies += container.dependencies.length
      }
    }
    
    return {
      totalResources,
      resourcesByType,
      namedResources,
      unnamedResources,
      averageDependencies: totalResources > 0 ? totalDependencies / totalResources : 0
    }
  }
  
  /**
   * 分析资源依赖关系
   * @param resourceId 资源ID
   * @returns 依赖关系分析结果
   */
  analyzeDependencies(resourceId: string): DependencyAnalysis | null {
    const container = this.resource.resourceIndex.byId.get(resourceId)
    if (!container) {
      return null
    }
    
    const directDependencies = container.dependencies
    const indirectDependencies = this.getIndirectDependencies(resourceId, new Set())
    const dependents = this.findDependents(resourceId)
    const dependencyDepth = this.calculateDependencyDepth(resourceId, new Set())
    const hasCircularDependency = this.hasCircularDependency(resourceId, new Set())
    
    return {
      resourceId,
      directDependencies,
      indirectDependencies,
      dependents,
      dependencyDepth,
      hasCircularDependency
    }
  }
  
  /**
   * 获取未使用的资源
   * @returns 未使用的资源ID数组
   */
  getUnusedResources(): string[] {
    const unusedResources: string[] = []
    
    for (const [resourceId] of this.resource.resourceIndex.byId.entries()) {
      const dependents = this.findDependents(resourceId)
      if (dependents.length === 0) {
        // 检查是否是根资源（场景、动画等）
        const container = this.resource.resourceIndex.byId.get(resourceId)
        if (container && !this.isRootResource(container.metadata.type)) {
          unusedResources.push(resourceId)
        }
      }
    }
    
    return unusedResources
  }
  
  /**
   * 获取资源优化建议
   * @returns 优化建议数组
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const stats = this.getResourceStats()
    const unusedResources = this.getUnusedResources()
    
    // 未使用资源建议
    if (unusedResources.length > 0) {
      suggestions.push(`发现 ${unusedResources.length} 个未使用的资源，可以考虑移除以减少文件大小`)
    }
    
    // 未命名资源建议
    if (stats.unnamedResources > stats.namedResources * 0.5) {
      suggestions.push(`有 ${stats.unnamedResources} 个未命名资源，建议添加有意义的名称以便管理`)
    }
    
    // 纹理数量建议
    const textureCount = stats.resourcesByType.get(GLTFResourceType.TEXTURE) || 0
    if (textureCount > 20) {
      suggestions.push(`纹理数量较多 (${textureCount})，考虑使用纹理图集或压缩格式优化`)
    }
    
    // 材质数量建议
    const materialCount = stats.resourcesByType.get(GLTFResourceType.MATERIAL) || 0
    if (materialCount > 50) {
      suggestions.push(`材质数量较多 (${materialCount})，考虑合并相似材质`)
    }
    
    return suggestions
  }
  
  // ========================================================================
  // 私有辅助方法
  // ========================================================================
  
  /**
   * 检查名称是否匹配模式
   */
  private matchesNamePattern(name: string | undefined, pattern: string | RegExp): boolean {
    if (!name) return false
    
    if (typeof pattern === 'string') {
      return name.toLowerCase().includes(pattern.toLowerCase())
    } else {
      return pattern.test(name)
    }
  }
  
  /**
   * 检查资源是否匹配查询
   */
  private matchesQuery(container: GLTFResourceContainer, pattern: RegExp): boolean {
    // 检查名称
    if (container.metadata.name && pattern.test(container.metadata.name)) {
      return true
    }
    
    // 检查ID
    if (pattern.test(container.metadata.id)) {
      return true
    }
    
    // 检查类型
    if (pattern.test(container.metadata.type)) {
      return true
    }
    
    return false
  }
  
  /**
   * 排序结果
   */
  private sortResults(results: GLTFResourceContainer[], sortBy: string, sortOrder: string): void {
    results.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = (a.metadata.name || '').localeCompare(b.metadata.name || '')
          break
        case 'type':
          comparison = a.metadata.type.localeCompare(b.metadata.type)
          break
        case 'index':
          comparison = a.metadata.index - b.metadata.index
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  /**
   * 获取间接依赖
   */
  private getIndirectDependencies(resourceId: string, visited: Set<string>): string[] {
    if (visited.has(resourceId)) {
      return []
    }
    
    visited.add(resourceId)
    const indirectDeps: string[] = []
    const container = this.resource.resourceIndex.byId.get(resourceId)
    
    if (container) {
      for (const depId of container.dependencies) {
        indirectDeps.push(...this.getIndirectDependencies(depId, visited))
      }
    }
    
    return Array.from(new Set(indirectDeps))
  }
  
  /**
   * 查找依赖于指定资源的其他资源
   */
  private findDependents(resourceId: string): string[] {
    const dependents: string[] = []
    
    for (const [id, container] of this.resource.resourceIndex.byId.entries()) {
      if (container.dependencies.includes(resourceId)) {
        dependents.push(id)
      }
    }
    
    return dependents
  }
  
  /**
   * 计算依赖深度
   */
  private calculateDependencyDepth(resourceId: string, visited: Set<string>): number {
    if (visited.has(resourceId)) {
      return 0
    }
    
    visited.add(resourceId)
    const container = this.resource.resourceIndex.byId.get(resourceId)
    
    if (!container || container.dependencies.length === 0) {
      return 0
    }
    
    let maxDepth = 0
    for (const depId of container.dependencies) {
      const depth = this.calculateDependencyDepth(depId, visited)
      maxDepth = Math.max(maxDepth, depth + 1)
    }
    
    return maxDepth
  }
  
  /**
   * 检查是否存在循环依赖
   */
  private hasCircularDependency(resourceId: string, visited: Set<string>): boolean {
    if (visited.has(resourceId)) {
      return true
    }
    
    visited.add(resourceId)
    const container = this.resource.resourceIndex.byId.get(resourceId)
    
    if (container) {
      for (const depId of container.dependencies) {
        if (this.hasCircularDependency(depId, visited)) {
          return true
        }
      }
    }
    
    visited.delete(resourceId)
    return false
  }
  
  /**
   * 检查是否是根资源
   */
  private isRootResource(type: GLTFResourceType): boolean {
    return [
      GLTFResourceType.SCENE,
      GLTFResourceType.ANIMATION,
      GLTFResourceType.CAMERA
    ].includes(type)
  }
}

// ============================================================================
// 导出
// ============================================================================

export default GLTFResourceFilter
