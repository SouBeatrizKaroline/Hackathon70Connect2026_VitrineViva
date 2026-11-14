/**
 * Gera o ícone da Vitrine Viva em PNG via <canvas>, a partir da mesma geometria
 * de public/favicon.svg. Injeta apple-touch-icon (180px) no <head> para que o
 * ícone apareça quando o app é adicionado à tela inicial do celular.
 */

type Point = [number, number]

type Shape =
  | { kind: 'rrect'; x: number; y: number; w: number; h: number; rx: number; fill: string }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { kind: 'scallops'; y: number; x0: number; x1: number; waveW: number; ry: number; fill: string }
  | { kind: 'triangle'; a: Point; b: Point; c: Point; fill: string }

const GREEN = '#125435'
const AMBER = '#E3A233'
const IVORY = '#F7F2E7'

// Espelha public/favicon.svg — mesma geometria, mesma ordem de pintura.
const SHAPES: Shape[] = [
  { kind: 'rrect', x: 0, y: 0, w: 32, h: 32, rx: 7, fill: IVORY },
  { kind: 'rrect', x: 5, y: 4.6, w: 22, h: 2.4, rx: 1.2, fill: GREEN },
  { kind: 'rect', x: 5, y: 7, w: 22, h: 3.4, fill: GREEN },
  { kind: 'scallops', y: 10.4, x0: 5, x1: 27, waveW: 5.5, ry: 2.75, fill: AMBER },
  { kind: 'rrect', x: 7.6, y: 13.6, w: 10.2, h: 13, rx: 1.5, fill: GREEN },
  { kind: 'rrect', x: 20.4, y: 13.6, w: 4, h: 13, rx: 1.4, fill: GREEN },
  { kind: 'triangle', a: [9.4, 15.6], b: [12.8, 15.6], c: [9.4, 20.2], fill: IVORY },
]

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, scale: number): void {
  ctx.fillStyle = s.fill
  ctx.beginPath()
  if (s.kind === 'rrect') {
    const r = s.rx * scale
    ctx.roundRect(s.x * scale, s.y * scale, s.w * scale, s.h * scale, r)
  } else if (s.kind === 'rect') {
    ctx.rect(s.x * scale, s.y * scale, s.w * scale, s.h * scale)
  } else if (s.kind === 'scallops') {
    // Semicírculos pendurados na linha y (ondas do toldo)
    for (let x = s.x0; x < s.x1; x += s.waveW) {
      ctx.moveTo((x + s.waveW / 2) * scale, s.y * scale)
      ctx.arc((x + s.waveW / 2) * scale, s.y * scale, s.ry * scale, 0, Math.PI)
    }
  } else {
    ctx.moveTo(s.a[0] * scale, s.a[1] * scale)
    ctx.lineTo(s.b[0] * scale, s.b[1] * scale)
    ctx.lineTo(s.c[0] * scale, s.c[1] * scale)
    ctx.closePath()
  }
  ctx.fill()
}

function renderIconPng(size: number): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const scale = size / 32
  for (const s of SHAPES) {
    drawShape(ctx, s, scale)
  }
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * Cria apple-touch-icon (180px) a partir do desenho e o injeta no <head>.
 * iOS não usa SVG em apple-touch-icon, por isso o PNG gerado em runtime.
 */
export function installTouchIcon(): void {
  if (document.querySelector('link[rel="apple-touch-icon"][data-generated]')) return
  const href = renderIconPng(180)
  if (!href) return
  const link = document.createElement('link')
  link.rel = 'apple-touch-icon'
  link.setAttribute('sizes', '180x180')
  link.setAttribute('data-generated', 'true')
  link.href = href
  document.head.appendChild(link)
}
