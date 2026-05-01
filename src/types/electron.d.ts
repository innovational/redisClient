/**
 * Electron API 类型声明
 * 使 TypeScript 能够识别 window.electronAPI
 */

export interface RedisConnectionConfig {
  host: string
  port: number
  password?: string
  db?: number
}

export interface ConnectionStatus {
  connected: boolean
  error?: string
}

export interface ScanResult {
  cursor: number
  keys: string[]
  total: number
}

export enum RedisKeyType {
  STRING = 'string',
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  ZSET = 'zset',
  NONE = 'none'
}

export interface ElectronAPI {
  // 连接管理
  testConnection: (config: RedisConnectionConfig) => Promise<{ success: boolean; error?: string }>
  saveConnection: (id: string, config: {
    name: string
    host: string
    port: number
    password?: string
    db?: number
  }) => Promise<{ success: boolean }>
  getConnections: () => Promise<Record<string, {
    name: string
    host: string
    port: number
    password?: string
    db?: number
  }>>
  deleteConnection: (id: string) => Promise<{ success: boolean }>
  connect: (id: string, config: RedisConnectionConfig) => Promise<{ success: boolean; error?: string }>
  disconnect: (id: string) => Promise<{ success: boolean }>
  getConnectionStatus: (id: string) => Promise<ConnectionStatus>
  switchConnection: (id: string, config: RedisConnectionConfig) => Promise<{ success: boolean; error?: string }>

  // 键值操作
  scanKeys: (id: string, cursor: number, pattern: string, count: number) => Promise<ScanResult>
  getKeyType: (id: string, key: string) => Promise<RedisKeyType>
  getString: (id: string, key: string) => Promise<string | null>
  setString: (id: string, key: string, value: string, ttl?: number) => Promise<{ success: boolean }>
  getHash: (id: string, key: string) => Promise<Record<string, string>>
  setHashField: (id: string, key: string, field: string, value: string) => Promise<{ success: boolean }>
  deleteHashFields: (id: string, key: string, fields: string[]) => Promise<{ success: boolean }>
  getList: (id: string, key: string) => Promise<string[]>
  setList: (id: string, key: string, values: string[]) => Promise<{ success: boolean }>
  getSet: (id: string, key: string) => Promise<string[]>
  getZSet: (id: string, key: string) => Promise<Array<{ member: string; score: number }>>
  deleteKeys: (id: string, keys: string[]) => Promise<{ success: boolean }>
  renameKey: (id: string, oldKey: string, newKey: string) => Promise<{ success: boolean }>
  setKeyTTL: (id: string, key: string, ttl: number) => Promise<{ success: boolean }>
  getKeyTTL: (id: string, key: string) => Promise<number>

  // 服务器信息
  getServerInfo: (id: string) => Promise<Record<string, string>>
  getDbSize: (id: string) => Promise<number>
  executeCommand: (id: string, command: string) => Promise<any>

  // 窗口管理
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void

  // 菜单事件
  onMenuEvent: (channel: string, listener: (...args: unknown[]) => void) => void
  removeMenuEventListener: (channel: string, listener: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
