import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Bot is running');

  try {
    const update = req.body;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'osemenitels/VictoriaFindsMachine';

    // 1. ПРИЕМ ВИДЕО И ПРОВЕРКА ЛИМИТОВ
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const messageId = update.message.message_id;

      if (text === '/start') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "👋 Бот-монтажер готов! Жду видео с Пойзона (строго до 20 МБ).");
        return res.status(200).json({ ok: true });
      }

      const fileObj = update.message.video || update.message.document || update.message.animation;

      if (fileObj && fileObj.file_id) {
        if (fileObj.file_size && fileObj.file_size > 20971520) {
          await sendMessage(TELEGRAM_TOKEN, chatId, "⚠️ ФАЙЛ СЛИШКОМ БОЛЬШОЙ! Телеграм разрешает ботам качать файлы только до 20 МБ. Отправь видео через кнопку Галереи, чтобы Телеграм сам его сжал.", messageId);
          return res.status(200).json({ ok: true });
        }
        await sendEmotionMenu(TELEGRAM_TOKEN, chatId, messageId);
        return res.status(200).json({ ok: true });
      }
    } 
    
    // 2. НАЖАТИЕ КНОПКИ
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const emotion = callback.data;
      
      const originalMsg = callback.message.reply_to_message;
      const fileId = originalMsg?.video?.file_id || originalMsg?.document?.file_id || originalMsg?.animation?.file_id;

      if (!fileId) {
        await sendMessage(TELEGRAM_TOKEN, chatId, "❌ Ошибка: не могу найти исходное видео. Отправь его заново.");
        return res.status(200).json({ ok: true });
      }

      await sendMessage(TELEGRAM_TOKEN, chatId, `⚙️ Принято! Эмоция ушла в цех. Запускаю рендер...`);
      
      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Webhook'
        },
        body: JSON.stringify({
          event_type: 'build_video',
          client_payload: { chat_id: chatId, file_id: fileId, emotion: emotion }
        })
      });

      return res.status(200).json({ ok: true });
    }
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendMessage(token, chatId, text, replyToMessageId = null) {
  const body = { chat_id: chatId, text: text };
  if (replyToMessageId) body.reply_to_message_id = replyToMessageId;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function sendEmotionMenu(token, chatId, messageId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "😱 Шок", callback_data: "vic_shock.png" }, { text: "🤦‍♀️ Рукалицо", callback_data: "vic_facepalm.png" }],
      [{ text: "🤔 Думает", callback_data: "vic_think.png" }, { text: "😂 Смех", callback_data: "vic_laugh.png" }],
      [{ text: "🪧 Табличка", callback_data: "vic_sign.png" }]
    ]
  };
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: "🎬 Видео на базе! Какую эмоцию клеим?", reply_markup: keyboard, reply_to_message_id: messageId })
  });
}
