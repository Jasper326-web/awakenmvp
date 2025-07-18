import React from "react";

export default function SolidFlame({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#FF2D2D" />
          <stop offset="50%" stopColor="#FF7F50" />
          <stop offset="100%" stopColor="#FFD600" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14C12 18 16 22 16 28C16 22 20 18 20 14C20 8 16 2 16 2Z"
        fill="url(#flame-gradient)"
      />
    </svg>
  );
} 