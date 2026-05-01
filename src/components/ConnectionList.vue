<template>
  <div class="connection-list">
    <!-- 连接列表头部 -->
    <div class="list-header">
      <span>连接列表</span>
    </div>

    <!-- 连接列表 -->
    <div class="list-content">
      <el-scrollbar>
        <div
          v-for="conn in connectionStore.connections"
          :key="conn.id"
          class="connection-item"
          :class="{ active: conn.id === connectionStore.activeConnectionId }"
          @click="handleConnectionClick(conn)"
        >
          <!-- 连接图标和名称 -->
          <div class="connection-info">
            <el-icon class="connection-icon" :class="{ connected: conn.connected }">
              <Connection />
            </el-icon>
            <span class="connection-name">{{ conn.name }}</span>
          </div>

          <!-- 连接操作按钮 -->
          <div class="connection-actions" @click.stop>
            <!-- 连接/断开按钮 -->
            <el-button
              v-if="!conn.connected"
              type="success"
              size="small"
              circle
              @click="handleConnect(conn.id)"
              :loading="connectingId === conn.id"
            >
              <el-icon><Connection /></el-icon>
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              circle
              @click="handleDisconnect(conn.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>

            <!-- 编辑按钮 -->
            <el-button
              type="info"
              size="small"
              circle
              @click="handleEdit(conn)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>

            <!-- 删除按钮 -->
            <el-button
              type="danger"
              size="small"
              circle
              @click="handleDelete(conn.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>

  <!-- 编辑连接对话框 -->
  <ConnectionDialog
    v-model:visible="showEditDialog"
    :edit-connection="editingConnection"
    @updated="handleConnectionUpdated"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Connection, Delete, Close, Edit } from '@element-plus/icons-vue'
import { useConnectionStore, ConnectionConfig } from '@/stores/connection'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConnectionDialog from './ConnectionDialog.vue'

const connectionStore = useConnectionStore()

// 当前正在连接的 ID
const connectingId = ref<string | null>(null)

// 编辑对话框相关
const showEditDialog = ref(false)
const editingConnection = ref<ConnectionConfig | null>(null)

/**
 * 组件挂载时加载连接列表
 */
onMounted(async () => {
  await connectionStore.loadConnections()
})

/**
 * 处理连接项点击
 * 如果已连接，则选中该连接
 */
const handleConnectionClick = async (conn: ConnectionConfig): Promise<void> => {
  if (conn.connected) {
    connectionStore.selectConnection(conn.id)
  }
}

/**
 * 连接到 Redis 服务器
 */
const handleConnect = async (id: string): Promise<void> => {
  connectingId.value = id
  try {
    const success = await connectionStore.connect(id)
    if (success) {
      ElMessage.success('连接成功')
    } else {
      const conn = connectionStore.connections.find(c => c.id === id)
      ElMessage.error(conn?.error || '连接失败')
    }
  } finally {
    connectingId.value = null
  }
}

/**
 * 断开连接
 */
const handleDisconnect = async (id: string): Promise<void> => {
  await connectionStore.disconnect(id)
  ElMessage.info('已断开连接')
}

/**
 * 编辑连接
 */
const handleEdit = (conn: ConnectionConfig): void => {
  editingConnection.value = conn
  showEditDialog.value = true
}

/**
 * 连接更新后的处理
 */
const handleConnectionUpdated = (): void => {
  showEditDialog.value = false
  editingConnection.value = null
}

/**
 * 删除连接
 */
const handleDelete = async (id: string): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此连接吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await connectionStore.deleteConnection(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.connection-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  height: 40px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e4e4e4;
  font-weight: 500;
  color: #333;
}

.list-content {
  flex: 1;
  overflow: hidden;
}

.connection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.connection-item:hover {
  background-color: #f5f5f5;
}

.connection-item.active {
  background-color: #ecf5ff;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connection-icon {
  font-size: 16px;
  color: #909399;
}

.connection-icon.connected {
  color: #67c23a;
}

.connection-name {
  font-size: 14px;
  color: #333;
}

.connection-actions {
  display: flex;
  gap: 5px;
}
</style>