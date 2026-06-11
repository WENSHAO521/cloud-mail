const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const buildDir = path.join(root, 'build')
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1)
    raw[row] = 0
    pixels.copy(raw, row + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function setPixel(pixels, width, x, y, color, coverage = 1) {
  const i = (y * width + x) * 4
  const a = Math.max(0, Math.min(1, coverage))
  pixels[i] = Math.round(pixels[i] * (1 - a) + color[0] * a)
  pixels[i + 1] = Math.round(pixels[i + 1] * (1 - a) + color[1] * a)
  pixels[i + 2] = Math.round(pixels[i + 2] * (1 - a) + color[2] * a)
  pixels[i + 3] = 255
}

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax
  const vy = by - ay
  const wx = px - ax
  const wy = py - ay
  const len2 = vx * vx + vy * vy
  const t = len2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0
  const dx = px - (ax + t * vx)
  const dy = py - (ay + t * vy)
  return Math.hypot(dx, dy)
}

function pointOnQuad(p0, p1, p2, t) {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

function strokePolyline(pixels, width, points, strokeWidth, color) {
  const radius = strokeWidth / 2
  const pad = radius + 2
  const minX = Math.max(0, Math.floor(Math.min(...points.map(p => p.x)) - pad))
  const maxX = Math.min(width - 1, Math.ceil(Math.max(...points.map(p => p.x)) + pad))
  const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p.y)) - pad))
  const maxY = Math.min(width - 1, Math.ceil(Math.max(...points.map(p => p.y)) + pad))

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let d = Infinity
      for (let i = 0; i < points.length - 1; i += 1) {
        d = Math.min(d, distToSegment(x + 0.5, y + 0.5, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y))
      }
      for (const p of points) d = Math.min(d, Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y))
      const coverage = Math.max(0, Math.min(1, radius + 0.7 - d))
      if (coverage > 0) setPixel(pixels, width, x, y, color, coverage)
    }
  }
}

function strokeQuad(pixels, width, p0, p1, p2, strokeWidth, color) {
  const points = []
  for (let i = 0; i <= 96; i += 1) points.push(pointOnQuad(p0, p1, p2, i / 96))
  strokePolyline(pixels, width, points, strokeWidth, color)
}

function renderIcon(size, scale = 1, offset = 0) {
  const pixels = Buffer.alloc(size * size * 4)
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 0
    pixels[i + 1] = 0
    pixels[i + 2] = 0
    pixels[i + 3] = 255
  }

  const s = (size / 1024) * scale
  const p = (x, y) => ({ x: offset + x * s, y: offset + y * s })
  const w = n => n * s

  strokeQuad(pixels, size, p(204, 512), p(512, 327), p(820, 512), w(42), [230, 230, 230])
  strokeQuad(pixels, size, p(384, 384), p(461, 307), p(538, 384), w(32), [240, 24, 75])
  strokePolyline(pixels, size, [p(307, 563), p(512, 718), p(717, 563)], w(52), [255, 255, 255])
  strokePolyline(pixels, size, [p(512, 461), p(512, 718)], w(52), [255, 255, 255])

  return pixels
}

function resizeNearest(source, sourceSize, targetSize) {
  const output = Buffer.alloc(targetSize * targetSize * 4)
  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const sx = Math.min(sourceSize - 1, Math.floor((x * sourceSize) / targetSize))
      const sy = Math.min(sourceSize - 1, Math.floor((y * sourceSize) / targetSize))
      source.copy(output, (y * targetSize + x) * 4, (sy * sourceSize + sx) * 4, (sy * sourceSize + sx + 1) * 4)
    }
  }
  return output
}

function writePng(relativePath, size, pixels = renderIcon(size)) {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, encodePng(size, size, pixels))
  console.log(`Generated ${relativePath}`)
}

function writeIco(relativePath, sourceSize, sourcePixels) {
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngs = sizes.map(size => encodePng(size, size, resizeNearest(sourcePixels, sourceSize, size)))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  const entries = []
  let offset = header.length + sizes.length * 16
  for (let i = 0; i < sizes.length; i += 1) {
    const size = sizes[i]
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(pngs[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += pngs[i].length
  }
  fs.writeFileSync(path.join(root, relativePath), Buffer.concat([header, ...entries, ...pngs]))
  console.log(`Generated ${relativePath}`)
}

fs.mkdirSync(publicDir, { recursive: true })
fs.mkdirSync(buildDir, { recursive: true })

writePng('public/pwa-192.png', 192)
writePng('public/pwa-512.png', 512)
writePng('public/apple-touch-icon.png', 180)
writePng('public/pwa-maskable-512.png', 512, renderIcon(512, 0.76, Math.round(512 * 0.12)))
writePng('public/mail.png', 128)
writePng('public/mail-pwa.png', 512)
writePng('build/icon.png', 512)
writePng('build/desktop-icon.png', 512)
writeIco('build/icon.ico', 512, renderIcon(512))
writeIco('build/desktop-icon.ico', 512, renderIcon(512))

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), fs.readFileSync(path.join(publicDir, 'image', 'psg-icon-logo.svg')))
console.log('Generated public/favicon.svg')

const androidResDir = path.join(root, 'android', 'app', 'src', 'main', 'res')
if (fs.existsSync(androidResDir)) {
  const densities = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ]

  for (const [dir, size] of densities) {
    const densityDir = path.join(androidResDir, dir)
    fs.mkdirSync(densityDir, { recursive: true })
    const png = encodePng(size, size, renderIcon(size))
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      fs.writeFileSync(path.join(densityDir, name), png)
    }
    console.log(`Generated android/app/src/main/res/${dir}/ic_launcher*.png`)
  }
}
