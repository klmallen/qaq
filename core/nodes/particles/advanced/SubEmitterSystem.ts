// ============================================================================
// QAQ Engine - Sub-Emitter System (Advanced Feature)
// ============================================================================

import Node3D from '../../Node3D'
import ParticleSystem3D from '../ParticleSystem3D'
import { Vector3, Color } from 'three'

/**
 * 子发射器触发事件
 */
export enum SubEmitterTrigger {
  BIRTH = 'birth',           // 粒子出生时
  DEATH = 'death',           // 粒子死亡时
  COLLISION = 'collision',   // 粒子碰撞时
  MANUAL = 'manual'          // 手动触发
}

/**
 * 子发射器配置
 */
export interface SubEmitterConfig {
  id: string
  trigger: SubEmitterTrigger
  enabled: boolean
  
  // 发射参数
  emissionCount: number      // 每次触发发射的粒子数
  emissionProbability: number // 触发概率 (0-1)
  
  // 继承属性
  inheritPosition: boolean
  inheritVelocity: boolean
  inheritColor: boolean
  inheritSize: boolean
  
  // 速度修改
  velocityScale: number
  velocityOffset: Vector3
  
  // 生命周期
  lifetimeScale: number
  lifetimeOffset: number
  
  // 延迟
  emissionDelay: number
  
  // 粒子系统引用
  particleSystemTemplate: ParticleSystem3D
}

/**
 * 子发射器事件数据
 */
export interface SubEmitterEvent {
  trigger: SubEmitterTrigger
  parentParticle: any
  position: Vector3
  velocity: Vector3
  color: Color
  size: number
  timestamp: number
}

/**
 * 子发射器系统
 * 
 * 高级特性：
 * - 多级粒子发射：粒子死亡时产生新粒子
 * - 事件驱动：基于粒子生命周期事件触发
 * - 属性继承：子粒子可继承父粒子属性
 * - 延迟发射：支持延迟触发
 * - 概率控制：随机触发机制
 */
export default class SubEmitterSystem extends Node3D {
  // 子发射器配置
  private _subEmitters: Map<string, SubEmitterConfig> = new Map()
  
  // 事件队列
  private _eventQueue: SubEmitterEvent[] = []
  private _delayedEvents: Array<{ event: SubEmitterEvent, delay: number }> = []
  
  // 父粒子系统引用
  private _parentSystem: ParticleSystem3D | null = null
  
  // 性能限制
  private _maxSubEmittersPerFrame: number = 100
  private _maxTotalSubParticles: number = 10000
  private _currentSubParticleCount: number = 0
  
  // 统计信息
  private _totalTriggered: number = 0
  private _totalEmitted: number = 0

  constructor(parentSystem: ParticleSystem3D) {
    super('SubEmitterSystem')
    
    this._parentSystem = parentSystem
    
    // 监听父粒子系统事件
    this._setupParentSystemListeners()
    
    console.log('子发射器系统初始化完成')
  }

  /**
   * 设置父粒子系统事件监听
   */
  private _setupParentSystemListeners(): void {
    if (!this._parentSystem) return

    // 监听粒子生成事件
    this._parentSystem.onParticleSpawned((particle) => {
      this._handleParticleEvent(SubEmitterTrigger.BIRTH, particle)
    })

    // 监听粒子死亡事件
    this._parentSystem.onParticleDied((particle) => {
      this._handleParticleEvent(SubEmitterTrigger.DEATH, particle)
    })
  }

  /**
   * 处理粒子事件
   */
  private _handleParticleEvent(trigger: SubEmitterTrigger, particle: any): void {
    // 查找匹配的子发射器
    for (const subEmitter of this._subEmitters.values()) {
      if (subEmitter.trigger === trigger && subEmitter.enabled) {
        // 检查触发概率
        if (Math.random() <= subEmitter.emissionProbability) {
          const event: SubEmitterEvent = {
            trigger,
            parentParticle: particle,
            position: particle.position.clone(),
            velocity: particle.velocity.clone(),
            color: particle.color.clone(),
            size: particle.size,
            timestamp: performance.now()
          }

          if (subEmitter.emissionDelay > 0) {
            // 延迟发射
            this._delayedEvents.push({
              event,
              delay: subEmitter.emissionDelay
            })
          } else {
            // 立即发射
            this._eventQueue.push(event)
          }

          this._totalTriggered++
        }
      }
    }
  }

  /**
   * 更新子发射器系统
   */
  update(deltaTime: number): void {
    // 处理延迟事件
    this._updateDelayedEvents(deltaTime)
    
    // 处理事件队列
    this._processEventQueue()
    
    // 清理过期事件
    this._cleanupEvents()
  }

  /**
   * 更新延迟事件
   */
  private _updateDelayedEvents(deltaTime: number): void {
    for (let i = this._delayedEvents.length - 1; i >= 0; i--) {
      const delayedEvent = this._delayedEvents[i]
      delayedEvent.delay -= deltaTime

      if (delayedEvent.delay <= 0) {
        // 延迟时间到，添加到事件队列
        this._eventQueue.push(delayedEvent.event)
        this._delayedEvents.splice(i, 1)
      }
    }
  }

  /**
   * 处理事件队列
   */
  private _processEventQueue(): void {
    let processedCount = 0
    
    while (this._eventQueue.length > 0 && processedCount < this._maxSubEmittersPerFrame) {
      const event = this._eventQueue.shift()!
      this._processSubEmitterEvent(event)
      processedCount++
    }
  }

  /**
   * 处理单个子发射器事件
   */
  private _processSubEmitterEvent(event: SubEmitterEvent): void {
    // 查找匹配的子发射器
    for (const subEmitter of this._subEmitters.values()) {
      if (subEmitter.trigger === event.trigger && subEmitter.enabled) {
        this._emitSubParticles(subEmitter, event)
      }
    }
  }

  /**
   * 发射子粒子
   */
  private _emitSubParticles(subEmitter: SubEmitterConfig, event: SubEmitterEvent): void {
    // 检查粒子数量限制
    if (this._currentSubParticleCount >= this._maxTotalSubParticles) {
      console.warn('子粒子数量达到上限，跳过发射')
      return
    }

    const template = subEmitter.particleSystemTemplate
    if (!template) {
      console.warn(`子发射器 ${subEmitter.id} 没有粒子系统模板`)
      return
    }

    // 创建子粒子系统实例
    const subParticleSystem = this._createSubParticleSystem(template, subEmitter, event)
    
    // 设置位置
    if (subEmitter.inheritPosition) {
      subParticleSystem.position = event.position
    }

    // 配置发射器
    this._configureSubEmitter(subParticleSystem, subEmitter, event)

    // 发射粒子
    subParticleSystem.emit(subEmitter.emissionCount)
    
    // 添加到场景
    if (this._parentSystem && this._parentSystem.parent) {
      this._parentSystem.parent.addChild(subParticleSystem)
    }

    // 设置自动销毁
    this._setupAutoDestroy(subParticleSystem)

    this._totalEmitted += subEmitter.emissionCount
    this._currentSubParticleCount += subEmitter.emissionCount

    console.log(`子发射器 ${subEmitter.id} 发射了 ${subEmitter.emissionCount} 个粒子`)
  }

  /**
   * 创建子粒子系统
   */
  private _createSubParticleSystem(template: ParticleSystem3D, subEmitter: SubEmitterConfig, event: SubEmitterEvent): ParticleSystem3D {
    // 克隆模板粒子系统
    const subSystem = new ParticleSystem3D(`${template.name}_Sub_${Date.now()}`, {
      maxParticles: template._config.maxParticles,
      lifetime: template._config.lifetime,
      emissionRate: template._config.emissionRate,
      useWebGPU: template._config.useWebGPU,
      enableComputeShaders: template._config.enableComputeShaders
    })

    return subSystem
  }

  /**
   * 配置子发射器
   */
  private _configureSubEmitter(subSystem: ParticleSystem3D, subEmitter: SubEmitterConfig, event: SubEmitterEvent): void {
    // 继承速度
    if (subEmitter.inheritVelocity) {
      const inheritedVelocity = event.velocity.clone()
      inheritedVelocity.multiplyScalar(subEmitter.velocityScale)
      inheritedVelocity.add(subEmitter.velocityOffset)

      subSystem.emitter.setEmissionConfig({
        velocity: inheritedVelocity,
        velocityVariation: { x: 0.5, y: 0.5, z: 0.5 }
      })
    }

    // 继承颜色
    if (subEmitter.inheritColor) {
      subSystem.material.setConfig({
        baseColor: event.color
      })
    }

    // 继承大小
    if (subEmitter.inheritSize) {
      const inheritedSize = event.size
      subSystem.emitter.setEmissionConfig({
        size: inheritedSize,
        sizeVariation: 0.2
      })
    }

    // 调整生命周期
    const adjustedLifetime = subSystem._config.lifetime! * subEmitter.lifetimeScale + subEmitter.lifetimeOffset
    subSystem.setLifetime(Math.max(0.1, adjustedLifetime))
  }

  /**
   * 设置自动销毁
   */
  private _setupAutoDestroy(subSystem: ParticleSystem3D): void {
    subSystem.onFinished(() => {
      // 粒子系统完成后自动销毁
      if (subSystem.parent) {
        subSystem.parent.removeChild(subSystem)
      }
      subSystem.destroy()
      
      // 更新计数
      this._currentSubParticleCount = Math.max(0, this._currentSubParticleCount - subSystem._config.maxParticles!)
    })
  }

  /**
   * 清理过期事件
   */
  private _cleanupEvents(): void {
    const currentTime = performance.now()
    const maxEventAge = 5000 // 5秒

    // 清理过期的事件队列
    this._eventQueue = this._eventQueue.filter(event => 
      currentTime - event.timestamp < maxEventAge
    )

    // 清理过期的延迟事件
    this._delayedEvents = this._delayedEvents.filter(delayedEvent => 
      currentTime - delayedEvent.event.timestamp < maxEventAge
    )
  }

  // ========================================================================
  // 公共API
  // ========================================================================

  /**
   * 添加子发射器
   */
  addSubEmitter(config: SubEmitterConfig): void {
    this._subEmitters.set(config.id, config)
    console.log(`添加子发射器: ${config.id}`)
  }

  /**
   * 移除子发射器
   */
  removeSubEmitter(id: string): void {
    this._subEmitters.delete(id)
    console.log(`移除子发射器: ${id}`)
  }

  /**
   * 更新子发射器配置
   */
  updateSubEmitter(id: string, updates: Partial<SubEmitterConfig>): void {
    const subEmitter = this._subEmitters.get(id)
    if (subEmitter) {
      Object.assign(subEmitter, updates)
      console.log(`更新子发射器: ${id}`)
    }
  }

  /**
   * 启用/禁用子发射器
   */
  setSubEmitterEnabled(id: string, enabled: boolean): void {
    const subEmitter = this._subEmitters.get(id)
    if (subEmitter) {
      subEmitter.enabled = enabled
      console.log(`子发射器 ${id}: ${enabled ? '启用' : '禁用'}`)
    }
  }

  /**
   * 手动触发子发射器
   */
  triggerSubEmitter(id: string, position: Vector3, velocity: Vector3, color: Color, size: number): void {
    const subEmitter = this._subEmitters.get(id)
    if (subEmitter && subEmitter.trigger === SubEmitterTrigger.MANUAL) {
      const event: SubEmitterEvent = {
        trigger: SubEmitterTrigger.MANUAL,
        parentParticle: null,
        position: position.clone(),
        velocity: velocity.clone(),
        color: color.clone(),
        size,
        timestamp: performance.now()
      }

      this._eventQueue.push(event)
      console.log(`手动触发子发射器: ${id}`)
    }
  }

  /**
   * 设置性能限制
   */
  setPerformanceLimits(maxSubEmittersPerFrame: number, maxTotalSubParticles: number): void {
    this._maxSubEmittersPerFrame = maxSubEmittersPerFrame
    this._maxTotalSubParticles = maxTotalSubParticles
    console.log(`设置性能限制: 每帧${maxSubEmittersPerFrame}个发射器, 总计${maxTotalSubParticles}个粒子`)
  }

  /**
   * 获取统计信息
   */
  getStatistics(): any {
    return {
      subEmitterCount: this._subEmitters.size,
      totalTriggered: this._totalTriggered,
      totalEmitted: this._totalEmitted,
      currentSubParticleCount: this._currentSubParticleCount,
      eventQueueSize: this._eventQueue.length,
      delayedEventCount: this._delayedEvents.length,
      maxSubEmittersPerFrame: this._maxSubEmittersPerFrame,
      maxTotalSubParticles: this._maxTotalSubParticles
    }
  }

  /**
   * 清除所有子发射器
   */
  clearAll(): void {
    this._subEmitters.clear()
    this._eventQueue.length = 0
    this._delayedEvents.length = 0
    this._totalTriggered = 0
    this._totalEmitted = 0
    this._currentSubParticleCount = 0
    
    console.log('清除所有子发射器')
  }

  /**
   * 销毁子发射器系统
   */
  override destroy(): void {
    this.clearAll()
    this._parentSystem = null

    super.destroy()
    console.log('子发射器系统已销毁')
  }
}
