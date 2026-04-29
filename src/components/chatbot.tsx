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
        viewBox="0 0 120 130"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="block w-full h-full"
      >
        <defs>
          <radialGradient id="cb-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%"  stopColor="#bae6fd" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cb-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="60%"  stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <linearGradient id="cb-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <radialGradient id="cb-highlight" cx="35%" cy="30%" r="35%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft glow halo */}
        <circle cx="60" cy="65" r="60" fill="url(#cb-glow)" />

        {/* Whole-body group (animated) */}
        <g className="cb-body">
          {/* Left arm */}
          <g className="cb-arm-left">
            <ellipse
              cx="22" cy="80" rx="9" ry="7"
              fill="url(#cb-shell)"
              stroke="#7dd3fc" strokeWidth="1.4"
            />
          </g>
          {/* Right arm */}
          <g className="cb-arm-right">
            <ellipse
              cx="98" cy="80" rx="9" ry="7"
              fill="url(#cb-shell)"
              stroke="#7dd3fc" strokeWidth="1.4"
            />
          </g>

          {/* Lower body */}
          <ellipse
            cx="60" cy="88" rx="24" ry="17"
            fill="url(#cb-shell)"
            stroke="#7dd3fc" strokeWidth="1.5"
          />
          {/* Body stripe */}
          <rect x="40" y="84" width="40" height="3.2" rx="1.6" fill="url(#cb-band)" />

          {/* Head */}
          <circle
            cx="60" cy="50" r="30"
            fill="url(#cb-shell)"
            stroke="#7dd3fc" strokeWidth="1.5"
          />
          {/* Head accent ring (visor-like) */}
          <ellipse cx="60" cy="38" rx="24" ry="2.6" fill="url(#cb-band)" opacity="0.85" />

          {/* Glossy highlight on head */}
          <circle cx="50" cy="42" r="14" fill="url(#cb-highlight)" />

          {/* Eyes — closed smile arcs */}
          <g className="cb-eyes">
            <path
              d="M 48 53 Q 52 47 56 53"
              stroke="#0f172a"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 64 53 Q 68 47 72 53"
              stroke="#0f172a"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Tiny antenna dot */}
          <circle cx="60" cy="20" r="2.2" fill="#38bdf8" />
          <line x1="60" y1="22" x2="60" y2="26" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
