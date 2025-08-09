/**
 * QAQ编辑器事件总线
 * 
 * 功能：
 * - 实现编辑器与引擎之间的事件驱动通信
 * - 只在场景真正变化时通知编辑器更新
 * - 支持细粒度的事件类型，避免不必要的更新
 * - 与Vue响应式系统集成
 */

import { reactive } from 'vue'

// ============================================================================
// 事件类型定义
// ============================================================================

export type EditorEventType =
  // 场景相关事件 (核心事件)
  | 'scene:loaded'           // 场景加载完成
  | 'scene:changed'          // 场景发生变化
  | 'scene:node_added'       // 节点添加
  | 'scene:node_removed'     // 节点移除
  | 'scene:node_modified'    // 节点修改
  | 'scene:hierarchy_changed' // 层级结构变化

  // 选择相关事件
  | 'selection:changed'      // 选择变化
  | 'selection:cleared'      // 清除选择

  // 变换相关事件
  | 'transform:changed'      // 变换变化（统一事件）

  // 编辑器状态事件
  | 'editor:initialized'     // 编辑器初始化完成
  | 'editor:tool_changed'    // 工具切换

export interface EditorEvent {
  type: EditorEventType
  data?: any
  timestamp: number
  source: string
}

export type EventListener = (event: EditorEvent) => void

// ============================================================================
// 编辑器事件总线类
// ============================================================================

export class EditorEventBus {
  // ========================================================================
  // 私有属性
  // ========================================================================
  
  private _listeners = new Map<EditorEventType, Set<EventListener>>()
  private _eventHistory: EditorEvent[] = []
  private _maxHistorySize = 100
  private _debugMode = false
  
  // 响应式状态
  private _state = reactive({
    lastEvent: null as EditorEvent | null,
    eventCount: 0,
    isProcessing: false
  })

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(debugMode = false) {
    this._debugMode = debugMode
  }

  // ========================================================================
  // 公共API - 事件监听
  // ========================================================================

  /**
   * 监听事件
   */
  on(eventType: EditorEventType, listener: EventListener): () => void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set())
    }
    
    this._listeners.get(eventType)!.add(listener)
    
    if (this._debugMode) {
      console.log(`📡 注册事件监听器: ${eventType}`)
    }
    
    // 返回取消监听的函数
    return () => this.off(eventType, listener)
  }

  /**
   * 取消监听事件
   */
  off(eventType: EditorEventType, listener: EventListener): void {
    const listeners = this._listeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this._listeners.delete(eventType)
      }
    }
  }

  /**
   * 监听一次性事件
   */
  once(eventType: EditorEventType, listener: EventListener): void {
    const onceListener = (event: EditorEvent) => {
      listener(event)
      this.off(eventType, onceListener)
    }
    this.on(eventType, onceListener)
  }

  /**
   * 监听多个事件类型
   */
  onMultiple(eventTypes: EditorEventType[], listener: EventListener): () => void {
    const unsubscribers = eventTypes.map(type => this.on(type, listener))
    
    // 返回取消所有监听的函数
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // ========================================================================
  // 公共API - 事件发送
  // ========================================================================

  /**
   * 发送事件
   */
  emit(eventType: EditorEventType, data?: any, source = 'unknown'): void {
    const event: EditorEvent = {
      type: eventType,
      data,
      timestamp: performance.now(),
      source
    }
    
    this._state.isProcessing = true
    
    try {
      // 记录事件历史
      this._addToHistory(event)
      
      // 更新状态
      this._state.lastEvent = event
      this._state.eventCount++
      
      // 调试输出
      if (this._debugMode) {
        console.log(`🚀 发送编辑器事件: ${eventType}`, {
          data,
          source,
          listenerCount: this._listeners.get(eventType)?.size || 0
        })
      }
      
      // 通知监听器
      const listeners = this._listeners.get(eventType)
      if (listeners && listeners.size > 0) {
        listeners.forEach(listener => {
          try {
            listener(event)
          } catch (error) {
            console.error(`❌ 事件监听器执行失败 (${eventType}):`, error)
          }
        })
      }
      
    } finally {
      this._state.isProcessing = false
    }
  }

  /**
   * 批量发送事件
   */
  emitBatch(events: Array<{ type: EditorEventType, data?: any }>, source = 'batch'): void {
    events.forEach(({ type, data }) => {
      this.emit(type, data, source)
    })
  }

  // ========================================================================
  // 公共API - 便捷方法
  // ========================================================================

  /**
   * 场景变化通知
   */
  notifySceneChanged(changeType: 'node_added' | 'node_removed' | 'node_modified' | 'hierarchy_changed', data?: any): void {
    this.emit(`scene:${changeType}` as EditorEventType, data, 'scene')
    this.emit('scene:changed', { changeType, ...data }, 'scene')
  }

  /**
   * 选择变化通知
   */
  notifySelectionChanged(selectedNodeIds: string[]): void {
    if (selectedNodeIds.length === 0) {
      this.emit('selection:cleared', null, 'selection')
    } else {
      this.emit('selection:changed', { nodeIds: selectedNodeIds }, 'selection')
    }
  }

  /**
   * 变换变化通知
   */
  notifyTransformChanged(nodeId: string, transformType: 'position' | 'rotation' | 'scale', newValue: any): void {
    this.emit('transform:changed', {
      nodeId,
      transformType,
      newValue
    }, 'transform')
  }

  // ========================================================================
  // 公共API - 状态查询
  // ========================================================================

  /**
   * 获取响应式状态
   */
  getState() {
    return this._state
  }

  /**
   * 获取事件历史
   */
  getEventHistory(): EditorEvent[] {
    return [...this._eventHistory]
  }

  /**
   * 获取指定类型的最后一个事件
   */
  getLastEvent(eventType?: EditorEventType): EditorEvent | null {
    if (!eventType) {
      return this._state.lastEvent
    }
    
    for (let i = this._eventHistory.length - 1; i >= 0; i--) {
      if (this._eventHistory[i].type === eventType) {
        return this._eventHistory[i]
      }
    }
    
    return null
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(eventType: EditorEventType): boolean {
    const listeners = this._listeners.get(eventType)
    return listeners ? listeners.size > 0 : false
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _addToHistory(event: EditorEvent): void {
    this._eventHistory.push(event)
    
    // 限制历史记录大小
    if (this._eventHistory.length > this._maxHistorySize) {
      this._eventHistory.shift()
    }
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  /**
   * 清除所有监听器
   */
  clear(): void {
    this._listeners.clear()
    this._eventHistory.length = 0
    this._state.lastEvent = null
    this._state.eventCount = 0
    
    if (this._debugMode) {
      console.log('🧹 编辑器事件总线已清理')
    }
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this._debugMode = enabled
  }
}

// ============================================================================
// 全局单例
// ============================================================================

let globalEventBus: EditorEventBus | null = null

export function getEditorEventBus(): EditorEventBus {
  if (!globalEventBus) {
    globalEventBus = new EditorEventBus(process.env.NODE_ENV === 'development')
  }
  return globalEventBus
}

export function createEditorEventBus(debugMode = false): EditorEventBus {
  return new EditorEventBus(debugMode)
}

export default EditorEventBus
