<template>
  <div class="qaq-inspector-dock">
    <!-- 标题栏 -->
    <div class="qaq-dock-header">
      <h3 class="qaq-dock-title">Inspector</h3>
      <div class="qaq-dock-actions">
        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="xs"
          title="Refresh"
          @click="refreshInspector"
        />
        <UButton
          icon="i-heroicons-cog-6-tooth"
          variant="ghost"
          size="xs"
          title="Settings"
          @click="showSettings"
        />
      </div>
    </div>

    <!-- 检查器内容 -->
    <div class="qaq-inspector-content">
      <!-- 无选中节点状态 -->
      <div v-if="!selectedNode" class="qaq-empty-state">
        <UIcon name="i-heroicons-cursor-arrow-rays" class="qaq-empty-icon" />
        <p>Select a node to edit its properties</p>
      </div>

      <!-- 节点属性编辑 -->
      <div v-else class="qaq-node-inspector">
        <!-- 节点信息头部 -->
        <div class="qaq-node-header">
          <div class="qaq-node-info">
            <UIcon :name="getNodeIcon(selectedNode)" class="qaq-node-icon" />
            <div class="qaq-node-details">
              <h4 class="qaq-node-name">{{ selectedNode.name }}</h4>
              <p class="qaq-node-type">{{ selectedNode.className }}</p>
            </div>
          </div>
          <div class="qaq-node-actions">
            <UButton
              icon="i-heroicons-code-bracket"
              variant="ghost"
              size="xs"
              title="Attach Script"
              @click="attachScript"
            />
          </div>
        </div>

        <!-- 属性组列表 -->
        <div class="qaq-properties-list">
          <PropertyRenderer
            :node="selectedNode"
            @property-changed="handlePropertyChanged"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '~/stores/editor'
import { Node, Node2D, Node3D, MeshInstance3D, getFileTypeIcon } from '~/core'
import PropertyRenderer from './inspector/PropertyRenderer.vue'

// 状态管理
const editorStore = useEditorStore()

// 响应式数据
const searchQuery = ref('')

// 计算属性
const selectedNode = computed(() => editorStore.selectedNode)

// 监听选中节点变化
watch(selectedNode, (newNode, oldNode) => {
  if (newNode !== oldNode) {
    console.log('🔍 Inspector: Node selection changed:', {
      oldNode: oldNode?.name,
      newNode: newNode?.name,
      nodeType: newNode?.constructor.name
    })

    // 强制刷新属性组
    refreshInspector()
  }
}, { immediate: true, deep: true })

// 属性组配置
const propertyGroups = computed(() => {
  if (!selectedNode.value) return []

  const groups = []

  // 基础属性组
  groups.push({
    name: 'Node',
    icon: 'i-heroicons-cube',
    expanded: true,
    properties: [
      {
        name: 'name',
        label: 'Name',
        type: 'string',
        value: selectedNode.value.name,
        description: 'The name of the node'
      },
      {
        name: 'visible',
        label: 'Visible',
        type: 'boolean',
        value: selectedNode.value.visible,
        description: 'Whether the node is visible'
      },
      {
        name: 'process_mode',
        label: 'Process Mode',
        type: 'enum',
        value: selectedNode.value.processMode,
        options: [
          { label: 'Inherit', value: 0 },
          { label: 'Pausable', value: 1 },
          { label: 'When Paused', value: 2 },
          { label: 'Always', value: 3 },
          { label: 'Disabled', value: 4 }
        ],
        description: 'How the node processes'
      }
    ]
  })

  // 2D 变换属性
  if (selectedNode.value instanceof Node2D) {
    groups.push({
      name: 'Transform2D',
      icon: 'i-heroicons-arrows-pointing-out',
      expanded: true,
      properties: [
        {
          name: 'position',
          label: 'Position',
          type: 'vector2',
          value: selectedNode.value.position,
          description: '2D position in pixels'
        },
        {
          name: 'rotation',
          label: 'Rotation',
          type: 'float',
          value: selectedNode.value.rotation,
          min: -Math.PI * 2,
          max: Math.PI * 2,
          step: 0.01,
          description: 'Rotation in radians'
        },
        {
          name: 'scale',
          label: 'Scale',
          type: 'vector2',
          value: selectedNode.value.scale,
          description: '2D scale factor'
        },
        {
          name: 'skew',
          label: 'Skew',
          type: 'float',
          value: selectedNode.value.skew,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          description: 'Skew in radians'
        }
      ]
    })
  }

  // 3D 变换属性
  if (selectedNode.value instanceof Node3D) {
    groups.push({
      name: 'Transform3D',
      icon: 'i-heroicons-cube-transparent',
      expanded: true,
      properties: [
        {
          name: 'position',
          label: 'Position',
          type: 'vector3',
          value: selectedNode.value.position,
          description: '3D position in world space'
        },
        {
          name: 'rotation',
          label: 'Rotation',
          type: 'vector3',
          value: selectedNode.value.rotation,
          description: 'Rotation in radians (Euler angles)'
        },
        {
          name: 'scale',
          label: 'Scale',
          type: 'vector3',
          value: selectedNode.value.scale,
          description: '3D scale factor'
        }
      ]
    })
  }

  // MeshInstance3D 特有属性
  if (selectedNode.value instanceof MeshInstance3D) {
    groups.push({
      name: 'MeshInstance3D',
      icon: 'i-heroicons-cube',
      expanded: true,
      properties: [
        {
          name: 'cast_shadow',
          label: 'Cast Shadow',
          type: 'boolean',
          value: selectedNode.value.castShadow,
          description: 'Whether the mesh casts shadows'
        },
        {
          name: 'receive_shadow',
          label: 'Receive Shadow',
          type: 'boolean',
          value: selectedNode.value.receiveShadow,
          description: 'Whether the mesh receives shadows'
        }
      ]
    })

    // 网格信息组
    if (selectedNode.value.geometry) {
      groups.push({
        name: 'Mesh Info',
        icon: 'i-heroicons-information-circle',
        expanded: false,
        properties: [
          {
            name: 'vertex_count',
            label: 'Vertices',
            type: 'readonly',
            value: selectedNode.value.getVertexCount(),
            description: 'Number of vertices in the mesh'
          },
          {
            name: 'triangle_count',
            label: 'Triangles',
            type: 'readonly',
            value: selectedNode.value.getTriangleCount(),
            description: 'Number of triangles in the mesh'
          }
        ]
      })
    }
  }

  return groups
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

function handlePropertyChanged(propertyName: string, newValue: any) {
  if (!selectedNode.value) return

  try {
    // 直接设置属性值
    if (propertyName.includes('.')) {
      // 处理嵌套属性 (如 position.x)
      const [objectName, propName] = propertyName.split('.')
      const targetObject = (selectedNode.value as any)[objectName]
      if (targetObject && typeof targetObject === 'object') {
        targetObject[propName] = newValue
      }
    } else {
      // 直接属性
      (selectedNode.value as any)[propertyName] = newValue
    }

    // 发射属性变化信号
    selectedNode.value.emit('property_changed', propertyName, newValue)

    // 标记场景为已修改
    editorStore.markSceneModified()

  } catch (error) {
    console.error('Failed to set property:', propertyName, newValue, error)

    // 显示错误提示
    const toast = useToast()
    toast.add({
      title: 'Property Update Failed',
      description: `Failed to update ${propertyName}`,
      color: 'red'
    })
  }
}

function refreshInspector() {
  // 强制重新计算属性
  if (selectedNode.value) {
    editorStore.setSelectedNode(selectedNode.value)
  }
}

function showSettings() {
  // TODO: 显示检查器设置
  console.log('Show inspector settings')
}

function attachScript() {
  // TODO: 附加脚本到节点
  console.log('Attach script to node:', selectedNode.value?.name)
}

// 监听选中节点变化
watch(selectedNode, (newNode) => {
  if (newNode) {
    // 滚动到顶部
    const content = document.querySelector('.qaq-inspector-content')
    if (content) {
      content.scrollTop = 0
    }
  }
})
</script>

<style scoped>
.qaq-inspector-dock {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--qaq-panel-bg, #383838);
}

.qaq-dock-header {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background-color: var(--qaq-header-bg, #404040);
  border-bottom: 1px solid var(--qaq-border, #555555);
  flex-shrink: 0;
}

.qaq-dock-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
  margin: 0;
}

.qaq-dock-actions {
  display: flex;
  gap: 2px;
}

.qaq-inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.qaq-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.qaq-empty-state p {
  font-size: 14px;
  margin: 0;
}

.qaq-node-inspector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: var(--qaq-card-bg, #404040);
  border-radius: 6px;
  border: 1px solid var(--qaq-border, #555555);
}

.qaq-node-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-node-icon {
  width: 24px;
  height: 24px;
  color: var(--qaq-icon-color, #cccccc);
}

.qaq-node-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qaq-node-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
  margin: 0;
}

.qaq-node-type {
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
  margin: 0;
  opacity: 0.8;
}

.qaq-node-actions {
  display: flex;
  gap: 4px;
}

.qaq-properties-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
