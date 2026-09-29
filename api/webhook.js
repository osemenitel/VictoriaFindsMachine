export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const { message, callback_query } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  // 1. Прием видео
  if (message) {
    const chatId = message.chat.id;
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

    if (message.text) {
      await fetch(`${TG_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Бот-монтажер на связи! Жду видео с Пойзона (можно как видео или как файл).'
        })
      });
      return res.status(200).send('OK');
    }
  }

  // 2. Обработка нажатия на кнопку с эмоцией и запуск GitHub Actions
  if (callback_query && callback_query.data.startsWith('emo_')) {
    const emotionFile = callback_query.data.replace('emo_', '');
    const chatId = callback_query.message.chat.id;
    
    // Достаем ID того самого видеофайла, на который ответил бот
    const originalMsg = callback_query.message.reply_to_message;
    const fileId = originalMsg.video ? originalMsg.video.file_id : originalMsg.document.file_id;

    await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `⚙️ Принято! Эмоция ${emotionFile} ушла в монтажный цех. Запускаю рендер...`
      })
    });

    // Отправляем команду "Старт" на завод GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    await fetch(`https://api.github.com/repos/osemenitel/VictoriaFindsMachine/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        event_type: 'build_video',
        client_payload: {
          chat_id: chatId,
          file_id: fileId,
          emotion: emotionFile
        }
      })
    });

    return res.status(200).send('OK');
  }

  res.status(200).send('OK');
}
