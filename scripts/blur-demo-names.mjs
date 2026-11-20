/**
 * Aplica blur nos nomes das pessoas nos prints do README (e em demo.png, se existir).
 * Uso: node scripts/blur-demo-names.mjs
 *
 * Regiões calibradas para viewport 1440×900 (capturar-telas / CDP).
 */
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

/** @type {{ file: string, regions: { left: number, top: number, width: number, height: number }[] }[]} */
const targets = [
  {
    file: path.join(root, 'assets/screenshots/resumo.png'),
    // Coluna PESSOA da tabela "Progresso por pessoa"
    regions: [{ left: 40, top: 480, width: 220, height: 360 }],
  },
  {
    file: path.join(root, 'assets/screenshots/por-pessoa.png'),
    // Faixa esquerda com o nome em cada card
    regions: [{ left: 48, top: 160, width: 200, height: 620 }],
  },
  {
    // Legado: print raiz usado em demos antigas
    file: path.join(root, 'demo.png'),
    regions: null,
  },
]

async function blurFile(file, regions) {
  try {
    await fs.access(file)
  } catch {
    console.log(`skip (ausente): ${path.relative(root, file)}`)
    return
  }

  const { width, height } = await sharp(file).metadata()
  if (!width || !height) throw new Error(`sem dimensões: ${file}`)

  let rects = regions
  if (!rects) {
    // Proporcional ao layout antigo 1863×1070
    rects = [
      {
        left: Math.round(width * 0.018),
        top: Math.round(height * 0.582),
        width: Math.round(width * 0.19),
        height: Math.round(height * 0.38),
      },
    ]
  }

  const composites = []
  for (const r of rects) {
    const left = Math.max(0, Math.min(r.left, width - 1))
    const top = Math.max(0, Math.min(r.top, height - 1))
    const rw = Math.min(r.width, width - left)
    const rh = Math.min(r.height, height - top)
    const blurred = await sharp(file)
      .extract({ left, top, width: rw, height: rh })
      .blur(16)
      .toBuffer()
    composites.push({ input: blurred, left, top })
    console.log(`  região ${rw}x${rh} @ ${left},${top}`)
  }

  const tmp = `${file}.blur-tmp.png`
  await sharp(file).composite(composites).png().toFile(tmp)
  await fs.rename(tmp, file)
  console.log(`OK: ${path.relative(root, file)}`)
}

for (const t of targets) {
  await blurFile(t.file, t.regions)
}
