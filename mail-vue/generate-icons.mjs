/**
 * Generates all app icons from the PSG Mail SVG source.
 * Run: node generate-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'

const SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="160" height="160" rx="40" fill="#000000" />
  <path d="M40 100 Q100 60 160 100" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9" />
  <path d="M60 110 L100 140 L140 110" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="100" y1="140" x2="100" y2="90" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" />
  <path d="M75 75 Q90 60 105 75" stroke="#E11D48" stroke-width="6" fill="none" stroke-linecap="round" />
</svg>`

function renderPng(size) {
  const resvg = new Resvg(SVG, { fitTo: { mode: 'width', value: size } })
  return Buffer.from(resvg.render().asPng())
}

// ICO container: embeds multiple PNGs (standard Windows ICO with PNG payloads)
function makeIco(sizes) {
  const pngs = sizes.map(size => ({ size, data: renderPng(size) }))
  const count = pngs.length
  let offset = 6 + count * 16
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const dir = Buffer.alloc(count * 16)
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16
    dir[o]     = size >= 256 ? 0 : size
    dir[o + 1] = size >= 256 ? 0 : size
    dir[o + 2] = 0; dir[o + 3] = 0
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...pngs.map(p => p.data)])
}

// ── Public / PWA icons ────────────────────────────────────
writeFileSync('./public/pwa-192.png',          renderPng(192)); console.log('✓ pwa-192.png')
writeFileSync('./public/pwa-512.png',          renderPng(512)); console.log('✓ pwa-512.png')
writeFileSync('./public/pwa-maskable-512.png', renderPng(512)); console.log('✓ pwa-maskable-512.png')
writeFileSync('./public/apple-touch-icon.png', renderPng(180)); console.log('✓ apple-touch-icon.png')
writeFileSync('./public/mail-pwa.png',         renderPng(512)); console.log('✓ mail-pwa.png')
writeFileSync('./public/mail.png',             renderPng(128)); console.log('✓ mail.png')

// ── Electron build icons (light + dark theme share the same source) ────────
for (const name of ['icon', 'desktop-icon']) {
  writeFileSync(`./build/${name}.png`, renderPng(512))
  console.log(`✓ build/${name}.png`)
  writeFileSync(`./build/${name}.ico`, makeIco([16, 32, 48, 64, 128, 256]))
  console.log(`✓ build/${name}.ico`)
}

// ── SVG favicon (verbatim source) ─────────────────────────
writeFileSync('./public/favicon.svg', SVG)
console.log('✓ favicon.svg')

console.log('\nAll icons written.')
