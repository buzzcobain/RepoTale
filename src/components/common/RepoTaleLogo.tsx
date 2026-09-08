import React from 'react';

interface LogoLockupProps {
  className?: string;
  size?: number; // width in pixels
  showTagline?: boolean;
}

export const RepoTaleLogoLockup: React.FC<LogoLockupProps> = ({ 
  className = '', 
  size = 280,
  showTagline = true 
}) => {
  return (
    <svg 
      width={size} 
      height={(size * 640) / 512} 
      viewBox="0 0 512 640" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="rt-lockup-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="rt-lockup-branch" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Background Frame */}
      <rect width="512" height="640" rx="48" fill="#0f172a" />
      <rect width="504" height="632" x="4" y="4" rx="44" stroke="#334155" strokeWidth="2" opacity="0.5" />

      {/* Icon Graphic */}
      <g transform="translate(0, -20)">
        <path d="M 180 370 L 180 165 C 180 140 215 130 256 148 L 256 385 C 215 368 180 370 180 370 Z" fill="url(#rt-lockup-primary)" opacity="0.95" />
        <path d="M 332 370 L 332 165 C 332 140 297 130 256 148 L 256 385 C 297 368 332 370 332 370 Z" fill="url(#rt-lockup-primary)" opacity="0.75" />
        <path d="M 180 350 C 180 260 210 210 295 200" stroke="url(#rt-lockup-branch)" strokeWidth="26" strokeLinecap="round" />
        <line x1="180" y1="160" x2="180" y2="360" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
        <circle cx="180" cy="355" r="22" fill="#0f172a" stroke="#ffffff" strokeWidth="12" />
        <circle cx="180" cy="165" r="22" fill="#0f172a" stroke="#ffffff" strokeWidth="12" />
        <circle cx="310" cy="200" r="26" fill="url(#rt-lockup-branch)" stroke="#0f172a" strokeWidth="8" />
      </g>

      {/* Text Mark */}
      <text x="256" y="490" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="62" letterSpacing="-1.5">
        <tspan fill="#f8fafc" fontWeight="800">Repo</tspan>
        <tspan fill="url(#rt-lockup-primary)" fontWeight="700">Tale</tspan>
      </text>

      {showTagline && (
        <text 
          x="256" 
          y="535" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, monospace" 
          fontSize="16" 
          fontWeight="600" 
          letterSpacing="5" 
          fill="#94a3b8"
        >
          CODEBASE STORIES
        </text>
      )}
    </svg>
  );
};

interface LogoIconProps {
  className?: string;
  size?: number;
}

export const RepoTaleLogoIcon: React.FC<LogoIconProps> = ({
  className = '',
  size = 36
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="rt-icon-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="rt-icon-branch" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Background Frame */}
      <rect width="512" height="512" rx="112" fill="#0f172a" />
      <rect width="504" height="504" x="4" y="4" rx="108" stroke="#334155" strokeWidth="4" opacity="0.5" />

      {/* Icon Graphic centered */}
      <g transform="translate(0, 10)">
        <path d="M 180 370 L 180 165 C 180 140 215 130 256 148 L 256 385 C 215 368 180 370 180 370 Z" fill="url(#rt-icon-primary)" opacity="0.95" />
        <path d="M 332 370 L 332 165 C 332 140 297 130 256 148 L 256 385 C 297 368 332 370 332 370 Z" fill="url(#rt-icon-primary)" opacity="0.75" />
        <path d="M 180 350 C 180 260 210 210 295 200" stroke="url(#rt-icon-branch)" strokeWidth="26" strokeLinecap="round" />
        <line x1="180" y1="160" x2="180" y2="360" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
        <circle cx="180" cy="355" r="22" fill="#0f172a" stroke="#ffffff" strokeWidth="12" />
        <circle cx="180" cy="165" r="22" fill="#0f172a" stroke="#ffffff" strokeWidth="12" />
        <circle cx="310" cy="200" r="26" fill="url(#rt-icon-branch)" stroke="#0f172a" strokeWidth="8" />
      </g>
    </svg>
  );
};
