import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const sourceSvg = readFileSync(join(publicDir, 'app-icon.svg'))

const outputs = [
  { name: 'pwa-192.png', size: 192 },
  { name: 'pwa-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of outputs) {
  await sharp(sourceSvg).resize(size, size).png().toFile(join(publicDir, name))
  console.log(`Generated public/${name} (${size}x${size})`)
}
