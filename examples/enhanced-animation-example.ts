/**
 * QAQ游戏引擎 - 增强动画系统使用示例
 * 
 * 展示如何使用专业级动画功能：
 * - 动画过渡和混合
 * - 帧事件系统
 * - 动画层管理
 * - 混合树控制
 */

import { EnhancedAnimationPlayer } from '../core/nodes/animation/EnhancedAnimationPlayer'
import { MeshInstance3D } from '../core/nodes/MeshInstance3D'

// ============================================================================
// 基础设置示例
// ============================================================================

export function setupEnhancedAnimationPlayer(character: MeshInstance3D): EnhancedAnimationPlayer {
  // 创建增强动画播放器
  const animPlayer = new EnhancedAnimationPlayer('CharacterAnimator')
  character.addChild(animPlayer)
  animPlayer.setTargetModel(character)

  // ========================================================================
  // 1. 设置动画元数据
  // ========================================================================
  
  // 设置各种动画的属性
  animPlayer.setAnimationMetadata('idle', {
    loop: true,
    blendTime: 0.2,
    priority: 0,
    group: 'locomotion'
  })

  animPlayer.setAnimationMetadata('walk', {
    loop: true,
    blendTime: 0.3,
    priority: 1,
    group: 'locomotion'
  })

  animPlayer.setAnimationMetadata('run', {
    loop: true,
    blendTime: 0.4,
    priority: 2,
    group: 'locomotion'
  })

  animPlayer.setAnimationMetadata('attack', {
    loop: false,
    blendTime: 0.1,
    priority: 10,
    group: 'combat'
  })

  animPlayer.setAnimationMetadata('jump', {
    loop: false,
    blendTime: 0.15,
    priority: 5,
    group: 'movement'
  })

  // ========================================================================
  // 2. 配置动画过渡
  // ========================================================================

  // 从idle到其他动画的过渡
  animPlayer.addTransition({
    from: 'idle',
    to: 'walk',
    duration: 0.3,
    curve: 'ease-out'
  })

  animPlayer.addTransition({
    from: 'idle',
    to: 'run',
    duration: 0.4,
    curve: 'ease-out'
  })

  // 运动动画之间的过渡
  animPlayer.addTransition({
    from: 'walk',
    to: 'run',
    duration: 0.2,
    curve: 'linear'
  })

  animPlayer.addTransition({
    from: 'run',
    to: 'walk',
    duration: 0.3,
    curve: 'ease-in-out'
  })

  // 回到idle的过渡
  animPlayer.addTransition({
    from: 'walk',
    to: 'idle',
    duration: 0.4,
    curve: 'ease-in'
  })

  animPlayer.addTransition({
    from: 'run',
    to: 'idle',
    duration: 0.5,
    curve: 'ease-in'
  })

  // 攻击动画的快速过渡
  animPlayer.addTransition({
    from: 'idle',
    to: 'attack',
    duration: 0.1,
    curve: 'ease-out'
  })

  animPlayer.addTransition({
    from: 'attack',
    to: 'idle',
    duration: 0.2,
    curve: 'ease-in'
  })

  // ========================================================================
  // 3. 设置帧事件
  // ========================================================================

  // 走路动画的脚步声事件
  animPlayer.addFrameEvent({
    animationName: 'walk',
    time: 0.2, // 左脚着地
    eventName: 'footstep_left',
    parameters: ['grass', 0.8], // 地面类型和音量
    callback: (surface: string, volume: number) => {
      console.log(`🦶 左脚踩在${surface}上，音量${volume}`)
      // 这里可以播放脚步声音效
    }
  })

  animPlayer.addFrameEvent({
    animationName: 'walk',
    time: 0.7, // 右脚着地
    eventName: 'footstep_right',
    parameters: ['grass', 0.8],
    callback: (surface: string, volume: number) => {
      console.log(`🦶 右脚踩在${surface}上，音量${volume}`)
    }
  })

  // 攻击动画的伤害判定事件
  animPlayer.addFrameEvent({
    animationName: 'attack',
    time: 0.4, // 攻击生效时间点
    eventName: 'damage_frame',
    parameters: [50, 'sword'], // 伤害值和武器类型
    callback: (damage: number, weaponType: string) => {
      console.log(`⚔️ 造成${damage}点${weaponType}伤害`)
      // 这里可以执行伤害计算逻辑
    }
  })

  // 跳跃动画的起跳事件
  animPlayer.addFrameEvent({
    animationName: 'jump',
    time: 0.1,
    eventName: 'jump_start',
    callback: () => {
      console.log(`🦘 角色开始跳跃`)
      // 这里可以应用跳跃物理力
    }
  })

  // ========================================================================
  // 4. 设置动画层
  // ========================================================================

  // 添加上半身动画层（用于上半身独立动画）
  animPlayer.addLayer('upper_body', 0.8, [
    'spine', 'chest', 'shoulder_L', 'shoulder_R', 
    'arm_L', 'arm_R', 'hand_L', 'hand_R'
  ])

  // 添加面部表情层
  animPlayer.addLayer('facial', 1.0, [
    'head', 'eye_L', 'eye_R', 'mouth'
  ])

  // ========================================================================
  // 5. 设置混合参数
  // ========================================================================

  // 移动速度参数（用于混合walk和run）
  animPlayer.addBlendParameter('speed', 0, 10, 0)

  // 转向参数（用于混合转向动画）
  animPlayer.addBlendParameter('turn_angle', -180, 180, 0)

  // 情绪参数（用于面部表情）
  animPlayer.addBlendParameter('happiness', 0, 1, 0.5)

  // ========================================================================
  // 6. 设置事件监听
  // ========================================================================

  // 监听帧事件
  animPlayer.connect('frame_event_triggered', (eventName: string, animName: string, time: number, params: any[]) => {
    console.log(`🎬 帧事件触发: ${eventName} 在动画 ${animName} 的 ${time}s 处`)
  })

  // 监听过渡事件
  animPlayer.connect('transition_started', (from: string, to: string, duration: number) => {
    console.log(`🔄 开始过渡: ${from} → ${to} (${duration}s)`)
  })

  animPlayer.connect('transition_finished', (from: string, to: string) => {
    console.log(`✅ 过渡完成: ${from} → ${to}`)
  })

  // 监听混合参数变化
  animPlayer.connect('blend_parameter_changed', (paramName: string, value: number) => {
    console.log(`📊 混合参数变化: ${paramName} = ${value}`)
  })

  return animPlayer
}

// ============================================================================
// 使用示例函数
// ============================================================================

/**
 * 角色移动控制示例
 */
export function handleCharacterMovement(animPlayer: EnhancedAnimationPlayer, speed: number) {
  // 更新速度参数
  animPlayer.setBlendParameter('speed', speed)

  // 根据速度选择合适的动画
  if (speed < 0.1) {
    animPlayer.transitionTo('idle')
  } else if (speed < 5) {
    animPlayer.transitionTo('walk')
  } else {
    animPlayer.transitionTo('run')
  }
}

/**
 * 战斗动作示例
 */
export function performAttack(animPlayer: EnhancedAnimationPlayer) {
  // 使用优先级播放攻击动画
  animPlayer.playByPriority('attack')
  
  // 攻击完成后自动回到idle
  animPlayer.queueAnimation('idle')
}

/**
 * 复杂动画序列示例
 */
export function performComboAttack(animPlayer: EnhancedAnimationPlayer) {
  // 清空队列
  animPlayer.clearQueue()
  
  // 添加连击序列
  animPlayer.queueAnimation('attack1')
  animPlayer.queueAnimation('attack2')
  animPlayer.queueAnimation('attack3')
  animPlayer.queueAnimation('idle')
  
  // 开始播放第一个动画
  animPlayer.playNext()
}

/**
 * 情绪表达示例
 */
export function expressEmotion(animPlayer: EnhancedAnimationPlayer, happiness: number) {
  // 在面部层播放表情动画
  animPlayer.playOnLayer('facial', happiness > 0.7 ? 'smile' : 'neutral')
  
  // 更新情绪参数
  animPlayer.setBlendParameter('happiness', happiness)
}

/**
 * 调试信息输出
 */
export function logAnimationState(animPlayer: EnhancedAnimationPlayer) {
  const state = animPlayer.getAnimationState()
  console.log('🎬 动画状态:', state)
  
  const config = animPlayer.exportConfiguration()
  console.log('⚙️ 动画配置:', config)
}

// ============================================================================
// 完整的游戏循环集成示例
// ============================================================================

export class CharacterController {
  private animPlayer: EnhancedAnimationPlayer
  private character: MeshInstance3D
  
  constructor(character: MeshInstance3D) {
    this.character = character
    this.animPlayer = setupEnhancedAnimationPlayer(character)
  }
  
  update(deltaTime: number, inputState: any) {
    // 根据输入更新动画
    const speed = Math.sqrt(inputState.moveX ** 2 + inputState.moveY ** 2)
    handleCharacterMovement(this.animPlayer, speed * 10)
    
    // 处理攻击输入
    if (inputState.attack && !inputState.wasAttacking) {
      performAttack(this.animPlayer)
    }
    
    // 处理情绪变化
    if (inputState.happiness !== undefined) {
      expressEmotion(this.animPlayer, inputState.happiness)
    }
    
    // 每5秒输出一次调试信息
    if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - deltaTime * 1000) / 5000)) {
      logAnimationState(this.animPlayer)
    }
  }
}

export default CharacterController
