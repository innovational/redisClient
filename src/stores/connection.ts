import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 连接配置接口
 */
export interface ConnectionConfig {
  id: string
  name: string
  host: string
  port: number
  password?: string
  db?: number
  connected: boolean
  error?: string
}

/**
 * Redis 连接状态管理
 * 负责管理所有 Redis 连接的状态和信息
 */
export const useConnectionStore = defineStore('connection', () => {
  // 所有连接的配置列表
  const connections = ref<ConnectionConfig[]>([])

  // 当前选中的连接 ID
  const activeConnectionId = ref<string | null>(null)

  // 当前选中的连接
  const activeConnection = computed(() => {
    return connections.value.find(conn => conn.id === activeConnectionId.value) || null
  })

  // 加载所有连接
  const loadConnections = async (): Promise<void> => {
    try {
      const storedConnections = await window.electronAPI.getConnections()
      connections.value = Object.entries(storedConnections).map(([id, config]) => ({
        id,
        name: config.name,
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        connected: false
      }))
    } catch (error) {
      console.error('加载连接失败:', error)
    }
  }

  // 保存新连接
  const saveConnection = async (config: Omit<ConnectionConfig, 'id' | 'connected'>): Promise<string> => {
    const id = `conn_${Date.now()}`
    await window.electronAPI.saveConnection(id, {
      name: config.name,
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db
    })

    connections.value.push({
      ...config,
      id,
      connected: false
    })

    return id
  }

  // 更新连接配置
  const updateConnection = async (id: string, config: Omit<ConnectionConfig, 'id' | 'connected'>): Promise<void> => {
    const connection = connections.value.find(conn => conn.id === id)
    if (!connection) {
      return
    }

    // 如果当前连接已连接，先断开
    if (connection.connected) {
      await disconnect(id)
    }

    // 更新配置
    await window.electronAPI.saveConnection(id, {
      name: config.name,
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db
    })

    // 更新内存中的配置
    connection.name = config.name
    connection.host = config.host
    connection.port = config.port
    connection.password = config.password
    connection.db = config.db
  }

  // 删除连接
  const deleteConnection = async (id: string): Promise<void> => {
    // 如果是当前活动连接，先断开
    if (activeConnectionId.value === id) {
      await disconnect(id)
      activeConnectionId.value = null
    }

    await window.electronAPI.deleteConnection(id)
    connections.value = connections.value.filter(conn => conn.id !== id)
  }

  // 连接到 Redis
  const connect = async (id: string): Promise<boolean> => {
    const connection = connections.value.find(conn => conn.id === id)
    if (!connection) {
      return false
    }

    try {
      const result = await window.electronAPI.connect(id, {
        host: connection.host,
        port: connection.port,
        password: connection.password,
        db: connection.db
      })

      if (result.success) {
        connection.connected = true
        connection.error = undefined
        activeConnectionId.value = id
      } else {
        connection.error = result.error
      }

      return result.success
    } catch (error) {
      connection.error = error instanceof Error ? error.message : '连接失败'
      return false
    }
  }

  // 断开连接
  const disconnect = async (id: string): Promise<void> => {
    const connection = connections.value.find(conn => conn.id === id)
    if (!connection) {
      return
    }

    await window.electronAPI.disconnect(id)
    connection.connected = false

    if (activeConnectionId.value === id) {
      activeConnectionId.value = null
    }
  }

  // 切换连接（断开其他连接）
  const switchConnection = async (id: string): Promise<boolean> => {
    const connection = connections.value.find(conn => conn.id === id)
    if (!connection) {
      return false
    }

    try {
      const result = await window.electronAPI.switchConnection(id, {
        host: connection.host,
        port: connection.port,
        password: connection.password,
        db: connection.db
      })

      if (result.success) {
        // 更新所有连接状态
        connections.value.forEach(conn => {
          conn.connected = conn.id === id
        })
        activeConnectionId.value = id
      } else {
        connection.error = result.error
      }

      return result.success
    } catch (error) {
      connection.error = error instanceof Error ? error.message : '连接失败'
      return false
    }
  }

  // 选中连接
  const selectConnection = (id: string | null): void => {
    activeConnectionId.value = id
  }

  return {
    connections,
    activeConnectionId,
    activeConnection,
    loadConnections,
    saveConnection,
    updateConnection,
    deleteConnection,
    connect,
    disconnect,
    switchConnection,
    selectConnection
  }
})
