import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu cho SafeKids Video...");

  // 1. Tạo Parent User
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

  // 1. Bé Thảo Ly
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

  // 2. Bé Đức Duy
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

  // 3. Thêm các Video YouTube mẫu đã duyệt an toàn cho trẻ em
  const sampleVideos = [
    {
      youtubeVideoId: "kJQP7kiw5Fk", // Despacito / Luis Fonsi or Kids Song
      title: "Bài Hát Bé Đi Mẫu Giáo - Nhạc Thiếu Nhi Vui Nhộn",
      authorName: "Kênh Thiếu Nhi",
      category: "Âm nhạc",
      thumbnailUrl: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    },
    {
      youtubeVideoId: "XqZsoesa55w", // Baby Shark
      title: "Baby Shark Dance | Sing and Dance! | Animal Songs | PINKFONG Songs for Children",
      authorName: "Pinkfong Baby Shark",
      category: "Hoạt hình",
      thumbnailUrl: "https://img.youtube.com/vi/XqZsoesa55w/hqdefault.jpg",
    },
    {
      youtubeVideoId: "WRVsOCh907o", // Numbers song
      title: "Numberblocks - Học Đếm Số Cùng Những Khối Vuông Kì Diệu",
      authorName: "Numberblocks Tiếng Việt",
      category: "Học tập",
      thumbnailUrl: "https://img.youtube.com/vi/WRVsOCh907o/hqdefault.jpg",
    },
    {
      youtubeVideoId: "71h8MZKF8bs", // Whees on the Bus
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
