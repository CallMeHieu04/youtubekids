import React from "react";

interface KidAvatarProps {
  avatarUrl?: string | null;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const KidAvatar: React.FC<KidAvatarProps> = ({
  avatarUrl,
  name,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-20 h-20 text-4xl",
  };

  const isImage = avatarUrl && (avatarUrl.startsWith("/") || avatarUrl.startsWith("http"));

  if (isImage) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden shadow-md shrink-0 bg-slate-800 border-2 border-white/20 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center shadow-md shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {avatarUrl || "👶"}
    </div>
  );
};

export default KidAvatar;
