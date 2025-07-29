<template>
  <div class="qaq-scene-tree-node">
    <!-- 节点行 -->
    <div
      class="qaq-node-row qaq-tree-node"
      :class="{
        'qaq-tree-selected': isSelected,
        'qaq-node-hover': isHovered
      }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="handleClick"
      @contextmenu="handleContextMenu"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- 展开/折叠按钮 -->
      <div class="qaq-node-expand">
        <UButton
          v-if="hasChildren"
          :icon="isExpanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          variant="ghost"
          size="xs"
          @click.stop="toggleExpanded"
        />
      </div>

      <!-- 节点图标 -->
      <div class="qaq-node-icon">
        <UIcon :name="getNodeIcon(node)" class="qaq-icon" />
      </div>

      <!-- 节点名称 -->
      <div class="qaq-node-name">
        <span
          v-if="!isRenaming"
          class="qaq-name-text"
          @dblclick="startRename"
        >
          {{ node.name }}
        </span>
        <UInput
          v-else
          ref="renameInput"
          v-model="renameName"
          size="xs"
          class="qaq-rename-input"
          @blur="finishRename"
          @keyup.enter="finishRename"
          @keyup.escape="cancelRename"
        />
      </div>

      <!-- 节点状态指示器 -->
      <div class="qaq-node-indicators">
        <!-- 可见性 -->
        <UIcon
          v-if="!node.visible"
          name="i-heroicons-eye-slash"
          class="qaq-indicator qaq-indicator-hidden"
          title="Hidden"
        />

        <!-- 锁定状态 -->
        <UIcon
          v-if="node.locked"
          name="i-heroicons-lock-closed"
          class="qaq-indicator qaq-indicator-locked"
          title="Locked"
        />

        <!-- 脚本附加 -->
        <UIcon
          v-if="hasScript"
          name="i-heroicons-code-bracket"
          class="qaq-indicator qaq-indicator-script"
          title="Has Script"
        />
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="isExpanded && hasChildren" class="qaq-node-children">
      <QaqSceneTreeNode
        v-for="child in node.children"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        :selected-node="selectedNode"
        @select="$emit('select', $event)"
        @context-menu="$emit('context-menu', $event, child)"
        @rename="$emit('rename', $event, child)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Node, Node2D, Node3D, MeshInstance3D } from '~/core'

// Props
interface Props {
  node: Node
  level: number
  selectedNode: Node | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  select: [node: Node]
  'context-menu': [event: MouseEvent, node: Node]
  rename: [node: Node, newName: string]
  delete: [node: Node]
}>()

// 响应式数据
const isExpanded = ref(true)
const isHovered = ref(false)
const isRenaming = ref(false)
const renameName = ref('')
const renameInput = ref()

// 计算属性
const isSelected = computed(() => props.selectedNode === props.node)
const hasChildren = computed(() => props.node.children.length > 0)
const hasScript = computed(() => {
  // TODO: 检查节点是否有附加脚本
  return false
})

// ========================================================================
// 节点图标
// ========================================================================

function getNodeIcon(node: Node): string {
  if (node instanceof MeshInstance3D) {
    return 'i-heroicons-cube'
  } else if (node instanceof Node3D) {
    return 'i-heroicons-cube-transparent'
  } else if (node instanceof Node2D) {
    return 'i-heroicons-square-2-stack'
  } else {
    return 'i-heroicons-circle-stack'
  }
}

// ========================================================================
// 事件处理
// ========================================================================

function handleClick() {
  emit('select', props.node)
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault()
  emit('context-menu', event, props.node)
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

// ========================================================================
// 重命名功能
// ========================================================================

function startRename() {
  if (props.node.locked) return

  isRenaming.value = true
  renameName.value = props.node.name

  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus()
      renameInput.value.select()
    }
  })
}

function finishRename() {
  if (isRenaming.value && renameName.value.trim()) {
    emit('rename', props.node, renameName.value.trim())
  }
  cancelRename()
}

function cancelRename() {
  isRenaming.value = false
  renameName.value = ''
}

// ========================================================================
// 键盘事件
// ========================================================================

function handleKeyDown(event: KeyboardEvent) {
  if (!isSelected.value) return

  switch (event.key) {
    case 'F2':
      event.preventDefault()
      startRename()
      break
    case 'Delete':
      event.preventDefault()
      if (props.node.parent) { // 不能删除根节点
        emit('delete', props.node)
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (isExpanded.value && hasChildren.value) {
        isExpanded.value = false
      } else if (props.node.parent) {
        emit('select', props.node.parent)
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (!isExpanded.value && hasChildren.value) {
        isExpanded.value = true
      } else if (hasChildren.value && props.node.children.length > 0) {
        emit('select', props.node.children[0])
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      selectPreviousNode()
      break
    case 'ArrowDown':
      event.preventDefault()
      selectNextNode()
      break
  }
}

function selectPreviousNode() {
  // TODO: 实现选择上一个节点
}

function selectNextNode() {
  // TODO: 实现选择下一个节点
}

// 监听选中状态变化
watch(isSelected, (selected) => {
  if (selected) {
    // 当节点被选中时，确保其父节点都是展开的
    let parent = props.node.parent
    while (parent) {
      // TODO: 展开父节点
      parent = parent.parent
    }
  }
})

// 监听全局键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.qaq-scene-tree-node {
  user-select: none;
}

.qaq-node-row {
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 2px;
  margin: 1px 4px;
  transition: background-color 0.1s ease;
}

.qaq-node-row:hover,
.qaq-node-hover {
  background-color: var(--qaq-hover-bg, rgba(255, 255, 255, 0.05));
}

.qaq-node-selected {
  background-color: var(--qaq-selected-bg, rgba(34, 197, 94, 0.15)) !important;
  color: var(--qaq-selected-text, #ffffff);
  border-left: 3px solid var(--qaq-accent-color, #22c55e);
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
}

.qaq-node-selected .qaq-icon {
  color: #22c55e;
}

.qaq-node-selected .qaq-name-text {
  font-weight: 500;
  color: #f0fdf4;
}

.qaq-node-expand {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qaq-node-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  flex-shrink: 0;
}

.qaq-icon {
  width: 14px;
  height: 14px;
  color: var(--qaq-icon-color, #cccccc);
}

.qaq-node-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
}

.qaq-name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qaq-rename-input {
  width: 100%;
  height: 20px;
  font-size: 12px;
}

.qaq-node-indicators {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  flex-shrink: 0;
}

.qaq-indicator {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.qaq-indicator-hidden {
  color: var(--qaq-warning-color, #ff9500);
}

.qaq-indicator-locked {
  color: var(--qaq-error-color, #ff3b30);
}

.qaq-indicator-script {
  color: var(--qaq-success-color, #34c759);
}

.qaq-node-children {
  /* 子节点容器样式 */
}

/* 拖拽相关样式 */
.qaq-node-row.qaq-drag-over {
  background-color: var(--qaq-drop-target-bg, rgba(74, 144, 226, 0.3));
  border: 1px dashed var(--qaq-drop-target-border, #4a90e2);
}

.qaq-node-row.qaq-dragging {
  opacity: 0.5;
}

/* 深度指示线 */
.qaq-node-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--qaq-tree-line, rgba(255, 255, 255, 0.1));
  margin-left: calc(var(--level, 0) * 16px + 8px);
}

/* 连接线样式 */
.qaq-scene-tree-node {
  position: relative;
}

.qaq-scene-tree-node::before {
  content: '';
  position: absolute;
  left: calc(var(--level, 0) * 16px + 16px);
  top: 12px;
  width: 8px;
  height: 1px;
  background-color: var(--qaq-tree-line, rgba(255, 255, 255, 0.1));
}

.qaq-scene-tree-node::after {
  content: '';
  position: absolute;
  left: calc(var(--level, 0) * 16px + 16px);
  top: 0;
  bottom: 50%;
  width: 1px;
  background-color: var(--qaq-tree-line, rgba(255, 255, 255, 0.1));
}

.qaq-scene-tree-node:last-child::after {
  bottom: 50%;
}
</style>
