// ============================================================================
// QAQ Engine - 演示管理器 (Demo Manager)
// 统一管理所有演示模块
// ============================================================================

import { Scene } from '~/core/scene/Scene'
import { ParticleDemo, ParticleDemoType, createParticleDemo } from './particles/ParticleDemo'
import { PhysicsDemo, createPhysicsDemo } from './physics/PhysicsDemo'
import { LightingDemo, LightingDemoType, createLightingDemo } from './lighting/LightingDemo'

/**
 * 演示模块类型枚举
 */
export enum DemoModuleType {
  PARTICLES = 'particles',
  PHYSICS = 'physics',
  LIGHTING = 'lighting'
}

/**
 * 演示状态接口
 */
export interface DemoState {
  particleType: ParticleDemoType
  lightingType: LightingDemoType
  physicsEnabled: boolean
  debuggerEnabled: boolean
}

/**
 * 演示管理器
 * 
 * 统一管理所有演示模块，提供简洁的API接口
 */
export class DemoManager {
  private scene: Scene | null = null
  
  // 演示模块
  private particleDemo: ParticleDemo | null = null
  private physicsDemo: PhysicsDemo | null = null
  private lightingDemo: LightingDemo | null = null
  
  // 状态管理
  private initialized: boolean = false
  private updateCallbacks: Array<() => void> = []

  constructor(scene: Scene) {
    this.scene = scene
  }

  /**
   * 初始化所有演示模块
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️ 演示管理器已经初始化')
      return
    }

    console.log('🎮 初始化演示管理器...')

    try {
      if (!this.scene) {
        throw new Error('场景未设置')
      }

      // 初始化各个演示模块
      await this.initializeParticleDemo()
      await this.initializePhysicsDemo()
      await this.initializeLightingDemo()

      this.initialized = true
      console.log('✅ 演示管理器初始化完成')

    } catch (error) {
      console.error('❌ 演示管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化粒子演示
   */
  private async initializeParticleDemo(): Promise<void> {
    if (!this.scene) return

    this.particleDemo = createParticleDemo(this.scene)
    
    // 创建默认火焰效果
    this.particleDemo.createParticleSystem(ParticleDemoType.FIRE)
    
    console.log('🎨 粒子演示模块初始化完成')
  }

  /**
   * 初始化物理演示
   */
  private async initializePhysicsDemo(): Promise<void> {
    if (!this.scene) return

    this.physicsDemo = createPhysicsDemo(this.scene)
    await this.physicsDemo.initialize()
    
    console.log('🔧 物理演示模块初始化完成')
  }

  /**
   * 初始化光照演示
   */
  private async initializeLightingDemo(): Promise<void> {
    if (!this.scene) return

    this.lightingDemo = createLightingDemo(this.scene)
    this.lightingDemo.initialize()
    
    console.log('💡 光照演示模块初始化完成')
  }

  /**
   * 更新所有演示模块
   */
  update(deltaTime: number = 0.016): void {
    if (!this.initialized) return

    // 更新各个模块
    if (this.particleDemo) {
      this.particleDemo.update()
    }

    if (this.physicsDemo) {
      this.physicsDemo.update()
    }

    if (this.lightingDemo) {
      this.lightingDemo.update(deltaTime)
    }

    // 执行自定义更新回调
    this.updateCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('❌ 更新回调执行失败:', error)
      }
    })
  }

  // ============================================================================
  // 粒子系统控制
  // ============================================================================

  /**
   * 切换粒子效果
   */
  switchParticleEffect(type: ParticleDemoType): void {
    if (this.particleDemo) {
      this.particleDemo.switchTo(type)
    }
  }

  /**
   * 重置粒子系统
   */
  resetParticles(): void {
    if (this.particleDemo) {
      this.particleDemo.reset()
    }
  }

  /**
   * 获取当前粒子系统
   */
  getCurrentParticleSystem() {
    return this.particleDemo?.getCurrentSystem() || null
  }

  /**
   * 获取活跃粒子数量
   */
  getActiveParticleCount(): number {
    return this.particleDemo?.getActiveParticleCount() || 0
  }

  // ============================================================================
  // 物理系统控制
  // ============================================================================

  /**
   * 添加掉落立方体
   */
  addFallingCube(): void {
    if (this.physicsDemo) {
      this.physicsDemo.addFallingCube()
    }
  }

  /**
   * 清理动态物理对象
   */
  clearDynamicObjects(): void {
    if (this.physicsDemo) {
      this.physicsDemo.clearDynamicObjects()
    }
  }

  /**
   * 切换物理调试器
   */
  togglePhysicsDebugger(): void {
    if (this.physicsDemo) {
      this.physicsDemo.toggleDebugger()
    }
  }

  /**
   * 获取物理对象数量
   */
  getPhysicsObjectCount(): number {
    return this.physicsDemo?.getPhysicsObjectCount() || 0
  }

  /**
   * 是否启用物理调试器
   */
  isPhysicsDebuggerEnabled(): boolean {
    return this.physicsDemo?.isDebuggerEnabled() || false
  }

  // ============================================================================
  // 光照系统控制
  // ============================================================================

  /**
   * 切换光照效果
   */
  switchLightingEffect(type: LightingDemoType): void {
    if (this.lightingDemo) {
      this.lightingDemo.switchTo(type)
    }
  }

  /**
   * 获取当前光照类型
   */
  getCurrentLightingType(): LightingDemoType {
    return this.lightingDemo?.getCurrentType() || LightingDemoType.BASIC
  }

  /**
   * 获取光源数量
   */
  getLightCount(): number {
    return this.lightingDemo?.getLightCount() || 0
  }

  // ============================================================================
  // 状态管理
  // ============================================================================

  /**
   * 获取当前演示状态
   */
  getState(): DemoState {
    return {
      particleType: ParticleDemoType.FIRE, // 默认值，实际应该从particleDemo获取
      lightingType: this.getCurrentLightingType(),
      physicsEnabled: this.getPhysicsObjectCount() > 0,
      debuggerEnabled: this.isPhysicsDebuggerEnabled()
    }
  }

  /**
   * 获取演示统计信息
   */
  getStats() {
    return {
      particles: {
        active: this.getActiveParticleCount(),
        system: this.getCurrentParticleSystem()?.name || 'None'
      },
      physics: {
        objects: this.getPhysicsObjectCount(),
        debugger: this.isPhysicsDebuggerEnabled()
      },
      lighting: {
        type: this.getCurrentLightingType(),
        count: this.getLightCount()
      }
    }
  }

  /**
   * 添加更新回调
   */
  addUpdateCallback(callback: () => void): void {
    this.updateCallbacks.push(callback)
  }

  /**
   * 移除更新回调
   */
  removeUpdateCallback(callback: () => void): void {
    const index = this.updateCallbacks.indexOf(callback)
    if (index > -1) {
      this.updateCallbacks.splice(index, 1)
    }
  }

  /**
   * 重置所有演示
   */
  resetAll(): void {
    console.log('🔄 重置所有演示...')
    
    this.resetParticles()
    this.clearDynamicObjects()
    this.switchLightingEffect(LightingDemoType.BASIC)
    
    console.log('✅ 所有演示已重置')
  }

  /**
   * 是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 销毁演示管理器
   */
  dispose(): void {
    console.log('🧹 销毁演示管理器...')

    // 销毁各个模块
    if (this.particleDemo) {
      this.particleDemo.dispose()
      this.particleDemo = null
    }

    if (this.physicsDemo) {
      this.physicsDemo.dispose()
      this.physicsDemo = null
    }

    if (this.lightingDemo) {
      this.lightingDemo.dispose()
      this.lightingDemo = null
    }

    // 清理回调
    this.updateCallbacks = []
    
    this.scene = null
    this.initialized = false
    
    console.log('✅ 演示管理器已销毁')
  }
}

/**
 * 演示管理器工厂函数
 */
export function createDemoManager(scene: Scene): DemoManager {
  return new DemoManager(scene)
}

/**
 * 获取所有可用的演示模块类型
 */
export function getAvailableDemoModules(): DemoModuleType[] {
  return Object.values(DemoModuleType)
}

/**
 * 获取演示模块的显示名称
 */
export function getDemoModuleName(type: DemoModuleType): string {
  const names = {
    [DemoModuleType.PARTICLES]: '🎨 粒子系统',
    [DemoModuleType.PHYSICS]: '🔧 物理系统',
    [DemoModuleType.LIGHTING]: '💡 光照系统'
  }
  return names[type] || type
}
