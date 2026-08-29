import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.approvedVideo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa video khỏi danh sách duyệt" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi xóa video" }, { status: 500 });
  }
}
