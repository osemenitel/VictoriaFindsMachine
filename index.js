import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function sendVideoToPanel() {
  try {
    console.log('🎬 Завод Виктории: Отправка готового видео на пульт в Telegram...');

    // Текст, который пойдет в ВК
    const vkPostText = "🔥 Смотрите, какую дичь китайцы придумали на этот раз! Очередная находка для дома. Как думаете, годная вещь или в мусорку?";

    // Твои кнопки управления
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Одобрить (Отправить в ВК)', callback_data: 'publish_vk' },
            { text: '❌ В топку', callback_data: 'delete_video' }
          ]
        ]
      }
    };

    // Тестовое видео-заглушка (потом сюда будет прилетать видео от Remotion)
    const testVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';

    // Отправляем ВИДЕО + ТЕКСТ + КНОПКИ
    await bot.sendVideo(TELEGRAM_CHAT_ID, testVideoUrl, {
      caption: vkPostText,
      reply_markup: inlineKeyboard.reply_markup
    });

    console.log('✅ Видео с кнопками успешно отправлено тебе в личку!');

  } catch (error) {
    console.error('❌ Ошибка отправки видео:', error);
  }
}

sendVideoToPanel();
