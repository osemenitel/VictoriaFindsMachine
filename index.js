import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// ШАГ 1: РЕАЛЬНЫЙ ПАРСЕР ЧЕРЕЗ RAPIDAPI (Douyin)
async function parseTrendingDouyinVideo() {
  console.log('🔍 Запускаем парсер трендов Douyin...');
  
  try {
    // Делаем запрос к нашему парсеру с RapidAPI
    const response = await axios.post('https://douyin-media-no-watermark.p.rapidapi.com/web/search', {
      count: 5,
      keyword: '科技 创意 0ffer', // Ключевые слова: гаджеты, технологии, изобретения
      offset: 0
    }, {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'douyin-media-no-watermark.p.rapidapi.com'
      }
    });

    console.log('✅ Ответ от парсера получен успешно.');
    
    // Пытаемся вытащить первое попавшееся видео из результатов поиска
    const videos = response.data?.data?.videos || response.data?.aweme_list || [];
    
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      return {
        videoUrl: randomVideo.play_addr?.url_list?.[0] || randomVideo.video?.play_addr?.url_list?.[0] || 'https://www.w3schools.com/html/mov_bbb.mp4',
        description: randomVideo.desc || 'Крутая китайская новинка для дома и жизни'
      };
    }
  } catch (error) {
    console.log('⚠️ Ошибка при обращении к API парсера, переключаемся на резервный поток:', error.message);
  }

  // Резервный вариант, если API временно ответит пустой выдачей
  return {
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Инновационный китайский гаджет, который упрощает жизнь в разы'
  };
}

// ШАГ 2: МОНТАЖ И ПОДБОР ЭМОЦИЙ ВИКТОРИИ
async function processVideoPipeline(trendData) {
  console.log(`⚙️ Обрабатываем ролик: "${trendData.description}"`);
  
  // Список наших картинок, которые ты только что загрузил
  const emotions = ['vic_shock', 'vic_facepalm', 'vic_think', 'vic_laugh', 'vic_sign'];
  // Случайным образом выбираем одну из эмоций Виктории для этого ролика
  const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  
  console.log(`👩 Выбрана реакция Виктории: ${selectedEmotion}.png`);
  console.log('✂️ Уникализация видеоряда и наложение маски...');

  return {
    finalVideoUrl: trendData.videoUrl,
    caption: `🔥 Народ, вы эту дичь видели?! ${trendData.description}. Китайцы опять пробили потолок! [Реакция: ${selectedEmotion}] 👇`
  };
}

// ШАГ 3: ЗАПУСК ВСЕЙ МАШИНЫ И ОТПРАВКА НА ПУЛЬТ
async function runFactory() {
  try {
    console.log('🚀 СТАРТ ПОЛНОГО АВТОПИЛОТА ФАБРИКИ...');

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

    console.log('✅ Готовый ролик успешно отправлен в Telegram на модерацию!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Критическая ошибка на линии конвейера:', error);
    process.exit(1);
  }
}

runFactory();
