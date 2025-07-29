# QAQ游戏引擎编辑器 - 面板合并功能指南

## 🎯 **功能概述**

QAQ游戏引擎编辑器现在支持智能化的面板合并系统，提供灵活的工作区布局管理：

### **核心特性**
- ✅ **精确合并触发** - 只有拖拽到header区域才触发合并
- ✅ **合并开关控制** - 每个面板可独立控制是否允许合并
- ✅ **层叠排列支持** - 支持面板独立拖拽和层叠显示
- ✅ **视觉反馈增强** - 清晰的拖拽提示和合并指示器
- ✅ **智能权限检查** - 只有启用合并的面板才能接受合并操作

## 🔧 **1. 合并触发条件**

### **Header区域检测**
面板合并现在只在以下条件下触发：

1. **拖拽目标**：必须拖拽到目标面板的header区域（标题栏）
2. **合并权限**：目标面板必须启用了合并功能（mergeEnabled = true）
3. **视觉确认**：看到绿色边框和"释放以合并为标签页"提示时释放鼠标

```typescript
// 合并触发检查
const handleHeaderDragOver = (event: DragEvent) => {
  if (!props.mergeEnabled) return  // 检查合并权限
  
  // 只有在header区域才显示合并指示器
  isHeaderDropTarget.value = true
}
```

### **非合并区域**
- **面板内容区域**：拖拽到内容区域不会触发合并
- **空白区域**：拖拽到空白区域会分离标签页为独立面板
- **禁用合并的面板**：显示禁用状态，不接受合并操作

## 🎛️ **2. 合并开关机制**

### **面板级别控制**
每个面板都有独立的合并开关：

```typescript
interface PanelConfig {
  mergeEnabled: boolean    // 是否允许合并
  allowStacking: boolean   // 是否允许层叠排列
}
```

### **开关操作**
- **启用合并**：点击header中的 🔗 图标
- **禁用合并**：点击header中的 🔗❌ 图标
- **视觉状态**：启用时图标为绿色，禁用时为灰色

### **权限检查**
```typescript
function handlePanelMerge(sourceTab: any, targetPanelId: string) {
  // 检查目标面板是否允许合并
  const targetPanel = Object.values(panels.value).find(p => p.id === targetPanelId)
  if (!targetPanel?.mergeEnabled) {
    console.log('❌ Target panel does not allow merging')
    return
  }
  // 执行合并逻辑...
}
```

## 📚 **3. 层叠需求支持**

### **独立拖拽模式**
当面板禁用合并功能时：

- ✅ **自由移动**：可以拖拽到任意位置
- ✅ **层叠排列**：支持面板重叠显示
- ✅ **独立操作**：调整大小、全屏等功能正常工作
- ❌ **合并限制**：不能与其他面板合并

### **混合布局**
支持同时存在合并面板和独立面板：

```typescript
// 示例配置
const panels = {
  sceneTree: { mergeEnabled: true },   // 可合并
  viewport: { mergeEnabled: false },   // 独立显示
  inspector: { mergeEnabled: true }    // 可合并
}
```

## 🎨 **4. 视觉反馈系统**

### **拖拽状态指示**
- **开始拖拽**：面板显示绿色阴影
- **合并模式**：显示"拖拽到其他面板header合并"
- **独立模式**：显示"拖拽移动面板"

### **目标区域反馈**
- **可合并区域**：绿色虚线边框 + 高亮背景
- **禁用合并**：面板header显示禁用状态（透明度降低）
- **合并指示器**：显示"释放以合并为标签页"消息

### **CSS样式定义**
```css
.qaq-header-drop-target {
  background: rgba(0, 220, 130, 0.1);
  border: 2px solid var(--qaq-primary-500);
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.3);
}

.qaq-header-merge-disabled {
  opacity: 0.7;
}

.qaq-merge-enabled {
  color: var(--qaq-primary-500);
}
```

## 🚀 **5. 使用场景示例**

### **场景1：工具面板合并**
```typescript
// 将场景树和文件系统合并为一个标签页组
// 1. 启用两个面板的合并功能
panels.sceneTree.mergeEnabled = true
panels.filesystem.mergeEnabled = true

// 2. 拖拽场景树面板到文件系统面板header
// 3. 看到绿色指示器时释放鼠标
// 4. 两个面板合并为标签页模式
```

### **场景2：视口独立显示**
```typescript
// 保持3D视口独立，不与其他面板合并
panels.viewport.mergeEnabled = false
panels.viewport.allowStacking = true

// 视口可以自由拖拽和层叠，但不会被合并
```

### **场景3：混合布局**
```typescript
// 左侧：合并的工具面板组
// 中央：独立的3D视口
// 右侧：合并的属性面板组
const layout = {
  left: { merged: ['sceneTree', 'filesystem'] },
  center: { independent: 'viewport' },
  right: { merged: ['inspector', 'output'] }
}
```

## 🔧 **6. 开发者API**

### **面板配置**
```typescript
interface PanelConfig {
  id: string
  title: string
  icon: string
  mergeEnabled: boolean     // 新增：合并开关
  allowStacking: boolean    // 新增：层叠支持
  // ... 其他配置
}
```

### **事件处理**
```typescript
// 合并开关切换
@toggle-merge="(enabled) => handleToggleMerge('panelId', enabled)"

// 面板合并事件
@panel-merge="handlePanelMerge"

// 标签页分离事件
@tab-detach="handleTabDetach"
```

### **方法实现**
```typescript
function handleToggleMerge(panelId: string, enabled: boolean) {
  const panel = panels.value[panelId]
  if (panel) {
    panel.mergeEnabled = enabled
    console.log(`Panel ${panelId} merge ${enabled ? 'enabled' : 'disabled'}`)
  }
}
```

## 📋 **7. 最佳实践**

### **面板设计原则**
1. **功能相关性**：将相关功能的面板设计为可合并
2. **视口保护**：主要工作区域（如3D视口）建议设为独立模式
3. **用户选择**：提供合并开关，让用户自主选择布局方式

### **交互设计**
1. **明确指示**：确保用户清楚知道何时会触发合并
2. **容错机制**：支持误操作的撤销和恢复
3. **状态持久化**：保存用户的面板布局偏好

### **性能优化**
1. **事件防抖**：避免频繁的拖拽事件处理
2. **内存管理**：正确清理事件监听器
3. **渲染优化**：高效的DOM更新和重绘

## 🎯 **8. 演示和测试**

### **演示页面**
访问 `/panel-merge-demo` 页面体验完整的合并功能：

- 🎮 **交互演示**：三个演示面板展示不同的合并配置
- 📊 **状态监控**：实时显示面板状态和合并情况
- 🔧 **控制面板**：快速重置和切换合并模式

### **测试用例**
1. **基础合并**：拖拽面板A到面板B的header区域
2. **权限检查**：尝试合并到禁用合并的面板
3. **标签分离**：拖拽标签页到空白区域
4. **开关切换**：动态启用/禁用面板合并功能
5. **层叠模式**：禁用合并后的独立拖拽

## 🎉 **总结**

QAQ游戏引擎编辑器的面板合并功能现在提供了：

✅ **精确控制** - Header区域触发，避免误操作  
✅ **灵活配置** - 独立的合并开关和层叠支持  
✅ **智能检查** - 权限验证和状态管理  
✅ **优秀体验** - 清晰的视觉反馈和交互提示  

这套系统既满足了用户对面板合并的需求，又保持了布局的灵活性和可控性，为游戏开发提供了更加高效的工作环境！🚀
