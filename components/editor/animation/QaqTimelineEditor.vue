<!--
  QAQ 游戏引擎 时间轴编辑器
  提供关键帧编辑和时间轴操作功能
  类似于 Godot 的 Animation 编辑器时间轴
-->

<template>
  <div class="timeline-editor">
    <!-- 时间轴头部 -->
    <div class="timeline-header">
      <div class="timeline-controls">
        <UButton 
          icon="i-heroicons-play" 
          size="sm" 
          :color="isPlaying ? 'red' : 'primary'"
          @click="togglePlayback"
        >
          {{ isPlaying ? '暂停' : '播放' }}
        </UButton>
        <UButton 
          icon="i-heroicons-stop" 
          size="sm" 
          variant="outline"
          @click="stopPlayback"
        >
          停止
        </UButton>
        <UDivider orientation="vertical" class="mx-2" />
        <span class="text-sm text-gray-600">时长: {{ duration.toFixed(2) }}s</span>
        <span class="text-sm text-gray-600">帧率: {{ frameRate }}fps</span>
      </div>
      
      <div class="timeline-zoom">
        <URange 
          v-model="zoomLevel" 
          :min="0.1" 
          :max="5" 
          :step="0.1"
          class="w-24"
        />
        <span class="text-xs text-gray-500 ml-2">{{ zoomLevel.toFixed(1) }}x</span>
      </div>
    </div>

    <!-- 时间轴主体 -->
    <div class="timeline-body" ref="timelineBody">
      <!-- 时间刻度 -->
      <div class="timeline-ruler" ref="timelineRuler">
        <canvas 
          ref="rulerCanvas"
          class="timeline-ruler-canvas"
          @click="onRulerClick"
        />
        <!-- 播放头 -->
        <div 
          class="playhead"
          :style="{ left: playheadPosition + 'px' }"
          @mousedown="startDragPlayhead"
        />
      </div>

      <!-- 轨道列表 -->
      <div class="timeline-tracks" ref="timelineTracks">
        <div 
          v-for="track in tracks" 
          :key="track.id"
          class="timeline-track"
          :class="{ 'selected': selectedTrack === track.id }"
          @click="selectTrack(track.id)"
        >
          <!-- 轨道标签 -->
          <div class="track-label">
            <UIcon :name="getTrackIcon(track.type)" class="w-4 h-4" />
            <span class="text-sm">{{ track.boneName }}.{{ track.property }}</span>
            <UButton 
              icon="i-heroicons-eye" 
              size="xs" 
              variant="ghost"
              :color="track.visible ? 'primary' : 'gray'"
              @click.stop="toggleTrackVisibility(track.id)"
            />
          </div>

          <!-- 关键帧区域 -->
          <div class="track-keyframes" ref="trackKeyframes">
            <canvas 
              :ref="`trackCanvas_${track.id}`"
              class="track-canvas"
              @click="onTrackClick($event, track)"
              @contextmenu="onTrackRightClick($event, track)"
            />
            
            <!-- 关键帧标记 -->
            <div 
              v-for="keyframe in track.keyframes"
              :key="`${track.id}_${keyframe.time}`"
              class="keyframe-marker"
              :class="{ 
                'selected': isKeyframeSelected(track.id, keyframe.time),
                'interpolation-step': keyframe.interpolation === 'step',
                'interpolation-cubic': keyframe.interpolation === 'cubic'
              }"
              :style="{ left: timeToPixel(keyframe.time) + 'px' }"
              @click.stop="selectKeyframe(track.id, keyframe.time)"
              @mousedown="startDragKeyframe($event, track.id, keyframe.time)"
              @contextmenu.prevent="showKeyframeContextMenu($event, track.id, keyframe.time)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <UContextMenu v-model="contextMenuOpen" :virtual-element="contextMenuElement">
      <template v-if="contextMenuType === 'keyframe'">
        <UContextMenuItem 
          label="删除关键帧" 
          icon="i-heroicons-trash"
          @click="deleteSelectedKeyframe"
        />
        <UContextMenuItem 
          label="复制关键帧" 
          icon="i-heroicons-document-duplicate"
          @click="copySelectedKeyframe"
        />
        <UDivider />
        <UContextMenuItem 
          label="线性插值" 
          :checked="selectedKeyframeInterpolation === 'linear'"
          @click="setKeyframeInterpolation('linear')"
        />
        <UContextMenuItem 
          label="阶梯插值" 
          :checked="selectedKeyframeInterpolation === 'step'"
          @click="setKeyframeInterpolation('step')"
        />
        <UContextMenuItem 
          label="贝塞尔插值" 
          :checked="selectedKeyframeInterpolation === 'cubic'"
          @click="setKeyframeInterpolation('cubic')"
        />
      </template>
      
      <template v-else-if="contextMenuType === 'track'">
        <UContextMenuItem 
          label="添加关键帧" 
          icon="i-heroicons-plus"
          @click="addKeyframeAtCursor"
        />
        <UContextMenuItem 
          label="删除轨道" 
          icon="i-heroicons-trash"
          @click="deleteSelectedTrack"
        />
      </template>
    </UContextMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

// ============================================================================
// 接口定义
// ============================================================================

interface TimelineTrack {
  id: string
  boneName: string
  property: 'position' | 'rotation' | 'scale'
  type: 'vector3' | 'quaternion' | 'number'
  keyframes: TimelineKeyframe[]
  visible: boolean
}

interface TimelineKeyframe {
  time: number
  value: any
  interpolation: 'linear' | 'step' | 'cubic'
  selected: boolean
}

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  animationClip?: any
  duration?: number
  frameRate?: number
  currentTime?: number
  isPlaying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5.0,
  frameRate: 30,
  currentTime: 0,
  isPlaying: false
})

const emit = defineEmits<{
  'play': []
  'pause': []
  'stop': []
  'seek': [time: number]
  'keyframe-added': [trackId: string, time: number, value: any]
  'keyframe-removed': [trackId: string, time: number]
  'keyframe-moved': [trackId: string, oldTime: number, newTime: number]
  'keyframe-changed': [trackId: string, time: number, value: any]
}>()

// ============================================================================
// 响应式数据
// ============================================================================

const timelineBody = ref<HTMLElement>()
const timelineRuler = ref<HTMLElement>()
const rulerCanvas = ref<HTMLCanvasElement>()
const timelineTracks = ref<HTMLElement>()

const zoomLevel = ref(1.0)
const selectedTrack = ref<string | null>(null)
const selectedKeyframes = ref<Set<string>>(new Set())
const contextMenuOpen = ref(false)
const contextMenuElement = ref<{ getBoundingClientRect: () => DOMRect } | null>(null)
const contextMenuType = ref<'keyframe' | 'track' | null>(null)

// 拖拽状态
const isDraggingPlayhead = ref(false)
const isDraggingKeyframe = ref(false)
const dragStartX = ref(0)
const dragStartTime = ref(0)

// 模拟轨道数据
const tracks = ref<TimelineTrack[]>([
  {
    id: 'bone1_position',
    boneName: 'Bone1',
    property: 'position',
    type: 'vector3',
    visible: true,
    keyframes: [
      { time: 0, value: [0, 0, 0], interpolation: 'linear', selected: false },
      { time: 1, value: [1, 0, 0], interpolation: 'linear', selected: false },
      { time: 2, value: [0, 1, 0], interpolation: 'cubic', selected: false }
    ]
  },
  {
    id: 'bone1_rotation',
    boneName: 'Bone1',
    property: 'rotation',
    type: 'quaternion',
    visible: true,
    keyframes: [
      { time: 0, value: [0, 0, 0, 1], interpolation: 'linear', selected: false },
      { time: 1.5, value: [0, 0.707, 0, 0.707], interpolation: 'linear', selected: false }
    ]
  }
])

// ============================================================================
// 计算属性
// ============================================================================

const playheadPosition = computed(() => {
  return timeToPixel(props.currentTime)
})

const selectedKeyframeInterpolation = computed(() => {
  // 获取选中关键帧的插值类型
  for (const track of tracks.value) {
    for (const keyframe of track.keyframes) {
      if (keyframe.selected) {
        return keyframe.interpolation
      }
    }
  }
  return 'linear'
})

// ============================================================================
// 方法
// ============================================================================

const timeToPixel = (time: number): number => {
  const pixelsPerSecond = 100 * zoomLevel.value
  return time * pixelsPerSecond
}

const pixelToTime = (pixel: number): number => {
  const pixelsPerSecond = 100 * zoomLevel.value
  return pixel / pixelsPerSecond
}

const getTrackIcon = (type: string): string => {
  switch (type) {
    case 'vector3': return 'i-heroicons-arrows-pointing-out'
    case 'quaternion': return 'i-heroicons-arrow-path'
    case 'number': return 'i-heroicons-variable'
    default: return 'i-heroicons-cube'
  }
}

const togglePlayback = () => {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

const stopPlayback = () => {
  emit('stop')
}

const selectTrack = (trackId: string) => {
  selectedTrack.value = trackId
}

const toggleTrackVisibility = (trackId: string) => {
  const track = tracks.value.find(t => t.id === trackId)
  if (track) {
    track.visible = !track.visible
  }
}

const isKeyframeSelected = (trackId: string, time: number): boolean => {
  return selectedKeyframes.value.has(`${trackId}_${time}`)
}

const selectKeyframe = (trackId: string, time: number) => {
  const key = `${trackId}_${time}`
  selectedKeyframes.value.clear()
  selectedKeyframes.value.add(key)
  
  // 更新关键帧选中状态
  tracks.value.forEach(track => {
    track.keyframes.forEach(keyframe => {
      keyframe.selected = track.id === trackId && keyframe.time === time
    })
  })
}

const onRulerClick = (event: MouseEvent) => {
  const rect = rulerCanvas.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const time = pixelToTime(x)
  emit('seek', Math.max(0, Math.min(time, props.duration)))
}

const onTrackClick = (event: MouseEvent, track: TimelineTrack) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const time = pixelToTime(x)
  
  // 添加关键帧
  const newKeyframe: TimelineKeyframe = {
    time: Math.max(0, Math.min(time, props.duration)),
    value: getDefaultValue(track.type),
    interpolation: 'linear',
    selected: false
  }
  
  track.keyframes.push(newKeyframe)
  track.keyframes.sort((a, b) => a.time - b.time)
  
  emit('keyframe-added', track.id, newKeyframe.time, newKeyframe.value)
}

const getDefaultValue = (type: string): any => {
  switch (type) {
    case 'vector3': return [0, 0, 0]
    case 'quaternion': return [0, 0, 0, 1]
    case 'number': return 0
    default: return null
  }
}

const startDragPlayhead = (event: MouseEvent) => {
  isDraggingPlayhead.value = true
  dragStartX.value = event.clientX
  dragStartTime.value = props.currentTime
  
  document.addEventListener('mousemove', onDragPlayhead)
  document.addEventListener('mouseup', stopDragPlayhead)
}

const onDragPlayhead = (event: MouseEvent) => {
  if (!isDraggingPlayhead.value) return
  
  const deltaX = event.clientX - dragStartX.value
  const deltaTime = pixelToTime(deltaX)
  const newTime = Math.max(0, Math.min(dragStartTime.value + deltaTime, props.duration))
  
  emit('seek', newTime)
}

const stopDragPlayhead = () => {
  isDraggingPlayhead.value = false
  document.removeEventListener('mousemove', onDragPlayhead)
  document.removeEventListener('mouseup', stopDragPlayhead)
}

// 初始化画布
const initializeCanvas = () => {
  nextTick(() => {
    drawRuler()
    drawTracks()
  })
}

const drawRuler = () => {
  const canvas = rulerCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')!
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  
  ctx.clearRect(0, 0, rect.width, rect.height)
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, rect.width, rect.height)
  
  // 绘制时间刻度
  const pixelsPerSecond = 100 * zoomLevel.value
  const secondsVisible = rect.width / pixelsPerSecond
  const majorTickInterval = Math.pow(10, Math.floor(Math.log10(secondsVisible / 10)))
  
  ctx.strokeStyle = '#d1d5db'
  ctx.fillStyle = '#374151'
  ctx.font = '12px sans-serif'
  
  for (let time = 0; time <= props.duration; time += majorTickInterval) {
    const x = timeToPixel(time)
    if (x > rect.width) break
    
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, rect.height)
    ctx.stroke()
    
    ctx.fillText(time.toFixed(1) + 's', x + 4, rect.height - 4)
  }
}

const drawTracks = () => {
  // 绘制轨道背景和网格
  tracks.value.forEach(track => {
    const canvas = document.querySelector(`[ref="trackCanvas_${track.id}"]`) as HTMLCanvasElement
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // 绘制网格
    ctx.strokeStyle = '#e5e7eb'
    const pixelsPerSecond = 100 * zoomLevel.value
    for (let time = 0; time <= props.duration; time += 0.5) {
      const x = timeToPixel(time)
      if (x > rect.width) break
      
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
  })
}

// 监听缩放变化
watch(zoomLevel, () => {
  initializeCanvas()
})

// 组件挂载
onMounted(() => {
  initializeCanvas()
  window.addEventListener('resize', initializeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', initializeCanvas)
})
</script>

<style scoped>
.timeline-editor {
  @apply flex flex-col h-full bg-white border border-gray-200 rounded-lg;
}

.timeline-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50;
}

.timeline-controls {
  @apply flex items-center gap-2;
}

.timeline-zoom {
  @apply flex items-center;
}

.timeline-body {
  @apply flex-1 overflow-hidden;
}

.timeline-ruler {
  @apply relative h-8 border-b border-gray-200 bg-gray-50;
}

.timeline-ruler-canvas {
  @apply w-full h-full cursor-pointer;
}

.playhead {
  @apply absolute top-0 w-0.5 h-full bg-red-500 cursor-ew-resize z-10;
}

.timeline-tracks {
  @apply flex-1 overflow-y-auto;
}

.timeline-track {
  @apply flex border-b border-gray-100 hover:bg-gray-50 cursor-pointer;
}

.timeline-track.selected {
  @apply bg-blue-50 border-blue-200;
}

.track-label {
  @apply flex items-center gap-2 w-48 p-2 border-r border-gray-200 bg-white;
}

.track-keyframes {
  @apply relative flex-1 h-12;
}

.track-canvas {
  @apply w-full h-full;
}

.keyframe-marker {
  @apply absolute top-1/2 w-3 h-3 -mt-1.5 -ml-1.5 bg-blue-500 rounded-full cursor-pointer border-2 border-white shadow-sm;
}

.keyframe-marker.selected {
  @apply bg-orange-500 border-orange-200;
}

.keyframe-marker.interpolation-step {
  @apply bg-green-500;
}

.keyframe-marker.interpolation-cubic {
  @apply bg-purple-500;
}

.keyframe-marker:hover {
  @apply scale-110;
}
</style>
