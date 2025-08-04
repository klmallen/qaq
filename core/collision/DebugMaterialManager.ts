/**
 * QAQ游戏引擎 - 调试材质管理器
 * 
 * 功能：管理碰撞调试线框的材质缓存和复用
 * 特性：材质复用、内存优化、动态更新
 */

import * as THREE from 'three'

// ============================================================================
// 接口定义
// ============================================================================

export interface MaterialConfig {
  color: number
  opacity: number
  lineWidth?: number
  dashed?: boolean
  dashSize?: number
  gapSize?: number
}

export interface MaterialStats {
  totalMaterials: number
  activeMaterials: number
  memoryUsage: number
}

// ============================================================================
// DebugMaterialManager 实现
// ============================================================================

export class DebugMaterialManager {
  private static _instance: DebugMaterialManager | null = null
  
  private _materials: Map<string, THREE.LineBasicMaterial> = new Map()
  private _materialRefs: Map<string, number> = new Map()
  
  // 预定义颜色常量
  static readonly COLORS = {
    STATIC_BODY: 0x00ff00,    // 绿色
    RIGID_BODY: 0xff0000,     // 红色
    AREA: 0x0000ff,           // 蓝色
    CHARACTER_BODY: 0xffff00, // 黄色
    SLEEPING: 0x888888,       // 灰色
    COLLISION: 0xff00ff,      // 紫色
    DEFAULT: 0x00ff00         // 默认绿色
  } as const

  private constructor() {}

  static getInstance(): DebugMaterialManager {
    if (!DebugMaterialManager._instance) {
      DebugMaterialManager._instance = new DebugMaterialManager()
    }
    return DebugMaterialManager._instance
  }

  // ========================================================================
  // 材质获取和管理
  // ========================================================================

  getMaterial(config: MaterialConfig): THREE.LineBasicMaterial {
    const key = this._generateMaterialKey(config)
    
    if (!this._materials.has(key)) {
      const material = this._createMaterial(config)
      this._materials.set(key, material)
      this._materialRefs.set(key, 0)
    }
    
    // 增加引用计数
    const refCount = this._materialRefs.get(key)! + 1
    this._materialRefs.set(key, refCount)
    
    return this._materials.get(key)!
  }

  getBasicMaterial(color: number, opacity: number = 1.0): THREE.LineBasicMaterial {
    return this.getMaterial({ color, opacity })
  }

  getDashedMaterial(color: number, opacity: number = 1.0, dashSize: number = 3, gapSize: number = 1): THREE.LineBasicMaterial {
    return this.getMaterial({ 
      color, 
      opacity, 
      dashed: true, 
      dashSize, 
      gapSize 
    })
  }

  // ========================================================================
  // 材质更新方法
  // ========================================================================

  updateMaterialColor(material: THREE.LineBasicMaterial, color: number): void {
    material.color.setHex(color)
    material.needsUpdate = true
  }

  updateMaterialOpacity(material: THREE.LineBasicMaterial, opacity: number): void {
    material.opacity = opacity
    material.transparent = opacity < 1.0
    material.needsUpdate = true
  }

  updateMaterialProperties(material: THREE.LineBasicMaterial, config: Partial<MaterialConfig>): void {
    if (config.color !== undefined) {
      material.color.setHex(config.color)
    }
    
    if (config.opacity !== undefined) {
      material.opacity = config.opacity
      material.transparent = config.opacity < 1.0
    }
    
    if (config.lineWidth !== undefined) {
      material.linewidth = config.lineWidth
    }
    
    material.needsUpdate = true
  }

  // ========================================================================
  // 引用计数管理
  // ========================================================================

  releaseMaterial(material: THREE.LineBasicMaterial): void {
    const key = this._findMaterialKey(material)
    if (key) {
      const refCount = this._materialRefs.get(key)! - 1
      this._materialRefs.set(key, refCount)
      
      // 如果引用计数为0，可以考虑清理（但通常保留以便复用）
      if (refCount <= 0) {
        // 暂时保留材质以便复用，实际项目中可以根据内存压力决定是否清理
      }
    }
  }

  // ========================================================================
  // 批量操作
  // ========================================================================

  createMaterialSet(configs: MaterialConfig[]): THREE.LineBasicMaterial[] {
    return configs.map(config => this.getMaterial(config))
  }

  updateAllMaterials(updater: (material: THREE.LineBasicMaterial, key: string) => void): void {
    this._materials.forEach((material, key) => {
      updater(material, key)
    })
  }

  setGlobalOpacity(opacity: number): void {
    this._materials.forEach(material => {
      material.opacity = opacity
      material.transparent = opacity < 1.0
      material.needsUpdate = true
    })
  }

  // ========================================================================
  // 统计和调试
  // ========================================================================

  getStats(): MaterialStats {
    const activeMaterials = Array.from(this._materialRefs.values())
      .filter(refCount => refCount > 0).length
    
    // 简单的内存使用估算（每个材质约1KB）
    const memoryUsage = this._materials.size * 1024
    
    return {
      totalMaterials: this._materials.size,
      activeMaterials,
      memoryUsage
    }
  }

  getMaterialKeys(): string[] {
    return Array.from(this._materials.keys())
  }

  getMaterialByKey(key: string): THREE.LineBasicMaterial | undefined {
    return this._materials.get(key)
  }

  getRefCount(key: string): number {
    return this._materialRefs.get(key) ?? 0
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  clearUnusedMaterials(): number {
    let clearedCount = 0
    const keysToRemove: string[] = []
    
    this._materialRefs.forEach((refCount, key) => {
      if (refCount <= 0) {
        const material = this._materials.get(key)
        if (material) {
          material.dispose()
          keysToRemove.push(key)
          clearedCount++
        }
      }
    })
    
    keysToRemove.forEach(key => {
      this._materials.delete(key)
      this._materialRefs.delete(key)
    })
    
    return clearedCount
  }

  clear(): void {
    this._materials.forEach(material => material.dispose())
    this._materials.clear()
    this._materialRefs.clear()
  }

  dispose(): void {
    this.clear()
    DebugMaterialManager._instance = null
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _generateMaterialKey(config: MaterialConfig): string {
    const parts = [
      config.color.toString(16).padStart(6, '0'),
      config.opacity.toFixed(2),
      config.lineWidth?.toString() ?? '1',
      config.dashed ? 'dashed' : 'solid'
    ]
    
    if (config.dashed) {
      parts.push(config.dashSize?.toString() ?? '3')
      parts.push(config.gapSize?.toString() ?? '1')
    }
    
    return parts.join('_')
  }

  private _createMaterial(config: MaterialConfig): THREE.LineBasicMaterial {
    const materialProps: THREE.LineBasicMaterialParameters = {
      color: config.color,
      opacity: config.opacity,
      transparent: config.opacity < 1.0,
      depthTest: true,
      depthWrite: false,
      linewidth: config.lineWidth ?? 1
    }
    
    if (config.dashed) {
      return new THREE.LineDashedMaterial({
        ...materialProps,
        dashSize: config.dashSize ?? 3,
        gapSize: config.gapSize ?? 1
      })
    }
    
    return new THREE.LineBasicMaterial(materialProps)
  }

  private _findMaterialKey(material: THREE.LineBasicMaterial): string | undefined {
    for (const [key, mat] of this._materials.entries()) {
      if (mat === material) {
        return key
      }
    }
    return undefined
  }
}

export default DebugMaterialManager
