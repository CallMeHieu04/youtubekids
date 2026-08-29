import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Sparkles, Lock, Clock, CheckCircle2 } from "lucide-react";
import KidProfileCard from "@/components/kids/KidProfileCard";

export default async function HomePage() {
  const profiles = await prisma.kidProfile.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 font-black shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                SafeKids <span className="text-amber-400">Video</span>
              </span>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Parental Protected</p>
            </div>
          </div>

          <Link
            href="/parent/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Khu vực Phụ Huynh</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Nền tảng YouTube an toàn 100% cho trẻ nhỏ</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl mb-6">
          Cho Con Xem Video Vui Vẻ, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400">
            Bố Mẹ Luôn Yên Tâm
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
          Chỉ xem video do bố mẹ duyệt trước, tự động khóa khi hết giờ và nhận cảnh báo trực tiếp qua Telegram Bot.
        </p>

        {/* Profile Selector Card */}
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-amber-300 mb-6 flex items-center justify-center gap-2">
            <span>👶</span> Chọn Hồ Sơ Của Bé Để Xem Video
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((kid) => (
              <KidProfileCard key={kid.id} kid={kid} />
            ))}

            {profiles.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-300">
                <p>Chưa có hồ sơ bé nào. Vui lòng vào Bảng điều khiển phụ huynh để tạo hồ sơ.</p>
              </div>
            )}
          </div>
        </div>

        {/* Highlight Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-4xl w-full text-left">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">Chặn 100% Gợi Ý Ngoài</h4>
            <p className="text-xs text-slate-400 mt-1">Sử dụng tham số rel=0 và whitelist độc quyền</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Clock className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-bold text-sm text-white">Tự Động Khóa Khi Hết Giờ</h4>
            <p className="text-xs text-slate-400 mt-1">Đếm ngược và gửi heartbeat mỗi 30s</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Sparkles className="w-6 h-6 text-pink-400 mb-2" />
            <h4 className="font-bold text-sm text-white">Cảnh Báo Telegram Tức Thì</h4>
            <p className="text-xs text-slate-400 mt-1">Nhận thông báo kèm tên video bé đang xem</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2 px-4">
        <span>SafeKids Video © 2026 - Giải Pháp Quản Lý YouTube Thông Minh</span>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-300 font-semibold text-[11px]">
          <span>Design by</span>
          <strong className="text-white font-black tracking-wide">Minh Hiếu</strong>
          <span>✨</span>
        </span>
      </footer>
    </div>
  );
}
