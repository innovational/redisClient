import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { RedisManager } from './redis-manager'
import { StoreManager } from './store-manager'
import { setupIpcHandlers } from './ipc-handler'

/**
 * Electron 应用主进程入口类
 * 负责管理应用窗口、系统事件以及协调各个管理器
 */
class MainApplication {
  private mainWindow: BrowserWindow | null = null
  private redisManager: RedisManager
  private storeManager: StoreManager

  constructor() {
    this.redisManager = new RedisManager()
    this.storeManager = new StoreManager()
  }

  /**
   * 创建自定义菜单
   */
  private createMenu(): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: '连接',
        submenu: [
          {
            label: '添加连接',
            click: () => {
              this.mainWindow?.webContents.send('menu:add-connection')
            }
          },
          {
            type: 'separator'
          },
          {
            label: '退出',
            role: 'quit'
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => {
              this.mainWindow?.webContents.send('menu:about')
            }
          }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  /**
   * 创建应用主窗口
   * 配置了安全加固选项：上下文隔离、节点集成禁用、沙箱模式
   */
  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      title: 'Wu-Redis',
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    // 根据环境加载对应地址
    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    // 窗口关闭时清理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // 创建自定义菜单
    this.createMenu()
  }

  /**
   * 初始化应用
   * 设置 IPC 处理器并创建主窗口
   */
  public async initialize(): Promise<void> {
    // 初始化数据存储
    this.storeManager.initialize()

    // 设置 IPC 通信处理器
    setupIpcHandlers(this.redisManager, this.storeManager)

    // 创建主窗口
    this.createWindow()

    console.log('Wu-Redis 应用已初始化')
  }
}

// 创建应用实例
const application = new MainApplication()

// Electron 应用生命周期事件
app.whenReady().then(() => {
  application.initialize()
})

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 点击 dock 图标时重建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    application.initialize()
  }
})

// 应用退出前清理资源
app.on('before-quit', async () => {
  await application['redisManager'].disconnectAll()
})
