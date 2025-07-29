<template>
  <div class="qaq-transform-controls">
    <!-- Transform控制器工具栏 -->
    <div class="qaq-transform-toolbar">
      <div class="qaq-transform-modes">
        <UButton
          :icon="'i-heroicons-arrows-pointing-out'"
          size="xs"
          :variant="transformMode === 'translate' ? 'solid' : 'ghost'"
          @click="setTransformMode('translate')"
          title="移动工具 (W)"
          class="qaq-transform-btn"
        />
        <UButton
          :icon="'i-heroicons-arrow-path'"
          size="xs"
          :variant="transformMode === 'rotate' ? 'solid' : 'ghost'"
          @click="setTransformMode('rotate')"
          title="旋转工具 (E)"
          class="qaq-transform-btn"
        />
        <UButton
          :icon="'i-heroicons-magnifying-glass-plus'"
          size="xs"
          :variant="transformMode === 'scale' ? 'solid' : 'ghost'"
          @click="setTransformMode('scale')"
          title="缩放工具 (R)"
          class="qaq-transform-btn"
        />
      </div>

      <div class="qaq-transform-options">
        <UButton
          :icon="transformSpace === 'world' ? 'i-heroicons-globe-alt' : 'i-heroicons-cube'"
          size="xs"
          variant="ghost"
          @click="toggleTransformSpace"
          :title="transformSpace === 'world' ? '世界坐标系' : '本地坐标系'"
          class="qaq-space-btn"
        />
        <UButton
          :icon="snapEnabled ? 'i-heroicons-squares-2x2' : 'i-heroicons-squares-plus'"
          size="xs"
          :variant="snapEnabled ? 'solid' : 'ghost'"
          @click="toggleSnap"
          title="网格吸附"
          class="qaq-snap-btn"
        />
      </div>
    </div>

    <!-- Transform数值输入面板 -->
    <div class="qaq-transform-values" v-if="selectedObject">
      <div class="qaq-transform-section">
        <h4>位置 (Position)</h4>
        <div class="qaq-vector3-input">
          <div class="qaq-input-group">
            <label>X</label>
            <input
              v-model.number="position.x"
              type="number"
              step="0.1"
              @input="updatePosition"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Y</label>
            <input
              v-model.number="position.y"
              type="number"
              step="0.1"
              @input="updatePosition"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Z</label>
            <input
              v-model.number="position.z"
              type="number"
              step="0.1"
              @input="updatePosition"
              class="qaq-number-input"
            />
          </div>
        </div>
      </div>

      <div class="qaq-transform-section">
        <h4>旋转 (Rotation)</h4>
        <div class="qaq-vector3-input">
          <div class="qaq-input-group">
            <label>X</label>
            <input
              v-model.number="rotation.x"
              type="number"
              step="1"
              @input="updateRotation"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Y</label>
            <input
              v-model.number="rotation.y"
              type="number"
              step="1"
              @input="updateRotation"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Z</label>
            <input
              v-model.number="rotation.z"
              type="number"
              step="1"
              @input="updateRotation"
              class="qaq-number-input"
            />
          </div>
        </div>
      </div>

      <div class="qaq-transform-section">
        <h4>缩放 (Scale)</h4>
        <div class="qaq-vector3-input">
          <div class="qaq-input-group">
            <label>X</label>
            <input
              v-model.number="scale.x"
              type="number"
              step="0.1"
              min="0.001"
              @input="updateScale"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Y</label>
            <input
              v-model.number="scale.y"
              type="number"
              step="0.1"
              min="0.001"
              @input="updateScale"
              class="qaq-number-input"
            />
          </div>
          <div class="qaq-input-group">
            <label>Z</label>
            <input
              v-model.number="scale.z"
              type="number"
              step="0.1"
              min="0.001"
              @input="updateScale"
              class="qaq-number-input"
            />
          </div>
        </div>
        <UButton
          icon="i-heroicons-link"
          size="xs"
          :variant="uniformScale ? 'solid' : 'ghost'"
          @click="uniformScale = !uniformScale"
          title="统一缩放"
          class="qaq-uniform-scale-btn"
        />
      </div>
    </div>

    <!-- 无选中物体时的提示 -->
    <div class="qaq-no-selection" v-else>
      <UIcon name="i-heroicons-cursor-arrow-rays" class="qaq-no-selection-icon" />
      <p>请在场景中选择一个物体</p>
      <p class="qaq-hint">使用场景树或直接点击3D视口中的物体</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

// Props
interface Props {
  selectedObject?: THREE.Object3D | null
  scene?: THREE.Scene
  camera?: THREE.Camera
  renderer?: THREE.WebGLRenderer
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'transform-change': [object: THREE.Object3D, type: 'position' | 'rotation' | 'scale']
  'mode-change': [mode: 'translate' | 'rotate' | 'scale']
}>()

// 响应式状态
const transformMode = ref<'translate' | 'rotate' | 'scale'>('translate')
const transformSpace = ref<'world' | 'local'>('world')
const snapEnabled = ref(false)
const uniformScale = ref(true)

// Transform Controls实例
let transformControls: any = null

// 当前选中物体的变换值
const position = ref({ x: 0, y: 0, z: 0 })
const rotation = ref({ x: 0, y: 0, z: 0 })
const scale = ref({ x: 1, y: 1, z: 1 })

// 计算属性
const selectedObject = computed(() => props.selectedObject)

// 方法
const initializeTransformControls = async () => {
  if (!props.scene || !props.camera || !props.renderer) {
    console.warn('Scene, camera, or renderer not provided for Transform Controls')
    return
  }

  try {
    // 使用Three.js内置的TransformControls
    const { TransformControls } = await import('three/examples/jsm/controls/TransformControls.js')

    // 创建Transform Controls
    transformControls = new TransformControls(props.camera, props.renderer.domElement)
    transformControls.setMode(transformMode.value)
    transformControls.setSpace(transformSpace.value)

    // 添加到场景
    props.scene.add(transformControls)

    // 监听变换事件
    transformControls.addEventListener('change', onTransformChange)
    transformControls.addEventListener('dragging-changed', onDraggingChanged)

    console.log('✅ Transform Controls initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Transform Controls:', error)
  }
}

const setTransformMode = (mode: 'translate' | 'rotate' | 'scale') => {
  transformMode.value = mode
  if (transformControls) {
    transformControls.setMode(mode)
  }
  emit('mode-change', mode)
}

const toggleTransformSpace = () => {
  transformSpace.value = transformSpace.value === 'world' ? 'local' : 'world'
  if (transformControls) {
    transformControls.setSpace(transformSpace.value)
  }
}

const toggleSnap = () => {
  snapEnabled.value = !snapEnabled.value
  if (transformControls) {
    // Three.js TransformControls的吸附设置
    transformControls.setTranslationSnap(snapEnabled.value ? 0.5 : null)
    transformControls.setRotationSnap(snapEnabled.value ? THREE.MathUtils.degToRad(15) : null)
    transformControls.setScaleSnap(snapEnabled.value ? 0.1 : null)
  }
}

const updateTransformValues = () => {
  if (selectedObject.value) {
    position.value = {
      x: Number(selectedObject.value.position.x.toFixed(3)),
      y: Number(selectedObject.value.position.y.toFixed(3)),
      z: Number(selectedObject.value.position.z.toFixed(3))
    }

    rotation.value = {
      x: Number(THREE.MathUtils.radToDeg(selectedObject.value.rotation.x).toFixed(1)),
      y: Number(THREE.MathUtils.radToDeg(selectedObject.value.rotation.y).toFixed(1)),
      z: Number(THREE.MathUtils.radToDeg(selectedObject.value.rotation.z).toFixed(1))
    }

    scale.value = {
      x: Number(selectedObject.value.scale.x.toFixed(3)),
      y: Number(selectedObject.value.scale.y.toFixed(3)),
      z: Number(selectedObject.value.scale.z.toFixed(3))
    }
  }
}

const updatePosition = () => {
  if (selectedObject.value) {
    selectedObject.value.position.set(position.value.x, position.value.y, position.value.z)
    emit('transform-change', selectedObject.value, 'position')
  }
}

const updateRotation = () => {
  if (selectedObject.value) {
    selectedObject.value.rotation.set(
      THREE.MathUtils.degToRad(rotation.value.x),
      THREE.MathUtils.degToRad(rotation.value.y),
      THREE.MathUtils.degToRad(rotation.value.z)
    )
    emit('transform-change', selectedObject.value, 'rotation')
  }
}

const updateScale = () => {
  if (selectedObject.value) {
    if (uniformScale.value) {
      // 统一缩放：使用X值作为基准
      const scaleValue = scale.value.x
      scale.value.y = scaleValue
      scale.value.z = scaleValue
      selectedObject.value.scale.set(scaleValue, scaleValue, scaleValue)
    } else {
      selectedObject.value.scale.set(scale.value.x, scale.value.y, scale.value.z)
    }
    emit('transform-change', selectedObject.value, 'scale')
  }
}

const onTransformChange = () => {
  updateTransformValues()
  if (selectedObject.value) {
    emit('transform-change', selectedObject.value, transformMode.value)
  }
}

const onDraggingChanged = (event: any) => {
  // 拖拽时禁用相机控制
  // 移除日志以减少控制台输出
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement) return

  switch (event.key.toLowerCase()) {
    case 'w':
      setTransformMode('translate')
      break
    case 'e':
      setTransformMode('rotate')
      break
    case 'r':
      setTransformMode('scale')
      break
    case 'x':
      toggleTransformSpace()
      break
    case 'g':
      toggleSnap()
      break
  }
}

// 监听选中物体变化
watch(() => props.selectedObject, (newObject, oldObject) => {
  if (transformControls) {
    if (newObject) {
      console.log('✅ Attaching transform controls to object:', newObject.name)
      transformControls.attach(newObject)
      transformControls.visible = true
      updateTransformValues()
    } else {
      transformControls.detach()
      transformControls.visible = false
    }
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  initializeTransformControls()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (transformControls && props.scene) {
    props.scene.remove(transformControls)
    transformControls.dispose()
  }
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.qaq-transform-controls {
  background: var(--qaq-editor-panel, #383838);
  border-radius: 6px;
  overflow: hidden;
}

.qaq-transform-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-transform-modes {
  display: flex;
  gap: 4px;
}

.qaq-transform-options {
  display: flex;
  gap: 4px;
}

.qaq-transform-btn.variant-solid {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-transform-values {
  padding: 12px;
}

.qaq-transform-section {
  margin-bottom: 16px;
}

.qaq-transform-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--qaq-primary, #00DC82);
  text-transform: uppercase;
  font-weight: 600;
}

.qaq-vector3-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.qaq-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qaq-input-group label {
  font-size: 10px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  text-align: center;
  font-weight: 600;
}

.qaq-number-input {
  width: 100%;
  padding: 4px 6px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 3px;
  color: var(--qaq-editor-text, #ffffff);
  font-size: 11px;
  text-align: center;
  font-family: monospace;
}

.qaq-number-input:focus {
  outline: none;
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-uniform-scale-btn {
  margin-left: 8px;
  flex-shrink: 0;
}

.qaq-no-selection {
  padding: 24px;
  text-align: center;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-no-selection-icon {
  font-size: 32px;
  color: var(--qaq-primary, #00DC82);
  margin-bottom: 12px;
}

.qaq-no-selection p {
  margin: 4px 0;
  font-size: 14px;
}

.qaq-hint {
  font-size: 12px !important;
  opacity: 0.7;
}
</style>
