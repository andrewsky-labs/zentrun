import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import tailwind from 'tailwindcss'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['mermaid', 'dompurify', 'pyodide']
      })
    ],
    resolve: {
      alias: {
        '@': resolve('src/main/'),
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        external: ['sharp', 'pyodide']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        vue: 'vue/dist/vue.esm-bundler.js'
      }
    },
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()]
      }
    },
    server: {
      host: '0.0.0.0'  // 防止代理干扰，导致vite-electron之间ws://localhost:5713和http://localhost:5713通信失败、页面组件无法加载
    },
    plugins: [
      vue(),
      svgLoader(),
      vueDevTools({
        launchEditor: 'cursor'
      })
    ],
    build: {
      minify: 'esbuild'
    }
  }
})
