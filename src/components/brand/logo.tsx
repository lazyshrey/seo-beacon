import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function SeoBeaconLogo({ className = "", size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffafcc" />
          <stop offset="50%" stopColor="#cdb4db" />
          <stop offset="100%" stopColor="#a2d2ff" />
        </linearGradient>
      </defs>
      
      {/* Outer auditing orbit ring (represents search crawlers scanning pages) */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="url(#logo-grad)"
        strokeWidth="1.5"
        strokeDasharray="3.5 2.5"
        opacity="0.6"
      />
      
      {/* Sleek, geometric four-pointed Beacon Star */}
      <path
        d="M12 3L14.2 9.8L21 12L14.2 14.2L12 21L9.8 14.2L3 12L9.8 9.8L12 3Z"
        fill="url(#logo-grad)"
      />
      
      {/* Bright center light core */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#ffffff"
        className="animate-pulse"
      />
    </svg>
  );
}
