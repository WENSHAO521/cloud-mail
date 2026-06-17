'use strict'
const fs   = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')

const root      = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const buildDir  = path.join(root, 'build')

// ── Full icon (legacy ic_launcher.png / ic_launcher_round.png) ───────────────
const SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="12" width="176" height="176" rx="38" fill="#0d0d0d"/>
  <rect x="28" y="68" width="144" height="90" rx="4" fill="#ffffff"/>
  <path d="M28 68 L100 106 L172 68 Z" fill="#0d0d0d"/>
  <circle cx="100" cy="107" r="13" fill="#bc0000"/>
</svg>`

// ── Adaptive icon foreground (artwork inset to 72dp safe zone of 108dp canvas) ─
// No background fill — background comes from ic_launcher_background color (#0d0d0d)
const FOREGROUND_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="36" y="72" width="128" height="78" rx="5" fill="#ffffff"/>
  <path d="M36 72 L100 107 L164 72 Z" fill="#dddddd"/>
  <circle cx="100" cy="107" r="11" fill="#bc0000"/>
</svg>`

function renderPng(size) {
  const resvg = new Resvg(SVG, { fitTo: { mode: 'width', value: size } })
  return Buffer.from(resvg.render().asPng())
}

function makeIco(sizes) {
  const pngs  = sizes.map(size => ({ size, data: renderPng(size) }))
  const count = pngs.length
  let offset  = 6 + count * 16
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
    dir.writeUInt16LE(1,  o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset,      o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...pngs.map(p => p.data)])
}

function writePng(relativePath, size) {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, renderPng(size))
  console.log(`Generated ${relativePath}`)
}

function writeIco(relativePath, sizes) {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, makeIco(sizes))
  console.log(`Generated ${relativePath}`)
}

fs.mkdirSync(publicDir, { recursive: true })
fs.mkdirSync(buildDir,  { recursive: true })

// PWA / web icons
writePng('public/pwa-192.png',          192)
writePng('public/pwa-512.png',          512)
writePng('public/pwa-maskable-512.png', 512)
writePng('public/apple-touch-icon.png', 180)
writePng('public/mail.png',             128)
writePng('public/mail-pwa.png',         512)

// Electron build icons
writePng('build/icon.png',         512)
writePng('build/desktop-icon.png', 512)
writeIco('build/icon.ico',         [16, 24, 32, 48, 64, 128, 256])
writeIco('build/desktop-icon.ico', [16, 24, 32, 48, 64, 128, 256])

// Favicon SVG (verbatim from branding source)
fs.writeFileSync(
  path.join(publicDir, 'favicon.svg'),
  fs.readFileSync(path.join(publicDir, 'image', 'psg-icon-logo.svg'))
)
console.log('Generated public/favicon.svg')

// Android mipmap icons
const androidResDir = path.join(root, 'android', 'app', 'src', 'main', 'res')
if (fs.existsSync(androidResDir)) {
  const densities = [
    ['mipmap-mdpi',     48],
    ['mipmap-hdpi',     72],
    ['mipmap-xhdpi',    96],
    ['mipmap-xxhdpi',  144],
    ['mipmap-xxxhdpi', 192],
  ]
  for (const [dir, size] of densities) {
    const densityDir = path.join(androidResDir, dir)
    fs.mkdirSync(densityDir, { recursive: true })
    const png = renderPng(size)
    const fgResvg = new Resvg(FOREGROUND_SVG, { fitTo: { mode: 'width', value: size } })
    const fgPng   = Buffer.from(fgResvg.render().asPng())
    fs.writeFileSync(path.join(densityDir, 'ic_launcher.png'),            png)
    fs.writeFileSync(path.join(densityDir, 'ic_launcher_round.png'),      png)
    fs.writeFileSync(path.join(densityDir, 'ic_launcher_foreground.png'), fgPng)
    console.log(`Generated android/app/src/main/res/${dir}/ic_launcher*.png`)
  }
}
