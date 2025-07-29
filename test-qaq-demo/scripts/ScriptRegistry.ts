/**
 * 脚本注册器
 * 负责注册所有示例脚本类到脚本管理器
 */

import ScriptManager from '../../core/script/ScriptManager'
import { RotatingSprite } from './RotatingSprite'
import { MovingCharacter } from './MovingCharacter'
import { InteractiveButton } from './InteractiveButton'
import { NodeExplorerScript } from './NodeExplorerScript'
import { Position2DTest } from './Position2DTest'

/**
 * 注册所有示例脚本
 */
export function registerDemoScripts(): void {
  const scriptManager = ScriptManager.getInstance()

  // 注册旋转精灵脚本
  scriptManager.registerScriptClass('RotatingSprite', RotatingSprite)
  console.log('✅ RotatingSprite script registered')

  // 注册移动角色脚本
  scriptManager.registerScriptClass('MovingCharacter', MovingCharacter)
  console.log('✅ MovingCharacter script registered')

  // 注册交互式按钮脚本
  scriptManager.registerScriptClass('InteractiveButton', InteractiveButton)
  console.log('✅ InteractiveButton script registered')

  // 注册Node探索器脚本
  scriptManager.registerScriptClass('NodeExplorerScript', NodeExplorerScript)
  console.log('✅ NodeExplorerScript script registered')

  // 注册2D位置测试脚本
  scriptManager.registerScriptClass('Position2DTest', Position2DTest)
  console.log('✅ Position2DTest script registered')

  console.log('🎯 All demo scripts registered successfully')
}

/**
 * 获取所有可用的脚本类名
 */
export function getAvailableScripts(): string[] {
  return [
    'RotatingSprite',
    'MovingCharacter',
    'InteractiveButton',
    'NodeExplorerScript',
    'Position2DTest'
  ]
}

/**
 * 获取脚本描述信息
 */
export function getScriptDescription(scriptName: string): string {
  const descriptions: Record<string, string> = {
    'RotatingSprite': '旋转精灵脚本 - 提供旋转和缩放动画效果',
    'MovingCharacter': '移动角色脚本 - 在场景中自动移动并处理边界反弹',
    'InteractiveButton': '交互式按钮脚本 - 提供悬停、点击等交互效果',
    'NodeExplorerScript': 'Node探索器脚本 - 演示如何访问节点的所有方法和属性',
    'Position2DTest': '2D位置测试脚本 - 验证2D坐标系统和位置变化的正确性'
  }

  return descriptions[scriptName] || '未知脚本'
}

/**
 * 获取脚本使用示例
 */
export function getScriptExample(scriptName: string): string {
  const examples: Record<string, string> = {
    'RotatingSprite': `
// 使用示例：
const sprite = new Sprite2D('MySprite')
sprite.attachScript('RotatingSprite')

// 脚本会自动让精灵旋转并产生缩放动画
// 可以通过脚本实例调用方法：
// scriptInstance.setRotationSpeed(2.0)
// scriptInstance.setScaleAnimation(0.3, 1.5)
`,
    'MovingCharacter': `
// 使用示例：
const character = new Sprite2D('MyCharacter')
character.attachScript('MovingCharacter')

// 脚本会让角色在场景中移动并处理边界反弹
// 可以通过脚本实例调用方法：
// scriptInstance.setMoveSpeed(150)
// scriptInstance.setBounds(-400, 400, -300, 300)
`,
    'InteractiveButton': `
// 使用示例：
const button = new Button2D('MyButton')
button.attachScript('InteractiveButton')

// 脚本会为按钮添加悬停和点击效果
// 可以通过脚本实例调用方法：
// scriptInstance.setHoverEffect(8)
// scriptInstance.setPulseEffect(3, 0.15)
`
  }

  return examples[scriptName] || '暂无示例'
}

export default {
  registerDemoScripts,
  getAvailableScripts,
  getScriptDescription,
  getScriptExample
}
