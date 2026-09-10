import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "horizontal" | "stacked";
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export function LogoIcon({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105", className)}
    >
      <defs>
        {/* Background Gradient: Rich Emerald Forest */}
        <linearGradient id="desa-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="45%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Highlight border for subtle glassmorphism */}
        <linearGradient id="desa-mark-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>

        {/* Leaf Gradient: Mint to Emerald */}
        <linearGradient id="desa-leaf-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {/* Soft Ambient Glow */}
        <radialGradient id="desa-mark-glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base Squircle with Glass Border */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="url(#desa-mark-bg)"
        stroke="url(#desa-mark-border)"
        strokeWidth="1.5"
      />

      {/* Subtle Internal Glow Overlay */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#desa-mark-glow)" />

      {/* Beacon / Smart Signal Point */}
      <circle cx="32" cy="9.5" r="2.2" fill="#a7f3d0" />
      <circle cx="32" cy="9.5" r="4.5" stroke="#a7f3d0" strokeOpacity="0.35" strokeWidth="1" />

      {/* Modern Village Roof / Joglo Canopy (Community & Shelter) */}
      <path
        d="M 32 14.5 L 49 26.5 L 45.5 30 L 32 20.5 L 18.5 30 L 15 26.5 Z"
        fill="#ffffff"
      />

      {/* Digital Nodes & Connection Lines */}
      {/* Left Node & Circuit */}
      <line x1="20" y1="39" x2="26" y2="39" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="39" r="3" fill="#6ee7b7" />
      <circle cx="20" cy="39" r="1.2" fill="#064e3b" />

      {/* Right Node & Circuit */}
      <line x1="44" y1="39" x2="38" y2="39" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="44" cy="39" r="3" fill="#6ee7b7" />
      <circle cx="44" cy="39" r="1.2" fill="#064e3b" />

      {/* Sprout / Leaf (Growth, Agriculture, Village Prosperity) */}
      <path
        d="M 32 23.5 C 39.5 29.5 41 38.5 32 47 C 23 38.5 24.5 29.5 32 23.5 Z"
        fill="url(#desa-leaf-grad)"
      />

      {/* Core Pulse Center */}
      <circle cx="32" cy="34" r="2.2" fill="#ffffff" />
      <line x1="32" y1="36.5" x2="32" y2="44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  variant = "horizontal",
  theme = "light",
  size = "md",
  className,
  showSubtitle = true,
}: LogoProps) {
  const iconSizeMap = {
    sm: 32,
    md: 40,
    lg: 52,
    xl: 64,
  };

  const titleSizeMap = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const isDark = theme === "dark";

  if (variant === "icon") {
    return <LogoIcon size={iconSizeMap[size]} className={className} />;
  }

  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center text-center space-y-3", className)}>
        <LogoIcon size={iconSizeMap[size]} className="shadow-lg rounded-2xl" />
        <div className="space-y-1">
          <h1
            className={cn(
              "font-bold tracking-tight leading-tight",
              titleSizeMap[size],
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Desa <span className="text-[#15803d]">Digital</span>
          </h1>
          {showSubtitle && (
            <p
              className={cn(
                "text-xs font-medium tracking-wide uppercase",
                isDark ? "text-emerald-300/80" : "text-gray-500"
              )}
            >
              Sistem Informasi Manajemen Desa
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variant horizontal (default)
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon size={iconSizeMap[size]} className="shadow-sm rounded-xl" />
      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold leading-tight tracking-tight",
            titleSizeMap[size],
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Desa <span className={isDark ? "text-emerald-300" : "text-[#15803d]"}>Digital</span>
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wider uppercase",
              isDark ? "text-emerald-200/70" : "text-gray-400"
            )}
          >
            Smart Village OS
          </span>
        )}
      </div>
    </div>
  );
}
