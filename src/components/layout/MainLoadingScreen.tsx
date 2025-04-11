import React from 'react';

interface Props {
  progress: number;
}

const MainLoadingScreen: React.FC<Props> = ({ progress }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative">
        <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="1" opacity="0.3" />

          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progress) / 100}
            className="transform -rotate-90 origin-center transition-all duration-500 ease-in-out"
            filter="url(#glow)"
          />

          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-2xl font-bold fill-foreground animate-bounce-small"
          >
            {Math.round(progress)}%
          </text>
        </svg>
      </div>

      <div className="mt-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground animate-pulse">Revving Up Your Experience</h2>
        <p className="text-lg text-muted-foreground">Fasten your seatbelt, we're almost there!</p>
      </div>
    </div>
  </div>
);

export default MainLoadingScreen;
