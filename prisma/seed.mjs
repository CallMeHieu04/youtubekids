import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu tạo hồ sơ cho Bé Thảo Ly và Bé Đức Duy...");

  const parent = await prisma.user.upsert({
    where: { email: "parent@safekids.app" },
    update: {},
    create: {
      email: "parent@safekids.app",
      parentPin: "1234",
      telegramChatId: "",
      telegramBotToken: "",
    },
  });

  // Xóa profile cũ nếu có
  try {
    await prisma.kidProfile.deleteMany({
      where: {
        id: "demo-kid-01",
      },
    });
  } catch (e) {
    // ignore
  }

  // 1. Bé Thảo Ly
  const thaoLy = await prisma.kidProfile.upsert({
    where: { id: "kid-thao-ly" },
    update: {
      name: "Bé Thảo Ly",
      avatarUrl: "👧",
    },
    create: {
      id: "kid-thao-ly",
      parentId: parent.id,
      name: "Bé Thảo Ly",
      avatarUrl: "👧",
      dailyLimitMinutes: 45,
      allowedStartHour: 6,
      allowedEndHour: 21,
      isLocked: false,
    },
  });

  // 2. Bé Đức Duy
  const ducDuy = await prisma.kidProfile.upsert({
    where: { id: "kid-duc-duy" },
    update: {
      name: "Bé Đức Duy",
      avatarUrl: "👦",
    },
    create: {
      id: "kid-duc-duy",
      parentId: parent.id,
      name: "Bé Đức Duy",
      avatarUrl: "👦",
      dailyLimitMinutes: 45,
      allowedStartHour: 6,
      allowedEndHour: 21,
      isLocked: false,
    },
  });

  const sampleVideos = [
    {
      youtubeVideoId: "XqZsoesa55w",
      title: "Baby Shark Dance | Sing and Dance! | PINKFONG Songs for Children",
      authorName: "Pinkfong Baby Shark",
      category: "Hoạt hình",
      thumbnailUrl: "https://img.youtube.com/vi/XqZsoesa55w/hqdefault.jpg",
    },
    {
      youtubeVideoId: "WRVsOCh907o",
      title: "Numberblocks - Học Đếm Số Cùng Những Khối Vuông Kì Diệu",
      authorName: "Numberblocks Tiếng Việt",
      category: "Học tập",
      thumbnailUrl: "https://img.youtube.com/vi/WRVsOCh907o/hqdefault.jpg",
    },
    {
      youtubeVideoId: "71h8MZKF8bs",
      title: "Wheels On The Bus | CoComelon Nursery Rhymes & Kids Songs",
      authorName: "Cocomelon - Nursery Rhymes",
      category: "Âm nhạc",
      thumbnailUrl: "https://img.youtube.com/vi/71h8MZKF8bs/hqdefault.jpg",
    },
    {
      youtubeVideoId: "kJQP7kiw5Fk",
      title: "Bài Hát Bé Đi Mẫu Giáo - Nhạc Thiếu Nhi Vui Nhộn",
      authorName: "Kênh Thiếu Nhi",
      category: "Âm nhạc",
      thumbnailUrl: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    },
  ];

  for (const v of sampleVideos) {
    await prisma.approvedVideo.upsert({
      where: {
        parentId_youtubeVideoId: {
          parentId: parent.id,
          youtubeVideoId: v.youtubeVideoId,
        },
      },
      update: {},
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

  console.log("✅ Đã tạo thành công 2 bé: Bé Thảo Ly & Bé Đức Duy!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
