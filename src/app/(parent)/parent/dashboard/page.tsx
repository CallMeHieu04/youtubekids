import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Clock,
  Film,
  ShieldCheck,
  AlertTriangle,
  Play,
  TrendingUp,
  Settings,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  let parent = await prisma.user.findFirst({
    include: {
      kidProfiles: true,
      approvedVideos: true,
    },
  });

  if (!parent) {
    parent = await prisma.user.create({
      data: {
        email: "parent@safekids.app",
        parentPin: "1234",
        kidProfiles: {
          create: {
            id: "demo-kid-01",
            name: "Bé Bắp",
            avatarUrl: "🦁",
            dailyLimitMinutes: 45,
            allowedStartHour: 6,
            allowedEndHour: 21,
          },
        },
      },
      include: {
        kidProfiles: true,
        approvedVideos: true,
      },
    });
  }

  const kid = parent.kidProfiles[0] || null;

  // Lấy lịch sử xem của ngày hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsToday = kid
    ? await prisma.watchLog.findMany({
        where: {
          kidProfileId: kid.id,
          startedAt: { gte: today },
        },
        orderBy: { startedAt: "desc" },
      })
    : [];

  const totalSecondsToday = logsToday.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const watchedMinutesToday = Math.floor(totalSecondsToday / 60);
  const remainingMinutes = kid ? Math.max(0, kid.dailyLimitMinutes - watchedMinutesToday) : 0;
  const usagePercent = kid
    ? Math.min(100, Math.round((watchedMinutesToday / (kid.dailyLimitMinutes || 1)) * 100))
    : 0;

  // Toàn bộ lịch sử xem gần đây (30 ngày)
  const recentLogs = kid
    ? await prisma.watchLog.findMany({
        where: { kidProfileId: kid.id },
        orderBy: { startedAt: "desc" },
        take: 15,
      })
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Giám Sát Trẻ Em Thời Gian Thực</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Bảng Điều Khiển: {kid ? `Bé ${kid.name}` : "Gia Đình"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi thời lượng xem, quản lý danh sách video và nhận cảnh báo an toàn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/parent/videos"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Video Mới</span>
          </Link>
          <Link
            href="/parent/settings"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-700 transition"
          >
            <Settings className="w-4 h-4" />
            <span>Cài Đặt Quy Tắc</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Thời lượng xem hôm nay */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Hôm nay đã xem</span>
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {watchedMinutesToday}{" "}
            <span className="text-sm font-semibold text-slate-400">/ {kid?.dailyLimitMinutes || 45} phút</span>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  usagePercent >= 100 ? "bg-rose-500" : usagePercent > 70 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>Còn lại: {remainingMinutes} phút</span>
              <span>{usagePercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Trạng thái Khóa */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Trạng thái màn hình</span>
            <div className={`p-2 rounded-xl ${kid?.isLocked ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              {kid?.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-black">
            {kid?.isLocked ? (
              <span className="text-rose-400">Đang Khóa Khẩn Cấp</span>
            ) : remainingMinutes <= 0 ? (
              <span className="text-amber-400">Hết Giờ Xem</span>
            ) : (
              <span className="text-emerald-400">Đang Mở Xem</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Khung giờ: <span className="text-slate-200 font-bold">{kid?.allowedStartHour}:00 - {kid?.allowedEndHour}:00</span>
          </p>
        </div>

        {/* Card 3: Số lượng Video đã duyệt */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Video Trong Whitelist</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{parent?.approvedVideos.length || 0}</div>
          <p className="text-xs text-slate-400 mt-2">Được chọn lọc an toàn 100%</p>
        </div>

        {/* Card 4: Telegram Alert */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Cảnh Báo Telegram</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-black text-white">
            {parent?.telegramChatId ? (
              <span className="text-emerald-400 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Đã Kết Nối
              </span>
            ) : (
              <span className="text-amber-400 text-sm">Chưa Cấu Hình Chat ID</span>
            )}
          </div>
          <Link href="/parent/settings" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
            Cấu hình Bot & Chat ID →
          </Link>
        </div>
      </div>

      {/* Real-time Watch History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Nhật Ký Xem Gần Đây (Watch Logs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ghi nhận phiên xem và thời gian xem thực tế qua cơ chế heartbeat
            </p>
          </div>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">Chưa có nhật ký xem nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Video</th>
                  <th className="py-3 px-4">Thời Điểm Bắt Đầu</th>
                  <th className="py-3 px-4">Thời Lượng Xem Thực Tế</th>
                  <th className="py-3 px-4 rounded-r-xl">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentLogs.map((log) => {
                  const minutes = Math.floor(log.durationSeconds / 60);
                  const seconds = log.durationSeconds % 60;
                  const formattedTime = new Date(log.startedAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <span className="line-clamp-1 max-w-sm">{log.videoTitle}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formattedTime}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {minutes > 0 ? `${minutes} phút ` : ""}
                        {seconds}s
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã giám sát
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
