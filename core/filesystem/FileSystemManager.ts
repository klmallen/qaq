/**
 * QAQ 游戏引擎文件系统管理器
 * 提供文件系统抽象层，支持浏览器文件系统 API
 * 类似于 Godot 的 FileAccess 和 DirAccess 类
 */

import QaqObject from '../object/QaqObject'
import type { FileInfo, DirectoryInfo } from '../../types/core'

// ============================================================================
// 文件系统接口
// ============================================================================

export interface FileSystemAPI {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  createDirectory(path: string): Promise<void>
  deleteDirectory(path: string): Promise<void>
  listDirectory(path: string): Promise<FileInfo[]>
  exists(path: string): Promise<boolean>
  isFile(path: string): Promise<boolean>
  isDirectory(path: string): Promise<boolean>
  getFileInfo(path: string): Promise<FileInfo | null>
}

// ============================================================================
// 浏览器文件系统实现
// ============================================================================

export class BrowserFileSystem implements FileSystemAPI {
  private _directoryHandle: FileSystemDirectoryHandle | null = null
  private _projectRoot: string = ''

  constructor(directoryHandle?: FileSystemDirectoryHandle) {
    this._directoryHandle = directoryHandle || null
  }

  async setProjectDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    this._directoryHandle = directoryHandle
    this._projectRoot = directoryHandle.name
  }

  async readFile(path: string): Promise<string> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const fileHandle = await this._getFileHandle(path)
    const file = await fileHandle.getFile()
    return await file.text()
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const fileHandle = await this._getFileHandle(path, true)
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async deleteFile(path: string): Promise<void> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const pathParts = this._normalizePath(path).split('/')
    const fileName = pathParts.pop()!
    const dirHandle = await this._getDirectoryHandle(pathParts.join('/'))
    
    await dirHandle.removeEntry(fileName)
  }

  async createDirectory(path: string): Promise<void> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    await this._getDirectoryHandle(path, true)
  }

  async deleteDirectory(path: string): Promise<void> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const pathParts = this._normalizePath(path).split('/')
    const dirName = pathParts.pop()!
    const parentHandle = await this._getDirectoryHandle(pathParts.join('/'))
    
    await parentHandle.removeEntry(dirName, { recursive: true })
  }

  async listDirectory(path: string): Promise<FileInfo[]> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const dirHandle = await this._getDirectoryHandle(path)
    const entries: FileInfo[] = []

    for await (const [name, handle] of dirHandle.entries()) {
      const fullPath = path ? `${path}/${name}` : name
      const info: FileInfo = {
        name,
        path: fullPath,
        type: handle.kind === 'directory' ? 'directory' : 'file'
      }

      if (handle.kind === 'file') {
        const file = await handle.getFile()
        info.size = file.size
        info.lastModified = new Date(file.lastModified)
        info.extension = this._getFileExtension(name)
      }

      entries.push(info)
    }

    return entries.sort((a, b) => {
      // 目录优先，然后按名称排序
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this._getHandle(path)
      return true
    } catch {
      return false
    }
  }

  async isFile(path: string): Promise<boolean> {
    try {
      const handle = await this._getHandle(path)
      return handle.kind === 'file'
    } catch {
      return false
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      const handle = await this._getHandle(path)
      return handle.kind === 'directory'
    } catch {
      return false
    }
  }

  async getFileInfo(path: string): Promise<FileInfo | null> {
    try {
      const handle = await this._getHandle(path)
      const name = this._getFileName(path)
      
      const info: FileInfo = {
        name,
        path,
        type: handle.kind === 'directory' ? 'directory' : 'file'
      }

      if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile()
        info.size = file.size
        info.lastModified = new Date(file.lastModified)
        info.extension = this._getFileExtension(name)
      }

      return info
    } catch {
      return null
    }
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  private async _getHandle(path: string): Promise<FileSystemHandle> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const normalizedPath = this._normalizePath(path)
    if (!normalizedPath) {
      return this._directoryHandle
    }

    const pathParts = normalizedPath.split('/')
    let currentHandle: FileSystemHandle = this._directoryHandle

    for (const part of pathParts) {
      if (currentHandle.kind === 'directory') {
        currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(part)
          .catch(() => (currentHandle as FileSystemDirectoryHandle).getFileHandle(part))
      } else {
        throw new Error(`Cannot navigate into file: ${part}`)
      }
    }

    return currentHandle
  }

  private async _getFileHandle(path: string, create: boolean = false): Promise<FileSystemFileHandle> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const pathParts = this._normalizePath(path).split('/')
    const fileName = pathParts.pop()!
    const dirHandle = await this._getDirectoryHandle(pathParts.join('/'), create)
    
    return await dirHandle.getFileHandle(fileName, { create })
  }

  private async _getDirectoryHandle(path: string, create: boolean = false): Promise<FileSystemDirectoryHandle> {
    if (!this._directoryHandle) {
      throw new Error('No project directory set')
    }

    const normalizedPath = this._normalizePath(path)
    if (!normalizedPath) {
      return this._directoryHandle
    }

    const pathParts = normalizedPath.split('/')
    let currentHandle = this._directoryHandle

    for (const part of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create })
    }

    return currentHandle
  }

  private _normalizePath(path: string): string {
    return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  }

  private _getFileName(path: string): string {
    return path.split('/').pop() || ''
  }

  private _getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : ''
  }
}

// ============================================================================
// 文件系统管理器
// ============================================================================

export class FileSystemManager extends QaqObject {
  private _fileSystem: FileSystemAPI
  private _projectPath: string = ''
  private _watchedPaths: Set<string> = new Set()

  constructor(fileSystem?: FileSystemAPI) {
    super('FileSystemManager')
    this._fileSystem = fileSystem || new BrowserFileSystem()
    this.initializeFileSystemSignals()
  }

  // ========================================================================
  // 基础属性
  // ========================================================================

  get projectPath(): string {
    return this._projectPath
  }

  get fileSystem(): FileSystemAPI {
    return this._fileSystem
  }

  // ========================================================================
  // 项目管理
  // ========================================================================

  async setProjectDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    if (this._fileSystem instanceof BrowserFileSystem) {
      await this._fileSystem.setProjectDirectory(directoryHandle)
      this._projectPath = directoryHandle.name
      this.emit('project_directory_changed', this._projectPath)
    }
  }

  // ========================================================================
  // 文件操作
  // ========================================================================

  async readTextFile(path: string): Promise<string> {
    try {
      const content = await this._fileSystem.readFile(path)
      this.emit('file_read', path, content.length)
      return content
    } catch (error) {
      this.emit('file_read_error', path, error)
      throw error
    }
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    try {
      await this._fileSystem.writeFile(path, content)
      this.emit('file_written', path, content.length)
    } catch (error) {
      this.emit('file_write_error', path, error)
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this._fileSystem.deleteFile(path)
      this.emit('file_deleted', path)
    } catch (error) {
      this.emit('file_delete_error', path, error)
      throw error
    }
  }

  async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    try {
      const content = await this._fileSystem.readFile(sourcePath)
      await this._fileSystem.writeFile(targetPath, content)
      this.emit('file_copied', sourcePath, targetPath)
    } catch (error) {
      this.emit('file_copy_error', sourcePath, targetPath, error)
      throw error
    }
  }

  async moveFile(sourcePath: string, targetPath: string): Promise<void> {
    try {
      await this.copyFile(sourcePath, targetPath)
      await this._fileSystem.deleteFile(sourcePath)
      this.emit('file_moved', sourcePath, targetPath)
    } catch (error) {
      this.emit('file_move_error', sourcePath, targetPath, error)
      throw error
    }
  }

  // ========================================================================
  // 目录操作
  // ========================================================================

  async createDirectory(path: string): Promise<void> {
    try {
      await this._fileSystem.createDirectory(path)
      this.emit('directory_created', path)
    } catch (error) {
      this.emit('directory_create_error', path, error)
      throw error
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    try {
      await this._fileSystem.deleteDirectory(path)
      this.emit('directory_deleted', path)
    } catch (error) {
      this.emit('directory_delete_error', path, error)
      throw error
    }
  }

  async listDirectory(path: string = ''): Promise<FileInfo[]> {
    try {
      const entries = await this._fileSystem.listDirectory(path)
      this.emit('directory_listed', path, entries.length)
      return entries
    } catch (error) {
      this.emit('directory_list_error', path, error)
      throw error
    }
  }

  async getDirectoryTree(path: string = '', maxDepth: number = 10): Promise<DirectoryInfo> {
    const info = await this._fileSystem.getFileInfo(path)
    if (!info || info.type !== 'directory') {
      throw new Error(`Path is not a directory: ${path}`)
    }

    const dirInfo: DirectoryInfo = {
      ...info,
      type: 'directory',
      children: []
    }

    if (maxDepth > 0) {
      const entries = await this._fileSystem.listDirectory(path)
      for (const entry of entries) {
        if (entry.type === 'directory') {
          const childTree = await this.getDirectoryTree(entry.path, maxDepth - 1)
          dirInfo.children!.push(childTree)
        } else {
          dirInfo.children!.push(entry)
        }
      }
    }

    return dirInfo
  }

  // ========================================================================
  // 文件查询
  // ========================================================================

  async exists(path: string): Promise<boolean> {
    return await this._fileSystem.exists(path)
  }

  async isFile(path: string): Promise<boolean> {
    return await this._fileSystem.isFile(path)
  }

  async isDirectory(path: string): Promise<boolean> {
    return await this._fileSystem.isDirectory(path)
  }

  async getFileInfo(path: string): Promise<FileInfo | null> {
    return await this._fileSystem.getFileInfo(path)
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  protected initializeFileSystemSignals(): void {
    this.addSignal('project_directory_changed')
    this.addSignal('file_read')
    this.addSignal('file_read_error')
    this.addSignal('file_written')
    this.addSignal('file_write_error')
    this.addSignal('file_deleted')
    this.addSignal('file_delete_error')
    this.addSignal('file_copied')
    this.addSignal('file_copy_error')
    this.addSignal('file_moved')
    this.addSignal('file_move_error')
    this.addSignal('directory_created')
    this.addSignal('directory_create_error')
    this.addSignal('directory_deleted')
    this.addSignal('directory_delete_error')
    this.addSignal('directory_listed')
    this.addSignal('directory_list_error')
  }
}

export default FileSystemManager
