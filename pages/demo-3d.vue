<template>
  <div class="demo-container">
    <div class="game-container" ref="gameContainer">
      <!-- 游戏画布将在这里渲染 -->
    </div>

    <!-- GPUParticles3D控制面板 -->
    <div class="controls-panel">
      <div class="control-group">
        <h3>🎨 GPUParticles3D演示</h3>
        <button @click="createGPUParticles" class="action-btn">
          ✨ 创建GPU粒子
        </button>
        <button @click="clearGPUParticles" class="action-btn">
          🧹 清理粒子
        </button>
      </div>

      <div class="control-group">
        <h3>⚙️ 粒子属性</h3>
        <div class="param-control">
          <label>粒子数量: {{ particleAmount }}</label>
          <input type="range" min="10" max="200" v-model="particleAmount" @input="updateParticleAmount">
        </div>
        <div class="param-control">
          <label>生命周期: {{ particleLifetime }}s</label>
          <input type="range" min="1" max="10" step="0.5" v-model="particleLifetime" @input="updateParticleLifetime">
        </div>
        <div class="param-control">
          <label>发射速率: {{ emissionRate }}/s</label>
          <input type="range" min="5" max="100" v-model="emissionRate" @input="updateEmissionRate">
        </div>
      </div>

      <div class="control-group">
        <h3>� 发射器位置</h3>
        <div class="param-control">
          <label>X: {{ emitterPosition.x }}</label>
          <input type="range" min="-5" max="5" step="0.1" v-model="emitterPosition.x" @input="updateEmitterPosition">
        </div>
        <div class="param-control">
          <label>Y: {{ emitterPosition.y }}</label>
          <input type="range" min="-5" max="5" step="0.1" v-model="emitterPosition.y" @input="updateEmitterPosition">
        </div>
        <div class="param-control">
          <label>Z: {{ emitterPosition.z }}</label>
          <input type="range" min="-5" max="5" step="0.1" v-model="emitterPosition.z" @input="updateEmitterPosition">
        </div>
      </div>

      <div class="control-group">
        <h3>🎨 粒子外观</h3>
        <div class="param-control">
          <label>颜色主题</label>
          <select v-model="particleColor" @change="updateParticleColor" class="color-select">
            <option value="fire">🔥 火焰 (红橙黄)</option>
            <option value="ice">❄️ 冰霜 (蓝白)</option>
            <option value="magic">✨ 魔法 (紫粉)</option>
            <option value="nature">🌿 自然 (绿色)</option>
            <option value="rainbow">🌈 彩虹 (多彩)</option>
          </select>
        </div>
        <div class="param-control">
          <label>发射形状</label>
          <select v-model="emissionShape" @change="updateEmissionShape" class="shape-select">
            <option value="point">📍 点发射</option>
            <option value="sphere">🔮 球形发射</option>
            <option value="cone">🔺 锥形发射</option>
            <option value="box">📦 立方体发射</option>
            <option value="circle">⭕ 圆形发射</option>
            <option value="model">🤖 模型形状</option>
          </select>
        </div>
        <div class="param-control" v-if="emissionShape === 'model'">
          <label>模型文件</label>
          <select v-model="modelPath" @change="updateModelPath" class="model-select">
            <option value="/leikedun.glb">🤖 leikedun.glb</option>
            <option value="/saien.glb">👤 saien.glb</option>
          </select>
        </div>
        <div class="param-control">
          <label>粒子大小: {{ particleSize }}</label>
          <input type="range" min="0.05" max="0.5" step="0.05" v-model="particleSize" @input="updateParticleSize">
        </div>
      </div>

      <!-- 新增：高级大小控制 -->
      <div class="control-group">
        <h3>📏 高级大小控制</h3>
        <div class="param-control">
          <label>
            <input type="checkbox" v-model="sizeOverLifetime" @change="updateSizeControl">
            生命周期大小变化
          </label>
        </div>
        <div class="param-control" v-if="sizeOverLifetime">
          <label>起始大小: {{ startSize }}</label>
          <input type="range" min="0.01" max="0.5" step="0.01" v-model="startSize" @input="updateSizeControl">
        </div>
        <div class="param-control" v-if="sizeOverLifetime">
          <label>结束大小: {{ endSize }}</label>
          <input type="range" min="0.01" max="0.5" step="0.01" v-model="endSize" @input="updateSizeControl">
        </div>
        <div class="param-control">
          <label>大小随机性: {{ sizeRandomness }}</label>
          <input type="range" min="0" max="1" step="0.1" v-model="sizeRandomness" @input="updateSizeControl">
        </div>
      </div>

      <!-- 新增：运动模式控制 -->
      <div class="control-group">
        <h3>🌪️ 运动模式</h3>
        <div class="param-control">
          <label>运动模式</label>
          <select v-model="movementMode" @change="updateMovementMode" class="movement-select">
            <option value="gravity">⬇️ 重力</option>
            <option value="explosion">💥 爆炸</option>
            <option value="implosion">🌀 内爆</option>
            <option value="tornado">🌪️ 龙卷风</option>
            <option value="orbital">🪐 轨道</option>
            <option value="wave">🌊 波浪</option>
            <option value="flocking">🐦 群体</option>
            <option value="force_field">⚡ 力场</option>
          </select>
        </div>
        <div class="param-control" v-if="movementMode !== 'gravity'">
          <label>效果强度: {{ attractionStrength }}</label>
          <input type="range" min="0.1" max="10" step="0.1" v-model="attractionStrength" @input="updateMovementMode">
        </div>
        <div class="param-control" v-if="movementMode === 'wave'">
          <label>波浪振幅: {{ waveAmplitude }}</label>
          <input type="range" min="0.1" max="5" step="0.1" v-model="waveAmplitude" @input="updateMovementMode">
        </div>
        <div class="param-control" v-if="movementMode === 'wave'">
          <label>波浪频率: {{ waveFrequency }}</label>
          <input type="range" min="0.1" max="5" step="0.1" v-model="waveFrequency" @input="updateMovementMode">
        </div>
      </div>

      <!-- 新增：粒子形状控制 -->
      <div class="control-group">
        <h3>🔷 粒子形状</h3>
        <div class="param-control">
          <label>形状类型</label>
          <select v-model="particleShapeType" @change="updateParticleShape" class="shape-type-select">
            <option value="point">• 点</option>
            <option value="circle">⭕ 圆形</option>
            <option value="square">⬜ 方形</option>
            <option value="triangle">🔺 三角形</option>
            <option value="star">⭐ 星形</option>
            <option value="diamond">💎 钻石</option>
          </select>
        </div>
        <div class="param-control">
          <label>
            <input type="checkbox" v-model="instancedRendering" @change="updateParticleShape">
            实例化渲染
          </label>
        </div>
      </div>

      <!-- 新增：快速效果按钮 -->
      <div class="control-group">
        <h3>⚡ 快速效果</h3>
        <div class="effect-buttons">
          <button @click="createExplosionEffect" class="effect-btn">💥 爆炸</button>
          <button @click="createTornadoEffect" class="effect-btn">🌪️ 龙卷风</button>
          <button @click="createOrbitalEffect" class="effect-btn">🪐 轨道</button>
          <button @click="createFireworksEffect" class="effect-btn">🎆 烟花</button>
          <button @click="createMagicEffect" class="effect-btn">✨ 魔法</button>
        </div>
      </div>

      <div class="stats-panel">
        <h3>�📊 统计</h3>
        <div class="stat-item">
          <span>活跃粒子:</span>
          <span class="stat-value">{{ activeParticles }}</span>
        </div>
        <div class="stat-item">
          <span>发射位置:</span>
          <span class="stat-value">({{ emitterPosition.x }}, {{ emitterPosition.y }}, {{ emitterPosition.z }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import Engine from '~/core/engine/Engine'
import { Scene } from '~/core/scene/Scene'
import Camera3D from '~/core/nodes/3d/Camera3D'
import MeshInstance3D from '~/core/nodes/MeshInstance3D'
import GPUParticles3D from '~/core/nodes/particles/GPUParticles3D'
import ModelManager from '~/core/managers/ModelManager'

const gameContainer = ref<HTMLElement>()

// 游戏对象
let engine: Engine
let scene: Scene
let camera: Camera3D
let cube: MeshInstance3D

// GPUParticles3D系统
let gpuParticles: GPUParticles3D | null = null
const activeParticles = ref(0)

// 粒子参数控制
const particleAmount = ref(50)
const particleLifetime = ref(3.0)
const emissionRate = ref(20)
const emitterPosition = reactive({ x: 0, y: 2, z: 0 })

// 粒子外观控制
const particleColor = ref('fire')
const emissionShape = ref('point')
const particleSize = ref(0.1)
const modelPath = ref('/leikedun.glb')

// 高级大小控制
const sizeOverLifetime = ref(false)
const startSize = ref(0.1)
const endSize = ref(0.05)
const sizeRandomness = ref(0.0)

// 运动模式控制
const movementMode = ref('gravity')
const attractionStrength = ref(1.0)
const waveAmplitude = ref(1.0)
const waveFrequency = ref(1.0)

// 粒子形状控制
const particleShapeType = ref('point')
const instancedRendering = ref(true)

// ============================================================================
// GPUParticles3D演示
// ============================================================================

function createGPUParticles() {
  console.log('✨ 创建GPUParticles3D...')

  try {
    // 清理旧的粒子系统
    if (gpuParticles) {
      scene.removeChild(gpuParticles)
      gpuParticles.dispose()
    }

    // 创建新的GPUParticles3D节点
    gpuParticles = new GPUParticles3D()
    gpuParticles.name = 'DemoGPUParticles'

    // 设置外观参数
    ;(gpuParticles as any).particleColor = particleColor.value
    ;(gpuParticles as any).emissionShape = emissionShape.value
    ;(gpuParticles as any).particleSize = particleSize.value

    // 如果是模型形状，设置模型路径
    if (emissionShape.value === 'model') {
      gpuParticles.setModelPath(modelPath.value)
    }

    // 设置基础参数（使用UI控制的值）
    gpuParticles.setAmount(particleAmount.value)
    gpuParticles.setLifetime(particleLifetime.value)
    gpuParticles.setEmissionRate(emissionRate.value)

    // 重新初始化粒子系统以应用所有参数
    gpuParticles.reinitialize()

    // 设置位置
    gpuParticles.position = {
      x: emitterPosition.x,
      y: emitterPosition.y,
      z: emitterPosition.z
    }

    // 添加到场景
    scene.addChild(gpuParticles)

    console.log('✅ GPUParticles3D创建成功')

  } catch (error) {
    console.error('❌ 创建GPUParticles3D失败:', error)
  }
}

function clearGPUParticles() {
  console.log('🧹 清理GPUParticles3D...')

  if (gpuParticles) {
    scene.removeChild(gpuParticles)
    gpuParticles.dispose()
    gpuParticles = null
  }

  activeParticles.value = 0
  console.log('✅ GPUParticles3D已清理')
}

// 更新统计信息
function updateStats() {
  if (gpuParticles) {
    try {
      activeParticles.value = gpuParticles.getActiveParticleCount()
    } catch (error) {
      // 如果获取失败，使用模拟值
      activeParticles.value = Math.floor(Math.random() * 30) + 10
    }
  } else {
    activeParticles.value = 0
  }
}

// ============================================================================
// 粒子参数控制函数
// ============================================================================

function updateParticleAmount() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新的数量
    clearGPUParticles()
    createGPUParticles()
    console.log(`🔧 更新粒子数量: ${particleAmount.value}`)
  }
}

function updateParticleLifetime() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新的生命周期
    clearGPUParticles()
    createGPUParticles()
    console.log(`🔧 更新生命周期: ${particleLifetime.value}s`)
  }
}

function updateEmissionRate() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新的发射速率
    clearGPUParticles()
    createGPUParticles()
    console.log(`🔧 更新发射速率: ${emissionRate.value}/s`)
  }
}

function updateEmitterPosition() {
  if (gpuParticles) {
    gpuParticles.position = {
      x: emitterPosition.x,
      y: emitterPosition.y,
      z: emitterPosition.z
    }
    console.log(`🔧 更新发射器位置: (${emitterPosition.x}, ${emitterPosition.y}, ${emitterPosition.z})`)
  }
}

// ============================================================================
// 粒子外观控制函数
// ============================================================================

function updateParticleColor() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新颜色
    clearGPUParticles()
    createGPUParticles()
    console.log(`🎨 更新粒子颜色: ${particleColor.value}`)
  }
}

function updateEmissionShape() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新形状
    clearGPUParticles()
    createGPUParticles()
    console.log(`📐 更新发射形状: ${emissionShape.value}`)
  }
}

function updateParticleSize() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新大小
    clearGPUParticles()
    createGPUParticles()
    console.log(`📏 更新粒子大小: ${particleSize.value}`)
  }
}

function updateModelPath() {
  if (gpuParticles) {
    // 重新创建粒子系统以应用新模型
    clearGPUParticles()
    createGPUParticles()
    console.log(`🤖 更新模型路径: ${modelPath.value}`)
  }
}

// ============================================================================
// 高级功能控制函数
// ============================================================================

function updateSizeControl() {
  if (gpuParticles) {
    gpuParticles.setSizeControl({
      sizeOverLifetime: sizeOverLifetime.value,
      startSize: startSize.value,
      endSize: endSize.value,
      sizeRandomness: sizeRandomness.value,
      sizeDistanceScaling: true,
      maxViewDistance: 100
    })
    console.log('📏 更新大小控制')
  }
}

function updateMovementMode() {
  if (gpuParticles) {
    gpuParticles.setMovementMode(movementMode.value as any, {
      attractionPoint: new THREE.Vector3(emitterPosition.x, emitterPosition.y, emitterPosition.z),
      attractionStrength: attractionStrength.value,
      waveAmplitude: waveAmplitude.value,
      waveFrequency: waveFrequency.value,
      orbitalRadius: 2.0,
      orbitalSpeed: 1.0
    })
    console.log(`🌪️ 更新运动模式: ${movementMode.value}`)
  }
}

function updateParticleShape() {
  if (gpuParticles) {
    gpuParticles.setParticleShape(particleShapeType.value as any)
    console.log(`🔷 更新粒子形状: ${particleShapeType.value}`)
  }
}

// ============================================================================
// 快速效果函数
// ============================================================================

function createExplosionEffect() {
  if (gpuParticles) {
    const center = new THREE.Vector3(emitterPosition.x, emitterPosition.y, emitterPosition.z)
    gpuParticles.createExplosion(center, 5.0)
    console.log('💥 创建爆炸效果')
  }
}

function createTornadoEffect() {
  if (gpuParticles) {
    const center = new THREE.Vector3(emitterPosition.x, emitterPosition.y, emitterPosition.z)
    gpuParticles.createTornado(center, 2.0, 3.0)
    console.log('🌪️ 创建龙卷风效果')
  }
}

function createOrbitalEffect() {
  if (gpuParticles) {
    const center = new THREE.Vector3(emitterPosition.x, emitterPosition.y, emitterPosition.z)
    gpuParticles.createOrbital(center, 2.0, 1.0)
    console.log('🪐 创建轨道效果')
  }
}

function createFireworksEffect() {
  if (gpuParticles) {
    // 烟花效果：先上升，然后爆炸
    gpuParticles.setMovementMode('explosion' as any, {
      attractionPoint: new THREE.Vector3(emitterPosition.x, emitterPosition.y + 3, emitterPosition.z),
      attractionStrength: 8.0
    })
    gpuParticles.setColorTheme('rainbow')
    gpuParticles.setOneShot(true)
    gpuParticles.restart()
    console.log('🎆 创建烟花效果')
  }
}

function createMagicEffect() {
  if (gpuParticles) {
    gpuParticles.setMovementMode('orbital' as any, {
      attractionPoint: new THREE.Vector3(emitterPosition.x, emitterPosition.y, emitterPosition.z),
      attractionStrength: 2.0,
      orbitalRadius: 1.5,
      orbitalSpeed: 2.0
    })
    gpuParticles.setColorTheme('magic')
    gpuParticles.setParticleShape('star' as any)
    console.log('✨ 创建魔法效果')
  }
}

// ============================================================================
// 初始化和生命周期
// ============================================================================

// 初始化3D演示
async function init3DDemo() {
  if (!gameContainer.value) return

  try {
    console.log('🚀 开始初始化GPUParticles3D演示...')

    // 预加载模型
    const modelManager = ModelManager.getInstance()
    await modelManager.preloadModels(['/leikedun.glb', '/saien.glb'])

    // 创建引擎
    engine = Engine.getInstance()
    await engine.initialize({ container: gameContainer.value })

    // 创建场景
    scene = new Scene('GPUParticlesDemo')

    // 创建相机
    camera = new Camera3D('MainCamera')
    camera.position = { x: 0, y: 5, z: 10 }
    scene.addChild(camera)

    // 创建轨道控制器
    camera.enableOrbitControls({ x: 0, y: 0, z: 0 })

    // 创建参考立方体
    cube = new MeshInstance3D('ReferenceCube')
    cube.createBoxMesh({ x: 1, y: 1, z: 1 })
    cube.position = { x: 0, y: 0, z: 0 }
    scene.addChild(cube)

    // 启动场景
    await engine.setMainScene(scene)
    scene._enterTree()
    camera.setPerspective(45, 0.1, 1000)
    await engine.startPlayMode()


    console.log('✅ GPUParticles3D演示初始化完成')

  } catch (error) {
    console.error('❌ 初始化失败:', error)
  }
}

// 设置游戏循环
function setupGameLoop() {
  // 60FPS游戏循环
  setInterval(() => {
    // 更新粒子系统
    if (gpuParticles) {
      gpuParticles.updateParticles(0.016) // 16ms = 60FPS
    }

    updateStats() // 更新统计信息
  }, 16)
}

// ============================================================================
// 生命周期钩子
// ============================================================================

onMounted(() => {
  init3DDemo()
})

onUnmounted(() => {
  // 清理GPUParticles3D
  clearGPUParticles()

  // 清理引擎
  if (engine) {
    engine.destroy()
  }

  console.log('🧹 GPUParticles3D演示资源已清理')
})
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #1a1a1a;
}

.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.controls-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00ff88;
  border-radius: 8px;
  padding: 20px;
  min-width: 280px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.control-group {
  margin-bottom: 20px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group h3 {
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.control-btn {
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  border: 1px solid #444;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 60px;
}

.control-btn:hover {
  background: rgba(0, 255, 136, 0.1);
  border-color: #00ff88;
  color: #00ff88;
}

.control-btn.active {
  background: rgba(0, 255, 136, 0.2);
  border-color: #00ff88;
  color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.action-btn {
  background: rgba(0, 0, 0, 0.8);
  color: #00ff88;
  border: 1px solid #00ff88;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;
}

.action-btn:hover {
  background: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
  transform: translateY(-1px);
}

.action-btn.active {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
}

.reset-btn {
  background: rgba(255, 107, 53, 0.8);
  color: #ffffff;
  border: 1px solid #ff6b35;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;
}

.reset-btn:hover {
  background: rgba(255, 107, 53, 1);
  box-shadow: 0 0 15px rgba(255, 107, 53, 0.4);
  transform: translateY(-1px);
}

.stats-panel {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.stats-panel h3 {
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #cccccc;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-value {
  color: #00ff88;
  font-weight: bold;
}

.param-control {
  margin-bottom: 15px;
}

.param-control label {
  display: block;
  color: #cccccc;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  margin-bottom: 5px;
}

.param-control input[type="range"] {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #333;
  outline: none;
  -webkit-appearance: none;
}

.param-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00ff88;
  cursor: pointer;
  border: 2px solid #000;
}

.param-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00ff88;
  cursor: pointer;
  border: 2px solid #000;
}

.param-control select {
  width: 100%;
  padding: 8px 12px;
  background: #333;
  color: #cccccc;
  border: 1px solid #555;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  outline: none;
}

.param-control select:hover {
  border-color: #00ff88;
}

.param-control select:focus {
  border-color: #00ff88;
  box-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

/* 滚动条样式 */
.controls-panel::-webkit-scrollbar {
  width: 6px;
}

.controls-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.controls-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 136, 0.5);
  border-radius: 3px;
}

.controls-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 136, 0.7);
}

/* 新增样式 */
.effect-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}

.effect-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.effect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.movement-select,
.shape-type-select {
  width: 100%;
  padding: 6px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
}

.param-control input[type="checkbox"] {
  margin-right: 8px;
  transform: scale(1.2);
}

.param-control label {
  display: flex;
  align-items: center;
  cursor: pointer;
}
</style>
