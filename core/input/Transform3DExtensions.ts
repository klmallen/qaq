/**
 * QAQ游戏引擎 - Transform3D扩展方法
 * 
 * 为Transform3D添加类似UE5的朝向向量计算功能
 * 提供简洁的API来获取物体的前方向、右方向、上方向
 * 
 * @author QAQ Engine Team
 * @version 1.0.0
 */

import type { Vector3, Quaternion } from '../../types/core'

/**
 * Transform3D扩展工具类
 * 
 * 提供类似UE5的Transform功能：
 * - GetActorForwardVector()
 * - GetActorRightVector()
 * - GetActorUpVector()
 * - 基于朝向的移动计算
 */
export class Transform3DExtensions {
  
  /**
   * 获取前方向向量（类似UE5的GetActorForwardVector）
   * 
   * @param rotationY Y轴旋转角度（弧度）
   * @returns 前方向向量（世界坐标系）
   */
  static getForwardVector(rotationY: number): Vector3 {
    return {
      x: Math.sin(rotationY),
      y: 0,
      z: Math.cos(rotationY)
    }
  }

  /**
   * 获取右方向向量（类似UE5的GetActorRightVector）
   * 
   * @param rotationY Y轴旋转角度（弧度）
   * @returns 右方向向量（世界坐标系）
   */
  static getRightVector(rotationY: number): Vector3 {
    return {
      x: Math.cos(rotationY),
      y: 0,
      z: -Math.sin(rotationY)
    }
  }

  /**
   * 获取上方向向量（类似UE5的GetActorUpVector）
   * 
   * @param rotationX X轴旋转角度（弧度，可选）
   * @param rotationZ Z轴旋转角度（弧度，可选）
   * @returns 上方向向量（世界坐标系）
   */
  static getUpVector(rotationX: number = 0, rotationZ: number = 0): Vector3 {
    // 简化版本，大多数情况下上方向就是Y轴正方向
    if (rotationX === 0 && rotationZ === 0) {
      return { x: 0, y: 1, z: 0 }
    }

    // 复杂旋转的情况（TODO: 完整实现）
    return { x: 0, y: 1, z: 0 }
  }

  /**
   * 基于四元数获取前方向向量
   * 
   * @param quaternion 四元数旋转
   * @returns 前方向向量
   */
  static getForwardVectorFromQuaternion(quaternion: Quaternion): Vector3 {
    const { x, y, z, w } = quaternion
    
    return {
      x: 2 * (x * z + w * y),
      y: 2 * (y * z - w * x),
      z: 1 - 2 * (x * x + y * y)
    }
  }

  /**
   * 基于四元数获取右方向向量
   * 
   * @param quaternion 四元数旋转
   * @returns 右方向向量
   */
  static getRightVectorFromQuaternion(quaternion: Quaternion): Vector3 {
    const { x, y, z, w } = quaternion
    
    return {
      x: 1 - 2 * (y * y + z * z),
      y: 2 * (x * y + w * z),
      z: 2 * (x * z - w * y)
    }
  }

  /**
   * 基于四元数获取上方向向量
   * 
   * @param quaternion 四元数旋转
   * @returns 上方向向量
   */
  static getUpVectorFromQuaternion(quaternion: Quaternion): Vector3 {
    const { x, y, z, w } = quaternion
    
    return {
      x: 2 * (x * y - w * z),
      y: 1 - 2 * (x * x + z * z),
      z: 2 * (y * z + w * x)
    }
  }

  /**
   * 计算基于朝向的移动向量（类似UE5的AddMovementInput）
   * 
   * @param rotationY Y轴旋转角度
   * @param inputVector 输入向量 {x: 左右, y: 前后}
   * @returns 世界坐标系下的移动向量
   */
  static calculateMovementVector(rotationY: number, inputVector: { x: number, y: number }): Vector3 {
    const forward = this.getForwardVector(rotationY)
    const right = this.getRightVector(rotationY)
    
    return {
      x: forward.x * inputVector.y + right.x * inputVector.x,
      y: 0, // 通常移动不影响Y轴
      z: forward.z * inputVector.y + right.z * inputVector.x
    }
  }

  /**
   * 计算朝向目标的旋转角度
   * 
   * @param fromPosition 起始位置
   * @param toPosition 目标位置
   * @returns Y轴旋转角度（弧度）
   */
  static calculateLookAtRotationY(fromPosition: Vector3, toPosition: Vector3): number {
    const direction = {
      x: toPosition.x - fromPosition.x,
      z: toPosition.z - fromPosition.z
    }
    
    return Math.atan2(direction.x, direction.z)
  }

  /**
   * 向量归一化
   * 
   * @param vector 输入向量
   * @returns 归一化后的向量
   */
  static normalize(vector: Vector3): Vector3 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
    
    if (length === 0) {
      return { x: 0, y: 0, z: 0 }
    }
    
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length
    }
  }

  /**
   * 向量长度
   * 
   * @param vector 输入向量
   * @returns 向量长度
   */
  static length(vector: Vector3): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
  }

  /**
   * 向量点积
   * 
   * @param a 向量A
   * @param b 向量B
   * @returns 点积结果
   */
  static dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  /**
   * 向量叉积
   * 
   * @param a 向量A
   * @param b 向量B
   * @returns 叉积结果
   */
  static cross(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    }
  }

  /**
   * 向量线性插值
   * 
   * @param a 起始向量
   * @param b 目标向量
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
  static lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    t = Math.max(0, Math.min(1, t)) // 限制在0-1范围内
    
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    }
  }

  /**
   * 角度线性插值
   * 
   * @param fromAngle 起始角度（弧度）
   * @param toAngle 目标角度（弧度）
   * @param t 插值参数 (0-1)
   * @returns 插值后的角度（弧度）
   */
  static lerpAngle(fromAngle: number, toAngle: number, t: number): number {
    // 处理角度环绕
    let delta = toAngle - fromAngle
    
    if (delta > Math.PI) {
      delta -= 2 * Math.PI
    } else if (delta < -Math.PI) {
      delta += 2 * Math.PI
    }
    
    return fromAngle + delta * t
  }

  /**
   * 将角度限制在 -π 到 π 范围内
   * 
   * @param angle 输入角度（弧度）
   * @returns 标准化后的角度
   */
  static normalizeAngle(angle: number): number {
    while (angle > Math.PI) {
      angle -= 2 * Math.PI
    }
    while (angle < -Math.PI) {
      angle += 2 * Math.PI
    }
    return angle
  }

  /**
   * 弧度转角度
   * 
   * @param radians 弧度值
   * @returns 角度值
   */
  static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }

  /**
   * 角度转弧度
   * 
   * @param degrees 角度值
   * @returns 弧度值
   */
  static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

/**
 * 便捷的全局函数（可选使用）
 */

/**
 * 获取前方向向量的便捷函数
 */
export function getForwardVector(rotationY: number): Vector3 {
  return Transform3DExtensions.getForwardVector(rotationY)
}

/**
 * 获取右方向向量的便捷函数
 */
export function getRightVector(rotationY: number): Vector3 {
  return Transform3DExtensions.getRightVector(rotationY)
}

/**
 * 获取上方向向量的便捷函数
 */
export function getUpVector(): Vector3 {
  return Transform3DExtensions.getUpVector()
}

/**
 * 计算移动向量的便捷函数
 */
export function calculateMovementVector(rotationY: number, inputVector: { x: number, y: number }): Vector3 {
  return Transform3DExtensions.calculateMovementVector(rotationY, inputVector)
}
