import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

vi.mock('../../utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}))

import { copyToClipboard } from '../../utils/clipboard'

describe('CopyButton', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('copies the provided text when clicked', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="Reduce pipeline configuration inputs" label="Copy key result" />)

    await user.click(screen.getByRole('button', { name: 'Copy key result' }))

    expect(copyToClipboard).toHaveBeenCalledWith('Reduce pipeline configuration inputs')
  })

  it('shows copied feedback after a successful copy', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="Improve platform reliability" label="Copy objective" />)

    await user.click(screen.getByRole('button', { name: 'Copy objective' }))

    expect(await screen.findByRole('button', { name: 'Copy objective copied' })).toBeInTheDocument()
  })

  it('does not bubble clicks to parent handlers', async () => {
    const user = userEvent.setup()
    const onParentClick = vi.fn()

    render(
      <div onClick={onParentClick}>
        <CopyButton text="Improve platform reliability" label="Copy objective" />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Copy objective' }))

    expect(onParentClick).not.toHaveBeenCalled()
  })
})
