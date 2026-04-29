'use client';

export type ChatbotPose = 'idle' | 'talking' | 'thinking' | 'cheering' | 'jumping';
export type ChatbotSize = 'sm' | 'md' | 'lg';

type Props = { pose?: ChatbotPose; size?: ChatbotSize };

const SIZE_PX: Record<ChatbotSize, number> = { sm: 72, md: 112, lg: 192 };

export function Chatbot({ pose = 'idle', size = 'md' }: Props) {
  const px = SIZE_PX[size];
  return (
    <div
      data-component="chatbot"
      data-pose={pose}
      className="relative"
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 140 140"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="block w-full h-full overflow-visible"
      >
        <defs>
          <radialGradient id="cb-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0%"   stopColor="#bae6fd" stopOpacity="0.7" />
            <stop offset="60%"  stopColor="#bae6fd" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cb-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="55%"  stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <radialGradient id="cb-highlight" cx="35%" cy="30%" r="40%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft glow halo */}
        <circle cx="70" cy="78" r="62" fill="url(#cb-glow)" />

        {/* Whole body group (animated) */}
        <g className="cb-body">
          {/* Lower body (small base, mostly behind head) */}
          <ellipse
            cx="70" cy="108"
            rx="22" ry="14"
            fill="url(#cb-shell)"
            stroke="#7dd3fc" strokeWidth="1.6"
          />
          {/* Body stripe */}
          <line
            x1="52" y1="108" x2="88" y2="108"
            stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
          />

          {/* Left arm */}
          <g className="cb-arm-left">
            <ellipse
              cx="46" cy="100"
              rx="8.5" ry="7"
              fill="url(#cb-shell)"
              stroke="#7dd3fc" strokeWidth="1.5"
            />
          </g>
          {/* Right arm */}
          <g className="cb-arm-right">
            <ellipse
              cx="94" cy="100"
              rx="8.5" ry="7"
              fill="url(#cb-shell)"
              stroke="#7dd3fc" strokeWidth="1.5"
            />
          </g>

          {/* Head — dominant sphere */}
          <circle
            cx="70" cy="62"
            r="38"
            fill="url(#cb-shell)"
            stroke="#7dd3fc" strokeWidth="1.8"
          />

          {/* Glossy highlight on head */}
          <ellipse
            cx="58" cy="48"
            rx="14" ry="9"
            fill="url(#cb-highlight)"
          />

          {/* Eyes — closed smile arcs */}
          <g className="cb-eyes">
            <path
              d="M 56 66 Q 60 60 64 66"
              stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none"
            />
            <path
              d="M 76 66 Q 80 60 84 66"
              stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none"
            />
          </g>

          {/* Tiny rosy cheeks */}
          <circle cx="50" cy="73" r="2.4" fill="#fda4af" opacity="0.55" />
          <circle cx="90" cy="73" r="2.4" fill="#fda4af" opacity="0.55" />

          {/* Antenna */}
          <line x1="70" y1="22" x2="70" y2="26" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="70" cy="20" r="2.6" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
}
