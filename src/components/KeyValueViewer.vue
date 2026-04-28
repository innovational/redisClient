<template>
  <div class="key-value-viewer">
    <!-- 无连接状态 -->
    <div v-if="!connectionStore.activeConnection" class="empty-state">
      <el-empty description="请先选择一个连接">
        <el-button type="primary" @click="$emit('newConnection')">
          新建连接
        </el-button>
      </el-empty>
    </div>

    <!-- 无选中键状态 -->
    <div
      v-else-if="!keyStore.selectedKey"
      class="empty-state"
    >
      <el-empty description="请从左侧选择一个键" />
    </div>

    <!-- 键值内容显示 -->
    <div v-else class="key-content">
      <!-- 键信息头部 -->
      <div class="key-header">
        <div class="key-info">
          <span class="key-name">{{ keyStore.selectedKey }}</span>
          <el-tag size="small" :type="getKeyTypeTag(keyStore.selectedKeyType)">
            {{ keyStore.selectedKeyType }}
          </el-tag>
        </div>
        <div class="key-actions">
          <el-button size="small" @click="handleRename">重命名</el-button>
          <el-button size="small" type="danger" @click="handleDelete">删除</el-button>
        </div>
      </div>

      <!-- 根据类型显示不同的编辑器 -->
      <div class="key-editor">
        <!-- String 类型 -->
        <StringEditor
          v-if="keyStore.selectedKeyType === RedisKeyType.STRING"
          :connection-id="connectionStore.activeConnectionId!"
          :key-name="keyStore.selectedKey"
        />

        <!-- Hash 类型 -->
        <HashEditor
          v-else-if="keyStore.selectedKeyType === RedisKeyType.HASH"
          :connection-id="connectionStore.activeConnectionId!"
          :key-name="keyStore.selectedKey"
        />

        <!-- List 类型 -->
        <ListEditor
          v-else-if="keyStore.selectedKeyType === RedisKeyType.LIST"
          :connection-id="connectionStore.activeConnectionId!"
          :key-name="keyStore.selectedKey"
        />

        <!-- Set 类型 -->
        <SetEditor
          v-else-if="keyStore.selectedKeyType === RedisKeyType.SET"
          :connection-id="connectionStore.activeConnectionId!"
          :key-name="keyStore.selectedKey"
        />

        <!-- ZSet 类型 -->
        <ZSetEditor
          v-else-if="keyStore.selectedKeyType === RedisKeyType.ZSET"
          :connection-id="connectionStore.activeConnectionId!"
          :key-name="keyStore.selectedKey"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConnectionStore } from '@/stores/connection'
import { useKeyStore, RedisKeyType } from '@/stores/key'
import StringEditor from './StringEditor.vue'
import HashEditor from './HashEditor.vue'
import ListEditor from './ListEditor.vue'
import SetEditor from './SetEditor.vue'
import ZSetEditor from './ZSetEditor.vue'

defineEmits<{
  (e: 'newConnection'): void
}>()

const connectionStore = useConnectionStore()
const keyStore = useKeyStore()

/**
 * 根据键类型返回对应的 Tag 类型
 */
const getKeyTypeTag = (type: RedisKeyType): string => {
  switch (type) {
    case RedisKeyType.STRING:
      return 'success'
    case RedisKeyType.HASH:
      return 'warning'
    case RedisKeyType.LIST:
      return 'info'
    case RedisKeyType.SET:
      return 'danger'
    case RedisKeyType.ZSET:
      return ''
    default:
      return 'info'
  }
}

/**
 * 处理重命名
 */
const handleRename = async (): Promise<void> => {
  if (!keyStore.selectedKey) {
    return
  }

  try {
    const newName = await ElMessageBox.prompt(
      '请输入新的键名',
      '重命名键',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: keyStore.selectedKey
      }
    )

    await keyStore.renameKey(
      connectionStore.activeConnectionId!,
      keyStore.selectedKey,
      newName.value
    )

    ElMessage.success('重命名成功')
  } catch {
    // 用户取消操作
  }
}

/**
 * 处理删除
 */
const handleDelete = async (): Promise<void> => {
  if (!keyStore.selectedKey) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除键 "${keyStore.selectedKey}" 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await keyStore.deleteKeys(
      connectionStore.activeConnectionId!,
      [keyStore.selectedKey]
    )

    ElMessage.success('删除成功')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.key-value-viewer {
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

.key-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.key-header {
  padding: 15px;
  border-bottom: 1px solid #e4e4e4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.key-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.key-actions {
  display: flex;
  gap: 10px;
}

.key-editor {
  flex: 1;
  overflow: auto;
  padding: 15px;
}
</style>
