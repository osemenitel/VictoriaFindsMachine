import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function parseTrendingDouyinVideo() {
  console.log('🔍 Парсер запущен...');
  return {
    description: 'Умная китайская швабра с встроенным пылесосом и лазером'
  };
}

async function editVideoWithAI(rawVideoData) {
  console.log('⚙️ Монтаж и уникализация...');
  return {
    // Безотказная ссылка на видео для проверки пульта
    finalVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', 
    vkPostText: `🔥 Народ, вы эту дичь видели?! ${rawVideoData.description}. Китайцы опять пробили потолок! Берем или хлам? 👇`
  };
}

async function runFactoryPipeline() {
  try {
    console.log('🚀 ЗАПУСК ПОЛНОГО ЦИКЛА...');
    const trend = await parseTrendingDouyinVideo();
    const editedContent = await editVideoWithAI(trend);

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

    await bot.sendVideo(TELEGRAM_CHAT_ID, editedContent.finalVideoUrl, {
      caption: editedContent.vkPostText,
      reply_markup: inlineKeyboard.reply_markup
    });

    console.log('✅ Видео отправлено в Telegram.');
    
    // ЖЕСТКАЯ КОМАНДА: Выключить сервер GitHub после успешной отправки
    process.exit(0); 

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

runFactoryPipeline();
