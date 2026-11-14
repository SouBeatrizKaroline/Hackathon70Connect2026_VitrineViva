/**
 * Gera favicon.ico (16+32px) e apple-touch-icon.png (180px) a partir do desenho
 * da Vitrine Viva — sem dependências externas. Espelha public/favicon.svg:
 * mesma geometria (retângulos arredondados, semicírculos do toldo, triângulo
 * do brilho) e mesma ordem de pintura. Rasterização analítica por pixel.
 * Uso: node scripts/generate-favicon-assets.mjs  (roda via prebuild)
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { deflateSync } from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')

const IVORY = [0xf7, 0xf2, 0xe7, 255]
const GREEN = [0x12, 0x54, 0x35, 255]
const AMBER = [0xe3, 0xa2, 0x33, 255]

// Espelha public/favicon.svg — mesma geometria, mesma ordem de pintura.
const SHAPES = [
  { kind: 'rrect', x: 0, y: 0, w: 32, h: 32, rx: 7, fill: IVORY },
  { kind: 'rrect', x: 5, y: 4.6, w: 22, h: 2.4, rx: 1.2, fill: GREEN },
  // Corpo do toldo: faixa verde de y=7 a y=10.4 (a onda âmbar cobre a borda)
  { kind: 'rect', x: 5, y: 7, w: 22, h: 3.4, fill: GREEN },
  // Ondas do toldo: semicírculos pendurados na linha y=10.4
  { kind: 'scallops', y: 10.4, x0: 5, x1: 27, waveW: 5.5, ry: 2.75, fill: AMBER },
  { kind: 'rrect', x: 7.6, y: 13.6, w: 10.2, h: 13, rx: 1.5, fill: GREEN },
  { kind: 'rrect', x: 20.4, y: 13.6, w: 4, h: 13, rx: 1.4, fill: GREEN },
  { kind: 'triangle', a: [9.4, 15.6], b: [12.8, 15.6], c: [9.4, 20.2], fill: IVORY },
]

function pointInTriangle(px, py, a, b, c) {
  const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1])
  const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1])
  const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1])
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

function insideRRect(px, py, x, y, w, h, rx) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false
  const cx = Math.min(Math.max(px, x + rx), x + w - rx)
  const cy = Math.min(Math.max(py, y + rx), y + h - rx)
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= rx * rx
}

/** Semicírculos pendurados numa linha, descendo ry (as ondas do toldo). */
function insideScallops(s, px, py) {
  if (px < s.x0 || px >= s.x1 || py < s.y || py >= s.y + s.ry) return false
  const idx = Math.floor((px - s.x0) / s.waveW)
  const center = s.x0 + idx * s.waveW + s.waveW / 2
  const dx = px - center
  const dy = py - s.y
  return dx * dx + dy * dy <= s.ry * s.ry
}

function colorAt(px, py) {
  // A forma mais ao topo (última do array, como no SVG) vence.
  for (let i = SHAPES.length - 1; i >= 0; i--) {
    const s = SHAPES[i]
    let hit = false
    if (s.kind === 'rrect') {
      hit = insideRRect(px, py, s.x, s.y, s.w, s.h, s.rx)
    } else if (s.kind === 'rect') {
      hit = px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h
    } else if (s.kind === 'scallops') {
      hit = insideScallops(s, px, py)
    } else {
      hit = pointInTriangle(px, py, s.a, s.b, s.c)
    }
    if (hit) return s.fill
  }
  return [0, 0, 0, 0]
}

// ── PNG ────────────────────────────────────────────────────────────────────

let crcTable = null
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length)
  new DataView(out.buffer).setUint32(0, data.length)
  out.set(new TextEncoder().encode(type), 4)
  out.set(data, 8)
  const crcInput = new Uint8Array(4 + data.length)
  crcInput.set(new TextEncoder().encode(type))
  crcInput.set(data, 4)
  new DataView(out.buffer).setUint32(8 + data.length, crc32(crcInput))
  return out
}

function renderRgba(size) {
  const raw = new Uint8Array(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0 // filtro none
    for (let x = 0; x < size; x++) {
      const px = ((x + 0.5) * 32) / size
      const py = ((y + 0.5) * 32) / size
      const [r, g, b, a] = colorAt(px, py)
      const o = rowStart + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  return raw
}

function renderPng(size) {
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, size)
  view.setUint32(4, size)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const idat = deflateSync(renderRgba(size), { level: 9 })
  const parts = [
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array(0)),
  ]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

// ── ICO (PNG embutido) ─────────────────────────────────────────────────────

function buildIco(sizes) {
  const pngs = sizes.map(renderPng)
  const headerSize = 6 + sizes.length * 16
  const total = headerSize + pngs.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: icon
  view.setUint16(4, sizes.length, true) // count
  let offset = headerSize
  sizes.forEach((s, i) => {
    const e = 6 + i * 16
    out[e] = s === 256 ? 0 : s // width
    out[e + 1] = s === 256 ? 0 : s // height
    out[e + 2] = 0 // palette
    out[e + 3] = 0 // reserved
    view.setUint16(e + 4, 1, true) // planes
    view.setUint16(e + 6, 32, true) // bpp
    view.setUint32(e + 8, pngs[i].length, true)
    view.setUint32(e + 12, offset, true)
    offset += pngs[i].length
  })
  let pos = headerSize
  for (const p of pngs) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

// ── Geração ────────────────────────────────────────────────────────────────

writeFileSync(path.join(publicDir, 'favicon.ico'), buildIco([16, 32]))
writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(180))
console.log('[favicon] favicon.ico (16+32px) e apple-touch-icon.png (180px) gerados em public/')
