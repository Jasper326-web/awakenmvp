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
        <linearGradient id="flame-gradient" x1="16" y1="30" x2="16" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2D2D" />
          <stop offset="60%" stopColor="#FF7F50" />
          <stop offset="100%" stopColor="#FFD600" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 10 10 13 18C14.5 22 10 25 10 28C10 29.5 12 30 16 30C20 30 22 29.5 22 28C22 25 17.5 22 19 18C22 10 16 2 16 2Z"
        fill="url(#flame-gradient)"
      />
    </svg>
  );
} 