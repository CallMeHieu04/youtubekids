import React from "react";
import { prisma } from "@/lib/prisma";
import KidsVideoPlayer from "@/components/kids/KidsVideoPlayer";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Heart } from "lucide-react";
import { notFound } from "next/navigation";

interface WatchPageProps {
  params: Promise<{
    profileId: string;
    videoId: string;
  }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { profileId, videoId } = await params;

  // Lấy thông tin profile
  const profile = await prisma.kidProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    notFound();
  }

  // Lấy thông tin video đã duyệt
  const video = await prisma.approvedVideo.findFirst({
    where: {
      youtubeVideoId: videoId,
    },
  });

  // Tính thời gian đã xem hôm nay
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
  const limitSeconds = profile.dailyLimitMinutes * 60;
  const initialRemainingSeconds = Math.max(0, limitSeconds - totalSecondsToday);

  const videoTitle = video?.title || "Video Thiếu Nhi An Toàn";

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50 to-indigo-50 py-6 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/kids/${profileId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow text-slate-700 font-bold text-sm border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Quay lại video khác</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chế độ kiểm duyệt an toàn SafeKids</span>
          </div>
        </div>

        {/* Video Player Component */}
        <KidsVideoPlayer
          videoId={videoId}
          videoTitle={videoTitle}
          profileId={profileId}
          kidName={profile.name}
          initialRemainingSeconds={initialRemainingSeconds}
          isLockedDirectly={profile.isLocked}
          allowedStartHour={profile.allowedStartHour}
          allowedEndHour={profile.allowedEndHour}
        />
      </div>
    </main>
  );
}
