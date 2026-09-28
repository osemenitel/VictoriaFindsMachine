import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function runFactory() {
  try {
    console.log('🚀 СТАРТ КОНВЕЙЕРА...');

    const realGadgetsPool = [
      {
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-arm-working-in-a-factory-42867-large.mp4',
        description: 'Ультраточный робот-манипулятор для домашней мастерской'
      },
      {
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41710-large.mp4',
        description: 'Умный держатель для телефона с автонаведением и беспроводной зарядкой'
      },
      {
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-tech-interface-31918-large.mp4',
        description: 'Компактный лазерный уровень с проекцией на 360 градусов'
      }
    ];

    const selectedGadget = realGadgetsPool[Math.floor(Math.random() * realGadgetsPool.length)];
    console.log(`✅ Выбран ролик: ${selectedGadget.description}`);

    const emotions = ['vic_shock', 'vic_facepalm', 'vic_think', 'vic_laugh', 'vic_sign'];
    const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    console.log(`👩 Реакция Виктории: ${selectedEmotion}.png`);

    const captionText = `🔥 Народ, вы эту дичь видели?! ${selectedGadget.description}.\n\nКитайцы опять пробили потолок! Берем или хлам? 👇`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Одобрить (ВК)', callback_data: 'publish_vk' },
          { text: '❌ В топку', callback_data: 'delete_video' }
        ]
      ]
    };

    console.log('📱 Отправка данных в Telegram напрямую через API...');

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`;
    
    await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      video: selectedGadget.videoUrl,
      caption: captionText,
      reply_markup: inlineKeyboard
    });

    console.log('✅ Готовый ролик успешно доставлен в Telegram!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка отправки:', error.response?.data || error.message);
    process.exit(1);
  }
}

runFactory();
