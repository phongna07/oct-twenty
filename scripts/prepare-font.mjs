// Convert the licensed local font to a small Three.js typeface containing only scene text.
// Usage: node scripts/prepare-font.mjs public/fonts/cormorant.ttf
import { readFileSync, writeFileSync } from 'node:fs'
import opentype from 'opentype.js'
const bytes = readFileSync(process.argv[2])
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
const scale = 1000 / font.unitsPerEm
const glyphs = {}
for (const char of new Set(Array.from('Chúc mừng ngày phụ nữ Việt Nam 20/10 321?'))) {
  const glyph = font.charToGlyph(char)
  if (glyph.index === 0 && char !== '?') throw new Error(`Missing glyph: ${char}`)
  const outline = glyph.path.commands.map(command => {
    const type = command.type === 'C' ? 'b' : command.type.toLowerCase()
    const values = []
    for (const [x,y] of [['x','y'],['x1','y1'],['x2','y2']]) if(command[x] !== undefined) values.push(Math.round(command[x]*scale),Math.round(command[y]*scale))
    return `${type} ${values.join(' ')}`
  }).join(' ')
  glyphs[char] = { ha: Math.round(glyph.advanceWidth*scale), x_min:Math.round((glyph.xMin||0)*scale),x_max:Math.round((glyph.xMax||0)*scale),o:outline }
}
writeFileSync('public/fonts/cormorant-greeting.json',JSON.stringify({glyphs,familyName:'Cormorant Garamond',ascender:Math.round(font.ascender*scale),descender:Math.round(font.descender*scale),underlinePosition:-100,underlineThickness:50,boundingBox:{yMin:font.tables.head.yMin*scale,yMax:font.tables.head.yMax*scale},resolution:1000}))
