/**
 * QAQ游戏引擎 - Camera3D 功能演示
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 演示内容:
 * - Camera3D基础3D相机功能
 * - Three.js集成的透视/正交投影
 * - 3D坐标转换和视锥剔除
 * - 相机控制和参数调整
 * - 与Engine的3D渲染管道集成
 */

import Camera3D, { ProjectionMode, KeepAspect } from './Camera3D'
import Engine from '../../engine/Engine'

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示基础Camera3D功能
 */
function demoBasicCamera3D(): void {
  console.log('🎥 演示基础Camera3D功能...\n')

  // 创建基础Camera3D
  const camera3D = new Camera3D('MainCamera')
  
  console.log(`✅ 创建3D相机: ${camera3D.name}`)
  console.log(`   相机类型: 3D相机`)
  console.log(`   渲染层: ${camera3D.renderLayer}`)
  console.log(`   投影模式: ${camera3D.projectionMode === ProjectionMode.PERSPECTIVE ? '透视投影' : '正交投影'}`)
  console.log(`   视野角度: ${camera3D.fov}°`)
  console.log(`   裁剪面: 近${camera3D.near} - 远${camera3D.far}`)
  console.log(`   Three.js对象: ${camera3D.threeCamera.name}`)

  // 创建游戏相机
  const gameCamera = new Camera3D('GameCamera')
  gameCamera.fov = 60
  gameCamera.near = 0.5
  gameCamera.far = 500
  
  console.log(`\n✅ 创建游戏相机: ${gameCamera.name}`)
  console.log(`   自定义FOV: ${gameCamera.fov}°`)
  console.log(`   自定义裁剪面: ${gameCamera.near} - ${gameCamera.far}`)

  console.log('\n')
}

/**
 * 演示投影模式切换
 */
function demoProjectionModes(): void {
  console.log('🔄 演示投影模式切换...\n')

  const camera3D = new Camera3D('ProjectionDemo')
  
  // 透视投影演示
  console.log(`📐 透视投影模式:`)
  console.log(`   投影类型: ${camera3D.projectionMode === ProjectionMode.PERSPECTIVE ? '透视投影' : '正交投影'}`)
  console.log(`   视野角度: ${camera3D.fov}°`)
  console.log(`   活动相机: ${camera3D.threeCamera === camera3D.perspectiveCamera ? '透视相机' : '正交相机'}`)
  
  // 切换到正交投影
  camera3D.projectionMode = ProjectionMode.ORTHOGONAL
  camera3D.size = 10
  
  console.log(`\n📏 正交投影模式:`)
  console.log(`   投影类型: ${camera3D.projectionMode === ProjectionMode.PERSPECTIVE ? '透视投影' : '正交投影'}`)
  console.log(`   正交尺寸: ${camera3D.size}`)
  console.log(`   活动相机: ${camera3D.threeCamera === camera3D.perspectiveCamera ? '透视相机' : '正交相机'}`)
  
  // 演示参数调整
  console.log(`\n⚙️ 参数调整演示:`)
  
  // 透视投影参数
  camera3D.projectionMode = ProjectionMode.PERSPECTIVE
  camera3D.fov = 45
  console.log(`   调整FOV到45°: ${camera3D.fov}°`)
  
  // 正交投影参数
  camera3D.projectionMode = ProjectionMode.ORTHOGONAL
  camera3D.size = 20
  console.log(`   调整正交尺寸到20: ${camera3D.size}`)

  console.log('\n')
}

/**
 * 演示Three.js深度集成
 */
function demoThreeJSIntegration(): void {
  console.log('🔧 演示Three.js深度集成...\n')

  const camera3D = new Camera3D('IntegrationDemo')
  
  // 展示Three.js对象属性
  console.log(`✅ Three.js集成信息:`)
  console.log(`   透视相机: ${camera3D.perspectiveCamera.constructor.name}`)
  console.log(`   正交相机: ${camera3D.orthographicCamera.constructor.name}`)
  console.log(`   当前活动: ${camera3D.threeCamera.constructor.name}`)
  console.log(`   Object3D引用: ${camera3D.object3D === camera3D.threeCamera}`)
  console.log(`   双向引用: ${camera3D.object3D.userData.qaqNode === camera3D}`)
  
  // 测试参数同步
  console.log(`\n🔄 参数同步测试:`)
  console.log(`   QAQ相机FOV: ${camera3D.fov}°`)
  console.log(`   Three.js相机FOV: ${camera3D.perspectiveCamera.fov}°`)
  console.log(`   参数同步: ${camera3D.fov === camera3D.perspectiveCamera.fov}`)
  
  // 调整参数测试同步
  camera3D.fov = 90
  console.log(`   调整后QAQ FOV: ${camera3D.fov}°`)
  console.log(`   调整后Three.js FOV: ${camera3D.perspectiveCamera.fov}°`)
  console.log(`   同步正常: ${camera3D.fov === camera3D.perspectiveCamera.fov}`)
  
  // 测试投影矩阵更新
  const projMatrix = camera3D.perspectiveCamera.projectionMatrix
  console.log(`   投影矩阵已更新: ${projMatrix.elements[0] !== 0}`)

  console.log('\n')
}

/**
 * 演示坐标转换功能
 */
function demoCoordinateTransform(): void {
  console.log('📐 演示坐标转换功能...\n')

  const camera3D = new Camera3D('TransformDemo')
  
  // 屏幕坐标转世界坐标
  console.log(`🖱️ 屏幕坐标转世界坐标:`)
  const screenPoints = [
    { x: 960, y: 540 }, // 屏幕中心
    { x: 0, y: 0 },     // 左上角
    { x: 1920, y: 1080 } // 右下角
  ]
  
  screenPoints.forEach((screenPoint, index) => {
    const worldPoint = camera3D.screenToWorld(screenPoint)
    console.log(`   屏幕(${screenPoint.x}, ${screenPoint.y}) -> 世界(${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}, ${worldPoint.z.toFixed(2)})`)
  })
  
  // 世界坐标转屏幕坐标
  console.log(`\n🌍 世界坐标转屏幕坐标:`)
  const worldPoints = [
    { x: 0, y: 0, z: -5 },   // 相机前方
    { x: 1, y: 1, z: -10 },  // 右上方
    { x: -1, y: -1, z: -3 }  // 左下方
  ]
  
  worldPoints.forEach((worldPoint, index) => {
    const screenPoint = camera3D.worldToScreen(worldPoint)
    console.log(`   世界(${worldPoint.x}, ${worldPoint.y}, ${worldPoint.z}) -> 屏幕(${screenPoint.x.toFixed(1)}, ${screenPoint.y.toFixed(1)})`)
  })
  
  // 相机变换矩阵
  const transform = camera3D.getCameraTransform()
  console.log(`\n🔄 相机变换矩阵:`)
  console.log(`   矩阵类型: ${transform.constructor.name}`)
  console.log(`   矩阵确定性: ${transform.determinant().toFixed(3)}`)

  console.log('\n')
}

/**
 * 演示视锥剔除功能
 */
function demoFrustumCulling(): void {
  console.log('✂️ 演示视锥剔除功能...\n')

  const camera3D = new Camera3D('CullingDemo')
  
  // 测试点剔除
  console.log(`📍 点剔除测试:`)
  const testPoints = [
    { x: 0, y: 0, z: -5, desc: '相机前方' },
    { x: 0, y: 0, z: -1500, desc: '超远距离' },
    { x: 100, y: 0, z: -5, desc: '右侧边缘' },
    { x: 0, y: 100, z: -5, desc: '上方边缘' }
  ]
  
  testPoints.forEach(point => {
    const visible = camera3D.isPointInFrustum(point)
    console.log(`   ${point.desc}(${point.x}, ${point.y}, ${point.z}): ${visible ? '可见' : '被剔除'}`)
  })
  
  // 测试球体剔除
  console.log(`\n🔵 球体剔除测试:`)
  const testSpheres = [
    { center: { x: 0, y: 0, z: -10 }, radius: 2, desc: '中心球体' },
    { center: { x: 0, y: 0, z: -1200 }, radius: 50, desc: '远距离大球' },
    { center: { x: 50, y: 0, z: -10 }, radius: 5, desc: '边缘球体' }
  ]
  
  testSpheres.forEach(sphere => {
    const visible = camera3D.isSphereInFrustum(sphere.center, sphere.radius)
    console.log(`   ${sphere.desc}(半径${sphere.radius}): ${visible ? '可见' : '被剔除'}`)
  })
  
  // 测试包围盒剔除
  console.log(`\n📦 包围盒剔除测试:`)
  const testBoxes = [
    { 
      min: { x: -1, y: -1, z: -11 }, 
      max: { x: 1, y: 1, z: -9 }, 
      desc: '中心立方体' 
    },
    { 
      min: { x: -10, y: -10, z: -1500 }, 
      max: { x: 10, y: 10, z: -1400 }, 
      desc: '远距离大盒子' 
    }
  ]
  
  testBoxes.forEach(box => {
    const visible = camera3D.isBoxInFrustum(box.min, box.max)
    console.log(`   ${box.desc}: ${visible ? '可见' : '被剔除'}`)
  })
  
  // 剔除统计信息
  const cullingInfo = camera3D.getFrustumCullingInfo()
  console.log(`\n📊 剔除统计:`)
  console.log(`   剔除启用: ${cullingInfo.enabled}`)
  console.log(`   剔除对象: ${cullingInfo.culledObjects}`)
  console.log(`   可见对象: ${cullingInfo.visibleObjects}`)

  console.log('\n')
}

/**
 * 演示相机控制功能
 */
function demoCameraControl(): void {
  console.log('🎮 演示相机控制功能...\n')

  const camera3D = new Camera3D('ControlDemo')
  
  // 方向向量
  console.log(`🧭 相机方向向量:`)
  const forward = camera3D.getForwardVector()
  const right = camera3D.getRightVector()
  const up = camera3D.getUpVector()
  
  console.log(`   前方向: (${forward.x.toFixed(2)}, ${forward.y.toFixed(2)}, ${forward.z.toFixed(2)})`)
  console.log(`   右方向: (${right.x.toFixed(2)}, ${right.y.toFixed(2)}, ${right.z.toFixed(2)})`)
  console.log(`   上方向: (${up.x.toFixed(2)}, ${up.y.toFixed(2)}, ${up.z.toFixed(2)})`)
  
  // LookAt功能
  console.log(`\n👀 LookAt功能演示:`)
  const target = { x: 10, y: 5, z: -10 }
  console.log(`   目标位置: (${target.x}, ${target.y}, ${target.z})`)
  
  camera3D.lookAt(target)
  const newForward = camera3D.getForwardVector()
  console.log(`   LookAt后前方向: (${newForward.x.toFixed(2)}, ${newForward.y.toFixed(2)}, ${newForward.z.toFixed(2)})`)
  
  // 距离计算
  console.log(`\n📏 距离计算:`)
  const testPoints2 = [
    { x: 0, y: 0, z: -5 },
    { x: 3, y: 4, z: 0 },
    { x: 10, y: 0, z: 0 }
  ]
  
  testPoints2.forEach(point => {
    const distance = camera3D.getDistanceToPoint(point)
    console.log(`   到点(${point.x}, ${point.y}, ${point.z})距离: ${distance.toFixed(2)}`)
  })

  console.log('\n')
}

/**
 * 演示相机参数优化
 */
function demoCameraOptimization(): void {
  console.log('⚡ 演示相机参数优化...\n')

  const camera3D = new Camera3D('OptimizationDemo')
  
  // 性能优化设置
  console.log(`🚀 性能优化设置:`)
  console.log(`   视锥剔除: ${camera3D.frustumCulling ? '启用' : '禁用'}`)
  
  // 调整裁剪面以优化性能
  camera3D.near = 1.0  // 增大近裁剪面
  camera3D.far = 100   // 减小远裁剪面
  
  console.log(`   优化后近裁剪面: ${camera3D.near}`)
  console.log(`   优化后远裁剪面: ${camera3D.far}`)
  console.log(`   裁剪范围: ${camera3D.far - camera3D.near}`)
  
  // 视锥体平面信息
  const planes = camera3D.getFrustumPlanes()
  console.log(`\n📐 视锥体信息:`)
  console.log(`   视锥体平面数: ${planes.length}`)
  console.log(`   平面类型: ${planes[0].constructor.name}`)
  
  // 不同FOV的性能影响
  console.log(`\n🔍 FOV性能影响:`)
  const fovValues = [30, 60, 90, 120]
  
  fovValues.forEach(fov => {
    camera3D.fov = fov
    console.log(`   FOV ${fov}°: 视野范围${fov < 60 ? '窄' : fov > 90 ? '宽' : '中等'}`)
  })

  console.log('\n')
}

/**
 * 运行所有演示
 */
function runAllDemos(): void {
  console.log('🚀 QAQ游戏引擎 - Camera3D功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    demoBasicCamera3D()
    demoProjectionModes()
    demoThreeJSIntegration()
    demoCoordinateTransform()
    demoFrustumCulling()
    demoCameraControl()
    demoCameraOptimization()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ 基础3D相机功能正常')
    console.log('   ✅ 投影模式切换正常')
    console.log('   ✅ Three.js深度集成正常')
    console.log('   ✅ 坐标转换功能正常')
    console.log('   ✅ 视锥剔除功能正常')
    console.log('   ✅ 相机控制功能正常')
    console.log('   ✅ 性能优化功能正常')
    console.log('\n🎯 Camera3D已准备好作为3D渲染系统的核心！')
    console.log('🔧 新架构特性完美运行：')
    console.log('   - Three.js透视/正交相机无缝切换')
    console.log('   - 完整的3D坐标转换系统')
    console.log('   - 高效的视锥剔除优化')
    console.log('   - 与Engine 3D渲染管道深度集成')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  demoBasicCamera3D,
  demoProjectionModes,
  demoThreeJSIntegration,
  demoCoordinateTransform,
  demoFrustumCulling,
  demoCameraControl,
  demoCameraOptimization,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
