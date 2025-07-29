/**
 * QAQ游戏引擎 - 脚本基类系统
 *
 * 提供类型安全的脚本基类，所有用户脚本必须继承此类
 * 定义标准的脚本生命周期接口和Node访问机制
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import type Node from '../nodes/Node'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 脚本接口定义
// ============================================================================

/**
 * 脚本生命周期接口
 * 定义所有脚本必须实现的标准方法
 */
export interface IScriptLifecycle {
  /** 脚本准备完成时调用，类似Godot的_ready() */
  _ready?(): void

  /** 每帧处理时调用，类似Godot的_process(delta) */
  _process?(delta: number): void

  /** 物理帧处理时调用，类似Godot的_physics_process(delta) */
  _physics_process?(delta: number): void

  /** 输入事件处理，类似Godot的_input(event) */
  _input?(event: any): void

  /** 未处理输入事件处理，类似Godot的_unhandled_input(event) */
  _unhandled_input?(event: any): void

  /** 脚本销毁时调用 */
  _exit_tree?(): void
}

/**
 * 脚本上下文接口
 * 提供脚本可以访问的所有API
 */
export interface IScriptContext {
  /** 获取挂载的节点实例 */
  readonly node: Node

  /** 通过路径获取节点 */
  getNode(path: string): Node | null

  /** 通过名称查找节点 */
  findNode(name: string): Node | null

  /** 打印日志 */
  print(...args: any[]): void

  /** 获取当前时间戳 */
  getTime(): number

  /** 获取随机数 */
  randf(): number

  /** 获取指定范围的随机整数 */
  randi_range(min: number, max: number): number
}

// ============================================================================
// 脚本基类
// ============================================================================

/**
 * 脚本基类
 * 所有用户脚本必须继承此类
 */
export abstract class ScriptBase implements IScriptLifecycle, IScriptContext {
  /** 挂载的节点实例 */
  protected _node: Node

  /** 脚本是否已初始化 */
  protected _initialized: boolean = false

  /** 脚本是否处于活动状态 */
  protected _active: boolean = true

  constructor(node: Node) {
    this._node = node
  }

  // ========================================================================
  // 脚本上下文API实现
  // ========================================================================

  /**
   * 获取挂载的节点实例
   */
  get node(): Node {
    return this._node
  }

  /**
   * 获取脚本所有者节点（与node属性相同，为了兼容性）
   * @returns 脚本所有者节点
   */
  getOwner(): Node {
    return this._node
  }

  /**
   * 通过路径获取节点
   */
  getNode(path: string): Node | null {
    return this._node.getNode(path)
  }

  /**
   * 通过名称查找节点
   */
  findNode(name: string): Node | null {
    return this._node.findChild(name)
  }

  /**
   * 打印日志
   */
  print(...args: any[]): void {
    console.log(`[${this._node.name}]`, ...args)
  }

  /**
   * 获取当前时间戳
   */
  getTime(): number {
    return Date.now() / 1000
  }

  /**
   * 获取随机数 [0, 1)
   */
  randf(): number {
    return Math.random()
  }

  /**
   * 获取指定范围的随机整数 [min, max]
   */
  randi_range(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // ========================================================================
  // 便捷属性访问器
  // ========================================================================

  /**
   * 获取节点位置
   */
  get position(): Vector3 {
    return this._node.position
  }

  /**
   * 设置节点位置
   */
  set position(value: Vector3) {
    this._node.position = value
  }

  /**
   * 获取节点全局位置
   */
  get global_position(): Vector3 {
    return this._node.globalPosition
  }

  /**
   * 设置节点全局位置
   */
  set global_position(value: Vector3) {
    this._node.globalPosition = value
  }

  /**
   * 获取节点可见性
   */
  get visible(): boolean {
    return this._node.visible
  }

  /**
   * 设置节点可见性
   */
  set visible(value: boolean) {
    this._node.visible = value
  }

  // ========================================================================
  // 脚本生命周期方法（子类可重写）
  // ========================================================================

  /**
   * 脚本准备完成时调用
   * 子类应重写此方法实现初始化逻辑
   */
  _ready?(): void

  /**
   * 每帧处理时调用
   * 子类应重写此方法实现更新逻辑
   */
  _process?(delta: number): void

  /**
   * 物理帧处理时调用
   * 子类应重写此方法实现物理相关逻辑
   */
  _physics_process?(delta: number): void

  /**
   * 输入事件处理
   * 子类应重写此方法实现输入处理逻辑
   */
  _input?(event: any): void

  /**
   * 未处理输入事件处理
   * 子类应重写此方法实现输入处理逻辑
   */
  _unhandled_input?(event: any): void

  /**
   * 脚本销毁时调用
   * 子类应重写此方法实现清理逻辑
   */
  _exit_tree?(): void

  // ========================================================================
  // 内部方法
  // ========================================================================

  /**
   * 标记脚本为已初始化
   * @internal
   */
  _markInitialized(): void {
    this._initialized = true
  }

  /**
   * 检查脚本是否已初始化
   * @internal
   */
  _isInitialized(): boolean {
    return this._initialized
  }

  /**
   * 设置脚本活动状态
   * @internal
   */
  _setActive(active: boolean): void {
    this._active = active
  }

  /**
   * 检查脚本是否处于活动状态
   * @internal
   */
  _isActive(): boolean {
    return this._active
  }
}

export default ScriptBase
