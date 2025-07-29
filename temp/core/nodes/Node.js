/**
 * QAQ 游戏引擎节点基类
 * 提供节点树结构、生命周期管理和基础功能
 * 类似于 Godot 的 Node 类
 */
import QaqObject from '../object/QaqObject';
import { ProcessMode } from '../../types/core';
// ============================================================================
// 节点路径解析器
// ============================================================================
export class QaqNodePath {
    constructor(path) {
        this.path = path;
        this.subname = '';
        this.absolute = path.startsWith('/');
        // 解析子名称（如果有的话）
        const colonIndex = path.indexOf(':');
        if (colonIndex !== -1) {
            this.subname = path.substring(colonIndex + 1);
            this.path = path.substring(0, colonIndex);
        }
    }
    toString() {
        return this.subname ? `${this.path}:${this.subname}` : this.path;
    }
    isEmpty() {
        return this.path === '' || this.path === '.';
    }
    getNames() {
        if (this.isEmpty())
            return [];
        const cleanPath = this.absolute ? this.path.substring(1) : this.path;
        return cleanPath.split('/').filter(name => name !== '');
    }
}
// ============================================================================
// Node 基类
// ============================================================================
export class Node extends QaqObject {
    constructor(name = 'Node') {
        super('Node');
        this._name = 'Node';
        this._parent = null;
        this._children = [];
        this._owner = null;
        this._processMode = ProcessMode.INHERIT;
        this._processPriority = 0;
        this._isInsideTree = false;
        this._isReady = false;
        this._canProcess = true;
        this._name = name;
        this.initializeNodeSignals();
        this.initializeNodeProperties();
    }
    // ========================================================================
    // 节点基础属性
    // ========================================================================
    get id() {
        return this.getInstanceId();
    }
    get name() {
        return this._name;
    }
    set name(value) {
        if (value !== this._name) {
            const oldName = this._name;
            this._name = value;
            this.emit('renamed', oldName, value);
        }
    }
    get parent() {
        return this._parent;
    }
    get children() {
        return this._children;
    }
    get owner() {
        return this._owner;
    }
    set owner(value) {
        this._owner = value;
    }
    get processMode() {
        return this._processMode;
    }
    set processMode(value) {
        this._processMode = value;
    }
    get processPriority() {
        return this._processPriority;
    }
    set processPriority(value) {
        this._processPriority = value;
    }
    get isInsideTree() {
        return this._isInsideTree;
    }
    get isReady() {
        return this._isReady;
    }
    // ========================================================================
    // 节点树操作
    // ========================================================================
    addChild(child, forceReadableName = false) {
        if (child._parent) {
            throw new Error(`Node "${child.name}" already has a parent`);
        }
        // 确保名称唯一
        if (forceReadableName) {
            child.name = this.getUniqueChildName(child.name);
        }
        child._parent = this;
        this._children.push(child);
        // 设置所有者
        if (!child._owner) {
            child._owner = this._owner || this;
        }
        // 如果父节点在树中，将子节点也加入树
        if (this._isInsideTree) {
            child._enterTree();
        }
        this.emit('child_added', child);
        child.emit('parent_changed', this);
    }
    removeChild(child) {
        const index = this._children.indexOf(child);
        if (index === -1) {
            throw new Error(`Node "${child.name}" is not a child of "${this.name}"`);
        }
        // 如果子节点在树中，先移出树
        if (child._isInsideTree) {
            child._exitTree();
        }
        child._parent = null;
        this._children.splice(index, 1);
        this.emit('child_removed', child);
        child.emit('parent_changed', null);
    }
    getChild(index) {
        return this._children[index] || null;
    }
    getChildCount() {
        return this._children.length;
    }
    getChildIndex(child) {
        return this._children.indexOf(child);
    }
    hasChild(child) {
        return this._children.includes(child);
    }
    moveChild(child, toIndex) {
        const fromIndex = this.getChildIndex(child);
        if (fromIndex === -1) {
            throw new Error(`Node "${child.name}" is not a child of "${this.name}"`);
        }
        if (toIndex < 0 || toIndex >= this._children.length) {
            throw new Error(`Invalid child index: ${toIndex}`);
        }
        // 移动子节点
        this._children.splice(fromIndex, 1);
        this._children.splice(toIndex, 0, child);
        this.emit('child_order_changed');
    }
    // ========================================================================
    // 节点查找
    // ========================================================================
    getNode(path) {
        const nodePath = new QaqNodePath(path);
        return this._getNodeByPath(nodePath);
    }
    hasNode(path) {
        return this.getNode(path) !== null;
    }
    findChild(name, recursive = true, owned = true) {
        // 在直接子节点中查找
        for (const child of this._children) {
            if (child.name === name && (!owned || child._owner === this._owner)) {
                return child;
            }
        }
        // 递归查找
        if (recursive) {
            for (const child of this._children) {
                const found = child.findChild(name, true, owned);
                if (found)
                    return found;
            }
        }
        return null;
    }
    findChildren(pattern, type, recursive = true, owned = true) {
        const results = [];
        this._findChildrenRecursive(pattern, type, recursive, owned, results);
        return results;
    }
    getPath() {
        if (!this._parent)
            return this.name;
        const parentPath = this._parent.getPath();
        return parentPath === '' ? this.name : `${parentPath}/${this.name}`;
    }
    getPathTo(node) {
        // 简化实现，实际应该计算相对路径
        return node.getPath();
    }
    // ========================================================================
    // 生命周期方法
    // ========================================================================
    _enterTree() {
        this._isInsideTree = true;
        this.emit('tree_entered');
        // 递归处理子节点
        for (const child of this._children) {
            child._enterTree();
        }
        // 如果还没有准备好，调用 _ready
        if (!this._isReady) {
            this._ready();
            this._isReady = true;
        }
    }
    _exitTree() {
        this._isInsideTree = false;
        this.emit('tree_exiting');
        // 递归处理子节点
        for (const child of this._children) {
            child._exitTree();
        }
        this.emit('tree_exited');
    }
    _ready() {
        // 子类可重写此方法
        this.emit('ready');
    }
    _process(delta) {
        // 子类可重写此方法
        if (this._canProcess) {
            // 递归处理子节点
            for (const child of this._children) {
                if (child._shouldProcess()) {
                    child._process(delta);
                }
            }
        }
    }
    _physicsProcess(delta) {
        // 子类可重写此方法
        if (this._canProcess) {
            // 递归处理子节点
            for (const child of this._children) {
                if (child._shouldProcess()) {
                    child._physicsProcess(delta);
                }
            }
        }
    }
    // ========================================================================
    // 辅助方法
    // ========================================================================
    getUniqueChildName(baseName) {
        let name = baseName;
        let counter = 1;
        while (this._children.some(child => child.name === name)) {
            name = `${baseName}${counter}`;
            counter++;
        }
        return name;
    }
    _getNodeByPath(nodePath) {
        if (nodePath.isEmpty())
            return this;
        const names = nodePath.getNames();
        let current = nodePath.absolute ? this.getRoot() : this;
        for (const name of names) {
            if (name === '..') {
                current = current._parent || current;
            }
            else {
                const child = current._children.find(c => c.name === name);
                if (!child)
                    return null;
                current = child;
            }
        }
        return current;
    }
    getRoot() {
        let root = this;
        while (root._parent) {
            root = root._parent;
        }
        return root;
    }
    _shouldProcess() {
        switch (this._processMode) {
            case ProcessMode.INHERIT:
                return this._parent ? this._parent._shouldProcess() : true;
            case ProcessMode.PAUSABLE:
                return true; // TODO: 实现暂停系统
            case ProcessMode.WHEN_PAUSED:
                return false; // TODO: 实现暂停系统
            case ProcessMode.ALWAYS:
                return true;
            case ProcessMode.DISABLED:
                return false;
            default:
                return true;
        }
    }
    _findChildrenRecursive(pattern, type, recursive, owned, results) {
        for (const child of this._children) {
            // 检查名称匹配
            const nameMatches = pattern === '*' || child.name.includes(pattern);
            // 检查类型匹配
            const typeMatches = !type || child.getClassName() === type;
            // 检查所有者
            const ownerMatches = !owned || child._owner === this._owner;
            if (nameMatches && typeMatches && ownerMatches) {
                results.push(child);
            }
            // 递归搜索
            if (recursive) {
                child._findChildrenRecursive(pattern, type, true, owned, results);
            }
        }
    }
    // ========================================================================
    // 信号和属性初始化
    // ========================================================================
    initializeNodeSignals() {
        this.addSignal('ready');
        this.addSignal('tree_entered');
        this.addSignal('tree_exiting');
        this.addSignal('tree_exited');
        this.addSignal('child_added');
        this.addSignal('child_removed');
        this.addSignal('child_order_changed');
        this.addSignal('parent_changed');
        this.addSignal('renamed');
    }
    initializeNodeProperties() {
        this.addProperty({
            name: 'name',
            type: 'string',
            usage: 1 // STORAGE
        }, this._name);
        this.addProperty({
            name: 'process_mode',
            type: 'enum',
            usage: 1 // STORAGE
        }, this._processMode);
        this.addProperty({
            name: 'process_priority',
            type: 'int',
            usage: 1 // STORAGE
        }, this._processPriority);
    }
    // ========================================================================
    // 节点遍历
    // ========================================================================
    /**
     * 遍历节点树，对每个节点执行回调函数
     * @param callback 对每个节点执行的回调函数
     */
    traverse(callback) {
        callback(this);
        this._children.forEach(child => {
            child.traverse(callback);
        });
    }
    /**
     * 根据ID查找节点
     * @param id 节点ID
     * @returns 找到的节点或null
     */
    findNodeById(id) {
        let foundNode = null;
        this.traverse((node) => {
            if (node.id === id) {
                foundNode = node;
            }
        });
        return foundNode;
    }
    // ========================================================================
    // 销毁方法
    // ========================================================================
    destroy() {
        // 移除所有子节点
        while (this._children.length > 0) {
            const child = this._children[0];
            this.removeChild(child);
            child.destroy();
        }
        // 从父节点移除自己
        if (this._parent) {
            this._parent.removeChild(this);
        }
        super.destroy();
    }
}
export default Node;
