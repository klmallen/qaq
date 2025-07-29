/**
 * QAQ 游戏引擎 动画控制器
 * 整合动画状态机和骨骼动画系统
 * 类似于 Godot 的 AnimationPlayer + AnimationTree
 */

import * as THREE from 'three'
import { QaqObject } from '../object/QaqObject'
import { StateMachine } from './StateMachine'
import { AnimationClip } from './AnimationClip'

// ============================================================================
// 动画层数据结构
// ============================================================================

export interface AnimationLayer {
  id: string
  name: string
  stateMachine: StateMachine
  weight: number // 0-1，层权重
  mask: string[] // 骨骼遮罩，空数组表示影响所有骨骼
  blendMode: 'override' | 'additive' // 混合模式
}

// ============================================================================
// 动画控制器类
// ============================================================================

export class Animator extends QaqObject {
  private _name: string
  private _layers: Map<string, AnimationLayer> = new Map()
  private _skeleton: THREE.Skeleton | null = null
  private _mixer: THREE.AnimationMixer | null = null
  private _isPlaying: boolean = false
  private _speed: number = 1.0
  private _boneTransformCache: Map<string, THREE.Matrix4> = new Map()

  constructor(name: string = 'Animator') {
    super()
    this._name = name
    this.initializeAnimatorSignals()
  }

  // ========================================================================
  // 基础属性
  // ========================================================================

  get name(): string {
    return this._name
  }

  set name(value: string) {
    if (this._name !== value) {
      this._name = value
      this.emit('name_changed', value)
    }
  }

  get skeleton(): THREE.Skeleton | null {
    return this._skeleton
  }

  set skeleton(value: THREE.Skeleton | null) {
    if (this._skeleton !== value) {
      this._skeleton = value
      this._updateMixer()
      this.emit('skeleton_changed', value)
    }
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    if (this._speed !== value) {
      this._speed = Math.max(0, value)
      if (this._mixer) {
        this._mixer.timeScale = this._speed
      }
      this.emit('speed_changed', this._speed)
    }
  }

  // ========================================================================
  // 动画层管理
  // ========================================================================

  addLayer(
    id: string,
    name: string,
    weight: number = 1.0,
    blendMode: 'override' | 'additive' = 'override'
  ): AnimationLayer {
    const layer: AnimationLayer = {
      id,
      name,
      stateMachine: new StateMachine(`${name}_StateMachine`),
      weight: Math.max(0, Math.min(1, weight)),
      mask: [],
      blendMode
    }

    this._layers.set(id, layer)
    this.emit('layer_added', layer)
    return layer
  }

  removeLayer(id: string): boolean {
    if (!this._layers.has(id)) return false

    const removedLayer = this._layers.get(id)!
    this._layers.delete(id)
    this.emit('layer_removed', removedLayer)
    return true
  }

  getLayer(id: string): AnimationLayer | null {
    return this._layers.get(id) || null
  }

  getAllLayers(): AnimationLayer[] {
    return Array.from(this._layers.values())
  }

  setLayerWeight(id: string, weight: number): boolean {
    const layer = this._layers.get(id)
    if (!layer) return false

    const newWeight = Math.max(0, Math.min(1, weight))
    if (layer.weight !== newWeight) {
      layer.weight = newWeight
      this.emit('layer_weight_changed', id, newWeight)
    }
    return true
  }

  setLayerMask(id: string, mask: string[]): boolean {
    const layer = this._layers.get(id)
    if (!layer) return false

    layer.mask = [...mask]
    this.emit('layer_mask_changed', id, mask)
    return true
  }

  // ========================================================================
  // 动画控制
  // ========================================================================

  play(): void {
    if (!this._isPlaying) {
      this._isPlaying = true
      this.emit('playback_started')
    }
  }

  pause(): void {
    if (this._isPlaying) {
      this._isPlaying = false
      this.emit('playback_paused')
    }
  }

  stop(): void {
    if (this._isPlaying) {
      this._isPlaying = false
      // 重置所有状态机时间
      for (const layer of this._layers.values()) {
        layer.stateMachine.context.currentTime = 0
      }
      this.emit('playback_stopped')
    }
  }

  // ========================================================================
  // 参数控制
  // ========================================================================

  setParameter(layerId: string, parameterName: string, value: number | string | boolean): boolean {
    const layer = this._layers.get(layerId)
    if (!layer) return false

    layer.stateMachine.setParameter(parameterName, value)
    return true
  }

  getParameter(layerId: string, parameterName: string): number | string | boolean | undefined {
    const layer = this._layers.get(layerId)
    if (!layer) return undefined

    return layer.stateMachine.getParameter(parameterName)
  }

  // 设置全局参数（影响所有层）
  setGlobalParameter(parameterName: string, value: number | string | boolean): void {
    for (const layer of this._layers.values()) {
      layer.stateMachine.setParameter(parameterName, value)
    }
  }

  // ========================================================================
  // 动画更新
  // ========================================================================

  update(deltaTime: number): void {
    if (!this._isPlaying || this._layers.size === 0) return

    // 清空骨骼变换缓存
    this._boneTransformCache.clear()

    // 更新每个动画层
    const layerResults: Map<string, Map<string, any>>[] = []
    for (const layer of this._layers.values()) {
      if (layer.weight > 0) {
        const layerResult = layer.stateMachine.update(deltaTime * this._speed)
        layerResults.push(layerResult)
      }
    }

    // 混合所有层的结果
    const finalTransforms = this._blendLayers(layerResults)

    // 应用到骨骼
    this._applyTransformsToBones(finalTransforms)

    // 更新 Three.js 动画混合器（如果有）
    if (this._mixer) {
      this._mixer.update(deltaTime * this._speed)
    }

    this.emit('animation_updated', finalTransforms)
  }

  private _blendLayers(layerResults: Map<string, Map<string, any>>[]): Map<string, any> {
    if (layerResults.length === 0) return new Map()
    if (layerResults.length === 1) return layerResults[0]

    const result = new Map()
    const layers = Array.from(this._layers.values()).filter(layer => layer.weight > 0)

    // 获取所有受影响的骨骼
    const allBones = new Set<string>()
    layerResults.forEach(layerResult => {
      layerResult.forEach((_, boneName) => allBones.add(boneName))
    })

    // 为每个骨骼混合变换
    for (const boneName of allBones) {
      let finalTransform: any = {}
      let totalWeight = 0

      for (let i = 0; i < layerResults.length && i < layers.length; i++) {
        const layerResult = layerResults[i]
        const layer = layers[i]
        const boneTransform = layerResult.get(boneName)

        if (boneTransform && this._shouldAffectBone(layer, boneName)) {
          const layerWeight = layer.weight

          if (layer.blendMode === 'override') {
            if (totalWeight === 0) {
              // 第一个覆盖层
              finalTransform = this._cloneTransform(boneTransform)
              totalWeight = layerWeight
            } else {
              // 混合覆盖层
              finalTransform = this._blendTransforms(finalTransform, boneTransform, layerWeight / (totalWeight + layerWeight))
              totalWeight += layerWeight
            }
          } else if (layer.blendMode === 'additive') {
            // 叠加模式
            finalTransform = this._additiveBlendTransforms(finalTransform, boneTransform, layerWeight)
          }
        }
      }

      if (Object.keys(finalTransform).length > 0) {
        result.set(boneName, finalTransform)
      }
    }

    return result
  }

  private _shouldAffectBone(layer: AnimationLayer, boneName: string): boolean {
    // 如果遮罩为空，影响所有骨骼
    if (layer.mask.length === 0) return true
    
    // 检查骨骼是否在遮罩中
    return layer.mask.includes(boneName)
  }

  private _blendTransforms(transform1: any, transform2: any, blendFactor: number): any {
    const result: any = {}

    // 混合位置
    if (transform1.position && transform2.position) {
      result.position = transform1.position.clone().lerp(transform2.position, blendFactor)
    } else if (transform2.position) {
      result.position = transform2.position.clone()
    } else if (transform1.position) {
      result.position = transform1.position.clone()
    }

    // 混合旋转
    if (transform1.rotation && transform2.rotation) {
      result.rotation = transform1.rotation.clone().slerp(transform2.rotation, blendFactor)
    } else if (transform2.rotation) {
      result.rotation = transform2.rotation.clone()
    } else if (transform1.rotation) {
      result.rotation = transform1.rotation.clone()
    }

    // 混合缩放
    if (transform1.scale && transform2.scale) {
      result.scale = transform1.scale.clone().lerp(transform2.scale, blendFactor)
    } else if (transform2.scale) {
      result.scale = transform2.scale.clone()
    } else if (transform1.scale) {
      result.scale = transform1.scale.clone()
    }

    return result
  }

  private _additiveBlendTransforms(baseTransform: any, additiveTransform: any, weight: number): any {
    const result = this._cloneTransform(baseTransform)

    // 叠加位置
    if (additiveTransform.position) {
      if (!result.position) result.position = new THREE.Vector3()
      result.position.add(additiveTransform.position.clone().multiplyScalar(weight))
    }

    // 叠加旋转（四元数乘法）
    if (additiveTransform.rotation) {
      if (!result.rotation) result.rotation = new THREE.Quaternion()
      const additiveRotation = new THREE.Quaternion().slerp(additiveTransform.rotation, weight)
      result.rotation.multiply(additiveRotation)
    }

    // 叠加缩放
    if (additiveTransform.scale) {
      if (!result.scale) result.scale = new THREE.Vector3(1, 1, 1)
      const additiveScale = new THREE.Vector3().lerpVectors(new THREE.Vector3(1, 1, 1), additiveTransform.scale, weight)
      result.scale.multiply(additiveScale)
    }

    return result
  }

  private _cloneTransform(transform: any): any {
    const result: any = {}
    if (transform.position) result.position = transform.position.clone()
    if (transform.rotation) result.rotation = transform.rotation.clone()
    if (transform.scale) result.scale = transform.scale.clone()
    return result
  }

  private _applyTransformsToBones(transforms: Map<string, any>): void {
    if (!this._skeleton) return

    for (const [boneName, transform] of transforms) {
      const bone = this._skeleton.getBoneByName(boneName)
      if (!bone) continue

      if (transform.position) {
        bone.position.copy(transform.position)
      }
      if (transform.rotation) {
        bone.quaternion.copy(transform.rotation)
      }
      if (transform.scale) {
        bone.scale.copy(transform.scale)
      }
    }
  }

  private _updateMixer(): void {
    if (this._skeleton && this._skeleton.bones.length > 0) {
      // 创建一个临时对象作为混合器的根
      const root = this._skeleton.bones[0].parent || this._skeleton.bones[0]
      this._mixer = new THREE.AnimationMixer(root)
      this._mixer.timeScale = this._speed
    } else {
      this._mixer = null
    }
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  private initializeAnimatorSignals(): void {
    this.addSignal('name_changed')
    this.addSignal('skeleton_changed')
    this.addSignal('speed_changed')
    this.addSignal('layer_added')
    this.addSignal('layer_removed')
    this.addSignal('layer_weight_changed')
    this.addSignal('layer_mask_changed')
    this.addSignal('playback_started')
    this.addSignal('playback_paused')
    this.addSignal('playback_stopped')
    this.addSignal('animation_updated')
  }

  // ========================================================================
  // 销毁方法
  // ========================================================================

  override destroy(): void {
    this.stop()
    this._layers.clear()
    this._boneTransformCache.clear()
    this._skeleton = null
    this._mixer = null
    super.destroy()
  }
}

export default Animator
