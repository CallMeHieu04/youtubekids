import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId } = body;

    // Lấy tên các bé từ DB nếu có
    const kids = await prisma.kidProfile.findMany({
      orderBy: { createdAt: "asc" },
    });

    const kidNames = kids.length > 0 ? kids.map((k) => k.name).join(" & ") : "Bé Thảo Ly & Bé Đức Duy";

    const result = await sendTelegramAlert({
      videoTitle: "🎉 Thử nghiệm kết nối Bot Telegram SafeKids thành công!",
      videoId: "XqZsoesa55w",
      kidName: `${kidNames} (Kiểm tra)`,
      watchedTodayMinutes: 0,
      dailyLimitMinutes: 45,
      chatId,
      botToken,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Đã gửi tin nhắn test thành công tới Telegram của bạn!" });
    } else {
      return NextResponse.json({ success: false, message: result.message || "Không thể gửi tin nhắn" }, { status: 400 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi gửi test" }, { status: 500 });
  }
}
