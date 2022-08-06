import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{
    name: 'fuck-echarts',
    renderChunk(code, chunk) {
      if (chunk.fileName.includes('echarts')) {
        return code.replace(/\bSymbol(?!\.toStringTag)/g, 'FuckSymbol')
      }
    },
  }],
})
