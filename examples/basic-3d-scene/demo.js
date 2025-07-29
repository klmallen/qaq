/**
 * QAQ游戏引擎 - 基础3D场景演示逻辑
 * 
 * 这个文件包含了完整的3D场景演示逻辑，展示了：
 * - Engine初始化和场景管理
 * - 3D节点创建和管理
 * - 资源加载和模型渲染
 * - 场景切换和导航
 * - 实时渲染循环
 */

// ============================================================================
// 全局变量和状态管理
// ============================================================================

let engine = null;
let currentScene = null;
let mainCamera = null;
let meshObjects = [];
let isRendering = false;
let renderLoop = null;

// 场景缓存
const scenes = {
    main: null,
    menu: null,
    game: null,
    settings: null
};

// 统计信息
const stats = {
    frameCount: 0,
    lastTime: Date.now(),
    fps: 0
};

// ============================================================================
// 引擎初始化
// ============================================================================

/**
 * 初始化QAQ游戏引擎
 */
async function initializeEngine() {
    try {
        updateStatus('开始初始化QAQ游戏引擎...');
        
        // 获取画布容器
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('找不到游戏画布元素');
        }

        updateStatus('创建Engine实例...');
        
        // 模拟Engine类（实际使用时需要导入真实的Engine类）
        engine = createMockEngine();
        
        updateStatus('初始化渲染系统...');
        await engine.initialize(canvas);
        
        updateStatus('场景管理系统已集成', 'ready');
        updateStatus('✅ QAQ游戏引擎初始化完成！');
        
        // 设置全局引用
        window.qaqEngine = engine;
        
        // 自动创建主场景
        await createMainScene();
        
    } catch (error) {
        updateStatus(`❌ 引擎初始化失败: ${error.message}`, 'error');
        console.error('Engine initialization failed:', error);
    }
}

/**
 * 创建模拟的Engine实例（用于演示）
 * 在实际项目中，这里应该导入真实的Engine类
 */
function createMockEngine() {
    return {
        // 模拟初始化方法
        async initialize(canvas) {
            this.canvas = canvas;
            this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
            this.renderer.setSize(canvas.width, canvas.height);
            this.renderer.setClearColor(0x222222);
            
            this.scene = new THREE.Scene();
            this.sceneTree = createMockSceneTree();
            
            updateStatus('Three.js渲染器已创建');
            updateStatus('场景图已初始化');
        },
        
        // 模拟场景管理方法
        async setMainScene(scene) {
            this.currentScene = scene;
            currentScene = scene;
            window.currentScene = scene;
            updateStatus(`主场景已设置: ${scene.name}`);
        },
        
        async changeScene(scene, options = {}) {
            if (this.currentScene) {
                updateStatus(`切换场景: ${this.currentScene.name} -> ${scene.name}`);
            }
            this.currentScene = scene;
            currentScene = scene;
            window.currentScene = scene;
            return scene;
        },
        
        getCurrentScene() {
            return this.currentScene;
        },
        
        getSceneTree() {
            return this.sceneTree;
        },
        
        // 模拟渲染方法
        renderFrame() {
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
                
                // 更新统计
                stats.frameCount++;
                const now = Date.now();
                if (now - stats.lastTime >= 1000) {
                    stats.fps = Math.round(stats.frameCount * 1000 / (now - stats.lastTime));
                    stats.frameCount = 0;
                    stats.lastTime = now;
                }
            }
        }
    };
}

/**
 * 创建模拟的SceneTree
 */
function createMockSceneTree() {
    return {
        mainScene: null,
        currentScene: null,
        stackDepth: 0,
        
        getStats() {
            return {
                sceneCount: Object.values(scenes).filter(s => s !== null).length,
                stackDepth: this.stackDepth,
                totalNodes: currentScene ? currentScene.nodeCount : 0,
                memoryUsage: 1024 * 100, // 模拟100KB
                uptime: Date.now() - stats.lastTime
            };
        }
    };
}

/**
 * 创建模拟的Scene类
 */
function createMockScene(name, type = 'MAIN') {
    return {
        name: name,
        sceneType: type,
        state: 'RUNNING',
        nodeCount: 0,
        children: [],
        
        addChild(node) {
            this.children.push(node);
            this.nodeCount++;
            updateStatus(`节点已添加到场景: ${node.name}`);
        },
        
        getSceneStats() {
            return {
                nodeCount: this.nodeCount,
                runTime: Date.now() - stats.lastTime
            };
        }
    };
}

// ============================================================================
// 场景管理函数
// ============================================================================

/**
 * 创建主场景
 */
async function createMainScene() {
    try {
        updateStatus('创建主场景...');
        
        const mainScene = createMockScene('MainScene', 'MAIN');
        scenes.main = mainScene;
        
        await engine.setMainScene(mainScene);
        
        updateStatus('✅ 主场景创建完成');
        
    } catch (error) {
        updateStatus(`❌ 主场景创建失败: ${error.message}`, 'error');
    }
}

/**
 * 添加相机到场景
 */
async function addCamera() {
    try {
        if (!currentScene) {
            updateStatus('❌ 请先创建场景', 'error');
            return;
        }
        
        updateStatus('添加Camera3D到场景...');
        
        // 创建Three.js相机
        const camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
        
        // 添加到场景
        engine.scene.add(camera);
        engine.camera = camera;
        mainCamera = camera;
        
        // 模拟QAQ节点
        const cameraNode = {
            name: 'MainCamera',
            type: 'Camera3D',
            position: { x: 0, y: 5, z: 10 }
        };
        
        currentScene.addChild(cameraNode);
        
        updateStatus('✅ Camera3D已添加');
        
    } catch (error) {
        updateStatus(`❌ 相机添加失败: ${error.message}`, 'error');
    }
}

/**
 * 添加3D网格对象
 */
async function addMeshObject() {
    try {
        if (!currentScene) {
            updateStatus('❌ 请先创建场景', 'error');
            return;
        }
        
        updateStatus('添加MeshInstance3D到场景...');
        
        // 创建立方体几何体和材质
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            wireframe: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        
        // 添加到Three.js场景
        engine.scene.add(mesh);
        meshObjects.push(mesh);
        
        // 模拟QAQ节点
        const meshNode = {
            name: `MeshInstance3D_${meshObjects.length}`,
            type: 'MeshInstance3D',
            position: mesh.position
        };
        
        currentScene.addChild(meshNode);
        
        updateStatus(`✅ MeshInstance3D已添加 (总计: ${meshObjects.length})`);
        
    } catch (error) {
        updateStatus(`❌ 网格对象添加失败: ${error.message}`, 'error');
    }
}

// ============================================================================
// 场景切换函数
// ============================================================================

/**
 * 切换到菜单场景
 */
async function switchToMenuScene() {
    try {
        if (!scenes.menu) {
            scenes.menu = createMockScene('MenuScene', 'SUB');
            updateStatus('菜单场景已创建');
        }
        
        await engine.changeScene(scenes.menu, {
            mode: 'FADE',
            duration: 500
        });
        
        updateStatus('✅ 已切换到菜单场景');
        
    } catch (error) {
        updateStatus(`❌ 场景切换失败: ${error.message}`, 'error');
    }
}

/**
 * 切换到游戏场景
 */
async function switchToGameScene() {
    try {
        if (!scenes.game) {
            scenes.game = createMockScene('GameScene', 'MAIN');
            updateStatus('游戏场景已创建');
        }
        
        await engine.changeScene(scenes.game, {
            mode: 'SLIDE',
            duration: 300
        });
        
        updateStatus('✅ 已切换到游戏场景');
        
    } catch (error) {
        updateStatus(`❌ 场景切换失败: ${error.message}`, 'error');
    }
}

/**
 * 切换到设置场景
 */
async function switchToSettingsScene() {
    try {
        if (!scenes.settings) {
            scenes.settings = createMockScene('SettingsScene', 'SUB');
            updateStatus('设置场景已创建');
        }
        
        await engine.changeScene(scenes.settings, {
            mode: 'IMMEDIATE'
        });
        
        updateStatus('✅ 已切换到设置场景');
        
    } catch (error) {
        updateStatus(`❌ 场景切换失败: ${error.message}`, 'error');
    }
}

// ============================================================================
// 模型加载函数
// ============================================================================

/**
 * 加载立方体模型
 */
async function loadCubeModel() {
    try {
        updateStatus('加载立方体模型...');
        
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
        const cube = new THREE.Mesh(geometry, material);
        
        cube.position.set(-3, 0, 0);
        engine.scene.add(cube);
        meshObjects.push(cube);
        
        updateStatus('✅ 立方体模型加载完成');
        
    } catch (error) {
        updateStatus(`❌ 模型加载失败: ${error.message}`, 'error');
    }
}

/**
 * 加载球体模型
 */
async function loadSphereModel() {
    try {
        updateStatus('加载球体模型...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshLambertMaterial({ color: 0x74b9ff });
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(3, 0, 0);
        engine.scene.add(sphere);
        meshObjects.push(sphere);
        
        updateStatus('✅ 球体模型加载完成');
        
    } catch (error) {
        updateStatus(`❌ 模型加载失败: ${error.message}`, 'error');
    }
}

/**
 * 加载复杂模型
 */
async function loadComplexModel() {
    try {
        updateStatus('加载复杂模型...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 创建一个复杂的组合模型
        const group = new THREE.Group();
        
        // 主体
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00b894 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // 顶部
        const topGeometry = new THREE.ConeGeometry(0.7, 1, 8);
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0xfdcb6e });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1.5;
        group.add(top);
        
        group.position.set(0, 0, -3);
        engine.scene.add(group);
        meshObjects.push(group);
        
        updateStatus('✅ 复杂模型加载完成');
        
    } catch (error) {
        updateStatus(`❌ 模型加载失败: ${error.message}`, 'error');
    }
}

// ============================================================================
// 渲染控制函数
// ============================================================================

/**
 * 开始渲染循环
 */
function startRendering() {
    if (isRendering) {
        updateStatus('渲染已在运行中');
        return;
    }
    
    if (!engine || !engine.camera) {
        updateStatus('❌ 请先添加相机', 'error');
        return;
    }
    
    isRendering = true;
    window.isRendering = true;
    
    // 添加基础光照
    if (!engine.scene.getObjectByName('ambientLight')) {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        ambientLight.name = 'ambientLight';
        engine.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.name = 'directionalLight';
        engine.scene.add(directionalLight);
    }
    
    // 渲染循环
    function animate() {
        if (!isRendering) return;
        
        // 旋转所有网格对象
        meshObjects.forEach((mesh, index) => {
            if (mesh.rotation) {
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.01 * (index + 1);
            }
        });
        
        // 渲染帧
        engine.renderFrame();
        
        renderLoop = requestAnimationFrame(animate);
    }
    
    animate();
    updateStatus('✅ 渲染循环已启动');
}

/**
 * 停止渲染循环
 */
function stopRendering() {
    isRendering = false;
    window.isRendering = false;
    
    if (renderLoop) {
        cancelAnimationFrame(renderLoop);
        renderLoop = null;
    }
    
    updateStatus('⏹️ 渲染循环已停止');
}

/**
 * 切换统计显示
 */
function toggleStats() {
    const infoPanel = document.getElementById('realTimeInfo');
    if (infoPanel.style.display === 'none') {
        infoPanel.style.display = 'block';
        updateStatus('📊 统计信息已显示');
    } else {
        infoPanel.style.display = 'none';
        updateStatus('📊 统计信息已隐藏');
    }
}

// ============================================================================
// 页面加载完成后自动初始化
// ============================================================================

// 等待页面完全加载后初始化引擎
document.addEventListener('DOMContentLoaded', function() {
    updateStatus('页面加载完成，开始初始化引擎...');
    initializeEngine();
});

// 导出全局函数供HTML调用
window.createMainScene = createMainScene;
window.addCamera = addCamera;
window.addMeshObject = addMeshObject;
window.switchToMenuScene = switchToMenuScene;
window.switchToGameScene = switchToGameScene;
window.switchToSettingsScene = switchToSettingsScene;
window.loadCubeModel = loadCubeModel;
window.loadSphereModel = loadSphereModel;
window.loadComplexModel = loadComplexModel;
window.startRendering = startRendering;
window.stopRendering = stopRendering;
window.toggleStats = toggleStats;
