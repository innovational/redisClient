<template>
  <div class="key-list-panel">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchPattern"
        size="small"
        placeholder="键搜索模式 (如: user*)"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
      <el-button size="small" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <!-- 键列表 -->
    <div class="key-list" ref="listRef" @scroll="handleScroll">
      <el-scrollbar>
        <!-- 键统计信息 -->
        <div class="key-stats">
          <span>共 {{ keyStore.keys.length }} 个键</span>
          <span v-if="keyStore.hasMore" class="load-more-hint">
            滚动加载更多...
          </span>
        </div>

        <!-- 键列表 -->
        <div
          v-for="key in keyStore.keys"
          :key="key.name"
          class="key-item"
          :class="{ active: key.name === keyStore.selectedKey }"
          @click="handleKeyClick(key.name)"
        >
          <span class="key-icon" :class="key.type">
            {{ getTypeIcon(key.type) }}
          </span>
          <span class="key-name">{{ key.name }}</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="keyStore.loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 无键提示 -->
        <div v-if="!keyStore.loading && keyStore.keys.length === 0" class="empty">
          <span>没有找到键</span>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Search, Refresh, Loading } from '@element-plus/icons-vue'
import { useKeyStore, RedisKeyType } from '@/stores/key'
import { useConnectionStore } from '@/stores/connection'

const keyStore = useKeyStore()
const connectionStore = useConnectionStore()

// 搜索模式
const searchPattern = ref('*')

// 列表引用
const listRef = ref<HTMLElement | null>(null)

/**
 * 加载键列表
 */
const loadKeys = async (append = false): Promise<void> => {
  if (!connectionStore.activeConnectionId) {
    return
  }

  if (append) {
    await keyStore.loadMoreKeys(connectionStore.activeConnectionId)
  } else {
    await keyStore.loadKeys(connectionStore.activeConnectionId, false)
  }
}

/**
 * 搜索键
 */
const handleSearch = async (): Promise<void> => {
  keyStore.setSearchPattern(searchPattern.value)
  await loadKeys(false)
}

/**
 * 刷新键列表
 */
const handleRefresh = async (): Promise<void> => {
  await loadKeys(false)
}

/**
 * 滚动加载更多
 */
const handleScroll = async (event: Event): Promise<void> => {
  const target = event.target as HTMLElement

  // 检测是否滚动到底部
  if (
    target.scrollHeight - target.scrollTop - target.clientHeight < 50 &&
    keyStore.hasMore &&
    !keyStore.loading
  ) {
    await loadKeys(true)
  }
}

/**
 * 点击键
 */
const handleKeyClick = async (keyName: string): Promise<void> => {
  if (!connectionStore.activeConnectionId) {
    return
  }

  await keyStore.selectKey(connectionStore.activeConnectionId, keyName)
}

/**
 * 获取类型图标
 */
const getTypeIcon = (type: RedisKeyType): string => {
  switch (type) {
    case RedisKeyType.STRING:
      return 'S'
    case RedisKeyType.HASH:
      return 'H'
    case RedisKeyType.LIST:
      return 'L'
    case RedisKeyType.SET:
      return 'U'
    case RedisKeyType.ZSET:
      return 'Z'
    default:
      return '?'
  }
}

// 监听连接变化，重新加载键列表
watch(
  () => connectionStore.activeConnectionId,
  async (newId) => {
    if (newId) {
      await loadKeys(false)
    } else {
      keyStore.clearKeys()
    }
  }
)

// 组件挂载时加载数据
onMounted(async () => {
  if (connectionStore.activeConnectionId) {
    await loadKeys(false)
  }
})
</script>

<style scoped>
.key-list-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 10px;
  display: flex;
  gap: 5px;
  border-bottom: 1px solid #e4e4e4;
}

.search-bar .el-input {
  flex: 1;
}

.key-list {
  flex: 1;
  overflow: hidden;
}

.key-stats {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e4e4e4;
}

.load-more-hint {
  color: #409eff;
}

.key-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.key-item:hover {
  background-color: #f5f5f5;
}

.key-item.active {
  background-color: #ecf5ff;
}

.key-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border-radius: 4px;
  margin-right: 8px;
}

.key-icon.string {
  background-color: #e1f3d8;
  color: #67c23a;
}

.key-icon.hash {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.key-icon.list {
  background-color: #f4f4f5;
  color: #909399;
}

.key-icon.set {
  background-color: #fef0f0;
  color: #f56c6c;
}

.key-icon.zset {
  background-color: #ecf5ff;
  color: #409eff;
}

.key-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading,
.empty {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
