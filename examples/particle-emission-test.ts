// ============================================================================
// QAQ Engine - 粒子发射测试示例
// 验证修复后的粒子发射系统功能
// ============================================================================

import GPUParticles3D, { EmissionShape } from '../core/nodes/particles/GPUParticles3D'
import * as THREE from 'three'

/**
 * 粒子发射测试类
 */
export class ParticleEmissionTest {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private particles: GPUParticles3D[] = []

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
  }

  /**
   * 初始化测试环境
   */
  public initialize(): void {
    console.log('🧪 初始化粒子发射测试...')

    // 设置渲染器
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000011)
    document.body.appendChild(this.renderer.domElement)

    // 设置相机
    this.camera.position.set(0, 2, 8)
    this.camera.lookAt(0, 0, 0)

    // 添加基础光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    this.scene.add(directionalLight)

    // 创建测试用例
    this.createTestCases()

    // 开始渲染循环
    this.startRenderLoop()

    console.log('✅ 粒子发射测试初始化完成')
  }

  /**
   * 创建各种测试用例
   */
  private createTestCases(): void {
    // 测试1: 基础火焰效果（连续发射）
    const fireParticles = new GPUParticles3D()
    fireParticles.setAmount(50)
    fireParticles.setLifetime(2.0)
    fireParticles.setEmissionRate(20)
    fireParticles.setEmissionShape(EmissionShape.POINT)
    fireParticles.setEmissionDirection(new THREE.Vector3(0, 1, 0), 3.0, 0.5)
    fireParticles.setColorTheme('fire')
    fireParticles.setGravity(new THREE.Vector3(0, -2, 0))
    fireParticles.object3D.position.set(-3, 0, 0)
    this.scene.add(fireParticles.object3D)
    this.particles.push(fireParticles)

    // 测试2: 球形爆炸效果（单次发射）
    const explosionParticles = new GPUParticles3D()
    explosionParticles.setAmount(100)
    explosionParticles.setLifetime(3.0)
    explosionParticles.setOneShot(true)
    explosionParticles.setEmissionShape(EmissionShape.SPHERE, 0.1)
    explosionParticles.setEmissionDirection(new THREE.Vector3(0, 1, 0), 5.0, 1.0)
    explosionParticles.setColorTheme('magic')
    explosionParticles.setGravity(new THREE.Vector3(0, -1, 0))
    explosionParticles.object3D.position.set(0, 0, 0)
    this.scene.add(explosionParticles.object3D)
    this.particles.push(explosionParticles)

    // 测试3: 刀光效果
    const swordTrail = new GPUParticles3D()
    swordTrail.setupSwordTrail({
      direction: new THREE.Vector3(1, 0.2, 0),
      speed: 8.0,
      lifetime: 1.5,
      color: new THREE.Color(0.8, 0.9, 1.0),
      size: 0.3
    })
    swordTrail.object3D.position.set(3, 0, 0)
    this.scene.add(swordTrail.object3D)
    this.particles.push(swordTrail)

    // 测试4: 锥形喷射
    const coneSpray = new GPUParticles3D()
    coneSpray.setAmount(30)
    coneSpray.setLifetime(2.5)
    coneSpray.setEmissionRate(15)
    coneSpray.setEmissionShape(EmissionShape.CONE, 0.3, new THREE.Vector3(0.5, 1.0, 0.5))
    coneSpray.setEmissionDirection(new THREE.Vector3(0, 1, 0), 4.0, 0.3)
    coneSpray.setColorTheme('nature')
    coneSpray.setGravity(new THREE.Vector3(0, -3, 0))
    coneSpray.object3D.position.set(-6, 0, 0)
    this.scene.add(coneSpray.object3D)
    this.particles.push(coneSpray)

    // 测试5: 圆盘发射
    const discEmission = new GPUParticles3D()
    discEmission.setAmount(40)
    discEmission.setLifetime(3.0)
    discEmission.setEmissionRate(10)
    discEmission.setEmissionShape(EmissionShape.DISC, 1.0)
    discEmission.setEmissionDirection(new THREE.Vector3(0, 1, 0), 2.0, 0.2)
    discEmission.setColorTheme('ice')
    discEmission.setGravity(new THREE.Vector3(0, -1, 0))
    discEmission.object3D.position.set(6, 0, 0)
    this.scene.add(discEmission.object3D)
    this.particles.push(discEmission)

    console.log(`✅ 创建了 ${this.particles.length} 个测试用例`)
  }

  /**
   * 开始渲染循环
   */
  private startRenderLoop(): void {
    let lastTime = performance.now()
    let swordTrailTimer = 0

    const animate = () => {
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      // 更新所有粒子系统
      this.particles.forEach(particles => {
        particles._process(deltaTime)
      })

      // 定期触发刀光效果
      swordTrailTimer += deltaTime
      if (swordTrailTimer > 2.0) {
        this.particles[2].triggerSwordTrail() // 刀光效果
        swordTrailTimer = 0
      }

      // 渲染场景
      this.renderer.render(this.scene, this.camera)

      requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * 添加键盘控制
   */
  public addControls(): void {
    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case '1':
          // 重启火焰效果
          this.particles[0].restart()
          console.log('🔥 重启火焰效果')
          break
        case '2':
          // 触发爆炸效果
          this.particles[1].restart()
          console.log('💥 触发爆炸效果')
          break
        case '3':
          // 触发刀光效果
          this.particles[2].triggerSwordTrail()
          console.log('⚔️ 触发刀光效果')
          break
        case 'd':
          // 诊断所有粒子系统
          this.particles.forEach((particles, index) => {
            console.log(`--- 粒子系统 ${index + 1} ---`)
            particles.diagnose()
          })
          break
        case 's':
          // 切换到安全材质
          this.particles.forEach(particles => {
            particles.useSafeMaterial()
          })
          console.log('🛡️ 所有粒子系统切换到安全材质')
          break
      }
    })

    console.log('🎮 键盘控制已添加:')
    console.log('  1 - 重启火焰效果')
    console.log('  2 - 触发爆炸效果')
    console.log('  3 - 触发刀光效果')
    console.log('  D - 诊断所有粒子系统')
    console.log('  S - 切换到安全材质')
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.particles.forEach(particles => {
      particles.dispose()
    })
    this.renderer.dispose()
    document.body.removeChild(this.renderer.domElement)
  }
}

// 自动运行测试
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const test = new ParticleEmissionTest()
    test.initialize()
    test.addControls()

    // 添加到全局作用域以便调试
    ;(window as any).particleTest = test
  })
}
