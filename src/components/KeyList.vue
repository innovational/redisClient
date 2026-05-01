<template>
  <div class="key-list-panel">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <el-select
          v-model="searchMode"
          class="search-mode-select"
        >
          <el-option label="包含" value="contains" />
          <el-option label="前缀" value="prefix" />
          <el-option label="后缀" value="suffix" />
        </el-select>
        <el-input
          v-model="searchPattern"
          size="small"
          placeholder="搜索键名"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      <div class="search-actions">
        <el-button  @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button type="primary" @click="handleAddKey">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
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
          <div class="key-item-actions" @click.stop>
            <el-button
              size="small"
              link
              @click="handleDeleteKey(key.name)"
            >
              <el-icon class="delete-icon"><Delete /></el-icon>
            </el-button>
          </div>
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

    <!-- 添加键对话框 -->
    <el-dialog
      v-model="showAddKeyDialog"
      title="新建键"
      width="450px"
      @close="handleCloseAddKeyDialog"
    >
      <el-form
        ref="addKeyFormRef"
        :model="addKeyForm"
        :rules="addKeyRules"
        label-width="80px"
      >
        <el-form-item label="键名" prop="keyName">
          <el-input
            v-model="addKeyForm.keyName"
            placeholder="请输入键名"
          />
        </el-form-item>
        <el-form-item label="类型" prop="keyType">
          <el-select v-model="addKeyForm.keyType">
            <el-option label="String" :value="RedisKeyType.STRING" />
            <el-option label="Hash" :value="RedisKeyType.HASH" />
            <el-option label="List" :value="RedisKeyType.LIST" />
            <el-option label="Set" :value="RedisKeyType.SET" />
            <el-option label="ZSet" :value="RedisKeyType.ZSET" />
          </el-select>
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input
            v-model="addKeyForm.value"
            type="textarea"
            :rows="3"
            placeholder="请输入值（String类型）"
          />
        </el-form-item>
        <el-form-item label="过期时间（秒）">
          <el-input-number
            v-model="addKeyForm.ttl"
            :min="-1"
            :max="86400 * 365 * 10"
            size="small"
          />
          <span class="ttl-hint">-1表示永不过期</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseAddKeyDialog">取消</el-button>
        <el-button type="primary" @click="handleCreateKey">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Search, Refresh, Loading, Plus, Delete } from '@element-plus/icons-vue'
import { useKeyStore, RedisKeyType } from '@/stores/key'
import { useConnectionStore } from '@/stores/connection'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'

const keyStore = useKeyStore()
const connectionStore = useConnectionStore()

// 搜索模式
const searchMode = ref<'contains' | 'prefix' | 'suffix'>('contains')

// 搜索关键词
const searchPattern = ref('')

// 列表引用
const listRef = ref<HTMLElement | null>(null)

// 添加键对话框
const showAddKeyDialog = ref(false)
const addKeyFormRef = ref<FormInstance>()
const addKeyForm = ref({
  keyName: '',
  keyType: RedisKeyType.STRING,
  value: '',
  ttl: -1
})

// 添加键表单验证规则
const addKeyRules: FormRules = {
  keyName: [
    { required: true, message: '请输入键名', trigger: 'blur' }
  ],
  keyType: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ]
}

/**
 * 根据搜索模式构建 Redis SCAN 模式
 */
const buildScanPattern = (keyword: string, mode: 'contains' | 'prefix' | 'suffix'): string => {
  if (!keyword) {
    return '*'
  }
  switch (mode) {
    case 'prefix':
      return `${keyword}*`
    case 'suffix':
      return `*${keyword}`
    case 'contains':
    default:
      return `*${keyword}*`
  }
}

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
  const pattern = buildScanPattern(searchPattern.value, searchMode.value)
  keyStore.setSearchPattern(pattern)
  await loadKeys(false)
}

/**
 * 刷新键列表
 */
const handleRefresh = async (): Promise<void> => {
  const pattern = buildScanPattern(searchPattern.value, searchMode.value)
  keyStore.setSearchPattern(pattern)
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

/**
 * 打开添加键对话框
 */
const handleAddKey = (): void => {
  showAddKeyDialog.value = true
}

/**
 * 关闭添加键对话框
 */
const handleCloseAddKeyDialog = (): void => {
  showAddKeyDialog.value = false
  addKeyForm.value = {
    keyName: '',
    keyType: RedisKeyType.STRING,
    value: '',
    ttl: -1
  }
  addKeyFormRef.value?.resetFields()
}

/**
 * 创建键
 */
const handleCreateKey = async (): Promise<void> => {
  try {
    await addKeyFormRef.value?.validate()

    if (!connectionStore.activeConnectionId) {
      ElMessage.error('请先选择连接')
      return
    }

    // 根据类型创建键
    switch (addKeyForm.value.keyType) {
      case RedisKeyType.STRING:
        await window.electronAPI.setString(
          connectionStore.activeConnectionId,
          addKeyForm.value.keyName,
          addKeyForm.value.value,
          addKeyForm.value.ttl > 0 ? addKeyForm.value.ttl : undefined
        )
        break
      case RedisKeyType.HASH:
        // Hash 类型创建一个空键或设置一个默认字段
        await window.electronAPI.setHashField(
          connectionStore.activeConnectionId,
          addKeyForm.value.keyName,
          'default',
          addKeyForm.value.value || ''
        )
        break
      case RedisKeyType.LIST:
        // List 类型
        const listValues = addKeyForm.value.value ? addKeyForm.value.value.split('\n') : []
        await window.electronAPI.setList(
          connectionStore.activeConnectionId,
          addKeyForm.value.keyName,
          listValues
        )
        break
      case RedisKeyType.SET:
        // Set 类型
        const setValues = addKeyForm.value.value ? addKeyForm.value.value.split('\n').filter(v => v.trim()) : []
        if (setValues.length > 0) {
          await window.electronAPI.executeCommand(
            connectionStore.activeConnectionId,
            `SADD ${addKeyForm.value.keyName} ${setValues.join(' ')}`
          )
        }
        break
      case RedisKeyType.ZSET:
        // ZSet 类型（简单处理，默认分数为0）
        await window.electronAPI.executeCommand(
          connectionStore.activeConnectionId,
          `ZADD ${addKeyForm.value.keyName} 0 "${addKeyForm.value.value}"`
        )
        break
    }

    ElMessage.success('创建成功')
    handleCloseAddKeyDialog()
    await handleRefresh()
  } catch (error) {
    ElMessage.error('创建失败')
    console.error(error)
  }
}

/**
 * 删除单个键
 */
const handleDeleteKey = async (keyName: string): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除键 "${keyName}" 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (!connectionStore.activeConnectionId) {
      return
    }

    await keyStore.deleteKeys(connectionStore.activeConnectionId, [keyName])
    ElMessage.success('删除成功')
  } catch {
    // 用户取消操作
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

// 监听搜索模式变化
watch(searchMode, () => {
  handleSearch()
})

// 组件挂载时加载数据
onMounted(async () => {
  if (connectionStore.activeConnectionId) {
    await loadKeys(false)
  }
})
</script>

<style scoped>
.el-button+.el-button {
    margin-left: 5px;
}
.key-list-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e4e4e4;
}

.search-input-wrapper {
  display: flex;
    align-items: center;
  gap: 5px;
  flex: 1;
}

.search-mode-select {
  width: 80px;
}

.search-actions {
  display: flex;
  gap: 3px;
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

.key-item:hover .key-item-actions {
  display: flex;
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
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-item-actions {
  display: none;
}

.delete-icon {
  color: #f56c6c;
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

.ttl-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>