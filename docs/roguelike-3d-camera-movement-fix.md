# QAQ游戏引擎 Roguelike-3D 相机和移动修复

## 问题诊断 🔍

根据用户反馈和截图分析，发现以下问题：

1. **相机角度不是俯视角** - 相机角度太平，不是从上往下看
2. **玩家无法移动** - 键盘输入可能没有正确响应
3. **相机跟随不正确** - 相机没有正确跟随玩家

## 修复方案 ✅

### 1. 相机角度修复

#### 问题分析
原来的相机设置角度不够陡峭，不是真正的俯视角。

#### 修复方案
```typescript
// 真正的俯视角设置
const camera = new Camera3D('MainCamera')
camera.position = { x: 0, y: 20, z: 3 }  // 更高的高度，更少的Z偏移
camera.lookAt({ x: 0, y: 0, z: 0 })      // 直接看向中心
camera.setPerspective(60, 0.1, 100)      // 适中的视野角度
```

#### 动态相机跟随优化
```typescript
private updateCamera(): void {
  const scene = this.node.getTree()?.currentScene
  const camera = scene?.findChild('MainCamera', true)
  if (camera) {
    const playerPos = this.node.position
    // 真正的俯视角：相机在玩家正上方
    camera.position = {
      x: playerPos.x,
      y: 20,           // 固定高度，保持俯视角
      z: playerPos.z + 3   // 稍微偏后获得更好视角
    }
    
    // 相机始终看向玩家位置
    camera.lookAt({
      x: playerPos.x,
      y: playerPos.y,
      z: playerPos.z
    })
  }
}
```

### 2. 玩家移动修复

#### 问题分析
玩家移动可能因为以下原因失效：
- 键盘事件绑定问题
- 脚本系统初始化问题
- 相机跟随逻辑错误

#### 修复方案

##### 双重键盘监听系统
```typescript
// 1. PlayerController内部监听（主要方案）
_ready(): void {
  document.addEventListener('keydown', this.onKeyDown.bind(this))
  document.addEventListener('keyup', this.onKeyUp.bind(this))
}

// 2. 全局键盘监听（备用方案）
onMounted(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (!gameStarted.value || !player) return
    
    switch (event.key.toLowerCase()) {
      case 'w': movePlayer('forward'); break
      case 's': movePlayer('backward'); break
      case 'a': movePlayer('left'); break
      case 'd': movePlayer('right'); break
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
})
```

##### 增强的移动函数
```typescript
function movePlayer(direction: string): void {
  if (!player) return
  
  const controller = player.getScript('PlayerController') as PlayerController
  if (controller) {
    // 使用脚本控制器
    controller.move(direction)
  } else {
    // 备用方案：直接移动玩家
    const currentPos = player.position
    let newPos = { ...currentPos }
    
    switch (direction) {
      case 'forward': newPos.z -= 1; break
      case 'backward': newPos.z += 1; break
      case 'left': newPos.x -= 1; break
      case 'right': newPos.x += 1; break
    }
    
    if (Math.abs(newPos.x) <= 8 && Math.abs(newPos.z) <= 8) {
      player.position = newPos
      updateCameraManually()  // 手动更新相机
    }
  }
}
```

### 3. 调试和测试功能

#### 添加调试输出
```typescript
// 键盘事件调试
private onKeyDown(event: KeyboardEvent): void {
  this.keys[event.code] = true
  console.log(`按键按下: ${event.code}`)
}

// 移动调试
_process(delta: number): void {
  // ... 移动逻辑 ...
  if (length > 0) {
    console.log(`移动方向: (${moveX.toFixed(2)}, ${moveZ.toFixed(2)})`)
    console.log(`玩家位置: (${newX.toFixed(1)}, ${newZ.toFixed(1)})`)
  }
}
```

#### 测试按钮
```typescript
// 添加测试相机按钮
function testCameraUpdate(): void {
  if (!player) return
  
  const camera = scene?.findChild('MainCamera', true)
  if (camera) {
    const playerPos = player.position
    
    // 强制设置俯视角
    camera.position = {
      x: playerPos.x,
      y: 25,  // 更高的高度
      z: playerPos.z + 2
    }
    
    camera.lookAt({
      x: playerPos.x,
      y: playerPos.y,
      z: playerPos.z
    })
    
    console.log('✅ 相机已更新到俯视角')
  }
}
```

## 关键修复点 🎯

### 1. 相机高度和角度
- **高度提升**：从y=15提升到y=20-25
- **Z偏移减少**：从z=10减少到z=2-3
- **固定俯视角**：相机始终从上方看向玩家

### 2. 移动系统可靠性
- **双重监听**：脚本内监听 + 全局监听
- **备用移动**：直接位置更新作为备用方案
- **边界检查**：确保玩家在有效区域内移动

### 3. 相机跟随优化
- **实时更新**：每次移动都更新相机位置
- **手动更新**：提供手动相机更新函数
- **调试功能**：测试按钮验证相机功能

## 使用指南 📖

### 测试步骤
1. **启动游戏**：点击"开始游戏"按钮
2. **测试移动**：
   - 使用WASD键移动
   - 使用界面按钮移动
   - 观察控制台调试输出
3. **测试相机**：
   - 点击"测试相机"按钮
   - 检查相机是否切换到俯视角
4. **验证功能**：
   - 确认玩家能够移动
   - 确认相机跟随玩家
   - 确认俯视角度正确

### 调试信息
打开浏览器控制台，查看以下调试信息：
- `按键按下: KeyW` - 键盘输入检测
- `移动方向: (0.00, -1.00)` - 移动向量
- `玩家位置: (0.0, -1.0)` - 玩家坐标
- `相机跟随玩家: (0.0, -1.0)` - 相机更新

### 故障排除
如果仍然无法移动：
1. 检查控制台是否有键盘事件输出
2. 点击"测试相机"按钮验证相机功能
3. 使用界面按钮进行移动测试
4. 确认游戏画布获得了焦点

## 预期效果 🎉

修复后应该看到：
- ✅ **真正的俯视角**：从上方45-60度角俯视场景
- ✅ **流畅的玩家移动**：WASD键实时响应
- ✅ **相机跟随**：相机始终跟随玩家移动
- ✅ **调试信息**：控制台显示移动和相机更新信息
- ✅ **备用控制**：界面按钮可以作为备用控制方案

现在的Roguelike-3D游戏应该提供完整的俯视角游戏体验！
