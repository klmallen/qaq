// ============================================================================
// QAQ Engine - 完整使用示例 (Complete Usage Example)
// ============================================================================

import * as THREE from 'three'
import { 
  createFireParticles, 
  createSmokeParticles, 
  createMagicParticles 
} from './code-driven/PresetEffect_Examples'
import { 
  createFireballEffect, 
  createHealingEffect, 
  createLightningEffect 
} from './game-effects/SkillEffects'
import { createSimpleAgeGradient } from './node-graph/BasicNodeGraphExamples'
import { GLSLCodeGenerator } from '../material/GLSLCodeGenerator'

/**
 * 完整的QAQ粒子系统使用示例
 * 展示如何在实际项目中使用各种粒子效果
 */
export class CompleteUsageExample {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private particleSystems: THREE.Mesh[] = []
  private materials: THREE.ShaderMaterial[] = []

  constructor(container: HTMLElement) {
    this.initThreeJS(container)
    this.createParticleEffects()
    this.setupAnimation()
  }

  /**
   * 初始化Three.js场景
   */
  private initThreeJS(container: HTMLElement): void {
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000011)

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    )
    this.camera.position.set(0, 0, 10)

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    // 添加基础光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    this.scene.add(directionalLight)
  }

  /**
   * 创建各种粒子效果
   */
  private createParticleEffects(): void {
    console.log('🎨 创建粒子效果...')

    // 1. 代码驱动的预设效果
    this.createPresetEffects()

    // 2. 游戏技能特效
    this.createSkillEffects()

    // 3. 节点图生成的效果
    this.createNodeGraphEffects()

    // 4. 环境特效
    this.createEnvironmentEffects()
  }

  /**
   * 创建预设效果
   */
  private createPresetEffects(): void {
    // 火焰效果
    const fireMaterial = createFireParticles({
      speed: new THREE.Vector2(0.1, 0.2),
      intensity: 1.5,
      colorStart: new THREE.Color(1, 1, 0),
      colorEnd: new THREE.Color(1, 0, 0)
    })
    this.createParticleSystem(fireMaterial, new THREE.Vector3(-6, 2, 0), '火焰')

    // 烟雾效果
    const smokeMaterial = createSmokeParticles({
      speed: new THREE.Vector2(0.02, 0.05),
      density: 0.6,
      color: new THREE.Color(0.3, 0.3, 0.3)
    })
    this.createParticleSystem(smokeMaterial, new THREE.Vector3(-3, 2, 0), '烟雾')

    // 魔法效果
    const magicMaterial = createMagicParticles({
      color: new THREE.Color(0.5, 0, 1),
      speed: 2.0,
      intensity: 1.8
    })
    this.createParticleSystem(magicMaterial, new THREE.Vector3(0, 2, 0), '魔法')
  }

  /**
   * 创建技能特效
   */
  private createSkillEffects(): void {
    // 火球术
    const fireballMaterial = createFireballEffect({
      size: 1.2,
      intensity: 2.0,
      trailLength: 0.4
    })
    this.createParticleSystem(fireballMaterial, new THREE.Vector3(3, 2, 0), '火球术')

    // 治疗术
    const healingMaterial = createHealingEffect({
      warmth: 0.3,
      purity: 0.9,
      sparkles: true
    })
    this.createParticleSystem(healingMaterial, new THREE.Vector3(6, 2, 0), '治疗术')

    // 闪电术
    const lightningMaterial = createLightningEffect({
      branches: 4,
      intensity: 3.0,
      color: new THREE.Color(0.8, 0.9, 1.0)
    })
    this.createParticleSystem(lightningMaterial, new THREE.Vector3(-6, -2, 0), '闪电术')
  }

  /**
   * 创建节点图效果
   */
  private createNodeGraphEffects(): void {
    // 使用节点图生成材质
    const ageGradientGraph = createSimpleAgeGradient()
    const generator = new GLSLCodeGenerator(ageGradientGraph)
    const nodeGraphMaterial = generator.createThreeMaterial()
    
    this.createParticleSystem(nodeGraphMaterial, new THREE.Vector3(-3, -2, 0), '节点图')
  }

  /**
   * 创建环境特效
   */
  private createEnvironmentEffects(): void {
    // 星星效果
    const starMaterial = this.createStarEffect()
    this.createParticleSystem(starMaterial, new THREE.Vector3(0, -2, 0), '星星')

    // 水滴效果
    const waterMaterial = this.createWaterDropEffect()
    this.createParticleSystem(waterMaterial, new THREE.Vector3(3, -2, 0), '水滴')

    // 发光粒子
    const glowMaterial = this.createGlowEffect()
    this.createParticleSystem(glowMaterial, new THREE.Vector3(6, -2, 0), '发光')
  }

  /**
   * 创建粒子系统
   */
  private createParticleSystem(
    material: THREE.ShaderMaterial, 
    position: THREE.Vector3, 
    name: string
  ): void {
    // 创建几何体
    const geometry = new THREE.PlaneGeometry(1.5, 1.5)
    
    // 创建网格
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.name = name
    
    // 添加到场景
    this.scene.add(mesh)
    this.particleSystems.push(mesh)
    this.materials.push(material)

    // 添加标签
    this.addLabel(name, position)

    console.log(`✅ 创建粒子系统: ${name}`)
  }

  /**
   * 添加文字标签
   */
  private addLabel(text: string, position: THREE.Vector3): void {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64
    
    context.fillStyle = 'rgba(255, 255, 255, 0.8)'
    context.font = '20px Arial'
    context.textAlign = 'center'
    context.fillText(text, 128, 40)
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    
    sprite.position.set(position.x, position.y - 1.2, position.z)
    sprite.scale.set(2, 0.5, 1)
    
    this.scene.add(sprite)
  }

  /**
   * 创建星星效果
   */
  private createStarEffect(): THREE.ShaderMaterial {
    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      
      float star(vec2 uv, int points) {
        vec2 center = vec2(0.5);
        vec2 dir = uv - center;
        float angle = atan(dir.y, dir.x);
        float radius = length(dir);
        
        float starAngle = 3.14159 * 2.0 / float(points);
        float segment = mod(angle + 3.14159, starAngle) - starAngle * 0.5;
        float starRadius = 0.3 * (1.0 + 0.3 * cos(segment * float(points)));
        
        return 1.0 - smoothstep(starRadius - 0.02, starRadius + 0.02, radius);
      }
      
      void main() {
        float starShape = star(vUv, 5);
        float twinkle = sin(uTime * 5.0 + vParticleAge * 10.0) * 0.5 + 0.5;
        
        vec3 starColor = vec3(1.0, 1.0, 0.8) * twinkle;
        float alpha = starShape * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(starColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return new THREE.ShaderMaterial({
      vertexShader: this.getDefaultVertexShader(),
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false
    })
  }

  /**
   * 创建水滴效果
   */
  private createWaterDropEffect(): THREE.ShaderMaterial {
    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      
      void main() {
        vec2 center = vec2(0.5, 0.3);
        vec2 offset = vUv - center;
        offset.y *= 2.0;
        float distance = length(offset);
        
        float dropShape = 1.0 - smoothstep(0.0, 0.3, distance);
        float ripple = sin(distance * 20.0 - uTime * 5.0) * 0.1 + 0.9;
        
        vec3 waterColor = vec3(0.7, 0.9, 1.0);
        float alpha = dropShape * ripple * 0.6;
        
        gl_FragColor = vec4(waterColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return new THREE.ShaderMaterial({
      vertexShader: this.getDefaultVertexShader(),
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false
    })
  }

  /**
   * 创建发光效果
   */
  private createGlowEffect(): THREE.ShaderMaterial {
    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        float glow = 1.0 / (1.0 + distance * 5.0);
        glow = pow(glow, 2.0);
        
        float pulse = sin(uTime * 3.0) * 0.3 + 0.7;
        
        vec3 glowColor = vec3(0, 1, 1) * pulse;
        float alpha = glow * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(glowColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return new THREE.ShaderMaterial({
      vertexShader: this.getDefaultVertexShader(),
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false
    })
  }

  /**
   * 获取默认顶点着色器
   */
  private getDefaultVertexShader(): string {
    return `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uTime;
      
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      
      void main() {
        vUv = uv;
        vColor = vec4(1.0);
        vParticleAge = sin(uTime * 0.5) * 0.5 + 0.5;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `
  }

  /**
   * 设置动画循环
   */
  private setupAnimation(): void {
    const animate = () => {
      requestAnimationFrame(animate)
      
      const time = performance.now() * 0.001
      
      // 更新所有材质的时间uniform
      this.materials.forEach(material => {
        if (material.uniforms.uTime) {
          material.uniforms.uTime.value = time
        }
      })
      
      // 旋转粒子系统
      this.particleSystems.forEach((system, index) => {
        system.rotation.z = time * 0.2 + index * 0.5
      })
      
      // 相机轨道运动
      this.camera.position.x = Math.sin(time * 0.1) * 2
      this.camera.position.y = Math.cos(time * 0.15) * 1
      this.camera.lookAt(0, 0, 0)
      
      this.renderer.render(this.scene, this.camera)
    }
    
    animate()
    console.log('🎬 动画循环已启动')
  }

  /**
   * 窗口大小调整
   */
  public onWindowResize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /**
   * 销毁资源
   */
  public dispose(): void {
    this.materials.forEach(material => material.dispose())
    this.particleSystems.forEach(system => {
      if (system.geometry) system.geometry.dispose()
    })
    this.renderer.dispose()
  }

  /**
   * 获取性能统计
   */
  public getStats(): {
    particleSystemCount: number
    materialCount: number
    renderCalls: number
  } {
    return {
      particleSystemCount: this.particleSystems.length,
      materialCount: this.materials.length,
      renderCalls: this.renderer.info.render.calls
    }
  }
}

/**
 * 便捷的初始化函数
 */
export function initQAQParticleDemo(container: HTMLElement): CompleteUsageExample {
  console.log('🚀 初始化QAQ粒子系统演示...')
  
  const demo = new CompleteUsageExample(container)
  
  // 窗口大小调整监听
  window.addEventListener('resize', () => {
    demo.onWindowResize(container.clientWidth, container.clientHeight)
  })
  
  console.log('✅ QAQ粒子系统演示初始化完成！')
  return demo
}

/**
 * Vue组件使用示例
 */
export const VueComponentExample = `
<template>
  <div ref="container" class="particle-demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { initQAQParticleDemo } from './CompleteUsageExample'

const container = ref()
let demo = null

onMounted(() => {
  demo = initQAQParticleDemo(container.value)
})

onUnmounted(() => {
  if (demo) {
    demo.dispose()
  }
})
</script>

<style scoped>
.particle-demo-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}
</style>
`
