export interface TelegramAlertPayload {
  videoTitle: string;
  videoId: string;
  kidName: string;
  watchedTodayMinutes: number;
  dailyLimitMinutes: number;
  chatId?: string;
  botToken?: string;
}

/**
 * Gửi tin nhắn cảnh báo tới Telegram của phụ huynh
 */
export async function sendTelegramAlert({
  videoTitle,
  videoId,
  kidName,
  watchedTodayMinutes,
  dailyLimitMinutes,
  chatId,
  botToken,
}: TelegramAlertPayload): Promise<{ success: boolean; message?: string }> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;

  if (!token || token === "your_telegram_bot_token_here") {
    console.warn("⚠️ [Telegram Alert] Bot token chưa được cấu hình.");
    return { success: false, message: "Chưa cấu hình Telegram Bot Token." };
  }

  if (!targetChatId || targetChatId === "your_telegram_chat_id_here") {
    console.warn("⚠️ [Telegram Alert] Chat ID chưa được cấu hình.");
    return { success: false, message: "Chưa cấu hình Telegram Chat ID." };
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = now.toLocaleDateString("vi-VN");

  const progressPercent = Math.min(
    100,
    Math.round((watchedTodayMinutes / (dailyLimitMinutes || 1)) * 100)
  );

  const messageText = `
🛡️ *[SafeKids Video]* Thông báo giám sát

👶 *Bé:* ${kidName}
▶️ *Đang xem:* [${escapeMarkdown(videoTitle)}](https://youtu.be/${videoId})
⏱ *Thời điểm:* ${timeString} (${dateString})
📊 *Hôm nay đã xem:* \`${watchedTodayMinutes} / ${dailyLimitMinutes} phút\` (${progressPercent}%)

${
  watchedTodayMinutes >= dailyLimitMinutes
    ? "⚠️ *CẢNH BÁO:* Bé đã đạt giới hạn thời gian trong ngày!"
    : "✅ Trong giới hạn cho phép."
}
`.trim();

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("Telegram send error:", data);
      return { success: false, message: data.description || "Lỗi gửi tin nhắn" };
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to send telegram message:", err);
    return { success: false, message: err.message || "Lỗi mạng" };
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
