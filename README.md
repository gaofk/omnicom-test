# LINE 採用 LIFF + Webhook 一体プロジェクト

## 構成

- `liff-app/` : Vite + React で作成した採用エントリー LIFF アプリ
- `webhook-server/` : Node.js (Express + @line/bot-sdk) で作成した Webhook サーバー

## 1. LIFF アプリ側の準備

```bash
cd liff-app
cp .env.example .env   # 値を自分のものに変更
npm install
npm run dev            # ローカル確認用
npm run build          # 本番ビルド
```

`.env` の値：

```env
VITE_LIFF_ID=あなたの LIFF ID
VITE_LINE_ADD_FRIEND_URL=公式アカウントの友だち追加 URL (https://lin.ee/xxxx 形式)
```

ビルドしてできた `dist/` を、LINE Developers で設定した LIFF URL にデプロイしてください。
（既に前のプロジェクトが動いていれば、単純に中身を差し替えで OK）

## 2. Webhook サーバー側の準備

```bash
cd webhook-server
cp .env.example .env   # CHANNEL_SECRET, CHANNEL_ACCESS_TOKEN を設定
npm install
npm start              # ローカル起動 (ポート 3000)
```

`.env` の値：

```env
CHANNEL_SECRET=Messaging API チャネルシークレット
CHANNEL_ACCESS_TOKEN=Messaging API チャネルアクセストークン
PORT=3000
```

## 3. Webhook サーバーのデプロイ（例：Render / Railway など）

1. このフォルダを GitHub リポジトリに push
2. Render / Railway / Heroku などで「New Web Service」を作成
3. `webhook-server` ディレクトリをルートとして Node サービスを作成
4. 環境変数に `CHANNEL_SECRET`, `CHANNEL_ACCESS_TOKEN` を設定
5. デプロイ後、公開 URL を取得（例：`https://your-app.onrender.com`）

⇒ Webhook URL は：

```text
https://your-app.onrender.com/webhook
```

## 4. LINE Developers 側の設定

1. https://developers.line.biz/console/ にアクセス
2. 対象の Provider → 対象の「Messaging API」チャネルを選択
3. 「Messaging API 設定」画面で下記を設定：

   - チャネルアクセストークン：発行して `.env` に設定
   - Webhook URL：`https://your-app.onrender.com/webhook`
   - 「Webhookを有効にする」を ON
   - 「Verify」で成功することを確認

## 5. 公式アカウント Manager 側の自動応答（友だち追加時）

1. https://manager.line.biz/ にアクセス
2. 対象の公式アカウントを選択
3. 左メニュー「応答設定」→「自動応答メッセージ」
4. 「友だち追加時」のメッセージを ON にし、以下のような文言を設定：

```text
ご登録ありがとうございます！
こちらは採用専用LINE公式アカウントです。
ご興味のある職種がございましたら、LIFFページよりご応募ください。
```

## 6. 実際の挙動

- ユーザーが公式アカウントを **友だち追加** すると：
  - Webhook の `follow` イベントが発火し、「ご登録ありがとうございます！」メッセージを自動返信
  - （任意）公式アカウント Manager 側の「友だち追加時メッセージ」も併用可能

- ユーザーが LIFF で職種を選び、「この内容で応募する」を押すと：
  - LIFF から `[APPLY] 職種名` のテキストがユーザー → 公式アカウントトークに送信
  - Webhook がそれを受信し、「「◯◯職」にご応募ありがとうございます。担当者よりご連絡します。」と自動返信
  - 同時に、詳細な応募内容テキストもトークに残るので、担当者はトーク画面から内容を確認可能
