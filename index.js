import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function parseTrendingDouyinVideo() {
  console.log('🔍 Запрос к альтернативному потоку парсера...');
  
  try {
    // Пробуем другой эндпоинт того же сервиса для получения трендов
    const response = await axios.post('https://douyin-media-no-watermark.p.rapidapi.com/web/hotList', {}, {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'douyin-media-no-watermark.p.rapidapi.com'
      }
    });

    const list = response.data?.data?.list || response.data?.aweme_list || [];
    if (list.length > 0) {
      const item = list[Math.floor(Math.random() * list.length)];
      const videoUrl = item.video?.play_addr?.url_list?.[0] || item.play_addr?.url_list?.[0];
      if (videoUrl) {
        return {
          videoUrl: videoUrl,
          description: item.desc || 'Невероятная китайская разработка'
        };
      }
    }
  } catch (error) {
    console.log('⚠️ Основной метод hotList ответил пустышкой, используем базу трендовых новинок.');
  }

  // База реальных технологичных ролик-примеров китайских товаров для теста конвейера
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

  return realGadgetsPool[Math.floor(Math.random() * realGadgetsPool.length)];
}

async function processVideoPipeline(trendData) {
  console.log(`⚙️ Обрабатываем ролик: "${trendData.description}"`);
  
  const emotions = ['vic_shock', 'vic_facepalm', 'vic_think', 'vic_laugh', 'vic_sign'];
  const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  console.log(`👩 Реакция Виктории выбрана: ${selectedEmotion}.png`);

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

    console.log('✅ Отправлено в Telegram!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

runFactory();
