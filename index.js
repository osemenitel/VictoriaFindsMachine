import https from 'https';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ Ошибка: Не найдены секреты!');
  process.exit(1);
}

function sendVideoToTelegram() {
  console.log('🚀 Запуск отправки на пульт Telegram...');

  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    // Вот здесь 100% рабочая ссылка, которую Телеграм скачает без ошибок:
    video: 'https://www.w3schools.com/html/mov_bbb.mp4', 
    caption: '🔥 Народ, вы эту дичь видели?! Умный держатель для телефона с автонаведением.\n\nКитайцы опять пробили потолок! Берем или хлам? 👇',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
          { text: '❌ В топку', callback_data: 'delete_video' }
        ]
      ]
    }
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${TELEGRAM_TOKEN}/sendVideo`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Успешно! Ролик доставлен в Telegram.');
        process.exit(0);
      } else {
        console.error(`❌ Ошибка Telegram API (Код ${res.statusCode}):`, responseBody);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Сетевая ошибка:', error.message);
    process.exit(1);
  });

  req.write(data);
  req.end();
}

sendVideoToTelegram();
