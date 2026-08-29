"use client";

import React, { useState } from "react";
import { Lock, X, ArrowRight, Delete, Loader2 } from "lucide-react";
import KidAvatar from "@/components/kids/KidAvatar";
import { useRouter } from "next/navigation";

interface KidProfileCardProps {
  kid: {
    id: string;
    name: string;
    avatarUrl: string | null;
    dailyLimitMinutes: number;
    passcode?: string | null;
  };
}

export const KidProfileCard: React.FC<KidProfileCardProps> = ({ kid }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = () => {
    // Kiểm tra xem bé đã mở khóa trong phiên này chưa
    const isUnlocked = sessionStorage.getItem(`safekids_auth_${kid.id}`);
    if (isUnlocked === "true") {
      router.push(`/kids/${kid.id}`);
    } else {
      setIsOpen(true);
      setPasscode("");
      setError("");
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || passcode;
    if (!code) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profiles/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: kid.id,
          passcode: code,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem(`safekids_auth_${kid.id}`, "true");
        setIsOpen(false);
        router.push(`/kids/${kid.id}`);
      } else {
        setError(data.message || "Mật khẩu chưa đúng.");
        setPasscode("");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (passcode.length < 6) {
      const nextCode = passcode + num;
      setPasscode(nextCode);
      setError("");
      // Tự động xác thực khi đủ 6 chữ số
      if (nextCode.length === 6) {
        handleVerify(nextCode);
      }
    }
  };

  const handleKeypadDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError("");
  };

  return (
    <>
      {/* Clickable Card (Using div role=button for 100% iPad/iOS touch compatibility) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleCardClick();
        }}
        className="group relative w-full bg-white/10 hover:bg-amber-400 hover:text-slate-900 active:bg-amber-400 active:text-slate-900 border border-white/20 hover:border-amber-300 rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 transform active:scale-98 shadow-lg text-left cursor-pointer select-none"
        style={{ touchAction: "manipulation" }}
      >
        <KidAvatar
          avatarUrl={kid.avatarUrl}
          name={kid.name}
          size="lg"
          className="group-hover:border-slate-900 ring-2 ring-amber-300/40 group-hover:ring-slate-900/30 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-white group-hover:text-slate-900 group-active:text-slate-900 transition-colors truncate">
            {kid.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-indigo-200 group-hover:text-slate-700 group-active:text-slate-700 mt-1 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-300 group-hover:text-slate-800" />
            <span>Mật khẩu bảo vệ 6 số</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/20 group-hover:bg-slate-900 group-hover:text-white group-active:bg-slate-900 group-active:text-white flex items-center justify-center transition-colors shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* PASSCODE POPUP MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 text-white shadow-2xl relative text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-400 hover:text-white transition touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar Header */}
            <div className="flex flex-col items-center mb-4">
              <KidAvatar
                avatarUrl={kid.avatarUrl}
                name={kid.name}
                size="lg"
                className="ring-4 ring-amber-400/40 shadow-xl mb-3"
              />
              <h2 className="text-xl font-black text-white">{kid.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập mật khẩu 6 số của bé để bắt đầu xem video
              </p>
            </div>

            {/* Passcode 6-dots Indicator */}
            <div className="flex justify-center items-center gap-2.5 py-3 mb-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    passcode.length > index
                      ? "bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/50"
                      : "border-slate-600 bg-slate-800/60"
                  }`}
                />
              ))}
            </div>

            {/* Hidden/Native Input for Mobile Keyboards */}
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={passcode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPasscode(val);
                setError("");
                if (val.length === 6) handleVerify(val);
              }}
              placeholder="••••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-bold py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
            />

            {error && (
              <div className="p-2 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Number Keypad with instant touch response */}
            <div className="grid grid-cols-3 gap-2.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 active:scale-95 text-xl font-bold rounded-2xl border border-slate-700/80 transition duration-100 shadow-sm touch-manipulation select-none"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPasscode("")}
                className="py-3.5 bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 text-xs font-semibold text-slate-400 rounded-2xl transition touch-manipulation select-none"
              >
                Xóa hết
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 active:scale-95 text-xl font-bold rounded-2xl border border-slate-700/80 transition duration-100 shadow-sm touch-manipulation select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="py-3.5 bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center text-slate-400 active:text-white rounded-2xl transition touch-manipulation select-none"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={isLoading || passcode.length < 6}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-98 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-sm shadow-lg transition duration-100 flex items-center justify-center gap-2 touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang mở khóa...</span>
                </>
              ) : (
                <span>Vào Xem Video 🚀</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default KidProfileCard;
