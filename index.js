const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID || !RAPIDAPI_KEY) {
  console.error('❌ Ошибка: Проверь секреты TELEGRAM_TOKEN, TELEGRAM_CHAT_ID и RAPIDAPI_KEY!');
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
  console.log('🚀 Запуск поиска в TikTok...');

  try {
    // 1. Поиск трендов (умные гаджеты из Китая)
    const keyword = encodeURIComponent('smart gadgets china');
    
    // Точная ссылка по твоему скриншоту из RapidAPI
    const searchUrl = `https://tiktok-api23.p.rapidapi.com/api/search/video?cursor=0&search_id=0&keyword=${keyword}`;

    const apiResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    const data = await apiResponse.json();
    
    // Ищем список роликов в ответе API
    const videoList = data?.data?.list || data?.item_list || data?.data?.videos || data?.data || [];

    if (!videoList.length || !Array.isArray(videoList)) {
      await sendTgLog(`⚠️ Парсер не вернул видео. Ответ API:\n\n${JSON.stringify(data).slice(0, 400)}`);
      return;
    }

    // Выбираем случайное видео из выдачи
    const item = videoList[Math.floor(Math.random() * videoList.length)];
    
    // Достаем ссылку на видеопоток
    const videoUrl = 
      item?.video?.play_addr?.url_list?.[0] || 
      item?.video?.download_addr?.url_list?.[0] ||
      item?.play_url ||
      item?.download_url || 
      item?.video_url;

    // Убираем лишние хештеги из описания
    let description = item?.desc || item?.title || 'Китайская технологичная новинка';
    description = description.replace(/#\w+/g, '').trim();

    if (!videoUrl) {
      await sendTgLog(`⚠️ Ролик найден, но ссылка скрыта сервером:\n${JSON.stringify(item).slice(0, 300)}`);
      return;
    }

    console.log(`🎬 Найдено видео: ${description}`);
    console.log(`🔗 Скачиваем поток: ${videoUrl}`);

    // 2. Скачиваем видео на сервер GitHub
    const videoStream = await fetch(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    if (!videoStream.ok) {
       await sendTgLog(`❌ Ошибка скачивания видео с серверов TikTok. Код: ${videoStream.status}`);
       return;
    }
    
    const videoBlob = await videoStream.blob();

    // 3. Формируем публикацию для пульта
    const captionText = `🔥 Народ, вы эту дичь видели?! ${description}.\n\nБерем или хлам? 👇`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('video', videoBlob, 'tiktok_gadget.mp4');
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
      console.log('✅ TikTok видео успешно доставлено на пульт!');
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
