# QAQ游戏引擎调试工具

这个目录包含了用于调试QAQ游戏引擎核心功能的纯JavaScript工具，不依赖Vue.js或Nuxt.js框架。

## 🛠️ 调试工具概览

### 1. 主调试控制台 (`index.html`)
一个完整的Web界面，用于测试和监控QAQ引擎的各项功能。

**功能特性：**
- 🧪 **核心功能测试**：Engine单例、Camera3D映射、位置同步等
- 📷 **相机系统调试**：可视化3D相机测试环境
- ⚡ **性能监控**：实时性能分析和基准测试
- 📋 **系统日志**：完整的调试日志记录和导出

**使用方法：**
```bash
# 在浏览器中打开
open debug/index.html
# 或者使用本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000/debug/
```

### 2. 3D相机调试器 (`camera-debug.html`)
专门用于测试Camera3D系统的可视化调试环境。

**功能特性：**
- 🎮 **轨道控制器**：鼠标拖拽旋转、滚轮缩放、右键平移
- 📍 **位置测试**：测试极端位置设置（如y=-200）
- 🔄 **激活测试**：验证相机激活机制
- 📊 **实时状态监控**：相机位置、控制器状态等

**控制方式：**
- **左键拖拽**：旋转相机视角
- **右键拖拽**：平移视角目标点
- **滚轮**：缩放相机距离
- **F1键**：切换调试面板显示

### 3. 核心功能测试 (`core-test.js`)
纯JavaScript的核心功能测试模块，可在浏览器或Node.js环境中运行。

**测试项目：**
- ✅ Engine类基础功能
- ✅ Camera3D节点功能
- ✅ 位置映射和同步
- ✅ 相机激活机制
- ✅ 投影参数设置
- ✅ lookAt功能
- ✅ 性能基准测试

### 4. Node.js测试运行器 (`test-runner.js`)
命令行测试工具，用于在Node.js环境中测试引擎核心功能。

**使用方法：**
```bash
# 运行所有测试
node debug/test-runner.js

# 显示帮助信息
node debug/test-runner.js --help

# 详细输出模式
node debug/test-runner.js --verbose

# 快速测试（跳过性能测试）
node debug/test-runner.js --quick
```

## 🚀 快速开始

### 方式1：Web界面调试
1. 打开 `debug/index.html`
2. 点击"Run All Tests"开始测试
3. 查看测试结果和状态信息
4. 使用"Open Camera Debug"打开3D调试环境

### 方式2：命令行调试
```bash
# 进入项目根目录
cd qaq-game-engine

# 运行Node.js测试
node debug/test-runner.js

# 查看测试报告
cat debug/test-report.json
```

### 方式3：浏览器控制台调试
```javascript
// 在浏览器控制台中直接运行
const tester = new QAQCoreTest();
await tester.runAllTests();

// 查看测试结果
console.log(tester.exportResults());
```

## 📊 测试报告示例

### 成功的测试输出
```
🚀 Starting QAQ Engine Core Tests...
=====================================
✅ PASS: Engine singleton pattern works
✅ PASS: Camera3D name property works
✅ PASS: Position test 1: (0, 0, 0)
✅ PASS: Position test 2: (10, 20, 30)
✅ PASS: Position test 3: (-5, -10, -15)
✅ PASS: Position test 4: (0, -200, -30)
✅ PASS: THREE.js sync test 1
✅ PASS: THREE.js sync test 2
✅ PASS: THREE.js sync test 3
✅ PASS: THREE.js sync test 4
=====================================
📊 TEST REPORT
Total Tests: 10
Passed: 10 ✅
Failed: 0 ❌
Errors: 0 🚨
Success Rate: 100%
```

### 性能测试输出
```
⚡ Running performance tests...
📊 Position setting performance: 0.023ms per operation
✅ Position setting performance is acceptable (< 1ms)
```

## 🔧 调试功能详解

### Camera3D位置映射测试
测试Camera3D节点的position属性是否正确同步到THREE.js对象：

```javascript
// 测试极端位置
camera.position = { x: 0, y: -200, z: -30 };

// 验证同步状态
const synced = Math.abs(camera.object3D.position.y + 200) < 0.001;
console.log('位置同步:', synced ? '✅ 成功' : '❌ 失败');
```

### 相机激活机制测试
验证相机激活和Engine集成：

```javascript
// 激活相机
camera.makeCurrent();

// 检查状态
console.log('相机激活状态:', camera.current);
console.log('引擎当前相机:', engine.getCurrentCamera() === camera);
```

### 轨道控制器测试
测试鼠标交互和相机控制：

```javascript
// 创建轨道控制器
const controller = new OrbitController(camera, { x: 0, y: 0, z: 0 });

// 配置参数
controller.setRotateSpeed(0.5);
controller.setZoomSpeed(0.8);
controller.setDistanceLimits(5, 50);

// 获取状态
console.log('控制器状态:', controller.getStatus());
```

## 🐛 故障排除

### 常见问题

1. **THREE.js未加载**
   ```
   错误: THREE is not defined
   解决: 确保在HTML中包含THREE.js库
   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
   ```

2. **模块导入失败**
   ```
   错误: Cannot resolve module
   解决: 使用相对路径或确保文件存在
   ```

3. **相机位置不更新**
   ```
   问题: 位置设置后没有视觉变化
   检查: 
   - camera.object3D是否存在
   - THREE.js相机是否正确同步
   - 渲染循环是否正常运行
   ```

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在浏览器控制台中
   localStorage.setItem('qaq-debug', 'true');
   ```

2. **检查对象状态**
   ```javascript
   // 检查相机状态
   console.log('Camera status:', camera.getCameraStatus());
   
   // 检查Engine状态
   console.log('Engine camera:', engine.getCurrentCamera());
   ```

3. **性能分析**
   ```javascript
   // 测量操作耗时
   console.time('position-setting');
   camera.position = { x: 10, y: 20, z: 30 };
   console.timeEnd('position-setting');
   ```

## 📝 开发建议

### 添加新测试
1. 在 `core-test.js` 中添加新的测试方法
2. 在 `runAllTests()` 中调用新测试
3. 更新 `index.html` 中的UI界面

### 扩展调试功能
1. 创建新的调试页面
2. 添加到主控制台的标签页中
3. 实现相应的测试逻辑

### 性能优化
1. 使用 `performance.now()` 测量精确时间
2. 批量测试以获得平均性能数据
3. 监控内存使用情况

## 🎯 下一步计划

- [ ] 添加Scene3D节点测试
- [ ] 实现材质和纹理测试
- [ ] 添加物理引擎集成测试
- [ ] 创建自动化CI/CD测试流程
- [ ] 实现可视化性能分析图表

---

**注意**: 这些调试工具是为了开发和测试QAQ引擎核心功能而设计的，不应该在生产环境中使用。
