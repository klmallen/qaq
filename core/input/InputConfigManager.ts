/**
 * QAQ游戏引擎 - 输入配置管理器
 * 
 * 提供输入映射的配置文件支持，包括：
 * - JSON格式的配置文件加载/保存
 * - 运行时动态修改按键映射
 * - 配置文件验证和错误处理
 * - 多配置文件支持（不同游戏模式）
 * 
 * @author QAQ Engine Team
 * @version 1.0.0
 */

import type { InputActionConfig, InputMappingConfig } from './InputManager'
import { InputActionValueType } from './InputManager'

/**
 * 输入配置文件格式
 */
export interface InputConfigFile {
  version: string
  name: string
  description?: string
  actions: InputActionConfig[]
  mappings: InputMappingConfig[]
  settings?: {
    globalDeadzone?: number
    mouseSensitivity?: number
    gamepadSensitivity?: number
    smoothingFactor?: number
  }
}

/**
 * 输入配置管理器
 * 
 * 负责输入配置的加载、保存、验证和管理
 */
export class InputConfigManager {
  private static _instance: InputConfigManager | null = null
  
  private _configs: Map<string, InputConfigFile> = new Map()
  private _currentConfig: string | null = null

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): InputConfigManager {
    if (!this._instance) {
      this._instance = new InputConfigManager()
    }
    return this._instance
  }

  /**
   * 加载配置文件
   * 
   * @param configName 配置名称
   * @param filePath 文件路径或配置对象
   * @returns 是否加载成功
   */
  async loadConfig(configName: string, filePath: string | InputConfigFile): Promise<boolean> {
    try {
      let config: InputConfigFile

      if (typeof filePath === 'string') {
        // 从文件加载
        const response = await fetch(filePath)
        if (!response.ok) {
          throw new Error(`Failed to load config file: ${filePath}`)
        }
        config = await response.json()
      } else {
        // 直接使用配置对象
        config = filePath
      }

      // 验证配置
      if (!this._validateConfig(config)) {
        throw new Error(`Invalid config format: ${configName}`)
      }

      this._configs.set(configName, config)
      console.log(`✅ Input config loaded: ${configName}`)
      return true

    } catch (error) {
      console.error(`❌ Failed to load input config ${configName}:`, error)
      return false
    }
  }

  /**
   * 保存配置文件
   * 
   * @param configName 配置名称
   * @param filePath 保存路径（可选，用于浏览器下载）
   * @returns 配置文件内容
   */
  async saveConfig(configName: string, filePath?: string): Promise<string | null> {
    const config = this._configs.get(configName)
    if (!config) {
      console.error(`Config not found: ${configName}`)
      return null
    }

    try {
      const configJson = JSON.stringify(config, null, 2)

      if (filePath) {
        // 在浏览器中触发下载
        this._downloadConfig(configJson, `${configName}.json`)
      }

      console.log(`✅ Config saved: ${configName}`)
      return configJson

    } catch (error) {
      console.error(`❌ Failed to save config ${configName}:`, error)
      return null
    }
  }

  /**
   * 获取配置
   * 
   * @param configName 配置名称
   * @returns 配置对象
   */
  getConfig(configName: string): InputConfigFile | null {
    return this._configs.get(configName) || null
  }

  /**
   * 设置当前配置
   * 
   * @param configName 配置名称
   * @returns 是否设置成功
   */
  setCurrentConfig(configName: string): boolean {
    if (!this._configs.has(configName)) {
      console.error(`Config not found: ${configName}`)
      return false
    }

    this._currentConfig = configName
    console.log(`🎯 Current input config set to: ${configName}`)
    return true
  }

  /**
   * 获取当前配置
   * 
   * @returns 当前配置对象
   */
  getCurrentConfig(): InputConfigFile | null {
    if (!this._currentConfig) return null
    return this._configs.get(this._currentConfig) || null
  }

  /**
   * 创建新配置
   * 
   * @param configName 配置名称
   * @param baseConfig 基础配置（可选）
   * @returns 新配置对象
   */
  createConfig(configName: string, baseConfig?: InputConfigFile): InputConfigFile {
    const newConfig: InputConfigFile = baseConfig ? 
      JSON.parse(JSON.stringify(baseConfig)) : // 深拷贝
      {
        version: '1.0.0',
        name: configName,
        description: `Input configuration for ${configName}`,
        actions: [],
        mappings: [],
        settings: {
          globalDeadzone: 0.1,
          mouseSensitivity: 1.0,
          gamepadSensitivity: 1.0,
          smoothingFactor: 0.1
        }
      }

    newConfig.name = configName
    this._configs.set(configName, newConfig)
    console.log(`✨ Created new input config: ${configName}`)
    return newConfig
  }

  /**
   * 删除配置
   * 
   * @param configName 配置名称
   * @returns 是否删除成功
   */
  deleteConfig(configName: string): boolean {
    if (!this._configs.has(configName)) {
      console.error(`Config not found: ${configName}`)
      return false
    }

    this._configs.delete(configName)
    
    if (this._currentConfig === configName) {
      this._currentConfig = null
    }

    console.log(`🗑️ Deleted input config: ${configName}`)
    return true
  }

  /**
   * 获取所有配置名称
   * 
   * @returns 配置名称数组
   */
  getConfigNames(): string[] {
    return Array.from(this._configs.keys())
  }

  /**
   * 添加动作到配置
   * 
   * @param configName 配置名称
   * @param action 动作配置
   * @returns 是否添加成功
   */
  addActionToConfig(configName: string, action: InputActionConfig): boolean {
    const config = this._configs.get(configName)
    if (!config) {
      console.error(`Config not found: ${configName}`)
      return false
    }

    // 检查是否已存在
    const existingIndex = config.actions.findIndex(a => a.name === action.name)
    if (existingIndex !== -1) {
      config.actions[existingIndex] = action
      console.log(`🔄 Updated action in config ${configName}: ${action.name}`)
    } else {
      config.actions.push(action)
      console.log(`➕ Added action to config ${configName}: ${action.name}`)
    }

    return true
  }

  /**
   * 添加映射到配置
   * 
   * @param configName 配置名称
   * @param mapping 映射配置
   * @returns 是否添加成功
   */
  addMappingToConfig(configName: string, mapping: InputMappingConfig): boolean {
    const config = this._configs.get(configName)
    if (!config) {
      console.error(`Config not found: ${configName}`)
      return false
    }

    config.mappings.push(mapping)
    console.log(`🔗 Added mapping to config ${configName}: ${mapping.key || mapping.mouseButton || mapping.gamepadButton} -> ${mapping.action}`)
    return true
  }

  /**
   * 从配置中移除映射
   * 
   * @param configName 配置名称
   * @param action 动作名称
   * @param key 按键（可选，如果不指定则移除该动作的所有映射）
   * @returns 是否移除成功
   */
  removeMappingFromConfig(configName: string, action: string, key?: string): boolean {
    const config = this._configs.get(configName)
    if (!config) {
      console.error(`Config not found: ${configName}`)
      return false
    }

    const initialLength = config.mappings.length

    if (key) {
      // 移除特定按键的映射
      config.mappings = config.mappings.filter(m => !(m.action === action && m.key === key))
    } else {
      // 移除该动作的所有映射
      config.mappings = config.mappings.filter(m => m.action !== action)
    }

    const removedCount = initialLength - config.mappings.length
    if (removedCount > 0) {
      console.log(`🗑️ Removed ${removedCount} mapping(s) from config ${configName} for action: ${action}`)
      return true
    }

    return false
  }

  /**
   * 验证配置文件格式
   * 
   * @param config 配置对象
   * @returns 是否有效
   */
  private _validateConfig(config: any): config is InputConfigFile {
    if (!config || typeof config !== 'object') {
      return false
    }

    // 检查必需字段
    if (!config.version || !config.name || !Array.isArray(config.actions) || !Array.isArray(config.mappings)) {
      return false
    }

    // 验证动作配置
    for (const action of config.actions) {
      if (!action.name || !action.valueType || !Object.values(InputActionValueType).includes(action.valueType)) {
        return false
      }
    }

    // 验证映射配置
    for (const mapping of config.mappings) {
      if (!mapping.action) {
        return false
      }
      
      // 至少要有一种输入方式
      if (!mapping.key && mapping.mouseButton === undefined && mapping.gamepadButton === undefined && mapping.gamepadAxis === undefined) {
        return false
      }
    }

    return true
  }

  /**
   * 在浏览器中下载配置文件
   * 
   * @param content 文件内容
   * @param filename 文件名
   */
  private _downloadConfig(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }

  /**
   * 获取默认配置
   * 
   * @returns 默认配置对象
   */
  static getDefaultConfig(): InputConfigFile {
    return {
      version: '1.0.0',
      name: 'Default',
      description: 'Default input configuration for QAQ Engine',
      actions: [
        { name: 'MoveForward', valueType: InputActionValueType.FLOAT, description: 'Move forward' },
        { name: 'MoveBackward', valueType: InputActionValueType.FLOAT, description: 'Move backward' },
        { name: 'MoveLeft', valueType: InputActionValueType.FLOAT, description: 'Move left' },
        { name: 'MoveRight', valueType: InputActionValueType.FLOAT, description: 'Move right' },
        { name: 'TurnLeft', valueType: InputActionValueType.FLOAT, description: 'Turn left' },
        { name: 'TurnRight', valueType: InputActionValueType.FLOAT, description: 'Turn right' },
        { name: 'Jump', valueType: InputActionValueType.BOOLEAN, description: 'Jump' },
        { name: 'LookX', valueType: InputActionValueType.FLOAT, description: 'Look horizontal' },
        { name: 'LookY', valueType: InputActionValueType.FLOAT, description: 'Look vertical' }
      ],
      mappings: [
        { action: 'MoveForward', key: 'KeyW' },
        { action: 'MoveBackward', key: 'KeyS' },
        { action: 'MoveLeft', key: 'KeyA' },
        { action: 'MoveRight', key: 'KeyD' },
        { action: 'TurnLeft', key: 'KeyQ' },
        { action: 'TurnRight', key: 'KeyE' },
        { action: 'Jump', key: 'Space' },
        { action: 'LookX', key: 'MouseX' },
        { action: 'LookY', key: 'MouseY' }
      ],
      settings: {
        globalDeadzone: 0.1,
        mouseSensitivity: 1.0,
        gamepadSensitivity: 1.0,
        smoothingFactor: 0.1
      }
    }
  }
}
