export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).send('Webhook is active');

    const update = req.body || {};
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const GH_TOKEN = process.env.GITHUB_TOKEN;
    // ТУТ БЫЛА ОШИБКА. ТЕПЕРЬ ИМЯ ПРАВИЛЬНОЕ:
    const REPO = 'osemenitel/VictoriaFindsMachine';

    if (update.message) {
      const chatId = update.message.chat?.id;
      const text = update.message.text || '';
      const msgId = update.message.message_id;

      if (!chatId) return res.status(200).send('OK');

      if (text === '/start') {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: '⚙️ Система готова. Жду видео (до 20 МБ).' })
        });
        return res.status(200).send('OK');
      }

      const fileObj = update.message.video || update.message.document || update.message.animation;
      
      if (fileObj && fileObj.file_id) {
        if (fileObj.file_size && fileObj.file_size > 20971520) {
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: '⚠️ ФАЙЛ БОЛЬШЕ 20 МБ! Отправь как "Видео" (Галерея), чтобы Телеграм его сжал.',
              reply_to_message_id: msgId
            })
          });
          return res.status(200).send('OK');
        }

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

    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const emotion = cb.data;
      const cbId = cb.id;
      
      if (!chatId) return res.status(200).send('OK');

      // Отключаем часики на кнопке, чтобы она не зависала
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ callback_query_id: cbId })
      });

      const origMsg = cb.message?.reply_to_message;
      const fileId = origMsg?.video?.file_id || origMsg?.document?.file_id || origMsg?.animation?.file_id;

      if (!fileId) {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: '❌ Ошибка: видео не найдено.' })
        });
        return res.status(200).send('OK');
      }

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId, text: '⚙️ Заказ отправлен на завод...' })
      });

      // Отправляем сигнал на GitHub
      const ghRes = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Webhook'
        },
        body: JSON.stringify({
          event_type: 'build_video',
          client_payload: { chat_id: chatId, file_id: fileId, emotion: emotion }
        })
      });

      // Умная обработка ошибок: если GitHub откажет, бот напишет почему
      if (!ghRes.ok) {
        const errText = await ghRes.text();
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: `❌ Ошибка связи с GitHub (${ghRes.status}): ${errText}` })
        });
      }

      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error(error);
    return res.status(200).send('OK');
  }
}
