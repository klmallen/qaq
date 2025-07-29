/**
 * QAQ游戏引擎 - Skeleton3D 骨骼系统节点
 *
 * 基于Godot引擎的Skeleton3D设计，提供3D骨骼动画支持
 * 集成Three.js的Skeleton和Bone系统
 */

import Node3D from '../Node3D'
import type { Vector3, PropertyInfo } from '../../../types/core'
import * as THREE from 'three'

/**
 * 骨骼数据接口
 */
export interface BoneData {
  name: string
  index: number
  parentIndex: number
  position: Vector3
  rotation: Vector3
  scale: Vector3
  restPosition: Vector3
  restRotation: Vector3
  restScale: Vector3
  length: number
  children: number[]
}

/**
 * 骨骼姿势接口
 */
export interface BonePose {
  position: Vector3
  rotation: Vector3
  scale: Vector3
}

/**
 * 骨骼附件接口
 */
export interface BoneAttachment {
  nodeId: string
  boneIndex: number
  offset: THREE.Matrix4
}

/**
 * Skeleton3D 类 - 3D骨骼系统节点
 *
 * 主要功能：
 * 1. 管理骨骼层次结构
 * 2. 提供骨骼动画支持
 * 3. 集成Three.js骨骼系统
 * 4. 支持骨骼附件
 */
export class Skeleton3D extends Node3D {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** Three.js骨骼对象 */
  private _skeleton: THREE.Skeleton | null = null

  /** Three.js骨骼数组 */
  private _bones: THREE.Bone[] = []

  /** 骨骼数据映射 */
  private _boneData: Map<string, BoneData> = new Map()

  /** 骨骼名称到索引的映射 */
  private _boneNameToIndex: Map<string, number> = new Map()

  /** 骨骼索引到名称的映射 */
  private _boneIndexToName: Map<number, string> = new Map()

  /** 骨骼附件列表 */
  private _attachments: BoneAttachment[] = []

  /** 是否显示骨骼 */
  private _showBones: boolean = false

  /** 骨骼辅助对象 */
  private _skeletonHelper: THREE.SkeletonHelper | null = null

  /** 根骨骼索引 */
  private _rootBoneIndex: number = -1

  /** 是否需要更新骨骼 */
  private _needsUpdate: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'Skeleton3D') {
    super(name)
    this.initializeSkeletonSignals()
  }

  /**
   * 初始化骨骼系统特有的信号
   */
  private initializeSkeletonSignals(): void {
    this.addUserSignal('skeleton_updated')
    this.addUserSignal('bone_pose_changed', ['bone_index'])
    this.addUserSignal('bone_attached', ['bone_index', 'node'])
    this.addUserSignal('bone_detached', ['bone_index', 'node'])
  }

  /**
   * 节点准备就绪时调用
   */
  _ready(): void {
    super._ready()

    // 如果有骨骼数据，初始化Three.js骨骼
    if (this._boneData.size > 0) {
      this.buildThreeSkeleton()
    }
  }

  // ========================================================================
  // 骨骼管理
  // ========================================================================

  /**
   * 添加骨骼
   * @param name 骨骼名称
   * @param parentName 父骨骼名称（可选）
   * @param restPose 静息姿势
   */
  addBone(name: string, parentName?: string, restPose?: BonePose): number {
    const index = this._bones.length
    const parentIndex = parentName ? this.findBone(parentName) : -1

    const boneData: BoneData = {
      name,
      index,
      parentIndex,
      position: restPose?.position || { x: 0, y: 0, z: 0 },
      rotation: restPose?.rotation || { x: 0, y: 0, z: 0 },
      scale: restPose?.scale || { x: 1, y: 1, z: 1 },
      restPosition: restPose?.position || { x: 0, y: 0, z: 0 },
      restRotation: restPose?.rotation || { x: 0, y: 0, z: 0 },
      restScale: restPose?.scale || { x: 1, y: 1, z: 1 },
      length: 1.0,
      children: []
    }

    // 创建Three.js骨骼
    const bone = new THREE.Bone()
    bone.name = name
    bone.position.set(boneData.position.x, boneData.position.y, boneData.position.z)
    bone.rotation.setFromEuler(new THREE.Euler(
      boneData.rotation.x,
      boneData.rotation.y,
      boneData.rotation.z
    ))
    bone.scale.set(boneData.scale.x, boneData.scale.y, boneData.scale.z)

    // 添加到数据结构
    this._bones.push(bone)
    this._boneData.set(name, boneData)
    this._boneNameToIndex.set(name, index)
    this._boneIndexToName.set(index, name)

    // 设置父子关系
    if (parentIndex !== -1) {
      const parentBone = this._bones[parentIndex]
      const parentData = this._boneData.get(this._boneIndexToName.get(parentIndex)!)!
      parentBone.add(bone)
      parentData.children.push(index)
    } else {
      // 根骨骼
      if (this._rootBoneIndex === -1) {
        this._rootBoneIndex = index
      }
      this.object3D.add(bone)
    }

    this._needsUpdate = true
    return index
  }

  /**
   * 移除骨骼
   * @param boneIndex 骨骼索引
   */
  removeBone(boneIndex: number): boolean {
    if (boneIndex < 0 || boneIndex >= this._bones.length) return false

    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return false

    const boneData = this._boneData.get(boneName)
    if (!boneData) return false

    // 移除子骨骼
    for (const childIndex of boneData.children) {
      this.removeBone(childIndex)
    }

    // 从父骨骼中移除
    if (boneData.parentIndex !== -1) {
      const parentName = this._boneIndexToName.get(boneData.parentIndex)
      if (parentName) {
        const parentData = this._boneData.get(parentName)
        if (parentData) {
          const childIndex = parentData.children.indexOf(boneIndex)
          if (childIndex !== -1) {
            parentData.children.splice(childIndex, 1)
          }
        }
      }
    }

    // 从Three.js场景中移除
    const bone = this._bones[boneIndex]
    if (bone.parent) {
      bone.parent.remove(bone)
    }

    // 清理数据结构
    this._boneData.delete(boneName)
    this._boneNameToIndex.delete(boneName)
    this._boneIndexToName.delete(boneIndex)

    this._needsUpdate = true
    return true
  }

  /**
   * 查找骨骼索引
   * @param boneName 骨骼名称
   */
  findBone(boneName: string): number {
    return this._boneNameToIndex.get(boneName) || -1
  }

  /**
   * 获取骨骼名称
   * @param boneIndex 骨骼索引
   */
  getBoneName(boneIndex: number): string {
    return this._boneIndexToName.get(boneIndex) || ''
  }

  /**
   * 获取骨骼数量
   */
  getBoneCount(): number {
    return this._bones.length
  }

  /**
   * 获取骨骼父索引
   * @param boneIndex 骨骼索引
   */
  getBoneParent(boneIndex: number): number {
    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return -1

    const boneData = this._boneData.get(boneName)
    return boneData ? boneData.parentIndex : -1
  }

  /**
   * 获取骨骼子索引列表
   * @param boneIndex 骨骼索引
   */
  getBoneChildren(boneIndex: number): number[] {
    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return []

    const boneData = this._boneData.get(boneName)
    return boneData ? [...boneData.children] : []
  }

  // ========================================================================
  // 骨骼姿势管理
  // ========================================================================

  /**
   * 设置骨骼姿势
   * @param boneIndex 骨骼索引
   * @param pose 骨骼姿势
   */
  setBonePose(boneIndex: number, pose: Partial<BonePose>): void {
    if (boneIndex < 0 || boneIndex >= this._bones.length) return

    const bone = this._bones[boneIndex]
    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return

    const boneData = this._boneData.get(boneName)
    if (!boneData) return

    // 更新位置
    if (pose.position) {
      bone.position.set(pose.position.x, pose.position.y, pose.position.z)
      boneData.position = { ...pose.position }
    }

    // 更新旋转
    if (pose.rotation) {
      bone.rotation.setFromEuler(new THREE.Euler(
        pose.rotation.x,
        pose.rotation.y,
        pose.rotation.z
      ))
      boneData.rotation = { ...pose.rotation }
    }

    // 更新缩放
    if (pose.scale) {
      bone.scale.set(pose.scale.x, pose.scale.y, pose.scale.z)
      boneData.scale = { ...pose.scale }
    }

    this.emit('bone_pose_changed', boneIndex)
  }

  /**
   * 获取骨骼姿势
   * @param boneIndex 骨骼索引
   */
  getBonePose(boneIndex: number): BonePose | null {
    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return null

    const boneData = this._boneData.get(boneName)
    if (!boneData) return null

    return {
      position: { ...boneData.position },
      rotation: { ...boneData.rotation },
      scale: { ...boneData.scale }
    }
  }

  /**
   * 获取骨骼静息姿势
   * @param boneIndex 骨骼索引
   */
  getBoneRestPose(boneIndex: number): BonePose | null {
    const boneName = this._boneIndexToName.get(boneIndex)
    if (!boneName) return null

    const boneData = this._boneData.get(boneName)
    if (!boneData) return null

    return {
      position: { ...boneData.restPosition },
      rotation: { ...boneData.restRotation },
      scale: { ...boneData.restScale }
    }
  }

  /**
   * 重置骨骼到静息姿势
   * @param boneIndex 骨骼索引，-1表示重置所有骨骼
   */
  resetBonePose(boneIndex: number = -1): void {
    if (boneIndex === -1) {
      // 重置所有骨骼
      for (let i = 0; i < this._bones.length; i++) {
        this.resetBonePose(i)
      }
      return
    }

    const restPose = this.getBoneRestPose(boneIndex)
    if (restPose) {
      this.setBonePose(boneIndex, restPose)
    }
  }

  // ========================================================================
  // 骨骼变换
  // ========================================================================

  /**
   * 获取骨骼全局变换矩阵
   * @param boneIndex 骨骼索引
   */
  getBoneGlobalTransform(boneIndex: number): THREE.Matrix4 | null {
    if (boneIndex < 0 || boneIndex >= this._bones.length) return null

    const bone = this._bones[boneIndex]
    const matrix = new THREE.Matrix4()
    bone.updateMatrixWorld(true)
    matrix.copy(bone.matrixWorld)

    return matrix
  }

  /**
   * 获取骨骼局部变换矩阵
   * @param boneIndex 骨骼索引
   */
  getBoneLocalTransform(boneIndex: number): THREE.Matrix4 | null {
    if (boneIndex < 0 || boneIndex >= this._bones.length) return null

    const bone = this._bones[boneIndex]
    const matrix = new THREE.Matrix4()
    bone.updateMatrix()
    matrix.copy(bone.matrix)

    return matrix
  }

  // ========================================================================
  // Three.js集成
  // ========================================================================

  /**
   * 构建Three.js骨骼系统
   */
  private buildThreeSkeleton(): void {
    if (this._bones.length === 0) return

    // 创建骨骼矩阵数组
    const boneInverses: THREE.Matrix4[] = []

    for (const bone of this._bones) {
      bone.updateMatrixWorld(true)
      const boneInverse = new THREE.Matrix4()
      boneInverse.copy(bone.matrixWorld).invert()
      boneInverses.push(boneInverse)
    }

    // 创建Three.js骨骼对象
    this._skeleton = new THREE.Skeleton(this._bones, boneInverses)

    this._needsUpdate = false
    this.emit('skeleton_updated')
  }

  /**
   * 获取Three.js骨骼对象
   */
  getThreeSkeleton(): THREE.Skeleton | null {
    if (this._needsUpdate) {
      this.buildThreeSkeleton()
    }
    return this._skeleton
  }

  /**
   * 获取Three.js骨骼数组
   */
  getThreeBones(): THREE.Bone[] {
    return [...this._bones]
  }

  // ========================================================================
  // 骨骼附件管理
  // ========================================================================

  /**
   * 附加节点到骨骼
   * @param nodeId 节点ID
   * @param boneIndex 骨骼索引
   * @param offset 偏移矩阵
   */
  attachToBone(nodeId: string, boneIndex: number, offset?: THREE.Matrix4): boolean {
    if (boneIndex < 0 || boneIndex >= this._bones.length) return false

    const attachment: BoneAttachment = {
      nodeId,
      boneIndex,
      offset: offset || new THREE.Matrix4()
    }

    this._attachments.push(attachment)
    this.emit('bone_attached', boneIndex, nodeId)

    return true
  }

  /**
   * 从骨骼分离节点
   * @param nodeId 节点ID
   */
  detachFromBone(nodeId: string): boolean {
    const index = this._attachments.findIndex(att => att.nodeId === nodeId)
    if (index === -1) return false

    const attachment = this._attachments[index]
    this._attachments.splice(index, 1)

    this.emit('bone_detached', attachment.boneIndex, nodeId)
    return true
  }

  /**
   * 获取节点附加的骨骼索引
   * @param nodeId 节点ID
   */
  getAttachedBone(nodeId: string): number {
    const attachment = this._attachments.find(att => att.nodeId === nodeId)
    return attachment ? attachment.boneIndex : -1
  }

  // ========================================================================
  // 调试和可视化
  // ========================================================================

  /**
   * 设置是否显示骨骼
   * @param show 是否显示
   */
  setShowBones(show: boolean): void {
    if (this._showBones === show) return

    this._showBones = show

    if (show && this._skeleton) {
      if (!this._skeletonHelper) {
        // 创建骨骼辅助对象
        const rootBone = this._bones[this._rootBoneIndex] || this._bones[0]
        if (rootBone) {
          this._skeletonHelper = new THREE.SkeletonHelper(rootBone)
          this.object3D.add(this._skeletonHelper)
        }
      } else {
        this._skeletonHelper.visible = true
      }
    } else if (this._skeletonHelper) {
      this._skeletonHelper.visible = false
    }
  }

  /**
   * 获取是否显示骨骼
   */
  getShowBones(): boolean {
    return this._showBones
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 处理帧更新
   */
  _process(delta: number): void {
    super._process(delta)

    // 更新骨骼附件
    this.updateAttachments()
  }

  /**
   * 更新骨骼附件
   */
  private updateAttachments(): void {
    for (const attachment of this._attachments) {
      const bone = this._bones[attachment.boneIndex]
      if (!bone) continue

      // 这里需要根据nodeId找到实际的节点并更新其变换
      // 简化实现，实际需要与场景树系统集成
      const node = this.getNode(attachment.nodeId)
      if (node && (node as any).object3D) {
        const nodeObject = (node as any).object3D

        // 计算最终变换
        bone.updateMatrixWorld(true)
        const finalMatrix = new THREE.Matrix4()
        finalMatrix.multiplyMatrices(bone.matrixWorld, attachment.offset)

        // 应用变换
        nodeObject.matrix.copy(finalMatrix)
        nodeObject.matrixAutoUpdate = false
      }
    }
  }

  /**
   * 销毁节点时清理资源
   */
  destroy(): void {
    // 清理Three.js资源
    if (this._skeletonHelper) {
      this.object3D.remove(this._skeletonHelper)
      this._skeletonHelper = null
    }

    // 清理骨骼
    for (const bone of this._bones) {
      if (bone.parent) {
        bone.parent.remove(bone)
      }
    }

    this._bones = []
    this._boneData.clear()
    this._boneNameToIndex.clear()
    this._boneIndexToName.clear()
    this._attachments = []
    this._skeleton = null

    super.destroy()
  }
}

export default Skeleton3D
