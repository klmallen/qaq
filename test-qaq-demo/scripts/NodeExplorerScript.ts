/**
 * Node探索器脚本示例
 * 演示如何通过this.node访问节点的所有方法和属性
 */

import ScriptBase from '../../core/script/ScriptBase'

export class NodeExplorerScript extends ScriptBase {
  private explorationTimer: number = 0
  private explorationInterval: number = 3 // 每3秒探索一次

  /**
   * 脚本准备完成时调用
   */
  _ready(): void {
    this.print('=== Node探索器脚本启动 ===')
    this.exploreNodeBasics()
    this.exploreNodeTree()
    this.exploreNodeProperties()
    this.exploreThreeJSIntegration()
    this.exploreNodeMethods()
  }

  /**
   * 每帧处理时调用
   */
  _process(delta: number): void {
    this.explorationTimer += delta
    
    // 定期探索动态信息
    if (this.explorationTimer >= this.explorationInterval) {
      this.explorationTimer = 0
      this.exploreDynamicInfo()
    }
  }

  /**
   * 探索节点基础信息
   */
  private exploreNodeBasics(): void {
    this.print('\n--- 节点基础信息 ---')
    this.print(`节点名称: ${this.node.name}`)
    this.print(`节点ID: ${this.node.id}`)
    this.print(`节点类名: ${this.node.getClassName()}`)
    this.print(`实例ID: ${this.node.getInstanceId()}`)
    
    // 状态信息
    this.print(`是否在树中: ${this.node.isInsideTree}`)
    this.print(`是否已准备: ${this.node.isReady}`)
    this.print(`是否脏标记: ${this.node.isDirty()}`)
  }

  /**
   * 探索节点树结构
   */
  private exploreNodeTree(): void {
    this.print('\n--- 节点树结构 ---')
    
    // 父节点信息
    if (this.node.parent) {
      this.print(`父节点: ${this.node.parent.name} (${this.node.parent.getClassName()})`)
      this.print(`在父节点中的索引: ${this.node.parent.getChildIndex(this.node)}`)
    } else {
      this.print('这是根节点，没有父节点')
    }

    // 子节点信息
    const childCount = this.node.getChildCount()
    this.print(`子节点数量: ${childCount}`)
    
    for (let i = 0; i < childCount; i++) {
      const child = this.node.getChild(i)
      if (child) {
        this.print(`  子节点[${i}]: ${child.name} (${child.getClassName()})`)
      }
    }

    // 所有者信息
    if (this.node.owner) {
      this.print(`所有者: ${this.node.owner.name}`)
    }

    // 节点路径
    this.print(`节点路径: ${this.node.getPath()}`)
  }

  /**
   * 探索节点属性
   */
  private exploreNodeProperties(): void {
    this.print('\n--- 节点属性 ---')
    
    // 位置信息
    const pos = this.node.position
    this.print(`本地位置: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
    
    const globalPos = this.node.globalPosition
    this.print(`全局位置: (${globalPos.x.toFixed(2)}, ${globalPos.y.toFixed(2)}, ${globalPos.z.toFixed(2)})`)
    
    // 渲染属性
    this.print(`可见性: ${this.node.visible}`)
    this.print(`渲染层: ${this.node.renderLayer}`)
    
    // 处理模式
    this.print(`处理模式: ${this.node.processMode}`)
    this.print(`处理优先级: ${this.node.processPriority}`)
  }

  /**
   * 探索Three.js集成
   */
  private exploreThreeJSIntegration(): void {
    this.print('\n--- Three.js集成 ---')
    
    const obj3D = this.node.object3D
    this.print(`Three.js对象类型: ${obj3D.type}`)
    this.print(`Three.js对象UUID: ${obj3D.uuid}`)
    this.print(`Three.js对象名称: ${obj3D.name}`)
    
    // 变换信息
    const position = obj3D.position
    const rotation = obj3D.rotation
    const scale = obj3D.scale
    
    this.print(`Three.js位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`)
    this.print(`Three.js旋转: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})`)
    this.print(`Three.js缩放: (${scale.x.toFixed(2)}, ${scale.y.toFixed(2)}, ${scale.z.toFixed(2)})`)
    
    // 层级信息
    this.print(`Three.js子对象数量: ${obj3D.children.length}`)
    this.print(`Three.js父对象: ${obj3D.parent ? obj3D.parent.name : 'null'}`)
  }

  /**
   * 探索节点方法
   */
  private exploreNodeMethods(): void {
    this.print('\n--- 节点方法演示 ---')
    
    // 查找方法
    const foundByName = this.node.findChild('TestSprite', false)
    this.print(`通过名称查找节点: ${foundByName ? foundByName.name : '未找到'}`)
    
    // 路径查找
    const foundByPath = this.node.getNode('../TestSprite')
    this.print(`通过路径查找节点: ${foundByPath ? foundByPath.name : '未找到'}`)
    
    // 模式匹配查找
    const allChildren = this.node.findChildren('*', undefined, true, true)
    this.print(`递归查找所有子节点数量: ${allChildren.length}`)
    
    // 检查方法
    this.print(`是否有子节点TestSprite: ${this.node.hasChild(foundByName!)}`)
    this.print(`是否有路径../TestSprite: ${this.node.hasNode('../TestSprite')}`)
  }

  /**
   * 探索动态信息（定期调用）
   */
  private exploreDynamicInfo(): void {
    this.print('\n--- 动态信息更新 ---')
    
    // 当前状态
    this.print(`当前时间: ${this.getTime().toFixed(2)}秒`)
    
    // 位置变化
    const pos = this.node.position
    this.print(`当前位置: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
    
    // 世界矩阵
    const worldMatrix = this.node.getWorldMatrix()
    this.print(`世界矩阵行列式: ${worldMatrix.determinant().toFixed(4)}`)
    
    // 脚本信息
    const scriptInstances = this.node.getScriptInstances()
    this.print(`附加的脚本数量: ${scriptInstances.length}`)
    
    const scriptClassNames = this.node.getScriptClassNames()
    this.print(`脚本类名: [${scriptClassNames.join(', ')}]`)
    
    // 检查特定脚本
    this.print(`是否有NodeExplorerScript: ${this.node.hasScript('NodeExplorerScript')}`)
  }

  /**
   * 演示节点操作方法
   */
  private demonstrateNodeOperations(): void {
    this.print('\n--- 节点操作演示 ---')
    
    // 标记为脏
    this.node.markDirty()
    this.print(`标记为脏后: ${this.node.isDirty()}`)
    
    // 清除脏标记
    this.node.clearDirty()
    this.print(`清除脏标记后: ${this.node.isDirty()}`)
    
    // 遍历节点树
    let nodeCount = 0
    this.node.traverse((node) => {
      nodeCount++
    })
    this.print(`遍历节点树，总节点数: ${nodeCount}`)
    
    // 通过ID查找
    const foundById = this.node.findNodeById(this.node.id)
    this.print(`通过ID查找自己: ${foundById ? '成功' : '失败'}`)
  }

  /**
   * 演示特定节点类型的方法
   */
  private demonstrateSpecificNodeMethods(): void {
    this.print('\n--- 特定节点类型方法 ---')
    
    // 检查节点类型并调用特定方法
    const className = this.node.getClassName()
    this.print(`节点类型: ${className}`)
    
    // 如果是Sprite2D
    if (className === 'Sprite2D') {
      this.print('这是Sprite2D节点，可以访问纹理相关方法')
      // const sprite = this.node as any
      // sprite.flipH = !sprite.flipH
    }
    
    // 如果是Button2D
    if (className === 'Button2D') {
      this.print('这是Button2D节点，可以访问按钮相关方法')
      // const button = this.node as any
      // button.disabled = !button.disabled
    }
    
    // 如果是TileMap2D
    if (className === 'TileMap2D') {
      this.print('这是TileMap2D节点，可以访问瓦片地图方法')
      // const tileMap = this.node as any
      // const mapSize = tileMap.getMapSize()
      // this.print(`地图尺寸: ${mapSize.x}x${mapSize.y}`)
    }
  }

  /**
   * 脚本销毁时调用
   */
  _exit_tree(): void {
    this.print('=== Node探索器脚本结束 ===')
    this.print('已完成对节点所有方法和属性的探索')
  }
}
