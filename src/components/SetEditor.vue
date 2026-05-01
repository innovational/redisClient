<template>
  <div class="set-editor">
    <!-- TTL 设置 -->
    <div class="ttl-section">
      <span>过期时间：</span>
      <el-input-number
        v-model="ttl"
        :min="-1"
        :max="86400 * 365 * 10"
        size="small"
        controls-position="right"
      />
      <span class="ttl-unit">秒</span>
      <el-button size="small" @click="handleSetTTL">设置</el-button>
      <span v-if="currentTTL > 0" class="current-ttl">
        剩余：{{ currentTTL }} 秒
      </span>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button size="small" type="primary" @click="handleAddMember">
        添加成员
      </el-button>
      <el-button size="small" type="success" @click="handleSave">
        保存
      </el-button>
    </div>

    <!-- 成员列表 -->
    <div class="member-list">
      <el-table :data="members" border size="small" max-height="400">
        <el-table-column label="成员" min-width="400">
          <template #default="{ row }">
            <el-input v-model="row.value" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteMember($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  connectionId: string
  keyName: string
}>()

// 成员列表
interface SetMember {
  value: string
  isNew?: boolean
}

const members = ref<SetMember[]>([])

// TTL 值
const ttl = ref(-1)

// 当前 TTL
const currentTTL = ref(-1)

/**
 * 组件挂载时加载数据
 */
onMounted(async () => {
  await loadData()
})

/**
 * 监听 keyName 属性变化，重新加载数据
 */
watch(
  () => props.keyName,
  async () => {
    await loadData()
  }
)

/**
 * 加载数据
 */
const loadData = async (): Promise<void> => {
  try {
    const result = await window.electronAPI.getSet(props.connectionId, props.keyName)
    members.value = result.map(value => ({ value }))

    // 获取 TTL
    currentTTL.value = await window.electronAPI.getKeyTTL(props.connectionId, props.keyName)
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

/**
 * 添加新成员
 */
const handleAddMember = (): void => {
  members.value.push({
    value: '',
    isNew: true
  })
}

/**
 * 删除成员
 */
const handleDeleteMember = async (index: number): Promise<void> => {
  const member = members.value[index]

  if (!member.isNew) {
    // 如果是已存在的成员，需要从 Redis 删除
    try {
      await window.electronAPI.deleteKeys(props.connectionId, [member.value])
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
      return
    }
  }

  members.value.splice(index, 1)
}

/**
 * 保存所有更改
 */
const handleSave = async (): Promise<void> => {
  try {
    // 先删除所有旧成员
    const originalMembers = await window.electronAPI.getSet(props.connectionId, props.keyName)
    if (originalMembers.length > 0) {
      await window.electronAPI.deleteKeys(props.connectionId, originalMembers)
    }

    // 添加新成员
    const newMembers = members.value
      .filter(m => m.value !== '')
      .map(m => m.value)

    if (newMembers.length > 0) {
      // 使用 SADD 命令添加成员
      for (const member of newMembers) {
        await window.electronAPI.executeCommand(
          props.connectionId,
          `SADD ${props.keyName} "${member}"`
        )
      }
    }

    ElMessage.success('保存成功')
    await loadData()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

/**
 * 设置 TTL
 */
const handleSetTTL = async (): Promise<void> => {
  try {
    if (ttl.value === -1) {
      // -1 表示永不过期
      await window.electronAPI.setKeyTTL(props.connectionId, props.keyName, -1)
      currentTTL.value = -1
    } else {
      await window.electronAPI.setKeyTTL(props.connectionId, props.keyName, ttl.value)
      currentTTL.value = ttl.value
    }
    ElMessage.success('设置成功')
  } catch (error) {
    ElMessage.error('设置失败')
    console.error(error)
  }
}
</script>

<style scoped>
.set-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ttl-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.ttl-unit {
  color: #666;
}

.current-ttl {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.toolbar {
  display: flex;
  gap: 10px;
}

.member-list {
  flex: 1;
  overflow: auto;
}
</style>
