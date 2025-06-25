import { ILlamaCppPresenter } from '@shared/presenter'
import forkPath from './llama?modulePath'
import {
  utilityProcess,
  MessageChannelMain,
  MessagePortMain,
  UtilityProcess,
  BrowserWindow
} from 'electron'

export class LlamaCppPresenter implements ILlamaCppPresenter {
  private childProcess: UtilityProcess | undefined
  private messageQueue: Array<{
    prompt: string
    resolve: (result: string) => void
    reject: (error: unknown) => void
  }> = []
  private port1: MessagePortMain
  private port2: MessagePortMain
  private _ready: boolean = false
  private _mainWindow: BrowserWindow | undefined = undefined
  private _inited: boolean = false
  constructor() {
    const { port1, port2 } = new MessageChannelMain()
    this.port1 = port1
    this.port2 = port2
    this.port2.start()
  }
  setMainwindow(mainWindow: BrowserWindow) {
    this._mainWindow = mainWindow
  }
  init() {
    if (this._inited) {
      return
    }
    this._inited = true
    this.childProcess = utilityProcess.fork(forkPath)
    this.port2.on(
      'message',
      (messageEvent: {
        data: { type: string; content?: string; error?: string; chunk?: string }
      }) => {
        console.log('receive child proc msg', messageEvent)
        const msg = messageEvent.data
        if (msg.type === 'ready') {
          this._ready = true
          this.processQueue()
        } else if (msg.type === 'response-chunk') {
          this.safeWebContentsSend('llama-message-chunk', {
            type: 'ai-chunk',
            chunk: msg.chunk
          })
        } else if (msg.type === 'response') {
          const currentMsg = this.messageQueue.shift()
          this.safeWebContentsSend('llama-message', {
            type: 'ai',
            content: msg.content ?? ''
          })
          currentMsg?.resolve('ai')
          this.processQueue()
        } else if (msg.type === 'error') {
          this.safeWebContentsSend('llama-error', {
            error: msg.error
          })
          this.processQueue()
        }
      }
    )
    this.childProcess.postMessage({ type: 'init' }, [this.port1])
  }

  private processQueue() {
    if (!this._ready) {
      return
    }
    if (this.messageQueue.length > 0) {
      const { prompt } = this.messageQueue[0]
      console.log('process queue', prompt)
      this.port2.postMessage({
        type: 'prompt',
        text: prompt
      })
      this.safeWebContentsSend('llama-message', {
        type: 'user',
        prompt
      })
    }
  }

  // Helper method to safely send messages to webContents
  private safeWebContentsSend(channel: string, ...args: any[]) {
    if (this._mainWindow && !this._mainWindow.isDestroyed() &&
        this._mainWindow.webContents && !this._mainWindow.webContents.isDestroyed()) {
      try {
        this._mainWindow.webContents.send(channel, ...args)
      } catch (error) {
        console.error(`Error sending message to channel ${channel}:`, error)
      }
    } else {
      console.log(`Cannot send message to channel ${channel}: window or webContents is not available`)
    }
  }

  async prompt(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ prompt: text, resolve, reject })
      this.processQueue()
    })
  }

  startNewChat() {
    this.port2.postMessage({
      type: 'newChat'
    })
  }

  async destroy() {
    this.childProcess?.kill()
    this.childProcess = undefined
  }
}
