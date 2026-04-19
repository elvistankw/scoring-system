// Small Diabolo Spinner for inline use
// Compact version of DiaboloLoading for buttons and small spaces

export function DiaboloSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-spin"
        style={{ animationDuration: '1.5s' }}
      >
        {/* Diabolo shape */}
        <g>
          {/* Top cone */}
          <path
            d="M 50 20 L 35 40 L 65 40 Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* Bottom cone */}
          <path
            d="M 50 80 L 35 60 L 65 60 Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* Center axle */}
          <rect
            x="48"
            y="40"
            width="4"
            height="20"
            fill="currentColor"
            opacity="0.6"
          />
          {/* Rotation rings */}
          <circle
            cx="50"
            cy="30"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle
            cx="50"
            cy="70"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
}
