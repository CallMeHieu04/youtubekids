import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId, fetchYouTubeOEmbed } from "@/lib/youtube";

// Lấy danh sách video đã duyệt
export async function GET() {
  try {
    const parent = await prisma.user.findFirst();
    if (!parent) {
      return NextResponse.json({ videos: [] });
    }

    const videos = await prisma.approvedVideo.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ videos });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Lỗi lấy danh sách video" }, { status: 500 });
  }
}

// Thêm video mới vào danh sách duyệt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urlOrId, category = "Chung", customTitle } = body;

    if (!urlOrId) {
      return NextResponse.json({ error: "Vui lòng nhập đường dẫn hoặc Video ID YouTube" }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(urlOrId);
    if (!videoId) {
      return NextResponse.json({ error: "Định dạng liên kết YouTube không hợp lệ" }, { status: 400 });
    }

    // 1. Lấy thông tin phụ huynh mặc định
    let parent = await prisma.user.findFirst();
    if (!parent) {
      parent = await prisma.user.create({
        data: {
          email: "parent@safekids.app",
          parentPin: "1234",
        },
      });
    }

    // 2. Kiểm tra xem video đã có trong danh sách chưa
    const existing = await prisma.approvedVideo.findUnique({
      where: {
        parentId_youtubeVideoId: {
          parentId: parent.id,
          youtubeVideoId: videoId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Video này đã tồn tại trong danh sách được duyệt của bạn rồi!" },
        { status: 400 }
      );
    }

    // 3. Fetch metadata từ YouTube oEmbed
    let title = customTitle;
    let authorName = "YouTube Channel";
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembed = await fetchYouTubeOEmbed(videoId);
      if (!title) title = oembed.title;
      authorName = oembed.authorName;
      if (oembed.thumbnailUrl) thumbnailUrl = oembed.thumbnailUrl;
    } catch (e) {
      console.warn("Could not fetch oembed metadata:", e);
      if (!title) title = `Video YouTube (${videoId})`;
    }

    // 4. Lưu vào Database
    const newVideo = await prisma.approvedVideo.create({
      data: {
        parentId: parent.id,
        youtubeVideoId: videoId,
        title: title || `Video YouTube ${videoId}`,
        authorName,
        thumbnailUrl,
        category: category.trim() || "Chung",
      },
    });

    return NextResponse.json({ success: true, video: newVideo });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Add video error:", err);
    return NextResponse.json({ error: err.message || "Lỗi thêm video" }, { status: 500 });
  }
}
