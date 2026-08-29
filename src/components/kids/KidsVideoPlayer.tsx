"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import { Clock, ShieldAlert, Sparkles, Home, Volume2, Pause, Play, RefreshCw, KeyRound } from "lucide-react";
import Link from "next/link";

interface KidsVideoPlayerProps {
  videoId: string;
  videoTitle: string;
  profileId: string;
  kidName: string;
  initialRemainingSeconds: number; // Thời gian còn lại hôm nay tính bằng giây
  isLockedDirectly?: boolean;
  allowedStartHour?: number;
  allowedEndHour?: number;
  onTimeLimitReached?: () => void;
}

export const KidsVideoPlayer: React.FC<KidsVideoPlayerProps> = ({
  videoId,
  videoTitle,
  profileId,
  kidName,
  initialRemainingSeconds,
  isLockedDirectly = false,
  allowedStartHour = 6,
  allowedEndHour = 21,
  onTimeLimitReached,
}) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [isLockedOut, setIsLockedOut] = useState(isLockedDirectly || initialRemainingSeconds <= 0);
  const [lockReason, setLockReason] = useState<string>("");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showParentPinPrompt, setShowParentPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Kiểm tra khung giờ được phép xem
  const checkAllowedHours = useCallback(() => {
    const currentHour = new Date().getHours();
    if (currentHour < allowedStartHour || currentHour >= allowedEndHour) {
      return {
        allowed: false,
        reason: `Chưa đến hoặc đã qua giờ xem (${allowedStartHour}:00 - ${allowedEndHour}:00). Bé hãy quay lại sau nhé!`,
      };
    }
    return { allowed: true, reason: "" };
  }, [allowedStartHour, allowedEndHour]);

  // Kiểm tra ban đầu khi mount
  useEffect(() => {
    const hourCheck = checkAllowedHours();
    if (!hourCheck.allowed) {
      setIsLockedOut(true);
      setLockReason(hourCheck.reason);
      return;
    }

    if (isLockedDirectly) {
      setIsLockedOut(true);
      setLockReason("Bố mẹ đã tạm khóa màn hình để bé nghỉ ngơi.");
      return;
    }

    if (initialRemainingSeconds <= 0) {
      setIsLockedOut(true);
      setLockReason("Bé đã dùng hết thời gian xem video hôm nay rồi!");
    }
  }, [checkAllowedHours, isLockedDirectly, initialRemainingSeconds]);

  // Ngắt video ngay lập tức
  const haltPlayback = useCallback(
    (reason: string) => {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch (e) {
          console.error("Error stopping video:", e);
        }
      }
      setIsPlaying(false);
      setIsLockedOut(true);
      setLockReason(reason);
      if (onTimeLimitReached) onTimeLimitReached();
    },
    [onTimeLimitReached]
  );

  // 1. Logic đếm ngược thời gian khi đang phát video
  useEffect(() => {
    if (!isPlaying || isLockedOut) return;

    const timer = setInterval(() => {
      // Kiểm tra lại khung giờ
      const hourCheck = checkAllowedHours();
      if (!hourCheck.allowed) {
        haltPlayback(hourCheck.reason);
        return;
      }

      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          haltPlayback("Hết giờ xem rồi! Hãy nghỉ ngơi hoặc nhờ bố mẹ mở thêm nhé!");
          return 0;
        }
        return prev - 1;
      });

      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isLockedOut, checkAllowedHours, haltPlayback]);

  // 2. Heartbeat Ping: Gửi dữ liệu về server mỗi 30 giây khi đang phát
  useEffect(() => {
    if (!isPlaying || isLockedOut) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch("/api/tracking/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            videoId,
            deltaSeconds: 30,
          }),
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isPlaying, isLockedOut, profileId, videoId]);

  // Xử lý sự kiện YouTube Player Ready
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
  };

  // Xử lý sự kiện YouTube Play
  const onPlayerPlay: YouTubeProps["onPlay"] = async () => {
    // Kiểm tra trước khi cho phát
    const hourCheck = checkAllowedHours();
    if (!hourCheck.allowed) {
      haltPlayback(hourCheck.reason);
      return;
    }

    if (remainingSeconds <= 0 || isLockedOut) {
      haltPlayback(lockReason || "Đã hết thời gian xem trong ngày!");
      return;
    }

    setIsPlaying(true);

    // Bắt đầu phiên xem & Kích hoạt Telegram Bot thông báo
    try {
      await fetch("/api/tracking/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          videoId,
          videoTitle,
          kidName,
        }),
      });
    } catch (err) {
      console.error("Play notification error:", err);
    }
  };

  // Xử lý sự kiện Pause
  const onPlayerPause: YouTubeProps["onPause"] = () => {
    setIsPlaying(false);
  };

  // Xử lý sự kiện Video kết thúc
  const onPlayerEnd: YouTubeProps["onEnd"] = () => {
    setIsPlaying(false);
  };

  // Mở khóa bằng mã PIN phụ huynh
  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    try {
      const res = await fetch("/api/profiles/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          pin: pinInput,
          addMinutes: 15, // Thưởng thêm 15 phút
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsLockedOut(false);
        setRemainingSeconds((prev) => prev + 15 * 60);
        setShowParentPinPrompt(false);
        setPinInput("");
      } else {
        setPinError(data.message || "Mã PIN không đúng.");
      }
    } catch (err) {
      setPinError("Lỗi kết nối máy chủ.");
    }
  };

  const minutesRemaining = Math.floor(remainingSeconds / 60);
  const secondsRemainder = remainingSeconds % 60;

  // Cấu hình tham số bảo vệ cho YouTube IFrame
  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0, // Không gợi ý video ngoài
      fs: 1, // Cho phép toàn màn hình
      iv_load_policy: 3, // Tắt chú thích phiền toái
      disablekb: 0,
      playsinline: 1,
    },
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Top Header Bar: Countdown & Kid Profile Info */}
      <div className="w-full flex items-center justify-between bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg mb-4">
        <Link
          href={`/kids/${profileId}`}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full font-bold text-sm transition"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>

        {/* Đồng hồ đếm ngược sinh động */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-extrabold text-sm sm:text-base tracking-wider shadow-inner">
          <Clock className={`w-5 h-5 ${remainingSeconds < 300 ? "animate-bounce text-yellow-200" : ""}`} />
          <span>
            Còn lại:{" "}
            <span className={remainingSeconds < 300 ? "text-yellow-200 underline" : "text-white"}>
              {minutesRemaining} phút {secondsRemainder.toString().padStart(2, "0")}s
            </span>
          </span>
        </div>

        {/* Nút dành cho phụ huynh mở rộng thời gian */}
        <button
          onClick={() => setShowParentPinPrompt(true)}
          className="flex items-center gap-1.5 text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full font-medium transition"
          title="Dành cho Bố Mẹ"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Phụ huynh</span>
        </button>
      </div>

      {/* Video Container Frame */}
      <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300 ring-4 ring-orange-200">
        {!isLockedOut ? (
          <div className="w-full h-full">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onPlay={onPlayerPlay}
              onPause={onPlayerPause}
              onEnd={onPlayerEnd}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
        ) : null}

        {/* MÀN HÌNH KHÓA THÂN THIỆN KHI HẾT GIỜ HOẶC KHÓA BỞI BỐ MẸ */}
        {isLockedOut && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-lg animate-fadeIn z-30">
            <div className="w-24 h-24 bg-amber-400/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-400/10 animate-pulse">
              <Sparkles className="w-12 h-12 text-amber-300" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black mb-2 text-amber-300 drop-shadow-md">
              Hết giờ xem rồi bé ơi! 🌟🧸
            </h2>

            <p className="text-sm sm:text-lg text-indigo-100 max-w-md mb-6 leading-relaxed">
              {lockReason || "Đôi mắt của bé cần được nghỉ ngơi. Hãy đi uống nước, đọc sách hoặc vận động một chút nhé!"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/kids/${profileId}`}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-extrabold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition transform active:scale-95"
              >
                <Home className="w-5 h-5" />
                Về danh sách video
              </Link>

              <button
                onClick={() => setShowParentPinPrompt(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-5 py-3 rounded-full shadow transition"
              >
                <KeyRound className="w-4 h-4" />
                Bố Mẹ mở thêm giờ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tiêu đề Video */}
      <div className="w-full mt-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-1">{videoTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Được duyệt an toàn bởi SafeKids Video cho bé {kidName}</p>
        </div>
      </div>

      {/* Modal Nhập PIN dành cho Phụ huynh */}
      {showParentPinPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Mã PIN Phụ Huynh</h3>
                <p className="text-xs text-slate-500">Cộng thêm +15 phút xem cho bé</p>
              </div>
            </div>

            <form onSubmit={handlePinUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nhập mã PIN (Mặc định: 1234)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {pinError && <p className="text-xs text-rose-500 font-medium text-center">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowParentPinPrompt(false);
                    setPinError("");
                    setPinInput("");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Mở Thêm Giờ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsVideoPlayer;
