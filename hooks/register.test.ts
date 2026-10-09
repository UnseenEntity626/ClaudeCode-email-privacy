import { describe, expect, test } from 'claude-code/testing'
import type { On, PromptContextBlock } from 'claude-code'

const BLOCKS: PromptContextBlock[] = [
  { name: 'claudeMd', text: 'instructions' },
  { name: 'userEmail', text: "The user's email address is someone@example.com." },
  { name: 'currentDate', text: "Today's date is 2026-10-09." },
]

// Stands for the engine: renders the blocks it is handed.
const engine = (on: On) => on('prompt.context', (_$, e) => ({ blocks: e.blocks }))

describe('remove (default)', () => {
  test('drops userEmail and keeps the rest in order', async ($, on) => {
    engine(on)
    const { blocks } = await $.prompt.context({ blocks: BLOCKS })
    expect(blocks.map(b => b.name)).toEqual(['claudeMd', 'currentDate'])
    expect(blocks[0]?.text).toBe('instructions')
  })

  test('leaves a context without userEmail unchanged', async ($, on) => {
    engine(on)
    const input = BLOCKS.filter(b => b.name !== 'userEmail')
    const { blocks } = await $.prompt.context({ blocks: input })
    expect(blocks).toEqual(input)
  })

  test('drops userEmail added back beneath it', async ($, on) => {
    on('prompt.context', (_$, e) => ({ blocks: [...e.blocks, BLOCKS[1]!] }))
    const { blocks } = await $.prompt.context({ blocks: BLOCKS })
    expect(blocks.some(b => b.name === 'userEmail')).toBe(false)
  })
})

describe('override', () => {
  test('replaces the address with the alias', { options: { mode: 'override', alias: 'alias@example.net' } }, async ($, on) => {
    engine(on)
    const { blocks } = await $.prompt.context({ blocks: BLOCKS })
    expect(blocks.map(b => b.name)).toEqual(['claudeMd', 'userEmail', 'currentDate'])
    expect(blocks[1]?.text).toBe("The user's email address is alias@example.net.")
  })

  test('falls back to remove when the alias is empty', { options: { mode: 'override', alias: '  ' } }, async ($, on) => {
    engine(on)
    const { blocks } = await $.prompt.context({ blocks: BLOCKS })
    expect(blocks.some(b => b.name === 'userEmail')).toBe(false)
  })
})
