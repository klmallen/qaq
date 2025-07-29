import type Node from '../nodes/Node'
import type Engine from '../engine/Engine'
import ScriptBase from './ScriptBase'

export enum GameMode {
  EDITOR = 'editor',
  PLAY = 'play',
  PAUSE = 'pause',
  DEBUG = 'debug'
}

export interface ScriptInstance {
  instance: ScriptBase
  node: Node
  className: string
  createdAt: number
  initialized: boolean
  active: boolean
}

export type ScriptConstructor = new (node: Node) => ScriptBase

export class ScriptManager {
  private static _instance: ScriptManager | null = null
  private _engine: Engine | null = null
  private _gameMode: GameMode = GameMode.EDITOR
  private _scriptInstances: Map<string, ScriptInstance> = new Map()
  private _scriptClasses: Map<string, ScriptConstructor> = new Map()
  private _scriptPaths: Map<string, string> = new Map() // className -> filePath
  private _nodeScripts: Map<string, string[]> = new Map() // nodeId -> scriptClassNames[]

  private constructor() {}

  static getInstance(): ScriptManager {
    if (!ScriptManager._instance) {
      ScriptManager._instance = new ScriptManager()
    }
    return ScriptManager._instance
  }

  initialize(engine: Engine): void {
    this._engine = engine
    console.log('🎯 ScriptManager initialized')
  }

  setGameMode(mode: GameMode): void {
    if (this._gameMode !== mode) {
      this._gameMode = mode
      this._updateScriptsForMode(mode)
      if (mode === GameMode.PLAY) {
        this.initializeAllScripts()
      }
    }
  }

  getGameMode(): GameMode {
    return this._gameMode
  }

  isPlayMode(): boolean {
    return this._gameMode === GameMode.PLAY || this._gameMode === GameMode.DEBUG
  }

  registerScriptClass(className: string, scriptClass: ScriptConstructor, filePath?: string): void {
    this._scriptClasses.set(className, scriptClass)
    if (filePath) {
      this._scriptPaths.set(className, filePath)
    }
    console.log(`📜 注册脚本类: ${className}${filePath ? ` (${filePath})` : ''}`)
  }

  getScriptClass(className: string): ScriptConstructor | undefined {
    return this._scriptClasses.get(className)
  }

  /**
   * 获取脚本类的文件路径
   */
  getScriptPath(className: string): string | undefined {
    return this._scriptPaths.get(className)
  }

  /**
   * 获取节点关联的脚本类名列表
   */
  getNodeScripts(nodeId: string): string[] {
    return this._nodeScripts.get(nodeId) || []
  }

  /**
   * 为节点添加脚本关联
   */
  addNodeScript(nodeId: string, className: string): void {
    const scripts = this._nodeScripts.get(nodeId) || []
    if (!scripts.includes(className)) {
      scripts.push(className)
      this._nodeScripts.set(nodeId, scripts)
    }
  }

  /**
   * 从节点移除脚本关联
   */
  removeNodeScript(nodeId: string, className: string): void {
    const scripts = this._nodeScripts.get(nodeId)
    if (scripts) {
      const index = scripts.indexOf(className)
      if (index > -1) {
        scripts.splice(index, 1)
        if (scripts.length === 0) {
          this._nodeScripts.delete(nodeId)
        }
      }
    }
  }

  attachScriptToNode(node: Node, className: string): boolean {
    const ScriptClass = this._scriptClasses.get(className)
    if (!ScriptClass) {
      console.error(`❌ Script class not found: ${className}`)
      return false
    }

    try {
      const instance = new ScriptClass(node)
      const nodeId = node.getInstanceId()
      const scriptInstance: ScriptInstance = {
        instance,
        node,
        className,
        createdAt: Date.now(),
        initialized: false,
        active: this.isPlayMode()
      }

      const instanceId = `${node.id}_${className}`
      this._scriptInstances.set(instanceId, scriptInstance)
      node.attachScript(className, scriptInstance) // Let the node know about it

      // 记录节点脚本关联
      this.addNodeScript(nodeId, className)

      // If we are already in a running scene, initialize the script immediately
      if (this.isPlayMode() && node.isInsideTree) {
        this.initializeScript(scriptInstance)
      }

      console.log(`✅ 脚本已附加到节点: ${node.name} -> ${className}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to create script instance: ${className}`, error)
      return false
    }
  }

  destroyNodeScripts(node: Node): void {
    const scriptsToDestroy = node.getScriptClassNames()
    for (const className of scriptsToDestroy) {
      const instanceId = `${node.id}_${className}`
      const scriptInstance = this._scriptInstances.get(instanceId)
      if (scriptInstance) {
        if (scriptInstance.instance._exit_tree) {
          scriptInstance.instance._exit_tree()
        }
        this._scriptInstances.delete(instanceId)
      }
    }
  }

  initializeAllScripts(): void {
    if (!this.isPlayMode()) return
    this._scriptInstances.forEach(script => {
        if (!script.initialized) {
            this.initializeScript(script);
        }
    });
  }

  initializeScript(scriptInstance: ScriptInstance): void {
    if (scriptInstance.initialized || !this.isPlayMode()) {
      return
    }

    try {
      if (scriptInstance.instance._ready) {
        scriptInstance.instance._ready()
      }
      scriptInstance.instance._markInitialized()
      scriptInstance.initialized = true
    } catch (error) {
      console.error(`❌ Error initializing script: ${scriptInstance.className}`, error)
    }
  }

  processScripts(deltaTime: number): void {
    if (!this.isPlayMode()) return

    for (const scriptInstance of this._scriptInstances.values()) {
      if (!scriptInstance.active || !scriptInstance.initialized) continue

      if (scriptInstance.instance._process) {
        scriptInstance.instance._process(deltaTime)
      }
    }
  }

  processPhysicsScripts(deltaTime: number): void {
    if (!this.isPlayMode()) return

    for (const scriptInstance of this._scriptInstances.values()) {
      if (!scriptInstance.active || !scriptInstance.initialized) continue

      if (scriptInstance.instance._physics_process) {
        scriptInstance.instance._physics_process(deltaTime)
      }
    }
  }

  private _updateScriptsForMode(mode: GameMode): void {
    const shouldBeActive = this.isPlayMode()
    for (const scriptInstance of this._scriptInstances.values()) {
      scriptInstance.active = shouldBeActive
      scriptInstance.instance._setActive(shouldBeActive)
    }
  }

  cleanup(): void {
    for (const scriptInstance of this._scriptInstances.values()) {
      if (scriptInstance.instance._exit_tree) {
        scriptInstance.instance._exit_tree()
      }
    }
    this._scriptInstances.clear()
    console.log('🧹 ScriptManager cleaned up')
  }

  // ========================================================================
  // 序列化方法
  // ========================================================================

  /**
   * 序列化脚本系统数据
   */
  serialize(): any {
    const registeredClasses: Record<string, any> = {}
    const scriptInstances: Record<string, any> = {}

    // 序列化注册的脚本类
    for (const [className, scriptClass] of this._scriptClasses.entries()) {
      registeredClasses[className] = {
        className: className,
        filePath: this._scriptPaths.get(className) || null,
        constructorName: scriptClass.name,
        registeredAt: Date.now()
      }
    }

    // 序列化脚本实例
    for (const [instanceId, scriptInstance] of this._scriptInstances.entries()) {
      const nodeId = scriptInstance.node.getInstanceId()
      scriptInstances[instanceId] = {
        instanceId: instanceId,
        nodeId: nodeId,
        nodeName: scriptInstance.node.name,
        className: scriptInstance.className,
        filePath: this._scriptPaths.get(scriptInstance.className) || null,
        createdAt: scriptInstance.createdAt,
        initialized: scriptInstance.initialized,
        active: scriptInstance.active,
        // 序列化脚本实例的状态（如果脚本有serialize方法）
        scriptState: this.serializeScriptState(scriptInstance.instance)
      }
    }

    // 序列化节点脚本关联
    const nodeScriptMappings: Record<string, string[]> = {}
    for (const [nodeId, scriptClassNames] of this._nodeScripts.entries()) {
      nodeScriptMappings[nodeId] = [...scriptClassNames]
    }

    return {
      gameMode: this._gameMode,
      registeredClasses,
      scriptInstances,
      nodeScriptMappings,
      totalClasses: this._scriptClasses.size,
      totalInstances: this._scriptInstances.size,
      serializedAt: Date.now()
    }
  }

  /**
   * 序列化单个脚本实例的状态
   */
  private serializeScriptState(scriptInstance: ScriptBase): any {
    try {
      // 如果脚本实例有serialize方法，调用它
      if (typeof (scriptInstance as any).serialize === 'function') {
        return (scriptInstance as any).serialize()
      }

      // 否则序列化基础属性
      return {
        className: scriptInstance.constructor.name,
        // 可以添加更多通用属性
      }
    } catch (error) {
      console.warn('⚠️ 脚本状态序列化失败:', error)
      return null
    }
  }

  /**
   * 获取所有脚本路径映射
   */
  getScriptPathMappings(): Record<string, string> {
    const mappings: Record<string, string> = {}
    for (const [className, filePath] of this._scriptPaths.entries()) {
      mappings[className] = filePath
    }
    return mappings
  }

  /**
   * 获取所有节点脚本关联
   */
  getNodeScriptMappings(): Record<string, string[]> {
    const mappings: Record<string, string[]> = {}
    for (const [nodeId, scriptClassNames] of this._nodeScripts.entries()) {
      mappings[nodeId] = [...scriptClassNames]
    }
    return mappings
  }
}

export default ScriptManager