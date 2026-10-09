# email-privacy

Claude Code が会話の最初のユーザーメッセージに自動で付ける `# userEmail` ブロック（ログイン中アカウントのメールアドレス）を、モデルに送る前に取り除く、または別のアドレスに置き換える mod です。

ログインや課金に使うアカウントはそのままで、モデルに渡る文脈からだけメールアドレスを外せます。

## インストール

Claude Code のプロンプトで次を入力します。

```
/plugin install email-privacy --marketplace unseenentity626/claudecode-email-privacy
```

marketplace を追加するか聞かれたら `y` を押し、インストール先のスコープを選びます。新しく始める会話から有効になります。

## 設定

`/config` で変更できます。

| 項目 | 値 | 動作 |
| --- | --- | --- |
| `mode` | `remove`（既定） | `userEmail` ブロックを送りません |
| | `override` | ブロックの本文を `The user's email address is <alias>.` に置き換えます |
| `alias` | 文字列（既定は空） | `override` のときに見せるアドレスです。空なら `remove` と同じ動作になります |

## 仕組み

`prompt.context` フックで文脈ブロックの一覧を受け取り、`name === "userEmail"` のブロックを外す（または本文を差し替える）してから engine に渡します。

- engine から返ってきた結果にも同じ処理をかけ直します。他の plugin が同じブロックを足し直した場合への備えです。
- フック内でエラーが起きたときも、`userEmail` を外した結果を返します（エラー時も送らない側に倒します）。

## 確かめたこと（Claude Code 2.1.295）

- `claude plugin validate`、`claude plugin test`（5 件）、`tsc` がすべて通ります。
- `claude -p` で mod あり・なしを比べました。
  - mod なしでは `# userEmail` が見え、ドメインを答えます。
  - mod ありでは `# userEmail` が見えず、アドレスも答えません。
  - これはモデル自身の答えにもとづく確認です。

## 防げないこと

- 止められるのは `prompt.context` の `userEmail` ブロックだけです。次のような別の経路でアドレスがモデルに見えることは防げません。
  - git の author 設定や `git log`
  - `gh` などのコマンドの出力
  - ファイルの中身
  - MCP コネクタの応答
- 認証情報（`~/.claude.json` など）には触りません。
- 実行環境によっては、別の仕組みで同じ情報を足している可能性があります。その経路まで塞げるかは環境ごとに確かめてください。
- mod の API（function hooks）は EARLY ACCESS で、今後のリリースで予告なく変わることがあります。

## 開発

```
claude plugin validate .
claude plugin test .
claude --plugin-dir . # 手元で読み込んで試す
```
