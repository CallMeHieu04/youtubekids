import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId, fetchYouTubeOEmbed } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, urls, category = "Hoạt hình" } = body;

    if (!query && (!urls || urls.length === 0)) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên kênh, link Playlist hoặc danh sách link video." },
        { status: 400 }
      );
    }

    let parent = await prisma.user.findFirst();
    if (!parent) {
      parent = await prisma.user.create({
        data: { email: "parent@safekids.app", parentPin: "0000" },
      });
    }

    const videoIdSet = new Set<string>();

    // 1. Nếu truyền mảng URL trực tiếp
    if (Array.isArray(urls) && urls.length > 0) {
      for (const u of urls) {
        const id = extractYouTubeVideoId(u);
        if (id) videoIdSet.add(id);
      }
    }

    // 2. Nếu người dùng dán 1 đoạn văn bản / link kênh / playlist
    const rawInput = (query || "").trim();
    if (rawInput) {
      // Tìm tất cả các link youtube có trong đoạn văn bản
      const matches = rawInput.matchAll(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
      );
      for (const m of matches) {
        if (m[1]) videoIdSet.add(m[1]);
      }

      // Nếu là Playlist URL (list=PL...)
      const playlistMatch = rawInput.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (playlistMatch && playlistMatch[1]) {
        const playlistId = playlistMatch[1];
        try {
          // Thử lấy RSS feed của Playlist
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
          const res = await fetch(rssUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          });
          if (res.ok) {
            const xml = await res.text();
            const idMatches = xml.matchAll(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/g);
            for (const im of idMatches) {
              if (im[1]) videoIdSet.add(im[1]);
            }
          }
        } catch (e) {
          console.warn("Playlist RSS error:", e);
        }
      }

      // Nếu là Channel URL / Handle (@Channel)
      if (videoIdSet.size === 0 && (rawInput.startsWith("@") || rawInput.includes("youtube.com/"))) {
        let channelUrl = rawInput;
        if (rawInput.startsWith("@")) {
          channelUrl = `https://www.youtube.com/${rawInput}/videos`;
        } else if (!channelUrl.includes("/videos") && !channelUrl.includes("watch") && !channelUrl.includes("playlist")) {
          channelUrl = `${channelUrl.replace(/\/$/, "")}/videos`;
        }

        try {
          const res = await fetch(channelUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            },
          });
          if (res.ok) {
            const html = await res.text();
            const idMatches = html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
            for (const im of idMatches) {
              if (im[1]) {
                videoIdSet.add(im[1]);
                if (videoIdSet.size >= 30) break; // Lấy tối đa 30 video mới nhất
              }
            }
          }
        } catch (e) {
          console.warn("Channel scrape error:", e);
        }
      }
    }

    const detectedIds = Array.from(videoIdSet);
    if (detectedIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy video nào. Hãy kiểm tra lại link kênh hoặc dán danh sách link video (VD: https://youtu.be/xxx).",
        },
        { status: 404 }
      );
    }

    // 3. Lấy metadata và lưu vào cơ sở dữ liệu Supabase
    const importedVideos = [];
    const errors = [];

    // Chạy song song từng lô 5 video để tránh rate-limit
    const batchSize = 5;
    for (let i = 0; i < detectedIds.length; i += batchSize) {
      const chunk = detectedIds.slice(i, i + batchSize);
      const promises = chunk.map(async (vid) => {
        try {
          const meta = await fetchYouTubeOEmbed(vid);
          const saved = await prisma.approvedVideo.upsert({
            where: {
              parentId_youtubeVideoId: {
                parentId: parent.id,
                youtubeVideoId: meta.videoId,
              },
            },
            update: {
              title: meta.title,
              authorName: meta.authorName,
              thumbnailUrl: meta.thumbnailUrl,
              category,
            },
            create: {
              parentId: parent.id,
              youtubeVideoId: meta.videoId,
              title: meta.title,
              authorName: meta.authorName,
              thumbnailUrl: meta.thumbnailUrl,
              category,
            },
          });
          return { success: true, video: saved };
        } catch (err: unknown) {
          const e = err as Error;
          return { success: false, videoId: vid, error: e.message };
        }
      });

      const chunkResults = await Promise.all(promises);
      for (const r of chunkResults) {
        if (r.success && r.video) {
          importedVideos.push(r.video);
        } else {
          errors.push(r);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${importedVideos.length} video vào danh sách của bé!`,
      totalDetected: detectedIds.length,
      importedCount: importedVideos.length,
      videos: importedVideos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Batch import error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý nhập video" }, { status: 500 });
  }
}
