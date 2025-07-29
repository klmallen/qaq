<template>
	<div
		class="qaq-tabbed-panel"
		:class="{
      'qaq-panel-fullscreen': isFullscreen,
      'qaq-panel-dragging': isDragging,
      'qaq-panel-resizing': isResizing,
      'qaq-panel-drop-target': isDropTarget
    }"
		:style="panelStyle"
		@dragover.prevent="handleDragOver"
		@drop="handleDrop"
		@dragleave="handleDragLeave"
	>
		<!-- 标签页栏 -->
		<div class="qaq-panel-tabs" v-if="tabs.length > 1">
			<!-- 面板拖拽区域 -->
			<div
				class="qaq-panel-drag-area"
				@mousedown="startDrag"
				@dblclick="toggleFullscreen"
				title="拖拽移动面板"
			>
				<UIcon name="i-heroicons-bars-3" class="qaq-drag-icon" />
			</div>

			<!-- 标签页 -->
			<div
				v-for="tab in tabs"
				:key="tab.id"
				class="qaq-panel-tab"
				:class="{ 'qaq-tab-active': activeTabId === tab.id }"
				@click="setActiveTab(tab.id)"
				@mousedown="startTabDrag($event, tab)"
				draggable="true"
				@dragstart="handleTabDragStart($event, tab)"
			>
				<UIcon :name="tab.icon" class="qaq-tab-icon" />
				<span class="qaq-tab-title">{{ tab.title }}</span>
				<UButton
					v-if="tabs.length > 1"
					icon="i-heroicons-x-mark"
					variant="ghost"
					size="xs"
					class="qaq-tab-close"
					@click.stop="handleTabClose(tab)"
					title="Close Tab"
				/>
			</div>

			<!-- 面板控制按钮（标签页模式） -->
			<div class="qaq-panel-controls qaq-tabs-controls">
				<!-- 合并开关 -->
				<UButton
					v-if="allowStacking"
					:icon="mergeEnabled ? 'i-heroicons-link' : 'i-heroicons-link-slash'"
					variant="ghost"
					size="xs"
					@click="toggleMergeEnabled"
					:title="mergeEnabled ? '禁用合并' : '启用合并'"
					:class="{ 'qaq-merge-enabled': mergeEnabled }"
				/>
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

		<!-- 面板标题栏（单标签时显示） -->
		<div
			v-else
			class="qaq-panel-header"
			:class="{
        'qaq-header-drop-target': isHeaderDropTarget,
        'qaq-header-merge-disabled': !mergeEnabled
      }"
			@dblclick="toggleFullscreen"
			@dragover.prevent="handleHeaderDragOver"
			@drop="handleHeaderDrop"
			@dragleave="handleHeaderDragLeave"
		>
			<div
				class="qaq-panel-title"
				draggable="true"
				@dragstart="handlePanelDragStart"
				@dragend="handlePanelDragEnd"
				@mousedown="startDrag"
			>
				<UIcon :name="activeTab?.icon || 'i-heroicons-square-3-stack-3d'" class="qaq-panel-icon" />
				<span>{{ activeTab?.title || 'Panel' }}</span>
				<span class="qaq-drag-hint" v-if="isDragging && mergeEnabled">拖拽</span>
				<span class="qaq-drag-hint" v-else-if="isDragging">拖拽移动</span>
			</div>

			<div class="qaq-panel-controls">
				<!-- 合并开关 -->
				<UButton
					v-if="allowStacking"
					:icon="mergeEnabled ? 'i-heroicons-link' : 'i-heroicons-link-slash'"
					variant="ghost"
					size="xs"
					@click="toggleMergeEnabled"
					:title="mergeEnabled ? '禁用合并' : '启用合并'"
					:class="{ 'qaq-merge-enabled': mergeEnabled }"
				/>
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
			<div
				v-for="tab in tabs"
				:key="tab.id"
				v-show="activeTabId === tab.id"
				class="qaq-tab-content"
			>
				<slot :name="tab.id" :tab="tab">
					<div class="qaq-default-content">
						<p>{{ tab.title }} Content</p>
					</div>
				</slot>
			</div>
		</div>

		<!-- 调整大小手柄 -->
		<div
			v-if="resizable && !isFullscreen"
			class="qaq-resize-handles"
		>
			<div
				v-if="canResizeRight"
				class="qaq-resize-handle qaq-resize-right"
				@mousedown="startResize('right')($event)"
			></div>

			<div
				v-if="canResizeBottom"
				class="qaq-resize-handle qaq-resize-bottom"
				@mousedown="startResize('bottom')($event)"
			></div>

			<div
				v-if="canResizeRight && canResizeBottom"
				class="qaq-resize-handle qaq-resize-corner"
				@mousedown="startResize('corner')($event)"
			></div>
		</div>

		<!-- 拖拽合并指示器 -->
		<!--    <div-->
		<!--      v-if="isDropTarget"-->
		<!--      class="qaq-merge-indicator"-->
		<!--    >-->
		<!--      <div class="qaq-merge-message">-->
		<!--        <UIcon name="i-heroicons-squares-plus" />-->
		<!--      </div>-->
		<!--    </div>-->
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Tab {
	id: string
	title: string
	icon: string
	closable?: boolean
}

interface Props {
	tabs: Tab[]
	activeTabId?: string
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
	mergeEnabled?: boolean  // 新增：是否允许合并
	allowStacking?: boolean // 新增：是否允许层叠排列
}

interface Emits {
	(e: 'close'): void
	(e: 'resize', size: { width: number; height: number }): void
	(e: 'move', position: { x: number; y: number }): void
	(e: 'fullscreen', isFullscreen: boolean): void
	(e: 'tab-change', tabId: string): void
	(e: 'tab-close', tabId: string): void
	(e: 'tab-detach', tab: Tab, position: { x: number; y: number }): void
	(e: 'panel-merge', sourceTab: Tab, targetPanelId: string): void
	(e: 'toggle-merge', enabled: boolean): void
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
	mergeEnabled: true,    // 默认允许合并
	allowStacking: true    // 默认允许层叠
})

const emit = defineEmits<Emits>()

// 响应式状态
const isFullscreen = ref(false)
const isDragging = ref(false)
const isResizing = ref(false)
const isDropTarget = ref(false)
const isHeaderDropTarget = ref(false)  // 新增：header区域拖拽目标状态
const currentWidth = ref(props.width)
const currentHeight = ref(props.height)
const currentX = ref(props.x)
const currentY = ref(props.y)
const activeTabId = ref(props.activeTabId || props.tabs[0]?.id)

// 拖拽状态
const dragStart = ref({ x: 0, y: 0, panelX: 0, panelY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const resizeDirection = ref<'right' | 'bottom' | 'corner' | null>(null)
const draggedTab = ref<Tab | null>(null)

// 计算属性
const activeTab = computed(() => props.tabs.find(tab => tab.id === activeTabId.value))

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

// 标签页管理
const setActiveTab = (tabId: string) => {
	activeTabId.value = tabId
	emit('tab-change', tabId)
}

const closeTab = (tabId: string) => {
	emit('tab-close', tabId)
}

// 处理标签页关闭
const handleTabClose = (tab: Tab) => {
	console.log('🗑️ Closing tab:', tab.title)

	// 如果是合并的标签页，需要分离面板
	if (props.tabs.length > 1) {
		// 计算分离位置（在当前面板旁边）
		const detachPosition = {
			x: currentX.value + currentWidth.value + 20,
			y: currentY.value
		}

		console.log('🔄 Detaching tab to position:', detachPosition)
		emit('tab-detach', tab, detachPosition)
	} else {
		// 如果只有一个标签页，关闭整个面板
		emit('close')
	}
}

// 拖拽功能 - 用于面板移动（非合并）
const startDrag = (event: MouseEvent) => {
	if (!props.draggable || isFullscreen.value) return

	// 只有在不支持合并时才启用鼠标拖拽移动
	if (props.mergeEnabled) {
		console.log('🔄 Merge enabled, using HTML5 drag API instead of mouse drag')
		return
	}

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

	console.log('🚀 Mouse drag started for panel movement')
}

const handleDrag = (event: MouseEvent) => {
	if (!isDragging.value) return

	const deltaX = event.clientX - dragStart.value.x
	const deltaY = event.clientY - dragStart.value.y

	currentX.value = dragStart.value.panelX + deltaX
	currentY.value = dragStart.value.panelY + deltaY

	emit('move', { x: currentX.value, y: currentY.value })
}

const stopDrag = () => {
	isDragging.value = false
	document.removeEventListener('mousemove', handleDrag)
	document.removeEventListener('mouseup', stopDrag)
}

// 标签页拖拽
const startTabDrag = (event: MouseEvent, tab: Tab) => {
	if (props.tabs.length <= 1) return
	draggedTab.value = tab
}

const handleTabDragStart = (event: DragEvent, tab: Tab) => {
	if (!event.dataTransfer) {
		console.log('❌ Tab drag start failed: missing dataTransfer')
		return
	}

	const dragData = {
		...tab,
		sourcePanel: props.tabs[0]?.id || tab.id
	}

	event.dataTransfer.setData('application/qaq-tab', JSON.stringify(dragData))
	event.dataTransfer.effectAllowed = 'move'
	isDragging.value = true

	console.log('🚀 Tab drag started:', tab.title, 'with data:', dragData)
}

// 面板拖拽
const handlePanelDragStart = (event: DragEvent) => {
	if (!event.dataTransfer || !activeTab.value) {
		console.log('❌ Panel drag start failed: missing dataTransfer or activeTab')
		return
	}

	// 设置拖拽数据
	const dragData = {
		panelId: activeTab.value.id,
		tab: activeTab.value,
		sourcePanel: props.tabs[0]?.id || activeTab.value.id
	}

	event.dataTransfer.setData('application/qaq-panel', JSON.stringify(dragData))
	event.dataTransfer.effectAllowed = 'move'
	isDragging.value = true

	console.log('🚀 Panel drag started:', activeTab.value.title, 'with data:', dragData)
}

const handlePanelDragEnd = () => {
	isDragging.value = false
	console.log('🏁 Panel drag ended')
}

// 拖放处理
const handleDragOver = (event: DragEvent) => {
	event.preventDefault()

	// 检查是否允许合并
	if (!props.mergeEnabled) {
		event.dataTransfer!.dropEffect = 'none'
		return
	}

	// 检查是否是标签页或面板拖拽
	const hasTab = event.dataTransfer?.types.includes('application/qaq-tab')
	const hasPanel = event.dataTransfer?.types.includes('application/qaq-panel')

	if (hasTab || hasPanel) {
		isDropTarget.value = true
		event.dataTransfer!.dropEffect = 'move'
		console.log('🎯 Drop target activated')
	}
}

const handleDrop = (event: DragEvent) => {
	event.preventDefault()
	isDropTarget.value = false

	console.log('📦 Drop event received')

	// 检查是否允许合并
	if (!props.mergeEnabled) {
		console.log('❌ Panel merge is disabled')
		return
	}

	// 处理标签页拖拽
	const tabData = event.dataTransfer?.getData('application/qaq-tab')
	if (tabData) {
		try {
			const tab = JSON.parse(tabData) as Tab
			console.log('🏷️ Tab dropped:', tab.title, 'onto panel:', props.tabs[0]?.title)
			emit('panel-merge', tab, props.tabs[0]?.id || '')
		} catch (error) {
			console.error('Failed to parse dropped tab data:', error)
		}
	}

	// 处理面板拖拽
	const panelData = event.dataTransfer?.getData('application/qaq-panel')
	if (panelData) {
		try {
			const data = JSON.parse(panelData)
			console.log('🎛️ Panel dropped:', data.tab.title, 'onto panel:', props.tabs[0]?.title)
			emit('panel-merge', data.tab, props.tabs[0]?.id || '')
		} catch (error) {
			console.error('Failed to parse dropped panel data:', error)
		}
	}
}

const handleDragLeave = (event: DragEvent) => {
	// 只有当拖拽真正离开面板时才隐藏指示器
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
	const x = event.clientX
	const y = event.clientY

	if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
		isDropTarget.value = false
	}
}

// 调整大小功能
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

const stopResize = () => {
	isResizing.value = false
	resizeDirection.value = null
	document.removeEventListener('mousemove', handleResize)
	document.removeEventListener('mouseup', stopResize)
}

// 全屏功能
const toggleFullscreen = () => {
	isFullscreen.value = !isFullscreen.value
	emit('fullscreen', isFullscreen.value)
}

// 切换合并开关
const toggleMergeEnabled = () => {
	emit('toggle-merge', !props.mergeEnabled)
}

// Header区域拖拽处理
const handleHeaderDragOver = (event: DragEvent) => {
	if (!props.mergeEnabled) {
		console.log('❌ Header drag over blocked: merge disabled')
		event.dataTransfer!.dropEffect = 'none'
		return
	}

	event.preventDefault()
	event.dataTransfer!.dropEffect = 'move'

	// 检查是否是有效的拖拽数据
	const hasTabData = event.dataTransfer?.types.includes('application/qaq-tab')
	const hasPanelData = event.dataTransfer?.types.includes('application/qaq-panel')

	console.log('🔍 Header drag over - hasTab:', hasTabData, 'hasPanel:', hasPanelData, 'types:', event.dataTransfer?.types)

	if (hasTabData || hasPanelData) {
		if (!isHeaderDropTarget.value) {
			isHeaderDropTarget.value = true
			console.log('🎯 Header drop target activated for panel:', props.tabs[0]?.title)
		}
	}
}

const handleHeaderDrop = (event: DragEvent) => {
	if (!props.mergeEnabled) {
		console.log('❌ Header drop blocked: merge disabled')
		return
	}

	event.preventDefault()
	isHeaderDropTarget.value = false

	console.log('📦 Header drop event received on panel:', props.tabs[0]?.title)
	console.log('📦 Available data types:', event.dataTransfer?.types)

	// 处理标签页拖拽到header
	const tabData = event.dataTransfer?.getData('application/qaq-tab')
	if (tabData) {
		try {
			const tab = JSON.parse(tabData) as Tab
			console.log('🏷️ Tab dropped on header:', tab.title, 'onto panel:', props.tabs[0]?.title)
			console.log('🏷️ Emitting panel-merge event with tab:', tab, 'target:', props.tabs[0]?.id)
			emit('panel-merge', tab, props.tabs[0]?.id || '')
		} catch (error) {
			console.error('❌ Failed to parse dropped tab data:', error, 'Raw data:', tabData)
		}
	}

	// 处理面板拖拽到header
	const panelData = event.dataTransfer?.getData('application/qaq-panel')
	if (panelData) {
		try {
			const data = JSON.parse(panelData)
			console.log('🎛️ Panel dropped on header:', data.tab.title, 'onto panel:', props.tabs[0]?.title)
			console.log('🎛️ Emitting panel-merge event with panel data:', data, 'target:', props.tabs[0]?.id)
			emit('panel-merge', data.tab, props.tabs[0]?.id || '')
		} catch (error) {
			console.error('❌ Failed to parse dropped panel data:', error, 'Raw data:', panelData)
		}
	}

	if (!tabData && !panelData) {
		console.log('⚠️ No valid drag data found in drop event')
	}
}

const handleHeaderDragLeave = (event: DragEvent) => {
	// 检查是否真正离开header区域
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
	const x = event.clientX
	const y = event.clientY

	if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
		isHeaderDropTarget.value = false
		console.log('🚫 Header drop target deactivated')
	}
}

// 监听props变化
watch(() => props.activeTabId, (newTabId) => {
	if (newTabId && newTabId !== activeTabId.value) {
		activeTabId.value = newTabId
	}
})

// 清理
onUnmounted(() => {
	document.removeEventListener('mousemove', handleDrag)
	document.removeEventListener('mouseup', stopDrag)
	document.removeEventListener('mousemove', handleResize)
	document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.qaq-tabbed-panel {
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

.qaq-panel-drop-target {
	border-color: var(--qaq-primary, #00DC82);
	box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.5);
}

.qaq-panel-tabs {
	display: flex;
	background: var(--qaq-editor-bg);
	border-bottom: 1px solid var(--qaq-editor-border);
	overflow-x: auto;
}

.qaq-panel-tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: var(--qaq-editor-panel);
	border-right: 1px solid var(--qaq-editor-border);
	cursor: pointer;
	user-select: none;
	transition: all 0.2s ease;
	min-width: 120px;
}

.qaq-panel-tab:hover {
	background: var(--qaq-hover-bg, rgba(0, 220, 130, 0.05));
}

.qaq-panel-tab.qaq-tab-active {
	background: var(--qaq-selection-bg, rgba(0, 220, 130, 0.1));
	border-bottom: 2px solid var(--qaq-primary, #00DC82);
}

.qaq-tab-icon {
	color: var(--qaq-primary, #00DC82);
	font-size: 12px;
}

.qaq-tab-title {
	font-size: 12px;
	font-weight: 500;
	color: var(--qaq-editor-text);
}

.qaq-tab-close {
	opacity: 0;
	transition: opacity 0.2s ease;
}

.qaq-panel-tab:hover .qaq-tab-close {
	opacity: 1;
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
	transition: all 0.2s ease;
}

.qaq-header-drop-target {
	background: rgba(0, 220, 130, 0.1);
	border: 2px solid var(--qaq-primary-500);
	box-shadow: 0 0 10px rgba(0, 220, 130, 0.3);
}

.qaq-header-merge-disabled {
	opacity: 0.7;
}

.qaq-panel-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	font-weight: 600;
	color: var(--qaq-editor-text);
	cursor: move;
	flex: 1;
}

.qaq-panel-icon {
	color: var(--qaq-primary, #00DC82);
}

.qaq-drag-hint {
	margin-left: 8px;
	font-size: 11px;
	color: var(--qaq-primary, #00DC82);
	background: rgba(0, 220, 130, 0.1);
	padding: 2px 6px;
	border-radius: 3px;
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 0.7; }
	50% { opacity: 1; }
}

.qaq-panel-controls {
	display: flex;
	gap: 4px;
}

.qaq-merge-enabled {
	color: var(--qaq-primary-500);
}

.qaq-merge-indicator {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: rgba(0, 220, 130, 0.9);
	color: white;
	padding: 12px 20px;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	z-index: 1000;
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.qaq-merge-message {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	font-size: 14px;
}

.qaq-drag-hint {
	font-size: 11px;
	color: var(--qaq-primary-400);
	margin-left: 8px;
	opacity: 0.8;
}

.qaq-panel-content {
	flex: 1;
	overflow: hidden;
}

.qaq-tab-content {
	height: 100%;
	overflow: auto;
}

.qaq-default-content {
	padding: 16px;
	text-align: center;
	color: var(--qaq-editor-text-muted);
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

.qaq-merge-indicator {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 220, 130, 0.1);
	border: 2px dashed var(--qaq-primary, #00DC82);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.qaq-merge-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: var(--qaq-primary, #00DC82);
	color: white;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
}
</style>
