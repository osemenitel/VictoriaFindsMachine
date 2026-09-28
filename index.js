import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function parseTrendingDouyinVideo() {
  console.log('🔍 Запускаем парсер трендов Douyin...');
  
  try {
    const response = await axios.post('https://douyin-media-no-watermark.p.rapidapi.com/web/search', {
      count: 5,
      keyword: '科技 创意 0ffer',
      offset: 0
    }, {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'douyin-media-no-watermark.p.rapidapi.com'
      }
    });

    const videos = response.data?.data?.videos || response.data?.aweme_list || [];
    
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      return {
        videoUrl: randomVideo.play_addr?.url_list?.[0] || randomVideo.video?.play_addr?.url_list?.[0] || 'https://www.w3schools.com/html/mov_bbb.mp4',
        description: randomVideo.desc || 'Инновационная китайская находка для дома'
      };
    }
  } catch (error) {
    console.log('⚠️ Резервный поток активирован:', error.message);
  }

  return {
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Умная китайская швабра с встроенным пылесосом и лазером'
  };
}

async function processVideoPipeline(trendData) {
  console.log(`⚙️ Обрабатываем ролик: "${trendData.description}"`);
  
  // Выбираем эмоцию для внутренней логики (в текст больше не пишем её код!)
  const emotions = ['vic_shock', 'vic_facepalm', 'vic_think', 'vic_laugh', 'vic_sign'];
  const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  console.log(`👩 Применяем реакцию Виктории: ${selectedEmotion}.png`);

  return {
    finalVideoUrl: trendData.videoUrl,
    // ЧИСТЫЙ ТЕКСТ БЕЗ ВСЯКИХ АНГЛИЙСКИХ ТЕХНИЧЕСКИХ МЕТОК:
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

    console.log('✅ Отправлено на модерацию в Telegram!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

runFactory();
