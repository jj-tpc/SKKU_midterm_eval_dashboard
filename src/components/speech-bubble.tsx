'use client';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Which side the tail points to (where the chatbot is). */
  tail?: 'left' | 'right' | 'bottom';
  className?: string;
};

export function SpeechBubble({ children, tail = 'bottom', className = '' }: Props) {
  return (
    <div
      data-component="speech-bubble"
      data-tail={tail}
      className={`relative max-w-xl rounded-2xl border border-sky-200 bg-white px-5 py-4 text-base text-slate-800 shadow-[0_4px_18px_-6px_rgba(56,189,248,0.45)] ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={
          tail === 'bottom'
            ? 'absolute -bottom-2 left-10 h-4 w-4 rotate-45 border-b border-r border-sky-200 bg-white'
            : tail === 'left'
              ? 'absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 border-b border-l border-sky-200 bg-white'
              : 'absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 border-t border-r border-sky-200 bg-white'
        }
      />
    </div>
  );
}
