# QAQ引擎 - 增强项目导出系统

## 🎯 **系统概览**

基于Godot引擎的资源管理方案，QAQ引擎现已实现完整的项目导出系统，包括：

- ✅ **Engine类集成数据加载** - `loadProjectData()`方法
- ✅ **ResourceManager资源管理** - 基于UUID的资源系统
- ✅ **跨平台路径兼容** - Windows/Mac/Linux路径处理
- ✅ **资源完整性检查** - 校验和验证和路径修复
- ✅ **依赖关系管理** - 类似Godot的资源引用系统

## 🏗️ **系统架构**

### **核心组件扩展**

```
EnhancedProjectExportSystem/
├── ProjectExportTypes.ts         # 增强的接口定义
├── ProjectExporter.ts            # 核心导出器（已增强）
├── Engine.ts                     # 集成loadProjectData方法
├── resources/
│   ├── ResourceManager.ts        # 资源管理器
│   ├── ResourceAPI.ts            # 资源管理API
│   └── test-resource-system.ts   # 资源系统测试
└── ProjectExportAPI.ts           # 全局API接口
```

### **增强的数据结构**

```
ProjectExportData (增强版)
├── metadata: ProjectMetadata           # 项目元数据
├── engineState: EngineStateData       # 引擎状态
├── sceneTree: SceneTreeData           # 场景树结构
├── scriptSystem: ScriptSystemData     # 脚本系统
├── animationSystem: AnimationSystemData # 动画系统
├── editorState: EditorStateData       # 编辑器状态
├── resourceManifest: ResourceManifest # 增强的资源清单
└── userConfig: UserConfigData         # 用户配置
```

## 🗂️ **资源管理系统**

### **ResourceReference接口（类似Godot）**

```typescript
interface ResourceReference {
  uuid: string                    // 资源唯一标识符（类似Godot的资源ID）
  type: ResourceType             // 资源类型
  originalPath: string           // 原始文件路径
  relativePath: string           // 项目相对路径
  absolutePath?: string          // 绝对路径（运行时计算）
  size: number                   // 文件大小
  checksum: string               // 文件校验和
  lastModified: number           // 最后修改时间
  dependencies: string[]         // 依赖的其他资源UUID
  metadata: ResourceMetadata     // 资源元数据
  importSettings?: ImportSettings // 导入设置（类似Godot的.import文件）
}
```

### **ResourceManifest增强版**

```typescript
interface ResourceManifest {
  version: string                // 清单版本
  projectRoot: string            // 项目根目录
  resources: Record<string, ResourceReference> // UUID -> 资源引用
  pathToUuid: Record<string, string>           // 路径 -> UUID映射
  typeIndex: Record<ResourceType, string[]>    // 类型索引
  dependencyGraph: Record<string, string[]>    // 依赖图
  totalSize: number              // 总大小
  resourceCount: number          // 资源数量
  missingResources: string[]     // 缺失资源UUID
  brokenReferences: string[]     // 损坏的引用
  lastScan: number               // 最后扫描时间
}
```

## 🔧 **Engine类集成**

### **loadProjectData方法**

```typescript
class Engine {
  /**
   * 加载项目数据
   */
  async loadProjectData(
    projectData: ProjectExportData, 
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    // 1. 验证项目数据 (10%)
    // 2. 清除当前数据 (20%)
    // 3. 恢复引擎状态 (30%)
    // 4. 恢复场景树 (50%)
    // 5. 恢复脚本系统 (70%)
    // 6. 恢复动画系统 (80%)
    // 7. 加载项目资源 (90%)
    // 8. 重新启动渲染 (100%)
  }
}
```

### **错误回滚机制**

```typescript
try {
  await this.loadProjectData(projectData, onProgress)
} catch (error) {
  // 自动回滚到清空状态
  await this.clearAllData()
  throw error
}
```

## 🎮 **使用方式**

### **Engine数据加载**

```javascript
// 通过Engine直接加载项目数据
const engine = Engine.getInstance()
await engine.loadProjectData(projectData, (progress, message) => {
  console.log(`加载进度: ${progress}% - ${message}`)
})
```

### **资源管理API**

```javascript
// 🗂️ 资源注册和管理
window.setProjectRoot('./assets')                    // 设置项目根目录
const uuid = window.registerResource('./models/character.gltf', 'model')

// 📦 资源加载
const model = await window.loadResourceByUUID(uuid)
const texture = await window.loadResourceByPath('./textures/diffuse.jpg')

// 🔍 资源信息和验证
const info = window.getResourceInfo(uuid)
const validation = await window.validateAllResources()
const manifest = window.getResourceManifest()

// 🔧 路径管理
window.updateResourcePath(uuid, './new/path/model.gltf')
const result = await window.repairResourcePaths({
  './old/path.gltf': './new/path.gltf'
})

// 🔗 依赖关系
const deps = window.getResourceDependencies(uuid)
const dependents = window.getResourceDependents(uuid)
```

### **批量资源操作**

```javascript
// 批量注册资源
const uuids = window.registerResourceBatch([
  { path: './models/character.gltf', type: 'model' },
  { path: './textures/diffuse.jpg', type: 'texture' },
  { path: './audio/bgm.mp3', type: 'audio' }
])

// 预加载资源
await window.preloadResources(uuids)

// 获取特定类型的资源
const models = window.getResourcesByType('model')
const textures = window.getResourcesByType('texture')
```

## 🔄 **跨平台路径处理**

### **路径规范化**

```typescript
// 输入路径（各种格式）
const paths = [
  'C:\\Windows\\Path\\file.txt',     // Windows绝对路径
  '/unix/path/file.txt',             // Unix绝对路径
  './relative/path/file.txt',        // 相对路径
  '../parent/path/file.txt',         // 父目录相对路径
  'simple/path/file.txt'             // 简单路径
]

// 自动规范化为统一格式
// 所有路径都转换为正斜杠分隔的格式
```

### **相对路径转换**

```typescript
// 项目根目录: /project/root
// 绝对路径: /project/root/assets/models/character.gltf
// 相对路径: assets/models/character.gltf

const resourceManager = ResourceManager.getInstance()
resourceManager.setProjectRoot('/project/root')

const uuid = resourceManager.registerResource(
  '/project/root/assets/models/character.gltf',
  ResourceType.MODEL
)

const resource = resourceManager.getResourceByUUID(uuid)
console.log(resource.relativePath) // 'assets/models/character.gltf'
```

## 🔍 **资源完整性检查**

### **校验和验证**

```typescript
// 自动计算文件校验和
const resource = {
  uuid: 'res_123',
  checksum: 'sha256:abc123def456...',
  // ...其他属性
}

// 验证资源完整性
const validation = await window.validateAllResources()
console.log('验证结果:', {
  valid: validation.valid.length,      // 有效资源数量
  missing: validation.missing.length,  // 缺失资源数量
  corrupted: validation.corrupted.length // 损坏资源数量
})
```

### **路径修复功能**

```typescript
// 资源文件移动后的路径修复
const pathMappings = {
  './old/models/character.gltf': './new/models/character.gltf',
  './old/textures/diffuse.jpg': './new/textures/diffuse.jpg'
}

const result = await window.repairResourcePaths(pathMappings)
console.log('修复结果:', {
  repaired: result.repaired.length,  // 成功修复的资源
  failed: result.failed.length       // 修复失败的资源
})
```

## 🔗 **依赖关系管理**

### **资源依赖图**

```typescript
// 资源依赖关系示例
const textureUUID = 'texture_123'
const materialUUID = 'material_456'  // 依赖 texture_123
const modelUUID = 'model_789'        // 依赖 material_456 和 texture_123

// 获取依赖关系
const materialDeps = window.getResourceDependencies(materialUUID)
// 返回: [{ uuid: 'texture_123', type: 'texture', ... }]

const textureDependents = window.getResourceDependents(textureUUID)
// 返回: [{ uuid: 'material_456', ... }, { uuid: 'model_789', ... }]
```

### **依赖关系可视化**

```
依赖关系图:
model_789 (模型)
├── material_456 (材质)
│   └── texture_123 (纹理)
└── texture_123 (纹理)

反向依赖:
texture_123 (纹理)
├── 被 material_456 依赖
└── 被 model_789 依赖
```

## 🧪 **测试验证系统**

### **资源系统测试**

```javascript
// 运行所有资源系统测试
window.runAllResourceSystemTests()

// 单独测试
window.testResourceManagerSingleton()     // 单例模式测试
window.testResourceRegistration()         // 资源注册测试
window.testResourceLookup()               // 资源查找测试
window.testPathHandling()                 // 路径处理测试
window.testManifestGeneration()           // 清单生成测试
window.testPathUpdate()                   // 路径更新测试
window.testDependencyManagement()         // 依赖关系测试
```

### **测试结果示例**

```
🗂️ 运行资源管理系统测试...

=== 测试1: 单例模式测试 ===
✅ ResourceManager单例模式正常

=== 测试2: 资源注册测试 ===
✅ 注册了 4 个测试资源
📊 注册的资源类型: model, texture, audio, script

=== 测试3: 资源查找测试 ===
✅ 通过UUID查找: 3/3 成功
✅ 通过路径查找: 3/3 成功

=== 测试4: 路径处理测试 ===
✅ 路径规范化正常
✅ 相对路径转换正常
📊 处理的路径格式: Windows, Unix, 相对路径

=== 测试5: 清单生成测试 ===
✅ 资源清单生成成功
📊 清单包含所有必需字段
📊 资源数量匹配: 3/3

=== 测试6: 路径更新测试 ===
✅ 资源路径更新成功
✅ 新路径可以找到资源
✅ 旧路径无法找到资源

=== 测试7: 依赖关系测试 ===
✅ 依赖关系设置正确
✅ 依赖查询功能正常
✅ 反向依赖查询正常

🎉 所有资源系统测试通过！
```

## 📊 **实际应用场景**

### **1. 项目迁移**

```javascript
// 项目文件夹重组后的资源路径修复
const pathMappings = {
  './assets/models/': './content/3d/models/',
  './assets/textures/': './content/2d/textures/',
  './assets/audio/': './content/audio/'
}

// 批量修复路径
for (const [oldPrefix, newPrefix] of Object.entries(pathMappings)) {
  const manifest = window.getResourceManifest()
  const updates = {}
  
  for (const [uuid, resource] of Object.entries(manifest.resources)) {
    if (resource.relativePath.startsWith(oldPrefix)) {
      const newPath = resource.relativePath.replace(oldPrefix, newPrefix)
      updates[resource.relativePath] = newPath
    }
  }
  
  await window.repairResourcePaths(updates)
}
```

### **2. 资源预加载策略**

```javascript
// 根据场景需求预加载资源
const currentSceneResources = window.getResourcesByType('model')
  .filter(resource => resource.metadata.scene === 'level1')
  .map(resource => resource.uuid)

await window.preloadResources(currentSceneResources)
console.log(`预加载了 ${currentSceneResources.length} 个场景资源`)
```

### **3. 资源依赖分析**

```javascript
// 分析资源使用情况
function analyzeResourceUsage() {
  const manifest = window.getResourceManifest()
  const usage = {}
  
  for (const [uuid, resource] of Object.entries(manifest.resources)) {
    const dependents = window.getResourceDependents(uuid)
    usage[uuid] = {
      resource: resource,
      usageCount: dependents.length,
      dependents: dependents.map(dep => dep.uuid)
    }
  }
  
  // 找出未使用的资源
  const unusedResources = Object.entries(usage)
    .filter(([uuid, info]) => info.usageCount === 0)
    .map(([uuid, info]) => info.resource)
  
  console.log(`发现 ${unusedResources.length} 个未使用的资源`)
  return { usage, unusedResources }
}
```

## 🎉 **系统优势**

### **1. Godot风格的资源管理**
- ✅ **UUID标识符** - 避免路径变更问题
- ✅ **导入设置** - 类似.import文件的配置
- ✅ **依赖追踪** - 自动管理资源依赖关系
- ✅ **类型索引** - 快速按类型查找资源

### **2. 跨平台兼容性**
- ✅ **路径规范化** - 统一处理不同平台路径格式
- ✅ **相对路径** - 项目可移植性
- ✅ **路径修复** - 自动处理文件移动
- ✅ **校验和验证** - 确保文件完整性

### **3. 开发效率提升**
- ✅ **Engine集成** - 一键加载完整项目
- ✅ **批量操作** - 高效的资源管理
- ✅ **错误回滚** - 安全的加载机制
- ✅ **完整测试** - 可靠的系统验证

### **4. 生产就绪**
- ✅ **性能优化** - 资源缓存和预加载
- ✅ **内存管理** - 智能缓存清理
- ✅ **错误处理** - 完善的异常处理
- ✅ **调试支持** - 详细的日志和帮助

## 🚀 **总结**

QAQ引擎增强项目导出系统现已完全实现：

1. **✅ Engine集成** - `loadProjectData()`方法和错误回滚
2. **✅ 资源管理** - 基于UUID的Godot风格资源系统
3. **✅ 跨平台支持** - 完整的路径兼容性处理
4. **✅ 完整性保证** - 校验和验证和路径修复
5. **✅ 依赖管理** - 智能的资源依赖关系系统
6. **✅ 开发工具** - 完整的API和测试验证

现在开发者可以享受类似Godot引擎的专业级资源管理体验！🎮
