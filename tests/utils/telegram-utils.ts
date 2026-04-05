import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export async function sendMsgToTelegram(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is missing in environment variables.');
    return;
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
    console.log('Telegram message sent successfully:', response.data);
  } catch (error: any) {
    console.error('Error sending message to Telegram:', error.response ? error.response.data : error.message);
  }
}

export async function sendScreenshotToTelegram(screenshotPath: string, filename: string, message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const devUploadUrl = 'http://203.154.55.194:8300/upImg';

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is missing in environment variables.');
    return;
  }

  try {
    const screenshotData = fs.readFileSync(screenshotPath, { encoding: 'base64' });

    // Upload to Dev Server
    const devUploadResponse = await axios.post(devUploadUrl, {
      ImageBase64: screenshotData,
      FileName: filename,
    });

    if (devUploadResponse.status === 200) {
      console.log('Screenshot uploaded successfully to dev server.');
      
      const imageUrl = `https://dev-logic.net/AutomateReport/${filename}`;
      const telegramMessage = `${message || 'Screenshot'}\n${imageUrl}`;

      // Send to Telegram
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: telegramMessage,
      });
      console.log('Telegram screenshot notification sent successfully.');
    }
  } catch (error: any) {
    console.error('Error in Telegram screenshot flow:', error.response ? error.response.data : error.message);
  }
}
