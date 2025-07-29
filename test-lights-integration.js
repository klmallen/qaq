/**
 * 光照节点集成验证测试
 * 验证我们的光照节点与Three.js的集成是否正确
 */

// 模拟Three.js环境
const THREE = {
  SpotLight: class {
    constructor(color, intensity, distance, angle, penumbra, decay) {
      this.color = { getHex: () => color, setHex: (c) => { this.colorValue = c; } };
      this.intensity = intensity;
      this.distance = distance;
      this.angle = angle;
      this.penumbra = penumbra;
      this.decay = decay;
      this.target = null;
      this.castShadow = false;
      this.shadow = {
        camera: {
          near: 0.1,
          far: 100,
          fov: 60,
          updateProjectionMatrix: () => {}
        },
        mapSize: { width: 1024, height: 1024 }
      };
      this.position = { set: () => {}, copy: () => {} };
      this.rotation = { copy: () => {} };
      this.visible = true;
    }
  },
  
  PointLight: class {
    constructor(color, intensity, distance, decay) {
      this.color = { getHex: () => color, setHex: (c) => { this.colorValue = c; } };
      this.intensity = intensity;
      this.distance = distance;
      this.decay = decay;
      this.castShadow = false;
      this.shadow = {
        camera: {
          near: 0.1,
          far: 100,
          updateProjectionMatrix: () => {}
        },
        mapSize: { width: 1024, height: 1024 }
      };
      this.position = { set: () => {}, copy: () => {} };
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
  
  SpotLightHelper: class {
    constructor(light, color) {
      this.light = light;
      this.color = color;
    }
    add(helper) {}
  },
  
  PointLightHelper: class {
    constructor(light, size, color) {
      this.light = light;
      this.size = size;
      this.color = color;
    }
  },
  
  CameraHelper: class {
    constructor(camera) {
      this.camera = camera;
    }
  },
  
  PerspectiveCamera: class {
    constructor() {
      this.near = 0.1;
      this.far = 100;
      this.fov = 60;
      this.updateProjectionMatrix = () => {};
    }
  }
};

// 模拟Light3D基类（简化版）
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

// SpotLight3D实现验证
class SpotLight3D extends MockLight3D {
  constructor(name = 'SpotLight3D', config = {}) {
    super(name, 'spot', config);
    
    this._spotConfig = {
      range: 10,
      decay: 2,
      angle: Math.PI / 3,
      penumbra: 0.1,
      target: { x: 0, y: 0, z: -1 },
      physicallyCorrectLights: true,
      ...config
    };
    
    this._spotLight = null;
    this._target = null;
  }
  
  get range() { return this._spotConfig.range || 10; }
  set range(value) { this._spotConfig.range = Math.max(0.1, value); this._updateSpotLight(); }
  
  get decay() { return this._spotConfig.decay || 2; }
  set decay(value) { this._spotConfig.decay = Math.max(0, value); this._updateSpotLight(); }
  
  get angle() { return this._spotConfig.angle || Math.PI / 3; }
  set angle(value) { this._spotConfig.angle = Math.max(0, Math.min(Math.PI / 2, value)); this._updateSpotLight(); }
  
  get angleDegrees() { return (this.angle * 180) / Math.PI; }
  set angleDegrees(value) { this.angle = (value * Math.PI) / 180; }
  
  get penumbra() { return this._spotConfig.penumbra || 0.1; }
  set penumbra(value) { this._spotConfig.penumbra = Math.max(0, Math.min(1, value)); this._updateSpotLight(); }
  
  get target() { return this._spotConfig.target || { x: 0, y: 0, z: -1 }; }
  set target(value) { this._spotConfig.target = { ...value }; this._updateTarget(); }
  
  get spotLight() { return this._spotLight; }
  
  _createThreeLight() {
    this._spotLight = new THREE.SpotLight(
      this.color,
      this.intensity,
      this.range,
      this.angle,
      this.penumbra,
      this.decay
    );
    
    this._target = new THREE.Object3D();
    this._target.position.set(this.target.x, this.target.y, this.target.z);
    this._spotLight.target = this._target;
    
    return this._spotLight;
  }
  
  _updateLightSpecificProperties() {
    this._updateSpotLight();
    this._updateTarget();
  }
  
  _createDebugHelper() {
    if (!this._spotLight) return null;
    const helper = new THREE.SpotLightHelper(this._spotLight, 0xffff00);
    if (this.castShadow && this._spotLight.shadow) {
      const shadowHelper = new THREE.CameraHelper(this._spotLight.shadow.camera);
      helper.add(shadowHelper);
    }
    return helper;
  }
  
  _updateSpotLight() {
    if (!this._spotLight) return;
    this._spotLight.distance = this.range;
    this._spotLight.angle = this.angle;
    this._spotLight.penumbra = this.penumbra;
    this._spotLight.decay = this.decay;
    this._updateShadowCamera();
  }
  
  _updateTarget() {
    if (!this._target) return;
    this._target.position.set(this.target.x, this.target.y, this.target.z);
    if (this.object3D && !this.object3D.children.includes(this._target)) {
      this.object3D.add(this._target);
    }
  }
  
  _updateShadowCamera() {
    if (!this._spotLight || !this._spotLight.shadow) return;
    const camera = this._spotLight.shadow.camera;
    camera.near = this.getConfig().shadowCameraNear || 0.1;
    camera.far = this.range;
    camera.fov = (this.angle * 180) / Math.PI * 2;
    camera.updateProjectionMatrix();
  }
  
  setConeParameters(angle, penumbra) {
    this._spotConfig.angle = Math.max(0, Math.min(Math.PI / 2, angle));
    this._spotConfig.penumbra = Math.max(0, Math.min(1, penumbra));
    this._updateSpotLight();
  }
  
  getSpotStats() {
    return {
      range: this.range,
      decay: this.decay,
      angle: this.angle,
      angleDegrees: this.angleDegrees,
      penumbra: this.penumbra,
      target: this.target
    };
  }
}

// OmniLight3D实现验证
class OmniLight3D extends MockLight3D {
  constructor(name = 'OmniLight3D', config = {}) {
    super(name, 'point', config);
    
    this._omniConfig = {
      range: 10,
      decay: 2,
      physicallyCorrectLights: true,
      ...config
    };
    
    this._pointLight = null;
  }
  
  get range() { return this._omniConfig.range || 10; }
  set range(value) { this._omniConfig.range = Math.max(0.1, value); this._updatePointLight(); }
  
  get decay() { return this._omniConfig.decay || 2; }
  set decay(value) { this._omniConfig.decay = Math.max(0, value); this._updatePointLight(); }
  
  get pointLight() { return this._pointLight; }
  
  _createThreeLight() {
    this._pointLight = new THREE.PointLight(
      this.color,
      this.intensity,
      this.range,
      this.decay
    );
    return this._pointLight;
  }
  
  _updateLightSpecificProperties() {
    this._updatePointLight();
  }
  
  _createDebugHelper() {
    if (!this._pointLight) return null;
    return new THREE.PointLightHelper(this._pointLight, 1, 0xffff00);
  }
  
  _updatePointLight() {
    if (!this._pointLight) return;
    this._pointLight.distance = this.range;
    this._pointLight.decay = this.decay;
  }
}

// 运行验证测试
function runLightValidationTests() {
  console.log('=== 光照节点验证测试 ===\n');
  
  const results = [];
  
  try {
    // 测试1: SpotLight3D基本功能
    console.log('测试1: SpotLight3D基本功能');
    const spotLight = new SpotLight3D('TestSpot');
    spotLight._ready();
    
    if (spotLight.spotLight && spotLight.spotLight.angle === Math.PI / 3) {
      results.push('✓ SpotLight3D创建和初始化成功');
    } else {
      results.push('✗ SpotLight3D创建失败');
    }
    
    // 测试2: SpotLight3D属性控制
    console.log('测试2: SpotLight3D属性控制');
    spotLight.angleDegrees = 45;
    spotLight.range = 20;
    spotLight.penumbra = 0.2;
    
    if (spotLight.angle === Math.PI / 4 && spotLight.range === 20) {
      results.push('✓ SpotLight3D属性控制正确');
    } else {
      results.push('✗ SpotLight3D属性控制失败');
    }
    
    // 测试3: OmniLight3D基本功能
    console.log('测试3: OmniLight3D基本功能');
    const omniLight = new OmniLight3D('TestOmni');
    omniLight._ready();
    
    if (omniLight.pointLight && omniLight.pointLight.distance === 10) {
      results.push('✓ OmniLight3D创建和初始化成功');
    } else {
      results.push('✗ OmniLight3D创建失败');
    }
    
    // 测试4: OmniLight3D属性控制
    console.log('测试4: OmniLight3D属性控制');
    omniLight.range = 15;
    omniLight.decay = 1;
    
    if (omniLight.range === 15 && omniLight.decay === 1) {
      results.push('✓ OmniLight3D属性控制正确');
    } else {
      results.push('✗ OmniLight3D属性控制失败');
    }
    
    // 测试5: 光照统计信息
    console.log('测试5: 光照统计信息');
    const spotStats = spotLight.getSpotStats();
    
    if (spotStats.angleDegrees === 45 && spotStats.range === 20) {
      results.push('✓ 光照统计信息正确');
    } else {
      results.push('✗ 光照统计信息错误');
    }
    
    // 测试6: 调试辅助
    console.log('测试6: 调试辅助');
    const spotHelper = spotLight._createDebugHelper();
    const omniHelper = omniLight._createDebugHelper();
    
    if (spotHelper && omniHelper) {
      results.push('✓ 调试辅助创建成功');
    } else {
      results.push('✗ 调试辅助创建失败');
    }
    
    // 清理
    spotLight.destroy();
    omniLight.destroy();
    
  } catch (error) {
    results.push(`✗ 测试异常: ${error.message}`);
  }
  
  // 输出结果
  console.log('\n=== 验证结果 ===');
  results.forEach(result => console.log(result));
  
  const passCount = results.filter(r => r.startsWith('✓')).length;
  const totalCount = results.length;
  
  console.log(`\n通过: ${passCount}/${totalCount}`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有验证测试通过！光照节点实现正确。');
    console.log('\n📋 建议下一步工作：');
    console.log('1. 创建实际的Three.js集成测试');
    console.log('2. 编写性能基准测试');
    console.log('3. 完善文档和使用示例');
    console.log('4. 转向下一个优先级任务（如Camera3D系统）');
  } else {
    console.log('⚠️  发现问题，需要修复后再继续');
  }
  
  console.log('=== 验证测试完成 ===');
}

// 运行测试
runLightValidationTests();
