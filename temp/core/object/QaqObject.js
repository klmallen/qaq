/**
 * QAQ 游戏引擎基础对象类
 * 提供信号系统、属性系统和对象管理功能
 * 类似于 Godot 的 Object 类
 */
import { v4 as uuidv4 } from 'uuid';
import { PropertyUsage } from '../../types/core';
// ============================================================================
// 信号类实现
// ============================================================================
export class QaqSignal {
    constructor(name) {
        this.callbacks = [];
        this.name = name;
    }
    connect(callback) {
        if (!this.callbacks.includes(callback)) {
            this.callbacks.push(callback);
        }
    }
    disconnect(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
    }
    emit(...args) {
        for (const callback of this.callbacks) {
            try {
                callback(...args);
            }
            catch (error) {
                console.error(`Error in signal callback for "${this.name}":`, error);
            }
        }
    }
    clear() {
        this.callbacks = [];
    }
    getConnectionCount() {
        return this.callbacks.length;
    }
}
// ============================================================================
// 属性类实现
// ============================================================================
export class QaqProperty {
    constructor(info, defaultValue = null) {
        this.info = info;
        this._defaultValue = defaultValue;
        this._value = defaultValue;
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (this.validateValue(newValue)) {
            this._value = newValue;
        }
        else {
            console.warn(`Invalid value for property "${this.info.name}": ${newValue}`);
        }
    }
    get defaultValue() {
        return this._defaultValue;
    }
    reset() {
        this._value = this._defaultValue;
    }
    validateValue(value) {
        // 基础类型验证
        switch (this.info.type) {
            case 'bool':
                return typeof value === 'boolean';
            case 'int':
                return typeof value === 'number' && Number.isInteger(value);
            case 'float':
                return typeof value === 'number';
            case 'string':
                return typeof value === 'string';
            case 'vector2':
                return value && typeof value.x === 'number' && typeof value.y === 'number';
            case 'vector3':
                return value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number';
            case 'array':
                return Array.isArray(value);
            default:
                return true; // 其他类型暂时不验证
        }
    }
}
// ============================================================================
// QAQ 基础对象类
// ============================================================================
export class QaqObject {
    constructor(className = 'QaqObject') {
        this._signals = new Map();
        this._properties = new Map();
        this._metadata = new Map();
        this._instanceId = uuidv4();
        this._className = className;
        this.initializeSignals();
        this.initializeProperties();
    }
    // ========================================================================
    // 基础对象方法
    // ========================================================================
    getInstanceId() {
        return this._instanceId;
    }
    getClassName() {
        return this._className;
    }
    toString() {
        return `[${this._className}:${this._instanceId.substring(0, 8)}]`;
    }
    // ========================================================================
    // 信号系统方法
    // ========================================================================
    addSignal(signalName) {
        if (!this._signals.has(signalName)) {
            this._signals.set(signalName, new QaqSignal(signalName));
        }
    }
    hasSignal(signalName) {
        return this._signals.has(signalName);
    }
    connect(signalName, callback) {
        const signal = this._signals.get(signalName);
        if (signal) {
            signal.connect(callback);
            return true;
        }
        console.warn(`Signal "${signalName}" not found in ${this.toString()}`);
        return false;
    }
    disconnect(signalName, callback) {
        const signal = this._signals.get(signalName);
        if (signal) {
            signal.disconnect(callback);
            return true;
        }
        return false;
    }
    emit(signalName, ...args) {
        const signal = this._signals.get(signalName);
        if (signal) {
            signal.emit(...args);
        }
        else {
            console.warn(`Signal "${signalName}" not found in ${this.toString()}`);
        }
    }
    getSignalList() {
        return Array.from(this._signals.keys());
    }
    getSignalConnectionCount(signalName) {
        const signal = this._signals.get(signalName);
        return signal ? signal.getConnectionCount() : 0;
    }
    // ========================================================================
    // 属性系统方法
    // ========================================================================
    addProperty(info, defaultValue = null) {
        this._properties.set(info.name, new QaqProperty(info, defaultValue));
    }
    hasProperty(propertyName) {
        return this._properties.has(propertyName);
    }
    setProperty(propertyName, value) {
        const property = this._properties.get(propertyName);
        if (property) {
            const oldValue = property.value;
            property.value = value;
            // 发射属性变化信号
            this.emit('property_changed', propertyName, oldValue, value);
            return true;
        }
        console.warn(`Property "${propertyName}" not found in ${this.toString()}`);
        return false;
    }
    getProperty(propertyName) {
        const property = this._properties.get(propertyName);
        return property ? property.value : null;
    }
    getPropertyInfo(propertyName) {
        const property = this._properties.get(propertyName);
        return property ? property.info : null;
    }
    getPropertyList() {
        return Array.from(this._properties.values()).map(prop => prop.info);
    }
    resetProperty(propertyName) {
        const property = this._properties.get(propertyName);
        if (property) {
            property.reset();
            this.emit('property_changed', propertyName, property.value, property.defaultValue);
            return true;
        }
        return false;
    }
    // ========================================================================
    // 元数据系统方法
    // ========================================================================
    setMeta(name, value) {
        this._metadata.set(name, value);
    }
    getMeta(name, defaultValue = null) {
        var _a;
        return (_a = this._metadata.get(name)) !== null && _a !== void 0 ? _a : defaultValue;
    }
    hasMeta(name) {
        return this._metadata.has(name);
    }
    removeMeta(name) {
        return this._metadata.delete(name);
    }
    getMetaList() {
        return Array.from(this._metadata.keys());
    }
    // ========================================================================
    // 生命周期方法（子类可重写）
    // ========================================================================
    initializeSignals() {
        // 添加基础信号
        this.addSignal('property_changed');
        this.addSignal('destroyed');
    }
    initializeProperties() {
        // 子类可重写此方法来添加属性
    }
    // ========================================================================
    // 销毁方法
    // ========================================================================
    destroy() {
        // 发射销毁信号
        this.emit('destroyed');
        // 清理所有信号连接
        for (const signal of this._signals.values()) {
            signal.clear();
        }
        this._signals.clear();
        // 清理属性
        this._properties.clear();
        // 清理元数据
        this._metadata.clear();
    }
    // ========================================================================
    // 序列化支持
    // ========================================================================
    serialize() {
        const data = {
            className: this._className,
            properties: {}
        };
        // 序列化属性
        for (const [name, property] of this._properties) {
            if (property.info.usage !== undefined &&
                (property.info.usage & PropertyUsage.STORAGE) !== 0) {
                data.properties[name] = property.value;
            }
        }
        return data;
    }
    deserialize(data) {
        if (data.properties) {
            for (const [name, value] of Object.entries(data.properties)) {
                this.setProperty(name, value);
            }
        }
    }
}
export default QaqObject;
