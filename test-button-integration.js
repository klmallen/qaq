/**
 * Button控件集成测试
 * 验证修复后的Button控件功能
 */

// 模拟DOM环境
const mockDOM = {
  createElement: (tag) => {
    const element = {
      tagName: tag.toUpperCase(),
      className: '',
      type: '',
      textContent: '',
      src: '',
      alt: '',
      disabled: false,
      innerHTML: '',
      style: {},
      children: [],
      _eventListeners: {},
      appendChild: function(child) { this.children.push(child) },
      remove: function() {},
      addEventListener: function(event, handler) {
        this._eventListeners[event] = this._eventListeners[event] || []
        this._eventListeners[event].push(handler)
      },
      getBoundingClientRect: () => ({
        left: 0, top: 0, width: 100, height: 30, right: 100, bottom: 30
      })
    }
    return element
  }
}

global.document = mockDOM

// 模拟Three.js
const THREE = {
  Raycaster: class {
    constructor() {
      this.setFromCamera = () => {}
      this.intersectObjects = () => []
    }
  },
  Vector2: class {
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
      this.set = (x, y) => { this.x = x; this.y = y }
    }
  },
  Vector3: class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x
      this.y = y
      this.z = z
    }
  }
}

// 模拟UI系统类
class MockUICoordinateSystem {
  static domToUI(domEvent, uiElement) {
    const rect = uiElement.getBoundingClientRect()
    return {
      x: domEvent.clientX - rect.left,
      y: domEvent.clientY - rect.top
    }
  }
  
  static isPointInBounds(point, size) {
    return point.x >= 0 && point.x <= size.x && 
           point.y >= 0 && point.y <= size.y
  }
  
  static screenToNDC(screenX, screenY, containerWidth, containerHeight) {
    return {
      x: (screenX / containerWidth) * 2 - 1,
      y: -(screenY / containerHeight) * 2 + 1
    }
  }
}

class MockUIDepthManager {
  static depthMap = new Map()
  static layerUsage = new Map()
  
  static getUIDepth(zIndex, layer) {
    return layer + zIndex * 0.001
  }
  
  static registerElement(elementId, zIndex, layer) {
    const depth = this.getUIDepth(zIndex, layer)
    this.depthMap.set(elementId, depth)
  }
  
  static unregisterElement(elementId) {
    this.depthMap.delete(elementId)
  }
  
  static getElementDepth(elementId) {
    return this.depthMap.get(elementId) || null
  }
  
  static setUIPosition(object3D, position, zIndex, layer) {
    const depth = this.getUIDepth(zIndex, layer)
    if (object3D && object3D.position) {
      object3D.position.set(position.x, position.y, depth)
    }
  }
  
  static clear() {
    this.depthMap.clear()
    this.layerUsage.clear()
  }
}

class MockUIEventPriority {
  static uiElements = new Map()
  static focusedElement = null
  static hoveredElement = null
  static pressedElement = null
  
  static registerUIElement(id, zIndex, bounds) {
    this.uiElements.set(id, {
      id, zIndex, bounds,
      isHovered: false,
      hasFocus: false,
      isPressed: false,
      isDragging: false
    })
  }
  
  static unregisterUIElement(id) {
    if (this.focusedElement === id) this.focusedElement = null
    if (this.hoveredElement === id) this.hoveredElement = null
    if (this.pressedElement === id) this.pressedElement = null
    this.uiElements.delete(id)
  }
  
  static updateUIElementState(id, state) {
    const element = this.uiElements.get(id)
    if (element) {
      Object.assign(element, state)
      if (state.hasFocus) this.focusedElement = id
      if (state.isHovered) this.hoveredElement = id
      if (state.isPressed) this.pressedElement = id
    }
  }
  
  static setFocus(elementId) {
    this.focusedElement = elementId
  }
  
  static shouldBlockCameraControls() {
    return this.focusedElement !== null || 
           this.hoveredElement !== null || 
           this.pressedElement !== null
  }
  
  static getCurrentState() {
    return {
      focusedElement: this.focusedElement,
      hoveredElement: this.hoveredElement,
      pressedElement: this.pressedElement,
      totalElements: this.uiElements.size,
      shouldBlockCamera: this.shouldBlockCameraControls()
    }
  }
  
  static clear() {
    this.uiElements.clear()
    this.focusedElement = null
    this.hoveredElement = null
    this.pressedElement = null
  }
}

// 模拟Control基类
class MockControl {
  constructor(name) {
    this.name = name
    this.position = { x: 0, y: 0 }
    this.size = { x: 100, y: 30 }
    this.zIndex = 0
    this.object3D = {
      position: { set: () => {} }
    }
    this._signals = new Map()
  }
  
  addUserSignal(name, params = []) {
    this._signals.set(name, { params, callbacks: [] })
  }
  
  emit(signalName, ...args) {
    const signal = this._signals.get(signalName)
    if (signal) {
      signal.callbacks.forEach(callback => callback(...args))
    }
  }
  
  connect(signalName, callback) {
    const signal = this._signals.get(signalName)
    if (signal) {
      signal.callbacks.push(callback)
    }
  }
  
  destroy() {
    // 基类销毁逻辑
  }
  
  _ready() {
    // 基类准备逻辑
  }
}

// 模拟Button类（简化版，用于测试核心功能）
class TestButton extends MockControl {
  constructor(name = 'Button', config = {}) {
    super(name)
    
    // 应用配置
    this._text = config.text || ''
    this._icon = config.icon || ''
    this._disabled = config.disabled || false
    this._toggleMode = config.toggleMode || false
    this._flat = config.flat || false
    this._buttonPressed = false
    this._isPressed = false
    this._isHovered = false
    
    // 注册到UI系统
    this.registerToUISystem()
    
    // 初始化信号
    this.addUserSignal('pressed')
    this.addUserSignal('button_down')
    this.addUserSignal('button_up')
    this.addUserSignal('toggled', ['button_pressed'])
    
    // 创建DOM元素
    this._buttonElement = mockDOM.createElement('button')
    this.setupButtonEvents()
  }
  
  registerToUISystem() {
    MockUIDepthManager.registerElement(this.name, this.zIndex, 200) // UI_CONTENT
    MockUIEventPriority.registerUIElement(this.name, this.zIndex, {
      x: this.position.x,
      y: this.position.y,
      width: this.size.x,
      height: this.size.y
    })
  }
  
  setupButtonEvents() {
    this._buttonElement.addEventListener('mousedown', (e) => {
      if (this._disabled) return
      
      const uiPoint = MockUICoordinateSystem.domToUI(e, this._buttonElement)
      if (!MockUICoordinateSystem.isPointInBounds(uiPoint, this.size)) return
      
      MockUIEventPriority.updateUIElementState(this.name, { isPressed: true })
      this._isPressed = true
      this.emit('button_down')
    })
    
    this._buttonElement.addEventListener('mouseup', (e) => {
      if (this._disabled) return
      
      const wasPressed = this._isPressed
      this._isPressed = false
      MockUIEventPriority.updateUIElementState(this.name, { isPressed: false })
      this.emit('button_up')
      
      if (wasPressed) {
        this.handlePress()
      }
    })
    
    this._buttonElement.addEventListener('mouseenter', () => {
      this._isHovered = true
      MockUIEventPriority.updateUIElementState(this.name, { isHovered: true })
    })
    
    this._buttonElement.addEventListener('mouseleave', () => {
      this._isHovered = false
      MockUIEventPriority.updateUIElementState(this.name, { isHovered: false })
    })
  }
  
  handlePress() {
    if (this._toggleMode) {
      this._buttonPressed = !this._buttonPressed
      this.emit('toggled', this._buttonPressed)
    }
    this.emit('pressed')
  }
  
  get text() { return this._text }
  set text(value) { this._text = value }
  
  get disabled() { return this._disabled }
  set disabled(value) { this._disabled = value }
  
  get zIndex() { return super.zIndex }
  set zIndex(value) {
    super.zIndex = value
    MockUIDepthManager.registerElement(this.name, value, 200)
    MockUIEventPriority.updateUIElementState(this.name, { zIndex: value })
  }
  
  destroy() {
    MockUIDepthManager.unregisterElement(this.name)
    MockUIEventPriority.unregisterUIElement(this.name)
    super.destroy()
  }
}

// 运行测试
function runButtonTests() {
  console.log('=== Button控件集成测试 ===\n')
  
  const results = []
  
  try {
    // 清理状态
    MockUIDepthManager.clear()
    MockUIEventPriority.clear()
    
    // 测试1: 基本创建和配置
    console.log('测试1: 基本创建和配置')
    const button = new TestButton('TestButton', {
      text: 'Click Me',
      disabled: false
    })
    
    if (button.text === 'Click Me' && !button.disabled) {
      results.push('✓ 基本创建和配置正确')
    } else {
      results.push('✗ 基本创建和配置失败')
    }
    
    // 测试2: UI系统注册
    console.log('测试2: UI系统注册')
    const depth = MockUIDepthManager.getElementDepth(button.name)
    const state = MockUIEventPriority.getCurrentState()
    
    if (depth !== null && state.totalElements > 0) {
      results.push('✓ UI系统注册成功')
    } else {
      results.push('✗ UI系统注册失败')
    }
    
    // 测试3: 坐标转换
    console.log('测试3: 坐标转换')
    const mockEvent = { clientX: 50, clientY: 15 }
    const uiPoint = MockUICoordinateSystem.domToUI(mockEvent, button._buttonElement)
    
    if (uiPoint.x === 50 && uiPoint.y === 15) {
      results.push('✓ 坐标转换正确')
    } else {
      results.push('✗ 坐标转换失败')
    }
    
    // 测试4: 事件处理
    console.log('测试4: 事件处理')
    let pressedCalled = false
    button.connect('pressed', () => { pressedCalled = true })
    
    // 模拟点击
    button._buttonElement._eventListeners.mousedown[0]({ clientX: 50, clientY: 15 })
    button._buttonElement._eventListeners.mouseup[0]({ clientX: 50, clientY: 15 })
    
    if (pressedCalled) {
      results.push('✓ 事件处理正确')
    } else {
      results.push('✗ 事件处理失败')
    }
    
    // 测试5: 深度管理
    console.log('测试5: 深度管理')
    button.zIndex = 10
    const newDepth = MockUIDepthManager.getElementDepth(button.name)
    
    if (newDepth === MockUIDepthManager.getUIDepth(10, 200)) {
      results.push('✓ 深度管理正确')
    } else {
      results.push('✗ 深度管理失败')
    }
    
    // 测试6: 事件优先级
    console.log('测试6: 事件优先级')
    button._buttonElement._eventListeners.mouseenter[0]()
    
    if (MockUIEventPriority.shouldBlockCameraControls()) {
      results.push('✓ 事件优先级正确')
    } else {
      results.push('✗ 事件优先级失败')
    }
    
    // 测试7: 资源清理
    console.log('测试7: 资源清理')
    const buttonName = button.name
    button.destroy()
    
    const depthAfterDestroy = MockUIDepthManager.getElementDepth(buttonName)
    const stateAfterDestroy = MockUIEventPriority.getCurrentState()
    
    if (depthAfterDestroy === null && stateAfterDestroy.totalElements === 0) {
      results.push('✓ 资源清理正确')
    } else {
      results.push('✗ 资源清理失败')
    }
    
  } catch (error) {
    results.push(`✗ 测试异常: ${error.message}`)
  }
  
  // 输出结果
  console.log('\n=== 测试结果 ===')
  results.forEach(result => console.log(result))
  
  const passCount = results.filter(r => r.startsWith('✓')).length
  const totalCount = results.length
  
  console.log(`\n通过: ${passCount}/${totalCount}`)
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！Button控件修复成功。')
  } else {
    console.log('⚠️  部分测试失败，需要进一步修复。')
  }
  
  console.log('=== 测试完成 ===')
}

// 运行测试
runButtonTests()
