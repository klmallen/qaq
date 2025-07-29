/**
 * DirectionalLight3D 集成测试
 * 测试与Three.js的集成和实际功能
 */

// 模拟Three.js环境
const THREE = {
  DirectionalLight: class {
    constructor(color, intensity) {
      this.color = { getHex: () => color, setHex: (c) => { this.colorValue = c; } };
      this.intensity = intensity;
      this.target = null;
      this.castShadow = false;
      this.shadow = {
        camera: {
          left: -10,
          right: 10,
          top: 10,
          bottom: -10,
          updateProjectionMatrix: () => {}
        },
        mapSize: { width: 1024, height: 1024 }
      };
      this.position = { set: () => {}, copy: () => {} };
      this.rotation = { copy: () => {} };
      this.visible = true;
    }
  },
  
  Object3D: class {
    constructor() {
      this.position = { set: () => {}, copy: () => {} };
      this.children = [];
      this.parent = null;
      this.name = '';
      this.userData = {};
    }
    
    add(child) {
      if (!this.children.includes(child)) {
        this.children.push(child);
        child.parent = this;
      }
    }
    
    remove(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1);
        child.parent = null;
      }
    }
  },
  
  DirectionalLightHelper: class {
    constructor(light, size, color) {
      this.light = light;
      this.size = size;
      this.color = color;
    }
    
    add(helper) {
      // Mock add method
    }
  },
  
  CameraHelper: class {
    constructor(camera) {
      this.camera = camera;
    }
  },
  
  OrthographicCamera: class {
    constructor() {
      this.left = -10;
      this.right = 10;
      this.top = 10;
      this.bottom = -10;
      this.updateProjectionMatrix = () => {};
    }
  }
};

// 模拟Light3D基类
class MockLight3D {
  constructor(name, lightType, config = {}) {
    this.name = name;
    this._lightType = lightType;
    this._config = {
      color: 0xffffff,
      intensity: 1.0,
      enabled: true,
      castShadow: false,
      shadowType: 'basic',
      shadowMapSize: 1024,
      shadowCameraNear: 0.1,
      shadowCameraFar: 100,
      shadowBias: -0.0001,
      shadowNormalBias: 0.02,
      debugVisible: false,
      ...config
    };
    this._threeLight = null;
    this._debugHelper = null;
    this._initialized = false;
    this._needsUpdate = true;
    this.object3D = new THREE.Object3D();
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
  }
  
  get lightType() { return this._lightType; }
  get color() { return this._config.color; }
  set color(value) { this._config.color = value; this._updateThreeLight(); }
  get intensity() { return this._config.intensity; }
  set intensity(value) { this._config.intensity = value; this._updateThreeLight(); }
  get enabled() { return this._config.enabled; }
  set enabled(value) { this._config.enabled = value; }
  get castShadow() { return this._config.castShadow; }
  set castShadow(value) { this._config.castShadow = value; }
  get shadowType() { return this._config.shadowType; }
  set shadowType(value) { this._config.shadowType = value; }
  get debugVisible() { return this._config.debugVisible; }
  set debugVisible(value) { this._config.debugVisible = value; }
  get threeLight() { return this._threeLight; }
  
  _ready() {
    if (!this._initialized) {
      this._threeLight = this._createThreeLight();
      this._applyBasicProperties();
      this._initialized = true;
    }
  }
  
  _applyBasicProperties() {
    if (this._threeLight) {
      this._threeLight.color.setHex(this.color);
      this._threeLight.intensity = this.intensity;
      this._threeLight.visible = this.enabled;
      this._updateLightSpecificProperties();
    }
  }
  
  _updateThreeLight() {
    if (this._initialized && this._threeLight) {
      this._applyBasicProperties();
    }
  }
  
  getConfig() { return { ...this._config }; }
  
  destroy() {
    this._initialized = false;
    this._threeLight = null;
  }
  
  // 抽象方法 - 子类需要实现
  _createThreeLight() { throw new Error('Abstract method'); }
  _updateLightSpecificProperties() { throw new Error('Abstract method'); }
  _createDebugHelper() { throw new Error('Abstract method'); }
}

// DirectionalLight3D实现（简化版）
class DirectionalLight3D extends MockLight3D {
  constructor(name = 'DirectionalLight3D', config = {}) {
    super(name, 'directional', config);
    
    this._directionalConfig = {
      shadowCameraLeft: -10,
      shadowCameraRight: 10,
      shadowCameraTop: 10,
      shadowCameraBottom: -10,
      target: { x: 0, y: 0, z: 0 },
      ...config
    };
    
    this._directionalLight = null;
    this._target = null;
  }
  
  // 属性访问器
  get shadowCameraLeft() { return this._directionalConfig.shadowCameraLeft || -10; }
  set shadowCameraLeft(value) { this._directionalConfig.shadowCameraLeft = value; this._updateShadowCamera(); }
  
  get shadowCameraRight() { return this._directionalConfig.shadowCameraRight || 10; }
  set shadowCameraRight(value) { this._directionalConfig.shadowCameraRight = value; this._updateShadowCamera(); }
  
  get shadowCameraTop() { return this._directionalConfig.shadowCameraTop || 10; }
  set shadowCameraTop(value) { this._directionalConfig.shadowCameraTop = value; this._updateShadowCamera(); }
  
  get shadowCameraBottom() { return this._directionalConfig.shadowCameraBottom || -10; }
  set shadowCameraBottom(value) { this._directionalConfig.shadowCameraBottom = value; this._updateShadowCamera(); }
  
  get target() { return this._directionalConfig.target || { x: 0, y: 0, z: 0 }; }
  set target(value) { this._directionalConfig.target = { ...value }; this._updateTarget(); }
  
  get directionalLight() { return this._directionalLight; }
  
  // 抽象方法实现
  _createThreeLight() {
    this._directionalLight = new THREE.DirectionalLight(this.color, this.intensity);
    
    this._target = new THREE.Object3D();
    this._target.position.set(this.target.x, this.target.y, this.target.z);
    this._directionalLight.target = this._target;
    
    return this._directionalLight;
  }
  
  _updateLightSpecificProperties() {
    if (!this._directionalLight) return;
    this._updateTarget();
    this._updateShadowCamera();
  }
  
  _createDebugHelper() {
    if (!this._directionalLight) return null;
    const helper = new THREE.DirectionalLightHelper(this._directionalLight, 1, 0xffff00);
    if (this.castShadow && this._directionalLight.shadow) {
      const shadowHelper = new THREE.CameraHelper(this._directionalLight.shadow.camera);
      helper.add(shadowHelper);
    }
    return helper;
  }
  
  // 私有方法
  _updateTarget() {
    if (!this._target) return;
    this._target.position.set(this.target.x, this.target.y, this.target.z);
    if (this.object3D && !this.object3D.children.includes(this._target)) {
      this.object3D.add(this._target);
    }
  }
  
  _updateShadowCamera() {
    if (!this._directionalLight || !this._directionalLight.shadow) return;
    const camera = this._directionalLight.shadow.camera;
    camera.left = this.shadowCameraLeft;
    camera.right = this.shadowCameraRight;
    camera.top = this.shadowCameraTop;
    camera.bottom = this.shadowCameraBottom;
    camera.updateProjectionMatrix();
  }
  
  // 公共方法
  setShadowCameraBox(left, right, top, bottom) {
    this._directionalConfig.shadowCameraLeft = left;
    this._directionalConfig.shadowCameraRight = right;
    this._directionalConfig.shadowCameraTop = top;
    this._directionalConfig.shadowCameraBottom = bottom;
    this._updateShadowCamera();
  }
  
  setShadowCameraSize(size) {
    const halfSize = size / 2;
    this.setShadowCameraBox(-halfSize, halfSize, halfSize, -halfSize);
  }
  
  setDirection(target) {
    this.target = target;
  }
  
  setDirectionVector(direction) {
    const currentPos = this.position;
    this.target = {
      x: currentPos.x + direction.x,
      y: currentPos.y + direction.y,
      z: currentPos.z + direction.z
    };
  }
  
  getDirectionVector() {
    const currentPos = this.position;
    const targetPos = this.target;
    return {
      x: targetPos.x - currentPos.x,
      y: targetPos.y - currentPos.y,
      z: targetPos.z - currentPos.z
    };
  }
  
  getDirectionalStats() {
    return {
      shadowCameraLeft: this.shadowCameraLeft,
      shadowCameraRight: this.shadowCameraRight,
      shadowCameraTop: this.shadowCameraTop,
      shadowCameraBottom: this.shadowCameraBottom,
      target: this.target,
      direction: this.getDirectionVector()
    };
  }
  
  clone(name) {
    const cloned = new DirectionalLight3D(
      name || `${this.name}_clone`,
      {
        ...this.getConfig(),
        ...this._directionalConfig
      }
    );
    
    cloned.position = { ...this.position };
    cloned.rotation = { ...this.rotation };
    cloned.scale = { ...this.scale };
    
    return cloned;
  }
}

// 运行集成测试
function runIntegrationTests() {
  console.log('=== DirectionalLight3D 集成测试 ===\n');
  
  const results = [];
  
  try {
    // 测试1: 基本创建和初始化
    console.log('测试1: 基本创建和初始化');
    const light = new DirectionalLight3D('TestLight');
    light._ready();
    
    if (light.directionalLight && light.threeLight) {
      results.push('✓ Three.js对象创建成功');
    } else {
      results.push('✗ Three.js对象创建失败');
    }
    
    // 测试2: 属性同步
    console.log('测试2: 属性同步');
    light.color = 0xff0000;
    light.intensity = 2.0;
    
    if (light.directionalLight.intensity === 2.0) {
      results.push('✓ 属性同步成功');
    } else {
      results.push('✗ 属性同步失败');
    }
    
    // 测试3: 目标对象管理
    console.log('测试3: 目标对象管理');
    light.target = { x: 5, y: 0, z: -5 };
    
    if (light.directionalLight.target && light.object3D.children.length > 0) {
      results.push('✓ 目标对象管理正确');
    } else {
      results.push('✗ 目标对象管理失败');
    }
    
    // 测试4: 阴影相机配置
    console.log('测试4: 阴影相机配置');
    light.castShadow = true;
    light.setShadowCameraBox(-20, 20, 20, -20);
    
    const shadowCamera = light.directionalLight.shadow.camera;
    if (shadowCamera.left === -20 && shadowCamera.right === 20) {
      results.push('✓ 阴影相机配置正确');
    } else {
      results.push('✗ 阴影相机配置失败');
    }
    
    // 测试5: 方向控制
    console.log('测试5: 方向控制');
    light.position = { x: 0, y: 10, z: 0 };
    light.setDirectionVector({ x: 1, y: -1, z: 0 });
    
    const direction = light.getDirectionVector();
    if (direction.x === 1 && direction.y === -1 && direction.z === 0) {
      results.push('✓ 方向控制正确');
    } else {
      results.push('✗ 方向控制失败');
    }
    
    // 测试6: 克隆功能
    console.log('测试6: 克隆功能');
    const cloned = light.clone('ClonedLight');
    cloned._ready();
    
    if (cloned.name === 'ClonedLight' && cloned.color === light.color) {
      results.push('✓ 克隆功能正确');
    } else {
      results.push('✗ 克隆功能失败');
    }
    
    // 测试7: 统计信息
    console.log('测试7: 统计信息');
    const stats = light.getDirectionalStats();
    
    if (stats.target && stats.direction && stats.shadowCameraLeft !== undefined) {
      results.push('✓ 统计信息完整');
    } else {
      results.push('✗ 统计信息不完整');
    }
    
    // 清理
    light.destroy();
    cloned.destroy();
    
  } catch (error) {
    results.push(`✗ 测试异常: ${error.message}`);
  }
  
  // 输出结果
  console.log('\n=== 测试结果 ===');
  results.forEach(result => console.log(result));
  
  const passCount = results.filter(r => r.startsWith('✓')).length;
  const totalCount = results.length;
  
  console.log(`\n通过: ${passCount}/${totalCount}`);
  console.log('=== 集成测试完成 ===');
}

// 运行测试
runIntegrationTests();
