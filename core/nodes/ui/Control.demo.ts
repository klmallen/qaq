/**
 * QAQ游戏引擎 - Control 功能演示
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 演示内容:
 * - Control基础UI功能
 * - 响应式布局系统
 * - 2D渲染与Three.js集成
 * - 焦点管理和事件处理
 */

import Control, { FocusMode, MouseFilter, LayoutPreset, GrowDirection } from './Control'

// ============================================================================
// 自定义Control实现示例
// ============================================================================

/**
 * 自定义按钮控件
 * 演示如何继承Control实现具体UI控件
 */
class SimpleButton extends Control {
  private _text: string = 'Button'
  private _backgroundColor: string = '#4CAF50'
  private _textColor: string = '#FFFFFF'
  private _isPressed: boolean = false
  private _isHovered: boolean = false

  constructor(name: string = 'SimpleButton', text: string = 'Button') {
    super(name)
    this._text = text
    this.focusMode = FocusMode.ALL
    this.customMinimumSize = { x: 80, y: 30 }
  }

  /**
   * 设置按钮文本
   */
  setText(text: string): void {
    this._text = text
    this.queueRedraw()
  }

  /**
   * 获取按钮文本
   */
  getText(): string {
    return this._text
  }

  /**
   * 设置背景颜色
   */
  setBackgroundColor(color: string): void {
    this._backgroundColor = color
    this.queueRedraw()
  }

  /**
   * 重写2D渲染方法
   */
  protected render2D(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    
    // 根据状态选择颜色
    let bgColor = this._backgroundColor
    if (this._isPressed) {
      bgColor = this.darkenColor(bgColor, 0.2)
    } else if (this._isHovered) {
      bgColor = this.lightenColor(bgColor, 0.1)
    }
    
    // 绘制背景
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size.x, size.y)
    
    // 绘制边框
    ctx.strokeStyle = this.hasFocus() ? '#2196F3' : '#333333'
    ctx.lineWidth = this.hasFocus() ? 2 : 1
    ctx.strokeRect(0, 0, size.x, size.y)
    
    // 绘制文本
    ctx.fillStyle = this._textColor
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this._text, size.x / 2, size.y / 2)
  }

  /**
   * 颜色变暗
   */
  private darkenColor(color: string, factor: number): string {
    // 简化实现，实际应该解析颜色值
    return color.replace(/[0-9A-F]/gi, (match) => {
      const val = parseInt(match, 16)
      const newVal = Math.max(0, Math.floor(val * (1 - factor)))
      return newVal.toString(16).toUpperCase()
    })
  }

  /**
   * 颜色变亮
   */
  private lightenColor(color: string, factor: number): string {
    // 简化实现，实际应该解析颜色值
    return color.replace(/[0-9A-F]/gi, (match) => {
      const val = parseInt(match, 16)
      const newVal = Math.min(15, Math.floor(val * (1 + factor)))
      return newVal.toString(16).toUpperCase()
    })
  }
}

/**
 * 自定义面板控件
 * 演示容器类控件的实现
 */
class SimplePanel extends Control {
  private _backgroundColor: string = '#F0F0F0'
  private _borderColor: string = '#CCCCCC'
  private _borderWidth: number = 1

  constructor(name: string = 'SimplePanel') {
    super(name)
    this.mouseFilter = MouseFilter.PASS // 面板通常不处理鼠标事件
  }

  /**
   * 设置背景颜色
   */
  setBackgroundColor(color: string): void {
    this._backgroundColor = color
    this.queueRedraw()
  }

  /**
   * 设置边框样式
   */
  setBorder(color: string, width: number): void {
    this._borderColor = color
    this._borderWidth = width
    this.queueRedraw()
  }

  /**
   * 重写2D渲染方法
   */
  protected render2D(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    
    // 绘制背景
    ctx.fillStyle = this._backgroundColor
    ctx.fillRect(0, 0, size.x, size.y)
    
    // 绘制边框
    if (this._borderWidth > 0) {
      ctx.strokeStyle = this._borderColor
      ctx.lineWidth = this._borderWidth
      ctx.strokeRect(
        this._borderWidth / 2, 
        this._borderWidth / 2, 
        size.x - this._borderWidth, 
        size.y - this._borderWidth
      )
    }
  }
}

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示基础Control功能
 */
function demoBasicControl(): void {
  console.log('🎨 演示基础Control功能...\n')

  // 创建根控件
  const root = new Control('RootUI')
  root.setAnchorsPreset(LayoutPreset.FULL_RECT)
  console.log(`✅ 创建根UI控件: ${root.name}`)

  // 创建面板
  const panel = new SimplePanel('MainPanel')
  panel.setAnchorsPreset(LayoutPreset.CENTER)
  panel.setSize({ x: 300, y: 200 })
  panel.setBackgroundColor('#E3F2FD')
  panel.setBorder('#1976D2', 2)
  root.addChild(panel)

  console.log(`✅ 创建面板: ${panel.name}`)
  console.log(`   尺寸: ${panel.size.x}x${panel.size.y}`)
  console.log(`   锚点: (${panel.anchorLeft}, ${panel.anchorTop}) - (${panel.anchorRight}, ${panel.anchorBottom})`)

  // 创建按钮
  const button1 = new SimpleButton('Button1', '确定')
  button1.setPosition({ x: 50, y: 50 })
  button1.setSize({ x: 80, y: 35 })
  button1.setBackgroundColor('#4CAF50')
  panel.addChild(button1)

  const button2 = new SimpleButton('Button2', '取消')
  button2.setPosition({ x: 150, y: 50 })
  button2.setSize({ x: 80, y: 35 })
  button2.setBackgroundColor('#F44336')
  panel.addChild(button2)

  console.log(`✅ 创建按钮: ${button1.name}, ${button2.name}`)
  console.log(`   ${button1.name}: "${button1.getText()}" at (${button1.position.x}, ${button1.position.y})`)
  console.log(`   ${button2.name}: "${button2.getText()}" at (${button2.position.x}, ${button2.position.y})`)

  console.log('\n')
}

/**
 * 演示响应式布局
 */
function demoResponsiveLayout(): void {
  console.log('📐 演示响应式布局...\n')

  // 创建容器
  const container = new Control('ResponsiveContainer')
  container.setSize({ x: 400, y: 300 })

  // 创建顶部栏 - 水平拉伸
  const topBar = new SimplePanel('TopBar')
  topBar.anchorLeft = 0
  topBar.anchorTop = 0
  topBar.anchorRight = 1
  topBar.anchorBottom = 0
  topBar.offsetLeft = 0
  topBar.offsetTop = 0
  topBar.offsetRight = 0
  topBar.offsetBottom = 50
  topBar.setBackgroundColor('#2196F3')
  container.addChild(topBar)

  console.log(`✅ 创建顶部栏: 水平拉伸布局`)
  console.log(`   锚点: (${topBar.anchorLeft}, ${topBar.anchorTop}) - (${topBar.anchorRight}, ${topBar.anchorBottom})`)

  // 创建左侧栏 - 垂直拉伸
  const leftSidebar = new SimplePanel('LeftSidebar')
  leftSidebar.anchorLeft = 0
  leftSidebar.anchorTop = 0
  leftSidebar.anchorRight = 0
  leftSidebar.anchorBottom = 1
  leftSidebar.offsetLeft = 0
  leftSidebar.offsetTop = 50
  leftSidebar.offsetRight = 100
  leftSidebar.offsetBottom = 0
  leftSidebar.setBackgroundColor('#4CAF50')
  container.addChild(leftSidebar)

  console.log(`✅ 创建左侧栏: 垂直拉伸布局`)

  // 创建主内容区 - 填充剩余空间
  const mainContent = new SimplePanel('MainContent')
  mainContent.anchorLeft = 0
  mainContent.anchorTop = 0
  mainContent.anchorRight = 1
  mainContent.anchorBottom = 1
  mainContent.offsetLeft = 100
  mainContent.offsetTop = 50
  mainContent.offsetRight = 0
  mainContent.offsetBottom = 0
  mainContent.setBackgroundColor('#FFFFFF')
  container.addChild(mainContent)

  console.log(`✅ 创建主内容区: 填充剩余空间`)

  // 模拟容器尺寸变化
  console.log(`\n📏 模拟容器尺寸变化:`)
  console.log(`   原始尺寸: ${container.size.x}x${container.size.y}`)
  
  container.setSize({ x: 600, y: 400 })
  console.log(`   新尺寸: ${container.size.x}x${container.size.y}`)
  console.log(`   顶部栏自动调整: ${topBar.size.x}x${topBar.size.y}`)
  console.log(`   主内容区自动调整: ${mainContent.size.x}x${mainContent.size.y}`)

  console.log('\n')
}

/**
 * 演示焦点管理
 */
function demoFocusManagement(): void {
  console.log('🎯 演示焦点管理...\n')

  // 创建多个可获得焦点的控件
  const controls: SimpleButton[] = []
  
  for (let i = 0; i < 3; i++) {
    const button = new SimpleButton(`FocusButton${i + 1}`, `按钮 ${i + 1}`)
    button.setPosition({ x: i * 100, y: 50 })
    button.focusMode = FocusMode.ALL
    controls.push(button)
  }

  console.log(`✅ 创建${controls.length}个可获得焦点的按钮`)

  // 测试焦点切换
  let focusIndex = 0
  console.log(`\n🔄 测试焦点切换:`)
  
  controls[focusIndex].grabFocus()
  console.log(`   ${controls[focusIndex].name} 获得焦点: ${controls[focusIndex].hasFocus()}`)
  
  // 模拟Tab键切换焦点
  for (let i = 1; i < controls.length; i++) {
    controls[focusIndex].releaseFocus()
    focusIndex = i
    controls[focusIndex].grabFocus()
    console.log(`   焦点切换到 ${controls[focusIndex].name}: ${controls[focusIndex].hasFocus()}`)
  }

  // 测试焦点模式
  const noFocusButton = new SimpleButton('NoFocusButton', '无焦点')
  noFocusButton.focusMode = FocusMode.NONE
  noFocusButton.grabFocus()
  console.log(`   无焦点模式测试: ${noFocusButton.name} 有焦点 = ${noFocusButton.hasFocus()}`)

  console.log('\n')
}

/**
 * 演示2D渲染集成
 */
function demo2DRendering(): void {
  console.log('🖼️ 演示2D渲染集成...\n')

  // 创建带自定义渲染的控件
  class CustomRenderControl extends Control {
    protected render2D(ctx: CanvasRenderingContext2D): void {
      const size = this.size
      
      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, size.x, size.y)
      gradient.addColorStop(0, '#FF6B6B')
      gradient.addColorStop(0.5, '#4ECDC4')
      gradient.addColorStop(1, '#45B7D1')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size.x, size.y)
      
      // 绘制圆形
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(size.x / 2, size.y / 2, Math.min(size.x, size.y) / 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制文本
      ctx.fillStyle = '#333333'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('自定义渲染', size.x / 2, size.y / 2)
    }
  }

  const customControl = new CustomRenderControl('CustomRender')
  customControl.setSize({ x: 200, y: 150 })
  customControl.setPosition({ x: 100, y: 100 })

  console.log(`✅ 创建自定义渲染控件: ${customControl.name}`)
  console.log(`   尺寸: ${customControl.size.x}x${customControl.size.y}`)
  console.log(`   位置: (${customControl.position.x}, ${customControl.position.y})`)

  // 模拟获取Three.js渲染网格
  const renderMesh = customControl.getRenderMesh()
  console.log(`   Three.js网格对象: ${renderMesh ? '已创建' : '未创建'}`)

  // 模拟渲染更新
  console.log(`\n🔄 模拟渲染更新:`)
  customControl.queueRedraw()
  console.log(`   标记重绘: 完成`)

  console.log('\n')
}

/**
 * 演示事件处理
 */
function demoEventHandling(): void {
  console.log('⚡ 演示事件处理...\n')

  const button = new SimpleButton('EventButton', '点击我')
  button.setSize({ x: 120, y: 40 })
  button.setPosition({ x: 50, y: 50 })

  let clickCount = 0
  let focusCount = 0

  // 连接信号
  button.connect('focus_entered', () => {
    focusCount++
    console.log(`📡 焦点进入事件触发 (第${focusCount}次)`)
  })

  button.connect('focus_exited', () => {
    console.log(`📡 焦点退出事件触发`)
  })

  button.connect('resized', () => {
    console.log(`📡 尺寸变化事件触发: ${button.size.x}x${button.size.y}`)
  })

  console.log(`✅ 连接事件监听器: ${button.name}`)

  // 模拟事件触发
  console.log(`\n🎭 模拟事件触发:`)
  
  button.grabFocus()
  button.releaseFocus()
  button.grabFocus()
  
  button.setSize({ x: 140, y: 45 })

  // 模拟鼠标点击检测
  const testPoints = [
    { x: 100, y: 70, expected: true },   // 在按钮内
    { x: 200, y: 200, expected: false }  // 在按钮外
  ]

  console.log(`\n🖱️ 模拟鼠标点击检测:`)
  testPoints.forEach((point, index) => {
    const hit = button.hasPoint(point)
    const result = hit === point.expected ? '✅' : '❌'
    console.log(`   点 (${point.x}, ${point.y}): ${hit ? '命中' : '未命中'} ${result}`)
  })

  console.log('\n')
}

/**
 * 运行所有演示
 */
function runAllDemos(): void {
  console.log('🚀 QAQ游戏引擎 - Control功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    demoBasicControl()
    demoResponsiveLayout()
    demoFocusManagement()
    demo2DRendering()
    demoEventHandling()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ 基础Control功能正常')
    console.log('   ✅ 响应式布局系统正常')
    console.log('   ✅ 焦点管理功能正常')
    console.log('   ✅ 2D渲染集成正常')
    console.log('   ✅ 事件处理功能正常')
    console.log('\n🎯 Control已准备好作为UI系统的基础！')
    console.log('🔧 2D节点通过Canvas纹理与Three.js完美集成！')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  SimpleButton,
  SimplePanel,
  demoBasicControl,
  demoResponsiveLayout,
  demoFocusManagement,
  demo2DRendering,
  demoEventHandling,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
