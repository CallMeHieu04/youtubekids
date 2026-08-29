import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, passcode } = body;

    if (!profileId || !passcode) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập mật khẩu" }, { status: 400 });
    }

    const profile = await prisma.kidProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, message: "Hồ sơ bé không tồn tại" }, { status: 404 });
    }

    // Nếu profile không cài passcode hoặc passcode khớp chính xác
    const correctPasscode = profile.passcode || (profileId === "kid-thao-ly" ? "200917" : "220520");

    if (passcode.trim() === correctPasscode.trim()) {
      return NextResponse.json({
        success: true,
        message: `Chào mừng ${profile.name}!`,
        profileId: profile.id,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Mật khẩu chưa đúng rồi bé ơi! Hãy thử lại nhé.",
      }, { status: 401 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi xác thực mật khẩu" }, { status: 500 });
  }
}
