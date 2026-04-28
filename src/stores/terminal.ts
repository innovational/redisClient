import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 终端命令历史记录接口
 */
export interface CommandHistory {
  command: string
  result: any
  timestamp: number
  success: boolean
}

/**
 * 终端状态管理
 * 负责管理终端命令和历史记录
 */
export const useTerminalStore = defineStore('terminal', () => {
  // 命令历史
  const history = ref<CommandHistory[]>([])

  // 当前输入的命令
  const currentCommand = ref('')

  // 添加命令到历史
  const addToHistory = (
    command: string,
    result: any,
    success: boolean
  ): void => {
    history.value.push({
      command,
      result,
      timestamp: Date.now(),
      success
    })

    // 限制历史记录数量
    if (history.value.length > 1000) {
      history.value = history.value.slice(-1000)
    }
  }

  // 清空历史
  const clearHistory = (): void => {
    history.value = []
  }

  // 设置当前命令
  const setCurrentCommand = (command: string): void => {
    currentCommand.value = command
  }

  return {
    history,
    currentCommand,
    addToHistory,
    clearHistory,
    setCurrentCommand
  }
})
