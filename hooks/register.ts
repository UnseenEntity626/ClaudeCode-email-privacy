import type { PromptContextBlock, Register } from 'claude-code'

const BLOCK = 'userEmail'

export const register: Register = (on, options) => {
  const alias = typeof options.alias === 'string' ? options.alias.trim() : ''
  // An override without an alias would leak nothing useful, so it falls back to remove.
  const replacement = options.mode === 'override' && alias !== '' ? `The user's email address is ${alias}.` : undefined

  const filter = (blocks: readonly PromptContextBlock[]): PromptContextBlock[] =>
    blocks.flatMap(block =>
      block.name !== BLOCK ? [block] : replacement === undefined ? [] : [{ ...block, text: replacement }],
    )

  on('prompt.context', async ($, e, next) => {
    const result = await next({ ...e, blocks: filter(e.blocks) })
    // A plugin beneath may add the block back; filter what reaches the model too.
    return { ...result, blocks: filter(result.blocks) }
  }).catch(async ($, e, next) => {
    // Fail closed: whatever went wrong, the address reaches neither the hooks beneath nor the model.
    const drop = (blocks: readonly PromptContextBlock[]) => blocks.filter(block => block.name !== BLOCK)
    const result = await next({ ...e, blocks: drop(e.blocks) })
    return { ...result, blocks: drop(result.blocks) }
  })
}
