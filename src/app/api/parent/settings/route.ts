import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let parent = await prisma.user.findFirst();
    if (!parent) {
      parent = await prisma.user.create({
        data: {
          email: "parent@safekids.app",
          parentPin: "1234",
        },
      });
    }

    return NextResponse.json({
      email: parent.email,
      parentPin: parent.parentPin,
      telegramChatId: parent.telegramChatId || "",
      telegramBotToken: parent.telegramBotToken || "",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi lấy cấu hình" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentPin, telegramChatId, telegramBotToken } = body;

    let parent = await prisma.user.findFirst();
    if (!parent) {
      parent = await prisma.user.create({
        data: {
          email: "parent@safekids.app",
          parentPin: parentPin || "1234",
          telegramChatId,
          telegramBotToken,
        },
      });
    } else {
      parent = await prisma.user.update({
        where: { id: parent.id },
        data: {
          ...(parentPin ? { parentPin: parentPin.trim() } : {}),
          ...(telegramChatId !== undefined ? { telegramChatId: telegramChatId.trim() } : {}),
          ...(telegramBotToken !== undefined ? { telegramBotToken: telegramBotToken.trim() } : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật cài đặt thành công",
      settings: {
        parentPin: parent.parentPin,
        telegramChatId: parent.telegramChatId,
        telegramBotToken: parent.telegramBotToken,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi cập nhật cài đặt" }, { status: 500 });
  }
}
