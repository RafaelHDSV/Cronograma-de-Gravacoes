import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const html = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'AGX Soft_AGX Softwa_2026-05-20_to_2026-06-23.html'),
  'utf8',
)

const text = html
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s{3,}/g, '\n')
  .trim()

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'discord-messages.txt'), text, 'utf8')
console.log('Done, lines:', text.split('\n').length)
