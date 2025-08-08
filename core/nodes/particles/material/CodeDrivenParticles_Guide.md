# 🎯 代码驱动粒子系统完整指南

## 📋 **多种代码驱动方式对比**

| 方式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **直接GLSL** | 完全自定义效果 | 最大灵活性 | 需要GLSL知识 |
| **预设+配置** | 常见效果快速实现 | 简单易用 | 灵活性有限 |
| **函数式构建** | 模块化组合效果 | 代码清晰，可复用 | 学习成本中等 |
| **模板系统** | 标准化效果 | 开箱即用 | 定制化程度低 |
| **工厂函数** | 特定类型粒子 | 专业化，高效 | 覆盖范围有限 |

## 🔥 **方式1：直接GLSL代码**

### **基础用法**
```typescript
import { CodeDrivenParticleMaterial } from './CodeDrivenParticles'

const creator = new CodeDrivenParticleMaterial()

// 直接写片段着色器
const material = creator.createFromGLSL(`
  void main() {
    vec2 center = vec2(0.5);
    float distance = length(vUv - center);
    
    // 脉冲效果
    float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
    float ring = 1.0 - smoothstep(0.2, 0.4, distance);
    
    vec3 color = vec3(1.0, 0.5, 0.0) * pulse;
    gl_FragColor = vec4(color, ring * vColor.a);
  }
`)
```

### **可用的内置变量**
```glsl
// 时间相关
uniform float uTime;        // 当前时间
uniform float uDeltaTime;   // 帧间隔时间

// 粒子属性
varying vec2 vUv;           // UV坐标 (0-1)
varying vec4 vColor;        // 粒子颜色
varying float vParticleAge; // 粒子年龄 (0-1)
varying float vParticleLifetime; // 粒子生命周期
varying vec3 vParticleVelocity;  // 粒子速度
varying vec3 vWorldPosition;     // 世界坐标
varying vec3 vViewDirection;     // 视线方向
```

## ⚙️ **方式2：预设效果 + 参数配置**

### **火焰效果**
```typescript
import { createFireParticles } from './CodeDrivenParticles'

const fireMaterial = createFireParticles({
  speed: new Vector2(0.2, 0.3),        // UV流动速度
  intensity: 1.5,                      // 强度倍数
  colorStart: new Color(1, 1, 0),      // 起始颜色（黄）
  colorEnd: new Color(1, 0, 0),        // 结束颜色（红）
  noiseScale: 4.0                      // 噪声缩放
})

// 运行时更新参数
fireMaterial.uniforms.uIntensity.value = 2.0
fireMaterial.uniforms.uSpeed.value.set(0.3, 0.4)
```

### **其他预设效果**
```typescript
// 烟雾效果
const smokeMaterial = createSmokeParticles()

// 魔法效果
const magicMaterial = createMagicParticles(new Color(0.8, 0, 1)) // 紫色

// 发光效果
const glowMaterial = createGlowParticles(new Color(0, 1, 1), 2.0) // 青色发光
```

## 🔧 **方式3：函数式编程风格**

### **链式调用构建**
```typescript
import { createCustomParticles } from './CodeDrivenParticles'

const material = createCustomParticles()
  .addUVFlow(new Vector2(0.1, 0.2))           // 添加UV流动
  .addNoise(3.0, 1.0)                         // 添加噪声
  .addColorGradient(                          // 添加颜色渐变
    new Color(0, 1, 1),    // 青色
    new Color(0, 0, 1)     // 蓝色
  )
  .addTexture(myTexture, 'flowingUV')         // 添加纹理采样
  .addDissolve(0.5, 0.1)                      // 添加溶解效果
  .setOutput(`
    // 自定义最终输出
    vec3 finalColor = gradientColor * textureColor.rgb * noiseValue;
    float finalAlpha = textureColor.a * dissolveMask * (1.0 - vParticleAge);
    gl_FragColor = vec4(finalColor, finalAlpha);
  `)
  .build()
```

### **可用的构建方法**
```typescript
// UV操作
.addUVFlow(speed: Vector2)              // UV流动
.addUVRotation(center: Vector2, speed: number) // UV旋转

// 噪声和纹理
.addNoise(scale: number, strength: number)     // 程序化噪声
.addTexture(texture: Texture, uvSource: string) // 纹理采样

// 颜色和效果
.addColorGradient(start: Color, end: Color, factor: string) // 颜色渐变
.addDissolve(threshold: number, edgeWidth: number)          // 溶解效果
.addGlow(intensity: number, falloff: number)               // 发光效果

// 自定义
.setOutput(glslCode: string)            // 自定义输出逻辑
.addCustomFunction(name: string, code: string) // 添加自定义函数
```

## 📋 **方式4：模板系统**

### **使用预定义模板**
```typescript
import { CodeDrivenParticleMaterial } from './CodeDrivenParticles'

const creator = new CodeDrivenParticleMaterial()

// 使用模板
const fireMaterial = creator.createFromTemplate('fire', {
  intensity: 1.5,
  speed: new Vector2(0.2, 0.3)
})

const smokeMaterial = creator.createFromTemplate('smoke', {
  density: 0.8,
  color: new Color(0.3, 0.3, 0.3)
})

const magicMaterial = creator.createFromTemplate('magic', {
  color: new Color(0.5, 0, 1),
  speed: 2.0,
  sparkles: true
})
```

### **自定义模板**
```typescript
// 注册新模板
ParticleTemplates.lightning = (creator, params) => {
  const fragmentShader = `
    float electricNoise(vec2 uv, float time) {
      // 电流噪声算法
      return sin(uv.x * 10.0 + time * 5.0) * sin(uv.y * 15.0 + time * 3.0);
    }
    
    void main() {
      float electric = electricNoise(vUv, uTime);
      vec3 lightningColor = vec3(0.8, 0.9, 1.0);
      float alpha = abs(electric) * ${params.intensity || 1.0};
      
      gl_FragColor = vec4(lightningColor, alpha);
    }
  `
  
  return creator.createFromGLSL(fragmentShader)
}

// 使用自定义模板
const lightningMaterial = creator.createFromTemplate('lightning', {
  intensity: 2.0
})
```

## 🏭 **方式5：工厂函数**

### **专业化粒子创建**
```typescript
import { ParticleEffectFactory } from './CodeDrivenExamples'

// 发光粒子
const glowMaterial = ParticleEffectFactory.createGlow(
  new Color(1, 0.5, 0),  // 橙色
  2.0                    // 强度
)

// 星星粒子
const starMaterial = ParticleEffectFactory.createStar(5) // 5角星

// 雨滴粒子
const rainMaterial = ParticleEffectFactory.createRainDrop()

// 自定义工厂函数
function createExplosionParticles(size: number, color: Color): ShaderMaterial {
  const creator = new CodeDrivenParticleMaterial()
  
  const fragmentShader = `
    void main() {
      vec2 center = vec2(0.5);
      float distance = length(vUv - center);
      
      // 爆炸扩散效果
      float expansion = vParticleAge * ${size.toFixed(1)};
      float ring = 1.0 - smoothstep(expansion - 0.1, expansion + 0.1, distance);
      
      vec3 explosionColor = uColor.rgb * (2.0 - vParticleAge);
      float alpha = ring * (1.0 - vParticleAge);
      
      gl_FragColor = vec4(explosionColor, alpha);
    }
  `
  
  return creator.createFromGLSL(fragmentShader, {
    uColor: { value: color }
  })
}
```

## 🎮 **实际使用场景示例**

### **游戏技能特效**
```typescript
// 火球术
const fireballMaterial = createFireParticles({
  speed: new Vector2(0.3, 0.5),
  intensity: 2.0,
  colorStart: new Color(1, 1, 0.5),
  colorEnd: new Color(1, 0.2, 0)
})

// 冰霜术
const frostMaterial = createCustomParticles()
  .addNoise(5.0, 0.8)
  .addColorGradient(
    new Color(0.8, 0.9, 1.0),  // 浅蓝
    new Color(0.2, 0.4, 0.8)   // 深蓝
  )
  .setOutput(`
    float frost = noiseValue * (1.0 - vParticleAge);
    gl_FragColor = vec4(gradientColor, frost);
  `)
  .build()

// 治疗术
const healMaterial = ParticleEffectFactory.createGlow(
  new Color(0.2, 1.0, 0.2),  // 绿色
  1.5
)
```

### **环境特效**
```typescript
// 篝火
const campfireMaterial = createFireParticles({
  speed: new Vector2(0.05, 0.15),
  intensity: 1.2,
  noiseScale: 2.0
})

// 雨天
const rainMaterial = ParticleEffectFactory.createRainDrop()

// 雪花
const snowMaterial = createCustomParticles()
  .addUVRotation(new Vector2(0.5, 0.5), 0.5)
  .setOutput(`
    vec2 center = vec2(0.5);
    float distance = length(vUv - center);
    float snowflake = 1.0 - smoothstep(0.0, 0.4, distance);
    
    gl_FragColor = vec4(vec3(1.0), snowflake * 0.8);
  `)
  .build()
```

### **UI特效**
```typescript
// 按钮点击特效
const clickEffect = createCustomParticles()
  .addColorGradient(
    new Color(1, 1, 1),    // 白色
    new Color(0, 0.5, 1)   // 蓝色
  )
  .setOutput(`
    vec2 center = vec2(0.5);
    float distance = length(vUv - center);
    float ring = 1.0 - smoothstep(vParticleAge - 0.1, vParticleAge + 0.1, distance);
    
    gl_FragColor = vec4(gradientColor, ring);
  `)
  .build()

// 加载动画
const loadingEffect = createCustomParticles()
  .addUVRotation(new Vector2(0.5, 0.5), 2.0)
  .setOutput(`
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float progress = (angle + 3.14159) / (2.0 * 3.14159);
    float loadingRing = step(progress, uLoadingProgress);
    
    gl_FragColor = vec4(vec3(0, 1, 1), loadingRing);
  `)
  .build()
```

## 🚀 **性能优化建议**

### **1. 着色器优化**
```glsl
// ❌ 避免复杂的循环
for (int i = 0; i < 100; i++) { ... }

// ✅ 使用预计算或查找表
float precomputedValue = texture2D(uLookupTexture, vec2(input, 0.5)).r;

// ❌ 避免动态分支
if (someComplexCondition) { ... }

// ✅ 使用数学函数替代
float factor = step(threshold, value);
```

### **2. Uniform优化**
```typescript
// ❌ 每帧都设置uniform
material.uniforms.uTime.value = time

// ✅ 只在值改变时设置
if (material.uniforms.uTime.value !== time) {
  material.uniforms.uTime.value = time
}

// ✅ 批量更新uniform
const uniforms = material.uniforms
uniforms.uTime.value = time
uniforms.uIntensity.value = intensity
```

### **3. 材质复用**
```typescript
// ✅ 相同效果复用材质
const sharedFireMaterial = createFireParticles()

// 多个粒子系统使用同一材质
particleSystem1.material = sharedFireMaterial
particleSystem2.material = sharedFireMaterial
```

## 🎯 **总结**

代码驱动粒子系统提供了多种灵活的创建方式：

1. **直接GLSL**：最大自由度，适合复杂自定义效果
2. **预设配置**：快速实现常见效果，参数可调
3. **函数式构建**：模块化组合，代码清晰
4. **模板系统**：标准化效果，开箱即用
5. **工厂函数**：专业化创建，高效便捷

选择合适的方式可以大大提高开发效率，同时保持代码的可维护性和性能！🎉
