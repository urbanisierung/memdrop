function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildOgImage(name: string): string {
  const escaped = escapeXml(name)
  const fontSize = name.length > 35 ? 52 : name.length > 20 ? 64 : 80

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <path d="M1080 50 C1080 50 1000 165 1000 225 a80 80 0 0 0 160 0 C1160 165 1080 50 1080 50 Z" fill="#4f8ef7" opacity="0.18"/>
  <path d="M1155 210 C1155 210 1127 257 1127 280 a28 28 0 0 0 56 0 C1183 257 1155 210 1155 210 Z" fill="#4f8ef7" opacity="0.3"/>
  <rect x="80" y="150" width="6" height="330" rx="3" fill="#4f8ef7"/>
  <text x="116" y="330" dominant-baseline="middle" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="#f8fafc">${escaped}</text>
  <rect x="116" y="400" width="56" height="4" rx="2" fill="#4f8ef7"/>
  <text x="116" y="450" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="28" font-weight="600" fill="#4f8ef7">memdrop</text>
</svg>`
}
