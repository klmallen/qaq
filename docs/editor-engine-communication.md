# QAQ编辑器-引擎双向通信系统

## 🎯 问题解决方案

### 核心问题
- `editorStore.state.sceneTree` 变化后，Vue组件的 `watch` 监听器没有被触发
- 引擎状态变化没有正确传播到响应式变量
- 需要一个简单可靠的双向通信系统

### 解决方案
- **统一状态管理**：所有状态存储在响应式的 `editorStore` 中
- **事件驱动更新**：引擎变化通过 `EditorEventBus` 通知编辑器
- **自动同步机制**：确保引擎状态变化自动反映到响应式变量

## 🏗️ 架构设计

### 数据流图

```
引擎状态变化 → EditorEventBus → editorStore 事件监听器 → 更新响应式状态 → 触发 Vue watch
     ↑                                                                              ↓
编辑器操作 ← EditorEngineBridge ← 编辑器方法调用 ← Vue组件交互 ← 响应式状态变化
```

### 核心组件

1. **EditorEventBus** - 事件总线
2. **editorStore** - 响应式状态管理
3. **EditorEngineBridge** - 引擎桥接器
4. **Vue组件** - 用户界面

## 📋 使用指南

### 1. 在引擎内发送状态变化通知

#### 场景变化通知
```typescript
// 在 EditorEngineBridge.ts 中
import { getEditorEventBus } from './EditorEventBus'

const eventBus = getEditorEventBus()

// 场景加载完成
eventBus.emit('scene:loaded', { 
  scene: sceneName,
  nodeCount: scene.children.length 
}, 'bridge')

// 节点添加
eventBus.notifySceneChanged('node_added', {
  nodeId: node.getInstanceId(),
  nodeName: node.name,
  parentId: parent.getInstanceId()
})

// 选择变化
eventBus.notifySelectionChanged(['node_123', 'node_456'])
```

#### 在引擎核心中发送通知
```typescript
// 在 Engine.ts 中
import { getEditorEventBus } from '../editor/EditorEventBus'

export class Engine {
  private _eventBus = getEditorEventBus()

  async changeScene(scenePath: string): Promise<Scene> {
    // ... 场景切换逻辑
    
    // 通知编辑器场景已变化
    this._eventBus.emit('scene:loaded', {
      scene: newScene.name,
      path: scenePath
    }, 'engine')
    
    return newScene
  }
}
```

### 2. 在编辑器内监听和响应变化

#### editorStore 自动监听
```typescript
// stores/editor.ts 中已经设置了自动监听
const initializeEventListeners = () => {
  // 监听场景变化事件
  eventBus.on('scene:loaded', (event) => {
    console.log('📡 收到场景加载事件:', event.data)
    // 强制触发响应式更新
    triggerSceneTreeUpdate()
  })

  eventBus.on('scene:node_added', (event) => {
    console.log('📡 收到节点添加事件:', event.data)
    updateSceneNodes()
  })
}
```

#### Vue组件中使用
```vue
<template>
  <div>
    <!-- 这个 watch 现在会正常工作 -->
    <div v-if="editorStore.state.sceneTree">
      场景已加载: {{ editorStore.currentScene?.name }}
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

// 现在这个监听器会正常触发
watch(() => editorStore.state.sceneTree, (newTree, oldTree) => {
  if (newTree) {
    console.log('🌳 场景树已更新:', newTree.currentScene?.name)
    // 执行UI更新逻辑
  }
}, { deep: true })

// 监听场景变化
watch(() => editorStore.currentScene, (newScene) => {
  if (newScene) {
    console.log('🎬 当前场景变化:', newScene.name)
    // 执行场景相关的UI更新
  }
})

// 监听节点选择变化
watch(() => editorStore.state.selectedNodeIds, (nodeIds) => {
  console.log('🎯 选择的节点:', nodeIds)
  // 更新选择相关的UI
})
</script>
```

### 3. 具体集成步骤

#### 步骤1：初始化编辑器状态
```typescript
// 在主编辑器组件中
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

onMounted(async () => {
  // 初始化引擎桥接器（会自动设置事件监听）
  await editorStore.initializeEngineBridge(containerElement)
})
```

#### 步骤2：在引擎操作中发送事件
```typescript
// 在任何引擎操作后发送通知
import { getEditorEventBus } from '@/core/editor/EditorEventBus'

const eventBus = getEditorEventBus()

// 添加节点后
function addNodeToScene(node: Node, parent: Node) {
  parent.addChild(node)
  
  // 发送通知
  eventBus.notifySceneChanged('node_added', {
    nodeId: node.getInstanceId(),
    nodeName: node.name
  })
}

// 删除节点后
function removeNodeFromScene(node: Node) {
  const parent = node.parent
  if (parent) {
    parent.removeChild(node)
    
    // 发送通知
    eventBus.notifySceneChanged('node_removed', {
      nodeId: node.getInstanceId(),
      nodeName: node.name
    })
  }
}
```

#### 步骤3：在Vue组件中响应变化
```vue
<script setup>
// 直接使用响应式状态，watch会自动工作
const sceneNodes = computed(() => editorStore.state.sceneNodes)
const hasSelection = computed(() => editorStore.state.selectedNodeIds.length > 0)

// 监听器现在会正常触发
watch(sceneNodes, (nodes) => {
  console.log('场景节点数量:', nodes.length)
})
</script>
```

## 🔧 调试和监控

### 启用调试模式
```typescript
import { getEditorEventBus } from '@/core/editor/EditorEventBus'

const eventBus = getEditorEventBus()
eventBus.setDebugMode(true) // 开启调试日志
```

### 查看事件历史
```typescript
// 在浏览器控制台中
console.log(eventBus.getEventHistory())
```

### 监控状态变化
```typescript
// 添加全局状态变化监听器
eventBus.on('scene:changed', (event) => {
  console.log('场景状态变化:', event.data)
})
```

## ✅ 验证方案

### 测试场景变化监听
```typescript
// 1. 创建新场景
await editorStore.createNewScene({ name: 'TestScene', type: '3d' })

// 2. 验证 watch 被触发
watch(() => editorStore.state.sceneTree, (tree) => {
  console.log('✅ watch 被触发:', tree?.currentScene?.name)
})

// 3. 添加节点
const newNode = new Node3D('TestNode')
editorStore.state.engineBridge?.addNodeToScene(newNode)

// 4. 验证节点列表更新
watch(() => editorStore.state.sceneNodes, (nodes) => {
  console.log('✅ 节点列表更新:', nodes.length)
})
```

## 🎉 优势总结

1. **简单可靠** - 基于成熟的事件系统和Vue响应式
2. **向后兼容** - 保持现有API不变
3. **自动同步** - 引擎变化自动反映到UI
4. **易于调试** - 内置事件历史和调试功能
5. **性能优化** - 只在真正变化时更新UI

这套系统确保了 `watch(editorStore.state.sceneTree)` 等监听器能够正常工作，解决了响应式断链的问题。
