/**
 * QAQ游戏引擎 - 状态管理器
 * 
 * 负责管理编辑器状态和运行时状态的分离，支持撤销/重做功能
 */

import { QaqObject } from '../object/QaqObject'
import Node from '../nodes/Node'

// ============================================================================
// 状态管理接口定义
// ============================================================================

/**
 * 状态快照
 */
export interface StateSnapshot {
  /** 快照ID */
  id: string
  /** 快照名称 */
  name: string
  /** 创建时间 */
  timestamp: number
  /** 快照数据 */
  data: any
  /** 快照类型 */
  type: 'editor' | 'runtime' | 'checkpoint'
  /** 元数据 */
  metadata: {
    nodeCount: number
    dataSize: number
    description?: string
  }
}

/**
 * 状态变更记录
 */
export interface StateChange {
  /** 变更ID */
  id: string
  /** 变更类型 */
  type: 'property' | 'hierarchy' | 'component' | 'script'
  /** 目标节点ID */
  nodeId: string
  /** 变更描述 */
  description: string
  /** 变更前的值 */
  oldValue: any
  /** 变更后的值 */
  newValue: any
  /** 变更时间 */
  timestamp: number
  /** 是否可撤销 */
  undoable: boolean
}

/**
 * 撤销/重做操作
 */
export interface UndoRedoOperation {
  /** 操作ID */
  id: string
  /** 操作名称 */
  name: string
  /** 执行函数 */
  execute: () => void
  /** 撤销函数 */
  undo: () => void
  /** 操作时间 */
  timestamp: number
}

// ============================================================================
// 状态管理器类
// ============================================================================

export class StateManager extends QaqObject {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 状态快照存储 */
  private _snapshots: Map<string, StateSnapshot> = new Map()

  /** 状态变更历史 */
  private _changeHistory: StateChange[] = []

  /** 撤销栈 */
  private _undoStack: UndoRedoOperation[] = []

  /** 重做栈 */
  private _redoStack: UndoRedoOperation[] = []

  /** 当前编辑器状态快照ID */
  private _currentEditorSnapshotId: string | null = null

  /** 当前运行时状态快照ID */
  private _currentRuntimeSnapshotId: string | null = null

  /** 最大快照数量 */
  private _maxSnapshots: number = 50

  /** 最大撤销步数 */
  private _maxUndoSteps: number = 100

  /** 是否启用状态跟踪 */
  private _stateTrackingEnabled: boolean = true

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  constructor() {
    super()
    this.initializeSignals()
  }

  /**
   * 初始化信号系统
   */
  private initializeSignals(): void {
    this.addUserSignal('snapshot_created', ['snapshot_id', 'type'])
    this.addUserSignal('snapshot_restored', ['snapshot_id', 'type'])
    this.addUserSignal('state_changed', ['change'])
    this.addUserSignal('undo_performed', ['operation'])
    this.addUserSignal('redo_performed', ['operation'])
  }

  // ========================================================================
  // 公共API - 快照管理
  // ========================================================================

  /**
   * 创建状态快照
   */
  createSnapshot(name: string, data: any, type: 'editor' | 'runtime' | 'checkpoint' = 'editor'): string {
    const snapshotId = this.generateId()
    const serializedData = JSON.stringify(data)
    
    const snapshot: StateSnapshot = {
      id: snapshotId,
      name,
      timestamp: Date.now(),
      data: JSON.parse(serializedData), // 深拷贝
      type,
      metadata: {
        nodeCount: this.countNodesInData(data),
        dataSize: serializedData.length,
        description: `${type} snapshot: ${name}`
      }
    }

    this._snapshots.set(snapshotId, snapshot)
    
    // 更新当前快照引用
    if (type === 'editor') {
      this._currentEditorSnapshotId = snapshotId
    } else if (type === 'runtime') {
      this._currentRuntimeSnapshotId = snapshotId
    }

    // 清理旧快照
    this.cleanupOldSnapshots()

    this.emit('snapshot_created', snapshotId, type)
    console.log(`📸 创建${type}快照: ${name} (${snapshotId})`)

    return snapshotId
  }

  /**
   * 恢复状态快照
   */
  restoreSnapshot(snapshotId: string): any {
    const snapshot = this._snapshots.get(snapshotId)
    
    if (!snapshot) {
      throw new Error(`快照不存在: ${snapshotId}`)
    }

    // 深拷贝快照数据
    const restoredData = JSON.parse(JSON.stringify(snapshot.data))
    
    this.emit('snapshot_restored', snapshotId, snapshot.type)
    console.log(`🔄 恢复${snapshot.type}快照: ${snapshot.name} (${snapshotId})`)

    return restoredData
  }

  /**
   * 获取快照信息
   */
  getSnapshotInfo(snapshotId: string): StateSnapshot | null {
    const snapshot = this._snapshots.get(snapshotId)
    return snapshot ? { ...snapshot } : null
  }

  /**
   * 获取所有快照列表
   */
  getAllSnapshots(): StateSnapshot[] {
    return Array.from(this._snapshots.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    const deleted = this._snapshots.delete(snapshotId)
    
    if (deleted) {
      // 清理引用
      if (this._currentEditorSnapshotId === snapshotId) {
        this._currentEditorSnapshotId = null
      }
      if (this._currentRuntimeSnapshotId === snapshotId) {
        this._currentRuntimeSnapshotId = null
      }
      
      console.log(`🗑️ 删除快照: ${snapshotId}`)
    }

    return deleted
  }

  // ========================================================================
  // 状态变更跟踪
  // ========================================================================

  /**
   * 记录状态变更
   */
  recordStateChange(
    type: 'property' | 'hierarchy' | 'component' | 'script',
    nodeId: string,
    description: string,
    oldValue: any,
    newValue: any,
    undoable: boolean = true
  ): string {
    if (!this._stateTrackingEnabled) {
      return ''
    }

    const changeId = this.generateId()
    const change: StateChange = {
      id: changeId,
      type,
      nodeId,
      description,
      oldValue: this.deepClone(oldValue),
      newValue: this.deepClone(newValue),
      timestamp: Date.now(),
      undoable
    }

    this._changeHistory.push(change)
    
    // 限制历史记录长度
    if (this._changeHistory.length > 1000) {
      this._changeHistory.shift()
    }

    this.emit('state_changed', change)
    console.log(`📝 记录状态变更: ${description} (${changeId})`)

    return changeId
  }

  /**
   * 获取状态变更历史
   */
  getChangeHistory(nodeId?: string, type?: string): StateChange[] {
    let history = [...this._changeHistory]

    if (nodeId) {
      history = history.filter(change => change.nodeId === nodeId)
    }

    if (type) {
      history = history.filter(change => change.type === type)
    }

    return history.sort((a, b) => b.timestamp - a.timestamp)
  }

  // ========================================================================
  // 撤销/重做系统
  // ========================================================================

  /**
   * 添加撤销操作
   */
  addUndoOperation(name: string, execute: () => void, undo: () => void): string {
    const operationId = this.generateId()
    const operation: UndoRedoOperation = {
      id: operationId,
      name,
      execute,
      undo,
      timestamp: Date.now()
    }

    this._undoStack.push(operation)
    
    // 清空重做栈（新操作会使重做无效）
    this._redoStack = []

    // 限制撤销栈大小
    if (this._undoStack.length > this._maxUndoSteps) {
      this._undoStack.shift()
    }

    console.log(`📝 添加撤销操作: ${name} (${operationId})`)
    return operationId
  }

  /**
   * 执行撤销
   */
  undo(): boolean {
    const operation = this._undoStack.pop()
    
    if (!operation) {
      console.warn('没有可撤销的操作')
      return false
    }

    try {
      operation.undo()
      this._redoStack.push(operation)
      
      this.emit('undo_performed', operation)
      console.log(`↶ 撤销操作: ${operation.name}`)
      return true

    } catch (error) {
      console.error(`撤销操作失败: ${operation.name}`, error)
      // 将操作放回撤销栈
      this._undoStack.push(operation)
      return false
    }
  }

  /**
   * 执行重做
   */
  redo(): boolean {
    const operation = this._redoStack.pop()
    
    if (!operation) {
      console.warn('没有可重做的操作')
      return false
    }

    try {
      operation.execute()
      this._undoStack.push(operation)
      
      this.emit('redo_performed', operation)
      console.log(`↷ 重做操作: ${operation.name}`)
      return true

    } catch (error) {
      console.error(`重做操作失败: ${operation.name}`, error)
      // 将操作放回重做栈
      this._redoStack.push(operation)
      return false
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this._undoStack.length > 0
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this._redoStack.length > 0
  }

  /**
   * 清空撤销/重做栈
   */
  clearUndoRedo(): void {
    this._undoStack = []
    this._redoStack = []
    console.log('🧹 清空撤销/重做栈')
  }

  // ========================================================================
  // 状态比较和差异检测
  // ========================================================================

  /**
   * 比较两个状态快照
   */
  compareSnapshots(snapshotId1: string, snapshotId2: string): any {
    const snapshot1 = this._snapshots.get(snapshotId1)
    const snapshot2 = this._snapshots.get(snapshotId2)

    if (!snapshot1 || !snapshot2) {
      throw new Error('快照不存在')
    }

    return this.deepCompare(snapshot1.data, snapshot2.data)
  }

  /**
   * 检测状态差异
   */
  detectStateDifferences(oldState: any, newState: any): any[] {
    const differences: any[] = []
    this.findDifferences(oldState, newState, '', differences)
    return differences
  }

  // ========================================================================
  // 配置和管理
  // ========================================================================

  /**
   * 设置最大快照数量
   */
  setMaxSnapshots(count: number): void {
    this._maxSnapshots = Math.max(1, count)
    this.cleanupOldSnapshots()
  }

  /**
   * 设置最大撤销步数
   */
  setMaxUndoSteps(count: number): void {
    this._maxUndoSteps = Math.max(1, count)
    
    // 清理超出限制的操作
    while (this._undoStack.length > this._maxUndoSteps) {
      this._undoStack.shift()
    }
  }

  /**
   * 启用/禁用状态跟踪
   */
  setStateTrackingEnabled(enabled: boolean): void {
    this._stateTrackingEnabled = enabled
    console.log(`${enabled ? '启用' : '禁用'}状态跟踪`)
  }

  /**
   * 获取状态管理器统计信息
   */
  getStatistics(): {
    snapshots: number
    changeHistory: number
    undoStack: number
    redoStack: number
    memoryUsage: number
  } {
    const memoryUsage = this.calculateMemoryUsage()
    
    return {
      snapshots: this._snapshots.size,
      changeHistory: this._changeHistory.length,
      undoStack: this._undoStack.length,
      redoStack: this._redoStack.length,
      memoryUsage
    }
  }

  // ========================================================================
  // 私有工具方法
  // ========================================================================

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 深拷贝对象
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item))
    }
    
    const cloned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    
    return cloned
  }

  /**
   * 深度比较对象
   */
  private deepCompare(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return obj1 === obj2
    
    if (typeof obj1 !== typeof obj2) return false
    
    if (typeof obj1 !== 'object') return obj1 === obj2
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!this.deepCompare(obj1[key], obj2[key])) return false
    }
    
    return true
  }

  /**
   * 查找差异
   */
  private findDifferences(obj1: any, obj2: any, path: string, differences: any[]): void {
    if (obj1 === obj2) return
    
    if (typeof obj1 !== typeof obj2) {
      differences.push({ path, oldValue: obj1, newValue: obj2, type: 'type_change' })
      return
    }
    
    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
      differences.push({ path, oldValue: obj1, newValue: obj2, type: 'value_change' })
      return
    }
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = new Set([...keys1, ...keys2])
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key
      
      if (!(key in obj1)) {
        differences.push({ path: newPath, oldValue: undefined, newValue: obj2[key], type: 'added' })
      } else if (!(key in obj2)) {
        differences.push({ path: newPath, oldValue: obj1[key], newValue: undefined, type: 'removed' })
      } else {
        this.findDifferences(obj1[key], obj2[key], newPath, differences)
      }
    }
  }

  /**
   * 计算数据中的节点数量
   */
  private countNodesInData(data: any): number {
    if (!data || typeof data !== 'object') return 0
    
    let count = 0
    if (data.type || data.name) count = 1 // 可能是节点
    
    if (data.children && Array.isArray(data.children)) {
      for (const child of data.children) {
        count += this.countNodesInData(child)
      }
    }
    
    return count
  }

  /**
   * 清理旧快照
   */
  private cleanupOldSnapshots(): void {
    if (this._snapshots.size <= this._maxSnapshots) return
    
    const snapshots = Array.from(this._snapshots.values())
      .sort((a, b) => a.timestamp - b.timestamp)
    
    const toDelete = snapshots.slice(0, snapshots.length - this._maxSnapshots)
    
    for (const snapshot of toDelete) {
      this._snapshots.delete(snapshot.id)
      console.log(`🧹 清理旧快照: ${snapshot.name} (${snapshot.id})`)
    }
  }

  /**
   * 计算内存使用量（估算）
   */
  private calculateMemoryUsage(): number {
    let size = 0
    
    // 快照数据大小
    for (const snapshot of this._snapshots.values()) {
      size += snapshot.metadata.dataSize
    }
    
    // 变更历史大小
    size += JSON.stringify(this._changeHistory).length
    
    return size
  }
}

export default StateManager
