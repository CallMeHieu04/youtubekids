"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Film,
  Sparkles,
  Play,
  Tag,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import AddVideoModal from "@/components/parent/AddVideoModal";
import ImportChannelModal from "@/components/parent/ImportChannelModal";
import { Layers } from "lucide-react";
import { ApprovedVideoData } from "@/types";

export default function ParentVideosPage() {
  const [videos, setVideos] = useState<ApprovedVideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos || []);
      }
    } catch {
      setMessage({ type: "error", text: "Không thể tải danh sách video." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa video "${title}" khỏi danh sách duyệt của bé?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setMessage({ type: "success", text: "Đã xóa video thành công." });
      } else {
        setMessage({ type: "error", text: "Không thể xóa video." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi mạng khi xóa video." });
    } finally {
      setDeletingId(null);
    }
  };

  const categories = ["All", ...Array.from(new Set(videos.map((v) => v.category)))];

  const filteredVideos = videos.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.authorName && v.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === "All" || v.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Film className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Video Whitelist ({videos.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bé chỉ có thể xem các video được phụ huynh cho phép tại danh sách này.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-amber-300 font-bold px-4 py-3 rounded-2xl text-xs transition shrink-0"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>⚡ Nhập Cả Kênh / Playlist</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Video Mới</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
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

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm video theo tiêu đề hoặc tên kênh..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat === "All" ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Đang tải danh sách video an toàn...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Không tìm thấy video nào</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Hãy thêm video đầu tiên vào danh sách cho bé!"}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Video Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-slate-700 transition"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {video.category}
                </span>

                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Mở trên YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Body Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">{video.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{video.authorName || "YouTube Safe"}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                  <span className="font-mono text-[10px] text-slate-500">{video.youtubeVideoId}</span>

                  <button
                    onClick={() => handleDelete(video.id, video.title)}
                    disabled={deletingId === video.id}
                    className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg text-xs transition"
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchVideos();
          setMessage({ type: "success", text: "Đã thêm video mới vào Whitelist thành công!" });
        }}
      />

      {/* Import Channel / Playlist Modal */}
      <ImportChannelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(newVideos) => {
          fetchVideos();
          setMessage({
            type: "success",
            text: `Đã nhập thêm ${newVideos.length} video mới vào danh sách thành công!`,
          });
        }}
      />
    </div>
  );
}
