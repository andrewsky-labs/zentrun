import { app, globalShortcut } from 'electron'
import { presenter } from '.'
import { SHORTCUT_EVENTS } from '../events'
import { eventBus } from '../eventbus'

export class ShortcutPresenter {
  private isActive: boolean = false

  constructor() {
    console.log('ShortcutPresenter constructor')
  }

  registerShortcuts(): void {
    if (this.isActive) return

    // Command+W 或 Ctrl+W 隐藏窗口
    globalShortcut.register(process.platform === 'darwin' ? 'Command+W' : 'Control+W', () => {
      if (presenter.windowPresenter.mainWindow?.isFocused()) {
        presenter.windowPresenter.hide()
      }
    })

    // Command+Q 或 Ctrl+Q 退出程序
    globalShortcut.register(process.platform === 'darwin' ? 'Command+Q' : 'Control+Q', () => {
      app.quit()
    })

    // Command+N 或 Ctrl+N 创建新会话
    globalShortcut.register(process.platform === 'darwin' ? 'Command+N' : 'Control+N', () => {
      eventBus.emit(SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION)
    })

    // Command+= 或 Ctrl+= 放大字体
    globalShortcut.register(process.platform === 'darwin' ? 'Command+=' : 'Control+=', () => {
      eventBus.emit(SHORTCUT_EVENTS.ZOOM_IN)
    })

    // Command+- 或 Ctrl+- 缩小字体
    globalShortcut.register(process.platform === 'darwin' ? 'Command+-' : 'Control+-', () => {
      eventBus.emit(SHORTCUT_EVENTS.ZOOM_OUT)
    })

    // Command+0 或 Ctrl+0 重置字体大小
    globalShortcut.register(process.platform === 'darwin' ? 'Command+0' : 'Control+0', () => {
      eventBus.emit(SHORTCUT_EVENTS.ZOOM_RESUME)
    })

    // Command+, 或 Ctrl+, 打开设置
    globalShortcut.register(process.platform === 'darwin' ? 'Command+,' : 'Control+,', () => {
      eventBus.emit(SHORTCUT_EVENTS.GO_SETTINGS)
    })

    // Command+L 或 Ctrl+L 清除聊天历史
    globalShortcut.register(process.platform === 'darwin' ? 'Command+L' : 'Control+L', () => {
      eventBus.emit(SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY)
    })

    this.isActive = true
  }

  unregisterShortcuts(): void {
    globalShortcut.unregisterAll()
    this.isActive = false
  }

  destroy(): void {
    this.unregisterShortcuts()
  }
}
