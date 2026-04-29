'use client';
type Pose = 'idle' | 'talking' | 'thinking' | 'cheering' | 'jumping';
type Props = { pose?: Pose; size?: 'sm' | 'md' | 'lg' };

export function Chatbot({ pose = 'idle', size = 'md' }: Props) {
  const sz = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-40 h-40' : 'w-24 h-24';
  const bounce = pose === 'jumping' || pose === 'cheering' ? 'animate-bounce' : '';
  const pulse = pose === 'thinking' ? 'animate-pulse' : '';
  return (
    <div
      data-component="chatbot"
      data-pose={pose}
      className={`${sz} ${bounce} ${pulse} bg-yellow-300 rounded-full flex items-center justify-center font-bold text-sm`}
    >
      BOT
    </div>
  );
}
