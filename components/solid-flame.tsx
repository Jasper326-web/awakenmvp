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
        <radialGradient id="flame-gradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="60%" stopColor="#FF7F50" />
          <stop offset="100%" stopColor="#FF2D2D" />
        </radialGradient>
      </defs>
      <path
        d="M16 3C16 3 13 8 13 12C13 15 16 17 16 20C16 17 19 15 19 12C19 8 16 3 16 3Z
           M16 29C10 29 6 24.5 6 19.5C6 15.5 10 13 13 10.5C14.5 9.2 15.5 7.5 16 6.5C16.5 7.5 17.5 9.2 19 10.5C22 13 26 15.5 26 19.5C26 24.5 22 29 16 29Z"
        fill="url(#flame-gradient)"
      />
    </svg>
  );
} 