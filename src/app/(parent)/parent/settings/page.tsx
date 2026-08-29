"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Lock,
  Unlock,
  Bell,
  KeyRound,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Sliders,
  Sparkles,
} from "lucide-react";
import { KidProfileData } from "@/types";

export default function ParentSettingsPage() {
  const [profile, setProfile] = useState<KidProfileData | null>(null);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(45);
  const [allowedStartHour, setAllowedStartHour] = useState(6);
  const [allowedEndHour, setAllowedEndHour] = useState(21);
  const [isLocked, setIsLocked] = useState(false);

  // Telegram Config
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");

  // PIN Config
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Parent Settings
        const parentRes = await fetch("/api/parent/settings");
        const parentData = await parentRes.json();
        if (parentRes.ok) {
          setTelegramChatId(parentData.telegramChatId || "");
          setTelegramBotToken(parentData.telegramBotToken || "");
        }

        // Fetch Kid Profile
        const res = await fetch("/api/videos"); // Lấy profile từ dashboard data hoặc route
        const dashRes = await fetch("/api/tracking/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: "demo-kid-01", videoId: "dummy", deltaSeconds: 0 }),
        });
        
        // Cài đặt mặc định nếu demo
        setDailyLimitMinutes(45);
        setAllowedStartHour(6);
        setAllowedEndHour(21);
      } catch (e) {
        console.error("Error loading settings:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 1. Lưu cấu hình Thời gian & Khóa khẩn cấp
  const handleSaveRules = async () => {
    setIsSavingRules(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profiles/demo-kid-01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLimitMinutes,
          allowedStartHour,
          allowedEndHour,
          isLocked,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Đã cập nhật quy tắc và giới hạn thời gian cho bé!" });
      } else {
        setMessage({ type: "error", text: data.error || "Không thể lưu cài đặt." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setIsSavingRules(false);
    }
  };

  // 2. Lưu cấu hình Telegram Bot
  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    setMessage(null);
    try {
      const res = await fetch("/api/parent/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramChatId,
          telegramBotToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Đã lưu cấu hình Telegram Bot thành công!" });
      } else {
        setMessage({ type: "error", text: data.error || "Không thể lưu cài đặt Telegram." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  // 3. Test gửi tin nhắn Telegram
  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setMessage(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: telegramChatId.trim(),
          botToken: telegramBotToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.message || "Không thể gửi tin nhắn thử nghiệm." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi mạng khi thử nghiệm Telegram." });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // 4. Đổi mã PIN Phụ huynh
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.trim().length < 4) {
      setMessage({ type: "error", text: "Mã PIN mới phải có ít nhất 4 chữ số." });
      return;
    }

    setIsSavingPin(true);
    setMessage(null);
    try {
      const res = await fetch("/api/parent/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPin: newPin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewPin("");
        setMessage({ type: "success", text: "Đã đổi mã PIN phụ huynh thành công!" });
      } else {
        setMessage({ type: "error", text: data.error || "Không thể đổi mã PIN." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi mạng khi cập nhật PIN." });
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Sliders className="w-7 h-7 text-amber-400" />
          <span>Cài Đặt & Cấu Hình Giám Sát</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tùy chỉnh giới hạn thời gian xem, thiết lập thông báo Telegram và bảo mật PIN.
        </p>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Cấu hình Thời gian & Khóa màn hình */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Thời Gian & Khung Giờ Xem (Bé Bắp)</h2>
              <p className="text-xs text-slate-400">Giới hạn thời lượng và kiểm soát màn hình tức thì</p>
            </div>
          </div>
        </div>

        {/* Khóa khẩn cấp Toggle */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLocked ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Khóa Màn Hình Ngay Lập Tức</h4>
              <p className="text-[11px] text-slate-400">Ngắt phát video của bé ngay khi bé đang xem</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isLocked
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            {isLocked ? "Đang Khóa Khẩn Cấp" : "Đang Mở"}
          </button>
        </div>

        {/* Slider giới hạn thời gian xem / ngày */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tổng thời gian xem tối đa mỗi ngày
            </label>
            <span className="text-sm font-extrabold text-amber-400">{dailyLimitMinutes} phút / ngày</span>
          </div>
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={dailyLimitMinutes}
            onChange={(e) => setDailyLimitMinutes(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold">
            <span>10 phút</span>
            <span>45 phút</span>
            <span>90 phút</span>
            <span>180 phút</span>
          </div>
        </div>

        {/* Khung giờ được phép xem */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Giờ bắt đầu được xem (Sáng)
            </label>
            <select
              value={allowedStartHour}
              onChange={(e) => setAllowedStartHour(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Giờ kết thúc được xem (Tối)
            </label>
            <select
              value={allowedEndHour}
              onChange={(e) => setAllowedEndHour(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveRules}
          disabled={isSavingRules}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black px-6 py-3 rounded-xl text-xs shadow-lg transition"
        >
          {isSavingRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Lưu Cấu Hình Thời Gian</span>
        </button>
      </div>

      {/* SECTION 2: Cấu hình Telegram Bot */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-sky-400/10 text-sky-400 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Cảnh Báo Qua Telegram Bot</h2>
            <p className="text-xs text-slate-400">Nhận tin nhắn trên điện thoại khi bé bắt đầu xem hoặc hết giờ</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Telegram Chat ID Của Phụ Huynh
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="VD: 123456789 (Lấy từ @userinfobot trên Telegram)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Custom Telegram Bot Token (Tùy chọn)
            </label>
            <input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="VD: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 (Lấy từ @BotFather)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Nếu để trống, hệ thống sẽ sử dụng Token mặc định trong file .env
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSaveTelegram}
              disabled={isSavingTelegram}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl text-xs border border-slate-700 transition"
            >
              {isSavingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Cấu Hình Telegram</span>
            </button>

            <button
              onClick={handleTestTelegram}
              disabled={isTestingTelegram || !telegramChatId.trim()}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md transition"
            >
              {isTestingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Gửi Tin Nhắn Thử Nghiệm</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Đổi Mã PIN Phụ Huynh */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-emerald-400/10 text-emerald-400 rounded-2xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mã PIN Bảo Vệ Phụ Huynh</h2>
            <p className="text-xs text-slate-400">Mã PIN dùng để mở khóa khu vực cài đặt và cấp thêm giờ xem</p>
          </div>
        </div>

        <form onSubmit={handleSavePin} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Mã PIN mới (4 - 6 chữ số)
            </label>
            <input
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="VD: 5678"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingPin || !newPin}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md transition"
          >
            {isSavingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Đổi Mã PIN</span>
          </button>
        </form>
      </div>
    </div>
  );
}
