import Store from 'electron-store'
import { safeStorage } from 'electron'

/**
 * 连接配置接口
 */
export interface ConnectionConfig {
  name: string
  host: string
  port: number
  password?: string
  db?: number
}

/**
 * 应用配置接口
 */
interface AppConfig {
  connections: Record<string, ConnectionConfig>
  windowBounds?: {
    width: number
    height: number
    x?: number
    y?: number
  }
}

/**
 * 数据持久化管理类
 * 负责管理应用配置的本地存储，支持安全密码存储
 */
export class StoreManager {
  private store: Store<AppConfig> | null = null

  /**
   * 初始化存储管理器
   */
  public initialize(): void {
    this.store = new Store<AppConfig>({
      name: 'redis-client-config',
      defaults: {
        connections: {}
      }
    })
  }

  /**
   * 保存连接配置
   * @param id 连接 ID
   * @param config 连接配置
   */
  public saveConnection(id: string, config: ConnectionConfig): void {
    if (!this.store) {
      throw new Error('存储管理器未初始化')
    }

    const connections = this.store.get('connections', {})

    // 如果有密码，使用 safeStorage 加密存储
    if (config.password) {
      const encryptedPassword = this.encryptPassword(config.password)
      connections[id] = { ...config, password: encryptedPassword }
    } else {
      connections[id] = config
    }

    this.store.set('connections', connections)
  }

  /**
   * 获取所有连接配置
   * @returns 连接配置映射
   */
  public getConnections(): Record<string, ConnectionConfig> {
    if (!this.store) {
      throw new Error('存储管理器未初始化')
    }

    const connections = this.store.get('connections', {})

    // 解密所有密码
    const decryptedConnections: Record<string, ConnectionConfig> = {}
    for (const [id, config] of Object.entries(connections)) {
      decryptedConnections[id] = {
        ...config,
        password: config.password ? this.decryptPassword(config.password) : undefined
      }
    }

    return decryptedConnections
  }

  /**
   * 删除连接配置
   * @param id 连接 ID
   */
  public deleteConnection(id: string): void {
    if (!this.store) {
      throw new Error('存储管理器未初始化')
    }

    const connections = this.store.get('connections', {})
    delete connections[id]
    this.store.set('connections', connections)
  }

  /**
   * 保存窗口边界
   * @param bounds 窗口边界信息
   */
  public saveWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): void {
    if (!this.store) {
      throw new Error('存储管理器未初始化')
    }

    this.store.set('windowBounds', bounds)
  }

  /**
   * 获取窗口边界
   */
  public getWindowBounds(): { width: number; height: number; x?: number; y?: number } | undefined {
    if (!this.store) {
      throw new Error('存储管理器未初始化')
    }

    return this.store.get('windowBounds')
  }

  /**
   * 使用 safeStorage 加密密码
   * @param password 明文密码
   * @returns 加密后的密码（Base64 编码）
   */
  private encryptPassword(password: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(password)
      return encrypted.toString('base64')
    }
    // 如果加密不可用（例如在某些 Linux 发行版上），则使用 base64 编码
    // 注意：这不如 safeStorage 安全，但在无法使用加密时提供了一种折中方案
    return Buffer.from(password).toString('base64')
  }

  /**
   * 解密密码
   * @param encryptedPassword 加密后的密码
   * @returns 解密后的明文密码
   */
  private decryptPassword(encryptedPassword: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = Buffer.from(encryptedPassword, 'base64')
        return safeStorage.decryptString(encrypted)
      } catch (error) {
        console.error('密码解密失败:', error)
        return ''
      }
    }
    // 如果加密不可用，使用 base64 解码
    return Buffer.from(encryptedPassword, 'base64').toString()
  }
}
