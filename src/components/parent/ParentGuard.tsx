"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, ArrowLeft, Loader2, Sparkles, Delete } from "lucide-react";
import Link from "next/link";

interface ParentGuardProps {
  children: React.ReactNode;
}

export const ParentGuard: React.FC<ParentGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== "undefined") {
        const authStatus = sessionStorage.getItem("safekids_parent_auth");
        if (authStatus === "true") {
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, []);

  const handleVerify = async (submittedPin?: string) => {
    const pinToVerify = submittedPin || pin;
    if (!pinToVerify) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/parent/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("safekids_parent_auth", "true");
        }
        setIsAuthenticated(true);
      } else {
        setError(data.message || "Mã PIN không đúng.");
        setPin("");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError("");
      // Tự động submit khi đủ 4 số
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleKeypadDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-950 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-center mb-1 text-white">Khu Vực Phụ Huynh</h2>
          <p className="text-xs text-center text-slate-400 mb-6">
            Nhập mã PIN để mở khóa (Mặc định: <span className="font-mono text-amber-300 font-bold">1234</span>)
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* PIN Dots Indicator */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > index
                      ? "bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/30"
                      : "border-slate-600 bg-slate-800/60"
                  }`}
                />
              ))}
            </div>

            {/* Hidden Input for Keyboard Typing */}
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value;
                setPin(val);
                setError("");
                if (val.length === 4) handleVerify(val);
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-bold py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium animate-bounce">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Number Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold rounded-2xl border border-slate-700 transition"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin("")}
                className="py-3.5 bg-slate-800/40 hover:bg-slate-800 text-xs font-semibold text-slate-400 rounded-2xl transition"
              >
                Xóa hết
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="py-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-lg font-bold rounded-2xl border border-slate-700 transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="py-3.5 bg-slate-800/40 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white rounded-2xl transition"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !pin}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Mở Khóa Bảng Điều Khiển</span>
              )}
            </button>

            <div className="text-center pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang chủ của bé</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ParentGuard;
