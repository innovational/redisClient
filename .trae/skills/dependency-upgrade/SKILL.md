---
name: "dependency-upgrade"
description: "Manages dependency upgrades with manual approval requirement. Invoke when user asks to upgrade dependencies or check for updates."
---

# Dependency Upgrade Manager

## 概述

这个 Skill 负责管理项目的依赖升级流程，确保所有依赖更新都经过人工确认后才能执行。

## 项目技术栈

- **构建工具**: Vite ^8.0.10
- **前端框架**: Vue 3.5.13
- **状态管理**: Pinia ^2.1.7
- **UI 组件库**: Element Plus ^2.4.4
- **Electron**: ^41.3.0
- **Redis 客户端**: redis ^5.12.1
- **Electron 构建**: electron-builder ^24.13.3
- **打包工具**: esbuild ^0.28.0
- **类型检查**: vue-tsc ^3.2.7, TypeScript ^5.6.2

## 依赖升级规则

### 1. 严格禁止主动修改

- **禁止主动修改** `package.json` 文件
- 禁止在未获得人工确认前执行 `npm update`、`npm upgrade` 等命令
- 所有依赖变更必须由人工明确授权

### 2. 升级检查流程

当用户要求检查依赖更新时：

1. 使用 `npm outdated` 或 `npm-check-updates` 工具检查过时依赖
2. 生成依赖更新报告，包含：
   - 当前版本
   - 最新版本
   - 更新类型（major/minor/patch）
3. 等待用户确认具体需要升级哪些依赖

### 3. 升级执行流程

用户确认后：

1. 逐个升级用户指定的依赖
2. 运行 `npm install` 更新 `package-lock.json`
3. 运行类型检查确保兼容性
4. 报告升级结果和任何潜在问题

### 4. 版本策略

- **dependencies**: 优先使用稳定版本，避免 major 更新
- **devDependencies**: 可以接受 minor 更新，major 更新需特别确认
- **electron**: 重要安全更新需要特别确认，可能影响主进程
- **vite**: minor 和 patch 更新相对安全
- **vue**: major 更新需特别确认

### 5. 验证命令

升级后必须执行的验证命令：

```bash
npm run build  # TypeScript 类型检查 + 构建
```

## 使用场景

- 用户主动要求检查依赖更新
- 用户要求升级特定依赖
- 项目初始化或克隆后的依赖安装

## 注意事项

- Electron 和 node-redis 的更新可能需要测试主进程和 IPC 通信
- Element Plus 更新可能涉及 UI 组件 API 变化
- Vue 3 major 更新需要检查 Composition API 使用情况