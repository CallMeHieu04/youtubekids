"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Sparkles, Film, Check, AlertCircle, Loader2 } from "lucide-react";
import { YouTubeMetadata } from "@/lib/youtube";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ["Học tập", "Hoạt hình", "Âm nhạc", "Khoa học", "Khám phá", "Kỹ năng sống", "Chung"];

export const AddVideoModal: React.FC<AddVideoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [urlInput, setUrlInput] = useState("");
  const [category, setCategory] = useState("Học tập");
  const [customTitle, setCustomTitle] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<YouTubeMetadata | null>(null);
  const [error, setError] = useState("");

  // Debounced live fetch metadata qua API oembed
  useEffect(() => {
    if (!urlInput || urlInput.trim().length < 5) {
      setPreview(null);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      setError("");
      try {
        const res = await fetch(`/api/videos/oembed?url=${encodeURIComponent(urlInput.trim())}`);
        const data = await res.json();
        if (res.ok && data.videoId) {
          setPreview(data);
          if (!customTitle) {
            setCustomTitle(data.title);
          }
        } else {
          setPreview(null);
          setError(data.error || "Không thể tìm thấy video YouTube này.");
        }
      } catch {
        setError("Lỗi kết nối khi lấy thông tin video.");
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [urlInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlOrId: urlInput.trim(),
          category,
          customTitle: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUrlInput("");
        setCustomTitle("");
        setPreview(null);
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Không thể thêm video vào danh sách duyệt.");
      }
    } catch {
      setError("Lỗi mạng khi lưu video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Duyệt Video Mới Cho Bé</h2>
            <p className="text-xs text-slate-400">Dán liên kết YouTube để thêm vào danh sách an toàn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Liên kết hoặc ID Video YouTube
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setCustomTitle("");
              }}
              placeholder="https://www.youtube.com/watch?v=... hoặc Video ID"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
          </div>

          {/* Live Preview Box */}
          {isLoadingPreview && (
            <div className="flex items-center justify-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Đang tải thông tin video từ YouTube...</span>
            </div>
          )}

          {preview && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 flex gap-3 items-center">
              <img
                src={preview.thumbnailUrl}
                alt={preview.title}
                className="w-24 h-16 object-cover rounded-xl shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white line-clamp-1">{preview.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{preview.authorName}</p>
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                  <Check className="w-3 h-3" />
                  <span>Hợp lệ (oEmbed verified)</span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Title */}
          {preview && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tên hiển thị cho bé (Tùy chỉnh)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Tên video dễ thương cho bé..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Danh mục phân loại
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    category === cat
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !urlInput.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu vào danh sách...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Duyệt & Thêm Vào Whitelist</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;
