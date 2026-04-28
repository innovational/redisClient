<template>
  <div class="zset-editor">
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
        <el-table-column label="分数" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.score"
              size="small"
              :precision="2"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column label="成员" min-width="300">
          <template #default="{ row }">
            <el-input v-model="row.member" size="small" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  connectionId: string
  keyName: string
}>()

// 成员列表
interface ZSetMember {
  member: string
  score: number
  isNew?: boolean
}

const members = ref<ZSetMember[]>([])

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
    const result = await window.electronAPI.getZSet(props.connectionId, props.keyName)
    members.value = result.map(item => ({
      member: item.member,
      score: item.score
    }))
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
    member: '',
    score: 0,
    isNew: true
  })
}

/**
 * 删除成员
 */
const handleDeleteMember = async (index: number): Promise<void> => {
  members.value.splice(index, 1)
}

/**
 * 保存所有更改
 */
const handleSave = async (): Promise<void> => {
  try {
    // 先删除所有旧成员
    const originalMembers = await window.electronAPI.getZSet(props.connectionId, props.keyName)
    if (originalMembers.length > 0) {
      await window.electronAPI.deleteKeys(props.connectionId, [props.keyName])
    }

    // 添加新成员
    for (const item of members.value) {
      if (item.member !== '') {
        await window.electronAPI.executeCommand(
          props.connectionId,
          `ZADD ${props.keyName} ${item.score} "${item.member}"`
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
.zset-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
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
