# QAQ引擎 - 场景管理系统

## 🎯 **功能概览**

基于QAQ引擎的Node反射序列化系统，实现了完整的场景管理功能：

1. **✅ 场景导出** - 将当前场景序列化为JSON文件并下载
2. **✅ 场景加载** - 从文件或拖拽加载序列化的场景数据
3. **✅ 数据清除** - 清除引擎所有数据和资源
4. **✅ 拖拽支持** - 支持拖拽JSON文件到页面加载场景
5. **✅ 进度显示** - 所有操作都有详细的进度反馈
6. **✅ 错误处理** - 完善的错误处理和用户反馈

## 🚀 **核心组件**

### **1. SceneExportManager.ts**
- 场景导出/加载的核心管理器
- 支持元数据生成和版本验证
- 提供进度回调和错误处理
- 支持文件选择和拖拽加载

### **2. Engine.clearAllData()**
- 集成到Engine类的数据清除方法
- 递归清理场景节点和Three.js资源
- 重置动画系统和脚本系统
- 释放内存和WebGL资源

### **3. SceneManagementAPI.ts**
- 提供全局API接口
- 封装常用操作为简单函数
- 自动设置进度显示和错误处理
- 导出到window对象供控制台使用

## 🎮 **使用方式**

### **基础操作**

```javascript
// 📦 导出当前场景
window.exportCurrentScene()
window.exportCurrentScene({
  fileName: 'my_awesome_scene.json',
  includeMetadata: true
})

// 📥 加载场景文件
window.loadSceneFromFile()

// 🧹 清除所有数据
window.clearEngineData()

// 🆕 创建新场景
window.createNewScene('MyNewScene')

// 📊 获取场景信息
window.getCurrentSceneInfo()
```

### **高级功能**

```javascript
// 🎯 启用拖拽加载（已自动启用）
window.setupDragAndDropLoader('body')

// 💡 显示帮助信息
window.showSceneManagementHelp()

// 📋 获取详细场景信息
const info = window.getCurrentSceneInfo()
console.log(`场景: ${info.name}, 节点数: ${info.nodeCount}`)
```

### **自定义选项**

```javascript
// 📦 自定义导出选项
window.exportCurrentScene({
  fileName: 'scene_backup.json',
  includeMetadata: true,
  compress: false,
  onProgress: (progress, message) => {
    console.log(`导出进度: ${progress}% - ${message}`)
  },
  onComplete: (fileName, dataSize) => {
    console.log(`导出完成: ${fileName} (${dataSize} 字节)`)
  }
})

// 📥 自定义加载选项
window.loadSceneFromFile({
  validateVersion: true,
  clearCurrentScene: true,
  onProgress: (progress, message) => {
    console.log(`加载进度: ${progress}% - ${message}`)
  },
  onComplete: (scene, metadata) => {
    console.log(`加载完成: ${scene.name}`)
    console.log(`元数据:`, metadata)
  }
})
```

## 📊 **导出数据格式**

### **完整数据结构**
```json
{
  "metadata": {
    "version": "1.0.0",
    "engineVersion": "3.0.0",
    "created": 1703123456789,
    "modified": 1703123456789,
    "author": "QAQ Engine User",
    "description": "场景: Demo3DScene",
    "nodeCount": 15,
    "dataSize": 2048,
    "checksum": "a1b2c3d4"
  },
  "sceneData": {
    "type": "Scene",
    "name": "Demo3DScene",
    "id": "scene_1703123456789_abc123",
    "properties": {
      "visible": true,
      "position": {"x": 0, "y": 0, "z": 0}
    },
    "children": [
      {
        "type": "Camera3D",
        "name": "MainCamera",
        "id": "camera_1703123456790_def456",
        "properties": {
          "position": {"x": 5, "y": 5, "z": 5},
          "fov": 75
        },
        "children": []
      }
    ]
  },
  "resources": {}
}
```

### **元数据说明**
- `version`: 数据格式版本
- `engineVersion`: QAQ引擎版本
- `created/modified`: 创建/修改时间戳
- `nodeCount`: 场景中的节点总数
- `dataSize`: 序列化数据大小
- `checksum`: 数据校验和

## 🔄 **工作流程**

### **导出流程**
```
1. 获取当前场景 → 2. 序列化场景数据 → 3. 生成元数据 
→ 4. 构建导出数据 → 5. 转换为JSON → 6. 创建下载
```

### **加载流程**
```
1. 选择文件 → 2. 读取文件内容 → 3. 解析JSON数据 
→ 4. 验证数据格式 → 5. 清理当前场景 → 6. 反序列化场景
```

### **清除流程**
```
1. 停止渲染循环 → 2. 清理场景数据 → 3. 清理渲染器资源
→ 4. 重置动画系统 → 5. 重置脚本系统 → 6. 清理内存
```

## 🎯 **实际应用场景**

### **1. 场景备份与恢复**
```javascript
// 备份当前场景
window.exportCurrentScene({fileName: 'backup_scene.json'})

// 恢复场景
window.loadSceneFromFile()
```

### **2. 场景模板系统**
```javascript
// 导出场景模板
window.exportCurrentScene({fileName: 'template_basic_scene.json'})

// 基于模板创建新场景
window.clearEngineData()
window.loadSceneFromFile() // 选择模板文件
```

### **3. 开发调试工作流**
```javascript
// 快速重置场景
window.clearEngineData()
window.createNewScene('DebugScene')

// 查看当前状态
window.getCurrentSceneInfo()

// 保存调试状态
window.exportCurrentScene({fileName: 'debug_state.json'})
```

### **4. 拖拽式场景加载**
```javascript
// 启用拖拽功能（已自动启用）
window.setupDragAndDropLoader('body')

// 用户可以直接拖拽.json文件到页面进行加载
// 支持视觉反馈和错误提示
```

## 🛡️ **错误处理**

### **常见错误类型**
1. **文件格式错误** - 非JSON格式或数据结构不正确
2. **版本不兼容** - 引擎版本不匹配
3. **数据损坏** - 校验和不匹配或必要字段缺失
4. **内存不足** - 场景过大导致内存溢出
5. **权限问题** - 文件读取或下载权限限制

### **错误处理机制**
```javascript
// 所有操作都有错误回调
window.exportCurrentScene({
  onError: (error) => {
    console.error('导出失败:', error.message)
    alert(`导出失败: ${error.message}`)
  }
})

window.loadSceneFromFile({
  onError: (error) => {
    console.error('加载失败:', error.message)
    alert(`加载失败: ${error.message}`)
  }
})
```

## 🎉 **集成完成**

### **在demo-3d.vue中的集成**
1. **✅ 自动导入** - SceneManagementAPI自动加载
2. **✅ 全局接口** - 所有函数导出到window对象
3. **✅ 拖拽支持** - 自动启用body区域拖拽加载
4. **✅ 帮助信息** - 启动时显示使用指南
5. **✅ 场景引用** - 自动设置当前场景引用

### **启动后可用的控制台命令**
```javascript
// 场景管理
window.exportCurrentScene()           // 导出场景
window.loadSceneFromFile()            // 加载场景
window.clearEngineData()              // 清除数据
window.createNewScene('MyScene')      // 创建场景
window.getCurrentSceneInfo()          // 场景信息

// 序列化测试
window.runSerializationFixTests()     // 序列化测试
window.testCircularReferenceFix()     // 循环引用测试

// 动画控制
window.stateMachine.setParameter("speed", 2)  // 角色移动
window.stateMachine.setTrigger("attack")      // 触发攻击
window.animationDebugger.toggle()             // 调试面板

// 帮助信息
window.showSceneManagementHelp()      // 场景管理帮助
```

## 🚀 **总结**

QAQ引擎场景管理系统现已完全集成：

1. **✅ 完整功能** - 导出、加载、清除、拖拽支持
2. **✅ 用户友好** - 进度显示、错误处理、帮助信息
3. **✅ 高度集成** - 与现有序列化系统完美兼容
4. **✅ 开发便利** - 全局API、控制台访问、自动初始化
5. **✅ 生产就绪** - 完善的错误处理和资源管理

现在开发者可以轻松地保存、加载和管理3D场景，大大提升了开发效率！🎮
