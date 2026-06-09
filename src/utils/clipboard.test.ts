import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyToClipboard('Improve platform reliability')

    expect(writeText).toHaveBeenCalledWith('Improve platform reliability')
  })
})
