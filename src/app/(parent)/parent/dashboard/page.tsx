import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Clock,
  Film,
  ShieldCheck,
  Play,
  TrendingUp,
  Settings,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  let parent = await prisma.user.findFirst({
    include: {
      kidProfiles: {
        orderBy: { createdAt: "asc" },
      },
      approvedVideos: true,
    },
  });

  if (!parent) {
    parent = await prisma.user.create({
      data: {
        email: "parent@safekids.app",
        parentPin: "1234",
        kidProfiles: {
          createMany: {
            data: [
              {
                id: "kid-thao-ly",
                name: "Bé Thảo Ly",
                avatarUrl: "👧",
                dailyLimitMinutes: 45,
                allowedStartHour: 6,
                allowedEndHour: 21,
              },
              {
                id: "kid-duc-duy",
                name: "Bé Đức Duy",
                avatarUrl: "👦",
                dailyLimitMinutes: 45,
                allowedStartHour: 6,
                allowedEndHour: 21,
              },
            ],
          },
        },
      },
      include: {
        kidProfiles: true,
        approvedVideos: true,
      },
    });
  }

  const kids = parent.kidProfiles;

  // Lấy lịch sử xem của ngày hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsToday = await prisma.watchLog.findMany({
    where: {
      startedAt: { gte: today },
    },
    include: {
      kidProfile: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const recentLogs = await prisma.watchLog.findMany({
    take: 20,
    include: {
      kidProfile: true,
    },
    orderBy: { startedAt: "desc" },
  });

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
            Bảng Điều Khiển Gia Đình
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Đang quản lý {kids.length} bé ({kids.map((k) => k.name).join(" & ")})
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

      {/* Kid Status Cards (Thảo Ly & Đức Duy) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kids.map((k) => {
          const kidLogsToday = logsToday.filter((l) => l.kidProfileId === k.id);
          const totalSeconds = kidLogsToday.reduce((acc, curr) => acc + curr.durationSeconds, 0);
          const watchedMins = Math.floor(totalSeconds / 60);
          const remainingMins = Math.max(0, k.dailyLimitMinutes - watchedMins);
          const usagePct = Math.min(100, Math.round((watchedMins / (k.dailyLimitMinutes || 1)) * 100));

          return (
            <div
              key={k.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                      {k.avatarUrl || "👶"}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-white">{k.name}</h3>
                      <p className="text-xs text-slate-400">
                        Khung giờ: {k.allowedStartHour}:00 - {k.allowedEndHour}:00
                      </p>
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      k.isLocked
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : remainingMins <= 0
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {k.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{k.isLocked ? "Khóa khẩn cấp" : remainingMins <= 0 ? "Hết giờ" : "Đang mở"}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-300">Thời gian xem hôm nay:</span>
                    <span className="font-black text-amber-400 text-sm">
                      {watchedMins} / {k.dailyLimitMinutes} phút
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        usagePct >= 100 ? "bg-rose-500" : usagePct > 70 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>Còn lại: <strong className="text-white">{remainingMins} phút</strong></span>
                    <span>{usagePct}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
                <Link
                  href={`/kids/${k.id}`}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl text-center transition"
                >
                  Xem Trang Bé
                </Link>
                <Link
                  href="/parent/settings"
                  className="flex-1 py-2.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold rounded-xl text-center transition"
                >
                  Cài Đặt Giờ
                </Link>
              </div>
            </div>
          );
        })}
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
              Ghi nhận phiên xem thực tế của các bé
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
                  <th className="py-3 px-4 rounded-l-xl">Bé</th>
                  <th className="py-3 px-4">Video</th>
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
                      <td className="py-3.5 px-4 font-extrabold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <span>{log.kidProfile?.avatarUrl || "👶"}</span>
                          <span>{log.kidProfile?.name || "Bé"}</span>
                        </span>
                      </td>
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
