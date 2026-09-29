import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot is running');
  }

  try {
    const update = req.body;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'osemenitels/VictoriaFindsMachine';

    // Обработка текстовых команд или видео
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text === '/start') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "👋 Бот-монтажер на связи! Жду видео с Пойзона (можно как видео или как файл).");
        return res.status(200).json({ ok: true });
      }

      let fileId = null;
      if (update.message.video) {
        fileId = update.message.video.file_id;
      } else if (update.message.document && update.message.document.mime_type?.startsWith('video/')) {
        fileId = update.message.document.file_id;
      }

      if (fileId) {
        await sendEmotionMenu(TELEGRAM_TOKEN, chatId, fileId);
        return res.status(200).json({ ok: true });
      }
    } 
    
    // Обработка нажатия на кнопки с эмоциями
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const data = callback.data; // формата "file_id:emotion"
      
      const [fileId, emotion] = data.split(':');
      
      await sendMessage(TELEGRAM_TOKEN, chatId, `⚙️ Принято! Эмоция ушла в монтажный цех. Запускаю рендер...`);
      
      // Запуск сборки на GitHub Actions
      const ghResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Webhook'
        },
        body: JSON.stringify({
          event_type: 'build_video',
          client_payload: {
            chat_id: chatId,
            file_id: fileId,
            emotion: emotion
          }
        })
      });

      if (!ghResponse.ok) {
        const errText = await ghResponse.text();
        await sendMessage(TELEGRAM_TOKEN, chatId, `❌ Ошибка запуска завода: ${errText}`);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function sendEmotionMenu(token, chatId, fileId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "😱 Шок", callback_data: `${fileId}:vic_shock.png` },
        { text: "🤦‍♀️ Рукалицо", callback_data: `${fileId}:vic_facepalm.png` }
      ],
      [
        { text: "🤔 Думает", callback_data: `${fileId}:vic_think.png` },
        { text: "😂 Смех", callback_data: `${fileId}:vic_laugh.png` }
      ],
      [
        { text: "🪧 Табличка", callback_data: `${fileId}:vic_sign.png` }
      ]
    ]
  };

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🎬 Видео на базе! Какую эмоцию Виктории клеим в угол?",
      reply_markup: keyboard
    })
  });
}
