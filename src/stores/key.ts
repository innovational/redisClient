import { defineStore } from 'pinia'
import { ref } from 'vue'

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
 * 键信息接口
 */
export interface KeyInfo {
  name: string
  type: RedisKeyType
}

/**
 * 键值数据状态管理
 * 负责管理当前连接的键列表和选中键的数据
 */
export const useKeyStore = defineStore('key', () => {
  // 键列表
  const keys = ref<KeyInfo[]>([])

  // 当前选中的键名
  const selectedKey = ref<string | null>(null)

  // 当前选中的键类型
  const selectedKeyType = ref<RedisKeyType>(RedisKeyType.NONE)

  // SCAN 游标位置
  const scanCursor = ref(0)

  // 是否还有更多数据可加载
  const hasMore = ref(true)

  // 加载状态
  const loading = ref(false)

  // 搜索模式
  const searchPattern = ref('*')

  // 每页加载数量
  const pageSize = ref(100)

  /**
   * 加载键列表（SCAN 分页）
   * @param connectionId 连接 ID
   * @param append 是否追加模式
   */
  const loadKeys = async (connectionId: string, append = false): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true

    try {
      const result = await window.electronAPI.scanKeys(
        connectionId,
        scanCursor.value,
        searchPattern.value,
        pageSize.value
      )

      // 获取每个键的类型
      const keyInfos: KeyInfo[] = []
      for (const key of result.keys) {
        const type = await window.electronAPI.getKeyType(connectionId, key)
        keyInfos.push({ name: key, type })
      }

      if (append) {
        keys.value.push(...keyInfos)
      } else {
        keys.value = keyInfos
      }

      scanCursor.value = result.cursor
      hasMore.value = result.cursor !== 0
    } catch (error) {
      console.error('加载键列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新键列表
   * @param connectionId 连接 ID
   */
  const refreshKeys = async (connectionId: string): Promise<void> => {
    scanCursor.value = 0
    hasMore.value = true
    await loadKeys(connectionId, false)
  }

  /**
   * 加载更多键（分页加载）
   * @param connectionId 连接 ID
   */
  const loadMoreKeys = async (connectionId: string): Promise<void> => {
    if (!hasMore.value || loading.value) {
      return
    }
    await loadKeys(connectionId, true)
  }

  /**
   * 选中键
   * @param keyName 键名
   */
  const selectKey = async (connectionId: string, keyName: string): Promise<void> => {
    const type = await window.electronAPI.getKeyType(connectionId, keyName)
    selectedKey.value = keyName
    selectedKeyType.value = type
  }

  /**
   * 清空选中状态
   */
  const clearSelection = (): void => {
    selectedKey.value = null
    selectedKeyType.value = RedisKeyType.NONE
  }

  /**
   * 设置搜索模式
   * @param pattern 匹配模式
   */
  const setSearchPattern = (pattern: string): void => {
    searchPattern.value = pattern || '*'
  }

  /**
   * 删除键
   * @param connectionId 连接 ID
   * @param keyNames 键名数组
   */
  const deleteKeys = async (connectionId: string, keyNames: string[]): Promise<void> => {
    await window.electronAPI.deleteKeys(connectionId, keyNames)

    // 从列表中移除被删除的键
    keys.value = keys.value.filter(key => !keyNames.includes(key.name))

    // 如果删除的是当前选中的键，清空选择
    if (selectedKey.value && keyNames.includes(selectedKey.value)) {
      clearSelection()
    }
  }

  /**
   * 重命名键
   * @param connectionId 连接 ID
   * @param oldKey 原键名
   * @param newKey 新键名
   */
  const renameKey = async (
    connectionId: string,
    oldKey: string,
    newKey: string
  ): Promise<void> => {
    await window.electronAPI.renameKey(connectionId, oldKey, newKey)

    // 更新键列表中的键名
    const keyInfo = keys.value.find(k => k.name === oldKey)
    if (keyInfo) {
      keyInfo.name = newKey
    }

    // 如果重命名的是当前选中的键，更新选择
    if (selectedKey.value === oldKey) {
      selectedKey.value = newKey
    }
  }

  /**
   * 清空所有键数据
   */
  const clearKeys = (): void => {
    keys.value = []
    scanCursor.value = 0
    hasMore.value = true
    selectedKey.value = null
    selectedKeyType.value = RedisKeyType.NONE
  }

  return {
    keys,
    selectedKey,
    selectedKeyType,
    hasMore,
    loading,
    searchPattern,
    loadKeys,
    refreshKeys,
    loadMoreKeys,
    selectKey,
    clearSelection,
    setSearchPattern,
    deleteKeys,
    renameKey,
    clearKeys
  }
})
