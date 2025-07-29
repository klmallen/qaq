# QAQ游戏引擎测试页面更新

## 🎯 更新概述

我已经按照您的要求，在 `test-qaq-demo` 页面上添加了对您的QAQ游戏引擎的完整测试，包括：
- ✅ 2D相机创建和控制
- ✅ 两个Button节点的创建和交互
- ✅ 节点间通信系统测试

## 🚀 访问方式

**测试页面**: `http://localhost:3001/test-qaq-demo`

## 🧪 测试功能

### **1. 引擎初始化测试**
- 点击"初始化引擎"按钮
- 测试QAQ引擎的基础初始化功能
- 验证Engine类的getInstance()方法

### **2. 基础功能测试**
点击"测试基础功能"按钮将会：

#### **模块导入测试**
```typescript
// 测试导入您的核心模块
const { default: Scene } = await import('~/core/scene/Scene')
const { default: Node2D } = await import('~/core/nodes/Node2D')
const { default: Sprite2D } = await import('~/core/nodes/2d/Sprite2D')
const { default: Button } = await import('~/core/nodes/2d/Button')
const { default: Label } = await import('~/core/nodes/2d/Label')
```

#### **场景和节点创建**
- 创建测试场景 `Test2DScene`
- 创建根节点 `Root2D`
- 创建Sprite2D节点作为测试精灵
- 创建两个Button节点进行交互测试
- 创建Label节点显示标题

#### **节点配置**
```typescript
// Sprite2D配置
const sprite = new Sprite2D('TestSprite')
sprite.position = { x: 0, y: 0, z: 0 }
sprite.size = { width: 100, height: 100 }

// Button1配置 (蓝色)
const button1 = new Button('TestButton1', {
  text: '测试按钮1',
  styles: {
    normal: {
      backgroundColor: '#007bff',
      textColor: '#ffffff'
    }
  }
})
button1.position = { x: -100, y: -100, z: 0 }

// Button2配置 (绿色)
const button2 = new Button('TestButton2', {
  text: '测试按钮2',
  styles: {
    normal: {
      backgroundColor: '#28a745',
      textColor: '#ffffff'
    }
  }
})
button2.position = { x: 100, y: -100, z: 0 }
```

#### **节点通信设置**
```typescript
// 按钮1点击事件 - 改变精灵颜色
button1.setOnPressed(() => {
  // 改变精灵颜色
  if (sprite.mesh && sprite.mesh.material) {
    sprite.mesh.material.color.setHex(Math.random() * 0xffffff)
  }
  // 通知其他节点
  button2.emit?.('button1_clicked', { sender: 'TestButton1' })
})

// 按钮2点击事件 - 移动精灵位置
button2.setOnPressed(() => {
  // 移动精灵位置
  sprite.position = {
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
    z: 0
  }
  // 通知其他节点
  button1.emit?.('button2_clicked', { sender: 'TestButton2' })
})
```

### **3. 专项功能测试**

#### **2D相机测试**
- 点击"测试2D相机"按钮
- 导入并创建Camera2D节点
- 测试相机位置和缩放设置

#### **节点通信测试**
- 点击"测试节点通信"按钮
- 显示节点通信机制的说明
- 指导如何观察节点间的消息传递

#### **按钮交互测试**
- 点击"测试按钮交互"按钮
- 显示按钮交互功能的说明
- 指导如何在画布中进行交互测试

## 🎮 预期效果

### **成功初始化后**
1. 画布中会显示：
   - 一个可变色的精灵 (中央)
   - 蓝色"测试按钮1" (左下)
   - 绿色"测试按钮2" (右下)
   - 标题文本"QAQ引擎2D测试" (上方)

### **交互效果**
1. **点击蓝色按钮**:
   - 精灵随机改变颜色
   - 控制台显示通信日志
   - 页面日志显示"按钮1被点击"

2. **点击绿色按钮**:
   - 精灵随机移动位置
   - 控制台显示通信日志
   - 页面日志显示"按钮2被点击"

## 🔍 调试信息

### **日志系统**
- 页面底部显示详细的操作日志
- 每个步骤都有时间戳记录
- 成功/失败状态清晰标识

### **错误处理**
- 完整的try-catch错误捕获
- 详细的错误信息显示
- 控制台输出调试信息

## 🧪 测试步骤

### **推荐测试流程**
1. **访问页面**: `http://localhost:3001/test-qaq-demo`
2. **初始化引擎**: 点击"初始化引擎"按钮
3. **测试基础功能**: 点击"测试基础功能"按钮
4. **观察日志**: 查看是否所有模块都成功导入
5. **测试专项功能**: 点击各个专项测试按钮
6. **交互测试**: 在画布中点击蓝色和绿色按钮
7. **查看效果**: 观察精灵颜色变化和位置移动

### **故障排除**
如果遇到问题：
1. 查看页面日志中的错误信息
2. 打开浏览器开发者工具查看控制台
3. 检查网络请求是否有失败
4. 确认所有QAQ引擎模块都存在

## 📊 测试验证点

### **引擎核心**
- ✅ Engine.getInstance() 是否正常工作
- ✅ 引擎初始化是否成功
- ✅ 场景管理是否正常

### **2D节点系统**
- ✅ Scene、Node2D、Sprite2D、Button、Label是否能正常创建
- ✅ 节点属性设置是否生效
- ✅ 节点层次结构是否正确

### **交互系统**
- ✅ 按钮点击事件是否触发
- ✅ 精灵属性是否能动态修改
- ✅ 节点间消息传递是否正常

### **渲染系统**
- ✅ 画布是否正确显示内容
- ✅ 节点是否在正确位置渲染
- ✅ 动态变化是否实时更新

## 📝 总结

现在 `test-qaq-demo` 页面完全使用您的QAQ游戏引擎进行测试，包括：

- 🎯 **完整的引擎测试**: 从初始化到场景创建
- 🎮 **2D节点测试**: Sprite2D、Button、Label等核心节点
- 📡 **通信系统测试**: 节点间消息传递机制
- 🎨 **交互测试**: 实际的用户交互和视觉反馈
- 🔍 **调试支持**: 详细的日志和错误处理

这个测试页面将帮助验证您的QAQ游戏引擎的所有核心功能是否正常工作！
