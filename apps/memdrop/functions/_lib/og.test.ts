import { describe, expect, it } from 'vitest'
import { buildOgImage } from './og.js'

describe('buildOgImage', () => {
  it('returns a string containing svg root element', () => {
    expect(buildOgImage('Test Event')).toContain('<svg')
  })

  it('includes the event name', () => {
    expect(buildOgImage('My Wedding')).toContain('My Wedding')
  })

  it('escapes HTML entities in name', () => {
    const svg = buildOgImage('Tom & Jerry <Party>')
    expect(svg).toContain('Tom &amp; Jerry &lt;Party&gt;')
    expect(svg).not.toContain('Tom & Jerry')
  })

  it('uses smaller font for long names', () => {
    const short = buildOgImage('Hi')
    const long = buildOgImage('A Very Long Event Name That Goes Beyond Thirty Five Characters')
    expect(short).toContain('font-size="80"')
    expect(long).toContain('font-size="52"')
  })
})
