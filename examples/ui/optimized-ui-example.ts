/**
 * QAQ游戏引擎 - 优化UI示例
 * 
 * 展示如何使用UI优化系统（纹理图集、批量渲染、视口剔除）
 */

import * as THREE from 'three'
import Button from '../../core/nodes/ui/Button'
import { UITextureAtlas } from '../../core/ui/UITextureAtlas'
import { UIBatchRenderer } from '../../core/ui/UIBatchRenderer'
import { UICullManager, UIBounds } from '../../core/ui/UIFrustumCuller'
import { DepthLayer } from '../../core/ui/UIDepthManager'

/**
 * 优化UI示例类
 */
export class OptimizedUIExample {
  // Three.js相关
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  
  // UI系统
  private textureAtlas: UITextureAtlas
  private batchRenderer: UIBatchRenderer
  private cullManager: UICullManager
  
  // UI元素
  private buttons: Button[] = []
  
  // 性能统计
  private stats = {
    fps: 0,
    drawCalls: 0,
    visibleElements: 0,
    culledElements: 0,
    memoryUsage: 0
  }
  
  /**
   * 构造函数
   * @param container 容器元素
   */
  constructor(container: HTMLElement) {
    // 初始化Three.js
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.z = 5
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x1a1a1a)
    container.appendChild(this.renderer.domElement)
    
    // 初始化UI优化系统
    this.textureAtlas = UITextureAtlas.getInstance()
    this.batchRenderer = UIBatchRenderer.getInstance()
    this.cullManager = UICullManager.getInstance()
    
    // 设置批量渲染器的场景
    this.batchRenderer.setScene(this.scene)
    
    // 创建UI元素
    this.createUIElements()
    
    // 设置窗口大小变化监听
    window.addEventListener('resize', this.onWindowResize.bind(this))
    
    // 开始渲染循环
    this.animate()
  }
  
  /**
   * 创建UI元素
   */
  private createUIElements(): void {
    // 创建大量按钮
    const gridSize = 20
    const spacing = 1.2
    const buttonSize = { x: 1, y: 0.3 }
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const button = new Button(`Button_${x}_${y}`, {
          text: `Button ${x},${y}`,
          disabled: false
        })
        
        // 设置位置
        const posX = (x - gridSize / 2) * spacing
        const posY = (y - gridSize / 2) * spacing
        button.position = { x: posX, y: posY, z: 0 }
        
        // 设置尺寸
        button.size = buttonSize
        
        // 设置Z索引
        button.zIndex = y
        
        // 添加到按钮列表
        this.buttons.push(button)
        
        // 分配纹理图集区域
        const region = this.textureAtlas.allocateRegion(
          button.name,
          buttonSize.x * 100, // 像素尺寸
          buttonSize.y * 100  // 像素尺寸
        )
        
        if (region) {
          // 添加到批量渲染器
          this.batchRenderer.addUIElement(
            button.name,
            button.position,
            buttonSize,
            region.uvOffset,
            region.uvScale,
            button.zIndex,
            DepthLayer.UI_CONTENT,
            new THREE.Color(1, 1, 1),
            1
          )
          
          // 更新区域内容
          this.textureAtlas.updateRegion(button.name, (ctx) => {
            // 绘制按钮背景
            ctx.fillStyle = '#4a4a4a'
            ctx.fillRect(0, 0, region.rect.width, region.rect.height)
            
            // 绘制按钮边框
            ctx.strokeStyle = '#646cff'
            ctx.lineWidth = 2
            ctx.strokeRect(1, 1, region.rect.width - 2, region.rect.height - 2)
            
            // 绘制按钮文本
            ctx.fillStyle = '#ffffff'
            ctx.font = '14px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(
              button.text,
              region.rect.width / 2,
              region.rect.height / 2
            )
          })
        }
      }
    }
    
    console.log(`Created ${this.buttons.length} buttons`)
  }
  
  /**
   * 窗口大小变化处理
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  
  /**
   * 动画循环
   */
  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))
    
    // 更新相机位置（简单动画）
    const time = performance.now() * 0.001
    this.camera.position.x = Math.sin(time * 0.5) * 5
    this.camera.position.y = Math.cos(time * 0.3) * 2
    this.camera.position.z = 5 + Math.sin(time * 0.2) * 2
    this.camera.lookAt(0, 0, 0)
    
    // 执行视口剔除
    const cullResult = this.cullManager.cull(this.buttons, this.camera)
    
    // 更新批量渲染器中的可见性
    cullResult.visible.forEach(button => {
      this.batchRenderer.updateUIElement(
        button.name,
        { visible: true },
        button.zIndex,
        DepthLayer.UI_CONTENT
      )
    })
    
    cullResult.culled.forEach(button => {
      this.batchRenderer.updateUIElement(
        button.name,
        { visible: false },
        button.zIndex,
        DepthLayer.UI_CONTENT
      )
    })
    
    // 渲染批次
    this.batchRenderer.render()
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera)
    
    // 更新性能统计
    this.updateStats()
  }
  
  /**
   * 更新性能统计
   */
  private updateStats(): void {
    // 计算FPS
    const now = performance.now()
    static let lastTime = now
    static let frameCount = 0
    
    frameCount++
    
    if (now - lastTime >= 1000) {
      this.stats.fps = frameCount
      frameCount = 0
      lastTime = now
      
      // 更新其他统计信息
      const batchStats = this.batchRenderer.getStats()
      const cullStats = this.cullManager.getLastStats()
      
      this.stats.drawCalls = batchStats.drawCalls
      this.stats.memoryUsage = batchStats.memoryUsage
      
      if (cullStats) {
        this.stats.visibleElements = cullStats.visibleCount
        this.stats.culledElements = cullStats.total - cullStats.visibleCount
      }
      
      // 输出统计信息
      console.log(`FPS: ${this.stats.fps}, Draw Calls: ${this.stats.drawCalls}, Visible: ${this.stats.visibleElements}, Culled: ${this.stats.culledElements}`)
    }
  }
  
  /**
   * 获取性能统计
   */
  getStats(): typeof this.stats {
    return { ...this.stats }
  }
  
  /**
   * 销毁示例
   */
  destroy(): void {
    // 清理按钮
    this.buttons.forEach(button => {
      button.destroy()
      
      // 从纹理图集中释放区域
      this.textureAtlas.deallocateRegion(button.name)
      
      // 从批量渲染器中移除
      this.batchRenderer.removeUIElement(
        button.name,
        button.zIndex,
        DepthLayer.UI_CONTENT
      )
    })
    
    // 清理Three.js资源
    this.renderer.dispose()
    
    // 移除事件监听
    window.removeEventListener('resize', this.onWindowResize.bind(this))
  }
}

/**
 * 创建并运行优化UI示例
 * @param containerId 容器元素ID
 */
export function createOptimizedUIExample(containerId: string): OptimizedUIExample {
  const container = document.getElementById(containerId)
  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`)
  }
  
  return new OptimizedUIExample(container)
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div')
    container.style.width = '100vw'
    container.style.height = '100vh'
    document.body.appendChild(container)
    
    const example = new OptimizedUIExample(container)
    
    // 添加到全局对象以便调试
    ;(window as any).uiExample = example
  })
}
