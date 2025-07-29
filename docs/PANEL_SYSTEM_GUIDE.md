# QAQ游戏引擎编辑器 - 面板系统使用指南

## 🎯 **功能概述**

QAQ游戏引擎编辑器现在支持完整的现代化面板管理系统，包括：

1. **面板拖拽合并功能** - 将多个面板合并为标签页模式
2. **Monaco编辑器增强** - 完整的TypeScript智能提示和代码补全
3. **VSCode在线编辑器** - 集成真正的VSCode Web版本

## 🔧 **1. 面板拖拽合并功能**

### **如何操作面板合并**

#### **方法1：拖拽面板标题栏**
1. 点击并按住面板的标题栏
2. 拖拽到另一个面板上方
3. 看到绿色合并指示器时释放鼠标
4. 两个面板将合并为标签页模式

#### **方法2：拖拽标签页**
1. 在已有标签页的面板中，拖拽单个标签页
2. 拖拽到另一个面板上方
3. 释放鼠标完成合并

### **视觉反馈**
- **拖拽时**：面板显示绿色阴影和"拖拽到其他面板合并"提示
- **可合并时**：目标面板显示绿色虚线边框
- **合并指示器**：显示"释放以合并为标签页"消息

### **分离标签页**
- 拖拽标签页到空白区域可以分离为独立面板
- 支持重新排列标签页顺序

## 💻 **2. Monaco编辑器增强功能**

### **TypeScript智能提示**

#### **QAQ引擎API支持**
```typescript
import { Engine, Scene, Node3D, MeshInstance3D } from '@qaq/engine';

// 自动补全和类型检查
const engine = new Engine();
engine.initialize(); // ✅ 智能提示可用方法

const scene = new Scene();
const node = new Node3D();
node.position.x = 10; // ✅ 自动补全Vector3属性
```

#### **Three.js库支持**
```typescript
import * as THREE from 'three';

// 完整的Three.js类型定义
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial();
const mesh = new THREE.Mesh(geometry, material); // ✅ 类型安全
```

### **代码编辑功能**
- **语法高亮**：支持TypeScript、JavaScript、JSON等
- **错误提示**：实时显示语法错误和类型错误
- **自动补全**：智能代码补全和参数提示
- **代码格式化**：`Shift+Alt+F` 格式化代码
- **快速修复**：`Ctrl+.` 显示快速修复选项

### **快捷键**
- `Ctrl+S` - 保存文件
- `Ctrl+N` - 新建文件
- `Ctrl+O` - 打开文件
- `Shift+Alt+F` - 格式化代码
- `Ctrl+.` - 快速修复

## 🌐 **3. VSCode在线编辑器**

### **功能特性**
- **完整VSCode体验**：基于vscode.dev的在线版本
- **项目文件管理**：支持文件夹结构和文件操作
- **实时同步**：编辑内容与QAQ引擎项目同步
- **扩展支持**：支持VSCode扩展和主题

### **如何使用**

#### **打开VSCode编辑器**
1. 点击编辑器顶部的 `+` 按钮
2. 选择 "VSCode Editor"
3. 等待编辑器加载完成

#### **文件操作**
- **新建文件**：点击工具栏的 📄 按钮
- **打开文件夹**：点击工具栏的 📁 按钮
- **上传文件**：在文件管理对话框中点击"上传文件"
- **保存文件**：`Ctrl+S` 或点击保存按钮

#### **预设项目文件**
编辑器自动包含以下示例文件：
- `main.ts` - 主游戏脚本
- `types.d.ts` - QAQ引擎类型定义
- `package.json` - 项目配置

### **与QAQ引擎集成**
```typescript
// 在VSCode中编写的代码可以直接在QAQ引擎中运行
import { Engine, Scene, Node3D } from '@qaq/engine';

class GameManager {
  private engine: Engine;
  
  async initialize() {
    this.engine = new Engine();
    await this.engine.initialize();
    // 游戏逻辑...
  }
}
```

## 🎨 **4. 界面主题和样式**

### **统一的绿色主题**
- **主色调**：`#00DC82` (QAQ绿)
- **选中状态**：绿色边框和背景高亮
- **拖拽指示**：绿色阴影和虚线边框
- **代码高亮**：优化的暗色主题配色

### **响应式设计**
- 支持不同屏幕尺寸
- 面板自动调整布局
- 保持最佳的视觉体验

## 🚀 **5. 性能优化**

### **面板系统**
- **防抖处理**：避免频繁的拖拽事件
- **内存管理**：正确清理事件监听器
- **渲染优化**：高效的DOM更新

### **编辑器性能**
- **延迟加载**：Monaco编辑器按需加载
- **类型缓存**：TypeScript定义文件缓存
- **Canvas优化**：3D视口自适应调整

## 🔧 **6. 故障排除**

### **面板合并不工作**
1. 确保拖拽到面板的中央区域
2. 检查是否看到绿色合并指示器
3. 尝试拖拽标题栏而不是面板内容

### **VSCode编辑器加载失败**
1. 检查网络连接
2. 点击"重试"按钮
3. 使用"简化编辑器"作为备选方案

### **TypeScript提示不工作**
1. 确保文件扩展名为 `.ts`
2. 检查Monaco编辑器是否正确加载
3. 重新打开编辑器标签页

## 📚 **7. 开发者API**

### **面板管理API**
```typescript
// 获取面板标签页
const tabs = getTabsForPanel('sceneTree');

// 处理面板合并
handlePanelMerge(sourceTab, targetPanelId);

// 分离标签页
handleTabDetach(tab, position);
```

### **编辑器API**
```typescript
// 打开VSCode编辑器
editorTabs.value.openVSCodeEditor();

// 打开Monaco编辑器
editorTabs.value.openScriptEditor();

// 设置活动标签页
editorTabs.value.setActiveTab('vscode-editor');
```

## 🎯 **8. 最佳实践**

### **面板布局**
- 将相关功能的面板合并为标签页
- 保持主要工作区域（3D视口）的可见性
- 根据工作流程调整面板位置

### **代码编辑**
- 使用TypeScript获得最佳的开发体验
- 利用智能提示提高编码效率
- 定期保存和格式化代码

### **项目组织**
- 使用清晰的文件夹结构
- 为不同类型的脚本创建专门的目录
- 保持代码的模块化和可维护性

---

## 🎉 **总结**

QAQ游戏引擎编辑器现在提供了完整的现代化开发环境，包括：

✅ **灵活的面板管理** - 拖拽、合并、调整大小  
✅ **智能代码编辑** - TypeScript支持、自动补全  
✅ **专业编辑器集成** - VSCode Web版本  
✅ **统一的用户体验** - 绿色主题、响应式设计  

开始使用这些功能，提升您的游戏开发效率！🚀
