/**
 * Render (and other) build caches can keep a stale node_modules/@vieira copy
 * while vendor/ already moved on. Yarn then says "Already up-to-date" and tsc
 * fails on missing exports. Always re-copy file: vendors before build.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packages = [
  ['vieira-analytics', 'analytics'],
  ['vieira-institucional', 'institucional']
]

for (const [vendorDir, pkg] of packages) {
  const src = join(root, 'vendor', vendorDir)
  const dest = join(root, 'node_modules', '@vieira', pkg)
  if (!existsSync(src)) {
    console.warn(`[refresh-vieira-vendor] skip missing ${src}`)
    continue
  }
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log(`[refresh-vieira-vendor] ${vendorDir} → @vieira/${pkg}`)
}
