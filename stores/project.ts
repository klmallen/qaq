import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface QaqProject {
  id: string
  name: string
  path: string
  createdAt: Date
  lastOpened: Date
  settings: {
    version: string
    renderer: '2D' | '3D'
    physics: string
    audio: string
  }
  scenes: QaqScene[]
  scripts: QaqScript[]
  resources: QaqResource[]
}

export interface QaqScene {
  name: string
  path: string
  lastModified: Date
  isMain?: boolean
}

export interface QaqScript {
  name: string
  path: string
  lastModified: Date
  language: 'gdscript' | 'typescript' | 'javascript'
}

export interface QaqResource {
  name: string
  path: string
  type: 'texture' | 'audio' | 'model' | 'material' | 'shader' | 'font' | 'other'
  size: number
  lastModified?: Date
}

export const useProjectStore = defineStore('project', () => {
  // 状态
  const currentProject = ref<QaqProject | null>(null)
  const recentProjects = ref<QaqProject[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hasProject = computed(() => currentProject.value !== null)
  const projectName = computed(() => currentProject.value?.name || '')
  const projectPath = computed(() => currentProject.value?.path || '')
  const projectScenes = computed(() => currentProject.value?.scenes || [])
  const projectScripts = computed(() => currentProject.value?.scripts || [])
  const projectResources = computed(() => currentProject.value?.resources || [])
  const projectFiles = computed(() => {
    const files: any[] = []

    // 添加场景文件
    projectScenes.value.forEach(scene => {
      files.push({
        name: scene.name,
        path: scene.path,
        type: 'scene',
        size: 0,
        lastModified: scene.lastModified,
        icon: 'i-heroicons-cube'
      })
    })

    // 添加脚本文件
    projectScripts.value.forEach(script => {
      files.push({
        name: script.name,
        path: script.path,
        type: 'script',
        size: 0,
        lastModified: script.lastModified,
        icon: 'i-heroicons-code-bracket'
      })
    })

    // 添加资源文件
    projectResources.value.forEach(resource => {
      files.push({
        name: resource.name,
        path: resource.path,
        type: resource.type,
        size: resource.size,
        lastModified: resource.lastModified,
        icon: getResourceIcon(resource.type)
      })
    })

    return files
  })

  // 获取资源图标
  function getResourceIcon(type: string): string {
    switch (type) {
      case 'texture': return 'i-heroicons-photo'
      case 'audio': return 'i-heroicons-musical-note'
      case 'model': return 'i-heroicons-cube-transparent'
      case 'material': return 'i-heroicons-swatch'
      case 'shader': return 'i-heroicons-sparkles'
      case 'font': return 'i-heroicons-language'
      case 'scene': return 'i-heroicons-cube'
      case 'script': return 'i-heroicons-code-bracket'
      default: return 'i-heroicons-document'
    }
  }

  // 刷新项目文件
  async function refreshProjectFiles() {
    // 这里可以添加从文件系统读取文件的逻辑
    // 目前只是触发响应式更新
    console.log('Refreshing project files...')
  }

  // 创建新项目
  async function createProject(name: string, path: string, template?: string, renderer: '2D' | '3D' = '3D') {
    isLoading.value = true
    error.value = null

    try {
      const newProject: QaqProject = {
        id: `project-${Date.now()}`,
        name,
        path,
        createdAt: new Date(),
        lastOpened: new Date(),
        settings: {
          version: '1.0.0',
          renderer,
          physics: 'builtin',
          audio: 'builtin'
        },
        scenes: [],
        scripts: [],
        resources: []
      }

      // 根据模板添加初始内容
      if (template === '2d-game') {
        newProject.scenes.push({
          name: 'Main.tscn',
          path: 'scenes/Main.tscn',
          lastModified: new Date(),
          isMain: true
        })
        newProject.scripts.push({
          name: 'Player.ts',
          path: 'scripts/Player.ts',
          lastModified: new Date(),
          language: 'typescript'
        })
      } else if (template === '3d-game') {
        newProject.scenes.push({
          name: 'Main.tscn',
          path: 'scenes/Main.tscn',
          lastModified: new Date(),
          isMain: true
        })
        newProject.scripts.push({
          name: 'PlayerController.ts',
          path: 'scripts/PlayerController.ts',
          lastModified: new Date(),
          language: 'typescript'
        })
      }

      // 创建项目文件结构
      await createProjectStructure(newProject)

      currentProject.value = newProject
      addToRecentProjects(newProject)

      console.log(`✅ Project "${name}" created successfully at ${path}`)
      return newProject
    } catch (err) {
      error.value = `Failed to create project: ${err}`
      console.error('Failed to create project:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 打开项目
  async function openProject(projectPath: string) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟加载项目文件
      const projectName = projectPath.split('/').pop() || projectPath.split('\\').pop() || 'Untitled'

      const project: QaqProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        path: projectPath,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        lastOpened: new Date(),
        settings: {
          version: '1.0.0',
          renderer: '3D',
          physics: 'builtin',
          audio: 'builtin'
        },
        scenes: [
          {
            name: 'Main.tscn',
            path: 'scenes/Main.tscn',
            lastModified: new Date(),
            isMain: true
          },
          {
            name: 'Player.tscn',
            path: 'scenes/Player.tscn',
            lastModified: new Date()
          },
          {
            name: 'UI.tscn',
            path: 'scenes/UI.tscn',
            lastModified: new Date()
          }
        ],
        scripts: [
          {
            name: 'PlayerController.ts',
            path: 'scripts/PlayerController.ts',
            lastModified: new Date(),
            language: 'typescript'
          },
          {
            name: 'GameManager.ts',
            path: 'scripts/GameManager.ts',
            lastModified: new Date(),
            language: 'typescript'
          },
          {
            name: 'UIController.ts',
            path: 'scripts/UIController.ts',
            lastModified: new Date(),
            language: 'typescript'
          }
        ],
        resources: [
          {
            name: 'player.png',
            path: 'textures/player.png',
            type: 'texture',
            size: 2048,
            lastModified: new Date()
          },
          {
            name: 'background.jpg',
            path: 'textures/background.jpg',
            type: 'texture',
            size: 4096,
            lastModified: new Date()
          },
          {
            name: 'jump.wav',
            path: 'audio/jump.wav',
            type: 'audio',
            size: 1024,
            lastModified: new Date()
          },
          {
            name: 'music.ogg',
            path: 'audio/music.ogg',
            type: 'audio',
            size: 8192,
            lastModified: new Date()
          }
        ]
      }

      currentProject.value = project
      addToRecentProjects(project)

      console.log(`✅ Project "${project.name}" opened successfully`)
      return project
    } catch (err) {
      error.value = `Failed to open project: ${err}`
      console.error('Failed to open project:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 关闭项目
  function closeProject() {
    if (currentProject.value) {
      console.log(`📁 Closing project "${currentProject.value.name}"`)
      currentProject.value = null
      error.value = null
    }
  }

  // 保存项目
  async function saveProject() {
    if (!currentProject.value) return

    try {
      // 更新最后修改时间
      currentProject.value.lastOpened = new Date()

      // 实际保存项目文件
      await saveProjectToFileSystem(currentProject.value)

      console.log(`💾 Project "${currentProject.value.name}" saved`)

      // 更新最近项目列表
      addToRecentProjects(currentProject.value)
    } catch (err) {
      error.value = `Failed to save project: ${err}`
      console.error('Failed to save project:', err)
      throw err
    }
  }

  // 保存项目到文件系统
  async function saveProjectToFileSystem(project: QaqProject) {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported')
    }

    try {
      // 创建项目配置文件内容
      const projectConfig = {
        name: project.name,
        version: project.settings.version,
        renderer: project.settings.renderer,
        physics: project.settings.physics,
        audio: project.settings.audio,
        scenes: project.scenes,
        scripts: project.scripts,
        resources: project.resources,
        createdAt: project.createdAt,
        lastOpened: project.lastOpened
      }

      // 将项目配置保存为 JSON 文件
      const projectConfigJson = JSON.stringify(projectConfig, null, 2)

      // 这里需要实际的文件系统写入逻辑
      // 目前先保存到 localStorage 作为临时方案
      localStorage.setItem(`qaq-project-${project.id}`, projectConfigJson)

      console.log('Project configuration saved to localStorage')
    } catch (err) {
      console.error('Failed to save project to file system:', err)
      throw err
    }
  }

  // 创建项目文件结构
  async function createProjectStructure(project: QaqProject) {
    try {
      // 创建基本的项目文件夹结构
      const projectStructure = {
        'project.qaq': JSON.stringify({
          name: project.name,
          version: project.settings.version,
          renderer: project.settings.renderer,
          physics: project.settings.physics,
          audio: project.settings.audio,
          main_scene: project.scenes.find(s => s.isMain)?.path || '',
          createdAt: project.createdAt,
          lastOpened: project.lastOpened
        }, null, 2),
        'scenes/': {},
        'scripts/': {},
        'resources/': {
          'textures/': {},
          'models/': {},
          'audio/': {},
          'materials/': {}
        },
        'exports/': {}
      }

      // 根据模板创建初始文件
      if (project.scenes.length > 0) {
        for (const scene of project.scenes) {
          const sceneContent = createDefaultSceneContent(scene.name, project.settings.renderer)
          projectStructure[scene.path] = sceneContent
        }
      }

      if (project.scripts.length > 0) {
        for (const script of project.scripts) {
          const scriptContent = createDefaultScriptContent(script.name, script.language)
          projectStructure[script.path] = scriptContent
        }
      }

      // 保存项目结构到 localStorage（临时方案）
      localStorage.setItem(`qaq-project-structure-${project.id}`, JSON.stringify(projectStructure))

      console.log('Project structure created')
    } catch (err) {
      console.error('Failed to create project structure:', err)
      throw err
    }
  }

  // 创建默认场景内容
  function createDefaultSceneContent(sceneName: string, renderer: '2D' | '3D'): string {
    if (renderer === '3D') {
      return `[gd_scene load_steps=2 format=3]

[node name="${sceneName}" type="Node3D"]

[node name="MeshInstance3D" type="MeshInstance3D" parent="."]
mesh = SubResource("BoxMesh_1")

[node name="Camera3D" type="Camera3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 0.866025, 0.5, 0, -0.5, 0.866025, 0, 2, 5)

[node name="DirectionalLight3D" type="DirectionalLight3D" parent="."]
transform = Transform3D(0.707107, -0.5, 0.5, 0, 0.707107, 0.707107, -0.707107, -0.5, 0.5, 0, 2, 0)
`
    } else {
      return `[gd_scene load_steps=2 format=3]

[node name="${sceneName}" type="Node2D"]

[node name="Sprite2D" type="Sprite2D" parent="."]
`
    }
  }

  // 创建默认脚本内容
  function createDefaultScriptContent(scriptName: string, language: string): string {
    const className = scriptName.replace('.ts', '').replace('.js', '')

    if (language === 'typescript') {
      return `import { Node } from '~/core'

export class ${className} extends Node {
  constructor(name: string = '${className}') {
    super(name)
  }

  _ready(): void {
    console.log('${className} is ready!')
  }

  _process(delta: number): void {
    // Update logic here
  }
}
`
    } else {
      return `// ${scriptName}
console.log('Script loaded: ${scriptName}')
`
    }
  }

  // 添加到最近项目列表
  function addToRecentProjects(project: QaqProject) {
    // 移除已存在的项目
    recentProjects.value = recentProjects.value.filter(p => p.path !== project.path)

    // 添加到开头
    recentProjects.value.unshift({ ...project })

    // 限制最近项目数量
    if (recentProjects.value.length > 10) {
      recentProjects.value = recentProjects.value.slice(0, 10)
    }

    // 保存到 localStorage
    saveRecentProjects()
  }

  // 从最近项目列表中移除
  function removeFromRecentProjects(projectPath: string) {
    recentProjects.value = recentProjects.value.filter(p => p.path !== projectPath)
    saveRecentProjects()
  }

  // 保存最近项目到 localStorage
  function saveRecentProjects() {
    if (process.client) {
      try {
        localStorage.setItem('qaq-recent-projects', JSON.stringify(recentProjects.value))
      } catch (err) {
        console.warn('Failed to save recent projects:', err)
      }
    }
  }

  // 从 localStorage 加载最近项目
  function loadRecentProjects() {
    if (process.client) {
      try {
        const saved = localStorage.getItem('qaq-recent-projects')
        if (saved) {
          const parsed = JSON.parse(saved)
          recentProjects.value = parsed.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            lastOpened: new Date(p.lastOpened)
          }))
        }
      } catch (err) {
        console.warn('Failed to load recent projects:', err)
      }
    }
  }

  // 从服务器获取用户项目列表
  async function fetchUserProjects() {
    if (!process.client) return

    const authStore = useAuthStore()

    // 等待认证状态稳定
    let retryCount = 0
    const maxRetries = 10

    while (!authStore.token && retryCount < maxRetries) {
      console.log(`🔄 等待认证令牌... (${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 100))
      retryCount++
    }

    if (!authStore.token) {
      console.warn('❌ 等待超时，无认证令牌，无法获取项目列表')
      return
    }

    console.log('✅ 获取到认证令牌，开始获取项目列表')

    try {
      console.log('🔄 开始获取用户项目列表...')
      isLoading.value = true
      error.value = null

      const response = await $fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        query: {
          limit: 20,
          sortBy: 'lastOpened',
          sortOrder: 'desc'
        }
      })

      if (response.success && response.data) {
        const projects = response.data.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          path: project.path,
          version: project.version,
          engineVersion: project.engineVersion,
          createdAt: new Date(project.createdAt),
          lastOpened: new Date(project.lastOpened),
          isPublic: project.isPublic || false,
          settings: project.settings || {},
          owner: project.owner || null,
          stats: project.stats || {
            scenes: 0,
            scripts: 0,
            materials: 0,
            animations: 0,
            assets: 0
          }
        }))

        // 更新项目列表
        recentProjects.value = projects

        // 同时保存到localStorage作为缓存
        saveRecentProjects()

        console.log(`✅ 成功获取 ${projects.length} 个项目`)

        return projects
      } else {
        throw new Error(response.message || '获取项目列表失败')
      }

    } catch (err: any) {
      console.error('❌ 获取用户项目列表失败:', err)

      // 详细的错误信息
      if (err.statusCode === 401) {
        console.error('🔒 认证失败，可能需要重新登录')
        error.value = '认证失败，请重新登录'
      } else if (err.statusCode === 403) {
        console.error('🚫 权限不足')
        error.value = '权限不足'
      } else if (err.statusCode === 404) {
        console.error('🔍 API端点未找到')
        error.value = 'API端点未找到'
      } else if (err.statusCode >= 500) {
        console.error('🔥 服务器错误')
        error.value = '服务器错误，请稍后重试'
      } else {
        error.value = err.message || '获取项目列表失败'
      }

      // 如果API调用失败，尝试从localStorage加载缓存
      console.log('🔄 尝试从缓存加载项目列表...')
      loadRecentProjects()

      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 保存项目列表到localStorage
  function saveRecentProjects() {
    if (process.client) {
      try {
        const projectsToSave = recentProjects.value.map(project => ({
          ...project,
          createdAt: project.createdAt.toISOString(),
          lastOpened: project.lastOpened.toISOString()
        }))
        localStorage.setItem('qaq-recent-projects', JSON.stringify(projectsToSave))
      } catch (err) {
        console.warn('Failed to save recent projects:', err)
      }
    }
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  // 清除所有项目数据（用于登出时）
  function clearProjects() {
    currentProject.value = null
    recentProjects.value = []
    error.value = null

    // 清除localStorage中的项目数据
    if (process.client) {
      try {
        localStorage.removeItem('qaq-recent-projects')
        console.log('✅ 项目数据已清除')
      } catch (err) {
        console.warn('清除项目数据失败:', err)
      }
    }
  }

  return {
    // 状态
    currentProject: readonly(currentProject),
    recentProjects: readonly(recentProjects),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    hasProject,
    projectName,
    projectPath,
    projectScenes,
    projectScripts,
    projectResources,
    projectFiles,

    // 方法
    createProject,
    openProject,
    closeProject,
    saveProject,
    addToRecentProjects,
    removeFromRecentProjects,
    loadRecentProjects,
    saveRecentProjects,
    fetchUserProjects,
    refreshProjectFiles,
    clearError,
    clearProjects
  }
})
