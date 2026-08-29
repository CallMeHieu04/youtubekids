"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import {
  Clock,
  Sparkles,
  Home,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Maximize,
  KeyRound,
  ShieldCheck,
  Subtitles,
} from "lucide-react";
import Link from "next/link";
import { formatSecondsToMinutes } from "@/lib/utils";

interface KidsVideoPlayerProps {
  videoId: string;
  videoTitle: string;
  profileId: string;
  kidName: string;
  initialRemainingSeconds: number;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasSentPlayAlertRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [isLockedOut, setIsLockedOut] = useState(isLockedDirectly || initialRemainingSeconds <= 0);
  const [lockReason, setLockReason] = useState<string>("");

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

  // Ngắt video an toàn
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

  // 1. Đếm ngược thời gian trong ngày & Cập nhật thời lượng
  useEffect(() => {
    if (!isPlaying || isLockedOut) return;

    const timer = setInterval(() => {
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

      if (playerRef.current) {
        try {
          const current = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof current === "number") setCurrentTime(Math.floor(current));
          if (typeof dur === "number" && dur > 0) setDuration(Math.floor(dur));
        } catch (e) {
          // ignore
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isLockedOut, checkAllowedHours, haltPlayback]);

  // 2. Heartbeat Ping mỗi 30s
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

  // YouTube events
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    try {
      const dur = event.target.getDuration();
      if (dur) setDuration(Math.floor(dur));

      // Tắt phụ đề mặc định khi bắt đầu
      event.target.setOption("captions", "track", {});
      event.target.unloadModule("captions");
    } catch (e) {
      // ignore
    }
  };

  // Reset trạng thái cảnh báo khi đổi video
  useEffect(() => {
    hasSentPlayAlertRef.current = false;
  }, [videoId]);

  const onPlayerPlay: YouTubeProps["onPlay"] = async () => {
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

    // CHỈ GỬI THÔNG BÁO TELEGRAM 1 LẦN DUY NHẤT KHI BẮT ĐẦU VIDEO MỚI
    if (!hasSentPlayAlertRef.current) {
      hasSentPlayAlertRef.current = true;
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
    }
  };

  const onPlayerPause: YouTubeProps["onPause"] = () => {
    setIsPlaying(false);
  };

  const onPlayerEnd: YouTubeProps["onEnd"] = () => {
    setIsPlaying(false);
  };

  // Custom Controls Functions
  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const seekRelative = (seconds: number) => {
    if (!playerRef.current) return;
    try {
      const current = playerRef.current.getCurrentTime() || 0;
      const target = Math.max(0, Math.min(duration, current + seconds));
      playerRef.current.seekTo(target, true);
      setCurrentTime(Math.floor(target));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(target, true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BẬT / TẮT PHỤ ĐỀ
  const toggleCaptions = () => {
    if (!playerRef.current) return;
    try {
      if (isCaptionsOn) {
        // Tắt phụ đề
        playerRef.current.setOption("captions", "track", {});
        playerRef.current.unloadModule("captions");
        setIsCaptionsOn(false);
      } else {
        // Bật phụ đề tiếng Việt / mặc định
        playerRef.current.loadModule("captions");
        playerRef.current.setOption("captions", "track", { languageCode: "vi" });
        setIsCaptionsOn(true);
      }
    } catch (e) {
      console.error("Caption toggle error:", e);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error fullscreen:", err);
      });
    }
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
          addMinutes: 15,
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
    } catch {
      setPinError("Lỗi kết nối máy chủ.");
    }
  };

  const minutesRemaining = Math.floor(remainingSeconds / 60);
  const secondsRemainder = remainingSeconds % 60;

  // Cấu hình CHẶN TOÀN BỘ GỢI Ý & PHỤ ĐỀ MẶC ĐỊNH
  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      cc_load_policy: 0, // Tắt phụ đề mặc định
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      showinfo: 0,
    },
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg mb-4">
        <Link
          href={`/kids/${profileId}`}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm transition shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Về danh sách video</span>
        </Link>

        {/* Đồng hồ đếm ngược sinh động */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-extrabold text-xs sm:text-sm tracking-wider shadow-inner">
          <Clock className={`w-4 h-4 ${remainingSeconds < 300 ? "animate-bounce text-yellow-200" : ""}`} />
          <span>
            Thời gian còn:{" "}
            <span className={remainingSeconds < 300 ? "text-yellow-200 underline" : "text-white"}>
              {minutesRemaining}p {secondsRemainder.toString().padStart(2, "0")}s
            </span>
          </span>
        </div>

        {/* Nút dành cho phụ huynh */}
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
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300 ring-4 ring-orange-200 group"
      >
        {!isLockedOut ? (
          <div className="w-full h-full relative">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onPlay={onPlayerPlay}
              onPause={onPlayerPause}
              onEnd={onPlayerEnd}
              className="w-full h-full pointer-events-none"
              iframeClassName="w-full h-full"
            />

            {/* Click Layer to Toggle Play/Pause on Video Tap */}
            <div
              onClick={togglePlayPause}
              className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
            >
              {!isPlaying && (
                <div className="w-20 h-20 rounded-full bg-amber-400/90 text-slate-950 flex items-center justify-center shadow-2xl transform scale-105 transition hover:scale-110">
                  <Play className="w-10 h-10 fill-current ml-1" />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* MÀN HÌNH KHÓA KHI HẾT GIỜ */}
        {isLockedOut && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-lg animate-fadeIn z-30">
            <div className="w-20 h-20 bg-amber-400/20 rounded-full flex items-center justify-center mb-3 ring-8 ring-amber-400/10 animate-pulse">
              <Sparkles className="w-10 h-10 text-amber-300" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-2 text-amber-300 drop-shadow-md">
              Hết giờ xem rồi bé {kidName} ơi! 🌟🧸
            </h2>

            <p className="text-xs sm:text-base text-indigo-100 max-w-md mb-5 leading-relaxed">
              {lockReason || "Đôi mắt của bé cần được nghỉ ngơi. Hãy đi uống nước hoặc vận động một chút nhé!"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/kids/${profileId}`}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black px-5 py-2.5 rounded-full shadow-lg transition"
              >
                <Home className="w-4 h-4" />
                Về trang chủ của bé
              </Link>

              <button
                onClick={() => setShowParentPinPrompt(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-full shadow transition text-xs"
              >
                <KeyRound className="w-4 h-4" />
                Bố Mẹ mở thêm giờ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* THANH ĐIỀU KHIỂN RIÊNG BIỆT CHO BÉ */}
      {!isLockedOut && (
        <div className="w-full mt-3 bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-100 flex flex-col gap-3">
          {/* Progress Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="font-mono text-xs font-bold text-slate-600 w-12 text-right">
              {formatSecondsToMinutes(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="flex-1 h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="font-mono text-xs font-bold text-slate-400 w-12">
              {formatSecondsToMinutes(duration)}
            </span>
          </div>

          {/* Kid Big Control Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 flex items-center justify-center shadow-md transition"
                title={isPlaying ? "Tạm dừng" : "Phát video"}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              {/* Tua lùi 10s */}
              <button
                onClick={() => seekRelative(-10)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                title="Lùi 10 giây"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Tua tới 10s */}
              <button
                onClick={() => seekRelative(10)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                title="Tua tới 10 giây"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Mute / Unmute */}
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* NÚT BẬT / TẮT PHỤ ĐỀ (SUBTITLES / CC) */}
              <button
                onClick={toggleCaptions}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition border ${
                  isCaptionsOn
                    ? "bg-amber-400 border-amber-500 text-slate-950 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                }`}
                title={isCaptionsOn ? "Đang BẬT phụ đề (Bấm để Tắt)" : "Đang TẮT phụ đề (Bấm để Bật)"}
              >
                <Subtitles className="w-5 h-5" />
              </button>
            </div>

            {/* Video Title & Fullscreen */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <h4 className="font-bold text-slate-800 text-xs line-clamp-1 max-w-xs">{videoTitle}</h4>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3" /> Chế độ an toàn 100%
                </span>
              </div>

              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow transition"
                title="Toàn màn hình"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập PIN Phụ Huynh */}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nhập mã PIN phụ huynh</label>
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
