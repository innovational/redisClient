<template>
  <div class="server-info">
    <!-- 无连接状态 -->
    <div v-if="!connectionStore.activeConnection" class="empty-state">
      <el-empty description="未连接服务器" />
    </div>

    <!-- 服务器信息 -->
    <div v-else class="info-content">
      <div class="info-header">
        <span>服务器信息</span>
        <el-button size="small" @click="handleRefresh">
          刷新
        </el-button>
      </div>

      <!-- 连接信息 -->
      <div class="info-section">
        <h4>连接信息</h4>
        <div class="info-item">
          <span class="label">状态：</span>
          <el-tag type="success" size="small">已连接</el-tag>
        </div>
        <div class="info-item">
          <span class="label">名称：</span>
          <span>{{ connectionStore.activeConnection.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">地址：</span>
          <span>{{ connectionStore.activeConnection.host }}:{{ connectionStore.activeConnection.port }}</span>
        </div>
        <div class="info-item">
          <span class="label">数据库：</span>
          <span>{{ connectionStore.activeConnection.db || 0 }}</span>
        </div>
      </div>

      <!-- 服务器统计信息 -->
      <div class="info-section">
        <h4>服务器统计</h4>
        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <template v-else>
          <div class="info-item">
            <span class="label">Redis 版本：</span>
            <span>{{ serverInfo.redis_version || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">运行时间：</span>
            <span>{{ formatUptime(serverInfo.uptime_in_seconds) }}</span>
          </div>
          <div class="info-item">
            <span class="label">客户端连接数：</span>
            <span>{{ serverInfo.connected_clients || '0' }}</span>
          </div>
          <div class="info-item">
            <span class="label">内存使用：</span>
            <span>{{ formatMemory(serverInfo.used_memory_human) }}</span>
          </div>
          <div class="info-item">
            <span class="label">键数量：</span>
            <span>{{ dbSize }}</span>
          </div>
        </template>
      </div>

      <!-- 数据库选择 -->
      <div class="info-section">
        <h4>数据库选择</h4>
        <el-select
          v-model="selectedDb"
          size="small"
          @change="handleDbChange"
        >
          <el-option
            v-for="i in 16"
            :key="i - 1"
            :label="`DB ${i - 1}`"
            :value="i - 1"
          />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useConnectionStore } from '@/stores/connection'
import { useKeyStore } from '@/stores/key'
import { ElMessage } from 'element-plus'

const connectionStore = useConnectionStore()
const keyStore = useKeyStore()

// 服务器信息
const serverInfo = ref<Record<string, string>>({})

// 数据库大小
const dbSize = ref(0)

// 加载状态
const loading = ref(false)

// 选中的数据库
const selectedDb = ref(0)

/**
 * 加载服务器信息
 */
const loadServerInfo = async (): Promise<void> => {
  if (!connectionStore.activeConnectionId) {
    return
  }

  loading.value = true
  try {
    serverInfo.value = await window.electronAPI.getServerInfo(connectionStore.activeConnectionId)
    dbSize.value = await window.electronAPI.getDbSize(connectionStore.activeConnectionId)
  } catch (error) {
    console.error('加载服务器信息失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 刷新服务器信息
 */
const handleRefresh = async (): Promise<void> => {
  await loadServerInfo()
  // 刷新键列表
  if (connectionStore.activeConnectionId) {
    await keyStore.refreshKeys(connectionStore.activeConnectionId)
  }
}

/**
 * 切换数据库
 */
const handleDbChange = async (db: number): Promise<void> => {
  // 断开当前连接并重新连接，切换到新数据库
  const connId = connectionStore.activeConnectionId
  if (!connId) {
    return
  }

  try {
    // 更新连接配置
    const conn = connectionStore.activeConnection
    if (conn) {
      await connectionStore.disconnect(connId)
      conn.db = db
      await connectionStore.connect(connId)
      await loadServerInfo()
    }
  } catch (error) {
    ElMessage.error('切换数据库失败')
    console.error(error)
  }
}

/**
 * 格式化运行时间
 */
const formatUptime = (seconds: string | undefined): string => {
  if (!seconds) {
    return 'N/A'
  }

  const secs = parseInt(seconds)
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  const minutes = Math.floor((secs % 3600) / 60)

  if (days > 0) {
    return `${days} 天 ${hours} 小时`
  }
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`
  }
  return `${minutes} 分钟`
}

/**
 * 格式化内存
 */
const formatMemory = (memory: string | undefined): string => {
  return memory || 'N/A'
}

// 监听连接变化，加载服务器信息
watch(
  () => connectionStore.activeConnectionId,
  async (newId) => {
    if (newId) {
      selectedDb.value = connectionStore.activeConnection?.db || 0
      await loadServerInfo()
    } else {
      serverInfo.value = {}
      dbSize.value = 0
    }
  }
)

// 组件挂载时加载数据
onMounted(async () => {
  if (connectionStore.activeConnectionId) {
    await loadServerInfo()
  }
})
</script>

<style scoped>
.server-info {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.info-header {
  padding: 15px;
  border-bottom: 1px solid #e4e4e4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
}

.info-section {
  padding: 15px;
  border-bottom: 1px solid #e4e4e4;
}

.info-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item .label {
  color: #666;
  min-width: 90px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
}
</style>
