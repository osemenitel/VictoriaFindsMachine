export default async function handler(req, res) {
  // Пропускаем любые запросы, кроме POST
  if (req.method !== 'POST') return res.status(200).send('OK');

  const { message, callback_query } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  // Если пришло обычное сообщение
  if (message) {
    const chatId = message.chat.id;

    // 1. Ловим видео (и как обычное видео, И КАК ФАЙЛ-ДОКУМЕНТ)
    if (message.video || message.document) {
      await fetch(`${TG_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          reply_to_message_id: message.message_id,
          text: '🎬 Видео на базе! Какую эмоцию Виктории клеим в угол?',
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

    // Отвечаем на любые текстовые сообщения (например /start)
    if (message.text) {
      await fetch(`${TG_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Бот-монтажер на связи! Жду от тебя видео с Пойзона (можно кидать как видео или как файл).'
        })
      });
      return res.status(200).send('OK');
    }
  }

  // 2. Обработка нажатия на кнопку с эмоцией
  if (callback_query && callback_query.data.startsWith('emo_')) {
    const emotionFile = callback_query.data.replace('emo_', '');

    await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: callback_query.message.chat.id,
        text: `⚙️ Принято! Эмоция ${emotionFile} ушла в монтажный цех. Запускаю сборку видео...`
      })
    });
    return res.status(200).send('OK');
  }

  res.status(200).send('OK');
}
