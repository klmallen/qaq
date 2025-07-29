# QAQ 编辑器 Iconify 图标系统

## 🎨 图标系统概览

QAQ 编辑器使用 Iconify 作为主要图标解决方案，结合 Nuxt UI Pro 的颜色系统，提供丰富的图标支持。

### 核心技术栈
- **Iconify**: 200,000+ 开源矢量图标
- **@nuxt/icon**: Nuxt 3 官方图标模块
- **unplugin-icons**: Vite 图标插件
- **Nuxt UI Pro**: 颜色和主题系统

## 📦 安装配置

### 1. 依赖安装
```bash
# 核心依赖
npm install @iconify/vue @iconify/json
npm install @nuxt/icon

# 开发依赖 (可选，用于更好的开发体验)
npm install -D unplugin-icons @iconify/tools
```

### 2. Nuxt 配置
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/icon'
  ],
  icon: {
    // 预加载常用图标集
    collections: [
      'material-symbols',
      'lucide',
      'tabler',
      'carbon',
      'heroicons',
      'mdi'
    ],
    // 自定义图标目录
    customCollections: [
      {
        prefix: 'qaq',
        dir: './assets/icons'
      }
    ]
  }
})
```

### 3. Vite 配置 (如果不使用 Nuxt)
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default defineConfig({
  plugins: [
    Icons({
      compiler: 'vue3',
      customCollections: {
        'qaq': FileSystemIconLoader('./src/assets/icons')
      }
    })
  ]
})
```

## 🎯 图标分类系统

### 节点类型图标 (Node Icons)

#### 基础节点
```typescript
const NODE_ICONS = {
  // 基础节点
  'Node': 'material-symbols:radio-button-unchecked',
  'Node2D': 'material-symbols:2d',
  'Node3D': 'material-symbols:3d-rotation',

  // 2D 节点
  'Sprite2D': 'material-symbols:image-outline',
  'AnimatedSprite2D': 'material-symbols:animation',
  'Label': 'material-symbols:text-fields',
  'RichTextLabel': 'material-symbols:text-format',
  'TextEdit': 'material-symbols:edit-note',
  'Button': 'material-symbols:smart-button',
  'CheckBox': 'material-symbols:check-box-outline-blank',
  'OptionButton': 'material-symbols:radio-button-unchecked',
  'ItemList': 'material-symbols:list',
  'Tree': 'material-symbols:account-tree',
  'TabContainer': 'material-symbols:tab',
  'ScrollContainer': 'material-symbols:scroll',
  'Panel': 'material-symbols:dashboard',
  'Control': 'material-symbols:control-camera',

  // 2D 物理
  'RigidBody2D': 'material-symbols:sports-soccer',
  'StaticBody2D': 'material-symbols:stop',
  'CharacterBody2D': 'material-symbols:directions-walk',
  'Area2D': 'material-symbols:crop-free',
  'CollisionShape2D': 'material-symbols:crop-square',
  'CollisionPolygon2D': 'material-symbols:pentagon-outline',

  // 3D 节点
  'MeshInstance3D': 'material-symbols:view-in-ar',
  'StaticBody3D': 'material-symbols:cube-outline',
  'RigidBody3D': 'material-symbols:sports-basketball',
  'CharacterBody3D': 'material-symbols:accessibility',
  'Area3D': 'material-symbols:all-out',
  'CollisionShape3D': 'material-symbols:category',

  // 3D 渲染
  'Camera3D': 'material-symbols:videocam',
  'Light3D': 'material-symbols:lightbulb-outline',
  'DirectionalLight3D': 'material-symbols:wb-sunny',
  'PointLight3D': 'material-symbols:wb-incandescent',
  'SpotLight3D': 'material-symbols:flashlight-on',
  'ReflectionProbe': 'material-symbols:panorama-sphere',

  // 音频
  'AudioStreamPlayer': 'material-symbols:volume-up',
  'AudioStreamPlayer2D': 'material-symbols:surround-sound',
  'AudioStreamPlayer3D': 'material-symbols:3d-rotation',
  'AudioListener3D': 'material-symbols:hearing',

  // 动画
  'AnimationPlayer': 'material-symbols:play-circle-outline',
  'AnimationTree': 'material-symbols:account-tree',
  'Tween': 'material-symbols:timeline',

  // 网络
  'MultiplayerSpawner': 'material-symbols:group-add',
  'MultiplayerSynchronizer': 'material-symbols:sync',

  // 导航
  'NavigationAgent2D': 'material-symbols:navigation',
  'NavigationAgent3D': 'material-symbols:explore',
  'NavigationRegion2D': 'material-symbols:map',
  'NavigationRegion3D': 'material-symbols:terrain',

  // 粒子
  'GPUParticles2D': 'material-symbols:scatter-plot',
  'GPUParticles3D': 'material-symbols:bubble-chart',
  'CPUParticles2D': 'material-symbols:grain',
  'CPUParticles3D': 'material-symbols:blur-on'
}
```

### 文件类型图标 (File Icons)

```typescript
const FILE_ICONS = {
  // 场景文件
  '.tscn': 'material-symbols:scene',
  '.scn': 'material-symbols:movie-creation',

  // 脚本文件
  '.js': 'vscode-icons:file-type-js-official',
  '.ts': 'vscode-icons:file-type-typescript-official',
  '.gd': 'material-symbols:code',
  '.cs': 'vscode-icons:file-type-csharp2',
  '.py': 'vscode-icons:file-type-python',

  // 资源文件
  '.tres': 'material-symbols:inventory-2',
  '.res': 'material-symbols:folder-special',

  // 图片文件
  '.png': 'vscode-icons:file-type-image',
  '.jpg': 'vscode-icons:file-type-image',
  '.jpeg': 'vscode-icons:file-type-image',
  '.webp': 'vscode-icons:file-type-image',
  '.svg': 'vscode-icons:file-type-svg',
  '.bmp': 'vscode-icons:file-type-image',
  '.tga': 'vscode-icons:file-type-image',

  // 3D 模型
  '.glb': 'material-symbols:view-in-ar',
  '.gltf': 'material-symbols:view-in-ar',
  '.fbx': 'material-symbols:3d-rotation',
  '.obj': 'material-symbols:category',
  '.dae': 'material-symbols:account-tree',
  '.blend': 'simple-icons:blender',

  // 音频文件
  '.wav': 'vscode-icons:file-type-audio',
  '.mp3': 'vscode-icons:file-type-audio',
  '.ogg': 'vscode-icons:file-type-audio',
  '.aac': 'vscode-icons:file-type-audio',

  // 字体文件
  '.ttf': 'material-symbols:font-download',
  '.otf': 'material-symbols:font-download',
  '.woff2': 'material-symbols:font-download',

  // 配置文件
  '.json': 'vscode-icons:file-type-json',
  '.yaml': 'vscode-icons:file-type-yaml',
  '.yml': 'vscode-icons:file-type-yaml',
  '.toml': 'vscode-icons:file-type-toml',
  '.cfg': 'material-symbols:settings',
  '.ini': 'material-symbols:settings',

  // 项目文件
  'project.qaq': 'material-symbols:rocket-launch',
  'export_presets.cfg': 'material-symbols:publish',

  // 文件夹
  'folder': 'material-symbols:folder',
  'folder-open': 'material-symbols:folder-open',
  'folder-scenes': 'material-symbols:movie-creation',
  'folder-scripts': 'material-symbols:code',
  'folder-assets': 'material-symbols:inventory-2',
  'folder-textures': 'material-symbols:image',
  'folder-models': 'material-symbols:view-in-ar',
  'folder-audio': 'material-symbols:volume-up',
  'folder-fonts': 'material-symbols:font-download'
}
```

### 编辑器工具图标 (Tool Icons)

```typescript
const TOOL_ICONS = {
  // 基础工具
  'select': 'material-symbols:mouse',
  'move': 'material-symbols:open-with',
  'rotate': 'material-symbols:rotate-90-degrees-ccw',
  'scale': 'material-symbols:aspect-ratio',
  'rect-select': 'material-symbols:crop-square',
  'free-select': 'material-symbols:gesture',

  // 视口控制
  'zoom-in': 'material-symbols:zoom-in',
  'zoom-out': 'material-symbols:zoom-out',
  'zoom-fit': 'material-symbols:fit-screen',
  'zoom-reset': 'material-symbols:center-focus-strong',
  'pan': 'material-symbols:pan-tool',

  // 网格和捕捉
  'grid': 'material-symbols:grid-on',
  'snap': 'material-symbols:grid-goldenratio',
  'snap-pixel': 'material-symbols:apps',
  'snap-grid': 'material-symbols:grid-4x4',
  'snap-guides': 'material-symbols:straighten',

  // 视图模式
  'view-2d': 'material-symbols:2d',
  'view-3d': 'material-symbols:3d-rotation',
  'wireframe': 'material-symbols:category',
  'solid': 'material-symbols:circle',
  'material-preview': 'material-symbols:palette',
  'lighting': 'material-symbols:wb-sunny',

  // 播放控制
  'play': 'material-symbols:play-arrow',
  'pause': 'material-symbols:pause',
  'stop': 'material-symbols:stop',
  'step': 'material-symbols:skip-next',
  'record': 'material-symbols:fiber-manual-record',

  // 编辑操作
  'undo': 'material-symbols:undo',
  'redo': 'material-symbols:redo',
  'copy': 'material-symbols:content-copy',
  'paste': 'material-symbols:content-paste',
  'cut': 'material-symbols:content-cut',
  'delete': 'material-symbols:delete',
  'duplicate': 'material-symbols:file-copy',

  // 搜索和过滤
  'search': 'material-symbols:search',
  'filter': 'material-symbols:filter-list',
  'sort': 'material-symbols:sort',
  'refresh': 'material-symbols:refresh',
  'clear': 'material-symbols:clear',

  // 面板控制
  'expand': 'material-symbols:expand-more',
  'collapse': 'material-symbols:expand-less',
  'pin': 'material-symbols:push-pin',
  'close': 'material-symbols:close',
  'minimize': 'material-symbols:minimize',
  'maximize': 'material-symbols:crop-square',

  // 设置和配置
  'settings': 'material-symbols:settings',
  'preferences': 'material-symbols:tune',
  'info': 'material-symbols:info',
  'help': 'material-symbols:help',
  'warning': 'material-symbols:warning',
  'error': 'material-symbols:error',
  'success': 'material-symbols:check-circle'
}
```

### 菜单和操作图标 (Menu Icons)

```typescript
const MENU_ICONS = {
  // 文件菜单
  'file-new': 'material-symbols:note-add',
  'file-open': 'material-symbols:folder-open',
  'file-save': 'material-symbols:save',
  'file-save-as': 'material-symbols:save-as',
  'file-import': 'material-symbols:file-upload',
  'file-export': 'material-symbols:file-download',
  'file-recent': 'material-symbols:history',
  'file-quit': 'material-symbols:exit-to-app',

  // 编辑菜单
  'edit-undo': 'material-symbols:undo',
  'edit-redo': 'material-symbols:redo',
  'edit-cut': 'material-symbols:content-cut',
  'edit-copy': 'material-symbols:content-copy',
  'edit-paste': 'material-symbols:content-paste',
  'edit-select-all': 'material-symbols:select-all',
  'edit-find': 'material-symbols:search',
  'edit-replace': 'material-symbols:find-replace',

  // 项目菜单
  'project-new': 'material-symbols:create-new-folder',
  'project-open': 'material-symbols:folder-open',
  'project-settings': 'material-symbols:settings',
  'project-build': 'material-symbols:build',
  'project-export': 'material-symbols:publish',
  'project-close': 'material-symbols:folder-off',

  // 场景菜单
  'scene-new': 'material-symbols:add-box',
  'scene-open': 'material-symbols:movie-creation',
  'scene-save': 'material-symbols:save',
  'scene-save-as': 'material-symbols:save-as',
  'scene-close': 'material-symbols:close',
  'scene-reload': 'material-symbols:refresh',

  // 节点菜单
  'node-add': 'material-symbols:add-circle',
  'node-instance': 'material-symbols:content-copy',
  'node-delete': 'material-symbols:delete',
  'node-rename': 'material-symbols:edit',
  'node-duplicate': 'material-symbols:file-copy',
  'node-move-up': 'material-symbols:keyboard-arrow-up',
  'node-move-down': 'material-symbols:keyboard-arrow-down',

  // 构建菜单
  'build-run': 'material-symbols:play-arrow',
  'build-debug': 'material-symbols:bug-report',
  'build-export': 'material-symbols:publish',
  'build-clean': 'material-symbols:cleaning-services',

  // 帮助菜单
  'help-docs': 'material-symbols:menu-book',
  'help-tutorials': 'material-symbols:school',
  'help-community': 'material-symbols:groups',
  'help-about': 'material-symbols:info'
}
```

## 🧩 图标组件实现

### 统一图标组件
```vue
<!-- components/ui/QaqIcon.vue -->
<template>
  <Icon
    :name="iconName"
    :size="size"
    :class="iconClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: string | number
  type?: 'node' | 'file' | 'tool' | 'menu'
  variant?: 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  size: '16',
  type: 'default',
  variant: 'default'
})

const iconName = computed(() => {
  // 根据类型和名称获取对应的图标
  switch (props.type) {
    case 'node':
      return NODE_ICONS[props.name] || 'material-symbols:radio-button-unchecked'
    case 'file':
      return FILE_ICONS[props.name] || 'material-symbols:insert-drive-file'
    case 'tool':
      return TOOL_ICONS[props.name] || 'material-symbols:build'
    case 'menu':
      return MENU_ICONS[props.name] || 'material-symbols:menu'
    default:
      return props.name
  }
})

const iconClass = computed(() => {
  const classes = ['qaq-icon']

  // 添加变体样式类
  if (props.variant !== 'default') {
    classes.push(`qaq-icon--${props.variant}`)
  }

  // 添加类型样式类
  if (props.type) {
    classes.push(`qaq-icon--${props.type}`)
  }

  return classes
})
</script>

<style scoped>
.qaq-icon {
  @apply inline-flex items-center justify-center;
}

.qaq-icon--muted {
  @apply text-gray-500 dark:text-gray-400;
}

.qaq-icon--accent {
  @apply text-primary-500;
}

.qaq-icon--success {
  @apply text-green-500;
}

.qaq-icon--warning {
  @apply text-yellow-500;
}

.qaq-icon--error {
  @apply text-red-500;
}

.qaq-icon--node {
  @apply text-blue-500;
}

.qaq-icon--file {
  @apply text-gray-600 dark:text-gray-300;
}

.qaq-icon--tool {
  @apply text-gray-700 dark:text-gray-200;
}
</style>
```

### 节点图标组件
```vue
<!-- components/editor/NodeIcon.vue -->
<template>
  <QaqIcon
    :name="nodeType"
    type="node"
    :size="size"
    :class="nodeIconClass"
  />
</template>

<script setup lang="ts">
interface Props {
  nodeType: string
  size?: string | number
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: '16',
  selected: false
})

const nodeIconClass = computed(() => {
  const classes = ['node-icon']

  if (props.selected) {
    classes.push('node-icon--selected')
  }

  // 根据节点类型添加特定颜色
  const colorMap = {
    'Node': 'text-gray-400',
    'Node2D': 'text-blue-500',
    'Node3D': 'text-red-500',
    'Control': 'text-green-500',
    'CanvasItem': 'text-blue-400',
    'RigidBody2D': 'text-orange-500',
    'RigidBody3D': 'text-orange-600',
    'Camera3D': 'text-purple-500',
    'Light3D': 'text-yellow-500',
    'AudioStreamPlayer': 'text-pink-500'
  }

  const colorClass = colorMap[props.nodeType as keyof typeof colorMap] || 'text-gray-500'
  classes.push(colorClass)

  return classes
})
</script>

<style scoped>
.node-icon--selected {
  @apply ring-2 ring-primary-500 rounded;
}
</style>
```

### 文件图标组件
```vue
<!-- components/editor/FileIcon.vue -->
<template>
  <QaqIcon
    :name="getFileIcon(fileName)"
    type="file"
    :size="size"
  />
</template>

<script setup lang="ts">
interface Props {
  fileName: string
  size?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  size: '16'
})

function getFileIcon(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()

  if (!ext) {
    return 'material-symbols:insert-drive-file'
  }

  return FILE_ICONS[`.${ext}`] || 'material-symbols:insert-drive-file'
}
</script>
```

## 🎨 使用示例

### 在场景树中使用
```vue
<template>
  <div class="scene-tree-item">
    <NodeIcon :node-type="node.type" :selected="node.selected" />
    <span class="node-name">{{ node.name }}</span>
  </div>
</template>
```

### 在文件系统中使用
```vue
<template>
  <div class="file-item">
    <FileIcon :file-name="file.name" />
    <span class="file-name">{{ file.name }}</span>
  </div>
</template>
```

### 在工具栏中使用
```vue
<template>
  <div class="toolbar">
    <button class="tool-button">
      <QaqIcon name="select" type="tool" />
    </button>
    <button class="tool-button">
      <QaqIcon name="move" type="tool" />
    </button>
    <button class="tool-button">
      <QaqIcon name="rotate" type="tool" />
    </button>
  </div>
</template>
```

## 🔧 高级功能

### 动态图标加载
```typescript
// composables/useIcons.ts
export const useIcons = () => {
  const loadedCollections = ref(new Set<string>())

  const loadIconCollection = async (collection: string) => {
    if (loadedCollections.value.has(collection)) return

    try {
      await import(`@iconify/json/json/${collection}.json`)
      loadedCollections.value.add(collection)
    } catch (error) {
      console.warn(`Failed to load icon collection: ${collection}`)
    }
  }

  const preloadCommonIcons = async () => {
    const collections = [
      'material-symbols',
      'lucide',
      'tabler',
      'vscode-icons'
    ]

    await Promise.all(collections.map(loadIconCollection))
  }

  return {
    loadIconCollection,
    preloadCommonIcons,
    loadedCollections: readonly(loadedCollections)
  }
}
```

### 图标搜索功能
```vue
<!-- components/dialogs/IconPickerDialog.vue -->
<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-full max-w-4xl' }">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">选择图标</h3>
      </template>

      <div class="space-y-4">
        <UInput
          v-model="searchQuery"
          placeholder="搜索图标..."
          icon="i-heroicons-magnifying-glass"
        />

        <div class="flex gap-2 flex-wrap">
          <UButton
            v-for="collection in availableCollections"
            :key="collection"
            :variant="selectedCollection === collection ? 'solid' : 'outline'"
            size="sm"
            @click="selectedCollection = collection"
          >
            {{ collection }}
          </UButton>
        </div>

        <div class="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
          <button
            v-for="icon in filteredIcons"
            :key="icon"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            @click="selectIcon(icon)"
          >
            <Icon :name="icon" size="24" />
          </button>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="isOpen = false">取消</UButton>
          <UButton @click="confirmSelection">确认</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  currentIcon?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [icon: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchQuery = ref('')
const selectedCollection = ref('material-symbols')
const selectedIcon = ref(props.currentIcon || '')

const availableCollections = [
  'material-symbols',
  'lucide',
  'tabler',
  'heroicons',
  'carbon'
]

const filteredIcons = computed(() => {
  // 这里应该从 Iconify API 获取图标列表
  // 简化示例
  return []
})

const selectIcon = (icon: string) => {
  selectedIcon.value = icon
}

const confirmSelection = () => {
  if (selectedIcon.value) {
    emit('select', selectedIcon.value)
    isOpen.value = false
  }
}
</script>
```

### 自定义图标集合
```typescript
// assets/icons/qaq-custom.json
{
  "prefix": "qaq",
  "icons": {
    "logo": {
      "body": "<path d=\"M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z\"/>",
      "width": 24,
      "height": 24
    },
    "node-custom": {
      "body": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M8 12h8M12 8v8\"/>",
      "width": 24,
      "height": 24
    }
  }
}
```

### 图标缓存策略
```typescript
// utils/iconCache.ts
class IconCache {
  private cache = new Map<string, string>()
  private loading = new Set<string>()

  async getIcon(name: string): Promise<string> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!
    }

    if (this.loading.has(name)) {
      // 等待加载完成
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (this.cache.has(name)) {
            resolve(this.cache.get(name)!)
          } else {
            setTimeout(checkLoaded, 10)
          }
        }
        checkLoaded()
      })
    }

    this.loading.add(name)

    try {
      const iconData = await this.loadIconData(name)
      this.cache.set(name, iconData)
      return iconData
    } finally {
      this.loading.delete(name)
    }
  }

  private async loadIconData(name: string): Promise<string> {
    // 从 Iconify API 加载图标数据
    const response = await fetch(`https://api.iconify.design/${name}.svg`)
    return response.text()
  }

  preloadIcons(names: string[]) {
    names.forEach(name => this.getIcon(name))
  }

  clearCache() {
    this.cache.clear()
  }
}

export const iconCache = new IconCache()
```

## 📊 性能优化

### 1. 按需加载
```typescript
// 只加载当前需要的图标集合
const iconCollections = {
  editor: ['material-symbols', 'lucide'],
  nodes: ['material-symbols'],
  files: ['vscode-icons', 'material-symbols'],
  tools: ['material-symbols', 'tabler']
}

// 根据当前页面/组件加载对应图标集合
const loadIconsForContext = (context: keyof typeof iconCollections) => {
  return Promise.all(
    iconCollections[context].map(collection =>
      import(`@iconify/json/json/${collection}.json`)
    )
  )
}
```

### 2. 图标预加载
```typescript
// 在应用启动时预加载常用图标
const PRELOAD_ICONS = [
  'material-symbols:folder',
  'material-symbols:folder-open',
  'material-symbols:insert-drive-file',
  'material-symbols:radio-button-unchecked',
  'material-symbols:2d',
  'material-symbols:3d-rotation',
  'material-symbols:play-arrow',
  'material-symbols:pause',
  'material-symbols:stop'
]

// main.ts
import { preloadIcons } from '@iconify/vue'

preloadIcons(PRELOAD_ICONS)
```

### 3. SVG 优化
```typescript
// 自定义 SVG 优化配置
const svgOptimizeConfig = {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeTitle',
    'removeDesc',
    'removeUselessDefs',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyContainers',
    'removeViewBox',
    'cleanupEnableBackground',
    'convertStyleToAttrs',
    'convertColors',
    'convertPathData',
    'convertTransform',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeUnusedNS',
    'cleanupIDs',
    'cleanupNumericValues',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'removeRasterImages',
    'mergePaths',
    'convertShapeToPath',
    'sortAttrs',
    'removeDimensions'
  ]
}
```

## 🎯 最佳实践

### 1. 图标命名规范
```typescript
// 推荐的图标命名规范
const ICON_NAMING_CONVENTION = {
  // 节点类型: 使用 PascalCase
  nodes: 'Node2D', 'MeshInstance3D', 'AudioStreamPlayer',

  // 文件扩展名: 使用小写带点
  files: '.tscn', '.js', '.png',

  // 工具操作: 使用 kebab-case
  tools: 'select', 'move', 'rotate', 'scale',

  // 菜单操作: 使用 kebab-case 带前缀
  menus: 'file-new', 'edit-copy', 'project-build'
}
```

### 2. 图标尺寸标准
```css
/* 标准图标尺寸 */
.icon-xs { width: 12px; height: 12px; }  /* 小图标 */
.icon-sm { width: 16px; height: 16px; }  /* 默认图标 */
.icon-md { width: 20px; height: 20px; }  /* 中等图标 */
.icon-lg { width: 24px; height: 24px; }  /* 大图标 */
.icon-xl { width: 32px; height: 32px; }  /* 超大图标 */
```

### 3. 无障碍支持
```vue
<template>
  <QaqIcon
    name="save"
    type="tool"
    :aria-label="$t('toolbar.save')"
    role="img"
  />
</template>
```

### 4. 主题适配
```css
/* 深色主题图标适配 */
.dark .qaq-icon {
  filter: brightness(0.9);
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .qaq-icon {
    filter: contrast(1.5);
  }
}
```

## 📱 响应式图标

### 根据屏幕尺寸调整图标大小
```vue
<template>
  <QaqIcon
    :name="iconName"
    :size="responsiveSize"
    type="tool"
  />
</template>

<script setup lang="ts">
const { $breakpoints } = useNuxtApp()

const responsiveSize = computed(() => {
  if ($breakpoints.isSmaller('md')) return '14'
  if ($breakpoints.isSmaller('lg')) return '16'
  return '18'
})
</script>
```

这个完整的 Iconify 图标系统为 QAQ 编辑器提供了强大而灵活的图标解决方案，支持 200,000+ 图标，具有良好的性能和用户体验。
