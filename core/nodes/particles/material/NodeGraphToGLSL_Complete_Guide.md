# 🎯 材质节点连连看 → GLSL → Three.js 完整指南

## 📊 **数据结构流程图**

```
Vue Flow编辑器数据 → QAQ统一数据结构 → GLSL代码生成 → Three.js材质
     ↓                    ↓                ↓              ↓
  节点+连接           MaterialGraph      Shader代码    ShaderMaterial
```

## 🔗 **1. 节点连连看数据结构**

### **节点图数据示例：UV流动火焰效果**
```typescript
const fireGraph: MaterialGraph = {
  nodes: [
    // 时间节点 - 提供动画驱动
    {
      id: 'time_node',
      data: {
        nodeType: 'time',
        outputValues: { time: 0 },
        properties: {
          glslCode: 'uniform float uTime;',
          outputValue: 'uTime'
        }
      }
    },
    
    // UV坐标节点 - 提供纹理坐标
    {
      id: 'uv_node', 
      data: {
        nodeType: 'uv_coordinate',
        outputValues: { uv: [0, 0] },
        properties: {
          glslCode: 'varying vec2 vUv;',
          outputValue: 'vUv'
        }
      }
    },
    
    // UV流动节点 - 实现纹理滚动
    {
      id: 'uv_panner',
      data: {
        nodeType: 'uv_panner',
        inputValues: { speed: [0.1, 0.2] }, // X,Y方向速度
        properties: {
          glslFunction: 'uvPanner',
          glslCode: `
            vec2 uvPanner(vec2 uv, float time, vec2 speed) {
              return uv + time * speed;  // UV随时间偏移
            }
          `
        }
      }
    },
    
    // 纹理采样节点
    {
      id: 'fire_texture',
      data: {
        nodeType: 'texture_sample',
        inputValues: { texture: 'fire_texture.jpg' },
        properties: {
          glslCode: `
            uniform sampler2D uFireTexture;
            vec4 sampleTexture(vec2 uv) {
              return texture2D(uFireTexture, uv);
            }
          `
        }
      }
    }
  ],
  
  connections: [
    // 时间 → UV流动
    {
      source: 'time_node',
      target: 'uv_panner', 
      sourceHandle: 'time',
      targetHandle: 'time',
      dataType: DataType.FLOAT
    },
    
    // UV坐标 → UV流动
    {
      source: 'uv_node',
      target: 'uv_panner',
      sourceHandle: 'uv', 
      targetHandle: 'uv',
      dataType: DataType.VEC2
    },
    
    // UV流动 → 纹理采样
    {
      source: 'uv_panner',
      target: 'fire_texture',
      sourceHandle: 'result',
      targetHandle: 'uv', 
      dataType: DataType.VEC2
    }
  ]
}
```

## ⚙️ **2. GLSL代码生成过程**

### **步骤1：依赖图分析**
```typescript
// 构建节点依赖关系
const dependencies = {
  'uv_panner': ['time_node', 'uv_node'],
  'fire_texture': ['uv_panner'],
  'output': ['fire_texture']
}
```

### **步骤2：函数代码生成**
```glsl
// 生成的GLSL函数库
float getTime() {
  return uTime;
}

vec2 uvPanner(vec2 uv, float time, vec2 speed) {
  return uv + time * speed;
}

vec4 sampleTexture(vec2 uv) {
  return texture2D(uFireTexture, uv);
}
```

### **步骤3：主函数代码生成**
```glsl
void main() {
  // 按依赖顺序执行节点
  float node_time_node_time = getTime();
  vec2 node_uv_node_uv = vUv;
  
  vec2 node_uv_panner_result = uvPanner(
    node_uv_node_uv, 
    node_time_node_time, 
    vec2(0.1, 0.2)
  );
  
  vec4 node_fire_texture_color = sampleTexture(node_uv_panner_result);
  
  // 最终输出
  gl_FragColor = node_fire_texture_color;
  if (gl_FragColor.a < 0.001) discard;
}
```

## 🎨 **3. Unity风格特效节点示例**

### **UV流动节点 (UV Panner)**
```typescript
{
  name: 'UV Panner',
  inputs: [
    { id: 'uv', type: DataType.VEC2 },
    { id: 'time', type: DataType.FLOAT },
    { id: 'speed', type: DataType.VEC2, defaultValue: [0.1, 0.1] }
  ],
  outputs: [
    { id: 'result', type: DataType.VEC2 }
  ],
  glslCode: `
    vec2 uvPanner(vec2 uv, float time, vec2 speed) {
      return uv + time * speed;
    }
  `
}
```

### **UV旋转节点 (UV Rotator)**
```typescript
{
  name: 'UV Rotator',
  inputs: [
    { id: 'uv', type: DataType.VEC2 },
    { id: 'center', type: DataType.VEC2, defaultValue: [0.5, 0.5] },
    { id: 'rotation', type: DataType.FLOAT }
  ],
  glslCode: `
    vec2 uvRotator(vec2 uv, vec2 center, float rotation) {
      float c = cos(rotation);
      float s = sin(rotation);
      mat2 rotMatrix = mat2(c, -s, s, c);
      return rotMatrix * (uv - center) + center;
    }
  `
}
```

### **简单噪声节点 (Simple Noise)**
```typescript
{
  name: 'Simple Noise',
  inputs: [
    { id: 'uv', type: DataType.VEC2 },
    { id: 'scale', type: DataType.FLOAT, defaultValue: 1.0 }
  ],
  glslCode: `
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float simpleNoise(vec2 uv, float scale) {
      vec2 p = uv * scale;
      vec2 i = floor(p);
      vec2 f = fract(p);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
  `
}
```

### **溶解节点 (Dissolve)**
```typescript
{
  name: 'Dissolve',
  inputs: [
    { id: 'baseColor', type: DataType.COLOR },
    { id: 'noiseTexture', type: DataType.TEXTURE },
    { id: 'threshold', type: DataType.FLOAT, defaultValue: 0.5 },
    { id: 'edgeWidth', type: DataType.FLOAT, defaultValue: 0.1 }
  ],
  glslCode: `
    vec4 dissolveEffect(vec4 baseColor, sampler2D noiseTexture, vec2 uv, float threshold, float edgeWidth) {
      float noise = texture2D(noiseTexture, uv).r;
      
      // 溶解遮罩
      float dissolveMask = step(threshold, noise);
      
      // 边缘发光
      float edge = smoothstep(threshold - edgeWidth, threshold, noise);
      vec3 edgeColor = vec3(1.0, 0.5, 0.0); // 橙色边缘
      
      vec3 finalColor = mix(edgeColor, baseColor.rgb, edge);
      float finalAlpha = baseColor.a * dissolveMask;
      
      return vec4(finalColor, finalAlpha);
    }
  `
}
```

## 🔧 **4. Three.js材质创建流程**

### **完整的材质创建代码**
```typescript
// 1. 创建材质图
const fireGraph = createUVFlowFireExample()

// 2. 验证图结构
const validation = graphValidator.validateGraph(fireGraph)
if (!validation.valid) {
  throw new Error('材质图验证失败')
}

// 3. 生成GLSL代码
const codeGenerator = new GLSLCodeGenerator(fireGraph)
const { vertexShader, fragmentShader, uniforms } = codeGenerator.generateShaders()

// 4. 创建Three.js材质
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: true,
  depthWrite: false,
  depthTest: true
})

// 5. 设置纹理
const textureLoader = new TextureLoader()
textureLoader.load('/textures/fire.jpg', (texture) => {
  material.uniforms.uFireTexture.value = texture
})

// 6. 动画更新
function animate(time) {
  material.uniforms.uTime.value = time * 0.001
  material.uniforms.uDeltaTime.value = 0.016
}
```

## 🌊 **5. 复杂特效组合示例**

### **水流特效节点组合**
```
时间节点 → UV流动1 (主流动) → 噪声1 (主波纹)
       → UV流动2 (细节流动) → 噪声2 (细节波纹) → 乘法混合 → 颜色渐变 → 输出
       → UV旋转 (漩涡效果) → 噪声3 (扰动) ↗
```

### **火焰特效节点组合**
```
粒子年龄 → 颜色渐变 (黄→橙→红→透明)
时间 → UV流动 → 火焰纹理 → 乘法 → 输出
     → 噪声 (扰动) → 加法 (闪烁) ↗
```

### **魔法特效节点组合**
```
时间 → 正弦波 → UV旋转 → 星形纹理
     → 余弦波 → UV缩放 → 光晕纹理 → 加法混合 → 菲涅尔 → 输出
粒子速度 → 长度 → 拖尾强度 ↗
```

## 📈 **6. 性能优化策略**

### **编译时优化**
- **死代码消除**：移除未连接的节点
- **常量折叠**：预计算常量表达式
- **函数内联**：内联简单函数调用

### **运行时优化**
- **Uniform缓存**：避免重复设置相同值
- **纹理复用**：共享相同纹理资源
- **LOD切换**：根据距离使用简化版本

### **内存优化**
- **材质实例化**：相同图共享编译结果
- **纹理压缩**：使用压缩纹理格式
- **缓冲区池**：复用GPU缓冲区

## 🎯 **7. 实际使用场景**

### **游戏特效**
- 火焰、烟雾、爆炸效果
- 魔法技能、光环效果
- 水面、熔岩、能量场

### **UI特效**
- 按钮发光、边框动画
- 加载动画、进度条
- 背景粒子、装饰效果

### **环境效果**
- 天气系统（雨、雪、雾）
- 大气散射、体积光
- 植被摆动、水面波纹

## 🚀 **8. 扩展性设计**

### **自定义节点**
```typescript
// 注册新节点类型
nodeRegistry.register({
  type: 'custom_effect',
  name: 'Custom Effect',
  inputs: [...],
  outputs: [...],
  glslCode: `...`
})
```

### **节点库扩展**
- Unity ShaderGraph节点移植
- Blender Shader Nodes兼容
- 自定义业务逻辑节点

### **导入导出**
- 支持多种格式（JSON、GLSL、Unity）
- 版本兼容性管理
- 云端材质库同步

这个完整的系统实现了从可视化节点编辑到高性能GLSL着色器的无缝转换，为创建复杂的粒子特效提供了强大而灵活的工具链！🎉
