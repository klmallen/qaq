<template>
  <div class="qaq-terrain-brush-panel">
    <!-- 面板标题 -->
    <div class="qaq-panel-header">
      <h3>Terrain Tools</h3>
    </div>

    <!-- 地形工具选择 -->
    <div class="qaq-tool-section">
      <h4>Sculpting Tools</h4>
      <div class="qaq-tool-grid">
        <div
          v-for="tool in sculptingTools"
          :key="tool.id"
          class="qaq-tool-item"
          :class="{ 'qaq-tool-active': selectedTool === tool.id }"
          @click="selectTool(tool.id)"
          :title="tool.description"
        >
          <UIcon :name="tool.icon" class="qaq-tool-icon" />
          <span class="qaq-tool-label">{{ tool.name }}</span>
        </div>
      </div>
    </div>

    <!-- 绘制工具 -->
    <div class="qaq-tool-section">
      <h4>Painting Tools</h4>
      <div class="qaq-tool-grid">
        <div
          v-for="tool in paintingTools"
          :key="tool.id"
          class="qaq-tool-item"
          :class="{ 'qaq-tool-active': selectedTool === tool.id }"
          @click="selectTool(tool.id)"
          :title="tool.description"
        >
          <UIcon :name="tool.icon" class="qaq-tool-icon" />
          <span class="qaq-tool-label">{{ tool.name }}</span>
        </div>
      </div>
    </div>

    <!-- 植被工具 -->
    <div class="qaq-tool-section">
      <h4>Foliage Tools</h4>
      <div class="qaq-tool-grid">
        <div
          v-for="tool in foliageTools"
          :key="tool.id"
          class="qaq-tool-item"
          :class="{ 'qaq-tool-active': selectedTool === tool.id }"
          @click="selectTool(tool.id)"
          :title="tool.description"
        >
          <UIcon :name="tool.icon" class="qaq-tool-icon" />
          <span class="qaq-tool-label">{{ tool.name }}</span>
        </div>
      </div>
    </div>

    <!-- 笔刷形状选择 -->
    <div class="qaq-brush-section">
      <h4>Brush Shape</h4>
      <div class="qaq-brush-shapes">
        <div
          v-for="brush in brushShapes"
          :key="brush.id"
          class="qaq-brush-item"
          :class="{ 'qaq-brush-active': selectedBrush === brush.id }"
          @click="selectBrush(brush.id)"
        >
          <div class="qaq-brush-preview" :class="`qaq-brush-${brush.id}`">
            <UIcon :name="brush.icon" class="qaq-brush-icon" />
          </div>
          <span class="qaq-brush-name">{{ brush.name }}</span>
        </div>
      </div>
    </div>

    <!-- Alpha纹理库 -->
    <div v-if="selectedBrush === 'alpha'" class="qaq-alpha-section">
      <h4>Alpha Textures</h4>
      <div class="qaq-alpha-grid">
        <div
          v-for="alpha in alphaTextures"
          :key="alpha.id"
          class="qaq-alpha-item"
          :class="{ 'qaq-alpha-active': selectedAlpha === alpha.id }"
          @click="selectAlpha(alpha.id)"
        >
          <div class="qaq-alpha-preview">
            <img :src="alpha.preview" :alt="alpha.name" />
          </div>
          <span class="qaq-alpha-name">{{ alpha.name }}</span>
        </div>
      </div>
    </div>

    <!-- 快速设置 -->
    <div class="qaq-quick-settings">
      <h4>Quick Settings</h4>
      
      <div class="qaq-setting-group">
        <label>Brush Size</label>
        <div class="qaq-setting-row">
          <URange
            v-model="quickSettings.brushSize"
            :min="1"
            :max="200"
            :step="1"
            @input="updateQuickSetting('brushSize', $event)"
          />
          <span class="qaq-setting-value">{{ quickSettings.brushSize }}</span>
        </div>
      </div>

      <div class="qaq-setting-group">
        <label>Strength</label>
        <div class="qaq-setting-row">
          <URange
            v-model="quickSettings.strength"
            :min="0"
            :max="1"
            :step="0.01"
            @input="updateQuickSetting('strength', $event)"
          />
          <span class="qaq-setting-value">{{ (quickSettings.strength * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { TerrainTool, BrushType } from '../QaqTerrainEditor.vue'

// Props和Emits
interface Props {
  selectedTool: TerrainTool
  selectedBrush: BrushType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedTool': [tool: TerrainTool]
  'update:selectedBrush': [brush: BrushType]
  'tool-changed': [tool: TerrainTool]
}>()

// 响应式数据
const selectedAlpha = ref('noise1')

// 快速设置
const quickSettings = reactive({
  brushSize: 50,
  strength: 0.5
})

// 雕刻工具定义
const sculptingTools = [
  {
    id: 'sculpt' as TerrainTool,
    name: 'Sculpt',
    icon: 'i-heroicons-hand-raised',
    description: 'Raise or lower terrain height'
  },
  {
    id: 'smooth' as TerrainTool,
    name: 'Smooth',
    icon: 'i-heroicons-sparkles',
    description: 'Smooth terrain surface'
  },
  {
    id: 'flatten' as TerrainTool,
    name: 'Flatten',
    icon: 'i-heroicons-minus',
    description: 'Flatten terrain to a specific height'
  },
  {
    id: 'noise' as TerrainTool,
    name: 'Noise',
    icon: 'i-heroicons-bolt',
    description: 'Add procedural noise to terrain'
  },
  {
    id: 'erosion' as TerrainTool,
    name: 'Erosion',
    icon: 'i-heroicons-beaker',
    description: 'Simulate natural erosion effects'
  }
]

// 绘制工具定义
const paintingTools = [
  {
    id: 'paint' as TerrainTool,
    name: 'Paint',
    icon: 'i-heroicons-paint-brush',
    description: 'Paint textures on terrain'
  }
]

// 植被工具定义
const foliageTools = [
  {
    id: 'foliage' as TerrainTool,
    name: 'Foliage',
    icon: 'i-heroicons-leaf',
    description: 'Place vegetation and foliage'
  }
]

// 笔刷形状定义
const brushShapes = [
  {
    id: 'circle' as BrushType,
    name: 'Circle',
    icon: 'i-heroicons-stop-circle'
  },
  {
    id: 'square' as BrushType,
    name: 'Square',
    icon: 'i-heroicons-stop'
  },
  {
    id: 'alpha' as BrushType,
    name: 'Alpha',
    icon: 'i-heroicons-photo'
  }
]

// Alpha纹理定义
const alphaTextures = [
  {
    id: 'noise1',
    name: 'Noise 1',
    preview: '/textures/alpha/noise1.png'
  },
  {
    id: 'noise2',
    name: 'Noise 2',
    preview: '/textures/alpha/noise2.png'
  },
  {
    id: 'rock',
    name: 'Rock',
    preview: '/textures/alpha/rock.png'
  },
  {
    id: 'organic',
    name: 'Organic',
    preview: '/textures/alpha/organic.png'
  }
]

// 方法
function selectTool(tool: TerrainTool) {
  emit('update:selectedTool', tool)
  emit('tool-changed', tool)
  console.log('🔧 Selected terrain tool:', tool)
}

function selectBrush(brush: BrushType) {
  emit('update:selectedBrush', brush)
  console.log('🖌️ Selected brush shape:', brush)
}

function selectAlpha(alphaId: string) {
  selectedAlpha.value = alphaId
  console.log('🎨 Selected alpha texture:', alphaId)
}

function updateQuickSetting(key: string, value: any) {
  console.log(`⚡ Quick setting ${key}:`, value)
  // 这里可以发送事件给父组件更新笔刷设置
}
</script>

<style scoped>
.qaq-terrain-brush-panel {
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
  margin: 0;
}

.qaq-tool-section,
.qaq-brush-section,
.qaq-alpha-section,
.qaq-quick-settings {
  margin-bottom: 24px;
}

.qaq-tool-section h4,
.qaq-brush-section h4,
.qaq-alpha-section h4,
.qaq-quick-settings h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qaq-tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.qaq-tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.qaq-tool-item:hover {
  background-color: var(--qaq-hover, rgba(255, 255, 255, 0.1));
}

.qaq-tool-active {
  background-color: var(--qaq-accent, #00DC82) !important;
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-tool-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.qaq-tool-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.qaq-brush-shapes {
  display: flex;
  gap: 8px;
}

.qaq-brush-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.qaq-brush-item:hover {
  background-color: var(--qaq-hover, rgba(255, 255, 255, 0.1));
}

.qaq-brush-active {
  background-color: var(--qaq-accent, #00DC82) !important;
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-brush-preview {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.qaq-brush-icon {
  width: 20px;
  height: 20px;
}

.qaq-brush-name {
  font-size: 0.75rem;
  font-weight: 500;
}

.qaq-alpha-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.qaq-alpha-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: var(--qaq-bg-tertiary, #2a2a2a);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qaq-alpha-item:hover {
  background-color: var(--qaq-hover, rgba(255, 255, 255, 0.1));
}

.qaq-alpha-active {
  background-color: var(--qaq-accent, #00DC82) !important;
  color: var(--qaq-bg-primary, #0a0a0a);
}

.qaq-alpha-preview {
  width: 40px;
  height: 40px;
  background-color: var(--qaq-bg-elevated, #3a3a3a);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.qaq-alpha-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qaq-alpha-name {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.qaq-setting-group {
  margin-bottom: 16px;
}

.qaq-setting-group label {
  display: block;
  font-size: 0.875rem;
  color: var(--qaq-text-secondary, #cccccc);
  margin-bottom: 8px;
}

.qaq-setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-setting-value {
  font-size: 0.875rem;
  color: var(--qaq-text-primary, #ffffff);
  min-width: 40px;
  text-align: right;
}
</style>
