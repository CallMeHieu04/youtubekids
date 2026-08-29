import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, videoId, deltaSeconds = 30 } = body;

    if (!profileId || !videoId) {
      return NextResponse.json({ error: "Thiếu profileId hoặc videoId" }, { status: 400 });
    }

    // 1. Tìm bản ghi xem gần nhất của profile này với video này
    const latestLog = await prisma.watchLog.findFirst({
      where: {
        kidProfileId: profileId,
        youtubeVideoId: videoId,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (latestLog) {
      await prisma.watchLog.update({
        where: { id: latestLog.id },
        data: {
          durationSeconds: { increment: deltaSeconds },
        },
      });
    }

    // 2. Tính tổng thời gian đã xem trong ngày hôm nay
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

    // 3. Lấy thông tin giới hạn của Profile
    const profile = await prisma.kidProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile không tồn tại" }, { status: 404 });
    }

    const limitSeconds = profile.dailyLimitMinutes * 60;
    const remainingSeconds = Math.max(0, limitSeconds - totalSecondsToday);
    const isLocked = profile.isLocked || remainingSeconds <= 0;

    return NextResponse.json({
      success: true,
      totalSecondsToday,
      remainingSeconds,
      isLocked,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Heartbeat error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý heartbeat" }, { status: 500 });
  }
}
