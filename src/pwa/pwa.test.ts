import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
  pwaIconAssets,
  pwaManifest,
} from './manifest'

const projectRoot = join(import.meta.dirname, '../..')
const publicDir = join(projectRoot, 'public')

describe('pwaManifest', () => {
  it('includes required install metadata', () => {
    expect(pwaManifest.name).toBe('SRT Tech Team OKRs')
    expect(pwaManifest.short_name).toBeTruthy()
    expect(pwaManifest.start_url).toBe('/')
    expect(pwaManifest.display).toBe('standalone')
    expect(pwaManifest.theme_color).toBe(PWA_THEME_COLOR)
    expect(pwaManifest.background_color).toBe(PWA_BACKGROUND_COLOR)
  })

  it('declares standard and maskable icons', () => {
    expect(pwaManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    )
  })
})

describe('PWA icon assets', () => {
  it('ships every referenced icon from public/', () => {
    for (const asset of pwaIconAssets) {
      expect(existsSync(join(publicDir, asset))).toBe(true)
    }
  })

  it('uses a branded app icon SVG', () => {
    const svg = readFileSync(join(publicDir, 'app-icon.svg'), 'utf8')

    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 512 512"')
    expect(svg).toMatch(/#4338CA|#6366F1|#9333EA/)
    expect(svg).toContain('#34D399')
  })

  it('keeps favicon aligned with the app icon palette', () => {
    const favicon = readFileSync(join(publicDir, 'favicon.svg'), 'utf8')

    expect(favicon).toContain('viewBox="0 0 32 32"')
    expect(favicon).toMatch(/#4F46E5|#7C3AED/)
    expect(favicon).toContain('#34D399')
  })
})

describe('index.html PWA hooks', () => {
  it('links favicon, theme color, and apple touch icon', () => {
    const html = readFileSync(join(projectRoot, 'index.html'), 'utf8')

    expect(html).toContain('href="/favicon.svg"')
    expect(html).toContain(`content="${PWA_THEME_COLOR}"`)
    expect(html).toContain('href="/apple-touch-icon.png"')
    expect(html).toContain(pwaManifest.description)
  })
})
