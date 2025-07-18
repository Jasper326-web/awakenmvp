import React from "react";

export default function SolidFlame({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="flame-gradient" x1="24" y1="44" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2D2D" />
          <stop offset="60%" stopColor="#FF7F50" />
          <stop offset="100%" stopColor="#FFD600" />
        </linearGradient>
      </defs>
      {/* 外部火焰轮廓 */}
      <path
        d="M24 4C24 4 13 20 18 32C20.5 38 13 42 13 44C13 46 18 46 24 46C30 46 35 46 35 44C35 42 27.5 38 30 32C35 20 24 4 24 4Z"
        fill="none"
        stroke="url(#flame-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* 镂空内部火苗 */}
      <path
        d="M24 13C24 13 18 23 21 31C22.2 34.2 18 37 18 39C18 40 21 40.5 24 40.5C27 40.5 30 40 30 39C30 37 25.8 34.2 27 31C30 23 24 13 24 13Z"
        fill="#fff"
        fillOpacity="0.9"
      />
    </svg>
  );
} 