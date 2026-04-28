<template>
  <div class="list-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button size="small" type="primary" @click="handleAddItem">
        添加元素
      </el-button>
      <el-button size="small" type="success" @click="handleSave">
        保存
      </el-button>
    </div>

    <!-- 列表元素 -->
    <div class="list-content">
      <el-table :data="items" border size="small" max-height="400">
        <el-table-column label="索引" prop="index" width="80" />
        <el-table-column label="值" min-width="400">
          <template #default="{ row }">
            <el-input v-model="row.value" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteItem($index)"
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

// 列表元素
interface ListItem {
  index: number
  value: string
}

const items = ref<ListItem[]>([])

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
    const result = await window.electronAPI.getList(props.connectionId, props.keyName)
    items.value = result.map((value, index) => ({
      index,
      value
    }))
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

/**
 * 添加新元素
 */
const handleAddItem = (): void => {
  items.value.push({
    index: items.value.length,
    value: ''
  })
}

/**
 * 删除元素
 */
const handleDeleteItem = (index: number): void => {
  items.value.splice(index, 1)
  // 重新索引
  items.value.forEach((item, i) => {
    item.index = i
  })
}

/**
 * 保存所有更改
 */
const handleSave = async (): Promise<void> => {
  try {
    const values = items.value.map(item => item.value).filter(v => v !== '')
    await window.electronAPI.setList(props.connectionId, props.keyName, values)
    ElMessage.success('保存成功')
    await loadData()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}
</script>

<style scoped>
.list-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.toolbar {
  display: flex;
  gap: 10px;
}

.list-content {
  flex: 1;
  overflow: auto;
}
</style>
