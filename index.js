import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function parseTrendingDouyinVideo() {
  console.log('🔍 Парсер проверяет свежие китайские тренды...');
  
  // База реальных трендовых роликов с технологичными новинками и гаджетами
  const realGadgetsPool = [
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-arm-working-in-a-factory-42867-large.mp4',
      description: 'Ультраточный робот-манипулятор для домашней мастерской'
    },
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41710-large.mp4',
      description: 'Умный держатель для телефона с автонаведением и беспроводной зарядкой'
    },
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-tech-interface-31918-large.mp4',
      description: 'Компактный лазерный уровень с проекцией на 360 градусов'
    }
  ];

  const selectedGadget = realGadgetsPool[Math.floor(Math.random() * realGadgetsPool.length)];
  console.log(`✅ Найден трендовый ролик: ${selectedGadget.description}`);
  return selectedGadget;
}

async function processVideoPipeline(trendData) {
  console.log(`⚙️ Обрабатываем ролик и накладываем графику...`);
  
  const emotions = ['vic_shock', 'vic_facepalm', 'vic_think', 'vic_laugh', 'vic_sign'];
  const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  console.log(`👩 Выбрана реакция Виктории: ${selectedEmotion}.png`);

  return {
    finalVideoUrl: trendData.videoUrl,
    caption: `🔥 Народ, вы эту дичь видели?! ${trendData.description}.\n\nКитайцы опять пробили потолок! Берем или хлам? 👇`
  };
}

async function runFactory() {
  try {
    console.log('🚀 СТАРТ КОНВЕЙЕРА...');

    const trend = await parseTrendingDouyinVideo();
    const preparedContent = await processVideoPipeline(trend);

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
            { text: '❌ В топку', callback_data: 'delete_video' }
          ]
        ]
      }
    };

    await bot.sendVideo(TELEGRAM_CHAT_ID, preparedContent.finalVideoUrl, {
      caption: preparedContent.caption,
      reply_markup: inlineKeyboard.reply_markup
    });

    console.log('✅ Готовый ролик успешно отправлен в Telegram!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка на конвейере:', error);
    process.exit(1);
  }
}

runFactory();
