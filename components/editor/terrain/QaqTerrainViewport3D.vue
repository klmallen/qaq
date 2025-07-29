<template>
  <div class="qaq-terrain-viewport">
    <!-- 3D渲染容器 -->
    <div
      ref="rendererContainer"
      class="qaq-renderer-container"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel="onWheel"
      @contextmenu.prevent
    ></div>

    <!-- 视口控制器 -->
    <div class="qaq-viewport-controls">
      <div class="qaq-control-group">
        <UButton
          icon="i-heroicons-home"
          variant="ghost"
          size="sm"
          @click="resetCamera"
          title="Reset Camera"
        />
        <UButton
          icon="i-heroicons-eye"
          variant="ghost"
          size="sm"
          @click="toggleWireframe"
          title="Toggle Wireframe"
        />
        <UButton
          icon="i-heroicons-sun"
          variant="ghost"
          size="sm"
          @click="toggleLighting"
          title="Toggle Lighting"
        />
      </div>
    </div>

    <!-- 笔刷光标 -->
    <div
      v-if="showBrushCursor"
      class="qaq-brush-cursor"
      :style="brushCursorStyle"
    ></div>

    <!-- 视口信息 -->
    <div class="qaq-viewport-info">
      <span>Camera: {{ cameraInfo.position.x.toFixed(1) }}, {{ cameraInfo.position.y.toFixed(1) }}, {{ cameraInfo.position.z.toFixed(1) }}</span>
      <span>FPS: {{ fps }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as THREE from 'three'
import type { TerrainTool } from '../QaqTerrainEditor.vue'

// Props
interface Props {
  selectedTool: TerrainTool
  brushSettings: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'terrain-modified': [data: any]
}>()

// 响应式数据
const rendererContainer = ref<HTMLElement>()
const showBrushCursor = ref(false)
const brushCursorPosition = reactive({ x: 0, y: 0 })
const fps = ref(0)

// Three.js 对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let terrain: THREE.Mesh
let terrainGeometry: THREE.PlaneGeometry
let terrainMaterial: THREE.MeshLambertMaterial
let controls: any // OrbitControls
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// 地形数据
const terrainSize = 512
const terrainSegments = 256
let heightData: Float32Array
let isMouseDown = false
let lastBrushPosition: THREE.Vector3 | null = null

// 相机信息
const cameraInfo = reactive({
  position: { x: 0, y: 0, z: 0 }
})

// 计算属性
const brushCursorStyle = computed(() => ({
  left: `${brushCursorPosition.x}px`,
  top: `${brushCursorPosition.y}px`,
  width: `${props.brushSettings.size}px`,
  height: `${props.brushSettings.size}px`,
  opacity: props.brushSettings.strength
}))

// 方法
function initThreeJS() {
  if (!rendererContainer.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    rendererContainer.value.clientWidth / rendererContainer.value.clientHeight,
    0.1,
    2000
  )
  camera.position.set(0, 200, 200)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(rendererContainer.value.clientWidth, rendererContainer.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  rendererContainer.value.appendChild(renderer.domElement)

  // 创建地形
  createTerrain()

  // 创建光照
  createLighting()

  // 初始化控制器
  initControls()

  // 初始化射线投射
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 开始渲染循环
  animate()
}

function createTerrain() {
  // 创建地形几何体
  terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments)
  terrainGeometry.rotateX(-Math.PI / 2)

  // 初始化高度数据
  const vertices = terrainGeometry.attributes.position.array as Float32Array
  heightData = new Float32Array(vertices.length / 3)
  
  for (let i = 0; i < heightData.length; i++) {
    heightData[i] = 0
  }

  // 创建地形材质
  terrainMaterial = new THREE.MeshLambertMaterial({
    color: 0x4a7c59,
    wireframe: false
  })

  // 创建地形网格
  terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  terrain.receiveShadow = true
  scene.add(terrain)
}

function createLighting() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  scene.add(directionalLight)
}

function initControls() {
  // 这里应该导入OrbitControls，但为了简化，我们使用基础的鼠标控制
  // import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
  // controls = new OrbitControls(camera, renderer.domElement)
}

function onMouseDown(event: MouseEvent) {
  if (event.button === 0) { // 左键
    isMouseDown = true
    updateMousePosition(event)
    applyBrushEffect()
  }
}

function onMouseMove(event: MouseEvent) {
  updateMousePosition(event)
  updateBrushCursor(event)
  
  if (isMouseDown) {
    applyBrushEffect()
  }
}

function onMouseUp(event: MouseEvent) {
  if (event.button === 0) {
    isMouseDown = false
    lastBrushPosition = null
  }
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  // 简单的缩放控制
  const zoomSpeed = 0.1
  const direction = event.deltaY > 0 ? 1 : -1
  camera.position.multiplyScalar(1 + direction * zoomSpeed)
}

function updateMousePosition(event: MouseEvent) {
  const rect = rendererContainer.value!.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function updateBrushCursor(event: MouseEvent) {
  const rect = rendererContainer.value!.getBoundingClientRect()
  brushCursorPosition.x = event.clientX - rect.left - props.brushSettings.size / 2
  brushCursorPosition.y = event.clientY - rect.top - props.brushSettings.size / 2
  showBrushCursor.value = true
}

function applyBrushEffect() {
  // 射线投射检测地形交点
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(terrain)
  
  if (intersects.length > 0) {
    const intersect = intersects[0]
    const point = intersect.point
    
    // 检查笔刷间距
    if (lastBrushPosition && point.distanceTo(lastBrushPosition) < props.brushSettings.spacing * props.brushSettings.size) {
      return
    }
    
    lastBrushPosition = point.clone()
    
    // 应用笔刷效果
    modifyTerrain(point)
  }
}

function modifyTerrain(point: THREE.Vector3) {
  const vertices = terrainGeometry.attributes.position.array as Float32Array
  const brushSize = props.brushSettings.size
  const brushStrength = props.brushSettings.strength
  const brushFalloff = props.brushSettings.falloff
  
  // 转换世界坐标到地形坐标
  const terrainX = (point.x + terrainSize / 2) / terrainSize * terrainSegments
  const terrainZ = (point.z + terrainSize / 2) / terrainSize * terrainSegments
  
  // 应用笔刷效果到顶点
  for (let x = 0; x <= terrainSegments; x++) {
    for (let z = 0; z <= terrainSegments; z++) {
      const distance = Math.sqrt((x - terrainX) ** 2 + (z - terrainZ) ** 2)
      const brushRadius = brushSize / terrainSize * terrainSegments
      
      if (distance <= brushRadius) {
        const vertexIndex = x * (terrainSegments + 1) + z
        const falloffFactor = Math.pow(1 - distance / brushRadius, brushFalloff * 3)
        const effect = brushStrength * falloffFactor
        
        // 根据工具类型应用不同效果
        switch (props.selectedTool) {
          case 'sculpt':
            vertices[vertexIndex * 3 + 1] += effect * 10
            break
          case 'smooth':
            // 平滑算法
            smoothVertex(vertexIndex, effect)
            break
          case 'flatten':
            // 平整到目标高度
            vertices[vertexIndex * 3 + 1] = lerp(vertices[vertexIndex * 3 + 1], 0, effect)
            break
          case 'noise':
            // 添加噪声
            vertices[vertexIndex * 3 + 1] += (Math.random() - 0.5) * effect * 20
            break
        }
        
        heightData[vertexIndex] = vertices[vertexIndex * 3 + 1]
      }
    }
  }
  
  // 更新几何体
  terrainGeometry.attributes.position.needsUpdate = true
  terrainGeometry.computeVertexNormals()
  
  // 发送地形修改事件
  emit('terrain-modified', {
    position: point,
    tool: props.selectedTool,
    heightRange: getHeightRange()
  })
}

function smoothVertex(vertexIndex: number, strength: number) {
  const vertices = terrainGeometry.attributes.position.array as Float32Array
  const x = Math.floor(vertexIndex / (terrainSegments + 1))
  const z = vertexIndex % (terrainSegments + 1)
  
  let sum = 0
  let count = 0
  
  // 计算周围顶点的平均高度
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const nx = x + dx
      const nz = z + dz
      
      if (nx >= 0 && nx <= terrainSegments && nz >= 0 && nz <= terrainSegments) {
        const neighborIndex = nx * (terrainSegments + 1) + nz
        sum += vertices[neighborIndex * 3 + 1]
        count++
      }
    }
  }
  
  const averageHeight = sum / count
  vertices[vertexIndex * 3 + 1] = lerp(vertices[vertexIndex * 3 + 1], averageHeight, strength)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getHeightRange(): { min: number; max: number } {
  const vertices = terrainGeometry.attributes.position.array as Float32Array
  let min = Infinity
  let max = -Infinity
  
  for (let i = 1; i < vertices.length; i += 3) {
    min = Math.min(min, vertices[i])
    max = Math.max(max, vertices[i])
  }
  
  return { min, max }
}

function resetCamera() {
  camera.position.set(0, 200, 200)
  camera.lookAt(0, 0, 0)
}

function toggleWireframe() {
  terrainMaterial.wireframe = !terrainMaterial.wireframe
}

function toggleLighting() {
  // 切换光照
  scene.children.forEach(child => {
    if (child instanceof THREE.Light && child.type !== 'AmbientLight') {
      child.visible = !child.visible
    }
  })
}

function resetTerrain() {
  const vertices = terrainGeometry.attributes.position.array as Float32Array
  
  // 重置所有顶点高度为0
  for (let i = 1; i < vertices.length; i += 3) {
    vertices[i] = 0
  }
  
  // 重置高度数据
  heightData.fill(0)
  
  // 更新几何体
  terrainGeometry.attributes.position.needsUpdate = true
  terrainGeometry.computeVertexNormals()
  
  console.log('🔄 Terrain reset')
}

function exportTerrain() {
  return {
    size: terrainSize,
    segments: terrainSegments,
    heightData: Array.from(heightData)
  }
}

function animate() {
  requestAnimationFrame(animate)
  
  // 更新相机信息
  cameraInfo.position.x = camera.position.x
  cameraInfo.position.y = camera.position.y
  cameraInfo.position.z = camera.position.z
  
  // 计算FPS
  fps.value = Math.round(1000 / 16.67) // 简化的FPS计算
  
  renderer.render(scene, camera)
}

function handleResize() {
  if (!rendererContainer.value) return
  
  const width = rendererContainer.value.clientWidth
  const height = rendererContainer.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
  }
})

// 暴露方法给父组件
defineExpose({
  resetTerrain,
  exportTerrain
})
</script>

<style scoped>
.qaq-terrain-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.qaq-renderer-container {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.qaq-viewport-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

.qaq-control-group {
  display: flex;
  gap: 4px;
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  border-radius: 6px;
  padding: 4px;
}

.qaq-brush-cursor {
  position: absolute;
  border: 2px solid var(--qaq-accent, #00DC82);
  border-radius: 50%;
  pointer-events: none;
  z-index: 5;
  transform: translate(-50%, -50%);
  transition: all 0.1s ease;
}

.qaq-viewport-info {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--qaq-text-secondary, #cccccc);
  background-color: var(--qaq-bg-secondary, #1a1a1a);
  padding: 8px 12px;
  border-radius: 6px;
  z-index: 10;
}
</style>
