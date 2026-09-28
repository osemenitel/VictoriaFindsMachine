import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем ключи
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Твой ID

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function testGeminiConnection() {
  try {
    const response = await axios.post(
      'https://polza.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-3.1-flash-lite',
        messages: [{ role: 'user', content: 'Напиши коротко: "Связь с ИИ установлена!"' }]
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
    return 'Ошибка связи с ИИ';
  }
}

async function main() {
  try {
    // 1. Тестируем ИИ
    const aiMessage = await testGeminiConnection();
    
    // 2. Формируем сообщение для тебя
    const finalMessage = `🤖 Привет, бро! Завод Виктории запущен.\n\nПроверка систем:\n✅ Токен Telegram: работает\n✅ Токен Gemini: ${aiMessage}`;
    
    // 3. Отправляем в Телеграм
    await bot.sendMessage(TELEGRAM_CHAT_ID, finalMessage);
    console.log('Сообщение успешно отправлено в Telegram!');
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
  }
}

main();
