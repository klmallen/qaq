<template>
  <div class="qaq-3d-preview">
    <!-- 预览控制栏 -->
    <div class="qaq-preview-controls">
      <div class="qaq-controls-left">
        <h4>材质预览</h4>
      </div>
      
      <div class="qaq-controls-right">
        <!-- 模型切换 -->
        <UButton
          icon="i-heroicons-globe-alt"
          size="xs"
          variant="ghost"
          :class="{ 'active': previewShape === 'sphere' }"
          @click="changePreviewShape('sphere')"
          title="球体"
        />
        <UButton
          icon="i-heroicons-cube"
          size="xs"
          variant="ghost"
          :class="{ 'active': previewShape === 'cube' }"
          @click="changePreviewShape('cube')"
          title="立方体"
        />
        <UButton
          icon="i-heroicons-square-3-stack-3d"
          size="xs"
          variant="ghost"
          :class="{ 'active': previewShape === 'plane' }"
          @click="changePreviewShape('plane')"
          title="平面"
        />
        
        <!-- 光照切换 -->
        <div class="qaq-control-separator"></div>
        <UButton
          icon="i-heroicons-sun"
          size="xs"
          variant="ghost"
          :class="{ 'active': enableLighting }"
          @click="toggleLighting"
          title="切换光照"
        />
        
        <!-- 环境切换 -->
        <UButton
          icon="i-heroicons-photo"
          size="xs"
          variant="ghost"
          @click="cycleEnvironment"
          :title="`环境: ${currentEnvironment}`"
        />
      </div>
    </div>

    <!-- 3D渲染容器 -->
    <div ref="canvasContainer" class="qaq-canvas-container">
      <canvas ref="canvas" class="qaq-3d-canvas"></canvas>
      
      <!-- 加载指示器 -->
      <div v-if="isLoading" class="qaq-loading-overlay">
        <div class="qaq-loading-spinner"></div>
        <span>加载3D预览...</span>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="error" class="qaq-error-overlay">
        <UIcon name="i-heroicons-exclamation-triangle" />
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- 预览信息 -->
    <div class="qaq-preview-info">
      <div class="qaq-info-row">
        <span>模型:</span>
        <span>{{ previewShapeNames[previewShape] }}</span>
      </div>
      <div class="qaq-info-row">
        <span>三角面:</span>
        <span>{{ triangleCount }}</span>
      </div>
      <div class="qaq-info-row">
        <span>FPS:</span>
        <span>{{ fps }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'

// Props
interface Props {
  materialProperties?: {
    albedo?: string
    metallic?: number
    roughness?: number
    normal?: string
    emission?: string
    alpha?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  materialProperties: () => ({
    albedo: '#ffffff',
    metallic: 0.0,
    roughness: 0.5,
    normal: undefined,
    emission: '#000000',
    alpha: 1.0
  })
})

// 响应式状态
const canvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLElement>()
const isLoading = ref(true)
const error = ref('')
const previewShape = ref<'sphere' | 'cube' | 'plane'>('sphere')
const enableLighting = ref(true)
const currentEnvironment = ref('Studio')
const triangleCount = ref(0)
const fps = ref(60)

// Three.js 对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let mesh: THREE.Mesh
let material: THREE.MeshStandardMaterial
let controls: any
let animationId: number
let frameCount = 0
let lastTime = 0

// 预览形状名称
const previewShapeNames = {
  sphere: '球体',
  cube: '立方体',
  plane: '平面'
}

// 环境列表
const environments = ['Studio', 'Outdoor', 'Indoor', 'Sunset']

// 初始化3D场景
const initThreeJS = async () => {
  if (!canvas.value || !canvasContainer.value) return

  try {
    isLoading.value = true
    error.value = ''

    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a)

    // 创建相机
    const container = canvasContainer.value
    const aspect = container.clientWidth / container.clientHeight
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.position.set(0, 0, 3)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
      alpha: true
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1

    // 创建材质
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(props.materialProperties.albedo || '#ffffff'),
      metalness: props.materialProperties.metallic || 0,
      roughness: props.materialProperties.roughness || 0.5,
      transparent: (props.materialProperties.alpha || 1) < 1,
      opacity: props.materialProperties.alpha || 1
    })

    // 创建几何体和网格
    createMesh()

    // 设置光照
    setupLighting()

    // 设置控制器
    await setupControls()

    // 开始渲染循环
    animate()

    isLoading.value = false
    console.log('3D Material Preview initialized')

  } catch (err) {
    console.error('Failed to initialize 3D preview:', err)
    error.value = '初始化3D预览失败'
    isLoading.value = false
  }
}

// 创建网格
const createMesh = () => {
  // 移除旧网格
  if (mesh) {
    scene.remove(mesh)
    mesh.geometry.dispose()
  }

  // 创建几何体
  let geometry: THREE.BufferGeometry
  switch (previewShape.value) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(1, 64, 32)
      triangleCount.value = 64 * 32 * 2
      break
    case 'cube':
      geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
      triangleCount.value = 12
      break
    case 'plane':
      geometry = new THREE.PlaneGeometry(2, 2, 32, 32)
      triangleCount.value = 32 * 32 * 2
      break
    default:
      geometry = new THREE.SphereGeometry(1, 32, 16)
      triangleCount.value = 32 * 16 * 2
  }

  // 创建网格
  mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
}

// 设置光照
const setupLighting = () => {
  // 清除现有光照
  const lights = scene.children.filter(child => child instanceof THREE.Light)
  lights.forEach(light => scene.remove(light))

  if (enableLighting.value) {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3)
    fillLight.position.set(-5, 0, -5)
    scene.add(fillLight)

    // 背光
    const backLight = new THREE.DirectionalLight(0xff8040, 0.2)
    backLight.position.set(0, -5, -5)
    scene.add(backLight)
  }
}

// 设置控制器
const setupControls = async () => {
  try {
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = false
    controls.maxDistance = 10
    controls.minDistance = 1
  } catch (err) {
    console.warn('OrbitControls not available, using basic camera')
  }
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 更新控制器
  if (controls) {
    controls.update()
  }

  // 自动旋转（如果没有控制器）
  if (!controls && mesh) {
    mesh.rotation.y += 0.01
  }

  // 渲染场景
  renderer.render(scene, camera)

  // 计算FPS
  frameCount++
  const currentTime = performance.now()
  if (currentTime - lastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
    frameCount = 0
    lastTime = currentTime
  }
}

// 更新材质属性
const updateMaterial = () => {
  if (!material) return

  const props_material = props.materialProperties
  
  // 更新颜色
  if (props_material.albedo) {
    material.color.setStyle(props_material.albedo)
  }
  
  // 更新金属度
  material.metalness = props_material.metallic || 0
  
  // 更新粗糙度
  material.roughness = props_material.roughness || 0.5
  
  // 更新透明度
  const alpha = props_material.alpha || 1
  material.transparent = alpha < 1
  material.opacity = alpha
  
  // 更新发光
  if (props_material.emission && props_material.emission !== '#000000') {
    material.emissive.setStyle(props_material.emission)
    material.emissiveIntensity = 0.5
  } else {
    material.emissive.setHex(0x000000)
    material.emissiveIntensity = 0
  }
  
  material.needsUpdate = true
}

// 改变预览形状
const changePreviewShape = (shape: 'sphere' | 'cube' | 'plane') => {
  previewShape.value = shape
  if (scene) {
    createMesh()
  }
}

// 切换光照
const toggleLighting = () => {
  enableLighting.value = !enableLighting.value
  if (scene) {
    setupLighting()
  }
}

// 循环环境
const cycleEnvironment = () => {
  const currentIndex = environments.indexOf(currentEnvironment.value)
  const nextIndex = (currentIndex + 1) % environments.length
  currentEnvironment.value = environments[nextIndex]
  
  // 这里可以加载不同的环境贴图
  console.log('Environment changed to:', currentEnvironment.value)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer || !canvasContainer.value) return

  const container = canvasContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 监听材质属性变化
watch(() => props.materialProperties, updateMaterial, { deep: true })

// 生命周期
onMounted(async () => {
  await nextTick()
  await initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (controls) {
    controls.dispose()
  }
  
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.qaq-3d-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-panel, #383838);
  border-radius: 8px;
  overflow: hidden;
}

.qaq-preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-controls-left h4 {
  margin: 0;
  font-size: 12px;
  color: var(--qaq-primary, #00DC82);
  font-weight: 600;
}

.qaq-controls-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qaq-control-separator {
  width: 1px;
  height: 16px;
  background: var(--qaq-editor-border, #4a4a4a);
  margin: 0 4px;
}

.qaq-controls-right .active {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-canvas-container {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  min-height: 200px;
}

.qaq-3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.qaq-loading-overlay,
.qaq-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(42, 42, 42, 0.9);
  color: var(--qaq-editor-text, #ffffff);
  font-size: 14px;
  gap: 12px;
}

.qaq-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--qaq-editor-border, #4a4a4a);
  border-top: 3px solid var(--qaq-primary, #00DC82);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qaq-error-overlay {
  color: #ef4444;
}

.qaq-preview-info {
  padding: 8px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
  font-size: 11px;
}

.qaq-info-row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}

.qaq-info-row span:first-child {
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-info-row span:last-child {
  color: var(--qaq-primary, #00DC82);
  font-family: monospace;
}
</style>
