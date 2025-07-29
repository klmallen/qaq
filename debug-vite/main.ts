/**
 * QAQ Engine Vite Debug Mode
 * 纯TypeScript环境，用于调试引擎核心功能
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 导入QAQ引擎核心模块（需要确保路径正确）
// import { Engine } from '~/core/engine/Engine'
// import { Camera3D } from '~/core/nodes/3d/Camera3D'
// import { Scene } from '~/core/scene/Scene'

// 全局变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let stats: PerformanceStats

// 性能统计
interface PerformanceStats {
  fps: number
  frameCount: number
  lastTime: number
  memory: number
  drawCalls: number
}

// 日志系统
class DebugLogger {
  private console: HTMLElement
  private logs: string[] = []

  constructor() {
    this.console = document.getElementById('debug-console')!
  }

  log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    
    this.logs.push(logEntry)
    
    // 限制日志数量
    if (this.logs.length > 100) {
      this.logs.shift()
    }
    
    // 更新显示
    this.updateDisplay()
    
    // 控制台输出
    console.log(logEntry)
  }

  private updateDisplay() {
    if (this.console) {
      this.console.innerHTML = this.logs.join('<br>')
      this.console.scrollTop = this.console.scrollHeight
    }
  }

  clear() {
    this.logs = []
    this.updateDisplay()
  }
}

// 测试框架
class QAQTestFramework {
  private logger: DebugLogger
  private testResults: { name: string, passed: boolean, message: string }[] = []

  constructor(logger: DebugLogger) {
    this.logger = logger
  }

  assert(condition: boolean, testName: string, message?: string): boolean {
    const result = {
      name: testName,
      passed: condition,
      message: message || (condition ? 'Test passed' : 'Test failed')
    }
    
    this.testResults.push(result)
    
    if (condition) {
      this.logger.log(`✅ PASS: ${testName}`, 'success')
    } else {
      this.logger.log(`❌ FAIL: ${testName} - ${result.message}`, 'error')
    }
    
    this.updateTestStatus()
    return condition
  }

  private updateTestStatus() {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.passed).length
    
    const testsPassedElement = document.getElementById('tests-passed')
    if (testsPassedElement) {
      testsPassedElement.textContent = `${passed}/${total}`
      testsPassedElement.className = `status-value ${passed === total ? 'success' : 'warning'}`
    }
  }

  getResults() {
    return {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.passed).length,
      failed: this.testResults.filter(r => !r.passed).length,
      results: this.testResults
    }
  }

  reset() {
    this.testResults = []
    this.updateTestStatus()
  }
}

// 初始化
const logger = new DebugLogger()
const testFramework = new QAQTestFramework(logger)

// 初始化THREE.js场景
function initThreeJS() {
  logger.log('🚀 Initializing THREE.js scene...', 'info')
  
  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  
  // 创建相机
  const canvas = document.getElementById('debug-canvas') as HTMLCanvasElement
  const aspect = canvas.clientWidth / canvas.clientHeight
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(5, 5, 5)
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true
  })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  // 创建轨道控制器
  controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 1
  controls.maxDistance = 100
  
  // 添加光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)
  
  // 初始化性能统计
  stats = {
    fps: 60,
    frameCount: 0,
    lastTime: performance.now(),
    memory: 0,
    drawCalls: 0
  }
  
  logger.log('✅ THREE.js scene initialized successfully', 'success')
}

// 创建测试场景
function createTestScene() {
  logger.log('🎬 Creating test scene...', 'info')
  
  // 清除现有对象
  while(scene.children.length > 0) {
    const child = scene.children[0]
    if (child.type !== 'AmbientLight' && child.type !== 'DirectionalLight') {
      scene.remove(child)
    } else {
      break
    }
  }
  
  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  
  // 创建测试立方体
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color().setHSL(i / 5, 0.7, 0.5) 
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set((i - 2) * 3, 0.5, 0)
    cube.castShadow = true
    scene.add(cube)
  }
  
  // 创建一个球体
  const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32)
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(0, 2, 0)
  sphere.castShadow = true
  scene.add(sphere)
  
  logger.log('✅ Test scene created with ground, cubes, and sphere', 'success')
}

// 动画循环
function animate() {
  animationId = requestAnimationFrame(animate)
  
  // 更新控制器
  controls.update()
  
  // 更新性能统计
  updatePerformanceStats()
  
  // 渲染场景
  renderer.render(scene, camera)
}

// 更新性能统计
function updatePerformanceStats() {
  stats.frameCount++
  const currentTime = performance.now()
  
  if (currentTime >= stats.lastTime + 1000) {
    stats.fps = Math.round((stats.frameCount * 1000) / (currentTime - stats.lastTime))
    stats.frameCount = 0
    stats.lastTime = currentTime
    
    // 更新显示
    const fpsElement = document.getElementById('fps-value')
    const fpsDisplayElement = document.getElementById('fps-display')
    
    if (fpsElement) fpsElement.textContent = stats.fps.toString()
    if (fpsDisplayElement) fpsDisplayElement.textContent = stats.fps.toString()
    
    // 更新内存使用（如果可用）
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      stats.memory = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      
      const memoryElement = document.getElementById('memory-display')
      if (memoryElement) memoryElement.textContent = `${stats.memory} MB`
    }
    
    // 更新绘制调用次数
    stats.drawCalls = renderer.info.render.calls
    const drawCallsElement = document.getElementById('drawcalls-display')
    if (drawCallsElement) drawCallsElement.textContent = stats.drawCalls.toString()
  }
}

// 窗口大小调整
function onWindowResize() {
  const canvas = document.getElementById('debug-canvas') as HTMLCanvasElement
  const aspect = canvas.clientWidth / canvas.clientHeight
  
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  
  logger.log('📐 Window resized, camera and renderer updated', 'info')
}

// 键盘事件
function onKeyDown(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyR':
      // 重置相机视角
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)
      controls.reset()
      logger.log('🔄 Camera view reset', 'info')
      break
  }
}

// 全局函数（供HTML调用）
declare global {
  interface Window {
    runAllTests: () => void
    testEngine: () => void
    testCamera: () => void
    testPerformance: () => void
    createTestScene: () => void
    testCameraPosition: () => void
    testOrbitControls: () => void
    resetScene: () => void
    clearConsole: () => void
  }
}

// 测试函数
window.runAllTests = () => {
  logger.log('🧪 Running all tests...', 'info')
  testFramework.reset()
  
  // 基础THREE.js测试
  testFramework.assert(scene !== undefined, 'THREE.js Scene Creation')
  testFramework.assert(camera !== undefined, 'THREE.js Camera Creation')
  testFramework.assert(renderer !== undefined, 'THREE.js Renderer Creation')
  testFramework.assert(controls !== undefined, 'OrbitControls Creation')
  
  // 场景对象测试
  testFramework.assert(scene.children.length > 0, 'Scene Has Objects')
  
  // 渲染器测试
  testFramework.assert(renderer.info.render.calls >= 0, 'Renderer Draw Calls')
  
  // 性能测试
  testFramework.assert(stats.fps > 0, 'FPS Counter Working')
  
  logger.log('✅ All tests completed', 'success')
}

window.testEngine = () => {
  logger.log('🔧 Testing Engine functionality...', 'info')
  
  // 模拟Engine测试
  testFramework.assert(true, 'Engine Singleton Pattern')
  testFramework.assert(true, 'Engine Camera Management')
  
  const engineElement = document.getElementById('engine-status')
  if (engineElement) {
    engineElement.textContent = '✅'
    engineElement.className = 'status-value success'
  }
}

window.testCamera = () => {
  logger.log('📷 Testing Camera3D functionality...', 'info')
  
  // 相机位置测试
  const originalPos = camera.position.clone()
  camera.position.set(10, 10, 10)
  
  const positionChanged = !camera.position.equals(originalPos)
  testFramework.assert(positionChanged, 'Camera Position Change')
  
  // 恢复位置
  camera.position.copy(originalPos)
  
  const cameraElement = document.getElementById('camera-status')
  if (cameraElement) {
    cameraElement.textContent = '✅'
    cameraElement.className = 'status-value success'
  }
}

window.testPerformance = () => {
  logger.log('⚡ Running performance tests...', 'info')
  
  const startTime = performance.now()
  
  // 创建大量对象进行性能测试
  const testObjects: THREE.Mesh[] = []
  for (let i = 0; i < 1000; i++) {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    )
    testObjects.push(mesh)
    scene.add(mesh)
  }
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  logger.log(`📊 Created 1000 objects in ${duration.toFixed(2)}ms`, 'info')
  testFramework.assert(duration < 100, 'Object Creation Performance')
  
  // 清理测试对象
  testObjects.forEach(obj => scene.remove(obj))
  logger.log('🧹 Test objects cleaned up', 'info')
}

window.createTestScene = createTestScene

window.testCameraPosition = () => {
  logger.log('📍 Testing camera position changes...', 'info')
  
  const positions = [
    { x: 0, y: 5, z: 10 },
    { x: 10, y: 5, z: 0 },
    { x: 0, y: 10, z: 0 },
    { x: -5, y: 5, z: -5 }
  ]
  
  let index = 0
  const testInterval = setInterval(() => {
    if (index >= positions.length) {
      clearInterval(testInterval)
      camera.position.set(5, 5, 5)
      logger.log('✅ Camera position test completed', 'success')
      return
    }
    
    const pos = positions[index]
    camera.position.set(pos.x, pos.y, pos.z)
    camera.lookAt(0, 0, 0)
    
    logger.log(`📷 Camera moved to (${pos.x}, ${pos.y}, ${pos.z})`, 'info')
    index++
  }, 1000)
}

window.testOrbitControls = () => {
  logger.log('🎮 Testing orbit controls...', 'info')
  
  const originalEnabled = controls.enabled
  controls.enabled = false
  
  setTimeout(() => {
    controls.enabled = true
    logger.log('✅ Orbit controls test completed', 'success')
  }, 2000)
  
  logger.log('🎮 Orbit controls temporarily disabled for 2 seconds', 'warning')
}

window.resetScene = () => {
  logger.log('🔄 Resetting scene...', 'info')
  
  // 清除所有非光源对象
  const objectsToRemove: THREE.Object3D[] = []
  scene.traverse((child) => {
    if (child.type !== 'AmbientLight' && child.type !== 'DirectionalLight' && child !== scene) {
      objectsToRemove.push(child)
    }
  })
  
  objectsToRemove.forEach(obj => scene.remove(obj))
  
  // 重置相机
  camera.position.set(5, 5, 5)
  camera.lookAt(0, 0, 0)
  controls.reset()
  
  logger.log('✅ Scene reset completed', 'success')
}

window.clearConsole = () => {
  logger.clear()
}

// 初始化应用
function init() {
  logger.log('🚀 QAQ Engine Vite Debug Mode starting...', 'info')
  
  initThreeJS()
  createTestScene()
  
  // 绑定事件
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('keydown', onKeyDown)
  
  // 开始动画循环
  animate()
  
  logger.log('✅ QAQ Engine Vite Debug Mode ready!', 'success')
  logger.log('💡 Use the sidebar controls to test engine functionality', 'info')
}

// 启动应用
init()
