export default async function handler(req, res) {
  // Пропускаем любые запросы, кроме POST от Телеграма
  if (req.method !== 'POST') return res.status(200).send('OK');

  const { message, callback_query } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  // 1. Прием видео с Пойзона от тебя
  if (message && message.video) {
    await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        reply_to_message_id: message.message_id, // Бот ответит прямо на твое сообщение с видео
        text: '🎬 Видео на базе! Какую эмоцию Виктории клеим в правый нижний угол?',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '😱 Шок', callback_data: 'emo_vic_shock.png' },
              { text: '🤦‍♀️ Рукалицо', callback_data: 'emo_vic_facepalm.png' }
            ],
            [
              { text: '🤔 Думает', callback_data: 'emo_vic_think.png' },
              { text: '😂 Смех', callback_data: 'emo_vic_laugh.png' }
            ],
            [
              { text: '🪧 Табличка', callback_data: 'emo_vic_sign.png' }
            ]
          ]
        }
      })
    });
    return res.status(200).send('OK');
  }

  // 2. Обработка нажатия на кнопку с эмоцией
  if (callback_query && callback_query.data.startsWith('emo_')) {
    const emotionFile = callback_query.data.replace('emo_', ''); // Достаем название картинки

    await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: callback_query.message.chat.id,
        text: `⚙️ Принято! Эмоция ${emotionFile} ушла в монтажный цех. Запускаю сборку видео...`
      })
    });
    
    // Позже мы добавим сюда команду для GitHub, чтобы он запускал FFmpeg и делал уникализацию
    return res.status(200).send('OK');
  }

  res.status(200).send('OK');
}
