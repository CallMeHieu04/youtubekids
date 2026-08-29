"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Video, Settings, Eye, LogOut } from "lucide-react";

export const ParentNavbar: React.FC = () => {
  const pathname = usePathname();

  const handleLogout = () => {
    sessionStorage.removeItem("safekids_parent_auth");
    window.location.href = "/";
  };

  const navItems = [
    { label: "Bảng Điều Khiển", href: "/parent/dashboard", icon: LayoutDashboard },
    { label: "Quản Lý Video", href: "/parent/videos", icon: Video },
    { label: "Cài Đặt & Giới Hạn", href: "/parent/settings", icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/parent/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">SafeKids</span>{" "}
              <span className="text-xs bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full ml-1">
                Parent Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Xem giao diện của bé"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Xem Trang Bé</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            title="Đăng xuất / Khóa"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-900/95 px-2 py-1 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-bold ${
                isActive ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default ParentNavbar;
