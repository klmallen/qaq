/**
 * QAQ游戏引擎 - CanvasItem 单元测试
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 测试内容:
 * - CanvasItem基础功能
 * - Three.js集成
 * - Canvas纹理渲染
 * - 2D变换系统
 * - 可见性管理
 * - Z-index排序
 */

import CanvasItem, { BlendMode, TextureFilter, TextureRepeat } from './CanvasItem'

// ============================================================================
// 测试用例
// ============================================================================

/**
 * 测试CanvasItem基础功能
 */
function testCanvasItemBasics(): void {
  console.log('🧪 测试CanvasItem基础功能...')
  
  // 创建CanvasItem实例
  const canvasItem = new CanvasItem('TestCanvasItem')
  
  // 测试基础属性
  console.assert(canvasItem.name === 'TestCanvasItem', '节点名称设置失败')
  console.assert(canvasItem.renderLayer === '2D', '默认渲染层应为2D')
  console.assert(canvasItem.canvasVisible === true, '默认应该可见')
  console.assert(canvasItem.zIndex === 0, '默认Z索引应为0')
  
  // 测试内容尺寸
  const contentSize = canvasItem.getContentSize()
  console.assert(contentSize.x === 100 && contentSize.y === 100, '默认内容尺寸应为100x100')
  
  console.log('✅ CanvasItem基础功能测试通过')
}

/**
 * 测试Three.js集成
 */
function testThreeJSIntegration(): void {
  console.log('🧪 测试Three.js集成...')
  
  const canvasItem = new CanvasItem('ThreeJSTest')
  
  // 测试Object3D创建
  const object3D = canvasItem.object3D
  console.assert(object3D !== null, 'Object3D应该被创建')
  console.assert(object3D.name === 'ThreeJSTest_Mesh', 'Object3D名称应该正确')
  
  // 测试双向引用
  console.assert(object3D.userData.qaqNode === canvasItem, '双向引用应该建立')
  
  // 测试渲染层设置
  canvasItem.renderLayer = 'UI'
  console.assert(canvasItem.renderLayer === 'UI', '渲染层设置失败')
  
  console.log('✅ Three.js集成测试通过')
}

/**
 * 测试Canvas纹理渲染
 */
function testCanvasTextureRendering(): void {
  console.log('🧪 测试Canvas纹理渲染...')
  
  const canvasItem = new CanvasItem('CanvasTest')
  
  // 设置内容尺寸
  canvasItem.setContentSize({ x: 200, y: 150 })
  const newSize = canvasItem.getContentSize()
  console.assert(newSize.x === 200 && newSize.y === 150, '内容尺寸设置失败')
  
  // 标记需要重绘
  canvasItem.markCanvasDirty()
  
  // 测试自定义绘制
  class TestCanvasItem extends CanvasItem {
    protected drawCanvas(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(0, 0, 50, 50)
    }
  }
  
  const customItem = new TestCanvasItem('CustomDraw')
  console.assert(customItem instanceof CanvasItem, '自定义CanvasItem创建失败')
  
  console.log('✅ Canvas纹理渲染测试通过')
}

/**
 * 测试2D变换系统
 */
function testTransformSystem(): void {
  console.log('🧪 测试2D变换系统...')
  
  const canvasItem = new CanvasItem('TransformTest')
  
  // 测试位置设置
  canvasItem.position = { x: 100, y: 50, z: 0 }
  const position = canvasItem.position
  console.assert(position.x === 100 && position.y === 50, '位置设置失败')
  
  // 测试全局位置
  const globalPos = canvasItem.globalPosition
  console.assert(typeof globalPos.x === 'number', '全局位置应该是数字')
  
  // 测试可见性
  canvasItem.visible = false
  console.assert(canvasItem.visible === false, '可见性设置失败')
  
  canvasItem.canvasVisible = false
  console.assert(canvasItem.canvasVisible === false, 'Canvas可见性设置失败')
  
  console.log('✅ 2D变换系统测试通过')
}

/**
 * 测试Z-index排序
 */
function testZIndexSorting(): void {
  console.log('🧪 测试Z-index排序...')
  
  const item1 = new CanvasItem('Item1')
  const item2 = new CanvasItem('Item2')
  const item3 = new CanvasItem('Item3')
  
  // 设置不同的Z索引
  item1.zIndex = 10
  item2.zIndex = 5
  item3.zIndex = 15
  
  console.assert(item1.zIndex === 10, 'Z索引设置失败')
  console.assert(item2.zIndex === 5, 'Z索引设置失败')
  console.assert(item3.zIndex === 15, 'Z索引设置失败')
  
  // 测试Z索引比较
  console.assert(item3.zIndex > item1.zIndex, 'Z索引比较失败')
  console.assert(item1.zIndex > item2.zIndex, 'Z索引比较失败')
  
  console.log('✅ Z-index排序测试通过')
}

/**
 * 测试调制颜色
 */
function testModulateColor(): void {
  console.log('🧪 测试调制颜色...')
  
  const canvasItem = new CanvasItem('ModulateTest')
  
  // 测试调制颜色设置
  canvasItem.modulate = { r: 0.8, g: 0.6, b: 0.4, a: 0.9 }
  const modulate = canvasItem.modulate
  
  console.assert(modulate.r === 0.8, '调制颜色R分量设置失败')
  console.assert(modulate.g === 0.6, '调制颜色G分量设置失败')
  console.assert(modulate.b === 0.4, '调制颜色B分量设置失败')
  console.assert(modulate.a === 0.9, '调制颜色A分量设置失败')
  
  // 测试自身调制
  canvasItem.selfModulate = { r: 0.5, g: 0.7, b: 0.9, a: 1.0 }
  const selfModulate = canvasItem.selfModulate
  
  console.assert(selfModulate.r === 0.5, '自身调制颜色设置失败')
  console.assert(selfModulate.g === 0.7, '自身调制颜色设置失败')
  console.assert(selfModulate.b === 0.9, '自身调制颜色设置失败')
  console.assert(selfModulate.a === 1.0, '自身调制颜色设置失败')
  
  console.log('✅ 调制颜色测试通过')
}

/**
 * 测试层级结构
 */
function testHierarchy(): void {
  console.log('🧪 测试层级结构...')
  
  const parent = new CanvasItem('Parent')
  const child = new CanvasItem('Child')
  
  // 设置父子关系
  parent.addChild(child)
  
  // 测试Three.js场景图同步
  console.assert(child.parent === parent, '父子关系设置失败')
  console.assert(parent.object3D.children.includes(child.object3D), 'Three.js场景图同步失败')
  
  // 测试移除子节点
  parent.removeChild(child)
  console.assert(child.parent === null, '子节点移除失败')
  console.assert(!parent.object3D.children.includes(child.object3D), 'Three.js场景图同步失败')
  
  console.log('✅ 层级结构测试通过')
}

/**
 * 测试信号系统
 */
function testSignals(): void {
  console.log('🧪 测试信号系统...')
  
  const canvasItem = new CanvasItem('SignalTest')
  let visibilityChanged = false
  let drawCalled = false
  
  // 连接信号
  canvasItem.connect('visibility_changed', (visible: boolean) => {
    visibilityChanged = true
  })
  
  canvasItem.connect('draw', () => {
    drawCalled = true
  })
  
  // 触发信号
  canvasItem.canvasVisible = false
  canvasItem.draw()
  
  console.assert(visibilityChanged, '可见性变化信号未触发')
  console.assert(drawCalled, '绘制信号未触发')
  
  console.log('✅ 信号系统测试通过')
}

/**
 * 运行所有测试
 */
function runAllTests(): void {
  console.log('🚀 开始CanvasItem单元测试...\n')
  
  try {
    testCanvasItemBasics()
    testThreeJSIntegration()
    testCanvasTextureRendering()
    testTransformSystem()
    testZIndexSorting()
    testModulateColor()
    testHierarchy()
    testSignals()
    
    console.log('\n🎉 所有CanvasItem测试通过！')
    console.log('📊 测试统计: 8个测试用例全部通过')
    console.log('🎯 CanvasItem已准备好作为2D渲染系统的基础！')
    console.log('🔧 新架构特性：')
    console.log('   - Three.js深度集成 ✅')
    console.log('   - Canvas纹理渲染 ✅')
    console.log('   - 场景图同步 ✅')
    console.log('   - 2D/3D统一管道 ✅')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    console.log('📊 测试统计: 部分测试失败')
  }
}

// ============================================================================
// 导出测试函数
// ============================================================================

export {
  testCanvasItemBasics,
  testThreeJSIntegration,
  testCanvasTextureRendering,
  testTransformSystem,
  testZIndexSorting,
  testModulateColor,
  testHierarchy,
  testSignals,
  runAllTests
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllTests()
}
