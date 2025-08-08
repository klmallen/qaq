// ============================================================================
// QAQ Engine - 预设效果示例 (Preset Effect Examples)
// ============================================================================

import { ShaderMaterial, Vector2, Vector3, Color, Texture } from 'three'
import { CodeDrivenParticleMaterial } from '../../material/CodeDrivenParticles'

/**
 * 预设效果示例集合
 * 展示如何使用预设效果和参数配置快速创建粒子材质
 */
export class PresetEffectExamples {

  /**
   * 火焰效果预设
   */
  static createFireEffect(config: {
    speed?: Vector2
    intensity?: number
    colorStart?: Color
    colorEnd?: Color
    noiseScale?: number
    flickerSpeed?: number
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    // 默认参数
    const speed = config.speed || new Vector2(0.1, 0.2)
    const intensity = config.intensity || 1.0
    const colorStart = config.colorStart || new Color(1, 1, 0) // 黄色
    const colorEnd = config.colorEnd || new Color(1, 0, 0) // 红色
    const noiseScale = config.noiseScale || 3.0
    const flickerSpeed = config.flickerSpeed || 5.0

    const fragmentShader = `
      // 火焰噪声函数
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 uv) {
        vec2 i = floor(uv);
        vec2 f = fract(uv);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(a, b, f.x) + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.x * f.y;
      }
      
      void main() {
        // UV流动
        vec2 flowingUV = vUv + uTime * uSpeed;
        
        // 多层噪声
        float noise1 = noise(flowingUV * uNoiseScale);
        float noise2 = noise(flowingUV * uNoiseScale * 2.0 + vec2(100.0));
        float combinedNoise = noise1 * 0.7 + noise2 * 0.3;
        
        // 火焰形状（向上衰减）
        float flameShape = 1.0 - smoothstep(0.0, 1.0, vUv.y);
        flameShape *= smoothstep(0.0, 0.2, vUv.y); // 底部硬边
        
        // 闪烁效果
        float flicker = sin(uTime * uFlickerSpeed + combinedNoise * 10.0) * 0.3 + 0.7;
        
        // 基于粒子年龄的颜色渐变
        vec3 fireColor = mix(uColorStart, uColorEnd, vParticleAge);
        fireColor *= flicker;
        
        // 最终透明度
        float alpha = combinedNoise * flameShape * uIntensity * (1.0 - vParticleAge * 0.8);
        
        gl_FragColor = vec4(fireColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uColorStart: { value: colorStart },
      uColorEnd: { value: colorEnd },
      uNoiseScale: { value: noiseScale },
      uFlickerSpeed: { value: flickerSpeed }
    })
  }

  /**
   * 烟雾效果预设
   */
  static createSmokeEffect(config: {
    speed?: Vector2
    density?: number
    color?: Color
    turbulence?: number
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const speed = config.speed || new Vector2(0.02, 0.05)
    const density = config.density || 0.6
    const color = config.color || new Color(0.3, 0.3, 0.3)
    const turbulence = config.turbulence || 2.0

    const fragmentShader = `
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 uv) {
        vec2 i = floor(uv);
        vec2 f = fract(uv);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(a, b, f.x) + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.x * f.y;
      }
      
      void main() {
        // 缓慢的UV流动
        vec2 slowUV = vUv + uTime * uSpeed;
        
        // 湍流噪声
        float turbulentNoise = noise(slowUV * uTurbulence);
        float detailNoise = noise(slowUV * uTurbulence * 3.0) * 0.3;
        float smokeNoise = turbulentNoise + detailNoise;
        
        // 烟雾形状（向上扩散）
        float smokeShape = 1.0 - vUv.y * 0.5; // 向上逐渐稀薄
        smokeShape *= smoothstep(0.0, 0.3, smokeNoise);
        
        // 烟雾颜色变化
        vec3 smokeColor = mix(uColor.rgb, uColor.rgb * 1.5, smokeNoise);
        
        // 透明度基于噪声和年龄
        float alpha = smokeShape * uDensity * (1.0 - vParticleAge * 0.7);
        
        gl_FragColor = vec4(smokeColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uSpeed: { value: speed },
      uDensity: { value: density },
      uColor: { value: color },
      uTurbulence: { value: turbulence }
    })
  }

  /**
   * 魔法光环效果预设
   */
  static createMagicEffect(config: {
    color?: Color
    speed?: number
    intensity?: number
    sparkles?: boolean
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const color = config.color || new Color(0.5, 0, 1) // 紫色
    const speed = config.speed || 2.0
    const intensity = config.intensity || 1.5
    const sparkles = config.sparkles !== false

    const fragmentShader = `
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 旋转UV
        float angle = uTime * uSpeed + distance * 10.0;
        vec2 rotatedUV = vec2(
          cos(angle) * (vUv.x - 0.5) - sin(angle) * (vUv.y - 0.5) + 0.5,
          sin(angle) * (vUv.x - 0.5) + cos(angle) * (vUv.y - 0.5) + 0.5
        );
        
        // 魔法光环
        float ring = 1.0 - smoothstep(0.2, 0.4, distance);
        ring *= smoothstep(0.1, 0.2, distance);
        
        // 脉冲效果
        float pulse = sin(uTime * 3.0) * 0.3 + 0.7;
        
        // 闪烁效果（如果启用）
        float sparkle = 1.0;
        if (uSparkles > 0.5) {
          sparkle = sin(uTime * 15.0 + distance * 30.0) * 0.4 + 0.6;
        }
        
        // 魔法颜色
        vec3 magicColor = uMagicColor * pulse * sparkle * uIntensity;
        
        // 透明度
        float alpha = ring * (1.0 - vParticleAge * 0.5);
        
        gl_FragColor = vec4(magicColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uMagicColor: { value: color },
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uSparkles: { value: sparkles ? 1.0 : 0.0 }
    })
  }

  /**
   * 水滴效果预设
   */
  static createWaterEffect(config: {
    rippleSpeed?: number
    transparency?: number
    refraction?: number
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const rippleSpeed = config.rippleSpeed || 4.0
    const transparency = config.transparency || 0.8
    const refraction = config.refraction || 0.1

    const fragmentShader = `
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 水滴形状
        float dropShape = 1.0 - smoothstep(0.0, 0.5, distance);
        
        // 水波纹效果
        float ripple = sin(distance * 20.0 - uTime * uRippleSpeed) * 0.1;
        
        // 折射效果
        vec2 refractedUV = vUv + normalize(vUv - center) * ripple * uRefraction;
        
        // 菲涅尔效果
        float fresnel = pow(1.0 - dot(normalize(vViewDirection), vec3(0, 0, 1)), 2.0);
        
        // 水的颜色
        vec3 waterColor = mix(
          vec3(0.1, 0.3, 0.8),  // 深蓝
          vec3(0.8, 0.9, 1.0),  // 浅蓝
          fresnel
        );
        
        // 透明度
        float alpha = dropShape * uTransparency;
        
        gl_FragColor = vec4(waterColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uRippleSpeed: { value: rippleSpeed },
      uTransparency: { value: transparency },
      uRefraction: { value: refraction }
    })
  }

  /**
   * 电流效果预设
   */
  static createElectricEffect(config: {
    frequency?: number
    intensity?: number
    color?: Color
    thickness?: number
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const frequency = config.frequency || 10.0
    const intensity = config.intensity || 2.0
    const color = config.color || new Color(0.2, 0.5, 1.0)
    const thickness = config.thickness || 0.1

    const fragmentShader = `
      // 电流噪声
      float electricNoise(vec2 uv, float time) {
        float noise = 0.0;
        for (int i = 0; i < 4; i++) {
          float freq = pow(2.0, float(i));
          float amp = 1.0 / freq;
          noise += sin(uv.x * freq * uFrequency + time * 3.0) * 
                   sin(uv.y * freq * uFrequency + time * 2.0) * amp;
        }
        return noise * 0.5 + 0.5;
      }
      
      void main() {
        // 电弧主体
        float centerLine = abs(vUv.y - 0.5);
        float distortion = electricNoise(vUv, uTime) * uThickness;
        
        float arc = 1.0 - smoothstep(0.0, uThickness + distortion, centerLine);
        
        // 强烈的闪烁
        float flicker = sin(uTime * 20.0 + vUv.x * 15.0);
        flicker = pow(abs(flicker), 3.0);
        
        // 电流颜色
        vec3 electricColor = mix(
          uElectricColor,
          vec3(1.0, 1.0, 1.0),  // 白色高光
          flicker
        );
        
        // 强度基于粒子速度
        float speedIntensity = length(vParticleVelocity) * 0.1 + 1.0;
        
        float alpha = arc * flicker * uIntensity * speedIntensity * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(electricColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uFrequency: { value: frequency },
      uIntensity: { value: intensity },
      uElectricColor: { value: color },
      uThickness: { value: thickness }
    })
  }

  /**
   * 获取所有预设效果
   */
  static getAllPresets(): { [key: string]: () => ShaderMaterial } {
    return {
      fire: () => this.createFireEffect(),
      smoke: () => this.createSmokeEffect(),
      magic: () => this.createMagicEffect(),
      water: () => this.createWaterEffect(),
      electric: () => this.createElectricEffect()
    }
  }

  /**
   * 创建预设效果的变体
   */
  static createVariations(): { [key: string]: ShaderMaterial } {
    return {
      // 火焰变体
      campfire: this.createFireEffect({
        speed: new Vector2(0.05, 0.15),
        intensity: 1.2,
        colorStart: new Color(1, 0.8, 0.2),
        colorEnd: new Color(0.8, 0.2, 0.1),
        flickerSpeed: 3.0
      }),
      
      torch: this.createFireEffect({
        speed: new Vector2(0.08, 0.25),
        intensity: 1.8,
        colorStart: new Color(1, 0.9, 0.3),
        colorEnd: new Color(1, 0.3, 0.1),
        flickerSpeed: 8.0
      }),
      
      // 烟雾变体
      whitesmoke: this.createSmokeEffect({
        speed: new Vector2(0.01, 0.03),
        density: 0.4,
        color: new Color(0.8, 0.8, 0.8),
        turbulence: 1.5
      }),
      
      darksmoke: this.createSmokeEffect({
        speed: new Vector2(0.03, 0.08),
        density: 0.8,
        color: new Color(0.1, 0.1, 0.1),
        turbulence: 3.0
      }),
      
      // 魔法变体
      blueMagic: this.createMagicEffect({
        color: new Color(0, 0.5, 1),
        speed: 1.5,
        intensity: 2.0,
        sparkles: true
      }),
      
      greenMagic: this.createMagicEffect({
        color: new Color(0, 1, 0.3),
        speed: 2.5,
        intensity: 1.8,
        sparkles: false
      }),
      
      // 电流变体
      blueElectric: this.createElectricEffect({
        frequency: 8.0,
        intensity: 2.5,
        color: new Color(0.1, 0.3, 1.0),
        thickness: 0.08
      }),
      
      redElectric: this.createElectricEffect({
        frequency: 12.0,
        intensity: 3.0,
        color: new Color(1.0, 0.2, 0.2),
        thickness: 0.12
      })
    }
  }
}

// 便捷导出函数
export function createFireParticles(config?: any): ShaderMaterial {
  return PresetEffectExamples.createFireEffect(config)
}

export function createSmokeParticles(config?: any): ShaderMaterial {
  return PresetEffectExamples.createSmokeEffect(config)
}

export function createMagicParticles(config?: any): ShaderMaterial {
  return PresetEffectExamples.createMagicEffect(config)
}

export function createWaterParticles(config?: any): ShaderMaterial {
  return PresetEffectExamples.createWaterEffect(config)
}

export function createElectricParticles(config?: any): ShaderMaterial {
  return PresetEffectExamples.createElectricEffect(config)
}
