/**
 * QAQ 游戏引擎核心类型定义
 * 定义引擎中使用的基础数据类型和接口
 */
export var PropertyUsage;
(function (PropertyUsage) {
    PropertyUsage[PropertyUsage["NONE"] = 0] = "NONE";
    PropertyUsage[PropertyUsage["STORAGE"] = 1] = "STORAGE";
    PropertyUsage[PropertyUsage["EDITOR"] = 2] = "EDITOR";
    PropertyUsage[PropertyUsage["NETWORK"] = 4] = "NETWORK";
    PropertyUsage[PropertyUsage["EDITOR_HELPER"] = 8] = "EDITOR_HELPER";
    PropertyUsage[PropertyUsage["CHECKABLE"] = 16] = "CHECKABLE";
    PropertyUsage[PropertyUsage["CHECKED"] = 32] = "CHECKED";
    PropertyUsage[PropertyUsage["INTERNATIONALIZED"] = 64] = "INTERNATIONALIZED";
    PropertyUsage[PropertyUsage["GROUP"] = 128] = "GROUP";
    PropertyUsage[PropertyUsage["CATEGORY"] = 256] = "CATEGORY";
    PropertyUsage[PropertyUsage["STORE_IF_NONZERO"] = 512] = "STORE_IF_NONZERO";
    PropertyUsage[PropertyUsage["STORE_IF_NONONE"] = 1024] = "STORE_IF_NONONE";
    PropertyUsage[PropertyUsage["NO_INSTANCE_STATE"] = 2048] = "NO_INSTANCE_STATE";
    PropertyUsage[PropertyUsage["RESTART_IF_CHANGED"] = 4096] = "RESTART_IF_CHANGED";
    PropertyUsage[PropertyUsage["SCRIPT_VARIABLE"] = 8192] = "SCRIPT_VARIABLE";
    PropertyUsage[PropertyUsage["STORE_IF_NULL"] = 16384] = "STORE_IF_NULL";
    PropertyUsage[PropertyUsage["ANIMATE_AS_TRIGGER"] = 32768] = "ANIMATE_AS_TRIGGER";
    PropertyUsage[PropertyUsage["UPDATE_ALL_IF_MODIFIED"] = 65536] = "UPDATE_ALL_IF_MODIFIED";
    PropertyUsage[PropertyUsage["SCRIPT_DEFAULT_VALUE"] = 131072] = "SCRIPT_DEFAULT_VALUE";
    PropertyUsage[PropertyUsage["CLASS_IS_ENUM"] = 262144] = "CLASS_IS_ENUM";
    PropertyUsage[PropertyUsage["NIL_IS_VARIANT"] = 524288] = "NIL_IS_VARIANT";
    PropertyUsage[PropertyUsage["INTERNAL"] = 1048576] = "INTERNAL";
    PropertyUsage[PropertyUsage["DO_NOT_SHARE_ON_DUPLICATE"] = 2097152] = "DO_NOT_SHARE_ON_DUPLICATE";
    PropertyUsage[PropertyUsage["HIGH_END_GFX"] = 4194304] = "HIGH_END_GFX";
    PropertyUsage[PropertyUsage["NODE_PATH_FROM_SCENE_FILE"] = 8388608] = "NODE_PATH_FROM_SCENE_FILE";
    PropertyUsage[PropertyUsage["RESOURCE_NOT_PERSISTENT"] = 16777216] = "RESOURCE_NOT_PERSISTENT";
    PropertyUsage[PropertyUsage["KEYING_INCREMENTS"] = 33554432] = "KEYING_INCREMENTS";
    PropertyUsage[PropertyUsage["DEFERRED_SET_RESOURCE"] = 67108864] = "DEFERRED_SET_RESOURCE";
    PropertyUsage[PropertyUsage["EDITOR_INSTANTIATE_OBJECT"] = 134217728] = "EDITOR_INSTANTIATE_OBJECT";
    PropertyUsage[PropertyUsage["EDITOR_BASIC_SETTING"] = 268435456] = "EDITOR_BASIC_SETTING";
    PropertyUsage[PropertyUsage["READ_ONLY"] = 536870912] = "READ_ONLY";
    PropertyUsage[PropertyUsage["ARRAY"] = 1073741824] = "ARRAY";
})(PropertyUsage || (PropertyUsage = {}));
export var ProcessMode;
(function (ProcessMode) {
    ProcessMode[ProcessMode["INHERIT"] = 0] = "INHERIT";
    ProcessMode[ProcessMode["PAUSABLE"] = 1] = "PAUSABLE";
    ProcessMode[ProcessMode["WHEN_PAUSED"] = 2] = "WHEN_PAUSED";
    ProcessMode[ProcessMode["ALWAYS"] = 3] = "ALWAYS";
    ProcessMode[ProcessMode["DISABLED"] = 4] = "DISABLED";
})(ProcessMode || (ProcessMode = {}));
// ============================================================================
// 常量
// ============================================================================
export const QAQ_VERSION = '1.0.0';
export const QAQ_ENGINE_NAME = 'QAQ Game Engine';
