// copy-vendor.mjs
// 将 npm 管理的框架依赖拷贝到 docs/demos/vendor 与 docs/assets/vendor，
// 替代原先手工下载、版本写死的裸文件，便于 `npm update` 统一升级、CI 可复现。
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const nm = resolve(root, 'node_modules')
const demosVendor = resolve(root, 'docs/demos/vendor')
const assetsVendor = resolve(root, 'docs/assets/vendor')

mkdirSync(demosVendor, { recursive: true })
mkdirSync(assetsVendor, { recursive: true })

// [npm 包内相对路径, 目标子目录, 输出文件名]
const jobs = [
  ['vue/dist/vue.global.prod.js', 'demos', 'vue3.global.js'],
  ['vue2/dist/vue.js', 'demos', 'vue2.js'],
  ['react/umd/react.production.min.js', 'demos', 'react.production.min.js'],
  ['react-dom/umd/react-dom.production.min.js', 'demos', 'react-dom.production.min.js'],
  ['@babel/standalone/babel.min.js', 'demos', 'babel.min.js'],
]

let ok = 0
for (const [src, dir, name] of jobs) {
  const from = resolve(nm, src)
  const to = resolve(dir === 'demos' ? demosVendor : assetsVendor, name)
  if (!existsSync(from)) {
    console.warn('⚠️  未找到（跳过）:', src, '— 请先 npm install')
    continue
  }
  copyFileSync(from, to)
  console.log('✅', src, '→', name)
  ok++
}
console.log(`\n完成：拷贝 ${ok}/${jobs.length} 个文件到 vendor`)
