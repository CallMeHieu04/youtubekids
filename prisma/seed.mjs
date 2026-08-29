import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu cho SafeKids Video...");

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

  const kid = await prisma.kidProfile.upsert({
    where: { id: "demo-kid-01" },
    update: {},
    create: {
      id: "demo-kid-01",
      parentId: parent.id,
      name: "Bé Bắp",
      avatarUrl: "🦁",
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
      category: "Âm nhạc",
      thumbnailUrl: "https://img.youtube.com/vi/XqZsoesa55w/hqdefault.jpg",
    },
    {
      youtubeVideoId: "kJQP7kiw5Fk",
      title: "Despacito ft. Daddy Yankee",
      authorName: "Luis Fonsi",
      category: "Âm nhạc",
      thumbnailUrl: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
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

  console.log("✅ Seed dữ liệu mẫu thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
