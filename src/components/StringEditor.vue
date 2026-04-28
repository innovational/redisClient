<template>
  <div class="string-editor">
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

    <!-- 值编辑器 -->
    <div class="value-section">
      <div class="section-header">
        <span>值</span>
        <el-button size="small" type="primary" @click="handleSave">
          保存
        </el-button>
      </div>
      <el-input
        v-model="value"
        type="textarea"
        :rows="10"
        placeholder="请输入值"
      />
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

// 值内容
const value = ref('')

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
 * 加载数据
 */
const loadData = async (): Promise<void> => {
  try {
    // 获取值
    const result = await window.electronAPI.getString(props.connectionId, props.keyName)
    value.value = result || ''

    // 获取 TTL
    currentTTL.value = await window.electronAPI.getKeyTTL(props.connectionId, props.keyName)
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

/**
 * 保存值
 */
const handleSave = async (): Promise<void> => {
  try {
    await window.electronAPI.setString(props.connectionId, props.keyName, value.value)
    ElMessage.success('保存成功')
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
.string-editor {
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

.value-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
