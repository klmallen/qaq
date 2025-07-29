/**
 * QAQ游戏引擎 - UI批量渲染系统
 * 
 * 减少Draw Call，提高UI渲染性能
 * 将相同深度层级的UI元素合并为一次渲染调用
 */

import * as THREE from 'three'
import type { Vector2, Vector3 } from '../../types/core'
import { UITextureAtlas } from './UITextureAtlas'
import { DepthLayer } from './UIDepthManager'

/**
 * UI实例数据接口
 */
interface UIInstance {
  id: string
  position: Vector3
  size: Vector2
  uvOffset: Vector2
  uvScale: Vector2
  color: THREE.Color
  opacity: number
  visible: boolean
}

/**
 * 批次数据接口
 */
interface UIBatch {
  zIndex: number
  layer: DepthLayer
  mesh: THREE.InstancedMesh
  instances: UIInstance[]
  needsUpdate: boolean
  maxInstances: number
}

/**
 * UI批量渲染器
 * 管理UI元素的批量渲染，减少Draw Call
 */
export class UIBatchRenderer {
  private static instance: UIBatchRenderer | null = null

  private batches: Map<string, UIBatch> = new Map()
  private textureAtlas: UITextureAtlas
  private scene: THREE.Scene | null = null
  private material: THREE.ShaderMaterial
  private geometry: THREE.PlaneGeometry

  private constructor() {
    this.textureAtlas = UITextureAtlas.getInstance()
    this.createSharedResources()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UIBatchRenderer {
    if (!this.instance) {
      this.instance = new UIBatchRenderer()
    }
    return this.instance
  }

  /**
   * 创建共享资源
   */
  private createSharedResources(): void {
    // 创建几何体
    this.geometry = new THREE.PlaneGeometry(1, 1)

    // 创建着色器材质
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlasTexture: { value: this.textureAtlas.getTexture() },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute vec3 instancePosition;
        attribute vec2 instanceSize;
        attribute vec2 instanceUVOffset;
        attribute vec2 instanceUVScale;
        attribute vec3 instanceColor;
        attribute float instanceOpacity;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          // 计算实例化位置和缩放
          vec3 pos = position;
          pos.xy *= instanceSize;
          pos += instancePosition;
          
          // 计算UV坐标
          vUv = instanceUVOffset + uv * instanceUVScale;
          vColor = instanceColor;
          vOpacity = instanceOpacity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlasTexture;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec4 texColor = texture2D(uAtlasTexture, vUv);
          
          // 应用实例颜色和透明度
          vec3 finalColor = texColor.rgb * vColor;
          float finalAlpha = texColor.a * vOpacity;
          
          gl_FragColor = vec4(finalColor, finalAlpha);
          
          // 丢弃完全透明的像素
          if (finalAlpha < 0.01) discard;
        }
      `,
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })
  }

  /**
   * 设置渲染场景
   * @param scene Three.js场景
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  /**
   * 获取或创建批次
   * @param zIndex Z索引
   * @param layer 深度层级
   * @param maxInstances 最大实例数
   * @returns 批次对象
   */
  private getOrCreateBatch(zIndex: number, layer: DepthLayer, maxInstances = 1000): UIBatch {
    const batchKey = `${layer}_${zIndex}`
    
    if (!this.batches.has(batchKey)) {
      // 创建实例化网格
      const mesh = new THREE.InstancedMesh(this.geometry, this.material, maxInstances)
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      
      // 设置实例属性
      const instancePositions = new Float32Array(maxInstances * 3)
      const instanceSizes = new Float32Array(maxInstances * 2)
      const instanceUVOffsets = new Float32Array(maxInstances * 2)
      const instanceUVScales = new Float32Array(maxInstances * 2)
      const instanceColors = new Float32Array(maxInstances * 3)
      const instanceOpacities = new Float32Array(maxInstances)

      mesh.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(instancePositions, 3))
      mesh.geometry.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(instanceSizes, 2))
      mesh.geometry.setAttribute('instanceUVOffset', new THREE.InstancedBufferAttribute(instanceUVOffsets, 2))
      mesh.geometry.setAttribute('instanceUVScale', new THREE.InstancedBufferAttribute(instanceUVScales, 2))
      mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3))
      mesh.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(instanceOpacities, 1))

      // 设置深度
      mesh.position.z = layer + zIndex * 0.001
      mesh.renderOrder = layer + zIndex

      // 添加到场景
      if (this.scene) {
        this.scene.add(mesh)
      }

      const batch: UIBatch = {
        zIndex,
        layer,
        mesh,
        instances: [],
        needsUpdate: true,
        maxInstances
      }

      this.batches.set(batchKey, batch)
    }

    return this.batches.get(batchKey)!
  }

  /**
   * 添加UI元素到批次
   * @param id 元素ID
   * @param position 位置
   * @param size 尺寸
   * @param uvOffset UV偏移
   * @param uvScale UV缩放
   * @param zIndex Z索引
   * @param layer 深度层级
   * @param color 颜色
   * @param opacity 透明度
   */
  addUIElement(
    id: string,
    position: Vector3,
    size: Vector2,
    uvOffset: Vector2,
    uvScale: Vector2,
    zIndex: number,
    layer: DepthLayer,
    color: THREE.Color = new THREE.Color(1, 1, 1),
    opacity: number = 1
  ): void {
    const batch = this.getOrCreateBatch(zIndex, layer)

    // 检查是否已存在
    const existingIndex = batch.instances.findIndex(instance => instance.id === id)
    
    const instance: UIInstance = {
      id,
      position: { ...position },
      size: { ...size },
      uvOffset: { ...uvOffset },
      uvScale: { ...uvScale },
      color: color.clone(),
      opacity,
      visible: true
    }

    if (existingIndex !== -1) {
      // 更新现有实例
      batch.instances[existingIndex] = instance
    } else {
      // 添加新实例
      if (batch.instances.length >= batch.maxInstances) {
        console.warn(`Batch ${layer}_${zIndex} is full, cannot add more instances`)
        return
      }
      batch.instances.push(instance)
    }

    batch.needsUpdate = true
  }

  /**
   * 移除UI元素
   * @param id 元素ID
   * @param zIndex Z索引
   * @param layer 深度层级
   */
  removeUIElement(id: string, zIndex: number, layer: DepthLayer): void {
    const batchKey = `${layer}_${zIndex}`
    const batch = this.batches.get(batchKey)
    
    if (batch) {
      const index = batch.instances.findIndex(instance => instance.id === id)
      if (index !== -1) {
        batch.instances.splice(index, 1)
        batch.needsUpdate = true
      }
    }
  }

  /**
   * 更新UI元素
   * @param id 元素ID
   * @param updates 更新数据
   * @param zIndex Z索引
   * @param layer 深度层级
   */
  updateUIElement(
    id: string,
    updates: Partial<UIInstance>,
    zIndex: number,
    layer: DepthLayer
  ): void {
    const batchKey = `${layer}_${zIndex}`
    const batch = this.batches.get(batchKey)
    
    if (batch) {
      const instance = batch.instances.find(inst => inst.id === id)
      if (instance) {
        Object.assign(instance, updates)
        batch.needsUpdate = true
      }
    }
  }

  /**
   * 更新批次数据
   * @param batch 批次对象
   */
  private updateBatch(batch: UIBatch): void {
    const { mesh, instances } = batch
    const visibleInstances = instances.filter(instance => instance.visible)
    
    // 更新实例数量
    mesh.count = visibleInstances.length

    if (visibleInstances.length === 0) return

    // 获取属性数组
    const positionAttr = mesh.geometry.getAttribute('instancePosition') as THREE.InstancedBufferAttribute
    const sizeAttr = mesh.geometry.getAttribute('instanceSize') as THREE.InstancedBufferAttribute
    const uvOffsetAttr = mesh.geometry.getAttribute('instanceUVOffset') as THREE.InstancedBufferAttribute
    const uvScaleAttr = mesh.geometry.getAttribute('instanceUVScale') as THREE.InstancedBufferAttribute
    const colorAttr = mesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute
    const opacityAttr = mesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute

    // 更新属性数据
    for (let i = 0; i < visibleInstances.length; i++) {
      const instance = visibleInstances[i]

      // 位置
      positionAttr.setXYZ(i, instance.position.x, instance.position.y, instance.position.z)
      
      // 尺寸
      sizeAttr.setXY(i, instance.size.x, instance.size.y)
      
      // UV偏移和缩放
      uvOffsetAttr.setXY(i, instance.uvOffset.x, instance.uvOffset.y)
      uvScaleAttr.setXY(i, instance.uvScale.x, instance.uvScale.y)
      
      // 颜色和透明度
      colorAttr.setXYZ(i, instance.color.r, instance.color.g, instance.color.b)
      opacityAttr.setX(i, instance.opacity)
    }

    // 标记需要更新
    positionAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    uvOffsetAttr.needsUpdate = true
    uvScaleAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    opacityAttr.needsUpdate = true

    batch.needsUpdate = false
  }

  /**
   * 渲染所有批次
   */
  render(): void {
    // 更新纹理图集
    this.material.uniforms.uAtlasTexture.value = this.textureAtlas.getTexture()
    this.material.uniforms.uTime.value = performance.now() * 0.001

    // 更新需要更新的批次
    for (const batch of this.batches.values()) {
      if (batch.needsUpdate) {
        this.updateBatch(batch)
      }
    }
  }

  /**
   * 获取渲染统计信息
   */
  getStats(): {
    totalBatches: number
    totalInstances: number
    drawCalls: number
    memoryUsage: number
  } {
    let totalInstances = 0
    let drawCalls = 0
    
    for (const batch of this.batches.values()) {
      totalInstances += batch.instances.length
      if (batch.instances.length > 0) {
        drawCalls++
      }
    }

    return {
      totalBatches: this.batches.size,
      totalInstances,
      drawCalls,
      memoryUsage: totalInstances * 64 // 估算每个实例64字节
    }
  }

  /**
   * 清理空批次
   */
  cleanupEmptyBatches(): void {
    for (const [key, batch] of this.batches) {
      if (batch.instances.length === 0) {
        if (this.scene) {
          this.scene.remove(batch.mesh)
        }
        batch.mesh.dispose()
        this.batches.delete(key)
      }
    }
  }

  /**
   * 清理所有批次
   */
  clear(): void {
    for (const batch of this.batches.values()) {
      if (this.scene) {
        this.scene.remove(batch.mesh)
      }
      batch.mesh.dispose()
    }
    this.batches.clear()
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.clear()
    this.material.dispose()
    this.geometry.dispose()
    UIBatchRenderer.instance = null
  }
}
