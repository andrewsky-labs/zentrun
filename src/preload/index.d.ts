import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      copyText(text: string): void
      copyImage(image: string): void
      getPathForFile(file: File): string
      querySQLite(dbPath: string, query: string, params?: any[]): Promise<any[]>
    }
  }
}
