<template>
  <div class="hash-editor">
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
      <el-button size="small" type="primary" @click="handleAddField">
        添加字段
      </el-button>
      <el-button size="small" type="success" @click="handleSave">
        保存
      </el-button>
    </div>

    <!-- 字段列表 -->
    <div class="field-list">
      <el-table :data="fields" border size="small" max-height="400">
        <el-table-column label="字段名" prop="field" width="200">
          <template #default="{ row }">
            <el-input v-model="row.field" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="值" min-width="300">
          <template #default="{ row }">
            <el-input v-model="row.value" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteField($index)"
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

// 字段列表
interface HashField {
  field: string
  value: string
  isNew?: boolean
}

const fields = ref<HashField[]>([])

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
    const result = await window.electronAPI.getHash(props.connectionId, props.keyName)
    fields.value = Object.entries(result).map(([field, value]) => ({
      field,
      value
    }))

    // 获取 TTL
    currentTTL.value = await window.electronAPI.getKeyTTL(props.connectionId, props.keyName)
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

/**
 * 添加新字段
 */
const handleAddField = (): void => {
  fields.value.push({
    field: '',
    value: '',
    isNew: true
  })
}

/**
 * 删除字段
 */
const handleDeleteField = async (index: number): Promise<void> => {
  const field = fields.value[index]

  if (!field.isNew) {
    // 如果是已存在的字段，需要从 Redis 删除
    try {
      await window.electronAPI.deleteHashFields(props.connectionId, props.keyName, [field.field])
    } catch (error) {
      ElMessage.error('删除字段失败')
      console.error(error)
      return
    }
  }

  fields.value.splice(index, 1)
}

/**
 * 保存所有更改
 */
const handleSave = async (): Promise<void> => {
  try {
    // 保存所有字段
    for (const field of fields.value) {
      if (field.field && field.value) {
        await window.electronAPI.setHashField(
          props.connectionId,
          props.keyName,
          field.field,
          field.value
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
.hash-editor {
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

.field-list {
  flex: 1;
  overflow: auto;
}
</style>
