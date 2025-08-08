<template>
  <div class="qaq-viewport-3d">
    <!-- 视口工具栏 -->
    <div class="qaq-viewport-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          :variant="currentTool === 'select' ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-cursor-arrow-rays"
          title="Select Tool (Q)"
          @click="setTool('select')"
        />
        <UButton
          :variant="currentTool === 'move' ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-arrows-pointing-out"
          title="Move Tool (W)"
          @click="setTool('move')"
        />
        <UButton
          :variant="currentTool === 'rotate' ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-arrow-path"
          title="Rotate Tool (E)"
          @click="setTool('rotate')"
        />
        <UButton
          :variant="currentTool === 'scale' ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-arrows-pointing-in"
          title="Scale Tool (R)"
          @click="setTool('scale')"
        />
      </div>

      <div class="qaq-toolbar-center">
        <span class="qaq-viewport-title">3D Viewport</span>
      </div>

      <div class="qaq-toolbar-right">
        <UButton
          :variant="showGrid ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-squares-2x2"
          title="Toggle Grid"
          @click="toggleGrid"
        />
        <UButton
          :variant="showWireframe ? 'solid' : 'ghost'"
          size="xs"
          icon="i-heroicons-cube-transparent"
          title="Toggle Wireframe"
          @click="toggleWireframe"
        />
        <UDropdown :items="viewModeItems">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-eye"
            :label="currentViewMode"
            trailing-icon="i-heroicons-chevron-down"
          />
        </UDropdown>
      </div>
    </div>

    <!-- 3D 渲染画布 -->
    <div class="qaq-viewport-container" ref="viewportContainer">
      <canvas
        ref="canvas"
        class="qaq-viewport-canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        @contextmenu.prevent
      />

      <!-- Axis Navigator -->
      <QaqAxisNavigator
        :camera="camera"
        :controls="orbitControls"
        :scene="scene"
        @view-change="onViewChange"
        @projection-change="onProjectionChange"
      />

      <!-- 视口覆盖层 -->
      <div class="qaq-viewport-overlay">
        <!-- 性能统计 -->
        <div v-if="showStats" class="qaq-stats-panel">
          <div class="qaq-stat-item">
            <span class="qaq-stat-label">FPS:</span>
            <span class="qaq-stat-value">{{ fps }}</span>
          </div>
          <div class="qaq-stat-item">
            <span class="qaq-stat-label">Triangles:</span>
            <span class="qaq-stat-value">{{ triangleCount }}</span>
          </div>
          <div class="qaq-stat-item">
            <span class="qaq-stat-label">Draw Calls:</span>
            <span class="qaq-stat-value">{{ drawCalls }}</span>
          </div>
        </div>

        <!-- 视口信息 -->
        <div class="qaq-viewport-info">
          <div class="qaq-camera-info">
            <span>Camera: {{ cameraPosition.x.toFixed(2) }}, {{ cameraPosition.y.toFixed(2) }}, {{ cameraPosition.z.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Transform Controls will be handled directly in Three.js scene -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { useEditorStore } from '~/stores/editor'
import { SceneTree, Node3D, MeshInstance3D } from '~/core'

// 导入3D编辑组件
import QaqAxisNavigator from './3d/QaqAxisNavigator.vue'

// 状态管理
const editorStore = useEditorStore()

// DOM 引用
const viewportContainer = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()

// Three.js 核心对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let orbitControls: OrbitControls
let transformControls: TransformControls

// 响应式数据
const currentTool = ref('move') // 默认启用move工具，这样选中节点时会显示Transform控制器
const showGrid = ref(true)
const showWireframe = ref(false)
const currentViewMode = ref('Solid')
const showStats = ref(false)
const fps = ref(0)
const triangleCount = ref(0)
const drawCalls = ref(0)
const cameraPosition = ref({ x: 0, y: 0, z: 0 })
const selectedObject = ref<THREE.Object3D | null>(null) // 当前选中的3D对象

// 视图模式选项
const viewModeItems = [
  [
    { label: 'Solid', click: () => setViewMode('Solid') },
    { label: 'Wireframe', click: () => setViewMode('Wireframe') },
    { label: 'Points', click: () => setViewMode('Points') }
  ]
]

// 渲染循环相关
let animationId: number
let lastTime = 0
let frameCount = 0

// Canvas自适应调整
let resizeObserver: ResizeObserver | null = null
let resizeTimeout: number | null = null
const isResizing = ref(false)

// ========================================================================
// 初始化
// ========================================================================

// 初始化引擎桥接器
async function initializeEngineBridge() {
  if (!viewportContainer.value) {
    throw new Error('视口容器未找到')
  }

  try {
    console.log('🔧 初始化编辑器引擎桥接器...')
    await editorStore.initializeEngineBridge(viewportContainer.value)

    // 获取引擎实例来设置渲染器
    const engine = editorStore.state.engineBridge?.getEngine()
    if (engine) {
      const engineRenderer = engine.getRenderer()
      const engineCamera = engine.getActiveThreeCamera() as THREE.PerspectiveCamera
      const engineScene = engine.getScene()

      if (engineRenderer && engineCamera && engineScene) {
        renderer = engineRenderer
        camera = engineCamera
        scene = engineScene

        // 设置轨道控制器
        orbitControls = new OrbitControls(camera, renderer.domElement)
        orbitControls.enableDamping = true
        orbitControls.dampingFactor = 0.05

        // 设置变换控制器
        transformControls = new TransformControls(camera, renderer.domElement)
        scene.add(transformControls as any)

        // 禁用轨道控制器当变换控制器激活时
        transformControls.addEventListener('dragging-changed', (event) => {
          orbitControls.enabled = !event.value
        })
      }
    }

    console.log('✅ 编辑器引擎桥接器初始化完成')
  } catch (error) {
    console.error('❌ 编辑器引擎桥接器初始化失败:', error)
    throw error
  }
}

// 初始化默认场景树
let isInitializingSceneTree = false

async function initializeDefaultSceneTree() {
  // 防止重复初始化
  if (isInitializingSceneTree) {
    console.log('⏳ Scene tree initialization already in progress')
    return
  }

  // 检查是否已经有场景树
  if (editorStore.state.sceneTree) {
    console.log('✅ Scene tree already exists:', editorStore.state.sceneTree.currentScene?.name)
    return
  }

  isInitializingSceneTree = true
  console.log('🌳 Initializing default scene tree...')

  try {
    // 创建默认场景树
    await editorStore.createNewScene({
      name: 'Scene1',
      type: '3d'
    })

    console.log('✅ Default scene tree created')

    // 场景已通过引擎桥接器同步

  } catch (error) {
    console.error('❌ Failed to initialize default scene tree:', error)
  } finally {
    isInitializingSceneTree = false
  }
}

onMounted(async () => {
  await nextTick()

  // 初始化引擎桥接器
  await initializeEngineBridge()

  setupEventListeners()
  setupResizeObserver()
  startRenderLoop()

  // 初始化默认场景树（如果不存在）
  await initializeDefaultSceneTree()
})

onUnmounted(() => {
  cleanup()
})

// 监听选中节点变化
watch(() => editorStore.selectedNode, (newNode, oldNode) => {
  if (newNode && (newNode as any).threeObject) {
    // 选中新节点，根据当前工具决定是否显示变换控制器
    updateTransformControls((newNode as any).threeObject)
  } else {
    // 清除选择
    if (transformControls) {
      transformControls.detach()
      ;(transformControls as any).visible = false
    }
  }
})

// 监听工具变化
watch(currentTool, (newTool, oldTool) => {
  const selectedNode = editorStore.selectedNode
  if (selectedNode && (selectedNode as any).threeObject) {
    updateTransformControls((selectedNode as any).threeObject)
  }
})

// 监听当前场景变化（统一的场景同步入口）
// 使用ref来跟踪上次同步的场景，避免重复同步
let lastSyncedSceneName: string | null = null

watch(() => editorStore.currentScene, (newScene, oldScene) => {
  // 只在场景真正改变时才同步，避免无限循环
  if (newScene && scene && newScene.name !== lastSyncedSceneName) {
    console.log('🔄 Viewport syncing to new scene:', newScene.name)
    lastSyncedSceneName = newScene.name

    // 使用nextTick确保DOM更新完成
    nextTick(() => {
      syncSceneToThreeJS(newScene)
    })
  }
}, { immediate: true })

function initThreeJS() {
  if (!canvas.value || !viewportContainer.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x2a2a2a)

  // 创建相机
  const aspect = viewportContainer.value.clientWidth / viewportContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(5, 5, 5)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true
  })
  renderer.setSize(viewportContainer.value.clientWidth, viewportContainer.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // 创建轨道控制器
  orbitControls = new OrbitControls(camera, canvas.value)
  orbitControls.enableDamping = true
  orbitControls.dampingFactor = 0.05

  // 创建变换控制器
  transformControls = new TransformControls(camera, canvas.value)

  // 监听拖拽状态变化，拖拽时禁用轨道控制器
  transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value
  })

  // 监听变换变化事件
  transformControls.addEventListener('change', () => {
    // 当变换发生时，可以在这里更新属性面板等
    if (selectedObject.value) {
      console.log('🔧 Transform changed for:', selectedObject.value.name)
    }
  })

  scene.add(transformControls as any)

  // 初始状态下隐藏TransformControls
  ;(transformControls as any).visible = false

  // 添加光照
  setupLighting()

  // 添加网格
  if (showGrid.value) {
    addGrid()
  }

  // 添加默认场景内容
  addDefaultSceneContent()
}

function setupLighting() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)
}

function addGrid() {
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444)
  gridHelper.name = 'EditorGrid'
  scene.add(gridHelper)
}

function addDefaultSceneContent() {
  // 添加一个默认的立方体
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(geometry, material)
  cube.name = 'DefaultCube'
  cube.castShadow = true
  cube.receiveShadow = true
  scene.add(cube)
}

// ========================================================================
// 渲染循环
// ========================================================================

function startRenderLoop() {
  let errorCount = 0
  const maxErrors = 5

  const animate = (currentTime: number) => {
    try {
      // 检查必要的对象是否存在
      if (!renderer || !scene || !camera || !orbitControls) {
        console.warn('Missing required objects for rendering')
        animationId = requestAnimationFrame(animate)
        return
      }

      // 更新控制器
      orbitControls.update()

      // 更新相机位置信息
      cameraPosition.value = {
        x: Math.round(camera.position.x * 100) / 100,
        y: Math.round(camera.position.y * 100) / 100,
        z: Math.round(camera.position.z * 100) / 100
      }

      // 计算 FPS
      frameCount++
      if (currentTime - lastTime >= 1000) {
        fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }

      // 安全地渲染场景
      renderer.render(scene, camera)

      // 重置错误计数
      errorCount = 0

      // 继续动画循环
      animationId = requestAnimationFrame(animate)

    } catch (error) {
      errorCount++
      console.error(`Render loop error (${errorCount}/${maxErrors}):`, error)

      if (errorCount >= maxErrors) {
        console.error('Too many render errors, stopping animation loop')
        if (animationId) {
          cancelAnimationFrame(animationId)
          animationId = 0
        }
        return
      }

      // 尝试继续渲染
      animationId = requestAnimationFrame(animate)
    }
  }

  animate(0)
}

// ========================================================================
// 工具和视图模式
// ========================================================================

function setTool(tool: string) {
  currentTool.value = tool

  if (!transformControls) return

  switch (tool) {
    case 'select':
      // 选择模式下隐藏TransformControls
      ;(transformControls as any).visible = false
      break
    case 'move':
      transformControls.setMode('translate')
      // 只有在有选中对象时才显示
      ;(transformControls as any).visible = !!selectedObject.value
      break
    case 'rotate':
      transformControls.setMode('rotate')
      // 只有在有选中对象时才显示
      ;(transformControls as any).visible = !!selectedObject.value
      break
    case 'scale':
      transformControls.setMode('scale')
      // 只有在有选中对象时才显示
      ;(transformControls as any).visible = !!selectedObject.value
      break
  }

  console.log(`🔧 Tool changed to: ${tool}, TransformControls mode: ${transformControls.mode}, visible: ${(transformControls as any).visible}`)
}

function toggleGrid() {
  showGrid.value = !showGrid.value

  const grid = scene.getObjectByName('EditorGrid')
  if (grid) {
    grid.visible = showGrid.value
  } else if (showGrid.value) {
    addGrid()
  }
}

function toggleWireframe() {
  showWireframe.value = !showWireframe.value

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => {
          if (mat instanceof THREE.Material) {
            mat.wireframe = showWireframe.value
          }
        })
      } else if (object.material instanceof THREE.Material) {
        object.material.wireframe = showWireframe.value
      }
    }
  })
}

function setViewMode(mode: string) {
  currentViewMode.value = mode

  // 实现不同的视图模式
  switch (mode) {
    case 'Solid':
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          // 恢复正常材质
        }
      })
      break
    case 'Wireframe':
      toggleWireframe()
      break
    case 'Points':
      // 实现点云视图
      break
  }
}

// ========================================================================
// 事件处理
// ========================================================================

function setupEventListeners() {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)

  // 添加鼠标点击事件监听器
  if (viewportContainer.value) {
    viewportContainer.value.addEventListener('click', handleViewportClick)
    viewportContainer.value.addEventListener('pointerdown', handlePointerDown)
  }
}

function handleResize() {
  if (!viewportContainer.value || !camera || !renderer) return

  const width = viewportContainer.value.clientWidth
  const height = viewportContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
}

function setupResizeObserver() {
  if (!viewportContainer.value) return

  // 创建ResizeObserver来监听容器尺寸变化
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // 防抖处理，避免频繁调整
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }

      isResizing.value = true

      resizeTimeout = window.setTimeout(() => {
        handleCanvasResize(entry.contentRect.width, entry.contentRect.height)
        isResizing.value = false
      }, 16) // 约60fps的更新频率
    }
  })

  // 开始观察容器
  resizeObserver.observe(viewportContainer.value)
  console.log('🔍 ResizeObserver setup for 3D viewport')
}

function handleCanvasResize(width: number, height: number) {
  if (!camera || !renderer || width <= 0 || height <= 0) return

  console.log(`📐 Canvas resizing to: ${width}x${height}`)

  // 更新相机宽高比
  camera.aspect = width / height
  camera.updateProjectionMatrix()

  // 更新渲染器尺寸
  renderer.setSize(width, height, false) // false表示不更新CSS样式

  // 更新像素比（可选，用于高DPI显示器）
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  console.log(`✅ Canvas resized successfully: ${width}x${height}`)
}

function handleKeyDown(event: KeyboardEvent) {
  switch (event.key.toLowerCase()) {
    case 'q':
      setTool('select')
      break
    case 'w':
      setTool('move')
      break
    case 'e':
      setTool('rotate')
      break
    case 'r':
      setTool('scale')
      break
    case 'g':
      toggleGrid()
      break
  }
}

// ========================================================================
// 3D视口点击选择功能
// ========================================================================

// 鼠标状态
let isMouseDown = false
let mouseDownPosition = { x: 0, y: 0 }

// 新的点击事件处理器
function handleViewportClick(event: MouseEvent) {
  // 防止事件冒泡
  event.stopPropagation()

  // 只在左键点击时处理选择
  if (event.button !== 0) return

  console.log('🖱️ Viewport clicked at:', event.clientX, event.clientY)
  performObjectSelection(event)
}

function handlePointerDown(event: PointerEvent) {
  isMouseDown = true
  mouseDownPosition.x = event.clientX
  mouseDownPosition.y = event.clientY
}

// 执行对象选择的核心逻辑
function performObjectSelection(event: MouseEvent) {
  if (!viewportContainer.value || !camera || !scene) {
    console.warn('⚠️ Missing required objects for selection')
    return
  }

  // 获取鼠标在画布上的标准化坐标
  const rect = viewportContainer.value.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  console.log('🎯 Mouse normalized coordinates:', mouse.x, mouse.y)

  // 创建射线投射器
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  // 获取所有可选择的对象（排除编辑器辅助对象）
  const selectableObjects: THREE.Object3D[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh &&
        obj.name !== 'EditorGrid' &&
        !obj.name.startsWith('DirectionalLight') &&
        !obj.name.startsWith('AmbientLight') &&
        obj.visible) {
      selectableObjects.push(obj)
    }
  })

  console.log('🔍 Selectable objects found:', selectableObjects.length)

  // 执行射线投射
  const intersects = raycaster.intersectObjects(selectableObjects, true)

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object
    console.log('✅ Object selected:', selectedObject.name)

    // 选择对象并同步到编辑器
    selectObjectAndSync(selectedObject)
  } else {
    console.log('❌ No object selected, clearing selection')
    // 清除选择
    clearSelection()
  }
}

// 选择对象并同步到编辑器的所有面板
function selectObjectAndSync(threeObject: THREE.Object3D) {
  console.log('🔄 Syncing object selection:', threeObject.name)

  // 1. 首先设置选中的3D对象（用于Transform Controls）- 这是最重要的
  selectedObject.value = threeObject

  // 2. 附加TransformControls到选中的对象
  if (transformControls) {
    transformControls.attach(threeObject)
    ;(transformControls as any).visible = true
    console.log('✅ Transform Controls attached to:', threeObject.name)
  }

  // 3. 尝试查找对应的节点（如果场景树存在）
  const sceneTree = editorStore.sceneTree
  if (sceneTree) {
    const node = findNodeByThreeObject(sceneTree.root, threeObject)
    if (node) {
      console.log('🎯 Found corresponding node:', node.name, node.constructor.name)
      // 更新编辑器选择状态
      editorStore.setSelectedNode(node)
    } else {
      console.warn('⚠️ Could not find node for Three.js object:', threeObject.name)
    }
  } else {
    console.warn('⚠️ No scene tree available, but selectedObject still set for Transform Controls')
  }

  console.log('✅ Object selected:', threeObject.name)
}

// 清除选择
function clearSelection() {
  // 清除选中的3D对象
  selectedObject.value = null

  // 分离TransformControls
  if (transformControls) {
    transformControls.detach()
    ;(transformControls as any).visible = false
    console.log('✅ Transform Controls detached')
  }

  // 清除编辑器状态
  editorStore.clearSelection()
  editorStore.setSelectedNode(null)

  console.log('✅ Selection cleared')
}

// 注意：findNodeByThreeObject函数已在文件后面定义，这里不需要重复定义

function handleMouseDown(event: MouseEvent) {
  isMouseDown = true
  mouseDownPosition.x = event.clientX
  mouseDownPosition.y = event.clientY
}

function handleMouseMove(event: MouseEvent) {
  // 处理鼠标移动
}

function handleMouseUp(event: MouseEvent) {
  if (!isMouseDown) return
  isMouseDown = false

  // 检查是否是点击（而不是拖拽）
  const deltaX = Math.abs(event.clientX - mouseDownPosition.x)
  const deltaY = Math.abs(event.clientY - mouseDownPosition.y)
  const isClick = deltaX < 5 && deltaY < 5

  if (isClick) {
    // 在任何工具模式下都允许点击选择物体
    handleObjectSelection(event)
  }
}

function handleObjectSelection(event: MouseEvent) {
  if (!canvas.value || !camera || !scene) return

  // 获取鼠标在画布上的标准化坐标
  const rect = canvas.value.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 创建射线投射器
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  // 获取所有可选择的对象（排除编辑器辅助对象）
  const selectableObjects = scene.children.filter(obj =>
    obj.name !== 'EditorGrid' &&
    obj.type === 'Mesh' &&
    obj.visible
  )

  console.log('🔍 Selectable objects:', selectableObjects.map(obj => ({ name: obj.name, type: obj.type })))

  // 进行射线投射
  const intersects = raycaster.intersectObjects(selectableObjects, true)

  console.log('🎯 Intersects found:', intersects.length)

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object
    console.log('✅ Clicked object:', clickedObject.name, clickedObject.type)
    // 使用统一的选择同步函数
    selectObjectAndSync(clickedObject)
  } else {
    console.log('❌ No object clicked, clearing selection')
    // 点击空白处，清除选择
    selectedObject.value = null
    editorStore.clearSelection()
  }
}

function selectObject(object: THREE.Object3D) {
  // 查找对应的节点
  const sceneTree = editorStore.sceneTree
  if (!sceneTree) return

  const node = findNodeByThreeObject(sceneTree.root, object)
  if (node) {
    // 设置选中的3D对象（用于Transform Controls组件）
    selectedObject.value = object

    // 更新编辑器状态
    editorStore.setSelectedNode(node)

    console.log(`🎯 Selected object: ${object.name}`)
    console.log(`🔧 selectedObject.value set to:`, selectedObject.value?.name)
  }
}

// 更新变换控制器状态
function updateTransformControls(object: THREE.Object3D) {
  if (!transformControls) return

  console.log(`🔧 Updating transform controls for: ${object.name}, tool: ${currentTool.value}`)

  // 根据当前工具决定是否显示变换控制器
  if (currentTool.value === 'move' || currentTool.value === 'rotate' || currentTool.value === 'scale') {
    transformControls.attach(object)
    ;(transformControls as any).visible = true
    transformControls.setMode(currentTool.value)

    // 设置控制器大小，确保可见性
    transformControls.setSize(0.8)

    console.log(`✅ Transform controls enabled: ${currentTool.value} for ${object.name}`)
  } else {
    // select工具时隐藏变换控制器，但保持选中状态
    transformControls.detach()
    ;(transformControls as any).visible = false
    console.log('🔧 Transform controls disabled')
  }
}

// 从节点选择对象（用于场景树点击）
function selectNodeObject(node: any) {
  // 查找节点对应的Three.js对象
  const threeObject = findThreeObjectByNode(scene, node)
  if (threeObject) {
    selectObject(threeObject)
  } else {
    // 如果没有对应的3D对象，只更新选中状态
    editorStore.setSelectedNode(node)
    clearSelection()
  }
}

// 根据节点查找对应的Three.js对象
function findThreeObjectByNode(parent: THREE.Object3D, targetNode: any): THREE.Object3D | null {
  // 检查当前对象是否匹配
  if (parent.userData && parent.userData.nodeId === targetNode.id) {
    return parent
  }

  // 递归检查子对象
  for (const child of parent.children) {
    const found = findThreeObjectByNode(child, targetNode)
    if (found) return found
  }

  return null
}



function findNodeByThreeObject(node: any, threeObject: THREE.Object3D): any {
  // 检查当前节点
  if (node.threeObject === threeObject) {
    return node
  }

  // 递归检查子节点
  for (const child of node.children) {
    const found = findNodeByThreeObject(child, threeObject)
    if (found) return found
  }

  return null
}

// ========================================================================
// 场景同步
// ========================================================================

function syncSceneTreeToThreeJS(sceneTree: any) {
  if (!sceneTree || !sceneTree.root) return

  // 清除现有的场景内容（保留编辑器辅助对象）
  const objectsToRemove = scene.children.filter(obj =>
    obj.name !== 'EditorGrid' &&
    !obj.name.startsWith('DirectionalLight') &&
    !obj.name.startsWith('AmbientLight')
  )

  objectsToRemove.forEach(obj => scene.remove(obj))

  // 添加场景树的根节点
  if (sceneTree.root.threeObject) {
    scene.add(sceneTree.root.threeObject)
  }
}

function syncSceneToThreeJS(sceneNode: any) {
  if (!sceneNode || !scene) return

  console.log('🔄 Syncing scene to Three.js:', sceneNode.name)

  // 清除现有的场景内容（保留编辑器辅助对象）
  clearSceneObjects()

  // 对于根节点，直接添加其threeObject到场景
  if (sceneNode.threeObject) {
    scene.add(sceneNode.threeObject)
    console.log('✅ Scene sync completed -', sceneNode.threeObject.children.length, 'children added')
  }
}

// ========================================================================
// 3D编辑功能事件处理
// ========================================================================

// Viewport Gizmo事件处理
function onViewChange(view: string) {
  console.log('🎥 View changed to:', view)
  // 视图变化已经在Gizmo组件内部处理
}

function onProjectionChange(isOrthographic: boolean) {
  console.log('📐 Projection changed to:', isOrthographic ? 'orthographic' : 'perspective')

  if (!camera || !viewportContainer.value) return

  const aspect = viewportContainer.value.clientWidth / viewportContainer.value.clientHeight
  const distance = camera.position.length()

  if (isOrthographic) {
    // 切换到正交相机
    const size = distance * 0.5
    const orthCamera = new THREE.OrthographicCamera(
      -size * aspect, size * aspect,
      size, -size,
      0.1, 1000
    )
    orthCamera.position.copy(camera.position)
    orthCamera.lookAt(0, 0, 0)
    camera = orthCamera
  } else {
    // 切换到透视相机
    const perspCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    perspCamera.position.copy(camera.position)
    perspCamera.lookAt(0, 0, 0)
    camera = perspCamera
  }

  // 更新轨道控制器
  if (orbitControls) {
    orbitControls.object = camera
    orbitControls.update()
  }

  // 更新渲染器
  if (renderer) {
    renderer.setSize(viewportContainer.value.clientWidth, viewportContainer.value.clientHeight)
  }
}

// Transform Controls事件处理将由Three.js原生事件处理

// 清除场景中的用户对象，保留编辑器对象
function clearSceneObjects() {
  const objectsToRemove = []

  // 收集需要移除的对象
  scene.traverse((obj) => {
    if (obj !== scene &&
        obj.name !== 'EditorGrid' &&
        !obj.name.startsWith('DirectionalLight') &&
        !obj.name.startsWith('AmbientLight') &&
        obj.type !== 'TransformControls' &&
        obj.parent === scene) {
      objectsToRemove.push(obj)
    }
  })

  // 移除对象
  objectsToRemove.forEach(obj => {
    try {
      scene.remove(obj)
      console.log('🗑️ Removed from scene:', obj.name)
    } catch (error) {
      console.warn('Error removing object:', error)
    }
  })
}

// 递归添加节点到Three.js场景
function addSceneNodeToThreeJS(node: any) {
  try {
    console.log('🔍 Processing node:', node.name, node.constructor.name, 'hasThreeObject:', !!node.threeObject)

    // 只处理有threeObject的3D节点
    if (node.threeObject &&
        (node.constructor.name === 'Node3D' || node.constructor.name === 'MeshInstance3D')) {

      // 对于根节点，直接添加到场景
      if (!node.parent || node.parent.constructor.name !== 'Node3D') {
        // 确保对象没有其他父级
        if (node.threeObject.parent && node.threeObject.parent !== scene) {
          node.threeObject.parent.remove(node.threeObject)
        }

        // 只有当对象不在场景中时才添加
        if (node.threeObject.parent !== scene) {
          scene.add(node.threeObject)
          console.log('✅ Added root node to scene:', node.name, node.constructor.name)
        }
      } else {
        // 对于子节点，确保它们已经通过Node3D.addChild()正确添加到父节点的threeObject中
        console.log('📎 Child node should be attached to parent:', node.name, 'parent:', node.parent?.name)
      }

      // 验证Three.js对象的位置是否正确设置
      if (node.constructor.name === 'MeshInstance3D') {
        console.log('📍 MeshInstance3D position:', node.name,
          'x:', node.position.x, 'y:', node.position.y, 'z:', node.position.z)
        console.log('📍 Three.js object position:',
          'x:', node.threeObject.position.x, 'y:', node.threeObject.position.y, 'z:', node.threeObject.position.z)
      }
    }

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      console.log('🌳 Processing', node.children.length, 'children of', node.name)
      for (const child of node.children) {
        addSceneNodeToThreeJS(child)
      }
    }
  } catch (error) {
    console.error('❌ Error adding node to scene:', node?.name, error)
  }
}

function handleWheel(event: WheelEvent) {
  // 滚轮缩放由 OrbitControls 处理
}

// ========================================================================
// 清理
// ========================================================================

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)

  // 清理视口点击事件监听器
  if (viewportContainer.value) {
    viewportContainer.value.removeEventListener('click', handleViewportClick)
    viewportContainer.value.removeEventListener('pointerdown', handlePointerDown)
  }

  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  // 清理resize timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }

  if (renderer) {
    renderer.dispose()
  }

  if (orbitControls) {
    orbitControls.dispose()
  }

  if (transformControls) {
    transformControls.dispose()
  }
}

// 暴露方法给父组件
defineExpose({
  selectObject: selectNodeObject,  // 暴露适合从场景树调用的方法
  clearSelection
})
</script>

<style scoped>
.qaq-viewport-3d {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-viewport-bg, #2a2a2a);
}

.qaq-viewport-toolbar {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background-color: var(--qaq-toolbar-bg, #3a3a3a);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-toolbar-left,
.qaq-toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qaq-toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.qaq-viewport-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
}

.qaq-viewport-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.qaq-viewport-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.qaq-viewport-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.qaq-stats-panel {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #ffffff;
}

.qaq-stat-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.qaq-stat-label {
  color: #cccccc;
}

.qaq-stat-value {
  color: #ffffff;
  font-weight: 600;
}

.qaq-viewport-info {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  color: #cccccc;
}

.qaq-transform-panel {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 280px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
  pointer-events: auto;
}
</style>
