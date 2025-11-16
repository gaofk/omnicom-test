const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

// 接收 LINE 事件
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  // 1. 关注事件（follow）
  if (event.type === 'follow') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ご登録ありがとうございます！\n採用に関するご相談があればお気軽にご連絡ください。',
    });
  }

  // 2. 用户从 LIFF 通知“申请完成”
  if (event.type === 'message' && event.message.type === 'text') {
    if (event.message.text && event.message.text.startsWith('[APPLY]')) {
      const jobTitle = event.message.text.replace('[APPLY]', '').trim();
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `「${jobTitle}」にご応募いただきありがとうございます！\n担当者より追ってご連絡いたしますので、今しばらくお待ちください。`,
      });
    }
  }

  return Promise.resolve(null);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('LINE Webhook server running on port ' + port);
});
