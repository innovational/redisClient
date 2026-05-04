# Wu-Redis

一个基于 Electron + Vue 3 的成熟、安全的 Redis 桌面管理工具。
windows 客户端 https://github.com/innovational/redisClient/releases/tag/version

## 功能特性

- 多连接管理：支持同时管理多个 Redis 服务器连接
- 安全存储：使用系统 safeStorage API 加密存储密码
- 键值浏览：支持 STRING、HASH、LIST、SET、ZSET 五种数据类型
- SCAN 分页：高效浏览海量键，支持分页加载
- 内置终端：可直接执行 Redis 命令
- 数据持久化：连接配置本地存储

## 技术栈

- 桌面框架：Electron
- 前端框架：Vue 3 (Composition API)
- 构建工具：Vite
- UI 组件库：Element Plus
- Redis 客户端：redis
- 状态管理：Pinia
- 打包工具：electron-builder

## 安全特性

- 上下文隔离 (contextIsolation: true)
- 节点集成禁用 (nodeIntegration: false)
- 沙箱模式 (sandbox: true)
- 预加载脚本安全 API 暴露
- 密码加密存储

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建

```bash
# 构建应用
npm run build
```

## 打包为 Windows 版本

```bash
# 打包应用为 Windows 版本
npm run pack-win
```

## 项目结构

```
redisClient/
├── electron/                 # Electron 主进程代码
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   ├── redis-manager.ts     # Redis 客户端管理
│   ├── store-manager.ts     # 数据持久化管理
│   └── ipc-handler.ts       # IPC 通信处理
├── src/                     # Vue 渲染进程代码
│   ├── components/          # Vue 组件
│   ├── stores/              # Pinia 状态管理
│   └── types/               # TypeScript 类型声明
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
