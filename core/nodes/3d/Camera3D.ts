/**
 * QAQ游戏引擎 - Camera3D 3D相机节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 3D场景的相机节点，继承自Camera基类
 * - 基于新架构：深度集成Three.js PerspectiveCamera
 * - 提供3D场景的视图控制和坐标转换
 * - 支持透视投影和正交投影
 * - 提供视锥剔除和LOD支持
 * - 与Engine的3D渲染管道完全集成
 * - 支持相机跟随系统和控制器架构
 *
 * 继承关系:
 * Node -> Camera -> Camera3D
 *
 * 新架构特性:
 * - 使用Three.js PerspectiveCamera作为渲染对象
 * - 自动同步相机参数到Three.js
 * - 支持Engine相机管理系统
 * - 完整的3D坐标转换功能
 * - 集成Three.js的OrbitControls
 */

import Camera, { CameraType, CameraState } from '../base/Camera'
import Node3D from '../Node3D'
import Engine from '../../engine/Engine'
import * as THREE from 'three'
import type { Vector2, Vector3, PropertyInfo } from '../../../types/core'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ============================================================================
// Camera3D相关枚举和接口
// ============================================================================

/**
 * 3D相机投影模式枚举
 */
export enum ProjectionMode {
  /** 透视投影 */
  PERSPECTIVE = 0,
  /** 正交投影 */
  ORTHOGONAL = 1
}

/**
 * 3D相机保持模式枚举
 * 定义相机在窗口尺寸变化时如何保持视野
 */
export enum KeepAspect {
  /** 保持宽度 */
  WIDTH = 0,
  /** 保持高度 */
  HEIGHT = 1
}

/**
 * 多普勒效果接口
 * 定义3D音频的多普勒效果参数
 */
export interface DopplerTracking {
  /** 是否启用多普勒效果 */
  enabled: boolean
  /** 多普勒因子 */
  factor: number
}

/**
 * 视锥剔除信息接口
 */
export interface FrustumCullingInfo {
  /** 是否启用视锥剔除 */
  enabled: boolean
  /** 剔除的对象数量 */
  culledObjects: number
  /** 可见的对象数量 */
  visibleObjects: number
}

/**
 * 相机跟随配置接口
 */
export interface FollowConfig {
  /** 跟随速度（0-1之间，1为立即跟随） */
  followSpeed: number
  /** 相对于目标的位置偏移 */
  followOffset: Vector3
  /** 是否始终看向目标 */
  lookAtTarget: boolean
  /** 是否使用平滑插值 */
  smoothing: boolean
}

// ============================================================================
// Camera3D 类实现
// ============================================================================

/**
 * Camera3D 类 - 3D相机节点
 *
 * 主要功能:
 * 1. 3D场景视图控制
 * 2. 透视/正交投影切换
 * 3. 坐标转换 (屏幕坐标 ↔ 世界坐标)
 * 4. 视锥剔除优化
 * 5. 与Engine相机系统集成
 */
export class Camera3D extends Camera {
  // ========================================================================
  // 私有属性 - 3D相机参数
  // ========================================================================

  /** 投影模式 */
  private _projectionMode: ProjectionMode = ProjectionMode.PERSPECTIVE

  /** 视野角度 (透视投影) */
  private _fov: number = 75

  /** 正交投影尺寸 */
  private _size: number = 1

  /** 近裁剪面 */
  private _near: number = 0.1

  /** 远裁剪面 */
  private _far: number = 1000

  /** 保持宽高比模式 */
  private _keepAspect: KeepAspect = KeepAspect.WIDTH

  /** 是否启用视锥剔除 */
  private _frustumCulling: boolean = true

  /** 多普勒跟踪设置 */
  private _dopplerTracking: DopplerTracking = {
    enabled: false,
    factor: 1.0
  }

    // ========================================================================
  // 相机跟随系统方法
  // ========================================================================

  /**
   * 设置跟随目标
   * @param target 跟随目标节点
   */
  setTarget(target: Node3D): void {
    this._followTarget = target
    console.log(`🎯 相机跟随目标已设置为: ${target.name}`)
  }

  /**
   * 获取跟随目标
   */
  getTarget(): Node3D | null {
    return this._followTarget
  }

  /**
   * 设置跟随配置
   * @param config 跟随配置
   */
  setFollowConfig(config: Partial<FollowConfig>): void {
    this._followConfig = { ...this._followConfig, ...config }
    console.log('⚙️ 相机跟随配置已更新')
  }

  /**
   * 获取跟随配置
   */
  getFollowConfig(): FollowConfig {
    return { ...this._followConfig }
  }

  /**
   * 跟随目标更新位置
   */
  private followTarget(): void {
    if (!this._followTarget || !this._activeThreeCamera) return

    // 获取目标世界位置
    const targetPosition = this._followTarget.globalPosition

    // 计算偏移后的位置
    const offsetPosition = {
      x: targetPosition.x + this._followConfig.followOffset.x,
      y: targetPosition.y + this._followConfig.followOffset.y,
      z: targetPosition.z + this._followConfig.followOffset.z
    }

    if (this._followConfig.smoothing) {
      // 使用平滑插值
      const currentPosition = this._activeThreeCamera.position
      const speed = this._followConfig.followSpeed

      this._activeThreeCamera.position.lerp(
        new THREE.Vector3(offsetPosition.x, offsetPosition.y, offsetPosition.z),
        speed
      )
    } else {
      // 直接设置位置
      this._activeThreeCamera.position.set(
        offsetPosition.x,
        offsetPosition.y,
        offsetPosition.z
      )
    }

    // 是否始终看向目标
    if (this._followConfig.lookAtTarget) {
      this.lookAt(targetPosition)
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /** 跟随目标 */
  private _followTarget: Node3D | null = null

  /** 跟随配置 */
  private _followConfig: FollowConfig = {
    followSpeed: 1.0,
    followOffset: { x: 0, y: 0, z: 0 },
    lookAtTarget: true,
    smoothing: true
  }

  /** Three.js轨道控制器 */
  private _orbitControls: OrbitControls | null = null

  // ========================================================================
  // 私有属性 - Three.js集成
  // ========================================================================

  /** Three.js透视相机 */
  private _perspectiveCamera: THREE.PerspectiveCamera | null = null

  /** Three.js正交相机 */
  private _orthographicCamera: THREE.OrthographicCamera | null = null

  /** 当前使用的Three.js相机 */
  private _activeThreeCamera: THREE.Camera | null = null

  /** 视锥体 - 用于剔除计算 */
  private _frustum: THREE.Frustum = new THREE.Frustum()

  /** 相机参数是否需要更新 */
  private _cameraParamsDirty: boolean = true

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称，默认为'Camera3D'
   */
  constructor(name: string = 'Camera3D') {
    super(name, CameraType.CAMERA_3D)

    // 设置渲染层为3D
    this.renderLayer = '3D'

    // 初始化Three.js相机
    this.initializeThreeCameras()

    // 初始化Camera3D特有的信号
    this.initializeCamera3DSignals()

    // 初始化Camera3D特有的属性
    this.initializeCamera3DProperties()

    // 监听视口变化
    this.connect('viewport_changed', () => {
      this._cameraParamsDirty = true
      this.updateCameraParams()
    })
  }

  /**
   * 重写createObject3D方法以创建Three.js相机对象
   * @returns Three.js相机对象
   */
  protected createObject3D(): THREE.Object3D {
    // 返回当前活动的相机对象
    return this._activeThreeCamera || this._perspectiveCamera || new THREE.PerspectiveCamera()
  }

  /**
   * 初始化Three.js相机对象
   */
  private initializeThreeCameras(): void {
    const viewport = this.viewportInfo
    const aspect = viewport.width / viewport.height

    // 创建透视相机
    this._perspectiveCamera = new THREE.PerspectiveCamera(
      this._fov,
      aspect,
      this._near,
      this._far
    )
    this._perspectiveCamera.name = this.name + '_PerspectiveCamera'

    // 创建正交相机
    const frustumSize = this._size
    this._orthographicCamera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      this._near,
      this._far
    )
    this._orthographicCamera.name = this.name + '_OrthographicCamera'

    // 设置默认活动相机
    this._activeThreeCamera = this._perspectiveCamera

    // 更新父类的_object3D引用
    this._object3D = this._activeThreeCamera
    this._object3D.userData.qaqNode = this
  }

  /**
   * 初始化Camera3D特有的信号
   */
  private initializeCamera3DSignals(): void {
    // 投影模式变化信号
    this.addSignal('projection_changed')

    // 视野参数变化信号
    this.addSignal('fov_changed')
    this.addSignal('size_changed')
    this.addSignal('near_changed')
    this.addSignal('far_changed')

    // 视锥剔除信号
    this.addSignal('frustum_culling_changed')
  }

  /**
   * 初始化Camera3D特有的属性
   */
  private initializeCamera3DProperties(): void {
    const properties: PropertyInfo[] = [
      // 投影参数
      {
        name: 'projection_mode',
        type: 'enum',
        hint: '投影模式',
        className: 'ProjectionMode'
      },
      {
        name: 'fov',
        type: 'float',
        hint: '视野角度 (透视投影)'
      },
      {
        name: 'size',
        type: 'float',
        hint: '正交投影尺寸'
      },
      {
        name: 'near',
        type: 'float',
        hint: '近裁剪面距离'
      },
      {
        name: 'far',
        type: 'float',
        hint: '远裁剪面距离'
      },
      {
        name: 'keep_aspect',
        type: 'enum',
        hint: '保持宽高比模式',
        className: 'KeepAspect'
      },

      // 渲染优化
      {
        name: 'frustum_culling',
        type: 'bool',
        hint: '是否启用视锥剔除'
      },

      // 音频相关
      {
        name: 'doppler_tracking_enabled',
        type: 'bool',
        hint: '是否启用多普勒跟踪'
      },
      {
        name: 'doppler_tracking_factor',
        type: 'float',
        hint: '多普勒跟踪因子'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取投影模式
   * @returns 投影模式
   */
  get projectionMode(): ProjectionMode {
    return this._projectionMode
  }

  /**
   * 设置投影模式
   * @param value 投影模式
   */
  set projectionMode(value: ProjectionMode) {
    if (this._projectionMode !== value) {
      this._projectionMode = value
      this.switchProjectionMode()
      this.emit('projection_changed', value)
    }
  }

  /**
   * 获取视野角度
   * @returns 视野角度（度）
   */
  get fov(): number {
    return this._fov
  }

  /**
   * 设置视野角度
   * @param value 视野角度（度）
   */
  set fov(value: number) {
    if (this._fov !== value) {
      this._fov = Math.max(1, Math.min(179, value))
      this._cameraParamsDirty = true
      this.updateCameraParams()
      this.emit('fov_changed', this._fov)
    }
  }

  /**
   * 获取正交投影尺寸
   * @returns 正交投影尺寸
   */
  get size(): number {
    return this._size
  }

  /**
   * 设置正交投影尺寸
   * @param value 正交投影尺寸
   */
  set size(value: number) {
    if (this._size !== value) {
      this._size = Math.max(0.01, value)
      this._cameraParamsDirty = true
      this.updateCameraParams()
      this.emit('size_changed', this._size)
    }
  }

  /**
   * 获取近裁剪面距离
   * @returns 近裁剪面距离
   */
  get near(): number {
    return this._near
  }

  /**
   * 设置近裁剪面距离
   * @param value 近裁剪面距离
   */
  set near(value: number) {
    if (this._near !== value) {
      this._near = Math.max(0.001, value)
      this._cameraParamsDirty = true
      this.updateCameraParams()
      this.emit('near_changed', this._near)
    }
  }

  /**
   * 获取远裁剪面距离
   * @returns 远裁剪面距离
   */
  get far(): number {
    return this._far
  }

  /**
   * 设置远裁剪面距离
   * @param value 远裁剪面距离
   */
  set far(value: number) {
    if (this._far !== value) {
      this._far = Math.max(this._near + 0.001, value)
      this._cameraParamsDirty = true
      this.updateCameraParams()
      this.emit('far_changed', this._far)
    }
  }

  /**
   * 获取是否启用视锥剔除
   * @returns 是否启用视锥剔除
   */
  get frustumCulling(): boolean {
    return this._frustumCulling
  }

  /**
   * 设置是否启用视锥剔除
   * @param value 是否启用视锥剔除
   */
  set frustumCulling(value: boolean) {
    if (this._frustumCulling !== value) {
      this._frustumCulling = value
      this.emit('frustum_culling_changed', value)
    }
  }

  /**
   * 获取当前活动的Three.js相机
   * @returns Three.js相机对象
   */
  get threeCamera(): THREE.Camera {
    return this._activeThreeCamera!
  }

  /**
   * 获取Three.js透视相机
   * @returns Three.js透视相机
   */
  get perspectiveCamera(): THREE.PerspectiveCamera {
    return this._perspectiveCamera!
  }

  /**
   * 获取Three.js正交相机
   * @returns Three.js正交相机
   */
  get orthographicCamera(): THREE.OrthographicCamera {
    return this._orthographicCamera!
  }

  // ========================================================================
  // 核心方法实现 - 投影模式切换
  // ========================================================================

  /**
   * 设置透视投影参数
   * @param fov 视野角度（度）
   * @param near 近裁剪面距离
   * @param far 远裁剪面距离
   */
  setPerspective(fov: number, near: number, far: number): void {
    this._projectionMode = ProjectionMode.PERSPECTIVE
    this._fov = fov
    this._near = near
    this._far = far

    this.switchProjectionMode()
    this.updateCameraParams()

    // 发射参数变化信号
    this.emit('projection_changed', this._projectionMode)
    this.emit('fov_changed', this._fov)
    this.emit('near_changed', this._near)
    this.emit('far_changed', this._far)

    console.log(`📷 Camera3D透视投影设置: FOV=${fov}°, Near=${near}, Far=${far}`)

    // 调试输出
    if (this.debug) {
      console.log(`${this.name} 透视投影参数更新:`, { fov, near, far })
    }
  }

  /**
   * 设置正交投影参数
   * @param size 正交投影尺寸
   * @param near 近裁剪面距离
   * @param far 远裁剪面距离
   */
  setOrthogonal(size: number, near: number, far: number): void {
    this._projectionMode = ProjectionMode.ORTHOGONAL
    this._size = size
    this._near = near
    this._far = far

    this.switchProjectionMode()
    this.updateCameraParams()

    // 发射参数变化信号
    this.emit('projection_changed', this._projectionMode)
    this.emit('size_changed', this._size)
    this.emit('near_changed', this._near)
    this.emit('far_changed', this._far)

    console.log(`📷 Camera3D正交投影设置: Size=${size}, Near=${near}, Far=${far}`)

    // 调试输出
    if (this.debug) {
      console.log(`${this.name} 正交投影参数更新:`, { size, near, far })
    }
  }

  /**
   * 切换投影模式
   */
  private switchProjectionMode(): void {
    const oldCamera = this._activeThreeCamera

    // 切换到对应的相机
    if (this._projectionMode === ProjectionMode.PERSPECTIVE) {
      this._activeThreeCamera = this._perspectiveCamera
    } else {
      this._activeThreeCamera = this._orthographicCamera
    }

    // 同步位置和旋转
    if (oldCamera && this._activeThreeCamera) {
      this._activeThreeCamera.position.copy(oldCamera.position)
      this._activeThreeCamera.rotation.copy(oldCamera.rotation)
      this._activeThreeCamera.quaternion.copy(oldCamera.quaternion)
    }

    // 更新父类的_object3D引用
    this._object3D = this._activeThreeCamera!
    this._object3D.userData.qaqNode = this

    // 如果是当前活动相机，通知Engine切换
    if (this.current) {
      const engine = Engine.getInstance()
      // 这里需要Engine提供切换相机的方法
      // engine.setActiveCamera(this._activeThreeCamera)
    }

    // 更新相机参数
    this._cameraParamsDirty = true
    this.updateCameraParams()
  }

  // ========================================================================
  // 核心方法实现 - 坐标转换
  // ========================================================================

  /**
   * 屏幕坐标转世界坐标
   * @param screenPoint 屏幕坐标点
   * @returns 世界坐标点
   */
  screenToWorld(screenPoint: Vector2): Vector3 {
    if (!this._activeThreeCamera) {
      return { x: 0, y: 0, z: 0 }
    }

    const viewport = this.viewportInfo

    // 将屏幕坐标转换为标准化设备坐标 (-1 到 1)
    const ndc = new THREE.Vector2(
      (screenPoint.x / viewport.width) * 2 - 1,
      -(screenPoint.y / viewport.height) * 2 + 1
    )

    // 创建射线
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(ndc, this._activeThreeCamera)

    // 返回射线方向上距离相机1单位的点
    const worldPoint = raycaster.ray.origin.clone().add(
      raycaster.ray.direction.clone().multiplyScalar(1)
    )

    return {
      x: worldPoint.x,
      y: worldPoint.y,
      z: worldPoint.z
    }
  }

  /**
   * 世界坐标转屏幕坐标
   * @param worldPoint 世界坐标点
   * @returns 屏幕坐标点
   */
  worldToScreen(worldPoint: Vector2 | Vector3): Vector2 {
    if (!this._activeThreeCamera) {
      return { x: 0, y: 0 }
    }

    const viewport = this.viewportInfo
    const vector = new THREE.Vector3(worldPoint.x, worldPoint.y, 'z' in worldPoint ? worldPoint.z : 0)

    // 将世界坐标投影到屏幕坐标
    vector.project(this._activeThreeCamera)

    // 转换为屏幕像素坐标
    const screenX = (vector.x + 1) * viewport.width / 2
    const screenY = (-vector.y + 1) * viewport.height / 2

    return { x: screenX, y: screenY }
  }

  /**
   * 获取相机变换矩阵
   * @returns 相机变换矩阵
   */
  getCameraTransform(): THREE.Matrix4 {
    if (!this._activeThreeCamera) {
      return new THREE.Matrix4()
    }

    this._activeThreeCamera.updateMatrixWorld(true)
    return this._activeThreeCamera.matrixWorld.clone()
  }

  /**
   * 更新相机参数
   */
  protected updateCameraParams(): void {
    if (!this._cameraParamsDirty) return

    const engine = this.getEngine()
    const renderer = engine?.getRenderer()

    if (!renderer) {
      // 如果无法获取渲染器，则使用默认视口信息
      const viewport = this.viewportInfo
      const aspect = viewport.width / viewport.height
      this._updateProjection(aspect)
      return
    }

    const size = renderer.getSize(new THREE.Vector2())
    const aspect = size.width / size.height

    this._updateProjection(aspect)

    // 更新视锥体
    this.updateFrustum()

    this._cameraParamsDirty = false
    this.emit('render_params_changed')
  }

  private _updateProjection(aspect: number): void {
    // 更新透视相机参数
    if (this._perspectiveCamera) {
      this._perspectiveCamera.fov = this._fov
      this._perspectiveCamera.aspect = aspect
      this._perspectiveCamera.near = this._near
      this._perspectiveCamera.far = this._far
      this._perspectiveCamera.updateProjectionMatrix()
    }

    // 更新正交相机参数
    if (this._orthographicCamera) {
      const frustumSize = this._size

      if (this._keepAspect === KeepAspect.WIDTH) {
        this._orthographicCamera.left = -frustumSize / 2
        this._orthographicCamera.right = frustumSize / 2
        this._orthographicCamera.top = frustumSize / (2 * aspect)
        this._orthographicCamera.bottom = -frustumSize / (2 * aspect)
      } else {
        this._orthographicCamera.left = -frustumSize * aspect / 2
        this._orthographicCamera.right = frustumSize * aspect / 2
        this._orthographicCamera.top = frustumSize / 2
        this._orthographicCamera.bottom = -frustumSize / 2
      }

      this._orthographicCamera.near = this._near
      this._orthographicCamera.far = this._far
      this._orthographicCamera.updateProjectionMatrix()
    }
  }

  /**
   * 更新视锥体
   */
  private updateFrustum(): void {
    if (!this._activeThreeCamera) return

    const matrix = new THREE.Matrix4()
    matrix.multiplyMatrices(
      this._activeThreeCamera.projectionMatrix,
      this._activeThreeCamera.matrixWorldInverse
    )
    this._frustum.setFromProjectionMatrix(matrix)
  }

  // ========================================================================
  // 视锥剔除方法
  // ========================================================================

  /**
   * 检查点是否在视锥体内
   * @param point 世界坐标点
   * @returns 是否在视锥体内
   */
  isPointInFrustum(point: Vector3): boolean {
    if (!this._frustumCulling) return true

    const threePoint = new THREE.Vector3(point.x, point.y, point.z)
    return this._frustum.containsPoint(threePoint)
  }

  /**
   * 检查球体是否与视锥体相交
   * @param center 球心世界坐标
   * @param radius 球体半径
   * @returns 是否与视锥体相交
   */
  isSphereInFrustum(center: Vector3, radius: number): boolean {
    if (!this._frustumCulling) return true

    const sphere = new THREE.Sphere(
      new THREE.Vector3(center.x, center.y, center.z),
      radius
    )
    return this._frustum.intersectsSphere(sphere)
  }

  /**
   * 检查包围盒是否与视锥体相交
   * @param min 包围盒最小点
   * @param max 包围盒最大点
   * @returns 是否与视锥体相交
   */
  isBoxInFrustum(min: Vector3, max: Vector3): boolean {
    if (!this._frustumCulling) return true

    const box = new THREE.Box3(
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z)
    )
    return this._frustum.intersectsBox(box)
  }

  // ========================================================================
  // 生命周期方法重写
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  public _enterTree(): void {
    super._enterTree()

    // 自动设置为当前相机（如果没有其他当前相机）
    const engine = Engine.getInstance()
    const currentCamera = Camera.getCurrentCamera(this._cameraType)
      console.log(`📷 Camera3D ${this.name} 自动设置为当前相机`)
      this.makeCurrent()
	  console.log(engine,'engine')
	  console.log(this,'engine')
  }

  /**
   * 相机激活时调用
   */
  protected onActivated(): void {
    super.onActivated()

    // 将Three.js相机设置为Engine的活动相机
    const engine = Engine.getInstance()

    // 确保引擎使用此相机
    if (this._cameraType === CameraType.CAMERA_3D) {
      if (engine.getCamera3D() !== this._activeThreeCamera) {
        // 设置引擎的3D相机
        try {
          // 直接设置引擎的activeCamera
          if (engine.getActiveCamera() !== this._activeThreeCamera) {
            console.log(`📷 同步Camera3D ${this.name} 到引擎`)
            // 使用反射设置私有属性
            const engineAny = engine as any
            if (engineAny._activeCamera !== this._activeThreeCamera) {
              engineAny._activeCamera = this._activeThreeCamera
              console.log('✅ 相机已同步到引擎')
            }
          }
        } catch (error) {
          console.error('❌ 设置引擎相机失败:', error)
        }
      }
    }

    // 更新相机参数
    this.updateCameraParams()
  }

  /**
   * 相机停用时调用
   */
  protected onDeactivated(): void {
    super.onDeactivated()

    // 如果Engine的当前3D相机是这个相机，清除它
    const engine = Engine.getInstance()
    if (engine.getCamera3D() === this._activeThreeCamera) {
      // engine.setCamera3D(null)
    }
  }

  /**
   * 每帧更新时调用
   * @param delta 时间增量（秒）
   */
  public _process(delta: number): void {
    super._process(delta)

    if (!this.current) return

    // 更新轨道控制器
    if (this._orbitControls) {
      this._orbitControls.update()
    }

    // 更新相机参数（如果需要）
    if (this._cameraParamsDirty) {
      this.updateCameraParams()
    }

    // 更新视锥体
    this.updateFrustum()

    // 跟随目标
    if (this._followTarget) {
      this.followTarget()
    }

    // 更新多普勒跟踪（如果启用）
    if (this._dopplerTracking.enabled) {
      this.updateDopplerTracking(delta)
    }
  }

  /**
   * 更新多普勒跟踪
   * @param delta 时间增量
   */
  private updateDopplerTracking(delta: number): void {
    // 这里可以实现多普勒效果的计算
    // 需要与音频系统集成
  }

  // ========================================================================
  // 相机控制器方法
  // ========================================================================

  /**
   * 启用轨道控制器
   * @param target 控制器目标点
   * @returns OrbitControls实例
   */
  enableOrbitControls(target: Vector3 = { x: 0, y: 0, z: 0 }): OrbitControls {
    const engine = this.getEngine()
    if (!engine || !engine.getRenderer()) {
      throw new Error('无法启用轨道控制器：引擎或渲染器未初始化')
    }

    const renderer = engine.getRenderer()!
    console.log('🎮 启用轨道控制器:', {
      camera: !!this.threeCamera,
      renderer: !!renderer,
      domElement: !!renderer.domElement,
      target
    })

    if (!this._orbitControls) {
      try {
        this._orbitControls = new OrbitControls(this.threeCamera, renderer.domElement)
        this._orbitControls.target.set(target.x, target.y, target.z)
        this._orbitControls.enableDamping = true
        this._orbitControls.dampingFactor = 0.05
        this._orbitControls.screenSpacePanning = false
        this._orbitControls.minDistance = 1
        this._orbitControls.maxDistance = 100
        this._orbitControls.maxPolarAngle = Math.PI / 2
        this._orbitControls.update()

        console.log('✅ 轨道控制器创建成功')
      } catch (error) {
        console.error('❌ 轨道控制器创建失败:', error)
        throw error
      }
    }

    this._orbitControls.enabled = true
    return this._orbitControls
  }

  /**
   * 禁用轨道控制器
   */
  disableOrbitControls(): void {
    if (this._orbitControls) {
      this._orbitControls.enabled = false
    }
  }

  /**
   * 获取轨道控制器实例
   * @returns OrbitControls实例或null
   */
  getOrbitControls(): OrbitControls | null {
    return this._orbitControls
  }

  /**
   * 获取视锥剔除信息
   * @returns 视锥剔除信息
   */
  getFrustumCullingInfo(): FrustumCullingInfo {
    return {
      enabled: this._frustumCulling,
      culledObjects: 0, // 这里需要实际的剔除统计
      visibleObjects: 0 // 这里需要实际的可见对象统计
    }
  }

  /**
   * 获取相机的视锥体平面
   * @returns 视锥体的6个平面
   */
  getFrustumPlanes(): THREE.Plane[] {
    return this._frustum.planes.slice()
  }

  /**
   * 计算到指定点的距离
   * @param point 世界坐标点
   * @returns 距离
   */
  getDistanceToPoint(point: Vector3): number {
    if (!this._activeThreeCamera) return 0

    const cameraPos = this._activeThreeCamera.position
    const dx = point.x - cameraPos.x
    const dy = point.y - cameraPos.y
    const dz = point.z - cameraPos.z

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * 获取相机前方向量
   * @returns 前方向量
   */
  getForwardVector(): Vector3 {
    if (!this._activeThreeCamera) {
      return { x: 0, y: 0, z: -1 }
    }

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(this._activeThreeCamera.quaternion)

    return {
      x: forward.x,
      y: forward.y,
      z: forward.z
    }
  }

  /**
   * 获取相机右方向量
   * @returns 右方向量
   */
  getRightVector(): Vector3 {
    if (!this._activeThreeCamera) {
      return { x: 1, y: 0, z: 0 }
    }

    const right = new THREE.Vector3(1, 0, 0)
    right.applyQuaternion(this._activeThreeCamera.quaternion)

    return {
      x: right.x,
      y: right.y,
      z: right.z
    }
  }

  /**
   * 获取相机上方向量
   * @returns 上方向量
   */
  getUpVector(): Vector3 {
    if (!this._activeThreeCamera) {
      return { x: 0, y: 1, z: 0 }
    }

    const up = new THREE.Vector3(0, 1, 0)
    up.applyQuaternion(this._activeThreeCamera.quaternion)

    return {
      x: up.x,
      y: up.y,
      z: up.z
    }
  }

  /**
   * 让相机看向指定点
   * @param target 目标点世界坐标
   * @param up 上方向向量，默认为(0,1,0)
   */
  lookAt(target: Vector3, up: Vector3 = { x: 0, y: 1, z: 0 }): void {
    if (!this._activeThreeCamera) return

    const targetVector = new THREE.Vector3(target.x, target.y, target.z)
    const upVector = new THREE.Vector3(up.x, up.y, up.z)

    this._activeThreeCamera.lookAt(targetVector)
    this._activeThreeCamera.up.copy(upVector)
  }

  /**
   * 复制相机设置到另一个Camera3D
   * @param target 目标相机
   */
  copySettingsTo(target: Camera3D): void {
    super.copySettingsTo(target)

    target._projectionMode = this._projectionMode
    target._fov = this._fov
    target._size = this._size
    target._near = this._near
    target._far = this._far
    target._keepAspect = this._keepAspect
    target._frustumCulling = this._frustumCulling
    target._dopplerTracking = { ...this._dopplerTracking }
    target._followConfig = { ...this._followConfig }

    target._cameraParamsDirty = true
    target.updateCameraParams()
  }

  /**
   * 销毁相机节点
   */
  public override destroy(): void {
    // 销毁轨道控制器
    if (this._orbitControls) {
      this._orbitControls.dispose()
      this._orbitControls = null
    }

    super.destroy()
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Camera3D