# niconama-watcher

ニコニコのユーザーIDを指定して自動で録画を行うツール<br>
※適当に即席で作ったものなので動作は保証しかねる。

## 実行手順

ソースコードを落とす

```sh
git clone git@github.com:genkaieng/niconama-watcher.git
```

パッケージのインストール

```sh
pnpm i
```

ツール実行

```sh
pnpm dev
```
## 監視するユーザーを指定

`src/main.ts` の以下の部分を監視したいユーザーIDに変更する（ユーザーIDはニコニコの[ユーザーページのURL](https://www.nicovideo.jp/user/83050000)から取れる）

https://github.com/genkaieng/niconama-watcher/blob/0831cd4d5443c85f907ddb3ec24892f17aee1df7/src/main.ts#L7
