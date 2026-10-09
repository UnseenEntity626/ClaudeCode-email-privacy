# email-privacy

**English** | [日本語](README.ja.md)

A Claude Code mod that removes the `# userEmail` block (your signed-in account's email address), which Claude Code automatically attaches to the first user message of every conversation, before it reaches the model — or replaces it with a different address.

Your account stays signed in and billed as usual; only the address is kept out of the context the model sees.

## Background

When you sign in with OAuth (a subscription), Claude Code reads `oauthAccount.emailAddress` from `~/.claude.json` and adds it to the model's context as a `# userEmail` block in every conversation. The model knows your address even if you never mention it. As of October 2026 there is no official setting to turn this off ([anthropics/claude-code#81138](https://github.com/anthropics/claude-code/issues/81138) is still open).

There are reports of the model writing that address out on its own initiative:

- It put a personal address into the User-Agent of generated code, which was then sent to an external API about 4,000 times (v2.1.233, [Qiita, in Japanese](https://qiita.com/ackyv7/items/aba872aa1a4a389661fd)).
- It committed with `git -c user.email=<address>`, overriding a configured noreply identity ([#81138](https://github.com/anthropics/claude-code/issues/81138)).
- It mentioned the address in a reply without being asked (same issue).

Since v2.1.234 the block carries an extra sentence telling the model to use the address only to identify the user and not to send it to unrelated services unless asked. That is an instruction to the model, though: the address stays in the context, and what counts as an "unrelated service" is still the model's call. This mod closes that path by not passing the block to the model at all.

## Install

Type the following at the Claude Code prompt:

```
/plugin install email-privacy --marketplace unseenentity626/claudecode-email-privacy
```

If asked whether to add the marketplace, press `y`, then choose the install scope. The mod takes effect in conversations started after installing.

## Settings

Change these with `/config`.

| Option | Value | Behavior |
| --- | --- | --- |
| `mode` | `remove` (default) | Does not send the `userEmail` block |
| | `override` | Replaces the whole block body with `The user's email address is <alias>.` (this also drops the usage sentence added in v2.1.234) |
| `alias` | string (empty by default) | The address shown in `override` mode. If empty, behaves like `remove` |

## How it works

A `prompt.context` hook receives the list of context blocks, removes the block whose `name === "userEmail"` (or replaces its body), and then passes the list on to the engine.

- The same filter is applied again to the result coming back from the engine, in case another plugin adds the block back.
- If an error occurs inside the hook, it still removes `userEmail` before passing the blocks to the hooks beneath, and removes it from what they return (it fails closed: on error, the address is not sent).

## What was checked (Claude Code 2.1.295)

- `claude plugin validate`, `claude plugin test` (5 tests), and `tsc` all pass.
- Compared `claude -p` with and without the mod:
  - Without the mod, the model sees `# userEmail` and gives the domain when asked.
  - With the mod, the model does not see `# userEmail` and does not give the address.
  - This check relies on the model's own answers.

## What it does not prevent

- It only stops the `userEmail` block in `prompt.context`. It cannot stop the address from reaching the model through other paths, such as:
  - git author settings or `git log`
  - output of commands like `gh`
  - file contents (including addresses written into memory or `CLAUDE.md` in earlier conversations)
  - MCP connector responses
- There are reports of the account address appearing in `Co-authored-by:` commit trailers (since around v2.1.165, [anthropics/claude-code#66079](https://github.com/anthropics/claude-code/issues/66079)). Whether that comes from the `userEmail` block has not been verified. Check commit authors and trailers before pushing to a public repository.
- It cannot remove the address from commits already pushed or requests already sent.
- It does not touch credentials (such as `~/.claude.json`).
- Some execution environments may add the same information through a different mechanism. Check in each environment whether that path is covered too.
- The mod API (function hooks) is EARLY ACCESS and may change without notice in future releases.

## Development

```
claude plugin validate .
claude plugin test .
claude --plugin-dir . # load it locally to try it out
```
