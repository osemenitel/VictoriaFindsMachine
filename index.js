import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Достаем ключи из сейфа
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const POLZA_API_KEY = process.env.POLZA_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// 📌 ЗДЕСЬ МЫ УКАЗЫВАЕМ ТОВАР ИЛИ СУТЬ РОЛИКА ИЗ КИТАЯ
// В будущем сюда будет автоматически прилетать текст из твоего парсера или базы трендов.
// Можешь менять этот текст перед запуском, чтобы проверять разные товары.
const itemDescription = "Какая-то странная китайская штуковина с лезвиями и ручкой, похожа на мудреную терку или черемшу для кухни, хрен пойми как работает с первого раза";

// Функция генерации поста через Gemini Flash Lite
async function generateVictoriaPost(item) {
  try {
    const prompt = `
Ты — Виктория, блогер с живым языком, которая обозревает крутые, странные и полезные находки, гаджеты и изобретения из Китая. 
Твоя задача — написать короткий, ультра-вовлекающий пост-реакцию для Telegram на основе конкретного предмета из видео.

Вот исходные данные о предмете/видео: "${item}"

Стиль и жесткие правила:
1. Опирайся СТРОГО на то, что указано в описании предмета. Если это непонятная дичь — так и говори: "Ребята, че за черемша / что это за вундервафля вообще?!", искренне пытаясь понять, как эта хрень работает. Если это полезная вещь (гаджет, инструмент, штука для дома или машины) — оцени её реальную пользу. Никаких придуманных из головы зеркал, если в описании другое!
2. Аудитория: общайся со ВСЕМИ подписчиками разом (и парням, и девчонкам залетают полезные штуки). Забудь про обращения типа "Девчули" или "Девчонки". Используй: "Ребята", "Народ", "Друзья".
3. Эмоциональная реакция: живой шок, интерес, юмор. Сленг современный, но в меру (имба, топчик, залипательно).
4. Никаких китайских иероглифов и намеков на чужой язык. Текст выглядит так, будто ты сама держишь это в руках.
5. Добавь сочные эмодзи по делу.
6. В самом начале поста обязательно укажи одну из эмоций в квадратных скобках: [Шок], [Удивление], [Смех], [Восторг] или [Интерес].
7. В конце задай крутой вопрос в комментарии, чтобы люди поспорили или написали догадки.
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
    return 'Блин, бро, нейросеть словила затуп, не смогла разобрать товар. Давай еще раз!';
  }
}

async function main() {
  try {
    console.log('Запуск генерации поста под конкретный товар...');
    
    // Генерируем пост на основе товара
    const postContent = await generateVictoriaPost(itemDescription);
    
    // Формируем итоговое сообщение
    const finalMessage = `📦 **Товар в обработке:** ${itemDescription}\n\n✨ **Пост от Виктории:**\n\n${postContent}`;
    
    // Отправляем в Телеграм
    await bot.sendMessage(TELEGRAM_CHAT_ID, finalMessage, { parse_mode: 'Markdown' });
    console.log('Пост по товару успешно отправлен в Telegram!');
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

main();
