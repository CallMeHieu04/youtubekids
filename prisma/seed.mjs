import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Đang đồng bộ toàn bộ video đã thêm vào Supabase...");

  let parent = await prisma.user.findFirst();
  if (!parent) {
    parent = await prisma.user.create({
      data: {
        email: "parent@safekids.app",
        parentPin: "1234",
      },
    });
  }

  // Cập nhật 2 bé
  await prisma.kidProfile.upsert({
    where: { id: "kid-thao-ly" },
    update: {
      name: "Bé Thảo Ly",
      avatarUrl: "/avatars/thao-ly.png",
    },
    create: {
      id: "kid-thao-ly",
      parentId: parent.id,
      name: "Bé Thảo Ly",
      avatarUrl: "/avatars/thao-ly.png",
      dailyLimitMinutes: 45,
      allowedStartHour: 6,
      allowedEndHour: 21,
      isLocked: false,
    },
  });

  await prisma.kidProfile.upsert({
    where: { id: "kid-duc-duy" },
    update: {
      name: "Bé Đức Duy",
      avatarUrl: "/avatars/duc-duy.png",
    },
    create: {
      id: "kid-duc-duy",
      parentId: parent.id,
      name: "Bé Đức Duy",
      avatarUrl: "/avatars/duc-duy.png",
      dailyLimitMinutes: 45,
      allowedStartHour: 6,
      allowedEndHour: 21,
      isLocked: false,
    },
  });

  // Toàn bộ danh sách video bạn đã thêm
  const allUserVideos = [
    {
      youtubeVideoId: "DLqtFH2bnJY",
      title: "TÂM TÌNH BÉ NHỎ (Phùng Minh Mẫn) giai điệu bài hát hay quá | Thực hiện: Thánh Ca Graceful Sounds.",
      authorName: "Nhạc Thánh Ca - Graceful Sounds",
      category: "Âm nhạc",
      thumbnailUrl: "https://i.ytimg.com/vi/DLqtFH2bnJY/hqdefault.jpg",
    },
    {
      youtubeVideoId: "xHlJlnshgEg",
      title: "Phim Hoạt Hình Mới Nhất 2020 - QUẢ ỔI XẤU XÍ ► Quà Tặng Cuộc Sống - Truyện Cổ Tích Việt Nam",
      authorName: "Tuổi Thần Tiên",
      category: "Hoạt hình",
      thumbnailUrl: "https://i.ytimg.com/vi/xHlJlnshgEg/hqdefault.jpg",
    },
    {
      youtubeVideoId: "6zC9S6hlrRo",
      title: "SỰ TÍCH CÂY XẤU HỔ - Truyện cổ tích - Phim hoạt hình - Tổng hợp phim hoạt hình hay",
      authorName: "Sắc Màu Cuộc Sống",
      category: "Hoạt hình",
      thumbnailUrl: "https://i.ytimg.com/vi/6zC9S6hlrRo/hqdefault.jpg",
    },
    {
      youtubeVideoId: "RuogOT5jQKA",
      title: "NHÀ NGHÈO KHOE CỦA | Quà tặng cuộc sống 2026 - Phim hoạt hình dân gian hay - Truyện cổ tích",
      authorName: "Quà tặng cuộc sống SR",
      category: "Hoạt hình",
      thumbnailUrl: "https://i.ytimg.com/vi/RuogOT5jQKA/hqdefault.jpg",
    },
    {
      youtubeVideoId: "tbPkuZBTy8c",
      title: "Top Bài Hát Tiếng Anh Hay Nhất Cho Trẻ Em | Finger Family| Học Tiếng Anh Qua Bài Hát",
      authorName: "Kids Tv Vietnam - nhac thieu nhi hay nhất",
      category: "Âm nhạc",
      thumbnailUrl: "https://i.ytimg.com/vi/tbPkuZBTy8c/hqdefault.jpg",
    },
    {
      youtubeVideoId: "HZC2AWoLxi0",
      title: "Bài hát ABC | Bảng chữ cái tiếng Anh | Play & Learn | Nhạc thiếu nhi vui nhộn | Super Pandobi",
      authorName: "Super Pandobi Việt Nam - Nhạc Thiếu Nhi Cho Bé",
      category: "Âm nhạc",
      thumbnailUrl: "https://i.ytimg.com/vi/HZC2AWoLxi0/hqdefault.jpg",
    },
    {
      youtubeVideoId: "F3R2uRPmV4A",
      title: "Dạy bé học tiếng anh qua các con vật hoạt hình / Dạy bé tập nhận biết tên các con vật - Thanh nấm",
      authorName: "Thanh Nấm",
      category: "Học tập",
      thumbnailUrl: "https://i.ytimg.com/vi/F3R2uRPmV4A/hqdefault.jpg",
    },
  ];

  for (const v of allUserVideos) {
    await prisma.approvedVideo.upsert({
      where: {
        parentId_youtubeVideoId: {
          parentId: parent.id,
          youtubeVideoId: v.youtubeVideoId,
        },
      },
      update: {
        title: v.title,
        authorName: v.authorName,
        category: v.category,
        thumbnailUrl: v.thumbnailUrl,
      },
      create: {
        parentId: parent.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        authorName: v.authorName,
        category: v.category,
        thumbnailUrl: v.thumbnailUrl,
      },
    });
  }

  console.log(`✅ Đã khôi phục thành công toàn bộ ${allUserVideos.length} video bạn đã thêm vào Supabase!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
