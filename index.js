const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ Ошибка: Не найдены секреты Telegram!');
  process.exit(1);
}

async function runFactory() {
  console.log('🚀 Запуск поиска китайских трендов...');
  
  // Резервные данные, если парсер ничего не найдет
  let finalVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  let finalDescription = 'Инновационная технологичная новинка из Китая';

  if (RAPIDAPI_KEY) {
    try {
      console.log('🔍 Подключаемся к Douyin API...');
      const response = await fetch('https://douyin-media-no-watermark.p.rapidapi.com/web/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'douyin-media-no-watermark.p.rapidapi.com'
        },
        body: JSON.stringify({ count: 5, keyword: '科技 创意 0ffer', offset: 0 })
      });
      
      const data = await response.json();
      const videos = data?.data?.videos || data?.aweme_list || [];
      
      if (videos.length > 0) {
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const url = randomVideo.play_addr?.url_list?.[0] || randomVideo.video?.play_addr?.url_list?.[0];
        
        if (url) {
            finalVideoUrl = url;
            finalDescription = randomVideo.desc || finalDescription;
            console.log(`✅ Реальное видео найдено: ${finalDescription}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Ошибка связи с парсером:', error.message);
    }
  }

  console.log('📱 Отправка видео на пульт Telegram...');
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`;
  const captionText = `🔥 Народ, вы эту дичь видели?! ${finalDescription}.\n\nКитайцы опять пробили потолок! Берем или хлам? 👇`;

  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    video: finalVideoUrl,
    caption: captionText,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
          { text: '❌ В топку', callback_data: 'delete_video' }
        ]
      ]
    }
  };

  const tgResponse = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (tgResponse.ok) {
    console.log('✅ Готовый ролик доставлен в Telegram!');
  } else {
    console.error('❌ Ошибка Телеграма:', await tgResponse.text());
    process.exit(1);
  }
}

runFactory();
