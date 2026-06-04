// Deterministic dark/red palette — stays on-brand without being uniform
const PALETTE = [
  '#CC0000', '#8B0000', '#1a1a1a', '#333333',
  '#555555', '#6B2020', '#444444', '#7a0000'
]

export function avatarBg(seed) {
  if (!seed) return PALETTE[0]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function avatarLetter(name, email) {
  return ((name || email || '?')[0] || '?').toUpperCase()
}

export function storedAvatar(email) {
  return email ? (localStorage.getItem(`psg_avatar_${email}`) ?? '') : ''
}
