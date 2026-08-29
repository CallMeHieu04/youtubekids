import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, pin, addMinutes = 15 } = body;

    if (!profileId || !pin) {
      return NextResponse.json({ error: "Thiếu profileId hoặc mã PIN" }, { status: 400 });
    }

    const profile = await prisma.kidProfile.findUnique({
      where: { id: profileId },
      include: { parent: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile không tồn tại" }, { status: 404 });
    }

    // So sánh mã PIN với mã PIN của Parent (mặc định '1234')
    const parentPin = profile.parent?.parentPin || "1234";
    if (pin.trim() !== parentPin.trim()) {
      return NextResponse.json({ success: false, message: "Mã PIN phụ huynh không đúng." }, { status: 401 });
    }

    // Mở khóa khẩn cấp và tăng thêm limit phút
    const updated = await prisma.kidProfile.update({
      where: { id: profileId },
      data: {
        isLocked: false,
        dailyLimitMinutes: { increment: addMinutes },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cộng thêm ${addMinutes} phút xem!`,
      dailyLimitMinutes: updated.dailyLimitMinutes,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi mở khóa" }, { status: 500 });
  }
}
