import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, videoId, videoTitle, kidName } = body;

    if (!profileId || !videoId) {
      return NextResponse.json({ error: "Thiếu thông tin profileId hoặc videoId" }, { status: 400 });
    }

    // 1. Tạo bản ghi WatchLog mới
    const log = await prisma.watchLog.create({
      data: {
        kidProfileId: profileId,
        youtubeVideoId: videoId,
        videoTitle: videoTitle || "Video YouTube",
        durationSeconds: 0,
      },
      include: {
        kidProfile: {
          include: {
            parent: true,
          },
        },
      },
    });

    // 2. Tính tổng thời gian đã xem hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsToday = await prisma.watchLog.findMany({
      where: {
        kidProfileId: profileId,
        startedAt: {
          gte: today,
        },
      },
    });

    const totalSecondsToday = logsToday.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const watchedTodayMinutes = Math.floor(totalSecondsToday / 60);

    // 3. Gửi thông báo qua Telegram Bot tới Phụ huynh
    const parent = log.kidProfile.parent;
    if (parent) {
      await sendTelegramAlert({
        videoTitle: videoTitle || "Video YouTube",
        videoId,
        kidName: kidName || log.kidProfile.name,
        watchedTodayMinutes,
        dailyLimitMinutes: log.kidProfile.dailyLimitMinutes,
        chatId: parent.telegramChatId || undefined,
        botToken: parent.telegramBotToken || undefined,
      });
    }

    return NextResponse.json({ success: true, logId: log.id, watchedTodayMinutes });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Tracking play error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý tracking play" }, { status: 500 });
  }
}
