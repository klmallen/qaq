/**
 * QAQ游戏引擎 - UI事件优先级管理系统
 * 
 * 解决UI事件与3D场景事件冲突问题
 */

import type { Vector2 } from '../../types/core'

/**
 * UI元素状态接口
 */
interface UIElementState {
  id: string
  isHovered: boolean
  hasFocus: boolean
  isPressed: boolean
  isDragging: boolean
  zIndex: number
  bounds: { x: number; y: number; width: number; height: number }
}

/**
 * 事件优先级级别
 */
export enum EventPriority {
  /** 最低优先级 - 3D场景事件 */
  SCENE_3D = 0,
  /** 低优先级 - UI背景事件 */
  UI_BACKGROUND = 1,
  /** 中等优先级 - UI内容事件 */
  UI_CONTENT = 2,
  /** 高优先级 - UI覆盖层事件 */
  UI_OVERLAY = 3,
  /** 最高优先级 - 模态对话框事件 */
  UI_MODAL = 4
}

/**
 * UI事件优先级管理器
 * 统一管理UI事件与3D场景事件的优先级和冲突解决
 */
export class UIEventPriority {
  /** 已注册的UI元素状态 */
  private static uiElements: Map<string, UIElementState> = new Map()

  /** 当前获得焦点的UI元素 */
  private static focusedElement: string | null = null

  /** 当前悬停的UI元素 */
  private static hoveredElement: string | null = null

  /** 当前被按下的UI元素 */
  private static pressedElement: string | null = null

  /** 当前被拖拽的UI元素 */
  private static draggedElement: string | null = null

  /** 事件监听器列表 */
  private static eventListeners: Map<string, Function[]> = new Map()

  /**
   * 注册UI元素
   * @param id 元素ID
   * @param zIndex 元素zIndex
   * @param bounds 元素边界
   */
  static registerUIElement(
    id: string, 
    zIndex: number, 
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    this.uiElements.set(id, {
      id,
      isHovered: false,
      hasFocus: false,
      isPressed: false,
      isDragging: false,
      zIndex,
      bounds
    })
  }

  /**
   * 注销UI元素
   * @param id 元素ID
   */
  static unregisterUIElement(id: string): void {
    // 清理状态
    if (this.focusedElement === id) this.focusedElement = null
    if (this.hoveredElement === id) this.hoveredElement = null
    if (this.pressedElement === id) this.pressedElement = null
    if (this.draggedElement === id) this.draggedElement = null

    this.uiElements.delete(id)
  }

  /**
   * 更新UI元素状态
   * @param id 元素ID
   * @param state 状态更新
   */
  static updateUIElementState(id: string, state: Partial<UIElementState>): void {
    const element = this.uiElements.get(id)
    if (element) {
      Object.assign(element, state)
      
      // 更新全局状态
      if (state.hasFocus) this.focusedElement = id
      if (state.isHovered) this.hoveredElement = id
      if (state.isPressed) this.pressedElement = id
      if (state.isDragging) this.draggedElement = id
    }
  }

  /**
   * 检查是否应该阻止3D相机控制
   * @returns 是否阻止相机控制
   */
  static shouldBlockCameraControls(): boolean {
    // 如果有UI元素获得焦点、被悬停、被按下或被拖拽，则阻止相机控制
    return this.focusedElement !== null || 
           this.hoveredElement !== null || 
           this.pressedElement !== null || 
           this.draggedElement !== null
  }

  /**
   * 检查是否应该阻止3D场景事件
   * @param eventType 事件类型
   * @returns 是否阻止场景事件
   */
  static shouldBlockSceneEvents(eventType: string): boolean {
    switch (eventType) {
      case 'mousedown':
      case 'mouseup':
      case 'click':
        return this.pressedElement !== null || this.hoveredElement !== null
      
      case 'mousemove':
        return this.draggedElement !== null || this.hoveredElement !== null
      
      case 'wheel':
        return this.hoveredElement !== null
      
      case 'keydown':
      case 'keyup':
        return this.focusedElement !== null
      
      default:
        return false
    }
  }

  /**
   * 获取指定位置的最高优先级UI元素
   * @param point 屏幕坐标点
   * @returns 最高优先级的UI元素ID，如果没有则返回null
   */
  static getTopUIElementAt(point: Vector2): string | null {
    let topElement: UIElementState | null = null
    let topZIndex = -Infinity

    for (const element of this.uiElements.values()) {
      const { bounds, zIndex } = element
      
      // 检查点是否在元素边界内
      if (point.x >= bounds.x && 
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y && 
          point.y <= bounds.y + bounds.height) {
        
        // 选择zIndex最高的元素
        if (zIndex > topZIndex) {
          topZIndex = zIndex
          topElement = element
        }
      }
    }

    return topElement?.id || null
  }

  /**
   * 处理鼠标事件的优先级分发
   * @param event 鼠标事件
   * @param point 事件坐标
   * @returns 是否被UI处理（如果是，则应阻止3D场景处理）
   */
  static handleMouseEvent(event: MouseEvent, point: Vector2): boolean {
    const topElementId = this.getTopUIElementAt(point)
    
    if (topElementId) {
      // UI元素处理事件
      this.dispatchUIEvent(topElementId, event.type, event)
      return true
    }
    
    // 没有UI元素处理，允许3D场景处理
    return false
  }

  /**
   * 处理键盘事件的优先级分发
   * @param event 键盘事件
   * @returns 是否被UI处理
   */
  static handleKeyboardEvent(event: KeyboardEvent): boolean {
    if (this.focusedElement) {
      // 有焦点元素，UI处理键盘事件
      this.dispatchUIEvent(this.focusedElement, event.type, event)
      return true
    }
    
    // 没有焦点元素，允许3D场景处理
    return false
  }

  /**
   * 分发UI事件到指定元素
   * @param elementId 元素ID
   * @param eventType 事件类型
   * @param originalEvent 原始事件对象
   */
  private static dispatchUIEvent(elementId: string, eventType: string, originalEvent: Event): void {
    const listeners = this.eventListeners.get(`${elementId}:${eventType}`)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(originalEvent)
        } catch (error) {
          console.error(`Error in UI event listener for ${elementId}:${eventType}:`, error)
        }
      })
    }
  }

  /**
   * 添加UI事件监听器
   * @param elementId 元素ID
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  static addEventListener(elementId: string, eventType: string, listener: Function): void {
    const key = `${elementId}:${eventType}`
    const listeners = this.eventListeners.get(key) || []
    listeners.push(listener)
    this.eventListeners.set(key, listeners)
  }

  /**
   * 移除UI事件监听器
   * @param elementId 元素ID
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  static removeEventListener(elementId: string, eventType: string, listener: Function): void {
    const key = `${elementId}:${eventType}`
    const listeners = this.eventListeners.get(key)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.eventListeners.delete(key)
        }
      }
    }
  }

  /**
   * 设置焦点到指定UI元素
   * @param elementId 元素ID
   */
  static setFocus(elementId: string): void {
    // 清除之前的焦点
    if (this.focusedElement && this.focusedElement !== elementId) {
      this.updateUIElementState(this.focusedElement, { hasFocus: false })
    }
    
    // 设置新焦点
    this.focusedElement = elementId
    this.updateUIElementState(elementId, { hasFocus: true })
  }

  /**
   * 清除焦点
   */
  static clearFocus(): void {
    if (this.focusedElement) {
      this.updateUIElementState(this.focusedElement, { hasFocus: false })
      this.focusedElement = null
    }
  }

  /**
   * 获取当前状态信息
   * @returns 当前状态
   */
  static getCurrentState(): {
    focusedElement: string | null;
    hoveredElement: string | null;
    pressedElement: string | null;
    draggedElement: string | null;
    totalElements: number;
    shouldBlockCamera: boolean;
  } {
    return {
      focusedElement: this.focusedElement,
      hoveredElement: this.hoveredElement,
      pressedElement: this.pressedElement,
      draggedElement: this.draggedElement,
      totalElements: this.uiElements.size,
      shouldBlockCamera: this.shouldBlockCameraControls()
    }
  }

  /**
   * 清理所有状态
   */
  static clear(): void {
    this.uiElements.clear()
    this.eventListeners.clear()
    this.focusedElement = null
    this.hoveredElement = null
    this.pressedElement = null
    this.draggedElement = null
  }
}
