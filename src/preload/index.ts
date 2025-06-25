import { clipboard, contextBridge, nativeImage, webUtils, webFrame, ipcRenderer } from 'electron'
import { exposeElectronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  copyText: (text: string) => {
    clipboard.writeText(text)
  },
  copyImage: (image: string) => {
    const img = nativeImage.createFromDataURL(image)
    clipboard.writeImage(img)
  },
  getPathForFile: (file: File) => {
    return webUtils.getPathForFile(file)
  },
  // Add SQLite query function
  querySQLite: (dbPath: string, query: string, params: any[] = []) => {
    return ipcRenderer.invoke('presenter:call', 'genericSQLitePresenter', 'executeQuery', dbPath, query, params)
  }
}
exposeElectronAPI()

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
window.addEventListener('DOMContentLoaded', () => {
  webFrame.setVisualZoomLevelLimits(1, 1) // 禁用 trackpad 缩放
  webFrame.setZoomFactor(1)
})
