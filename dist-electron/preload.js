"use strict";
const electron = require("electron");
const electronAPI = {
  // ==================== 连接管理 ====================
  /**
   * 测试 Redis 连接是否成功
   * @param config 连接配置
   */
  testConnection: (config) => electron.ipcRenderer.invoke("redis:test-connection", config),
  /**
   * 保存连接配置
   * @param id 连接 ID
   * @param config 连接配置
   */
  saveConnection: (id, config) => electron.ipcRenderer.invoke("store:save-connection", id, config),
  /**
   * 获取所有连接配置列表
   */
  getConnections: () => electron.ipcRenderer.invoke("store:get-connections"),
  /**
   * 删除连接配置
   * @param id 连接 ID
   */
  deleteConnection: (id) => electron.ipcRenderer.invoke("store:delete-connection", id),
  /**
   * 连接到 Redis 服务器
   * @param id 连接 ID
   * @param config 连接配置
   */
  connect: (id, config) => electron.ipcRenderer.invoke("redis:connect", id, config),
  /**
   * 断开 Redis 连接
   * @param id 连接 ID
   */
  disconnect: (id) => electron.ipcRenderer.invoke("redis:disconnect", id),
  /**
   * 获取当前连接状态
   * @param id 连接 ID
   */
  getConnectionStatus: (id) => electron.ipcRenderer.invoke("redis:status", id),
  // ==================== 键值操作 ====================
  /**
   * 扫描 Redis 键列表（分页）
   * @param id 连接 ID
   * @param cursor 当前游标位置
   * @param pattern 匹配模式
   * @param count 每页数量
   */
  scanKeys: (id, cursor, pattern, count) => electron.ipcRenderer.invoke("redis:scan-keys", id, cursor, pattern, count),
  /**
   * 获取键的类型
   * @param id 连接 ID
   * @param key 键名
   */
  getKeyType: (id, key) => electron.ipcRenderer.invoke("redis:get-key-type", id, key),
  /**
   * 获取 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   */
  getString: (id, key) => electron.ipcRenderer.invoke("redis:get-string", id, key),
  /**
   * 设置 String 类型的值
   * @param id 连接 ID
   * @param key 键名
   * @param value 值
   * @param ttl 过期时间（秒）
   */
  setString: (id, key, value, ttl) => electron.ipcRenderer.invoke("redis:set-string", id, key, value, ttl),
  /**
   * 获取 Hash 类型的所有字段和值
   * @param id 连接 ID
   * @param key 键名
   */
  getHash: (id, key) => electron.ipcRenderer.invoke("redis:get-hash", id, key),
  /**
   * 设置 Hash 类型的单个字段
   * @param id 连接 ID
   * @param key 键名
   * @param field 字段名
   * @param value 值
   */
  setHashField: (id, key, field, value) => electron.ipcRenderer.invoke("redis:set-hash-field", id, key, field, value),
  /**
   * 删除 Hash 类型的字段
   * @param id 连接 ID
   * @param key 键名
   * @param fields 字段名数组
   */
  deleteHashFields: (id, key, fields) => electron.ipcRenderer.invoke("redis:delete-hash-fields", id, key, fields),
  /**
   * 获取 List 类型的所有元素
   * @param id 连接 ID
   * @param key 键名
   */
  getList: (id, key) => electron.ipcRenderer.invoke("redis:get-list", id, key),
  /**
   * 设置 List 类型的元素
   * @param id 连接 ID
   * @param key 键名
   * @param values 值数组
   */
  setList: (id, key, values) => electron.ipcRenderer.invoke("redis:set-list", id, key, values),
  /**
   * 获取 Set 类型的所有成员
   * @param id 连接 ID
   * @param key 键名
   */
  getSet: (id, key) => electron.ipcRenderer.invoke("redis:get-set", id, key),
  /**
   * 获取 ZSet 类型的所有成员和分数
   * @param id 连接 ID
   * @param key 键名
   */
  getZSet: (id, key) => electron.ipcRenderer.invoke("redis:get-zset", id, key),
  /**
   * 删除键
   * @param id 连接 ID
   * @param keys 键名数组
   */
  deleteKeys: (id, keys) => electron.ipcRenderer.invoke("redis:delete-keys", id, keys),
  /**
   * 重命名键
   * @param id 连接 ID
   * @param oldKey 原键名
   * @param newKey 新键名
   */
  renameKey: (id, oldKey, newKey) => electron.ipcRenderer.invoke("redis:rename-key", id, oldKey, newKey),
  /**
   * 设置键的过期时间
   * @param id 连接 ID
   * @param key 键名
   * @param ttl 过期时间（秒）
   */
  setKeyTTL: (id, key, ttl) => electron.ipcRenderer.invoke("redis:set-key-ttl", id, key, ttl),
  /**
   * 获取键的剩余过期时间
   * @param id 连接 ID
   * @param key 键名
   */
  getKeyTTL: (id, key) => electron.ipcRenderer.invoke("redis:get-key-ttl", id, key),
  // ==================== 服务器信息 ====================
  /**
   * 获取服务器信息
   * @param id 连接 ID
   */
  getServerInfo: (id) => electron.ipcRenderer.invoke("redis:get-server-info", id),
  /**
   * 获取数据库键数量
   * @param id 连接 ID
   */
  getDbSize: (id) => electron.ipcRenderer.invoke("redis:get-db-size", id),
  /**
   * 执行原始命令
   * @param id 连接 ID
   * @param command 命令
   */
  executeCommand: (id, command) => electron.ipcRenderer.invoke("redis:execute-command", id, command),
  // ==================== 窗口管理 ====================
  /**
   * 最小化窗口
   */
  minimizeWindow: () => electron.ipcRenderer.send("window:minimize"),
  /**
   * 最大化/还原窗口
   */
  maximizeWindow: () => electron.ipcRenderer.send("window:maximize"),
  /**
   * 关闭窗口
   */
  closeWindow: () => electron.ipcRenderer.send("window:close")
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
