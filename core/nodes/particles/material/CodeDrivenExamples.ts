// ============================================================================
// QAQ Engine - 代码驱动粒子示例 (Code-Driven Particle Examples)
// ============================================================================

import { ShaderMaterial, Vector2, Vector3, Color, Texture } from 'three'
import { 
  CodeDrivenParticleMaterial, 
  createFireParticles, 
  createSmokeParticles, 
  createMagicParticles,
  createCustomParticles 
} from './CodeDrivenParticles'

/**
 * 代码驱动粒子系统使用示例
 */
export class CodeDrivenExamples {

  /**
   * 示例1：直接写GLSL代码
   */
  static createRawGLSLParticles(): ShaderMaterial {
    console.log('🔥 示例1：直接GLSL代码')

    const creator = new CodeDrivenParticleMaterial()
    
    // 直接写片段着色器代码
    const fragmentShader = `
      // 简单的脉冲效果
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 脉冲动画
        float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
        float ring = 1.0 - smoothstep(0.2, 0.4, distance);
        ring *= smoothstep(0.1, 0.2, distance);
        
        // 颜色
        vec3 color = vec3(1.0, 0.5, 0.0) * pulse;
        float alpha = ring * vColor.a;
        
        gl_FragColor = vec4(color, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  }

  /**
   * 示例2：预设效果 + 参数配置
   */
  static createConfigurableFireParticles(): ShaderMaterial {
    console.log('🔥 示例2：可配置火焰效果')

    return createFireParticles({
      speed: new Vector2(0.2, 0.3),        // 流动速度
      intensity: 1.5,                      // 强度
      colorStart: new Color(1, 1, 0),      // 起始颜色（黄色）
      colorEnd: new Color(1, 0, 0),        // 结束颜色（红色）
      noiseScale: 4.0                      // 噪声缩放
    })
  }

  /**
   * 示例3：函数式编程风格
   */
  static createFunctionalStyleParticles(): ShaderMaterial {
    console.log('🔧 示例3：函数式编程风格')

    return createCustomParticles()
      .addUVFlow(new Vector2(0.1, 0.2))                    // 添加UV流动
      .addNoise(3.0, 1.0)                                  // 添加噪声
      .addColorGradient(                                   // 添加颜色渐变
        new Color(0, 1, 1),    // 青色
        new Color(0, 0, 1)     // 蓝色
      )
      .setOutput(`
        // 自定义输出逻辑
        vec3 finalColor = gradientColor * noiseValue;
        float finalAlpha = noiseValue * (1.0 - vParticleAge);
        gl_FragColor = vec4(finalColor, finalAlpha);
      `)
      .build()
  }

  /**
   * 示例4：模板系统
   */
  static createTemplateBasedParticles(): {
    fire: ShaderMaterial,
    smoke: ShaderMaterial,
    magic: ShaderMaterial
  } {
    console.log('📋 示例4：模板系统')

    return {
      fire: createFireParticles(),
      smoke: createSmokeParticles(),
      magic: createMagicParticles(new Color(0.8, 0, 1)) // 紫色魔法
    }
  }

  /**
   * 示例5：复杂自定义效果
   */
  static createComplexCustomEffect(): ShaderMaterial {
    console.log('⚡ 示例5：复杂自定义效果')

    const creator = new CodeDrivenParticleMaterial()

    // 复杂的电流效果
    const fragmentShader = `
      // 电流噪声函数
      float electricNoise(vec2 uv, float time) {
        vec2 p = uv * 10.0;
        float noise = 0.0;
        
        for (int i = 0; i < 4; i++) {
          float freq = pow(2.0, float(i));
          float amp = 1.0 / freq;
          noise += sin(p.x * freq + time * 3.0) * sin(p.y * freq + time * 2.0) * amp;
        }
        
        return noise * 0.5 + 0.5;
      }
      
      // 电弧形状
      float electricArc(vec2 uv, float time) {
        float centerLine = abs(uv.y - 0.5);
        float distortion = electricNoise(vec2(uv.x * 5.0, time), time) * 0.1;
        
        return 1.0 - smoothstep(0.0, 0.1 + distortion, centerLine);
      }
      
      void main() {
        // 电流主体
        float arc = electricArc(vUv, uTime);
        
        // 闪烁效果
        float flicker = sin(uTime * 20.0 + vUv.x * 10.0) * 0.5 + 0.5;
        flicker = pow(flicker, 3.0);
        
        // 电流颜色（蓝白色）
        vec3 electricColor = mix(
          vec3(0.2, 0.5, 1.0),  // 蓝色
          vec3(1.0, 1.0, 1.0),  // 白色
          flicker
        );
        
        // 强度基于粒子速度
        float speedIntensity = length(vParticleVelocity) * 0.1;
        
        float alpha = arc * flicker * speedIntensity * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(electricColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  }

  /**
   * 示例6：基于物理的粒子效果
   */
  static createPhysicsBasedParticles(): ShaderMaterial {
    console.log('🌊 示例6：基于物理的粒子效果')

    const creator = new CodeDrivenParticleMaterial()

    // 基于速度和加速度的拖尾效果
    const fragmentShader = `
      void main() {
        // 基于速度的拖尾
        float speed = length(vParticleVelocity);
        vec2 velocityDir = normalize(vParticleVelocity.xy);
        
        // 拖尾UV变形
        vec2 stretchedUV = vUv;
        stretchedUV.x = (vUv.x - 0.5) / (1.0 + speed * 0.5) + 0.5;
        
        // 距离中心的距离
        float distance = length(stretchedUV - vec2(0.5));
        
        // 粒子形状
        float particleShape = 1.0 - smoothstep(0.0, 0.5, distance);
        
        // 基于速度的颜色
        vec3 slowColor = vec3(0.2, 0.8, 1.0);   // 蓝色（慢速）
        vec3 fastColor = vec3(1.0, 0.2, 0.2);   // 红色（快速）
        vec3 speedColor = mix(slowColor, fastColor, clamp(speed * 0.2, 0.0, 1.0));
        
        // 透明度基于年龄和速度
        float alpha = particleShape * (1.0 - vParticleAge) * (0.5 + speed * 0.5);
        
        gl_FragColor = vec4(speedColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  }

  /**
   * 示例7：交互式粒子效果
   */
  static createInteractiveParticles(): {
    material: ShaderMaterial,
    setMousePosition: (x: number, y: number) => void,
    setIntensity: (intensity: number) => void
  } {
    console.log('🖱️ 示例7：交互式粒子效果')

    const creator = new CodeDrivenParticleMaterial()

    const fragmentShader = `
      void main() {
        // 鼠标位置影响
        vec2 mouseDir = vWorldPosition.xy - uMousePosition;
        float mouseDistance = length(mouseDir);
        float mouseInfluence = 1.0 / (1.0 + mouseDistance * 0.1);
        
        // 基础粒子
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        float particle = 1.0 - smoothstep(0.0, 0.5, distance);
        
        // 鼠标交互颜色
        vec3 baseColor = vec3(0.5, 0.8, 1.0);
        vec3 interactColor = vec3(1.0, 0.3, 0.3);
        vec3 finalColor = mix(baseColor, interactColor, mouseInfluence * uIntensity);
        
        // 大小受鼠标影响
        float sizeMultiplier = 1.0 + mouseInfluence * 2.0;
        float adjustedParticle = 1.0 - smoothstep(0.0, 0.5 / sizeMultiplier, distance);
        
        float alpha = adjustedParticle * (1.0 - vParticleAge) * uIntensity;
        
        gl_FragColor = vec4(finalColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    const material = creator.createFromGLSL(fragmentShader, {
      uMousePosition: { value: new Vector2(0, 0) },
      uIntensity: { value: 1.0 }
    })

    return {
      material,
      setMousePosition: (x: number, y: number) => {
        material.uniforms.uMousePosition.value.set(x, y)
      },
      setIntensity: (intensity: number) => {
        material.uniforms.uIntensity.value = intensity
      }
    }
  }

  /**
   * 示例8：程序化动画粒子
   */
  static createProceduralAnimationParticles(): ShaderMaterial {
    console.log('🎬 示例8：程序化动画粒子')

    const creator = new CodeDrivenParticleMaterial()

    const fragmentShader = `
      // 程序化动画函数
      float animationCurve(float t, int type) {
        if (type == 0) return t; // 线性
        if (type == 1) return t * t; // 二次方
        if (type == 2) return sin(t * 3.14159); // 正弦
        if (type == 3) return 1.0 - pow(1.0 - t, 3.0); // 缓出
        return t;
      }
      
      void main() {
        float age = vParticleAge;
        
        // 不同阶段的动画
        float fadeIn = animationCurve(clamp(age * 4.0, 0.0, 1.0), 2); // 正弦淡入
        float stable = step(0.25, age) * (1.0 - step(0.75, age)); // 稳定期
        float fadeOut = animationCurve(clamp((age - 0.75) * 4.0, 0.0, 1.0), 3); // 缓出淡出
        
        // 大小动画
        float sizeAnim = fadeIn * (1.0 + stable * 0.5) * (1.0 - fadeOut);
        
        // 颜色动画
        vec3 youngColor = vec3(1.0, 1.0, 0.0); // 黄色
        vec3 matureColor = vec3(1.0, 0.5, 0.0); // 橙色
        vec3 oldColor = vec3(1.0, 0.0, 0.0); // 红色
        
        vec3 color;
        if (age < 0.5) {
          color = mix(youngColor, matureColor, age * 2.0);
        } else {
          color = mix(matureColor, oldColor, (age - 0.5) * 2.0);
        }
        
        // 粒子形状
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        float particle = 1.0 - smoothstep(0.0, 0.5 * sizeAnim, distance);
        
        float alpha = particle * (fadeIn + stable - fadeOut);
        
        gl_FragColor = vec4(color, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader)
  }

  /**
   * 运行所有示例
   */
  static runAllExamples(): {
    rawGLSL: ShaderMaterial,
    configurableFire: ShaderMaterial,
    functional: ShaderMaterial,
    templates: { fire: ShaderMaterial, smoke: ShaderMaterial, magic: ShaderMaterial },
    complexCustom: ShaderMaterial,
    physicsBased: ShaderMaterial,
    interactive: { material: ShaderMaterial, setMousePosition: Function, setIntensity: Function },
    proceduralAnimation: ShaderMaterial
  } {
    console.log('🚀 运行所有代码驱动粒子示例...')

    return {
      rawGLSL: this.createRawGLSLParticles(),
      configurableFire: this.createConfigurableFireParticles(),
      functional: this.createFunctionalStyleParticles(),
      templates: this.createTemplateBasedParticles(),
      complexCustom: this.createComplexCustomEffect(),
      physicsBased: this.createPhysicsBasedParticles(),
      interactive: this.createInteractiveParticles(),
      proceduralAnimation: this.createProceduralAnimationParticles()
    }
  }
}

/**
 * 便捷的粒子效果工厂函数
 */
export const ParticleEffectFactory = {
  /**
   * 创建简单发光粒子
   */
  createGlow(color: Color = new Color(1, 1, 1), intensity: number = 1.0): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const fragmentShader = `
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        float glow = 1.0 / (1.0 + distance * 10.0);
        glow = pow(glow, 2.0);
        
        gl_FragColor = vec4(uColor.rgb, glow * uIntensity * vColor.a);
        if (gl_FragColor.a < 0.01) discard;
      }
    `
    
    return creator.createFromGLSL(fragmentShader, {
      uColor: { value: color },
      uIntensity: { value: intensity }
    })
  },

  /**
   * 创建星星粒子
   */
  createStar(points: number = 5): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const fragmentShader = `
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
        float starShape = star(vUv, ${points});
        
        vec3 starColor = vec3(1.0, 1.0, 0.8);
        float alpha = starShape * (1.0 - vParticleAge);
        
        gl_FragColor = vec4(starColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `
    
    return creator.createFromGLSL(fragmentShader)
  },

  /**
   * 创建雨滴粒子
   */
  createRainDrop(): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const fragmentShader = `
      void main() {
        // 雨滴形状（拉长的椭圆）
        vec2 center = vec2(0.5, 0.3);
        vec2 offset = vUv - center;
        
        // 拉伸变形
        offset.y *= 2.0;
        float distance = length(offset);
        
        float dropShape = 1.0 - smoothstep(0.0, 0.3, distance);
        
        // 水的颜色和透明度
        vec3 waterColor = vec3(0.7, 0.9, 1.0);
        float alpha = dropShape * 0.6;
        
        gl_FragColor = vec4(waterColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `
    
    return creator.createFromGLSL(fragmentShader)
  }
}

// 导出便捷函数
export function createGlowParticles(color?: Color, intensity?: number): ShaderMaterial {
  return ParticleEffectFactory.createGlow(color, intensity)
}

export function createStarParticles(points?: number): ShaderMaterial {
  return ParticleEffectFactory.createStar(points)
}

export function createRainParticles(): ShaderMaterial {
  return ParticleEffectFactory.createRainDrop()
}
