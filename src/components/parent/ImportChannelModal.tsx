"use client";

import React, { useState } from "react";
import {
  X,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  ListPlus,
} from "lucide-react";
import { ApprovedVideoData } from "@/types";

interface ImportChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVideos: ApprovedVideoData[]) => void;
}

export const ImportChannelModal: React.FC<ImportChannelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"channel" | "batch">("channel");
  const [channelInput, setChannelInput] = useState("");
  const [batchUrlsInput, setBatchUrlsInput] = useState("");
  const [category, setCategory] = useState("Hoạt hình");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = activeTab === "channel" ? channelInput : batchUrlsInput;
    if (!query.trim()) {
      setStatusMessage({
        type: "error",
        text:
          activeTab === "channel"
            ? "Vui lòng nhập tên kênh hoặc link kênh / playlist."
            : "Vui lòng dán danh sách link video.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/videos/import-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `🎉 ${data.message}`,
        });
        if (data.videos && data.videos.length > 0) {
          onSuccess(data.videos);
        }
        setTimeout(() => {
          onClose();
          setChannelInput("");
          setBatchUrlsInput("");
          setStatusMessage(null);
        }, 2000);
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Không thể quét video từ kênh này.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Lỗi kết nối máy chủ khi quét video.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 rounded-2xl shadow-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Nhập Video Theo Kênh / Playlist</h2>
              <p className="text-xs text-slate-400">Tự động quét và thêm nhiều video cùng lúc cho 2 bé</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-800 p-1 rounded-2xl mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveTab("channel");
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "channel"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Kênh hoặc Playlist YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("batch");
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "batch"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Dán Nhiều Link Cùng Lúc</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleImport} className="space-y-5">
          {activeTab === "channel" ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tên Kênh, @Handle hoặc Link Playlist YouTube
              </label>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="VD: @CoComelon hoặc https://www.youtube.com/@PeppaPig hoặc link Playlist"
                className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                {["@CoComelon", "@PeppaPig", "@Pinkfong", "@LittleBabyBum"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChannelInput(s)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Dán danh sách các link video (mỗi dòng một link hoặc cách nhau bằng dấu cách)
              </label>
              <textarea
                rows={5}
                value={batchUrlsInput}
                onChange={(e) => setBatchUrlsInput(e.target.value)}
                placeholder={`https://www.youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://www.youtube.com/watch?v=...`}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
            </div>
          )}

          {/* Chọn Danh Mục */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Gán Danh Mục Mặc Định Cho Các Video
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Hoạt hình", "Âm nhạc", "Học tập", "Kỹ năng"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                    category === cat
                      ? "bg-amber-400 border-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang quét & nạp video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt Đầu Quét & Nhập Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportChannelModal;
