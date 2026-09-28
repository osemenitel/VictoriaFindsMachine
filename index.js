const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID || !RAPIDAPI_KEY) {
  console.error('❌ Ошибка: Проверь секреты TELEGRAM_TOKEN, TELEGRAM_CHAT_ID и RAPIDAPI_KEY в GitHub!');
  process.exit(1);
}

// Отправка текстовых логов прямо в Телеграм при сбоях
async function sendTgLog(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
  });
}

async function runFactory() {
  console.log('🚀 Запуск боевого поиска в Douyin...');

  try {
    // 1. Поиск китайских трендов (гаджеты, изобретения, технологии)
    const keyword = encodeURIComponent('黑科技 创意'); // Запрос: "Крутые технологии и изобретения"
    const searchUrl = `https://douyin-api.p.rapidapi.com/api/search/video?count=10&offset=0&keyword=${keyword}`;

    const apiResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'douyin-api.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    const data = await apiResponse.json();
    
    // Безопасный поиск списка роликов в ответе API
    const videoList = data?.data?.list || data?.aweme_list || data?.data?.videos || data?.data || [];

    if (!videoList.length || !Array.isArray(videoList)) {
      console.log('Ответ API:', JSON.stringify(data).slice(0, 300));
      await sendTgLog(`⚠️ Парсер не вернул видео. Ответ API:\n\n${JSON.stringify(data).slice(0, 400)}`);
      return;
    }

    // Выбираем случайное видео из выдачи
    const item = videoList[Math.floor(Math.random() * videoList.length)];
    
    // Достаем прямую ссылку на видео
    const videoUrl = 
      item?.video?.play_addr?.url_list?.[0] || 
      item?.play_addr?.url_list?.[0] || 
      item?.download_url || 
      item?.video_url;

    const description = item?.desc || item?.title || 'Инновационная китайская разработка';

    if (!videoUrl) {
      await sendTgLog(`⚠️ Ролик найден, но ссылка на видеопоток скрыта:\n${JSON.stringify(item).slice(0, 300)}`);
      return;
    }

    console.log(`🎬 Найдено видео: ${description}`);
    console.log(`🔗 Скачиваем поток: ${videoUrl}`);

    // 2. Скачиваем видео на сервер GitHub, чтобы отправить в Телеграм напрямую файлом
    const videoStream = await fetch(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const videoBlob = await videoStream.blob();

    // 3. Формируем публикацию для пульта
    const captionText = `🔥 Народ, вы эту дичь видели?! ${description}.\n\nКитайцы опять пробили потолок! Берем или хлам? 👇`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('video', videoBlob, 'gadget.mp4');
    formData.append('caption', captionText);
    formData.append('reply_markup', JSON.stringify({
      inline_keyboard: [
        [
          { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
          { text: '❌ В топку', callback_data: 'delete_video' }
        ]
      ]
    }));

    console.log('📱 Отправляем готовый файл в Telegram...');
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
      method: 'POST',
      body: formData
    });

    const tgData = await tgRes.json();
    if (tgData.ok) {
      console.log('✅ Реальное китайское видео успешно на пульте!');
      process.exit(0);
    } else {
      console.error('❌ Ошибка отправки в TG:', tgData);
      await sendTgLog(`❌ Ошибка Telegram: ${tgData.description}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Сбой конвейера:', error);
    await sendTgLog(`❌ Сбой скрипта: ${error.message}`);
    process.exit(1);
  }
}

runFactory();
