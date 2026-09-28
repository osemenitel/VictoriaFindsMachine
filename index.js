import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем ключи из сейфа
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Включаем polling, чтобы бот мог принимать команды и сообщения от тебя
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('Завод Виктории запущен в режиме пульта управления...');

// Обработка входящих сообщений/видео от тебя
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, чтобы сообщения шли только от тебя (безопасность превыше всего)
  if (String(chatId) !== String(TELEGRAM_CHAT_ID)) {
    return;
  }

  const text = msg.text;

  if (text === '/start') {
    await bot.sendMessage(chatId, '🤖 Пульт управления заводом Виктории активен. Жду видео для обработки и отправки в ВК!');
    return;
  }

  // Если ты скинул видео или файл
  if (msg.video || msg.document) {
    await bot.sendMessage(chatId, '⚙️ Ролик принят в обработку! Чищу иероглифы, готовлю для публикации в ВК...');
    
    // Здесь в следующих шагах мы подключим логику обработки видео и отправки с кнопками "Да/Нет"
    setTimeout(async () => {
      await bot.sendMessage(chatId, '✅ Ролик обработан! (Тестовый режим). Публикуем в группу ВК?');
    }, 2000);
  }
});
