import { defineConfig } from 'vitepress'
import { readFileSync, readdirSync } from 'fs'

type SidebarItem = {
  text: string
  collapsible?: boolean
  collapsed?: boolean
  items: {
    text: string
    link: string
    items?: { text: string; link: string }[]
  }[]
}[]

export default defineConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'QAQ游戏引擎',
  description: '基于Three.js构建的新一代TypeScript游戏引擎，支持统一的2D/3D渲染',
  lastUpdated: true,
  ignoreDeadLinks: true,
  appearance: 'dark',

  head: [
    ['link', { rel: 'shortcut icon', type: 'image/png', href: '/images/qaq-icon.png' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'theme-color', content: '#000000' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }]
  ],

  themeConfig: {
    logo: {
      light: '/images/qaq-logo-light.png',
      dark: '/images/qaq-logo-dark.png'
    },

    siteTitle: 'QAQ引擎',
    outlineTitle: '本页内容',
    outline: [2, 3],

    nav: nav(),
    sidebar: {
      '/guide/': sidebarGuide(),
      '/api/': sidebarAPI()
    },

    editLink: {
      pattern: 'https://github.com/qaq-engine/qaq-game-engine/edit/main/docs-site/docs/:path',
      text: 'Edit this page on GitHub'
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/qaq-engine/qaq-game-engine'
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/qaq-engine'
      }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-Present QAQ Game Engine Team'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search Documentation',
            buttonAriaLabel: 'Search Documentation'
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Clear search query',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close'
            }
          }
        }
      }
    },

    lastUpdatedText: 'Last updated',
    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    }
  },

  markdown: {
    lineNumbers: true,
    attrs: { disable: true }
  },

  router: {
    prefetchLinks: false
  },

  vite: {
    build: {
      target: 'esnext'
    }
  }
})

function nav() {
  return [
    {
      text: '使用指南',
      activeMatch: '/guide/',
      items: [
        {
          text: '快速开始',
          link: '/guide/getting-started',
          activeMatch: '/guide/getting-started'
        },
        {
          text: '引擎核心',
          link: '/guide/engine',
          activeMatch: '/guide/engine'
        },
        {
          text: '节点系统',
          link: '/guide/nodes',
          activeMatch: '/guide/nodes'
        },
        {
          text: '脚本系统',
          link: '/guide/scripting',
          activeMatch: '/guide/scripting'
        }
      ]
    },
    {
      text: 'API文档',
      activeMatch: '/api/',
      items: [
        {
          text: '核心API',
          items: [
            { text: 'Engine 引擎', link: '/api/core/engine' },
            { text: 'Node 节点', link: '/api/core/node' },
            { text: 'Scene 场景', link: '/api/core/scene' },
            { text: 'Script 脚本', link: '/api/core/script' }
          ]
        },
        {
          text: '节点类型',
          items: [
            { text: '2D节点', link: '/api/nodes/2d' },
            { text: '3D节点', link: '/api/nodes/3d' },
            { text: 'UI控件', link: '/api/nodes/ui' }
          ]
        }
      ]
    },
    {
      text: 'Examples',
      link: '/examples/',
      activeMatch: '/examples/'
    },
    {
      text: 'Tutorials',
      link: '/tutorials/',
      activeMatch: '/tutorials/'
    },
    {
      text: 'v1.0',
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/qaq-engine/qaq-game-engine/releases'
        },
        {
          text: 'NPM Package',
          link: 'https://www.npmjs.com/package/qaq-game-engine'
        },
        {
          text: 'Contributing',
          link: 'https://github.com/qaq-engine/qaq-game-engine/blob/main/CONTRIBUTING.md'
        }
      ]
    }
  ]
}

function sidebarGuide(): SidebarItem {
  return [
    {
      text: '快速开始',
      collapsible: true,
      items: [
        { text: '引擎介绍', link: '/guide/getting-started' },
        { text: '安装配置', link: '/guide/installation' },
        { text: '第一个项目', link: '/guide/first-project' }
      ]
    },
    {
      text: '引擎核心',
      collapsible: true,
      items: [
        { text: 'Engine 引擎', link: '/guide/engine' },
        { text: 'Scene 场景', link: '/guide/scene' },
        { text: '渲染管道', link: '/guide/rendering' },
        { text: '事件系统', link: '/guide/events' }
      ]
    },
    {
      text: '节点系统',
      collapsible: true,
      items: [
        { text: 'Node 基础节点', link: '/guide/nodes/node' },
        { text: 'Node2D 2D节点', link: '/guide/nodes/node2d' },
        { text: 'Node3D 3D节点', link: '/guide/nodes/node3d' },
        { text: '节点生命周期', link: '/guide/nodes/lifecycle' }
      ]
    },
    {
      text: '脚本系统',
      collapsible: true,
      items: [
        { text: '脚本基础', link: '/guide/scripting/basics' },
        { text: '脚本生命周期', link: '/guide/scripting/lifecycle' },
        { text: '节点访问', link: '/guide/scripting/node-access' },
        { text: '游戏模式', link: '/guide/scripting/game-modes' }
      ]
    }
  ]
}

function sidebarAPI(): SidebarItem {
  return [
    {
      text: '核心API',
      collapsible: true,
      items: [
        { text: 'Engine 引擎', link: '/api/core/engine' },
        { text: 'QaqObject 基础对象', link: '/api/core/qaq-object' },
        { text: 'Node 节点', link: '/api/core/node' },
        { text: 'Scene 场景', link: '/api/core/scene' },
        { text: 'SceneTree 场景树', link: '/api/core/scene-tree' }
      ]
    },
    {
      text: '基础节点',
      collapsible: true,
      items: [
        { text: 'Node2D 2D节点', link: '/api/nodes/node2d' },
        { text: 'Node3D 3D节点', link: '/api/nodes/node3d' }
      ]
    },
    {
      text: '2D节点',
      collapsible: true,
      items: [
        { text: 'Sprite2D 精灵', link: '/api/nodes/sprite2d' },
        { text: 'AnimatedSprite2D 动画精灵', link: '/api/nodes/animated-sprite2d' },
        { text: 'Label 文本标签', link: '/api/nodes/label' },
        { text: 'Button2D 按钮', link: '/api/nodes/button2d' },
        { text: 'TileMap2D 瓦片地图', link: '/api/nodes/tilemap2d' }
      ]
    },
    {
      text: '3D节点',
      collapsible: true,
      items: [
        { text: 'Node3D 3D基础节点', link: '/api/nodes/node3d' },
        { text: 'MeshInstance3D 网格实例', link: '/api/nodes/mesh-instance3d' },
        { text: 'Camera3D 3D相机', link: '/api/nodes/camera3d' },
        { text: 'Light3D 3D光源', link: '/api/nodes/light3d' }
      ]
    },
    {
      text: '脚本系统',
      collapsible: true,
      items: [
        { text: 'ScriptBase 脚本基类', link: '/api/scripting/script-base' },
        { text: 'ScriptManager 脚本管理器', link: '/api/scripting/script-manager' },
        { text: '游戏模式', link: '/api/scripting/game-modes' }
      ]
    }
  ]
}

function sidebarExamples(): SidebarItem {
  return [
    {
      text: 'Basic Examples',
      collapsible: true,
      items: [
        { text: 'Hello World', link: '/examples/basic/hello-world' },
        { text: 'Moving Sprite', link: '/examples/basic/moving-sprite' },
        { text: 'Button Interaction', link: '/examples/basic/button-interaction' }
      ]
    },
    {
      text: '2D Examples',
      collapsible: true,
      items: [
        { text: 'Sprite Animation', link: '/examples/2d/sprite-animation' },
        { text: 'UI Layout', link: '/examples/2d/ui-layout' },
        { text: 'Particle System', link: '/examples/2d/particles' }
      ]
    },
    {
      text: '3D Examples',
      collapsible: true,
      items: [
        { text: 'Basic 3D Scene', link: '/examples/3d/basic-scene' },
        { text: 'Lighting Demo', link: '/examples/3d/lighting' },
        { text: 'Model Loading', link: '/examples/3d/model-loading' }
      ]
    }
  ]
}

function sidebarTutorials(): SidebarItem {
  return [
    {
      text: 'Beginner Tutorials',
      collapsible: true,
      items: [
        { text: 'Building Your First Game', link: '/tutorials/beginner/first-game' },
        { text: 'Understanding Nodes', link: '/tutorials/beginner/understanding-nodes' },
        { text: 'Working with Scripts', link: '/tutorials/beginner/working-with-scripts' }
      ]
    },
    {
      text: 'Intermediate Tutorials',
      collapsible: true,
      items: [
        { text: 'Game State Management', link: '/tutorials/intermediate/state-management' },
        { text: 'Custom Components', link: '/tutorials/intermediate/custom-components' },
        { text: 'Performance Tips', link: '/tutorials/intermediate/performance-tips' }
      ]
    }
  ]
}
