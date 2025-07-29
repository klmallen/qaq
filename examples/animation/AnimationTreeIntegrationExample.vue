<!--
  QAQ游戏引擎 - AnimationTree集成示例
  
  展示如何使用AnimationTree编辑器和运行时系统
-->

<template>
  <div class="animation-tree-example">
    <div class="example-header">
      <h1>AnimationTree 集成示例</h1>
      <p>展示编辑器与运行时系统的完整集成</p>
    </div>

    <!-- 3D场景预览 -->
    <div class="scene-preview">
      <div class="preview-header">
        <h3>3D场景预览</h3>
        <div class="preview-controls">
          <UButton
            :color="autoRotate ? 'green' : 'gray'"
            size="sm"
            @click="autoRotate = !autoRotate"
          >
            自动旋转
          </UButton>
        </div>
      </div>
      <div ref="sceneContainer" class="scene-container"></div>
    </div>

    <!-- AnimationTree编辑器 -->
    <div class="editor-container">
      <QaqAnimationTreeEditor
        :initial-animation-tree="animationTree"
        :initial-animation-player="animationPlayer"
        @animation-tree-created="onAnimationTreeCreated"
        @parameter-changed="onParameterChanged"
        @state-selected="onStateSelected"
      />
    </div>

    <!-- 实时数据监控 -->
    <div class="data-monitor">
      <div class="monitor-header">
        <h3>实时数据监控</h3>
      </div>
      <div class="monitor-content">
        <div class="monitor-section">
          <h4>动画状态</h4>
          <div class="data-grid">
            <div class="data-item">
              <span class="data-label">当前状态:</span>
              <UBadge :color="currentState ? 'green' : 'gray'">
                {{ currentState || '无' }}
              </UBadge>
            </div>
            <div class="data-item">
              <span class="data-label">播放状态:</span>
              <UBadge :color="isPlaying ? 'blue' : 'gray'">
                {{ isPlaying ? '播放中' : '停止' }}
              </UBadge>
            </div>
            <div class="data-item">
              <span class="data-label">动画时间:</span>
              <span class="data-value">{{ animationTime.toFixed(2) }}s</span>
            </div>
          </div>
        </div>

        <div class="monitor-section">
          <h4>参数值</h4>
          <div class="parameter-monitor">
            <div
              v-for="param in parameters"
              :key="param.name"
              class="parameter-item"
            >
              <span class="param-name">{{ param.name }}:</span>
              <span class="param-value">{{ formatValue(param.currentValue) }}</span>
              <div class="param-bar">
                <div
                  class="param-fill"
                  :style="{ width: getParameterBarWidth(param) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="monitor-section">
          <h4>性能指标</h4>
          <div class="performance-grid">
            <div class="perf-item">
              <span class="perf-label">FPS:</span>
              <span class="perf-value">{{ fps }}</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">渲染时间:</span>
              <span class="perf-value">{{ renderTime.toFixed(2) }}ms</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">状态切换:</span>
              <span class="perf-value">{{ stateTransitions }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速测试面板 -->
    <div class="test-panel">
      <div class="test-header">
        <h3>快速测试</h3>
      </div>
      <div class="test-content">
        <div class="test-section">
          <h4>预设动画</h4>
          <div class="preset-buttons">
            <UButton
              v-for="preset in animationPresets"
              :key="preset.name"
              size="sm"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}
            </UButton>
          </div>
        </div>

        <div class="test-section">
          <h4>参数控制</h4>
          <div class="quick-controls">
            <div class="control-group">
              <label>速度:</label>
              <URange
                v-model="speedValue"
                :min="0"
                :max="10"
                :step="0.1"
                @update:model-value="setParameter('speed', $event)"
              />
              <span class="control-value">{{ speedValue.toFixed(1) }}</span>
            </div>
            <div class="control-group">
              <label>方向:</label>
              <URange
                v-model="directionValue"
                :min="-1"
                :max="1"
                :step="0.1"
                @update:model-value="setParameter('direction', $event)"
              />
              <span class="control-value">{{ directionValue.toFixed(1) }}</span>
            </div>
            <div class="control-group">
              <label>跳跃:</label>
              <UButton
                size="sm"
                @click="triggerJump"
              >
                触发跳跃
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import QaqAnimationTreeEditor from '../../components/editor/animation/QaqAnimationTreeEditor.vue'
import { animationTreeAdapter } from '../../components/editor/animation/AnimationTreeAdapter'
import AnimationTree from '../../core/nodes/animation/AnimationTree'
import AnimationPlayer from '../../core/nodes/animation/AnimationPlayer'
import { AnimationClip } from '../../core/animation/AnimationClip'

// ============================================================================
// 响应式数据
// ============================================================================

// Three.js相关
const sceneContainer = ref<HTMLElement>()
const scene = ref<THREE.Scene>()
const camera = ref<THREE.PerspectiveCamera>()
const renderer = ref<THREE.WebGLRenderer>()
const character = ref<THREE.Object3D>()

// 动画系统
const animationTree = ref<AnimationTree>()
const animationPlayer = ref<AnimationPlayer>()

// UI状态
const autoRotate = ref(true)
const speedValue = ref(0)
const directionValue = ref(0)

// 监控数据
const animationTime = ref(0)
const fps = ref(60)
const renderTime = ref(16.67)
const stateTransitions = ref(0)

// 适配器数据
const currentState = computed(() => animationTreeAdapter.currentState.value)
const isPlaying = computed(() => animationTreeAdapter.isPlaying.value)
const parameters = computed(() => animationTreeAdapter.parameters.value)

// 动画预设
const animationPresets = [
  {
    name: '待机',
    parameters: { speed: 0, direction: 0 }
  },
  {
    name: '行走',
    parameters: { speed: 3, direction: 0 }
  },
  {
    name: '跑步',
    parameters: { speed: 8, direction: 0 }
  },
  {
    name: '左转',
    parameters: { speed: 3, direction: -1 }
  },
  {
    name: '右转',
    parameters: { speed: 3, direction: 1 }
  }
]

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  initializeThreeJS()
  createCharacter()
  setupAnimationSystem()
  startRenderLoop()
  startPerformanceMonitoring()
})

onUnmounted(() => {
  cleanup()
})

// ============================================================================
// Three.js初始化
// ============================================================================

/**
 * 初始化Three.js场景
 */
function initializeThreeJS() {
  if (!sceneContainer.value) return

  // 创建场景
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0x2c3e50)

  // 创建相机
  camera.value = new THREE.PerspectiveCamera(
    75,
    sceneContainer.value.clientWidth / sceneContainer.value.clientHeight,
    0.1,
    1000
  )
  camera.value.position.set(0, 2, 5)

  // 创建渲染器
  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight)
  renderer.value.shadowMap.enabled = true
  renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
  sceneContainer.value.appendChild(renderer.value.domElement)

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.value.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.value.add(directionalLight)

  // 添加地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.value.add(ground)
}

/**
 * 创建角色
 */
function createCharacter() {
  if (!scene.value) return

  // 创建简单的角色模型
  const characterGroup = new THREE.Group()

  // 身体
  const bodyGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.4)
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.8
  body.castShadow = true
  characterGroup.add(body)

  // 头部
  const headGeometry = new THREE.SphereGeometry(0.3)
  const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf39c12 })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.9
  head.castShadow = true
  characterGroup.add(head)

  character.value = characterGroup
  scene.value.add(characterGroup)
}

/**
 * 设置动画系统
 */
function setupAnimationSystem() {
  if (!character.value) return

  // 创建AnimationPlayer
  animationPlayer.value = new AnimationPlayer('CharacterAnimationPlayer')

  // 创建示例动画片段
  const idleClip = new AnimationClip('idle', 2.0)
  const walkClip = new AnimationClip('walk', 1.0)
  const runClip = new AnimationClip('run', 0.6)

  animationPlayer.value.addAnimation('idle', idleClip)
  animationPlayer.value.addAnimation('walk', walkClip)
  animationPlayer.value.addAnimation('run', runClip)

  // 创建AnimationTree
  animationTree.value = new AnimationTree('CharacterAnimationTree')
  animationTree.value.setAnimationPlayer(animationPlayer.value)

  // 连接到适配器
  animationTreeAdapter.connectToAnimationTree(animationTree.value, animationPlayer.value)

  // 添加默认参数
  animationTreeAdapter.addParameter('speed', 'float', 0)
  animationTreeAdapter.addParameter('direction', 'float', 0)
  animationTreeAdapter.addParameter('jump', 'trigger', false)

  // 开始播放
  animationTreeAdapter.play()
}

// ============================================================================
// 渲染循环
// ============================================================================

/**
 * 开始渲染循环
 */
function startRenderLoop() {
  const animate = () => {
    requestAnimationFrame(animate)

    // 更新动画时间
    const delta = 0.016 // 假设60fps
    animationTime.value += delta

    // 自动旋转角色
    if (autoRotate.value && character.value) {
      character.value.rotation.y += 0.01
    }

    // 根据参数更新角色
    updateCharacterFromParameters()

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      const startTime = performance.now()
      renderer.value.render(scene.value, camera.value)
      renderTime.value = performance.now() - startTime
    }
  }

  animate()
}

/**
 * 根据参数更新角色
 */
function updateCharacterFromParameters() {
  if (!character.value) return

  const speed = animationTreeAdapter.getParameter('speed') || 0
  const direction = animationTreeAdapter.getParameter('direction') || 0

  // 根据速度调整动画
  if (speed < 1) {
    // 待机状态
    character.value.scale.setScalar(1 + Math.sin(animationTime.value * 2) * 0.02)
  } else if (speed < 5) {
    // 行走状态
    character.value.position.y = Math.abs(Math.sin(animationTime.value * 8)) * 0.1
  } else {
    // 跑步状态
    character.value.position.y = Math.abs(Math.sin(animationTime.value * 12)) * 0.2
  }

  // 根据方向调整旋转
  if (Math.abs(direction) > 0.1) {
    character.value.rotation.y += direction * 0.02
  }
}

// ============================================================================
// 性能监控
// ============================================================================

/**
 * 开始性能监控
 */
function startPerformanceMonitoring() {
  let frameCount = 0
  let lastTime = performance.now()

  const updateFPS = () => {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }

    requestAnimationFrame(updateFPS)
  }

  updateFPS()
}

// ============================================================================
// 事件处理
// ============================================================================

/**
 * AnimationTree创建事件
 */
function onAnimationTreeCreated(tree: AnimationTree) {
  animationTree.value = tree
}

/**
 * 参数变化事件
 */
function onParameterChanged(name: string, value: any) {
  if (name === 'speed') {
    speedValue.value = value
  } else if (name === 'direction') {
    directionValue.value = value
  }
}

/**
 * 状态选择事件
 */
function onStateSelected(stateId: string, state: any) {
  console.log('State selected:', stateId, state)
}

// ============================================================================
// 控制方法
// ============================================================================

/**
 * 设置参数
 */
function setParameter(name: string, value: any) {
  animationTreeAdapter.setParameter(name, value)
}

/**
 * 触发跳跃
 */
function triggerJump() {
  animationTreeAdapter.setParameter('jump', true)
  
  // 角色跳跃动画
  if (character.value) {
    const startY = character.value.position.y
    const jumpHeight = 1.0
    const jumpDuration = 0.5
    
    const startTime = performance.now()
    
    const animateJump = () => {
      const elapsed = (performance.now() - startTime) / 1000
      const progress = Math.min(elapsed / jumpDuration, 1)
      
      // 抛物线跳跃
      const jumpY = startY + jumpHeight * Math.sin(progress * Math.PI)
      character.value!.position.y = jumpY
      
      if (progress < 1) {
        requestAnimationFrame(animateJump)
      } else {
        character.value!.position.y = startY
        animationTreeAdapter.setParameter('jump', false)
      }
    }
    
    animateJump()
  }
}

/**
 * 应用预设
 */
function applyPreset(preset: any) {
  for (const [name, value] of Object.entries(preset.parameters)) {
    setParameter(name, value)
  }
}

// ============================================================================
// 工具方法
// ============================================================================

/**
 * 格式化值显示
 */
function formatValue(value: any): string {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

/**
 * 获取参数条宽度
 */
function getParameterBarWidth(param: any): string {
  if (param.type === 'float' || param.type === 'int') {
    const normalized = Math.abs(param.currentValue) / 10 // 假设最大值为10
    return `${Math.min(normalized * 100, 100)}%`
  } else if (param.type === 'bool') {
    return param.currentValue ? '100%' : '0%'
  }
  return '0%'
}

/**
 * 清理资源
 */
function cleanup() {
  if (renderer.value) {
    renderer.value.dispose()
  }
  animationTreeAdapter.destroy()
}
</script>

<style scoped>
.animation-tree-example {
  @apply flex flex-col h-screen bg-gray-100 dark:bg-gray-900;
}

.example-header {
  @apply p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.example-header h1 {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
}

.example-header p {
  @apply text-gray-600 dark:text-gray-400;
}

.scene-preview {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
  height: 300px;
}

.preview-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.preview-header h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.scene-container {
  @apply w-full;
  height: calc(100% - 60px);
}

.editor-container {
  @apply flex-1;
}

.data-monitor {
  @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  height: 200px;
}

.monitor-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
}

.monitor-header h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.monitor-content {
  @apply flex p-4 space-x-6 overflow-x-auto;
}

.monitor-section h4 {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.data-grid,
.performance-grid {
  @apply space-y-2;
}

.data-item,
.perf-item {
  @apply flex items-center justify-between text-sm;
}

.data-label,
.perf-label {
  @apply text-gray-600 dark:text-gray-400 mr-2;
}

.data-value,
.perf-value {
  @apply font-mono text-gray-900 dark:text-white;
}

.parameter-monitor {
  @apply space-y-2;
}

.parameter-item {
  @apply flex items-center space-x-2 text-sm;
}

.param-name {
  @apply text-gray-600 dark:text-gray-400 w-16;
}

.param-value {
  @apply font-mono text-gray-900 dark:text-white w-12;
}

.param-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded;
}

.param-fill {
  @apply h-full bg-blue-500 rounded transition-all duration-200;
}

.test-panel {
  @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  height: 150px;
}

.test-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
}

.test-header h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.test-content {
  @apply flex p-4 space-x-6;
}

.test-section h4 {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.preset-buttons {
  @apply flex flex-wrap gap-2;
}

.quick-controls {
  @apply space-y-3;
}

.control-group {
  @apply flex items-center space-x-2;
}

.control-group label {
  @apply text-sm text-gray-600 dark:text-gray-400 w-12;
}

.control-value {
  @apply text-sm font-mono text-gray-900 dark:text-white w-12;
}
</style>
