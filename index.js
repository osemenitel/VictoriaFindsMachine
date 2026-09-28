import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем ключи из сейфа
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// polling: false обязателен для GitHub Actions (запустился, сделал дело, выключился)
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function main() {
  try {
    console.log('Завод Виктории: запуск обработки видео...');

    // Здесь в будущем скрипт будет скачивать трендовое видео, 
    // убирать иероглифы через видеоредактор и готовить его к публикации.

    // Пока тестируем связку с кнопками подтверждения для твоего пульта:
    const caption = "🔥 Находка из Китая!\n\n💬 Реплика для видео: «Народ, вы эту дичь вообще видели?!»\n\nПубликуем в группу ВК «Виктория | Находки»?";

    // Создаем интерактивные кнопки "Одобрить" и "Удалить"
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Одобрить (В ВК)', callback_data: 'publish_vk' },
            { text: '❌ Удалить', callback_data: 'delete_item' }
          ]
        ]
      }
    };

    // Отправляем тестовое сообщение с кнопками в твой Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, caption, inlineKeyboard);
    console.log('Пульт управления: ролик отправлен на согласование!');

  } catch (error) {
    console.error('Ошибка на заводе:', error);
  }
}

main();
