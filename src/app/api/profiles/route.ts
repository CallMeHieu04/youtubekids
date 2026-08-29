import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const parent = await prisma.user.findFirst({
      include: {
        kidProfiles: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ profiles: parent?.kidProfiles || [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi lấy danh sách hồ sơ" }, { status: 500 });
  }
}
