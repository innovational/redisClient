<template>
  <div class="terminal">
    <!-- 终端输出区域 -->
    <div class="terminal-output" ref="outputRef">
      <el-scrollbar>
        <div
          v-for="(item, index) in terminalStore.history"
          :key="index"
          class="output-item"
        >
          <!-- 命令 -->
          <div class="command-line">
            <span class="prompt">redis&gt;</span>
            <span class="command">{{ item.command }}</span>
          </div>

          <!-- 结果 -->
          <div
            class="result-line"
            :class="{ error: !item.success }"
          >
            {{ formatResult(item.result) }}
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 命令输入区域 -->
    <div class="terminal-input">
      <span class="prompt">redis&gt;</span>
      <el-input
        v-model="command"
        size="small"
        placeholder="输入 Redis 命令..."
        @keyup.enter="handleExecute"
      />
      <el-button size="small" type="primary" @click="handleExecute">
        执行
      </el-button>
      <el-button size="small" @click="handleClear">
        清空
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useConnectionStore } from '@/stores/connection'
import { ElMessage } from 'element-plus'

const terminalStore = useTerminalStore()
const connectionStore = useConnectionStore()

// 命令输入
const command = ref('')

// 输出区域引用
const outputRef = ref<HTMLElement | null>(null)

/**
 * 格式化命令结果
 */
const formatResult = (result: any): string => {
  if (result === null) {
    return '(nil)'
  }
  if (result === undefined) {
    return ''
  }
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2)
  }
  return String(result)
}

/**
 * 执行命令
 */
const handleExecute = async (): Promise<void> => {
  if (!command.value.trim()) {
    return
  }

  if (!connectionStore.activeConnectionId) {
    ElMessage.warning('请先选择一个连接')
    return
  }

  const cmd = command.value.trim()
  command.value = ''

  try {
    const result = await window.electronAPI.executeCommand(
      connectionStore.activeConnectionId,
      cmd
    )
    terminalStore.addToHistory(cmd, result, true)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '命令执行失败'
    terminalStore.addToHistory(cmd, errorMessage, false)
  }

  // 滚动到底部
  await nextTick()
  scrollToBottom()
}

/**
 * 清空历史
 */
const handleClear = (): void => {
  terminalStore.clearHistory()
}

/**
 * 滚动到输出底部
 */
const scrollToBottom = (): void => {
  if (outputRef.value) {
    outputRef.value.scrollTop = outputRef.value.scrollHeight
  }
}

// 监听历史变化，自动滚动
watch(
  () => terminalStore.history.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<style scoped>
.terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #ccc;
  font-family: 'Consolas', 'Monaco', monospace;
}

.terminal-output {
  flex: 1;
  overflow: hidden;
  padding: 10px;
}

.output-item {
  margin-bottom: 10px;
}

.command-line {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.prompt {
  color: #409eff;
}

.command {
  color: #fff;
}

.result-line {
  padding-left: 20px;
  color: #67c23a;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-line.error {
  color: #f56c6c;
}

.terminal-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #2d2d2d;
  border-top: 1px solid #444;
}

.terminal-input .el-input {
  flex: 1;
}
</style>
