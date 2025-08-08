// ============================================================================
// QAQ Engine - 代码驱动粒子系统 (Code-Driven Particle System)
// ============================================================================

import { ShaderMaterial, Vector2, Vector3, Color, Texture } from 'three'
import { ParticleShaderCompiler } from './ParticleShaderCompiler'

/**
 * 代码驱动的粒子材质创建器
 * 无需节点图，直接通过代码创建粒子效果
 */
export class CodeDrivenParticleMaterial {
  private compiler: ParticleShaderCompiler
  
  constructor() {
    this.compiler = new ParticleShaderCompiler()
  }

  /**
   * 方式1：直接写GLSL代码
   */
  createFromGLSL(fragmentShader: string, uniforms?: any): ShaderMaterial {
    const compiled = this.compiler.compileFromGLSL({
      fragmentShader,
      uniforms: uniforms || {}
    })

    return new ShaderMaterial({
      vertexShader: compiled.vertexShader,
      fragmentShader: compiled.fragmentShader,
      uniforms: compiled.uniforms,
      transparent: true,
      depthWrite: false
    })
  }

  /**
   * 方式2：预设效果 + 参数配置
   */
  createFireEffect(config: {
    speed?: Vector2
    intensity?: number
    colorStart?: Color
    colorEnd?: Color
    noiseScale?: number
  } = {}): ShaderMaterial {
    const speed = config.speed || new Vector2(0.1, 0.2)
    const intensity = config.intensity || 1.0
    const colorStart = config.colorStart || new Color(1, 1, 0) // 黄色
    const colorEnd = config.colorEnd || new Color(1, 0, 0) // 红色
    const noiseScale = config.noiseScale || 3.0

    const fragmentShader = `
      // 噪声函数
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
        
        // 基于粒子年龄的颜色渐变
        vec3 fireColor = mix(uColorStart, uColorEnd, vParticleAge);
        
        // 火焰形状（向上衰减）
        float flameShape = 1.0 - smoothstep(0.0, 1.0, vUv.y);
        
        // 最终颜色
        float alpha = combinedNoise * flameShape * uIntensity * (1.0 - vParticleAge);
        gl_FragColor = vec4(fireColor, alpha);
        
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return this.createFromGLSL(fragmentShader, {
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uColorStart: { value: colorStart },
      uColorEnd: { value: colorEnd },
      uNoiseScale: { value: noiseScale }
    })
  }

  /**
   * 方式3：函数式编程风格
   */
  createCustomEffect(): ParticleEffectBuilder {
    return new ParticleEffectBuilder(this.compiler)
  }

  /**
   * 方式4：模板系统
   */
  createFromTemplate(templateName: string, params: any): ShaderMaterial {
    const template = ParticleTemplates[templateName]
    if (!template) {
      throw new Error(`未找到模板: ${templateName}`)
    }

    return template(this, params)
  }
}

/**
 * 函数式粒子效果构建器
 */
export class ParticleEffectBuilder {
  private compiler: ParticleShaderCompiler
  private shaderParts: string[] = []
  private uniforms: any = {}
  private functions: string[] = []

  constructor(compiler: ParticleShaderCompiler) {
    this.compiler = compiler
  }

  /**
   * 添加UV流动
   */
  addUVFlow(speed: Vector2): this {
    this.functions.push(`
      vec2 uvFlow(vec2 uv, float time, vec2 speed) {
        return uv + time * speed;
      }
    `)
    
    this.shaderParts.push(`
      vec2 flowingUV = uvFlow(vUv, uTime, uUVSpeed);
    `)
    
    this.uniforms.uUVSpeed = { value: speed }
    return this
  }

  /**
   * 添加噪声
   */
  addNoise(scale: number, strength: number = 1.0): this {
    this.functions.push(`
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
    `)

    this.shaderParts.push(`
      float noiseValue = noise(flowingUV * ${scale.toFixed(1)}) * ${strength.toFixed(1)};
    `)

    return this
  }

  /**
   * 添加颜色渐变
   */
  addColorGradient(startColor: Color, endColor: Color, factor: string = 'vParticleAge'): this {
    this.shaderParts.push(`
      vec3 gradientColor = mix(uColorStart, uColorEnd, ${factor});
    `)

    this.uniforms.uColorStart = { value: startColor }
    this.uniforms.uColorEnd = { value: endColor }
    return this
  }

  /**
   * 添加纹理采样
   */
  addTexture(texture: Texture, uvSource: string = 'vUv'): this {
    this.shaderParts.push(`
      vec4 textureColor = texture2D(uMainTexture, ${uvSource});
    `)

    this.uniforms.uMainTexture = { value: texture }
    return this
  }

  /**
   * 添加溶解效果
   */
  addDissolve(threshold: number = 0.5, edgeWidth: number = 0.1): this {
    this.shaderParts.push(`
      float dissolveEdge = smoothstep(uDissolveThreshold - uEdgeWidth, uDissolveThreshold, noiseValue);
      float dissolveMask = step(uDissolveThreshold, noiseValue);
    `)

    this.uniforms.uDissolveThreshold = { value: threshold }
    this.uniforms.uEdgeWidth = { value: edgeWidth }
    return this
  }

  /**
   * 构建最终材质
   */
  build(): ShaderMaterial {
    const fragmentShader = `
      ${this.functions.join('\n')}
      
      void main() {
        ${this.shaderParts.join('\n')}
        
        // 默认输出（可以被覆盖）
        vec3 finalColor = gradientColor;
        float finalAlpha = 1.0 - vParticleAge;
        
        gl_FragColor = vec4(finalColor, finalAlpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return this.compiler.createFromGLSL({
      fragmentShader,
      uniforms: this.uniforms
    })
  }

  /**
   * 自定义输出
   */
  setOutput(outputCode: string): this {
    // 替换默认输出
    this.shaderParts.push(`
      // 自定义输出
      ${outputCode}
    `)
    return this
  }
}

/**
 * 粒子效果模板库
 */
export const ParticleTemplates = {
  /**
   * 火焰模板
   */
  fire: (creator: CodeDrivenParticleMaterial, params: any) => {
    return creator.createFireEffect(params)
  },

  /**
   * 烟雾模板
   */
  smoke: (creator: CodeDrivenParticleMaterial, params: any) => {
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
        vec2 slowUV = vUv + uTime * vec2(0.02, 0.05);
        float smokeNoise = noise(slowUV * 2.0);
        
        vec3 smokeColor = mix(vec3(0.2), vec3(0.8), smokeNoise);
        float alpha = smokeNoise * (1.0 - vParticleAge) * 0.6;
        
        gl_FragColor = vec4(smokeColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  },

  /**
   * 魔法光环模板
   */
  magic: (creator: CodeDrivenParticleMaterial, params: any) => {
    const color = params.color || new Color(0.5, 0, 1) // 紫色
    const speed = params.speed || 2.0

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
        
        // 光环效果
        float ring = 1.0 - smoothstep(0.3, 0.5, distance);
        ring *= smoothstep(0.1, 0.3, distance);
        
        // 闪烁效果
        float flicker = sin(uTime * 10.0 + distance * 20.0) * 0.5 + 0.5;
        
        vec3 magicColor = uMagicColor * (1.0 + flicker * 0.5);
        float alpha = ring * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(magicColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uMagicColor: { value: color },
      uSpeed: { value: speed }
    })
  },

  /**
   * 水滴模板
   */
  water: (creator: CodeDrivenParticleMaterial, params: any) => {
    const fragmentShader = `
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 水滴形状
        float dropShape = 1.0 - smoothstep(0.0, 0.5, distance);
        
        // 反射效果
        float fresnel = pow(1.0 - dot(normalize(vViewDirection), vec3(0, 0, 1)), 2.0);
        
        vec3 waterColor = mix(vec3(0.1, 0.3, 0.8), vec3(0.8, 0.9, 1.0), fresnel);
        float alpha = dropShape * 0.8;
        
        gl_FragColor = vec4(waterColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  }
}

/**
 * 便捷函数
 */
export function createFireParticles(config?: any): ShaderMaterial {
  const creator = new CodeDrivenParticleMaterial()
  return creator.createFireEffect(config)
}

export function createSmokeParticles(): ShaderMaterial {
  const creator = new CodeDrivenParticleMaterial()
  return creator.createFromTemplate('smoke', {})
}

export function createMagicParticles(color?: Color): ShaderMaterial {
  const creator = new CodeDrivenParticleMaterial()
  return creator.createFromTemplate('magic', { color })
}

export function createCustomParticles(): ParticleEffectBuilder {
  const creator = new CodeDrivenParticleMaterial()
  return creator.createCustomEffect()
}
