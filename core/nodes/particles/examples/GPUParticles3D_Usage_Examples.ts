// ============================================================================
// QAQ Engine - GPUParticles3D使用示例 (GPUParticles3D Usage Examples)
// 展示如何使用统一的GPUParticles3D节点
// ============================================================================

import GPUParticles3D, { ParticleMaterialMode } from '../GPUParticles3D'
import { EmissionShape } from '../ParticleShapeManager'
import { PresetMaterialType, MaterialCreationMode } from '../ParticleMaterialManager'
import * as THREE from 'three'

/**
 * GPUParticles3D使用示例集合
 * 
 * 展示三种主要使用方式：
 * 1. 链式调用方式
 * 2. 直接属性配置方式
 * 3. 高级自定义配置方式
 */
export class GPUParticles3DExamples {

  /**
   * 示例1: 链式调用方式 - 火焰效果
   * 
   * 这是最简洁的使用方式，适合快速创建效果
   */
  static createFireEffect(): GPUParticles3D {
    console.log('🔥 创建火焰粒子效果（链式调用）')
    
    return new GPUParticles3D()
      .setAmount(200)                                    // 200个粒子
      .setLifetime(3.0)                                  // 3秒生命周期
      .setEmissionRate(50)                               // 每秒发射50个
      .setEmissionShape(EmissionShape.SPHERE, 0.5)       // 球形发射，半径0.5
      .setMaterialMode(ParticleMaterialMode.PRESET_FIRE, {
        presetParams: {
          intensity: 1.5,
          colorStart: new THREE.Color(1, 1, 0.2),       // 亮黄色
          colorEnd: new THREE.Color(1, 0.2, 0),         // 橙红色
          flickerSpeed: 6.0
        }
      })
      .setInitialVelocity(2.0, new THREE.Vector3(0, 1, 0)) // 向上发射
      .setGravity(new THREE.Vector3(0, -3, 0))           // 轻微重力
      .restart()                                         // 立即开始
  }

  /**
   * 示例2: 直接属性配置方式 - 魔法效果
   * 
   * 类似Godot的Inspector面板配置方式
   */
  static createMagicEffect(): GPUParticles3D {
    console.log('✨ 创建魔法粒子效果（属性配置）')
    
    const particles = new GPUParticles3D()
    
    // 基础属性配置
    particles.emitting = true
    particles.amount = 150
    particles.lifetime = 4.0
    particles.speedScale = 1.2
    particles.explosiveness = 0.3
    particles.randomness = 0.4
    
    // 发射器配置
    particles.setEmissionShape(EmissionShape.RING, 1.0)
    particles.setEmissionRate(30)
    
    // 材质配置
    particles.setMaterialMode(ParticleMaterialMode.PRESET_MAGIC, {
      presetParams: {
        color: new THREE.Color(0.5, 0.2, 1.0),          // 紫色
        sparkleIntensity: 2.0,
        magicSpeed: 4.0
      }
    })
    
    // 物理配置
    particles.setInitialVelocity(1.5, new THREE.Vector3(0, 1, 0))
    particles.setGravity(new THREE.Vector3(0, -1, 0))   // 很轻的重力
    
    return particles
  }

  /**
   * 示例3: 高级自定义配置 - 爆炸效果
   * 
   * 展示完全自定义的粒子系统配置
   */
  static createExplosionEffect(): GPUParticles3D {
    console.log('💥 创建爆炸粒子效果（高级配置）')
    
    const particles = new GPUParticles3D()
    
    // 爆炸式发射配置
    particles.amount = 300
    particles.lifetime = 2.0
    particles.explosiveness = 1.0  // 瞬间爆发所有粒子
    particles.emitting = true
    
    // 球形爆炸发射
    particles.setEmissionShape(EmissionShape.SPHERE, 0.1, new THREE.Vector3(0.2, 0.2, 0.2))
    
    // 使用自定义着色器材质
    particles.setMaterialMode(ParticleMaterialMode.CUSTOM_SHADER, {
      customVertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAge;
        
        uniform float uTime;
        
        void main() {
          vColor = color;
          vAge = uTime; // 简化的年龄计算
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // 爆炸时粒子大小随时间变化
          float explosionSize = size * (1.0 + sin(uTime * 10.0) * 0.5);
          gl_PointSize = explosionSize * (300.0 / -mvPosition.z);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      customFragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vAge;
        
        void main() {
          vec2 center = vec2(0.5);
          float distance = length(gl_PointCoord - center);
          
          if (distance > 0.5) discard;
          
          // 爆炸闪烁效果
          float flash = sin(uTime * 20.0) * 0.5 + 0.5;
          flash = pow(flash, 3.0);
          
          // 爆炸环形效果
          float ring = 1.0 - smoothstep(0.2, 0.5, distance);
          
          vec3 explosionColor = vColor * (2.0 + flash);
          float alpha = ring * (1.0 - distance * 2.0);
          
          gl_FragColor = vec4(explosionColor, alpha);
        }
      `,
      customUniforms: {
        uIntensity: { value: 3.0 }
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    
    // 高速径向发射
    particles.setInitialVelocity(8.0, new THREE.Vector3(0, 0, 0)) // 径向发射
    particles.setGravity(new THREE.Vector3(0, -15, 0))            // 强重力
    
    return particles
  }

  /**
   * 示例4: 烟雾效果 - 圆柱形发射
   */
  static createSmokeEffect(): GPUParticles3D {
    console.log('💨 创建烟雾粒子效果（圆柱形发射）')
    
    return new GPUParticles3D()
      .setAmount(100)
      .setLifetime(5.0)
      .setEmissionRate(20)
      .setEmissionShape(EmissionShape.CYLINDER, 0.3, new THREE.Vector3(0.6, 1.0, 0.6))
      .setMaterialMode(ParticleMaterialMode.PRESET_SMOKE, {
        presetParams: {
          density: 0.8,
          color: new THREE.Color(0.7, 0.7, 0.7),
          turbulence: 2.0
        }
      })
      .setInitialVelocity(1.0, new THREE.Vector3(0, 1, 0))
      .setGravity(new THREE.Vector3(0, -0.5, 0))  // 很轻的重力
  }

  /**
   * 示例5: 治疗效果 - 环形发射
   */
  static createHealEffect(): GPUParticles3D {
    console.log('💚 创建治疗粒子效果（环形发射）')
    
    const particles = new GPUParticles3D()
    
    particles.amount = 80
    particles.lifetime = 3.0
    particles.speedScale = 0.8
    particles.randomness = 0.2
    
    // 环形向上发射
    particles.setEmissionShape(EmissionShape.RING, 1.2)
    particles.setEmissionRate(25)
    
    // 使用预设材质管理器的治疗效果
    particles.setMaterialMode(ParticleMaterialMode.CUSTOM_SHADER, {
      codeDrivenFunction: () => {
        // 这里可以调用我们的材质管理器创建治疗效果
        const materialManager = particles['materialManager'] // 访问私有属性
        return materialManager.createMaterial({
          mode: MaterialCreationMode.PRESET,
          presetType: PresetMaterialType.HEAL,
          presetParams: {
            color: new THREE.Color(0.2, 1.0, 0.3),
            purity: 0.9,
            warmth: 0.4
          }
        })
      }
    })
    
    particles.setInitialVelocity(1.5, new THREE.Vector3(0, 1, 0))
    particles.setGravity(new THREE.Vector3(0, -0.2, 0))
    
    return particles
  }

  /**
   * 示例6: 复合效果 - 多个粒子系统组合
   */
  static createComplexEffect(): GPUParticles3D[] {
    console.log('🌟 创建复合粒子效果（多系统组合）')
    
    const effects: GPUParticles3D[] = []
    
    // 主爆炸效果
    const explosion = GPUParticles3DExamples.createExplosionEffect()
    explosion.name = 'MainExplosion'
    effects.push(explosion)
    
    // 火花效果
    const sparks = new GPUParticles3D()
      .setAmount(50)
      .setLifetime(1.5)
      .setEmissionRate(100)
      .setEmissionShape(EmissionShape.POINT)
      .setMaterialMode(ParticleMaterialMode.CUSTOM_SHADER, {
        presetParams: {
          color: new THREE.Color(1, 1, 0.8),
          sparkleSpeed: 8.0,
          intensity: 3.0
        }
      })
      .setInitialVelocity(12.0, new THREE.Vector3(0, 0, 0))
      .setGravity(new THREE.Vector3(0, -20, 0))
    
    sparks.name = 'Sparks'
    sparks.position.y = 0.2  // 稍微偏移
    effects.push(sparks)
    
    // 烟雾效果
    const smoke = GPUParticles3DExamples.createSmokeEffect()
    smoke.name = 'Smoke'
    smoke.position.y = 0.5
    smoke.speedScale = 0.5  // 慢一些
    effects.push(smoke)
    
    return effects
  }

  /**
   * 工具方法：创建预配置的粒子系统
   */
  static createPreset(presetName: string, customParams?: any): GPUParticles3D {
    switch (presetName.toLowerCase()) {
      case 'fire':
        return GPUParticles3DExamples.createFireEffect()
      case 'magic':
        return GPUParticles3DExamples.createMagicEffect()
      case 'explosion':
        return GPUParticles3DExamples.createExplosionEffect()
      case 'smoke':
        return GPUParticles3DExamples.createSmokeEffect()
      case 'heal':
        return GPUParticles3DExamples.createHealEffect()
      default:
        console.warn(`未知的预设: ${presetName}，使用默认火焰效果`)
        return GPUParticles3DExamples.createFireEffect()
    }
  }

  /**
   * 演示所有使用方式
   */
  static demonstrateAllUsages(): void {
    console.log('🎨 GPUParticles3D使用方式演示')
    console.log('================================')
    
    console.log('\n1. 链式调用方式:')
    console.log('const fire = new GPUParticles3D()')
    console.log('  .setAmount(200)')
    console.log('  .setLifetime(3.0)')
    console.log('  .setEmissionShape(EmissionShape.SPHERE, 0.5)')
    console.log('  .setMaterialMode(ParticleMaterialMode.PRESET_FIRE)')
    console.log('  .restart()')
    
    console.log('\n2. 属性配置方式:')
    console.log('const magic = new GPUParticles3D()')
    console.log('magic.amount = 150')
    console.log('magic.lifetime = 4.0')
    console.log('magic.setEmissionShape(EmissionShape.RING, 1.0)')
    console.log('magic.setMaterialMode(ParticleMaterialMode.PRESET_MAGIC)')
    
    console.log('\n3. 自定义着色器方式:')
    console.log('const custom = new GPUParticles3D()')
    console.log('custom.setMaterialMode(ParticleMaterialMode.CUSTOM_SHADER, {')
    console.log('  customVertexShader: "...",')
    console.log('  customFragmentShader: "...",')
    console.log('  customUniforms: { ... }')
    console.log('})')
    
    console.log('\n4. 预设快速创建:')
    console.log('const preset = GPUParticles3DExamples.createPreset("fire")')
    
    console.log('\n✅ 所有使用方式演示完成！')
  }
}

// 导出便捷函数
export const createFireParticles = () => GPUParticles3DExamples.createFireEffect()
export const createMagicParticles = () => GPUParticles3DExamples.createMagicEffect()
export const createExplosionParticles = () => GPUParticles3DExamples.createExplosionEffect()
export const createSmokeParticles = () => GPUParticles3DExamples.createSmokeEffect()
export const createHealParticles = () => GPUParticles3DExamples.createHealEffect()
export const createComplexParticles = () => GPUParticles3DExamples.createComplexEffect()

// 默认导出
export default GPUParticles3DExamples
