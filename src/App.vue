<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
<!--    <header class="app-header">-->
<!--      <div class="header-left">-->
<!--        <h1>Wu-Redis</h1>-->
<!--      </div>-->

<!--      &lt;!&ndash; 自定义菜单 &ndash;&gt;-->
<!--      <div class="header-menu">-->
<!--        <el-menu mode="horizontal" default-active="connection">-->
<!--          &lt;!&ndash; 连接管理菜单 &ndash;&gt;-->
<!--          <el-sub-menu index="connection">-->
<!--            <template #title>-->
<!--              <el-icon><Setting /></el-icon>-->
<!--              <span>连接管理</span>-->
<!--            </template>-->
<!--            <el-menu-item index="add-connection" @click="showConnectionDialog = true">-->
<!--              <el-icon><Plus /></el-icon>-->
<!--              添加连接-->
<!--            </el-menu-item>-->
<!--            <el-menu-item index="refresh-connections" @click="handleRefreshConnections">-->
<!--              <el-icon><Refresh /></el-icon>-->
<!--              刷新连接列表-->
<!--            </el-menu-item>-->
<!--            <el-menu-item index="disconnect-all" @click="handleDisconnectAll" v-if="hasConnectedConnections">-->
<!--              <el-icon><Close /></el-icon>-->
<!--              断开所有连接-->
<!--            </el-menu-item>-->
<!--          </el-sub-menu>-->

<!--          &lt;!&ndash; 操作菜单 &ndash;&gt;-->
<!--          <el-sub-menu index="operation">-->
<!--            <template #title>-->
<!--              <el-icon><Menu /></el-icon>-->
<!--              <span>操作</span>-->
<!--            </template>-->
<!--            <el-menu-item index="refresh-keys" @click="handleRefreshKeys" v-if="connectionStore.activeConnection">-->
<!--              <el-icon><Refresh /></el-icon>-->
<!--              刷新键列表-->
<!--            </el-menu-item>-->
<!--            <el-menu-item index="add-key" @click="handleAddKey" v-if="connectionStore.activeConnection">-->
<!--              <el-icon><Plus /></el-icon>-->
<!--              新建键-->
<!--            </el-menu-item>-->
<!--          </el-sub-menu>-->

<!--          &lt;!&ndash; 帮助菜单 &ndash;&gt;-->
<!--          <el-sub-menu index="help">-->
<!--            <template #title>-->
<!--              <el-icon><Help /></el-icon>-->
<!--              <span>帮助</span>-->
<!--            </template>-->
<!--            <el-menu-item index="about">-->
<!--              <el-icon><InfoFilled /></el-icon>-->
<!--              关于-->
<!--            </el-menu-item>-->
<!--          </el-sub-menu>-->
<!--        </el-menu>-->
<!--      </div>-->

<!--      <div class="header-right">-->
<!--        &lt;!&ndash; 窗口控制按钮 &ndash;&gt;-->
<!--        <div class="window-controls">-->
<!--          <el-button size="small" type="text" @click="handleMinimize">-->
<!--            <el-icon><Minus /></el-icon>-->
<!--          </el-button>-->
<!--          <el-button size="small" type="text" @click="handleMaximize">-->
<!--            <el-icon><FullScreen /></el-icon>-->
<!--          </el-button>-->
<!--          <el-button size="small" type="text" @click="handleClose">-->
<!--            <el-icon><Close /></el-icon>-->
<!--          </el-button>-->
<!--        </div>-->
<!--      </div>-->
<!--    </header>-->

    <!-- 主内容区域 - 三栏布局 -->
    <main class="app-main">
      <!-- 左侧边栏：连接列表和键列表 -->
      <aside class="sidebar-left">
        <!-- 连接列表 -->
        <ConnectionList />

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 键列表 -->
        <KeyList ref="keyListRef" />
      </aside>

      <!-- 中间主区域：键值查看与编辑 -->
      <section class="main-content">
        <KeyValueViewer @newConnection="showConnectionDialog = true" />
      </section>

      <!-- 右侧边栏：服务器信息 -->
      <aside class="sidebar-right">
        <ServerInfo />
      </aside>
    </main>

    <!-- 底部终端 -->
    <footer class="app-footer">
      <Terminal />
    </footer>

    <!-- 连接配置对话框 -->
    <ConnectionDialog
      v-model:visible="showConnectionDialog"
      @connected="handleConnected"
    />

    <!-- 关于对话框 -->
    <el-dialog
      v-model="showAboutDialog"
      title="关于 Wu-Redis"
      width="400px"
    >
      <div class="about-content">
        <p>Wu-Redis v1.0.1</p>
        <p class="about-desc">一个成熟、安全的 Redis 桌面管理工具</p>
        <p class="about-copyright">Copyright © 2026</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Setting, Plus, Refresh, Menu, Help, InfoFilled, Minus, FullScreen, Close } from '@element-plus/icons-vue'
import ConnectionList from './components/ConnectionList.vue'
import KeyList from './components/KeyList.vue'
import KeyValueViewer from './components/KeyValueViewer.vue'
import ServerInfo from './components/ServerInfo.vue'
import Terminal from './components/Terminal.vue'
import ConnectionDialog from './components/ConnectionDialog.vue'
import { useConnectionStore } from './stores/connection'

// 控制连接对话框显示
const showConnectionDialog = ref(false)

// 关于对话框
const showAboutDialog = ref(false)

// 键列表组件引用
const keyListRef = ref<InstanceType<typeof KeyList> | null>(null)

// 连接状态管理
const connectionStore = useConnectionStore()

// 是否有已连接的连接
const hasConnectedConnections = computed(() => {
  return connectionStore.connections.some(conn => conn.connected)
})

/**
 * 连接成功后的处理
 */
const handleConnected = () => {
  showConnectionDialog.value = false
}

/**
 * 刷新连接列表
 */
const handleRefreshConnections = async () => {
  await connectionStore.loadConnections()
}

/**
 * 断开所有连接
 */
const handleDisconnectAll = async () => {
  for (const conn of connectionStore.connections) {
    if (conn.connected) {
      await connectionStore.disconnect(conn.id)
    }
  }
}

/**
 * 刷新键列表
 */
const handleRefreshKeys = () => {
  // 通过子组件方法刷新
}

/**
 * 添加键
 */
const handleAddKey = () => {
  // 通过子组件方法添加键
}

/**
 * 最小化窗口
 */
const handleMinimize = () => {
  window.electronAPI.minimizeWindow()
}

/**
 * 最大化/还原窗口
 */
const handleMaximize = () => {
  window.electronAPI.maximizeWindow()
}

/**
   * 关闭窗口
   */
  const handleClose = () => {
    window.electronAPI.closeWindow()
  }

  /**
   * 监听菜单事件
   */
  const handleMenuAddConnection = () => {
    showConnectionDialog.value = true
  }

  const handleMenuAbout = () => {
    showAboutDialog.value = true
  }

  // 组件挂载时注册菜单事件监听
  onMounted(() => {
    window.electronAPI.onMenuEvent('menu:add-connection', handleMenuAddConnection)
    window.electronAPI.onMenuEvent('menu:about', handleMenuAbout)
  })

  // 组件卸载时移除菜单事件监听
  onUnmounted(() => {
    window.electronAPI.removeMenuEventListener('menu:add-connection', handleMenuAddConnection)
    window.electronAPI.removeMenuEventListener('menu:about', handleMenuAbout)
  })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 顶部标题栏样式 */
.app-header {
  height: 50px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  flex-shrink: 0;
}

.header-left {
  flex: 1;
}

.header-left h1 {
  font-size: 18px;
  font-weight: 500;
  margin-left: 10px;
}

.header-menu {
  flex: 3;
}

.header-menu :deep(.el-menu) {
  background-color: transparent;
  border-bottom: none;
}

.header-menu :deep(.el-menu-item),
.header-menu :deep(.el-sub-menu__title) {
  color: white;
}

.header-menu :deep(.el-menu-item:hover),
.header-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.2);
}

.header-menu :deep(.el-sub-menu__icon-arrow) {
  color: white;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.window-controls {
  display: flex;
  gap: 5px;
}

.window-controls :deep(.el-button) {
  color: white;
}

.window-controls :deep(.el-button:hover) {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 主内容区域 - 三栏布局 */
.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-left {
  width: 390px;
  background-color: white;
  border-right: 1px solid #e4e4e4;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-left .divider {
  height: 1px;
  background-color: #e4e4e4;
}

.main-content {
  flex: 1;
  background-color: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-right {
  width: 300px;
  background-color: white;
  border-left: 1px solid #e4e4e4;
  overflow: hidden;
}

/* 底部终端区域 */
.app-footer {
  height: 200px;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
  flex-shrink: 0;
}

/* 关于对话框样式 */
.about-content {
  text-align: center;
  padding: 20px;
}

.about-content p {
  margin: 10px 0;
}

.about-desc {
  color: #666;
  font-size: 14px;
}

.about-copyright {
  color: #999;
  font-size: 12px;
  margin-top: 20px !important;
}
</style>