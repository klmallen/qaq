<template>
  <div class="qaq-terrain-editor">
    <!-- 地形编辑器头部 -->
    <div class="qaq-terrain-header">
      <div class="qaq-header-left">
        <UIcon name="i-heroicons-globe-alt" class="qaq-terrain-icon" />
        <h2>地形编辑器</h2>
        <span class="qaq-terrain-info">UE风格地形雕刻工具</span>
      </div>

      <div class="qaq-header-right">
        <UButton
          icon="i-heroicons-arrow-path"
          size="xs"
          variant="ghost"
          @click="resetTerrain"
          title="重置地形"
        >
          重置
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          size="xs"
          variant="ghost"
          @click="exportTerrain"
          title="导出地形"
        >
          导出
        </UButton>
      </div>
    </div>

    <!-- 地形编辑器布局 -->
    <div class="qaq-terrain-layout">
      <!-- 左侧笔刷面板 -->
      <div class="qaq-terrain-left-panel">
        <div class="qaq-panel-header">
          <h3>笔刷工具</h3>
        </div>

        <div class="qaq-brush-tools">
          <div
            v-for="tool in brushTools"
            :key="tool.id"
            class="qaq-brush-tool"
            :class="{ 'active': selectedTool === tool.id }"
            @click="selectedTool = tool.id"
          >
            <UIcon :name="tool.icon" />
            <span>{{ tool.name }}</span>
          </div>
        </div>

        <div class="qaq-brush-list">
          <h4>笔刷类型</h4>
          <div
            v-for="brush in brushTypes"
            :key="brush.id"
            class="qaq-brush-item"
            :class="{ 'active': selectedBrush === brush.id }"
            @click="selectedBrush = brush.id"
          >
            <div class="qaq-brush-preview" :style="getBrushPreviewStyle(brush)"></div>
            <span>{{ brush.name }}</span>
          </div>
        </div>
      </div>

      <!-- 中央3D视口 -->
      <div class="qaq-terrain-viewport">
        <div class="qaq-viewport-header">
          <span>地形视口</span>
          <div class="qaq-viewport-controls">
            <UButton
              icon="i-heroicons-eye"
              size="xs"
              variant="ghost"
              :class="{ 'active': showWireframe }"
              @click="showWireframe = !showWireframe"
              title="线框模式"
            />
            <UButton
              icon="i-heroicons-sun"
              size="xs"
              variant="ghost"
              @click="toggleLighting"
              title="切换光照"
            />
          </div>
        </div>

        <div class="qaq-terrain-canvas">
          <div class="qaq-terrain-placeholder">
            <UIcon name="i-heroicons-globe-alt" class="qaq-placeholder-icon" />
            <h3>地形编辑器</h3>
            <p>3D地形编辑功能正在开发中</p>
            <p>将支持UE风格的地形雕刻和纹理绘制</p>
          </div>
        </div>
      </div>

      <!-- 右侧笔刷属性面板 -->
      <div class="qaq-terrain-right-panel">
        <div class="qaq-panel-header">
          <h3>笔刷属性</h3>
        </div>

        <div class="qaq-brush-properties">
          <div class="qaq-property-group">
            <label>笔刷大小</label>
            <input
              v-model.number="brushSettings.size"
              type="range"
              min="1"
              max="100"
              class="qaq-slider"
            />
            <span class="qaq-value">{{ brushSettings.size }}</span>
          </div>

          <div class="qaq-property-group">
            <label>笔刷强度</label>
            <input
              v-model.number="brushSettings.strength"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="qaq-slider"
            />
            <span class="qaq-value">{{ brushSettings.strength.toFixed(2) }}</span>
          </div>

          <div class="qaq-property-group">
            <label>笔刷硬度</label>
            <input
              v-model.number="brushSettings.hardness"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="qaq-slider"
            />
            <span class="qaq-value">{{ brushSettings.hardness.toFixed(2) }}</span>
          </div>

          <div class="qaq-property-group">
            <label>笔刷间距</label>
            <input
              v-model.number="brushSettings.spacing"
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              class="qaq-slider"
            />
            <span class="qaq-value">{{ brushSettings.spacing.toFixed(1) }}</span>
          </div>
        </div>

        <div class="qaq-terrain-layers">
          <h4>地形图层</h4>
          <div
            v-for="layer in terrainLayers"
            :key="layer.id"
            class="qaq-layer-item"
            :class="{ 'active': selectedLayer === layer.id }"
            @click="selectedLayer = layer.id"
          >
            <div class="qaq-layer-preview" :style="{ background: layer.color }"></div>
            <span>{{ layer.name }}</span>
            <UButton
              icon="i-heroicons-eye"
              size="xs"
              variant="ghost"
              :class="{ 'active': layer.visible }"
              @click.stop="toggleLayerVisibility(layer.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 地形工具栏 -->
    <div class="qaq-terrain-toolbar">
      <div class="qaq-toolbar-left">
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="sm"
          @click="resetTerrain"
        >
          Reset Terrain
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          variant="ghost"
          size="sm"
          @click="exportTerrain"
        >
          Export
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-up"
          variant="ghost"
          size="sm"
          @click="importTerrain"
        >
          Import
        </UButton>
      </div>

      <div class="qaq-toolbar-right">
        <span class="qaq-terrain-info">
          Terrain Size: {{ terrainInfo.size }}x{{ terrainInfo.size }} • Vertices: {{ terrainInfo.vertices }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 响应式状态
const selectedTool = ref('sculpt')
const selectedBrush = ref('round')
const selectedLayer = ref('base')
const showWireframe = ref(false)

const brushSettings = ref({
  size: 50,
  strength: 0.5,
  hardness: 0.8,
  spacing: 1.0
})

// 笔刷工具
const brushTools = ref([
  { id: 'sculpt', name: '雕刻', icon: 'i-heroicons-hand-raised' },
  { id: 'smooth', name: '平滑', icon: 'i-heroicons-sparkles' },
  { id: 'flatten', name: '平整', icon: 'i-heroicons-minus' },
  { id: 'paint', name: '绘制', icon: 'i-heroicons-paint-brush' },
  { id: 'erase', name: '擦除', icon: 'i-heroicons-trash' }
])

// 笔刷类型
const brushTypes = ref([
  { id: 'round', name: '圆形', shape: 'circle' },
  { id: 'square', name: '方形', shape: 'square' },
  { id: 'noise', name: '噪声', shape: 'noise' },
  { id: 'custom', name: '自定义', shape: 'custom' }
])

// 地形图层
const terrainLayers = ref([
  { id: 'base', name: '基础层', color: '#8B4513', visible: true },
  { id: 'grass', name: '草地', color: '#228B22', visible: true },
  { id: 'rock', name: '岩石', color: '#696969', visible: true },
  { id: 'sand', name: '沙地', color: '#F4A460', visible: false }
])

// 方法
const getBrushPreviewStyle = (brush: any) => {
  const styles: Record<string, any> = {
    circle: { borderRadius: '50%', background: 'linear-gradient(45deg, #00DC82, #00b86f)' },
    square: { borderRadius: '2px', background: 'linear-gradient(45deg, #00DC82, #00b86f)' },
    noise: { borderRadius: '30%', background: 'radial-gradient(circle, #00DC82, #00b86f)' },
    custom: { borderRadius: '20%', background: 'conic-gradient(#00DC82, #00b86f, #00DC82)' }
  }
  return styles[brush.shape] || styles.circle
}

const toggleLayerVisibility = (layerId: string) => {
  const layer = terrainLayers.value.find(l => l.id === layerId)
  if (layer) {
    layer.visible = !layer.visible
  }
}

const toggleLighting = () => {
  console.log('Toggle lighting')
}

const resetTerrain = () => {
  console.log('Reset terrain')
}

const exportTerrain = () => {
  console.log('Export terrain')
}

// 生命周期
onMounted(() => {
  console.log('Terrain Editor mounted')
})
</script>

<style scoped>
.qaq-terrain-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-terrain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--qaq-editor-panel, #383838);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-terrain-icon {
  font-size: 20px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-terrain-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.qaq-terrain-info {
  font-size: 14px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  font-style: italic;
}

.qaq-header-right {
  display: flex;
  gap: 8px;
}

.qaq-terrain-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.qaq-terrain-left-panel,
.qaq-terrain-right-panel {
  width: 280px;
  background: var(--qaq-editor-panel, #383838);
  border-right: 1px solid var(--qaq-editor-border, #4a4a4a);
  overflow-y: auto;
}

.qaq-terrain-right-panel {
  border-right: none;
  border-left: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-terrain-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--qaq-editor-bg, #2a2a2a);
}

.qaq-panel-header {
  padding: 12px 16px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-panel-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-brush-tools {
  padding: 12px;
}

.qaq-brush-tool {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qaq-brush-tool:hover {
  background: var(--qaq-editor-bg, #2a2a2a);
}

.qaq-brush-tool.active {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-brush-list {
  padding: 12px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-brush-list h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  text-transform: uppercase;
}

.qaq-brush-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qaq-brush-item:hover {
  background: var(--qaq-editor-bg, #2a2a2a);
}

.qaq-brush-item.active {
  background: rgba(0, 220, 130, 0.2);
  border: 1px solid var(--qaq-primary, #00DC82);
}

.qaq-brush-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-viewport-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--qaq-editor-panel, #383838);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-viewport-controls {
  display: flex;
  gap: 4px;
}

.qaq-viewport-controls .active {
  background: var(--qaq-primary, #00DC82);
  color: #000000;
}

.qaq-terrain-canvas {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
}

.qaq-terrain-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-placeholder-icon {
  font-size: 48px;
  color: var(--qaq-primary, #00DC82);
  margin-bottom: 16px;
}

.qaq-terrain-placeholder h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-terrain-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.qaq-brush-properties {
  padding: 12px;
}

.qaq-property-group {
  margin-bottom: 16px;
}

.qaq-property-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-slider {
  width: 100%;
  height: 4px;
  background: var(--qaq-editor-bg, #2a2a2a);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.qaq-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--qaq-primary, #00DC82);
  border-radius: 50%;
  cursor: pointer;
}

.qaq-value {
  float: right;
  font-size: 11px;
  color: var(--qaq-primary, #00DC82);
  font-family: monospace;
}

.qaq-terrain-layers {
  padding: 12px;
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-terrain-layers h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  text-transform: uppercase;
}

.qaq-layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qaq-layer-item:hover {
  background: var(--qaq-editor-bg, #2a2a2a);
}

.qaq-layer-item.active {
  background: rgba(0, 220, 130, 0.2);
  border: 1px solid var(--qaq-primary, #00DC82);
}

.qaq-layer-preview {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}
</style>
