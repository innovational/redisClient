<template>
  <div class="hash-editor">
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
import { ref, onMounted } from 'vue'
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

/**
 * 组件挂载时加载数据
 */
onMounted(async () => {
  await loadData()
})

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
</script>

<style scoped>
.hash-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
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
