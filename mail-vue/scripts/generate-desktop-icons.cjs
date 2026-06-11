const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const root = path.resolve(__dirname, '..')
const sourcePng = path.join(root, 'build', 'icon.png')
const desktopPng = path.join(root, 'build', 'desktop-icon.png')
const desktopIco = path.join(root, 'build', 'desktop-icon.ico')

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

function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Invalid PNG signature')
  const chunks = []
  let offset = 8
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    chunks.push({ type, data })
    offset += 12 + length
    if (type === 'IEND') break
  }
  return chunks
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

function decodeRgbaPng(buffer) {
  const chunks = readChunks(buffer)
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR')?.data
  if (!ihdr) throw new Error('Missing IHDR')

  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const bitDepth = ihdr[8]
  const colorType = ihdr[9]
  const compression = ihdr[10]
  const filter = ihdr[11]
  const interlace = ihdr[12]

  if (bitDepth !== 8 || colorType !== 6 || compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error('Only non-interlaced 8-bit RGBA PNG files are supported')
  }

  const compressed = Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data))
  const inflated = zlib.inflateSync(compressed)
  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const pixels = Buffer.alloc(width * height * bytesPerPixel)

  let inputOffset = 0
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[inputOffset]
    inputOffset += 1
    const row = inflated.subarray(inputOffset, inputOffset + stride)
    inputOffset += stride
    const outOffset = y * stride

    for (let x = 0; x < stride; x += 1) {
      const raw = row[x]
      const left = x >= bytesPerPixel ? pixels[outOffset + x - bytesPerPixel] : 0
      const up = y > 0 ? pixels[outOffset + x - stride] : 0
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[outOffset + x - stride - bytesPerPixel] : 0

      let value
      if (filterType === 0) value = raw
      else if (filterType === 1) value = raw + left
      else if (filterType === 2) value = raw + up
      else if (filterType === 3) value = raw + Math.floor((left + up) / 2)
      else if (filterType === 4) value = raw + paeth(left, up, upLeft)
      else throw new Error(`Unsupported PNG filter: ${filterType}`)

      pixels[outOffset + x] = value & 0xff
    }
  }

  return { width, height, pixels }
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.length)
  chunk.writeUInt32BE(data.length, 0)
  typeBuffer.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return chunk
}

function encodeRgbaPng(width, height, pixels) {
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
    const rawOffset = y * (stride + 1)
    raw[rawOffset] = 0
    pixels.copy(raw, rawOffset + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

function makeWhiteIcon(pixels) {
  const output = Buffer.from(pixels)
  for (let i = 0; i < output.length; i += 4) {
    const alpha = output[i + 3]
    output[i] = 255
    output[i + 1] = 255
    output[i + 2] = 255
    output[i + 3] = Math.min(255, Math.round(alpha * 1.35))
  }
  return output
}

function resizeNearest(source, sourceWidth, sourceHeight, size) {
  const output = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y * sourceHeight) / size))
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x * sourceWidth) / size))
      const sourceOffset = (sourceY * sourceWidth + sourceX) * 4
      const outputOffset = (y * size + x) * 4
      source.copy(output, outputOffset, sourceOffset, sourceOffset + 4)
    }
  }
  return output
}

function writeIco(width, height, pixels, icoPath) {
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngs = sizes.map((size) => encodeRgbaPng(size, size, resizeNearest(pixels, width, height, size)))
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
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(pngs[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += pngs[i].length
  }

  fs.writeFileSync(icoPath, Buffer.concat([header, ...entries, ...pngs]))
}

// The icon uses a dark background that works for both light and dark system themes,
// so desktop-icon is identical to icon (no white conversion needed).
const source = fs.readFileSync(sourcePng)
const { width, height, pixels } = decodeRgbaPng(source)
fs.writeFileSync(desktopPng, encodeRgbaPng(width, height, pixels))
writeIco(width, height, pixels, desktopIco)

console.log(`Generated ${path.relative(root, desktopPng)} and ${path.relative(root, desktopIco)}`)
