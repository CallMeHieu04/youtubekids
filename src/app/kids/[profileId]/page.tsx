import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Play, Clock, Sparkles, ShieldCheck, Lock, Heart, Film } from "lucide-react";
import { notFound } from "next/navigation";

interface KidGridPageProps {
  params: Promise<{
    profileId: string;
  }>;
}

export default async function KidGridPage({ params }: KidGridPageProps) {
  const { profileId } = await params;

  const profile = await prisma.kidProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    notFound();
  }

  // Lấy danh sách video đã được phụ huynh duyệt
  const videos = await prisma.approvedVideo.findMany({
    where: { parentId: profile.parentId },
    orderBy: { createdAt: "desc" },
  });

  // Tính thời gian xem hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsToday = await prisma.watchLog.findMany({
    where: {
      kidProfileId: profileId,
      startedAt: {
        gte: today,
      },
    },
  });

  const totalSecondsToday = logsToday.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const usedMinutes = Math.floor(totalSecondsToday / 60);
  const remainingMinutes = Math.max(0, profile.dailyLimitMinutes - usedMinutes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50 to-indigo-100 text-slate-800 pb-16">
      {/* Header Sinh động cho Bé */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-amber-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-md">
              {profile.avatarUrl || "🦁"}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                Chào bé {profile.name}! 🌟
              </h1>
              <p className="text-xs text-slate-500 font-medium">Chọn một video thật hay để bắt đầu xem nhé</p>
            </div>
          </div>

          {/* Badge Thời gian còn lại */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-amber-900 px-4 py-2 rounded-2xl shadow-sm">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500">Hôm nay còn</div>
                <div className="text-sm font-extrabold text-amber-700">{remainingMinutes} phút xem</div>
              </div>
            </div>

            <Link
              href="/"
              className="text-xs font-bold px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              Đổi Bé
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* Banner Chào Mừng */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 text-white p-6 sm:p-8 shadow-xl mb-8">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Góc Giải Trí An Toàn</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2">Thế Giới Video Bổ Ích & Vui Nhộn! 🚀</h2>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Tất cả video ở đây đều đã được bố mẹ chọn lọc kỹ càng để bé vừa học vừa chơi an toàn nhất.
            </p>
          </div>

          <div className="absolute right-4 bottom-0 text-7xl sm:text-8xl opacity-30 select-none pointer-events-none">
            🎈🧸
          </div>
        </div>

        {/* Video Grid Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600" />
            Danh Sách Video Đã Duyệt ({videos.length})
          </h2>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="text-5xl mb-3">📺</div>
            <h3 className="text-lg font-bold text-slate-800">Chưa có video nào được duyệt</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Bố mẹ hãy truy cập Bảng Điều Khiển để thêm các video YouTube yêu thích cho bé nhé!
            </p>
            <Link
              href="/parent/dashboard"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition"
            >
              Thêm video cho bé
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/kids/${profileId}/watch/${video.youtubeVideoId}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col"
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {video.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[150px]">{video.authorName || "YouTube Safe"}</span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Xem ngay
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
