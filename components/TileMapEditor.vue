<template>
  <div class="tilemap-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <h3>瓦片地图编辑器</h3>

      <!-- 工具选择 -->
      <div class="tool-group">
        <label>工具:</label>
        <button
          v-for="tool in tools"
          :key="tool.id"
          :class="['tool-btn', { active: currentTool === tool.id }]"
          @click="selectTool(tool.id)"
          :title="tool.name + ' (' + tool.shortcut + ')'"
        >
          {{ tool.icon }}
        </button>
      </div>

      <!-- 瓦片选择 -->
      <div class="tile-group">
        <label>瓦片:</label>
        <div class="tile-palette">
          <div
            v-for="tileId in availableTiles"
            :key="tileId"
            :class="['tile-item', { selected: selectedTileId === tileId }]"
            @click="selectTile(tileId)"
            :style="getTileStyle(tileId)"
          >
            {{ tileId }}
          </div>
        </div>
      </div>

      <!-- 层选择 -->
      <div class="layer-group">
        <label>图层:</label>
        <select v-model="currentLayer" @change="onLayerChange">
          <option v-for="layer in layers" :key="layer" :value="layer">
            {{ layer }}
          </option>
        </select>
      </div>

      <!-- 地图设置 -->
      <div class="map-settings">
        <label>
          <input type="checkbox" v-model="showGrid" @change="toggleGrid">
          显示网格
        </label>
        <label>
          地图尺寸: {{ mapSize.x }}x{{ mapSize.y }}
        </label>
      </div>

      <!-- 操作按钮 -->
      <div class="action-group">
        <button @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">↶</button>
        <button @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">↷</button>
        <button @click="clearMap" title="清空地图">🗑️</button>
        <button @click="saveMap" title="保存地图">💾</button>
        <button @click="loadMap" title="加载地图">📁</button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="editor-canvas" ref="canvasContainer">
      <div
        class="tile-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @contextmenu.prevent
      >
        <!-- 这里会渲染Three.js场景 -->
      </div>

      <!-- 鼠标位置信息 -->
      <div class="mouse-info" v-if="mouseInfo.visible">
        瓦片坐标: ({{ mouseInfo.tileX }}, {{ mouseInfo.tileY }})
        <br>
        世界坐标: ({{ mouseInfo.worldX.toFixed(1) }}, {{ mouseInfo.worldY.toFixed(1) }})
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="editor-status">
      <span>工具: {{ getCurrentToolName() }}</span>
      <span>图层: {{ currentLayer }}</span>
      <span>瓦片: {{ selectedTileId }}</span>
      <span>历史: {{ historyIndex + 1 }}/{{ history.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type TileMap2D from '~/core/nodes/2d/TileMap2D'
import type TileSet from '~/core/resources/TileSet'

// ============================================================================
// Props 和 Emits
// ============================================================================

interface Props {
  tileMap?: TileMap2D
  tileSet?: TileSet
  initialTool?: number
  initialLayer?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialTool: 0,
  initialLayer: 'main'
})

const emit = defineEmits<{
  tileChanged: [{ x: number, y: number, tileId: number, layer: string }]
  toolChanged: [number]
  layerChanged: [string]
  mapSaved: [any]
  mapLoaded: [any]
}>()

// ============================================================================
// 响应式数据
// ============================================================================

// 工具定义
const tools = [
  { id: 0, name: '画笔', icon: '🖌️', shortcut: '1' },
  { id: 1, name: '橡皮擦', icon: '🧽', shortcut: '2' },
  { id: 2, name: '填充', icon: '🪣', shortcut: '3' },
  { id: 3, name: '矩形', icon: '⬜', shortcut: '4' },
  { id: 4, name: '选择', icon: '👆', shortcut: '5' }
]

// 编辑器状态
const currentTool = ref(props.initialTool)
const selectedTileId = ref(0)
const currentLayer = ref(props.initialLayer)
const showGrid = ref(true)

// 可用瓦片列表
const availableTiles = ref<number[]>([])

// 图层列表
const layers = ref<string[]>(['background', 'main', 'foreground'])

// 地图信息
const mapSize = reactive({ x: 0, y: 0 })

// 鼠标信息
const mouseInfo = reactive({
  visible: false,
  tileX: 0,
  tileY: 0,
  worldX: 0,
  worldY: 0
})

// 绘制状态
const isDrawing = ref(false)
const drawStartPos = reactive({ x: 0, y: 0 })

// 历史记录
const history = ref<Array<{ action: string, data: any }>>([])
const historyIndex = ref(-1)

// DOM引用
const canvasContainer = ref<HTMLElement>()

// ============================================================================
// 计算属性
// ============================================================================

const canUndo = computed(() => historyIndex.value >= 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// ============================================================================
// 方法
// ============================================================================

/**
 * 选择工具
 */
const selectTool = (toolId: number) => {
  currentTool.value = toolId
  emit('toolChanged', toolId)
}

/**
 * 选择瓦片
 */
const selectTile = (tileId: number) => {
  selectedTileId.value = tileId
}

/**
 * 获取瓦片样式
 */
const getTileStyle = (tileId: number) => {
  // 这里可以根据瓦片ID返回对应的背景样式
  const colors = ['#ff6b35', '#28a745', '#007bff', '#6f42c1', '#ffc107', '#dc3545']
  return {
    backgroundColor: colors[tileId % colors.length] || '#cccccc'
  }
}

/**
 * 获取当前工具名称
 */
const getCurrentToolName = () => {
  const tool = tools.find(t => t.id === currentTool.value)
  return tool ? tool.name : '未知'
}

/**
 * 图层改变
 */
const onLayerChange = () => {
  emit('layerChanged', currentLayer.value)
}

/**
 * 切换网格显示
 */
const toggleGrid = () => {
  // 这里需要与TileMapEditor类通信
  if (props.tileMap) {
    // 假设TileMapEditor有showGrid属性
    console.log('Toggle grid:', showGrid.value)
  }
}

/**
 * 鼠标按下
 */
const onMouseDown = (event: MouseEvent) => {
  if (!props.tileMap) return

  isDrawing.value = true
  updateMousePosition(event)
  drawStartPos.x = mouseInfo.tileX
  drawStartPos.y = mouseInfo.tileY

  switch (currentTool.value) {
    case 0: // 画笔
      drawTile(mouseInfo.tileX, mouseInfo.tileY)
      break
    case 1: // 橡皮擦
      eraseTile(mouseInfo.tileX, mouseInfo.tileY)
      break
    case 2: // 填充
      fillArea(mouseInfo.tileX, mouseInfo.tileY)
      break
  }
}

/**
 * 鼠标移动
 */
const onMouseMove = (event: MouseEvent) => {
  updateMousePosition(event)

  if (isDrawing.value && props.tileMap) {
    switch (currentTool.value) {
      case 0: // 画笔
        drawTile(mouseInfo.tileX, mouseInfo.tileY)
        break
      case 1: // 橡皮擦
        eraseTile(mouseInfo.tileX, mouseInfo.tileY)
        break
    }
  }
}

/**
 * 鼠标释放
 */
const onMouseUp = (event: MouseEvent) => {
  if (isDrawing.value && currentTool.value === 3) { // 矩形工具
    drawRectangle(
      drawStartPos.x, drawStartPos.y,
      mouseInfo.tileX, mouseInfo.tileY
    )
  }
  isDrawing.value = false
}

/**
 * 鼠标离开
 */
const onMouseLeave = () => {
  isDrawing.value = false
  mouseInfo.visible = false
}

/**
 * 更新鼠标位置
 */
const updateMousePosition = (event: MouseEvent) => {
  if (!canvasContainer.value || !props.tileMap) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 转换为世界坐标（这里需要考虑相机变换）
  mouseInfo.worldX = x
  mouseInfo.worldY = y

  // 转换为瓦片坐标
  const tilePos = props.tileMap.worldToTile({ x, y })
  mouseInfo.tileX = tilePos.x
  mouseInfo.tileY = tilePos.y
  mouseInfo.visible = true
}

/**
 * 绘制瓦片
 */
const drawTile = (x: number, y: number) => {
  if (!props.tileMap) return

  const oldTileId = props.tileMap.getTile(x, y, currentLayer.value)
  if (oldTileId !== selectedTileId.value) {
    addToHistory('draw', { x, y, oldTileId, newTileId: selectedTileId.value, layer: currentLayer.value })
    props.tileMap.setTile(x, y, selectedTileId.value, currentLayer.value)

    emit('tileChanged', { x, y, tileId: selectedTileId.value, layer: currentLayer.value })
  }
}

/**
 * 擦除瓦片
 */
const eraseTile = (x: number, y: number) => {
  if (!props.tileMap) return

  const oldTileId = props.tileMap.getTile(x, y, currentLayer.value)
  if (oldTileId !== -1) {
    addToHistory('erase', { x, y, oldTileId, layer: currentLayer.value })
    props.tileMap.clearTile(x, y, currentLayer.value)

    emit('tileChanged', { x, y, tileId: -1, layer: currentLayer.value })
  }
}

/**
 * 填充区域
 */
const fillArea = (x: number, y: number) => {
  if (!props.tileMap) return

  const targetTileId = props.tileMap.getTile(x, y, currentLayer.value)
  if (targetTileId === selectedTileId.value) return

  const filledTiles: Array<{ x: number, y: number, oldTileId: number }> = []
  floodFill(x, y, targetTileId, filledTiles)

  if (filledTiles.length > 0) {
    addToHistory('fill', { tiles: filledTiles, newTileId: selectedTileId.value, layer: currentLayer.value })

    // 发送批量变化事件
    filledTiles.forEach(tile => {
      emit('tileChanged', { x: tile.x, y: tile.y, tileId: selectedTileId.value, layer: currentLayer.value })
    })
  }
}

/**
 * 绘制矩形
 */
const drawRectangle = (startX: number, startY: number, endX: number, endY: number) => {
  if (!props.tileMap) return

  const minX = Math.min(startX, endX)
  const maxX = Math.max(startX, endX)
  const minY = Math.min(startY, endY)
  const maxY = Math.max(startY, endY)

  const changedTiles: Array<{ x: number, y: number, oldTileId: number }> = []

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const oldTileId = props.tileMap.getTile(x, y, currentLayer.value)
      if (oldTileId !== selectedTileId.value) {
        changedTiles.push({ x, y, oldTileId })
        props.tileMap.setTile(x, y, selectedTileId.value, currentLayer.value)

        emit('tileChanged', { x, y, tileId: selectedTileId.value, layer: currentLayer.value })
      }
    }
  }

  if (changedTiles.length > 0) {
    addToHistory('rectangle', { tiles: changedTiles, newTileId: selectedTileId.value, layer: currentLayer.value })
  }
}

/**
 * 洪水填充
 */
const floodFill = (x: number, y: number, targetTileId: number, filledTiles: Array<{ x: number, y: number, oldTileId: number }>) => {
  if (!props.tileMap || !isValidTilePosition(x, y)) return

  const currentTileId = props.tileMap.getTile(x, y, currentLayer.value)
  if (currentTileId !== targetTileId) return

  if (filledTiles.some(tile => tile.x === x && tile.y === y)) return

  filledTiles.push({ x, y, oldTileId: currentTileId })
  props.tileMap.setTile(x, y, selectedTileId.value, currentLayer.value)

  // 递归填充
  floodFill(x + 1, y, targetTileId, filledTiles)
  floodFill(x - 1, y, targetTileId, filledTiles)
  floodFill(x, y + 1, targetTileId, filledTiles)
  floodFill(x, y - 1, targetTileId, filledTiles)
}

/**
 * 检查瓦片位置是否有效
 */
const isValidTilePosition = (x: number, y: number): boolean => {
  return x >= 0 && x < mapSize.x && y >= 0 && y < mapSize.y
}

/**
 * 撤销
 */
const undo = () => {
  if (canUndo.value) {
    const action = history.value[historyIndex.value]
    executeUndo(action)
    historyIndex.value--
  }
}

/**
 * 重做
 */
const redo = () => {
  if (canRedo.value) {
    historyIndex.value++
    const action = history.value[historyIndex.value]
    executeRedo(action)
  }
}

/**
 * 执行撤销
 */
const executeUndo = (historyItem: { action: string, data: any }) => {
  if (!props.tileMap) return

  const { action, data } = historyItem

  switch (action) {
    case 'draw':
    case 'erase':
      props.tileMap.setTile(data.x, data.y, data.oldTileId, data.layer)
      emit('tileChanged', { x: data.x, y: data.y, tileId: data.oldTileId, layer: data.layer })
      break
    case 'fill':
    case 'rectangle':
      for (const tile of data.tiles) {
        props.tileMap.setTile(tile.x, tile.y, tile.oldTileId, data.layer)
        emit('tileChanged', { x: tile.x, y: tile.y, tileId: tile.oldTileId, layer: data.layer })
      }
      break
  }
}

/**
 * 执行重做
 */
const executeRedo = (historyItem: { action: string, data: any }) => {
  if (!props.tileMap) return

  const { action, data } = historyItem

  switch (action) {
    case 'draw':
    case 'erase':
      props.tileMap.setTile(data.x, data.y, data.newTileId, data.layer)
      emit('tileChanged', { x: data.x, y: data.y, tileId: data.newTileId, layer: data.layer })
      break
    case 'fill':
    case 'rectangle':
      for (const tile of data.tiles) {
        props.tileMap.setTile(tile.x, tile.y, data.newTileId, data.layer)
        emit('tileChanged', { x: tile.x, y: tile.y, tileId: data.newTileId, layer: data.layer })
      }
      break
  }
}

/**
 * 添加到历史记录
 */
const addToHistory = (action: string, data: any) => {
  // 移除当前索引之后的历史记录
  history.value = history.value.slice(0, historyIndex.value + 1)

  // 添加新的历史记录
  history.value.push({ action, data })
  historyIndex.value++

  // 限制历史记录数量
  const maxHistory = 50
  if (history.value.length > maxHistory) {
    history.value.shift()
    historyIndex.value--
  }
}

/**
 * 清空地图
 */
const clearMap = () => {
  if (!props.tileMap || !confirm('确定要清空整个地图吗？')) return

  const rect = { x: 0, y: 0, width: mapSize.x, height: mapSize.y }
  props.tileMap.clearRect(rect, currentLayer.value)

  // 清空历史记录
  history.value = []
  historyIndex.value = -1
}

/**
 * 保存地图
 */
const saveMap = () => {
  if (!props.tileMap) return

  // 这里可以实现地图数据的序列化
  const mapData = {
    mapSize: mapSize,
    layers: layers.value,
    // 可以添加更多地图数据
  }

  emit('mapSaved', mapData)
  console.log('地图已保存', mapData)
}

/**
 * 加载地图
 */
const loadMap = () => {
  // 这里可以实现地图数据的加载
  emit('mapLoaded', {})
  console.log('加载地图')
}

/**
 * 键盘事件处理
 */
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 'y':
        event.preventDefault()
        redo()
        break
    }
  }

  // 工具快捷键
  const toolKey = parseInt(event.key)
  if (toolKey >= 1 && toolKey <= 5) {
    selectTool(toolKey - 1)
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化编辑器
  if (props.tileMap) {
    mapSize.x = props.tileMap.mapSize.x
    mapSize.y = props.tileMap.mapSize.y
    layers.value = props.tileMap.getLayerNames()
  }

  if (props.tileSet) {
    availableTiles.value = props.tileSet.getTileIds()
  }

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 监听props变化
watch(() => props.tileMap, (newTileMap) => {
  if (newTileMap) {
    mapSize.x = newTileMap.mapSize.x
    mapSize.y = newTileMap.mapSize.y
    layers.value = newTileMap.getLayerNames()
  }
})

watch(() => props.tileSet, (newTileSet) => {
  if (newTileSet) {
    availableTiles.value = newTileSet.getTileIds()
  }
})
</script>

<style scoped>
.tilemap-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  background: #ffffff;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.editor-toolbar h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.tool-group, .tile-group, .layer-group, .map-settings, .action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-group label, .tile-group label, .layer-group label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.tool-btn {
  padding: 8px 12px;
  border: 2px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.tool-btn.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

.tile-palette {
  display: flex;
  gap: 4px;
  max-width: 200px;
  flex-wrap: wrap;
}

.tile-item {
  width: 32px;
  height: 32px;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  transition: all 0.2s ease;
}

.tile-item:hover {
  border-color: #007bff;
  transform: scale(1.1);
}

.tile-item.selected {
  border-color: #007bff;
  border-width: 3px;
  transform: scale(1.1);
}

.layer-group select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.map-settings {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.map-settings label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.action-group button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  min-width: 36px;
  height: 36px;
}

.action-group button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.action-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-canvas {
  flex: 1;
  position: relative;
  background: #e9ecef;
  overflow: hidden;
}

.tile-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  position: relative;
}

.mouse-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  pointer-events: none;
  z-index: 10;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: #f8f9fa;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #666;
}

.editor-status span {
  padding: 0 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tool-group, .tile-group, .layer-group, .action-group {
    justify-content: center;
  }

  .tile-palette {
    justify-content: center;
    max-width: none;
  }

  .editor-status {
    flex-direction: column;
    gap: 4px;
  }
}

/* 工具特定的鼠标样式 */
.tile-canvas.brush-tool {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="black" stroke-width="2"/></svg>') 8 8, crosshair;
}

.tile-canvas.eraser-tool {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="none" stroke="red" stroke-width="2"/></svg>') 8 8, crosshair;
}

.tile-canvas.fill-tool {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M8 2l6 6-6 6-6-6z" fill="blue"/></svg>') 8 8, crosshair;
}
</style>
