import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import pngToIco from "png-to-ico"
import sharp from "sharp"

const repoRoot = process.cwd()
const publicDir = path.join(repoRoot, "public")
const inputPngPath = path.join(publicDir, "favicon-source.png")
const outputPngPath = path.join(publicDir, "favicon.png")
const outputIcoPath = path.join(publicDir, "favicon.ico")

await mkdir(publicDir, { recursive: true })

const normalizedPngBuffer = await sharp(inputPngPath)
  .resize(256, 256, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

await writeFile(outputPngPath, normalizedPngBuffer)

const icoBuffer = await pngToIco(normalizedPngBuffer)
await writeFile(outputIcoPath, icoBuffer)

console.log(`OK: ${path.relative(repoRoot, outputIcoPath)}`)
