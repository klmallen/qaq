/**
 * QAQ游戏引擎信号系统测试
 * 用于验证AnimatedSprite2D的信号系统是否正常工作
 */

import AnimatedSprite2D from '../core/nodes/2d/AnimatedSprite2D'
import { AnimationMode } from '../core/nodes/2d/AnimatedSprite2D'
import * as THREE from 'three'

/**
 * 测试AnimatedSprite2D信号系统
 */
export async function testAnimatedSprite2DSignals(): Promise<boolean> {
  console.log('🧪 开始测试AnimatedSprite2D信号系统...')
  
  try {
    // 创建AnimatedSprite2D实例
    const sprite = new AnimatedSprite2D('TestSprite')
    
    // 测试信号是否存在
    const requiredSignals = [
      'animation_started',
      'animation_finished', 
      'animation_looped',
      'frame_changed',
      'animation_paused',
      'animation_resumed',
      'animation_stopped'
    ]
    
    console.log('📋 检查信号是否存在...')
    for (const signalName of requiredSignals) {
      if (!sprite.hasSignal(signalName)) {
        console.error(`❌ 信号不存在: ${signalName}`)
        return false
      }
      console.log(`✅ 信号存在: ${signalName}`)
    }
    
    // 测试connect方法是否存在
    if (typeof sprite.connect !== 'function') {
      console.error('❌ connect方法不存在')
      return false
    }
    console.log('✅ connect方法存在')
    
    // 测试emit方法是否存在
    if (typeof sprite.emit !== 'function') {
      console.error('❌ emit方法不存在')
      return false
    }
    console.log('✅ emit方法存在')
    
    // 测试disconnect方法是否存在
    if (typeof sprite.disconnect !== 'function') {
      console.error('❌ disconnect方法不存在')
      return false
    }
    console.log('✅ disconnect方法存在')
    
    // 测试信号连接和回调
    let signalReceived = false
    let receivedData: any = null
    
    const testCallback = (data: any) => {
      signalReceived = true
      receivedData = data
      console.log('📡 收到信号回调:', data)
    }
    
    // 连接信号
    sprite.connect('animation_started', testCallback)
    console.log('✅ 信号连接成功')
    
    // 手动发射信号进行测试
    const testData = { animation: 'test_animation', fromFrame: 0 }
    sprite.emit('animation_started', testData)
    
    // 验证回调是否被调用
    if (!signalReceived) {
      console.error('❌ 信号回调未被调用')
      return false
    }
    
    if (JSON.stringify(receivedData) !== JSON.stringify(testData)) {
      console.error('❌ 信号数据不匹配')
      console.error('期望:', testData)
      console.error('实际:', receivedData)
      return false
    }
    
    console.log('✅ 信号回调正常工作')
    
    // 测试信号断开
    sprite.disconnect('animation_started', testCallback)
    signalReceived = false
    sprite.emit('animation_started', testData)
    
    if (signalReceived) {
      console.error('❌ 信号断开后仍然收到回调')
      return false
    }
    
    console.log('✅ 信号断开正常工作')
    
    console.log('🎉 AnimatedSprite2D信号系统测试通过！')
    return true
    
  } catch (error) {
    console.error('❌ 信号系统测试失败:', error)
    return false
  }
}

/**
 * 测试动画播放时的信号发射
 */
export async function testAnimationSignals(): Promise<boolean> {
  console.log('🧪 开始测试动画播放信号...')
  
  try {
    const sprite = new AnimatedSprite2D('TestAnimationSprite')
    
    // 创建测试动画
    await createTestAnimation(sprite)
    
    // 信号接收器
    const signalLog: Array<{ signal: string, data: any }> = []
    
    const logSignal = (signalName: string) => (data: any) => {
      signalLog.push({ signal: signalName, data })
      console.log(`📡 收到信号: ${signalName}`, data)
    }
    
    // 连接所有动画信号
    sprite.connect('animation_started', logSignal('animation_started'))
    sprite.connect('animation_finished', logSignal('animation_finished'))
    sprite.connect('animation_looped', logSignal('animation_looped'))
    sprite.connect('frame_changed', logSignal('frame_changed'))
    sprite.connect('animation_paused', logSignal('animation_paused'))
    sprite.connect('animation_resumed', logSignal('animation_resumed'))
    sprite.connect('animation_stopped', logSignal('animation_stopped'))
    
    // 测试播放动画
    console.log('▶️ 开始播放测试动画...')
    sprite.play('test_animation')
    
    // 等待一小段时间让动画播放
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 验证是否收到animation_started信号
    const startedSignals = signalLog.filter(log => log.signal === 'animation_started')
    if (startedSignals.length === 0) {
      console.error('❌ 未收到animation_started信号')
      return false
    }
    console.log('✅ 收到animation_started信号')
    
    // 测试暂停
    sprite.pause()
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const pausedSignals = signalLog.filter(log => log.signal === 'animation_paused')
    if (pausedSignals.length === 0) {
      console.error('❌ 未收到animation_paused信号')
      return false
    }
    console.log('✅ 收到animation_paused信号')
    
    // 测试恢复
    sprite.resume()
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const resumedSignals = signalLog.filter(log => log.signal === 'animation_resumed')
    if (resumedSignals.length === 0) {
      console.error('❌ 未收到animation_resumed信号')
      return false
    }
    console.log('✅ 收到animation_resumed信号')
    
    // 测试停止
    sprite.stop()
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const stoppedSignals = signalLog.filter(log => log.signal === 'animation_stopped')
    if (stoppedSignals.length === 0) {
      console.error('❌ 未收到animation_stopped信号')
      return false
    }
    console.log('✅ 收到animation_stopped信号')
    
    console.log('🎉 动画播放信号测试通过！')
    return true
    
  } catch (error) {
    console.error('❌ 动画信号测试失败:', error)
    return false
  }
}

/**
 * 创建测试动画
 */
async function createTestAnimation(sprite: AnimatedSprite2D): Promise<void> {
  const frames = []
  
  // 创建4帧简单的测试动画
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    
    // 绘制简单的彩色方块
    ctx.fillStyle = `hsl(${i * 90}, 70%, 50%)`
    ctx.fillRect(0, 0, 64, 64)
    
    // 添加帧编号
    ctx.fillStyle = 'white'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(i.toString(), 32, 40)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    
    frames.push(texture)
  }
  
  // 添加动画序列
  sprite.addAnimationSequence({
    name: 'test_animation',
    frames: frames,
    frameRate: 10,
    mode: AnimationMode.LOOP,
    autoPlay: false
  })
  
  console.log('✅ 测试动画创建完成')
}

/**
 * 运行所有信号系统测试
 */
export async function runAllSignalTests(): Promise<boolean> {
  console.log('🚀 开始运行所有信号系统测试...')
  
  const test1 = await testAnimatedSprite2DSignals()
  const test2 = await testAnimationSignals()
  
  const allPassed = test1 && test2
  
  if (allPassed) {
    console.log('🎉 所有信号系统测试通过！')
  } else {
    console.log('❌ 部分信号系统测试失败')
  }
  
  return allPassed
}
