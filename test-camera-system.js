/**
 * QAQ游戏引擎 - 相机系统测试示例
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2025年
 * 
 * 功能说明:
 * - 演示相机系统的完整使用方法
 * - 包含相机控制器、跟随系统和投影模式切换的示例
 */

import Engine from '../core/engine/Engine'
import Scene from '../core/scene/Scene'
import Node3D from '../core/nodes/Node3D'
import Camera3D, { ProjectionMode } from '../core/nodes/3d/Camera3D'
import { OrbitController } from '../core/camera/OrbitController'
import { FirstPersonController } from '../core/camera/FirstPersonController'
import { ThirdPersonController } from '../core/camera/ThirdPersonController'
import { TopDownController } from '../core/camera/TopDownController'
import * as THREE from 'three'

// 创建测试场景
async function createTestScene() {
  // 初始化引擎
  const engine = Engine.getInstance()
  const container = document.getElementById('app')!
  
  await engine.initialize({
    container,
    width: 800,
    height: 600,
    antialias: true,
    backgroundColor: 0x222222,
    debug: true
  })
  
  // 创建场景
  const scene = new Scene('TestScene')
  
  // 创建测试对象
  const cube = new Node3D('TestCube')
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b35 })
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.setThreeObject(cubeMesh)
  cube.position.set(0, 0, 0)
  scene.addChild(cube)
  
  // 创建另一个测试对象作为跟随目标
  const target = new Node3D('FollowTarget')
  const targetGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0x4caf50 })
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial)
  target.setThreeObject(targetMesh)
  target.position.set(2, 0, 0)
  scene.addChild(target)
  
  // 设置主场景
  await engine.setMainScene(scene)
  
  // 创建相机
  const camera = new Camera3D('MainCamera')
  camera.position.set(0, 2, 5)
  scene.addChild(camera)
  
  // 设置为当前相机
  engine.setCurrentCamera(camera)
  
  // 创建控制器示例
  console.log('🎮 创建相机控制器示例...')
  
  // 1. 轨道控制器示例
  const orbitController = new OrbitController({
    distance: 5,
    minDistance: 1,
    maxDistance: 20,
    enableDamping: true,
    dampingFactor: 0.05
  })
  camera.setController(orbitController)
  console.log('✅ 轨道控制器已设置')
  
  // 2. 第一人称控制器示例
  // const fpsController = new FirstPersonController({
  //   moveSpeed: 5,
  //   mouseSensitivity: 0.002
  // })
  // camera.setController(fpsController)
  // console.log('✅ 第一人称控制器已设置')
  
  // 3. 第三人称控制器示例
  // const tpsController = new ThirdPersonController({
  //   distance: 3,
  //   followSpeed: 0.1,
  //   enableSmoothing: true
  // })
  // tpsController.setTarget(target.position)
  // camera.setController(tpsController)
  // console.log('✅ 第三人称控制器已设置')
  
  // 4. 俯视角控制器示例
  // const tdController = new TopDownController({
  //   height: 5,
  //   followSpeed: 0.1,
  //   enableSmoothing: true
  // })
  // tdController.setTarget(target.position)
  // camera.setController(tdController)
  // console.log('✅ 俯视角控制器已设置')
  
  // 相机跟随示例
  console.log('🎯 设置相机跟随目标...')
  camera.setTarget(target)
  camera.setFollowConfig({
    followSpeed: 0.05,
    followOffset: { x: 0, y: 2, z: -3 },
    lookAtTarget: true,
    smoothing: true
  })
  console.log('✅ 相机跟随已设置')
  
  // 投影模式切换示例
  console.log('📷 切换投影模式示例...')
  setTimeout(() => {
    console.log('切换到正交投影')
    camera.setOrthogonal(10, 0.1, 1000)
  }, 3000)
  
  setTimeout(() => {
    console.log('切换回透视投影')
    camera.setPerspective(75, 0.1, 1000)
  }, 6000)
  
  // 控制器切换示例
  setTimeout(() => {
    console.log('🔄 切换控制器示例...')
    // 切换到第一人称控制器
    // camera.getControllerManager()?.setActiveController('FirstPersonController')
  }, 9000)
  
  // 动画循环 - 移动跟随目标
  let time = 0
  const animate = () => {
    time += 0.016  // 假设60FPS
    
    // 移动跟随目标
    target.position.x = 2 * Math.sin(time)
    target.position.z = 2 * Math.cos(time)
    
    requestAnimationFrame(animate)
  }
  animate()
  
  console.log('🎉 相机系统测试场景创建完成')
  console.log('使用说明:')
  console.log('- 鼠标左键拖拽: 旋转相机视角')
  console.log('- 鼠标右键拖拽: 平移相机')
  console.log('- 鼠标滚轮: 缩放相机')
  console.log('- F键: 锁定/解锁鼠标指针（第一人称控制器）')
  console.log('- ESC键: 退出鼠标指针锁定')
  console.log('- WASD键: 移动相机（第一人称控制器）')
  console.log('- 空格键/Shift键: 垂直移动相机（第一人称控制器）')
}

// 页面加载完成后运行测试
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 启动QAQ游戏引擎相机系统测试...')
  createTestScene().catch(error => {
    console.error('❌ 测试场景创建失败:', error)
  })
})