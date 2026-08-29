import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, avatarUrl, dailyLimitMinutes, allowedStartHour, allowedEndHour, isLocked, passcode } = body;

    const updateData: {
      name?: string;
      avatarUrl?: string;
      dailyLimitMinutes?: number;
      allowedStartHour?: number;
      allowedEndHour?: number;
      isLocked?: boolean;
      passcode?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (dailyLimitMinutes !== undefined) updateData.dailyLimitMinutes = Number(dailyLimitMinutes);
    if (allowedStartHour !== undefined) updateData.allowedStartHour = Number(allowedStartHour);
    if (allowedEndHour !== undefined) updateData.allowedEndHour = Number(allowedEndHour);
    if (isLocked !== undefined) updateData.isLocked = Boolean(isLocked);
    if (passcode !== undefined) updateData.passcode = passcode ? String(passcode).trim() : null;

    const updated = await prisma.kidProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi cập nhật hồ sơ" }, { status: 500 });
  }
}
