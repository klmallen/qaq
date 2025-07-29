/**
 * QAQ游戏引擎 - CanvasItem 2D渲染基类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有2D渲染节点的基类，类似于Godot的CanvasItem
 * - 提供2D渲染管道的基础功能：可见性、层级、材质、变换等
 * - 管理2D渲染状态和渲染顺序
 * - 支持自定义绘制和渲染优化
 *
 * 继承关系:
 * Node -> CanvasItem -> Node2D/Control
 */
import Node from '../Node';
// ============================================================================
// 2D渲染相关枚举和接口
// ============================================================================
/**
 * 混合模式枚举
 * 定义2D渲染时的颜色混合方式
 */
export var BlendMode;
(function (BlendMode) {
    /** 正常混合模式 - 标准的alpha混合 */
    BlendMode[BlendMode["NORMAL"] = 0] = "NORMAL";
    /** 相加混合模式 - 颜色值相加，产生更亮的效果 */
    BlendMode[BlendMode["ADD"] = 1] = "ADD";
    /** 相减混合模式 - 颜色值相减，产生更暗的效果 */
    BlendMode[BlendMode["SUBTRACT"] = 2] = "SUBTRACT";
    /** 相乘混合模式 - 颜色值相乘，产生更暗的效果 */
    BlendMode[BlendMode["MULTIPLY"] = 3] = "MULTIPLY";
    /** 预乘Alpha混合模式 - 用于优化的alpha混合 */
    BlendMode[BlendMode["PREMULT_ALPHA"] = 4] = "PREMULT_ALPHA";
})(BlendMode || (BlendMode = {}));
/**
 * 纹理过滤模式枚举
 * 定义纹理采样时的过滤方式
 */
export var TextureFilter;
(function (TextureFilter) {
    /** 最近邻过滤 - 像素化效果，适合像素艺术 */
    TextureFilter[TextureFilter["NEAREST"] = 0] = "NEAREST";
    /** 线性过滤 - 平滑效果，适合高分辨率图像 */
    TextureFilter[TextureFilter["LINEAR"] = 1] = "LINEAR";
})(TextureFilter || (TextureFilter = {}));
/**
 * 纹理重复模式枚举
 * 定义纹理超出边界时的处理方式
 */
export var TextureRepeat;
(function (TextureRepeat) {
    /** 禁用重复 - 超出部分透明 */
    TextureRepeat[TextureRepeat["DISABLED"] = 0] = "DISABLED";
    /** 启用重复 - 平铺纹理 */
    TextureRepeat[TextureRepeat["ENABLED"] = 1] = "ENABLED";
    /** 镜像重复 - 镜像平铺纹理 */
    TextureRepeat[TextureRepeat["MIRROR"] = 2] = "MIRROR";
})(TextureRepeat || (TextureRepeat = {}));
// ============================================================================
// CanvasItem 基类实现
// ============================================================================
/**
 * CanvasItem 类 - 所有2D渲染节点的基类
 *
 * 主要功能:
 * 1. 管理2D渲染状态（可见性、透明度、层级等）
 * 2. 提供2D变换和坐标转换功能
 * 3. 处理2D渲染命令的生成和排序
 * 4. 支持自定义绘制和材质系统
 * 5. 管理渲染优化（剔除、批处理等）
 */
export class CanvasItem extends Node {
    // ========================================================================
    // 构造函数和初始化
    // ========================================================================
    /**
     * 构造函数
     * @param name 节点名称，默认为'CanvasItem'
     */
    constructor(name = 'CanvasItem') {
        super(name);
        // ========================================================================
        // 私有属性 - 渲染状态管理
        // ========================================================================
        /** 是否可见 - 控制节点及其子节点的渲染 */
        this._visible = true;
        /** 调制颜色 - 影响节点及其子节点的颜色 */
        this._modulate = { r: 1, g: 1, b: 1, a: 1 };
        /** 自身调制颜色 - 仅影响当前节点的颜色 */
        this._selfModulate = { r: 1, g: 1, b: 1, a: 1 };
        /** Z索引 - 控制渲染顺序，数值越大越靠前 */
        this._zIndex = 0;
        /** Z索引是否相对于父节点 */
        this._zAsRelative = true;
        /** 是否显示在顶层 - 忽略父节点的Z索引 */
        this._showOnTop = false;
        /** 是否显示在所有顶层之后 */
        this._showBehindParent = false;
        /** 2D材质 - 控制渲染效果 */
        this._material = null;
        /** 是否使用父节点的材质 */
        this._useParentMaterial = false;
        /** 光照遮罩 - 控制哪些光源影响此节点 */
        this._lightMask = 1;
        /** 渲染命令列表 - 存储待执行的渲染操作 */
        this._renderCommands = [];
        /** 是否需要重新排序渲染命令 */
        this._needsSortRenderCommands = false;
        /** 全局变换矩阵缓存 */
        this._globalTransformCache = null;
        /** 全局变换是否需要更新 */
        this._globalTransformDirty = true;
        // 初始化CanvasItem特有的信号
        this.initializeCanvasItemSignals();
        // 初始化CanvasItem特有的属性
        this.initializeCanvasItemProperties();
        // 监听变换变化，标记全局变换为脏
        this.connect('transform_changed', () => {
            this._globalTransformDirty = true;
            this.markRenderCommandsDirty();
        });
    }
    /**
     * 初始化CanvasItem特有的信号
     * 这些信号用于通知渲染状态的变化
     */
    initializeCanvasItemSignals() {
        // 可见性变化信号
        this.addSignal('visibility_changed');
        // 绘制信号 - 用于自定义绘制
        this.addSignal('draw');
        // 材质变化信号
        this.addSignal('material_changed');
        // 渲染顺序变化信号
        this.addSignal('z_index_changed');
        // 调制颜色变化信号
        this.addSignal('modulate_changed');
    }
    /**
     * 初始化CanvasItem特有的属性
     * 这些属性可以在编辑器中修改
     */
    initializeCanvasItemProperties() {
        const properties = [
            {
                name: 'visible',
                type: 'bool',
                hint: '控制节点是否可见'
            },
            {
                name: 'modulate',
                type: 'color',
                hint: '调制颜色，影响节点及其子节点'
            },
            {
                name: 'self_modulate',
                type: 'color',
                hint: '自身调制颜色，仅影响当前节点'
            },
            {
                name: 'z_index',
                type: 'int',
                hint: 'Z索引，控制渲染顺序'
            },
            {
                name: 'z_as_relative',
                type: 'bool',
                hint: 'Z索引是否相对于父节点'
            },
            {
                name: 'show_on_top',
                type: 'bool',
                hint: '是否显示在顶层'
            },
            {
                name: 'show_behind_parent',
                type: 'bool',
                hint: '是否显示在父节点后面'
            },
            {
                name: 'light_mask',
                type: 'int',
                hint: '光照遮罩，控制光源影响'
            },
            {
                name: 'material',
                type: 'resource',
                hint: '2D材质资源',
                className: 'Material2D'
            },
            {
                name: 'use_parent_material',
                type: 'bool',
                hint: '是否使用父节点的材质'
            }
        ];
        // 注册属性到属性系统
        properties.forEach(prop => this.addProperty(prop));
    }
    // ========================================================================
    // 公共属性访问器 - 渲染状态管理
    // ========================================================================
    /**
     * 获取可见性状态
     * @returns 是否可见
     */
    get visible() {
        return this._visible;
    }
    /**
     * 设置可见性状态
     * @param value 是否可见
     */
    set visible(value) {
        if (this._visible !== value) {
            this._visible = value;
            this.emit('visibility_changed', value);
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取调制颜色
     * @returns 调制颜色对象
     */
    get modulate() {
        return Object.assign({}, this._modulate);
    }
    /**
     * 设置调制颜色
     * @param value 调制颜色对象
     */
    set modulate(value) {
        this._modulate = Object.assign({}, value);
        this.emit('modulate_changed', this._modulate);
        this.markRenderCommandsDirty();
    }
    /**
     * 获取自身调制颜色
     * @returns 自身调制颜色对象
     */
    get selfModulate() {
        return Object.assign({}, this._selfModulate);
    }
    /**
     * 设置自身调制颜色
     * @param value 自身调制颜色对象
     */
    set selfModulate(value) {
        this._selfModulate = Object.assign({}, value);
        this.emit('modulate_changed', this._selfModulate);
        this.markRenderCommandsDirty();
    }
    /**
     * 获取Z索引
     * @returns Z索引值
     */
    get zIndex() {
        return this._zIndex;
    }
    /**
     * 设置Z索引
     * @param value Z索引值
     */
    set zIndex(value) {
        if (this._zIndex !== value) {
            this._zIndex = value;
            this.emit('z_index_changed', value);
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取Z索引是否相对于父节点
     * @returns 是否相对
     */
    get zAsRelative() {
        return this._zAsRelative;
    }
    /**
     * 设置Z索引是否相对于父节点
     * @param value 是否相对
     */
    set zAsRelative(value) {
        if (this._zAsRelative !== value) {
            this._zAsRelative = value;
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取是否显示在顶层
     * @returns 是否显示在顶层
     */
    get showOnTop() {
        return this._showOnTop;
    }
    /**
     * 设置是否显示在顶层
     * @param value 是否显示在顶层
     */
    set showOnTop(value) {
        if (this._showOnTop !== value) {
            this._showOnTop = value;
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取是否显示在父节点后面
     * @returns 是否显示在父节点后面
     */
    get showBehindParent() {
        return this._showBehindParent;
    }
    /**
     * 设置是否显示在父节点后面
     * @param value 是否显示在父节点后面
     */
    set showBehindParent(value) {
        if (this._showBehindParent !== value) {
            this._showBehindParent = value;
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取光照遮罩
     * @returns 光照遮罩值
     */
    get lightMask() {
        return this._lightMask;
    }
    /**
     * 设置光照遮罩
     * @param value 光照遮罩值
     */
    set lightMask(value) {
        this._lightMask = value;
    }
    /**
     * 获取2D材质
     * @returns 2D材质对象或null
     */
    get material() {
        return this._material;
    }
    /**
     * 设置2D材质
     * @param value 2D材质对象或null
     */
    set material(value) {
        if (this._material !== value) {
            this._material = value;
            this.emit('material_changed', value);
            this.markRenderCommandsDirty();
        }
    }
    /**
     * 获取是否使用父节点材质
     * @returns 是否使用父节点材质
     */
    get useParentMaterial() {
        return this._useParentMaterial;
    }
    /**
     * 设置是否使用父节点材质
     * @param value 是否使用父节点材质
     */
    set useParentMaterial(value) {
        if (this._useParentMaterial !== value) {
            this._useParentMaterial = value;
            this.markRenderCommandsDirty();
        }
    }
    // ========================================================================
    // 核心功能方法 - 渲染管理
    // ========================================================================
    /**
     * 标记渲染命令需要重新排序
     * 当渲染状态发生变化时调用此方法
     */
    markRenderCommandsDirty() {
        this._needsSortRenderCommands = true;
        // 通知父节点也需要重新排序
        const parent = this.parent;
        if (parent && parent instanceof CanvasItem) {
            parent.markRenderCommandsDirty();
        }
    }
    /**
     * 获取全局变换矩阵
     * 计算从根节点到当前节点的累积变换
     * @returns 全局变换矩阵
     */
    getGlobalTransform() {
        // 如果缓存有效，直接返回
        if (!this._globalTransformDirty && this._globalTransformCache) {
            return this._globalTransformCache;
        }
        // 计算全局变换
        let globalTransform = { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } };
        // 从当前节点向上遍历到根节点，累积变换
        let currentNode = this;
        const transformStack = [];
        while (currentNode && currentNode instanceof CanvasItem) {
            // 如果节点有getTransform方法（如Node2D），获取其变换
            if ('getTransform' in currentNode && typeof currentNode.getTransform === 'function') {
                transformStack.push(currentNode.getTransform());
            }
            const parent = currentNode.parent;
            currentNode = parent instanceof CanvasItem ? parent : null;
        }
        // 从根节点开始应用变换
        for (let i = transformStack.length - 1; i >= 0; i--) {
            globalTransform = this.multiplyTransforms(globalTransform, transformStack[i]);
        }
        // 缓存结果
        this._globalTransformCache = globalTransform;
        this._globalTransformDirty = false;
        return globalTransform;
    }
    /**
     * 变换矩阵乘法
     * @param a 第一个变换矩阵
     * @param b 第二个变换矩阵
     * @returns 乘法结果
     */
    multiplyTransforms(a, b) {
        const cos = Math.cos(a.rotation);
        const sin = Math.sin(a.rotation);
        return {
            position: {
                x: a.position.x + (b.position.x * cos - b.position.y * sin) * a.scale.x,
                y: a.position.y + (b.position.x * sin + b.position.y * cos) * a.scale.y
            },
            rotation: a.rotation + b.rotation,
            scale: {
                x: a.scale.x * b.scale.x,
                y: a.scale.y * b.scale.y
            }
        };
    }
    /**
     * 检查节点是否在屏幕可见区域内
     * 用于渲染剔除优化
     * @param viewportRect 视口矩形区域
     * @returns 是否可见
     */
    isVisibleInViewport(viewportRect) {
        // 如果节点不可见，直接返回false
        if (!this._visible) {
            return false;
        }
        // 获取节点的边界矩形（子类需要重写此方法）
        const bounds = this.getBounds();
        if (!bounds) {
            return true; // 如果无法获取边界，假设可见
        }
        // 将边界变换到全局坐标系
        const globalTransform = this.getGlobalTransform();
        const globalBounds = this.transformRect(bounds, globalTransform);
        // 检查是否与视口相交
        return this.rectsIntersect(globalBounds, viewportRect);
    }
    /**
     * 获取节点的边界矩形
     * 子类应该重写此方法以提供准确的边界信息
     * @returns 边界矩形或null
     */
    getBounds() {
        // 基类返回null，子类需要重写
        return null;
    }
    /**
     * 将矩形应用变换
     * @param rect 原始矩形
     * @param transform 变换矩阵
     * @returns 变换后的矩形
     */
    transformRect(rect, transform) {
        // 简化实现：只考虑位置和缩放，忽略旋转
        return {
            position: {
                x: rect.position.x * transform.scale.x + transform.position.x,
                y: rect.position.y * transform.scale.y + transform.position.y
            },
            size: {
                x: rect.size.x * transform.scale.x,
                y: rect.size.y * transform.scale.y
            }
        };
    }
    /**
     * 检查两个矩形是否相交
     * @param rect1 第一个矩形
     * @param rect2 第二个矩形
     * @returns 是否相交
     */
    rectsIntersect(rect1, rect2) {
        return !(rect1.position.x + rect1.size.x < rect2.position.x ||
            rect2.position.x + rect2.size.x < rect1.position.x ||
            rect1.position.y + rect1.size.y < rect2.position.y ||
            rect2.position.y + rect2.size.y < rect1.position.y);
    }
    /**
     * 添加渲染命令
     * @param command 渲染命令
     */
    addRenderCommand(command) {
        this._renderCommands.push(command);
        this._needsSortRenderCommands = true;
    }
    /**
     * 清空渲染命令
     */
    clearRenderCommands() {
        this._renderCommands.length = 0;
        this._needsSortRenderCommands = false;
    }
    /**
     * 获取排序后的渲染命令列表
     * @returns 渲染命令数组
     */
    getRenderCommands() {
        if (this._needsSortRenderCommands) {
            this.sortRenderCommands();
            this._needsSortRenderCommands = false;
        }
        return this._renderCommands;
    }
    /**
     * 对渲染命令进行排序
     * 按照Z索引和添加顺序排序
     */
    sortRenderCommands() {
        this._renderCommands.sort((a, b) => {
            // 首先按Z索引排序
            if (a.zIndex !== b.zIndex) {
                return a.zIndex - b.zIndex;
            }
            // Z索引相同时保持原有顺序（稳定排序）
            return 0;
        });
    }
    // ========================================================================
    // 绘制方法 - 子类可重写
    // ========================================================================
    /**
     * 绘制方法 - 子类重写以实现自定义绘制
     * 此方法在每帧渲染时被调用
     *
     * 使用示例:
     * ```typescript
     * class MyCanvasItem extends CanvasItem {
     *   protected draw(): void {
     *     // 绘制一个红色矩形
     *     this.drawRect(
     *       { position: { x: 0, y: 0 }, size: { x: 100, y: 100 } },
     *       { r: 1, g: 0, b: 0, a: 1 }
     *     )
     *   }
     * }
     * ```
     */
    draw() {
        // 基类不执行任何绘制操作
        // 子类重写此方法以实现具体的绘制逻辑
    }
    /**
     * 绘制矩形
     * @param rect 矩形区域
     * @param color 颜色
     * @param filled 是否填充，默认为true
     */
    drawRect(rect, color, filled = true) {
        var _a;
        const command = {
            type: 'draw_rect',
            zIndex: this._zIndex,
            data: { rect, color, filled },
            transform: this.getGlobalTransform(),
            blendMode: ((_a = this._material) === null || _a === void 0 ? void 0 : _a.blendMode) || BlendMode.NORMAL,
            modulate: this.getEffectiveModulate()
        };
        this.addRenderCommand(command);
    }
    /**
     * 绘制线条
     * @param from 起点
     * @param to 终点
     * @param color 颜色
     * @param width 线宽，默认为1
     */
    drawLine(from, to, color, width = 1) {
        var _a;
        const command = {
            type: 'draw_line',
            zIndex: this._zIndex,
            data: { from, to, color, width },
            transform: this.getGlobalTransform(),
            blendMode: ((_a = this._material) === null || _a === void 0 ? void 0 : _a.blendMode) || BlendMode.NORMAL,
            modulate: this.getEffectiveModulate()
        };
        this.addRenderCommand(command);
    }
    /**
     * 获取有效的调制颜色
     * 结合自身调制和父节点调制
     * @returns 有效的调制颜色
     */
    getEffectiveModulate() {
        let effectiveModulate = Object.assign({}, this._selfModulate);
        // 应用父节点的调制颜色
        const parent = this.parent;
        if (parent && parent instanceof CanvasItem) {
            const parentModulate = parent.getEffectiveModulate();
            effectiveModulate.r *= parentModulate.r;
            effectiveModulate.g *= parentModulate.g;
            effectiveModulate.b *= parentModulate.b;
            effectiveModulate.a *= parentModulate.a;
        }
        // 应用自身的调制颜色
        effectiveModulate.r *= this._modulate.r;
        effectiveModulate.g *= this._modulate.g;
        effectiveModulate.b *= this._modulate.b;
        effectiveModulate.a *= this._modulate.a;
        return effectiveModulate;
    }
    // ========================================================================
    // 生命周期方法重写
    // ========================================================================
    /**
     * 节点进入场景树时调用
     * 重写父类方法以添加CanvasItem特有的初始化逻辑
     */
    _enterTree() {
        super._enterTree();
        // 标记全局变换为脏，需要重新计算
        this._globalTransformDirty = true;
        this.markRenderCommandsDirty();
    }
    /**
     * 节点退出场景树时调用
     * 重写父类方法以添加CanvasItem特有的清理逻辑
     */
    _exitTree() {
        super._exitTree();
        // 清空渲染命令
        this.clearRenderCommands();
        // 清空缓存
        this._globalTransformCache = null;
        this._globalTransformDirty = true;
    }
    /**
     * 每帧更新时调用
     * 重写父类方法以添加渲染逻辑
     * @param delta 时间增量（秒）
     */
    _process(delta) {
        super._process(delta);
        // 如果节点可见，执行绘制
        if (this._visible) {
            // 清空上一帧的渲染命令
            this.clearRenderCommands();
            // 调用绘制方法
            this.draw();
            // 发出绘制信号，允许外部代码添加自定义绘制
            this.emit('draw');
        }
    }
    // ========================================================================
    // 工具方法
    // ========================================================================
    /**
     * 隐藏节点
     * 等同于设置 visible = false
     */
    hide() {
        this.visible = false;
    }
    /**
     * 显示节点
     * 等同于设置 visible = true
     */
    show() {
        this.visible = true;
    }
    /**
     * 检查节点是否在全局可见状态
     * 考虑父节点的可见性
     * @returns 是否全局可见
     */
    isVisibleInTree() {
        if (!this._visible) {
            return false;
        }
        const parent = this.parent;
        if (parent && parent instanceof CanvasItem) {
            return parent.isVisibleInTree();
        }
        return true;
    }
    /**
     * 获取有效的Z索引
     * 考虑相对性和父节点的Z索引
     * @returns 有效的Z索引
     */
    getEffectiveZIndex() {
        let effectiveZIndex = this._zIndex;
        if (this._zAsRelative) {
            const parent = this.parent;
            if (parent && parent instanceof CanvasItem) {
                effectiveZIndex += parent.getEffectiveZIndex();
            }
        }
        return effectiveZIndex;
    }
    /**
     * 强制更新全局变换
     * 清除缓存并重新计算
     */
    updateGlobalTransform() {
        this._globalTransformDirty = true;
        this._globalTransformCache = null;
        // 递归更新子节点
        for (const child of this.children) {
            if (child instanceof CanvasItem) {
                child.updateGlobalTransform();
            }
        }
    }
}
// ============================================================================
// 导出
// ============================================================================
export default CanvasItem;
