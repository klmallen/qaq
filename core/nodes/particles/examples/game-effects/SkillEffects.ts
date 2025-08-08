// ============================================================================
// QAQ Engine - 技能特效示例 (Skill Effects Examples)
// ============================================================================

import { ShaderMaterial, Vector2, Vector3, Color, Texture } from 'three'
import { CodeDrivenParticleMaterial } from '../../material/CodeDrivenParticles'

/**
 * 游戏技能特效库
 * 包含各种常见的游戏技能粒子特效
 */
export class SkillEffectLibrary {

  /**
   * 火球术 - 火系魔法
   */
  static createFireball(config: {
    size?: number
    intensity?: number
    trailLength?: number
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const size = config.size || 1.0
    const intensity = config.intensity || 2.0
    const trailLength = config.trailLength || 0.3

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
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 火球核心
        float core = 1.0 - smoothstep(0.0, 0.3 * uSize, distance);
        
        // 火焰噪声
        vec2 noiseUV = vUv * 3.0 + uTime * vec2(0.5, 1.0);
        float fireNoise = noise(noiseUV) * 0.8 + noise(noiseUV * 2.0) * 0.2;
        
        // 拖尾效果（基于速度）
        float speed = length(vParticleVelocity);
        vec2 velocityDir = normalize(vParticleVelocity.xy);
        float trail = 1.0 - smoothstep(0.0, uTrailLength, 
          dot(vUv - center, -velocityDir) + 0.5);
        
        // 火球颜色渐变
        vec3 coreColor = vec3(1.0, 1.0, 0.8);    // 白热核心
        vec3 midColor = vec3(1.0, 0.6, 0.1);     // 橙色中层
        vec3 outerColor = vec3(1.0, 0.2, 0.0);   // 红色外层
        
        vec3 fireColor;
        if (distance < 0.2) {
          fireColor = mix(coreColor, midColor, distance * 5.0);
        } else {
          fireColor = mix(midColor, outerColor, (distance - 0.2) * 2.5);
        }
        
        // 最终效果
        float alpha = (core + trail * 0.5) * fireNoise * uIntensity * (1.0 - vParticleAge * 0.3);
        
        gl_FragColor = vec4(fireColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uSize: { value: size },
      uIntensity: { value: intensity },
      uTrailLength: { value: trailLength }
    })
  }

  /**
   * 冰霜术 - 冰系魔法
   */
  static createFrostbolt(config: {
    sharpness?: number
    intensity?: number
    crystalEffect?: boolean
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const sharpness = config.sharpness || 2.0
    const intensity = config.intensity || 1.5
    const crystalEffect = config.crystalEffect !== false

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
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 冰晶形状
        float iceShape = 1.0 - smoothstep(0.0, 0.4, distance);
        
        // 锐利的边缘
        iceShape = pow(iceShape, uSharpness);
        
        // 冰霜噪声
        vec2 frostUV = vUv * 5.0 + uTime * vec2(0.1, 0.2);
        float frostNoise = noise(frostUV);
        
        // 水晶效果
        float crystal = 1.0;
        if (uCrystalEffect > 0.5) {
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          crystal = sin(angle * 6.0) * 0.3 + 0.7;
        }
        
        // 冰霜颜色
        vec3 iceColor = mix(
          vec3(0.8, 0.9, 1.0),  // 浅蓝
          vec3(0.2, 0.4, 0.8),  // 深蓝
          frostNoise
        );
        
        // 高光效果
        float highlight = pow(1.0 - distance, 4.0) * 0.5;
        iceColor += vec3(highlight);
        
        float alpha = iceShape * crystal * uIntensity * (1.0 - vParticleAge * 0.5);
        
        gl_FragColor = vec4(iceColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uSharpness: { value: sharpness },
      uIntensity: { value: intensity },
      uCrystalEffect: { value: crystalEffect ? 1.0 : 0.0 }
    })
  }

  /**
   * 治疗术 - 神圣魔法
   */
  static createHealing(config: {
    warmth?: number
    purity?: number
    sparkles?: boolean
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const warmth = config.warmth || 0.3
    const purity = config.purity || 0.9
    const sparkles = config.sparkles !== false

    const fragmentShader = `
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 柔和的光晕
        float glow = 1.0 / (1.0 + distance * 3.0);
        glow = pow(glow, 1.5);
        
        // 脉冲效果
        float pulse = sin(uTime * 4.0 + vParticleAge * 6.28) * 0.3 + 0.7;
        
        // 闪烁星点
        float sparkle = 1.0;
        if (uSparkles > 0.5) {
          vec2 sparkleUV = vUv * 10.0;
          sparkle = sin(sparkleUV.x * 20.0 + uTime * 5.0) * 
                   sin(sparkleUV.y * 20.0 + uTime * 3.0);
          sparkle = abs(sparkle) * 0.5 + 0.5;
        }
        
        // 治疗颜色（绿色为主，带一点金色温暖）
        vec3 healColor = mix(
          vec3(0.2, 1.0, 0.3),  // 纯绿色
          vec3(1.0, 1.0, 0.6),  // 金色
          uWarmth
        );
        
        // 纯净度影响透明度
        float alpha = glow * pulse * sparkle * uPurity * (1.0 - vParticleAge * 0.6);
        
        gl_FragColor = vec4(healColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uWarmth: { value: warmth },
      uPurity: { value: purity },
      uSparkles: { value: sparkles ? 1.0 : 0.0 }
    })
  }

  /**
   * 闪电术 - 雷系魔法
   */
  static createLightning(config: {
    branches?: number
    intensity?: number
    color?: Color
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const branches = config.branches || 3
    const intensity = config.intensity || 3.0
    const color = config.color || new Color(0.8, 0.9, 1.0)

    const fragmentShader = `
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float lightning(vec2 uv, float time, int branches) {
        float bolt = 0.0;
        
        for (int i = 0; i < branches; i++) {
          float offset = float(i) * 0.3;
          float freq = 10.0 + float(i) * 5.0;
          
          // 主闪电路径
          float path = sin(uv.x * freq + time * 10.0 + offset) * 0.1;
          float distance = abs(uv.y - 0.5 - path);
          
          // 闪电分支
          float branch = 1.0 - smoothstep(0.0, 0.05, distance);
          
          // 随机闪烁
          float flicker = hash(vec2(time * 20.0 + offset, uv.x * 10.0));
          flicker = step(0.7, flicker);
          
          bolt += branch * flicker;
        }
        
        return bolt;
      }
      
      void main() {
        float bolt = lightning(vUv, uTime, uBranches);
        
        // 强烈的白色核心
        vec3 coreColor = vec3(1.0, 1.0, 1.0);
        vec3 lightningColor = mix(uLightningColor, coreColor, bolt * 0.8);
        
        // 电流强度
        float alpha = bolt * uIntensity * (1.0 - vParticleAge * 0.3);
        
        gl_FragColor = vec4(lightningColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uBranches: { value: branches },
      uIntensity: { value: intensity },
      uLightningColor: { value: color }
    })
  }

  /**
   * 毒云术 - 毒系魔法
   */
  static createPoisonCloud(config: {
    toxicity?: number
    density?: number
    bubbles?: boolean
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const toxicity = config.toxicity || 0.8
    const density = config.density || 0.7
    const bubbles = config.bubbles !== false

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
        // 毒云噪声
        vec2 poisonUV = vUv * 2.0 + uTime * vec2(0.1, 0.05);
        float poisonNoise = noise(poisonUV) * 0.7 + noise(poisonUV * 2.0) * 0.3;
        
        // 气泡效果
        float bubble = 1.0;
        if (uBubbles > 0.5) {
          vec2 bubbleUV = vUv * 8.0;
          bubble = sin(bubbleUV.x * 6.28 + uTime * 2.0) * 
                  sin(bubbleUV.y * 6.28 + uTime * 1.5);
          bubble = abs(bubble) * 0.3 + 0.7;
        }
        
        // 毒性颜色（绿色到黄绿色）
        vec3 poisonColor = mix(
          vec3(0.2, 0.8, 0.2),  // 绿色
          vec3(0.8, 0.8, 0.2),  // 黄绿色
          uToxicity
        );
        
        // 毒云形状
        float cloud = smoothstep(0.2, 0.8, poisonNoise) * bubble;
        
        float alpha = cloud * uDensity * (1.0 - vParticleAge * 0.4);
        
        gl_FragColor = vec4(poisonColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uToxicity: { value: toxicity },
      uDensity: { value: density },
      uBubbles: { value: bubbles ? 1.0 : 0.0 }
    })
  }

  /**
   * 护盾术 - 防护魔法
   */
  static createShield(config: {
    strength?: number
    color?: Color
    hexPattern?: boolean
  } = {}): ShaderMaterial {
    const creator = new CodeDrivenParticleMaterial()
    
    const strength = config.strength || 1.0
    const color = config.color || new Color(0.2, 0.5, 1.0)
    const hexPattern = config.hexPattern !== false

    const fragmentShader = `
      float hexPattern(vec2 uv) {
        vec2 hex = vec2(uv.x * 2.0, uv.y + uv.x * 0.5);
        vec2 hexId = floor(hex);
        vec2 hexUV = fract(hex) - 0.5;
        
        float hexDist = max(abs(hexUV.x), abs(hexUV.y * 0.866 + hexUV.x * 0.5));
        return 1.0 - smoothstep(0.3, 0.4, hexDist);
      }
      
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(vUv - center);
        
        // 护盾边缘
        float shield = 1.0 - smoothstep(0.3, 0.5, distance);
        shield *= smoothstep(0.2, 0.3, distance);
        
        // 六边形图案
        float pattern = 1.0;
        if (uHexPattern > 0.5) {
          pattern = hexPattern(vUv * 5.0);
        }
        
        // 能量脉冲
        float pulse = sin(uTime * 3.0 + distance * 10.0) * 0.3 + 0.7;
        
        // 护盾颜色
        vec3 shieldColor = uShieldColor * pulse;
        
        float alpha = shield * pattern * uStrength * (1.0 - vParticleAge * 0.2);
        
        gl_FragColor = vec4(shieldColor, alpha);
        if (gl_FragColor.a < 0.01) discard;
      }
    `

    return creator.createFromGLSL(fragmentShader, {
      uStrength: { value: strength },
      uShieldColor: { value: color },
      uHexPattern: { value: hexPattern ? 1.0 : 0.0 }
    })
  }

  /**
   * 获取所有技能特效
   */
  static getAllSkillEffects(): { [key: string]: () => ShaderMaterial } {
    return {
      fireball: () => this.createFireball(),
      frostbolt: () => this.createFrostbolt(),
      healing: () => this.createHealing(),
      lightning: () => this.createLightning(),
      poisonCloud: () => this.createPoisonCloud(),
      shield: () => this.createShield()
    }
  }

  /**
   * 创建技能组合效果
   */
  static createComboEffects(): { [key: string]: ShaderMaterial[] } {
    return {
      // 火冰组合
      fireIce: [
        this.createFireball({ intensity: 1.5 }),
        this.createFrostbolt({ sharpness: 3.0 })
      ],
      
      // 雷毒组合
      thunderPoison: [
        this.createLightning({ intensity: 2.5 }),
        this.createPoisonCloud({ toxicity: 1.0 })
      ],
      
      // 治疗护盾组合
      healShield: [
        this.createHealing({ purity: 1.0 }),
        this.createShield({ strength: 1.5 })
      ]
    }
  }
}

// 便捷导出函数
export function createFireballEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createFireball(config)
}

export function createFrostboltEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createFrostbolt(config)
}

export function createHealingEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createHealing(config)
}

export function createLightningEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createLightning(config)
}

export function createPoisonCloudEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createPoisonCloud(config)
}

export function createShieldEffect(config?: any): ShaderMaterial {
  return SkillEffectLibrary.createShield(config)
}
