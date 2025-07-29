/**
 * QAQ游戏引擎 - 场景系统类型定义
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 定义场景系统相关的枚举和接口
 * - 避免循环导入问题
 * - 提供统一的类型定义
 */

/**
 * 场景切换模式枚举
 */
export enum SceneChangeMode {
  /** 立即切换 */
  IMMEDIATE = 0,
  /** 淡入淡出 */
  FADE = 1,
  /** 推拉效果 */
  SLIDE = 2,
  /** 自定义过渡 */
  CUSTOM = 3
}

/**
 * 场景切换选项接口
 */
export interface SceneChangeOptions {
  /** 切换模式 */
  mode?: SceneChangeMode
  /** 过渡时间（毫秒） */
  duration?: number
  /** 是否保留当前场景 */
  keepCurrent?: boolean
  /** 自定义过渡回调 */
  customTransition?: (from: any, to: any) => Promise<void>
  /** 切换完成回调 */
  onComplete?: () => void
  /** 切换失败回调 */
  onError?: (error: Error) => void
}
