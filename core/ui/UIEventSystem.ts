/**
 * QAQ游戏引擎 - 完整UI事件系统
 * 
 * 统一管理UI事件处理，包括鼠标、键盘、触摸和焦点管理
 */

import * as THREE from 'three'
import type { Vector2, Vector3 } from '../../types/core'
import { UICoordinateSystem } from './UICoordinateSystem'
import { UIEventPriority } from './UIEventPriority'

/**
 * 事件类型枚举
 */
export enum UIEventType {
  // 鼠标事件
  MOUSE_DOWN = 'mousedown',
  MOUSE_UP = 'mouseup',
  MOUSE_MOVE = 'mousemove',
  MOUSE_ENTER = 'mouseenter',
  MOUSE_LEAVE = 'mouseleave',
  CLICK = 'click',
  DOUBLE_CLICK = 'dblclick',
  CONTEXT_MENU = 'contextmenu',
  WHEEL = 'wheel',
  
  // 键盘事件
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup',
  KEY_PRESS = 'keypress',
  
  // 触摸事件
  TOUCH_START = 'touchstart',
  TOUCH_END = 'touchend',
  TOUCH_MOVE = 'touchmove',
  TOUCH_CANCEL = 'touchcancel',
  
  // 焦点事件
  FOCUS = 'focus',
  BLUR = 'blur',
  FOCUS_IN = 'focusin',
  FOCUS_OUT = 'focusout',
  
  // 拖拽事件
  DRAG_START = 'dragstart',
  DRAG = 'drag',
  DRAG_END = 'dragend',
  DROP = 'drop',
  DRAG_OVER = 'dragover',
  DRAG_ENTER = 'dragenter',
  DRAG_LEAVE = 'dragleave'
}

/**
 * UI事件数据接口
 */
export interface UIEventData {
  type: UIEventType
  target: string | null
  position: Vector2
  worldPosition: Vector3
  button?: number
  buttons?: number
  key?: string
  code?: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  deltaX?: number
  deltaY?: number
  deltaZ?: number
  touches?: TouchData[]
  preventDefault: () => void
  stopPropagation: () => void
  originalEvent: Event
}

/**
 * 触摸数据接口
 */
export interface TouchData {
  identifier: number
  position: Vector2
  worldPosition: Vector3
  force?: number
}

/**
 * 事件监听器接口
 */
export interface UIEventListener {
  (event: UIEventData): void
}

/**
 * 拖拽状态接口
 */
interface DragState {
  isDragging: boolean
  dragElement: string | null
  startPosition: Vector2
  currentPosition: Vector2
  dragData: any
}

/**
 * UI事件系统
 * 统一处理所有UI相关的事件
 */
export class UIEventSystem {
  private static instance: UIEventSystem | null = null

  // 事件相关
  private eventListeners: Map<string, Map<UIEventType, UIEventListener[]>> = new Map()
  private globalEventListeners: Map<UIEventType, UIEventListener[]> = new Map()
  
  // 3D相关
  private camera: THREE.Camera | null = null
  private uiMeshes: THREE.Mesh[] = []
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  
  // 状态管理
  private hoveredElement: string | null = null
  private focusedElement: string | null = null
  private pressedElements: Set<string> = new Set()
  private dragState: DragState = {
    isDragging: false,
    dragElement: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dragData: null
  }
  
  // 配置
  private config = {
    doubleClickDelay: 300,
    dragThreshold: 5,
    enableTouchEvents: true,
    enableKeyboardNavigation: true,
    preventDefaultEvents: true
  }
  
  private constructor() {
    this.setupGlobalEventListeners()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UIEventSystem {
    if (!this.instance) {
      this.instance = new UIEventSystem()
    }
    return this.instance
  }

  /**
   * 设置3D相关对象
   * @param camera 相机对象
   * @param uiMeshes UI网格数组
   */
  setup3D(camera: THREE.Camera, uiMeshes: THREE.Mesh[]): void {
    this.camera = camera
    this.uiMeshes = uiMeshes
  }

  /**
   * 设置全局事件监听器
   */
  private setupGlobalEventListeners(): void {
    // 鼠标事件
    document.addEventListener('mousedown', this.handleMouseEvent.bind(this))
    document.addEventListener('mouseup', this.handleMouseEvent.bind(this))
    document.addEventListener('mousemove', this.handleMouseEvent.bind(this))
    document.addEventListener('click', this.handleMouseEvent.bind(this))
    document.addEventListener('dblclick', this.handleMouseEvent.bind(this))
    document.addEventListener('contextmenu', this.handleMouseEvent.bind(this))
    document.addEventListener('wheel', this.handleWheelEvent.bind(this))
    
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyboardEvent.bind(this))
    document.addEventListener('keyup', this.handleKeyboardEvent.bind(this))
    document.addEventListener('keypress', this.handleKeyboardEvent.bind(this))
    
    // 触摸事件
    if (this.config.enableTouchEvents) {
      document.addEventListener('touchstart', this.handleTouchEvent.bind(this))
      document.addEventListener('touchend', this.handleTouchEvent.bind(this))
      document.addEventListener('touchmove', this.handleTouchEvent.bind(this))
      document.addEventListener('touchcancel', this.handleTouchEvent.bind(this))
    }
    
    // 焦点事件
    document.addEventListener('focusin', this.handleFocusEvent.bind(this))
    document.addEventListener('focusout', this.handleFocusEvent.bind(this))
  }

  /**
   * 处理鼠标事件
   */
  private handleMouseEvent(event: MouseEvent): void {
    const eventType = event.type as UIEventType
    const target = this.getUIElementAt(event)
    
    // 创建事件数据
    const eventData: UIEventData = {
      type: eventType,
      target,
      position: { x: event.clientX, y: event.clientY },
      worldPosition: this.getWorldPosition(event),
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      originalEvent: event
    }
    
    // 处理特定事件类型
    switch (eventType) {
      case UIEventType.MOUSE_DOWN:
        this.handleMouseDown(eventData)
        break
      case UIEventType.MOUSE_UP:
        this.handleMouseUp(eventData)
        break
      case UIEventType.MOUSE_MOVE:
        this.handleMouseMove(eventData)
        break
      case UIEventType.CLICK:
        this.handleClick(eventData)
        break
    }
    
    // 分发事件
    this.dispatchEvent(eventData)
    
    // 检查是否应该阻止默认行为
    if (target && this.config.preventDefaultEvents) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  /**
   * 处理鼠标按下
   */
  private handleMouseDown(eventData: UIEventData): void {
    if (eventData.target) {
      this.pressedElements.add(eventData.target)
      UIEventPriority.updateUIElementState(eventData.target, { isPressed: true })
      
      // 检查是否开始拖拽
      if (!this.dragState.isDragging) {
        this.dragState.startPosition = eventData.position
        this.dragState.dragElement = eventData.target
      }
    }
  }

  /**
   * 处理鼠标释放
   */
  private handleMouseUp(eventData: UIEventData): void {
    // 清理按下状态
    for (const elementId of this.pressedElements) {
      UIEventPriority.updateUIElementState(elementId, { isPressed: false })
    }
    this.pressedElements.clear()
    
    // 结束拖拽
    if (this.dragState.isDragging) {
      this.endDrag(eventData)
    }
  }

  /**
   * 处理鼠标移动
   */
  private handleMouseMove(eventData: UIEventData): void {
    // 更新悬停状态
    this.updateHoverState(eventData.target)
    
    // 处理拖拽
    if (this.dragState.dragElement && !this.dragState.isDragging) {
      const distance = UICoordinateSystem.distance(
        this.dragState.startPosition,
        eventData.position
      )
      
      if (distance > this.config.dragThreshold) {
        this.startDrag(eventData)
      }
    }
    
    if (this.dragState.isDragging) {
      this.updateDrag(eventData)
    }
  }

  /**
   * 处理点击
   */
  private handleClick(eventData: UIEventData): void {
    if (eventData.target) {
      this.setFocus(eventData.target)
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    const eventType = event.type as UIEventType
    
    const eventData: UIEventData = {
      type: eventType,
      target: this.focusedElement,
      position: { x: 0, y: 0 },
      worldPosition: { x: 0, y: 0, z: 0 },
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      originalEvent: event
    }
    
    // 处理键盘导航
    if (this.config.enableKeyboardNavigation) {
      this.handleKeyboardNavigation(eventData)
    }
    
    // 分发事件
    this.dispatchEvent(eventData)
    
    // 如果有焦点元素，阻止默认行为
    if (this.focusedElement && this.config.preventDefaultEvents) {
      event.preventDefault()
    }
  }

  /**
   * 处理触摸事件
   */
  private handleTouchEvent(event: TouchEvent): void {
    const eventType = event.type as UIEventType
    const touches: TouchData[] = []
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      touches.push({
        identifier: touch.identifier,
        position: { x: touch.clientX, y: touch.clientY },
        worldPosition: this.getWorldPositionFromTouch(touch),
        force: touch.force
      })
    }
    
    const eventData: UIEventData = {
      type: eventType,
      target: touches.length > 0 ? this.getUIElementAtPosition(touches[0].position) : null,
      position: touches.length > 0 ? touches[0].position : { x: 0, y: 0 },
      worldPosition: touches.length > 0 ? touches[0].worldPosition : { x: 0, y: 0, z: 0 },
      touches,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      originalEvent: event
    }
    
    this.dispatchEvent(eventData)
  }

  /**
   * 获取指定位置的UI元素
   */
  private getUIElementAt(event: MouseEvent): string | null {
    if (!this.camera) return null
    
    const intersect = UICoordinateSystem.raycastUI(event, this.camera, this.uiMeshes)
    if (intersect) {
      // 从网格对象获取UI元素ID
      return intersect.mesh.userData?.uiElementId || null
    }
    
    return null
  }

  /**
   * 获取指定位置的UI元素
   */
  private getUIElementAtPosition(position: Vector2): string | null {
    // 简化实现，实际应该使用射线检测
    return UIEventPriority.getTopUIElementAt(position)
  }

  /**
   * 获取世界坐标位置
   */
  private getWorldPosition(event: MouseEvent): Vector3 {
    if (!this.camera) return { x: 0, y: 0, z: 0 }
    
    const intersect = UICoordinateSystem.raycastUI(event, this.camera, this.uiMeshes)
    return intersect ? intersect.point : { x: 0, y: 0, z: 0 }
  }

  /**
   * 从触摸获取世界坐标位置
   */
  private getWorldPositionFromTouch(touch: Touch): Vector3 {
    // 简化实现
    return { x: touch.clientX, y: touch.clientY, z: 0 }
  }

  /**
   * 分发事件
   */
  private dispatchEvent(eventData: UIEventData): void {
    // 分发到特定元素
    if (eventData.target) {
      const elementListeners = this.eventListeners.get(eventData.target)
      if (elementListeners) {
        const typeListeners = elementListeners.get(eventData.type)
        if (typeListeners) {
          typeListeners.forEach(listener => {
            try {
              listener(eventData)
            } catch (error) {
              console.error(`Error in UI event listener:`, error)
            }
          })
        }
      }
    }
    
    // 分发到全局监听器
    const globalListeners = this.globalEventListeners.get(eventData.type)
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(eventData)
        } catch (error) {
          console.error(`Error in global UI event listener:`, error)
        }
      })
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(elementId: string, eventType: UIEventType, listener: UIEventListener): void {
    if (!this.eventListeners.has(elementId)) {
      this.eventListeners.set(elementId, new Map())
    }
    
    const elementListeners = this.eventListeners.get(elementId)!
    if (!elementListeners.has(eventType)) {
      elementListeners.set(eventType, [])
    }
    
    elementListeners.get(eventType)!.push(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(elementId: string, eventType: UIEventType, listener: UIEventListener): void {
    const elementListeners = this.eventListeners.get(elementId)
    if (elementListeners) {
      const typeListeners = elementListeners.get(eventType)
      if (typeListeners) {
        const index = typeListeners.indexOf(listener)
        if (index !== -1) {
          typeListeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * 添加全局事件监听器
   */
  addGlobalEventListener(eventType: UIEventType, listener: UIEventListener): void {
    if (!this.globalEventListeners.has(eventType)) {
      this.globalEventListeners.set(eventType, [])
    }
    
    this.globalEventListeners.get(eventType)!.push(listener)
  }

  /**
   * 设置焦点
   */
  setFocus(elementId: string): void {
    if (this.focusedElement !== elementId) {
      // 清除之前的焦点
      if (this.focusedElement) {
        UIEventPriority.updateUIElementState(this.focusedElement, { hasFocus: false })
      }
      
      // 设置新焦点
      this.focusedElement = elementId
      UIEventPriority.setFocus(elementId)
      UIEventPriority.updateUIElementState(elementId, { hasFocus: true })
    }
  }

  /**
   * 更新悬停状态
   */
  private updateHoverState(elementId: string | null): void {
    if (this.hoveredElement !== elementId) {
      // 清除之前的悬停状态
      if (this.hoveredElement) {
        UIEventPriority.updateUIElementState(this.hoveredElement, { isHovered: false })
      }
      
      // 设置新悬停状态
      this.hoveredElement = elementId
      if (elementId) {
        UIEventPriority.updateUIElementState(elementId, { isHovered: true })
      }
    }
  }

  /**
   * 开始拖拽
   */
  private startDrag(eventData: UIEventData): void {
    this.dragState.isDragging = true
    this.dragState.currentPosition = eventData.position
    
    if (this.dragState.dragElement) {
      UIEventPriority.updateUIElementState(this.dragState.dragElement, { isDragging: true })
      
      // 分发拖拽开始事件
      this.dispatchEvent({
        ...eventData,
        type: UIEventType.DRAG_START,
        target: this.dragState.dragElement
      })
    }
  }

  /**
   * 更新拖拽
   */
  private updateDrag(eventData: UIEventData): void {
    this.dragState.currentPosition = eventData.position
    
    if (this.dragState.dragElement) {
      // 分发拖拽事件
      this.dispatchEvent({
        ...eventData,
        type: UIEventType.DRAG,
        target: this.dragState.dragElement
      })
    }
  }

  /**
   * 结束拖拽
   */
  private endDrag(eventData: UIEventData): void {
    if (this.dragState.dragElement) {
      UIEventPriority.updateUIElementState(this.dragState.dragElement, { isDragging: false })
      
      // 分发拖拽结束事件
      this.dispatchEvent({
        ...eventData,
        type: UIEventType.DRAG_END,
        target: this.dragState.dragElement
      })
    }
    
    // 重置拖拽状态
    this.dragState = {
      isDragging: false,
      dragElement: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dragData: null
    }
  }

  /**
   * 处理键盘导航
   */
  private handleKeyboardNavigation(eventData: UIEventData): void {
    if (eventData.type === UIEventType.KEY_DOWN) {
      switch (eventData.key) {
        case 'Tab':
          // Tab键切换焦点
          this.navigateFocus(eventData.shiftKey ? -1 : 1)
          eventData.preventDefault()
          break
        case 'Enter':
        case ' ':
          // 回车或空格键激活元素
          if (this.focusedElement) {
            this.dispatchEvent({
              ...eventData,
              type: UIEventType.CLICK,
              target: this.focusedElement
            })
          }
          break
      }
    }
  }

  /**
   * 导航焦点
   */
  private navigateFocus(direction: number): void {
    // 简化实现，实际应该根据UI元素的位置和层级进行智能导航
    const elements = Array.from(this.eventListeners.keys())
    if (elements.length === 0) return
    
    const currentIndex = this.focusedElement ? elements.indexOf(this.focusedElement) : -1
    let nextIndex = currentIndex + direction
    
    if (nextIndex < 0) nextIndex = elements.length - 1
    if (nextIndex >= elements.length) nextIndex = 0
    
    this.setFocus(elements[nextIndex])
  }

  /**
   * 获取配置
   */
  getConfig(): typeof this.config {
    return { ...this.config }
  }

  /**
   * 设置配置
   */
  setConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig)
  }

  /**
   * 销毁事件系统
   */
  destroy(): void {
    // 移除全局事件监听器
    document.removeEventListener('mousedown', this.handleMouseEvent.bind(this))
    document.removeEventListener('mouseup', this.handleMouseEvent.bind(this))
    document.removeEventListener('mousemove', this.handleMouseEvent.bind(this))
    // ... 其他事件监听器
    
    // 清理状态
    this.eventListeners.clear()
    this.globalEventListeners.clear()
    this.hoveredElement = null
    this.focusedElement = null
    this.pressedElements.clear()
    
    UIEventSystem.instance = null
  }
}
