import https from 'https'; // Оставляем import, так как мы настроили проект как модуль

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Функция для отправки простых текстовых сообщений (для вывода ошибок API прямо в Телегу)
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
  });
}

async function runFactory() {
  if (!RAPIDAPI_KEY) {
    await sendTelegramMessage('❌ Ошибка: Ключ RAPIDAPI_KEY не найден в настройках GitHub Secrets!');
    return;
  }

  try {
    // Делаем запрос к парсеру
    const response = await fetch('https://douyin-media-no-watermark.p.rapidapi.com/web/search', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'douyin-media-no-watermark.p.rapidapi.com'
      },
      // Простой поисковой запрос
      body: JSON.stringify({ count: 5, keyword: '科技', offset: 0 }) 
    });
    
    const textResponse = await response.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      await sendTelegramMessage(`❌ Парсер вернул какую-то дичь (не JSON):\n\n${textResponse.substring(0, 300)}`);
      return;
    }

    // Ищем видео в ответе
    const videos = data?.data?.videos || data?.aweme_list || [];
    
    if (videos.length > 0) {
      const url = videos[0].play_addr?.url_list?.[0] || videos[0].video?.play_addr?.url_list?.[0];
      
      if (url) {
        // Успех! Отправляем видео
        const telegramUrlVideo = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`;
        await fetch(telegramUrlVideo, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            video: url,
            caption: `🔥 Народ, вы эту дичь видели?! ${videos[0].desc || 'Крутая находка.'}\n\nБерем или хлам? 👇`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
                  { text: '❌ В топку', callback_data: 'delete_video' }
                ]
              ]
            }
          })
        });
        return;
      }
    }
    
    // Если мы дошли сюда, значит API ответил, но видео там нет. Отправляем ответ сервера в Телегу.
    await sendTelegramMessage(`⚠️ Парсер ничего не нашел или мы не угадали формат запроса. Вот что дословно ответил сервер RapidAPI:\n\n${JSON.stringify(data).substring(0, 500)}`);

  } catch (error) {
    await sendTelegramMessage(`❌ Системная ошибка при запросе к парсеру:\n\n${error.message}`);
  }
}

runFactory();
