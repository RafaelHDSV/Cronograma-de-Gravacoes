import fs from 'node:fs'
import path from 'node:path'

const PEOPLE_MARKER = path.join('public', 'data', 'people.yaml')

/** Raiz do repo — funciona em dev (`server/`) e em prod (`dist-server/server/`). */
export function resolveProjectRoot(startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, PEOPLE_MARKER))) return dir
    const parent = path.resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  throw new Error(`Nao foi possivel localizar ${PEOPLE_MARKER} a partir de ${startDir}`)
}
