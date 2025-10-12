# パッケージに関して

## 実行する際のnpmコマンド

```
npm i date-fns-timezone discord.js mongoose node-cron node-fetch express dotenv
npm i --save-dev @types/node fs
```

## 各パッケージの使用用途

- `@types/node`　：node.jsを書きやすくするやつらしい
- `date-fns-timezone`　：日本時間の月・日を取得するため
- `discord.js`　：Discord BOTに接続し、操作するため
- `fs` :「commands」フォルダを読み取るため
- `mongoose` ：MongoDBの操作を簡単に行うため
- `node-cron` ：毎日決まった時間に処理を行うため
- `node-fetch` :URLチェックのリクエストを送るため
- `dotenv` :環境変数を取得するため
- `express` :ステータスチェック用のwebサーバーを立ち上げるため。

## .envに書くこと

```
# discord botのtoken
bot_token=

# discordのconsole用チャンネルID
readyNotificationChannelID=
errorNotificationChannelID=

# sentryの接続情報
sentry_dsn=

# URLの安全性を調べるためのAPIのtoken
url_check_api=

# mongoDBの接続情報
mongodb_token=

# 許可されたサーバーのID(これらのサーバーのみメッセージ展開とURLチェックが動作する)
allowedServers='["ID1", "ID2"]'
```

---

# その他メモ

## 定期実行

参考サイト：　[指定した時刻ごとに処理を実行したい](https://scrapbox.io/discordjs-japan/%E6%8C%87%E5%AE%9A%E3%81%97%E3%81%9F%E6%99%82%E5%88%BB%E3%81%94%E3%81%A8%E3%81%AB%E5%87%A6%E7%90%86%E3%82%92%E5%AE%9F%E8%A1%8C%E3%81%97%E3%81%9F%E3%81%84)

## 画像を生成

参考サイト：　[Discord.jsと@napi-rs/canvasでおみくじ画像を生成して投稿する](https://qiita.com/Fuses-Garage/items/d5c1e1d1d0366474c318)

## 危険なURLをブロック

参考サイト：　[Discordに危険なURLが送られたら自動で削除](https://qiita.com/narikakun/items/794d9cf57bf6dd2eba46)
