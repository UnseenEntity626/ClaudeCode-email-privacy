# email-privacy

[English](README.md) | **日本語**

Claude Code が会話の最初のユーザーメッセージに自動で付ける `# userEmail` ブロック（ログイン中アカウントのメールアドレス）を、モデルに送る前に取り除く、または別のアドレスに置き換える mod です。

ログインや課金に使うアカウントはそのままで、モデルに渡る文脈からだけメールアドレスを外せます。

## 背景

OAuth（サブスクリプション）でログインした Claude Code は、`~/.claude.json` の `oauthAccount.emailAddress` を読み、会話ごとに `# userEmail` ブロックとしてモデルの文脈に入れます。ユーザーが会話で教えていなくても、モデルはアドレスを知っています。これを止める公式の設定は、2026 年 10 月時点で見つかっていません（[anthropics/claude-code#81138](https://github.com/anthropics/claude-code/issues/81138) は Open のままです）。

この文脈のアドレスが、モデルの判断で外に書き出された例が報告されています。

- 生成したコードの User-Agent に個人のアドレスが入り、外部 API へ約 4,000 回送られた（v2.1.233、[Qiita](https://qiita.com/ackyv7/items/aba872aa1a4a389661fd)）
- `git -c user.email=<アドレス>` でコミットされ、設定していた noreply の identity が上書きされた（[#81138](https://github.com/anthropics/claude-code/issues/81138)）
- 頼んでいないのに、回答の中でアドレスに触れた（同上）

v2.1.234 以降、ブロックには「ユーザーの識別にだけ使い、頼まれない限り無関係なサービスに送らない」という一文が付きました。ただしこれはモデルへの指示で、アドレスは文脈に残ります。何が「無関係なサービス」にあたるかもモデルの判断です。この mod は、ブロックそのものをモデルに渡さないことで、この経路を断ちます。

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
| | `override` | ブロックの本文全体を `The user's email address is <alias>.` に置き換えます（v2.1.234 以降に付く利用条件の一文も消えます） |
| `alias` | 文字列（既定は空） | `override` のときに見せるアドレスです。空なら `remove` と同じ動作になります |

## 仕組み

`prompt.context` フックで文脈ブロックの一覧を受け取り、`name === "userEmail"` のブロックを外して（または本文を差し替えて）から engine に渡します。

- engine から返ってきた結果にも同じ処理をかけ直します。他の plugin が同じブロックを足し直した場合への備えです。
- フック内でエラーが起きたときも、`userEmail` を外してから下のフックに渡し、返ってきた結果からも外します（エラー時も送らない側に倒します）。

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
  - ファイルの中身（以前の会話でメモリや `CLAUDE.md` に書き込まれたアドレスを含みます）
  - MCP コネクタの応答
- コミットに付く `Co-authored-by:` トレーラーにアカウントのアドレスが入るという報告があります（v2.1.165 ごろから、[anthropics/claude-code#66079](https://github.com/anthropics/claude-code/issues/66079)）。この経路が `userEmail` ブロック由来かは確かめていません。公開リポジトリに push する前に、コミットの author とトレーラーを確認してください。
- すでに push したコミットや、送信済みのリクエストからアドレスを消すことはできません。
- 認証情報（`~/.claude.json` など）には触りません。
- 実行環境によっては、別の仕組みで同じ情報を足している可能性があります。その経路まで塞げるかは環境ごとに確かめてください。
- mod の API（function hooks）は EARLY ACCESS で、今後のリリースで予告なく変わることがあります。

## 開発

```
claude plugin validate .
claude plugin test .
claude --plugin-dir . # 手元で読み込んで試す
```
