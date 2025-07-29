<template>
  <div class="qaq-axis-navigator" ref="navigatorContainer">
    <!-- 3D坐标轴渲染容器 -->
    <div class="qaq-3d-axis-container" ref="axisContainer">
      <canvas
        ref="axisCanvas"
        class="qaq-axis-canvas"
        @mousedown="startDrag"
        @mousemove="handleAxisHover"
        @click="handleAxisClick"
      ></canvas>
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
const navigatorContainer = ref<HTMLElement>()
const axisContainer = ref<HTMLElement>()
const axisCanvas = ref<HTMLCanvasElement>()
const currentView = ref('perspective')
const isOrthographic = ref(false)

// 3D坐标轴相关变量
let axisScene: THREE.Scene
let axisCamera: THREE.PerspectiveCamera
let axisRenderer: THREE.WebGLRenderer
let xAxis: THREE.Group
let yAxis: THREE.Group
let zAxis: THREE.Group
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// 预定义视图位置
const viewPositions = {
  'x+': new THREE.Vector3(10, 0, 0),   // 右视图
  'x-': new THREE.Vector3(-10, 0, 0),  // 左视图
  'y+': new THREE.Vector3(0, 10, 0),   // 顶视图
  'y-': new THREE.Vector3(0, -10, 0),  // 底视图
  'z+': new THREE.Vector3(0, 0, 10),   // 前视图
  'z-': new THREE.Vector3(0, 0, -10)   // 后视图
}

// 计算属性
const currentViewName = computed(() => {
  const viewNames: Record<string, string> = {
    'x+': '右视图',
    'x-': '左视图',
    'y+': '顶视图',
    'y-': '底视图',
    'z+': '前视图',
    'z-': '后视图',
    perspective: '透视视图'
  }
  return viewNames[currentView.value] || '自定义视图'
})

// 3D坐标轴初始化
const initializeAxis = async () => {
  if (!axisCanvas.value || !axisContainer.value) return

  // 创建3D场景
  axisScene = new THREE.Scene()

  // 创建相机
  const size = 100
  axisCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
  axisCamera.position.set(0, 0, 3)
  axisCamera.lookAt(0, 0, 0)

  // 创建渲染器
  axisRenderer = new THREE.WebGLRenderer({
    canvas: axisCanvas.value,
    alpha: true,
    antialias: true
  })
  axisRenderer.setSize(size, size)
  axisRenderer.setPixelRatio(window.devicePixelRatio)
  axisRenderer.setClearColor(0x000000, 0)

  // 创建坐标轴
  createAxes()

  // 初始化射线投射器
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 开始渲染循环
  renderAxis()

  console.log('3D Axis Navigator initialized')
}

// 创建坐标轴
const createAxes = () => {
  const axisLength = 1.2
  const arrowLength = 0.2
  const arrowWidth = 0.08
  const centerSphereRadius = 0.06

  // 创建中心球体
  const centerGeometry = new THREE.SphereGeometry(centerSphereRadius, 16, 12)
  const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc })
  const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial)
  centerSphere.userData = { type: 'center' }
  axisScene.add(centerSphere)

  // X轴 (红色) - 从中心延伸到两端
  xAxis = new THREE.Group()
  const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })

  // X轴正方向线段
  const xPosGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8)
  const xPosLine = new THREE.Mesh(xPosGeometry, xMaterial)
  xPosLine.rotation.z = -Math.PI / 2
  xPosLine.position.x = axisLength / 2

  // X轴负方向线段
  const xNegLine = new THREE.Mesh(xPosGeometry, xMaterial)
  xNegLine.rotation.z = -Math.PI / 2
  xNegLine.position.x = -axisLength / 2

  // X轴正方向箭头
  const xArrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8)
  const xPosArrow = new THREE.Mesh(xArrowGeometry, xMaterial)
  xPosArrow.rotation.z = -Math.PI / 2
  xPosArrow.position.x = axisLength + arrowLength / 2

  // X轴负方向箭头
  const xNegArrow = new THREE.Mesh(xArrowGeometry, xMaterial)
  xNegArrow.rotation.z = Math.PI / 2
  xNegArrow.position.x = -axisLength - arrowLength / 2

  // X轴标签
  const xPosLabel = createAxisLabel('X', 0xff4444)
  xPosLabel.position.x = axisLength + arrowLength + 0.15

  const xNegLabel = createAxisLabel('-X', 0xff4444)
  xNegLabel.position.x = -axisLength - arrowLength - 0.15

  xAxis.add(xPosLine, xNegLine, xPosArrow, xNegArrow, xPosLabel, xNegLabel)
  xAxis.userData = { axis: 'x' }
  axisScene.add(xAxis)

  // Y轴 (绿色) - 从中心延伸到两端
  yAxis = new THREE.Group()
  const yMaterial = new THREE.MeshBasicMaterial({ color: 0x44ff44 })

  // Y轴正方向线段
  const yPosGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8)
  const yPosLine = new THREE.Mesh(yPosGeometry, yMaterial)
  yPosLine.position.y = axisLength / 2

  // Y轴负方向线段
  const yNegLine = new THREE.Mesh(yPosGeometry, yMaterial)
  yNegLine.position.y = -axisLength / 2

  // Y轴正方向箭头
  const yArrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8)
  const yPosArrow = new THREE.Mesh(yArrowGeometry, yMaterial)
  yPosArrow.position.y = axisLength + arrowLength / 2

  // Y轴负方向箭头
  const yNegArrow = new THREE.Mesh(yArrowGeometry, yMaterial)
  yNegArrow.rotation.x = Math.PI
  yNegArrow.position.y = -axisLength - arrowLength / 2

  // Y轴标签
  const yPosLabel = createAxisLabel('Y', 0x44ff44)
  yPosLabel.position.y = axisLength + arrowLength + 0.15

  const yNegLabel = createAxisLabel('-Y', 0x44ff44)
  yNegLabel.position.y = -axisLength - arrowLength - 0.15

  yAxis.add(yPosLine, yNegLine, yPosArrow, yNegArrow, yPosLabel, yNegLabel)
  yAxis.userData = { axis: 'y' }
  axisScene.add(yAxis)

  // Z轴 (蓝色) - 从中心延伸到两端
  zAxis = new THREE.Group()
  const zMaterial = new THREE.MeshBasicMaterial({ color: 0x4444ff })

  // Z轴正方向线段
  const zPosGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8)
  const zPosLine = new THREE.Mesh(zPosGeometry, zMaterial)
  zPosLine.rotation.x = Math.PI / 2
  zPosLine.position.z = axisLength / 2

  // Z轴负方向线段
  const zNegLine = new THREE.Mesh(zPosGeometry, zMaterial)
  zNegLine.rotation.x = Math.PI / 2
  zNegLine.position.z = -axisLength / 2

  // Z轴正方向箭头
  const zArrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8)
  const zPosArrow = new THREE.Mesh(zArrowGeometry, zMaterial)
  zPosArrow.rotation.x = Math.PI / 2
  zPosArrow.position.z = axisLength + arrowLength / 2

  // Z轴负方向箭头
  const zNegArrow = new THREE.Mesh(zArrowGeometry, zMaterial)
  zNegArrow.rotation.x = -Math.PI / 2
  zNegArrow.position.z = -axisLength - arrowLength / 2

  // Z轴标签
  const zPosLabel = createAxisLabel('Z', 0x4444ff)
  zPosLabel.position.z = axisLength + arrowLength + 0.15

  const zNegLabel = createAxisLabel('-Z', 0x4444ff)
  zNegLabel.position.z = -axisLength - arrowLength - 0.15

  zAxis.add(zPosLine, zNegLine, zPosArrow, zNegArrow, zPosLabel, zNegLabel)
  zAxis.userData = { axis: 'z' }
  axisScene.add(zAxis)
}

// 拖拽状态
let isDragging = false
let dragStart = { x: 0, y: 0 }
let lastMousePosition = { x: 0, y: 0 }

// 创建轴标签
const createAxisLabel = (text: string, color: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 32, 32)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(0.3, 0.3, 1)

  return sprite
}

// 渲染3D坐标轴
const renderAxis = () => {
  if (!axisRenderer || !axisScene || !axisCamera) return

  // 同步坐标轴旋转与主相机方向
  syncAxisRotation()

  // 渲染场景
  axisRenderer.render(axisScene, axisCamera)

  // 继续动画循环
  requestAnimationFrame(renderAxis)
}

// 同步坐标轴旋转
const syncAxisRotation = () => {
  if (!props.camera || !props.controls) return

  // 获取主相机的旋转矩阵
  const cameraMatrix = new THREE.Matrix4()
  cameraMatrix.lookAt(
    props.camera.position,
    props.controls.target || new THREE.Vector3(0, 0, 0),
    props.camera.up
  )

  // 提取旋转并应用到坐标轴
  const rotation = new THREE.Euler()
  rotation.setFromRotationMatrix(cameraMatrix)

  // 应用旋转到所有轴
  if (xAxis && yAxis && zAxis) {
    xAxis.rotation.copy(rotation)
    yAxis.rotation.copy(rotation)
    zAxis.rotation.copy(rotation)
  }
}

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (!props.controls) return

  event.preventDefault()
  event.stopPropagation()

  isDragging = true
  dragStart = { x: event.clientX, y: event.clientY }
  lastMousePosition = { x: event.clientX, y: event.clientY }

  // 添加全局事件监听器
  document.addEventListener('mousemove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag, { passive: false })

  // 禁用主视口控制器
  if (props.controls && typeof props.controls.enabled !== 'undefined') {
    props.controls.enabled = false
  }

  // 更改光标样式
  if (axisCanvas.value) {
    axisCanvas.value.style.cursor = 'grabbing'
  }
}

// 处理拖拽
const handleDrag = (event: MouseEvent) => {
  if (!isDragging || !props.controls) return

  event.preventDefault()
  event.stopPropagation()

  const deltaX = event.clientX - lastMousePosition.x
  const deltaY = event.clientY - lastMousePosition.y

  // 计算旋转敏感度
  const sensitivity = 0.01
  const rotationX = deltaY * sensitivity
  const rotationY = deltaX * sensitivity

  // 旋转主视口相机
  if (props.controls &&
      typeof props.controls.rotateLeft === 'function' &&
      typeof props.controls.rotateUp === 'function') {
    props.controls.rotateLeft(-rotationY)
    props.controls.rotateUp(-rotationX)

    if (typeof props.controls.update === 'function') {
      props.controls.update()
    }
  }

  lastMousePosition = { x: event.clientX, y: event.clientY }
}

// 停止拖拽
const stopDrag = () => {
  isDragging = false

  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)

  // 重新启用主视口控制器
  if (props.controls && typeof props.controls.enabled !== 'undefined') {
    props.controls.enabled = true
  }

  // 恢复光标样式
  if (axisCanvas.value) {
    axisCanvas.value.style.cursor = 'grab'
  }
}

// 处理坐标轴点击
const handleAxisClick = (event: MouseEvent) => {
  // 检查是否刚刚完成拖拽操作
  const dragDistance = Math.sqrt(
    Math.pow(event.clientX - dragStart.x, 2) +
    Math.pow(event.clientY - dragStart.y, 2)
  )

  // 如果拖拽距离超过5像素，则认为是拖拽操作，不触发点击
  if (dragDistance > 5) {
    return
  }

  const rect = axisCanvas.value?.getBoundingClientRect()
  if (!rect) return

  // 计算鼠标在canvas中的位置
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 射线投射检测
  raycaster.setFromCamera(mouse, axisCamera)
  const intersects = raycaster.intersectObjects([xAxis, yAxis, zAxis], true)

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object
    let axis = ''

    // 找到被点击的轴
    let parent = clickedObject.parent
    while (parent && !parent.userData.axis) {
      parent = parent.parent
    }

    if (parent && parent.userData.axis) {
      axis = parent.userData.axis

      // 根据点击位置确定正负方向
      const clickPoint = intersects[0].point
      let direction = '+'

      if (axis === 'x' && clickPoint.x < 0) direction = '-'
      else if (axis === 'y' && clickPoint.y < 0) direction = '-'
      else if (axis === 'z' && clickPoint.z < 0) direction = '-'

      const view = axis + direction
      setView(view)
    }
  }
}

// 处理坐标轴悬停
const handleAxisHover = (event: MouseEvent) => {
  const rect = axisCanvas.value?.getBoundingClientRect()
  if (!rect) return

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, axisCamera)
  const intersects = raycaster.intersectObjects([xAxis, yAxis, zAxis], true)

  // 重置所有轴的材质
  resetAxisMaterials()

  // 高亮悬停的轴
  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object
    let parent = hoveredObject.parent
    while (parent && !parent.userData.axis) {
      parent = parent.parent
    }

    if (parent) {
      highlightAxis(parent)
      axisCanvas.value!.style.cursor = 'pointer'
    }
  } else {
    axisCanvas.value!.style.cursor = 'default'
  }
}

// 重置轴材质
const resetAxisMaterials = () => {
  [xAxis, yAxis, zAxis].forEach(axis => {
    if (axis) {
      axis.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = 1.0
        }
      })
    }
  })
}

// 高亮轴
const highlightAxis = (axis: THREE.Group) => {
  axis.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      child.material.opacity = 0.7
    }
  })
}

// 设置视图
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

// 相机动画
const animateCameraTo = (targetPosition: THREE.Vector3, lookAtTarget: THREE.Vector3) => {
  if (!props.camera || !props.controls) return

  const startPosition = props.camera.position.clone()
  const duration = 500
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

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

// 重置视图
const resetView = () => {
  const defaultPosition = new THREE.Vector3(5, 5, 5)
  const target = new THREE.Vector3(0, 0, 0)

  animateCameraTo(defaultPosition, target)
  currentView.value = 'perspective'

  emit('view-change', 'perspective')
}

// 切换投影
const toggleProjection = () => {
  isOrthographic.value = !isOrthographic.value
  emit('projection-change', isOrthographic.value)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initializeAxis()
})

onUnmounted(() => {
  // 清理3D资源
  if (axisRenderer) {
    axisRenderer.dispose()
  }
  if (xAxis && yAxis && zAxis) {
    [xAxis, yAxis, zAxis].forEach(axis => {
      axis.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
  }
})
</script>

<style scoped>
.qaq-axis-navigator {
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

.qaq-3d-axis-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 10px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qaq-axis-canvas {
  width: 100px;
  height: 100px;
  cursor: grab;
  border-radius: 6px;
  transition: transform 0.2s ease;
}

.qaq-axis-canvas:hover {
  transform: scale(1.05);
}

.qaq-axis-canvas:active {
  cursor: grabbing;
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
