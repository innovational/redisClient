import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

/**
 * 创建 Vue 应用实例
 * 配置了 Pinia 状态管理和 Element Plus UI 组件库
 */
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

app.mount('#app')
