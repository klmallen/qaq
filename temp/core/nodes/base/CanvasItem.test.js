/**
 * QAQ游戏引擎 - CanvasItem 单元测试
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 测试内容:
 * - CanvasItem基础功能
 * - 渲染状态管理
 * - 变换计算
 * - 可见性检查
 * - 渲染命令管理
 */
import CanvasItem, { BlendMode } from './CanvasItem';
// ============================================================================
// 测试用例
// ============================================================================
/**
 * 测试CanvasItem基础功能
 */
function testCanvasItemBasics() {
    console.log('🧪 测试CanvasItem基础功能...');
    // 创建CanvasItem实例
    const canvasItem = new CanvasItem('TestCanvasItem');
    // 测试基础属性
    console.assert(canvasItem.name === 'TestCanvasItem', '节点名称设置失败');
    console.assert(canvasItem.visible === true, '默认可见性应为true');
    console.assert(canvasItem.zIndex === 0, '默认Z索引应为0');
    console.assert(canvasItem.zAsRelative === true, '默认Z索引应为相对');
    console.log('✅ CanvasItem基础功能测试通过');
}
/**
 * 测试渲染状态管理
 */
function testRenderingState() {
    console.log('🧪 测试渲染状态管理...');
    const canvasItem = new CanvasItem('TestRenderState');
    // 测试可见性
    canvasItem.visible = false;
    console.assert(canvasItem.visible === false, '可见性设置失败');
    canvasItem.show();
    console.assert(canvasItem.visible, 'show()方法失败');
    canvasItem.hide();
    console.assert(canvasItem.visible === false, 'hide()方法失败');
    // 测试Z索引
    canvasItem.zIndex = 10;
    console.assert(canvasItem.zIndex === 10, 'Z索引设置失败');
    // 测试调制颜色
    const testColor = { r: 0.5, g: 0.8, b: 0.2, a: 0.9 };
    canvasItem.modulate = testColor;
    const modulate = canvasItem.modulate;
    console.assert(Math.abs(modulate.r - testColor.r) < 0.001 &&
        Math.abs(modulate.g - testColor.g) < 0.001 &&
        Math.abs(modulate.b - testColor.b) < 0.001 &&
        Math.abs(modulate.a - testColor.a) < 0.001, '调制颜色设置失败');
    console.log('✅ 渲染状态管理测试通过');
}
/**
 * 测试层级可见性
 */
function testTreeVisibility() {
    console.log('🧪 测试层级可见性...');
    const parent = new CanvasItem('Parent');
    const child = new CanvasItem('Child');
    parent.addChild(child);
    // 测试子节点可见性
    console.assert(child.isVisibleInTree() === true, '子节点应该可见');
    // 隐藏父节点
    parent.visible = false;
    console.assert(child.isVisibleInTree() === false, '父节点隐藏时子节点应该不可见');
    // 显示父节点，隐藏子节点
    parent.visible = true;
    child.visible = false;
    console.assert(child.isVisibleInTree() === false, '子节点隐藏时应该不可见');
    console.log('✅ 层级可见性测试通过');
}
/**
 * 测试有效Z索引计算
 */
function testEffectiveZIndex() {
    console.log('🧪 测试有效Z索引计算...');
    const parent = new CanvasItem('Parent');
    const child = new CanvasItem('Child');
    parent.addChild(child);
    // 测试相对Z索引
    parent.zIndex = 5;
    child.zIndex = 3;
    child.zAsRelative = true;
    console.assert(child.getEffectiveZIndex() === 8, '相对Z索引计算错误');
    // 测试绝对Z索引
    child.zAsRelative = false;
    console.assert(child.getEffectiveZIndex() === 3, '绝对Z索引计算错误');
    console.log('✅ 有效Z索引计算测试通过');
}
/**
 * 测试渲染命令管理
 */
function testRenderCommands() {
    console.log('🧪 测试渲染命令管理...');
    const canvasItem = new CanvasItem('TestRenderCommands');
    // 创建测试用的自定义CanvasItem类
    class TestCanvasItem extends CanvasItem {
        testAddRenderCommand() {
            this.addRenderCommand({
                type: 'draw_rect',
                zIndex: 1,
                data: { rect: { position: { x: 0, y: 0 }, size: { x: 100, y: 100 } }, color: { r: 1, g: 0, b: 0, a: 1 } },
                transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } },
                blendMode: BlendMode.NORMAL,
                modulate: { r: 1, g: 1, b: 1, a: 1 }
            });
        }
        testClearRenderCommands() {
            this.clearRenderCommands();
        }
    }
    const testItem = new TestCanvasItem('TestItem');
    // 测试添加渲染命令
    testItem.testAddRenderCommand();
    const commands = testItem.getRenderCommands();
    console.assert(commands.length === 1, '渲染命令添加失败');
    console.assert(commands[0].type === 'draw_rect', '渲染命令类型错误');
    // 测试清空渲染命令
    testItem.testClearRenderCommands();
    const emptyCommands = testItem.getRenderCommands();
    console.assert(emptyCommands.length === 0, '渲染命令清空失败');
    console.log('✅ 渲染命令管理测试通过');
}
/**
 * 测试信号系统
 */
function testSignals() {
    console.log('🧪 测试信号系统...');
    const canvasItem = new CanvasItem('TestSignals');
    let visibilityChanged = false;
    let zIndexChanged = false;
    // 连接信号
    canvasItem.connect('visibility_changed', (visible) => {
        visibilityChanged = true;
        console.assert(visible === false, '可见性变化信号参数错误');
    });
    canvasItem.connect('z_index_changed', (zIndex) => {
        zIndexChanged = true;
        console.assert(zIndex === 5, 'Z索引变化信号参数错误');
    });
    // 触发信号
    canvasItem.visible = false;
    canvasItem.zIndex = 5;
    console.assert(visibilityChanged, '可见性变化信号未触发');
    console.assert(zIndexChanged, 'Z索引变化信号未触发');
    console.log('✅ 信号系统测试通过');
}
/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('🚀 开始CanvasItem单元测试...\n');
    try {
        testCanvasItemBasics();
        testRenderingState();
        testTreeVisibility();
        testEffectiveZIndex();
        testRenderCommands();
        testSignals();
        console.log('\n🎉 所有CanvasItem测试通过！');
        console.log('📊 测试统计: 6个测试用例全部通过');
    }
    catch (error) {
        console.error('\n❌ 测试失败:', error);
        console.log('📊 测试统计: 部分测试失败');
    }
}
// ============================================================================
// 导出测试函数
// ============================================================================
export { testCanvasItemBasics, testRenderingState, testTreeVisibility, testEffectiveZIndex, testRenderCommands, testSignals, runAllTests };
// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    runAllTests();
}
