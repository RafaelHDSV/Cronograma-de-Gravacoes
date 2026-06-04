/**
 * Aplica blur na coluna PESSOA do print demo.png (nomes da equipe).
 * Uso: node scripts/blur-demo-names.mjs
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const input = path.join(root, 'demo.png')
const tmp = path.join(root, 'demo.blur-tmp.png')
const output = input

const { width, height } = await sharp(input).metadata()

// Região da coluna de nomes (abaixo do cabeçalho PESSOA), proporcional ao layout do print 1863×1070
const left = Math.round(width * 0.018)
const top = Math.round(height * 0.582)
const regionWidth = Math.round(width * 0.19)
const regionHeight = Math.round(height * 0.38)

const blurred = await sharp(input)
  .extract({ left, top, width: regionWidth, height: regionHeight })
  .blur(14)
  .toBuffer()

await sharp(input)
  .composite([{ input: blurred, left, top }])
  .png()
  .toFile(tmp)

const fs = await import('fs/promises')
await fs.rename(tmp, output)

console.log(`OK: blur aplicado em ${output} (${regionWidth}x${regionHeight} @ ${left},${top})`)
