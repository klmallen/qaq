/**
 * QAQ游戏引擎 - BoneAttachment3D 骨骼附件节点
 *
 * 基于Godot引擎的BoneAttachment3D设计，用于将节点附加到骨骼上
 * 自动跟随指定骨骼的变换
 */

import Node3D from '../Node3D'
import Skeleton3D from './Skeleton3D'
import type { Vector3, PropertyInfo } from '../../../types/core'
import * as THREE from 'three'

/**
 * BoneAttachment3D 类 - 骨骼附件节点
 *
 * 主要功能：
 * 1. 附加到指定骨骼
 * 2. 自动跟随骨骼变换
 * 3. 支持偏移变换
 * 4. 提供骨骼查找功能
 */
export class BoneAttachment3D extends Node3D {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 目标骨骼名称 */
  private _boneName: string = ''

  /** 目标骨骼索引 */
  private _boneIndex: number = -1

  /** 关联的骨骼系统 */
  private _skeleton: Skeleton3D | null = null

  /** 骨骼系统路径 */
  private _skeletonPath: string = '..'

  /** 是否使用外部骨骼系统 */
  private _useExternalSkeleton: boolean = false

  /** 外部骨骼系统路径 */
  private _externalSkeletonPath: string = ''

  /** 偏移变换矩阵 */
  private _offsetTransform: THREE.Matrix4 = new THREE.Matrix4()

  /** 是否覆盖姿势 */
  private _overridePose: boolean = false

  /** 覆盖的位置 */
  private _overridePosition: Vector3 = { x: 0, y: 0, z: 0 }

  /** 覆盖的旋转 */
  private _overrideRotation: Vector3 = { x: 0, y: 0, z: 0 }

  /** 覆盖的缩放 */
  private _overrideScale: Vector3 = { x: 1, y: 1, z: 1 }

  /** 是否已附加到骨骼 */
  private _isAttached: boolean = false

  /** 上一帧的骨骼变换矩阵 */
  private _lastBoneMatrix: THREE.Matrix4 = new THREE.Matrix4()

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'BoneAttachment3D') {
    super(name)
    this.initializeBoneAttachmentSignals()
  }

  /**
   * 初始化骨骼附件特有的信号
   */
  private initializeBoneAttachmentSignals(): void {
    this.addUserSignal('bone_attached', ['bone_name', 'bone_index'])
    this.addUserSignal('bone_detached', ['bone_name', 'bone_index'])
    this.addUserSignal('skeleton_changed', ['old_skeleton', 'new_skeleton'])
  }

  /**
   * 节点准备就绪时调用
   */
  _ready(): void {
    super._ready()

    // 查找骨骼系统
    this.findSkeleton()

    // 尝试附加到骨骼
    if (this._skeleton && this._boneName) {
      this.attachToBone()
    }
  }

  /**
   * 查找骨骼系统
   */
  private findSkeleton(): void {
    let skeletonNode: Node | null = null

    if (this._useExternalSkeleton && this._externalSkeletonPath) {
      // 使用外部骨骼系统
      skeletonNode = this.getNode(this._externalSkeletonPath)
    } else {
      // 在父节点中查找骨骼系统
      skeletonNode = this.getNode(this._skeletonPath)

      // 如果没找到，尝试在父节点的子节点中查找
      if (!skeletonNode) {
        const parent = this.getParent()
        if (parent) {
          for (const child of parent.getChildren()) {
            if (child instanceof Skeleton3D) {
              skeletonNode = child
              break
            }
          }
        }
      }
    }

    if (skeletonNode instanceof Skeleton3D) {
      this.setSkeleton(skeletonNode)
    }
  }

  // ========================================================================
  // 骨骼系统管理
  // ========================================================================

  /**
   * 设置骨骼系统
   * @param skeleton 骨骼系统节点
   */
  setSkeleton(skeleton: Skeleton3D | null): void {
    if (this._skeleton === skeleton) return

    const oldSkeleton = this._skeleton

    // 从旧骨骼系统分离
    if (this._skeleton && this._isAttached) {
      this.detachFromBone()
    }

    this._skeleton = skeleton

    // 附加到新骨骼系统
    if (this._skeleton && this._boneName) {
      this.attachToBone()
    }

    this.emit('skeleton_changed', oldSkeleton, skeleton)
  }

  /**
   * 获取骨骼系统
   */
  getSkeleton(): Skeleton3D | null {
    return this._skeleton
  }

  /**
   * 设置骨骼系统路径
   * @param path 节点路径
   */
  setSkeletonPath(path: string): void {
    this._skeletonPath = path
    this._useExternalSkeleton = false
    this.findSkeleton()
  }

  /**
   * 获取骨骼系统路径
   */
  getSkeletonPath(): string {
    return this._skeletonPath
  }

  /**
   * 设置外部骨骼系统路径
   * @param path 外部骨骼系统路径
   */
  setExternalSkeletonPath(path: string): void {
    this._externalSkeletonPath = path
    this._useExternalSkeleton = true
    this.findSkeleton()
  }

  /**
   * 获取外部骨骼系统路径
   */
  getExternalSkeletonPath(): string {
    return this._externalSkeletonPath
  }

  // ========================================================================
  // 骨骼附件管理
  // ========================================================================

  /**
   * 设置骨骼名称
   * @param boneName 骨骼名称
   */
  setBoneName(boneName: string): void {
    if (this._boneName === boneName) return

    // 从当前骨骼分离
    if (this._isAttached) {
      this.detachFromBone()
    }

    this._boneName = boneName

    // 附加到新骨骼
    if (this._skeleton && boneName) {
      this.attachToBone()
    }
  }

  /**
   * 获取骨骼名称
   */
  getBoneName(): string {
    return this._boneName
  }

  /**
   * 设置骨骼索引
   * @param boneIndex 骨骼索引
   */
  setBoneIndex(boneIndex: number): void {
    if (!this._skeleton) return

    const boneName = this._skeleton.getBoneName(boneIndex)
    if (boneName) {
      this.setBoneName(boneName)
    }
  }

  /**
   * 获取骨骼索引
   */
  getBoneIndex(): number {
    return this._boneIndex
  }

  /**
   * 附加到骨骼
   */
  private attachToBone(): void {
    if (!this._skeleton || !this._boneName || this._isAttached) return

    this._boneIndex = this._skeleton.findBone(this._boneName)
    if (this._boneIndex === -1) {
      console.warn(`BoneAttachment3D: Bone "${this._boneName}" not found in skeleton`)
      return
    }

    // 注册到骨骼系统
    this._skeleton.attachToBone(this.name, this._boneIndex, this._offsetTransform)
    this._isAttached = true

    this.emit('bone_attached', this._boneName, this._boneIndex)
  }

  /**
   * 从骨骼分离
   */
  private detachFromBone(): void {
    if (!this._skeleton || !this._isAttached) return

    this._skeleton.detachFromBone(this.name)
    this._isAttached = false

    this.emit('bone_detached', this._boneName, this._boneIndex)
  }

  /**
   * 检查是否已附加到骨骼
   */
  isAttached(): boolean {
    return this._isAttached
  }

  // ========================================================================
  // 变换管理
  // ========================================================================

  /**
   * 设置偏移变换
   * @param transform 偏移变换矩阵
   */
  setOffsetTransform(transform: THREE.Matrix4): void {
    this._offsetTransform.copy(transform)
  }

  /**
   * 获取偏移变换
   */
  getOffsetTransform(): THREE.Matrix4 {
    return this._offsetTransform.clone()
  }

  /**
   * 设置偏移位置
   * @param position 偏移位置
   */
  setOffsetPosition(position: Vector3): void {
    const pos = new THREE.Vector3(position.x, position.y, position.z)
    const rot = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    this._offsetTransform.decompose(pos, rot, scale)
    this._offsetTransform.compose(new THREE.Vector3(position.x, position.y, position.z), rot, scale)
  }

  /**
   * 设置偏移旋转
   * @param rotation 偏移旋转（欧拉角）
   */
  setOffsetRotation(rotation: Vector3): void {
    const pos = new THREE.Vector3()
    const rot = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    this._offsetTransform.decompose(pos, rot, scale)

    const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z)
    const newRot = new THREE.Quaternion().setFromEuler(euler)

    this._offsetTransform.compose(pos, newRot, scale)
  }

  /**
   * 设置偏移缩放
   * @param scale 偏移缩放
   */
  setOffsetScale(scale: Vector3): void {
    const pos = new THREE.Vector3()
    const rot = new THREE.Quaternion()
    const oldScale = new THREE.Vector3()

    this._offsetTransform.decompose(pos, rot, oldScale)
    this._offsetTransform.compose(pos, rot, new THREE.Vector3(scale.x, scale.y, scale.z))
  }

  // ========================================================================
  // 姿势覆盖
  // ========================================================================

  /**
   * 设置是否覆盖姿势
   * @param override 是否覆盖
   */
  setOverridePose(override: boolean): void {
    this._overridePose = override
  }

  /**
   * 获取是否覆盖姿势
   */
  getOverridePose(): boolean {
    return this._overridePose
  }

  /**
   * 设置覆盖位置
   * @param position 位置
   */
  setOverridePosition(position: Vector3): void {
    this._overridePosition = { ...position }
  }

  /**
   * 获取覆盖位置
   */
  getOverridePosition(): Vector3 {
    return { ...this._overridePosition }
  }

  /**
   * 设置覆盖旋转
   * @param rotation 旋转（欧拉角）
   */
  setOverrideRotation(rotation: Vector3): void {
    this._overrideRotation = { ...rotation }
  }

  /**
   * 获取覆盖旋转
   */
  getOverrideRotation(): Vector3 {
    return { ...this._overrideRotation }
  }

  /**
   * 设置覆盖缩放
   * @param scale 缩放
   */
  setOverrideScale(scale: Vector3): void {
    this._overrideScale = { ...scale }
  }

  /**
   * 获取覆盖缩放
   */
  getOverrideScale(): Vector3 {
    return { ...this._overrideScale }
  }

  // ========================================================================
  // 骨骼查找辅助方法
  // ========================================================================

  /**
   * 获取所有可用的骨骼名称
   */
  getAvailableBones(): string[] {
    if (!this._skeleton) return []

    const bones: string[] = []
    const boneCount = this._skeleton.getBoneCount()

    for (let i = 0; i < boneCount; i++) {
      const boneName = this._skeleton.getBoneName(i)
      if (boneName) {
        bones.push(boneName)
      }
    }

    return bones
  }

  /**
   * 查找包含指定字符串的骨骼
   * @param searchString 搜索字符串
   */
  findBonesContaining(searchString: string): string[] {
    const allBones = this.getAvailableBones()
    return allBones.filter(boneName =>
      boneName.toLowerCase().includes(searchString.toLowerCase())
    )
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 处理帧更新
   */
  _process(delta: number): void {
    super._process(delta)

    // 更新骨骼跟随
    this.updateBoneFollow()
  }

  /**
   * 更新骨骼跟随
   */
  private updateBoneFollow(): void {
    if (!this._isAttached || !this._skeleton || this._boneIndex === -1) return

    // 获取骨骼的全局变换
    const boneTransform = this._skeleton.getBoneGlobalTransform(this._boneIndex)
    if (!boneTransform) return

    // 检查骨骼变换是否发生变化
    if (boneTransform.equals(this._lastBoneMatrix)) return

    this._lastBoneMatrix.copy(boneTransform)

    if (this._overridePose) {
      // 使用覆盖姿势
      this.applyOverridePose()
    } else {
      // 跟随骨骼变换
      this.applyBoneTransform(boneTransform)
    }
  }

  /**
   * 应用骨骼变换
   * @param boneTransform 骨骼变换矩阵
   */
  private applyBoneTransform(boneTransform: THREE.Matrix4): void {
    // 计算最终变换：骨骼变换 * 偏移变换
    const finalTransform = new THREE.Matrix4()
    finalTransform.multiplyMatrices(boneTransform, this._offsetTransform)

    // 应用到节点的Three.js对象
    this.object3D.matrix.copy(finalTransform)
    this.object3D.matrixAutoUpdate = false

    // 分解变换并更新节点属性
    const position = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    finalTransform.decompose(position, rotation, scale)

    this.position = { x: position.x, y: position.y, z: position.z }

    const euler = new THREE.Euler().setFromQuaternion(rotation)
    this.rotation = { x: euler.x, y: euler.y, z: euler.z }

    this.scale = { x: scale.x, y: scale.y, z: scale.z }
  }

  /**
   * 应用覆盖姿势
   */
  private applyOverridePose(): void {
    this.position = { ...this._overridePosition }
    this.rotation = { ...this._overrideRotation }
    this.scale = { ...this._overrideScale }

    // 重新启用自动矩阵更新
    this.object3D.matrixAutoUpdate = true
  }

  // ========================================================================
  // 属性访问器
  // ========================================================================

  /**
   * 获取属性信息（用于编辑器）
   */
  static getPropertyList(): PropertyInfo[] {
    return [
      ...super.getPropertyList(),
      {
        name: 'bone_name',
        type: 'string',
        usage: 'default'
      },
      {
        name: 'skeleton_path',
        type: 'node_path',
        usage: 'default'
      },
      {
        name: 'use_external_skeleton',
        type: 'boolean',
        usage: 'default'
      },
      {
        name: 'external_skeleton_path',
        type: 'node_path',
        usage: 'default'
      },
      {
        name: 'override_pose',
        type: 'boolean',
        usage: 'default'
      }
    ]
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 销毁节点时清理资源
   */
  destroy(): void {
    // 从骨骼分离
    if (this._isAttached) {
      this.detachFromBone()
    }

    this._skeleton = null

    super.destroy()
  }
}

export default BoneAttachment3D
