import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const msgs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'messages.json'), 'utf8'))

const re = /\d{2}\/\d{2}|cronogram|grav|sexta|troc|14h|16h|ordem|adiad|remarc/i

for (let i = 0; i < msgs.length; i++) {
  const c = msgs[i].content || ''
  if (!re.test(c)) continue
  console.log(`=== MSG ${i} type ${msgs[i].type} ===`)
  console.log(c)
  console.log('')
}
