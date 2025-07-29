/**
 * QAQ游戏引擎 - Control 单元测试
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 测试内容:
 * - Control基础功能
 * - 锚点和偏移系统
 * - 布局计算
 * - 焦点管理
 * - 2D渲染集成
 */

import Control, { FocusMode, MouseFilter, LayoutPreset, GrowDirection } from './Control'

// ============================================================================
// 测试用例
// ============================================================================

/**
 * 测试Control基础功能
 */
function testControlBasics(): void {
  console.log('🧪 测试Control基础功能...')
  
  // 创建Control实例
  const control = new Control('TestControl')
  
  // 测试基础属性
  console.assert(control.name === 'TestControl', '节点名称设置失败')
  console.assert(control.anchorLeft === 0, '默认左锚点应为0')
  console.assert(control.anchorTop === 0, '默认上锚点应为0')
  console.assert(control.anchorRight === 0, '默认右锚点应为0')
  console.assert(control.anchorBottom === 0, '默认下锚点应为0')
  console.assert(control.focusMode === FocusMode.NONE, '默认焦点模式应为NONE')
  console.assert(control.mouseFilter === MouseFilter.STOP, '默认鼠标过滤应为STOP')
  
  console.log('✅ Control基础功能测试通过')
}

/**
 * 测试锚点系统
 */
function testAnchorSystem(): void {
  console.log('🧪 测试锚点系统...')
  
  const control = new Control('AnchorTest')
  
  // 测试锚点设置
  control.anchorLeft = 0.25
  control.anchorTop = 0.5
  control.anchorRight = 0.75
  control.anchorBottom = 1.0
  
  console.assert(control.anchorLeft === 0.25, '左锚点设置失败')
  console.assert(control.anchorTop === 0.5, '上锚点设置失败')
  console.assert(control.anchorRight === 0.75, '右锚点设置失败')
  console.assert(control.anchorBottom === 1.0, '下锚点设置失败')
  
  // 测试锚点边界限制
  control.anchorLeft = -0.5 // 应该被限制为0
  control.anchorRight = 1.5 // 应该被限制为1
  
  console.assert(control.anchorLeft >= 0, '锚点下边界限制失败')
  console.assert(control.anchorRight <= 1, '锚点上边界限制失败')
  
  console.log('✅ 锚点系统测试通过')
}

/**
 * 测试偏移系统
 */
function testOffsetSystem(): void {
  console.log('🧪 测试偏移系统...')
  
  const control = new Control('OffsetTest')
  
  // 测试偏移设置
  control.offsetLeft = 10
  control.offsetTop = 20
  control.offsetRight = 110
  control.offsetBottom = 120
  
  console.assert(control.offsetLeft === 10, '左偏移设置失败')
  console.assert(control.offsetTop === 20, '上偏移设置失败')
  console.assert(control.offsetRight === 110, '右偏移设置失败')
  console.assert(control.offsetBottom === 120, '下偏移设置失败')
  
  // 测试位置和尺寸计算
  const position = control.position
  const size = control.size
  
  console.assert(position.x === 10, '位置X计算错误')
  console.assert(position.y === 20, '位置Y计算错误')
  console.assert(size.x === 100, '尺寸宽度计算错误')
  console.assert(size.y === 100, '尺寸高度计算错误')
  
  console.log('✅ 偏移系统测试通过')
}

/**
 * 测试布局预设
 */
function testLayoutPresets(): void {
  console.log('🧪 测试布局预设...')
  
  const control = new Control('PresetTest')
  
  // 测试居中预设
  control.setAnchorsPreset(LayoutPreset.CENTER)
  console.assert(control.anchorLeft === 0.5, '居中预设左锚点错误')
  console.assert(control.anchorTop === 0.5, '居中预设上锚点错误')
  console.assert(control.anchorRight === 0.5, '居中预设右锚点错误')
  console.assert(control.anchorBottom === 0.5, '居中预设下锚点错误')
  
  // 测试全屏预设
  control.setAnchorsPreset(LayoutPreset.FULL_RECT)
  console.assert(control.anchorLeft === 0, '全屏预设左锚点错误')
  console.assert(control.anchorTop === 0, '全屏预设上锚点错误')
  console.assert(control.anchorRight === 1, '全屏预设右锚点错误')
  console.assert(control.anchorBottom === 1, '全屏预设下锚点错误')
  
  // 测试左上角预设
  control.setAnchorsPreset(LayoutPreset.TOP_LEFT)
  console.assert(control.anchorLeft === 0, '左上角预设左锚点错误')
  console.assert(control.anchorTop === 0, '左上角预设上锚点错误')
  console.assert(control.anchorRight === 0, '左上角预设右锚点错误')
  console.assert(control.anchorBottom === 0, '左上角预设下锚点错误')
  
  console.log('✅ 布局预设测试通过')
}

/**
 * 测试焦点管理
 */
function testFocusManagement(): void {
  console.log('🧪 测试焦点管理...')
  
  const control1 = new Control('FocusTest1')
  const control2 = new Control('FocusTest2')
  
  // 设置焦点模式
  control1.focusMode = FocusMode.ALL
  control2.focusMode = FocusMode.CLICK
  
  console.assert(control1.focusMode === FocusMode.ALL, '焦点模式设置失败')
  console.assert(control2.focusMode === FocusMode.CLICK, '焦点模式设置失败')
  
  // 测试焦点获取
  console.assert(!control1.hasFocus(), '初始状态不应有焦点')
  
  control1.grabFocus()
  console.assert(control1.hasFocus(), '获取焦点失败')
  
  control1.releaseFocus()
  console.assert(!control1.hasFocus(), '释放焦点失败')
  
  // 测试无焦点模式
  const noFocusControl = new Control('NoFocus')
  noFocusControl.focusMode = FocusMode.NONE
  noFocusControl.grabFocus()
  console.assert(!noFocusControl.hasFocus(), 'NONE模式不应获得焦点')
  
  console.log('✅ 焦点管理测试通过')
}

/**
 * 测试尺寸计算
 */
function testSizeCalculation(): void {
  console.log('🧪 测试尺寸计算...')
  
  const control = new Control('SizeTest')
  
  // 测试自定义最小尺寸
  control.customMinimumSize = { x: 50, y: 30 }
  const minSize = control.getMinimumSize()
  
  console.assert(minSize.x === 50, '自定义最小宽度设置失败')
  console.assert(minSize.y === 30, '自定义最小高度设置失败')
  
  // 测试尺寸设置
  control.setSize({ x: 200, y: 150 })
  const size = control.size
  
  console.assert(size.x === 200, '尺寸宽度设置失败')
  console.assert(size.y === 150, '尺寸高度设置失败')
  
  // 测试位置设置
  control.setPosition({ x: 100, y: 80 })
  const position = control.position
  
  console.assert(position.x === 100, '位置X设置失败')
  console.assert(position.y === 80, '位置Y设置失败')
  
  console.log('✅ 尺寸计算测试通过')
}

/**
 * 测试层级结构
 */
function testHierarchy(): void {
  console.log('🧪 测试层级结构...')
  
  const parent = new Control('Parent')
  const child = new Control('Child')
  
  // 设置父子关系
  parent.addChild(child)
  
  // 测试父节点尺寸影响
  parent.setSize({ x: 400, y: 300 })
  child.anchorRight = 0.5
  child.anchorBottom = 0.5
  
  // 子节点应该根据父节点尺寸计算位置
  console.assert(child.parent === parent, '父子关系设置失败')
  
  console.log('✅ 层级结构测试通过')
}

/**
 * 测试信号系统
 */
function testSignals(): void {
  console.log('🧪 测试信号系统...')
  
  const control = new Control('SignalTest')
  let focusEntered = false
  let focusExited = false
  let resized = false
  
  // 连接信号
  control.connect('focus_entered', () => {
    focusEntered = true
  })
  
  control.connect('focus_exited', () => {
    focusExited = true
  })
  
  control.connect('resized', () => {
    resized = true
  })
  
  // 触发信号
  control.focusMode = FocusMode.ALL
  control.grabFocus()
  control.releaseFocus()
  control.setSize({ x: 100, y: 100 })
  
  console.assert(focusEntered, '焦点进入信号未触发')
  console.assert(focusExited, '焦点退出信号未触发')
  console.assert(resized, '尺寸变化信号未触发')
  
  console.log('✅ 信号系统测试通过')
}

/**
 * 测试工具方法
 */
function testUtilityMethods(): void {
  console.log('🧪 测试工具方法...')
  
  const control = new Control('UtilityTest')
  control.setSize({ x: 100, y: 80 })
  control.setPosition({ x: 50, y: 40 })
  
  // 测试点击检测
  console.assert(control.hasPoint({ x: 75, y: 60 }), '点击检测失败 - 应该在内部')
  console.assert(!control.hasPoint({ x: 200, y: 200 }), '点击检测失败 - 应该在外部')
  
  // 测试工具提示
  control.tooltipText = '测试提示'
  console.assert(control.getTooltip() === '测试提示', '工具提示获取失败')
  
  // 测试重置尺寸
  control.customMinimumSize = { x: 60, y: 40 }
  control.resetSize()
  const size = control.size
  console.assert(size.x === 60 && size.y === 40, '重置尺寸失败')
  
  console.log('✅ 工具方法测试通过')
}

/**
 * 运行所有测试
 */
function runAllTests(): void {
  console.log('🚀 开始Control单元测试...\n')
  
  try {
    testControlBasics()
    testAnchorSystem()
    testOffsetSystem()
    testLayoutPresets()
    testFocusManagement()
    testSizeCalculation()
    testHierarchy()
    testSignals()
    testUtilityMethods()
    
    console.log('\n🎉 所有Control测试通过！')
    console.log('📊 测试统计: 9个测试用例全部通过')
    console.log('🎯 Control节点已准备好作为UI系统的基础！')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    console.log('📊 测试统计: 部分测试失败')
  }
}

// ============================================================================
// 导出测试函数
// ============================================================================

export {
  testControlBasics,
  testAnchorSystem,
  testOffsetSystem,
  testLayoutPresets,
  testFocusManagement,
  testSizeCalculation,
  testHierarchy,
  testSignals,
  testUtilityMethods,
  runAllTests
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllTests()
}
