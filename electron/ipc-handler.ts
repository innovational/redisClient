import { ipcMain, BrowserWindow } from 'electron'
import { RedisManager } from './redis-manager'
import { StoreManager } from './store-manager'

/**
 * 设置 IPC 通信处理器
 * 将所有 Redis 操作和存储操作通过 IPC 暴露给渲染进程
 * @param redisManager Redis 客户端管理器实例
 * @param storeManager 数据持久化管理器实例
 */
export function setupIpcHandlers(
  redisManager: RedisManager,
  storeManager: StoreManager
): void {
  // ==================== 连接管理 ====================

  /**
   * 测试 Redis 连接
   */
  ipcMain.handle('redis:test-connection', async (_, config) => {
    return await redisManager.testConnection(config)
  })

  /**
   * 连接到 Redis 服务器
   */
  ipcMain.handle('redis:connect', async (_, id, config) => {
    return await redisManager.connect(id, config)
  })

  /**
   * 断开 Redis 连接
   */
  ipcMain.handle('redis:disconnect', async (_, id) => {
    await redisManager.disconnect(id)
    return { success: true }
  })

  /**
   * 获取连接状态
   */
  ipcMain.handle('redis:status', async (_, id) => {
    return redisManager.getStatus(id)
  })

  // ==================== 存储管理 ====================

  /**
   * 保存连接配置
   */
  ipcMain.handle('store:save-connection', async (_, id, config) => {
    storeManager.saveConnection(id, config)
    return { success: true }
  })

  /**
   * 获取所有连接配置
   */
  ipcMain.handle('store:get-connections', async () => {
    return storeManager.getConnections()
  })

  /**
   * 删除连接配置
   */
  ipcMain.handle('store:delete-connection', async (_, id) => {
    storeManager.deleteConnection(id)
    return { success: true }
  })

  // ==================== 键值操作 ====================

  /**
   * 扫描键（分页）
   */
  ipcMain.handle('redis:scan-keys', async (_, id, cursor, pattern, count) => {
    return await redisManager.scanKeys(id, cursor, pattern, count)
  })

  /**
   * 获取键类型
   */
  ipcMain.handle('redis:get-key-type', async (_, id, key) => {
    return await redisManager.getKeyType(id, key)
  })

  /**
   * 获取 String 值
   */
  ipcMain.handle('redis:get-string', async (_, id, key) => {
    return await redisManager.getString(id, key)
  })

  /**
   * 设置 String 值
   */
  ipcMain.handle('redis:set-string', async (_, id, key, value, ttl) => {
    await redisManager.setString(id, key, value, ttl)
    return { success: true }
  })

  /**
   * 获取 Hash
   */
  ipcMain.handle('redis:get-hash', async (_, id, key) => {
    return await redisManager.getHash(id, key)
  })

  /**
   * 设置 Hash 字段
   */
  ipcMain.handle('redis:set-hash-field', async (_, id, key, field, value) => {
    await redisManager.setHashField(id, key, field, value)
    return { success: true }
  })

  /**
   * 删除 Hash 字段
   */
  ipcMain.handle('redis:delete-hash-fields', async (_, id, key, fields) => {
    await redisManager.deleteHashFields(id, key, fields)
    return { success: true }
  })

  /**
   * 获取 List
   */
  ipcMain.handle('redis:get-list', async (_, id, key) => {
    return await redisManager.getList(id, key)
  })

  /**
   * 设置 List
   */
  ipcMain.handle('redis:set-list', async (_, id, key, values) => {
    await redisManager.setList(id, key, values)
    return { success: true }
  })

  /**
   * 获取 Set
   */
  ipcMain.handle('redis:get-set', async (_, id, key) => {
    return await redisManager.getSet(id, key)
  })

  /**
   * 获取 ZSet
   */
  ipcMain.handle('redis:get-zset', async (_, id, key) => {
    return await redisManager.getZSet(id, key)
  })

  /**
   * 删除键
   */
  ipcMain.handle('redis:delete-keys', async (_, id, keys) => {
    await redisManager.deleteKeys(id, keys)
    return { success: true }
  })

  /**
   * 重命名键
   */
  ipcMain.handle('redis:rename-key', async (_, id, oldKey, newKey) => {
    await redisManager.renameKey(id, oldKey, newKey)
    return { success: true }
  })

  /**
   * 设置键 TTL
   */
  ipcMain.handle('redis:set-key-ttl', async (_, id, key, ttl) => {
    await redisManager.setKeyTTL(id, key, ttl)
    return { success: true }
  })

  /**
   * 获取键 TTL
   */
  ipcMain.handle('redis:get-key-ttl', async (_, id, key) => {
    return await redisManager.getKeyTTL(id, key)
  })

  // ==================== 服务器信息 ====================

  /**
   * 获取服务器信息
   */
  ipcMain.handle('redis:get-server-info', async (_, id) => {
    return await redisManager.getServerInfo(id)
  })

  /**
   * 获取数据库大小
   */
  ipcMain.handle('redis:get-db-size', async (_, id) => {
    return await redisManager.getDbSize(id)
  })

  /**
   * 执行原始命令
   */
  ipcMain.handle('redis:execute-command', async (_, id, command) => {
    return await redisManager.executeCommand(id, command)
  })

  /**
   * 切换连接（断开其他连接）
   */
  ipcMain.handle('redis:switch-connection', async (_, id, config) => {
    return await redisManager.switchConnection(id, config)
  })

  // ==================== 窗口管理 ====================

  /**
   * 最小化窗口
   */
  ipcMain.on('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  /**
   * 最大化/还原窗口
   */
  ipcMain.on('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) {
      window.unmaximize()
    } else {
      window?.maximize()
    }
  })

  /**
   * 关闭窗口
   */
  ipcMain.on('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })
}
