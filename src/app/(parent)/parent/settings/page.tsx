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
  Sliders,
  Users,
} from "lucide-react";
import KidAvatar from "@/components/kids/KidAvatar";
import { KidProfileData } from "@/types";

export default function ParentSettingsPage() {
  const [profiles, setProfiles] = useState<KidProfileData[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string>("");
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(45);
  const [allowedStartHour, setAllowedStartHour] = useState(6);
  const [allowedEndHour, setAllowedEndHour] = useState(21);
  const [isLocked, setIsLocked] = useState(false);
  const [kidPasscode, setKidPasscode] = useState("");

  // Telegram Config
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");

  // PIN Config
  const [newPin, setNewPin] = useState("");

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch Parent Settings
      const parentRes = await fetch("/api/parent/settings");
      const parentData = await parentRes.json();
      if (parentRes.ok) {
        setTelegramChatId(parentData.telegramChatId || "");
        setTelegramBotToken(parentData.telegramBotToken || "");
      }

      // Fetch Kids Profiles
      const profilesRes = await fetch("/api/profiles");
      const profilesData = await profilesRes.json();
      if (profilesRes.ok && profilesData.profiles?.length > 0) {
        setProfiles(profilesData.profiles);
        const first = profilesData.profiles[0];
        setSelectedKidId(first.id);
        setDailyLimitMinutes(first.dailyLimitMinutes);
        setAllowedStartHour(first.allowedStartHour);
        setAllowedEndHour(first.allowedEndHour);
        setIsLocked(first.isLocked);
        setKidPasscode(first.passcode || (first.id === "kid-thao-ly" ? "200917" : "220520"));
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSelectKid = (kid: KidProfileData) => {
    setSelectedKidId(kid.id);
    setDailyLimitMinutes(kid.dailyLimitMinutes);
    setAllowedStartHour(kid.allowedStartHour);
    setAllowedEndHour(kid.allowedEndHour);
    setIsLocked(kid.isLocked);
    setKidPasscode(kid.passcode || (kid.id === "kid-thao-ly" ? "200917" : "220520"));
  };

  // Khóa hoặc Mở Khóa Khẩn Cấp TỨC THÌ (Lưu trực tiếp vào Database ngay khi bấm)
  const handleToggleEmergencyLock = async () => {
    if (!selectedKidId) return;
    const nextLockState = !isLocked;
    setIsLocked(nextLockState);

    try {
      const res = await fetch(`/api/profiles/${selectedKidId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLocked: nextLockState,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === selectedKidId ? { ...p, isLocked: nextLockState } : p))
        );
        setMessage({
          type: "success",
          text: nextLockState
            ? `🔒 Đã KHÓA màn hình của ${currentKid?.name} ngay lập tức!`
            : `🔓 Đã MỞ KHÓA màn hình cho ${currentKid?.name}!`,
        });
      } else {
        setIsLocked(!nextLockState); // Revert on failure
        setMessage({ type: "error", text: data.error || "Không thể đổi trạng thái khóa." });
      }
    } catch {
      setIsLocked(!nextLockState);
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ khi khóa màn hình." });
    }
  };

  // 1. Lưu cấu hình Thời gian & Mật khẩu cho bé đang chọn
  const handleSaveRules = async () => {
    if (!selectedKidId) return;
    setIsSavingRules(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/profiles/${selectedKidId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLimitMinutes,
          allowedStartHour,
          allowedEndHour,
          isLocked,
          passcode: kidPasscode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === selectedKidId ? { ...p, dailyLimitMinutes, allowedStartHour, allowedEndHour, isLocked, passcode: kidPasscode } : p))
        );
        setMessage({ type: "success", text: "Đã cập nhật quy tắc và mật khẩu của bé thành công!" });
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

  const currentKid = profiles.find((p) => p.id === selectedKidId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Sliders className="w-7 h-7 text-amber-400" />
          <span>Cài Đặt & Cấu Hình Giám Sát</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tùy chỉnh thời gian xem cho từng bé, cấu hình cảnh báo Telegram và đổi mã PIN.
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Thời Gian & Khung Giờ Xem</h2>
              <p className="text-xs text-slate-400">Chọn bé để thiết lập giới hạn riêng</p>
            </div>
          </div>

          {/* Chọn Bé (Thảo Ly / Đức Duy) */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            {profiles.map((kid) => (
              <button
                key={kid.id}
                onClick={() => handleSelectKid(kid)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedKidId === kid.id
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <KidAvatar
                  avatarUrl={kid.avatarUrl}
                  name={kid.name}
                  size="sm"
                />
                <span>{kid.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Khóa khẩn cấp Toggle */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLocked ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Khóa Màn Hình ({currentKid?.name})</h4>
              <p className="text-[11px] text-slate-400">Ngắt phát video của bé ngay lập tức</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleEmergencyLock}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
              isLocked
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            {isLocked ? "🔒 Đang Khóa (Bấm để Mở)" : "🔓 Đang Mở (Bấm để Khóa)"}
          </button>
        </div>

        {/* Slider giới hạn thời gian xem / ngày */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tổng thời gian xem tối đa mỗi ngày ({currentKid?.name})
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

          <div className="col-span-full">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Mật khẩu riêng của bé ({currentKid?.name})
            </label>
            <input
              type="text"
              maxLength={6}
              value={kidPasscode}
              onChange={(e) => setKidPasscode(e.target.value.replace(/\D/g, ""))}
              placeholder="VD: 200917 (6 chữ số)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bé cần nhập đúng mã này để vào trang xem video (Ví dụ: Thảo Ly là <code className="text-amber-300">200917</code>, Đức Duy là <code className="text-amber-300">220520</code>).
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveRules}
          disabled={isSavingRules}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black px-6 py-3 rounded-xl text-xs shadow-lg transition"
        >
          {isSavingRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Lưu Cấu Hình Cho {currentKid?.name}</span>
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
            <p className="text-xs text-slate-400">Nhận tin nhắn trên điện thoại khi các bé bắt đầu xem hoặc hết giờ</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Telegram Chat ID Của Phụ Huynh (Hỗ trợ nhiều tài khoản)
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="VD: 6170605138, 987654321 (Nhập nhiều ID cách nhau bằng dấu phẩy để gửi cho cả Bố và Mẹ)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 Bạn có thể nhập nhiều Chat ID (cách nhau bởi dấu phẩy <code className="text-amber-300">,</code>) hoặc ID nhóm gia đình để cả nhà cùng nhận thông báo.
            </p>
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
            <p className="text-xs text-slate-400">Mã PIN dùng để mở khóa khu vực cài đặt</p>
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
