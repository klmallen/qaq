# QAQ游戏引擎 - 基础3D场景演示

这个演示展示了QAQ游戏引擎的核心功能，包括场景管理、3D渲染、资源加载等完整的游戏开发流程。

## 🎯 演示内容

### 核心功能展示
- **Engine场景管理集成** - SceneTree与Engine的深度集成
- **3D场景创建和管理** - Scene、Node3D、Camera3D、MeshInstance3D
- **资源加载系统** - ResourceLoader多格式模型加载
- **场景切换系统** - 多种过渡效果的场景切换
- **实时3D渲染** - Three.js集成的高性能渲染

### 技术特性
- **Godot风格架构** - 完整的节点树和场景系统
- **统一渲染管道** - Engine + SceneTree + Three.js集成
- **智能资源管理** - 缓存、预加载、内存管理
- **完整生命周期** - 场景加载、运行、切换、卸载

## 🚀 快速开始

### 方法1: 直接打开HTML文件
1. 确保有现代浏览器（Chrome、Firefox、Safari、Edge）
2. 直接双击打开 `index.html` 文件
3. 浏览器会自动加载演示

### 方法2: 本地服务器运行（推荐）
```bash
# 在项目根目录启动简单HTTP服务器
cd qaq-game-engine/examples/basic-3d-scene

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (需要安装http-server)
npx http-server -p 8000

# 然后在浏览器访问
# http://localhost:8000
```

## 🎮 操作指南

### 引擎初始化
1. 页面加载后会自动初始化QAQ游戏引擎
2. 观察"引擎状态"面板的初始化进度
3. 等待状态变为"引擎就绪"

### 场景管理操作
1. **创建主场景** - 创建游戏的主场景
2. **添加相机** - 添加Camera3D节点到场景
3. **添加3D对象** - 添加MeshInstance3D网格对象

### 场景切换演示
1. **切换到菜单** - 演示淡入淡出过渡效果
2. **切换到游戏** - 演示推拉过渡效果
3. **切换到设置** - 演示立即切换效果

### 模型加载演示
1. **加载立方体** - 演示基础几何体加载
2. **加载球体** - 演示球形几何体加载
3. **加载复杂模型** - 演示组合模型加载

### 渲染控制
1. **开始渲染** - 启动实时渲染循环
2. **停止渲染** - 停止渲染循环
3. **显示统计** - 切换实时统计信息显示

## 📊 实时信息面板

演示页面底部的"实时信息"面板显示：
- 当前场景名称和状态
- 场景类型和节点数量
- 场景栈深度
- 内存使用情况
- 运行时间和帧数
- 渲染状态

## 🔧 技术架构

### 核心组件
```
QAQ游戏引擎
├── Engine (引擎核心)
│   ├── SceneTree (场景管理器)
│   ├── ResourceLoader (资源加载器)
│   └── Three.js Renderer (渲染器)
├── Scene (场景系统)
│   ├── Node3D (3D节点基类)
│   ├── Camera3D (3D相机)
│   └── MeshInstance3D (3D网格实例)
└── PackedScene (场景序列化)
```

### 渲染流程
1. **Engine初始化** - 创建Three.js渲染器和场景图
2. **SceneTree集成** - 场景管理器与Engine集成
3. **场景创建** - 创建QAQ场景和节点树
4. **Three.js同步** - QAQ节点树同步到Three.js场景图
5. **渲染循环** - Engine驱动的实时渲染

## 🎨 自定义和扩展

### 添加新的3D对象
```javascript
// 创建自定义几何体
const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
const material = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
const torus = new THREE.Mesh(geometry, material);

// 添加到场景
engine.scene.add(torus);
```

### 自定义场景切换效果
```javascript
await engine.changeScene(newScene, {
    mode: 'CUSTOM',
    duration: 1000,
    customTransition: async (from, to) => {
        // 自定义过渡逻辑
        console.log(`自定义切换: ${from?.name} -> ${to.name}`);
    }
});
```

### 添加光照效果
```javascript
// 环境光
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
engine.scene.add(ambientLight);

// 方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
engine.scene.add(directionalLight);
```

## 🐛 故障排除

### 常见问题

1. **页面空白或无响应**
   - 检查浏览器控制台是否有错误信息
   - 确保浏览器支持WebGL
   - 尝试使用本地服务器运行

2. **Three.js加载失败**
   - 检查网络连接
   - 确保CDN链接可访问
   - 可以下载Three.js到本地使用

3. **渲染性能问题**
   - 减少场景中的3D对象数量
   - 检查显卡驱动是否最新
   - 关闭其他占用GPU的应用

### 浏览器兼容性
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📚 相关文档

- [QAQ游戏引擎开发文档](../../docs/development-progress.md)
- [Engine API文档](../../core/engine/Engine.ts)
- [Scene系统文档](../../core/scene/Scene.ts)
- [ResourceLoader文档](../../core/resources/ResourceLoader.ts)

## 🤝 贡献

欢迎提交问题报告和改进建议！

## 📄 许可证

本演示遵循QAQ游戏引擎的开源许可证。
