import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeOEmbed } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || searchParams.get("videoId");

    if (!url) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp URL hoặc Video ID của YouTube" },
        { status: 400 }
      );
    }

    const metadata = await fetchYouTubeOEmbed(url);
    return NextResponse.json(metadata);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Không thể lấy thông tin video" },
      { status: 500 }
    );
  }
}
