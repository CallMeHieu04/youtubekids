export interface YouTubeMetadata {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  html: string;
}

/**
 * Trích xuất YouTube Video ID từ bất kỳ định dạng URL nào (watch, embed, youtu.be, shorts...)
 */
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Nếu người dùng chỉ dán trực tiếp 11 ký tự Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Phân tích các loại URL YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Lấy metadata video bằng YouTube oEmbed API mà không cần YouTube Data API Key
 */
export async function fetchYouTubeOEmbed(videoIdOrUrl: string): Promise<YouTubeMetadata> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) {
    throw new Error("ID video YouTube không hợp lệ.");
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const res = await fetch(oembedUrl, {
    headers: {
      "User-Agent": "SafeKids-App/1.0",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Không tìm thấy thông tin video (${res.status}). Hãy kiểm tra video có ở chế độ riêng tư không.`);
  }

  const data = await res.json();

  // URL thumbnail chất lượng cao tiêu chuẩn của YouTube
  const hqThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    title: data.title || "Video YouTube",
    authorName: data.author_name || "Kênh YouTube",
    authorUrl: data.author_url || "",
    thumbnailUrl: data.thumbnail_url || hqThumbnail,
    html: data.html || "",
  };
}
