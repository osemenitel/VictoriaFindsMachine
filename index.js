import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем ключи из сейфа
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Функция генерации поста через Gemini Flash Lite
async function generateVictoriaPost() {
  try {
    const prompt = `
Ты — Виктория, современная девушка-блогер, которая ведет канал про крутые китайские новинки, гаджеты и необычные изобретения. 
Твоя задача — написать короткий, ультра-вовлекающий пост-реакцию на трендовый китайский товар или изобретение (придумай самое хайповое и залипательное изобретение для дома, красоты или жизни).

Стиль и правила:
1. Эмоциональная реакция шока и восторга: "Вау, вы это серьезно?!", "Как эта магия вообще работает?!", "Мне срочно это нужно в сумочку!".
2. Используй современный молодежный женский сленг (имба, вайб, стекляно, топчик, эстетично).
3. Никаких китайских букв и намеков на перевод. Текст должен выглядеть так, будто ты сама это нашла и тестируешь.
4. Добавь сочные эмодзи по делу.
5. В конце сделай легкую интригу или вопрос к подписчикам, чтобы они писали комменты.
6. Выбери одну из заготовленных эмоций для превью/ролика и укажи её в начале поста в квадратных скобках (например: [Шок], [Восторг], [Смех], [Удивление], [Мило]).
    `;

    const response = await axios.post(
      'https://polza.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-3.1-flash-lite',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${POLZA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Ошибка ИИ:', error.response ? error.response.data : error.message);
    return 'Блин, бро, чё-то нейросеть приуныла, не смогла придумать пост. Попробуем еще раз!';
  }
}

async function main() {
  try {
    console.log('Запуск генерации поста от Виктории...');
    
    // Генерируем пост
    const postContent = await generateVictoriaPost();
    
    // Формируем итоговое сообщение для тебя в телегу
    const finalMessage = `✨ **Новый выпуск для конвейера Виктории:**\n\n${postContent}`;
    
    // Отправляем тебе в личку
    await bot.sendMessage(TELEGRAM_CHAT_ID, finalMessage, { parse_mode: 'Markdown' });
    console.log('Пост успешно отправлен в Telegram!');
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

main();
