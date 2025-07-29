# QAQ 编辑器界面原型设计

## 🎨 主编辑器界面原型

### 主编辑器完整布局
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📁File  📝Edit  🚀Project  🎬Scene  🎮Node  🔨Build  🐛Debug  ❓Help    ▶️⏸️⏹️  [Main.tscn ▼]  ⚙️Settings │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│🎬Scene          │                                                    │🔍Inspector                          │
│├─🎮Main         │                                                    │┌─📍Transform                        │
││ ├─🎯Player     │                                                    ││ Position: (0, 0, 0)               │
││ │ ├─🖼️Sprite2D  │                                                    ││ Rotation: (0°, 0°, 0°)            │
││ │ ├─⚡Collision  │           🎮 3D Viewport                          ││ Scale: (1, 1, 1)                  │
││ │ └─🎵Audio     │                                                    │└─🎨CanvasItem                      │
││ ├─🌍Environment │     [🖱️Select] [↔️Move] [🔄Rotate] [⤢Scale]        │  Visible: ✓                       │
││ └─🎯Enemies     │                                                    │  Modulate: ████ (255,255,255,255) │
│└─📁addons       │                                                    │🏷️Node                              │
│                 │                                                    │  Name: Player                      │
│📁FileSystem     │                                                    │  Owner: Main                       │
│├─📁scenes       │                                                    │  Groups: [player, character]      │
│├─📜scripts      │                                                    │🔗Connections                       │
│├─🎨textures     │                                                    │  body_entered(Area2D)              │
│├─🎵audio        │                                                    │  → _on_player_body_entered         │
│├─🎬animations   │                                                    │📋Script                            │
│└─📄Main.tscn    │                                                    │  📜PlayerController.gd             │
│                 │                                                    │  [Attach Script] [Change Script]   │
├─────────────────┼────────────────────────────────────────────────────┼─────────────────────────────────────┤
│📤Output         │                                                    │🎮Node                               │
│[INFO] Project loaded successfully                                    │🎯Player (CharacterBody2D)          │
│[INFO] Scene Main.tscn opened                                         │├─📍Position2D                       │
│[INFO] Script PlayerController.gd compiled                            │├─🖼️Sprite2D                        │
│                                                                      │├─⚡CollisionShape2D                 │
│🐛Debugger      🎬Animation      🔊Audio      🌐Network               │└─🎵AudioStreamPlayer2D             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 主编辑器详细面板说明

#### 左侧面板 (Scene + FileSystem)
```
┌─────────────────────────────────┐
│ 🎬Scene                         │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search nodes...          │ │
│ └─────────────────────────────┘ │
│ [➕] [🔗] [⚙️] [📋]              │
│                                 │
│ 🎮Main (Node2D)                 │
│ ├─🎯Player (CharacterBody2D)    │
│ │ ├─🖼️Sprite2D                  │
│ │ │ └─🎨Texture: player.png     │
│ │ ├─⚡CollisionShape2D           │
│ │ │ └─🔷Shape: RectangleShape2D  │
│ │ ├─🎵AudioStreamPlayer2D       │
│ │ └─📜Script: PlayerController  │
│ ├─🌍Environment (Node2D)        │
│ │ ├─🖼️Background               │
│ │ ├─🌳Trees (Node2D)            │
│ │ └─🏠Buildings (Node2D)        │
│ └─🎯Enemies (Node2D)            │
│   ├─👹Enemy1 (CharacterBody2D)  │
│   └─👹Enemy2 (CharacterBody2D)  │
│                                 │
├─────────────────────────────────┤
│ 📁FileSystem                    │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Filter files...          │ │
│ └─────────────────────────────┘ │
│ [📁] [🔄] [⚙️]                  │
│                                 │
│ 📁res://                        │
│ ├─📁scenes/                     │
│ │ ├─📄Main.tscn                │
│ │ ├─📄Player.tscn              │
│ │ └─📄Enemy.tscn               │
│ ├─📁scripts/                    │
│ │ ├─📜PlayerController.gd       │
│ │ ├─📜EnemyAI.gd               │
│ │ └─📜GameManager.gd           │
│ ├─📁assets/                     │
│ │ ├─📁textures/                │
│ │ │ ├─🖼️player.png             │
│ │ │ ├─🖼️enemy.png              │
│ │ │ └─🖼️background.jpg         │
│ │ ├─📁audio/                   │
│ │ │ ├─🎵jump.wav               │
│ │ │ └─🎵bgm.ogg                │
│ │ └─📁fonts/                   │
│ │   └─🔤main_font.ttf          │
│ └─📄project.godot              │
└─────────────────────────────────┘
```

#### 右侧面板 (Inspector + Node)
```
┌─────────────────────────────────┐
│ 🔍Inspector                     │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Filter properties...     │ │
│ └─────────────────────────────┘ │
│ [🔒] [📋] [⚙️]                  │
│                                 │
│ 📍Transform                     │
│ ├─Position                      │
│ │ X: [    0.0    ] 🔗          │
│ │ Y: [    0.0    ] 🔗          │
│ │ Z: [    0.0    ] 🔗          │
│ ├─Rotation                      │
│ │ X: [    0.0°   ] 🔗          │
│ │ Y: [    0.0°   ] 🔗          │
│ │ Z: [    0.0°   ] 🔗          │
│ └─Scale                         │
│   X: [    1.0    ] 🔗          │
│   Y: [    1.0    ] 🔗          │
│   Z: [    1.0    ] 🔗          │
│                                 │
│ 🎨CanvasItem                    │
│ ├─Visible: ☑️                   │
│ ├─Modulate: ████ [Color Picker] │
│ ├─Self Modulate: ████           │
│ ├─Show Behind Parent: ☐         │
│ ├─Top Level: ☐                  │
│ ├─Clip Contents: ☐              │
│ ├─Light Mask: [    1    ]       │
│ └─Visibility Layer: [    1    ] │
│                                 │
│ 🎮CharacterBody2D               │
│ ├─Motion Mode: [Grounded ▼]     │
│ ├─Up Direction: (0, -1)         │
│ ├─Slide on Ceiling: ☑️          │
│ ├─Max Slides: [    4    ]       │
│ ├─Wall Min Slide Angle: 15°     │
│ ├─Floor Stop on Slope: ☑️       │
│ ├─Floor Constant Speed: ☐       │
│ ├─Floor Block on Wall: ☑️       │
│ ├─Floor Max Angle: 45°          │
│ └─Floor Snap Length: 1.0        │
│                                 │
├─────────────────────────────────┤
│ 🎮Node                          │
│                                 │
│ 🎯Player (CharacterBody2D)      │
│ ├─📍Position2D                  │
│ ├─🖼️Sprite2D                   │
│ │ ├─🎨Texture: player.png       │
│ │ ├─📏Hframes: 4                │
│ │ ├─📏Vframes: 1                │
│ │ └─📏Frame: 0                  │
│ ├─⚡CollisionShape2D            │
│ │ └─🔷Shape: RectangleShape2D   │
│ ├─🎵AudioStreamPlayer2D        │
│ │ ├─🎵Stream: jump.wav          │
│ │ ├─🔊Volume: 0.0 dB            │
│ │ └─🔁Autoplay: ☐              │
│ └─📜Script: PlayerController.gd │
│                                 │
│ [➕Add Child] [📋Instance]       │
│ [🔗Attach Script] [⚙️Change Type] │
└─────────────────────────────────┘
```

## 📝 脚本编辑器界面原型

### 脚本编辑器完整布局
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📁File  📝Edit  🔍Search  🎮Node  🔨Build  🐛Debug  ❓Help    ▶️⏸️⏹️  [PlayerController.gd ▼]  ⚙️Settings │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│📜Scripts        │                                                    │🔍Inspector                          │
│├─📜PlayerCtrl.gd│  1  extends CharacterBody2D                       │┌─📍Transform                        │
││ ├─🔧_ready()   │  2                                                 ││ Position: (0, 0, 0)               │
││ ├─🔧_process() │  3  @export var speed: float = 300.0              ││ Rotation: (0°, 0°, 0°)            │
││ └─🔧jump()     │  4  @export var jump_velocity: float = -400.0     ││ Scale: (1, 1, 1)                  │
│├─📜EnemyAI.gd   │  5                                                 │└─🎨CanvasItem                      │
│└─📜GameMgr.gd   │  6  # Get the gravity from the project settings   │  Visible: ✓                       │
│                 │  7  var gravity = ProjectSettings.get_setting(     │  Modulate: ████                    │
│🔍Functions      │  8      "physics/2d/default_gravity")              │🏷️Node                              │
│├─🔧_ready()     │  9                                                 │  Name: Player                      │
│├─🔧_process()   │ 10  func _physics_process(delta):                  │  Script: PlayerController.gd      │
│├─🔧_input()     │ 11      # Add the gravity.                        │🔗Connections                       │
│├─🔧jump()       │ 12      if not is_on_floor():                     │  body_entered(Area2D)              │
│└─🔧move()       │ 13          velocity.y += gravity * delta         │  → _on_player_body_entered         │
│                 │ 14                                                 │📋Script Variables                  │
│📋Bookmarks     │ 15      # Handle jump.                             │  speed: 300.0                     │
│├─📌Line 10     │ 16      if Input.is_action_just_pressed("ui_up"):  │  jump_velocity: -400.0             │
│└─📌Line 25     │ 17          velocity.y = jump_velocity             │  gravity: 980.0                   │
│                 │ 18                                                 │                                    │
│🐛Breakpoints   │ 19      # Get the input direction.                 │                                    │
│├─🔴Line 16     │ 20      var direction = Input.get_axis(            │                                    │
│└─🔴Line 32     │ 21          "ui_left", "ui_right")                 │                                    │
│                 │ 22      if direction:                              │                                    │
├─────────────────┼────────────────────────────────────────────────────┼─────────────────────────────────────┤
│📤Output         │ 23          velocity.x = direction * speed        │🎮Node                               │
│[INFO] Script compiled successfully                                   │🎯Player (CharacterBody2D)          │
│[WARNING] Unused variable 'old_position' at line 45                  │├─📍Position2D                       │
│                                                                      │├─🖼️Sprite2D                        │
│🐛Debugger      📊Profiler      🔍Find Results      📋TODO           │├─⚡CollisionShape2D                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 脚本编辑器详细面板

#### 左侧面板 (Scripts + Functions + Bookmarks)
```
┌─────────────────────────────────┐
│ 📜Scripts                       │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search scripts...        │ │
│ └─────────────────────────────┘ │
│ [📄] [🔄] [⚙️]                  │
│                                 │
│ 📜PlayerController.gd ●         │
│ ├─🔧_ready()                    │
│ ├─🔧_physics_process(delta)     │
│ ├─🔧_input(event)               │
│ ├─🔧jump()                      │
│ ├─🔧move(direction)             │
│ └─🔧take_damage(amount)         │
│                                 │
│ 📜EnemyAI.gd                    │
│ ├─🔧_ready()                    │
│ ├─🔧_process(delta)             │
│ ├─🔧chase_player()              │
│ └─🔧attack()                    │
│                                 │
│ 📜GameManager.gd                │
│ ├─🔧_ready()                    │
│ ├─🔧start_game()                │
│ ├─🔧end_game()                  │
│ └─🔧update_score(points)        │
│                                 │
├─────────────────────────────────┤
│ 🔍Functions                     │
│                                 │
│ 🔧_ready() : void               │
│   Line 8                        │
│                                 │
│ 🔧_physics_process(delta) : void│
│   Line 15                       │
│                                 │
│ 🔧_input(event) : void          │
│   Line 28                       │
│                                 │
│ 🔧jump() : void                 │
│   Line 35                       │
│                                 │
│ 🔧move(direction: float) : void │
│   Line 42                       │
│                                 │
├─────────────────────────────────┤
│ 📋Bookmarks                     │
│                                 │
│ 📌Line 10: # Player setup       │
│ 📌Line 25: # Jump logic         │
│ 📌Line 40: # Movement logic     │
│ 📌Line 55: # Collision handling │
│                                 │
├─────────────────────────────────┤
│ 🐛Breakpoints                   │
│                                 │
│ 🔴Line 16: velocity.y = jump... │
│ 🔴Line 32: take_damage(10)      │
│ 🔴Line 48: if health <= 0:      │
│                                 │
│ [🗑️Clear All] [🔄Toggle All]     │
└─────────────────────────────────┘
```

#### 代码编辑区域 (带语法高亮和行号)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PlayerController.gd ● [×]                                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   1  extends CharacterBody2D                                                        │
│   2                                                                                 │
│   3  @export var speed: float = 300.0                                              │
│   4  @export var jump_velocity: float = -400.0                                     │
│   5                                                                                 │
│   6  # Get the gravity from the project settings to be synced with RigidBody nodes│
│   7  var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")       │
│   8                                                                                 │
│   9  func _ready():                                                                 │
│  10      print("Player ready!")                                                    │
│  11                                                                                 │
│  12  func _physics_process(delta):                                                  │
│  13      # Add the gravity.                                                        │
│  14      if not is_on_floor():                                                     │
│  15          velocity.y += gravity * delta                                         │
│  16  🔴                                                                             │
│  17      # Handle jump.                                                            │
│  18      if Input.is_action_just_pressed("ui_accept") and is_on_floor():          │
│  19          velocity.y = jump_velocity                                            │
│  20                                                                                 │
│  21      # Get the input direction and handle the movement/deceleration.          │
│  22      var direction = Input.get_axis("ui_left", "ui_right")                    │
│  23      if direction:                                                             │
│  24          velocity.x = direction * speed                                        │
│  25      else:                                                                     │
│  26          velocity.x = move_toward(velocity.x, 0, speed)                       │
│  27                                                                                 │
│  28      move_and_slide()                                                          │
│  29                                                                                 │
│  30  func jump():                                                                  │
│  31      if is_on_floor():                                                         │
│  32  🔴      velocity.y = jump_velocity                                            │
│  33                                                                                 │
│  34  func take_damage(amount: int):                                                │
│  35      health -= amount                                                          │
│  36      if health <= 0:                                                           │
│  37          die()                                                                 │
│                                                                                     │
│ [💾Save] [🔄Reload] [🔍Find] [🔄Replace] [📋Format] [⚙️Settings]                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 🎬 动画编辑器界面原型

### 动画编辑器完整布局
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📁File  📝Edit  🎬Animation  🎮Node  ▶️Play  ❓Help    ▶️⏸️⏹️  [player_walk ▼]  ⚙️Settings              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│🎬Animations     │                                                    │🔍Inspector                          │
│├─🚶player_walk  │                                                    │┌─🎬Animation                        │
│├─🏃player_run   │           🎮 Animation Preview                     ││ Name: player_walk                  │
│├─⚡player_jump  │                                                    ││ Length: 1.0s                       │
│├─💀player_die   │     [⏮️] [⏸️] [▶️] [⏭️] [🔄] [📹]                  ││ Loop: ✓                           │
│└─➕New...       │                                                    ││ Step: 0.1s                         │
│                 │     Frame: 15/30  Time: 0.5s                      │└─🎯Keyframe                         │
│🎯Tracks         │                                                    │  Time: 0.5                         │
│├─📍Position     │                                                    │  Value: (100, 50)                 │
│├─🔄Rotation     │                                                    │  Easing: [Linear ▼]               │
│├─📏Scale        │                                                    │  Transition: [Sine ▼]             │
│├─🎨Modulate     │                                                    │                                    │
│└─🖼️Frame        │                                                    │🎵Audio Tracks                      │
│                 │                                                    │├─🎵footstep.wav                    │
│🔧Tools          │                                                    │└─🎵jump.wav                        │
│├─🎯Add Track    │                                                    │                                    │
│├─🔑Add Key      │                                                    │                                    │
│├─✂️Cut Keys     │                                                    │                                    │
│├─📋Copy Keys    │                                                    │                                    │
│└─🗑️Delete Keys  │                                                    │                                    │
├─────────────────┼────────────────────────────────────────────────────┼─────────────────────────────────────┤
│ Timeline & Keyframes                                                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 📍Position  │◆─────◆─────────◆─────◆│ 0.0   0.25   0.5   0.75   1.0                                │ │
│ │ 🔄Rotation  │──◆─────────◆─────────◆│                                                               │ │
│ │ 📏Scale     │◆───────◆───────────◆──│                                                               │ │
│ │ 🎨Modulate  │────◆─────◆─────◆──────│                                                               │ │
│ │ 🖼️Frame     │◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆│                                                               │ │
│ │ 🎵Audio     │────🎵──────────🎵──────│                                                               │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ [🎯] Current Time: 0.5s  |  [🔍] Zoom: 100%  |  [📏] Snap: 0.1s  |  [🔄] Loop: ON                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 动画编辑器详细面板

#### 左侧面板 (Animations + Tracks + Tools)
```
┌─────────────────────────────────┐
│ 🎬Animations                    │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search animations...     │ │
│ └─────────────────────────────┘ │
│ [➕] [📋] [🗑️] [⚙️]              │
│                                 │
│ 🚶player_walk ●                 │
│ ├─Length: 1.0s                  │
│ ├─Loop: ✓                       │
│ └─FPS: 30                       │
│                                 │
│ 🏃player_run                    │
│ ├─Length: 0.8s                  │
│ ├─Loop: ✓                       │
│ └─FPS: 30                       │
│                                 │
│ ⚡player_jump                   │
│ ├─Length: 1.2s                  │
│ ├─Loop: ✗                       │
│ └─FPS: 30                       │
│                                 │
│ 💀player_die                    │
│ ├─Length: 2.0s                  │
│ ├─Loop: ✗                       │
│ └─FPS: 24                       │
│                                 │
│ ➕New Animation...               │
│                                 │
├─────────────────────────────────┤
│ 🎯Tracks                        │
│                                 │
│ 📍Position                      │
│ ├─🎯Keyframes: 4                │
│ ├─🔒Locked: ✗                   │
│ └─👁️Visible: ✓                  │
│                                 │
│ 🔄Rotation                      │
│ ├─🎯Keyframes: 3                │
│ ├─🔒Locked: ✗                   │
│ └─👁️Visible: ✓                  │
│                                 │
│ 📏Scale                         │
│ ├─🎯Keyframes: 3                │
│ ├─🔒Locked: ✗                   │
│ └─👁️Visible: ✓                  │
│                                 │
│ 🎨Modulate                      │
│ ├─🎯Keyframes: 3                │
│ ├─🔒Locked: ✗                   │
│ └─👁️Visible: ✓                  │
│                                 │
│ 🖼️Sprite Frame                  │
│ ├─🎯Keyframes: 20               │
│ ├─🔒Locked: ✗                   │
│ └─👁️Visible: ✓                  │
│                                 │
├─────────────────────────────────┤
│ 🔧Animation Tools               │
│                                 │
│ [🎯Add Track]                   │
│ [🔑Add Keyframe]                │
│ [✂️Cut Keyframes]               │
│ [📋Copy Keyframes]              │
│ [📌Paste Keyframes]             │
│ [🗑️Delete Keyframes]            │
│                                 │
│ [🔄Duplicate Track]             │
│ [📏Scale Keys]                  │
│ [🎵Add Audio Track]             │
│ [📊Add Method Track]            │
│                                 │
│ 🎛️Playback Controls             │
│ [⏮️First] [⏪Prev] [⏸️Pause]     │
│ [▶️Play] [⏩Next] [⏭️Last]       │
│ [🔄Loop] [📹Record]             │
└─────────────────────────────────┘
```

#### 时间轴和关键帧编辑区域
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Timeline: player_walk (1.0s, 30fps)                                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│     Track Name      │ 0.0    0.1    0.2    0.3    0.4    0.5    0.6    0.7    0.8    0.9    1.0         │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 📍Position          │ ◆─────────◆─────────────────◆─────────────────◆─────────────────◆                 │
│   X: 0 → 100 → 0    │                                                                                     │
│   Y: 0 → -20 → 0    │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 🔄Rotation          │ ────◆─────────────◆─────────────────────────◆─────────────────                     │
│   Z: 0° → 5° → -5°  │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 📏Scale             │ ◆─────────────◆─────────────────────────◆─────────────────                         │
│   X,Y: 1.0 → 1.1    │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 🎨Modulate          │ ──────◆─────────────◆─────────────────◆─────────────────                           │
│   Alpha: 1.0 → 0.8  │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 🖼️Sprite Frame      │ ◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆                         │
│   Frame: 0→1→2→3    │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 🎵Audio             │ ────🎵footstep.wav──────────────────🎵footstep.wav──────────────                   │
│   Volume: -6dB      │                                                                                     │
├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 📊Method Calls      │ ──────📞play_sound()─────────────📞emit_signal("step")──────────                   │
└─────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
│ 🎯Current: 0.5s  │ 🔍Zoom: [━━━━━━━━━━] 100%  │ 📏Snap: 0.1s  │ 🔄Loop: ON  │ 📹Record: OFF           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 📑 场景/脚本标签页面板原型

### 标签页面板完整布局（位于视口上方）
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📁File  📝Edit  🚀Project  🎬Scene  🎮Node  🔨Build  🐛Debug  ❓Help    ▶️⏸️⏹️  ⚙️Settings                │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│🎬Scene          │ 📑 Open Tabs                                          │🔍Inspector                          │
│├─🎮Main         │┌─────────────────────────────────────────────────────┐│┌─📍Transform                        │
││ ├─🎯Player     ││📄Main.tscn ● │📜PlayerCtrl.gd ● │📄Enemy.tscn │📜AI.gd││ Position: (0, 0, 0)               │
││ │ ├─🖼️Sprite2D  ││             │                  │             │      ││ Rotation: (0°, 0°, 0°)            │
││ │ ├─⚡Collision  │└─────────────────────────────────────────────────────┘│ Scale: (1, 1, 1)                  │
││ │ └─🎵Audio     │                                                      │└─🎨CanvasItem                      │
││ ├─🌍Environment │           🎮 3D Viewport (Main.tscn)                 │  Visible: ✓                       │
││ └─🎯Enemies     │                                                      │  Modulate: ████                    │
│└─📁addons       │     [🖱️Select] [↔️Move] [🔄Rotate] [⤢Scale]          │🏷️Node                              │
│                 │                                                      │  Name: Player                      │
│📁FileSystem     │                                                      │  Owner: Main                       │
│├─📁scenes       │                                                      │  Groups: [player]                 │
│├─📜scripts      │                                                      │🔗Connections                       │
│├─🎨textures     │                                                      │  body_entered(Area2D)              │
│├─🎵audio        │                                                      │  → _on_player_body_entered         │
│├─🎬animations   │                                                      │📋Script                            │
│└─📄Main.tscn    │                                                      │  📜PlayerController.gd             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 标签页面板详细设计

#### 标签页类型和状态
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📑 Open Tabs - Scene & Script Manager                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🎬 Scenes                          │ 📜 Scripts                                                             │
│ ┌─────────────────────────────────┐ │ ┌─────────────────────────────────────────────────────────────────┐ │
│ │📄Main.tscn ● [×]               │ │ │📜PlayerController.gd ● [×]                                      │ │
│ │📄Player.tscn [×]               │ │ │📜EnemyAI.gd [×]                                                 │ │
│ │📄Enemy.tscn [×]                │ │ │📜GameManager.gd ● [×]                                           │ │
│ │📄UI.tscn [×]                   │ │ │📜Utils.gd [×]                                                   │ │
│ │➕ New Scene                     │ │ │➕ New Script                                                    │ │
│ └─────────────────────────────────┘ │ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ 🎬 Active: Main.tscn               │ 📜 Active: PlayerController.gd                                     │
│ 🔄 Unsaved Changes: 2 files        │ 🐛 Errors: 0  ⚠️ Warnings: 3                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 标签页交互状态
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📑 Tab States & Interactions                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│ 📄 Scene Tab States:                                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ 📄Main.tscn ●     │ 📄Player.tscn     │ 📄Enemy.tscn ⚠️    │ 📄UI.tscn 🔒     │ ➕              │   │
│ │ [Active+Unsaved]  │ [Inactive+Saved]  │ [Inactive+Warning] │ [Inactive+Locked] │ [Add New]       │   │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│ 📜 Script Tab States:                                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ 📜PlayerCtrl.gd ● │ 📜EnemyAI.gd ❌   │ 📜GameMgr.gd ⚠️   │ 📜Utils.gd       │ ➕              │   │
│ │ [Active+Unsaved]  │ [Inactive+Error]  │ [Inactive+Warning] │ [Inactive+Clean]  │ [Add New]       │   │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│ 🎛️ Tab Controls:                                                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ [📌Pin Tab] [📋Duplicate] [🔄Split View] [🗑️Close Others] [💾Save All] [🔄Reload All]              │   │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│ 🔍 Quick Actions:                                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ Ctrl+T: New Tab  │ Ctrl+W: Close Tab  │ Ctrl+Shift+T: Reopen  │ Ctrl+Tab: Switch Tab              │   │
│ │ Ctrl+S: Save     │ Ctrl+Shift+S: Save All  │ F12: Go to Definition  │ Ctrl+Click: Split View      │   │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 标签页右键菜单
```
┌─────────────────────────────────────┐
│ 📑 Tab Context Menu                 │
├─────────────────────────────────────┤
│ 💾 Save                             │
│ 💾 Save As...                       │
│ 🔄 Reload                           │
│ ─────────────────────────────────── │
│ 📋 Duplicate Tab                    │
│ 🔄 Split Horizontally               │
│ 🔄 Split Vertically                 │
│ ─────────────────────────────────── │
│ 📌 Pin Tab                          │
│ 🔒 Lock Tab                         │
│ ─────────────────────────────────── │
│ 🗑️ Close                            │
│ 🗑️ Close Others                     │
│ 🗑️ Close to the Right              │
│ 🗑️ Close All                        │
│ ─────────────────────────────────── │
│ 📁 Show in FileSystem               │
│ 📋 Copy Path                        │
│ ⚙️ Properties                       │
└─────────────────────────────────────┘
```

#### 分屏视图模式
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📑 Split View Mode                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🎬Scene          │ 📑 Tabs: 📄Main.tscn ● │📜PlayerCtrl.gd ●        │🔍Inspector                          │
│├─🎮Main         │┌─────────────────────────┬─────────────────────────┐│┌─📍Transform                        │
││ ├─🎯Player     ││                         │                         ││ Position: (0, 0, 0)               │
││ │ ├─🖼️Sprite2D  ││    🎮 Scene View        │    📜 Script Editor     ││ Rotation: (0°, 0°, 0°)            │
││ │ ├─⚡Collision  ││    (Main.tscn)          │    (PlayerController)   ││ Scale: (1, 1, 1)                  │
││ │ └─🎵Audio     ││                         │                         ││                                    │
││ ├─🌍Environment ││  [🖱️Select] [↔️Move]    │  extends CharacterBody2D ││🏷️Node                              │
││ └─🎯Enemies     ││  [🔄Rotate] [⤢Scale]    │                         ││  Name: Player                      │
│└─📁addons       ││                         │  @export var speed = 300││  Script: PlayerController.gd      │
│                 ││                         │                         ││                                    │
│📁FileSystem     ││                         │  func _ready():         ││                                    │
│├─📁scenes       ││                         │      print("Ready!")    ││                                    │
│├─📜scripts      │└─────────────────────────┴─────────────────────────┘│                                    │
│├─🎨textures     │ [🔄Swap Views] [📐Resize] [❌Close Split]           │                                    │
│└─📄Main.tscn    │                                                      │                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
