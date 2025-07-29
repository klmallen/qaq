/**
 * QAQ 游戏引擎 动画片段类
 * 存储骨骼动画的关键帧数据和曲线信息
 * 类似于 Godot 的 Animation 类
 */

import * as THREE from 'three'
import { QaqObject } from '../object/QaqObject'

// ============================================================================
// 关键帧数据结构
// ============================================================================

export interface Keyframe {
  time: number
  value: THREE.Vector3 | THREE.Quaternion | number
  interpolation: 'linear' | 'step' | 'cubic'
  inTangent?: THREE.Vector2  // Bezier 曲线入切线
  outTangent?: THREE.Vector2 // Bezier 曲线出切线
}

export interface AnimationTrack {
  boneName: string
  property: 'position' | 'rotation' | 'scale'
  keyframes: Keyframe[]
}

// ============================================================================
// 动画片段类
// ============================================================================

export class AnimationClip extends QaqObject {
  private _name: string
  private _duration: number
  private _tracks: Map<string, AnimationTrack[]> = new Map()
  private _loop: boolean = true
  private _frameRate: number = 30

  constructor(name: string, duration: number = 1.0) {
    super()
    this._name = name
    this._duration = duration
    this.initializeAnimationClipSignals()
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

  get duration(): number {
    return this._duration
  }

  set duration(value: number) {
    if (this._duration !== value) {
      this._duration = Math.max(0.1, value)
      this.emit('duration_changed', this._duration)
    }
  }

  get loop(): boolean {
    return this._loop
  }

  set loop(value: boolean) {
    if (this._loop !== value) {
      this._loop = value
      this.emit('loop_changed', value)
    }
  }

  get frameRate(): number {
    return this._frameRate
  }

  set frameRate(value: number) {
    if (this._frameRate !== value) {
      this._frameRate = Math.max(1, value)
      this.emit('frame_rate_changed', value)
    }
  }

  // ========================================================================
  // 轨道管理
  // ========================================================================

  addTrack(boneName: string, property: 'position' | 'rotation' | 'scale'): AnimationTrack {
    const track: AnimationTrack = {
      boneName,
      property,
      keyframes: []
    }

    if (!this._tracks.has(boneName)) {
      this._tracks.set(boneName, [])
    }

    const boneTracks = this._tracks.get(boneName)!
    boneTracks.push(track)

    this.emit('track_added', track)
    return track
  }

  removeTrack(boneName: string, property: 'position' | 'rotation' | 'scale'): boolean {
    const boneTracks = this._tracks.get(boneName)
    if (!boneTracks) return false

    const index = boneTracks.findIndex(track => track.property === property)
    if (index === -1) return false

    const removedTrack = boneTracks.splice(index, 1)[0]
    
    // 如果骨骼没有轨道了，删除整个条目
    if (boneTracks.length === 0) {
      this._tracks.delete(boneName)
    }

    this.emit('track_removed', removedTrack)
    return true
  }

  getTrack(boneName: string, property: 'position' | 'rotation' | 'scale'): AnimationTrack | null {
    const boneTracks = this._tracks.get(boneName)
    if (!boneTracks) return null

    return boneTracks.find(track => track.property === property) || null
  }

  getAllTracks(): AnimationTrack[] {
    const allTracks: AnimationTrack[] = []
    for (const boneTracks of this._tracks.values()) {
      allTracks.push(...boneTracks)
    }
    return allTracks
  }

  getBoneNames(): string[] {
    return Array.from(this._tracks.keys())
  }

  // ========================================================================
  // 关键帧操作
  // ========================================================================

  addKeyframe(
    boneName: string, 
    property: 'position' | 'rotation' | 'scale',
    time: number,
    value: THREE.Vector3 | THREE.Quaternion | number,
    interpolation: 'linear' | 'step' | 'cubic' = 'linear'
  ): Keyframe {
    let track = this.getTrack(boneName, property)
    if (!track) {
      track = this.addTrack(boneName, property)
    }

    const keyframe: Keyframe = {
      time: Math.max(0, Math.min(time, this._duration)),
      value: this._cloneValue(value),
      interpolation
    }

    // 按时间顺序插入关键帧
    const insertIndex = track.keyframes.findIndex(kf => kf.time > time)
    if (insertIndex === -1) {
      track.keyframes.push(keyframe)
    } else {
      track.keyframes.splice(insertIndex, 0, keyframe)
    }

    this.emit('keyframe_added', keyframe, boneName, property)
    return keyframe
  }

  removeKeyframe(boneName: string, property: 'position' | 'rotation' | 'scale', time: number): boolean {
    const track = this.getTrack(boneName, property)
    if (!track) return false

    const index = track.keyframes.findIndex(kf => Math.abs(kf.time - time) < 0.001)
    if (index === -1) return false

    const removedKeyframe = track.keyframes.splice(index, 1)[0]
    this.emit('keyframe_removed', removedKeyframe, boneName, property)
    return true
  }

  getKeyframe(boneName: string, property: 'position' | 'rotation' | 'scale', time: number): Keyframe | null {
    const track = this.getTrack(boneName, property)
    if (!track) return null

    return track.keyframes.find(kf => Math.abs(kf.time - time) < 0.001) || null
  }

  // ========================================================================
  // 动画采样
  // ========================================================================

  sampleAt(time: number): Map<string, { position?: THREE.Vector3, rotation?: THREE.Quaternion, scale?: THREE.Vector3 }> {
    const result = new Map()
    
    // 处理循环
    const sampleTime = this._loop ? time % this._duration : Math.min(time, this._duration)

    for (const [boneName, tracks] of this._tracks) {
      const boneTransform: any = {}

      for (const track of tracks) {
        const value = this._sampleTrack(track, sampleTime)
        if (value !== null) {
          boneTransform[track.property] = value
        }
      }

      if (Object.keys(boneTransform).length > 0) {
        result.set(boneName, boneTransform)
      }
    }

    return result
  }

  private _sampleTrack(track: AnimationTrack, time: number): THREE.Vector3 | THREE.Quaternion | number | null {
    if (track.keyframes.length === 0) return null
    if (track.keyframes.length === 1) return this._cloneValue(track.keyframes[0].value)

    // 找到时间范围内的关键帧
    let prevKeyframe: Keyframe | null = null
    let nextKeyframe: Keyframe | null = null

    for (let i = 0; i < track.keyframes.length; i++) {
      const keyframe = track.keyframes[i]
      if (keyframe.time <= time) {
        prevKeyframe = keyframe
      }
      if (keyframe.time >= time && !nextKeyframe) {
        nextKeyframe = keyframe
        break
      }
    }

    // 边界情况处理
    if (!prevKeyframe) return this._cloneValue(track.keyframes[0].value)
    if (!nextKeyframe) return this._cloneValue(track.keyframes[track.keyframes.length - 1].value)
    if (prevKeyframe === nextKeyframe) return this._cloneValue(prevKeyframe.value)

    // 插值计算
    const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)
    return this._interpolateValues(prevKeyframe.value, nextKeyframe.value, t, prevKeyframe.interpolation)
  }

  private _interpolateValues(
    from: THREE.Vector3 | THREE.Quaternion | number,
    to: THREE.Vector3 | THREE.Quaternion | number,
    t: number,
    interpolation: 'linear' | 'step' | 'cubic'
  ): THREE.Vector3 | THREE.Quaternion | number {
    if (interpolation === 'step') {
      return this._cloneValue(from)
    }

    if (typeof from === 'number' && typeof to === 'number') {
      return THREE.MathUtils.lerp(from, to, t)
    }

    if (from instanceof THREE.Vector3 && to instanceof THREE.Vector3) {
      return new THREE.Vector3().lerpVectors(from, to, t)
    }

    if (from instanceof THREE.Quaternion && to instanceof THREE.Quaternion) {
      return new THREE.Quaternion().slerpQuaternions(from, to, t)
    }

    return this._cloneValue(from)
  }

  private _cloneValue(value: THREE.Vector3 | THREE.Quaternion | number): THREE.Vector3 | THREE.Quaternion | number {
    if (typeof value === 'number') return value
    if (value instanceof THREE.Vector3) return value.clone()
    if (value instanceof THREE.Quaternion) return value.clone()
    return value
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  private initializeAnimationClipSignals(): void {
    this.addSignal('name_changed')
    this.addSignal('duration_changed')
    this.addSignal('loop_changed')
    this.addSignal('frame_rate_changed')
    this.addSignal('track_added')
    this.addSignal('track_removed')
    this.addSignal('keyframe_added')
    this.addSignal('keyframe_removed')
  }

  // ========================================================================
  // 序列化支持
  // ========================================================================

  toJSON(): any {
    const tracks: any = {}
    for (const [boneName, boneTracks] of this._tracks) {
      tracks[boneName] = boneTracks.map(track => ({
        property: track.property,
        keyframes: track.keyframes.map(kf => ({
          time: kf.time,
          value: this._serializeValue(kf.value),
          interpolation: kf.interpolation,
          inTangent: kf.inTangent ? [kf.inTangent.x, kf.inTangent.y] : undefined,
          outTangent: kf.outTangent ? [kf.outTangent.x, kf.outTangent.y] : undefined
        }))
      }))
    }

    return {
      name: this._name,
      duration: this._duration,
      loop: this._loop,
      frameRate: this._frameRate,
      tracks
    }
  }

  private _serializeValue(value: THREE.Vector3 | THREE.Quaternion | number): any {
    if (typeof value === 'number') return value
    if (value instanceof THREE.Vector3) return [value.x, value.y, value.z]
    if (value instanceof THREE.Quaternion) return [value.x, value.y, value.z, value.w]
    return value
  }
}

export default AnimationClip
