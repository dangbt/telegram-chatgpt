
const TelegramBot = require('node-telegram-bot-api');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
require('dotenv').config()

const token = process.env.TELEGRAM_TOKEN;
const CHATGPT_API = process.env.CHATGPT_API;
const CHATGPT_TOKEN = process.env.CHATGPT_TOKEN;

const headers = {
	'Content-Type': 'application/json',
  Authorization: `Bearer ${CHATGPT_TOKEN}`
};

const configuration = new Configuration({
  organization: process.env.ORGANIZATION,
  apiKey: CHATGPT_TOKEN,
});

const openai = new OpenAIApi(configuration);

const bot = new TelegramBot(token, {
  polling: true
});

let models = "text-davinci-003";

bot.onText(/\/models/, (msg) => {
  const chatId = msg.chat.id;
  console.log(msg)

  axios({
    url: `${CHATGPT_API}/models`,
    headers,
    method: 'get',
  }).then(res => {
    console.log(res.data)
    bot.sendMessage(chatId,  JSON.stringify('modals'));
  })
  .catch((err) => {
    console.log(err)
  })
  // send back the matched "whatever" to the chat
});

bot.onText(/\/c/, async (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text.slice(3).trim();
  if (message) {
    let max_tokens = 100;
    const timer = setTimeout(() => {
      bot.sendMessage(chatId,  "Đợi xíu nha");
    }, 3000)
    function getCompletion() {
      openai.createCompletion({
        model: models,
        max_tokens: max_tokens,
        prompt:  message,
      }).then(res => {
        const latestMessage = JSON.parse(JSON.stringify(res.data.choices)).pop();

        if (latestMessage.finish_reason === 'length') {
          max_tokens += 100;
          getCompletion()
        }

        if (latestMessage.finish_reason === 'stop') {
          const messageResponse = res.data.choices.map(v => v.text).join(' ');
          clearTimeout(timer)
          bot.sendMessage(chatId,  messageResponse || '');
        }
      })
      .catch((err) => {
        bot.sendMessage(chatId,  "Lỗi rùi");

      })
    }
    getCompletion()
  } else {
    bot.sendMessage(chatId,  'Enter some text :))');
  }
});


bot.on("polling_error", console.log);