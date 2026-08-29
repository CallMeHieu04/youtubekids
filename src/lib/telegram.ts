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
 * Gửi tin nhắn cảnh báo tới 1 hoặc nhiều tài khoản Telegram của phụ huynh
 * Hỗ trợ nhiều Chat ID cách nhau bởi dấu phẩy, chấm phẩy hoặc khoảng trắng (Ví dụ: "6170605138, 987654321, -100123456789")
 */
export async function sendTelegramAlert({
  videoTitle,
  videoId,
  kidName,
  watchedTodayMinutes,
  dailyLimitMinutes,
  chatId,
  botToken,
}: TelegramAlertPayload): Promise<{ success: boolean; message?: string; count?: number }> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = chatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;

  if (!token || token === "your_telegram_bot_token_here") {
    console.warn("⚠️ [Telegram Alert] Bot token chưa được cấu hình.");
    return { success: false, message: "Chưa cấu hình Telegram Bot Token." };
  }

  if (!rawChatId || rawChatId === "your_telegram_chat_id_here") {
    console.warn("⚠️ [Telegram Alert] Chat ID chưa được cấu hình.");
    return { success: false, message: "Chưa cấu hình Telegram Chat ID." };
  }

  // Tách danh sách Chat ID nếu phụ huynh nhập nhiều tài khoản
  const chatIds = rawChatId
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (chatIds.length === 0) {
    return { success: false, message: "Không tìm thấy Chat ID hợp lệ." };
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateString = now.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  // Gửi đồng thời tới tất cả các tài khoản Telegram
  const sendPromises = chatIds.map(async (targetId) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetId,
          text: messageText,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      });
      const data = await res.json();
      return { targetId, ok: res.ok && data.ok, description: data.description };
    } catch (err: unknown) {
      const error = err as Error;
      return { targetId, ok: false, description: error.message };
    }
  });

  const results = await Promise.allSettled(sendPromises);
  const successfulSends = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok
  ).length;

  if (successfulSends > 0) {
    return {
      success: true,
      message: `Đã gửi thông báo thành công tới ${successfulSends}/${chatIds.length} tài khoản Telegram.`,
      count: successfulSends,
    };
  }

  // Nếu tất cả đều lỗi, lấy lỗi đầu tiên
  const firstError = results.find(
    (r) => r.status === "fulfilled" && !r.value.ok
  ) as PromiseFulfilledResult<{ targetId: string; ok: boolean; description?: string }> | undefined;

  return {
    success: false,
    message: firstError?.value.description || "Không thể gửi tin nhắn tới các Chat ID đã nhập.",
  };
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
