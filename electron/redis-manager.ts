import { createClient, RedisClientType, RedisModules } from 'redis'

/**
 * Redis 连接配置接口
 */
export interface RedisConnectionConfig {
  host: string
  port: number
  password?: string
  db?: number
}

/**
 * Redis 连接状态接口
 */
export interface ConnectionStatus {
  connected: boolean
  error?: string
}

/**
 * SCAN 操作结果接口
 */
export interface ScanResult {
  cursor: number
  keys: string[]
  total: number
}

/**
 * 键类型枚举
 */
export enum RedisKeyType {
  STRING = 'string',
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  ZSET = 'zset',
  NONE = 'none'
}

/**
 * Redis 客户端管理类
 * 负责管理多个 Redis 客户端连接，提供统一的操作接口
 * 支持连接复用、连接状态追踪和统一断开
 */
export class RedisManager {
  // 存储所有活跃的 Redis 客户端，键为连接 ID
  private clients: Map<string, RedisClientType> = new Map()

  // 存储连接状态
  private status: Map<string, ConnectionStatus> = new Map()

  /**
   * 测试 Redis 连接是否成功
   * @param config 连接配置
   * @returns 测试结果，包含成功/失败状态和错误信息
   */
  public async testConnection(config: RedisConnectionConfig): Promise<{
    success: boolean
    error?: string
  }> {
    let testClient: RedisClientType | null = null
    try {
      // 创建临时客户端进行测试
      testClient = this.createClient(config)
      await testClient.connect()

      // 执行 PING 命令验证连接
      const result = await testClient.ping()
      if (result === 'PONG') {
        return { success: true }
      } else {
        return { success: false, error: '服务器响应异常' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return { success: false, error: errorMessage }
    } finally {
      // 确保测试客户端被关闭
      if (testClient) {
        await testClient.quit().catch(() => {})
      }
    }
  }

  /**
   * 连接到 Redis 服务器
   * @param id 连接 ID
   * @param config 连接配置
   * @returns 连接结果
   */
  public async connect(id: string, config: RedisConnectionConfig): Promise<{
    success: boolean
    error?: string
  }> {
    // 如果已存在连接，先断开
    if (this.clients.has(id)) {
      await this.disconnect(id)
    }

    try {
      const client = this.createClient(config)
      await client.connect()

      // 验证连接
      await client.ping()

      // 存储客户端
      this.clients.set(id, client)
      this.status.set(id, { connected: true })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.status.set(id, { connected: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 断开 Redis 连接
   * @param id 连接 ID
   */
  public async disconnect(id: string): Promise<void> {
    const client = this.clients.get(id)
    if (client) {
      try {
        await client.quit()
      } catch (error) {
        console.error(`断开连接 ${id} 时出错:`, error)
      } finally {
        this.clients.delete(id)
        this.status.delete(id)
      }
    }
  }

  /**
   * 断开所有连接
   */
  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map(id =>
      this.disconnect(id)
    )
    await Promise.all(disconnectPromises)
  }

  /**
   * 获取连接状态
   * @param id 连接 ID
   */
  public getStatus(id: string): ConnectionStatus {
    return this.status.get(id) || { connected: false, error: '连接不存在' }
  }

  /**
   * 获取客户端实例
   * @param id 连接 ID
   */
  private getClient(id: string): RedisClientType {
    const client = this.clients.get(id)
    if (!client) {
      throw new Error(`连接 ${id} 不存在`)
    }
    return client
  }

  /**
   * 创建 Redis 客户端实例
   * @param config 连接配置
   */
  private createClient(config: RedisConnectionConfig): RedisClientType {
    return createClient({
      socket: {
        host: config.host,
        port: config.port
      },
      password: config.password,
      database: config.db || 0
    })
  }

  /**
   * 扫描 Redis 键（分页）
   * @param id 连接 ID
   * @param cursor 当前游标位置
   * @param pattern 匹配模式
   * @param count 每页数量
   */
  public async scanKeys(id: string, cursor: number, pattern: string, count: number): Promise<ScanResult> {
    const client = this.getClient(id) as any
    const result = await client.scan(cursor.toString(), {
      MATCH: pattern,
      COUNT: count.toString()
    })

    return {
      cursor: parseInt(result.cursor, 10),
      keys: result.keys,
      total: result.keys.length
    }
  }

  /**
   * 获取键的类型
   * @param id 连接 ID
   * @param key 键名
   */
  public async getKeyType(id: string, key: string): Promise<RedisKeyType> {
    const client = this.getClient(id)
    const type = await client.type(key)
    return type as RedisKeyType
  }

  /**
   * 获取 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   */
  public async getString(id: string, key: string): Promise<string | null> {
    const client = this.getClient(id)
    return await client.get(key)
  }

  /**
   * 设置 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   * @param value 值
   * @param ttl 过期时间（秒）
   */
  public async setString(id: string, key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient(id)
    if (ttl && ttl > 0) {
      await client.setEx(key, ttl, value)
    } else {
      await client.set(key, value)
    }
  }

  /**
   * 获取 Hash 类型的所有字段和值
   * @param id 连接 ID
   * @param key 键名
   */
  public async getHash(id: string, key: string): Promise<Record<string, string>> {
    const client = this.getClient(id)
    return await client.hGetAll(key)
  }

  /**
   * 设置 Hash 类型的单个字段
   * @param id 连接 ID
   * @param key 键名
   * @param field 字段名
   * @param value 值
   */
  public async setHashField(id: string, key: string, field: string, value: string): Promise<void> {
    const client = this.getClient(id)
    await client.hSet(key, field, value)
  }

  /**
   * 删除 Hash 类型的字段
   * @param id 连接 ID
   * @param key 键名
   * @param fields 字段名数组
   */
  public async deleteHashFields(id: string, key: string, fields: string[]): Promise<void> {
    const client = this.getClient(id) as any
    await client.hDel(key, ...fields)
  }

  /**
   * 获取 List 类型的所有元素
   * @param id 连接 ID
   * @param key 键名
   */
  public async getList(id: string, key: string): Promise<string[]> {
    const client = this.getClient(id)
    const length = await client.lLen(key)
    return await client.lRange(key, 0, length - 1)
  }

  /**
   * 设置 List 类型的元素
   * @param id 连接 ID
   * @param key 键名
   * @param values 值数组
   */
  public async setList(id: string, key: string, values: string[]): Promise<void> {
    const client = this.getClient(id) as any
    await client.del(key)
    if (values.length > 0) {
      await client.rPush(key, ...values)
    }
  }

  /**
   * 获取 Set 类型的所有成员
   * @param id 连接 ID
   * @param key 键名
   */
  public async getSet(id: string, key: string): Promise<string[]> {
    const client = this.getClient(id)
    return await client.sMembers(key)
  }

  /**
   * 获取 ZSet 类型的所有成员和分数
   * @param id 连接 ID
   * @param key 键名
   */
  public async getZSet(id: string, key: string): Promise<Array<{ member: string; score: number }>> {
    const client = this.getClient(id)
    const result = await client.zRangeWithScores(key, 0, -1)
    return result.map(item => ({
      member: item.value,
      score: item.score
    }))
  }

  /**
   * 删除键
   * @param id 连接 ID
   * @param keys 键名数组
   */
  public async deleteKeys(id: string, keys: string[]): Promise<void> {
    const client = this.getClient(id) as any
    await client.del(...keys)
  }

  /**
   * 重命名键
   * @param id 连接 ID
   * @param oldKey 原键名
   * @param newKey 新键名
   */
  public async renameKey(id: string, oldKey: string, newKey: string): Promise<void> {
    const client = this.getClient(id)
    await client.rename(oldKey, newKey)
  }

  /**
   * 设置键的过期时间
   * @param id 连接 ID
   * @param key 键名
   * @param ttl 过期时间（秒）
   */
  public async setKeyTTL(id: string, key: string, ttl: number): Promise<void> {
    const client = this.getClient(id)
    await client.expire(key, ttl)
  }

  /**
   * 获取键的剩余过期时间
   * @param id 连接 ID
   * @param key 键名
   */
  public async getKeyTTL(id: string, key: string): Promise<number> {
    const client = this.getClient(id)
    return await client.ttl(key)
  }

  /**
   * 获取服务器信息
   * @param id 连接 ID
   */
  public async getServerInfo(id: string): Promise<Record<string, string>> {
    const client = this.getClient(id)
    const info = await client.info()
    const result: Record<string, string> = {}

    // 解析 INFO 输出
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':')
      if (key && value) {
        result[key] = value
      }
    })

    return result
  }

  /**
   * 获取数据库键数量
   * @param id 连接 ID
   */
  public async getDbSize(id: string): Promise<number> {
    const client = this.getClient(id)
    return await client.dbSize()
  }

  /**
   * 执行原始命令
   * @param id 连接 ID
   * @param command 命令字符串
   */
  public async executeCommand(id: string, command: string): Promise<any> {
    const client = this.getClient(id)

    // 解析命令字符串为数组
    const parts = this.parseCommand(command)
    if (parts.length === 0) {
      throw new Error('无效的命令')
    }

    // 获取命令名称和方法名
    const cmdName = parts[0].toUpperCase()

    // 使用 node-redis 的 call 方法执行命令
    const args = parts.slice(1)
    return await (client as any)[cmdName](...args)
  }

  /**
   * 创建一次性连接执行操作后自动关闭
   * @param config 连接配置
   * @param operation 操作函数
   */
  public async executeWithTempConnection<T>(
    config: RedisConnectionConfig,
    operation: (client: RedisClientType) => Promise<T>
  ): Promise<T> {
    let client: RedisClientType | null = null
    try {
      client = this.createClient(config)
      await client.connect()
      await client.ping()
      return await operation(client)
    } finally {
      if (client) {
        await client.quit().catch(() => {})
      }
    }
  }

  /**
   * 切换连接时关闭旧连接
   * @param newId 新连接 ID
   * @param newConfig 新连接配置
   */
  public async switchConnection(newId: string, newConfig: RedisConnectionConfig): Promise<{
    success: boolean
    error?: string
  }> {
    // 断开所有其他连接
    for (const id of this.clients.keys()) {
      if (id !== newId) {
        await this.disconnect(id)
      }
    }

    // 连接新的服务器
    return await this.connect(newId, newConfig)
  }

  /**
   * 解析命令字符串
   * @param command 命令字符串
   */
  private parseCommand(command: string): string[] {
    const parts: string[] = []
    let current = ''
    let inQuote = false
    let quoteChar = ''

    for (let i = 0; i < command.length; i++) {
      const char = command[i]

      if (inQuote) {
        if (char === quoteChar) {
          inQuote = false
        } else {
          current += char
        }
      } else if (char === '"' || char === "'") {
        inQuote = true
        quoteChar = char
      } else if (char === ' ') {
        if (current) {
          parts.push(current)
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }
}
