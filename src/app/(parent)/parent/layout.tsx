import React from "react";
import ParentNavbar from "@/components/parent/ParentNavbar";
import ParentGuard from "@/components/parent/ParentGuard";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ParentGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <ParentNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </ParentGuard>
  );
}
