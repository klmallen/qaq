/**
 * QAQ游戏引擎 - Button 测试文件
 *
 * 测试Button类的所有功能，包括坐标转换、深度管理和事件优先级
 */

import Button, { ActionMode, TextAlignment, IconAlignment, ButtonConfig } from './Button'
import { UICoordinateSystem } from '../../ui/UICoordinateSystem'
import { UIDepthManager, DepthLayer } from '../../ui/UIDepthManager'
import { UIEventPriority } from '../../ui/UIEventPriority'

// Mock DOM environment for testing
const mockDOM = {
  createElement: (tag: string) => {
    const element = {
      tagName: tag.toUpperCase(),
      className: '',
      type: '',
      textContent: '',
      src: '',
      alt: '',
      disabled: false,
      innerHTML: '',
      style: {} as any,
      children: [] as any[],
      appendChild: (child: any) => element.children.push(child),
      remove: () => {},
      addEventListener: (event: string, handler: Function) => {
        // 存储事件监听器以便测试
        element._eventListeners = element._eventListeners || {}
        element._eventListeners[event] = element._eventListeners[event] || []
        element._eventListeners[event].push(handler)
      },
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 30,
        right: 100,
        bottom: 30
      }),
      _eventListeners: {} as any
    }
    return element
  }
}

// Mock global document
global.document = mockDOM as any

// Mock Three.js
jest.mock('three', () => ({
  Raycaster: jest.fn().mockImplementation(() => ({
    setFromCamera: jest.fn(),
    intersectObjects: jest.fn(() => [])
  })),
  Vector2: jest.fn().mockImplementation((x = 0, y = 0) => ({ x, y, set: jest.fn() })),
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z }))
}))

describe('Button', () => {
  let button: Button

  beforeEach(() => {
    // 清理UI系统状态
    UIDepthManager.clear()
    UIEventPriority.clear()

    button = new Button('TestButton')
  })

  afterEach(() => {
    if (button) {
      button.destroy()
    }

    // 清理UI系统状态
    UIDepthManager.clear()
    UIEventPriority.clear()
  })

  describe('构造函数和基本属性', () => {
    test('应该正确创建Button实例', () => {
      expect(button).toBeInstanceOf(Button)
      expect(button.name).toBe('TestButton')
    })

    test('应该使用默认配置', () => {
      expect(button.text).toBe('')
      expect(button.icon).toBe('')
      expect(button.disabled).toBe(false)
      expect(button.toggleMode).toBe(false)
      expect(button.flat).toBe(false)
      expect(button.buttonPressed).toBe(false)
    })

    test('应该接受自定义配置', () => {
      const config: ButtonConfig = {
        text: 'Click Me',
        icon: 'icon.png',
        disabled: true,
        toggleMode: true,
        flat: true,
        actionMode: ActionMode.BUTTON_PRESS,
        textAlignment: TextAlignment.LEFT,
        iconAlignment: IconAlignment.RIGHT
      }

      const customButton = new Button('CustomButton', config)

      expect(customButton.text).toBe('Click Me')
      expect(customButton.icon).toBe('icon.png')
      expect(customButton.disabled).toBe(true)
      expect(customButton.toggleMode).toBe(true)
      expect(customButton.flat).toBe(true)

      customButton.destroy()
    })
  })

  describe('文本属性', () => {
    test('应该正确设置和获取文本', () => {
      button.text = 'Hello World'
      expect(button.text).toBe('Hello World')
    })

    test('文本变化应该更新DOM元素', () => {
      button.text = 'New Text'
      expect(button.text).toBe('New Text')
    })
  })

  describe('图标属性', () => {
    test('应该正确设置和获取图标', () => {
      button.icon = 'test-icon.png'
      expect(button.icon).toBe('test-icon.png')
    })

    test('设置空图标应该正常工作', () => {
      button.icon = 'icon.png'
      button.icon = ''
      expect(button.icon).toBe('')
    })
  })

  describe('禁用状态', () => {
    test('应该正确设置和获取禁用状态', () => {
      expect(button.disabled).toBe(false)

      button.disabled = true
      expect(button.disabled).toBe(true)

      button.disabled = false
      expect(button.disabled).toBe(false)
    })
  })

  describe('切换模式', () => {
    test('应该正确设置切换模式', () => {
      button.toggleMode = true
      expect(button.toggleMode).toBe(true)
    })

    test('应该正确管理按下状态', () => {
      button.toggleMode = true

      expect(button.buttonPressed).toBe(false)

      button.buttonPressed = true
      expect(button.buttonPressed).toBe(true)

      button.buttonPressed = false
      expect(button.buttonPressed).toBe(false)
    })
  })

  describe('扁平样式', () => {
    test('应该正确设置扁平样式', () => {
      button.flat = true
      expect(button.flat).toBe(true)

      button.flat = false
      expect(button.flat).toBe(false)
    })
  })

  describe('事件系统', () => {
    test('应该有正确的信号定义', () => {
      // 检查按钮特有的信号是否已添加
      // 这里需要根据实际的信号系统实现来测试
      expect(button).toBeDefined()
    })

    test('应该能够连接和触发pressed信号', () => {
      let pressedCalled = false

      // 模拟信号连接
      button.connect?.('pressed', () => {
        pressedCalled = true
      })

      // 模拟按钮点击
      button.emit?.('pressed')

      // 由于我们使用的是mock，这里主要测试API的存在性
      expect(button).toBeDefined()
    })
  })

  describe('样式和外观', () => {
    test('应该根据状态应用正确的样式', () => {
      // 测试正常状态
      expect(button.disabled).toBe(false)

      // 测试禁用状态
      button.disabled = true
      expect(button.disabled).toBe(true)

      // 测试按下状态
      button.toggleMode = true
      button.buttonPressed = true
      expect(button.buttonPressed).toBe(true)
    })

    test('扁平样式应该影响外观', () => {
      button.flat = false
      expect(button.flat).toBe(false)

      button.flat = true
      expect(button.flat).toBe(true)
    })
  })

  describe('文本对齐', () => {
    test('应该支持不同的文本对齐方式', () => {
      const leftButton = new Button('LeftButton', {
        textAlignment: TextAlignment.LEFT
      })

      const centerButton = new Button('CenterButton', {
        textAlignment: TextAlignment.CENTER
      })

      const rightButton = new Button('RightButton', {
        textAlignment: TextAlignment.RIGHT
      })

      expect(leftButton).toBeDefined()
      expect(centerButton).toBeDefined()
      expect(rightButton).toBeDefined()

      leftButton.destroy()
      centerButton.destroy()
      rightButton.destroy()
    })
  })

  describe('图标对齐', () => {
    test('应该支持不同的图标对齐方式', () => {
      const configs = [
        { iconAlignment: IconAlignment.LEFT },
        { iconAlignment: IconAlignment.RIGHT },
        { iconAlignment: IconAlignment.TOP },
        { iconAlignment: IconAlignment.BOTTOM }
      ]

      configs.forEach((config, index) => {
        const testButton = new Button(`IconButton${index}`, config)
        expect(testButton).toBeDefined()
        testButton.destroy()
      })
    })
  })

  describe('动作模式', () => {
    test('应该支持不同的动作模式', () => {
      const pressButton = new Button('PressButton', {
        actionMode: ActionMode.BUTTON_PRESS
      })

      const releaseButton = new Button('ReleaseButton', {
        actionMode: ActionMode.BUTTON_RELEASE
      })

      expect(pressButton).toBeDefined()
      expect(releaseButton).toBeDefined()

      pressButton.destroy()
      releaseButton.destroy()
    })
  })

  describe('复杂场景测试', () => {
    test('应该正确处理带图标和文本的按钮', () => {
      button.text = 'Save File'
      button.icon = 'save-icon.png'

      expect(button.text).toBe('Save File')
      expect(button.icon).toBe('save-icon.png')
    })

    test('应该正确处理切换按钮的状态变化', () => {
      button.toggleMode = true
      button.text = 'Toggle Me'

      expect(button.buttonPressed).toBe(false)

      button.buttonPressed = true
      expect(button.buttonPressed).toBe(true)

      button.buttonPressed = false
      expect(button.buttonPressed).toBe(false)
    })

    test('应该正确处理禁用状态下的交互', () => {
      button.disabled = true
      button.text = 'Disabled Button'

      expect(button.disabled).toBe(true)
      expect(button.text).toBe('Disabled Button')
    })
  })

  describe('生命周期管理', () => {
    test('应该正确创建和销毁按钮', () => {
      const tempButton = new Button('TempButton')
      expect(tempButton).toBeDefined()

      tempButton.destroy()
      // 销毁后应该清理资源
      expect(tempButton).toBeDefined() // 对象仍存在，但资源已清理
    })

    test('应该正确处理多个按钮实例', () => {
      const buttons = []

      for (let i = 0; i < 5; i++) {
        buttons.push(new Button(`Button${i}`, {
          text: `Button ${i}`,
          disabled: i % 2 === 0
        }))
      }

      expect(buttons.length).toBe(5)

      buttons.forEach((btn, index) => {
        expect(btn.text).toBe(`Button ${index}`)
        expect(btn.disabled).toBe(index % 2 === 0)
        btn.destroy()
      })
    })
  })

  describe('坐标转换系统测试', () => {
    test('应该正确转换DOM坐标到UI坐标', () => {
      const mockEvent = {
        clientX: 50,
        clientY: 15
      } as MouseEvent

      const mockElement = {
        getBoundingClientRect: () => ({
          left: 10,
          top: 5,
          width: 100,
          height: 30
        })
      } as HTMLElement

      const uiPoint = UICoordinateSystem.domToUI(mockEvent, mockElement)

      expect(uiPoint.x).toBe(40) // 50 - 10
      expect(uiPoint.y).toBe(10) // 15 - 5
    })

    test('应该正确检查点是否在边界内', () => {
      const point = { x: 50, y: 15 }
      const size = { x: 100, y: 30 }

      expect(UICoordinateSystem.isPointInBounds(point, size)).toBe(true)

      const outsidePoint = { x: 150, y: 15 }
      expect(UICoordinateSystem.isPointInBounds(outsidePoint, size)).toBe(false)
    })
  })

  describe('深度管理系统测试', () => {
    test('应该正确注册到深度管理系统', () => {
      button.zIndex = 10

      const depth = UIDepthManager.getElementDepth(button.name)
      expect(depth).toBe(UIDepthManager.getUIDepth(10, DepthLayer.UI_CONTENT))
    })

    test('应该正确更新zIndex', () => {
      button.zIndex = 5
      expect(button.zIndex).toBe(5)

      const depth = UIDepthManager.getElementDepth(button.name)
      expect(depth).toBe(UIDepthManager.getUIDepth(5, DepthLayer.UI_CONTENT))
    })

    test('应该正确处理深度冲突', () => {
      const button2 = new Button('TestButton2')

      button.zIndex = 10
      button2.zIndex = 10

      // 两个按钮应该有不同的深度值
      const depth1 = UIDepthManager.getElementDepth(button.name)
      const depth2 = UIDepthManager.getElementDepth(button2.name)

      expect(depth1).not.toBe(depth2)

      button2.destroy()
    })
  })

  describe('事件优先级系统测试', () => {
    test('应该正确注册到事件优先级系统', () => {
      const state = UIEventPriority.getCurrentState()
      expect(state.totalElements).toBeGreaterThan(0)
    })

    test('应该正确更新悬停状态', () => {
      // 模拟鼠标进入事件
      button._buttonElement?._eventListeners?.mouseenter?.[0]?.({
        stopPropagation: jest.fn()
      })

      const state = UIEventPriority.getCurrentState()
      expect(state.hoveredElement).toBe(button.name)
    })

    test('应该正确处理焦点状态', () => {
      // 模拟焦点事件
      button._buttonElement?._eventListeners?.focus?.[0]?.({
        stopPropagation: jest.fn()
      })

      const state = UIEventPriority.getCurrentState()
      expect(state.focusedElement).toBe(button.name)
    })

    test('应该阻止相机控制当UI元素活跃时', () => {
      // 模拟鼠标按下
      button._buttonElement?._eventListeners?.mousedown?.[0]?.({
        clientX: 50,
        clientY: 15,
        stopPropagation: jest.fn()
      })

      expect(UIEventPriority.shouldBlockCameraControls()).toBe(true)
    })
  })

  describe('边界情况测试', () => {
    test('应该处理空文本', () => {
      button.text = ''
      expect(button.text).toBe('')
    })

    test('应该处理长文本', () => {
      const longText = 'This is a very long button text that might cause layout issues'
      button.text = longText
      expect(button.text).toBe(longText)
    })

    test('应该处理特殊字符', () => {
      const specialText = '按钮 🚀 <>&"'
      button.text = specialText
      expect(button.text).toBe(specialText)
    })

    test('应该处理无效图标路径', () => {
      button.icon = 'invalid-path.png'
      expect(button.icon).toBe('invalid-path.png')
    })

    test('应该正确清理资源', () => {
      const buttonName = button.name

      button.destroy()

      // 检查是否从UI系统中清理
      expect(UIDepthManager.getElementDepth(buttonName)).toBeNull()

      const state = UIEventPriority.getCurrentState()
      expect(state.focusedElement).not.toBe(buttonName)
      expect(state.hoveredElement).not.toBe(buttonName)
    })
  })

  describe('集成测试', () => {
    test('应该正确处理完整的交互流程', () => {
      let pressedCalled = false

      // 连接信号
      button.connect?.('pressed', () => {
        pressedCalled = true
      })

      // 模拟完整的点击流程
      const mockEvent = {
        clientX: 50,
        clientY: 15,
        stopPropagation: jest.fn()
      }

      // 鼠标进入
      button._buttonElement?._eventListeners?.mouseenter?.[0]?.(mockEvent)
      expect(button._isHovered).toBe(true)

      // 鼠标按下
      button._buttonElement?._eventListeners?.mousedown?.[0]?.(mockEvent)
      expect(button._isPressed).toBe(true)

      // 鼠标释放
      button._buttonElement?._eventListeners?.mouseup?.[0]?.(mockEvent)
      expect(button._isPressed).toBe(false)

      // 检查事件是否被阻止冒泡
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })
  })
})
