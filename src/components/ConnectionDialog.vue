<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建连接"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <!-- 连接名称 -->
      <el-form-item label="连接名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入连接名称"
        />
      </el-form-item>

      <!-- 主机地址 -->
      <el-form-item label="主机" prop="host">
        <el-input
          v-model="formData.host"
          placeholder="请输入 Redis 服务器地址"
        />
      </el-form-item>

      <!-- 端口号 -->
      <el-form-item label="端口" prop="port">
        <el-input-number
          v-model="formData.port"
          :min="1"
          :max="65535"
          placeholder="6379"
        />
      </el-form-item>

      <!-- 密码 -->
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="请输入密码（可选）"
          show-password
        />
      </el-form-item>

      <!-- 数据库编号 -->
      <el-form-item label="数据库" prop="db">
        <el-input-number
          v-model="formData.db"
          :min="0"
          :max="15"
          placeholder="0"
        />
      </el-form-item>
    </el-form>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button @click="handleTest">测试连接</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { ElMessage, FormInstance, FormRules } from 'element-plus'

// 定义 Props
const props = defineProps<{
  visible: boolean
}>()

// 定义 Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'connected'): void
}>()

const connectionStore = useConnectionStore()

// 表单引用
const formRef = ref<FormInstance>()

// 保存状态
const saving = ref(false)

// 表单数据
const formData = ref({
  name: '',
  host: '127.0.0.1',
  port: 6379,
  password: '',
  db: 0
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入连接名称', trigger: 'blur' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' }
  ]
}

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

/**
 * 重置表单
 */
const resetForm = (): void => {
  formData.value = {
    name: '',
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0
  }
  formRef.value?.resetFields()
}

/**
 * 关闭对话框
 */
const handleClose = (): void => {
  resetForm()
  dialogVisible.value = false
}

/**
 * 测试连接
 */
const handleTest = async (): Promise<void> => {
  try {
    await formRef.value?.validate()

    ElMessage.info('正在测试连接...')

    const result = await window.electronAPI.testConnection({
      host: formData.value.host,
      port: formData.value.port,
      password: formData.value.password || undefined,
      db: formData.value.db
    })

    if (result.success) {
      ElMessage.success('连接成功！')
    } else {
      ElMessage.error(result.error || '连接失败')
    }
  } catch {
    // 验证失败
  }
}

/**
 * 保存连接
 */
const handleSave = async (): Promise<void> => {
  try {
    await formRef.value?.validate()

    saving.value = true

    await connectionStore.saveConnection({
      name: formData.value.name,
      host: formData.value.host,
      port: formData.value.port,
      password: formData.value.password || undefined,
      db: formData.value.db
    })

    ElMessage.success('保存成功')

    // 自动连接到保存的服务器
    const connections = connectionStore.connections
    const savedConn = connections[connections.length - 1]

    if (savedConn) {
      const connected = await connectionStore.connect(savedConn.id)
      if (connected) {
        emit('connected')
      }
    }

    handleClose()
  } catch {
    // 验证失败
  } finally {
    saving.value = false
  }
}
</script>
