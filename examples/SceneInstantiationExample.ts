/**
 * QAQ游戏引擎 - 场景实例化系统使用示例
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 演示场景模板的创建和使用
 * - 展示场景实例化的各种方式
 * - 演示资源管理和序列化功能
 * - 提供完整的使用案例
 */

import SceneManager from '../core/scene/SceneManager'
import SceneTemplate from '../core/scene/SceneTemplate'
import Scene from '../core/scene/Scene'
import Node2D from '../core/nodes/Node2D'
import Sprite2D from '../core/nodes/2d/Sprite2D'
import Label2D from '../core/nodes/2d/Label2D'
import Button2D from '../core/nodes/2d/Button2D'

// ============================================================================
// 示例1: 创建敌人场景模板
// ============================================================================

/**
 * 创建敌人场景模板
 * @param sceneManager 场景管理器
 * @returns 敌人模板
 */
export function createEnemyTemplate(sceneManager: SceneManager): SceneTemplate {
  console.log('📝 创建敌人场景模板...')

  // 使用构建器模式创建模板
  const enemyTemplate = sceneManager.createTemplate('Enemy', {
    templateConfig: {
      name: 'Enemy',
      description: '基础敌人模板，包含精灵、血条和AI脚本',
      version: '1.0.0',
      tags: ['enemy', 'character', 'ai']
    },
    builder: () => {
      const scene = new Scene('EnemyScene')
      
      // 创建根节点
      const root = new Node2D('EnemyRoot')
      scene.addChild(root)
      
      // 添加精灵
      const sprite = new Sprite2D('EnemySprite')
      sprite.position = { x: 0, y: 0 }
      root.addChild(sprite)
      
      // 添加血条
      const healthBar = new Label2D('HealthBar', {
        text: 'HP: 100/100',
        style: { fontSize: 12, color: '#ff0000' },
        align: 1 // CENTER
      })
      healthBar.position = { x: 0, y: -30 }
      root.addChild(healthBar)
      
      // 添加AI脚本
      root.setScript(`
        var health = 100;
        var maxHealth = 100;
        var speed = 50;
        var direction = { x: 1, y: 0 };
        var changeDirectionTimer = 0;
        var changeDirectionInterval = 2.0;
        
        function _ready() {
          print("敌人AI已激活: " + node.name);
          updateHealthBar();
        }
        
        function _process(delta) {
          // 简单的AI移动
          changeDirectionTimer += delta;
          if (changeDirectionTimer >= changeDirectionInterval) {
            changeDirectionTimer = 0;
            direction.x = (Math.random() - 0.5) * 2;
            direction.y = (Math.random() - 0.5) * 2;
            
            // 归一化方向向量
            var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            if (length > 0) {
              direction.x /= length;
              direction.y /= length;
            }
          }
          
          // 移动敌人
          node.position = {
            x: node.position.x + direction.x * speed * delta,
            y: node.position.y + direction.y * speed * delta
          };
          
          // 边界检查
          if (Math.abs(node.position.x) > 300 || Math.abs(node.position.y) > 200) {
            direction.x = -direction.x;
            direction.y = -direction.y;
          }
        }
        
        function takeDamage(damage) {
          health = Math.max(0, health - damage);
          updateHealthBar();
          
          if (health <= 0) {
            die();
          }
        }
        
        function updateHealthBar() {
          var healthBarNode = findNode("HealthBar");
          if (healthBarNode) {
            healthBarNode.text = "HP: " + health + "/" + maxHealth;
          }
        }
        
        function die() {
          print("敌人死亡: " + node.name);
          // 这里可以播放死亡动画，掉落物品等
          node.visible = false;
        }
      `)
      
      return scene
    },
    autoRegister: true
  })

  console.log('✅ 敌人模板创建完成')
  return enemyTemplate
}

// ============================================================================
// 示例2: 创建UI界面模板
// ============================================================================

/**
 * 创建游戏UI模板
 * @param sceneManager 场景管理器
 * @returns UI模板
 */
export function createGameUITemplate(sceneManager: SceneManager): SceneTemplate {
  console.log('📝 创建游戏UI模板...')

  const uiTemplate = sceneManager.createTemplate('GameUI', {
    templateConfig: {
      name: 'GameUI',
      description: '游戏主界面UI，包含血条、分数、按钮等',
      version: '1.0.0',
      tags: ['ui', 'hud', 'interface']
    },
    builder: () => {
      const scene = new Scene('GameUIScene')
      
      // 创建UI根节点
      const uiRoot = new Node2D('UIRoot')
      scene.addChild(uiRoot)
      
      // 玩家血条
      const playerHealthLabel = new Label2D('PlayerHealth', {
        text: 'Player HP: 100/100',
        style: { fontSize: 16, color: '#00ff00' },
        align: 0 // LEFT
      })
      playerHealthLabel.position = { x: -380, y: 280 }
      uiRoot.addChild(playerHealthLabel)
      
      // 分数显示
      const scoreLabel = new Label2D('Score', {
        text: 'Score: 0',
        style: { fontSize: 18, color: '#ffff00' },
        align: 1 // CENTER
      })
      scoreLabel.position = { x: 0, y: 280 }
      uiRoot.addChild(scoreLabel)
      
      // 暂停按钮
      const pauseButton = new Button2D('PauseButton', {
        text: '暂停',
        width: 80,
        height: 30,
        styles: {
          normal: { backgroundColor: '#666666', textColor: '#ffffff' }
        }
      })
      pauseButton.position = { x: 350, y: 280 }
      uiRoot.addChild(pauseButton)
      
      // UI控制脚本
      uiRoot.setScript(`
        var playerHealth = 100;
        var maxPlayerHealth = 100;
        var score = 0;
        var isPaused = false;
        
        function _ready() {
          print("游戏UI已初始化");
          
          // 连接暂停按钮事件
          var pauseBtn = findNode("PauseButton");
          if (pauseBtn) {
            // 这里应该连接按钮的pressed信号
            print("暂停按钮已连接");
          }
        }
        
        function updatePlayerHealth(newHealth) {
          playerHealth = Math.max(0, Math.min(maxPlayerHealth, newHealth));
          var healthLabel = findNode("PlayerHealth");
          if (healthLabel) {
            healthLabel.text = "Player HP: " + playerHealth + "/" + maxPlayerHealth;
          }
        }
        
        function updateScore(newScore) {
          score = newScore;
          var scoreLabel = findNode("Score");
          if (scoreLabel) {
            scoreLabel.text = "Score: " + score;
          }
        }
        
        function togglePause() {
          isPaused = !isPaused;
          var pauseBtn = findNode("PauseButton");
          if (pauseBtn) {
            pauseBtn.text = isPaused ? "继续" : "暂停";
          }
          print(isPaused ? "游戏已暂停" : "游戏已继续");
        }
      `)
      
      return scene
    },
    autoRegister: true
  })

  console.log('✅ 游戏UI模板创建完成')
  return uiTemplate
}

// ============================================================================
// 示例3: 创建关卡场景模板
// ============================================================================

/**
 * 创建关卡场景模板
 * @param sceneManager 场景管理器
 * @returns 关卡模板
 */
export function createLevelTemplate(sceneManager: SceneManager): SceneTemplate {
  console.log('📝 创建关卡场景模板...')

  const levelTemplate = sceneManager.createTemplate('Level1', {
    templateConfig: {
      name: 'Level1',
      description: '第一关场景，包含地图、敌人生成点、道具等',
      version: '1.0.0',
      tags: ['level', 'gameplay', 'world'],
      dependencies: ['Enemy', 'GameUI'] // 依赖其他模板
    },
    builder: () => {
      const scene = new Scene('Level1Scene')
      
      // 创建关卡根节点
      const levelRoot = new Node2D('LevelRoot')
      scene.addChild(levelRoot)
      
      // 背景
      const background = new Sprite2D('Background')
      background.position = { x: 0, y: 0 }
      levelRoot.addChild(background)
      
      // 敌人生成点
      const enemySpawner = new Node2D('EnemySpawner')
      enemySpawner.position = { x: 200, y: 100 }
      levelRoot.addChild(enemySpawner)
      
      // 关卡控制脚本
      levelRoot.setScript(`
        var enemySpawnTimer = 0;
        var enemySpawnInterval = 3.0;
        var enemiesSpawned = 0;
        var maxEnemies = 10;
        var levelCompleted = false;
        
        function _ready() {
          print("关卡1已加载");
          print("目标：消灭" + maxEnemies + "个敌人");
        }
        
        function _process(delta) {
          if (levelCompleted) return;
          
          // 敌人生成逻辑
          enemySpawnTimer += delta;
          if (enemySpawnTimer >= enemySpawnInterval && enemiesSpawned < maxEnemies) {
            spawnEnemy();
            enemySpawnTimer = 0;
          }
        }
        
        function spawnEnemy() {
          // 这里应该实例化敌人模板
          print("生成敌人 #" + (enemiesSpawned + 1));
          enemiesSpawned++;
          
          if (enemiesSpawned >= maxEnemies) {
            print("所有敌人已生成，等待玩家清理");
          }
        }
        
        function onEnemyDefeated() {
          // 敌人被击败时调用
          print("敌人被击败！");
          
          // 检查是否完成关卡
          checkLevelCompletion();
        }
        
        function checkLevelCompletion() {
          // 检查是否所有敌人都被击败
          // 这里需要实际的敌人计数逻辑
          print("检查关卡完成状态...");
        }
        
        function completeLevel() {
          levelCompleted = true;
          print("🎉 关卡1完成！");
        }
      `)
      
      return scene
    },
    autoRegister: true
  })

  console.log('✅ 关卡模板创建完成')
  return levelTemplate
}

// ============================================================================
// 示例4: 场景实例化和管理演示
// ============================================================================

/**
 * 演示场景实例化系统
 */
export async function demonstrateSceneInstantiation(): Promise<void> {
  console.log('🚀 开始场景实例化系统演示...')

  // 创建场景管理器
  const sceneManager = new SceneManager({
    enableResourceCache: true,
    enableInstancePooling: true,
    maxConcurrentLoads: 5
  })

  try {
    // 1. 创建各种场景模板
    console.log('\n📋 步骤1: 创建场景模板')
    const enemyTemplate = createEnemyTemplate(sceneManager)
    const uiTemplate = createGameUITemplate(sceneManager)
    const levelTemplate = createLevelTemplate(sceneManager)

    // 2. 配置实例池
    console.log('\n⚙️ 步骤2: 配置实例池')
    sceneManager.configureInstancePool('Enemy', {
      maxInstances: 20,
      preCreateCount: 5,
      enablePooling: true,
      cleanupInterval: 30000
    })

    // 预热敌人实例池
    await sceneManager.warmupInstancePool('Enemy', 3)
    console.log('✅ 敌人实例池已预热')

    // 3. 实例化主关卡
    console.log('\n🎮 步骤3: 实例化主关卡')
    const levelInstance = await sceneManager.instantiateScene('Level1', {
      instanceName: 'MainLevel',
      autoActivate: true,
      onInstantiated: (scene) => {
        console.log(`✅ 关卡实例化完成: ${scene.name}`)
      }
    })

    // 4. 实例化游戏UI
    console.log('\n🖥️ 步骤4: 实例化游戏UI')
    const uiInstance = await sceneManager.instantiateScene('GameUI', {
      instanceName: 'MainUI',
      autoActivate: true
    })

    // 5. 批量实例化敌人
    console.log('\n👹 步骤5: 批量实例化敌人')
    const enemyConfigs = Array.from({ length: 5 }, (_, i) => ({
      instanceName: `Enemy_${i + 1}`,
      position: { 
        x: (Math.random() - 0.5) * 400, 
        y: (Math.random() - 0.5) * 300 
      },
      autoActivate: true
    }))

    const enemyInstances = await sceneManager.instantiateSceneBatch('Enemy', enemyConfigs)
    console.log(`✅ 成功创建 ${enemyInstances.length} 个敌人实例`)

    // 6. 查看统计信息
    console.log('\n📊 步骤6: 性能统计')
    const stats = sceneManager.getPerformanceStats()
    console.log('性能统计:', {
      模板数量: stats.templatesLoaded,
      实例数量: stats.instancesCreated,
      平均加载时间: `${stats.averageLoadTime.toFixed(2)}ms`,
      平均实例化时间: `${stats.averageInstantiationTime.toFixed(2)}ms`
    })

    // 7. 序列化演示
    console.log('\n💾 步骤7: 序列化演示')
    if (levelInstance) {
      const exportData = await sceneManager.exportSceneData(levelInstance.scene, {
        format: 'json',
        prettify: true,
        includeMetadata: true
      })
      console.log(`✅ 关卡数据已序列化，大小: ${exportData.size} 字节`)
    }

    // 8. 场景切换演示
    console.log('\n🔄 步骤8: 场景切换演示')
    const newMainScene = await sceneManager.switchToScene('Level1', {
      instanceName: 'NewMainLevel'
    })
    
    if (newMainScene) {
      console.log(`✅ 已切换到新的主场景: ${newMainScene.name}`)
    }

    // 9. 清理演示
    console.log('\n🧹 步骤9: 资源清理')
    
    // 销毁部分敌人实例
    enemyInstances.slice(0, 2).forEach(instance => {
      sceneManager.destroySceneInstance(instance.id)
    })
    console.log('✅ 已销毁2个敌人实例')

    // 清理缓存
    sceneManager.cleanupResourceCache()
    console.log('✅ 资源缓存已清理')

    // 10. 最终统计
    console.log('\n📈 最终统计')
    const finalStats = sceneManager.getPerformanceStats()
    const instanceCounts = {
      总实例数: sceneManager.getSceneInstanceCount(),
      敌人实例数: sceneManager.getSceneInstanceCount('Enemy'),
      UI实例数: sceneManager.getSceneInstanceCount('GameUI'),
      关卡实例数: sceneManager.getSceneInstanceCount('Level1')
    }
    
    console.log('实例统计:', instanceCounts)
    console.log('模板列表:', sceneManager.getTemplateNames())

    console.log('\n🎉 场景实例化系统演示完成！')

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error)
  }
}

// ============================================================================
// 导出演示函数
// ============================================================================

export default {
  createEnemyTemplate,
  createGameUITemplate,
  createLevelTemplate,
  demonstrateSceneInstantiation
}
