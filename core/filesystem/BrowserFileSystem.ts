/**
 * QAQ 游戏引擎浏览器文件系统适配器
 * 使用 File System Access API 和 IndexedDB 作为后备
 */

import type { FileSystemAdapter } from '../serialization/ASTSerializer'

// ============================================================================
// 浏览器文件系统适配器
// ============================================================================

export class BrowserFileSystemAdapter implements FileSystemAdapter {
  private directoryHandle: FileSystemDirectoryHandle | null = null
  private dbName = 'qaq-game-engine-projects'
  private dbVersion = 1
  
  /**
   * 设置项目目录句柄
   */
  async setDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    this.directoryHandle = handle
  }
  
  /**
   * 请求用户选择项目目录
   */
  async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle> {
    if ('showDirectoryPicker' in window) {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      })
      this.directoryHandle = handle
      return handle
    } else {
      throw new Error('File System Access API not supported')
    }
  }
  
  /**
   * 写入文件
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    try {
      const fileHandle = await this.getFileHandle(path, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (error) {
      console.error('Failed to write file:', error)
      // 后备到 IndexedDB
      await this.writeFileToIndexedDB(path, content)
    }
  }
  
  /**
   * 读取文件
   */
  async readFile(path: string): Promise<string> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    try {
      const fileHandle = await this.getFileHandle(path)
      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('Failed to read file:', error)
      // 后备到 IndexedDB
      return await this.readFileFromIndexedDB(path)
    }
  }
  
  /**
   * 检查文件是否存在
   */
  async exists(path: string): Promise<boolean> {
    if (!this.directoryHandle) {
      return false
    }
    
    try {
      await this.getFileHandle(path)
      return true
    } catch {
      // 检查 IndexedDB
      return await this.existsInIndexedDB(path)
    }
  }
  
  /**
   * 创建目录
   */
  async mkdir(path: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    try {
      const pathParts = path.split('/').filter(part => part.length > 0)
      let currentHandle = this.directoryHandle
      
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true })
      }
    } catch (error) {
      console.error('Failed to create directory:', error)
      // IndexedDB 不需要显式创建目录
    }
  }
  
  /**
   * 读取目录内容
   */
  async readdir(path: string): Promise<string[]> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    try {
      const dirHandle = await this.getDirectoryHandle(path)
      const entries: string[] = []
      
      for await (const [name, handle] of dirHandle.entries()) {
        entries.push(name)
      }
      
      return entries
    } catch (error) {
      console.error('Failed to read directory:', error)
      return []
    }
  }
  
  // ========================================================================
  // 私有辅助方法
  // ========================================================================
  
  private async getFileHandle(path: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    const pathParts = path.split('/').filter(part => part.length > 0)
    const fileName = pathParts.pop()!
    
    let currentHandle = this.directoryHandle
    
    // 导航到目录
    for (const part of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: options?.create })
    }
    
    // 获取文件句柄
    return await currentHandle.getFileHandle(fileName, options)
  }
  
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle set')
    }
    
    if (!path || path === '.' || path === '/') {
      return this.directoryHandle
    }
    
    const pathParts = path.split('/').filter(part => part.length > 0)
    let currentHandle = this.directoryHandle
    
    for (const part of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(part)
    }
    
    return currentHandle
  }
  
  // ========================================================================
  // IndexedDB 后备方法
  // ========================================================================
  
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' })
        }
      }
    })
  }
  
  private async writeFileToIndexedDB(path: string, content: string): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction(['files'], 'readwrite')
    const store = transaction.objectStore('files')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ path, content, timestamp: Date.now() })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  private async readFileFromIndexedDB(path: string): Promise<string> {
    const db = await this.getDB()
    const transaction = db.transaction(['files'], 'readonly')
    const store = transaction.objectStore('files')
    
    return new Promise((resolve, reject) => {
      const request = store.get(path)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.content)
        } else {
          reject(new Error(`File not found: ${path}`))
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
  
  private async existsInIndexedDB(path: string): Promise<boolean> {
    try {
      await this.readFileFromIndexedDB(path)
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// 项目选择器组件
// ============================================================================

export class ProjectSelector {
  private fileSystem: BrowserFileSystemAdapter
  
  constructor() {
    this.fileSystem = new BrowserFileSystemAdapter()
  }
  
  /**
   * 创建新项目
   */
  async createProject(): Promise<{ name: string, path: string, fileSystem: BrowserFileSystemAdapter }> {
    try {
      const directoryHandle = await this.fileSystem.requestDirectoryAccess()
      const projectName = directoryHandle.name
      
      return {
        name: projectName,
        path: '.',
        fileSystem: this.fileSystem
      }
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`)
    }
  }
  
  /**
   * 打开现有项目
   */
  async openProject(): Promise<{ name: string, path: string, fileSystem: BrowserFileSystemAdapter }> {
    try {
      const directoryHandle = await this.fileSystem.requestDirectoryAccess()
      
      // 检查是否是有效的 QAQ 项目
      const hasProjectFile = await this.fileSystem.exists('project.qaq')
      if (!hasProjectFile) {
        throw new Error('Selected directory is not a valid QAQ project')
      }
      
      const projectName = directoryHandle.name
      
      return {
        name: projectName,
        path: '.',
        fileSystem: this.fileSystem
      }
    } catch (error) {
      throw new Error(`Failed to open project: ${error}`)
    }
  }
  
  /**
   * 获取文件系统适配器
   */
  getFileSystem(): BrowserFileSystemAdapter {
    return this.fileSystem
  }
}
