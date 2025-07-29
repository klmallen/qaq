<template>
  <div
    class="qaq-draggable-panel"
    :class="{
      'qaq-panel-fullscreen': isFullscreen,
      'qaq-panel-dragging': isDragging,
      'qaq-panel-resizing': isResizing
    }"
    :style="panelStyle"
  >
    <!-- 面板标题栏 -->
    <div
      class="qaq-panel-header"
      @mousedown="startDrag"
      @dblclick="toggleFullscreen"
    >
      <div class="qaq-panel-title">
        <UIcon :name="icon" class="qaq-panel-icon" />
        <span>{{ title }}</span>
      </div>

      <div class="qaq-panel-controls">
        <UButton
          :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
          variant="ghost"
          size="xs"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
        />
        <UButton
          v-if="closable"
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="xs"
          @click="$emit('close')"
          title="Close Panel"
        />
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="qaq-panel-content">
      <slot />
    </div>

    <!-- 调整大小手柄 -->
    <div
      v-if="resizable && !isFullscreen"
      class="qaq-resize-handles"
    >
      <!-- 右边缘调整 -->
      <div
        v-if="canResizeRight"
        class="qaq-resize-handle qaq-resize-right"
        @mousedown="startResize('right')($event)"
      ></div>

      <!-- 底边缘调整 -->
      <div
        v-if="canResizeBottom"
        class="qaq-resize-handle qaq-resize-bottom"
        @mousedown="startResize('bottom')($event)"
      ></div>

      <!-- 右下角调整 -->
      <div
        v-if="canResizeRight && canResizeBottom"
        class="qaq-resize-handle qaq-resize-corner"
        @mousedown="startResize('corner')($event)"
      ></div>
    </div>

    <!-- 拖拽预览指示器 -->
    <div
      v-if="showDropZones && isDragging"
      class="qaq-drop-zones"
    >
      <div class="qaq-drop-zone qaq-drop-top" @drop="handleDrop('top')" @dragover.prevent></div>
      <div class="qaq-drop-zone qaq-drop-bottom" @drop="handleDrop('bottom')" @dragover.prevent></div>
      <div class="qaq-drop-zone qaq-drop-left" @drop="handleDrop('left')" @dragover.prevent></div>
      <div class="qaq-drop-zone qaq-drop-right" @drop="handleDrop('right')" @dragover.prevent></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  title: string
  icon: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  x?: number
  y?: number
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  canResizeRight?: boolean
  canResizeBottom?: boolean
  showDropZones?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'resize', size: { width: number; height: number }): void
  (e: 'move', position: { x: number; y: number }): void
  (e: 'fullscreen', isFullscreen: boolean): void
  (e: 'drop', data: { zone: string; panelId: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 400,
  minWidth: 200,
  minHeight: 150,
  x: 0,
  y: 0,
  resizable: true,
  draggable: true,
  closable: true,
  canResizeRight: true,
  canResizeBottom: true,
  showDropZones: false
})

const emit = defineEmits<Emits>()

// 响应式状态
const isFullscreen = ref(false)
const isDragging = ref(false)
const isResizing = ref(false)
const currentWidth = ref(props.width)
const currentHeight = ref(props.height)
const currentX = ref(props.x)
const currentY = ref(props.y)

// 拖拽和调整大小状态
const dragStart = ref({ x: 0, y: 0, panelX: 0, panelY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const resizeDirection = ref<'right' | 'bottom' | 'corner' | null>(null)

// 计算面板样式
const panelStyle = computed(() => {
  if (isFullscreen.value) {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 1000
    }
  }

  return {
    width: `${currentWidth.value}px`,
    height: `${currentHeight.value}px`,
    transform: `translate(${currentX.value}px, ${currentY.value}px)`
  }
})

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (!props.draggable || isFullscreen.value) return

  event.preventDefault()
  isDragging.value = true

  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    panelX: currentX.value,
    panelY: currentY.value
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 处理拖拽
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y

  currentX.value = dragStart.value.panelX + deltaX
  currentY.value = dragStart.value.panelY + deltaY

  emit('move', { x: currentX.value, y: currentY.value })
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 开始调整大小
const startResize = (direction: 'right' | 'bottom' | 'corner') => {
  return (event: MouseEvent) => {
    if (!props.resizable) return

    event.preventDefault()
    isResizing.value = true
    resizeDirection.value = direction

    resizeStart.value = {
      x: event.clientX,
      y: event.clientY,
      width: currentWidth.value,
      height: currentHeight.value
    }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }
}

// 处理调整大小
const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || !resizeDirection.value) return

  const deltaX = event.clientX - resizeStart.value.x
  const deltaY = event.clientY - resizeStart.value.y

  if (resizeDirection.value === 'right' || resizeDirection.value === 'corner') {
    const newWidth = Math.max(props.minWidth, Math.min(props.maxWidth || Infinity, resizeStart.value.width + deltaX))
    currentWidth.value = newWidth
  }

  if (resizeDirection.value === 'bottom' || resizeDirection.value === 'corner') {
    const newHeight = Math.max(props.minHeight, Math.min(props.maxHeight || Infinity, resizeStart.value.height + deltaY))
    currentHeight.value = newHeight
  }

  emit('resize', { width: currentWidth.value, height: currentHeight.value })
}

// 停止调整大小
const stopResize = () => {
  isResizing.value = false
  resizeDirection.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreen', isFullscreen.value)
}

// 处理拖放
const handleDrop = (zone: string) => {
  emit('drop', { zone, panelId: props.title })
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.qaq-draggable-panel {
  position: absolute;
  background: var(--qaq-editor-panel);
  border: 1px solid var(--qaq-editor-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.qaq-panel-dragging {
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.3);
  z-index: 100;
}

.qaq-panel-resizing {
  user-select: none;
}

.qaq-panel-fullscreen {
  border-radius: 0;
  box-shadow: none;
}

.qaq-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--qaq-editor-bg);
  border-bottom: 1px solid var(--qaq-editor-border);
  cursor: move;
  user-select: none;
}

.qaq-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-editor-text);
}

.qaq-panel-icon {
  color: var(--qaq-primary-500);
}

.qaq-panel-controls {
  display: flex;
  gap: 4px;
}

.qaq-panel-content {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.qaq-resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.qaq-resize-handle {
  position: absolute;
  pointer-events: all;
}

.qaq-resize-right {
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
}

.qaq-resize-bottom {
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 4px;
  cursor: ns-resize;
}

.qaq-resize-corner {
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
}

.qaq-drop-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.qaq-drop-zone {
  position: absolute;
  pointer-events: all;
  background: rgba(0, 220, 130, 0.2);
  border: 2px dashed var(--qaq-primary-500);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.qaq-drop-zone:hover {
  opacity: 1;
}

.qaq-drop-top {
  top: 0;
  left: 0;
  right: 0;
  height: 25%;
}

.qaq-drop-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
}

.qaq-drop-left {
  top: 25%;
  left: 0;
  bottom: 25%;
  width: 25%;
}

.qaq-drop-right {
  top: 25%;
  right: 0;
  bottom: 25%;
  width: 25%;
}
</style>
