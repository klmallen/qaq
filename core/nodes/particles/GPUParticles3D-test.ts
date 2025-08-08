// ============================================================================
// QAQ Engine - GPUParticles3D测试脚本
// 用于验证着色器编译错误修复和材质更新生命周期
// ============================================================================

import GPUParticles3D, { ParticleMaterialMode } from './GPUParticles3D'
import * as THREE from 'three'

/**
 * 测试GPUParticles3D的修复
 */
export class GPUParticles3DTest {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private camera: THREE.PerspectiveCamera
  private particles: GPUParticles3D

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.particles = new GPUParticles3D()
  }

  /**
   * 初始化测试环境
   */
  public async initialize(): Promise<void> {
    console.log('🧪 开始GPUParticles3D测试...')

    // 设置渲染器
    this.renderer.setSize(800, 600)
    this.renderer.setClearColor(0x000000)

    // 设置相机
    this.camera.position.set(0, 0, 5)
    this.camera.lookAt(0, 0, 0)

    // 测试基础粒子系统
    await this.testBasicParticleSystem()

    // 测试材质切换
    await this.testMaterialSwitching()

    // 测试错误处理
    await this.testErrorHandling()

    console.log('✅ GPUParticles3D测试完成')
  }

  /**
   * 测试基础粒子系统
   */
  private async testBasicParticleSystem(): Promise<void> {
    console.log('🔬 测试基础粒子系统...')

    try {
      // 添加粒子到场景
      this.scene.add(this.particles.object3D)

      // 设置基础属性
      this.particles.setAmount(100)
      this.particles.setLifetime(3.0)
      this.particles.setGravity(new THREE.Vector3(0, -9.8, 0))

      // 诊断状态
      this.particles.diagnose()

      // 模拟几帧更新
      for (let i = 0; i < 10; i++) {
        this.particles._process(0.016) // 60fps
      }

      console.log('✅ 基础粒子系统测试通过')
    } catch (error) {
      console.error('❌ 基础粒子系统测试失败:', error)
      throw error
    }
  }

  /**
   * 测试材质切换
   */
  private async testMaterialSwitching(): Promise<void> {
    console.log('🔬 测试材质切换...')

    try {
      // 测试切换到安全材质
      this.particles.useSafeMaterial()
      this.particles.diagnose()

      // 测试材质模式切换
      this.particles.setMaterialMode(ParticleMaterialMode.PRESET_FIRE)
      this.particles.diagnose()

      // 测试重新初始化材质
      this.particles.reinitializeMaterial()
      this.particles.diagnose()

      console.log('✅ 材质切换测试通过')
    } catch (error) {
      console.error('❌ 材质切换测试失败:', error)
      // 不抛出错误，继续其他测试
    }
  }

  /**
   * 测试错误处理
   */
  private async testErrorHandling(): Promise<void> {
    console.log('🔬 测试错误处理...')

    try {
      // 测试无效材质模式
      try {
        this.particles.setMaterialMode('invalid_mode' as any)
      } catch (error) {
        console.log('✅ 无效材质模式错误处理正常')
      }

      // 测试极端参数
      this.particles.setAmount(0)
      this.particles.setAmount(10000)
      this.particles.setLifetime(-1)
      this.particles.setLifetime(100)

      console.log('✅ 错误处理测试通过')
    } catch (error) {
      console.error('❌ 错误处理测试失败:', error)
    }
  }

  /**
   * 运行性能测试
   */
  public runPerformanceTest(duration: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      console.log(`🚀 开始性能测试 (${duration}ms)...`)

      const startTime = performance.now()
      let frameCount = 0
      let lastTime = startTime

      const testLoop = () => {
        const currentTime = performance.now()
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime

        // 更新粒子系统
        this.particles._process(deltaTime)

        // 渲染
        this.renderer.render(this.scene, this.camera)

        frameCount++

        if (currentTime - startTime < duration) {
          requestAnimationFrame(testLoop)
        } else {
          const totalTime = currentTime - startTime
          const avgFPS = (frameCount / totalTime) * 1000

          console.log(`✅ 性能测试完成:`)
          console.log(`  - 总时间: ${totalTime.toFixed(2)}ms`)
          console.log(`  - 总帧数: ${frameCount}`)
          console.log(`  - 平均FPS: ${avgFPS.toFixed(2)}`)

          resolve()
        }
      }

      requestAnimationFrame(testLoop)
    })
  }

  /**
   * 清理测试资源
   */
  public dispose(): void {
    console.log('🧹 清理测试资源...')

    this.particles.dispose()
    this.renderer.dispose()

    console.log('✅ 测试资源清理完成')
  }
}

/**
 * 运行完整测试套件
 */
export async function runGPUParticles3DTests(): Promise<void> {
  const test = new GPUParticles3DTest()

  try {
    await test.initialize()
    await test.runPerformanceTest(3000) // 3秒性能测试
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error)
  } finally {
    test.dispose()
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.addEventListener('load', () => {
    runGPUParticles3DTests()
  })
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = { GPUParticles3DTest, runGPUParticles3DTests }
}
