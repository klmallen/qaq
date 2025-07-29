/**
 * QAQ游戏引擎 - Control UI基础节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有UI控件的基类，类似于Godot的Control节点
 * - 提供锚点和边距系统用于响应式布局
 * - 支持焦点管理和键盘导航
 * - 处理鼠标和触摸输入事件
 * - 提供主题系统支持
 * - 支持拖拽操作
 *
 * 继承关系:
 * Node -> CanvasItem -> Control -> 各种UI控件
 */

import CanvasItem from '../base/CanvasItem'
import type { Vector2, Rect2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Control相关枚举和接口
// ============================================================================

/**
 * 焦点模式枚举
 * 定义控件如何处理焦点
 */
export enum FocusMode {
  /** 无焦点 - 控件不能获得焦点 */
  NONE = 0,
  /** 点击焦点 - 只能通过鼠标点击获得焦点 */
  CLICK = 1,
  /** 全部焦点 - 可以通过鼠标点击和键盘导航获得焦点 */
  ALL = 2
}

/**
 * 鼠标过滤模式枚举
 * 定义控件如何处理鼠标事件
 */
export enum MouseFilter {
  /** 停止 - 处理鼠标事件并阻止传递给父节点 */
  STOP = 0,
  /** 传递 - 不处理鼠标事件，直接传递给父节点 */
  PASS = 1,
  /** 忽略 - 忽略鼠标事件，但不阻止子节点处理 */
  IGNORE = 2
}

/**
 * 增长方向枚举
 * 定义控件的增长方向
 */
export enum GrowDirection {
  /** 向开始方向增长 */
  BEGIN = 0,
  /** 向结束方向增长 */
  END = 1,
  /** 双向增长 */
  BOTH = 2
}

/**
 * 布局预设枚举
 * 定义常用的布局预设
 */
export enum LayoutPreset {
  /** 左上角 */
  TOP_LEFT = 0,
  /** 上方居中 */
  TOP_RIGHT = 1,
  /** 右上角 */
  TOP_WIDE = 2,
  /** 左侧居中 */
  CENTER_LEFT = 3,
  /** 居中 */
  CENTER = 4,
  /** 右侧居中 */
  CENTER_RIGHT = 5,
  /** 左下角 */
  BOTTOM_LEFT = 6,
  /** 下方居中 */
  BOTTOM_RIGHT = 7,
  /** 右下角 */
  BOTTOM_WIDE = 8,
  /** 左侧宽 */
  LEFT_WIDE = 9,
  /** 右侧宽 */
  RIGHT_WIDE = 10,
  /** 上方宽 */
  TOP_WIDE_ALT = 11,
  /** 下方宽 */
  HCENTER_WIDE = 12,
  /** 垂直居中宽 */
  VCENTER_WIDE = 13,
  /** 全屏 */
  FULL_RECT = 15
}

/**
 * 布局预设模式枚举
 * 定义布局预设的应用模式
 */
export enum LayoutPresetMode {
  /** 最小尺寸 */
  MINSIZE = 0,
  /** 保持宽度 */
  KEEP_WIDTH = 1,
  /** 保持高度 */
  KEEP_HEIGHT = 2,
  /** 保持尺寸 */
  KEEP_SIZE = 3
}

/**
 * 布局方向枚举
 * 定义文本和UI的布局方向
 */
export enum LayoutDirection {
  /** 继承父节点 */
  INHERITED = 0,
  /** 本地化 - 根据语言自动决定 */
  LOCALE = 1,
  /** 从左到右 */
  LTR = 2,
  /** 从右到左 */
  RTL = 3
}

/**
 * 文本方向枚举
 * 定义文本的显示方向
 */
export enum TextDirection {
  /** 自动 */
  AUTO = 0,
  /** 从左到右 */
  LTR = 1,
  /** 从右到左 */
  RTL = 2
}

/**
 * 锚点数据接口
 * 定义控件的锚点信息
 */
export interface AnchorData {
  /** 左锚点 (0.0-1.0) */
  left: number
  /** 上锚点 (0.0-1.0) */
  top: number
  /** 右锚点 (0.0-1.0) */
  right: number
  /** 下锚点 (0.0-1.0) */
  bottom: number
}

/**
 * 偏移数据接口
 * 定义控件的偏移信息
 */
export interface OffsetData {
  /** 左偏移 */
  left: number
  /** 上偏移 */
  top: number
  /** 右偏移 */
  right: number
  /** 下偏移 */
  bottom: number
}

/**
 * 主题覆盖数据接口
 * 定义主题属性的本地覆盖
 */
export interface ThemeOverrides {
  /** 颜色覆盖 */
  colors: { [key: string]: { r: number, g: number, b: number, a: number } }
  /** 常量覆盖 */
  constants: { [key: string]: number }
  /** 字体覆盖 */
  fonts: { [key: string]: any }
  /** 字体大小覆盖 */
  fontSizes: { [key: string]: number }
  /** 图标覆盖 */
  icons: { [key: string]: any }
  /** 样式框覆盖 */
  styleBoxes: { [key: string]: any }
}

// ============================================================================
// Control 基类实现
// ============================================================================

/**
 * Control 类 - 所有UI控件的基类
 *
 * 主要功能:
 * 1. 锚点和边距系统 - 响应式布局
 * 2. 焦点管理 - 键盘导航支持
 * 3. 输入事件处理 - 鼠标、键盘、触摸
 * 4. 主题系统 - 外观定制
 * 5. 拖拽操作 - 拖放功能
 * 6. 布局计算 - 自动布局和尺寸计算
 */
export class Control extends CanvasItem {
  // ========================================================================
  // 私有属性 - 布局系统
  // ========================================================================

  /** 锚点数据 - 定义控件相对于父控件的锚定位置 */
  private _anchors: AnchorData = { left: 0, top: 0, right: 0, bottom: 0 }

  /** 偏移数据 - 定义控件相对于锚点的偏移 */
  private _offsets: OffsetData = { left: 0, top: 0, right: 0, bottom: 0 }

  /** 增长方向 - 水平和垂直增长方向 */
  private _growHorizontal: GrowDirection = GrowDirection.END
  private _growVertical: GrowDirection = GrowDirection.END

  /** 自定义最小尺寸 */
  private _customMinimumSize: Vector2 = { x: 0, y: 0 }

  /** 布局方向 */
  private _layoutDirection: LayoutDirection = LayoutDirection.INHERITED

  /** 是否自动翻转 */
  private _autoTranslate: boolean = true

  // ========================================================================
  // 私有属性 - 焦点和输入系统
  // ========================================================================

  /** 焦点模式 */
  private _focusMode: FocusMode = FocusMode.NONE

  /** 鼠标过滤模式 */
  private _mouseFilter: MouseFilter = MouseFilter.STOP

  /** 鼠标默认光标形状 */
  private _defaultCursorShape: number = 0

  /** 焦点邻居节点路径 */
  private _focusNeighbors: { [key: string]: string } = {
    left: '',
    top: '',
    right: '',
    bottom: ''
  }

  /** 下一个焦点节点路径 */
  private _focusNext: string = ''

  /** 上一个焦点节点路径 */
  private _focusPrevious: string = ''

  // ========================================================================
  // 私有属性 - 主题系统
  // ========================================================================

  /** 主题对象 */
  private _theme: any = null

  /** 主题类型变体 */
  private _themeTypeVariation: string = ''

  /** 主题覆盖数据 */
  private _themeOverrides: ThemeOverrides = {
    colors: {},
    constants: {},
    fonts: {},
    fontSizes: {},
    icons: {},
    styleBoxes: {}
  }

  // ========================================================================
  // 私有属性 - 状态管理
  // ========================================================================

  /** 是否剪裁内容 */
  private _clipContents: boolean = false

  /** 工具提示文本 */
  private _tooltipText: string = ''

  /** 是否有焦点 */
  private _hasFocus: boolean = false

  /** 最小尺寸缓存 */
  private _minimumSizeCache: Vector2 | null = null

  /** 最小尺寸是否有效 */
  private _minimumSizeValid: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称，默认为'Control'
   */
  constructor(name: string = 'Control') {
    super(name)

    // 初始化Control特有的信号
    this.initializeControlSignals()

    // 初始化Control特有的属性
    this.initializeControlProperties()

    // 监听父节点变化，重新计算布局
    this.connect('tree_entered', () => {
      this.invalidateMinimumSize()
      this.updateLayout()
    })

    // 监听尺寸变化
    this.connect('resized', () => {
      this.invalidateMinimumSize()
    })
  }

  /**
   * 初始化Control特有的信号
   * 这些信号用于通知UI状态的变化
   */
  private initializeControlSignals(): void {
    // 焦点相关信号
    this.addSignal('focus_entered')
    this.addSignal('focus_exited')

    // 鼠标相关信号
    this.addSignal('mouse_entered')
    this.addSignal('mouse_exited')

    // 输入相关信号
    this.addSignal('gui_input')

    // 布局相关信号
    this.addSignal('resized')
    this.addSignal('size_flags_changed')
    this.addSignal('minimum_size_changed')

    // 主题相关信号
    this.addSignal('theme_changed')
  }

  /**
   * 初始化Control特有的属性
   * 这些属性可以在编辑器中修改
   */
  private initializeControlProperties(): void {
    const properties: PropertyInfo[] = [
      // 布局属性
      {
        name: 'anchor_left',
        type: 'float',
        hint: '左锚点 (0.0-1.0)'
      },
      {
        name: 'anchor_top',
        type: 'float',
        hint: '上锚点 (0.0-1.0)'
      },
      {
        name: 'anchor_right',
        type: 'float',
        hint: '右锚点 (0.0-1.0)'
      },
      {
        name: 'anchor_bottom',
        type: 'float',
        hint: '下锚点 (0.0-1.0)'
      },
      {
        name: 'offset_left',
        type: 'int',
        hint: '左偏移'
      },
      {
        name: 'offset_top',
        type: 'int',
        hint: '上偏移'
      },
      {
        name: 'offset_right',
        type: 'int',
        hint: '右偏移'
      },
      {
        name: 'offset_bottom',
        type: 'int',
        hint: '下偏移'
      },
      {
        name: 'grow_horizontal',
        type: 'enum',
        hint: '水平增长方向',
        className: 'GrowDirection'
      },
      {
        name: 'grow_vertical',
        type: 'enum',
        hint: '垂直增长方向',
        className: 'GrowDirection'
      },
      {
        name: 'custom_minimum_size',
        type: 'vector2',
        hint: '自定义最小尺寸'
      },
      {
        name: 'layout_direction',
        type: 'enum',
        hint: '布局方向',
        className: 'LayoutDirection'
      },

      // 焦点和输入属性
      {
        name: 'focus_mode',
        type: 'enum',
        hint: '焦点模式',
        className: 'FocusMode'
      },
      {
        name: 'mouse_filter',
        type: 'enum',
        hint: '鼠标过滤模式',
        className: 'MouseFilter'
      },
      {
        name: 'focus_neighbor_left',
        type: 'node_path',
        hint: '左侧焦点邻居'
      },
      {
        name: 'focus_neighbor_top',
        type: 'node_path',
        hint: '上方焦点邻居'
      },
      {
        name: 'focus_neighbor_right',
        type: 'node_path',
        hint: '右侧焦点邻居'
      },
      {
        name: 'focus_neighbor_bottom',
        type: 'node_path',
        hint: '下方焦点邻居'
      },
      {
        name: 'focus_next',
        type: 'node_path',
        hint: '下一个焦点节点'
      },
      {
        name: 'focus_previous',
        type: 'node_path',
        hint: '上一个焦点节点'
      },

      // 外观属性
      {
        name: 'theme',
        type: 'resource',
        hint: '主题资源',
        className: 'Theme'
      },
      {
        name: 'theme_type_variation',
        type: 'string',
        hint: '主题类型变体'
      },
      {
        name: 'clip_contents',
        type: 'bool',
        hint: '是否剪裁内容'
      },
      {
        name: 'tooltip_text',
        type: 'string',
        hint: '工具提示文本'
      },
      {
        name: 'auto_translate',
        type: 'bool',
        hint: '是否自动翻译'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器 - 锚点系统
  // ========================================================================

  /**
   * 获取左锚点
   * @returns 左锚点值 (0.0-1.0)
   */
  get anchorLeft(): number {
    return this._anchors.left
  }

  /**
   * 设置左锚点
   * @param value 左锚点值 (0.0-1.0)
   */
  set anchorLeft(value: number) {
    this.setAnchor('left', value)
  }

  /**
   * 获取上锚点
   * @returns 上锚点值 (0.0-1.0)
   */
  get anchorTop(): number {
    return this._anchors.top
  }

  /**
   * 设置上锚点
   * @param value 上锚点值 (0.0-1.0)
   */
  set anchorTop(value: number) {
    this.setAnchor('top', value)
  }

  /**
   * 获取右锚点
   * @returns 右锚点值 (0.0-1.0)
   */
  get anchorRight(): number {
    return this._anchors.right
  }

  /**
   * 设置右锚点
   * @param value 右锚点值 (0.0-1.0)
   */
  set anchorRight(value: number) {
    this.setAnchor('right', value)
  }

  /**
   * 获取下锚点
   * @returns 下锚点值 (0.0-1.0)
   */
  get anchorBottom(): number {
    return this._anchors.bottom
  }

  /**
   * 设置下锚点
   * @param value 下锚点值 (0.0-1.0)
   */
  set anchorBottom(value: number) {
    this.setAnchor('bottom', value)
  }

  // ========================================================================
  // 公共属性访问器 - 偏移系统
  // ========================================================================

  /**
   * 获取左偏移
   * @returns 左偏移值
   */
  get offsetLeft(): number {
    return this._offsets.left
  }

  /**
   * 设置左偏移
   * @param value 左偏移值
   */
  set offsetLeft(value: number) {
    this.setOffset('left', value)
  }

  /**
   * 获取上偏移
   * @returns 上偏移值
   */
  get offsetTop(): number {
    return this._offsets.top
  }

  /**
   * 设置上偏移
   * @param value 上偏移值
   */
  set offsetTop(value: number) {
    this.setOffset('top', value)
  }

  /**
   * 获取右偏移
   * @returns 右偏移值
   */
  get offsetRight(): number {
    return this._offsets.right
  }

  /**
   * 设置右偏移
   * @param value 右偏移值
   */
  set offsetRight(value: number) {
    this.setOffset('right', value)
  }

  /**
   * 获取下偏移
   * @returns 下偏移值
   */
  get offsetBottom(): number {
    return this._offsets.bottom
  }

  /**
   * 设置下偏移
   * @param value 下偏移值
   */
  set offsetBottom(value: number) {
    this.setOffset('bottom', value)
  }

  /**
   * 获取位置 (左上角坐标)
   * @returns 位置向量
   */
  get position(): Vector2 {
    return { x: this.offsetLeft, y: this.offsetTop }
  }

  /**
   * 设置位置 (左上角坐标)
   * @param value 位置向量
   */
  set position(value: Vector2) {
    this.setPosition(value)
  }

  /**
   * 获取尺寸
   * @returns 尺寸向量
   */
  get size(): Vector2 {
    return {
      x: this.offsetRight - this.offsetLeft,
      y: this.offsetBottom - this.offsetTop
    }
  }

  /**
   * 设置尺寸
   * @param value 尺寸向量
   */
  set size(value: Vector2) {
    this.setSize(value)
  }

  /**
   * 获取全局位置
   * @returns 全局位置向量
   */
  get globalPosition(): Vector2 {
    return this.getGlobalPosition()
  }

  /**
   * 设置全局位置
   * @param value 全局位置向量
   */
  set globalPosition(value: Vector2) {
    this.setGlobalPosition(value)
  }

  // ========================================================================
  // 公共属性访问器 - 其他属性
  // ========================================================================

  /**
   * 获取焦点模式
   * @returns 焦点模式
   */
  get focusMode(): FocusMode {
    return this._focusMode
  }

  /**
   * 设置焦点模式
   * @param value 焦点模式
   */
  set focusMode(value: FocusMode) {
    this._focusMode = value
  }

  /**
   * 获取鼠标过滤模式
   * @returns 鼠标过滤模式
   */
  get mouseFilter(): MouseFilter {
    return this._mouseFilter
  }

  /**
   * 设置鼠标过滤模式
   * @param value 鼠标过滤模式
   */
  set mouseFilter(value: MouseFilter) {
    this._mouseFilter = value
  }

  /**
   * 获取自定义最小尺寸
   * @returns 自定义最小尺寸
   */
  get customMinimumSize(): Vector2 {
    return { ...this._customMinimumSize }
  }

  /**
   * 设置自定义最小尺寸
   * @param value 自定义最小尺寸
   */
  set customMinimumSize(value: Vector2) {
    this._customMinimumSize = { ...value }
    this.invalidateMinimumSize()
    this.updateLayout()
  }

  /**
   * 获取工具提示文本
   * @returns 工具提示文本
   */
  get tooltipText(): string {
    return this._tooltipText
  }

  /**
   * 设置工具提示文本
   * @param value 工具提示文本
   */
  set tooltipText(value: string) {
    this._tooltipText = value
  }

  // ========================================================================
  // 核心布局方法
  // ========================================================================

  /**
   * 设置锚点
   * @param side 边 ('left' | 'top' | 'right' | 'bottom')
   * @param anchor 锚点值 (0.0-1.0)
   * @param keepOffset 是否保持偏移
   * @param pushOppositeAnchor 是否推动对面锚点
   */
  setAnchor(side: string, anchor: number, keepOffset: boolean = false, pushOppositeAnchor: boolean = true): void {
    // 限制锚点值在0-1之间
    anchor = Math.max(0, Math.min(1, anchor))

    const oldAnchor = (this._anchors as any)[side]
    if (oldAnchor === anchor) return

    // 更新锚点值
    (this._anchors as any)[side] = anchor

    // 如果需要推动对面锚点
    if (pushOppositeAnchor) {
      const oppositeSide = this.getOppositeSide(side)
      const oppositeAnchor = (this._anchors as any)[oppositeSide]

      if ((side === 'left' || side === 'top') && anchor > oppositeAnchor) {
        (this._anchors as any)[oppositeSide] = anchor
      } else if ((side === 'right' || side === 'bottom') && anchor < oppositeAnchor) {
        (this._anchors as any)[oppositeSide] = anchor
      }
    }

    // 如果不保持偏移，重新计算偏移
    if (!keepOffset) {
      this.updateOffsetsFromAnchors()
    }

    this.updateLayout()
  }

  /**
   * 设置偏移
   * @param side 边 ('left' | 'top' | 'right' | 'bottom')
   * @param offset 偏移值
   */
  setOffset(side: string, offset: number): void {
    const oldOffset = (this._offsets as any)[side]
    if (oldOffset === offset) return

    (this._offsets as any)[side] = offset
    this.updateLayout()
    this.emit('resized')
  }

  /**
   * 设置位置
   * @param position 位置向量
   * @param keepOffsets 是否保持偏移
   */
  setPosition(position: Vector2, keepOffsets: boolean = false): void {
    if (keepOffsets) {
      // 通过调整锚点来移动位置
      const parentSize = this.getParentAreaSize()
      if (parentSize.x > 0 && parentSize.y > 0) {
        const deltaX = position.x - this.offsetLeft
        const deltaY = position.y - this.offsetTop

        this._anchors.left += deltaX / parentSize.x
        this._anchors.right += deltaX / parentSize.x
        this._anchors.top += deltaY / parentSize.y
        this._anchors.bottom += deltaY / parentSize.y
      }
    } else {
      // 直接设置偏移
      const deltaX = position.x - this.offsetLeft
      const deltaY = position.y - this.offsetTop

      this._offsets.left = position.x
      this._offsets.top = position.y
      this._offsets.right += deltaX
      this._offsets.bottom += deltaY
    }

    this.updateLayout()
    this.emit('resized')
  }

  /**
   * 设置尺寸
   * @param size 尺寸向量
   * @param keepOffsets 是否保持偏移
   */
  setSize(size: Vector2, keepOffsets: boolean = false): void {
    if (keepOffsets) {
      // 通过调整锚点来改变尺寸
      const parentSize = this.getParentAreaSize()
      if (parentSize.x > 0 && parentSize.y > 0) {
        const currentSize = this.size
        const deltaWidth = size.x - currentSize.x
        const deltaHeight = size.y - currentSize.y

        // 根据增长方向调整锚点
        if (this._growHorizontal === GrowDirection.BEGIN) {
          this._anchors.left -= deltaWidth / parentSize.x
        } else if (this._growHorizontal === GrowDirection.END) {
          this._anchors.right += deltaWidth / parentSize.x
        } else if (this._growHorizontal === GrowDirection.BOTH) {
          this._anchors.left -= deltaWidth / (2 * parentSize.x)
          this._anchors.right += deltaWidth / (2 * parentSize.x)
        }

        if (this._growVertical === GrowDirection.BEGIN) {
          this._anchors.top -= deltaHeight / parentSize.y
        } else if (this._growVertical === GrowDirection.END) {
          this._anchors.bottom += deltaHeight / parentSize.y
        } else if (this._growVertical === GrowDirection.BOTH) {
          this._anchors.top -= deltaHeight / (2 * parentSize.y)
          this._anchors.bottom += deltaHeight / (2 * parentSize.y)
        }
      }
    } else {
      // 直接设置偏移
      this._offsets.right = this._offsets.left + size.x
      this._offsets.bottom = this._offsets.top + size.y
    }

    this.updateLayout()
    this.emit('resized')
  }

  /**
   * 设置全局位置
   * @param position 全局位置向量
   * @param keepOffsets 是否保持偏移
   */
  setGlobalPosition(position: Vector2, keepOffsets: boolean = false): void {
    const parent = this.parent
    if (parent && parent instanceof Control) {
      const parentGlobalPos = parent.getGlobalPosition()
      const localPos = {
        x: position.x - parentGlobalPos.x,
        y: position.y - parentGlobalPos.y
      }
      this.setPosition(localPos, keepOffsets)
    } else {
      this.setPosition(position, keepOffsets)
    }
  }

  /**
   * 获取全局位置
   * @returns 全局位置向量
   */
  getGlobalPosition(): Vector2 {
    const parent = this.parent
    if (parent && parent instanceof Control) {
      const parentGlobalPos = parent.getGlobalPosition()
      return {
        x: parentGlobalPos.x + this.offsetLeft,
        y: parentGlobalPos.y + this.offsetTop
      }
    }
    return this.position
  }

  // ========================================================================
  // 布局辅助方法
  // ========================================================================

  /**
   * 获取对面的边
   * @param side 边名称
   * @returns 对面的边名称
   */
  private getOppositeSide(side: string): string {
    const opposites: { [key: string]: string } = {
      'left': 'right',
      'right': 'left',
      'top': 'bottom',
      'bottom': 'top'
    }
    return opposites[side] || side
  }

  /**
   * 从锚点更新偏移
   */
  private updateOffsetsFromAnchors(): void {
    const parentSize = this.getParentAreaSize()
    const currentSize = this.size

    this._offsets.left = this._anchors.left * parentSize.x
    this._offsets.top = this._anchors.top * parentSize.y
    this._offsets.right = this._anchors.right * parentSize.x
    this._offsets.bottom = this._anchors.bottom * parentSize.y

    // 如果锚点重叠，保持当前尺寸
    if (this._anchors.left === this._anchors.right) {
      this._offsets.right = this._offsets.left + currentSize.x
    }
    if (this._anchors.top === this._anchors.bottom) {
      this._offsets.bottom = this._offsets.top + currentSize.y
    }
  }

  /**
   * 获取父节点区域尺寸
   * @returns 父节点区域尺寸
   */
  private getParentAreaSize(): Vector2 {
    const parent = this.parent
    if (parent && parent instanceof Control) {
      return parent.size
    }

    // 如果没有父Control节点，返回视口尺寸
    return { x: 1920, y: 1080 } // 默认尺寸，实际应该从视口获取
  }

  /**
   * 更新布局
   */
  private updateLayout(): void {
    // 标记需要重新计算最小尺寸
    this.invalidateMinimumSize()

    // 递归更新子节点布局
    for (const child of this.children) {
      if (child instanceof Control) {
        child.updateLayout()
      }
    }
  }

  /**
   * 使最小尺寸无效
   */
  private invalidateMinimumSize(): void {
    this._minimumSizeValid = false
    this._minimumSizeCache = null
    this.emit('minimum_size_changed')
  }

  /**
   * 获取最小尺寸
   * @returns 最小尺寸向量
   */
  getMinimumSize(): Vector2 {
    if (!this._minimumSizeValid || !this._minimumSizeCache) {
      this._minimumSizeCache = this.calculateMinimumSize()
      this._minimumSizeValid = true
    }
    return { ...this._minimumSizeCache }
  }

  /**
   * 计算最小尺寸 - 子类可重写
   * @returns 计算出的最小尺寸
   */
  protected calculateMinimumSize(): Vector2 {
    // 基类返回自定义最小尺寸
    return { ...this._customMinimumSize }
  }

  /**
   * 获取组合最小尺寸
   * @returns 组合最小尺寸（包含主题样式）
   */
  getCombinedMinimumSize(): Vector2 {
    const minSize = this.getMinimumSize()

    // 这里应该加上主题样式的边距，暂时返回基础最小尺寸
    return minSize
  }

  // ========================================================================
  // 焦点管理方法
  // ========================================================================

  /**
   * 获取焦点
   */
  grabFocus(): void {
    if (this._focusMode === FocusMode.NONE) return

    // 释放当前焦点节点的焦点
    const currentFocus = this.getCurrentFocusOwner()
    if (currentFocus && currentFocus !== this) {
      currentFocus.releaseFocus()
    }

    this._hasFocus = true
    this.emit('focus_entered')
  }

  /**
   * 释放焦点
   */
  releaseFocus(): void {
    if (!this._hasFocus) return

    this._hasFocus = false
    this.emit('focus_exited')
  }

  /**
   * 检查是否有焦点
   * @returns 是否有焦点
   */
  hasFocus(): boolean {
    return this._hasFocus
  }

  /**
   * 获取当前焦点拥有者 - 需要从场景树获取
   * @returns 当前焦点拥有者或null
   */
  private getCurrentFocusOwner(): Control | null {
    // 这里应该从场景树或视口获取当前焦点节点
    // 暂时返回null，实际实现需要与场景系统集成
    return null
  }

  // ========================================================================
  // 2D渲染集成 - Three.js适配
  // ========================================================================

  /**
   * 创建2D渲染上下文
   * 为Control节点创建专门的2D渲染层
   */
  private create2DRenderContext(): void {
    // 创建HTML Canvas元素用于2D渲染
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // 设置canvas尺寸
    const size = this.size
    canvas.width = size.x
    canvas.height = size.y

    // 创建Three.js纹理
    const texture = new (window as any).THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    // 创建材质和几何体
    const geometry = new (window as any).THREE.PlaneGeometry(size.x, size.y)
    const material = new (window as any).THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1
    })

    // 创建网格对象
    const mesh = new (window as any).THREE.Mesh(geometry, material)

    // 设置位置（转换为Three.js坐标系）
    const globalPos = this.getGlobalPosition()
    mesh.position.set(
      globalPos.x - size.x / 2, // Three.js中心点在中间
      -(globalPos.y - size.y / 2), // Y轴翻转
      0.1 // 稍微向前，避免Z-fighting
    )

    // 存储渲染上下文
    (this as any)._renderContext = {
      canvas,
      context: ctx,
      texture,
      mesh,
      needsUpdate: true
    }
  }

  /**
   * 更新2D渲染
   */
  private update2DRender(): void {
    const renderContext = (this as any)._renderContext
    if (!renderContext) {
      this.create2DRenderContext()
      return
    }

    if (!renderContext.needsUpdate) return

    const { canvas, context, texture, mesh } = renderContext
    const size = this.size

    // 更新canvas尺寸
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x
      canvas.height = size.y

      // 更新几何体
      mesh.geometry.dispose()
      mesh.geometry = new (window as any).THREE.PlaneGeometry(size.x, size.y)
    }

    // 清空canvas
    context.clearRect(0, 0, size.x, size.y)

    // 绘制Control内容
    this.render2D(context)

    // 更新纹理
    texture.needsUpdate = true

    // 更新位置
    const globalPos = this.getGlobalPosition()
    mesh.position.set(
      globalPos.x - size.x / 2,
      -(globalPos.y - size.y / 2),
      0.1
    )

    renderContext.needsUpdate = false
  }

  /**
   * 2D渲染方法 - 子类重写
   * @param ctx Canvas 2D渲染上下文
   */
  protected render2D(ctx: CanvasRenderingContext2D): void {
    // 基类绘制背景色（如果有主题）
    const size = this.size

    // 绘制调试边框
    if (process.env.NODE_ENV === 'development') {
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, size.x, size.y)
    }
  }

  /**
   * 获取Three.js渲染网格
   * @returns Three.js网格对象
   */
  getRenderMesh(): any {
    const renderContext = (this as any)._renderContext
    if (!renderContext) {
      this.create2DRenderContext()
      return (this as any)._renderContext?.mesh
    }
    return renderContext.mesh
  }

  // ========================================================================
  // 生命周期方法重写
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  public _enterTree(): void {
    super._enterTree()

    // 创建2D渲染上下文
    this.create2DRenderContext()

    // 更新布局
    this.updateLayout()
  }

  /**
   * 节点退出场景树时调用
   */
  public _exitTree(): void {
    super._exitTree()

    // 清理2D渲染资源
    const renderContext = (this as any)._renderContext
    if (renderContext) {
      renderContext.mesh.geometry.dispose()
      renderContext.mesh.material.dispose()
      renderContext.texture.dispose()
      delete (this as any)._renderContext
    }

    // 释放焦点
    this.releaseFocus()
  }

  /**
   * 每帧更新时调用
   * @param delta 时间增量（秒）
   */
  public _process(delta: number): void {
    super._process(delta)

    // 更新2D渲染
    this.update2DRender()
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 设置锚点预设
   * @param preset 布局预设
   * @param keepOffsets 是否保持偏移
   */
  setAnchorsPreset(preset: LayoutPreset, keepOffsets: boolean = false): void {
    const presetData = this.getPresetData(preset)

    this._anchors.left = presetData.left
    this._anchors.top = presetData.top
    this._anchors.right = presetData.right
    this._anchors.bottom = presetData.bottom

    if (!keepOffsets) {
      this.updateOffsetsFromAnchors()
    }

    this.updateLayout()
  }

  /**
   * 获取预设数据
   * @param preset 布局预设
   * @returns 锚点数据
   */
  private getPresetData(preset: LayoutPreset): AnchorData {
    switch (preset) {
      case LayoutPreset.TOP_LEFT:
        return { left: 0, top: 0, right: 0, bottom: 0 }
      case LayoutPreset.TOP_RIGHT:
        return { left: 1, top: 0, right: 1, bottom: 0 }
      case LayoutPreset.BOTTOM_LEFT:
        return { left: 0, top: 1, right: 0, bottom: 1 }
      case LayoutPreset.BOTTOM_RIGHT:
        return { left: 1, top: 1, right: 1, bottom: 1 }
      case LayoutPreset.CENTER:
        return { left: 0.5, top: 0.5, right: 0.5, bottom: 0.5 }
      case LayoutPreset.LEFT_WIDE:
        return { left: 0, top: 0, right: 0, bottom: 1 }
      case LayoutPreset.RIGHT_WIDE:
        return { left: 1, top: 0, right: 1, bottom: 1 }
      case LayoutPreset.TOP_WIDE:
        return { left: 0, top: 0, right: 1, bottom: 0 }
      case LayoutPreset.BOTTOM_WIDE:
        return { left: 0, top: 1, right: 1, bottom: 1 }
      case LayoutPreset.VCENTER_WIDE:
        return { left: 0, top: 0.5, right: 1, bottom: 0.5 }
      case LayoutPreset.HCENTER_WIDE:
        return { left: 0.5, top: 0, right: 0.5, bottom: 1 }
      case LayoutPreset.FULL_RECT:
        return { left: 0, top: 0, right: 1, bottom: 1 }
      default:
        return { left: 0, top: 0, right: 0, bottom: 0 }
    }
  }

  /**
   * 重置尺寸到最小尺寸
   */
  resetSize(): void {
    const minSize = this.getCombinedMinimumSize()
    this.setSize(minSize)
  }

  /**
   * 检查点是否在控件内
   * @param point 点坐标
   * @returns 是否在控件内
   */
  hasPoint(point: Vector2): boolean {
    const pos = this.position
    const size = this.size

    return point.x >= pos.x &&
           point.x <= pos.x + size.x &&
           point.y >= pos.y &&
           point.y <= pos.y + size.y
  }

  /**
   * 获取工具提示
   * @param atPosition 位置（可选）
   * @returns 工具提示文本
   */
  getTooltip(atPosition?: Vector2): string {
    return this._tooltipText
  }

  /**
   * 检查是否为布局从右到左
   * @returns 是否为RTL布局
   */
  isLayoutRtl(): boolean {
    if (this._layoutDirection === LayoutDirection.RTL) {
      return true
    } else if (this._layoutDirection === LayoutDirection.LTR) {
      return false
    } else if (this._layoutDirection === LayoutDirection.INHERITED) {
      const parent = this.parent
      if (parent && parent instanceof Control) {
        return parent.isLayoutRtl()
      }
    }

    // 默认为LTR
    return false
  }

  /**
   * 标记需要重新绘制
   */
  queueRedraw(): void {
    const renderContext = (this as any)._renderContext
    if (renderContext) {
      renderContext.needsUpdate = true
    }
  }

  /**
   * 获取边界矩形（重写CanvasItem方法）
   * @returns 边界矩形
   */
  protected getBounds(): Rect2 {
    return {
      position: this.position,
      size: this.size
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Control
