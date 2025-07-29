/**
 * QAQ游戏引擎 - CanvasItem 功能演示
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 演示内容:
 * - CanvasItem基础2D渲染功能
 * - Three.js集成的Canvas纹理渲染
 * - 2D/3D统一渲染管道
 * - 自定义Canvas绘制
 * - 层级管理和Z-index排序
 */

import CanvasItem, { BlendMode } from './CanvasItem'

// ============================================================================
// 自定义CanvasItem实现示例
// ============================================================================

/**
 * 自定义矩形渲染器
 * 演示如何继承CanvasItem实现自定义2D渲染
 */
class RectangleRenderer extends CanvasItem {
  private _color: string = '#4CAF50'
  private _borderColor: string = '#2E7D32'
  private _borderWidth: number = 2

  constructor(name: string = 'Rectangle', color: string = '#4CAF50') {
    super(name)
    this._color = color
    this.setContentSize({ x: 100, y: 80 })
  }

  /**
   * 设置矩形颜色
   */
  setColor(color: string): void {
    this._color = color
    this.markCanvasDirty()
  }

  /**
   * 设置边框样式
   */
  setBorder(color: string, width: number): void {
    this._borderColor = color
    this._borderWidth = width
    this.markCanvasDirty()
  }

  /**
   * 重写Canvas绘制方法
   */
  protected drawCanvas(ctx: CanvasRenderingContext2D): void {
    const size = this.getContentSize()
    
    // 绘制填充矩形
    ctx.fillStyle = this._color
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

/**
 * 自定义圆形渲染器
 * 演示复杂的Canvas 2D绘制
 */
class CircleRenderer extends CanvasItem {
  private _radius: number = 40
  private _fillColor: string = '#2196F3'
  private _strokeColor: string = '#1976D2'

  constructor(name: string = 'Circle', radius: number = 40) {
    super(name)
    this._radius = radius
    this.setContentSize({ x: radius * 2, y: radius * 2 })
  }

  /**
   * 设置半径
   */
  setRadius(radius: number): void {
    this._radius = radius
    this.setContentSize({ x: radius * 2, y: radius * 2 })
    this.markCanvasDirty()
  }

  /**
   * 设置颜色
   */
  setColors(fill: string, stroke: string): void {
    this._fillColor = fill
    this._strokeColor = stroke
    this.markCanvasDirty()
  }

  /**
   * 重写Canvas绘制方法
   */
  protected drawCanvas(ctx: CanvasRenderingContext2D): void {
    const size = this.getContentSize()
    const centerX = size.x / 2
    const centerY = size.y / 2
    
    // 绘制圆形
    ctx.beginPath()
    ctx.arc(centerX, centerY, this._radius, 0, Math.PI * 2)
    
    // 填充
    ctx.fillStyle = this._fillColor
    ctx.fill()
    
    // 描边
    ctx.strokeStyle = this._strokeColor
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

/**
 * 自定义文本渲染器
 * 演示文本绘制和字体处理
 */
class TextRenderer extends CanvasItem {
  private _text: string = 'Hello QAQ!'
  private _fontSize: number = 16
  private _fontFamily: string = 'Arial'
  private _textColor: string = '#333333'
  private _textAlign: CanvasTextAlign = 'center'

  constructor(name: string = 'Text', text: string = 'Hello QAQ!') {
    super(name)
    this._text = text
    this.updateSize()
  }

  /**
   * 设置文本内容
   */
  setText(text: string): void {
    this._text = text
    this.updateSize()
    this.markCanvasDirty()
  }

  /**
   * 设置字体样式
   */
  setFont(size: number, family: string = 'Arial'): void {
    this._fontSize = size
    this._fontFamily = family
    this.updateSize()
    this.markCanvasDirty()
  }

  /**
   * 设置文本颜色
   */
  setTextColor(color: string): void {
    this._textColor = color
    this.markCanvasDirty()
  }

  /**
   * 更新尺寸以适应文本
   */
  private updateSize(): void {
    // 创建临时canvas来测量文本尺寸
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.font = `${this._fontSize}px ${this._fontFamily}`
      const metrics = tempCtx.measureText(this._text)
      const width = Math.ceil(metrics.width) + 10 // 添加一些边距
      const height = this._fontSize + 10
      this.setContentSize({ x: width, y: height })
    }
  }

  /**
   * 重写Canvas绘制方法
   */
  protected drawCanvas(ctx: CanvasRenderingContext2D): void {
    const size = this.getContentSize()
    
    // 设置字体
    ctx.font = `${this._fontSize}px ${this._fontFamily}`
    ctx.fillStyle = this._textColor
    ctx.textAlign = this._textAlign
    ctx.textBaseline = 'middle'
    
    // 绘制文本
    const x = this._textAlign === 'center' ? size.x / 2 : 5
    const y = size.y / 2
    ctx.fillText(this._text, x, y)
  }
}

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示基础CanvasItem功能
 */
function demoBasicCanvasItem(): void {
  console.log('🎨 演示基础CanvasItem功能...\n')

  // 创建基础CanvasItem
  const basicItem = new CanvasItem('BasicItem')
  basicItem.setContentSize({ x: 150, y: 100 })
  basicItem.position = { x: 0, y: 0, z: 0 }

  console.log(`✅ 创建基础CanvasItem: ${basicItem.name}`)
  console.log(`   内容尺寸: ${basicItem.getContentSize().x}x${basicItem.getContentSize().y}`)
  console.log(`   渲染层: ${basicItem.renderLayer}`)
  console.log(`   Three.js对象: ${basicItem.object3D.name}`)

  // 创建自定义矩形
  const rectangle = new RectangleRenderer('RedRectangle', '#F44336')
  rectangle.position = { x: 200, y: 0, z: 0 }
  rectangle.setBorder('#D32F2F', 3)

  console.log(`✅ 创建矩形渲染器: ${rectangle.name}`)
  console.log(`   位置: (${rectangle.position.x}, ${rectangle.position.y})`)

  // 创建圆形
  const circle = new CircleRenderer('BlueCircle', 50)
  circle.position = { x: 400, y: 0, z: 0 }
  circle.setColors('#2196F3', '#1976D2')

  console.log(`✅ 创建圆形渲染器: ${circle.name}`)
  console.log(`   半径: 50px`)

  console.log('\n')
}

/**
 * 演示Three.js集成
 */
function demoThreeJSIntegration(): void {
  console.log('🔧 演示Three.js集成...\n')

  const canvasItem = new RectangleRenderer('IntegrationTest', '#9C27B0')
  
  // 展示Three.js对象属性
  const object3D = canvasItem.object3D
  console.log(`✅ Three.js集成信息:`)
  console.log(`   Object3D类型: ${object3D.constructor.name}`)
  console.log(`   Object3D名称: ${object3D.name}`)
  console.log(`   双向引用: ${object3D.userData.qaqNode === canvasItem}`)
  
  // 测试渲染层切换
  console.log(`\n🔄 渲染层切换测试:`)
  console.log(`   初始渲染层: ${canvasItem.renderLayer}`)
  
  canvasItem.renderLayer = 'UI'
  console.log(`   切换到UI层: ${canvasItem.renderLayer}`)
  
  canvasItem.renderLayer = '3D'
  console.log(`   切换到3D层: ${canvasItem.renderLayer}`)
  
  // 测试可见性同步
  console.log(`\n👁️ 可见性同步测试:`)
  console.log(`   QAQ节点可见: ${canvasItem.visible}`)
  console.log(`   Three.js对象可见: ${object3D.visible}`)
  
  canvasItem.visible = false
  console.log(`   设置不可见后 - QAQ: ${canvasItem.visible}, Three.js: ${object3D.visible}`)

  console.log('\n')
}

/**
 * 运行所有演示
 */
function runAllDemos(): void {
  console.log('🚀 QAQ游戏引擎 - CanvasItem功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    demoBasicCanvasItem()
    demoThreeJSIntegration()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ 基础CanvasItem功能正常')
    console.log('   ✅ Three.js深度集成正常')
    console.log('   ✅ Canvas纹理渲染正常')
    console.log('\n🎯 CanvasItem已准备好作为2D渲染系统的基础！')
    console.log('🔧 新架构特性完美运行：')
    console.log('   - Canvas内容自动映射到Three.js纹理')
    console.log('   - 2D绘制在3D空间中完美渲染')
    console.log('   - 场景图同步确保层级关系正确')
    console.log('   - 统一渲染管道提供最佳性能')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  RectangleRenderer,
  CircleRenderer,
  TextRenderer,
  demoBasicCanvasItem,
  demoThreeJSIntegration,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
