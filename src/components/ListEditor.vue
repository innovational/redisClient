<template>
  <div class="list-editor">
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
import { ref, onMounted, watch } from 'vue'
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
    const result = await window.electronAPI.getList(props.connectionId, props.keyName)
    items.value = result.map((value, index) => ({
      index,
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
.list-editor {
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

.list-content {
  flex: 1;
  overflow: auto;
}
</style>
