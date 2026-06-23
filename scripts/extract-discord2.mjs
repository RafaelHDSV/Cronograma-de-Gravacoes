import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const html = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'AGX Soft_AGX Softwa_2026-05-20_to_2026-06-23.html'),
  'utf8',
)

const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
if (!scriptMatch) { console.log('no script'); process.exit(1) }
const script = scriptMatch[1]

// Find data: look for array/object literals with "content" and "timestamp"
// Try to find `renderMessages([...])` or similar call
const renderCall = script.match(/renderMessages\s*\((\[[\s\S]{10,}?\])\s*\)/)
if (renderCall) {
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'messages.json'), renderCall[1], 'utf8')
  console.log('found renderMessages, len=', renderCall[1].length)
  process.exit(0)
}

// Try to find a big array of objects
const bigArray = script.match(/(\[\s*\{[\s\S]{500,}\}\s*\])/)
if (bigArray) {
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'messages.json'), bigArray[1], 'utf8')
  console.log('found bigArray, len=', bigArray[1].length)
  process.exit(0)
}

// Find lines with "timestamp"
const lines = script.split('\n')
const timestampLines = lines.flatMap((l, i) => l.includes('timestamp') ? [`${i}: ${l.trim().slice(0, 150)}`] : [])
console.log('Lines with timestamp:', timestampLines.slice(0, 20).join('\n'))

// Find lines with "2026"
const yearLines = lines.flatMap((l, i) => l.includes('2026') ? [`${i}: ${l.trim().slice(0, 150)}`] : [])
console.log('Lines with 2026:', yearLines.slice(0, 30).join('\n'))
