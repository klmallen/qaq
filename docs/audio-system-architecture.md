# QAQ引擎音频系统架构设计

## 🎵 系统概述

QAQ引擎音频系统基于Web Audio API构建，提供完整的2D/3D音频解决方案，支持音频总线、效果处理和空间音频。

## 🏗️ 核心架构

### 1. 音频管理器 (AudioManager)
- **单例模式**：全局唯一的音频系统管理器
- **Web Audio API封装**：管理AudioContext和音频图
- **资源管理**：音频文件加载、缓存和生命周期管理
- **总线系统**：分层音频总线架构
- **3D音频支持**：与Three.js集成的空间音频

### 2. 音频节点系统

#### AudioStreamPlayer (2D音频播放器)
```typescript
// 基础2D音频播放
const player = new AudioStreamPlayer()
player.setStream({ url: 'music.mp3', loop: true, volume: 0.8, pitch: 1.0 })
player.setBus('Music')
player.play()
```

**核心功能：**
- 音频流播放控制（播放、暂停、停止）
- 音量和音调控制
- 循环播放支持
- 音频总线集成
- 播放状态管理

#### AudioStreamPlayer3D (3D音频播放器)
```typescript
// 3D空间音频播放
const player3D = new AudioStreamPlayer3D()
player3D.setStream({ url: 'ambient.mp3', loop: true, volume: 1.0, pitch: 1.0 })
player3D.setAudio3DConfig({
  maxDistance: 100.0,
  referenceDistance: 1.0,
  rolloffFactor: 1.0,
  attenuationModel: AttenuationModel.INVERSE_DISTANCE
})
player3D.position.set(10, 0, 5)
```

**核心功能：**
- 继承AudioStreamPlayer的所有功能
- 3D位置音频（基于PannerNode）
- 距离衰减模型
- 方向性音频（锥形音场）
- 自动空间位置更新

#### AudioStreamPlayer2D (2D空间音频播放器)
```typescript
// 2D平面音频播放
const player2D = new AudioStreamPlayer2D()
player2D.setStream({ url: 'effect.wav', loop: false, volume: 1.0, pitch: 1.0 })
player2D.setArea(new Rect2(0, 0, 100, 100))
player2D.position.set(50, 25)
```

**核心功能：**
- 2D平面空间音频
- 区域限制播放
- 左右声道平衡控制
- 2D距离衰减

### 3. 音频总线系统 (Audio Bus Layout)

#### 分层总线架构
```
Master (主总线)
├── Music (音乐总线)
├── SFX (音效总线)
│   ├── UI (界面音效)
│   ├── Ambient (环境音)
│   └── Combat (战斗音效)
└── Voice (语音总线)
    ├── Player (玩家语音)
    └── NPC (NPC语音)
```

#### 总线配置接口
```typescript
interface AudioBusConfig {
  name: string
  volume: number
  muted: boolean
  effects: AudioEffect[]
  parent?: string
}
```

#### 使用示例
```typescript
// 创建自定义总线
audioManager.createBus({
  name: 'Combat',
  volume: 0.9,
  muted: false,
  effects: [
    { type: 'reverb', enabled: true, parameters: { roomSize: 0.3 } },
    { type: 'compressor', enabled: true, parameters: { threshold: -12 } }
  ],
  parent: 'SFX'
})

// 设置总线音量
audioManager.setBusVolume('Combat', 0.7)
audioManager.setBusMuted('Combat', false)
```

### 4. 音频效果系统

#### AudioEffectReverb (混响效果)
```typescript
const reverb = new AudioEffectReverb()
reverb.setReverbType(ReverbType.HALL)
reverb.setRoomSize(0.8)
reverb.setDamping(0.6)
reverb.setWetLevel(0.4)
reverb.setDryLevel(0.6)
```

**支持的混响类型：**
- ROOM：房间混响
- HALL：大厅混响
- CATHEDRAL：教堂混响
- PLATE：板式混响
- SPRING：弹簧混响
- CUSTOM：自定义脉冲响应

#### AudioEffectDelay (延迟效果)
```typescript
const delay = new AudioEffectDelay()
delay.setDelayTime(0.3)
delay.setFeedback(0.4)
delay.setWetLevel(0.3)
delay.setDryLevel(0.7)
```

#### AudioEffectChorus (合唱效果)
```typescript
const chorus = new AudioEffectChorus()
chorus.setRate(1.5)
chorus.setDepth(0.3)
chorus.setDelay(0.02)
chorus.setMix(0.5)
```

#### AudioEffectCompressor (压缩器)
```typescript
const compressor = new AudioEffectCompressor()
compressor.setThreshold(-12)
compressor.setRatio(4)
compressor.setAttack(0.003)
compressor.setRelease(0.1)
```

### 5. 音频资源管理

#### 资源加载和缓存
```typescript
// 自动缓存管理
const buffer = await audioManager.loadAudioBuffer('sounds/explosion.wav')

// 预加载音频资源
await audioManager.preloadAudio([
  'music/background.mp3',
  'sfx/jump.wav',
  'voice/dialog1.mp3'
])
```

#### 音频流接口
```typescript
interface AudioStream {
  url: string          // 音频文件URL
  loop: boolean        // 是否循环播放
  volume: number       // 音量 (0.0-1.0)
  pitch: number        // 音调 (0.1-4.0)
}
```

## 🔧 集成方式

### 与Node系统集成
```typescript
// 音频节点继承自Node/Node3D
class GameScene extends Scene {
  _ready() {
    // 背景音乐
    const bgMusic = new AudioStreamPlayer()
    bgMusic.setStream({ url: 'music/bg.mp3', loop: true, volume: 0.6, pitch: 1.0 })
    bgMusic.setBus('Music')
    this.addChild(bgMusic)
    
    // 3D环境音
    const ambientSound = new AudioStreamPlayer3D()
    ambientSound.setStream({ url: 'ambient/forest.wav', loop: true, volume: 0.8, pitch: 1.0 })
    ambientSound.position.set(0, 0, 0)
    ambientSound.setMaxDistance(50)
    this.addChild(ambientSound)
  }
}
```

### 信号系统集成
```typescript
// 音频事件信号
player.connect('playback_started', this, '_on_audio_started')
player.connect('playback_finished', this, '_on_audio_finished')
player.connect('load_failed', this, '_on_audio_load_failed')
```

## 🎮 使用场景

### 1. 背景音乐系统
```typescript
class MusicManager extends Node {
  private currentTrack: AudioStreamPlayer | null = null
  
  playMusic(trackUrl: string, fadeTime: number = 1.0) {
    const newTrack = new AudioStreamPlayer()
    newTrack.setStream({ url: trackUrl, loop: true, volume: 0, pitch: 1.0 })
    newTrack.setBus('Music')
    
    // 淡入新音乐
    this.fadeIn(newTrack, fadeTime)
    
    // 淡出旧音乐
    if (this.currentTrack) {
      this.fadeOut(this.currentTrack, fadeTime)
    }
    
    this.currentTrack = newTrack
  }
}
```

### 2. 3D环境音效
```typescript
class EnvironmentAudio extends Node3D {
  _ready() {
    // 风声
    const wind = new AudioStreamPlayer3D()
    wind.setStream({ url: 'ambient/wind.wav', loop: true, volume: 0.4, pitch: 1.0 })
    wind.setMaxDistance(200)
    wind.setBus('Ambient')
    this.addChild(wind)
    
    // 水流声
    const water = new AudioStreamPlayer3D()
    water.setStream({ url: 'ambient/water.wav', loop: true, volume: 0.6, pitch: 1.0 })
    water.position.set(50, 0, 30)
    water.setMaxDistance(30)
    this.addChild(water)
  }
}
```

### 3. UI音效系统
```typescript
class UIAudioManager extends Node {
  private clickSound: AudioStreamPlayer
  private hoverSound: AudioStreamPlayer
  
  _ready() {
    this.clickSound = new AudioStreamPlayer()
    this.clickSound.setStream({ url: 'ui/click.wav', loop: false, volume: 0.8, pitch: 1.0 })
    this.clickSound.setBus('UI')
    
    this.hoverSound = new AudioStreamPlayer()
    this.hoverSound.setStream({ url: 'ui/hover.wav', loop: false, volume: 0.6, pitch: 1.0 })
    this.hoverSound.setBus('UI')
  }
  
  playClickSound() {
    this.clickSound.play()
  }
  
  playHoverSound() {
    this.hoverSound.play()
  }
}
```

## 🚀 性能优化

### 1. 音频资源优化
- **格式选择**：使用压缩格式（MP3、OGG）减少文件大小
- **采样率优化**：根据用途选择合适的采样率
- **预加载策略**：关键音频预加载，非关键音频按需加载

### 2. 内存管理
- **自动缓存清理**：LRU策略清理不常用的音频缓存
- **音频池化**：复用AudioBufferSourceNode减少GC压力
- **分帧加载**：大文件分帧解码避免阻塞主线程

### 3. 性能监控
- **播放统计**：监控同时播放的音频数量
- **内存使用**：跟踪音频缓存内存占用
- **延迟监控**：监控音频播放延迟

## 🔮 扩展功能

### 1. 动态音乐系统
- **自适应音乐**：根据游戏状态动态切换音乐层
- **无缝循环**：智能音乐循环点检测
- **情绪系统**：基于游戏情境的音乐情绪调节

### 2. 高级音频效果
- **实时频谱分析**：AnalyserNode实现音频可视化
- **自定义滤波器**：BiquadFilterNode实现EQ效果
- **音频录制**：MediaRecorder API支持音频录制

### 3. 平台适配
- **移动端优化**：触摸解锁音频上下文
- **浏览器兼容**：Web Audio API兼容性处理
- **性能降级**：低端设备音频质量自动降级

这个音频系统架构提供了完整的音频解决方案，支持从简单的2D音效到复杂的3D空间音频，具有良好的扩展性和性能表现。
