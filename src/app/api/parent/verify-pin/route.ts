import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập mã PIN" }, { status: 400 });
    }

    const parent = await prisma.user.findFirst();
    const correctPin = parent?.parentPin || "1234";

    if (pin.trim() === correctPin.trim()) {
      return NextResponse.json({ success: true, message: "Xác thực thành công" });
    } else {
      return NextResponse.json({ success: false, message: "Mã PIN không chính xác" }, { status: 401 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi xác thực" }, { status: 500 });
  }
}
