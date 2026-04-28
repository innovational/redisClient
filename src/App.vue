<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <h1>Redis Client</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showConnectionDialog = true">
          新建连接
        </el-button>
      </div>
    </header>

    <!-- 主内容区域 - 三栏布局 -->
    <main class="app-main">
      <!-- 左侧边栏：连接列表和键列表 -->
      <aside class="sidebar-left">
        <!-- 连接列表 -->
        <ConnectionList />

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 键列表 -->
        <KeyList />
      </aside>

      <!-- 中间主区域：键值查看与编辑 -->
      <section class="main-content">
        <KeyValueViewer />
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConnectionList from './components/ConnectionList.vue'
import KeyList from './components/KeyList.vue'
import KeyValueViewer from './components/KeyValueViewer.vue'
import ServerInfo from './components/ServerInfo.vue'
import Terminal from './components/Terminal.vue'
import ConnectionDialog from './components/ConnectionDialog.vue'

// 控制连接对话框显示
const showConnectionDialog = ref(false)

// 连接成功后的处理
const handleConnected = () => {
  showConnectionDialog.value = false
}
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
  padding: 0 20px;
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 主内容区域 - 三栏布局 */
.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-left {
  width: 300px;
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
</style>
