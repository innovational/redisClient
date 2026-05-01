---
name: "project-conventions"
description: "Defines code style and project conventions for this Wu-Redis Electron+Vue project. Invoke when writing new code or refactoring."
---

# Project Conventions

## 项目概述

这是一个 **Redis 客户端** 桌面应用，使用 Electron + Vue 3 + TypeScript + Vite 技术栈。

## 项目结构

```
redisClient/
├── electron/           # Electron 主进程代码
│   ├── main.ts        # 主进程入口
│   ├── preload.ts     # 预加载脚本
│   ├── ipc-handler.ts # IPC 通信处理
│   ├── redis-manager.ts # Redis 连接管理
│   └── store-manager.ts # 持久化存储管理
├── src/               # Vue 渲染进程代码
│   ├── components/    # Vue 组件
│   ├── stores/        # Pinia 状态管理
│   ├── types/         # TypeScript 类型定义
│   ├── App.vue        # 根组件
│   └── main.ts        # 渲染进程入口
├── dist/              # 构建输出目录
├── dist-electron/     # Electron 构建输出
└── release/           # 打包输出
```

## 代码风格规范

### 1. TypeScript 风格

- **类型定义**：使用 `interface` 优先于 `type`
- **枚举使用**：使用 `enum` 定义固定集合（如 `RedisKeyType`）
- **导入顺序**：
  1. Vue/Pinia 核心
  2. 第三方库
  3. 项目内部模块
  4. 类型定义
- **注释风格**：
  - 使用 JSDoc 风格的块注释
  - 公开方法必须添加 `@param` 和 `@returns` 描述

### 2. Vue 组件风格

- **组件定义**：使用 `<script setup lang="ts">` 语法
- **Props 定义**：使用 `defineProps<{...}>()` 泛型方式
- **组件命名**：
  - 使用 PascalCase（如 `ConnectionDialog.vue`）
  - 组件文件与类名一致
- **样式隔离**：使用 scoped CSS

### 3. 状态管理 (Pinia)

- **Store 定义**：使用组合式 API `defineStore('name', () => {...})`
- **接口导出**：在 `stores/` 目录导出接口类型
- **命名规范**：`useXxxStore` 组合式函数命名

### 4. Electron IPC 通信

- **API 封装**：通过 `window.electronAPI` 调用主进程
- **类型定义**：在 `src/types/electron.d.ts` 定义 API 接口

## 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `ConnectionDialog.vue` |
| TypeScript 文件 | camelCase | `redisManager.ts` |
| Store 文件 | camelCase | `connection.ts` |
| 类型定义文件 | camelCase | `electron.d.ts` |
| 配置文件 | kebab-case | `vite.config.ts` |

## 函数和类命名

- **类名**：PascalCase（如 `RedisManager`、`MainApplication`）
- **方法名**：camelCase
- **常量**：UPPER_SNAKE_CASE
- **私有成员**：以 `_` 开头

## TypeScript 编译选项

项目使用 `strict: true` 严格模式，但关闭了：
- `noUnusedLocals: false`
- `noUnusedParameters: false`

允许未使用变量和参数存在。

## Vite 配置

- 别名配置：`@` 指向 `src/` 目录
- Electron 插件：`vite-plugin-electron` 管理主进程构建
- 开发服务器端口：`5173`

## 构建命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | TypeScript 检查 + Vite 构建 |
| `npm run build-all` | 完整构建 + electron-builder 打包 |
| `npm run pack-win` | Windows 平台打包 |

## 依赖版本策略

- **Vue 3**: ^3.5.13
- **Electron**: ^41.3.0（重大更新需特别确认）
- **Vite**: ^8.0.10
- **Element Plus**: ^2.4.4
- **Pinia**: ^2.1.7
- **redis**: ^5.12.1

## 代码示例

### 组件示例

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  editConnection?: ConnectionConfig | null
}>()

const connectionStore = useConnectionStore()
</script>
```

### Store 示例

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ConnectionConfig {
  id: string
  name: string
  host: string
  port: number
}

export const useConnectionStore = defineStore('connection', () => {
  const connections = ref<ConnectionConfig[]>([])

  return { connections }
})
```

### 类示例

```typescript
export class RedisManager {
  private clients: Map<string, RedisClientType> = new Map()

  public async testConnection(config: RedisConnectionConfig): Promise<{
    success: boolean
    error?: string
  }> {
    // ...
  }
}
```

## 使用场景

- 编写新组件时遵循 Vue 组件风格
- 编写新模块时遵循 TypeScript 类规范
- 修改 IPC 通信时参考现有模式
- 添加新依赖时遵循版本策略