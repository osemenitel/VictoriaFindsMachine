import fetch from 'node-fetch';

export default async function handler(req, res) {
  // ГЛАВНОЕ ПРАВИЛО: Что бы ни случилось, всегда возвращаем 200 OK, чтобы Телеграм не заблокировал очередь!
  try {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const update = req.body || {};
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'osemenitels/VictoriaFindsMachine';

    // 1. ПРИЕМ СООБЩЕНИЙ И ВИДЕО
    if (update.message) {
      const chatId = update.message.chat?.id;
      const text = update.message.text || '';
      const msgId = update.message.message_id;

      if (!chatId) return res.status(200).send('OK');

      // Реакция на старт
      if (text === '/start') {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: '👋 Бот перезагружен и работает! Жду видео.' })
        });
        return res.status(200).send('OK');
      }

      // Поиск файла (видео или документ)
      const fileObj = update.message.video || update.message.document || update.message.animation;
      
      if (fileObj && fileObj.file_id) {
        // Проверка лимита в 20 МБ
        if (fileObj.file_size && fileObj.file_size > 20971520) {
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: '⚠️ ФАЙЛ СЛИШКОМ БОЛЬШОЙ! Отправь видео через кнопку "Галерея" (Телеграм сожмет его сам).',
              reply_to_message_id: msgId
            })
          });
          return res.status(200).send('OK');
        }

        // Если файл норм — выдаем меню с кнопками
        const keyboard = {
          inline_keyboard: [
            [{ text: "😱 Шок", callback_data: "vic_shock.png" }, { text: "🤦‍♀️ Рукалицо", callback_data: "vic_facepalm.png" }],
            [{ text: "🤔 Думает", callback_data: "vic_think.png" }, { text: "😂 Смех", callback_data: "vic_laugh.png" }],
            [{ text: "🪧 Табличка", callback_data: "vic_sign.png" }]
          ]
        };
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            chat_id: chatId,
            text: '🎬 Видео принято! Выбирай эмоцию:',
            reply_markup: keyboard,
            reply_to_message_id: msgId
          })
        });
        return res.status(200).send('OK');
      }
    }

    // 2. ОБРАБОТКА НАЖАТИЯ НА КНОПКУ
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const emotion = cb.data;
      
      if (!chatId) return res.status(200).send('OK');

      // Ищем, к какому видео была прикреплена кнопка
      const origMsg = cb.message?.reply_to_message;
      const fileId = origMsg?.video?.file_id || origMsg?.document?.file_id || origMsg?.animation?.file_id;

      if (!fileId) {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: '❌ Не нашел видео. Отправь заново.' })
        });
        return res.status(200).send('OK');
      }

      // Отправляем сигнал, что начали работу
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId, text: '⚙️ Эмоция ушла в цех! Монтирую...' })
      });

      // Пингуем завод GitHub
      await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Webhook'
        },
        body: JSON.stringify({
          event_type: 'build_video',
          client_payload: { chat_id: chatId, file_id: fileId, emotion: emotion }
        })
      });
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');

  } catch (error) {
    // В СЛУЧАЕ ЛЮБОГО СБОЯ ВОЗВРАЩАЕМ 200, ЧТОБЫ ТЕЛЕГРАМ НЕ ЗАВИС!
    console.error(error);
    return res.status(200).send('OK');
  }
}
