import { contextBridge, ipcRenderer } from 'electron'

/**
 * 预加载脚本
 * 通过 contextBridge 向渲染进程暴露有限且安全的 API
 * 这是 Electron 安全模型的核心：渲染进程无法直接访问 Node.js 或 Electron API
 */

// 定义可暴露给渲染进程的 API 接口
const electronAPI = {
  // ==================== 连接管理 ====================

  /**
   * 测试 Redis 连接是否成功
   * @param config 连接配置
   */
  testConnection: (config: {
    host: string
    port: number
    password?: string
    db?: number
  }) => ipcRenderer.invoke('redis:test-connection', config),

  /**
   * 保存连接配置
   * @param id 连接 ID
   * @param config 连接配置
   */
  saveConnection: (id: string, config: {
    name: string
    host: string
    port: number
    password?: string
    db?: number
  }) => ipcRenderer.invoke('store:save-connection', id, config),

  /**
   * 获取所有连接配置列表
   */
  getConnections: () => ipcRenderer.invoke('store:get-connections'),

  /**
   * 删除连接配置
   * @param id 连接 ID
   */
  deleteConnection: (id: string) => ipcRenderer.invoke('store:delete-connection', id),

  /**
   * 连接到 Redis 服务器
   * @param id 连接 ID
   * @param config 连接配置
   */
  connect: (id: string, config: {
    host: string
    port: number
    password?: string
    db?: number
  }) => ipcRenderer.invoke('redis:connect', id, config),

  /**
   * 断开 Redis 连接
   * @param id 连接 ID
   */
  disconnect: (id: string) => ipcRenderer.invoke('redis:disconnect', id),

  /**
   * 获取当前连接状态
   * @param id 连接 ID
   */
  getConnectionStatus: (id: string) => ipcRenderer.invoke('redis:status', id),

  /**
   * 切换连接（断开其他连接）
   * @param id 连接 ID
   * @param config 连接配置
   */
  switchConnection: (id: string, config: {
    host: string
    port: number
    password?: string
    db?: number
  }) => ipcRenderer.invoke('redis:switch-connection', id, config),

  // ==================== 键值操作 ====================

  /**
   * 扫描 Redis 键列表（分页）
   * @param id 连接 ID
   * @param cursor 当前游标位置
   * @param pattern 匹配模式
   * @param count 每页数量
   */
  scanKeys: (id: string, cursor: number, pattern: string, count: number) =>
    ipcRenderer.invoke('redis:scan-keys', id, cursor, pattern, count),

  /**
   * 获取键的类型
   * @param id 连接 ID
   * @param key 键名
   */
  getKeyType: (id: string, key: string) => ipcRenderer.invoke('redis:get-key-type', id, key),

  /**
   * 获取 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   */
  getString: (id: string, key: string) => ipcRenderer.invoke('redis:get-string', id, key),

  /**
   * 设置 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   * @param value 值
   * @param ttl 过期时间（秒）
   */
  setString: (id: string, key: string, value: string, ttl?: number) =>
    ipcRenderer.invoke('redis:set-string', id, key, value, ttl),

  /**
   * 获取 Hash 类型的所有字段和值
   * @param id 连接 ID
   * @param key 键名
   */
  getHash: (id: string, key: string) => ipcRenderer.invoke('redis:get-hash', id, key),

  /**
   * 设置 Hash 类型的单个字段
   * @param id 连接 ID
   * @param key 键名
   * @param field 字段名
   * @param value 值
   */
  setHashField: (id: string, key: string, field: string, value: string) =>
    ipcRenderer.invoke('redis:set-hash-field', id, key, field, value),

  /**
   * 删除 Hash 类型的字段
   * @param id 连接 ID
   * @param key 键名
   * @param fields 字段名数组
   */
  deleteHashFields: (id: string, key: string, fields: string[]) =>
    ipcRenderer.invoke('redis:delete-hash-fields', id, key, fields),

  /**
   * 获取 List 类型的所有元素
   * @param id 连接 ID
   * @param key 键名
   */
  getList: (id: string, key: string) => ipcRenderer.invoke('redis:get-list', id, key),

  /**
   * 设置 List 类型的元素
   * @param id 连接 ID
   * @param key 键名
   * @param values 值数组
   */
  setList: (id: string, key: string, values: string[]) =>
    ipcRenderer.invoke('redis:set-list', id, key, values),

  /**
   * 获取 Set 类型的所有成员
   * @param id 连接 ID
   * @param key 键名
   */
  getSet: (id: string, key: string) => ipcRenderer.invoke('redis:get-set', id, key),

  /**
   * 获取 ZSet 类型的所有成员和分数
   * @param id 连接 ID
   * @param key 键名
   */
  getZSet: (id: string, key: string) => ipcRenderer.invoke('redis:get-zset', id, key),

  /**
   * 删除键
   * @param id 连接 ID
   * @param keys 键名数组
   */
  deleteKeys: (id: string, keys: string[]) => ipcRenderer.invoke('redis:delete-keys', id, keys),

  /**
   * 重命名键
   * @param id 连接 ID
   * @param oldKey 原键名
   * @param newKey 新键名
   */
  renameKey: (id: string, oldKey: string, newKey: string) =>
    ipcRenderer.invoke('redis:rename-key', id, oldKey, newKey),

  /**
   * 设置键的过期时间
   * @param id 连接 ID
   * @param key 键名
   * @param ttl 过期时间（秒）
   */
  setKeyTTL: (id: string, key: string, ttl: number) =>
    ipcRenderer.invoke('redis:set-key-ttl', id, key, ttl),

  /**
   * 获取键的剩余过期时间
   * @param id 连接 ID
   * @param key 键名
   */
  getKeyTTL: (id: string, key: string) => ipcRenderer.invoke('redis:get-key-ttl', id, key),

  // ==================== 服务器信息 ====================

  /**
   * 获取服务器信息
   * @param id 连接 ID
   */
  getServerInfo: (id: string) => ipcRenderer.invoke('redis:get-server-info', id),

  /**
   * 获取数据库键数量
   * @param id 连接 ID
   */
  getDbSize: (id: string) => ipcRenderer.invoke('redis:get-db-size', id),

  /**
   * 执行原始命令
   * @param id 连接 ID
   * @param command 命令
   */
  executeCommand: (id: string, command: string) =>
    ipcRenderer.invoke('redis:execute-command', id, command),

  // ==================== 窗口管理 ====================

  /**
   * 最小化窗口
   */
  minimizeWindow: () => ipcRenderer.send('window:minimize'),

  /**
   * 最大化/还原窗口
   */
  maximizeWindow: () => ipcRenderer.send('window:maximize'),

  /**
   * 关闭窗口
   */
  closeWindow: () => ipcRenderer.send('window:close')
}

// 菜单事件处理
// 监听来自主进程的菜单点击事件
const menuEventListeners: { [key: string]: ((...args: unknown[]) => void)[] } = {}

/**
 * 监听菜单事件
 * @param channel 事件通道
 * @param listener 事件处理器
 */
const onMenuEvent = (channel: string, listener: (...args: unknown[]) => void) => {
  if (!menuEventListeners[channel]) {
    menuEventListeners[channel] = []
  }
  menuEventListeners[channel].push(listener)

  // 注册一次监听器
  ipcRenderer.on(channel, (event, ...args) => {
    menuEventListeners[channel].forEach(listener => listener(...args))
  })
}

/**
 * 移除菜单事件监听
 * @param channel 事件通道
 * @param listener 事件处理器
 */
const removeMenuEventListener = (channel: string, listener: (...args: unknown[]) => void) => {
  if (menuEventListeners[channel]) {
    menuEventListeners[channel] = menuEventListeners[channel].filter(l => l !== listener)
  }
}

// 扩展 electronAPI 添加菜单事件监听方法
const extendedElectronAPI = {
  ...electronAPI,
  onMenuEvent,
  removeMenuEventListener
}

// 通过 contextBridge 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', extendedElectronAPI)

// 导出类型声明供渲染进程使用
export type ElectronAPI = typeof extendedElectronAPI
