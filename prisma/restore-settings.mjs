import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Đang khôi phục cấu hình Telegram và mã PIN vào Supabase...");

  const parent = await prisma.user.upsert({
    where: { email: "parent@safekids.app" },
    update: {
      parentPin: "0000",
      telegramBotToken: "8973295630:AAEhc3GPPYQYAOLu-vZqXzGCsLLxATfAV3k",
      telegramChatId: "6170605138",
    },
    create: {
      email: "parent@safekids.app",
      parentPin: "0000",
      telegramBotToken: "8973295630:AAEhc3GPPYQYAOLu-vZqXzGCsLLxATfAV3k",
      telegramChatId: "6170605138",
    },
  });

  console.log("✅ Đã khôi phục thành công cấu hình Telegram (Chat ID: 6170605138) và mã PIN (0000) vào Supabase!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
