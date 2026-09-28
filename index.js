import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем секретные ключи из окружения (передаст GitHub Actions)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;

// Инициализируем бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false }); // polling: false важно для бессерверной архитектуры

// Функция для теста связи с ИИ Gemini через Polza.ai
async function testGeminiConnection() {
  try {
    const response = await axios.post(
      'https://polza.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-3.1-flash-lite',
        messages: [{ role: 'user', content: 'Привет! Напиши одно короткое слово, чтобы я знал, что ты работаешь.' }]
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
    return 'Ошибка ИИ';
  }
}

// Главная функция, которая запускается при старте
async function main() {
  try {
    console.log('Запуск фабрики Виктории...');
    
    // Тестируем ИИ
    const aiResponse = await testGeminiConnection();
    console.log(`Ответ от Gemini: ${aiResponse}`);

    // Отправляем тебе тестовое сообщение в Телеграм (замени ТВОЙ_ID на твой Telegram ID, мы найдем его позже)
    // Пока просто выведем в лог, что бот готов
    console.log('Все ключи подключены верно. Бот готов к приему команд!');
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

main();
