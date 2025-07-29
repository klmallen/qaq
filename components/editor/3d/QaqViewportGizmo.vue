<template>
  <div class="qaq-viewport-gizmo" ref="gizmoContainer">
    <!-- 3D View Cube渲染容器 -->
    <div class="qaq-3d-view-cube" ref="cubeContainer">
      <canvas
        ref="cubeCanvas"
        class="qaq-cube-canvas"
        @mousedown="startDrag"
        @wheel="handleWheel"
        @click="handleCubeClick"
        @mousemove="handleCubeHover"
      ></canvas>
    </div>

    <!-- 轴向指示器 -->
    <div class="qaq-axis-indicator">
      <div class="qaq-axis qaq-axis-x" :class="{ 'active': hoveredAxis === 'x' }">
        <div class="qaq-axis-line"></div>
        <div class="qaq-axis-label">X</div>
      </div>
      <div class="qaq-axis qaq-axis-y" :class="{ 'active': hoveredAxis === 'y' }">
        <div class="qaq-axis-line"></div>
        <div class="qaq-axis-label">Y</div>
      </div>
      <div class="qaq-axis qaq-axis-z" :class="{ 'active': hoveredAxis === 'z' }">
        <div class="qaq-axis-line"></div>
        <div class="qaq-axis-label">Z</div>
      </div>
    </div>

    <!-- 视图控制按钮 -->
    <div class="qaq-view-controls">
      <UButton
        icon="i-heroicons-home"
        size="xs"
        variant="ghost"
        @click="resetView"
        title="重置视图 (Home)"
        class="qaq-view-btn"
      />
      <UButton
        :icon="isOrthographic ? 'i-heroicons-cube' : 'i-heroicons-eye'"
        size="xs"
        variant="ghost"
        @click="toggleProjection"
        :title="isOrthographic ? '切换到透视投影 (Numpad 5)' : '切换到正交投影 (Numpad 5)'"
        class="qaq-view-btn"
      />
      <UButton
        icon="i-heroicons-magnifying-glass"
        size="xs"
        variant="ghost"
        @click="frameSelected"
        title="聚焦选中物体 (F)"
        class="qaq-view-btn"
      />
    </div>

    <!-- 当前视图信息 -->
    <div class="qaq-view-info">
      <span class="qaq-current-view">{{ currentViewName }}</span>
      <span class="qaq-projection-type">{{ isOrthographic ? '正交' : '透视' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'

// Props
interface Props {
  camera?: THREE.PerspectiveCamera | THREE.OrthographicCamera
  controls?: any // OrbitControls
  scene?: THREE.Scene
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'view-change': [view: string]
  'projection-change': [isOrthographic: boolean]
}>()

// 响应式状态
const gizmoContainer = ref<HTMLElement>()
const cubeContainer = ref<HTMLElement>()
const cubeCanvas = ref<HTMLCanvasElement>()
const currentView = ref('perspective')
const isOrthographic = ref(false)
const hoveredAxis = ref<'x' | 'y' | 'z' | null>(null)
const isDragging = ref(false)

// 3D立方体相关变量
let cubeScene: THREE.Scene
let cubeCamera: THREE.PerspectiveCamera
let cubeRenderer: THREE.WebGLRenderer
let viewCube: THREE.Mesh
let cubeMaterials: THREE.MeshBasicMaterial[] = []
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// 拖拽状态
let dragStart = { x: 0, y: 0 }
let lastMousePosition = { x: 0, y: 0 }

// 预定义视图位置
const viewPositions = {
  front: new THREE.Vector3(0, 0, 10),
  back: new THREE.Vector3(0, 0, -10),
  right: new THREE.Vector3(10, 0, 0),
  left: new THREE.Vector3(-10, 0, 0),
  top: new THREE.Vector3(0, 10, 0),
  bottom: new THREE.Vector3(0, -10, 0),
  'front-top': new THREE.Vector3(0, 7, 7),
  'front-bottom': new THREE.Vector3(0, -7, 7),
  'front-left': new THREE.Vector3(-7, 0, 7),
  'front-right': new THREE.Vector3(7, 0, 7),
  'front-top-left': new THREE.Vector3(-5, 5, 5),
  'front-top-right': new THREE.Vector3(5, 5, 5),
  'front-bottom-left': new THREE.Vector3(-5, -5, 5),
  'front-bottom-right': new THREE.Vector3(5, -5, 5)
}

// 计算属性
const currentViewName = computed(() => {
  const viewNames: Record<string, string> = {
    front: '前视图',
    back: '后视图',
    right: '右视图',
    left: '左视图',
    top: '顶视图',
    bottom: '底视图',
    'front-top': '前上视图',
    'front-bottom': '前下视图',
    'front-left': '前左视图',
    'front-right': '前右视图',
    'front-top-left': '前上左视图',
    'front-top-right': '前上右视图',
    'front-bottom-left': '前下左视图',
    'front-bottom-right': '前下右视图',
    perspective: '透视视图'
  }
  return viewNames[currentView.value] || '自定义视图'
})

// 3D立方体初始化
const initializeCube = async () => {
  if (!cubeCanvas.value || !cubeContainer.value) return

  // 创建3D场景
  cubeScene = new THREE.Scene()

  // 创建相机
  const size = 120
  cubeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
  cubeCamera.position.set(0, 0, 4)
  cubeCamera.lookAt(0, 0, 0)

  // 创建渲染器
  cubeRenderer = new THREE.WebGLRenderer({
    canvas: cubeCanvas.value,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  })
  cubeRenderer.setSize(size, size)
  cubeRenderer.setPixelRatio(window.devicePixelRatio)
  cubeRenderer.setClearColor(0x000000, 0)
  cubeRenderer.shadowMap.enabled = false // 禁用阴影以提高性能

  // 创建立方体几何体 - 稍微小一点以便更好地显示
  const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)

  // 创建文字纹理
  const faceTextures = createFaceTextures()

  // 创建材质数组 - 使用更好的材质和光照
  cubeMaterials = [
    new THREE.MeshPhongMaterial({
      map: faceTextures.right,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    }), // 右
    new THREE.MeshPhongMaterial({
      map: faceTextures.left,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    }),  // 左
    new THREE.MeshPhongMaterial({
      map: faceTextures.top,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    }),   // 顶
    new THREE.MeshPhongMaterial({
      map: faceTextures.bottom,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    }), // 底
    new THREE.MeshPhongMaterial({
      map: faceTextures.front,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    }), // 前
    new THREE.MeshPhongMaterial({
      map: faceTextures.back,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      shininess: 30,
      specular: 0x222222
    })   // 后
  ]

  // 创建立方体网格
  viewCube = new THREE.Mesh(geometry, cubeMaterials)
  cubeScene.add(viewCube)

  // 添加环境光 - 提供基础照明
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  cubeScene.add(ambientLight)

  // 添加主方向光 - 从右上前方照射
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight1.position.set(2, 2, 2)
  cubeScene.add(directionalLight1)

  // 添加辅助方向光 - 从左下后方照射，减少阴影
  const directionalLight2 = new THREE.DirectionalLight(0x00DC82, 0.3)
  directionalLight2.position.set(-1, -1, -1)
  cubeScene.add(directionalLight2)

  // 初始化射线投射器
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 开始渲染循环
  renderCube()

  console.log('3D View Cube initialized')
}

// 创建面纹理
const createFaceTextures = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const createTexture = (text: string, bgColor: string = '#2a2a2a') => {
    // 清除画布
    ctx.clearRect(0, 0, 256, 256)

    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 256, 256)
    gradient.addColorStop(0, '#3a3a3a')
    gradient.addColorStop(1, '#2a2a2a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    // 绘制内边框
    ctx.strokeStyle = '#4a4a4a'
    ctx.lineWidth = 2
    ctx.strokeRect(4, 4, 248, 248)

    // 绘制外边框
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, 256, 256)

    // 绘制文字阴影
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 130, 130)

    // 绘制文字 - 使用QAQ主题绿色
    ctx.fillStyle = '#00DC82'
    ctx.fillText(text, 128, 128)

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  return {
    front: createTexture('前'),
    back: createTexture('后'),
    right: createTexture('右'),
    left: createTexture('左'),
    top: createTexture('顶'),
    bottom: createTexture('底')
  }
}

// 渲染3D立方体
const renderCube = () => {
  if (!cubeRenderer || !cubeScene || !cubeCamera) return

  // 同步立方体旋转与主相机方向
  syncCubeRotation()

  // 渲染场景
  cubeRenderer.render(cubeScene, cubeCamera)

  // 继续动画循环
  requestAnimationFrame(renderCube)
}

// 同步立方体旋转
const syncCubeRotation = () => {
  if (!viewCube || !props.camera || !props.controls) return

  // 获取主相机的位置和目标
  const cameraPosition = props.camera.position.clone()
  const target = props.controls.target || new THREE.Vector3(0, 0, 0)

  // 计算相机的观察方向
  const cameraDirection = cameraPosition.clone().sub(target).normalize()

  // 计算立方体应该的旋转，使其面向与相机相反的方向
  // 这样立方体的面就能正确显示相机的观察方向

  // 计算相机的球坐标
  const spherical = new THREE.Spherical()
  spherical.setFromVector3(cameraDirection)

  // 设置立方体的旋转，使其正确反映相机方向
  viewCube.rotation.x = 0
  viewCube.rotation.y = spherical.theta + Math.PI // 水平旋转
  viewCube.rotation.z = 0

  // 根据相机的俯仰角调整立方体的X轴旋转
  const pitch = Math.PI / 2 - spherical.phi
  viewCube.rotation.x = -pitch
}

// 方法
const setView = (view: string) => {
  if (!props.camera || !props.controls) return

  const position = viewPositions[view as keyof typeof viewPositions]
  if (!position) return

  currentView.value = view

  // 计算相机距离目标的距离
  const target = props.controls.target || new THREE.Vector3(0, 0, 0)
  const distance = props.camera.position.distanceTo(target)

  // 设置新的相机位置
  const newPosition = position.clone().normalize().multiplyScalar(distance)
  newPosition.add(target)

  // 平滑过渡到新位置
  animateCameraTo(newPosition, target)

  emit('view-change', view)
}

const animateCameraTo = (targetPosition: THREE.Vector3, lookAtTarget: THREE.Vector3) => {
  if (!props.camera || !props.controls) return

  const startPosition = props.camera.position.clone()
  const duration = 500 // 毫秒
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用easeInOutCubic缓动函数
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    // 插值位置
    const currentPosition = startPosition.clone().lerp(targetPosition, eased)
    props.camera.position.copy(currentPosition)
    props.camera.lookAt(lookAtTarget)

    if (props.controls.update) {
      props.controls.update()
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

const resetView = () => {
  if (!props.camera || !props.controls) return

  // 重置到默认透视视图
  const defaultPosition = new THREE.Vector3(5, 5, 5)
  const target = new THREE.Vector3(0, 0, 0)

  animateCameraTo(defaultPosition, target)
  currentView.value = 'perspective'

  emit('view-change', 'perspective')
}

const toggleProjection = () => {
  if (!props.camera) return

  isOrthographic.value = !isOrthographic.value
  emit('projection-change', isOrthographic.value)

  // 这里需要在父组件中处理相机类型切换
  console.log('Toggle projection:', isOrthographic.value ? 'orthographic' : 'perspective')
}

const frameSelected = () => {
  if (!props.scene || !props.camera || !props.controls) return

  // 获取场景中选中的物体
  const selectedObjects: THREE.Object3D[] = []
  props.scene.traverse((child) => {
    if ((child as any).selected) {
      selectedObjects.push(child)
    }
  })

  if (selectedObjects.length === 0) {
    console.log('No objects selected to frame')
    return
  }

  // 计算包围盒
  const box = new THREE.Box3()
  selectedObjects.forEach(obj => {
    const objBox = new THREE.Box3().setFromObject(obj)
    box.union(objBox)
  })

  if (box.isEmpty()) return

  // 计算包围盒中心和大小
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  // 计算相机距离
  const distance = maxDim * 2
  const direction = props.camera.position.clone().sub(center).normalize()
  const newPosition = center.clone().add(direction.multiplyScalar(distance))

  animateCameraTo(newPosition, center)
}

// 处理立方体点击
const handleCubeClick = (event: MouseEvent) => {
  // 检查是否刚刚完成拖拽操作
  const dragDistance = Math.sqrt(
    Math.pow(event.clientX - dragStart.x, 2) +
    Math.pow(event.clientY - dragStart.y, 2)
  )

  // 如果拖拽距离超过5像素，则认为是拖拽操作，不触发点击
  if (dragDistance > 5) {
    return
  }

  const rect = cubeCanvas.value?.getBoundingClientRect()
  if (!rect) return

  // 计算鼠标在canvas中的标准化坐标
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 射线投射检测
  raycaster.setFromCamera(mouse, cubeCamera)
  const intersects = raycaster.intersectObject(viewCube)

  if (intersects.length > 0) {
    const face = intersects[0].face
    if (face) {
      // 根据面的法向量确定点击的面
      const normal = face.normal.clone()

      // 将法向量转换到世界坐标系
      normal.transformDirection(viewCube.matrixWorld)

      let view = 'perspective'

      // 更精确的面检测
      if (Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)) {
        view = normal.x > 0 ? 'right' : 'left'
      } else if (Math.abs(normal.y) > Math.abs(normal.x) && Math.abs(normal.y) > Math.abs(normal.z)) {
        view = normal.y > 0 ? 'top' : 'bottom'
      } else if (Math.abs(normal.z) > Math.abs(normal.x) && Math.abs(normal.z) > Math.abs(normal.y)) {
        view = normal.z > 0 ? 'front' : 'back'
      }

      console.log('Clicked face:', view, 'Normal:', normal)
      setView(view)
    }
  }
}

const startDrag = (event: MouseEvent) => {
  if (!props.controls) return

  console.log('Start drag on View Cube')

  // 防止事件冒泡
  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  dragStart = { x: event.clientX, y: event.clientY }
  lastMousePosition = { x: event.clientX, y: event.clientY }

  // 添加全局事件监听器
  document.addEventListener('mousemove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag, { passive: false })

  // 临时禁用主视口控制器以避免冲突
  if (props.controls && typeof props.controls.enabled !== 'undefined') {
    props.controls.enabled = false
  }

  // 更改光标样式
  if (cubeCanvas.value) {
    cubeCanvas.value.style.cursor = 'grabbing'
    cubeCanvas.value.style.userSelect = 'none'
  }
}

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value || !props.controls) return

  // 防止默认行为
  event.preventDefault()
  event.stopPropagation()

  const deltaX = event.clientX - lastMousePosition.x
  const deltaY = event.clientY - lastMousePosition.y

  // 计算旋转敏感度 - 调整为更合适的值
  const sensitivity = 0.01
  const rotationX = deltaY * sensitivity
  const rotationY = deltaX * sensitivity

  // 旋转主视口相机
  if (props.controls && typeof props.controls.rotateLeft === 'function' && typeof props.controls.rotateUp === 'function') {
    props.controls.rotateLeft(-rotationY)
    props.controls.rotateUp(-rotationX)

    // 更新控制器
    if (typeof props.controls.update === 'function') {
      props.controls.update()
    }
  }

  lastMousePosition = { x: event.clientX, y: event.clientY }
  currentView.value = 'perspective' // 拖拽后切换到自定义视图
}

const stopDrag = () => {
  console.log('Stop drag on View Cube')

  isDragging.value = false

  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)

  // 重新启用主视口控制器
  if (props.controls && typeof props.controls.enabled !== 'undefined') {
    props.controls.enabled = true
  }

  // 恢复光标样式
  if (cubeCanvas.value) {
    cubeCanvas.value.style.cursor = 'grab'
    cubeCanvas.value.style.userSelect = 'auto'
  }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  if (!props.controls) return

  // 缩放主视口
  const scale = event.deltaY > 0 ? 1.1 : 0.9
  if (props.controls.dollyIn && props.controls.dollyOut) {
    if (scale > 1) {
      props.controls.dollyOut(scale)
    } else {
      props.controls.dollyIn(1 / scale)
    }
    props.controls.update()
  }
}

// 处理立方体悬停效果
const handleCubeHover = (event: MouseEvent) => {
  if (!cubeCanvas.value || !viewCube || isDragging.value) return

  const rect = cubeCanvas.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, cubeCamera)
  const intersects = raycaster.intersectObject(viewCube)

  // 重置所有材质透明度和颜色
  cubeMaterials.forEach(material => {
    material.opacity = 0.9
    material.emissive.setHex(0x000000)
  })

  // 高亮悬停的面
  if (intersects.length > 0) {
    const materialIndex = intersects[0].face?.materialIndex
    if (materialIndex !== undefined && cubeMaterials[materialIndex]) {
      cubeMaterials[materialIndex].opacity = 1.0
      cubeMaterials[materialIndex].emissive.setHex(0x001a0d) // 轻微的绿色发光
      cubeCanvas.value.style.cursor = 'pointer'
    }
  } else {
    cubeCanvas.value.style.cursor = 'grab'
  }
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement) return

  switch (event.code) {
    case 'Numpad1':
      setView(event.ctrlKey ? 'back' : 'front')
      break
    case 'Numpad3':
      setView(event.ctrlKey ? 'left' : 'right')
      break
    case 'Numpad7':
      setView(event.ctrlKey ? 'bottom' : 'top')
      break
    case 'Numpad5':
      toggleProjection()
      break
    case 'Home':
      resetView()
      break
    case 'KeyF':
      frameSelected()
      break
  }
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initializeCube()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 清理3D资源
  if (cubeRenderer) {
    cubeRenderer.dispose()
  }
  if (viewCube) {
    viewCube.geometry.dispose()
    cubeMaterials.forEach(material => material.dispose())
  }

  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.qaq-viewport-gizmo {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 120px;
  background: rgba(56, 56, 56, 0.9);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  z-index: 1000;
  user-select: none;
}

.qaq-3d-view-cube {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-cube-canvas {
  width: 120px;
  height: 120px;
  cursor: grab;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.qaq-cube-canvas:hover {
  transform: scale(1.05);
}

.qaq-cube-canvas:active {
  cursor: grabbing;
}

.qaq-axis-indicator {
  position: relative;
  height: 40px;
  margin: 8px 12px;
}

.qaq-axis {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.qaq-axis-line {
  width: 20px;
  height: 2px;
  border-radius: 1px;
}

.qaq-axis-x {
  color: #ff4444;
  top: 0;
}

.qaq-axis-x .qaq-axis-line {
  background: #ff4444;
}

.qaq-axis-y {
  color: #44ff44;
  top: 12px;
}

.qaq-axis-y .qaq-axis-line {
  background: #44ff44;
}

.qaq-axis-z {
  color: #4444ff;
  top: 24px;
}

.qaq-axis-z .qaq-axis-line {
  background: #4444ff;
}

.qaq-axis.active {
  opacity: 1;
  transform: scale(1.1);
}

.qaq-view-controls {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-view-btn {
  width: 28px;
  height: 28px;
}

.qaq-view-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 8px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 0 0 8px 8px;
}

.qaq-current-view {
  font-size: 10px;
  font-weight: 600;
  color: var(--qaq-primary, #00DC82);
}

.qaq-projection-type {
  font-size: 9px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}
</style>
