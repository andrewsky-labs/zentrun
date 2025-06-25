import { type IPresenter } from '@shared/presenter'
import { toRaw } from 'vue'
function createProxy(presenterName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({} as any, {
    get(_, functionName) {
      return (...payloads: []) => {
        const rawPayloads = payloads.map((e) => toRaw(e))
        return window.electron.ipcRenderer
          .invoke('presenter:call', presenterName, functionName, ...rawPayloads)
          .catch((e: Error) => {
            console.warn('error on presenter invoke', functionName, e)
            return null
          })
      }
    }
  })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentersProxy: IPresenter = new Proxy({} as any, {
  get(_, presenterName) {
    return createProxy(presenterName as string)
  }
})

export function usePresenter<T extends keyof IPresenter>(name: T): IPresenter[T] {
  return presentersProxy[name]
}
