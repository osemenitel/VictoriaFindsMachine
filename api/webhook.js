import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot is running');
  }

  try {
    const update = req.body;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'osemenitels/VictoriaFindsMachine'; // твой репозиторий

    let chatId, fileId, caption = '';

    // Обработка обычного видео или файла
    if (update.message) {
      chatId = update.message.chat.id;
      if (update.message.video) {
        fileId = update.message.video.file_id;
      } else if (update.message.document && update.message.document.mime_type?.startsWith('video/')) {
        fileId = update.message.document.file_id;
      } else if (update.message.text === '/start') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "👋 Бот-монтажер на связи! Жду видео с Пойзона (можно как видео или как файл).");
        return res.status(200).json({ ok: true });
      }

      if (fileId) {
        // Сохраняем file_id (в реале можно через БД, но пока кидаем кнопки с выбором)
        await sendEmotionMenu(TELEGRAM_TOKEN, chatId, fileId);
        return res.status(200).json({ ok: true });
      }
    } 
    
    // Обработка нажатия на кнопки эмоций
    if (update.callback_query) {
      const callback = update.callback_query;
      chatId = callback.message.chat.id;
      const data = callback.data; // например, "emo_vic_think.png"
      
      // Достаем последний file_id из сообщения или контекста (или передаем в callback_data)
      // Чтобы не усложнять, если нажата кнопка — запускаем GitHub Action
      await sendMessage(TELEGRAM_TOKEN, chatId, `⚙️ Принято! Эмоция ${data} ушла в монтажный цех. Запускаю рендер...`);
      
      // Дергаем GitHub API для запуска сборки
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
            file_id: callback.message.reply_to_message?.video?.file_id || callback.message.reply_to_message?.document?.file_id || "test",
            emotion: data
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

async function sendMessage(token, chatId, text, replyMarkup = null) {
  const body = { chat_id: chatId, text: text };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function sendEmotionMenu(token, chatId, fileId) {
  // Сохраняем file_id в callback_data через костыль или шлем меню
  const keyboard = {
    inline_keyboard: [
      [
        { text: "😱 Шок", callback_data: "vic_shock.png" },
        { text: "🤦‍♀️ Рукалицо", callback_data: "vic_facepalm.png" }
      ],
      [
        { text: "🤔 Думает", callback_data: "vic_think.png" },
        { text: "😂 Смех", callback_data: "vic_laugh.png" }
      ],
      [
        { text: "🪧 Табличка", callback_data: "vic_sign.png" }
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
