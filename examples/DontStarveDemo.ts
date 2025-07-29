/**
 * QAQ游戏引擎 - 饥荒风格游戏演示
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 2D等距视角游戏场景
 * - 角色、物品、环境的精灵渲染
 * - 简单的角色移动和交互系统
 * - 景深效果和视差滚动
 */

import * as THREE from 'three'
import Scene from '../core/scene/Scene'
import Node2D from '../core/nodes/Node2D'
import Sprite2D from '../core/nodes/2d/Sprite2D'
import Label2D from '../core/nodes/2d/Label2D'

// ============================================================================
// 游戏对象类型
// ============================================================================

/**
 * 游戏角色类
 */
export class GameCharacter extends Node2D {
  private _sprite: Sprite2D
  private _nameLabel: Label2D
  private _speed: number = 100

  constructor(name: string, characterType: string = 'player') {
    super(name)

    // 创建角色精灵
    this._sprite = new Sprite2D(`${name}_Sprite`)
    this._sprite.texture = this._createCharacterTexture(characterType)
    this.addChild(this._sprite)

    // 创建名称标签
    this._nameLabel = new Label2D(`${name}_Label`, {
      text: name,
      style: {
        fontSize: 12,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 1
      }
    })
    this._nameLabel.position = { x: 0, y: -40 }
    this.addChild(this._nameLabel)

    // 添加移动脚本
    this.setScript(`
      var moveSpeed = ${this._speed};
      var targetPosition = { x: 0, y: 0 };
      var isMoving = false;
      var animationTimer = 0;
      
      function _ready() {
        print("角色 " + node.name + " 已准备就绪");
        targetPosition.x = position.x;
        targetPosition.y = position.y;
      }
      
      function _process(delta) {
        animationTimer += delta;
        
        // 简单的移动动画
        if (isMoving) {
          var dx = targetPosition.x - position.x;
          var dy = targetPosition.y - position.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 2) {
            var moveX = (dx / distance) * moveSpeed * delta;
            var moveY = (dy / distance) * moveSpeed * delta;
            
            position = {
              x: position.x + moveX,
              y: position.y + moveY
            };
          } else {
            isMoving = false;
          }
        }
        
        // 简单的呼吸动画
        var scaleValue = 1.0 + Math.sin(animationTimer * 2) * 0.05;
        scale = { x: scaleValue, y: scaleValue };
      }
      
      function moveTo(x, y) {
        targetPosition.x = x;
        targetPosition.y = y;
        isMoving = true;
      }
      
      function moveBy(dx, dy) {
        targetPosition.x = position.x + dx;
        targetPosition.y = position.y + dy;
        isMoving = true;
      }
    `)
  }

  /**
   * 创建角色纹理
   */
  private _createCharacterTexture(characterType: string): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 根据角色类型绘制不同的角色
    switch (characterType) {
      case 'player':
        this._drawPlayer(ctx, canvas)
        break
      case 'enemy':
        this._drawEnemy(ctx, canvas)
        break
      case 'npc':
        this._drawNPC(ctx, canvas)
        break
      default:
        this._drawPlayer(ctx, canvas)
    }

    return new THREE.CanvasTexture(canvas)
  }

  private _drawPlayer(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 身体
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(20, 30, 24, 30)
    
    // 头部
    ctx.fillStyle = '#FDBCB4'
    ctx.beginPath()
    ctx.arc(32, 20, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // 眼睛
    ctx.fillStyle = '#000000'
    ctx.fillRect(28, 16, 2, 2)
    ctx.fillRect(34, 16, 2, 2)
    
    // 嘴巴
    ctx.beginPath()
    ctx.arc(32, 22, 3, 0, Math.PI)
    ctx.stroke()
    
    // 帽子
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(24, 8, 16, 8)
  }

  private _drawEnemy(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 身体（红色）
    ctx.fillStyle = '#8B0000'
    ctx.fillRect(20, 30, 24, 30)
    
    // 头部
    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.arc(32, 20, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // 邪恶的眼睛
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(28, 16, 3, 3)
    ctx.fillRect(33, 16, 3, 3)
    
    // 尖牙
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(30, 24, 2, 4)
    ctx.fillRect(32, 24, 2, 4)
  }

  private _drawNPC(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 身体（蓝色）
    ctx.fillStyle = '#4169E1'
    ctx.fillRect(20, 30, 24, 30)
    
    // 头部
    ctx.fillStyle = '#FDBCB4'
    ctx.beginPath()
    ctx.arc(32, 20, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // 友善的眼睛
    ctx.fillStyle = '#000000'
    ctx.fillRect(28, 16, 2, 2)
    ctx.fillRect(34, 16, 2, 2)
    
    // 微笑
    ctx.strokeStyle = '#000000'
    ctx.beginPath()
    ctx.arc(32, 20, 4, 0, Math.PI)
    ctx.stroke()
  }

  /**
   * 移动到指定位置
   */
  moveTo(x: number, y: number): void {
    // 通过脚本调用移动方法
    if (this._script) {
      try {
        (this._script as any).scriptContext.moveTo(x, y)
      } catch (error) {
        console.warn('Failed to call moveTo script method:', error)
      }
    }
  }

  /**
   * 相对移动
   */
  moveBy(dx: number, dy: number): void {
    if (this._script) {
      try {
        (this._script as any).scriptContext.moveBy(dx, dy)
      } catch (error) {
        console.warn('Failed to call moveBy script method:', error)
      }
    }
  }
}

/**
 * 游戏物品类
 */
export class GameItem extends Node2D {
  private _sprite: Sprite2D
  private _itemType: string

  constructor(name: string, itemType: string) {
    super(name)
    this._itemType = itemType

    // 创建物品精灵
    this._sprite = new Sprite2D(`${name}_Sprite`)
    this._sprite.texture = this._createItemTexture(itemType)
    this.addChild(this._sprite)

    // 添加物品脚本
    this.setScript(`
      var bobTimer = 0;
      var bobSpeed = 2.0;
      var bobHeight = 5;
      var originalY = 0;
      
      function _ready() {
        print("物品 " + node.name + " 已生成");
        originalY = position.y;
      }
      
      function _process(delta) {
        bobTimer += delta;
        
        // 上下浮动效果
        var offset = Math.sin(bobTimer * bobSpeed) * bobHeight;
        position = {
          x: position.x,
          y: originalY + offset
        };
        
        // 旋转效果
        rotation += delta * 0.5;
      }
    `)
  }

  private _createItemTexture(itemType: string): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!

    switch (itemType) {
      case 'berry':
        this._drawBerry(ctx)
        break
      case 'wood':
        this._drawWood(ctx)
        break
      case 'stone':
        this._drawStone(ctx)
        break
      case 'gold':
        this._drawGold(ctx)
        break
      default:
        this._drawBerry(ctx)
    }

    return new THREE.CanvasTexture(canvas)
  }

  private _drawBerry(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8B0000'
    ctx.beginPath()
    ctx.arc(16, 16, 10, 0, Math.PI * 2)
    ctx.fill()
    
    // 高光
    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.arc(12, 12, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  private _drawWood(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(8, 4, 16, 24)
    
    // 木纹
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(8, 8 + i * 6)
      ctx.lineTo(24, 8 + i * 6)
      ctx.stroke()
    }
  }

  private _drawStone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#696969'
    ctx.beginPath()
    ctx.arc(16, 16, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // 石头纹理
    ctx.fillStyle = '#A9A9A9'
    ctx.fillRect(10, 10, 4, 4)
    ctx.fillRect(18, 14, 3, 3)
    ctx.fillRect(12, 20, 5, 2)
  }

  private _drawGold(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(16, 16, 10, 0, Math.PI * 2)
    ctx.fill()
    
    // 金属光泽
    ctx.fillStyle = '#FFFF00'
    ctx.beginPath()
    ctx.arc(12, 12, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * 环境对象类
 */
export class EnvironmentObject extends Node2D {
  private _sprite: Sprite2D

  constructor(name: string, envType: string) {
    super(name)

    this._sprite = new Sprite2D(`${name}_Sprite`)
    this._sprite.texture = this._createEnvironmentTexture(envType)
    this.addChild(this._sprite)

    // 环境对象通常是静态的，但可以添加一些环境效果
    if (envType === 'tree') {
      this.setScript(`
        var swayTimer = 0;
        var swaySpeed = 1.0;
        var swayAmount = 0.02;
        
        function _ready() {
          print("树木 " + node.name + " 已生成");
        }
        
        function _process(delta) {
          swayTimer += delta;
          
          // 树木摇摆效果
          var sway = Math.sin(swayTimer * swaySpeed) * swayAmount;
          rotation = sway;
        }
      `)
    }
  }

  private _createEnvironmentTexture(envType: string): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 80
    const ctx = canvas.getContext('2d')!

    switch (envType) {
      case 'tree':
        this._drawTree(ctx)
        break
      case 'rock':
        this._drawRock(ctx)
        break
      case 'bush':
        this._drawBush(ctx)
        break
      default:
        this._drawTree(ctx)
    }

    return new THREE.CanvasTexture(canvas)
  }

  private _drawTree(ctx: CanvasRenderingContext2D): void {
    // 树干
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(28, 50, 8, 30)
    
    // 树冠
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.arc(32, 35, 20, 0, Math.PI * 2)
    ctx.fill()
    
    // 树叶细节
    ctx.fillStyle = '#32CD32'
    ctx.beginPath()
    ctx.arc(25, 30, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(39, 28, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private _drawRock(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#696969'
    ctx.beginPath()
    ctx.ellipse(32, 60, 25, 15, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 岩石纹理
    ctx.fillStyle = '#A9A9A9'
    ctx.fillRect(15, 55, 8, 6)
    ctx.fillRect(35, 58, 6, 4)
    ctx.fillRect(25, 62, 10, 3)
  }

  private _drawBush(ctx: CanvasRenderingContext2D): void {
    // 灌木丛
    ctx.fillStyle = '#006400'
    ctx.beginPath()
    ctx.arc(20, 60, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(32, 55, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(44, 60, 10, 0, Math.PI * 2)
    ctx.fill()
    
    // 浆果
    ctx.fillStyle = '#8B0000'
    ctx.beginPath()
    ctx.arc(25, 58, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(38, 52, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}
