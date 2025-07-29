# Button2D API 文档

Button2D是QAQ游戏引擎中的2D按钮控件，继承自[Node2D](/api/nodes/node2d)，提供完整的按钮交互功能。

## 类定义

```typescript
class Button2D extends Node2D {
  constructor(name?: string, options?: Button2DOptions)
  
  // 文本属性
  text: string
  fontSize: number
  fontFamily: string
  textColor: Color
  textAlign: TextAlign
  
  // 按钮状态
  disabled: boolean
  pressed: boolean
  hovered: boolean
  focused: boolean
  
  // 尺寸属性
  width: number
  height: number
  autoSize: boolean
  
  // 样式属性
  backgroundColor: Color
  borderColor: Color
  borderWidth: number
  borderRadius: number
  
  // 状态样式
  normalStyle: ButtonStyle
  hoverStyle: ButtonStyle
  pressedStyle: ButtonStyle
  disabledStyle: ButtonStyle
  
  // 图标属性
  icon: THREE.Texture | null
  iconPosition: IconPosition
  iconSize: Vector2
  iconOffset: Vector2
  
  // 方法
  setStyle(state: ButtonState, style: ButtonStyle): void
  getStyle(state: ButtonState): ButtonStyle
  setSize(width: number, height: number): void
  setIcon(texture: THREE.Texture | string, position?: IconPosition): void
  removeIcon(): void
  
  // 交互方法
  click(): void
  press(): void
  release(): void
  setHover(hovered: boolean): void
  setFocus(focused: boolean): void
  
  // 工具方法
  getTextBounds(): Rect2
  isPointInside(x: number, y: number): boolean
  updateAppearance(): void
}
```

## 构造函数

### constructor()

创建一个新的Button2D实例。

```typescript
constructor(name?: string, options?: Button2DOptions)
```

**参数**
- `name?: string` - 按钮名称，默认为"Button2D"
- `options?: Button2DOptions` - 按钮配置选项

**Button2DOptions接口**
```typescript
interface Button2DOptions {
  text?: string                    // 按钮文本
  width?: number                   // 按钮宽度
  height?: number                  // 按钮高度
  fontSize?: number                // 字体大小
  fontFamily?: string              // 字体族
  textColor?: Color                // 文本颜色
  backgroundColor?: Color          // 背景色
  borderColor?: Color              // 边框色
  borderWidth?: number             // 边框宽度
  borderRadius?: number            // 圆角半径
  disabled?: boolean               // 是否禁用
  autoSize?: boolean               // 自动调整大小
}
```

**示例**
```typescript
// 基础创建
const button = new Button2D('PlayButton')

// 带选项创建
const button = new Button2D('PlayButton', {
  text: '开始游戏',
  width: 120,
  height: 40,
  fontSize: 16,
  backgroundColor: { r: 0.2, g: 0.6, b: 1.0, a: 1.0 },
  borderRadius: 8
})
```

## 文本属性

### text

按钮显示的文本。

```typescript
text: string
```

**示例**
```typescript
button.text = '点击我'
```

### fontSize

文本字体大小。

```typescript
fontSize: number
```

**示例**
```typescript
button.fontSize = 18
```

### fontFamily

文本字体族。

```typescript
fontFamily: string
```

**示例**
```typescript
button.fontFamily = 'Arial, sans-serif'
```

### textColor

文本颜色。

```typescript
textColor: Color
```

**Color接口**
```typescript
interface Color {
  r: number  // 红色分量 (0-1)
  g: number  // 绿色分量 (0-1)
  b: number  // 蓝色分量 (0-1)
  a: number  // 透明度 (0-1)
}
```

**示例**
```typescript
button.textColor = { r: 1, g: 1, b: 1, a: 1 } // 白色
```

### textAlign

文本对齐方式。

```typescript
textAlign: TextAlign
```

**TextAlign枚举**
```typescript
type TextAlign = 'LEFT' | 'CENTER' | 'RIGHT'
```

**示例**
```typescript
button.textAlign = 'CENTER'
```

## 按钮状态

### disabled

按钮是否禁用。

```typescript
disabled: boolean
```

**示例**
```typescript
button.disabled = true // 禁用按钮
```

### pressed

按钮是否被按下（只读）。

```typescript
readonly pressed: boolean
```

### hovered

鼠标是否悬停在按钮上（只读）。

```typescript
readonly hovered: boolean
```

### focused

按钮是否获得焦点（只读）。

```typescript
readonly focused: boolean
```

## 尺寸属性

### width

按钮宽度。

```typescript
width: number
```

**示例**
```typescript
button.width = 150
```

### height

按钮高度。

```typescript
height: number
```

**示例**
```typescript
button.height = 50
```

### autoSize

是否根据文本自动调整大小。

```typescript
autoSize: boolean
```

**示例**
```typescript
button.autoSize = true
```

## 样式属性

### backgroundColor

背景颜色。

```typescript
backgroundColor: Color
```

**示例**
```typescript
button.backgroundColor = { r: 0.3, g: 0.3, b: 0.8, a: 1.0 }
```

### borderColor

边框颜色。

```typescript
borderColor: Color
```

### borderWidth

边框宽度。

```typescript
borderWidth: number
```

**示例**
```typescript
button.borderWidth = 2
```

### borderRadius

圆角半径。

```typescript
borderRadius: number
```

**示例**
```typescript
button.borderRadius = 10
```

## 状态样式

### normalStyle

正常状态样式。

```typescript
normalStyle: ButtonStyle
```

### hoverStyle

悬停状态样式。

```typescript
hoverStyle: ButtonStyle
```

### pressedStyle

按下状态样式。

```typescript
pressedStyle: ButtonStyle
```

### disabledStyle

禁用状态样式。

```typescript
disabledStyle: ButtonStyle
```

**ButtonStyle接口**
```typescript
interface ButtonStyle {
  backgroundColor?: Color
  textColor?: Color
  borderColor?: Color
  borderWidth?: number
  borderRadius?: number
  scale?: number
  opacity?: number
}
```

**示例**
```typescript
button.hoverStyle = {
  backgroundColor: { r: 0.4, g: 0.4, b: 0.9, a: 1.0 },
  scale: 1.05
}
```

## 图标属性

### icon

按钮图标纹理。

```typescript
icon: THREE.Texture | null
```

### iconPosition

图标位置。

```typescript
iconPosition: IconPosition
```

**IconPosition枚举**
```typescript
type IconPosition = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
```

### iconSize

图标尺寸。

```typescript
iconSize: Vector2
```

### iconOffset

图标偏移量。

```typescript
iconOffset: Vector2
```

## 样式方法

### setStyle()

设置指定状态的样式。

```typescript
setStyle(state: ButtonState, style: ButtonStyle): void
```

**参数**
- `state: ButtonState` - 按钮状态
- `style: ButtonStyle` - 样式对象

**ButtonState枚举**
```typescript
type ButtonState = 'NORMAL' | 'HOVER' | 'PRESSED' | 'DISABLED'
```

**示例**
```typescript
button.setStyle('HOVER', {
  backgroundColor: { r: 0.5, g: 0.5, b: 1.0, a: 1.0 },
  scale: 1.1
})
```

### getStyle()

获取指定状态的样式。

```typescript
getStyle(state: ButtonState): ButtonStyle
```

**参数**
- `state: ButtonState` - 按钮状态

**返回值**
- `ButtonStyle` - 样式对象

## 尺寸方法

### setSize()

设置按钮尺寸。

```typescript
setSize(width: number, height: number): void
```

**参数**
- `width: number` - 宽度
- `height: number` - 高度

**示例**
```typescript
button.setSize(200, 60)
```

## 图标方法

### setIcon()

设置按钮图标。

```typescript
setIcon(texture: THREE.Texture | string, position?: IconPosition): void
```

**参数**
- `texture: THREE.Texture | string` - 图标纹理或URL
- `position?: IconPosition` - 图标位置，默认'LEFT'

**示例**
```typescript
button.setIcon('/assets/play-icon.png', 'LEFT')
```

### removeIcon()

移除按钮图标。

```typescript
removeIcon(): void
```

## 交互方法

### click()

程序化触发点击。

```typescript
click(): void
```

**示例**
```typescript
button.click() // 触发点击事件
```

### press()

程序化按下按钮。

```typescript
press(): void
```

### release()

程序化释放按钮。

```typescript
release(): void
```

### setHover()

设置悬停状态。

```typescript
setHover(hovered: boolean): void
```

**参数**
- `hovered: boolean` - 是否悬停

### setFocus()

设置焦点状态。

```typescript
setFocus(focused: boolean): void
```

**参数**
- `focused: boolean` - 是否获得焦点

## 工具方法

### getTextBounds()

获取文本边界矩形。

```typescript
getTextBounds(): Rect2
```

**返回值**
- `Rect2` - 文本边界矩形

### isPointInside()

检查点是否在按钮内部。

```typescript
isPointInside(x: number, y: number): boolean
```

**参数**
- `x: number` - X坐标
- `y: number` - Y坐标

**返回值**
- `boolean` - 点是否在按钮内部

### updateAppearance()

更新按钮外观。

```typescript
updateAppearance(): void
```

## 事件

Button2D提供了丰富的交互事件：

```typescript
// 点击事件
button.on('clicked', () => {
  console.log('按钮被点击')
})

// 按下事件
button.on('pressed', () => {
  console.log('按钮被按下')
})

// 释放事件
button.on('released', () => {
  console.log('按钮被释放')
})

// 悬停开始
button.on('mouse_entered', () => {
  console.log('鼠标进入按钮')
})

// 悬停结束
button.on('mouse_exited', () => {
  console.log('鼠标离开按钮')
})

// 获得焦点
button.on('focus_entered', () => {
  console.log('按钮获得焦点')
})

// 失去焦点
button.on('focus_exited', () => {
  console.log('按钮失去焦点')
})

// 状态变化
button.on('state_changed', (state: ButtonState) => {
  console.log('按钮状态变化:', state)
})

// 文本变化
button.on('text_changed', (text: string) => {
  console.log('按钮文本变化:', text)
})
```

## 完整示例

```typescript
import { Button2D, Engine, Scene, Node2D } from 'qaq-game-engine'

async function createButtonDemo() {
  // 初始化引擎
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  // 创建场景
  const scene = new Scene('ButtonDemo')
  const root = new Node2D('Root')
  scene.addChild(root)
  
  // 创建主菜单按钮
  const playButton = new Button2D('PlayButton', {
    text: '开始游戏',
    width: 150,
    height: 50,
    fontSize: 18,
    backgroundColor: { r: 0.2, g: 0.7, b: 0.3, a: 1.0 },
    textColor: { r: 1, g: 1, b: 1, a: 1 },
    borderRadius: 10
  })
  
  playButton.position = { x: 400, y: 200 }
  
  // 设置悬停样式
  playButton.setStyle('HOVER', {
    backgroundColor: { r: 0.3, g: 0.8, b: 0.4, a: 1.0 },
    scale: 1.05
  })
  
  // 设置按下样式
  playButton.setStyle('PRESSED', {
    backgroundColor: { r: 0.1, g: 0.6, b: 0.2, a: 1.0 },
    scale: 0.95
  })
  
  // 监听点击事件
  playButton.on('clicked', () => {
    console.log('开始游戏！')
    // 这里可以切换到游戏场景
  })
  
  root.addChild(playButton)
  
  // 创建设置按钮（带图标）
  const settingsButton = new Button2D('SettingsButton', {
    text: '设置',
    width: 120,
    height: 40,
    fontSize: 16,
    backgroundColor: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
    borderRadius: 8
  })
  
  settingsButton.position = { x: 400, y: 280 }
  
  // 设置图标
  settingsButton.setIcon('/assets/settings-icon.png', 'LEFT')
  
  settingsButton.on('clicked', () => {
    console.log('打开设置')
  })
  
  root.addChild(settingsButton)
  
  // 创建退出按钮
  const exitButton = new Button2D('ExitButton', {
    text: '退出',
    width: 100,
    height: 35,
    fontSize: 14,
    backgroundColor: { r: 0.8, g: 0.3, b: 0.3, a: 1.0 },
    borderRadius: 6
  })
  
  exitButton.position = { x: 400, y: 350 }
  
  // 设置禁用样式
  exitButton.setStyle('DISABLED', {
    backgroundColor: { r: 0.4, g: 0.4, b: 0.4, a: 1.0 },
    textColor: { r: 0.6, g: 0.6, b: 0.6, a: 1.0 },
    opacity: 0.5
  })
  
  exitButton.on('clicked', () => {
    console.log('退出游戏')
    // 这里可以关闭游戏
  })
  
  root.addChild(exitButton)
  
  // 创建切换按钮
  const toggleButton = new Button2D('ToggleButton', {
    text: '音效: 开',
    width: 140,
    height: 40,
    autoSize: false
  })
  
  toggleButton.position = { x: 400, y: 420 }
  
  let soundEnabled = true
  toggleButton.on('clicked', () => {
    soundEnabled = !soundEnabled
    toggleButton.text = `音效: ${soundEnabled ? '开' : '关'}`
    console.log('音效状态:', soundEnabled)
  })
  
  root.addChild(toggleButton)
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 启动渲染
  engine.switchTo2D()
  engine.startRendering()
  
  console.log('按钮演示创建完成')
  
  // 演示禁用/启用
  setTimeout(() => {
    exitButton.disabled = true
    console.log('退出按钮已禁用')
    
    setTimeout(() => {
      exitButton.disabled = false
      console.log('退出按钮已启用')
    }, 3000)
  }, 2000)
}

// 启动演示
createButtonDemo().catch(console.error)
```

## 最佳实践

1. **状态样式**：为不同状态设置合适的视觉反馈
2. **尺寸设计**：确保按钮足够大，便于点击
3. **文本清晰**：选择合适的字体大小和颜色对比度
4. **响应式设计**：考虑不同屏幕尺寸的适配
5. **事件处理**：合理使用事件监听器，避免内存泄漏
6. **无障碍性**：支持键盘导航和焦点管理

---

Button2D是QAQ引擎中重要的UI控件，掌握其用法对于创建用户界面至关重要。
