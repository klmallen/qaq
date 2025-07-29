<template>
  <div class="sprite-sheet-editor">
    <!-- 头部工具栏 -->
    <div class="editor-header">
      <h3 class="editor-title">精灵表动画编辑器</h3>
      <div class="toolbar">
        <button @click="importSpriteSheet" class="btn btn-primary">
          📤 导入精灵表
        </button>
        <button @click="exportAnimation" class="btn btn-secondary" :disabled="!spriteSheetLoaded">
          💾 导出动画
        </button>
        <button @click="previewAnimation" class="btn btn-success" :disabled="!currentAnimation">
          ▶️ 预览动画
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="editor-content">
      <!-- 左侧面板 - 精灵表配置 -->
      <div class="left-panel">
        <div class="panel-section">
          <h4>精灵表配置</h4>

          <!-- 文件上传区域 -->
          <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              style="display: none"
            />
            <div v-if="!spriteSheetImage" class="upload-placeholder" @click="$refs.fileInput.click()">
              <div class="upload-icon">🖼️</div>
              <p>点击或拖拽图片到此处</p>
            </div>
            <div v-else class="uploaded-image">
              <img :src="spriteSheetImage" alt="精灵表" />
              <button @click="clearSpriteSheet" class="btn-clear">×</button>
            </div>
          </div>

          <!-- 帧配置 -->
          <div v-if="spriteSheetLoaded" class="frame-config">
            <div class="config-row">
              <label>帧宽度:</label>
              <input
                v-model.number="frameConfig.width"
                type="number"
                min="1"
                @input="updateFrameGrid"
              />
            </div>
            <div class="config-row">
              <label>帧高度:</label>
              <input
                v-model.number="frameConfig.height"
                type="number"
                min="1"
                @input="updateFrameGrid"
              />
            </div>
            <div class="config-row">
              <label>每行帧数:</label>
              <input
                v-model.number="frameConfig.framesPerRow"
                type="number"
                min="1"
                @input="updateFrameGrid"
              />
            </div>
            <div class="config-row">
              <label>总行数:</label>
              <input
                v-model.number="frameConfig.totalRows"
                type="number"
                min="1"
                @input="updateFrameGrid"
              />
            </div>
          </div>
        </div>

        <!-- 动画配置 -->
        <div v-if="spriteSheetLoaded" class="panel-section">
          <h4>动画配置</h4>

          <div class="animation-list">
            <div
              v-for="(animation, index) in animations"
              :key="animation.id"
              class="animation-item"
              :class="{ active: currentAnimation === animation }"
              @click="selectAnimation(animation)"
            >
              <span class="animation-name">{{ animation.name }}</span>
              <button @click.stop="deleteAnimation(index)" class="btn-delete">×</button>
            </div>
          </div>

          <button @click="addNewAnimation" class="btn btn-primary btn-full">
            ➕ 新建动画
          </button>

          <!-- 当前动画配置 -->
          <div v-if="currentAnimation" class="current-animation-config">
            <div class="config-row">
              <label>动画名称:</label>
              <input v-model="currentAnimation.name" type="text" />
            </div>
            <div class="config-row">
              <label>起始帧:</label>
              <input
                v-model.number="currentAnimation.startFrame"
                type="number"
                min="0"
                :max="totalFrames - 1"
                @input="updateAnimationFrames"
              />
            </div>
            <div class="config-row">
              <label>帧数量:</label>
              <input
                v-model.number="currentAnimation.frameCount"
                type="number"
                min="1"
                :max="totalFrames - currentAnimation.startFrame"
                @input="updateAnimationFrames"
              />
            </div>
            <div class="config-row">
              <label>帧持续时间:</label>
              <input
                v-model.number="currentAnimation.frameDuration"
                type="number"
                min="0.01"
                step="0.01"
              />
            </div>
            <div class="config-row">
              <label>播放模式:</label>
              <select v-model="currentAnimation.playMode">
                <option value="once">播放一次</option>
                <option value="loop">循环播放</option>
                <option value="pingpong">来回播放</option>
              </select>
            </div>
            <div class="config-row">
              <label>播放速度:</label>
              <input
                v-model.number="currentAnimation.speed"
                type="number"
                min="0.1"
                max="5"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 中间面板 - 精灵表预览 -->
      <div class="center-panel">
        <div class="sprite-sheet-preview">
          <h4>精灵表预览</h4>
          <div class="preview-container" ref="previewContainer">
            <canvas
              ref="previewCanvas"
              @mousedown="startFrameSelection"
              @mousemove="updateFrameSelection"
              @mouseup="endFrameSelection"
              @mouseleave="endFrameSelection"
            ></canvas>
          </div>

          <!-- 预览控制 -->
          <div class="preview-controls">
            <button @click="toggleFrameGrid" class="btn btn-secondary">
              {{ showFrameGrid ? '隐藏网格' : '显示网格' }}
            </button>
            <button @click="resetZoom" class="btn btn-secondary">重置缩放</button>
            <div class="zoom-controls">
              <label>缩放: {{ Math.round(zoomLevel * 100) }}%</label>
              <input
                v-model.number="zoomLevel"
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                @input="updateZoom"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 - 动画预览 -->
      <div class="right-panel">
        <div class="animation-preview">
          <h4>动画预览</h4>

          <div class="preview-viewport" ref="animationPreview">
            <canvas ref="animationCanvas"></canvas>
          </div>

          <!-- 播放控制 -->
          <div class="playback-controls">
            <button @click="playAnimation" class="btn btn-success" :disabled="!currentAnimation">
              ▶️
            </button>
            <button @click="pauseAnimation" class="btn btn-warning">
              ⏸️
            </button>
            <button @click="stopAnimation" class="btn btn-danger">
              ⏹️
            </button>
          </div>

          <!-- 时间轴 -->
          <div v-if="currentAnimation" class="timeline">
            <div class="timeline-header">
              <span>帧: {{ currentPreviewFrame + 1 }} / {{ currentAnimation.frameCount }}</span>
              <span>时间: {{ currentPreviewTime.toFixed(2) }}s</span>
            </div>
            <div class="timeline-track">
              <div
                v-for="(frame, index) in currentAnimation.frameCount"
                :key="index"
                class="timeline-frame"
                :class="{ active: index === currentPreviewFrame }"
                @click="seekToFrame(index)"
              >
                {{ index + 1 }}
              </div>
            </div>
          </div>
        </div>

        <!-- 导出设置 -->
        <div class="export-settings">
          <h4>导出设置</h4>
          <div class="config-row">
            <label>导出格式:</label>
            <select v-model="exportFormat">
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
          <div class="config-row">
            <label>包含纹理:</label>
            <input v-model="includeTexture" type="checkbox" />
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span v-if="spriteSheetLoaded">
        精灵表: {{ spriteSheetSize.width }}×{{ spriteSheetSize.height }} |
        总帧数: {{ totalFrames }} |
        动画数量: {{ animations.length }}
      </span>
      <span v-else>请导入精灵表图片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

// ============================================================================
// 类型定义
// ============================================================================

interface FrameConfig {
  width: number
  height: number
  framesPerRow: number
  totalRows: number
  marginX: number
  marginY: number
  spacingX: number
  spacingY: number
}

interface Animation {
  id: string
  name: string
  startFrame: number
  frameCount: number
  frameDuration: number
  playMode: 'once' | 'loop' | 'pingpong'
  speed: number
}

// ============================================================================
// 响应式数据
// ============================================================================

const spriteSheetImage = ref<string>('')
const spriteSheetLoaded = ref(false)
const spriteSheetSize = reactive({ width: 0, height: 0 })

const frameConfig = reactive<FrameConfig>({
  width: 32,
  height: 32,
  framesPerRow: 8,
  totalRows: 8,
  marginX: 0,
  marginY: 0,
  spacingX: 0,
  spacingY: 0
})

const animations = ref<Animation[]>([])
const currentAnimation = ref<Animation | null>(null)

const showFrameGrid = ref(true)
const zoomLevel = ref(1)

const isPlaying = ref(false)
const currentPreviewFrame = ref(0)
const currentPreviewTime = ref(0)

const exportFormat = ref('json')
const includeTexture = ref(false)

// ============================================================================
// 计算属性
// ============================================================================

const totalFrames = computed(() => {
  return frameConfig.framesPerRow * frameConfig.totalRows
})

// ============================================================================
// 引用
// ============================================================================

const fileInput = ref<HTMLInputElement>()
const previewCanvas = ref<HTMLCanvasElement>()
const animationCanvas = ref<HTMLCanvasElement>()
const previewContainer = ref<HTMLDivElement>()
const animationPreview = ref<HTMLDivElement>()

// ============================================================================
// 方法
// ============================================================================

const importSpriteSheet = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    loadSpriteSheetFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    loadSpriteSheetFile(file)
  }
}

const loadSpriteSheetFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    spriteSheetImage.value = result

    const img = new Image()
    img.onload = () => {
      spriteSheetSize.width = img.width
      spriteSheetSize.height = img.height
      spriteSheetLoaded.value = true

      autoDetectFrameSize()

      nextTick(() => {
        updateSpriteSheetPreview()
        updateFrameGrid()
      })
    }
    img.src = result
  }
  reader.readAsDataURL(file)
}

const clearSpriteSheet = () => {
  spriteSheetImage.value = ''
  spriteSheetLoaded.value = false
  animations.value = []
  currentAnimation.value = null
}

const autoDetectFrameSize = () => {
  const width = spriteSheetSize.width
  const height = spriteSheetSize.height

  const commonSizes = [16, 32, 64, 128]

  for (const size of commonSizes) {
    if (width % size === 0 && height % size === 0) {
      frameConfig.width = size
      frameConfig.height = size
      frameConfig.framesPerRow = width / size
      frameConfig.totalRows = height / size
      break
    }
  }
}

const updateFrameGrid = () => {
  updateSpriteSheetPreview()
}

const updateSpriteSheetPreview = () => {
  if (!previewCanvas.value || !spriteSheetImage.value) return

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')!

  canvas.width = spriteSheetSize.width * zoomLevel.value
  canvas.height = spriteSheetSize.height * zoomLevel.value

  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (showFrameGrid.value) {
      drawFrameGrid(ctx)
    }
  }
  img.src = spriteSheetImage.value
}

const drawFrameGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 1

  for (let row = 0; row < frameConfig.totalRows; row++) {
    for (let col = 0; col < frameConfig.framesPerRow; col++) {
      const x = col * frameConfig.width * zoomLevel.value
      const y = row * frameConfig.height * zoomLevel.value
      const width = frameConfig.width * zoomLevel.value
      const height = frameConfig.height * zoomLevel.value

      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = '#00ff00'
      ctx.font = '12px Arial'
      ctx.fillText((row * frameConfig.framesPerRow + col).toString(), x + 2, y + 14)
    }
  }
}

const toggleFrameGrid = () => {
  showFrameGrid.value = !showFrameGrid.value
  updateSpriteSheetPreview()
}

const resetZoom = () => {
  zoomLevel.value = 1
  updateZoom()
}

const updateZoom = () => {
  updateFrameGrid()
}

const startFrameSelection = (event: MouseEvent) => {
  // 实现帧选择逻辑
}

const updateFrameSelection = (event: MouseEvent) => {
  // 实现帧选择更新逻辑
}

const endFrameSelection = () => {
  // 实现帧选择结束逻辑
}

const addNewAnimation = () => {
  const newAnimation: Animation = {
    id: Date.now().toString(),
    name: `动画${animations.value.length + 1}`,
    startFrame: 0,
    frameCount: Math.min(8, totalFrames.value),
    frameDuration: 0.1,
    playMode: 'loop',
    speed: 1.0
  }

  animations.value.push(newAnimation)
  currentAnimation.value = newAnimation
}

const selectAnimation = (animation: Animation) => {
  currentAnimation.value = animation
}

const deleteAnimation = (index: number) => {
  const animation = animations.value[index]
  if (currentAnimation.value === animation) {
    currentAnimation.value = null
  }
  animations.value.splice(index, 1)
}

const updateAnimationFrames = () => {
  if (!currentAnimation.value) return

  const maxFrameCount = totalFrames.value - currentAnimation.value.startFrame
  if (currentAnimation.value.frameCount > maxFrameCount) {
    currentAnimation.value.frameCount = maxFrameCount
  }
}

const playAnimation = () => {
  if (!currentAnimation.value) return
  isPlaying.value = true
}

const pauseAnimation = () => {
  isPlaying.value = false
}

const stopAnimation = () => {
  isPlaying.value = false
  currentPreviewFrame.value = 0
  currentPreviewTime.value = 0
}

const seekToFrame = (frameIndex: number) => {
  currentPreviewFrame.value = frameIndex
}

const previewAnimation = () => {
  // 实现动画预览逻辑
}

const exportAnimation = () => {
  if (!spriteSheetLoaded.value || animations.value.length === 0) return

  const exportData = {
    spriteSheet: {
      width: spriteSheetSize.width,
      height: spriteSheetSize.height,
      frameConfig: { ...frameConfig }
    },
    animations: animations.value.map(anim => ({ ...anim }))
  }

  let content = ''
  let filename = ''

  switch (exportFormat.value) {
    case 'json':
      content = JSON.stringify(exportData, null, 2)
      filename = 'animations.json'
      break
    case 'xml':
      content = '<?xml version="1.0"?>\n<!-- XML export not implemented -->'
      filename = 'animations.xml'
      break
    case 'yaml':
      content = '# YAML export not implemented'
      filename = 'animations.yaml'
      break
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  updateSpriteSheetPreview()
})
</script>

<style scoped>
.sprite-sheet-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #2b2b2b;
  color: #ffffff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1e1e1e;
  border-bottom: 1px solid #404040;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-primary {
  background: #007acc;
  color: white;
}

.btn-secondary {
  background: #404040;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel,
.right-panel {
  width: 300px;
  background: #1e1e1e;
  border-right: 1px solid #404040;
  overflow-y: auto;
}

.right-panel {
  border-right: none;
  border-left: 1px solid #404040;
}

.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2b2b2b;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #404040;
}

.panel-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #ffffff;
}

.upload-area {
  position: relative;
  border: 2px dashed #404040;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}

.upload-placeholder {
  cursor: pointer;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.uploaded-image {
  position: relative;
}

.uploaded-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.btn-clear {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.config-row label {
  font-size: 14px;
  color: #cccccc;
}

.config-row input,
.config-row select {
  width: 80px;
  padding: 4px 8px;
  background: #404040;
  border: 1px solid #666666;
  border-radius: 4px;
  color: white;
}

.animation-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.animation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #404040;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
}

.animation-item.active {
  background: #007acc;
}

.animation-item:hover {
  background: #505050;
}

.animation-item.active:hover {
  background: #0066aa;
}

.btn-delete {
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.btn-full {
  width: 100%;
}

.sprite-sheet-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.preview-container {
  position: relative;
  flex: 1;
  overflow: auto;
  border: 1px solid #404040;
  border-radius: 4px;
  background: #1a1a1a;
}

.preview-container canvas {
  display: block;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 4px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls input[type="range"] {
  width: 100px;
}

.animation-preview {
  padding: 16px;
}

.preview-viewport {
  width: 100%;
  height: 200px;
  border: 1px solid #404040;
  border-radius: 4px;
  background: #1a1a1a;
  margin-bottom: 12px;
}

.preview-viewport canvas {
  width: 100%;
  height: 100%;
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.timeline {
  background: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #cccccc;
}

.timeline-track {
  display: flex;
  gap: 2px;
  overflow-x: auto;
}

.timeline-frame {
  min-width: 30px;
  height: 20px;
  background: #404040;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
}

.timeline-frame.active {
  background: #007acc;
}

.timeline-frame:hover {
  background: #505050;
}

.timeline-frame.active:hover {
  background: #0066aa;
}

.export-settings {
  padding: 16px;
}

.status-bar {
  padding: 8px 16px;
  background: #1e1e1e;
  border-top: 1px solid #404040;
  font-size: 12px;
  color: #cccccc;
}
</style>
