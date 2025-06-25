import './assets/main.css'
import { addCollection } from '@iconify/vue'
import lucideIcons from '@iconify-json/lucide/icons.json'
import vscodeIcons from '@iconify-json/vscode-icons/icons.json'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import 'katex/dist/katex.min.css'
// 添加整个图标集合到本地
addCollection(lucideIcons)
addCollection(vscodeIcons)
const pinia = createPinia()

const app = createApp(App)

let disableConsole = ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
  console[method] = () => {};
});

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
