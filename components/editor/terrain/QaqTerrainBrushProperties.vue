<template>
  <div class="qaq-terrain-brush-properties">
    <!-- 面板标题 -->
    <div class="qaq-panel-header">
      <h3>Brush Properties</h3>
      <span class="qaq-current-tool">{{ getCurrentToolName() }}</span>
    </div>

    <!-- 笔刷基础设置 -->
    <div class="qaq-property-section">
      <h4>Brush Settings</h4>

      <div class="qaq-property-group">
        <label>Brush Size</label>
        <div class="qaq-property-row">
          <URange
            v-model="localBrushSettings.size"
            :min="1"
            :max="200"
            :step="1"
            @input="updateBrushSetting('size', $event)"
          />
          <UInput
            v-model="localBrushSettings.size"
            type="number"
            :min="1"
            :max="200"
            class="qaq-number-input"
            @input="updateBrushSetting('size', $event)"
          />
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Strength</label>
        <div class="qaq-property-row">
          <URange
            v-model="localBrushSettings.strength"
            :min="0"
            :max="1"
            :step="0.01"
            @input="updateBrushSetting('strength', $event)"
          />
          <span class="qaq-percentage">{{ (localBrushSettings.strength * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Falloff</label>
        <div class="qaq-property-row">
          <URange
            v-model="localBrushSettings.falloff"
            :min="0"
            :max="1"
            :step="0.01"
            @input="updateBrushSetting('falloff', $event)"
          />
          <span class="qaq-percentage">{{ (localBrushSettings.falloff * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- 高级笔刷设置 -->
    <div class="qaq-property-section">
      <h4>Advanced Settings</h4>

      <div class="qaq-property-group">
        <label>Spacing</label>
        <div class="qaq-property-row">
          <URange
            v-model="localBrushSettings.spacing"
            :min="0.01"
            :max="1"
            :step="0.01"
            @input="updateBrushSetting('spacing', $event)"
          />
          <span class="qaq-percentage">{{ (localBrushSettings.spacing * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Jitter</label>
        <div class="qaq-property-row">
          <URange
            v-model="localBrushSettings.jitter"
            :min="0"
            :max="1"
            :step="0.01"
            @input="updateBrushSetting('jitter', $event)"
          />
          <span class="qaq-percentage">{{ (localBrushSettings.jitter * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <div v-if="selectedBrush === 'alpha'" class="qaq-property-group">
        <label>
          <UCheckbox
            v-model="localBrushSettings.invertAlpha"
            @change="updateBrushSetting('invertAlpha', $event)"
          />
          Invert Alpha
        </label>
      </div>
    </div>

    <!-- 工具特定设置 -->
    <div v-if="selectedTool === 'sculpt'" class="qaq-property-section">
      <h4>Sculpt Settings</h4>

      <div class="qaq-property-group">
        <label>Target Height</label>
        <div class="qaq-property-row">
          <URange
            v-model="sculptSettings.targetHeight"
            :min="0"
            :max="100"
            :step="0.1"
            @input="updateSculptSetting('targetHeight', $event)"
          />
          <UInput
            v-model="sculptSettings.targetHeight"
            type="number"
            :min="0"
            :max="100"
            :step="0.1"
            class="qaq-number-input"
            @input="updateSculptSetting('targetHeight', $event)"
          />
        </div>
      </div>

      <div class="qaq-property-group">
        <label>
          <UCheckbox
            v-model="sculptSettings.useTargetHeight"
            @change="updateSculptSetting('useTargetHeight', $event)"
          />
          Use Target Height
        </label>
      </div>
    </div>

    <div v-if="selectedTool === 'noise'" class="qaq-property-section">
      <h4>Noise Settings</h4>

      <div class="qaq-property-group">
        <label>Scale</label>
        <div class="qaq-property-row">
          <URange
            v-model="noiseSettings.scale"
            :min="0.1"
            :max="10"
            :step="0.1"
            @input="updateNoiseSetting('scale', $event)"
          />
          <span class="qaq-value">{{ noiseSettings.scale.toFixed(1) }}</span>
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Octaves</label>
        <div class="qaq-property-row">
          <URange
            v-model="noiseSettings.octaves"
            :min="1"
            :max="8"
            :step="1"
            @input="updateNoiseSetting('octaves', $event)"
          />
          <span class="qaq-value">{{ noiseSettings.octaves }}</span>
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Persistence</label>
        <div class="qaq-property-row">
          <URange
            v-model="noiseSettings.persistence"
            :min="0.1"
            :max="1"
            :step="0.01"
            @input="updateNoiseSetting('persistence', $event)"
          />
          <span class="qaq-percentage">{{ (noiseSettings.persistence * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <div v-if="selectedTool === 'paint'" class="qaq-property-section">
      <h4>Paint Settings</h4>

      <div class="qaq-property-group">
        <label>Texture Layers</label>
        <div class="qaq-texture-layers">
          <div
            v-for="(layer, index) in paintSettings.textureLayers"
            :key="index"
            class="qaq-texture-layer"
            :class="{ 'qaq-layer-active': paintSettings.activeLayer === index }"
            @click="selectTextureLayer(index)"
          >
            <div class="qaq-layer-preview">
              <img :src="layer.preview" :alt="layer.name" />
            </div>
            <span class="qaq-layer-name">{{ layer.name }}</span>
          </div>
        </div>
      </div>

      <div class="qaq-property-group">
        <label>Blend Mode</label>
        <USelectMenu
          v-model="paintSettings.blendMode"
          :options="blendModeOptions"
          @change="updatePaintSetting('blendMode', $event)"
        />
      </div>
    </div>

    <!-- 笔刷预览 -->
    <div class="qaq-property-section">
      <h4>Brush Preview</h4>
      <div class="qaq-brush-preview">
        <canvas
          ref="brushPreviewCanvas"
          class="qaq-preview-canvas"
          width="120"
          height="120"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import type { TerrainTool, BrushType } from '../QaqTerrainEditor.vue'

// Props
interface Props {
  brushSettings: any
  selectedTool: TerrainTool
  selectedBrush: BrushType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:brushSettings': [settings: any]
}>()

// 响应式数据
const brushPreviewCanvas = ref<HTMLCanvasElement>()
const localBrushSettings = reactive({ ...props.brushSettings })

// 雕刻设置
const sculptSettings = reactive({
  targetHeight: 50,
  useTargetHeight: false
})

// 噪声设置
const noiseSettings = reactive({
  scale: 1.0,
  octaves: 4,
  persistence: 0.5
})

// 绘制设置
const paintSettings = reactive({
  activeLayer: 0,
  blendMode: 'normal',
  textureLayers: [
    { name: 'Grass', preview: '/textures/grass_preview.jpg' },
    { name: 'Rock', preview: '/textures/rock_preview.jpg' },
    { name: 'Sand', preview: '/textures/sand_preview.jpg' },
    { name: 'Snow', preview: '/textures/snow_preview.jpg' }
  ]
})

// 混合模式选项
const blendModeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Soft Light', value: 'soft-light' }
]

// 方法
function getCurrentToolName(): string {
  const toolNames: Record<TerrainTool, string> = {
    sculpt: 'Sculpt Tool',
    smooth: 'Smooth Tool',
    flatten: 'Flatten Tool',
    noise: 'Noise Tool',
    erosion: 'Erosion Tool',
    paint: 'Paint Tool',
    foliage: 'Foliage Tool'
  }
  return toolNames[props.selectedTool] || 'Unknown Tool'
}

function updateBrushSetting(key: string, value: any) {
  (localBrushSettings as any)[key] = value
  emit('update:brushSettings', { ...localBrushSettings })
  updateBrushPreview()
}

function updateSculptSetting(key: string, value: any) {
  sculptSettings[key] = value
  console.log('🏔️ Sculpt setting updated:', key, value)
}

function updateNoiseSetting(key: string, value: any) {
  noiseSettings[key] = value
  console.log('🌊 Noise setting updated:', key, value)
}

function updatePaintSetting(key: string, value: any) {
  paintSettings[key] = value
  console.log('🎨 Paint setting updated:', key, value)
}

function selectTextureLayer(index: number) {
  paintSettings.activeLayer = index
  console.log('🖼️ Selected texture layer:', index)
}

function updateBrushPreview() {
  nextTick(() => {
    drawBrushPreview()
  })
}

function drawBrushPreview() {
  const canvas = brushPreviewCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) * 0.8

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制背景网格
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  for (let i = 0; i <= canvas.width; i += 20) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, canvas.height)
    ctx.stroke()
  }
  for (let i = 0; i <= canvas.height; i += 20) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i)
    ctx.stroke()
  }

  // 绘制笔刷预览
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  const alpha = localBrushSettings.strength
  const falloff = localBrushSettings.falloff

  gradient.addColorStop(0, `rgba(0, 220, 130, ${alpha})`)
  gradient.addColorStop(falloff, `rgba(0, 220, 130, ${alpha * 0.5})`)
  gradient.addColorStop(1, 'rgba(0, 220, 130, 0)')

  ctx.fillStyle = gradient

  if (props.selectedBrush === 'circle') {
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
  } else if (props.selectedBrush === 'square') {
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2)
  }
}

// 监听属性变化
watch(() => props.brushSettings, (newSettings) => {
  Object.assign(localBrushSettings, newSettings)
  updateBrushPreview()
}, { deep: true })

watch(() => [props.selectedBrush, props.selectedTool], () => {
  updateBrushPreview()
})

// 生命周期
onMounted(() => {
  updateBrushPreview()
})
</script>

<style scoped>
.qaq-terrain-brush-properties {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.qaq-panel-header {
  margin-bottom: 20px;
}

.qaq-panel-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
  margin: 0 0 4px 0;
}

.qaq-current-tool {
  font-size: 0.875rem;
  color: var(--qaq-accent, #00DC82);
  font-weight: 500;
}

.qaq-property-section {
  margin-bottom: 24px;
}

.qaq-property-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-property-group {
  margin-bottom: 16px;
}

.qaq-property-group label {
  display: block;
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
  margin-bottom: 8px;
}

.qaq-property-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-number-input {
  width: 80px;
  flex-shrink: 0;
}

.qaq-percentage,
.qaq-value {
  font-size: 0.875rem;
  color: var(--qaq-text-primary, #ffffff);
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.qaq-texture-layers {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.qaq-texture-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qaq-texture-layer:hover {
  background-color: var(--qaq-hover, rgba(255, 255, 255, 0.1));
}

.qaq-layer-active {
  background-color: var(--qaq-accent, #00DC82) !important;
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-layer-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.qaq-layer-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qaq-layer-name {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.qaq-brush-preview {
  display: flex;
  justify-content: center;
  padding: 12px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
}

.qaq-preview-canvas {
  border-radius: 4px;
  background-color: var(--qaq-bg-primary, #0a0a0a);
}
</style>
