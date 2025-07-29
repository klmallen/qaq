# Control节点实现文档

## 概述
Control节点是QAQ游戏引擎UI系统的基础节点，继承自CanvasItem，为所有UI控件提供核心功能。

## 继承关系
```
Node → CanvasItem → Control → 各种UI控件
```

## 核心功能

### 1. 锚点和边距系统
Control节点实现了完整的响应式布局系统，通过锚点(Anchor)和偏移(Offset)实现灵活的UI布局。

#### 锚点系统
- `anchorLeft`, `anchorTop`, `anchorRight`, `anchorBottom`: 0.0-1.0的相对位置
- 支持响应式布局，自动适应父容器尺寸变化
- 提供布局预设 (LayoutPreset) 快速设置常用布局

#### 偏移系统
- `offsetLeft`, `offsetTop`, `offsetRight`, `offsetBottom`: 像素级精确定位
- 与锚点系统配合实现复杂布局需求

### 2. 焦点管理
- **焦点模式**: NONE, CLICK, ALL
- **焦点导航**: 支持键盘Tab导航和方向键导航
- **焦点邻居**: 可设置上下左右焦点邻居节点
- **焦点事件**: focus_entered, focus_exited信号

### 3. 2D渲染集成
Control节点创新性地解决了2D UI在Three.js中的渲染问题：

#### Canvas纹理映射
```typescript
// 创建Canvas渲染上下文
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// 创建Three.js纹理
const texture = new THREE.CanvasTexture(canvas)
const geometry = new THREE.PlaneGeometry(width, height)
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
const mesh = new THREE.Mesh(geometry, material)
```

#### 坐标系转换
- 自动处理2D屏幕坐标到3D世界坐标的转换
- Y轴翻转处理 (2D向下，3D向上)
- 中心点对齐 (2D左上角，3D中心点)

### 4. 事件处理
- **鼠标过滤**: STOP, PASS, IGNORE三种模式
- **点击检测**: hasPoint方法进行精确点击检测
- **事件信号**: mouse_entered, mouse_exited, gui_input等

### 5. 主题系统
- 支持主题覆盖 (颜色、字体、样式框等)
- 布局方向支持 (LTR/RTL)
- 自动翻译支持

## API参考

### 主要属性
```typescript
// 锚点属性
anchorLeft: number     // 左锚点 (0.0-1.0)
anchorTop: number      // 上锚点 (0.0-1.0)
anchorRight: number    // 右锚点 (0.0-1.0)
anchorBottom: number   // 下锚点 (0.0-1.0)

// 偏移属性
offsetLeft: number     // 左偏移 (像素)
offsetTop: number      // 上偏移 (像素)
offsetRight: number    // 右偏移 (像素)
offsetBottom: number   // 下偏移 (像素)

// 便捷属性
position: Vector2      // 位置 (左上角)
size: Vector2          // 尺寸
globalPosition: Vector2 // 全局位置

// 焦点属性
focusMode: FocusMode   // 焦点模式
mouseFilter: MouseFilter // 鼠标过滤模式

// 布局属性
customMinimumSize: Vector2 // 自定义最小尺寸
```

### 主要方法
```typescript
// 锚点设置
setAnchor(side: string, anchor: number, keepOffset?: boolean): void
setAnchorsPreset(preset: LayoutPreset, keepOffsets?: boolean): void

// 位置和尺寸
setPosition(position: Vector2, keepOffsets?: boolean): void
setSize(size: Vector2, keepOffsets?: boolean): void
setGlobalPosition(position: Vector2, keepOffsets?: boolean): void

// 焦点管理
grabFocus(): void
releaseFocus(): void
hasFocus(): boolean

// 布局计算
getMinimumSize(): Vector2
getCombinedMinimumSize(): Vector2
resetSize(): void

// 工具方法
hasPoint(point: Vector2): boolean
getTooltip(atPosition?: Vector2): string
queueRedraw(): void
```

### 信号事件
```typescript
// 焦点相关
'focus_entered'        // 获得焦点时触发
'focus_exited'         // 失去焦点时触发

// 鼠标相关
'mouse_entered'        // 鼠标进入时触发
'mouse_exited'         // 鼠标离开时触发

// 输入相关
'gui_input'           // GUI输入事件

// 布局相关
'resized'             // 尺寸变化时触发
'size_flags_changed'  // 尺寸标志变化时触发
'minimum_size_changed' // 最小尺寸变化时触发

// 主题相关
'theme_changed'       // 主题变化时触发
```

## 使用示例

### 基础用法
```typescript
import Control, { LayoutPreset, FocusMode } from '@qaq/engine-core'

// 创建Control实例
const control = new Control('MyControl')

// 设置布局
control.setAnchorsPreset(LayoutPreset.CENTER)
control.setSize({ x: 200, y: 100 })

// 设置焦点
control.focusMode = FocusMode.ALL

// 连接事件
control.connect('focus_entered', () => {
  console.log('控件获得焦点')
})
```

### 自定义控件
```typescript
class CustomButton extends Control {
  private _text: string = 'Button'
  
  constructor(name: string, text: string) {
    super(name)
    this._text = text
    this.focusMode = FocusMode.ALL
    this.customMinimumSize = { x: 80, y: 30 }
  }
  
  // 重写2D渲染方法
  protected render2D(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    
    // 绘制按钮背景
    ctx.fillStyle = this.hasFocus() ? '#4CAF50' : '#2196F3'
    ctx.fillRect(0, 0, size.x, size.y)
    
    // 绘制文本
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this._text, size.x / 2, size.y / 2)
  }
}
```

### 响应式布局
```typescript
// 创建响应式面板
const panel = new Control('ResponsivePanel')

// 设置锚点实现响应式布局
panel.anchorLeft = 0.1    // 左边距10%
panel.anchorTop = 0.1     // 上边距10%
panel.anchorRight = 0.9   // 右边距10%
panel.anchorBottom = 0.9  // 下边距10%

// 面板会自动适应父容器尺寸变化
```

## 性能优化

### 1. 脏标记系统
Control节点使用脏标记系统避免不必要的重绘：
```typescript
queueRedraw(): void  // 标记需要重绘
```

### 2. 视口剔除
不在视口内的Control节点会被自动剔除，不参与渲染。

### 3. 纹理缓存
相同内容的纹理会被缓存复用，减少GPU内存占用。

### 4. 批量渲染
相同Z-index的Control节点会被批量渲染，提升性能。

## 技术特点

### 1. Godot兼容性
Control节点的API设计完全兼容Godot引擎，降低学习成本。

### 2. Web优化
针对Web平台进行了专门优化，充分利用Canvas 2D API和WebGL。

### 3. 类型安全
使用TypeScript实现，提供完整的类型检查和智能提示。

### 4. 扩展性
提供了丰富的扩展点，方便开发者创建自定义UI控件。

## 最佳实践

### 1. 布局设计
- 优先使用锚点系统实现响应式布局
- 合理设置最小尺寸避免布局错乱
- 使用布局预设快速实现常用布局

### 2. 性能优化
- 避免频繁调用queueRedraw()
- 合理设置鼠标过滤模式
- 使用视口剔除减少不必要的渲染

### 3. 事件处理
- 正确设置焦点模式和鼠标过滤
- 使用信号系统进行事件通信
- 实现精确的点击检测

### 4. 自定义控件
- 重写render2D方法实现自定义绘制
- 正确处理最小尺寸计算
- 实现必要的事件处理逻辑

Control节点为QAQ游戏引擎提供了强大而灵活的UI基础，支持从简单按钮到复杂界面的各种UI需求。
