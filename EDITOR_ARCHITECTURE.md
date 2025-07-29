# QAQ游戏引擎 - 编辑器/运行时架构设计文档

## 🏗️ **架构概览**

QAQ引擎的编辑器/运行时分离系统采用了现代游戏引擎的最佳实践，实现了完整的状态隔离、序列化支持和撤销/重做功能。

```
┌─────────────────────────────────────────────────────────────┐
│                    QAQ Editor System                        │
├─────────────────────────────────────────────────────────────┤
│  EditorSystem (统一接口)                                    │
│  ├── EditorModeManager (模式管理)                           │
│  ├── SceneSerializer (序列化系统)                           │
│  └── StateManager (状态管理)                                │
├─────────────────────────────────────────────────────────────┤
│                   Core Engine                               │
│  ├── Scene (场景系统)                                       │
│  ├── Node (节点系统)                                        │
│  └── Resource (资源系统)                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **核心组件详解**

### **1. EditorModeManager - 模式管理器**

**职责**: 管理编辑器模式和运行时模式的切换

**核心功能**:
- ✅ 三种模式支持：EDITOR、PLAY、PAUSE
- ✅ 状态快照创建和恢复
- ✅ 运行时场景副本管理
- ✅ 游戏逻辑启停控制

**关键方法**:
```typescript
// 模式切换
await modeManager.switchToPlayMode()
await modeManager.switchToEditorMode()
await modeManager.switchToPauseMode()

// 状态查询
modeManager.getCurrentMode()
modeManager.isEditorMode()
modeManager.isSwitching()
```

**模式切换流程**:
```
编辑器模式 → 播放模式:
1. 保存编辑器状态快照
2. 创建运行时场景副本
3. 切换到运行时场景
4. 启动游戏逻辑

播放模式 → 编辑器模式:
1. 停止游戏逻辑
2. 清理运行时场景
3. 恢复编辑器状态
4. 重新激活编辑器场景
```

### **2. SceneSerializer - 场景序列化器**

**职责**: 场景和节点的完整序列化/反序列化

**核心功能**:
- ✅ 支持所有QAQ节点类型
- ✅ 可扩展的序列化处理器系统
- ✅ 资源引用管理
- ✅ 版本兼容性支持

**序列化数据格式**:
```typescript
interface SerializedScene {
  version: string                    // 序列化版本
  metadata: {                       // 场景元数据
    name: string
    created: number
    modified: number
  }
  root: SerializedNode              // 根节点数据
  resources: SerializedResource[]   // 资源引用
  settings: Record<string, any>     // 全局设置
}
```

**使用示例**:
```typescript
// 序列化场景
const sceneData = await serializer.serialize(scene)

// 反序列化场景
const restoredScene = await serializer.deserialize(sceneData)

// 注册自定义节点类型
serializer.registerNodeType('CustomNode', CustomNodeClass)
serializer.registerSerializationHandler('CustomNode', customHandler)
```

### **3. StateManager - 状态管理器**

**职责**: 编辑器状态管理和撤销/重做功能

**核心功能**:
- ✅ 状态快照管理
- ✅ 变更历史跟踪
- ✅ 撤销/重做栈管理
- ✅ 状态差异检测

**关键特性**:
```typescript
// 创建状态快照
const snapshotId = stateManager.createSnapshot('Scene Loaded', sceneData, 'editor')

// 记录状态变更
stateManager.recordStateChange('property', nodeId, 'Position changed', oldPos, newPos)

// 撤销/重做操作
stateManager.addUndoOperation('Add Node', executeFunc, undoFunc)
stateManager.undo()
stateManager.redo()
```

### **4. EditorSystem - 统一编辑器接口**

**职责**: 提供统一的编辑器操作接口

**核心功能**:
- ✅ 场景生命周期管理
- ✅ 模式切换封装
- ✅ 节点操作封装
- ✅ 自动保存功能

**使用示例**:
```typescript
const editor = new EditorSystem({
  autoSaveInterval: 30000,
  maxUndoSteps: 100,
  enableStateTracking: true
})

// 场景操作
await editor.createNewScene('MyScene')
await editor.loadScene('./scenes/level1.json')
await editor.saveScene('./scenes/level1.json')

// 模式切换
await editor.enterPlayMode()
await editor.enterEditorMode()

// 节点操作
editor.addNodeToScene(newNode, parentNode)
editor.removeNodeFromScene(targetNode)

// 撤销/重做
editor.undo()
editor.redo()
```

## 🔄 **数据流和状态管理**

### **编辑器模式数据流**:
```
用户操作 → EditorSystem → StateManager → 记录变更
                      ↓
                   Scene修改 → 自动保存 → 序列化
```

### **播放模式数据流**:
```
进入播放模式 → 创建场景副本 → 运行游戏逻辑
                           ↓
退出播放模式 ← 恢复编辑器状态 ← 清理运行时数据
```

### **状态隔离机制**:
1. **编辑器状态**: 存储在EditorModeManager中的快照
2. **运行时状态**: 独立的场景副本，修改不影响编辑器
3. **状态恢复**: 退出播放模式时从快照恢复编辑器状态

## 📁 **序列化格式设计**

### **场景文件结构**:
```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Level1",
    "created": 1640995200000,
    "modified": 1640995200000,
    "author": "Developer",
    "description": "First level scene"
  },
  "root": {
    "type": "Scene",
    "name": "Level1",
    "id": "scene_001",
    "properties": {},
    "children": [
      {
        "type": "Node3D",
        "name": "Player",
        "id": "node_001",
        "properties": {
          "position": { "x": 0, "y": 0, "z": 0 },
          "rotation": { "x": 0, "y": 0, "z": 0 },
          "scale": { "x": 1, "y": 1, "z": 1 }
        },
        "children": []
      }
    ]
  },
  "resources": [
    {
      "id": "mesh_001",
      "type": "Mesh",
      "path": "./assets/models/player.gltf"
    }
  ],
  "settings": {
    "gravity": { "x": 0, "y": -9.8, "z": 0 }
  }
}
```

### **版本兼容性**:
- 向后兼容旧版本场景文件
- 版本升级时自动迁移数据
- 警告不兼容的版本差异

## 🎯 **实现路线图**

### **Phase 1: 核心架构 ✅**
- [x] EditorModeManager基础实现
- [x] SceneSerializer核心功能
- [x] StateManager撤销/重做
- [x] EditorSystem统一接口

### **Phase 2: 功能完善**
- [ ] 文件系统集成
- [ ] 资源管理器集成
- [ ] 预制体系统
- [ ] 场景模板系统

### **Phase 3: 编辑器UI**
- [ ] 场景层次面板
- [ ] 属性检查器
- [ ] 资源浏览器
- [ ] 工具栏和菜单

### **Phase 4: 高级功能**
- [ ] 多场景编辑
- [ ] 协作编辑
- [ ] 版本控制集成
- [ ] 插件系统

## 🚀 **使用指南**

### **基础使用**:
```typescript
import EditorSystem from './core/editor/EditorSystem'

// 创建编辑器实例
const editor = new EditorSystem()

// 创建新场景
await editor.createNewScene('MyGame')

// 添加节点
const player = new MeshInstance3D('Player')
editor.addNodeToScene(player)

// 进入播放模式测试
await editor.enterPlayMode()

// 返回编辑器模式
await editor.enterEditorMode()

// 保存场景
await editor.saveScene('./scenes/mygame.json')
```

### **高级使用**:
```typescript
// 自定义序列化处理器
editor.getSerializer().registerSerializationHandler('CustomNode', {
  serialize: (node) => ({ ...baseData, customProperty: node.customValue }),
  deserialize: (data, node) => { node.customValue = data.customProperty }
})

// 监听编辑器事件
editor.connect('scene_saved', (path, scene) => {
  console.log(`场景已保存: ${path}`)
})

// 批量操作
editor.getStateManager().addUndoOperation('Batch Add', 
  () => nodes.forEach(n => scene.addChild(n)),
  () => nodes.forEach(n => scene.removeChild(n))
)
```

## 🔍 **调试和监控**

### **调试工具**:
```typescript
// 获取编辑器状态
const stats = editor.getStateManager().getStatistics()
console.log('状态管理统计:', stats)

// 导出场景数据
const sceneData = await editor.getSerializer().serialize(scene)
console.log('场景数据:', JSON.stringify(sceneData, null, 2))

// 查看模式切换历史
const history = editor.getModeManager().getModeHistory()
console.log('模式切换历史:', history)
```

### **性能监控**:
- 序列化/反序列化时间
- 状态快照大小
- 撤销/重做栈使用情况
- 内存使用量估算

## 🎉 **总结**

QAQ引擎的编辑器/运行时架构提供了：

1. **完整的状态隔离** - 编辑器和运行时状态完全分离
2. **强大的序列化系统** - 支持复杂场景的完整保存/加载
3. **灵活的撤销/重做** - 支持任意操作的撤销和重做
4. **可扩展的架构** - 易于添加新的节点类型和功能
5. **专业级工具** - 媲美Unity/Unreal的编辑器体验

这个架构为QAQ引擎提供了坚实的编辑器基础，支持复杂游戏项目的开发需求。🚀
